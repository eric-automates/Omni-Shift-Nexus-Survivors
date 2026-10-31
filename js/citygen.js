/* =========================================================================
   OMNI-SHIFT v14 — NEXUS CITY · WORLD GENERATOR
   A seeded, fully deterministic 64 km × 64 km world, generated lazily:

   1. MACRO MAP   64×64 one-kilometre cells. 7 major cities (the capital,
                  "Nexus City", sits near the middle), ~22 towns and ~26
                  villages are scattered with Poisson spacing. Every cell gets
                  a land use: farmland, rural fringe, suburb, urban, downtown,
                  industrial, forest or lake. Interstates run the full map.
   2. STREETS     a hierarchical lattice: county roads every km, collectors
                  every 500 m, local streets every 250 / 125 m — each cell only
                  keeps the ranks its density needs, so suburbs get 125 m
                  blocks and farmland gets 1 km sections (very Indiana).
   3. BLOCKS      every block is split into lots with a use that fits the
                  district and its frontage: ranch houses, gas stations on
                  arterial corners, diners, stores, motels, banks, offices,
                  schools, churches, police & fire stations, clinics, the city
                  hall / council chamber, warehouses, farms with barns & silos…
   4. INTERIORS   (lazy) single-storey floor plans per building type — rooms,
                  interior & exterior walls, doors, windows, furniture — built
                  on a 0.5 m tile grid in canonical orientation then rotated to
                  face the street.

   Units: metres (m) for layout, world tiles (0.5 m) for geometry, 32 px = 1 m.
   Nothing here touches the canvas — js/cityworld.js rasterises it for
   collision / sight / sound and js/cityrender.js paints it.
   ========================================================================= */
"use strict";

const CITY = {
  PX: 32, TILE: 16, TPM: 2,
  WORLD_M: 64000, WORLD_T: 128000, MACRO_M: 1000, MACROS: 64,
  CH: 128, CH_SHIFT: 7,                     // collision chunk = 128 tiles = 64 m
  on: false, seed: 0, orx: 0, ory: 0, ready: false,
  macro: null, macroCity: null, cities: [], hwX: [], hwY: [], capital: 0,
  theme: null, themeKey: "modern"
};

// land-use classes
const CL_FARM = 0, CL_RURAL = 1, CL_SUBURB = 2, CL_URBAN = 3, CL_DOWNTOWN = 4, CL_INDUSTRIAL = 5, CL_FOREST = 6, CL_LAKE = 7;
const CL_NAMES = ["Farmland", "Rural Fringe", "Suburbs", "Urban", "Downtown", "Industrial", "Woods", "Lakeside"];
const CL_MAXRANK = [0, 1, 3, 3, 3, 2, 0, 0];

/* --- 1. HASH / RNG / NOISE ------------------------------------------------- */
function cH(a, b, c, d) {
  let h = ((a | 0) ^ 0x9e3779b9) >>> 0;
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b) ^ (b | 0);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35) ^ (c | 0);
  h = Math.imul(h ^ (h >>> 16), 0x27d4eb2f) ^ (d | 0);
  h ^= h >>> 15; h = Math.imul(h, 0x2c1b3c6d); h ^= h >>> 12; h = Math.imul(h, 0x297a2d39); h ^= h >>> 15;
  return h >>> 0;
}
function cF(h) { return (h >>> 0) / 4294967296; }
function cRng(seed) {
  let s = (seed >>> 0) || 1;
  return function () {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s; t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function cPick(r, arr) { return arr[Math.floor(r() * arr.length) % arr.length]; }
function cRange(r, a, b) { return a + r() * (b - a); }
function cInt(r, a, b) { return a + Math.floor(r() * (b - a + 1)); }
// smooth value noise in [0,1) (period 64 cells, used on the macro grid)
function cNoise(x, y, k) {
  const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi;
  const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
  const v = (i, j) => cF(cH(CITY.seed, i, j, k));
  const a = v(xi, yi), b = v(xi + 1, yi), c = v(xi, yi + 1), d = v(xi + 1, yi + 1);
  return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
}
function cFbm(x, y, k) { return cNoise(x, y, k) * 0.6 + cNoise(x * 2.1, y * 2.1, k + 17) * 0.3 + cNoise(x * 4.3, y * 4.3, k + 41) * 0.1; }

/* --- 2. NAMES -------------------------------------------------------------- */
const CITY_NAME_A = ["Ash", "Oak", "Cedar", "Maple", "Brook", "Clear", "Fair", "Green", "Haver", "Kings", "Lake", "Mill", "North", "Pine",
  "River", "Rock", "Silver", "Spring", "Stone", "Sun", "West", "White", "Wood", "Elm", "Hart", "Iron", "Glen", "Bright", "Red", "Copper"];
const CITY_NAME_B = ["field", "ford", "ton", "ville", "dale", "brook", "wood", "haven", " Falls", " Springs", "port", "burg", " Ridge", "view",
  " Heights", "mont", " Crossing", "water", "stead", " Grove", "land", "bury"];
const STREET_TREES = ["Oak", "Maple", "Elm", "Cedar", "Birch", "Willow", "Pine", "Walnut", "Cherry", "Aspen", "Spruce", "Magnolia", "Hickory", "Poplar", "Sycamore", "Chestnut"];
const STREET_PEOPLE = ["Washington", "Meridian", "Lincoln", "Jefferson", "Madison", "Monroe", "Jackson", "Franklin", "Keystone", "Emerson",
  "Shadeland", "Arlington", "Kessler", "Pendleton", "College", "Central", "Park", "Market", "Michigan", "Ohio", "Delaware", "Illinois", "Capitol", "Senate"];
const STREET_SUFFIX = ["St", "Ave", "Rd", "Blvd", "Dr", "Ln", "Way", "Pkwy"];
function cityGenName(h) {
  const a = CITY_NAME_A[h % CITY_NAME_A.length], b = CITY_NAME_B[(h >>> 8) % CITY_NAME_B.length];
  return a + b;
}

/* --- 3. MACRO MAP: cities, land use, interstates --------------------------- */
function cityGenInit(seed) {
  CITY.seed = seed >>> 0;
  CITY.blockCache = new Map(); CITY.lineCache = new Map(); CITY.interiorCount = 0;
  const R = cRng(cH(seed, 101, 202, 303));
  const cities = [];
  const fits = (x, y, r, minSep) => {
    for (const c of cities) {
      const need = Math.max(minSep, (c.r + r) * 0.95);
      if (Math.hypot(c.x - x, c.y - y) < need) return false;
    }
    return true;
  };
  // the capital: Nexus City, near the middle of the map
  cities.push({ x: 32000 + cRange(R, -2500, 2500), y: 32000 + cRange(R, -2500, 2500), r: 6300, kind: 0 });
  let tries = 0;
  while (cities.length < 7 && tries++ < 5000) {
    const x = cRange(R, 4500, 59500), y = cRange(R, 4500, 59500), r = cRange(R, 3600, 5600);
    if (fits(x, y, r, 12500)) cities.push({ x, y, r, kind: 0 });
  }
  const nMaj = cities.length; tries = 0;
  while (cities.length < nMaj + 22 && tries++ < 8000) {
    const x = cRange(R, 2500, 61500), y = cRange(R, 2500, 61500), r = cRange(R, 1300, 2300);
    if (fits(x, y, r, 4800)) cities.push({ x, y, r, kind: 1 });
  }
  const nTown = cities.length; tries = 0;
  while (cities.length < nTown + 26 && tries++ < 8000) {
    const x = cRange(R, 1800, 62200), y = cRange(R, 1800, 62200), r = cRange(R, 520, 900);
    if (fits(x, y, r, 3200)) cities.push({ x, y, r, kind: 2 });
  }
  cities.forEach((c, i) => { c.idx = i; c.h = cH(seed, 77, i, 9); c.name = i === 0 ? "Nexus City" : cityGenName(c.h); });
  CITY.cities = cities; CITY.capital = 0;

  // interstates: km lines through the biggest cities, >= 9 km apart
  const hwX = [], hwY = [];
  const byR = cities.filter(c => c.kind === 0).sort((a, b) => b.r - a.r);
  for (const c of byR) {
    const lx = Math.round(c.x / 1000), ly = Math.round(c.y / 1000);
    if (hwX.length < 4 && lx > 1 && lx < 63 && hwX.every(v => Math.abs(v - lx) >= 9)) hwX.push(lx);
    if (hwY.length < 4 && ly > 1 && ly < 63 && hwY.every(v => Math.abs(v - ly) >= 9)) hwY.push(ly);
  }
  CITY.hwX = hwX.sort((a, b) => a - b); CITY.hwY = hwY.sort((a, b) => a - b);
  const ODD = [65, 69, 71, 75, 57, 59], EVEN = [70, 74, 64, 80, 94, 90];
  CITY.hwNameX = CITY.hwX.map((v, i) => "I-" + ODD[i % ODD.length]);
  CITY.hwNameY = CITY.hwY.map((v, i) => "I-" + EVEN[i % EVEN.length]);

  // land use
  const N = CITY.MACROS, macro = new Uint8Array(N * N), mcity = new Int16Array(N * N).fill(-1), mdist = new Float32Array(N * N);
  for (let my = 0; my < N; my++) for (let mx = 0; mx < N; mx++) {
    const cx = mx * 1000 + 500, cy = my * 1000 + 500;
    let cls = CL_FARM, bestT = 9, ci = -1;
    for (const c of cities) {
      const t = Math.hypot(c.x - cx, c.y - cy) / c.r;
      if (t > 1.3) continue;
      let k = CL_FARM;
      if (c.kind === 0) k = t < 0.15 ? CL_DOWNTOWN : t < 0.46 ? CL_URBAN : t < 0.86 ? CL_SUBURB : t < 1.2 ? CL_RURAL : CL_FARM;
      else if (c.kind === 1) k = t < 0.3 ? CL_URBAN : t < 0.8 ? CL_SUBURB : t < 1.18 ? CL_RURAL : CL_FARM;
      else k = t < 0.65 ? CL_SUBURB : t < 1.25 ? CL_RURAL : CL_FARM;
      const rankOf = v => [0, 1, 2, 3, 5, 2, 0, 0][v];
      if (rankOf(k) > rankOf(cls) || (rankOf(k) === rankOf(cls) && t < bestT)) { cls = k; ci = c.idx; bestT = t; }
    }
    // industrial belts around the big cities, next to an interstate or rail-ish noise band
    if ((cls === CL_URBAN || cls === CL_SUBURB) && ci >= 0 && cities[ci].kind === 0 && bestT > 0.4 && bestT < 0.9) {
      const nearHw = CITY.hwX.some(v => Math.abs(v - mx) <= 1) || CITY.hwY.some(v => Math.abs(v - my) <= 1);
      if (cFbm(mx * 0.35, my * 0.35, 5) > (nearHw ? 0.56 : 0.66)) cls = CL_INDUSTRIAL;
    }
    if (cls === CL_FARM) {
      if (cFbm(mx * 0.22, my * 0.22, 11) > 0.62) cls = CL_FOREST;
      else if (cF(cH(seed, mx, my, 7)) < 0.045 && !CITY.hwX.includes(mx) && !CITY.hwX.includes(mx + 1) && !CITY.hwY.includes(my) && !CITY.hwY.includes(my + 1)) cls = CL_LAKE;
    }
    macro[my * N + mx] = cls; mcity[my * N + mx] = ci; mdist[my * N + mx] = bestT;
  }
  CITY.macro = macro; CITY.macroCity = mcity; CITY.macroT = mdist;
  // one civic centre per major city / town: the downtown or urban cell nearest its centre
  CITY.civic = new Map();
  cities.forEach(c => {
    if (c.kind === 2) return;
    const mx = Math.floor(c.x / 1000), my = Math.floor(c.y / 1000);
    if (mx >= 0 && my >= 0 && mx < N && my < N) CITY.civic.set(mx + "," + my, c.idx);
  });
  CITY.ready = true;
  return CITY;
}

function cityMacroClass(mx, my) {
  if (mx < 0 || my < 0 || mx >= CITY.MACROS || my >= CITY.MACROS) return CL_FARM;
  return CITY.macro[my * CITY.MACROS + mx];
}
function cityMacroCityIdx(mx, my) {
  if (mx < 0 || my < 0 || mx >= CITY.MACROS || my >= CITY.MACROS) return -1;
  return CITY.macroCity[my * CITY.MACROS + mx];
}
function cityAtMetres(xm, ym) {
  const mx = Math.floor(xm / 1000), my = Math.floor(ym / 1000);
  const ci = cityMacroCityIdx(mx, my), cls = cityMacroClass(mx, my);
  return { mx, my, cls, city: ci >= 0 ? CITY.cities[ci] : null, district: CL_NAMES[cls] };
}

/* --- 4. STREET LATTICE ----------------------------------------------------- */
const LINE_OFF = [[0], [500], [250, 750], [125, 375, 625, 875]];
const LINE_JIT = [0, 22, 12, 6];
// vertical lines (axis 0) of macro column m / horizontal lines (axis 1) of macro row m, up to maxRank
function cityLines(axis, m, maxRank) {
  const key = axis * 1000000 + m * 10 + maxRank;
  let out = CITY.lineCache.get(key);
  if (out) return out;
  out = [];
  for (let r = 0; r <= maxRank; r++) for (let k = 0; k < LINE_OFF[r].length; k++) {
    const j = r === 0 ? 0 : (cF(cH(CITY.seed, axis * 7919 + m, r, k)) * 2 - 1) * LINE_JIT[r];
    out.push({ p: LINE_OFF[r][k] + j, r, k });
  }
  out.sort((a, b) => a.p - b.p);
  CITY.lineCache.set(key, out);
  return out;
}
function cityIsHighway(axis, kmLine) { return axis === 0 ? CITY.hwX.indexOf(kmLine) >= 0 : CITY.hwY.indexOf(kmLine) >= 0; }
const ST_W0 = [8, 8, 12, 17, 19, 14, 7, 8], ST_W1 = [7, 7, 12, 15, 16, 13, 6, 7], ST_W2 = [7, 7, 10, 10, 11, 11, 6, 7];
function cityStreetWidth(rank, cls, hw) {
  if (hw) return 30;
  return rank === 0 ? ST_W0[cls] : rank === 1 ? ST_W1[cls] : ST_W2[cls];
}
function citySidewalk(rank, cls, hw) { return (hw || cls === CL_FARM || cls === CL_RURAL || cls === CL_FOREST || cls === CL_LAKE) ? 0 : (cls === CL_DOWNTOWN ? 3 : 2); }
// width of the km boundary line at the left/top of cell (mx,my) along axis
function cityBoundaryWidth(axis, mx, my) {
  if (axis === 0) {
    const hw = cityIsHighway(0, mx);
    return cityStreetWidth(0, Math.max(cityMacroClassRoad(mx - 1, my), cityMacroClassRoad(mx, my)), hw);
  }
  const hw = cityIsHighway(1, my);
  return cityStreetWidth(0, Math.max(cityMacroClassRoad(mx, my - 1), cityMacroClassRoad(mx, my)), hw);
}
// class used for road width (forest/lake behave like farmland)
function cityMacroClassRoad(mx, my) { const c = cityMacroClass(mx, my); return c >= CL_FOREST ? CL_FARM : (c === CL_INDUSTRIAL ? CL_INDUSTRIAL : c); }

// full street description of one macro cell: vertical & horizontal lines with absolute metres and widths
function cityCellStreets(mx, my) {
  const cls = cityMacroClass(mx, my), mr = CL_MAXRANK[cls];
  const vx = cityLines(0, mx, mr).map(l => {
    const hw = l.r === 0 && cityIsHighway(0, mx);
    const w = l.r === 0 ? cityBoundaryWidth(0, mx, my) : cityStreetWidth(l.r, cls, false);
    return { x: mx * 1000 + l.p, r: l.r, w, hw, sw: citySidewalk(l.r, l.r === 0 ? Math.max(cityMacroClassRoad(mx - 1, my), cityMacroClassRoad(mx, my)) : cls, hw), k: l.k, km: mx };
  });
  const hy = cityLines(1, my, mr).map(l => {
    const hw = l.r === 0 && cityIsHighway(1, my);
    const w = l.r === 0 ? cityBoundaryWidth(1, mx, my) : cityStreetWidth(l.r, cls, false);
    return { y: my * 1000 + l.p, r: l.r, w, hw, sw: citySidewalk(l.r, l.r === 0 ? Math.max(cityMacroClassRoad(mx, my - 1), cityMacroClassRoad(mx, my)) : cls, hw), k: l.k, km: my };
  });
  // closing boundary lines (owned by the next column / row)
  const ex = { x: (mx + 1) * 1000, r: 0, w: cityBoundaryWidth(0, mx + 1, my), hw: cityIsHighway(0, mx + 1), sw: 0, k: 0, km: mx + 1, closing: true };
  ex.sw = citySidewalk(0, Math.max(cityMacroClassRoad(mx, my), cityMacroClassRoad(mx + 1, my)), ex.hw);
  const ey = { y: (my + 1) * 1000, r: 0, w: cityBoundaryWidth(1, mx, my + 1), hw: cityIsHighway(1, my + 1), sw: 0, k: 0, km: my + 1, closing: true };
  ey.sw = citySidewalk(0, Math.max(cityMacroClassRoad(mx, my), cityMacroClassRoad(mx, my + 1)), ey.hw);
  return { cls, vx: vx.concat([ex]), hy: hy.concat([ey]) };
}

// a human street name for a line (map labels)
function cityStreetName(axis, line, mx, my) {
  if (line.hw) { const i = axis === 0 ? CITY.hwX.indexOf(line.km) : CITY.hwY.indexOf(line.km); return (axis === 0 ? CITY.hwNameX : CITY.hwNameY)[i] || "Interstate"; }
  const cls = cityMacroClass(mx, my);
  if (line.r === 0 && (cls === CL_FARM || cls === CL_RURAL || cls >= CL_FOREST)) {
    const n = axis === 0 ? (line.km - 32) : (line.km - 32);
    return "County Rd " + Math.abs(n) * 100 + " " + (axis === 0 ? (n < 0 ? "W" : "E") : (n < 0 ? "N" : "S"));
  }
  const h = cH(CITY.seed, axis * 131 + (axis === 0 ? line.km : line.km), line.r * 10 + line.k, axis === 0 ? 5 : 6);
  if (axis === 1 && line.r >= 2) return ((line.km * 8 + line.k * 2 + line.r) % 97 + 1) + ordSuffix((line.km * 8 + line.k * 2 + line.r) % 97 + 1) + " St";
  const base = axis === 0 ? STREET_TREES[h % STREET_TREES.length] : STREET_PEOPLE[h % STREET_PEOPLE.length];
  const suf = line.r === 0 ? ((h >>> 9) & 1 ? "Blvd" : "Ave") : line.r === 1 ? ((h >>> 9) & 1 ? "Pkwy" : "Rd") : STREET_SUFFIX[(h >>> 11) % STREET_SUFFIX.length];
  return base + " " + suf;
}
function ordSuffix(n) { const t = n % 100; if (t >= 11 && t <= 13) return "th"; return ["th", "st", "nd", "rd"][n % 10] || "th"; }
// EOF part 1 (continued below)

/* --- 5. INTERIORS ----------------------------------------------------------
   Cell codes (building-local grid, canonical orientation = front door facing
   SOUTH / bottom, then rotated to face the street). */
const IC_OUT = 0, IC_FLOOR = 1, IC_EXT = 2, IC_INT = 3, IC_DOOR = 4, IC_EDOOR = 5, IC_WIN = 6, IC_GDOOR = 7, IC_BARS = 8, IC_COUNTER = 9;
// furniture solidity: 0 decal / walk-over, 1 low (blocks movement), 2 tall (blocks movement + sight + shots), 3 cover (movement + shots)
const FS_NONE = 0, FS_LOW = 1, FS_TALL = 2, FS_COVER = 3;

function icNew(w, h) { return { w, h, c: new Uint8Array(w * h), rm: new Uint8Array(w * h).fill(255), occ: new Uint8Array(w * h), rooms: [], furn: [], spawnRooms: [], arch: [], parts: [] }; }
function icGet(G, x, y) { return (x < 0 || y < 0 || x >= G.w || y >= G.h) ? IC_OUT : G.c[y * G.w + x]; }
function icSet(G, x, y, v) { if (x >= 0 && y >= 0 && x < G.w && y < G.h) G.c[y * G.w + x] = v; }
function icRect(G, x, y, w, h) {   // exterior-walled rectangle part
  G.parts.push({ x, y, w, h });
  for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) {
    const edge = i === x || j === y || i === x + w - 1 || j === y + h - 1, cur = icGet(G, i, j);
    if (edge) { if (cur === IC_OUT || cur === IC_EXT) icSet(G, i, j, IC_EXT); }
    else icSet(G, i, j, IC_FLOOR);
  }
}
const isWalk = v => v === IC_FLOOR || v === IC_DOOR || v === IC_EDOOR;
function icFixWalls(G) {   // exterior walls with floor on both opposite sides become interior walls
  for (let y = 0; y < G.h; y++) for (let x = 0; x < G.w; x++) {
    if (icGet(G, x, y) !== IC_EXT) continue;
    if ((isWalk(icGet(G, x - 1, y)) && isWalk(icGet(G, x + 1, y))) || (isWalk(icGet(G, x, y - 1)) && isWalk(icGet(G, x, y + 1)))) icSet(G, x, y, IC_INT);
  }
}
function icVWall(G, x, y0, y1, code = IC_INT) { for (let y = y0; y <= y1; y++) if (icGet(G, x, y) === IC_FLOOR) icSet(G, x, y, code); }
function icHWall(G, y, x0, x1, code = IC_INT) { for (let x = x0; x <= x1; x++) if (icGet(G, x, y) === IC_FLOOR) icSet(G, x, y, code); }
function icRoom(G, type, x, y, w, h) {
  const r = { id: G.rooms.length, type, x, y, w, h };
  G.rooms.push(r);
  for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (icGet(G, i, j) === IC_FLOOR) G.rm[j * G.w + i] = r.id;
  return r;
}
// carve a doorway of length len into the wall cells between two rooms (finds their shared wall)
function icConnect(G, a, b, r, len = 2, code = IC_DOOR) {
  // vertical shared wall?
  if (a.x + a.w + 1 === b.x || b.x + b.w + 1 === a.x) {
    const wx = a.x + a.w + 1 === b.x ? a.x + a.w : b.x + b.w;
    const y0 = Math.max(a.y, b.y), y1 = Math.min(a.y + a.h, b.y + b.h) - 1;
    if (y1 - y0 + 1 >= len + 1) { const p = cInt(r, y0 + (y1 - y0 + 1 > len + 2 ? 1 : 0), y1 - len + 1 - (y1 - y0 + 1 > len + 2 ? 1 : 0)); for (let k = 0; k < len; k++) { icSet(G, wx, p + k, code); if (code === IC_FLOOR) G.arch.push(wx, p + k); } return true; }
  }
  if (a.y + a.h + 1 === b.y || b.y + b.h + 1 === a.y) {
    const wy = a.y + a.h + 1 === b.y ? a.y + a.h : b.y + b.h;
    const x0 = Math.max(a.x, b.x), x1 = Math.min(a.x + a.w, b.x + b.w) - 1;
    if (x1 - x0 + 1 >= len + 1) { const p = cInt(r, x0 + (x1 - x0 + 1 > len + 2 ? 1 : 0), x1 - len + 1 - (x1 - x0 + 1 > len + 2 ? 1 : 0)); for (let k = 0; k < len; k++) { icSet(G, p + k, wy, code); if (code === IC_FLOOR) G.arch.push(p + k, wy); } return true; }
  }
  return false;
}
// exterior door on side s (0 top/back, 1 right, 2 bottom/front, 3 left) of room
function icExtDoor(G, room, side, r, len = 2, code = IC_EDOOR, at = -1) {
  const span = side % 2 === 0 ? room.w : room.h;
  if (span < len + 2) return false;
  const p = at >= 0 ? Math.max(1, Math.min(span - len - 1, at)) : cInt(r, 1, span - len - 1);
  for (let k = 0; k < len; k++) {
    let x, y;
    if (side === 0) { x = room.x + p + k; y = room.y - 1; } else if (side === 2) { x = room.x + p + k; y = room.y + room.h; }
    else if (side === 1) { x = room.x + room.w; y = room.y + p + k; } else { x = room.x - 1; y = room.y + p + k; }
    if (icGet(G, x, y) !== IC_EXT) return false;
  }
  for (let k = 0; k < len; k++) {
    if (side === 0) icSet(G, room.x + p + k, room.y - 1, code); else if (side === 2) icSet(G, room.x + p + k, room.y + room.h, code);
    else if (side === 1) icSet(G, room.x + room.w, room.y + p + k, code); else icSet(G, room.x - 1, room.y + p + k, code);
  }
  return true;
}
// windows along every exterior wall run of a room
function icWindows(G, room, r, len = 3, gap = 3, small = false) {
  const runs = [[0, room.x, room.y - 1, 1, 0, room.w], [2, room.x, room.y + room.h, 1, 0, room.w], [3, room.x - 1, room.y, 0, 1, room.h], [1, room.x + room.w, room.y, 0, 1, room.h]];
  for (const [, sx, sy, dx, dy, n] of runs) {
    let k = 1;
    while (k + len < n) {
      let ok = true;
      for (let q = -1; q <= len; q++) { const v = icGet(G, sx + dx * (k + q), sy + dy * (k + q)); if (v !== IC_EXT) { ok = false; break; } }
      if (ok && r() < (small ? 0.5 : 0.85)) {
        for (let q = 0; q < len; q++) icSet(G, sx + dx * (k + q), sy + dy * (k + q), IC_WIN);
        k += len + gap + (small ? 99 : 0);
      } else k += 2;
    }
  }
}
// --- furniture placement ---
function icOccInit(G) {
  const o = G.occ;
  for (let i = 0; i < G.c.length; i++) o[i] = G.c[i] === IC_FLOOR ? 0 : 1;
  // keep doors clear: 2 tiles into the room on each side of every door cell
  for (let y = 0; y < G.h; y++) for (let x = 0; x < G.w; x++) {
    const v = G.c[y * G.w + x];
    if (v !== IC_DOOR && v !== IC_EDOOR && v !== IC_GDOOR) continue;
    icReserve(G, x, y);
  }
  for (let k = 0; k < G.arch.length; k += 2) icReserve(G, G.arch[k], G.arch[k + 1]);
}
function icReserve(G, x, y) {
  const o = G.occ;
  for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
    const xx = x + dx, yy = y + dy;
    if (xx >= 0 && yy >= 0 && xx < G.w && yy < G.h && Math.abs(dx) + Math.abs(dy) <= 3) o[yy * G.w + xx] = Math.max(o[yy * G.w + xx], G.c[yy * G.w + xx] === IC_FLOOR ? 2 : 1);
  }
}
function icFree(G, x, y, w, h) {
  for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) {
    if (i < 0 || j < 0 || i >= G.w || j >= G.h || G.occ[j * G.w + i]) return false;
  }
  return true;
}
function icMark(G, x, y, w, h, v = 3) { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (i >= 0 && j >= 0 && i < G.w && j < G.h) G.occ[j * G.w + i] = v; }
function icAdd(G, t, x, y, w, h, o, s, v = 0) { const f = { t, x, y, w, h, o, s, v }; G.furn.push(f); return f; }
// against a wall: w = length along the wall, d = depth into the room. sides: 0 top,1 right,2 bottom,3 left
function icWall(G, room, r, t, w, d, s, sides = [0, 1, 2, 3], opt = {}) {
  const order = opt.keep ? sides : sides.slice().sort(() => r() - 0.5);
  for (const side of order) {
    const L = side % 2 === 0 ? room.w : room.h, ww = w, dd = d;
    if (ww > L) continue;
    const pos = [];
    for (let p = 0; p <= L - ww; p++) pos.push(p);
    if (opt.center) pos.sort((a, b) => Math.abs(a - (L - ww) / 2) - Math.abs(b - (L - ww) / 2));
    else if (opt.corner) pos.sort((a, b) => Math.min(a, L - ww - a) - Math.min(b, L - ww - b));
    else pos.sort(() => r() - 0.5);
    for (const p of pos) {
      let x, y, fw, fh, o;
      if (side === 0) { x = room.x + p; y = room.y; fw = ww; fh = dd; o = 0; }
      else if (side === 2) { x = room.x + p; y = room.y + room.h - dd; fw = ww; fh = dd; o = 2; }
      else if (side === 3) { x = room.x; y = room.y + p; fw = dd; fh = ww; o = 3; }
      else { x = room.x + room.w - dd; y = room.y + p; fw = dd; fh = ww; o = 1; }
      if (icFree(G, x, y, fw, fh)) {
        icMark(G, x, y, fw, fh, s === FS_NONE ? 0 : 3);
        if (opt.pad) icMarkPad(G, x, y, fw, fh, side, opt.pad);
        return icAdd(G, t, x, y, fw, fh, o, s, opt.v || 0);
      }
    }
  }
  return null;
}
function icMarkPad(G, x, y, w, h, side, pad) {   // keep a strip in front of an item free (sofa legroom, counter workspace)
  if (side === 0) icMark(G, x, y + h, w, pad, 2); else if (side === 2) icMark(G, x, y - pad, w, pad, 2);
  else if (side === 3) icMark(G, x + w, y, pad, h, 2); else icMark(G, x - pad, y, pad, h, 2);
}
function icCenter(G, room, t, w, h, s, o = 0, margin = 1, v = 0) {
  const x = room.x + Math.floor((room.w - w) / 2), y = room.y + Math.floor((room.h - h) / 2);
  if (!icFree(G, x - margin, y - margin, w + margin * 2, h + margin * 2)) return null;
  icMark(G, x, y, w, h, s === FS_NONE ? 0 : 3);
  return icAdd(G, t, x, y, w, h, o, s, v);
}
// fill a room with parallel rows (shelving aisles, pews, desks, seats). axis 0 = rows run along x
function icRows(G, room, t, len, depth, gap, s, axis, opt = {}) {
  const m = opt.margin === undefined ? 2 : opt.margin, out = [];
  if (axis === 0) {
    for (let y = room.y + (opt.m0 === undefined ? m : opt.m0); y + depth <= room.y + room.h - m; y += depth + gap) {
      for (let x = room.x + m; x + Math.min(len, 3) <= room.x + room.w - m; x += len + (opt.split || 2)) {
        const L = Math.min(len, room.x + room.w - m - x);
        if (L < (opt.minLen || 3)) break;
        if (icFree(G, x, y, L, depth)) { icMark(G, x, y, L, depth, 3); out.push(icAdd(G, t, x, y, L, depth, opt.o === undefined ? 0 : opt.o, s, opt.v || 0)); }
        if (!opt.split) break;
      }
    }
  } else {
    for (let x = room.x + (opt.m0 === undefined ? m : opt.m0); x + depth <= room.x + room.w - m; x += depth + gap) {
      for (let y = room.y + m; y + Math.min(len, 3) <= room.y + room.h - m; y += len + (opt.split || 2)) {
        const L = Math.min(len, room.y + room.h - m - y);
        if (L < (opt.minLen || 3)) break;
        if (icFree(G, x, y, depth, L)) { icMark(G, x, y, depth, L, 3); out.push(icAdd(G, t, x, y, depth, L, opt.o === undefined ? 3 : opt.o, s, opt.v || 0)); }
        if (!opt.split) break;
      }
    }
  }
  return out;
}
function icScatterSmall(G, room, r, t, n, s = FS_NONE) {
  for (let k = 0; k < n * 6 && n > 0; k++) {
    const x = room.x + Math.floor(r() * room.w), y = room.y + Math.floor(r() * room.h);
    if (icFree(G, x, y, 1, 1)) { icMark(G, x, y, 1, 1, s === FS_NONE ? 0 : 3); icAdd(G, t, x, y, 1, 1, Math.floor(r() * 4), s); n--; }
  }
}
// table with chairs around it
function icTableSet(G, room, r, tw, th, chairs = true, t = "table") {
  const tb = icCenter(G, room, t, tw, th, FS_LOW, 0, 1);
  if (!tb || !chairs) return tb;
  const cs = [];
  for (let i = 0; i < tw; i += 2) { cs.push([tb.x + i, tb.y - 1, 0]); cs.push([tb.x + i, tb.y + th, 2]); }
  if (th >= 2) { cs.push([tb.x - 1, tb.y + Math.floor((th - 1) / 2), 3]); cs.push([tb.x + tw, tb.y + Math.floor((th - 1) / 2), 1]); }
  for (const [x, y, o] of cs) if (icFree(G, x, y, 1, 1)) { icMark(G, x, y, 1, 1, 2); icAdd(G, "chair", x, y, 1, 1, o, FS_NONE); }
  return tb;
}

