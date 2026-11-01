/* =========================================================================
   OMNI-SHIFT v14.2 — REAL MAP · ART (js/realart.js)
   Draws the real map: land use and land cover polygons, water with a soft
   shore, every road at its real width (pavements in town, double yellow
   centre lines, lane dashes, parking stalls, bridges with railings, rail
   lines), buildings with height-scaled shadows and roofs fitted to their
   real outlines (angled buildings drawn square to their own walls), the
   construction kit of Highway 365, and the minimap / full map tiles.
   ========================================================================= */
"use strict";

/* --- 1. styles --------------------------------------------------------------------------- */
const RM_LAND = {
  "lu:residential": ["grass", "#5f8b47", 1], "lu:commercial": ["concrete", "#b5b0a4", 2], "lu:retail": ["concrete", "#bab4a7", 2], "lu:industrial": ["gravel", "#8e897f", 2],
  "lu:railway": ["gravel", "#807a70", 2], "lu:garages": ["concrete", "#9d9991", 2], "lu:quarry": ["dirt", "#9c8c72", 2], "lu:school": ["grass", "#6b9551", 2], "lu:university": ["grass", "#689350", 2],
  "lu:college": ["grass", "#689350", 2], "lu:kindergarten": ["grass", "#6b9551", 2], "lu:hospital": ["grass", "#6b9551", 2], "lu:cemetery": ["grass", "#5e8c49", 3], "lu:stadium": ["concrete", "#a8a49b", 3],
  "lu:pitch": ["grass", "#4e9a45", 5], "lu:playground": ["sand", "#cdb98a", 5], "lu:track": ["packed", "#b05f3b", 5], "lu:military": ["dirt", "#7e795a", 2], "lu:zoo": ["grass", "#6a9450", 3],
  "lu:theme_park": ["concrete", "#b4ad9f", 3], "lu:dam": ["concrete", "#a0a0a0", 4],
  "lc:farmland": ["cropH", "#7b8f3f", 0], "lc:grass": ["grass", "#5c9046", 3], "lc:wood": ["woods", "#3d5e2d", 4], "lc:forest": ["woods", "#395a2b", 4], "lc:wetland": ["grass", "#4e6e4a", 4],
  "lc:sand": ["sand", "#d8c690", 4], "lc:rock": ["gravel", "#8a8a84", 4], "lc:ice": ["concrete", "#e8eef2", 4], "lc:farm": ["cropV", "#829640", 0],
  "park": ["grass", "#4f8c42", 3], "plaza": ["plaza", "#bab3a5", 6], "deck": ["concrete", "#9b988f", 7], "pier": ["boardwalk", "#8a6a44", 7],
  "aero:aerodrome": ["grass", "#6c9b52", 1], "aero:apron": ["concrete", "#9d9b95", 6], "aero:taxiway": ["asphalt", "#4b4d51", 7], "aero:runway": ["asphalt", "#3a3c40", 7], "aero:helipad": ["concrete", "#a2a2a2", 7]
};
function rmLandStyle(L) {
  if (L.src === "park") return RM_LAND.park;
  if (L.src === "lc") return RM_LAND["lc:" + L.cls] || (L.cls === "grass" ? RM_LAND["lc:grass"] : null);
  if (L.src === "lu") return RM_LAND["lu:" + L.cls] || null;
  return RM_LAND[L.cls] || null;
}
const RM_ROADCOL = { motorway: "#2b2d31", trunk: "#2e3034", primary: "#303237", secondary: "#323439", tertiary: "#35373c", minor: "#3a3c41", busway: "#3a3c41", raceway: "#2c2e32", service: "#3c3e43", track: "#8f7a5c", path: "#c6c1b5", hwy365: "#36383c", rail: "#6f6a64", transit: "#6f6a64" };
function rmPath(g, R, sc) { const n = R.length; if (n < 4) return; g.moveTo(R[0] * sc, R[1] * sc); for (let i = 2; i < n; i += 2) g.lineTo(R[i] * sc, R[i + 1] * sc); g.closePath(); }
function rmPolyFill(g, pg) { g.beginPath(); for (const R of pg) rmPath(g, R, 32); g.fill("evenodd"); }

