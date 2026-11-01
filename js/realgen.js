/* =========================================================================
   OMNI-SHIFT v14.2 — REAL MAP · GENERATOR (js/realgen.js)
   Turns the OpenStreetMap features of js/realdata.js into the same blocks,
   buildings, props and spawns the rest of the game already understands:
   • every real building at its real spot with its real footprint (one floor),
     named after what is really inside ("Riley Hospital for Children"), with an
     interior fitted to the footprint: rectangles use the classic room
     programs (houses, shops, diners, police stations…) turned to face the
     street; odd shapes get a room plan cut to the outline; buildings at an
     angle are planned square to their own walls and drawn rotated
     (collision follows them cell by cell)
   • real roads (widths by class, bridges over water, parking lots from their
     aisles), water you cannot walk on, parks, woods, fields
   • Highway 365 — Under Construction: the border highway round the 48 km
     square (lane closures, cones and drums, arrow boards, crews, a traffic
     cop or two). You can drive it and turn round on it; you cannot leave.
   ========================================================================= */
"use strict";

RG_PROFILES.real = { name: "Real Map", style: "real", icon: "🗺️", group: "Real Life", theme: "modern", roster: "lapd",
  sub: "A real place from OpenStreetMap, 48 km across with the city in the middle — every street, building and business where it really is.",
  cl: ["Farmland", "Countryside", "Suburbs", "City", "Downtown", "Industrial", "Woods", "Waterfront"] };
const RMG = { hwy: null, zones: [], cellCls: new Map(), names: new Map() };
const RM_HWY_IN = 4, RM_HWY_W = 26, RM_HWY_BAND = 46;    // pavement starts 4 m inside the border, 26 m wide; real buildings keep 46 m clear
const RM_HWY_R = 420;                                   // corner radius (m)

/* --- 1. HIGHWAY 365: a rounded square just inside the border ------------------------- */
function rmHwyBuild() {
  const lo = RM_LO + RM_HWY_IN + RM_HWY_W / 2, hi = RM_HI - RM_HWY_IN - RM_HWY_W / 2, R = RM_HWY_R, pts = [];
  const arc = (cx, cy, a0) => { for (let k = 0; k <= 12; k++) { const a = a0 + k / 12 * Math.PI / 2; pts.push([cx + Math.cos(a) * R, cy + Math.sin(a) * R]); } };
  // clockwise from the top-left corner (screen coordinates, y down)
  arc(lo + R, lo + R, Math.PI); arc(hi - R, lo + R, -Math.PI / 2); arc(hi - R, hi - R, 0); arc(lo + R, hi - R, Math.PI / 2); pts.push(pts[0].slice());
  // arc length table
  const s = [0]; for (let i = 1; i < pts.length; i++) s.push(s[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const H = { pts, s, L: s[s.length - 1], w: RM_HWY_W, name: "Highway 365", kind: "hwy365", cls: "hwy365" };
  // work zones: the same every visit (fixed seed) — closures alternate sides, crossovers between them
  const r = cRng(365365), zones = [];
  let p = 900;
  while (p < H.L - 1200) {
    const len = cRange(r, 380, 900);
    zones.push({ s0: p, s1: p + len, side: zones.length % 2 ? 1 : -1, crew: r() < 0.7, cop: r() < 0.55, plates: r() < 0.4, lanes: r() < 0.3 ? 2 : 1 });
    p += len + cRange(r, 1300, 2900);
  }
  H.cross = []; for (let k = 0; k < zones.length; k++) { const a = zones[k].s1 + 420; if (a < H.L - 300) H.cross.push(a); }
  RMG.hwy = H; RMG.zones = zones;
  return H;
}
// point + unit tangent at arc length t
function rmHwyAt(t) {
  const H = RMG.hwy; t = ((t % H.L) + H.L) % H.L;
  let lo = 0, hi = H.s.length - 1;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (H.s[m] <= t) lo = m; else hi = m; }
  const a = H.pts[lo], b = H.pts[hi], L = (H.s[hi] - H.s[lo]) || 1, u = (t - H.s[lo]) / L;
  const tx = (b[0] - a[0]) / L, ty = (b[1] - a[1]) / L;
  return { x: a[0] + (b[0] - a[0]) * u, y: a[1] + (b[1] - a[1]) * u, tx, ty, nx: -ty, ny: tx };   // n points inward (to the right of travel, clockwise ring)
}
// arc length nearest to a point (coarse + refine), and the signed offset (+ inward)
function rmHwyProject(xm, ym) {
  const H = RMG.hwy; let best = 0, bd = 1e12;
  for (let i = 0; i < H.pts.length - 1; i++) {
    const [ax, ay] = H.pts[i], [bx, by] = H.pts[i + 1], dx = bx - ax, dy = by - ay, L2 = dx * dx + dy * dy || 1;
    const u = Math.max(0, Math.min(1, ((xm - ax) * dx + (ym - ay) * dy) / L2)), px = ax + dx * u, py = ay + dy * u, d = (xm - px) ** 2 + (ym - py) ** 2;
    if (d < bd) { bd = d; best = H.s[i] + Math.sqrt(L2) * u; }
  }
  const P = rmHwyAt(best);
  return { t: best, off: (xm - P.x) * P.nx + (ym - P.y) * P.ny, d: Math.sqrt(bd) };
}
function rmZoneAt(t) { for (const z of RMG.zones) if (t >= z.s0 - 260 && t <= z.s1 + 60) return z; return null; }
// distance from the square's border (positive inside)
function rmEdgeDist(xm, ym) { return Math.min(xm - RM_LO, RM_HI - xm, ym - RM_LO, RM_HI - ym); }
function rmInsideRing(xm, ym) { return rmHwyOff(xm, ym) > -(RM_HWY_W / 2 + 1.6); }   // inside the outer barrier
// EOF part 1 (realgen.js continues)

/* --- 2. INIT: places, the class map, the highway ------------------------------------- */
const RM_PLACE_R = { city: 5200, town: 2200, village: 900, suburb: 1300, quarter: 900, neighbourhood: 650, hamlet: 450, isolated_dwelling: 200 };
function rmInit(seed) {
  const t0 = performance.now();
  CITY.seed = seed >>> 0;
  CITY.blockCache = new Map(); CITY.lineCache = new Map(); CITY.cellCache = new Map(); CITY.interiorCount = 0;
  RG.roads = []; RG.segIdx = new Map(); RG.sites = []; RG.siteCell = new Map(); RG.rings = []; RG.airports = []; RG.airCell = new Map(); RG.towns = [];
  CITY.hwX = []; CITY.hwY = []; CITY.hwNameX = []; CITY.hwNameY = []; CITY.civic = new Map();
  RMG.cellCls = new Map(); RMG.names = new Map();
  rmHwyBuild();
  // places: overview cities / towns / villages + the chosen centre
  const O = RM.ovw || { places: [], land: [], water: [] }, cities = [];
  const add = (p, kind) => { if (!rmInsideRing(p.x, p.y)) return; if (cities.some(c => c.name === p.name && (c.idx === 0 || Math.hypot(c.x - p.x, c.y - p.y) < 3000))) return; cities.push({ x: p.x, y: p.y, r: p.r || (p.cls === "city" ? ((p.rank || 9) <= 4 ? 9000 : 6000) : RM_PLACE_R[p.cls] || 1500), kind, name: p.name, cls: p.cls }); };
  const ctr = { x: 32000, y: 32000, cls: "city", name: (RM.place && RM.place.name) || "City", r: 12000 };
  add(ctr, 0); cities[0].idx = 0;
  for (const p of O.places.filter(p => p.cls === "city").sort((a, b) => a.rank - b.rank)) add(p, 0);
  for (const p of O.places.filter(p => p.cls === "town")) add(p, 1);
  for (const p of O.places.filter(p => p.cls === "village")) add(p, 2);
  cities.forEach((c, i) => { c.idx = i; c.h = cH(seed, 77, i, 9); });
  CITY.cities = cities; CITY.capital = 0; RG.towns = cities;
  // class map: overview land use at 5×5 samples per km cell, water share, distance to the centre
  const N = CITY.MACROS, macro = new Uint8Array(N * N), mcity = new Int16Array(N * N).fill(-1), mdist = new Float32Array(N * N);
  const lu = O.land || [], wt = O.water || [];
  for (let my = 0; my < N; my++) for (let mx = 0; mx < N; mx++) {
    const i = my * N + mx, cxm = mx * 1000 + 500, cym = my * 1000 + 500;
    if (!rmInsideRing(cxm, cym) && rmEdgeDist(cxm, cym) < -400) { macro[i] = CL_FARM; continue; }
    const votes = [0, 0, 0, 0, 0, 0, 0, 0]; let water = 0;
    for (let sy = 0; sy < 5; sy++) for (let sx = 0; sx < 5; sx++) {
      const px = mx * 1000 + 100 + sx * 200, py = my * 1000 + 100 + sy * 200;
      let wet = false;
      for (const w of wt) if (px >= w.bb[0] && px <= w.bb[2] && py >= w.bb[1] && py <= w.bb[3] && rmPipPoly(px, py, w.pg)) { wet = true; break; }
      if (wet) { water++; continue; }
      let k = -1;
      for (const L of lu) { if (px < L.bb[0] || px > L.bb[2] || py < L.bb[1] || py > L.bb[3] || !rmPipPoly(px, py, L.pg)) continue; const c = rmLandClass(L); if (c >= 0) { k = c; if (c !== CL_FOREST && c !== CL_FARM) break; } }
      votes[k < 0 ? CL_RURAL : k]++;
    }
    let cls = CL_RURAL, bv = -1;
    for (let k = 0; k < 8; k++) if (votes[k] > bv) { bv = votes[k]; cls = k; }
    if (water >= 13) cls = CL_LAKE;
    // nearest place
    let ci = -1, bt = 9;
    for (const c of cities) { const t = Math.hypot(c.x - cxm, c.y - cym) / c.r; if (t < bt && t < 1.3) { bt = t; ci = c.idx; } }
    if (Math.hypot(cxm - 32000, cym - 32000) < 1700 && cls !== CL_LAKE) cls = CL_DOWNTOWN;
    macro[i] = cls; mcity[i] = ci; mdist[i] = bt;
  }
  CITY.macro = macro; CITY.macroCity = mcity; CITY.macroT = mdist;
  CITY.ready = true; RMG.ovwBuilt = !!RM.ovw;
  RG.initMs = performance.now() - t0;
  return CITY;
}
function rmLandClass(L) {
  const c = L.cls;
  if (L.src === "lu") return c === "residential" ? CL_SUBURB : (c === "commercial" || c === "retail") ? CL_URBAN : (c === "industrial" || c === "railway" || c === "quarry" || c === "garages") ? CL_INDUSTRIAL : (c === "school" || c === "university" || c === "college" || c === "hospital" || c === "stadium") ? CL_URBAN : -1;
  if (L.src === "lc") return c === "wood" ? CL_FOREST : c === "farmland" ? CL_FARM : (c === "grass" && (L.sub === "park" || L.sub === "golf_course")) ? CL_RURAL : c === "wetland" ? CL_FOREST : -1;
  return -1;
}
// refine a km cell's class from its real buildings (called once its data is in)
function rmRefineClass(mx, my, C, blds) {
  const N = CITY.MACROS, i = my * N + mx;
  if (mx < 0 || my < 0 || mx >= N || my >= N || RMG.cellCls.has(i)) return;
  let cover = 0, tall = 0, big = 0;
  for (const b of blds) { cover += b.area; if (b.h >= 24) tall += b.area; if (b.area > 4000) big += b.area; }
  const c0 = CITY.macro[i];
  let cls = c0;
  const share = cover / 1e6;
  if (c0 === CL_LAKE && share < 0.04) cls = CL_LAKE;
  else if (share > 0.2 && tall > cover * 0.25) cls = CL_DOWNTOWN;
  else if (big > cover * 0.55 && share > 0.08) cls = CL_INDUSTRIAL;
  else if (share > 0.16) cls = c0 === CL_INDUSTRIAL ? CL_INDUSTRIAL : CL_URBAN;
  else if (share > 0.05) cls = c0 === CL_INDUSTRIAL ? CL_INDUSTRIAL : c0 === CL_DOWNTOWN ? CL_URBAN : CL_SUBURB;
  else if (share > 0.012) cls = c0 === CL_FOREST ? CL_FOREST : CL_RURAL;
  else cls = c0 === CL_FOREST || c0 === CL_FARM || c0 === CL_LAKE ? c0 : CL_FARM;
  CITY.macro[i] = cls; RMG.cellCls.set(i, cls);
}
// EOF part 2 (realgen.js continues)

/* --- 3. ROADS of a km cell ------------------------------------------------------------- */
const RM_RW = { motorway: 22, trunk: 18, primary: 14, secondary: 12, tertiary: 10, minor: 7.5, service: 4.6, track: 3.4, path: 2.2, raceway: 11, busway: 7, rail: 3.2, transit: 3.2, hwy365: RM_HWY_W };
const RM_DUAL = { motorway: 11.5, trunk: 9.5, primary: 8.5, secondary: 7.5 };
const RM_RANK = { hwy365: 9, motorway: 8, trunk: 7, primary: 6, secondary: 5, tertiary: 4, busway: 3, minor: 3, raceway: 3, service: 2, track: 1, path: 0, rail: -1, transit: -1 };
function rmRoadWidth(R) {
  let c = R.cls.replace("_construction", "");
  if (c === "path") return R.sub === "pedestrian" ? 6 : R.sub === "cycleway" ? 2.6 : R.sub === "platform" ? 3 : R.sub === "steps" ? 2.2 : 2;
  if (c === "service") return R.svc === "parking_aisle" ? 6.2 : R.svc === "driveway" ? 3.4 : R.svc === "alley" ? 4.4 : R.svc === "drive-through" ? 3.4 : 5;
  if (R.ramp) return 6;
  if (R.ow && RM_DUAL[c]) return RM_DUAL[c];
  return RM_RW[c] || 6;
}
function rmCellRoads(mx, my, C) {
  const segs = [], x0 = mx * 1000 - 30, y0 = my * 1000 - 30, x1 = x0 + 1060, y1 = y0 + 1060;
  // names: the closest named line of the same family within a few metres of the road's midpoint
  const fam = c => (c || "").replace("_construction", "").replace(/^(motorway|trunk|primary|secondary|tertiary)$/, "major");
  const nameOf = (R) => {
    const a = R.pts, n = a.length >> 1, k = (n >> 1) << 1, mxp = a[k], myp = a[k + 1];
    let best = null, bd = 7;
    for (const N of C.names) {
      if (mxp < N.bb[0] - bd || mxp > N.bb[2] + bd || myp < N.bb[1] - bd || myp > N.bb[3] + bd) continue;
      if (fam(N.cls) !== fam(R.cls) && !(R.cls === "path" && N.cls === "path")) continue;
      const p = N.pts;
      for (let i = 0; i + 3 < p.length; i += 2) { const d = rmSegD(mxp, myp, p[i], p[i + 1], p[i + 2], p[i + 3]); if (d < bd) { bd = d; best = N; } }
    }
    return best;
  };
  for (const R of C.roads) {
    if (R.cls === "ferry" || R.cls === "pier" || R.cls === "aerialway") continue;
    if (!R.rm) {   // decorate once (roads are shared by neighbouring cells)
      const N = nameOf(R);
      R.rm = { kind: R.cls.replace("_construction", ""), cls: R.cls, w: rmRoadWidth(R), name: N ? N.name : "", ref: N ? N.ref : "", br: R.br, svc: R.svc, sub: R.sub, ow: R.ow, lay: R.lay, constr: R.cls.indexOf("_construction") > 0 ? 1 : 0, rank: RM_RANK[R.cls.replace("_construction", "")] || 0 };
    }
    const r = R.rm, a = R.pts;
    for (let i = 0; i + 3 < a.length; i += 2) {
      const ax = a[i], ay = a[i + 1], bx = a[i + 2], by = a[i + 3];
      if (Math.max(ax, bx) < x0 || Math.min(ax, bx) > x1 || Math.max(ay, by) < y0 || Math.min(ay, by) > y1) continue;
      // stop at the border highway (real roads end on its shoulder)
      const da = rmEdgeDist(ax, ay), db = rmEdgeDist(bx, by), lim = RM_HWY_IN + RM_HWY_W - 0.5;   // real roads meet Highway 365 at its inner shoulder
      if (da < lim && db < lim) continue;
      let s = { ax, ay, bx, by, w: r.w, r };
      if (da < lim || db < lim) { const t = (lim - Math.min(da, db)) / (Math.abs(da - db) || 1); if (da < lim) { s.ax = ax + (bx - ax) * t; s.ay = ay + (by - ay) * t; } else { s.bx = bx + (ax - bx) * t; s.by = by + (ay - by) * t; } }
      segs.push(s);
    }
  }
  // Highway 365 through the edge cells
  const H = RMG.hwy;
  if (H && (mx * 1000 < RM_LO + 1200 || my * 1000 < RM_LO + 1200 || (mx + 1) * 1000 > RM_HI - 1200 || (my + 1) * 1000 > RM_HI - 1200)) {
    const r = { kind: "hwy365", cls: "hwy365", w: RM_HWY_W, name: "Highway 365", ref: "365", br: "", rank: 9, hwy: 1 };
    for (let i = 0; i < H.pts.length - 1; i++) {
      const [ax, ay] = H.pts[i], [bx, by] = H.pts[i + 1];
      if (Math.max(ax, bx) < x0 - 40 || Math.min(ax, bx) > x1 + 40 || Math.max(ay, by) < y0 - 40 || Math.min(ay, by) > y1 + 40) continue;
      // long straight runs: split into 40 m pieces so per-cell culling stays tight
      const L = Math.hypot(bx - ax, by - ay), n = Math.max(1, Math.ceil(L / 40));
      for (let k = 0; k < n; k++) {
        const sx = ax + (bx - ax) * k / n, sy = ay + (by - ay) * k / n, ex = ax + (bx - ax) * (k + 1) / n, ey = ay + (by - ay) * (k + 1) / n;
        if (Math.max(sx, ex) < x0 - 30 || Math.min(sx, ex) > x1 + 30 || Math.max(sy, ey) < y0 - 30 || Math.min(sy, ey) > y1 + 30) continue;
        segs.push({ ax: sx, ay: sy, bx: ex, by: ey, w: RM_HWY_W, r, t0: H.s[i] + L * k / n, t1: H.s[i] + L * (k + 1) / n });
      }
    }
  }
  segs.sort((p, q) => p.r.rank - q.r.rank);
  return segs;
}
function rmSegD(px, py, ax, ay, bx, by) { const dx = bx - ax, dy = by - ay, L2 = dx * dx + dy * dy || 1, t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / L2)); return Math.hypot(px - ax - dx * t, py - ay - dy * t); }
function rmNearestSeg(segs, xm, ym, maxD, filter) {
  let best = null, bd = maxD || 1e9;
  for (const s of segs) { if (filter && !filter(s)) continue; const d = rmSegD(xm, ym, s.ax, s.ay, s.bx, s.by) - s.w / 2; if (d < bd) { bd = d; best = s; } }
  return best ? { s: best, d: bd } : null;
}
// EOF part 3 (realgen.js continues)