/* furnishing per room type */
function icFurnish(G, room, r, theme) {
  const t = room.type, A = room.w * room.h;
  switch (t) {
    case "living": {
      icCenter(G, room, "rug", Math.min(room.w - 2, 7), Math.min(room.h - 2, 5), FS_NONE);
      const sofa = icWall(G, room, r, "sofa", Math.min(5, room.w - 2), 2, FS_LOW, [0, 1, 3]);
      if (sofa) {
        const o = sofa.o; let cx, cy, cw = 3, ch = 2;
        if (o === 0) { cx = sofa.x + Math.floor((sofa.w - 3) / 2); cy = sofa.y + sofa.h + 1; }
        else if (o === 2) { cx = sofa.x + Math.floor((sofa.w - 3) / 2); cy = sofa.y - 3; }
        else { cw = 2; ch = 3; cy = sofa.y + Math.floor((sofa.h - 3) / 2); cx = o === 3 ? sofa.x + sofa.w + 1 : sofa.x - 3; }
        if (icFree(G, cx, cy, cw, ch)) { icMark(G, cx, cy, cw, ch); icAdd(G, "coffeetable", cx, cy, cw, ch, o, FS_LOW); }
        icMarkPad(G, sofa.x, sofa.y, sofa.w, sofa.h, o, 3);
        icWall(G, room, r, "tvstand", 3, 1, FS_LOW, [(o + 2) % 4], { center: true });
      } else icWall(G, room, r, "tvstand", 3, 1, FS_LOW, [0, 1, 2, 3]);
      icWall(G, room, r, "armchair", 2, 2, FS_LOW, [0, 1, 2, 3], { corner: true });
      icWall(G, room, r, "bookshelf", 3, 1, FS_TALL, [0, 1, 3]);
      icWall(G, room, r, "plant", 1, 1, FS_LOW, [0, 1, 2, 3], { corner: true });
      icWall(G, room, r, "lamp", 1, 1, FS_NONE, [0, 1, 2, 3], { corner: true });
      break;
    }
    case "dining": icTableSet(G, room, r, room.w >= 9 ? 5 : 4, 3); icWall(G, room, r, "cabinet", 3, 1, FS_TALL, [0, 1, 3]); icWall(G, room, r, "plant", 1, 1, FS_LOW, [0, 1, 2, 3], { corner: true }); break;
    case "kitchen": {
      // counters along two walls with sink / stove inserts, fridge at the end
      const s1 = r() < 0.5 ? 0 : 1, s2 = s1 === 0 ? (r() < 0.5 ? 1 : 3) : (r() < 0.5 ? 0 : 2);
      const L1 = (s1 % 2 === 0 ? room.w : room.h) - 2;
      icWall(G, room, r, "fridge", 2, 2, FS_TALL, [s1, s2], { corner: true });
      icWall(G, room, r, "counter", Math.max(3, Math.min(8, L1)), 1, FS_LOW, [s1], { v: 1, pad: 1 });
      icWall(G, room, r, "stove", 2, 1, FS_LOW, [s2, s1], { pad: 1 });
      icWall(G, room, r, "counter", Math.max(2, Math.min(5, (s2 % 2 === 0 ? room.w : room.h) - 4)), 1, FS_LOW, [s2, (s2 + 2) % 4], { pad: 1 });
      if (A > 60) icTableSet(G, room, r, 3, 2); else if (A > 40) icCenter(G, room, "island", 3, 2, FS_LOW, 0, 1);
      break;
    }
    case "bed": case "master": {
      const big = t === "master" || room.w * room.h > 50;
      const bed = icWall(G, room, r, "bed", big ? 3 : 2, 4, FS_LOW, [0, 1, 3], { center: true, v: big ? 1 : 0 });
      if (bed) {
        const o = bed.o;   // nightstands either side of the headboard
        if (o === 0) { if (icFree(G, bed.x - 1, bed.y, 1, 1)) { icMark(G, bed.x - 1, bed.y, 1, 1); icAdd(G, "nightstand", bed.x - 1, bed.y, 1, 1, 0, FS_LOW); } if (big && icFree(G, bed.x + bed.w, bed.y, 1, 1)) { icMark(G, bed.x + bed.w, bed.y, 1, 1); icAdd(G, "nightstand", bed.x + bed.w, bed.y, 1, 1, 0, FS_LOW); } }
        else if (o === 3 || o === 1) { const nx = bed.x + (o === 3 ? 0 : bed.w - 1); if (icFree(G, nx, bed.y - 1, 1, 1)) { icMark(G, nx, bed.y - 1, 1, 1); icAdd(G, "nightstand", nx, bed.y - 1, 1, 1, o, FS_LOW); } }
      }
      icWall(G, room, r, "dresser", 3, 1, FS_LOW, [0, 1, 2, 3]);
      icWall(G, room, r, "wardrobe", 3, 1, FS_TALL, [0, 1, 2, 3], { corner: true });
      icCenter(G, room, "rug", 3, 2, FS_NONE, 0, 0);
      if (!big) icWall(G, room, r, "desk", 3, 2, FS_LOW, [0, 1, 2, 3]);
      break;
    }
    case "bath": {
      icWall(G, room, r, "tub", room.w >= 5 || room.h >= 5 ? 4 : 2, 2, FS_LOW, [0, 1, 3], { corner: true, v: room.w >= 5 || room.h >= 5 ? 0 : 1 });
      icWall(G, room, r, "toilet", 1, 2, FS_LOW, [0, 1, 2, 3]);
      icWall(G, room, r, "vanity", 2, 1, FS_LOW, [0, 1, 2, 3]);
      break;
    }
    case "restroom": {
      const stalls = icRows(G, room, "stall", 2, 3, 0, FS_LOW, room.w >= room.h ? 1 : 0, { margin: 0, m0: 0, o: 0 });
      void stalls; icWall(G, room, r, "vanity", 3, 1, FS_LOW, [1, 2, 3]); break;
    }
    case "hall": icCenter(G, room, "runner", Math.max(1, room.w - 2), Math.max(1, room.h - 2), FS_NONE, 0, 0); icWall(G, room, r, "plant", 1, 1, FS_LOW, [0, 1, 2, 3], { corner: true }); break;
    case "garage": {
      icCenter(G, room, "car", 4, 9, FS_COVER, r() < 0.5 ? 0 : 2, 0, cInt(r, 0, 5));
      icWall(G, room, r, "workbench", 4, 1, FS_LOW, [0, 1, 3]);
      icWall(G, room, r, "shelf", 3, 1, FS_TALL, [0, 1, 3]);
      icScatterSmall(G, room, r, "box", 2, FS_LOW);
      break;
    }
    case "laundry": icWall(G, room, r, "washer", 2, 2, FS_LOW, [0, 1, 3]); icWall(G, room, r, "washer", 2, 2, FS_LOW, [0, 1, 3], { v: 1 }); icWall(G, room, r, "shelf", 2, 1, FS_TALL, [0, 1, 2, 3]); break;
    case "office": case "mayor": {
      const big = t === "mayor";
      icWall(G, room, r, "desk", big ? 4 : 3, 2, FS_LOW, [0, 1, 3], { center: true, pad: 1, v: big ? 1 : 0 });
      icWall(G, room, r, "filing", 1, 1, FS_TALL, [0, 1, 2, 3], { corner: true });
      icWall(G, room, r, "bookshelf", 3, 1, FS_TALL, [0, 1, 2, 3]);
      icWall(G, room, r, "plant", 1, 1, FS_LOW, [0, 1, 2, 3], { corner: true });
      if (big) { icWall(G, room, r, "sofa", 4, 2, FS_LOW, [2, 1, 3]); icWall(G, room, r, "flag", 1, 1, FS_LOW, [0, 1, 3], { corner: true }); }
      else icWall(G, room, r, "chair", 1, 1, FS_NONE, [2, 1, 3]);
      break;
    }
    case "openoffice": {
      // 2x2 desk pods
      for (let y = room.y + 2; y + 4 <= room.y + room.h - 1; y += 6) for (let x = room.x + 2; x + 6 <= room.x + room.w - 1; x += 8) {
        if (icFree(G, x, y, 6, 4)) { icMark(G, x, y, 6, 4); icAdd(G, "deskpod", x, y, 6, 4, 0, FS_LOW); }
      }
      icWall(G, room, r, "filing", 1, 1, FS_TALL, [0, 1, 3], { corner: true });
      icWall(G, room, r, "printer", 2, 1, FS_LOW, [0, 1, 3]);
      icWall(G, room, r, "plant", 1, 1, FS_LOW, [0, 1, 2, 3], { corner: true });
      icWall(G, room, r, "watercooler", 1, 1, FS_LOW, [0, 1, 2, 3]);
      break;
    }
    case "conference": icTableSet(G, room, r, Math.max(4, Math.min(room.w - 4, 8)), Math.max(2, Math.min(room.h - 4, 3)), true, "conftable"); icWall(G, room, r, "screen", 4, 1, FS_NONE, [0, 1, 3]); break;
    case "break": icWall(G, room, r, "counter", Math.min(6, room.w - 2), 1, FS_LOW, [0, 1, 3], { v: 1, pad: 1 }); icWall(G, room, r, "fridge", 2, 2, FS_TALL, [0, 1, 3]); icWall(G, room, r, "vending", 2, 1, FS_TALL, [0, 1, 2, 3]); icTableSet(G, room, r, 3, 2); break;
    case "lobby": case "reception": {
      icWall(G, room, r, "reception", Math.min(5, room.w - 4), 2, FS_LOW, [0, 1, 3], { center: true, pad: 1 });
      icWall(G, room, r, "bench", 4, 1, FS_LOW, [1, 3, 0]); icWall(G, room, r, "bench", 4, 1, FS_LOW, [1, 3, 0]);
      icWall(G, room, r, "plant", 1, 1, FS_LOW, [0, 1, 2, 3], { corner: true }); icWall(G, room, r, "plant", 1, 1, FS_LOW, [0, 1, 2, 3], { corner: true });
      break;
    }
    case "waiting": icRows(G, room, "benchrow", Math.min(8, room.w - 4), 1, 2, FS_LOW, 0, { margin: 2, split: 2 }); icWall(G, room, r, "reception", 4, 2, FS_LOW, [0, 1, 3]); icWall(G, room, r, "plant", 1, 1, FS_LOW, [0, 1, 2, 3], { corner: true }); break;
    case "storage": {
      icRows(G, room, "rack", Math.max(3, Math.min(10, room.w - 4)), 1, 2, FS_TALL, room.w >= room.h ? 0 : 1, { margin: 1, split: 2 });
      icScatterSmall(G, room, r, "box", 3, FS_LOW);
      break;
    }
    case "sales": case "pharmacy": case "grocery": {
      const ax = room.w >= room.h ? 0 : 1;
      icWall(G, room, r, "cooler", Math.min(10, (ax === 0 ? room.w : room.h) - 4), 2, FS_TALL, [0], { keep: true, center: true });
      icWall(G, room, r, "checkout", 3, 2, FS_COVER, [2, 1, 3], { corner: true });
      if (t === "grocery") icWall(G, room, r, "checkout", 3, 2, FS_COVER, [2], { corner: true });
      icRows(G, room, "shelf", Math.max(4, Math.min(12, (ax === 0 ? room.w : room.h) - 8)), 2, 3, FS_TALL, ax, { margin: 3, split: 3, m0: 4 });
      icScatterSmall(G, room, r, "box", 2, FS_LOW);
      break;
    }
    case "shop": {
      icWall(G, room, r, "counter", 4, 1, FS_LOW, [0, 1, 3], { v: 2, pad: 1 });
      icWall(G, room, r, "shelf", Math.min(6, room.w - 2), 1, FS_TALL, [1, 3]); icWall(G, room, r, "shelf", Math.min(6, room.h - 2), 1, FS_TALL, [1, 3]);
      icCenter(G, room, "display", 3, 2, FS_LOW, 0, 1);
      icWall(G, room, r, "plant", 1, 1, FS_LOW, [2], { corner: true });
      break;
    }
    case "dinerfront": {
      // booths along the front windows, a counter with stools, tables between
      for (let x = room.x + 1; x + 4 <= room.x + room.w - 1; x += 5) if (icFree(G, x, room.y + room.h - 5, 4, 5)) { icMark(G, x, room.y + room.h - 5, 4, 5); icAdd(G, "booth", x, room.y + room.h - 5, 4, 5, 2, FS_LOW); }
      const ctr = icWall(G, room, r, "barcounter", Math.min(room.w - 4, 12), 1, FS_LOW, [0], { keep: true, center: true });
      if (ctr) for (let x = ctr.x; x < ctr.x + ctr.w; x += 2) if (icFree(G, x, ctr.y + 2, 1, 1)) { icMark(G, x, ctr.y + 2, 1, 1, 2); icAdd(G, "stool", x, ctr.y + 2, 1, 1, 0, FS_NONE); }
      icTableSet(G, room, r, 2, 2);
      break;
    }
    case "kitchenpro": icWall(G, room, r, "stove", 4, 2, FS_LOW, [0, 1, 3], { pad: 1 }); icWall(G, room, r, "prep", 4, 2, FS_LOW, [0, 1, 2, 3], { pad: 1 }); icWall(G, room, r, "fridge", 3, 2, FS_TALL, [0, 1, 3]); icWall(G, room, r, "counter", 4, 1, FS_LOW, [0, 1, 2, 3], { v: 1 }); break;
    case "bar": {
      const ctr = icWall(G, room, r, "barcounter", Math.min(room.w - 4, 10), 1, FS_LOW, [0, 1, 3], { center: true });
      if (ctr) for (let k = 0; k < Math.max(ctr.w, ctr.h); k += 2) { const sx = ctr.o === 0 ? ctr.x + k : (ctr.o === 3 ? ctr.x + 2 : ctr.x - 2), sy = ctr.o === 0 ? ctr.y + 2 : ctr.y + k; if (icFree(G, sx, sy, 1, 1)) { icMark(G, sx, sy, 1, 1, 2); icAdd(G, "stool", sx, sy, 1, 1, 0, FS_NONE); } }
      icCenter(G, room, "pooltable", 5, 3, FS_LOW, 0, 1);
      icWall(G, room, r, "booth", 4, 5, FS_LOW, [2, 1, 3]); icWall(G, room, r, "arcade", 2, 2, FS_TALL, [0, 1, 2, 3], { corner: true });
      break;
    }
    case "chamber": {   // council chamber: dais + seat rows facing it
      const dais = icWall(G, room, r, "dais", Math.min(room.w - 4, 12), 3, FS_LOW, [0], { keep: true, center: true });
      void dais; icWall(G, room, r, "flag", 1, 1, FS_LOW, [0], { corner: true }); icWall(G, room, r, "flag", 1, 1, FS_LOW, [0], { corner: true });
      icRows(G, room, "seatrow", Math.max(4, Math.floor((room.w - 7) / 2)), 1, 2, FS_LOW, 0, { margin: 2, m0: 6, split: 3, o: 2 });
      break;
    }
    case "records": case "library": icRows(G, room, "bookshelf", Math.max(3, Math.min(10, room.w - 5)), 1, 3, FS_TALL, room.w >= room.h ? 0 : 1, { margin: 2, split: 2 }); if (t === "library") icTableSet(G, room, r, 4, 2); break;
    case "classroom": {
      icWall(G, room, r, "whiteboard", Math.min(6, room.w - 2), 1, FS_NONE, [0], { keep: true, center: true });
      icWall(G, room, r, "teacherdesk", 3, 2, FS_LOW, [0], { keep: true, center: true, pad: 1 });
      for (let y = room.y + 5; y + 1 <= room.y + room.h - 2; y += 3) for (let x = room.x + 2; x + 2 <= room.x + room.w - 2; x += 3) if (icFree(G, x, y, 2, 1)) { icMark(G, x, y, 2, 1); icAdd(G, "schooldesk", x, y, 2, 1, 0, FS_LOW); }
      break;
    }
    case "gym": icCenter(G, room, "court", Math.max(4, room.w - 6), Math.max(4, room.h - 6), FS_NONE, 0, 0); icWall(G, room, r, "bleachers", Math.min(14, room.w - 4), 3, FS_LOW, [0, 2]); break;
    case "cafeteria": icRows(G, room, "longtable", Math.max(4, Math.min(10, room.w - 6)), 2, 3, FS_LOW, 0, { margin: 2, split: 3 }); icWall(G, room, r, "counter", Math.min(8, room.w - 2), 1, FS_LOW, [0], { v: 1 }); break;
    case "bullpen": for (let y = room.y + 2; y + 2 <= room.y + room.h - 1; y += 4) for (let x = room.x + 2; x + 3 <= room.x + room.w - 1; x += 5) if (icFree(G, x, y, 3, 2)) { icMark(G, x, y, 3, 2); icAdd(G, "desk", x, y, 3, 2, 2, FS_LOW); } icWall(G, room, r, "filing", 1, 1, FS_TALL, [0, 1, 3], { corner: true }); break;
    case "cell": icWall(G, room, r, "cot", 2, 4, FS_LOW, [0, 1, 3]); icWall(G, room, r, "toilet", 1, 2, FS_LOW, [0, 1, 3], { corner: true }); break;
    case "armory": icWall(G, room, r, "gunrack", Math.min(6, room.w - 2), 1, FS_TALL, [0, 1, 3]); icWall(G, room, r, "gunrack", Math.min(6, room.h - 2), 1, FS_TALL, [1, 3]); icWall(G, room, r, "crate", 2, 2, FS_COVER, [0, 1, 2, 3], { corner: true }); break;
    case "interrogation": icTableSet(G, room, r, 2, 2); break;
    case "locker": icWall(G, room, r, "lockers", Math.min(8, room.w - 2), 1, FS_TALL, [0, 1, 3]); icWall(G, room, r, "lockers", Math.min(8, room.h - 2), 1, FS_TALL, [1, 3]); icCenter(G, room, "bench", 4, 1, FS_LOW, 0, 1); break;
    case "bay": {   // fire apparatus bay / auto repair bays / dealership floor
      const n = Math.max(1, Math.floor((room.w - 2) / 8));
      for (let k = 0; k < n; k++) { const x = room.x + 2 + k * 8; if (icFree(G, x, room.y + 2, 5, Math.min(14, room.h - 4))) { const hh = Math.min(14, room.h - 4); icMark(G, x, room.y + 2, 5, hh); icAdd(G, room.bayKind || "firetruck", x, room.y + 2, 5, hh, 2, FS_COVER, cInt(r, 0, 5)); } }
      icWall(G, room, r, "lockers", Math.min(6, room.h - 2), 1, FS_TALL, [1, 3]);
      break;
    }
    case "dorm": icRows(G, room, "bed", 2, 4, 2, FS_LOW, 1, { margin: 1, o: 0, m0: 1 }); icWall(G, room, r, "lockers", 4, 1, FS_TALL, [1, 2, 3]); break;
    case "dayroom": icWall(G, room, r, "sofa", 4, 2, FS_LOW, [0, 1, 3], { pad: 2 }); icWall(G, room, r, "tvstand", 3, 1, FS_LOW, [2, 1, 3]); icTableSet(G, room, r, 4, 2); icWall(G, room, r, "counter", 5, 1, FS_LOW, [0, 1, 3], { v: 1 }); break;
    case "nave": {
      icWall(G, room, r, "altar", Math.min(5, room.w - 4), 2, FS_LOW, [0], { keep: true, center: true, pad: 2 });
      const half = Math.max(3, Math.floor((room.w - 7) / 2));
      for (let y = room.y + 5; y + 2 <= room.y + room.h - 2; y += 3) {
        if (icFree(G, room.x + 2, y, half, 2)) { icMark(G, room.x + 2, y, half, 2); icAdd(G, "pew", room.x + 2, y, half, 2, 2, FS_LOW); }
        const x2 = room.x + room.w - 2 - half;
        if (icFree(G, x2, y, half, 2)) { icMark(G, x2, y, half, 2); icAdd(G, "pew", x2, y, half, 2, 2, FS_LOW); }
      }
      break;
    }
    case "motelunit": icWall(G, room, r, "bed", 3, 4, FS_LOW, [0, 1, 3], { center: true, v: 1 }); icWall(G, room, r, "tvstand", 3, 1, FS_LOW, [1, 3, 2]); icWall(G, room, r, "chair", 1, 1, FS_NONE, [2, 1, 3], { corner: true }); icWall(G, room, r, "nightstand", 1, 1, FS_LOW, [0, 1, 3]); break;
    case "vault": icWall(G, room, r, "safeboxes", Math.min(6, room.w - 1), 1, FS_TALL, [0, 1, 3]); icWall(G, room, r, "safeboxes", Math.min(6, room.h - 1), 1, FS_TALL, [1, 3]); icScatterSmall(G, room, r, "cashbag", 3); break;
    case "teller": icRows(G, room, "desk", 3, 2, 3, FS_LOW, 0, { margin: 2, split: 2 }); break;
    case "exam": icWall(G, room, r, "exambed", 2, 4, FS_LOW, [0, 1, 3]); icWall(G, room, r, "cabinet", 3, 1, FS_TALL, [0, 1, 2, 3]); icWall(G, room, r, "vanity", 2, 1, FS_LOW, [0, 1, 2, 3]); break;
    case "lab": icWall(G, room, r, "counter", Math.min(8, room.w - 2), 1, FS_LOW, [0, 1, 3], { v: 3 }); icWall(G, room, r, "counter", Math.min(8, room.h - 2), 1, FS_LOW, [1, 3], { v: 3 }); icCenter(G, room, "island", 4, 2, FS_LOW, 0, 1); break;
    case "warehouse": {
      icRows(G, room, "rack", Math.max(4, Math.min(16, room.w - 8)), 2, 4, FS_TALL, room.w >= room.h ? 0 : 1, { margin: 3, split: 4, m0: 4 });
      icScatterSmall(G, room, r, "pallet", 5, FS_LOW); icScatterSmall(G, room, r, "box", 4, FS_LOW);
      icWall(G, room, r, "forklift", 2, 4, FS_COVER, [0, 1, 2, 3]);
      break;
    }
    case "barn": {
      for (let y = room.y + 1; y + 4 <= room.y + room.h - 1; y += 5) { if (icFree(G, room.x, y, 4, 4)) { icMark(G, room.x, y, 4, 4); icAdd(G, "stall", room.x, y, 4, 4, 3, FS_LOW); } if (icFree(G, room.x + room.w - 4, y, 4, 4)) { icMark(G, room.x + room.w - 4, y, 4, 4); icAdd(G, "stall", room.x + room.w - 4, y, 4, 4, 1, FS_LOW); } }
      icCenter(G, room, "tractor", 3, 5, FS_COVER, 2, 1); icScatterSmall(G, room, r, "haybale", 5, FS_LOW);
      break;
    }
    case "shed": icWall(G, room, r, "workbench", Math.min(4, room.w), 1, FS_LOW, [0, 1, 3]); icWall(G, room, r, "shelf", 2, 1, FS_TALL, [0, 1, 3]); icScatterSmall(G, room, r, "box", 1, FS_LOW); break;
    case "auditorium": {
      icWall(G, room, r, "cinemascreen", Math.min(room.w - 2, 12), 1, FS_NONE, [0], { keep: true, center: true });
      icRows(G, room, "seatrow", Math.max(4, room.w - 6), 1, 1, FS_LOW, 0, { margin: 2, m0: 5, o: 2 });
      break;
    }
    case "concession": icWall(G, room, r, "barcounter", Math.min(room.w - 4, 10), 1, FS_LOW, [0], { keep: true, center: true }); icWall(G, room, r, "arcade", 2, 2, FS_TALL, [1, 3], { corner: true }); icWall(G, room, r, "plant", 1, 1, FS_LOW, [2], { corner: true }); break;
    case "laundromat": icRows(G, room, "washer", Math.max(4, Math.min(12, room.w - 6)), 2, 3, FS_LOW, 0, { margin: 3, split: 3, m0: 3 }); icWall(G, room, r, "bench", 4, 1, FS_LOW, [2, 1, 3]); break;
    case "showroom": { const n = Math.max(1, Math.floor((room.w - 2) / 7)); for (let k = 0; k < n; k++) { const x = room.x + 2 + k * 7, y = room.y + Math.max(1, Math.floor((room.h - 9) / 2)); if (icFree(G, x, y, 4, 9)) { icMark(G, x, y, 4, 9); icAdd(G, "car", x, y, 4, 9, 2, FS_COVER, cInt(r, 0, 5)); } } icWall(G, room, r, "desk", 3, 2, FS_LOW, [0, 1, 3]); break; }
    case "unitliving": icWall(G, room, r, "sofa", 4, 2, FS_LOW, [0, 1, 3], { pad: 2 }); icWall(G, room, r, "tvstand", 3, 1, FS_LOW, [2, 1, 3]); icWall(G, room, r, "counter", Math.min(5, room.w - 2), 1, FS_LOW, [0, 1, 3], { v: 1 }); icWall(G, room, r, "fridge", 2, 2, FS_TALL, [0, 1, 3], { corner: true }); break;
    case "cabin": icWall(G, room, r, "bed", 2, 4, FS_LOW, [0, 1, 3]); icWall(G, room, r, "stove", 2, 1, FS_LOW, [0, 1, 3]); icTableSet(G, room, r, 2, 2); icWall(G, room, r, "fireplace", 3, 1, FS_LOW, [0, 1, 3]); break;
    default: break;
  }
  // evacuation clutter: knocked-over chairs, scattered boxes in some rooms
  if (A > 30 && r() < 0.35 && t !== "bath" && t !== "cell") icScatterSmall(G, room, r, "box", 1, FS_LOW);
}