/* --- 2. roads ---------------------------------------------------------------------------- */
function rmSegsIn(blocks, m0x, m0y, m1x, m1y) {
  const out = [], seen = new Set();
  for (const B of blocks) for (const s of (B.segs || [])) {
    const pad = s.w / 2 + 6;
    if (Math.max(s.ax, s.bx) < m0x - pad || Math.min(s.ax, s.bx) > m1x + pad || Math.max(s.ay, s.by) < m0y - pad || Math.min(s.ay, s.by) > m1y + pad) continue;
    const k = s.r.hwy ? "h" + Math.round(s.ax * 10) + "," + Math.round(s.ay * 10) : s;
    if (seen.has(k)) continue; seen.add(k); out.push(s);
  }
  out.sort((a, b) => (a.r.br === "bridge") - (b.r.br === "bridge") || (a.r.lay || 0) - (b.r.lay || 0) || a.r.rank - b.r.rank);
  return out;
}
function rmLine(g, s, w, col, off) {
  g.strokeStyle = col; g.lineWidth = w * 32; g.beginPath();
  if (off) { const L = Math.hypot(s.bx - s.ax, s.by - s.ay) || 1, nx = -(s.by - s.ay) / L * off, ny = (s.bx - s.ax) / L * off; g.moveTo((s.ax + nx) * 32, (s.ay + ny) * 32); g.lineTo((s.bx + nx) * 32, (s.by + ny) * 32); }
  else { g.moveTo(s.ax * 32, s.ay * 32); g.lineTo(s.bx * 32, s.by * 32); }
  g.stroke();
}
function rmRoadPass(g, segs, pass, cls) {
  if (!segs.length) return;
  const T = CITY.theme.g, town = cls === CL_DOWNTOWN || cls === CL_URBAN || cls === CL_SUBURB || cls === CL_INDUSTRIAL;
  g.save(); g.lineCap = "round"; g.lineJoin = "round";
  if (pass === 0) {
    for (const s of segs) {   // pavements, parking stalls, verges
      const R = s.r;
      if (R.svc === "parking_aisle") { rmLine(g, s, s.w + 10.8, T.lot || "#3a3c41"); continue; }
      if (R.hwy) { rmLine(g, s, s.w + 3, "#9c968a"); continue; }
      if (R.rank >= 3 && R.rank <= 6 && town && R.br !== "bridge" && !R.ramp) { rmLine(g, s, s.w + 4.6, T.walk); rmLine(g, s, s.w + 0.7, T.curb); }
      else if (R.rank >= 5 && R.br !== "bridge") rmLine(g, s, s.w + 2.4, crSh(T.grass, -0.12));
    }
  } else if (pass === 1) {
    for (const s of segs) {
      const R = s.r, k = R.kind;
      if (k === "rail" || k === "transit") { rmLine(g, s, 3.4, "#6f6a64"); continue; }
      if (R.br === "bridge") { g.save(); g.lineCap = "butt"; rmLine(g, s, s.w + 2.2, "rgba(0,0,0,0.35)"); rmLine(g, s, s.w + 1.4, "#8d8a84"); g.restore(); }
      let col = RM_ROADCOL[k] || "#3a3c41";
      if (k === "path") col = R.surf === "unpaved" || R.surf === "dirt" || R.surf === "gravel" || (!town && R.sub === "path") ? "#b9a988" : R.sub === "pedestrian" ? (T.plaza || "#b8b1a3") : "#c8c3b8";
      if (k === "service" && R.svc === "driveway") col = T.drive || "#9b9993";
      if (k === "track") col = R.surf === "paved" ? "#5a5c60" : "#93805f";
      if (R.constr) col = "#7a6a52";
      rmLine(g, s, s.w, col);
    }
  } else {
    // markings stop short of junctions (no lane dashes painted across a crossing road)
    const jn = new Map(); for (const s of segs) { if (s.r.rank < 3 || s.r.hwy) continue; for (const [x, y] of [[s.ax, s.ay], [s.bx, s.by]]) { const k = Math.round(x * 2) + "," + Math.round(y * 2); let e = jn.get(k); if (!e) jn.set(k, e = new Set()); e.add(s.r); } }
    const trim = (s) => { const L = Math.hypot(s.bx - s.ax, s.by - s.ay) || 1, ka = Math.round(s.ax * 2) + "," + Math.round(s.ay * 2), kb = Math.round(s.bx * 2) + "," + Math.round(s.by * 2), ta = jn.has(ka) && jn.get(ka).size > 1 ? Math.min(0.45, 7 / L) : 0, tb = jn.has(kb) && jn.get(kb).size > 1 ? Math.min(0.45, 7 / L) : 0; if (!ta && !tb) return s; return { ax: s.ax + (s.bx - s.ax) * ta, ay: s.ay + (s.by - s.ay) * ta, bx: s.bx - (s.bx - s.ax) * tb, by: s.by - (s.by - s.ay) * tb, w: s.w, r: s.r }; };
    const usa = RM.lon0 < -30 && RM.lon0 > -170, centre = usa ? T.line : T.line2;
    for (const s0 of segs) {
      const s = s0.r.rank >= 3 && !s0.r.hwy ? trim(s0) : s0;
      const R = s.r, k = R.kind;
      if (k === "rail" || k === "transit") {   // ties + two rails
        const L = Math.hypot(s.bx - s.ax, s.by - s.ay) || 1, ux = (s.bx - s.ax) / L, uy = (s.by - s.ay) / L;
        g.strokeStyle = "#4a3c30"; g.lineWidth = 7; g.lineCap = "butt"; g.beginPath();
        for (let d = 0; d < L; d += 0.7) { const x = s.ax + ux * d, y = s.ay + uy * d; g.moveTo((x - uy * 1.25) * 32, (y + ux * 1.25) * 32); g.lineTo((x + uy * 1.25) * 32, (y - ux * 1.25) * 32); }
        g.stroke(); g.lineCap = "round";
        for (const o of [-0.72, 0.72]) rmLine(g, s, 0.14, "#c5c9cd", o);
        continue;
      }
      if (R.svc === "parking_aisle") {   // stall lines both sides
        const L = Math.hypot(s.bx - s.ax, s.by - s.ay) || 1, ux = (s.bx - s.ax) / L, uy = (s.by - s.ay) / L, a = s.w / 2 + 0.2, b2 = s.w / 2 + 5.2;
        g.strokeStyle = "rgba(240,240,232,0.75)"; g.lineWidth = 3; g.lineCap = "butt"; g.beginPath();
        for (let d = 0.2; d < L; d += 2.75) for (const sd of [-1, 1]) { const x = s.ax + ux * d, y = s.ay + uy * d; g.moveTo((x - uy * a * sd) * 32, (y + ux * a * sd) * 32); g.lineTo((x - uy * b2 * sd) * 32, (y + ux * b2 * sd) * 32); }
        g.stroke(); g.lineCap = "round"; continue;
      }
      if (R.hwy) { rmHwyMarks(g, s); continue; }
      if (k === "path" || k === "track" || k === "service") continue;
      const dual = R.ow && (k === "motorway" || k === "trunk" || k === "primary");
      if (!R.ow && (k === "primary" || k === "secondary" || k === "trunk")) { if (usa) for (const o of [-0.16, 0.16]) rmLine(g, s, 0.12, centre, o); else { g.setLineDash([4 * 32, 2 * 32]); rmLine(g, s, 0.12, centre); g.setLineDash([]); } }
      else if (!R.ow && k === "tertiary") { g.setLineDash([3 * 32, 3 * 32]); rmLine(g, s, 0.12, centre); g.setLineDash([]); }
      if (s.w >= 13 || dual) {   // lane dashes
        g.setLineDash([3 * 32, 9 * 32]);
        const lanes = Math.max(2, Math.round(s.w / 3.6)), lw = s.w / lanes;
        for (let q = 1; q < lanes; q++) { const o = -s.w / 2 + lw * q; if (!R.ow && Math.abs(o) < 0.5) continue; rmLine(g, s, 0.12, T.line2, o); }
        g.setLineDash([]);
      }
      if (k === "motorway" || k === "trunk") for (const o of [-(s.w / 2 - 0.5), s.w / 2 - 0.5]) rmLine(g, s, 0.12, T.line2, o);
    }
  }
  g.restore();
}
// Highway 365: lanes, the median barrier, milled closed lanes, the outer barrier and fence
function rmHwyMarks(g, s) {
  const L = Math.hypot(s.bx - s.ax, s.by - s.ay) || 1, mid = ((s.t0 || 0) + (s.t1 || 0)) / 2, z = rmZoneAt(mid);
  // closed lanes: milled asphalt with grooves
  if (z && mid > z.s0 - 20 && mid < z.s1) { g.save(); g.lineCap = "butt"; for (const sd of z.lanes === 2 ? [1, -1] : [z.side]) {
    rmLine(g, s, 3.6, "#4a4844", sd * 6.0);
    g.setLineDash([2, 6]); rmLine(g, s, 3.2, "rgba(20,18,16,0.35)", sd * 6.0); g.setLineDash([]);
  } g.restore(); }
  g.setLineDash([3 * 32, 9 * 32]); for (const o of [-4.2, 4.2]) rmLine(g, s, 0.13, "#e7e7e2", o); g.setLineDash([]);
  for (const o of [-7.9, -0.75, 0.75, 7.9]) rmLine(g, s, 0.12, Math.abs(o) < 1 ? "#e3c24a" : "#e7e7e2", o);
  // median barrier (gaps at the crossovers)
  if (!rmInCross(mid)) { g.save(); g.lineCap = "butt"; rmLine(g, s, 0.95, "rgba(0,0,0,0.3)", 0.18); rmLine(g, s, 0.8, "#bdb8ae"); rmLine(g, s, 0.22, "#d8d4ca"); g.restore(); }
  // outer barrier + chain-link fence beyond it
  g.save(); g.lineCap = "butt";
  rmLine(g, s, 1.1, "rgba(0,0,0,0.3)", -(RM_HWY_W / 2 + 0.9)); rmLine(g, s, 0.9, "#bdb8ae", -(RM_HWY_W / 2 + 1.0)); rmLine(g, s, 0.25, "#d8d4ca", -(RM_HWY_W / 2 + 1.0));
  g.setLineDash([2, 4]); rmLine(g, s, 0.12, "#8a9096", -(RM_HWY_W / 2 + 1.9)); g.setLineDash([]);
  g.restore();
}
// EOF part 1 (realart.js continues)