/* --- 4. BUILDINGS: what is inside, which way it faces ---------------------------------- */
// POI class → [classic type, kind, priority]; kind also names the room program of odd-shaped plans
const RM_POI = {
  hospital: ["civic", "clinic", 9], doctors: ["civic", "clinic", 6], veterinary: ["civic", "clinic", 4], dentist: ["commercial", "office", 4],
  police: ["civic", "police", 9], fire_station: ["civic", "fire", 9], school: ["civic", "school", 8], college: ["civic", "school", 8], kindergarten: ["civic", "school", 6],
  town_hall: ["civic", "council", 8], place_of_worship: ["church", "church", 8], library: ["commercial", "library", 6], post: ["commercial", "post", 6],
  bank: ["commercial", "bank", 6], pharmacy: ["commercial", "pharmacy", 6], grocery: ["commercial", "grocery", 6], shop: ["commercial", "shop", 4],
  clothing_store: ["commercial", "store", 4], alcohol_shop: ["commercial", "store", 4], bakery: ["commercial", "cafe", 5], butcher: ["commercial", "store", 4],
  restaurant: ["commercial", "diner", 5], fast_food: ["commercial", "diner", 5], cafe: ["commercial", "cafe", 5], ice_cream: ["commercial", "cafe", 4],
  bar: ["commercial", "bar", 5], beer: ["commercial", "bar", 5], fuel: ["commercial", "gasstore", 6], car: ["commercial", "autorepair", 5],
  laundry: ["commercial", "laundromat", 5], hairdresser: ["commercial", "shop", 3], lodging: ["apartment", "hotel", 6], cinema: ["commercial", "cinema", 6],
  theatre: ["rpoly", "theatre", 6], museum: ["rpoly", "museum", 6], art_gallery: ["commercial", "showroom", 4], stadium: ["rpoly", "arena", 7],
  sports_centre: ["rpoly", "arena", 5], office: ["commercial", "office", 3], music: ["commercial", "shop", 3], bicycle: ["commercial", "shop", 3],
  railway: ["rpoly", "station", 6], bus: ["rpoly", "station", 5], zoo: ["rpoly", "museum", 4], aquarium: ["rpoly", "museum", 5], attraction: ["rpoly", "museum", 3],
  furniture: ["commercial", "store", 4], hardware: ["commercial", "hardware", 5], garden: ["commercial", "store", 3], mobile_phone: ["commercial", "shop", 3],
  parking: ["rpoly", "garage", 2], books: ["commercial", "shop", 3], jewelry: ["commercial", "shop", 3], shoes: ["commercial", "shop", 3], gift: ["commercial", "shop", 3], beauty: ["commercial", "shop", 3]
};
const RM_FIT = { house: [20, 16, 46, 40], commercial: [16, 14, 110, 90], civic: [30, 24, 130, 110], apartment: [28, 20, 130, 90], warehouse: [20, 16, 160, 140], church: [22, 28, 90, 120], shed: [8, 8, 24, 24], barn: [20, 24, 60, 70], rgbox: [8, 8, 40, 40] };
function rmPoiFor(pois, bd) {
  let best = null, bp = -1;
  const b = bd.bb;
  for (const p of pois) {
    if (p.x < b[0] - 1 || p.x > b[2] + 1 || p.y < b[1] - 1 || p.y > b[3] + 1) continue;
    if (!rmPipPoly(p.x, p.y, bd.pg)) continue;
    const m = RM_POI[p.cls] || RM_POI[p.sub];
    const pr = (m ? m[2] : 1) + (p.name ? 2 : 0);
    if (pr > bp) { bp = pr; best = p; }
  }
  return best;
}
function rmLandAt(C, xm, ym) {
  let out = null;
  for (const L of C.land) { if (L.src !== "lu" || xm < L.bb[0] || xm > L.bb[2] || ym < L.bb[1] || ym > L.bb[3]) continue; if (rmPipPoly(xm, ym, L.pg)) { out = L.cls; break; } }
  return out;
}
function rmClassify(bd, poi, lu, cls, r) {
  const A = bd.area, tall = bd.h >= 16;
  let type = "commercial", kind = "store", name = "", cat = "";
  if (poi) {
    const m = RM_POI[poi.cls] || RM_POI[poi.sub];
    if (m) { type = m[0]; kind = m[1]; }
    if (poi.cls === "hospital" && (poi.sub === "hospital" || A > 3000)) kind = "hospital";
    if (poi.cls === "car" && poi.sub === "car") kind = "dealership";
    if (poi.cls === "shop" && (poi.sub === "convenience" || poi.sub === "kiosk")) kind = "gasstore";
    if (poi.cls === "shop" && (poi.sub === "hardware" || poi.sub === "doityourself")) kind = "hardware";
    if (poi.cls === "shop" && poi.sub === "mall") { type = "rpoly"; kind = "store"; }
    if (poi.cls === "grocery" && poi.sub === "department_store") kind = "store";
    if (poi.cls === "lodging" && (poi.sub === "motel" || A < 900)) kind = "hotel";
    if (poi.cls === "library" && poi.sub === "books") kind = "shop";
    if (poi.cls === "town_hall" && poi.sub === "community_centre") kind = "council";
    name = poi.name || ""; cat = poi.sub || poi.cls;
  } else if (lu === "industrial" || lu === "railway" || lu === "garages" || lu === "quarry") {
    type = A < 45 ? "shed" : "warehouse"; kind = A < 45 ? "shed" : "warehouse";
  } else if (lu === "school" || lu === "college" || lu === "university" || lu === "kindergarten") {
    type = A < 120 ? "shed" : "civic"; kind = A < 120 ? "shed" : "school";
  } else if (lu === "hospital") { type = A < 120 ? "shed" : "civic"; kind = A < 120 ? "shed" : "clinic"; }
  else if (lu === "commercial" || lu === "retail" || cls === CL_DOWNTOWN || (cls === CL_URBAN && A > 260)) {
    if (A < 45) { type = "shed"; kind = "shed"; }
    else if (tall || A > 2600 && cls === CL_DOWNTOWN) { type = "commercial"; kind = "office"; }
    else if (A > 3500) { type = "rpoly"; kind = r() < 0.5 ? "store" : "grocery"; }
    else { type = "commercial"; kind = cPick(r, lu === "retail" ? ["store", "shop", "diner", "pharmacy", "cafe", "store", "hardware", "laundromat"] : ["office", "store", "diner", "bank", "bar", "cafe", "shop", "office", "autorepair", "post"]); }
  } else if (lu === "farmyard" || cls === CL_FARM && A > 150 && A < 900 && r() < 0.5) { type = A < 60 ? "shed" : "barn"; kind = type; }
  else {   // homes by default (most of America)
    if (A < 45) { type = "shed"; kind = "garage"; }
    else if (A < 330) { type = "house"; kind = "house"; }
    else if (A < 2500) { type = cls === CL_INDUSTRIAL ? "warehouse" : "apartment"; kind = cls === CL_INDUSTRIAL ? "warehouse" : "apartment"; }
    else { type = cls === CL_SUBURB || cls === CL_URBAN ? "rpoly" : "warehouse"; kind = cls === CL_SUBURB ? "apartment" : "warehouse"; }
  }
  const mat = type === "house" ? (r() < 0.62 ? "wood" : "brick") : type === "warehouse" || kind === "autorepair" ? "metal" : type === "civic" || type === "church" ? "masonry" : (r() < 0.5 ? "brick" : "masonry");
  return { type, kind, name, cat, mat };
}
// orientation (min-area rectangle of the hull), the street-facing side, the local plan frame
function rmHull(pts) {
  pts.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]), lo = [], up = [];
  for (const p of pts) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
  for (let i = pts.length - 1; i >= 0; i--) { const p = pts[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
  up.pop(); lo.pop(); return lo.concat(up);
}
function rmFrame(bd, segs) {
  const pts = []; for (const R of bd.pg) for (let i = 0; i < R.length; i += 2) pts.push([R[i], R[i + 1]]);
  const hull = rmHull(pts.slice());
  let ba = 0, bA = 1e18;
  for (let i = 0; i < hull.length; i++) {
    const a = hull[i], b = hull[(i + 1) % hull.length], th = Math.atan2(b[1] - a[1], b[0] - a[0]), c = Math.cos(th), s = Math.sin(th);
    let u0 = 1e9, u1 = -1e9, v0 = 1e9, v1 = -1e9;
    for (const p of hull) { const u = p[0] * c + p[1] * s, v = -p[0] * s + p[1] * c; if (u < u0) u0 = u; if (u > u1) u1 = u; if (v < v0) v0 = v; if (v > v1) v1 = v; }
    const A = (u1 - u0) * (v1 - v0); if (A < bA) { bA = A; ba = th; }
  }
  let al = ((ba % (Math.PI / 2)) + Math.PI / 2) % (Math.PI / 2);
  const snap = al < 0.044 || al > Math.PI / 2 - 0.044;
  if (snap) al = 0;
  // the street side: toward the nearest real road (paths and rails don't count)
  const [cx, cy] = bd.c, nr = rmNearestSeg(segs, cx, cy, 140, s => s.r.rank >= 1 && s.r.svc !== "parking_aisle");
  let dx = 0, dy = 1;
  if (nr) { const s = nr.s, ddx = s.bx - s.ax, ddy = s.by - s.ay, L2 = ddx * ddx + ddy * ddy || 1, t = Math.max(0, Math.min(1, ((cx - s.ax) * ddx + (cy - s.ay) * ddy) / L2)); dx = s.ax + ddx * t - cx; dy = s.ay + ddy * t - cy; const L = Math.hypot(dx, dy) || 1; dx /= L; dy /= L; }
  let bk = 0, bdot = -9;
  for (let k = 0; k < 4; k++) { const a = al + k * Math.PI / 2, d = Math.cos(a) * dx + Math.sin(a) * dy; if (d > bdot) { bdot = d; bk = k; } }
  const fa = al + bk * Math.PI / 2, ey = [Math.cos(fa), Math.sin(fa)], ex = [ey[1], -ey[0]];
  if (snap) { ey[0] = Math.round(ey[0]); ey[1] = Math.round(ey[1]); ex[0] = Math.round(ex[0]); ex[1] = Math.round(ex[1]); }
  let u0 = 1e9, u1 = -1e9, v0 = 1e9, v1 = -1e9;
  for (const p of pts) { const u = p[0] * ex[0] + p[1] * ex[1], v = p[0] * ey[0] + p[1] * ey[1]; if (u < u0) u0 = u; if (u > u1) u1 = u; if (v < v0) v0 = v; if (v > v1) v1 = v; }
  const W = Math.max(6, Math.ceil((u1 - u0) * 2)), H = Math.max(6, Math.ceil((v1 - v0) * 2));
  return { snap, ex, ey, ox: u0 * ex[0] + v0 * ey[0], oy: u0 * ex[1] + v0 * ey[1], u0, v0, W, H, fill: bd.area / Math.max(1, (u1 - u0) * (v1 - v0)), front: snap ? (ey[1] > 0.5 ? "S" : ey[0] < -0.5 ? "W" : ey[1] < -0.5 ? "N" : "E") : "S" };
}
// world-metre rings → local plan cells (u right along the front wall, v toward the street)
function rmLocalRings(bd, F) {
  return bd.pg.map(R => { const o = new Float32Array(R.length); for (let i = 0; i < R.length; i += 2) { const x = R[i] - F.ox, y = R[i + 1] - F.oy; o[i] = (x * F.ex[0] + y * F.ex[1]) * 2; o[i + 1] = (x * F.ey[0] + y * F.ey[1]) * 2; } return o; });
}
function rmFits(type, W, H) { const f = RM_FIT[type]; return !f || (W >= f[0] && H >= f[1] && W <= f[2] && H <= f[3]); }
let RM_BID = 1;
function rmMakeBuilding(B, bd, info, F, n) {
  let type = info.type, kind = info.kind;
  const rect = F.fill >= 0.9 && !bd.multi;
  if (type === "rpoly" || !rect || !rmFits(type, F.W, F.H)) {
    if (rect && type === "house" && F.W >= 8 && F.H >= 8 && F.W <= 40 && F.H <= 40) type = "rgbox";
    else if (rect && type === "shed" && F.W >= 8 && F.H >= 8 && F.W <= 24 && F.H <= 24) type = "shed";
    else type = "rpoly";
  }
  if (type === "civic" && !RM_FIT.civic) type = "rpoly";
  const loc = rmLocalRings(bd, F);
  const base = { id: CITY_BID++, key: B.key + ":" + n, type, kind, name: info.name, rmName: info.name, rmCat: info.cat, mat: info.mat,
    seed: cH(CITY.seed, B.seed, n, 99), cls: B.cls, mirror: false, int: null, block: B.key, imp: info.type === "civic" || info.type === "church" ? 1 : 0, uid: B.key + "#" + n,
    rm: { pg: bd.pg, h: bd.h, area: bd.area, F, rect: type !== "rpoly", W: F.W, H: F.H } };
  if (type === "rgbox" && kind === "house") base.rgGarage = false;
  if (F.snap) {
    // axis-aligned: an ordinary building of the classic pipeline, turned to face the street
    const rot = rotOfFront(F.front), bb = bd.bb, cw = F.W + 1, ch = F.H + 1;
    const x0 = Math.floor(bb[0] * 2), y0 = Math.floor(bb[1] * 2), ww = rot % 2 ? ch : cw, hh = rot % 2 ? cw : ch;
    let poly = null;
    if (type === "rpoly") {   // world tiles → canonical plan cells (inverse of cityCanonToWorld)
      poly = bd.pg.map(R => { const o = new Float32Array(R.length); for (let i = 0; i < R.length; i += 2) { const X = R[i] * 2 - x0, Y = R[i + 1] * 2 - y0; let cx, cy; if (rot === 0) { cx = X; cy = Y; } else if (rot === 1) { cx = Y; cy = ch - X; } else if (rot === 2) { cx = cw - X; cy = ch - Y; } else { cx = cw - Y; cy = X; } o[i] = cx; o[i + 1] = cy; } return o; });
    }
    Object.assign(base, { x: x0, y: y0, w: ww, h: hh, cw, ch, rot, front: F.front, rmPoly: poly, rmPolyKind: kind });
    B.blds.push(base);
    return base;
  }
  // at an angle: plan square to its own walls, drawn rotated; the world grid is resampled from the plan
  const cs = [[0, 0], [F.W / 2, 0], [0, F.H / 2], [F.W / 2, F.H / 2]].map(([u, v]) => [F.ox + u * F.ex[0] + v * F.ey[0], F.oy + u * F.ex[1] + v * F.ey[1]]);
  const x0 = Math.floor(Math.min(...cs.map(c => c[0])) * 2) - 1, y0 = Math.floor(Math.min(...cs.map(c => c[1])) * 2) - 1;
  const x1 = Math.ceil(Math.max(...cs.map(c => c[0])) * 2) + 1, y1 = Math.ceil(Math.max(...cs.map(c => c[1])) * 2) + 1;
  base.bl = { id: -base.id, key: base.key + "~", uid: base.uid + "~", type, kind, name: base.name, mat: base.mat, seed: base.seed, cls: base.cls, mirror: false, int: null, rot: 0, front: "S",
    x: 0, y: 0, w: F.W, h: F.H, cw: F.W, ch: F.H, rmPoly: type === "rpoly" ? loc : null, rmPolyKind: kind, imp: base.imp };
  if (type === "rgbox") base.bl.rgGarage = false;
  Object.assign(base, { type: "rmrot", planType: type, x: x0, y: y0, w: x1 - x0, h: y1 - y0, cw: x1 - x0, ch: y1 - y0, rot: 0, front: "S" });
  B.blds.push(base);
  return base;
}
// EOF part 4 (realgen.js continues)

/* --- 5. INTERIORS fitted to the footprint ---------------------------------------------- */
const RM_PROG = {
  house: { front: "living", rooms: ["kitchen", "bed", "bath", "bed", "dining", "master", "bath", "laundry"], sz: 90 },
  apartment: { front: "lobby", rooms: ["unitliving", "bed", "bath", "unitliving", "bed", "bath", "laundry", "storage"], sz: 110 },
  hotel: { front: "lobby", rooms: ["motelunit", "motelunit", "motelunit", "motelunit", "laundry", "office", "restroom"], sz: 90 },
  store: { front: "sales", rooms: ["storage", "office", "restroom"], sz: 170, hall: 1 }, shop: { front: "shop", rooms: ["storage", "restroom"], sz: 120 },
  grocery: { front: "grocery", rooms: ["storage", "storage", "office", "restroom"], sz: 180, hall: 1 }, pharmacy: { front: "pharmacy", rooms: ["storage", "lab", "restroom"], sz: 140 },
  hardware: { front: "sales", rooms: ["storage", "office", "restroom"], sz: 170, hall: 1 }, gasstore: { front: "sales", rooms: ["storage", "restroom"], sz: 100 },
  diner: { front: "dinerfront", rooms: ["kitchenpro", "restroom", "storage"], sz: 120 }, cafe: { front: "dinerfront", rooms: ["kitchenpro", "restroom"], sz: 110 },
  bar: { front: "bar", rooms: ["storage", "restroom", "restroom"], sz: 120 }, bank: { front: "lobby", rooms: ["teller", "vault", "office", "restroom"], sz: 120 },
  office: { front: "lobby", rooms: ["openoffice", "office", "conference", "office", "break", "restroom", "office", "openoffice"], sz: 140 },
  library: { front: "library", rooms: ["records", "office", "restroom"], sz: 200, hall: 1 }, post: { front: "shop", rooms: ["storage", "office", "restroom"], sz: 140 },
  laundromat: { front: "laundromat", rooms: ["office", "restroom"], sz: 120 }, autorepair: { front: "bay", rooms: ["office", "storage", "restroom"], sz: 170 },
  dealership: { front: "showroom", rooms: ["office", "office", "bay", "restroom"], sz: 180 }, showroom: { front: "showroom", rooms: ["storage", "office", "restroom"], sz: 180 },
  cinema: { front: "concession", rooms: ["auditorium", "auditorium", "restroom", "office", "auditorium"], sz: 300 }, theatre: { front: "lobby", rooms: ["auditorium", "restroom", "office", "storage"], sz: 300 },
  council: { front: "lobby", rooms: ["chamber", "office", "records", "mayor", "conference", "restroom", "office"], sz: 140 },
  school: { front: "lobby", rooms: ["classroom", "classroom", "classroom", "gym", "cafeteria", "office", "restroom", "classroom", "library"], sz: 170 },
  police: { front: "reception", rooms: ["bullpen", "cell", "cell", "armory", "locker", "interrogation", "office", "restroom"], sz: 120 },
  clinic: { front: "waiting", rooms: ["exam", "exam", "lab", "office", "exam", "restroom", "exam", "storage"], sz: 110 },
  hospital: { front: "waiting", rooms: ["exam", "exam", "exam", "lab", "office", "exam", "exam", "restroom", "storage", "exam", "dorm"], sz: 120 },
  fire: { front: "reception", rooms: ["bay", "dorm", "dayroom", "locker", "office", "restroom"], sz: 150 },
  church: { front: "nave", rooms: ["office", "storage", "restroom"], sz: 260, hall: 1 }, museum: { front: "lobby", rooms: ["showroom", "showroom", "showroom", "records", "office", "restroom"], sz: 260, hall: 1 },
  station: { front: "waiting", rooms: ["office", "restroom", "storage"], sz: 240, hall: 1 }, arena: { front: "concession", rooms: ["gym", "locker", "locker", "restroom", "office", "storage"], sz: 420, hall: 1 },
  warehouse: { front: "warehouse", rooms: ["office", "restroom", "break"], sz: 420, hall: 1 }, garage: { front: "garage", rooms: [], sz: 300 }, shed: { front: "storage", rooms: [], sz: 300 },
  barn: { front: "barn", rooms: ["storage"], sz: 300, hall: 1 }
};
function rmRaster(rings, W, H, M) {   // even-odd scanline fill at cell centres
  const xs = [];
  for (let y = 0; y < H; y++) {
    const yc = y + 0.5; xs.length = 0;
    for (const R of rings) { const n = R.length; for (let i = 0, j = n - 2; i < n; j = i, i += 2) { const y1 = R[i + 1], y2 = R[j + 1]; if ((y1 > yc) !== (y2 > yc)) xs.push(R[i] + (yc - y1) * (R[j] - R[i]) / (y2 - y1)); } }
    xs.sort((a, b) => a - b);
    for (let k = 0; k + 1 < xs.length; k += 2) { const a = Math.max(0, Math.ceil(xs[k] - 0.5)), b = Math.min(W - 1, Math.floor(xs[k + 1] - 0.5)); for (let x = a; x <= b; x++) M[y * W + x] = 1; }
  }
}
ICT.rpoly = function (G, b, r) {
  const W = G.w, H = G.h, P = RM_PROG[b.rmPolyKind || b.kind] || RM_PROG.shop, M = new Uint8Array(W * H);
  if (b.rmPoly) rmRaster(b.rmPoly, W, H, M); else M.fill(1);
  // thin spurs off, then walls = the inside cells that touch the outside (8-neighbourhood, via a 3×3 erosion) — typed-array passes
  for (let pass = 0; pass < 2; pass++) for (let y = 0; y < H; y++) { const o = y * W; for (let x = 0; x < W; x++) { const i = o + x; if (!M[i]) continue; const n = (x > 0 && M[i - 1] ? 1 : 0) + (x < W - 1 && M[i + 1] ? 1 : 0) + (y > 0 && M[i - W] ? 1 : 0) + (y < H - 1 && M[i + W] ? 1 : 0); if (n < 2) M[i] = 0; } }
  const E1 = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) { const o = y * W; for (let x = 0; x < W; x++) { const i = o + x; E1[i] = M[i] && x > 0 && x < W - 1 && M[i - 1] && M[i + 1] ? 1 : 0; } }
  let nIn = 0;
  for (let y = 0; y < H; y++) { const o = y * W; for (let x = 0; x < W; x++) { const i = o + x; if (!M[i]) continue; nIn++; G.c[i] = (y > 0 && y < H - 1 && E1[i] && E1[i - W] && E1[i + W]) ? IC_FLOOR : IC_EXT; } }
  G.parts.push({ x: 0, y: 0, w: W, h: H, poly: 1 });
  if (nIn < 30) { G.rooms.length = 0; const rm = icRoom(G, P.front === "living" ? "storage" : P.front, 1, 1, W - 2, H - 2); rmExtDoors(G, [rm], r, 2); G.spawnRooms = [rm.id]; return; }
  // floor counts by summed-area table (walls added while splitting are ignored: close enough to size rooms)
  const SAT = new Int32Array((W + 1) * (H + 1));
  for (let y = 0; y < H; y++) { let row = 0; for (let x = 0; x < W; x++) { row += G.c[y * W + x] === IC_FLOOR ? 1 : 0; SAT[(y + 1) * (W + 1) + x + 1] = SAT[y * (W + 1) + x + 1] + row; } }
  const floorIn = (x0, y0, w, h) => { const a = Math.max(0, x0), b2 = Math.max(0, y0), c = Math.min(W, x0 + w), d = Math.min(H, y0 + h); if (c <= a || d <= b2) return 0; return SAT[d * (W + 1) + c] - SAT[b2 * (W + 1) + c] - SAT[d * (W + 1) + a] + SAT[b2 * (W + 1) + a]; };
  const lineFloor = (x0, y0, w, h) => { let n = 0; for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) if (icGet(G, x, y) === IC_FLOOR) n++; return n; };
  // huge plans: fewer, bigger rooms (≈ 40 at most), so planning + furnishing stay a few ms
  const big = nIn > 4000, leaves = [], szK = Math.max(1, nIn / 42 / P.sz);
  // the public front: a band along the street side (big halls get most of the depth)
  const frontD = Math.max(6, Math.round((H - 2) * (P.hall && big ? cRange(r, 0.62, 0.74) : P.rooms.length ? cRange(r, 0.42, 0.55) : 1)));
  const split = (R, depth, isFront) => {
    const n = floorIn(R.x, R.y, R.w, R.h), target = (isFront ? (P.hall ? 1e9 : P.sz * 2.2) : P.sz) * szK;
    if (n < target * 1.6 || depth > 9 || (R.w < 9 && R.h < 9)) { if (n >= 6) leaves.push(Object.assign({ front: !!isFront }, R)); return; }
    const vert = R.w > R.h * 1.2 ? true : R.h > R.w * 1.2 ? false : r() < 0.5;
    for (let tr = 0; tr < 6; tr++) {
      const v = tr < 3 ? vert : !vert, span = v ? R.w : R.h;
      if (span < 9) continue;
      const at = Math.round(span * cRange(r, 0.36, 0.64)), lineN = v ? lineFloor(R.x + at, R.y, 1, R.h) : lineFloor(R.x, R.y + at, R.w, 1);
      if (lineN < 3) continue;
      const A = v ? { x: R.x, y: R.y, w: at, h: R.h } : { x: R.x, y: R.y, w: R.w, h: at }, Bq = v ? { x: R.x + at + 1, y: R.y, w: R.w - at - 1, h: R.h } : { x: R.x, y: R.y + at + 1, w: R.w, h: R.h - at - 1 };
      if (floorIn(A.x, A.y, A.w, A.h) < 6 || floorIn(Bq.x, Bq.y, Bq.w, Bq.h) < 6) continue;
      if (v) icVWall(G, R.x + at, R.y, R.y + R.h - 1); else icHWall(G, R.y + at, R.x, R.x + R.w - 1);
      // a doorway through the new wall where both sides are floor
      const cand = [];
      for (let k = 0; k < (v ? R.h : R.w); k++) { const x = v ? R.x + at : R.x + k, y = v ? R.y + k : R.y + at; if (icGet(G, x, y) !== IC_INT) continue; const a = v ? icGet(G, x - 1, y) : icGet(G, x, y - 1), c = v ? icGet(G, x + 1, y) : icGet(G, x, y + 1); if (a === IC_FLOOR && c === IC_FLOOR) cand.push([x, y]); }
      const len = big ? 4 : 2;
      if (cand.length) {
        const mid = cand[Math.floor(cand.length * cRange(r, 0.3, 0.7))];
        for (let q = 0; q < len; q++) { const x = v ? mid[0] : mid[0] + q, y = v ? mid[1] + q : mid[1]; if (icGet(G, x, y) === IC_INT) { icSet(G, x, y, len > 2 ? IC_FLOOR : IC_DOOR); if (len > 2) G.arch.push(x, y); } }
      }
      split(A, depth + 1, isFront); split(Bq, depth + 1, isFront);
      return;
    }
    leaves.push(Object.assign({ front: !!isFront }, R));
  };
  if (P.rooms.length && frontD < H - 4) {
    const wy = H - 1 - frontD;
    icHWall(G, wy, 1, W - 2);
    const back = { x: 1, y: 1, w: W - 2, h: wy - 1 }, front = { x: 1, y: wy + 1, w: W - 2, h: H - wy - 2 };
    // the front band connects to the back through one or two doorways
    const cand = []; for (let x = 1; x < W - 1; x++) if (icGet(G, x, wy) === IC_INT && icGet(G, x, wy - 1) === IC_FLOOR && icGet(G, x, wy + 1) === IC_FLOOR) cand.push(x);
    const nd = W > 60 ? 2 : 1;
    for (let k = 0; k < nd && cand.length; k++) { const x0 = cand[Math.floor(cand.length * (nd === 1 ? 0.5 : k ? 0.8 : 0.2))]; for (let q = 0; q < 2; q++) if (icGet(G, x0 + q, wy) === IC_INT) icSet(G, x0 + q, wy, IC_DOOR); }
    split(front, 0, true); split(back, 0, false);
  } else split({ x: 1, y: 1, w: W - 2, h: H - 2 }, 0, true);
  // rooms: the front leaf nearest the street centre is the public room; the rest take the program in order
  leaves.sort((a, b) => (b.front - a.front) || ((b.y + b.h) - (a.y + a.h)) || (Math.abs(a.x + a.w / 2 - W / 2) - Math.abs(b.x + b.w / 2 - W / 2)));
  const rooms = [];
  leaves.forEach((L, i) => {
    let t;
    if (i === 0) t = P.front; else if (L.front) t = P.hall ? P.front : (P.rooms[(i - 1) % Math.max(1, P.rooms.length)] || P.front);
    else t = P.rooms[(rooms.filter(q => !q.front).length) % Math.max(1, P.rooms.length)] || "storage";
    const rm = icRoom(G, t, L.x, L.y, L.w, L.h); rm.front = L.front; rooms.push(rm);
  });
  // big halls: a grid of columns
  for (const rm of rooms) {
    if (rm.w * rm.h < 1400) continue;
    const step = 18;
    for (let y = rm.y + 8; y < rm.y + rm.h - 6; y += step) for (let x = rm.x + 8; x < rm.x + rm.w - 6; x += step) {
      let ok = true; for (let dy = -2; dy <= 2 && ok; dy++) for (let dx = -2; dx <= 2; dx++) if (icGet(G, x + dx, y + dy) !== IC_FLOOR) { ok = false; break; }
      if (ok) icSet(G, x, y, IC_INT);
    }
  }
  rmExtDoors(G, rooms, r, big ? 4 : 2);
  rmConnect(G, r, IC_DOOR, IC_EDOOR);
  rmPolyWindows(G, r, P.front === "warehouse" || P.front === "garage" || P.front === "barn" ? 0.25 : 0.8);
  G.spawnRooms = rooms.filter(q => q.w * q.h >= 20).map(q => q.id);
};
// every walkable part of a plan joins up (BSP walls without a doorway, odd shapes, columns), and every part reaches outside.
// walls between two different components get a doorway (Kruskal over candidate wall cells); a part that still has no
// way out gets one through its outside wall. openCode: IC_DOOR for plans, IC_FLOOR for resampled angled buildings
function rmConnect(G, r, openCode, extCode) {
  const W = G.w, H = G.h, N = W * H, walk = v => v === IC_FLOOR || v === IC_DOOR || v === IC_EDOOR;
  const comp = new Int32Array(N).fill(-1), WK = new Uint8Array(N), st = new Int32Array(N); let nc = 0;
  for (let i = 0; i < N; i++) WK[i] = walk(G.c[i]) ? 1 : 0;
  for (let i = 0; i < N; i++) {
    if (comp[i] >= 0 || !WK[i]) continue;
    let sp = 0; st[sp++] = i; comp[i] = nc;
    while (sp) { const j = st[--sp], x = j % W; if (x > 0 && comp[j - 1] < 0 && WK[j - 1]) { comp[j - 1] = nc; st[sp++] = j - 1; } if (x < W - 1 && comp[j + 1] < 0 && WK[j + 1]) { comp[j + 1] = nc; st[sp++] = j + 1; } if (j >= W && comp[j - W] < 0 && WK[j - W]) { comp[j - W] = nc; st[sp++] = j - W; } if (j + W < N && comp[j + W] < 0 && WK[j + W]) { comp[j + W] = nc; st[sp++] = j + W; } }
    nc++;
  }
  if (nc === 0) return;
  const par = new Int32Array(nc); for (let k = 0; k < nc; k++) par[k] = k;
  const find = k => { while (par[k] !== k) k = par[k] = par[par[k]]; return k; };
  if (nc > 1) {
    const cand = [];
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
      const i = y * W + x; if (G.c[i] !== IC_INT) continue;
      const a = comp[i - 1], b = comp[i + 1], c = comp[i - W], d = comp[i + W];
      if (a >= 0 && b >= 0 && a !== b) cand.push([i, a, b, 0]); else if (c >= 0 && d >= 0 && c !== d) cand.push([i, c, d, 1]);
    }
    cShuffle(r, cand);
    for (const [i, a, b, vert] of cand) {
      const A = find(a), B2 = find(b); if (A === B2) continue;
      par[A] = B2; G.c[i] = openCode;
      const j = vert ? i + 1 : i + W;   // widen to two cells along the wall when it continues
      if (G.c[j] === IC_INT) G.c[j] = openCode;
      if (openCode === IC_FLOOR) G.arch.push(i % W, (i / W) | 0);
    }
  }
  // a way out for every remaining part
  const hasOut = new Uint8Array(nc);
  for (let i = 0; i < N; i++) { const k = comp[i]; if (k < 0) continue; const x = i % W, y = (i / W) | 0; if (G.c[i] === IC_EDOOR || x === 0 || y === 0 || x === W - 1 || y === H - 1 || G.c[i - 1] === IC_OUT || G.c[i + 1] === IC_OUT || G.c[i - W] === IC_OUT || G.c[i + W] === IC_OUT) hasOut[find(k)] = 1; }
  for (let i = W; i < N - W; i++) {
    if (G.c[i] !== IC_EXT) continue;
    const x = i % W; if (x === 0 || x === W - 1) continue;
    for (const [inn, out, step] of [[i - W, i + W, 1], [i + W, i - W, 1], [i - 1, i + 1, W], [i + 1, i - 1, W]]) {
      const k = comp[inn]; if (k < 0 || G.c[out] !== IC_OUT || hasOut[find(k)]) continue;
      G.c[i] = extCode; if (G.c[i + step] === IC_EXT) G.c[i + step] = extCode;
      hasOut[find(k)] = 1; break;
    }
  }
}
// exterior doors: the public room's street wall (bottom), else any wall of it, else any room; plus a back door on big plans
function rmExtDoors(G, rooms, r, len) {
  const W = G.w, H = G.h, pub = rooms[0];
  const tryWall = (rm, side) => {   // side 2 bottom, 0 top, 1 right, 3 left: runs of EXT with the room inside and outside beyond
    const runs = [], cur = [];
    const ok = (x, y) => { if (icGet(G, x, y) !== IC_EXT) return false; const [ix, iy, ox, oy] = side === 2 ? [x, y - 1, x, y + 1] : side === 0 ? [x, y + 1, x, y - 1] : side === 1 ? [x - 1, y, x + 1, y] : [x + 1, y, x - 1, y]; return icGet(G, ix, iy) === IC_FLOOR && G.rm[iy * W + ix] === rm.id && icGet(G, ox, oy) === IC_OUT; };
    // only the room's own walls can qualify: scan its rectangle ± 1 (not the whole plan — big plans have hundreds of thousands of cells)
    const X0 = Math.max(0, rm.x - 1), X1 = Math.min(W - 1, rm.x + rm.w), Y0 = Math.max(0, rm.y - 1), Y1 = Math.min(H - 1, rm.y + rm.h);
    if (side === 2 || side === 0) { for (let y = Y0; y <= Y1; y++) { cur.length = 0; for (let x = X0; x <= X1 + 1; x++) { if (x <= X1 && ok(x, y)) cur.push([x, y]); else { if (cur.length >= len + 1) runs.push(cur.slice()); cur.length = 0; } } } }
    else { for (let x = X0; x <= X1; x++) { cur.length = 0; for (let y = Y0; y <= Y1 + 1; y++) { if (y <= Y1 && ok(x, y)) cur.push([x, y]); else { if (cur.length >= len + 1) runs.push(cur.slice()); cur.length = 0; } } } }
    if (!runs.length) return false;
    // the run closest to the room's middle along that wall, deepest toward the street
    runs.sort((a, b) => (side === 2 ? b[0][1] - a[0][1] : side === 0 ? a[0][1] - b[0][1] : 0) || (Math.abs(a[a.length >> 1][0] - (rm.x + rm.w / 2)) - Math.abs(b[b.length >> 1][0] - (rm.x + rm.w / 2))));
    const run = runs[0], k0 = Math.max(0, Math.floor((run.length - len) / 2));
    for (let q = 0; q < len; q++) icSet(G, run[k0 + q][0], run[k0 + q][1], IC_EDOOR);
    return true;
  };
  let done = false, nd = 0;
  if (pub) for (const side of [2, 1, 3, 0]) if (tryWall(pub, side)) { done = true; nd++; break; }
  if (!done) for (const rm of rooms.slice(1)) { for (const side of [2, 1, 3, 0]) if (tryWall(rm, side)) { done = true; nd++; break; } if (done) break; }
  // big plans: one more entrance per ~45 m of outside wall, on different rooms (front rooms first)
  let per = 0; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (icGet(G, x, y) === IC_EXT && (icGet(G, x + 1, y) === IC_OUT || icGet(G, x - 1, y) === IC_OUT || icGet(G, x, y + 1) === IC_OUT || icGet(G, x, y - 1) === IC_OUT)) per++;
  const want = Math.min(7, 1 + Math.floor(per / 90));
  if (want > nd) for (const rm of rooms.slice(1).sort((a, b) => (b.front ? 1 : 0) - (a.front ? 1 : 0) || b.w * b.h - a.w * a.h)) { if (nd >= want) break; for (const side of [2, 1, 3, 0]) if (tryWall(rm, side)) { nd++; break; } }
  if (nd < 2 && rooms.length > 3 && G.w * G.h > 700) { const back = rooms.filter(q => !q.front).sort((a, b) => a.y - b.y)[0]; if (back) tryWall(back, 0); }
}
// windows along straight runs of the outline
function rmPolyWindows(G, r, p) {
  const W = G.w, H = G.h, c = G.c, isW = (x, y, dx, dy) => { const i = y * W + x; if (c[i] !== IC_EXT) return false; const ox = x + dx, oy = y + dy, ix = x - dx, iy = y - dy; return (ox < 0 || oy < 0 || ox >= W || oy >= H || c[oy * W + ox] === IC_OUT) && ix >= 0 && iy >= 0 && ix < W && iy < H && c[iy * W + ix] === IC_FLOOR; };
  for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
    if (dy) for (let y = 0; y < H; y++) { let run = 0; for (let x = 0; x <= W; x++) { if (x < W && isW(x, y, dx, dy)) run++; else { if (run >= 5) for (let k = x - run + 2; k + 2 < x - 1; k += 6) if (r() < p) { icSet(G, k, y, IC_WIN); icSet(G, k + 1, y, IC_WIN); } run = 0; } } }
    else for (let x = 0; x < W; x++) { let run = 0; for (let y = 0; y <= H; y++) { if (y < H && isW(x, y, dx, dy)) run++; else { if (run >= 5) for (let k = y - run + 2; k + 2 < y - 1; k += 6) if (r() < p) { icSet(G, x, k, IC_WIN); icSet(G, x, k + 1, IC_WIN); } run = 0; } } }
  }
}
// EOF part 5 (realgen.js continues)