// rotate a canonical interior to world orientation. rot: 0 front S, 1 front W, 2 front N, 3 front E
function icRotate(G, rot) {
  if (!rot) return G;
  const W = G.w, H = G.h, nw = rot % 2 ? H : W, nh = rot % 2 ? W : H;
  const out = icNew(nw, nh);
  const map = (x, y) => rot === 1 ? [H - 1 - y, x] : rot === 2 ? [W - 1 - x, H - 1 - y] : [y, W - 1 - x];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const [X, Y] = map(x, y);
    out.c[Y * nw + X] = G.c[y * W + x]; out.rm[Y * nw + X] = G.rm[y * W + x];
  }
  const rr = (x, y, w, h) => rot === 1 ? { x: H - (y + h), y: x, w: h, h: w } : rot === 2 ? { x: W - (x + w), y: H - (y + h), w, h } : { x: y, y: W - (x + w), w: h, h: w };
  out.rooms = G.rooms.map(r => Object.assign({}, r, rr(r.x, r.y, r.w, r.h)));
  out.furn = G.furn.map(f => Object.assign({}, f, rr(f.x, f.y, f.w, f.h), { o: (f.o + rot) % 4 }));
  out.spawnRooms = G.spawnRooms.slice();
  out.parts = G.parts.map(q => rr(q.x, q.y, q.w, q.h));
  out.occ = null;
  return out;
}
// mirror horizontally (canonical) for layout variety
function icMirror(G) {
  const W = G.w, H = G.h;
  for (let y = 0; y < H; y++) for (let x = 0; x < W >> 1; x++) {
    const a = y * W + x, b = y * W + (W - 1 - x);
    let t = G.c[a]; G.c[a] = G.c[b]; G.c[b] = t; t = G.rm[a]; G.rm[a] = G.rm[b]; G.rm[b] = t;
  }
  G.rooms.forEach(r => { r.x = W - (r.x + r.w); });
  G.parts.forEach(q => { q.x = W - (q.x + q.w); });
  G.furn.forEach(f => { f.x = W - (f.x + f.w); if (f.o === 1) f.o = 3; else if (f.o === 3) f.o = 1; });
}