/* --- 3. buildings: height shadows, angled plans drawn square to their walls ------------------ */
const RM_NOPART = [{ x: 0, y: 0, w: 0, h: 0 }];
function rmOutline(b) {   // world-px rings of what the walls follow
  if (b.rmOut) return b.rmOut;
  const F = b.rm.F;
  if (!b.rm.rect || b.planType === "rpoly" || b.type === "rpoly") b.rmOut = b.rm.pg.map(R => { const o = new Float32Array(R.length); for (let i = 0; i < R.length; i++) o[i] = R[i] * 32; return o; });
  else if (b.type === "rmrot") { const X = rmRotXf(b), cs = [[0, 0], [F.W, 0], [F.W, F.H], [0, F.H]].map(([u, v]) => X.toW(u, v)), o = new Float32Array(8); cs.forEach((c, i) => { o[i * 2] = (b.x + c[0]) * 16; o[i * 2 + 1] = (b.y + c[1]) * 16; }); b.rmOut = [o]; }
  else b.rmOut = [new Float32Array([b.x * 16, b.y * 16, (b.x + b.w) * 16, b.y * 16, (b.x + b.w) * 16, (b.y + b.h) * 16, b.x * 16, (b.y + b.h) * 16])];
  return b.rmOut;
}
function rmBldShadow(g, b) {
  const h = Math.max(3, b.rm.h || 5), d = Math.min(14, 1.2 + h * 0.2) * 32, dx = d * 0.55, dy = d * 0.8;
  g.save(); g.fillStyle = "rgba(0,0,0,0.2)"; g.beginPath();
  for (const R of rmOutline(b)) { const n = R.length; g.moveTo(R[0] + dx, R[1] + dy); for (let i = 2; i < n; i += 2) g.lineTo(R[i] + dx, R[i + 1] + dy); g.closePath(); }
  g.fill("evenodd"); g.restore();
}
function rmRotLocalRect(b, X, tx0, ty0, tx1, ty1) {
  const cs = [[tx0, ty0], [tx1, ty0], [tx0, ty1], [tx1, ty1]].map(([x, y]) => X.toL(x - b.x, y - b.y)), us = cs.map(c => c[0]), vs = cs.map(c => c[1]);
  return [Math.floor(Math.min(...us)) - 2, Math.floor(Math.min(...vs)) - 2, Math.ceil(Math.max(...us)) + 2, Math.ceil(Math.max(...vs)) + 2];
}
(function rmBuildingWire() {
  if (typeof crBuilding !== "function") return;
  const RM_CB0 = crBuilding;
  window.crBuilding = crBuilding = function (g, b, tx0, ty0, tx1, ty1, layer) {
    if (!b.rm) return RM_CB0(g, b, tx0, ty0, tx1, ty1, layer);
    const G = cityInterior(b);
    g.save();
    if (layer === 0) {   // shadow, then floors clipped to the real outline (room rects of odd shapes reach past the walls)
      rmBldShadow(g, b);
      g.beginPath(); for (const R of rmOutline(b)) { const n = R.length; g.moveTo(R[0], R[1]); for (let i = 2; i < n; i += 2) g.lineTo(R[i], R[i + 1]); g.closePath(); }
      g.clip("evenodd");
    }
    if (b.type === "rmrot") {
      const X = rmRotXf(b), Gl = G.local, r = rmRotLocalRect(b, X, tx0, ty0, tx1, ty1), P0 = Gl.parts;
      g.transform(X.ex[0], X.ex[1], X.ey[0], X.ey[1], (b.x + X.ox2) * 16, (b.y + X.oy2) * 16); Gl.parts = RM_NOPART;
      try { RM_CB0(g, b.bl, r[0], r[1], r[2], r[3], layer); } finally { Gl.parts = P0; g.restore(); }
      return;
    }
    const P0 = G.parts; G.parts = RM_NOPART;
    try { return RM_CB0(g, b, tx0, ty0, tx1, ty1, layer); } finally { G.parts = P0; g.restore(); }
  };
  if (typeof crFurn === "function") {
    const RM_CF0 = crFurn;
    window.crFurn = crFurn = function (g, f, b, P, fam, st) {
      if (!f.lf || !b.bl) return RM_CF0(g, f, b, P, fam, st);
      const X = rmRotXf(b);
      g.save(); g.transform(X.ex[0], X.ex[1], X.ey[0], X.ey[1], (b.x + X.ox2) * 16, (b.y + X.oy2) * 16);
      try { RM_CF0(g, f.lf, b.bl, P, fam, st); } finally { g.restore(); }
    };
  }
  if (typeof crRoofCanvas === "function") {
    const RM_RC0 = crRoofCanvas;
    window.crRoofCanvas = crRoofCanvas = function (b) {
      if (!b.rm) return RM_RC0(b);
      if (b.type !== "rmrot" && b.type !== "rpoly") return RM_RC0(b);   // square & facing the street: the classic roofs fit
      let R = CR.roofs.get(b.uid);
      if (R) { R.used = CR.frame; return R; }
      R = rmRoof(b, RM_RC0); CR.roofs.set(b.uid, R);
      if (CR.roofs.size > 70) { const arr = [...CR.roofs.entries()].sort((a, q) => a[1].used - q[1].used); for (let i = 0; i < 16; i++) CR.roofs.delete(arr[i][0]); }
      return R;
    };
  }
})();
// roofs that follow the real outline (angled classic plans reuse the classic roof, turned)
function rmRoof(b, RC0) {
  const pad = 6, W = b.w * 16 + pad * 2, H = b.h * 16 + pad * 2, sc = Math.min(1, Math.sqrt(520000 / (W * H)));
  const c = crCanvas(Math.max(2, Math.ceil(W * sc)), Math.max(2, Math.ceil(H * sc))), g = c.getContext("2d"), T = CITY.theme, r = T.r;
  g.scale(sc, sc); g.translate(pad - b.x * 16, pad - b.y * 16);
  const out = rmOutline(b), clipOut = () => { g.beginPath(); for (const R of out) { const n = R.length; g.moveTo(R[0], R[1]); for (let i = 2; i < n; i += 2) g.lineTo(R[i], R[i + 1]); g.closePath(); } };
  if (b.type === "rmrot" && b.planType !== "rpoly") {
    const L = RC0(b.bl), X = rmRotXf(b);
    g.save(); clipOut(); g.clip("evenodd");
    g.transform(X.ex[0], X.ex[1], X.ey[0], X.ey[1], (b.x + X.ox2) * 16, (b.y + X.oy2) * 16);
    g.drawImage(L.c, L.x0, L.y0, L.w, L.h); g.restore();
  } else {
    const kind = b.kind, tall = (b.rm.h || 0) >= 24, metal = kind === "warehouse" || kind === "autorepair" || kind === "garage" || kind === "barn", homey = kind === "house" || kind === "apartment" && b.rm.area < 900;
    const base = homey ? (b.seed & 1 ? r.hip[0] : r.gable[0]) : metal ? "#8e979e" : tall ? "#5f6266" : kind === "church" ? "#5a5f66" : r.flat;
    g.save(); clipOut(); g.clip("evenodd");
    const bb = rmBBox(out[0]);
    g.fillStyle = crPat(homey ? "planks" : metal ? "grate" : "gravel", base); g.fillRect(bb[0] - 2, bb[1] - 2, bb[2] - bb[0] + 4, bb[3] - bb[1] + 4);
    if (metal) { g.strokeStyle = "rgba(255,255,255,0.12)"; g.lineWidth = 2; const F = b.rm.F, ux = F.ex[0], uy = F.ex[1]; g.beginPath(); for (let k = -60; k < 60; k++) { const ox = (bb[0] + bb[2]) / 2 + ux * k * 24, oy = (bb[1] + bb[3]) / 2 + uy * k * 24; g.moveTo(ox - F.ey[0] * 4000, oy - F.ey[1] * 4000); g.lineTo(ox + F.ey[0] * 4000, oy + F.ey[1] * 4000); } g.stroke(); }
    // sun from the north-west: a soft gradient over the whole roof
    const gr = g.createLinearGradient(bb[0], bb[1], bb[2], bb[3]); gr.addColorStop(0, "rgba(255,255,255,0.12)"); gr.addColorStop(1, "rgba(0,0,0,0.16)"); g.fillStyle = gr; g.fillRect(bb[0], bb[1], bb[2] - bb[0], bb[3] - bb[1]);
    // rooftop kit on flat roofs: HVAC boxes, a mechanical penthouse on towers
    if (!homey) {
      const area = b.rm.area || 100, n = Math.min(14, Math.max(1, Math.floor(area / 260))), hh = b.seed >>> 0;
      for (let k = 0; k < n; k++) {
        const x = bb[0] + 20 + ((hh >>> (k % 24)) * 7919 + k * 104729) % Math.max(1, bb[2] - bb[0] - 60), y = bb[1] + 20 + ((hh >>> ((k * 3) % 24)) * 6271 + k * 130363) % Math.max(1, bb[3] - bb[1] - 50);
        if (!rmPipPoly(x / 32 + 0.5, y / 32 + 0.4, b.rm.pg)) continue;
        g.fillStyle = "rgba(0,0,0,0.25)"; g.fillRect(x + 3, y + 3, 26, 20); g.fillStyle = r.hvac; g.fillRect(x, y, 26, 20); g.fillStyle = crSh(r.hvac, -0.3); g.beginPath(); g.arc(x + 13, y + 10, 7, 0, 7); g.fill();
      }
      if (tall) { const cx = (bb[0] + bb[2]) / 2, cy = (bb[1] + bb[3]) / 2, w = (bb[2] - bb[0]) * 0.28, h2 = (bb[3] - bb[1]) * 0.24; g.fillStyle = "rgba(0,0,0,0.3)"; g.fillRect(cx - w / 2 + 8, cy - h2 / 2 + 10, w, h2); g.fillStyle = "#77797c"; g.fillRect(cx - w / 2, cy - h2 / 2, w, h2); if ((b.rm.h || 0) >= 70 && area > 1500) { g.strokeStyle = "#f2f2f2"; g.lineWidth = 3; g.beginPath(); g.arc(cx + w, cy + h2, 38, 0, 7); g.stroke(); g.fillStyle = "#f2f2f2"; g.font = "bold 26px sans-serif"; g.textAlign = "center"; g.fillText("H", cx + w, cy + h2 + 9); } }
    } else { g.strokeStyle = crSh(base, 0.25); g.lineWidth = 2; const F = b.rm.F, cx = (bb[0] + bb[2]) / 2, cy = (bb[1] + bb[3]) / 2, L = Math.max(bb[2] - bb[0], bb[3] - bb[1]); const ax = F.W >= F.H ? F.ex : F.ey; g.beginPath(); g.moveTo(cx - ax[0] * L * 0.32, cy - ax[1] * L * 0.32); g.lineTo(cx + ax[0] * L * 0.32, cy + ax[1] * L * 0.32); g.stroke(); }
    g.restore();
    // parapet / eaves along the real outline
    g.lineJoin = "round"; clipOut(); g.strokeStyle = crSh(base, -0.35); g.lineWidth = homey ? 3 : 5; g.stroke();
    if (!homey) { clipOut(); g.strokeStyle = crSh(base, 0.14); g.lineWidth = 1.5; g.save(); clipOut(); g.clip("evenodd"); g.lineWidth = 9; g.strokeStyle = "rgba(255,255,255,0.08)"; g.stroke(); g.restore(); }
  }
  return { c, x0: b.x * 16 - pad, y0: b.y * 16 - pad, w: W, h: H, used: CR.frame, x1: b.x * 16 + W, y1: b.y * 16 + H };
}
// EOF part 2 (realart.js continues)