/* --- 6. ANGLED BUILDINGS: plan square to the walls, resample onto the world grid ------- */
const RM_CI0 = typeof cityInterior === "function" ? cityInterior : null;
function rmRotXf(b) {
  const F = b.rm.F, ox2 = F.ox * 2 - b.x, oy2 = F.oy * 2 - b.y, ex = F.ex, ey = F.ey;
  return { ox2, oy2, ex, ey,
    toL: (X, Y) => { const dx = X - ox2, dy = Y - oy2; return [dx * ex[0] + dy * ex[1], dx * ey[0] + dy * ey[1]]; },
    toW: (u, v) => [ox2 + u * ex[0] + v * ey[0], oy2 + u * ex[1] + v * ey[1]] };
}
function rmInteriorRot(b) {
  const Gl = RM_CI0(b.bl), X = rmRotXf(b), W = b.w, H = b.h, G = icNew(W, H), GW = Gl.w;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const [u, v] = X.toL(x + 0.5, y + 0.5), iu = Math.floor(u), iv = Math.floor(v);
    if (iu < 0 || iv < 0 || iu >= GW || iv >= Gl.h) continue;
    const c = Gl.c[iv * GW + iu];
    if (c === IC_OUT) continue;
    G.c[y * W + x] = IC_FLOOR; G.rm[y * W + x] = Gl.rm[iv * GW + iu];
  }
  const PR = [0, 0, 5, 3, 0, 0, 4, 0, 2, 2], SUB = [0.12, 0.5, 0.88];
  for (let v = 0; v < Gl.h; v++) for (let u = 0; u < GW; u++) {
    const c = Gl.c[v * GW + u], pc = PR[c] || 0;
    if (!pc) continue;
    for (const su of SUB) for (const sv of SUB) {
      const [Xw, Yw] = X.toW(u + su, v + sv), x = Math.floor(Xw), y = Math.floor(Yw);
      if (x < 0 || y < 0 || x >= W || y >= H) continue;
      const i = y * W + x; if ((PR[G.c[i]] || 0) < pc) G.c[i] = c;
    }
  }
  const openAt = (u, v) => { for (const su of SUB) for (const sv of SUB) { const [Xw, Yw] = X.toW(u + su, v + sv), x = Math.floor(Xw), y = Math.floor(Yw); if (x >= 0 && y >= 0 && x < W && y < H && G.c[y * W + x] !== IC_OUT) G.c[y * W + x] = IC_FLOOR; } };
  for (let v = 0; v < Gl.h; v++) for (let u = 0; u < GW; u++) { const c = Gl.c[v * GW + u]; if (c === IC_DOOR || c === IC_EDOOR || c === IC_GDOOR) openAt(u, v); }
  for (let k = 0; k < Gl.arch.length; k += 2) openAt(Gl.arch[k], Gl.arch[k + 1]);
  rmConnect(G, cRng(b.seed ^ 0x77), IC_FLOOR, IC_FLOOR);   // resampling can pinch a doorway shut: reopen
  const box = (x0, y0, w, h) => { const cs = [[x0, y0], [x0 + w, y0], [x0, y0 + h], [x0 + w, y0 + h]].map(([u, v]) => X.toW(u, v)); const xs = cs.map(c => c[0]), ys = cs.map(c => c[1]); const a = Math.floor(Math.min(...xs)), c = Math.floor(Math.min(...ys)); return { x: a, y: c, w: Math.ceil(Math.max(...xs)) - a, h: Math.ceil(Math.max(...ys)) - c }; };
  G.rooms = Gl.rooms.map(rm => Object.assign({}, rm, box(rm.x, rm.y, rm.w, rm.h)));
  G.furn = Gl.furn.map(f => {
    const B = box(f.x, f.y, f.w, f.h), pc = [];
    for (let y = B.y; y < B.y + B.h; y++) for (let x = B.x; x < B.x + B.w; x++) { const [u, v] = X.toL(x + 0.5, y + 0.5); if (u >= f.x && u <= f.x + f.w && v >= f.y && v <= f.y + f.h) pc.push(x, y); }
    return { t: f.t, x: B.x, y: B.y, w: B.w, h: B.h, o: f.o, s: f.s, v: f.v, lf: f, pc };
  });
  G.spawnRooms = Gl.spawnRooms.slice(); G.parts = [{ x: 0, y: 0, w: W, h: H }]; G.arch = []; G.doors = []; G.occ = null; G.local = Gl;
  b.int = G; CITY.interiorCount = (CITY.interiorCount || 0) + 1;
  return G;
}
if (RM_CI0) window.cityInterior = cityInterior = function (b) {
  if (b.int) return b.int;
  let G;
  if (b.type === "rmrot") { try { G = rmInteriorRot(b); } catch (e) { if (window.trackProgress) window.trackProgress("rmInteriorRot: " + e.message, true); b.type = "rpoly"; b.rmPoly = null; b.rot = 0; b.cw = b.w; b.ch = b.h; b.int = null; } }
  if (!G) G = RM_CI0(b);
  if (b.rm) try { rmEnsureExit(b, G); } catch (e) { if (window.trackProgress) window.trackProgress("rmEnsureExit: " + e.message, true); }
  return G;
};
// real buildings stand shoulder to shoulder: make sure at least one doorway opens onto open ground (not a neighbour's
// wall, not water); otherwise cut one, preferring the side that faces the street
function rmEnsureExit(b, G) {
  const B = CITY.blockCache.get(b.block), W = G.w, H = G.h, rot = b.type === "rmrot";
  const nbrs = B ? B.blds.filter(o => o !== b && o.rm && o.x < b.x + W + 2 && o.x + o.w > b.x - 2 && o.y < b.y + H + 2 && o.y + o.h > b.y - 2) : [];
  const water = B && B.rmd ? B.rmd.water.filter(w => rmBoxHit(w.bb, b.x / 2 - 2, b.y / 2 - 2, (b.x + W) / 2 + 2, (b.y + H) / 2 + 2)) : [];
  const freeAt = (x, y) => { const xm = (b.x + x + 0.5) / 2, ym = (b.y + y + 0.5) / 2; for (const o of nbrs) { const q = o.rmBB || (o.rmBB = rmBBox(o.rm.pg[0])); if (xm >= q[0] && xm <= q[2] && ym >= q[1] && ym <= q[3] && rmPipPoly(xm, ym, o.rm.pg)) return false; } for (const w of water) if (rmPipPoly(xm, ym, w.pg)) return false; return true; };
  const out = (x, y) => x < 0 || y < 0 || x >= W || y >= H || G.c[y * W + x] === IC_OUT;
  const walk = v => v === IC_FLOOR || v === IC_DOOR || v === IC_EDOOR;
  const D4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  // an existing exit: a doorway (or, on angled buildings, an opening) with free open ground beyond it
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const v = G.c[y * W + x];
    if (!(v === IC_EDOOR || (rot && v === IC_FLOOR))) continue;
    for (const [dx, dy] of D4) if (out(x + dx, y + dy) && freeAt(x + dx, y + dy)) return;
  }
  // cut one: an outside wall cell with a room behind and free ground in front, nearest the street side
  const F = b.rm.F, fx = F.ey[0], fy = F.ey[1], cx = W / 2, cy = H / 2;
  let best = null, bs = -1e9;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (G.c[y * W + x] !== IC_EXT) continue;
    for (const [dx, dy] of D4) {
      if (!out(x + dx, y + dy) || !walk(G.c[(y - dy) * W + (x - dx)] || 0) || !freeAt(x + dx, y + dy)) continue;
      const sc = ((x - cx) * fx + (y - cy) * fy) + (dx * fx + dy * fy) * 40;
      if (sc > bs) { bs = sc; best = [x, y, dx, dy]; }
    }
  }
  if (!best) return;
  const [x, y, dx, dy] = best, code = rot ? IC_FLOOR : IC_EDOOR;
  G.c[y * W + x] = code;
  const ax = dy ? 1 : 0, ay = dx ? 1 : 0;   // widen along the wall
  if (G.c[(y + ay) * W + x + ax] === IC_EXT && walk(G.c[(y + ay - dy) * W + x + ax - dx] || 0)) G.c[(y + ay) * W + x + ax] = code;
  else if (G.c[(y - ay) * W + x - ax] === IC_EXT && walk(G.c[(y - ay - dy) * W + x - ax - dx] || 0)) G.c[(y - ay) * W + x - ax] = code;
  if (!rot && typeof icFindDoors === "function") G.doors = icFindDoors(G);
}
// EOF part 6 (realgen.js continues)