/* --- 6. BUILDING TEMPLATES (canonical: front wall at the bottom) ----------- */
const ICT = {};
function clampI(v, a, b) { return Math.max(a, Math.min(b, v | 0)); }

ICT.house = function (G, b, r) {
  const sp = b.spec || {}, H = G.h, mw = sp.mw || G.w, gw = sp.garage ? sp.gw : 0, gh = sp.gh || 13;
  icRect(G, 0, 0, mw, H);
  if (gw) icRect(G, mw - 1, H - gh, gw + 1, gh);
  const fx0 = 1, fx1 = mw - 2, fy0 = 1, fy1 = H - 2, inner = fy1 - fy0 + 1;
  const wingW = Math.max(10, Math.round((fx1 - fx0 + 1) * cRange(r, 0.40, 0.47)));
  const wx = fx0 + wingW;
  icVWall(G, wx, fy0, fy1);
  const hallH = 3, backH = Math.max(5, Math.floor((inner - hallH - 2) / 2)), hy0 = fy0 + backH + 1;
  icHWall(G, hy0 - 1, fx0, wx - 1); icHWall(G, hy0 + hallH, fx0, wx - 1);
  const frontY0 = hy0 + hallH + 1, frontH = fy1 - frontY0 + 1;
  const R = {};
  const bsplit = fx0 + Math.max(6, Math.round(wingW * cRange(r, 0.56, 0.66)));
  icVWall(G, bsplit, fy0, hy0 - 2);
  R.master = icRoom(G, "master", fx0, fy0, bsplit - fx0, backH);
  R.bathM = icRoom(G, "bath", bsplit + 1, fy0, wx - bsplit - 1, backH);
  R.hall = icRoom(G, "hall", fx0, hy0, wingW, hallH);
  if (wingW >= 18) {
    const s = Math.round(wingW * 0.4);
    icVWall(G, fx0 + s, frontY0, fy1); icVWall(G, fx0 + s + 6, frontY0, fy1);
    R.bed2 = icRoom(G, "bed", fx0, frontY0, s, frontH);
    R.bath = icRoom(G, "bath", fx0 + s + 1, frontY0, 5, frontH);
    R.bed3 = icRoom(G, "bed", fx0 + s + 7, frontY0, wx - (fx0 + s + 7), frontH);
  } else {
    const s = wingW - 6;
    icVWall(G, fx0 + s, frontY0, fy1);
    R.bed2 = icRoom(G, "bed", fx0, frontY0, s, frontH);
    R.bath = icRoom(G, "bath", fx0 + s + 1, frontY0, wx - (fx0 + s + 1), frontH);
  }
  const cx0 = wx + 1, cwid = fx1 - wx;
  const ly0 = fy0 + Math.max(6, Math.round(inner * cRange(r, 0.42, 0.5)));
  icHWall(G, ly0 - 1, cx0, fx1);
  R.living = icRoom(G, "living", cx0, ly0, cwid, fy1 - ly0 + 1);
  const kW = Math.max(7, Math.round(cwid * cRange(r, 0.5, 0.6))), dW = cwid - kW - 1;
  if (dW >= 6) {
    const kx = cx0 + dW; icVWall(G, kx, fy0, ly0 - 2);
    R.dining = icRoom(G, "dining", cx0, fy0, dW, ly0 - 1 - fy0);
    R.kitchen = icRoom(G, "kitchen", kx + 1, fy0, kW, ly0 - 1 - fy0);
  } else R.kitchen = icRoom(G, "kitchen", cx0, fy0, cwid, ly0 - 1 - fy0);
  if (gw) R.garage = icRoom(G, "garage", mw, H - gh + 1, gw - 1, gh - 2);
  icFixWalls(G);
  // circulation
  for (let k = 0; k < hallH; k++) { icSet(G, wx, hy0 + k, IC_FLOOR); G.rm[(hy0 + k) * G.w + wx] = R.hall.id; G.arch.push(wx, hy0 + k); }
  [R.master, R.bathM, R.bed2, R.bath, R.bed3].forEach(x => { if (x) icConnect(G, x, R.hall, r, 2); });
  icConnect(G, R.living, R.dining || R.kitchen, r, 4, IC_FLOOR);
  if (R.dining) icConnect(G, R.dining, R.kitchen, r, 3, IC_FLOOR);
  if (R.garage && !icConnect(G, R.kitchen, R.garage, r, 2)) icConnect(G, R.living, R.garage, r, 2);
  icExtDoor(G, R.living, 2, r, 2);
  icExtDoor(G, R.kitchen, 0, r, 2) || (R.dining && icExtDoor(G, R.dining, 0, r, 2));
  if (R.garage) { for (let x = mw + 1; x <= mw + gw - 3; x++) if (icGet(G, x, H - 1) === IC_EXT) icSet(G, x, H - 1, IC_GDOOR); }
  [R.living, R.master, R.bed2, R.bed3, R.kitchen, R.dining].forEach(x => { if (x) icWindows(G, x, r, x === R.living ? 4 : 3, 3); });
  [R.bath, R.bathM].forEach(x => { if (x) icWindows(G, x, r, 2, 9, true); });
  G.spawnRooms = [R.living, R.kitchen, R.master, R.garage, R.dining].filter(Boolean).map(x => x.id);
};

const FRONT_OF = { store: "sales", grocery: "grocery", pharmacy: "pharmacy", gasstore: "sales", post: "shop", diner: "dinerfront", cafe: "dinerfront", bar: "bar",
  office: "openoffice", bank: "lobby", laundromat: "laundromat", autorepair: "bay", dealership: "showroom", library: "library", shop: "shop", cinema: "concession", hardware: "sales" };
const BACK_OF = { store: ["storage", "office", "restroom"], grocery: ["storage", "storage", "office", "restroom", "restroom"], pharmacy: ["storage", "lab", "restroom"],
  gasstore: ["storage", "restroom", "office"], post: ["storage", "office", "restroom"], diner: ["kitchenpro", "restroom", "restroom"], cafe: ["kitchenpro", "restroom"],
  bar: ["storage", "restroom", "restroom"], office: ["office", "conference", "office", "break", "restroom"], bank: ["vault", "office", "restroom"],
  laundromat: ["office", "restroom"], autorepair: ["office", "storage", "restroom"], dealership: ["office", "office", "restroom"], library: ["records", "office", "restroom"],
  shop: ["storage"], hardware: ["storage", "office", "restroom"] };

ICT.commercial = function (G, b, r) {
  const kind = b.kind || "store", W = G.w, H = G.h;
  icRect(G, 0, 0, W, H);
  if (kind === "cinema") return ICT.cinema(G, b, r);
  const backD = clampI(Math.round(H * (kind === "diner" || kind === "cafe" ? 0.34 : 0.28)), 5, 12), wy = 1 + backD;
  icHWall(G, wy, 1, W - 2);
  const front = icRoom(G, FRONT_OF[kind] || "shop", 1, wy + 1, W - 2, H - 2 - wy);
  if (kind === "autorepair") front.bayKind = "carlift";
  // back strip rooms
  const types = (BACK_OF[kind] || ["storage"]).slice();
  const backRooms = [];
  let x = 1;
  const totalW = W - 2, weights = types.map(t => t === "kitchenpro" ? 3 : t === "storage" || t === "vault" || t === "conference" ? 2 : t === "restroom" ? 0.8 : 1.2);
  const wsum = weights.reduce((a, c) => a + c, 0);
  types.forEach((t, i) => {
    let w = i === types.length - 1 ? (W - 1 - x) : Math.max(4, Math.round((totalW - types.length + 1) * weights[i] / wsum));
    if (x + w > W - 1) w = W - 1 - x;
    if (w < 3) return;
    if (i < types.length - 1 && x + w < W - 2) icVWall(G, x + w, 1, wy - 1);
    backRooms.push(icRoom(G, t, x, 1, w, backD));
    x += w + 1;
  });
  icFixWalls(G);
  backRooms.forEach(br => icConnect(G, br, front, r, br.type === "kitchenpro" || br.type === "storage" ? 3 : 2));
  // front door(s): double door near the middle; autorepair gets two vehicle openings
  if (kind === "autorepair") {
    const n = Math.max(1, Math.floor((W - 6) / 12));
    for (let k = 0; k < n; k++) { const x0 = 3 + k * 12; for (let q = 0; q < 8 && x0 + q < W - 2; q++) { icSet(G, x0 + q, H - 1, k === 0 ? IC_FLOOR : IC_GDOOR); if (k === 0) G.arch.push(x0 + q, H - 1); } }
    icExtDoor(G, front, 2, r, 2, IC_EDOOR, W - 6);
  } else {
    const dl = W >= 24 ? 4 : 3;
    icExtDoor(G, front, 2, r, dl, IC_EDOOR, Math.floor((W - 2 - dl) / 2) + (kind === "bank" ? 0 : cInt(r, -2, 2)));
    // storefront glazing
    icWindows(G, front, r, kind === "office" || kind === "bank" || kind === "library" ? 4 : 6, kind === "office" ? 2 : 1);
  }
  const svc = backRooms.find(br => br.type === "storage" || br.type === "kitchenpro") || backRooms[0];
  if (svc) icExtDoor(G, svc, 0, r, 2);
  backRooms.forEach(br => { if (br.type === "office" || br.type === "conference" || br.type === "break") icWindows(G, br, r, 3, 4); });
  // bank teller line, office lobby partition
  if (kind === "bank") {
    const cy = front.y + Math.floor(front.h * 0.45);
    for (let xx = front.x; xx < front.x + front.w - 3; xx++) if (icGet(G, xx, cy) === IC_FLOOR) icSet(G, xx, cy, IC_COUNTER);
    const tel = { id: G.rooms.length, type: "teller", x: front.x, y: front.y, w: front.w, h: Math.max(2, cy - front.y) };
    G.rooms.push(tel); front.y = cy + 1; front.h = Math.max(2, G.h - 2 - cy);
  }
  if (kind === "office" && front.w >= 20) {
    const lx = front.x + Math.min(10, Math.floor(front.w * 0.3));
    icVWall(G, lx, front.y, front.y + front.h - 1);
    const lobby = icRoom(G, "reception", front.x, front.y, lx - front.x, front.h);
    const rest = icRoom(G, "openoffice", lx + 1, front.y, front.x + front.w - lx - 1, front.h);
    G.rooms.splice(G.rooms.indexOf(front), 1); G.rooms.forEach((rr, i) => { rr.id = i; });
    for (let j = 0; j < G.h; j++) for (let i = 0; i < G.w; i++) G.rm[j * G.w + i] = 255;
    G.rooms.forEach(rr => { for (let j = rr.y; j < rr.y + rr.h; j++) for (let i = rr.x; i < rr.x + rr.w; i++) if (icGet(G, i, j) === IC_FLOOR) G.rm[j * G.w + i] = rr.id; });
    icConnect(G, lobby, rest, r, 3);
  }
  G.spawnRooms = G.rooms.filter(x => x.w * x.h >= 24 && x.type !== "restroom" && x.type !== "vault").map(x => x.id);
};

ICT.cinema = function (G, b, r) {
  const W = G.w, H = G.h, lobD = clampI(Math.round(H * 0.3), 6, 10), wy = H - 2 - lobD;
  icHWall(G, wy, 1, W - 2);
  const mid = Math.floor(W / 2);
  icVWall(G, mid, 1, wy - 1);
  const a1 = icRoom(G, "auditorium", 1, 1, mid - 1, wy - 1), a2 = icRoom(G, "auditorium", mid + 1, 1, W - 2 - mid, wy - 1);
  const lob = icRoom(G, "concession", 1, wy + 1, W - 2, lobD);
  icFixWalls(G);
  icConnect(G, a1, lob, r, 3); icConnect(G, a2, lob, r, 3);
  icExtDoor(G, lob, 2, r, 4, IC_EDOOR, Math.floor((W - 6) / 2));
  icWindows(G, lob, r, 4, 2);
  icExtDoor(G, a1, 3, r, 2); icExtDoor(G, a2, 1, r, 2);
  G.spawnRooms = [a1.id, a2.id, lob.id];
};

const CIVIC_PROG = {
  council:  { hall: "chamber", hallW: [16, 22], back: ["office", "records", "office", "mayor", "restroom", "conference", "office"], front: ["office", "restroom", "break", "office"], lobby: "lobby", cor: 4 },
  school:   { hall: "gym", hallW: [18, 24], back: ["classroom", "classroom", "classroom", "classroom", "cafeteria"], front: ["office", "restroom", "classroom", "classroom", "restroom"], lobby: "lobby", cor: 4, roomW: 14 },
  police:   { hall: null, back: ["bullpen", "cell", "cell", "cell", "armory", "locker"], front: ["interrogation", "office", "restroom", "office"], lobby: "reception", cor: 3 },
  clinic:   { hall: null, back: ["exam", "exam", "exam", "lab", "office"], front: ["exam", "exam", "restroom", "office"], lobby: "waiting", cor: 3 },
  fire:     { hall: "bay", hallW: [18, 26], back: ["dorm", "dayroom", "locker"], front: ["office", "restroom"], lobby: "reception", cor: 3 }
};
ICT.civic = function (G, b, r) {
  const P = CIVIC_PROG[b.kind] || CIVIC_PROG.council, W = G.w, H = G.h;
  icRect(G, 0, 0, W, H);
  let hall = null, x0 = 1;
  if (P.hall) {
    const hw = clampI(cInt(r, P.hallW[0], P.hallW[1]), 10, Math.floor(W * 0.45));
    icVWall(G, hw + 1, 1, H - 2);
    hall = icRoom(G, P.hall, 1, 1, hw, H - 2);
    if (b.kind === "fire") hall.bayKind = "firetruck";
    x0 = hw + 2;
  }
  const x1 = W - 2, corH = P.cor, cy0 = 1 + Math.floor((H - 2 - corH) / 2);
  icHWall(G, cy0 - 1, x0, x1); icHWall(G, cy0 + corH, x0, x1);
  const cor = icRoom(G, "hall", x0, cy0, x1 - x0 + 1, corH);
  const backH = cy0 - 2, frontY = cy0 + corH + 1, frontH = H - 2 - frontY + 1;
  const rooms = [];
  const prefW = t => t === "cafeteria" || t === "bullpen" ? clampI(Math.round((x1 - x0) * 0.28), 10, 22) : (t === "cell" ? 5 : t === "restroom" ? 6 : (P.roomW || cInt(r, 8, 12)));
  const fillSeg = (types, ti, xa, xb, y, h) => {
    let x = xa;
    while (x <= xb - 2) {
      const t = types[ti % types.length]; ti++;
      let w = prefW(t);
      if (xb - (x + w) < 5) w = xb - x + 1;          // the last room absorbs a too-small remainder
      if (w < 3) break;
      if (x + w <= xb) icVWall(G, x + w, y, y + h - 1);
      rooms.push(icRoom(G, t, x, y, w, h));
      x += w + 1;
    }
    return ti;
  };
  fillSeg(P.back, 0, x0, x1, 1, backH);
  const span = x1 - x0 + 1, lobbyW = clampI(Math.round(span * 0.22), 8, 14), lobbyX = x0 + Math.floor((span - lobbyW) / 2);
  if (lobbyX - 1 > x0) icVWall(G, lobbyX - 1, frontY, frontY + frontH - 1);
  if (lobbyX + lobbyW <= x1) icVWall(G, lobbyX + lobbyW, frontY, frontY + frontH - 1);
  let ti = fillSeg(P.front, 0, x0, lobbyX - 2, frontY, frontH);
  const lobR = icRoom(G, P.lobby, lobbyX, frontY, lobbyW, frontH); lobR.isLobby = true; rooms.push(lobR);
  fillSeg(P.front, ti, lobbyX + lobbyW + 1, x1, frontY, frontH);
  icFixWalls(G);
  rooms.forEach(rm => {
    if (rm.type === "cell") {   // barred front onto the corridor + a cell door
      const wyy = rm.y + rm.h;
      for (let xx = rm.x; xx < rm.x + rm.w; xx++) if (icGet(G, xx, wyy) === IC_INT) icSet(G, xx, wyy, IC_BARS);
      icSet(G, rm.x + 1, wyy, IC_DOOR); icSet(G, rm.x + 2, wyy, IC_DOOR);
    } else icConnect(G, rm, cor, r, rm.isLobby ? 4 : (rm.type === "gym" || rm.type === "cafeteria" || rm.type === "bullpen" ? 3 : 2), rm.isLobby ? IC_FLOOR : IC_DOOR);
  });
  if (hall) { icConnect(G, hall, cor, r, 3); icConnect(G, hall, cor, r, 3); }
  const lob = rooms.find(x => x.isLobby);
  if (lob) icExtDoor(G, lob, 2, r, 4, IC_EDOOR, Math.floor((lob.w - 4) / 2));
  icExtDoor(G, cor, 1, r, 2);
  if (hall) {
    if (b.kind === "fire") { const n = Math.max(1, Math.floor((hall.w - 2) / 8)); for (let k = 0; k < n; k++) for (let q = 0; q < 6; q++) { icSet(G, hall.x + 1 + k * 8 + q, H - 1, k === 0 ? IC_FLOOR : IC_GDOOR); if (k === 0) G.arch.push(hall.x + 1 + q, H - 1); } }
    else icExtDoor(G, hall, 3, r, 3);
  }
  rooms.forEach(rm => { if (rm.type !== "cell" && rm.type !== "restroom" && rm.type !== "armory" && rm.type !== "vault") icWindows(G, rm, r, rm.isLobby ? 3 : 3, 3); });
  if (hall && b.kind !== "fire") icWindows(G, hall, r, 3, 4);
  G.spawnRooms = G.rooms.filter(x => x.w * x.h >= 30 && x.type !== "restroom").map(x => x.id);
};

ICT.motel = function (G, b, r) {
  const W = G.w, H = G.h;
  icRect(G, 0, 0, W, H);
  const offW = 10, uw = 8;
  icVWall(G, offW + 1, 1, H - 2);
  const off = icRoom(G, "reception", 1, 1, offW, H - 2);
  const units = [];
  let x = offW + 2;
  while (x + uw - 1 <= W - 2) {
    const w = (W - 2 - x + 1 < uw * 2 - 1) ? (W - 1 - x) : uw - 1;
    if (x + w <= W - 2) icVWall(G, x + w, 1, H - 2);
    const bathD = 5;
    icHWall(G, 1 + bathD, x, x + w - 1);
    const bath = icRoom(G, "bath", x, 1, w, bathD), bed = icRoom(G, "motelunit", x, 2 + bathD, w, H - 3 - bathD);
    units.push([bed, bath]);
    x += w + 1;
  }
  icFixWalls(G);
  icExtDoor(G, off, 2, r, 2);
  icWindows(G, off, r, 3, 2);
  units.forEach(([bed, bath]) => { icConnect(G, bed, bath, r, 2); icExtDoor(G, bed, 2, r, 2, IC_EDOOR, 1); icWindows(G, bed, r, 2, 1); });
  G.spawnRooms = [off.id].concat(units.map(u => u[0].id));
};