/* --- 4. props: the construction kit, tiny sheds ------------------------------------------- */
const RM_SIGN_TXT = ["ROAD WORK AHEAD", "LANE CLOSED AHEAD", "WORK ZONE 45", "HWY 365 · UNDER CONSTRUCTION"];
function rmPropArt(g, p) {
  const cx = (p.x + p.w / 2) * 16, cy = (p.y + p.h / 2) * 16, W = (p.rw || p.w) * 16, H = (p.rh || p.h) * 16;
  g.save(); g.translate(cx, cy); if (p.ang) g.rotate(p.ang);
  const sh = (w, h, r) => { g.fillStyle = "rgba(0,0,0,0.28)"; if (r) { g.beginPath(); g.arc(3, 4, r, 0, 7); g.fill(); } else g.fillRect(-w / 2 + 3, -h / 2 + 4, w, h); };
  switch (p.t) {
    case "rmcone": sh(0, 0, 8); g.fillStyle = "#ff6d00"; g.fillRect(-8, -8, 16, 16); g.fillStyle = "#ff8f3a"; g.beginPath(); g.arc(0, 0, 7, 0, 7); g.fill(); g.fillStyle = "#f5f5f5"; g.beginPath(); g.arc(0, 0, 4.4, 0, 7); g.fill(); g.fillStyle = "#ff6d00"; g.beginPath(); g.arc(0, 0, 2.2, 0, 7); g.fill(); break;
    case "rmdrum": sh(0, 0, 12); for (let k = 4; k >= 0; k--) { g.fillStyle = k & 1 ? "#f5f5f5" : "#ff6d00"; g.beginPath(); g.arc(0, 0, 4 + k * 2, 0, 7); g.fill(); } g.fillStyle = "#ffd54f"; g.beginPath(); g.arc(0, 0, 2.2, 0, 7); g.fill(); break;
    case "rmsign": sh(W, 8); g.fillStyle = "#3a3a3a"; g.fillRect(-W / 2, -2, W, 4); g.save(); g.rotate(Math.PI / 4); g.fillStyle = "#ff8f00"; g.fillRect(-10, -10, 20, 20); g.strokeStyle = "#1a1a1a"; g.lineWidth = 1.5; g.strokeRect(-8, -8, 16, 16); g.restore(); g.fillStyle = "#1a1a1a"; g.font = "800 5px sans-serif"; g.textAlign = "center"; g.fillText((RM_SIGN_TXT[p.v | 0] || "").split(" ")[0], 0, 2); break;
    case "rmarrow": sh(W, H); g.fillStyle = "#e0b000"; g.fillRect(-W / 2, -H / 2, W, H); g.fillStyle = "#151515"; g.fillRect(-W / 2 + 3, -H / 2 + 3, W - 6, H * 0.6); g.fillStyle = "#ffc400"; { const d = p.v < 0 ? -1 : 1; for (let k = -3; k <= 3; k++) { g.beginPath(); g.arc(k * 3.2 * d, -H / 2 + 3 + H * 0.3, 1.3, 0, 7); g.fill(); } for (const q of [-1, 1]) { g.beginPath(); g.arc(9 * d - 3 * d, -H / 2 + 3 + H * 0.3 + q * 3.2, 1.3, 0, 7); g.fill(); } } g.fillStyle = "#2a2a2a"; g.fillRect(-W / 2 - 2, H / 2 - 6, 4, 6); g.fillRect(W / 2 - 2, H / 2 - 6, 4, 6); break;
    case "rmjersey": sh(W, H); g.fillStyle = "#bfbab0"; g.fillRect(-W / 2, -H / 2, W, H); g.fillStyle = "#d9d5cb"; g.fillRect(-W / 2, -H / 6, W, H / 3); g.fillStyle = "rgba(0,0,0,0.25)"; g.fillRect(W / 2 - 1.5, -H / 2, 1.5, H); g.fillStyle = "#ff6d00"; g.fillRect(-W / 2 + W * 0.45, -H / 2, W * 0.1, H); break;
    case "rmexcav": { sh(W * 0.8, H); g.fillStyle = "#2a2a2a"; g.fillRect(-W / 2, -H / 2, W * 0.7, 9); g.fillRect(-W / 2, H / 2 - 9, W * 0.7, 9); g.fillStyle = "#f2b705"; g.fillRect(-W / 2 + 6, -H / 2 + 7, W * 0.55, H - 14); g.fillStyle = "#1e2a36"; g.fillRect(-W / 2 + 10, -H / 2 + 10, 14, 14); g.strokeStyle = "#d89c00"; g.lineWidth = 8; g.lineCap = "round"; g.beginPath(); g.moveTo(-W / 2 + W * 0.45, 0); g.lineTo(W * 0.2, -4); g.lineTo(W / 2 - 10, 6); g.stroke(); g.fillStyle = "#555"; g.fillRect(W / 2 - 16, 0, 14, 14); break; }
    case "rmroller": sh(W, H); g.fillStyle = "#f2b705"; g.fillRect(-W / 2 + 12, -H / 2 + 2, W - 24, H - 4); g.fillStyle = "#4a4a4a"; g.fillRect(-W / 2, -H / 2, 12, H); g.fillRect(W / 2 - 12, -H / 2, 12, H); g.fillStyle = "#1e2a36"; g.fillRect(-6, -H / 2 + 6, 12, H - 12); break;
    case "rmdump": sh(W, H); g.fillStyle = "#e65100"; g.fillRect(-W / 2, -H / 2, W * 0.66, H); g.fillStyle = "#6d4c41"; g.fillRect(-W / 2 + 4, -H / 2 + 4, W * 0.66 - 8, H - 8); g.fillStyle = "#f2b705"; g.fillRect(W * 0.16 + 2, -H / 2 + 2, W * 0.34 - 4, H - 4); g.fillStyle = "#1e2a36"; g.fillRect(W * 0.3, -H / 2 + 5, 8, H - 10); break;
    case "rmgravel": { const gr = g.createRadialGradient(-W * 0.1, -H * 0.15, 2, 0, 0, Math.max(W, H) / 2); gr.addColorStop(0, "#b9b2a6"); gr.addColorStop(1, "#7d776d"); g.fillStyle = gr; g.beginPath(); g.ellipse(0, 0, W / 2, H / 2, 0, 0, 7); g.fill(); break; }
    case "rmjohn": sh(W, H); g.fillStyle = "#1565c0"; g.fillRect(-W / 2, -H / 2, W, H); g.fillStyle = "#e3f2fd"; g.fillRect(-W / 2 + 3, -H / 2 + 3, W - 6, 3); break;
    case "rmworker": case "rmcop": {
      sh(0, 0, 6); const cop = p.t === "rmcop";
      g.fillStyle = cop ? "#1a2a4a" : "#3e2723"; g.beginPath(); g.ellipse(0, 0, 7, 5, 0, 0, 7); g.fill();
      g.fillStyle = cop ? "#c6ff00" : "#ff6d00"; g.fillRect(-6, -3, 12, 6); g.fillStyle = "#e0e0e0"; g.fillRect(-6, -0.6, 12, 1.2);
      g.fillStyle = cop ? "#0d1b3a" : "#ffd600"; g.beginPath(); g.arc(0, 0, 3.6, 0, 7); g.fill();
      if (cop) { g.strokeStyle = "#c62828"; g.lineWidth = 2; g.beginPath(); g.moveTo(5, 0); g.lineTo(13 * (p.v || 1), -6); g.stroke(); g.fillStyle = "#ff1744"; g.fillRect(13 * (p.v || 1) - 3, -9, 6, 6); }
      break;
    }
    case "rmplate": g.fillStyle = "#6f7377"; g.fillRect(-W / 2, -H / 2, W, H); g.strokeStyle = "rgba(255,255,255,0.12)"; g.lineWidth = 1; for (let k = -W; k < W; k += 6) { g.beginPath(); g.moveTo(k, -H / 2); g.lineTo(k + H, H / 2); g.stroke(); } g.strokeStyle = "#3e4246"; g.lineWidth = 1.5; g.strokeRect(-W / 2, -H / 2, W, H); break;
    default: break;
  }
  g.restore();
}
function rmBoxArt(g, p) {   // a tiny shed / kiosk / utility box: a little roof on its real outline
  const pg = p.pg; if (!pg || pg.length < 3) return;
  const d = Math.min(6, 1 + (p.hgt || 3) * 0.2) * 32;
  g.fillStyle = "rgba(0,0,0,0.22)"; g.beginPath(); g.moveTo(pg[0][0] * 16 + d * 0.55, pg[0][1] * 16 + d * 0.8); for (const q of pg) g.lineTo(q[0] * 16 + d * 0.55, q[1] * 16 + d * 0.8); g.closePath(); g.fill();
  g.fillStyle = "#7f7c74"; g.beginPath(); g.moveTo(pg[0][0] * 16, pg[0][1] * 16); for (const q of pg) g.lineTo(q[0] * 16, q[1] * 16); g.closePath(); g.fill();
  g.strokeStyle = "#4e4b45"; g.lineWidth = 2; g.stroke();
}
(function rmPropWire() {
  if (typeof crProp !== "function") return;
  const RM_CP0 = crProp;
  window.crProp = crProp = function (g, p, h) {
    if (p.t === "rmpolice") {   // a cruiser on the shoulder, lights going
      const cx = (p.x + p.w / 2) * 16, cy = (p.y + p.h / 2) * 16, o = p.o | 0, W = p.w * 16, H = p.h * 16, L = (o & 1) ? H : W, D = (o & 1) ? W : H;
      for (const [c, k] of [["rgba(255,23,68,0.3)", -1], ["rgba(41,121,255,0.3)", 1]]) { const gr = g.createRadialGradient(cx + k * 12, cy, 2, cx + k * 12, cy, 70); gr.addColorStop(0, c); gr.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = gr; g.beginPath(); g.arc(cx + k * 12, cy, 70, 0, 7); g.fill(); }
      g.save(); g.translate(cx, cy); g.rotate(o * Math.PI / 2 + (p.ang || 0)); try { crVehicle(g, "police", Math.min(L, D), Math.max(L, D), 0, h, false, false); } finally { g.restore(); }
      return;
    }
    if (p.t && p.t.charCodeAt(0) === 114 && p.t.charCodeAt(1) === 109) { if (p.t === "rmbox") return rmBoxArt(g, p); return rmPropArt(g, p); }
    return RM_CP0(g, p, h);
  };
  if (typeof VEH_BREAK !== "undefined") Object.assign(VEH_BREAK, { rmcone: 0.5, rmdrum: 1.5, rmsign: 2.5, rmjohn: 3.5, rmplate: 99 });
})();
// EOF part 3 (realart.js continues)