/* --- 7. BLOCKS ------------------------------------------------------------------------- */
function rmCellOutside(mx, my) {   // the whole cell lies beyond the outer barrier
  for (const [x, y] of [[mx * 1000, my * 1000], [mx * 1000 + 1000, my * 1000], [mx * 1000, my * 1000 + 1000], [mx * 1000 + 1000, my * 1000 + 1000], [mx * 1000 + 500, my * 1000 + 500]]) if (rmInsideRing(x, y) || rmEdgeDist(x, y) > -60) return false;
  return true;
}
function rmGenBlock(mx, my, i, j, key) {
  const S = cityCell(mx, my), zero = { r: 0, w: 0, sw: 0, hw: false, k: 0 };
  const B = { key, mx, my, i, j, cls: S.cls, seed: cH(CITY.seed, mx * 64 + my, i * 16 + j, 4247), x0: mx * 2000, x1: (mx + 1) * 2000, y0: my * 2000, y1: (my + 1) * 2000,
    side: { N: zero, S: zero, W: zero, E: zero }, blds: [], props: [], surf: [], fences: [], spawns: [], rm: 1, segs: [] };
  if (rmCellOutside(mx, my)) { B.outer = 1; return B; }
  const C = rmCellData(mx, my);
  if (!C) { B.pending = 1; if (RM.on) rmRequest(rmCellKeys(mx, my), 8); return B; }
  B.rmd = C;
  const r = cRng(B.seed);
  try {
    B.segs = rmCellRoads(mx, my, C);
    rmRefineClass(mx, my, C, C.blds); B.cls = cityMacroClass(mx, my);
    // which business is in which building: POIs inside the outline, else a named POI the door is mapped next to
    const own = new Map(), taken = new Set();
    for (const bd of C.blds) { if (bd.area < 12) continue; const p = rmPoiFor(C.pois, bd); if (p) { own.set(bd, p); taken.add(p); } }
    for (const p of C.pois) {
      if (!p.name || taken.has(p) || !(RM_POI[p.cls] || RM_POI[p.sub])) continue;
      let best = null, bd2 = 14;
      for (const bd of C.blds) { if (own.has(bd) || bd.area < 40) continue; const dx = Math.max(bd.bb[0] - p.x, 0, p.x - bd.bb[2]), dy = Math.max(bd.bb[1] - p.y, 0, p.y - bd.bb[3]), d = Math.hypot(dx, dy); if (d < bd2) { bd2 = d; best = bd; } }
      if (best) { own.set(best, p); taken.add(p); }
    }
    let n = 0;
    const kept = [], order = C.blds.slice().sort((p, q) => q.area - p.area);
    for (const bd of order) {
      if (bd.area < 6) continue;
      if (kept.some(k => bd.c[0] >= k.bb[0] && bd.c[0] <= k.bb[2] && bd.c[1] >= k.bb[1] && bd.c[1] <= k.bb[3] && rmPipPoly(bd.c[0], bd.c[1], k.pg))) continue;   // a part / store mapped inside a bigger outline
      if (bd.area >= 12) kept.push(bd);
      if (bd.bb[0] < RM_LO + RM_HWY_BAND || bd.bb[1] < RM_LO + RM_HWY_BAND || bd.bb[2] > RM_HI - RM_HWY_BAND || bd.bb[3] > RM_HI - RM_HWY_BAND) continue;
      if (!rmInsideRing(bd.c[0], bd.c[1])) continue;
      if (bd.area < 12) { const pg = bd.pg[0], tp = []; for (let k = 0; k < pg.length; k += 2) tp.push([pg[k] * 2, pg[k + 1] * 2]); addProp(B, "rmbox", bd.bb[0] * 2, bd.bb[1] * 2, (bd.bb[2] - bd.bb[0]) * 2, (bd.bb[3] - bd.bb[1]) * 2, FS_TALL, { pg: tp, es: FS_TALL, hgt: bd.h }); continue; }
      const poi = own.get(bd) || null, lu = poi ? null : rmLandAt(C, bd.c[0], bd.c[1]);
      const info = rmClassify(bd, poi, lu, B.cls, r), F = rmFrame(bd, B.segs);
      if (F.W * F.H > 1440000) { const pg = bd.pg[0], tp = []; for (let k = 0; k < pg.length; k += 2) tp.push([pg[k] * 2, pg[k + 1] * 2]); addProp(B, "rmbox", bd.bb[0] * 2, bd.bb[1] * 2, (bd.bb[2] - bd.bb[0]) * 2, (bd.bb[3] - bd.bb[1]) * 2, FS_TALL, { pg: tp, es: FS_TALL, hgt: bd.h, name: info.name }); continue; }
      const b = rmMakeBuilding(B, bd, info, F, n++);
      rmBldSpawns(B, b, r);
    }
    rmStreetProps(B, r);
    if (mx * 1000 < RM_LO + 1200 || my * 1000 < RM_LO + 1200 || (mx + 1) * 1000 > RM_HI - 1200 || (my + 1) * 1000 > RM_HI - 1200) rmHwyProps(B, r);
    rmStreetSpawns(B, r);
  } catch (e) { if (window.trackProgress) window.trackProgress("rmGenBlock " + key + ": " + e.message, true); else throw e; }
  return B;
}
function rmBldSpawns(B, b, r) {
  const t = b.planType || b.type, k = b.kind;
  let p = 0.5, a = 1, z = 3, heavy = 0.12;
  if (t === "house" || t === "rgbox" || k === "house") { p = 0.2; a = 1; z = 2; heavy = 0.08; }
  else if (t === "shed" || k === "garage" || k === "shed") { p = 0.06; a = 1; z = 1; }
  else if (k === "police") { p = 0.85; a = 4; z = 7; heavy = 0.4; }
  else if (k === "fire" || k === "clinic" || k === "hospital") { p = 0.55; a = 2; z = 4; heavy = 0.15; }
  else if (k === "warehouse" || t === "warehouse") { p = 0.4; a = 2; z = 4; heavy = 0.2; }
  else if (k === "apartment" || k === "hotel") { p = 0.45; a = 2; z = 4; }
  else if (k === "bank") { p = 0.7; a = 2; z = 4; heavy = 0.3; }
  if (r() < p) addSpawn(B, "room", cInt(r, a, z), { bid: b.id, bkey: b.key, heavy, rmRole: k === "police" ? "police" : "crew" });
}
// a point is clear of buildings (bbox + outline test)
function rmClearOf(B, xm, ym, pad) {
  for (const b of B.blds) { const q = b.rm.pg[0], bb = b.rmBB || (b.rmBB = rmBBox(q)); if (xm < bb[0] - pad || xm > bb[2] + pad || ym < bb[1] - pad || ym > bb[3] + pad) continue; if (rmPipPoly(xm, ym, b.rm.pg)) return false; if (pad > 0) for (const [dx, dy] of [[pad, 0], [-pad, 0], [0, pad], [0, -pad]]) if (rmPipPoly(xm + dx, ym + dy, b.rm.pg)) return false; }
  return true;
}
// crLamp's arm reaches toward -CR_DIR[o]: pick o whose direction points away from the road (lamp → kerb side)
function rmDirO(ax, ay) { let best = "N", bd = -9; for (const o of ["N", "S", "W", "E"]) { const d = CR_DIR[o], v = d[0] * ax + d[1] * ay; if (v > bd) { bd = v; best = o; } } return best; }
// inside the band of any real road (parking aisles excluded: their stalls sit beside them)
function rmOnRoad(B, xm, ym, pad) { for (const s of B.segs) { if (s.r.rank < 1 || s.r.svc === "parking_aisle") continue; const hw = s.w / 2 + (pad || 0); if (xm < Math.min(s.ax, s.bx) - hw || xm > Math.max(s.ax, s.bx) + hw || ym < Math.min(s.ay, s.by) - hw || ym > Math.max(s.ay, s.by) + hw) continue; if (rmSegD(xm, ym, s.ax, s.ay, s.bx, s.by) < hw) return true; } return false; }
function rmInCell(B, xm, ym) { return xm >= B.mx * 1000 && xm < B.mx * 1000 + 1000 && ym >= B.my * 1000 && ym < B.my * 1000 + 1000; }
function rmStreetProps(B, r) {
  const cls = B.cls, urban = cls === CL_DOWNTOWN || cls === CL_URBAN, sub = cls === CL_SUBURB || cls === CL_INDUSTRIAL;
  const vtx = new Map();   // junctions: vertex → the roads meeting there
  let acc = 0, last = null;
  for (const s of B.segs) {
    const R = s.r;
    if (R !== last) { acc = cF(cH(CITY.seed, Math.round(s.ax), Math.round(s.ay), 3)) * 30; last = R; }
    const L = Math.hypot(s.bx - s.ax, s.by - s.ay) || 1, ux = (s.bx - s.ax) / L, uy = (s.by - s.ay) / L, nx = -uy, ny = ux;
    if (R.rank >= 3 && R.rank <= 8 && R.svc !== "parking_aisle" && !R.hwy) {
      for (const [x, y] of [[s.ax, s.ay], [s.bx, s.by]]) { const k = Math.round(x * 2) + "," + Math.round(y * 2); let e = vtx.get(k); if (!e) vtx.set(k, e = { x, y, roads: new Set(), maxW: 0, rank: 0 }); e.roads.add(R); e.maxW = Math.max(e.maxW, s.w); e.rank = Math.max(e.rank, R.rank); }
      const step = R.rank >= 5 ? 30 : urban ? 34 : sub ? 46 : 0;
      if (step && R.br !== "bridge") {
        let d = acc;
        while (d < L) {
          const side = (Math.floor((d + acc) / step) & 1) ? 1 : -1, off = s.w / 2 + 1.1, x = s.ax + ux * d + nx * off * side, y = s.ay + uy * d + ny * off * side;
          if (rmInCell(B, x, y) && rmClearOf(B, x, y, 0.6) && !rmOnRoad(B, x, y, 0.3)) { const ax = nx * side, ay = ny * side; addProp(B, "streetlight", x * 2 - 0.5, y * 2 - 0.5, 1, 1, FS_COVER, { o: rmDirO(ax, ay) }); }
          d += step;
        }
        acc = d - L;
      }
      if (cls === CL_SUBURB && R.rank === 3 && r() < 0.18 && L > 20) { const x = s.ax + ux * L * 0.5 + nx * (s.w / 2 + 0.8), y = s.ay + uy * L * 0.5 + ny * (s.w / 2 + 0.8); if (rmInCell(B, x, y) && rmClearOf(B, x, y, 0.5) && !rmOnRoad(B, x, y, 0.2)) addProp(B, "hydrant", x * 2 - 0.5, y * 2 - 0.5, 1, 1, FS_LOW); }
      if (urban && R.rank >= 5 && r() < 0.06 && L > 30) { const x = s.ax + ux * L * 0.5 - nx * (s.w / 2 + 1.6), y = s.ay + uy * L * 0.5 - ny * (s.w / 2 + 1.6); if (rmInCell(B, x, y) && rmClearOf(B, x, y, 1.2) && !rmOnRoad(B, x, y, 0.2)) addProp(B, "busstop", x * 2 - 3, y * 2 - 1, 6, 2, FS_LOW); }
    }
    // parking lots: stalls both sides of every aisle, parked cars in a share of them
    if (R.svc === "parking_aisle" && L > 4) {
      const fill = cls === CL_DOWNTOWN ? 0.6 : urban ? 0.5 : 0.38, ang = Math.atan2(uy, ux);
      for (let d = 1.6; d < L - 1.2; d += 2.75) for (const side of [-1, 1]) {
        if (r() > fill) continue;
        const off = s.w / 2 + 2.6, x = s.ax + ux * d + nx * off * side, y = s.ay + uy * d + ny * off * side;
        if (!rmInCell(B, x, y) || !rmClearOf(B, x, y, 1.6) || rmOnRoad(B, x, y, 1.6)) continue;
        // a car in a stall points across the aisle; the prop rect is the car's footprint turned square to the world
        // the car points across the aisle: nearest quarter turn as o, the rest as ang (prop rect = the car itself)
        const a = ang + Math.PI / 2 * side - Math.PI / 2, o = ((Math.round(a / (Math.PI / 2)) % 4) + 4) % 4, res = a - Math.round(a / (Math.PI / 2)) * Math.PI / 2, pw = o & 1 ? 9 : 4, ph = o & 1 ? 4 : 9;
        addProp(B, "car", x * 2 - pw / 2, y * 2 - ph / 2, pw, ph, FS_COVER, { v: cInt(r, 0, 7), ang: res, o, rmPark: 1 });
      }
    }
  }
  // traffic lights where big roads cross, stop signs at quiet corners
  for (const e of vtx.values()) {
    if (e.roads.size < 2 || !rmInCell(B, e.x, e.y)) continue;
    const off = e.maxW / 2 + 1.4;
    if ([...e.roads].some(R => R.br === "bridge" || R.br === "tunnel" || (R.lay || 0) !== 0)) continue;   // overpasses don't meet the road below
    if (e.rank >= 5) { for (const [sx, sy] of [[1, 1], [-1, -1]]) { const x = e.x + sx * off, y = e.y + sy * off; if (rmClearOf(B, x, y, 0.5) && !rmOnRoad(B, x, y, 0.3)) addProp(B, "trafficlight", x * 2 - 0.5, y * 2 - 0.5, 1, 1, FS_COVER); } }
    else if (e.rank >= 3 && r() < 0.45) { const x = e.x + off, y = e.y + off; if (rmClearOf(B, x, y, 0.5) && !rmOnRoad(B, x, y, 0.3)) addProp(B, "stopsign", x * 2 - 0.5, y * 2 - 0.5, 1, 1, FS_LOW); }
  }
}
function rmStreetSpawns(B, r) {
  const big = B.segs.filter(s => s.r.rank >= 3 && s.r.rank <= 7 && !s.r.hwy && Math.hypot(s.bx - s.ax, s.by - s.ay) > 25);
  const n = B.cls === CL_DOWNTOWN || B.cls === CL_URBAN ? 2 : B.cls === CL_SUBURB || B.cls === CL_INDUSTRIAL ? 1 : (r() < 0.4 ? 1 : 0);
  for (let k = 0; k < n && big.length; k++) {
    const s = big[Math.floor(r() * big.length)], L = Math.hypot(s.bx - s.ax, s.by - s.ay), ux = (s.bx - s.ax) / L, uy = (s.by - s.ay) / L, off = s.w / 2 + 1.5;
    const pts = [0.1, 0.9].flatMap(t => [[s.ax + (s.bx - s.ax) * t - uy * off, s.ay + (s.by - s.ay) * t + ux * off], [s.ax + (s.bx - s.ax) * t + uy * off, s.ay + (s.by - s.ay) * t - ux * off]]);
    if (!rmInCell(B, pts[0][0], pts[0][1])) continue;
    addSpawn(B, "patrol", cInt(r, 2, 3), { pts: pts.map(q => [Math.round(q[0] * 2), Math.round(q[1] * 2)]), street: 1, heavy: 0.15, rmRole: "police" });
  }
}
// EOF part 7 (realgen.js continues)