ICT.shoprow = function (G, b, r) {
  const W = G.w, H = G.h, kinds = b.units || ["shop"];
  icRect(G, 0, 0, W, H);
  const n = kinds.length, uw = Math.floor((W - 1) / n);
  const units = [];
  for (let k = 0; k < n; k++) {
    const x = 1 + k * uw, w = (k === n - 1 ? W - 1 - x : uw - 1);
    if (k < n - 1) icVWall(G, x + w, 1, H - 2);
    const bd = clampI(Math.round(H * 0.3), 4, 8);
    icHWall(G, 1 + bd, x, x + w - 1);
    const kind = kinds[k];
    const back = icRoom(G, kind === "diner" || kind === "cafe" ? "kitchenpro" : "storage", x, 1, w, bd);
    const front = icRoom(G, FRONT_OF[kind] || "shop", x, 2 + bd, w, H - 3 - bd);
    units.push([front, back]);
  }
  icFixWalls(G);
  units.forEach(([front, back]) => { icConnect(G, front, back, r, 2); icExtDoor(G, front, 2, r, 2, IC_EDOOR, Math.floor(front.w / 2) - 1); icWindows(G, front, r, 4, 1); icExtDoor(G, back, 0, r, 2); });
  G.spawnRooms = units.map(u => u[0].id);
};

ICT.apartment = function (G, b, r) {
  const W = G.w, H = G.h, n = Math.max(2, Math.min(4, Math.floor(W / 13)));
  icRect(G, 0, 0, W, H);
  const uw = Math.floor((W - 1) / n), units = [];
  for (let k = 0; k < n; k++) {
    const x = 1 + k * uw, w = (k === n - 1 ? W - 1 - x : uw - 1);
    if (k < n - 1) icVWall(G, x + w, 1, H - 2);
    const bd = clampI(Math.round((H - 2) * 0.45), 5, 9);
    icHWall(G, 1 + bd, x, x + w - 1);
    const bw = Math.max(4, w - 6);
    icVWall(G, x + bw, 1, bd);
    const bed = icRoom(G, "bed", x, 1, bw, bd), bath = icRoom(G, "bath", x + bw + 1, 1, w - bw - 1, bd);
    const liv = icRoom(G, "unitliving", x, 2 + bd, w, H - 3 - bd);
    units.push([liv, bed, bath]);
  }
  icFixWalls(G);
  units.forEach(([liv, bed, bath]) => { icConnect(G, liv, bed, r, 2); icConnect(G, liv, bath, r, 2) || icConnect(G, bed, bath, r, 2); icExtDoor(G, liv, 2, r, 2); icWindows(G, liv, r, 3, 2); icWindows(G, bed, r, 3, 2); });
  G.spawnRooms = units.map(u => u[0].id);
};

ICT.warehouse = function (G, b, r) {
  const W = G.w, H = G.h;
  icRect(G, 0, 0, W, H);
  const ow = clampI(Math.round(W * 0.2), 8, 14), od = clampI(Math.round(H * 0.3), 6, 10);
  icVWall(G, ow + 1, H - 1 - od, H - 2); icHWall(G, H - 2 - od, 1, ow);
  const office = icRoom(G, "office", 1, H - 1 - od, ow, od);
  const wh = icRoom(G, "warehouse", 1, 1, W - 2, H - 2);
  // the office sits inside the warehouse rect: drop its cells from the warehouse room
  for (let j = office.y; j < office.y + office.h; j++) for (let i = office.x; i < office.x + office.w; i++) G.rm[j * W + i] = office.id;
  icFixWalls(G);
  icConnect(G, office, { x: ow + 2, y: office.y, w: 3, h: office.h }, r, 2);
  icExtDoor(G, office, 2, r, 2);
  icWindows(G, office, r, 3, 2);
  // loading docks on the back wall, one roll-up left open
  const n = Math.max(2, Math.floor((W - 6) / 10));
  for (let k = 0; k < n; k++) { const x0 = 3 + k * Math.floor((W - 6) / n); for (let q = 0; q < 6 && x0 + q < W - 2; q++) { icSet(G, x0 + q, 0, k === 1 ? IC_FLOOR : IC_GDOOR); if (k === 1) G.arch.push(x0 + q, 0); } }
  icExtDoor(G, { x: ow + 3, y: 1, w: W - ow - 5, h: H - 2 }, 2, r, 2, IC_EDOOR);
  G.spawnRooms = [wh.id, office.id];
};

ICT.barn = function (G, b, r) {
  const W = G.w, H = G.h;
  icRect(G, 0, 0, W, H);
  const rm = icRoom(G, "barn", 1, 1, W - 2, H - 2);
  const c = Math.floor(W / 2) - 3;
  for (let q = 0; q < 6; q++) { icSet(G, c + q, H - 1, IC_FLOOR); icSet(G, c + q, 0, IC_FLOOR); G.arch.push(c + q, H - 1, c + q, 0); }
  G.spawnRooms = [rm.id];
};
ICT.shed = function (G, b, r) {
  icRect(G, 0, 0, G.w, G.h);
  const rm = icRoom(G, "shed", 1, 1, G.w - 2, G.h - 2);
  icExtDoor(G, rm, 2, r, 2);
  G.spawnRooms = [];
};
ICT.cabin = function (G, b, r) {
  const W = G.w, H = G.h;
  icRect(G, 0, 0, W, H);
  const bw = 5;
  icVWall(G, W - 2 - bw, 1, 5);
  icHWall(G, 6, W - 1 - bw, W - 2);
  const main = icRoom(G, "cabin", 1, 1, W - 2, H - 2);
  const bath = icRoom(G, "bath", W - 1 - bw, 1, bw, 5);
  for (let j = bath.y; j < bath.y + bath.h; j++) for (let i = bath.x; i < bath.x + bath.w; i++) G.rm[j * W + i] = bath.id;
  icFixWalls(G);
  icConnect(G, bath, { x: bath.x, y: 7, w: bath.w, h: 3 }, r, 2);
  icExtDoor(G, main, 2, r, 2);
  icWindows(G, main, r, 2, 3);
  G.spawnRooms = [main.id];
};
ICT.church = function (G, b, r) {
  const W = G.w, H = G.h;
  icRect(G, 0, 0, W, H);
  const vd = 5, vy = H - 2 - vd;
  icHWall(G, vy, 1, W - 2);
  const sw = 6;
  icVWall(G, W - 2 - sw, 1, 6); icHWall(G, 7, W - 1 - sw, W - 2);
  const nave = icRoom(G, "nave", 1, 1, W - 2, vy - 1);
  const sac = icRoom(G, "office", W - 1 - sw, 1, sw, 6);
  for (let j = sac.y; j < sac.y + sac.h; j++) for (let i = sac.x; i < sac.x + sac.w; i++) G.rm[j * W + i] = sac.id;
  const vest = icRoom(G, "hall", 1, vy + 1, W - 2, vd);
  icFixWalls(G);
  icConnect(G, vest, nave, r, 4, IC_DOOR);
  icConnect(G, sac, { x: sac.x, y: 8, w: sac.w, h: 3 }, r, 2);
  icExtDoor(G, vest, 2, r, 4, IC_EDOOR, Math.floor((W - 6) / 2));
  icWindows(G, nave, r, 2, 3);
  G.spawnRooms = [nave.id];
};

// door runs from the final (world-oriented) grid
function icFindDoors(G) {
  const doors = [], seen = new Uint8Array(G.w * G.h);
  for (let y = 0; y < G.h; y++) for (let x = 0; x < G.w; x++) {
    const i = y * G.w + x, v = G.c[i];
    if ((v !== IC_DOOR && v !== IC_EDOOR) || seen[i]) continue;
    let len = 1, axis = "x";
    if (icGet(G, x + 1, y) === v) { while (icGet(G, x + len, y) === v) { seen[y * G.w + x + len] = 1; len++; } axis = "x"; }
    else if (icGet(G, x, y + 1) === v) { while (icGet(G, x, y + len) === v) { seen[(y + len) * G.w + x] = 1; len++; } axis = "y"; }
    else { axis = (isWalk(icGet(G, x, y - 1)) || isWalk(icGet(G, x, y + 1))) ? "x" : "y"; }
    seen[i] = 1;
    doors.push({ x, y, len, axis, ext: v === IC_EDOOR });
  }
  return doors;
}

function cityInterior(b) {
  if (b.int) return b.int;
  const r = cRng(b.seed ^ 0x5bd1e995);
  let G = icNew(b.cw, b.ch);
  const T = b.type === "house" || b.type === "farmhouse" ? ICT.house : (ICT[b.type] || ICT.commercial);
  try { T(G, b, r); } catch (e) { G = icNew(b.cw, b.ch); icRect(G, 0, 0, b.cw, b.ch); const rm = icRoom(G, "storage", 1, 1, b.cw - 2, b.ch - 2); icExtDoor(G, rm, 2, r, 2); if (typeof window !== "undefined" && window.trackProgress) window.trackProgress("cityInterior fallback " + b.type + ": " + e.message, true); }
  icFixWalls(G);
  icOccInit(G);
  for (const room of G.rooms) icFurnish(G, room, r);
  if (b.mirror) icMirror(G);
  G = icRotate(G, b.rot);
  G.doors = icFindDoors(G);
  b.int = G; CITY.interiorCount = (CITY.interiorCount || 0) + 1;
  return G;
}

/* --- 7. BLOCKS & LOTS ------------------------------------------------------ */
let CITY_BID = 1;
function cityCell(mx, my) {
  const key = mx * 100 + my;
  if (!CITY.cellCache) CITY.cellCache = new Map();
  let S = CITY.cellCache.get(key);
  if (!S) { S = cityCellStreets(mx, my); CITY.cellCache.set(key, S); if (CITY.cellCache.size > 400) CITY.cellCache.delete(CITY.cellCache.keys().next().value); }
  return S;
}
function cityBlock(mx, my, i, j) {
  const key = mx + "," + my + "," + i + "," + j;
  const C = CITY.blockCache;
  let B = C.get(key);
  if (B) { C.delete(key); C.set(key, B); return B; }
  B = cityGenBlock(mx, my, i, j, key);
  C.set(key, B);
  if (C.size > 700) { let n = C.size - 600; for (const k of C.keys()) { if (n-- <= 0) break; C.delete(k); } }
  return B;
}
// all blocks overlapping a world-metre rectangle
function cityBlocksInRect(x0, y0, x1, y1) {
  const out = [];
  const mx0 = Math.max(0, Math.floor(x0 / 1000)), mx1 = Math.min(63, Math.floor(x1 / 1000));
  const my0 = Math.max(0, Math.floor(y0 / 1000)), my1 = Math.min(63, Math.floor(y1 / 1000));
  for (let my = my0; my <= my1; my++) for (let mx = mx0; mx <= mx1; mx++) {
    const S = cityCell(mx, my);
    for (let i = 0; i < S.vx.length - 1; i++) {
      const bx0 = S.vx[i].x + S.vx[i].w / 2, bx1 = S.vx[i + 1].x - S.vx[i + 1].w / 2;
      if (bx1 < x0 - 40 || bx0 > x1 + 40) continue;
      for (let j = 0; j < S.hy.length - 1; j++) {
        const by0 = S.hy[j].y + S.hy[j].w / 2, by1 = S.hy[j + 1].y - S.hy[j + 1].w / 2;
        if (by1 < y0 - 40 || by0 > y1 + 40) continue;
        out.push(cityBlock(mx, my, i, j));
      }
    }
  }
  return out;
}

const T2 = m => Math.round(m * 2);       // metres -> tiles
function rotOfFront(f) { return f === "S" ? 0 : f === "W" ? 1 : f === "N" ? 2 : 3; }
// place a building of canonical size cw x ch inside lot (tiles) facing `front`, setback & offset along the street
function mkBuilding(B, type, lot, cw, ch, front, setback, off, extra) {
  const rot = rotOfFront(front), ww = rot % 2 ? ch : cw, hh = rot % 2 ? cw : ch;
  let x, y;
  if (front === "S") { x = lot.x0 + off; y = lot.y1 - setback - hh; }
  else if (front === "N") { x = lot.x0 + off; y = lot.y0 + setback; }
  else if (front === "W") { x = lot.x0 + setback; y = lot.y0 + off; }
  else { x = lot.x1 - setback - ww; y = lot.y0 + off; }
  const b = Object.assign({ id: CITY_BID++, key: B.key + ":" + B.blds.length, type, x, y, w: ww, h: hh, cw, ch, rot, front,
    seed: cH(CITY.seed, B.seed, B.blds.length, 99), cls: B.cls, mirror: false, int: null, block: B.key }, extra || {});
  b.uid = B.key + "#" + B.blds.length;
  B.blds.push(b);
  return b;
}
// canonical cell -> world tile for a building
function cityCanonToWorld(b, cx, cy) {
  if (b.mirror) cx = b.cw - 1 - cx;
  const W = b.cw, H = b.ch;
  let X, Y;
  if (b.rot === 0) { X = cx; Y = cy; } else if (b.rot === 1) { X = H - 1 - cy; Y = cx; } else if (b.rot === 2) { X = W - 1 - cx; Y = H - 1 - cy; } else { X = cy; Y = W - 1 - cx; }
  return [b.x + X, b.y + Y];
}
function addProp(B, t, x, y, w, h, s, extra) { const p = Object.assign({ t, x, y, w, h, s }, extra || {}); B.props.push(p); return p; }
function addSurf(B, t, x0, y0, x1, y1, v) { B.surf.push({ t, x0: Math.min(x0, x1), y0: Math.min(y0, y1), x1: Math.max(x0, x1), y1: Math.max(y0, y1), v: v || 0 }); }
function addFence(B, kind, x0, y0, x1, y1) { if (x0 === x1 || y0 === y1) B.fences.push({ kind, x0: Math.min(x0, x1), y0: Math.min(y0, y1), x1: Math.max(x0, x1), y1: Math.max(y0, y1) }); }
function addSpawn(B, kind, n, extra) { const s = Object.assign({ id: B.key + "/" + B.spawns.length, kind, n }, extra || {}); B.spawns.push(s); return s; }
function splitLen(len, minW, maxW, r) {
  const out = []; let rest = len;
  while (rest >= minW) { let w = cInt(r, minW, maxW); if (rest - w < minW) w = rest; out.push(w); rest -= w; }
  if (rest > 0 && out.length) out[out.length - 1] += rest;
  return out;
}
// split a row strip into lots facing `front`. strip in tiles
function rowLots(strip, front, minW, maxW, r) {
  const horiz = front === "N" || front === "S", len = horiz ? strip.x1 - strip.x0 : strip.y1 - strip.y0;
  const ws = splitLen(len, minW, maxW, r), lots = [];
  let p = horiz ? strip.x0 : strip.y0;
  for (const w of ws) {
    lots.push(horiz ? { x0: p, y0: strip.y0, x1: p + w, y1: strip.y1, front } : { x0: strip.x0, y0: p, x1: strip.x1, y1: p + w, front });
    p += w;
  }
  return lots;
}

function cityGenBlock(mx, my, i, j, key) {
  const S = cityCell(mx, my), L = S.vx[i], Rr = S.vx[i + 1], T = S.hy[j], Bo = S.hy[j + 1];
  const B = { key, mx, my, i, j, cls: S.cls, seed: cH(CITY.seed, mx * 64 + my, i * 16 + j, 4242),
    x0: T2(L.x + L.w / 2), x1: T2(Rr.x - Rr.w / 2), y0: T2(T.y + T.w / 2), y1: T2(Bo.y - Bo.w / 2),
    side: { N: T, S: Bo, W: L, E: Rr }, blds: [], props: [], surf: [], fences: [], spawns: [] };
  const r = cRng(B.seed);
  if (B.x1 - B.x0 < 16 || B.y1 - B.y0 < 16) return B;
  const civicCity = CITY.civic.get(mx + "," + my);
  try {
    switch (S.cls) {
      case CL_SUBURB: genSuburb(B, r); break;
      case CL_URBAN: genUrban(B, r, civicCity); break;
      case CL_DOWNTOWN: genDowntown(B, r, civicCity); break;
      case CL_INDUSTRIAL: genIndustrial(B, r); break;
      case CL_RURAL: genRural(B, r, true); break;
      case CL_FOREST: genForest(B, r); break;
      case CL_LAKE: genLake(B, r); break;
      default: genRural(B, r, false);
    }
    genStreetSide(B, r);
  } catch (e) { if (typeof window !== "undefined" && window.trackProgress) window.trackProgress("cityGenBlock " + key + ": " + e.message, true); }
  return B;
}