/* --- 5. the bake -------------------------------------------------------------------------- */
function rmBarrierPath(g, off) {   // rounded square at a given offset from the highway centre line (px)
  const hs = (RM_HALF - RM_HWY_IN - RM_HWY_W / 2 - off) * 32, R = Math.max(1, (RM_HWY_R - off) * 32), c = 32000 * 32;
  g.moveTo(c - hs + R, c - hs); g.arcTo(c + hs, c - hs, c + hs, c + hs, R); g.arcTo(c + hs, c + hs, c - hs, c + hs, R); g.arcTo(c - hs, c + hs, c - hs, c - hs, R); g.arcTo(c - hs, c - hs, c + hs, c - hs, R); g.closePath();
}
function rmBake(rx, ry) {
  const t0 = performance.now(), S = CR.TS, cv = crCanvas(S, S), g = cv.getContext("2d");
  const wx0 = rx * S, wy0 = ry * S, m0x = wx0 / 32, m0y = wy0 / 32, m1x = m0x + 16, m1y = m0y + 16, tx0 = rx * 32, ty0 = ry * 32, tx1 = tx0 + 32, ty1 = ty0 + 32;
  g.translate(-wx0, -wy0);
  const T = CITY.theme;
  try {
    if (wx0 >= CITY.WORLD_T * 16 || wy0 >= CITY.WORLD_T * 16) { g.fillStyle = "#000"; g.fillRect(wx0, wy0, S, S); return cv; }
    for (let my = Math.floor(m0y / 1000); my <= Math.floor((m1y - 0.01) / 1000); my++) for (let mx = Math.floor(m0x / 1000); mx <= Math.floor((m1x - 0.01) / 1000); mx++) {
      const [pn, col] = crClassGround(cityMacroClass(mx, my));
      g.fillStyle = crPat(pn, col);
      const ax = Math.max(wx0, mx * 32000), ay = Math.max(wy0, my * 32000), bx = Math.min(wx0 + S, (mx + 1) * 32000), by = Math.min(wy0 + S, (my + 1) * 32000);
      g.fillRect(ax, ay, bx - ax, by - ay);
    }
    const blocks = cityBlocksInRect(m0x, m0y, m1x, m1y), pending = blocks.some(B => B.pending && B.mx === Math.floor((m0x + 8) / 1000) && B.my === Math.floor((m0y + 8) / 1000));
    const lands = [], seen = new Set(), waters = [], wways = [];
    for (const B of blocks) if (B.rmd) {
      for (const L of B.rmd.land) if (!seen.has(L) && rmBoxHit(L.bb, m0x - 1, m0y - 1, m1x + 1, m1y + 1)) { seen.add(L); const st = rmLandStyle(L); if (st) lands.push([st[2], L, st]); }
      for (const A of B.rmd.aero) if (!seen.has(A) && A.pg && rmBoxHit(A.bb, m0x - 1, m0y - 1, m1x + 1, m1y + 1)) { seen.add(A); const st = RM_LAND["aero:" + A.cls]; if (st) lands.push([st[2], A, st]); }
      for (const w of B.rmd.water) if (!seen.has(w) && rmBoxHit(w.bb, m0x - 4, m0y - 4, m1x + 4, m1y + 4)) { seen.add(w); waters.push(w); }
      for (const w of B.rmd.wways) if (!seen.has(w) && rmBoxHit(w.bb, m0x - 12, m0y - 12, m1x + 12, m1y + 12)) { seen.add(w); wways.push(w); }
    }
    lands.sort((a, b) => a[0] - b[0]);
    for (const [, L, st] of lands) { g.fillStyle = crPat(st[0], st[1]); rmPolyFill(g, L.pg); }
    // runway markings
    for (const [, A] of lands) if (A.cls === "runway" && A.pg) { g.save(); g.beginPath(); for (const R of A.pg) rmPath(g, R, 32); g.clip("evenodd"); g.strokeStyle = "rgba(240,240,232,0.7)"; g.lineWidth = 12; g.setLineDash([30 * 32 / 10, 20 * 32 / 10]); const bb = A.bb; g.beginPath(); if (bb[2] - bb[0] > bb[3] - bb[1]) { g.moveTo(bb[0] * 32, (bb[1] + bb[3]) * 16); g.lineTo(bb[2] * 32, (bb[1] + bb[3]) * 16); } else { g.moveTo((bb[0] + bb[2]) * 16, bb[1] * 32); g.lineTo((bb[0] + bb[2]) * 16, bb[3] * 32); } g.stroke(); g.restore(); }
    // water: a soft shore, then the water
    if (waters.length) {
      g.save(); g.lineJoin = "round";
      for (const w of waters) { g.strokeStyle = crSh(T.g.water, 0.25); g.lineWidth = 2.2 * 32; g.beginPath(); for (const R of w.pg) rmPath(g, R, 32); g.stroke(); }
      for (const w of waters) { g.fillStyle = crPat("water", w.cls === "swimming_pool" ? T.g.pool : T.g.water); rmPolyFill(g, w.pg); }
      g.restore();
    }
    // streams, ditches, canals and rivers drawn as lines
    if (wways.length) { g.save(); g.lineCap = "round"; g.lineJoin = "round"; for (const w of wways) { const wd = w.cls === "river" ? 10 : w.cls === "canal" ? 7 : w.cls === "stream" ? 2.4 : 1.4; g.strokeStyle = crPat("water", T.g.water); g.lineWidth = wd * 32; g.beginPath(); const a = w.pts; g.moveTo(a[0] * 32, a[1] * 32); for (let i = 2; i < a.length; i += 2) g.lineTo(a[i] * 32, a[i + 1] * 32); g.stroke(); } g.restore(); }
    const cls = cityMacroClass(Math.floor((m0x + 8) / 1000), Math.floor((m0y + 8) / 1000)), segs = rmSegsIn(blocks, m0x, m0y, m1x, m1y);
    rmRoadPass(g, segs, 0, cls); rmRoadPass(g, segs, 1, cls); rmRoadPass(g, segs, 2, cls);
    const blds = [], props = [];
    for (const B of blocks) {
      for (const b of B.blds) if (b.x + b.w >= tx0 - 1 && b.x <= tx1 + 1 && b.y + b.h >= ty0 - 1 && b.y <= ty1 + 1) blds.push(b);
      for (let pi = 0; pi < B.props.length; pi++) { const p = B.props[pi]; if (p.t === "tree" || p.x + p.w < tx0 - 6 || p.x > tx1 + 6 || p.y + p.h < ty0 - 6 || p.y > ty1 + 6) continue; if (cityRT.used.has(B.key + "|" + pi)) continue; props.push(p); }
    }
    // the tallest buildings' shadows fall over their neighbours: draw low ones first
    blds.sort((a, b) => (a.rm ? a.rm.h : 0) - (b.rm ? b.rm.h : 0));
    for (const p of props) if (p.t === "rmplate") crProp(g, p, 0);
    for (const b of blds) crBuilding(g, b, tx0, ty0, tx1, ty1, 0);
    for (const b of blds) crBuilding(g, b, tx0, ty0, tx1, ty1, 1);
    const P = T.fu, fam = crFam(), st = P.style;
    for (const b of blds) {
      const G = b.int;
      for (let fi = 0; fi < G.furn.length; fi++) { const f = G.furn[fi]; if (b.x + f.x + f.w < tx0 - 1 || b.x + f.x > tx1 + 1 || b.y + f.y + f.h < ty0 - 1 || b.y + f.y > ty1 + 1) continue; if (cityRT.used.has(b.uid + ":f" + fi)) continue; crFurn(g, f, b, P, fam, st); }
    }
    for (const p of props) if (p.t !== "rmplate" && p.t !== "streetlight" && p.t !== "pole" && p.t !== "trafficlight") crProp(g, p, cH(CITY.seed, p.x | 0, p.y | 0, 5));
    const tseen = new Set();
    for (let cy = (ty0 - 8) >> 7; cy <= (ty1 + 8) >> 7; cy++) for (let cx = (tx0 - 8) >> 7; cx <= (tx1 + 8) >> 7; cx++) {
      const C = cityChunk(cx, cy);
      for (const t of C.trees) { if (tseen.has(t) || t.x < tx0 - 8 || t.x > tx1 + 8 || t.y < ty0 - 8 || t.y > ty1 + 8) continue; tseen.add(t); crTree(g, t.x * 16 + 8, t.y * 16 + 8, t, cH(CITY.seed, t.x * 7 | 0, t.y * 7 | 0, 3)); }
    }
    for (const p of props) if (p.t === "streetlight" || p.t === "pole" || p.t === "trafficlight") crProp(g, p, 0);
    // beyond the border: fenced-off construction land
    if (Math.min(rmEdgeDist(m0x, m0y), rmEdgeDist(m1x, m1y), rmEdgeDist(m0x, m1y), rmEdgeDist(m1x, m0y)) < 60) {
      g.save(); g.beginPath(); g.rect(wx0, wy0, S, S); rmBarrierPath(g, -(RM_HWY_W / 2 + 1.6)); g.fillStyle = crPat("dirt", "#7d6e58"); g.fill("evenodd");
      g.fillStyle = "rgba(10,12,16,0.38)"; g.fill("evenodd"); g.restore();
    }
    if (pending) { g.save(); g.fillStyle = "rgba(12,18,26,0.28)"; g.fillRect(wx0, wy0, S, S); g.strokeStyle = "rgba(128,222,234,0.12)"; g.lineWidth = 6; g.beginPath(); for (let k = -S; k < S; k += 48) { g.moveTo(wx0 + k, wy0); g.lineTo(wx0 + k + S, wy0 + S); } g.stroke(); g.restore(); }
  } catch (e) { if (window.trackProgress) window.trackProgress("rmBake " + rx + "," + ry + ": " + e.message, true); else console.warn(e); }
  CR.bakeMs = performance.now() - t0; CR.baked++;
  return cv;
}
// EOF part 4 (realart.js continues)