/* --- 8. HIGHWAY 365 work zones ----------------------------------------------------------- */
// cross-section (metres from the centre line, + inward): median ±0.6 · lanes 0.6–4.2 & 4.2–7.8 · shoulder 7.8–11 · edge 13
function rmHwyProps(B, r) {
  const H = RMG.hwy, put = (t, tt, off, w, h, s, extra) => {
    const P = rmHwyAt(tt), x = P.x + P.nx * off, y = P.y + P.ny * off;
    if (!rmInCell(B, x, y)) return null;
    const a = Math.atan2(P.ty, P.tx), c = Math.abs(Math.cos(a)), sn = Math.abs(Math.sin(a)), ww = w * c + h * sn, hh = w * sn + h * c;
    return addProp(B, t, x * 2 - ww, y * 2 - hh, ww * 2, hh * 2, s, Object.assign({ ang: a, rw: w * 2, rh: h * 2, hwy: 1 }, extra || {}));
  };
  // quick reject: the cell must touch the ring
  const cx = B.mx * 1000 + 500, cy = B.my * 1000 + 500;
  if (Math.abs(rmHwyOff(cx, cy)) > 760) return;
  for (const z of RMG.zones) {
    const zr = cH(365, Math.round(z.s0), 7, 1), zr2 = cRng(zr);
    for (const sd of z.lanes === 2 ? [1, -1] : [z.side]) {
      // signs on the shoulder, well before the closure
      put("rmsign", z.s0 - 320 * 1, sd * 11.6, 1.6, 0.4, FS_LOW, { v: 0 }); put("rmsign", z.s0 - 210, sd * 11.6, 1.6, 0.4, FS_LOW, { v: 1 }); put("rmsign", z.s0 - 110, sd * 11.6, 1.6, 0.4, FS_LOW, { v: 2 });
      put("rmarrow", z.s0 - 132, sd * 9.4, 1.8, 2.6, FS_COVER, { v: sd > 0 ? 1 : -1 });
      // taper: drums sweep the lane shut, then a line of cones (or concrete barriers where the crew works)
      for (let k = 0; k <= 10; k++) { const t = z.s0 - 120 + k * 12, off = sd * (7.8 - 3.4 * k / 10); put(k % 2 ? "rmcone" : "rmdrum", t, off, k % 2 ? 0.5 : 0.8, k % 2 ? 0.5 : 0.8, FS_LOW); }
      const b0 = z.s0 + 50, b1 = z.s1 - 50;
      for (let t = z.s0 + 8; t < z.s1; t += 9) { if (z.crew && t > b0 && t < b1) continue; put("rmcone", t, sd * 4.4, 0.5, 0.5, FS_LOW); }
      if (z.crew) for (let t = b0; t < b1; t += 6.2) put("rmjersey", t + 3, sd * 4.6, 6, 0.8, FS_COVER);
      put("rmdrum", z.s1 + 6, sd * 4.6, 0.8, 0.8, FS_LOW);
      // the crew: machines in the closed lane, gravel and a toilet on the shoulder, people in hi-vis
      if (z.crew) {
        const n = 1 + Math.floor(zr2() * 3);
        for (let k = 0; k < n; k++) {
          const t = b0 + 30 + zr2() * Math.max(10, b1 - b0 - 60), kind = ["rmexcav", "rmroller", "rmdump"][Math.floor(zr2() * 3)], dims = kind === "rmexcav" ? [3.4, 7.5] : kind === "rmroller" ? [2.2, 4.6] : [2.6, 7.6];
          put(kind, t, sd * 6.1, dims[1], dims[0], FS_COVER, { v: k });
          for (let q = 0; q < 2; q++) put("rmworker", t + (zr2() - 0.5) * 14, sd * (5.2 + zr2() * 2), 0.6, 0.6, FS_LOW, { v: Math.floor(zr2() * 4) });
        }
        put("rmgravel", b0 + 20, sd * 10.2, 5, 3.2, FS_LOW); put("rmjohn", b1 - 10, sd * 10.4, 1.3, 1.3, FS_TALL);
        if (z.plates) for (let t = b0 + 15; t < b1; t += 80) put("rmplate", t, sd * 2.4, 2.4, 2, FS_NONE);
      }
      // a traffic cop waving people through, cruiser on the shoulder with the lights going
      if (z.cop) {
        put("rmcop", z.s0 - 70, sd * 8.6, 0.6, 0.6, FS_LOW, { v: sd });
        const P = rmHwyAt(z.s0 - 96), x = P.x + P.nx * sd * 9.6, y = P.y + P.ny * sd * 9.6;
        if (rmInCell(B, x, y)) { const a = Math.atan2(P.ty, P.tx) - Math.PI / 2, o = ((Math.round(a / (Math.PI / 2)) % 4) + 4) % 4, res = a - Math.round(a / (Math.PI / 2)) * Math.PI / 2, pw = o & 1 ? 9 : 4, ph = o & 1 ? 4 : 9; addProp(B, "rmpolice", x * 2 - pw / 2, y * 2 - ph / 2, pw, ph, FS_COVER, { o, ang: res, v: 0, lights: 1, hwy: 1 }); }
      }
      // the queue: a few stalled cars in the open lane before the taper
      if (zr2() < 0.55) { const nq = 2 + Math.floor(zr2() * 4); for (let k = 0; k < nq; k++) { const P = rmHwyAt(z.s0 - 150 - k * 8.5), x = P.x + P.nx * sd * 2.4, y = P.y + P.ny * sd * 2.4; if (!rmInCell(B, x, y)) continue; const a = Math.atan2(P.ty, P.tx) - Math.PI / 2 + (sd > 0 ? Math.PI : 0), o = ((Math.round(a / (Math.PI / 2)) % 4) + 4) % 4, res = a - Math.round(a / (Math.PI / 2)) * Math.PI / 2, pw = o & 1 ? 9 : 4, ph = o & 1 ? 4 : 9; addProp(B, "car", x * 2 - pw / 2, y * 2 - ph / 2, pw, ph, FS_COVER, { v: Math.floor(zr2() * 8), o, ang: res }); } }
    }
  }
  // a few lone cones and barrels between zones (it is under construction everywhere)
  const tA = rmHwyProject(B.mx * 1000 + 500, B.my * 1000 + 500).t;
  for (let k = 0; k < 6; k++) { const t = tA + (r() - 0.5) * 900; if (rmZoneAt(t)) continue; put(r() < 0.5 ? "rmcone" : "rmdrum", t, (r() < 0.5 ? 1 : -1) * (8.4 + r() * 2), 0.6, 0.6, FS_LOW); }
}
// signed offset from the highway centre line (+ inward), analytic (rounded square)
function rmHwyOff(xm, ym) {
  const hs = RM_HALF - RM_HWY_IN - RM_HWY_W / 2, R = RM_HWY_R, qx = Math.abs(xm - 32000) - hs + R, qy = Math.abs(ym - 32000) - hs + R;
  return -(Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - R);
}
function rmInCross(t) { for (const c of RMG.hwy.cross) if (Math.abs(t - c) < 22) return true; return false; }
// EOF part 8 (realgen.js continues)