/* --- residential lot -------------------------------------------------------- */
function genHouseLot(B, lot, r, opt = {}) {
  const front = lot.front, horiz = front === "N" || front === "S";
  const lw = horiz ? lot.x1 - lot.x0 : lot.y1 - lot.y0, ld = horiz ? lot.y1 - lot.y0 : lot.x1 - lot.x0;
  if (lw < 22 || ld < 26) { addProp(B, "tree", (lot.x0 + lot.x1) / 2, (lot.y0 + lot.y1) / 2, 1, 1, FS_COVER, { v: cInt(r, 0, 3) }); return; }
  let garage = !opt.farm && r() < 0.72, gw = garage ? cInt(r, 12, 14) : 0, gh = garage ? cInt(r, 12, 14) : 0;
  let H = Math.min(cInt(r, 18, 23), ld - 14), mw = cInt(r, 26, 38);
  if (H < 16) { H = Math.min(16, ld - 8); }
  if (mw + gw > lw - 6) { mw = Math.max(22, lw - 6 - gw); if (mw + gw > lw - 6) { garage = false; gw = 0; gh = 0; mw = Math.min(mw, lw - 6); } }
  gh = Math.min(gh, H);
  if (mw < 20 || H < 15) { addProp(B, "tree", (lot.x0 + lot.x1) / 2, (lot.y0 + lot.y1) / 2, 1, 1, FS_COVER, { v: 1 }); return; }
  const cw = mw + gw, setback = Math.min(cInt(r, 10, 16), ld - H - 8), off = Math.floor((lw - cw) / 2) + cInt(r, -2, 2);
  const b = mkBuilding(B, opt.farm ? "farmhouse" : "house", lot, cw, H, front, setback, Math.max(2, Math.min(lw - cw - 2, off)),
    { spec: { mw, gw, gh, garage }, mat: r() < 0.55 ? "wood" : "brick", roof: r() < 0.6 ? "gable" : "hip", imp: 0 });
  b.mirror = r() < 0.5;
  // driveway from the garage door (or the side of the house) to the street
  const ftile = (cx, cy) => cityCanonToWorld(b, cx, cy);
  let dA, dB;
  if (garage) { dA = ftile(mw + 1, H - 1); dB = ftile(mw + gw - 3, H - 1); }
  else { dA = ftile(cw - 1, H - 1); dB = ftile(cw - 1, H - 1); }
  const surfT = opt.farm ? "gravel" : "drive";
  if (front === "S") { const xa = Math.min(dA[0], dB[0]) - (garage ? 0 : -1), xb = Math.max(dA[0], dB[0]) + (garage ? 1 : 6); addSurf(B, surfT, xa, b.y + b.h, xb, lot.y1 + 4); if (r() < 0.5) addProp(B, "car", xa + 1, b.y + b.h + 2, 4, 9, FS_COVER, { o: 2, v: cInt(r, 0, 7) }); }
  else if (front === "N") { const xa = Math.min(dA[0], dB[0]) - (garage ? 1 : 6), xb = Math.max(dA[0], dB[0]) + (garage ? 0 : -1); addSurf(B, surfT, xa, lot.y0 - 4, xb + 1, b.y); if (r() < 0.5) addProp(B, "car", xa + 1, b.y - 11, 4, 9, FS_COVER, { o: 0, v: cInt(r, 0, 7) }); }
  else if (front === "W") { const ya = Math.min(dA[1], dB[1]) - (garage ? 1 : 6), yb = Math.max(dA[1], dB[1]) + (garage ? 0 : -1); addSurf(B, surfT, lot.x0 - 4, ya, b.x, yb + 1); if (r() < 0.5) addProp(B, "car", b.x - 11, ya + 1, 9, 4, FS_COVER, { o: 3, v: cInt(r, 0, 7) }); }
  else { const ya = Math.min(dA[1], dB[1]) - (garage ? 0 : -1), yb = Math.max(dA[1], dB[1]) + (garage ? 1 : 6); addSurf(B, surfT, b.x + b.w, ya, lot.x1 + 4, yb); if (r() < 0.5) addProp(B, "car", b.x + b.w + 2, ya + 1, 9, 4, FS_COVER, { o: 1, v: cInt(r, 0, 7) }); }
  // front walk + mailbox, front-yard tree & foundation bushes
  const fd = ftile(Math.floor(mw / 2), H - 1);
  if (front === "S") { addSurf(B, "walk", fd[0] - 1, b.y + b.h, fd[0] + 2, lot.y1 + 1); addProp(B, "mailbox", fd[0] + 3, lot.y1 - 1, 1, 1, FS_LOW); }
  else if (front === "N") { addSurf(B, "walk", fd[0] - 1, lot.y0 - 1, fd[0] + 2, b.y); addProp(B, "mailbox", fd[0] + 3, lot.y0, 1, 1, FS_LOW); }
  else if (front === "W") { addSurf(B, "walk", lot.x0 - 1, fd[1] - 1, b.x, fd[1] + 2); addProp(B, "mailbox", lot.x0, fd[1] + 3, 1, 1, FS_LOW); }
  else { addSurf(B, "walk", b.x + b.w, fd[1] - 1, lot.x1 + 1, fd[1] + 2); addProp(B, "mailbox", lot.x1 - 1, fd[1] + 3, 1, 1, FS_LOW); }
  if (r() < 0.75) { const tx = horiz ? lot.x0 + cInt(r, 3, Math.max(3, lw - 4)) : (front === "W" ? lot.x0 + cInt(r, 3, Math.max(3, setback - 3)) : lot.x1 - cInt(r, 3, Math.max(3, setback - 3)));
    const ty = horiz ? (front === "S" ? lot.y1 - cInt(r, 3, Math.max(3, setback - 3)) : lot.y0 + cInt(r, 3, Math.max(3, setback - 3))) : lot.y0 + cInt(r, 3, Math.max(3, lw - 4));
    addProp(B, "tree", tx, ty, 1, 1, FS_COVER, { v: cInt(r, 0, 3), sz: cRange(r, 0.8, 1.3) }); }
  if (r() < 0.6) { // foundation hedge along the front wall
    if (front === "S") addProp(B, "hedge", b.x + 2, b.y + b.h, Math.min(8, b.w - 4), 1, FS_LOW); else if (front === "N") addProp(B, "hedge", b.x + 2, b.y - 1, Math.min(8, b.w - 4), 1, FS_LOW);
    else if (front === "W") addProp(B, "hedge", b.x - 1, b.y + 2, 1, Math.min(8, b.h - 4), FS_LOW); else addProp(B, "hedge", b.x + b.w, b.y + 2, 1, Math.min(8, b.h - 4), FS_LOW);
  }
  // fenced back yard: rear line + side lines back from mid-house, gate gap on one side
  const fk = opt.fence || (B.cls === CL_RURAL || opt.farm ? "picket" : (r() < 0.75 ? "wood" : "chain"));
  if (!opt.noFence) {
    if (front === "S") { const my = b.y + Math.floor(b.h / 2); addFence(B, fk, lot.x0, lot.y0, lot.x1, lot.y0); addFence(B, fk, lot.x0, lot.y0, lot.x0, my); addFence(B, fk, lot.x1 - 1, lot.y0, lot.x1 - 1, my);
      addFence(B, fk, lot.x0, my, b.x, my); addFence(B, fk, b.x + b.w, my, lot.x1 - 1 - 2, my); }
    else if (front === "N") { const my = b.y + Math.floor(b.h / 2); addFence(B, fk, lot.x0, lot.y1 - 1, lot.x1, lot.y1 - 1); addFence(B, fk, lot.x0, my, lot.x0, lot.y1 - 1); addFence(B, fk, lot.x1 - 1, my, lot.x1 - 1, lot.y1 - 1);
      addFence(B, fk, lot.x0 + 2, my, b.x, my); addFence(B, fk, b.x + b.w, my, lot.x1 - 1, my); }
    else if (front === "W") { const mxx = b.x + Math.floor(b.w / 2); addFence(B, fk, lot.x1 - 1, lot.y0, lot.x1 - 1, lot.y1); addFence(B, fk, mxx, lot.y0, lot.x1 - 1, lot.y0); addFence(B, fk, mxx, lot.y1 - 1, lot.x1 - 1, lot.y1 - 1);
      addFence(B, fk, mxx, lot.y0, mxx, b.y); addFence(B, fk, mxx, b.y + b.h, mxx, lot.y1 - 1 - 2); }
    else { const mxx = b.x + Math.floor(b.w / 2); addFence(B, fk, lot.x0, lot.y0, lot.x0, lot.y1); addFence(B, fk, lot.x0, lot.y0, mxx, lot.y0); addFence(B, fk, lot.x0, lot.y1 - 1, mxx, lot.y1 - 1);
      addFence(B, fk, mxx, lot.y0 + 2, mxx, b.y); addFence(B, fk, mxx, b.y + b.h, mxx, lot.y1 - 1); }
  }
  // back-yard features
  const by = backYardRect(b, lot);
  if (by && by.x1 - by.x0 > 10 && by.y1 - by.y0 > 10) {
    if (r() < 0.6) addProp(B, "tree", cRange(r, by.x0 + 2, by.x1 - 2), cRange(r, by.y0 + 2, by.y1 - 2), 1, 1, FS_COVER, { v: cInt(r, 0, 3), sz: cRange(r, 0.9, 1.5) });
    if (r() < 0.16 && by.x1 - by.x0 > 18 && by.y1 - by.y0 > 14) { const pw = 12, ph = 7, px = Math.floor((by.x0 + by.x1 - pw) / 2), py = Math.floor((by.y0 + by.y1 - ph) / 2); addSurf(B, "pool", px, py, px + pw, py + ph); }
    else if (r() < 0.35) addProp(B, "playset", cRange(r, by.x0 + 3, by.x1 - 7), cRange(r, by.y0 + 3, by.y1 - 5), 5, 3, FS_LOW);
    if (r() < 0.45) addProp(B, "grill", cRange(r, by.x0 + 2, by.x1 - 3), cRange(r, by.y0 + 2, by.y1 - 3), 1, 1, FS_LOW);
    if (r() < 0.14 && by.x1 - by.x0 > 14) { // garden shed with an interior
      const sl = { x0: by.x0 + 1, y0: by.y0 + 1, x1: by.x0 + 9, y1: by.y0 + 11 };
      mkBuilding(B, "shed", sl, 8, 9, front === "S" ? "S" : front === "N" ? "N" : front, 0, 0, { mat: "wood", roof: "gable", imp: 0 });
    }
  }
  if (r() < (opt.occ || (B.cls === CL_SUBURB ? 0.3 : 0.38))) addSpawn(B, "room", r() < 0.7 ? 1 : 2, { bid: b.id, bkey: b.key });
  return b;
}
function backYardRect(b, lot) {
  if (b.front === "S") return { x0: lot.x0 + 1, y0: lot.y0 + 1, x1: lot.x1 - 1, y1: b.y - 1 };
  if (b.front === "N") return { x0: lot.x0 + 1, y0: b.y + b.h + 1, x1: lot.x1 - 1, y1: lot.y1 - 1 };
  if (b.front === "W") return { x0: b.x + b.w + 1, y0: lot.y0 + 1, x1: lot.x1 - 1, y1: lot.y1 - 1 };
  return { x0: lot.x0 + 1, y0: lot.y0 + 1, x1: b.x - 1, y1: lot.y1 - 1 };
}

/* --- commercial lots -------------------------------------------------------- */
const BLD_NAMES = {
  gasstore: ["FUEL STOP", "QUIK GAS", "GAS-N-GO", "SPEEDY FUEL", "STAR MART"], diner: ["MEL'S DINER", "BLUE PLATE", "MOONLIGHT DINER", "ROUTE 9 DINER", "SUNNY SIDE"],
  store: ["GENERAL STORE", "VALUE MART", "CORNER STORE", "DOLLAR KING", "HANDY MART"], grocery: ["FRESH FOODS", "GROCER'S", "MARKET FRESH", "SAVE-MORE"],
  pharmacy: ["PHARMACY", "RX DRUGS", "HEALTH PLUS"], office: ["OFFICES", "CORPORATE PARK", "PLAZA OFFICES", "TECH HUB"], bank: ["FIRST NATIONAL BANK", "CITIZENS BANK", "TRUST & SAVINGS"],
  laundromat: ["COIN LAUNDRY", "SUDS"], autorepair: ["AUTO REPAIR", "TIRES & LUBE", "JOE'S GARAGE"], dealership: ["AUTO SALES", "MOTORS"], library: ["PUBLIC LIBRARY"],
  bar: ["THE TAVERN", "LAST CALL", "PUB 21"], cafe: ["CAFE", "COFFEE HOUSE", "BAKERY"], shop: ["BOUTIQUE", "HARDWARE", "BOOKS", "PAWN", "BARBER", "FLORIST", "TOYS", "ELECTRONICS"],
  motel: ["MOTEL", "MOTOR INN", "ROADSIDE INN"], cinema: ["CINEMA", "BIJOU THEATER"], post: ["POST OFFICE"], hardware: ["HARDWARE"],
  council: ["CITY HALL"], school: ["HIGH SCHOOL", "ELEMENTARY", "MIDDLE SCHOOL"], police: ["POLICE DEPT"], fire: ["FIRE STATION"], clinic: ["CLINIC", "MEDICAL CENTER"], church: ["CHURCH"], warehouse: ["WAREHOUSE", "DISTRIBUTION", "LOGISTICS"]
};
function bName(kind, r) { const a = BLD_NAMES[kind] || ["SHOP"]; return a[Math.floor(r() * a.length)]; }
// a commercial building with a parking lot in front (strip mall style) or at the sidewalk (downtown)
function genCommercialLot(B, lot, r, kind, opt = {}) {
  const front = lot.front, horiz = front === "N" || front === "S";
  const lw = horiz ? lot.x1 - lot.x0 : lot.y1 - lot.y0, ld = horiz ? lot.y1 - lot.y0 : lot.x1 - lot.x0;
  const sizes = { store: [24, 40, 18, 26], grocery: [50, 80, 36, 50], pharmacy: [26, 36, 20, 26], gasstore: [26, 32, 18, 22], diner: [26, 36, 18, 24], cafe: [16, 22, 14, 18],
    office: [28, 56, 20, 34], bank: [24, 32, 20, 26], laundromat: [20, 28, 16, 22], autorepair: [28, 40, 20, 26], dealership: [34, 52, 22, 30], library: [30, 44, 24, 32],
    bar: [20, 28, 16, 22], shop: [16, 24, 16, 22], cinema: [36, 52, 34, 44], post: [24, 32, 18, 24], hardware: [30, 44, 22, 30] };
  const sz = sizes[kind] || sizes.store;
  let cw = Math.min(cInt(r, sz[0], sz[1]), lw - 4), ch = Math.min(cInt(r, sz[2], sz[3]), ld - (opt.atWalk ? 4 : 18));
  if (cw < 14 || ch < 12) { if (lw >= 22 && ld >= 26 && !opt.noHouse) return genHouseLot(B, lot, r); return null; }
  const setback = opt.atWalk ? cInt(r, 0, 2) : Math.max(4, ld - ch - cInt(r, 4, 8));
  const b = mkBuilding(B, kind === "cinema" ? "commercial" : "commercial", lot, cw, ch, front, setback, Math.floor((lw - cw) / 2), { kind, name: bName(kind, r), mat: r() < 0.5 ? "brick" : "masonry", roof: "flat", imp: 1 });
  // parking lot between building and street
  if (!opt.atWalk && setback >= 10) {
    if (front === "S") addSurf(B, "lot", lot.x0, b.y + b.h, lot.x1, lot.y1, 1); else if (front === "N") addSurf(B, "lot", lot.x0, lot.y0, lot.x1, b.y, 1);
    else if (front === "W") addSurf(B, "lot", lot.x0, lot.y0, b.x, lot.y1, 1); else addSurf(B, "lot", b.x + b.w, lot.y0, lot.x1, lot.y1, 1);
    parkCars(B, lot, b, r, 0.35);
    // pylon sign near the street
    const sx = front === "W" ? lot.x0 + 2 : front === "E" ? lot.x1 - 3 : lot.x0 + 2, sy = front === "N" ? lot.y0 + 2 : front === "S" ? lot.y1 - 3 : lot.y0 + 2;
    addProp(B, "pylon", sx, sy, 1, 1, FS_COVER, { label: b.name, kind });
  }
  // dumpster behind
  const by = backYardRect(b, lot);
  if (by && by.x1 - by.x0 > 6 && by.y1 - by.y0 > 5) addProp(B, "dumpster", by.x0 + 2, by.y0 + 1, 4, 2, FS_COVER);
  const n = kind === "grocery" || kind === "office" || kind === "cinema" ? cInt(r, 2, 4) : kind === "bank" ? cInt(r, 2, 3) : cInt(r, 1, 3);
  if (r() < (opt.occ || 0.62)) addSpawn(B, "room", n, { bid: b.id, bkey: b.key, heavy: kind === "bank" || kind === "office" ? 0.3 : 0.12 });
  return b;
}
// stalls perpendicular to the building front, some with abandoned cars
function parkCars(B, lot, b, r, fill) {
  const front = b.front;
  if (front === "S" || front === "N") {
    const y = front === "S" ? b.y + b.h + 2 : b.y - 11;
    for (let x = lot.x0 + 2; x + 5 <= lot.x1 - 2; x += 6) {
      addProp(B, "stall", x, y, 5, 9, FS_NONE);
      if (r() < fill) addProp(B, "car", x + 0.5, y, 4, 9, FS_COVER, { o: front === "S" ? 2 : 0, v: cInt(r, 0, 7) });
    }
  } else {
    const x = front === "E" ? b.x + b.w + 2 : b.x - 11;
    for (let y = lot.y0 + 2; y + 5 <= lot.y1 - 2; y += 6) {
      addProp(B, "stall", x, y, 9, 5, FS_NONE);
      if (r() < fill) addProp(B, "car", x, y + 0.5, 9, 4, FS_COVER, { o: front === "E" ? 1 : 3, v: cInt(r, 0, 7) });
    }
  }
}
// corner gas station: store at the back, canopy + pump islands toward the street, price sign at the corner
function genGasStation(B, lot, r) {
  const front = lot.front, horiz = front === "N" || front === "S";
  const lw = horiz ? lot.x1 - lot.x0 : lot.y1 - lot.y0, ld = horiz ? lot.y1 - lot.y0 : lot.x1 - lot.x0;
  if (lw < 48 || ld < 50) return genCommercialLot(B, lot, r, "store");
  addSurf(B, "lot", lot.x0, lot.y0, lot.x1, lot.y1, 2);
  const cw = Math.min(30, lw - 10), ch = 20;
  const b = mkBuilding(B, "commercial", lot, cw, ch, front, ld - ch - 3, Math.floor((lw - cw) / 2), { kind: "gasstore", name: bName("gasstore", r), mat: "masonry", roof: "flat", imp: 1 });
  // canopy between store and street
  const cw2 = Math.min(44, lw - 8), cd = 22;
  let cx, cy, cWW, cHH;
  if (front === "S") { cWW = cw2; cHH = cd; cx = lot.x0 + Math.floor((lw - cw2) / 2); cy = lot.y1 - 6 - cd; }
  else if (front === "N") { cWW = cw2; cHH = cd; cx = lot.x0 + Math.floor((lw - cw2) / 2); cy = lot.y0 + 6; }
  else if (front === "W") { cWW = cd; cHH = cw2; cx = lot.x0 + 6; cy = lot.y0 + Math.floor((lw - cw2) / 2); }
  else { cWW = cd; cHH = cw2; cx = lot.x1 - 6 - cd; cy = lot.y0 + Math.floor((lw - cw2) / 2); }
  addProp(B, "canopy", cx, cy, cWW, cHH, FS_NONE, { label: b.name });
  // pump islands
  const nI = Math.max(2, Math.floor(cw2 / 14));
  for (let k = 0; k < nI; k++) for (let row = 0; row < 2; row++) {
    if (horiz) { const px = cx + 4 + k * Math.floor((cw2 - 8) / nI) + 3, py = cy + 4 + row * 10; addProp(B, "pump", px, py, 5, 2, FS_COVER); if (r() < 0.22) addProp(B, "car", px, py + 3, 9, 4, FS_COVER, { o: 1, v: cInt(r, 0, 7) }); }
    else { const py = cy + 4 + k * Math.floor((cw2 - 8) / nI) + 3, px = cx + 4 + row * 10; addProp(B, "pump", px, py, 2, 5, FS_COVER); if (r() < 0.22) addProp(B, "car", px + 3, py, 4, 9, FS_COVER, { o: 2, v: cInt(r, 0, 7) }); }
  }
  for (const [qx, qy] of [[cx, cy], [cx + cWW - 1, cy], [cx, cy + cHH - 1], [cx + cWW - 1, cy + cHH - 1]]) addProp(B, "pillar", qx, qy, 1, 1, FS_COVER);
  // price sign on the street corner, air pump, ice chest, dumpster
  addProp(B, "pricesign", front === "E" ? lot.x1 - 3 : lot.x0 + 1, front === "S" ? lot.y1 - 3 : lot.y0 + 1, 2, 1, FS_COVER, { label: b.name });
  const by = backYardRect(b, lot);
  if (by) { addProp(B, "dumpster", by.x0 + 1, by.y0, 4, 2, FS_COVER); }
  addProp(B, "icechest", b.x + (horiz ? 2 : -2), b.y + (horiz ? (front === "S" ? b.h : -2) : 2), 2, 1, FS_LOW);
  addProp(B, "airpump", front === "W" ? lot.x1 - 3 : lot.x0 + 3, front === "N" ? lot.y1 - 3 : lot.y0 + 3, 1, 1, FS_COVER);
  if (r() < 0.62) addSpawn(B, "room", cInt(r, 1, 2), { bid: b.id, bkey: b.key });
  if (r() < 0.5) addSpawn(B, "guard", cInt(r, 1, 2), { x: cx + cWW / 2, y: cy + cHH / 2 });
  return b;
}
// civic building occupying (most of) a whole block, with a plaza / field / parking
function genCivicBlock(B, r, kind, opt = {}) {
  const lot = { x0: B.x0 + 2, y0: B.y0 + 2, x1: B.x1 - 2, y1: B.y1 - 2 };
  // front faces the most important adjacent street
  const sides = [["N", B.side.N], ["S", B.side.S], ["W", B.side.W], ["E", B.side.E]].sort((a, b) => a[1].r - b[1].r || b[1].w - a[1].w);
  const front = opt.front || sides[0][0];
  lot.front = front;
  const horiz = front === "N" || front === "S";
  const lw = horiz ? lot.x1 - lot.x0 : lot.y1 - lot.y0, ld = horiz ? lot.y1 - lot.y0 : lot.x1 - lot.x0;
  const S = { council: [80, 120, 50, 72], school: [90, 130, 48, 64], police: [56, 76, 36, 46], fire: [56, 70, 34, 42], clinic: [56, 80, 36, 48], church: [34, 46, 24, 30] }[kind];
  const cw = Math.min(cInt(r, S[0], S[1]), lw - 8), ch = Math.min(cInt(r, S[2], S[3]), Math.floor(ld * (kind === "school" ? 0.5 : 0.62)));
  const setback = kind === "council" ? Math.floor((ld - ch) * 0.62) : kind === "school" ? 12 : Math.max(8, Math.floor((ld - ch) * 0.4));
  const type = kind === "church" ? "church" : "civic";
  const b = mkBuilding(B, type, lot, cw, ch, front, setback, Math.floor((lw - cw) / 2), { kind, name: bName(kind, r), mat: kind === "council" || kind === "church" ? "stone" : "masonry", roof: kind === "church" ? "gable" : "flat", imp: kind === "council" ? 3 : 2, cityName: opt.cityName });
  const fr = { S: [0, 1], N: [0, -1], W: [-1, 0], E: [1, 0] }[front];
  if (kind === "council") {   // plaza, fountain, flags, benches, statue, trees
    let px0, py0, px1, py1;
    if (front === "S") { px0 = b.x - 6; px1 = b.x + b.w + 6; py0 = b.y + b.h; py1 = lot.y1; } else if (front === "N") { px0 = b.x - 6; px1 = b.x + b.w + 6; py0 = lot.y0; py1 = b.y; }
    else if (front === "W") { px0 = lot.x0; px1 = b.x; py0 = b.y - 6; py1 = b.y + b.h + 6; } else { px0 = b.x + b.w; px1 = lot.x1; py0 = b.y - 6; py1 = b.y + b.h + 6; }
    addSurf(B, "plaza", px0, py0, px1, py1);
    const fx = (px0 + px1) / 2, fy = (py0 + py1) / 2;
    addProp(B, "fountain", fx - 4, fy - 4, 8, 8, FS_COVER);
    for (let k = -1; k <= 1; k++) addProp(B, "flagpole", fx + (horiz ? k * 5 : (front === "W" ? (px1 - fx) - 3 : -(fx - px0) + 3)), fy + (horiz ? (front === "S" ? -(fy - py0) + 3 : (py1 - fy) - 3) : k * 5), 1, 1, FS_COVER);
    for (let k = 0; k < 6; k++) addProp(B, "bench", fx + Math.cos(k * 1.047) * 11 - 1, fy + Math.sin(k * 1.047) * 11, 3, 1, FS_LOW, { o: k });
    for (let k = 0; k < 8; k++) addProp(B, "tree", cRange(r, px0 + 2, px1 - 2), cRange(r, py0 + 2, py1 - 2), 1, 1, FS_COVER, { v: 0, sz: 1.2 });
    addProp(B, "statue", fx - 1 + fr[1] * 9, fy - 1 + fr[0] * 9, 2, 2, FS_COVER);
    addSpawn(B, "room", cInt(r, 6, 9), { bid: b.id, bkey: b.key, heavy: 0.45, elite: 1 });
    addSpawn(B, "guard", cInt(r, 2, 3), { x: fx, y: fy });
  } else if (kind === "school") {
    const by = backYardRect(b, lot);
    if (by) { addSurf(B, "field", by.x0 + 4, by.y0 + 4, by.x1 - 4, by.y1 - 4); addProp(B, "bleachers", by.x0 + 6, by.y0 + 1, Math.min(20, by.x1 - by.x0 - 12), 3, FS_LOW); }
    parkBus(B, b, lot, r);
    addSpawn(B, "room", cInt(r, 4, 7), { bid: b.id, bkey: b.key, heavy: 0.2 });
  } else if (kind === "church") {
    const by = backYardRect(b, lot);
    if (by && r() < 0.6) {   // a modest churchyard (<= 30 x 20 m), not the whole civic block
      const gx0 = Math.max(by.x0 + 3, Math.floor((by.x0 + by.x1) / 2) - 30), gx1 = Math.min(by.x1 - 3, gx0 + 60), gy0 = by.y0 + 3, gy1 = Math.min(by.y1 - 3, by.y0 + 43);
      for (let gy = gy0; gy < gy1; gy += 4) for (let gx = gx0; gx < gx1; gx += 3) if (r() < 0.55) addProp(B, "grave", gx, gy, 1, 1, FS_LOW, { v: cInt(r, 0, 3) });
    }
    commercialParking(B, b, lot, r);
    addSpawn(B, "room", cInt(r, 2, 4), { bid: b.id, bkey: b.key });
  } else {
    commercialParking(B, b, lot, r, kind === "police" ? "police" : kind === "fire" ? null : null);
    addSpawn(B, "room", cInt(r, kind === "police" ? 4 : 2, kind === "police" ? 7 : 4), { bid: b.id, bkey: b.key, heavy: kind === "police" ? 0.4 : 0.15 });
  }
  return b;
}
function commercialParking(B, b, lot, r, carKind) {
  let x0, y0, x1, y1;
  if (b.front === "S") { x0 = lot.x0; x1 = lot.x1; y0 = b.y + b.h + 1; y1 = lot.y1; } else if (b.front === "N") { x0 = lot.x0; x1 = lot.x1; y0 = lot.y0; y1 = b.y - 1; }
  else if (b.front === "W") { x0 = lot.x0; x1 = b.x - 1; y0 = lot.y0; y1 = lot.y1; } else { x0 = b.x + b.w + 1; x1 = lot.x1; y0 = lot.y0; y1 = lot.y1; }
  if (x1 - x0 < 12 || y1 - y0 < 12) return;
  addSurf(B, "lot", x0, y0, x1, y1, 1);
  parkCars(B, { x0, y0, x1, y1 }, b, r, 0.4);
  if (carKind === "police") for (let k = 0; k < 3; k++) addProp(B, "car", x0 + 3 + k * 6, y0 + 3, 4, 9, FS_COVER, { o: 0, v: 8 });
}
function parkBus(B, b, lot, r) {
  if (b.front === "S" || b.front === "N") { const y = b.front === "S" ? lot.y1 - 8 : lot.y0 + 2; for (let k = 0; k < 2; k++) addProp(B, "bus", lot.x0 + 6 + k * 30, y, 24, 5, FS_COVER, { o: 1 }); }
  else { const x = b.front === "E" ? lot.x1 - 8 : lot.x0 + 2; for (let k = 0; k < 2; k++) addProp(B, "bus", x, lot.y0 + 6 + k * 30, 5, 24, FS_COVER, { o: 2 }); }
}
function genPark(B, r) {
  addSurf(B, "park", B.x0, B.y0, B.x1, B.y1);
  const cx = (B.x0 + B.x1) / 2, cy = (B.y0 + B.y1) / 2;
  addSurf(B, "path", B.x0, cy - 2, B.x1, cy + 2); addSurf(B, "path", cx - 2, B.y0, cx + 2, B.y1);
  if (r() < 0.5 && B.x1 - B.x0 > 80) addSurf(B, "water", cx + 10, cy + 10, Math.min(B.x1 - 8, cx + 10 + cInt(r, 18, 34)), Math.min(B.y1 - 8, cy + 10 + cInt(r, 12, 26)), 1);
  const n = Math.floor((B.x1 - B.x0) * (B.y1 - B.y0) / 420);
  for (let k = 0; k < n; k++) { const x = cRange(r, B.x0 + 3, B.x1 - 3), y = cRange(r, B.y0 + 3, B.y1 - 3); if (Math.abs(x - cx) > 4 && Math.abs(y - cy) > 4) addProp(B, "tree", x, y, 1, 1, FS_COVER, { v: cInt(r, 0, 3), sz: cRange(r, 0.9, 1.6) }); }
  for (let k = 0; k < 6; k++) addProp(B, "bench", cx + (k % 2 ? 4 : -7), cy - 18 + k * 7, 3, 1, FS_LOW, { o: k % 2 ? 1 : 3 });
  addProp(B, "playset", cx - 22, cy - 20, 6, 4, FS_LOW); addProp(B, "gazebo", cx - 5, cy - 5, 10, 10, FS_NONE);
  if (r() < 0.5) addSpawn(B, "patrol", cInt(r, 2, 3), { pts: [[cx - 30, cy], [cx + 30, cy], [cx, cy + 30], [cx, cy - 30]] });
}
function genParkingBlock(B, r) {
  addSurf(B, "lot", B.x0, B.y0, B.x1, B.y1, 1);
  for (let y = B.y0 + 3; y + 9 <= B.y1 - 3; y += 22) for (let x = B.x0 + 3; x + 5 <= B.x1 - 3; x += 6) {
    addProp(B, "stall", x, y, 5, 9, FS_NONE); addProp(B, "stall", x, y + 10, 5, 9, FS_NONE);
    if (r() < 0.45) addProp(B, "car", x + 0.5, y, 4, 9, FS_COVER, { o: 0, v: cInt(r, 0, 7) });
    if (r() < 0.45) addProp(B, "car", x + 0.5, y + 10, 4, 9, FS_COVER, { o: 2, v: cInt(r, 0, 7) });
  }
  addProp(B, "booth", B.x0 + 2, B.y0 + 2, 4, 4, FS_COVER);
  if (r() < 0.5) addSpawn(B, "patrol", 2, { pts: [[B.x0 + 8, B.y0 + 8], [B.x1 - 8, B.y0 + 8], [B.x1 - 8, B.y1 - 8], [B.x0 + 8, B.y1 - 8]] });
}