/* --- 6. map tiles (minimap, full map, location preview) ----------------------------------------- */
function rmMapTile(g, m0x, m0y, mpp, S) {
  const span = 256 * mpp, X = m => (m - m0x) / mpp, Y = m => (m - m0y) / mpp, m1x = m0x + span, m1y = m0y + span;
  g.fillStyle = S.bg; g.fillRect(0, 0, 256, 256);
  for (let my = Math.max(0, Math.floor(m0y / 1000)); my <= Math.min(63, Math.floor(m1y / 1000)); my++) for (let mx = Math.max(0, Math.floor(m0x / 1000)); mx <= Math.min(63, Math.floor(m1x / 1000)); mx++) { g.fillStyle = S.land[cityMacroClass(mx, my)]; g.fillRect(X(mx * 1000), Y(my * 1000), 1000 / mpp + 1, 1000 / mpp + 1); }
  const poly = (pg) => { g.beginPath(); for (const R of pg) { g.moveTo(X(R[0]), Y(R[1])); for (let i = 2; i < R.length; i += 2) g.lineTo(X(R[i]), Y(R[i + 1])); g.closePath(); } g.fill("evenodd"); };
  const hit = bb => bb[2] >= m0x && bb[0] <= m1x && bb[3] >= m0y && bb[1] <= m1y;
  const O = RM.ovw || { land: [], water: [], roads: [], places: [], aero: [] };
  const cells = [];
  if (mpp <= 8) for (let my = Math.max(0, Math.floor(m0y / 1000)); my <= Math.min(63, Math.floor(m1y / 1000)); my++) for (let mx = Math.max(0, Math.floor(m0x / 1000)); mx <= Math.min(63, Math.floor(m1x / 1000)); mx++) { const C = RM.cells.get(mx * 64 + my) || (rmCellReady(mx, my) ? rmCellData(mx, my) : null); if (C) cells.push(C); }
  const landCol = L => { const c = L.cls; if (L.src === "park" || (L.src === "lc" && c === "grass")) return S.park; if (L.src === "lc" && (c === "wood" || c === "forest" || c === "wetland")) return S.woods; if (L.src === "lu" && (c === "commercial" || c === "retail" || c === "industrial")) return S.lot; return null; };
  for (const L of O.land) { if (!hit(L.bb)) continue; const c = landCol(L); if (c) { g.fillStyle = c; poly(L.pg); } }
  for (const C of cells) for (const L of C.land) { if (!hit(L.bb)) continue; const c = landCol(L); if (c) { g.fillStyle = c; poly(L.pg); } }
  g.fillStyle = S.water;
  for (const w of O.water) if (hit(w.bb)) poly(w.pg);
  for (const C of cells) for (const w of C.water) if (hit(w.bb)) poly(w.pg);
  if (mpp <= 3) for (const C of cells) for (const b of C.blds) { if (!hit(b.bb)) continue; g.fillStyle = S.bld; poly(b.pg); if (mpp <= 1) { g.strokeStyle = S.bldEdge; g.lineWidth = 1; g.stroke(); } }
  // roads
  g.lineCap = "round"; g.lineJoin = "round";
  const rank = c => RM_RANK[(c || "").replace("_construction", "")] || 0;
  const minR = mpp >= 64 ? 6 : mpp >= 32 ? 5 : mpp >= 16 ? 4 : mpp >= 8 ? 3 : mpp >= 4 ? 2 : 0;
  const lines = [];
  if (cells.length && mpp <= 8) { for (const C of cells) for (const R of C.roads) if (rank(R.cls) >= minR && R.cls !== "rail" && hit(R.bb)) lines.push(R); }
  for (const R of O.roads) if (rank(R.cls) >= Math.max(minR, cells.length && mpp <= 8 ? 5 : 0) && hit(R.bb)) lines.push(R);
  lines.sort((a, b) => rank(a.cls) - rank(b.cls));
  for (const edge of mpp <= 16 ? [true, false] : [false]) for (const R of lines) {
    const k = rank(R.cls), w = Math.max(k >= 6 ? 1.8 : 1, (RM_RW[(R.cls || "").replace("_construction", "")] || 6) / mpp) + (edge ? 1.6 : 0);
    g.strokeStyle = edge ? (k >= 7 ? S.hwEdge : S.edge) : (k >= 7 ? S.hw : k >= 4 ? S.road : S.road2); g.lineWidth = w;
    const a = R.pts; g.beginPath(); g.moveTo(X(a[0]), Y(a[1])); for (let i = 2; i < a.length; i += 2) g.lineTo(X(a[i]), Y(a[i + 1])); g.stroke();
  }
  // Highway 365 and the closed land beyond it
  g.save(); g.setTransform(1 / mpp / 32, 0, 0, 1 / mpp / 32, -m0x / mpp, -m0y / mpp);
  g.beginPath(); rmBarrierPath(g, 0); g.strokeStyle = S.hwEdge; g.lineWidth = Math.max(3, RM_HWY_W / mpp + 2) * mpp * 32; g.stroke(); g.strokeStyle = "#ffb300"; g.lineWidth = Math.max(2, RM_HWY_W / mpp) * mpp * 32; g.stroke();
  if (mpp <= 16) { g.setLineDash([6 * mpp * 32, 6 * mpp * 32]); g.strokeStyle = "#1a1a1a"; g.lineWidth = Math.max(1, 4 / mpp) * mpp * 32; g.stroke(); g.setLineDash([]); }
  g.beginPath(); g.rect(m0x * 32, m0y * 32, span * 32, span * 32); rmBarrierPath(g, -(RM_HWY_W / 2 + 1.6)); g.fillStyle = "rgba(20,22,28,0.55)"; g.fill("evenodd");
  g.restore();
}
(function rmMapWire() {
  if (typeof crBake === "function") { const _bk = crBake; window.crBake = crBake = function (rx, ry) { return RG.real ? rmBake(rx, ry) : _bk(rx, ry); }; }
  if (typeof mapTile !== "function") return;
  const _mt = mapTile;
  window.mapTile = mapTile = function (mpp, tx, ty, allowBuild) {
    if (!RG.real) return _mt(mpp, tx, ty, allowBuild);
    const k = mapTileKey(mpp, tx, ty) + "|real|" + rmPlaceKey() + "|" + (RM.ovw ? 1 : 0);
    let t = MAPV.tiles.get(k);
    if (t) { t.used = performance.now(); return t.c; }
    if (!allowBuild) return null;
    const c = document.createElement("canvas"); c.width = 256; c.height = 256;
    try { rmMapTile(c.getContext("2d"), tx * 256 * mpp, ty * 256 * mpp, mpp, mapStyle()); } catch (e) { if (window.trackProgress) window.trackProgress("rmMapTile: " + e.message, true); }
    MAPV.tiles.set(k, { c, used: performance.now() }); MAPV.built++;
    if (MAPV.tiles.size > 140) { const arr = [...MAPV.tiles.entries()].sort((a, b) => a[1].used - b[1].used); for (let i = 0; i < 28; i++) MAPV.tiles.delete(arr[i][0]); }
    return c;
  };
})();
// EOF:js/realart.js