/* --- 9. CHUNKS: water, the border barriers, woods, tiny sheds -------------------------- */
function rmChunkPost(C) {
  const x0 = C.x0, y0 = C.y0, m0x = x0 / 2, m0y = y0 / 2, m1x = m0x + 64, m1y = m0y + 64;
  const blocks = cityBlocksInRect(m0x, m0y, m1x, m1y);
  const set = (i, fl, kd) => { C.flags[i] |= fl; C.kind[i] = kd; };
  // 1. road bands keep their cells dry (bridges, causeways, culverts)
  const road = new Uint8Array(128 * 128);
  for (const B of blocks) for (const s of (B.segs || [])) {
    const hw = s.w / 2 + 0.3;
    if (Math.max(s.ax, s.bx) + hw < m0x || Math.min(s.ax, s.bx) - hw > m1x || Math.max(s.ay, s.by) + hw < m0y || Math.min(s.ay, s.by) - hw > m1y) continue;
    const xa = Math.max(0, Math.floor((Math.min(s.ax, s.bx) - hw) * 2) - x0), xb = Math.min(127, Math.ceil((Math.max(s.ax, s.bx) + hw) * 2) - x0), ya = Math.max(0, Math.floor((Math.min(s.ay, s.by) - hw) * 2) - y0), yb = Math.min(127, Math.ceil((Math.max(s.ay, s.by) + hw) * 2) - y0);
    for (let yy = ya; yy <= yb; yy++) for (let xx = xa; xx <= xb; xx++) if (rmSegD((x0 + xx + 0.5) / 2, (y0 + yy + 0.5) / 2, s.ax, s.ay, s.bx, s.by) <= hw) road[(yy << 7) | xx] = 1;
  }
  // 2. water you cannot walk on
  const xs = [], seen = new Set();
  for (const B of blocks) if (B.rmd) for (const w of B.rmd.water) {
    if (seen.has(w) || !rmBoxHit(w.bb, m0x, m0y, m1x, m1y)) continue; seen.add(w);
    for (let yy = 0; yy < 128; yy++) {
      const yc = (y0 + yy + 0.5) / 2; if (yc < w.bb[1] || yc > w.bb[3]) continue;
      xs.length = 0;
      for (const R of w.pg) { const n = R.length; for (let i = 0, j = n - 2; i < n; j = i, i += 2) { const a = R[i + 1], b = R[j + 1]; if ((a > yc) !== (b > yc)) xs.push(R[i] + (yc - a) * (R[j] - R[i]) / (b - a)); } }
      xs.sort((a, b) => a - b);
      for (let k = 0; k + 1 < xs.length; k += 2) {
        const xa = Math.max(0, Math.ceil(xs[k] * 2 - 0.5) - x0), xb = Math.min(127, Math.floor(xs[k + 1] * 2 - 0.5) - x0);
        for (let xx = xa; xx <= xb; xx++) { const i = (yy << 7) | xx; if (road[i] || (C.flags[i] & F_IN)) continue; set(i, F_MOVE | F_WATER, K_WATER); }
      }
    }
  }
  // 3. tiny sheds / utility boxes
  for (const B of blocks) for (const p of B.props) if (p.t === "rmbox" && p.pg) { if (p.x + p.w < x0 || p.x > x0 + 128 || p.y + p.h < y0 || p.y > y0 + 128) continue; if (typeof rgStampPoly === "function") rgStampPoly(C, p); }
  // 4. the border: Highway 365's median barrier (open at the crossovers), the outer barrier + fence, nothing beyond
  const ed = Math.min(rmEdgeDist(m0x, m0y), rmEdgeDist(m1x, m1y), rmEdgeDist(m0x, m1y), rmEdgeDist(m1x, m0y));
  if (ed < 120) {
    const outer = RM_HWY_W / 2 + 0.4, wall = RM_HWY_W / 2 + 1.6;
    for (let yy = 0; yy < 128; yy++) for (let xx = 0; xx < 128; xx++) {
      const xm = (x0 + xx + 0.5) / 2, ym = (y0 + yy + 0.5) / 2, off = rmHwyOff(xm, ym), i = (yy << 7) | xx;
      if (off < -wall) { C.flags[i] = F_MOVE; C.kind[i] = K_NONE; continue; }
      if (off < -outer) { set(i, F_MOVE | F_SHOT, K_STONE); continue; }
      if (Math.abs(off) < 0.45 && !rmInCross(rmHwyProject(xm, ym).t)) set(i, F_MOVE | F_SHOT | F_LOW, K_STONE);
    }
  }
  // 5. woods, park trees, yard trees (deterministic per chunk)
  const lc = [];
  for (const B of blocks) if (B.rmd) for (const L of B.rmd.land) if (!lc.includes(L) && rmBoxHit(L.bb, m0x, m0y, m1x, m1y)) lc.push(L);
  if (lc.length) {
    const rr = cRng(cH(CITY.seed, C.cx, C.cy, 517));
    const dens = L => (L.src === "lc" && (L.cls === "wood" || L.cls === "forest")) ? 150 : (L.src === "lc" && L.cls === "wetland") ? 40 : (L.src === "park" || (L.src === "lc" && L.cls === "grass" && (L.sub === "park" || L.sub === "garden" || L.sub === "recreation_ground"))) ? 34 : (L.src === "lu" && L.cls === "residential") ? 30 : (L.src === "lc" && L.cls === "grass" && L.sub === "golf_course") ? 10 : (L.src === "lu" && L.cls === "cemetery") ? 12 : 0;
    for (const L of lc) {
      const n = dens(L); if (!n) continue;
      for (let k = 0; k < n; k++) {
        const x = x0 + rr() * 128, y = y0 + rr() * 128, xm = x / 2, ym = y / 2;
        if (xm < L.bb[0] || xm > L.bb[2] || ym < L.bb[1] || ym > L.bb[3] || !rmPipPoly(xm, ym, L.pg)) continue;
        const ix = Math.floor(x) - x0, iy = Math.floor(y) - y0, i = (iy << 7) | ix;
        if (road[i] || (C.flags[i] & (F_MOVE | F_IN | F_WATER))) continue;
        if (L.src !== "lc" || L.cls !== "wood") {   // yard / park trees keep off paths and walls
          let near = false; for (let dy = -3; dy <= 3 && !near; dy++) for (let dx = -3; dx <= 3; dx++) { const qx = ix + dx, qy = iy + dy; if (qx < 0 || qy < 0 || qx > 127 || qy > 127) continue; const j = (qy << 7) | qx; if (road[j] || (C.flags[j] & (F_MOVE | F_IN))) { near = true; break; } }
          if (near) continue;
        }
        const t = { t: "tree", x, y, w: 1, h: 1, s: FS_COVER, v: Math.floor(rr() * 4), sz: 0.85 + rr() * 0.85, wild: 1 };
        C.trees.push(t); C.props.push(t); set(i, F_MOVE | F_SHOT, K_TREE);
      }
    }
  }
  C.rmRoad = road;
}
// EOF part 9 (realgen.js continues)