/* --- district generators ---------------------------------------------------- */
function primaryFronts(B) {
  const w = B.x1 - B.x0, h = B.y1 - B.y0, s = B.side;
  const ns = Math.min(s.N.r, s.S.r), ew = Math.min(s.W.r, s.E.r);
  if (ns < ew) return ["N", "S"]; if (ew < ns) return ["W", "E"];
  return w >= h ? ["N", "S"] : ["W", "E"];
}
function rowStrips(B, fronts, maxDepth) {
  const w = B.x1 - B.x0, h = B.y1 - B.y0;
  if (fronts[0] === "N") { const d = Math.min(maxDepth, Math.floor(h / 2)); return [{ x0: B.x0, y0: B.y0, x1: B.x1, y1: B.y0 + d, front: "N", road: B.side.N }, { x0: B.x0, y0: B.y1 - d, x1: B.x1, y1: B.y1, front: "S", road: B.side.S }]; }
  const d = Math.min(maxDepth, Math.floor(w / 2));
  return [{ x0: B.x0, y0: B.y0, x1: B.x0 + d, y1: B.y1, front: "W", road: B.side.W }, { x0: B.x1 - d, y0: B.y0, x1: B.x1, y1: B.y1, front: "E", road: B.side.E }];
}
function genSuburb(B, r) {
  const roll = r();
  const arterial = Math.min(B.side.N.r, B.side.S.r, B.side.W.r, B.side.E.r) <= 1;
  if (roll < 0.05 && B.x1 - B.x0 > 120) return genPark(B, r);
  if (roll < 0.075 && B.x1 - B.x0 > 160 && B.y1 - B.y0 > 140) return genCivicBlock(B, r, "school");
  if (roll < 0.11) return genCivicBlock(B, r, "church");
  const strips = rowStrips(B, primaryFronts(B), 120);
  strips.forEach((st, si) => {
    const lots = rowLots(st, st.front, 38, 50, r);
    lots.forEach((lot, li) => {
      if (arterial && st.road.r <= 1 && (li === 0 || li === lots.length - 1) && r() < 0.35) { const gl = mergeLots(lots, li, 2); if (gl) { genGasStation(B, gl, r); lots.splice(li === 0 ? 0 : lots.length - 2, 2); } return; }
      genHouseLot(B, lot, r);
    });
  });
}
function mergeLots(lots, li, n) {
  const sel = li === 0 ? lots.slice(0, n) : lots.slice(lots.length - n);
  if (sel.length < n) return null;
  return { x0: Math.min(...sel.map(l => l.x0)), y0: Math.min(...sel.map(l => l.y0)), x1: Math.max(...sel.map(l => l.x1)), y1: Math.max(...sel.map(l => l.y1)), front: sel[0].front };
}
const URBAN_COMM = ["store", "diner", "pharmacy", "office", "bank", "laundromat", "autorepair", "bar", "cafe", "dealership", "post", "hardware", "motel", "store", "diner", "office"];
function genUrban(B, r, civicCity) {
  const roll = r(), bw = B.x1 - B.x0, bh = B.y1 - B.y0;
  if (civicCity !== undefined && !CITY._civicDone) { /* towns: city hall in the cell nearest the centre (first block generated there) */ }
  if (civicCity !== undefined && B.i === 2 && B.j === 2) return genCivicBlock(B, r, "council", { cityName: CITY.cities[civicCity].name });
  if (roll < 0.06 && bw > 100) return genPark(B, r);
  if (roll < 0.10 && bw > 150 && bh > 130) return genCivicBlock(B, r, "school");
  if (roll < 0.14) return genCivicBlock(B, r, "church");
  if (roll < 0.165) return genCivicBlock(B, r, "police");
  if (roll < 0.19) return genCivicBlock(B, r, "fire");
  if (roll < 0.215) return genCivicBlock(B, r, "clinic");
  if (roll < 0.25 && bw > 140) { const lot = { x0: B.x0 + 2, y0: B.y0 + 2, x1: B.x1 - 2, y1: B.y1 - 2, front: primaryFronts(B)[0] }; return genCommercialLot(B, lot, r, r() < 0.5 ? "grocery" : "cinema"); }
  const strips = rowStrips(B, primaryFronts(B), 90);
  strips.forEach(st => {
    const comm = st.road.r <= 1;
    const lots = comm ? rowLots(st, st.front, 56, 90, r) : rowLots(st, st.front, 38, 48, r);
    lots.forEach((lot, li) => {
      if (comm) {
        if ((li === 0 || li === lots.length - 1) && r() < 0.3) return genGasStation(B, lot, r);
        const kind = cPick(r, URBAN_COMM);
        if (kind === "motel") return genMotelLot(B, lot, r);
        return genCommercialLot(B, lot, r, kind);
      }
      if (r() < 0.18) return genApartmentLot(B, lot, r);
      genHouseLot(B, lot, r, { occ: 0.4 });
    });
  });
}
function genMotelLot(B, lot, r) {
  const horiz = lot.front === "N" || lot.front === "S", lw = horiz ? lot.x1 - lot.x0 : lot.y1 - lot.y0, ld = horiz ? lot.y1 - lot.y0 : lot.x1 - lot.x0;
  const cw = Math.min(lw - 6, cInt(r, 60, 96)), ch = 18;
  if (cw < 40 || ld < ch + 18) return genCommercialLot(B, lot, r, "store");
  const b = mkBuilding(B, "motel", lot, cw, ch, lot.front, ld - ch - 3, Math.floor((lw - cw) / 2), { kind: "motel", name: bName("motel", r), mat: "brick", roof: "flat", imp: 1 });
  commercialParking(B, b, lot, r);
  addProp(B, "pylon", lot.x0 + 2, lot.front === "S" ? lot.y1 - 3 : lot.y0 + 2, 1, 1, FS_COVER, { label: b.name, kind: "motel" });
  addSpawn(B, "room", cInt(r, 2, 4), { bid: b.id, bkey: b.key });
  return b;
}
function genApartmentLot(B, lot, r) {
  const horiz = lot.front === "N" || lot.front === "S", lw = horiz ? lot.x1 - lot.x0 : lot.y1 - lot.y0, ld = horiz ? lot.y1 - lot.y0 : lot.x1 - lot.x0;
  const cw = Math.min(lw - 4, 52), ch = Math.min(22, ld - 12);
  if (cw < 28 || ch < 16) return genHouseLot(B, lot, r);
  const b = mkBuilding(B, "apartment", lot, cw, ch, lot.front, Math.min(10, ld - ch - 4), Math.floor((lw - cw) / 2), { kind: "apartment", mat: "brick", roof: "hip", imp: 0 });
  addSurf(B, "walk", horiz ? b.x : lot.x0, horiz ? (lot.front === "S" ? b.y + b.h : lot.y0) : b.y, horiz ? b.x + b.w : (lot.front === "W" ? b.x : lot.x1), horiz ? (lot.front === "S" ? lot.y1 : b.y) : b.y + b.h);
  if (r() < 0.45) addSpawn(B, "room", cInt(r, 1, 3), { bid: b.id, bkey: b.key });
  return b;
}
const DT_KINDS = ["office", "office", "bank", "store", "diner", "cafe", "bar", "library", "pharmacy", "office", "cinema", "hardware"];
const SHOP_KINDS = ["shop", "shop", "cafe", "bar", "pharmacy", "shop", "diner", "shop"];
function genDowntown(B, r, civicCity) {
  const bw = B.x1 - B.x0, bh = B.y1 - B.y0;
  if (civicCity !== undefined && B.i === Math.floor(cityCell(B.mx, B.my).vx.length / 2) - 1 && B.j === Math.floor(cityCell(B.mx, B.my).hy.length / 2) - 1)
    return genCivicBlock(B, r, "council", { cityName: CITY.cities[civicCity].name });
  const roll = r();
  if (roll < 0.08) return genParkingBlock(B, r);
  if (roll < 0.12) return genPark(B, r);
  if (roll < 0.15) return genCivicBlock(B, r, "police");
  if (roll < 0.18) return genCivicBlock(B, r, "fire");
  if (roll < 0.21) return genCivicBlock(B, r, "church");
  const strips = rowStrips(B, primaryFronts(B), 60);
  strips.forEach(st => {
    const lots = rowLots(st, st.front, 40, 80, r);
    lots.forEach(lot => {
      if (r() < 0.45) { // main-street shop row sharing party walls
        const horiz = lot.front === "N" || lot.front === "S", lw = horiz ? lot.x1 - lot.x0 : lot.y1 - lot.y0, ld = horiz ? lot.y1 - lot.y0 : lot.x1 - lot.x0;
        const n = Math.max(2, Math.min(5, Math.floor(lw / 18))), units = [];
        for (let k = 0; k < n; k++) units.push(cPick(r, SHOP_KINDS));
        const ch = Math.min(ld - 6, cInt(r, 34, 44));
        const b = mkBuilding(B, "shoprow", lot, lw - 2, ch, lot.front, 1, 1, { units, names: units.map(u => bName(u, r)), mat: r() < 0.6 ? "brick" : "stone", roof: "flat", imp: 1 });
        const by = backYardRect(b, lot); if (by && by.x1 - by.x0 > 6 && by.y1 - by.y0 > 4) addProp(B, "dumpster", by.x0 + 2, by.y0 + 1, 4, 2, FS_COVER);
        if (r() < 0.7) addSpawn(B, "room", cInt(r, 2, 4), { bid: b.id, bkey: b.key, heavy: 0.15 });
      } else genCommercialLot(B, lot, r, cPick(r, DT_KINDS), { atWalk: true, noHouse: true, occ: 0.7 });
    });
  });
  if (r() < 0.5) addSpawn(B, "patrol", cInt(r, 2, 3), { pts: [[B.x0 - 6, B.y0 - 6], [B.x1 + 6, B.y0 - 6], [B.x1 + 6, B.y1 + 6], [B.x0 - 6, B.y1 + 6]] });
}
function genIndustrial(B, r) {
  const lots = rowLots({ x0: B.x0, y0: B.y0, x1: B.x1, y1: B.y1 }, primaryFronts(B)[0], 90, 160, r);
  lots.forEach(lot => {
    const horiz = lot.front === "N" || lot.front === "S", lw = horiz ? lot.x1 - lot.x0 : lot.y1 - lot.y0, ld = horiz ? lot.y1 - lot.y0 : lot.x1 - lot.x0;
    addSurf(B, "lot", lot.x0 + 1, lot.y0 + 1, lot.x1 - 1, lot.y1 - 1, 3);
    const cw = Math.min(lw - 16, cInt(r, 70, 140)), ch = Math.min(ld - 30, cInt(r, 50, 80));
    if (cw > 30 && ch > 24) {
      const b = mkBuilding(B, "warehouse", lot, cw, ch, lot.front, Math.max(14, Math.floor((ld - ch) * 0.3)), Math.floor((lw - cw) / 2), { kind: "warehouse", name: bName("warehouse", r), mat: "metal", roof: "flat", imp: 1 });
      const by = backYardRect(b, lot);
      if (by) {
        for (let k = 0; k < 4; k++) if (r() < 0.7) { if (horiz) addProp(B, "trailer", by.x0 + 4 + k * 8, by.y0 + 2, 5, Math.min(26, by.y1 - by.y0 - 4), FS_TALL, { o: 0 }); else addProp(B, "trailer", by.x0 + 2, by.y0 + 4 + k * 8, Math.min(26, by.x1 - by.x0 - 4), 5, FS_TALL, { o: 1 }); }
      }
      for (let k = 0; k < 5; k++) if (r() < 0.6) addProp(B, "container", cRange(r, lot.x0 + 4, lot.x1 - 16), cRange(r, lot.y0 + 4, lot.y1 - 8), horiz ? 12 : 5, horiz ? 5 : 12, FS_TALL, { v: cInt(r, 0, 5) });
      addSpawn(B, "room", cInt(r, 2, 5), { bid: b.id, bkey: b.key, heavy: 0.25 });
      if (r() < 0.5) addSpawn(B, "guard", 2, { x: (lot.x0 + lot.x1) / 2, y: (lot.y0 + lot.y1) / 2 });
    }
    // chain-link perimeter with a gate on the street side
    const g0 = horiz ? Math.floor((lot.x0 + lot.x1) / 2) - 6 : Math.floor((lot.y0 + lot.y1) / 2) - 6;
    if (lot.front === "S") { addFence(B, "chain", lot.x0, lot.y0, lot.x1, lot.y0); addFence(B, "chain", lot.x0, lot.y0, lot.x0, lot.y1); addFence(B, "chain", lot.x1 - 1, lot.y0, lot.x1 - 1, lot.y1); addFence(B, "chain", lot.x0, lot.y1 - 1, g0, lot.y1 - 1); addFence(B, "chain", g0 + 12, lot.y1 - 1, lot.x1, lot.y1 - 1); }
    else if (lot.front === "N") { addFence(B, "chain", lot.x0, lot.y1 - 1, lot.x1, lot.y1 - 1); addFence(B, "chain", lot.x0, lot.y0, lot.x0, lot.y1); addFence(B, "chain", lot.x1 - 1, lot.y0, lot.x1 - 1, lot.y1); addFence(B, "chain", lot.x0, lot.y0, g0, lot.y0); addFence(B, "chain", g0 + 12, lot.y0, lot.x1, lot.y0); }
    else if (lot.front === "W") { addFence(B, "chain", lot.x1 - 1, lot.y0, lot.x1 - 1, lot.y1); addFence(B, "chain", lot.x0, lot.y0, lot.x1, lot.y0); addFence(B, "chain", lot.x0, lot.y1 - 1, lot.x1, lot.y1 - 1); addFence(B, "chain", lot.x0, lot.y0, lot.x0, g0); addFence(B, "chain", lot.x0, g0 + 12, lot.x0, lot.y1); }
    else { addFence(B, "chain", lot.x0, lot.y0, lot.x0, lot.y1); addFence(B, "chain", lot.x0, lot.y0, lot.x1, lot.y0); addFence(B, "chain", lot.x0, lot.y1 - 1, lot.x1, lot.y1 - 1); addFence(B, "chain", lot.x1 - 1, lot.y0, lot.x1 - 1, g0); addFence(B, "chain", lot.x1 - 1, g0 + 12, lot.x1 - 1, lot.y1); }
  });
}
// farmland / rural fringe: farmsteads along the roads, fields behind, crossroads stores & churches
function genRural(B, r, fringe) {
  const w = B.x1 - B.x0, h = B.y1 - B.y0;
  addSurf(B, r() < 0.5 ? "crop" : "pasture", B.x0 + 40, B.y0 + 40, B.x1 - 40, B.y1 - 40, cInt(r, 0, 3));
  const sides = [["N", B.side.N], ["S", B.side.S], ["W", B.side.W], ["E", B.side.E]];
  const step = fringe ? [200, 420] : [380, 900];
  sides.forEach(([f, road], si) => {
    const horiz = f === "N" || f === "S", len = horiz ? w : h;
    let p = cInt(r, 90, 260);
    while (p < len - 140) {
      const lotW = cInt(r, 120, 170), lotD = cInt(r, 110, 150);
      let lot;
      if (f === "N") lot = { x0: B.x0 + p, y0: B.y0, x1: B.x0 + p + lotW, y1: B.y0 + lotD, front: "N" }; else if (f === "S") lot = { x0: B.x0 + p, y0: B.y1 - lotD, x1: B.x0 + p + lotW, y1: B.y1, front: "S" };
      else if (f === "W") lot = { x0: B.x0, y0: B.y0 + p, x1: B.x0 + lotD, y1: B.y0 + p + lotW, front: "W" }; else lot = { x0: B.x1 - lotD, y0: B.y0 + p, x1: B.x1, y1: B.y0 + p + lotW, front: "E" };
      genFarmstead(B, lot, r);
      p += lotW + cInt(r, step[0], step[1]);
    }
  });
  // crossroads: gas station / store / church at a corner
  if (r() < (fringe ? 0.35 : 0.12)) {
    const c = cInt(r, 0, 3), lw = 80, ld = 80;
    const lot = c === 0 ? { x0: B.x0, y0: B.y0, x1: B.x0 + lw, y1: B.y0 + ld, front: "N" } : c === 1 ? { x0: B.x1 - lw, y0: B.y0, x1: B.x1, y1: B.y0 + ld, front: "N" }
      : c === 2 ? { x0: B.x0, y0: B.y1 - ld, x1: B.x0 + lw, y1: B.y1, front: "S" } : { x0: B.x1 - lw, y0: B.y1 - ld, x1: B.x1, y1: B.y1, front: "S" };
    const k = r();
    if (k < 0.55) genGasStation(B, lot, r); else if (k < 0.8) genCommercialLot(B, lot, r, r() < 0.5 ? "diner" : "store"); else { addSurf(B, "lot", lot.x0, lot.y0, lot.x1, lot.y1, 1); const b = mkBuilding(B, "church", lot, 36, 24, lot.front, 20, 20, { kind: "church", name: "CHURCH", mat: "wood", roof: "gable", imp: 1 }); addSpawn(B, "room", 2, { bid: b.id, bkey: b.key }); }
  }
  // windbreak tree lines & woodlots
  if (r() < 0.6) { const y = B.y0 + cInt(r, 120, h - 120); for (let x = B.x0 + 60; x < B.x1 - 60; x += cInt(r, 6, 10)) addProp(B, "tree", x, y + cRange(r, -2, 2), 1, 1, FS_COVER, { v: cInt(r, 0, 3), sz: cRange(r, 1, 1.5) }); }
  if (r() < 0.5) addSurf(B, "woods", B.x0 + cInt(r, 100, w / 2), B.y0 + cInt(r, 100, h / 2), B.x0 + cInt(r, w / 2 + 40, w - 80), B.y0 + cInt(r, h / 2 + 40, h - 80));
  if (r() < 0.25) addSpawn(B, "patrol", cInt(r, 2, 3), { pts: [[B.x0 - 6, B.y0 - 6], [B.x0 + 300, B.y0 - 6], [B.x0 + 300, B.y0 + 300], [B.x0 - 6, B.y0 + 300]] });
}
function genFarmstead(B, lot, r) {
  addSurf(B, "yard", lot.x0, lot.y0, lot.x1, lot.y1);
  const front = lot.front, horiz = front === "N" || front === "S";
  const lw = horiz ? lot.x1 - lot.x0 : lot.y1 - lot.y0;
  const half = horiz ? { x0: lot.x0, y0: lot.y0, x1: lot.x0 + Math.floor(lw * 0.5), y1: lot.y1, front } : { x0: lot.x0, y0: lot.y0, x1: lot.x1, y1: lot.y0 + Math.floor(lw * 0.5), front };
  const hb = genHouseLot(B, half, r, { farm: true, noFence: true, occ: 0.3 });
  const other = horiz ? { x0: half.x1 + 4, y0: lot.y0, x1: lot.x1, y1: lot.y1, front } : { x0: lot.x0, y0: half.y1 + 4, x1: lot.x1, y1: lot.y1, front };
  const bw = cInt(r, 30, 40), bd = cInt(r, 24, 30);
  const ow = horiz ? other.x1 - other.x0 : other.y1 - other.y0, od = horiz ? other.y1 - other.y0 : other.x1 - other.x0;
  if (ow > bw + 4 && od > bd + 30) {
    const barn = mkBuilding(B, "barn", other, bw, bd, front, Math.floor(od * 0.45), 2, { kind: "barn", name: "BARN", mat: "wood", roof: "gable", imp: 0 });
    // silo next to the barn
    const sx = front === "S" || front === "N" ? barn.x + barn.w + 3 : barn.x + 2, sy = front === "S" || front === "N" ? barn.y + 2 : barn.y + barn.h + 3;
    addProp(B, "silo", sx, sy, 8, 8, FS_TALL);
    addProp(B, "tractor", sx + (horiz ? 0 : 10), sy + (horiz ? 10 : 0), 3, 5, FS_COVER);
    for (let k = 0; k < 4; k++) addProp(B, "haybale", sx + cRange(r, -6, 10), sy + cRange(r, 8, 18), 2, 2, FS_LOW);
    if (r() < 0.35) addSpawn(B, "room", cInt(r, 1, 2), { bid: barn.id, bkey: barn.key });
  }
  // gravel lane & pasture fence
  if (front === "S") addFence(B, "picket", lot.x0, lot.y0, lot.x1, lot.y0); else if (front === "N") addFence(B, "picket", lot.x0, lot.y1 - 1, lot.x1, lot.y1 - 1);
  else if (front === "W") addFence(B, "picket", lot.x1 - 1, lot.y0, lot.x1 - 1, lot.y1); else addFence(B, "picket", lot.x0, lot.y0, lot.x0, lot.y1);
  for (let k = 0; k < 5; k++) addProp(B, "tree", cRange(r, lot.x0 + 3, lot.x1 - 3), cRange(r, lot.y0 + 3, lot.y1 - 3), 1, 1, FS_COVER, { v: cInt(r, 0, 3), sz: cRange(r, 1.0, 1.6) });
  void hb;
}
function genForest(B, r) {
  addSurf(B, "woods", B.x0, B.y0, B.x1, B.y1);
  const n = cInt(r, 0, 3);
  for (let k = 0; k < n; k++) {
    const f = cPick(r, ["N", "S", "W", "E"]), w = B.x1 - B.x0, h = B.y1 - B.y0;
    const p = cInt(r, 60, (f === "N" || f === "S" ? w : h) - 120);
    const lot = f === "N" ? { x0: B.x0 + p, y0: B.y0, x1: B.x0 + p + 50, y1: B.y0 + 50, front: "N" } : f === "S" ? { x0: B.x0 + p, y0: B.y1 - 50, x1: B.x0 + p + 50, y1: B.y1, front: "S" }
      : f === "W" ? { x0: B.x0, y0: B.y0 + p, x1: B.x0 + 50, y1: B.y0 + p + 50, front: "W" } : { x0: B.x1 - 50, y0: B.y0 + p, x1: B.x1, y1: B.y0 + p + 50, front: "E" };
    addSurf(B, "clearing", lot.x0, lot.y0, lot.x1, lot.y1);
    const b = mkBuilding(B, "cabin", lot, 18, 14, f, 14, 14, { kind: "cabin", mat: "wood", roof: "gable", imp: 0 });
    if (r() < 0.5) addSpawn(B, "room", cInt(r, 1, 3), { bid: b.id, bkey: b.key });
  }
  if (r() < 0.3) addSpawn(B, "patrol", cInt(r, 2, 3), { pts: [[B.x0 - 6, B.y0 - 6], [B.x1 + 6, B.y0 - 6], [B.x1 + 6, B.y0 + 200]] });
}
function genLake(B, r) {
  const w = B.x1 - B.x0, h = B.y1 - B.y0;
  addSurf(B, "grass", B.x0, B.y0, B.x1, B.y1);
  const lx0 = B.x0 + Math.floor(w * cRange(r, 0.12, 0.25)), ly0 = B.y0 + Math.floor(h * cRange(r, 0.12, 0.25));
  const lx1 = B.x1 - Math.floor(w * cRange(r, 0.12, 0.25)), ly1 = B.y1 - Math.floor(h * cRange(r, 0.12, 0.25));
  addSurf(B, "water", lx0, ly0, lx1, ly1, 1);
  addSurf(B, "woods", B.x0, B.y0, B.x1, ly0 - 10);
  for (let k = 0; k < 3; k++) {
    const lot = { x0: lx0 + 40 + k * 120, y0: ly1 + 12, x1: lx0 + 90 + k * 120, y1: ly1 + 56, front: "S" };
    if (lot.x1 > B.x1 - 20 || lot.y1 > B.y1 - 8) break;
    const b = mkBuilding(B, "cabin", lot, 18, 14, "S", 10, 14, { kind: "cabin", mat: "wood", roof: "gable", imp: 0 });
    addProp(B, "dock", (lot.x0 + lot.x1) / 2 - 2, ly1 - 14, 4, 14, FS_NONE);
    if (r() < 0.4) addSpawn(B, "room", 1, { bid: b.id, bkey: b.key });
  }
}