/* --- 10. WIRING: the generator, drop zone, names & banner, streaming ------------------- */
(function rmWire() {
  if (typeof regionSetProfile === "function") {
    const _sp = regionSetProfile;
    window.regionSetProfile = regionSetProfile = function (key) { const P = _sp(key); RG.real = RG.key === "real"; RM.on = RG.real; return P; };
  }
  if (typeof cityGenInit === "function") { const _gi = cityGenInit; window.cityGenInit = cityGenInit = function (seed) { return RG.real ? rmInit(seed) : _gi(seed); }; }
  if (typeof cityCellStreets === "function") { const _cs = cityCellStreets; window.cityCellStreets = cityCellStreets = function (mx, my) { return RG.real ? rgOrgCell(mx, my) : _cs(mx, my); }; }
  if (typeof cityGenBlock === "function") { const _gb = cityGenBlock; window.cityGenBlock = cityGenBlock = function (mx, my, i, j, key) { return RG.real ? rmGenBlock(mx, my, i, j, key) : _gb(mx, my, i, j, key); }; }
  // one block per km cell; big buildings reach into the next cell, so look a little wider
  if (typeof cityBlocksInRect === "function") { const _br = cityBlocksInRect; window.cityBlocksInRect = cityBlocksInRect = function (x0, y0, x1, y1) { return RG.real ? _br(x0 - 220, y0 - 220, x1 + 220, y1 + 220) : _br(x0, y0, x1, y1); }; }
  if (typeof cityBuildChunk === "function") { const _bc = cityBuildChunk; window.cityBuildChunk = cityBuildChunk = function (cx, cy) { const C = _bc(cx, cy); if (RG.real) { try { rmChunkPost(C); } catch (e) { if (window.trackProgress) window.trackProgress("rmChunkPost: " + e.message, true); } } return C; }; }
  if (typeof cityPickDrop === "function") {
    const _pd = cityPickDrop;
    window.cityPickDrop = cityPickDrop = function () {
      if (!RG.real) return _pd();
      const d = typeof meta !== "undefined" ? meta.cityDrop : null;
      if (Array.isArray(d) && d.length === 2 && d.every(v => typeof v === "number") && rmInsideRing(d[0] / 2, d[1] / 2) && rmEdgeDist(d[0] / 2, d[1] / 2) > 120) return [d[0] * 16 + 8, d[1] * 16 + 8];
      return rmPickDrop(32000, 32000);
    };
  }
  if (typeof regionWorldKey === "function") { const _wk = regionWorldKey; window.regionWorldKey = regionWorldKey = function () { return RG.real ? "real|" + rmPlaceKey() : _wk(); }; }
  if (typeof cityName === "function") { const _cn = cityName; window.cityName = cityName = function (c) { return RG.real ? (c ? c.name || "" : "") : _cn(c); }; }
  if (typeof cityShortName === "function") { const _sn = cityShortName; window.cityShortName = cityShortName = function () { return RG.real ? rmPlaceName(...cityWorldM(player.x, player.y)).top : _sn(); }; }
  if (typeof cityStreetName === "function") { const _st = cityStreetName; window.cityStreetName = cityStreetName = function (axis, line, mx, my) { if (!RG.real) return _st(axis, line, mx, my); const nr = player ? rmNearestNamed(...cityWorldM(player.x, player.y), 60) : null; return nr ? nr.name : ""; }; }
  if (typeof cityUpdateBanner === "function") { const _ub = cityUpdateBanner; window.cityUpdateBanner = cityUpdateBanner = function (force) { return RG.real ? rmBanner(force) : _ub(force); }; }
  if (typeof cityBuildingLabel === "function") { const _bl = cityBuildingLabel; window.cityBuildingLabel = cityBuildingLabel = function (b) { if (b && (b.rmName || b.rm)) return b.rmName || ""; return _bl(b); }; }
  if (typeof V10 !== "undefined" && V10.onStep) V10.onStep.push(dt => { if (CITY.on && RG.real && player) rmStep(dt); });
})();
function rmPlaceKey() { const p = RM.place; return p ? (p.lat.toFixed(3) + "," + p.lon.toFixed(3)) : "0,0"; }
// a pavement spot near (xm, ym): the edge of the nearest ordinary street, clear of walls and water
function rmPickDrop(xm, ym) {
  for (let R = 60; R <= 1600; R *= 1.6) {
    const cands = [];
    for (let my = Math.floor((ym - R) / 1000); my <= Math.floor((ym + R) / 1000); my++) for (let mx = Math.floor((xm - R) / 1000); mx <= Math.floor((xm + R) / 1000); mx++) {
      const B = cityBlock(mx, my, 0, 0);
      if (!B || B.pending || !B.segs) continue;
      for (const s of B.segs) {
        if (s.r.rank < 3 || s.r.rank > 6 || s.r.br === "bridge" || s.r.hwy) continue;
        const d = rmSegD(xm, ym, s.ax, s.ay, s.bx, s.by); if (d > R) continue;
        cands.push([d, s]);
      }
    }
    cands.sort((a, b) => a[0] - b[0]);
    for (const [, s] of cands.slice(0, 12)) {
      const L = Math.hypot(s.bx - s.ax, s.by - s.ay) || 1, ux = (s.bx - s.ax) / L, uy = (s.by - s.ay) / L;
      for (const t of [0.5, 0.3, 0.7]) for (const side of [1, -1]) {
        const x = s.ax + (s.bx - s.ax) * t - uy * (s.w / 2 + 1.2) * side, y = s.ay + (s.by - s.ay) * t + ux * (s.w / 2 + 1.2) * side;
        const f = cityFlagsT(Math.floor(x * 2), Math.floor(y * 2));
        if (!(f & (F_MOVE | F_IN | F_WATER))) return [x * 32, y * 32];
      }
    }
  }
  return [xm * 32, ym * 32];
}
function rmNearestNamed(xm, ym, maxD) {
  const B = cityBlock(Math.floor(xm / 1000), Math.floor(ym / 1000), 0, 0);
  if (!B || !B.segs) return null;
  const nr = rmNearestSeg(B.segs, xm, ym, maxD || 60, s => !!s.r.name && s.r.rank >= 1);
  return nr ? { name: nr.s.r.name + (nr.s.r.ref && nr.s.r.rank >= 6 && nr.s.r.name.indexOf(nr.s.r.ref) < 0 ? " (" + nr.s.r.ref + ")" : ""), s: nr.s, d: nr.d } : null;
}
// "Fountain Square · Indianapolis" — the nearest neighbourhood / suburb, else the town
function rmPlaceName(xm, ym) {
  const mx = Math.floor(xm / 1000), my = Math.floor(ym / 1000), cls = cityMacroClass(mx, my);
  let hood = null, hd = 1e9;
  for (let y = my - 1; y <= my + 1; y++) for (let x = mx - 1; x <= mx + 1; x++) {
    const C = RM.cells.get(x * 64 + y); if (!C) continue;
    for (const p of C.places) { if (p.cls === "water") continue; const d = Math.hypot(p.x - xm, p.y - ym) / (RM_PLACE_R[p.cls] || 900); if (d < hd && d < 1.6) { hd = d; hood = p; } }
  }
  let town = null, td = 1e9;
  for (const c of CITY.cities) { const d = Math.hypot(c.x - xm, c.y - ym) / c.r; if (d < td) { td = d; town = c; } }
  const tname = town && td < 1.6 ? town.name : (RM.place ? RM.place.region || RM.place.name : "");
  return { top: hood && hood.name !== tname ? hood.name : (tname || CL_NAMES[cls]), sub: hood && hood.name !== tname ? tname : CL_NAMES[cls], cls };
}
function rmBanner(force) {
  if (!player) return;
  const [xm, ym] = cityWorldM(player.x, player.y), el = document.getElementById("cityHud");
  if (!el) return;
  const onHwy = Math.abs(rmHwyOff(xm, ym)) < RM_HWY_W / 2 + 6;
  const P = onHwy ? { top: "Highway 365", sub: "Under Construction · Expect Delays" } : rmPlaceName(xm, ym);
  const onRoof = !!player.roof, b = onRoof ? cityBldT(cityTX(player.x), cityTY(player.y)) : cityBuildingAt(player.x, player.y);
  let inside = "";
  if (b) inside = b.rmName || RM_KIND_LABEL[b.kind] || "Building";
  const nr = !inside && !onHwy ? rmNearestNamed(xm, ym, 40) : null;
  const top = P.top + " · " + P.sub, sub = inside ? (onRoof ? "On the roof: " : "Inside: ") + inside : nr ? nr.name : "Data from OpenStreetMap";
  el.style.display = "block";
  if (force || top !== CITYP.banner) {
    if (CITYP.banner && top !== CITYP.banner && typeof fxBanner === "function") fxBanner(P.top.toUpperCase(), P.sub, onHwy ? "#ffb300" : "#80deea", 1.6, false, "city");
    CITYP.banner = top;
  }
  el.innerHTML = "<b>" + rmEsc(top) + "</b><span>" + rmEsc(sub) + "</span>";
}
const RM_KIND_LABEL = { house: "House", apartment: "Apartments", hotel: "Hotel", store: "Store", shop: "Shop", grocery: "Grocery", pharmacy: "Pharmacy", hardware: "Hardware Store", gasstore: "Convenience Store",
  diner: "Restaurant", cafe: "Café", bar: "Bar", office: "Offices", bank: "Bank", library: "Library", post: "Post Office", laundromat: "Laundromat", autorepair: "Auto Repair", dealership: "Car Dealer",
  showroom: "Gallery", cinema: "Cinema", theatre: "Theatre", council: "City Hall", school: "School", police: "Police Station", clinic: "Clinic", hospital: "Hospital", fire: "Fire Station", church: "Church",
  museum: "Museum", station: "Station", arena: "Arena", warehouse: "Warehouse", garage: "Garage", shed: "Shed", barn: "Barn" };
function rmEsc(s) { return String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }
// streaming + the warning before the border
function rmStep(dt) {
  const [xm, ym] = cityWorldM(player.x, player.y);
  const v = player.inVehicle && typeof VEH !== "undefined" && VEH.ride ? VEH.ride : null;
  rmStream(xm, ym, v ? v.vx / 32 : (player.vx || 0) / 32, v ? v.vy / 32 : (player.vy || 0) / 32);
  rmLawfulHunters(dt);
  const off = rmHwyOff(xm, ym);
  RMG.warnT = (RMG.warnT || 0) - dt;
  if (off < RM_HWY_W / 2 + 40 && RMG.warnT <= 0 && typeof spawnSpeech === "function") { RMG.warnT = 14; spawnSpeech(player.x, player.y - 30, "⚠ HIGHWAY 365 — UNDER CONSTRUCTION · END OF THE MAP", "#ffb300", 2.6); }
}
// lawful bounty hunters keep to the law of the land: no shooting inside a hospital, school, church or police station —
// they hold off outside until you come out (lawless ones don't care)
const RM_SANCTUARY = new Set(["hospital", "clinic", "school", "church", "police", "council"]);
function rmLawfulHunters(dt) {
  if (typeof eRivalCid === "undefined" || typeof rmHunterLawful !== "function") return;
  const b = player.roof ? null : cityBuildingAt(player.x, player.y), safe = !!(b && RM_SANCTUARY.has(b.kind));
  RMG.lawT = (RMG.lawT || 0) - dt;
  for (let j = 0; j < MAX_E; j++) {
    if (!eAct[j] || eType[j] !== 98 || eRivalCid[j] < 0 || !rmHunterLawful(eRivalCid[j])) continue;
    if (!safe) continue;
    eFireCD[j] = Math.max(eFireCD[j], 0.8);
    const dx = eX[j] - player.x, dy = eY[j] - player.y, d = Math.hypot(dx, dy) || 1;
    if (d < 420) { eX[j] += dx / d * 140 * dt; eY[j] += dy / d * 140 * dt; }
    if (RMG.lawT <= 0 && typeof spawnSpeech === "function") { RMG.lawT = 9; spawnSpeech(eX[j], eY[j] - 24, (CHAR_RAW[eRivalCid[j]] ? CHAR_RAW[eRivalCid[j]][3] : "HUNTER").toUpperCase() + ": \"Not in there. I'll wait outside.\"", "#ffd166", 2.6); }
  }
}
// a pending cell's data arrived: rebuild what was drawn as "loading"
function rmOnTile(T) {
  if (!RG.real || !CITY.blockCache || T.z !== 14) return;
  const b = rmTileBox(14, T.x, T.y), mx0 = Math.max(0, Math.floor((b[0] - RM_PAD) / 1000)), mx1 = Math.min(63, Math.floor((b[2] + RM_PAD) / 1000)), my0 = Math.max(0, Math.floor((b[1] - RM_PAD) / 1000)), my1 = Math.min(63, Math.floor((b[3] + RM_PAD) / 1000));
  for (let my = my0; my <= my1; my++) for (let mx = mx0; mx <= mx1; mx++) {
    const key = mx + "," + my + ",0,0", B = CITY.blockCache.get(key);
    if (!B || !B.pending || !rmCellReady(mx, my)) continue;
    CITY.blockCache.delete(key);
    rmCellRebuilt(mx, my);
  }
}
function rmCellRebuilt(mx, my) {
  const pad = 240, tx0 = Math.floor((mx * 1000 - pad) * 2 / 128), tx1 = Math.floor(((mx + 1) * 1000 + pad) * 2 / 128), ty0 = Math.floor((my * 1000 - pad) * 2 / 128), ty1 = Math.floor(((my + 1) * 1000 + pad) * 2 / 128);
  for (const [k, C] of cityRT.chunks) if (C.cx >= tx0 && C.cx <= tx1 && C.cy >= ty0 && C.cy <= ty1) cityRT.chunks.delete(k);
  cityRT.last = null; cityRT.lastKey = -1; cityRT.visGen++;
  if (typeof cityRenderRefresh === "function" && CITY.on) cityRenderRefresh((mx * 1000 - pad) * 32 - CITY.orx, (my * 1000 - pad) * 32 - CITY.ory, (1000 + pad * 2) * 32, (1000 + pad * 2) * 32);
  if (typeof MAPV !== "undefined" && MAPV.tiles) { MAPV.tiles.clear(); MAPV.lastSig = ""; }
}
// EOF:js/realgen.js