/* --- street-side furniture owned by each block side ------------------------- */
function genStreetSide(B, r) {
  const cls = B.cls, urban = cls >= CL_SUBURB && cls <= CL_INDUSTRIAL;
  const sides = [["N", B.side.N], ["S", B.side.S], ["W", B.side.W], ["E", B.side.E]];
  for (const [f, road] of sides) {
    const horiz = f === "N" || f === "S";
    const a0 = horiz ? B.x0 : B.y0, a1 = horiz ? B.x1 : B.y1;
    const sw = T2(road.sw || 0), edge = f === "N" ? B.y0 : f === "S" ? B.y1 : f === "W" ? B.x0 : B.x1;
    const dirIn = f === "N" || f === "W" ? -1 : 1;           // from block edge toward the road centre
    const curb = edge + dirIn * sw;                           // curb line (road surface starts here)
    const lane = curb + dirIn * 1;                            // parking lane starts here
    const pos = (along, across, w, h) => horiz ? [along, across, w, h] : [across, along, h, w];
    // lights / poles
    const spacing = road.hw ? 0 : (urban ? 56 : 80);
    if (spacing) for (let a = a0 + 8; a < a1 - 4; a += spacing) {
      const [x, y] = pos(a, edge + dirIn * (sw ? sw - 1 : 1), 1, 1);
      addProp(B, urban ? "streetlight" : "pole", x + (horiz ? 0 : (dirIn < 0 ? -1 : 0)), y + (horiz ? (dirIn < 0 ? -1 : 0) : 0), 1, 1, FS_COVER, { o: f });
    }
    if (road.hw) continue;
    // parked & abandoned cars
    const park = cls === CL_DOWNTOWN ? 0.42 : cls === CL_URBAN ? 0.3 : cls === CL_SUBURB ? 0.16 : 0.03;
    for (let a = a0 + 6; a + 9 < a1 - 6; a += 11) {
      if (r() < park) { const p = pos(a, dirIn < 0 ? lane - 4 : lane, 9, 4); addProp(B, "car", p[0], p[1], p[2], p[3], FS_COVER, { o: horiz ? (dirIn < 0 ? 1 : 3) : (dirIn < 0 ? 2 : 0), v: cInt(r, 0, 7) }); }
      else if (r() < 0.012) { const p = pos(a, dirIn < 0 ? lane - 8 : lane + 4, 9, 4); addProp(B, "car", p[0], p[1], p[2], p[3], FS_COVER, { o: horiz ? 1 : 0, v: cInt(r, 0, 7), ang: cRange(r, -0.6, 0.6), wreck: 1 }); }
    }
    if (!urban) continue;
    // hydrants, trash cans, benches, newspaper boxes, bus stops
    for (let a = a0 + 20; a < a1 - 10; a += cInt(r, 60, 110)) { const [x, y] = pos(a, edge + dirIn * Math.max(1, sw - 1), 1, 1); addProp(B, "hydrant", x, y, 1, 1, FS_LOW); }
    if (cls === CL_DOWNTOWN || cls === CL_URBAN) for (let a = a0 + 12; a < a1 - 8; a += cInt(r, 26, 48)) { const [x, y] = pos(a, edge + dirIn * Math.max(1, sw - 2), 1, 1); addProp(B, r() < 0.6 ? "trashcan" : (r() < 0.5 ? "bench" : "newsbox"), x, y, 1, 1, FS_LOW, { o: f }); }
    if (road.r <= 1 && r() < 0.35) { const a = cInt(r, a0 + 20, a1 - 30); const [x, y, w, h] = pos(a, edge + dirIn * Math.max(2, sw), 8, 3); addProp(B, "busstop", x, y, w, h, FS_LOW, { o: f }); }
  }
  // corner furniture: stop signs on local streets, traffic lights on arterials, evac barricades
  const corners = [[B.x0, B.y0, "NW"], [B.x1, B.y0, "NE"], [B.x0, B.y1, "SW"], [B.x1, B.y1, "SE"]];
  for (const [x, y, c] of corners) {
    const art = Math.min(B.side.N.r, B.side.W.r) <= 1;
    if (urban && r() < 0.65) addProp(B, art ? "trafficlight" : "stopsign", x + (c[1] === "W" ? -1 : 0), y + (c[0] === "N" ? -1 : 0), 1, 1, FS_COVER, { o: c });
    if (r() < 0.04) addProp(B, "barricade", x + (c[1] === "W" ? -10 : 2), y + (c[0] === "N" ? -6 : 2), 8, 2, FS_LOW, { evac: 1 });
  }
  // street patrols: a few hostiles walk the block's sidewalks (likelier downtown, rare out in the fields)
  if (r() < [0.12, 0.2, 0.34, 0.5, 0.7, 0.45, 0.08, 0.1][cls]) {
    const n = cls === CL_DOWNTOWN ? cInt(r, 2, 3) : cls >= CL_URBAN ? cInt(r, 1, 3) : cInt(r, 1, 2);
    const pts = [[B.x0 - 2, B.y0 - 2], [B.x1 + 1, B.y0 - 2], [B.x1 + 1, B.y1 + 1], [B.x0 - 2, B.y1 + 1]], k = cInt(r, 0, 3);
    addSpawn(B, "patrol", n, { pts: pts.slice(k).concat(pts.slice(0, k)), street: 1, heavy: cls === CL_DOWNTOWN ? 0.2 : 0.1 });
  }
  if (urban && r() < 0.025) {   // evacuation checkpoint: barricades, sandbags, an abandoned army truck
    const x = B.x0 - 6, y = B.y0 + Math.floor((B.y1 - B.y0) / 2);
    addProp(B, "sandbags", x - 2, y - 6, 2, 12, FS_COVER); addProp(B, "armytruck", x - 14, y - 4, 10, 5, FS_COVER, { o: 1 }); addProp(B, "evacsign", x + 1, y + 8, 2, 1, FS_LOW);
  }
}
// EOF:js/citygen.js
