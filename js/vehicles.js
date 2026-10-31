// FILE: js/vehicles.js
// PART: v14.1 module 1 of 4
// DETAIL: v14.1 Nexus City vehicles. Every vehicle in the region can be driven - cars, police cruisers, pickups, SUVs,
//         buses, the army trucks of the evacuation roadblocks, tractors, semis, fire engines, forklifts and every
//         universe's own ride (landspeeders, spinners, Mules, ornithopters, Death Gliders, Rhinos, wagons, carts,
//         the Flying Anglia...). They are real rigid bodies: bicycle-model handling, mass, inertia and impulse
//         collisions against walls, fences, props, people and each other. Hits crumple the body where they land
//         (deformable perimeter + crease shading); parts with attachment strength fall off as debris (bumpers, hood,
//         trunk lid, doors, mirrors, lights, glass, wheels, sunroof, lightbar, canvas, harnessed horses) and every
//         damage type counts - collisions, people, bullets / bolts, blasts and melee. Engines smoke, die, burn and
//         explode. Fuel ticks down with the throttle and refills at the themed pumps of gas stations.
//         Followers riding along + convoy driving live in js/convoy.js.

"use strict";

/* === 1. SPECS ====================================================================================================== */
const VPX = 32, VGRAV = 9.81 * 32;                 // px per metre, g in px/s²
// seat: [u (−0.5 left … +0.5 right), w (−0.5 rear … +0.5 front), type, side]
//   d driver · w window seat (leans out / fires on its side) · m middle (enclosed) · r roof hatch / sunroof (360°)
//   b open bed / bench (fires outward) · t tail step (fires rearward)
const VSEATS = {
  car5:    [[-0.24, 0.06, "d", -1], [0.24, 0.06, "w", 1], [-0.24, -0.2, "w", -1], [0.24, -0.2, "w", 1], [0, -0.2, "m", 0]],
  car4:    [[-0.24, 0.06, "d", -1], [0.24, 0.06, "w", 1], [-0.22, -0.2, "w", -1], [0.22, -0.2, "w", 1]],
  suv:     [[-0.24, 0.12, "d", -1], [0.24, 0.12, "w", 1], [-0.24, -0.08, "w", -1], [0.24, -0.08, "w", 1], [0, -0.08, "m", 0], [-0.22, -0.3, "w", -1], [0.22, -0.3, "w", 1]],
  pickup:  [[-0.24, 0.14, "d", -1], [0.24, 0.14, "w", 1], [-0.28, -0.24, "b", -1], [0.28, -0.24, "b", 1], [-0.28, -0.4, "b", -1], [0.28, -0.4, "b", 1]],
  two:     [[-0.2, 0.0, "d", -1], [0.2, 0.0, "w", 1]],
  rusted:  [[-0.24, 0.08, "d", -1], [0.24, 0.08, "w", 1], [-0.24, -0.18, "w", -1], [0.24, -0.18, "w", 1], [0, -0.05, "r", 0]],
  mule:    [[-0.2, 0.25, "d", -1], [0.2, 0.25, "w", 1], [-0.26, -0.15, "b", -1], [0.26, -0.15, "b", 1], [0, -0.38, "t", 0]],
  bus:     [[-0.3, 0.42, "d", -1], [0.3, 0.32, "w", 1], [-0.3, 0.24, "w", -1], [0.3, 0.14, "w", 1], [-0.3, 0.04, "w", -1], [0.3, -0.06, "w", 1],
            [-0.3, -0.16, "w", -1], [0.3, -0.26, "w", 1], [-0.3, -0.36, "w", -1], [0.3, -0.4, "w", 1], [0, -0.45, "t", 0], [0, 0.0, "m", 0]],
  truck:   [[-0.25, 0.36, "d", -1], [0.25, 0.36, "w", 1], [0, 0.3, "r", 0], [-0.3, 0.1, "b", -1], [0.3, 0.1, "b", 1], [-0.3, -0.1, "b", -1],
            [0.3, -0.1, "b", 1], [-0.3, -0.3, "b", -1], [0.3, -0.3, "b", 1], [0, -0.45, "t", 0]],
  apc:     [[-0.22, 0.32, "d", -1], [0.15, 0.1, "r", 0], [-0.25, -0.05, "m", -1], [0.25, -0.05, "m", 1], [-0.25, -0.25, "m", -1], [0.25, -0.25, "m", 1],
            [0, -0.4, "m", 0], [0, -0.15, "m", 0]],
  wagon:   [[-0.18, 0.08, "d", -1], [0.18, 0.08, "w", 1], [-0.25, -0.12, "b", -1], [0.25, -0.12, "b", 1], [-0.25, -0.32, "b", -1], [0.25, -0.32, "b", 1], [0, -0.44, "t", 0]],
  cart:    [[0, 0.06, "d", 0], [-0.25, -0.2, "b", -1], [0.25, -0.2, "b", 1], [0, -0.4, "t", 0]],
  tractor: [[0, -0.1, "d", 0], [0.42, -0.2, "b", 1]],
  fire:    [[-0.25, 0.38, "d", -1], [0.25, 0.38, "w", 1], [-0.25, 0.22, "w", -1], [0.25, 0.22, "w", 1], [-0.3, -0.46, "t", -1], [0.3, -0.46, "t", 1]],
  semi:    [[-0.22, 0.42, "d", -1], [0.22, 0.42, "w", 1], [0, 0.36, "m", 0]],
  one:     [[0, 0, "d", 0]]
};
// m kg · acc m/s² · top m/s (gameplay-scaled) · brk m/s² · mu tyre grip · st max wheel angle · hp structure · arm damage taken ×
// eng 1 front · 2 rear · 0 mid · 3 horses · use = tank fraction per second at full throttle
const VK_DEF = { m: 1400, acc: 5, top: 22, brk: 9, mu: 0.95, st: 0.6, hp: 120, arm: 1, eng: 1, use: 1 / 420, seats: "car5", roof: 0, glass: 1, hover: 0, horse: 0, rev: 0.32 };
const VK = {
  sedan:     { n: "CAR", roof: 0.35 },
  police:    { n: "POLICE CRUISER", m: 1700, acc: 6, top: 26, brk: 10, mu: 1.0, hp: 150, arm: 0.9, bar: 1 },
  pickup:    { n: "PICKUP TRUCK", m: 2100, acc: 4.6, hp: 150, arm: 0.85, seats: "pickup", bed: 1 },
  suv:       { n: "SUV", m: 2200, acc: 4.8, hp: 160, arm: 0.85, seats: "suv", roof: 0.5 },
  rusted:    { n: "WRECK-RUNNER", m: 1600, acc: 5.2, top: 24, mu: 0.85, hp: 150, arm: 0.85, use: 1 / 340, seats: "rusted", roof: 1, glass: 0 },
  anglia:    { n: "FLYING ANGLIA", m: 750, acc: 4.2, top: 20, hp: 95, arm: 1.1, use: 1 / 480, seats: "car4" },
  spinner:   { n: "SPINNER", m: 1300, acc: 6.5, top: 26, brk: 7, mu: 0.45, st: 0.55, hover: 1, eng: 2, seats: "car4" },
  speeder:   { n: "LANDSPEEDER", m: 900, acc: 7, top: 28, brk: 6, mu: 0.38, st: 0.5, hp: 90, hover: 1, eng: 2, seats: "two" },
  hover:     { n: "HOVERCAR", m: 1100, acc: 6.5, top: 26, brk: 7, mu: 0.42, st: 0.55, hp: 105, hover: 1, eng: 2, seats: "car4" },
  thopter:   { n: "ORNITHOPTER", m: 1500, acc: 5.5, top: 24, brk: 6, mu: 0.45, hp: 110, hover: 1, eng: 0, seats: "car4" },
  glider:    { n: "DEATH GLIDER", m: 1200, acc: 7, top: 28, brk: 6, mu: 0.4, hp: 100, hover: 1, eng: 2, seats: "two", glass: 0 },
  mule:      { n: "MULE", m: 800, acc: 6, top: 24, brk: 7, mu: 0.5, hp: 100, hover: 1, eng: 2, seats: "mule", glass: 0 },
  apc:       { n: "APC", m: 12000, acc: 2.4, top: 17, brk: 6, mu: 0.9, st: 0.5, hp: 480, arm: 0.35, seats: "apc", glass: 0, hatch: 1, use: 1 / 520 },
  rhino:     { n: "RHINO", m: 14000, acc: 2.2, top: 15, brk: 6, mu: 0.9, st: 0.5, hp: 560, arm: 0.3, seats: "apc", glass: 0, hatch: 1, use: 1 / 520 },
  wagon:     { n: "WAGON", m: 900, acc: 2.6, top: 12, brk: 5, mu: 0.8, st: 0.5, hp: 90, horse: 2, eng: 3, seats: "wagon", glass: 0, use: 1 / 240 },
  coach:     { n: "STAGECOACH", m: 1500, acc: 2.2, top: 11, brk: 4.5, mu: 0.8, st: 0.45, hp: 140, horse: 4, eng: 3, seats: "wagon", glass: 0, use: 1 / 240 },
  cart:      { n: "CART", m: 500, acc: 2.2, top: 9, brk: 4.5, mu: 0.8, st: 0.55, hp: 70, horse: 1, eng: 3, seats: "cart", glass: 0, use: 1 / 240 },
  bus:       { n: "BUS", m: 11000, acc: 1.7, top: 16, brk: 6, mu: 0.85, st: 0.5, hp: 420, arm: 0.5, seats: "bus", use: 1 / 520 },
  armytruck: { n: "ARMY TRUCK", m: 9000, acc: 2.3, top: 18, brk: 6.5, mu: 0.9, st: 0.52, hp: 380, arm: 0.45, seats: "truck", canvas: 1, use: 1 / 520 },
  tractor:   { n: "TRACTOR", m: 3500, acc: 2.0, top: 8, brk: 6, mu: 0.95, st: 0.7, hp: 220, arm: 0.6, seats: "tractor", glass: 0, use: 1 / 600 },
  firetruck: { n: "FIRE ENGINE", m: 14000, acc: 1.9, top: 18, brk: 6, mu: 0.9, st: 0.5, hp: 450, arm: 0.45, seats: "fire", use: 1 / 520 },
  forklift:  { n: "FORKLIFT", m: 3000, acc: 2.2, top: 5, brk: 5, mu: 0.9, st: 0.8, hp: 160, arm: 0.6, seats: "one", glass: 0, use: 1 / 700 },
  semi:      { n: "SEMI TRUCK", m: 15000, acc: 1.5, top: 20, brk: 5.5, mu: 0.9, st: 0.48, hp: 520, arm: 0.4, seats: "semi", use: 1 / 560 }
};
// what each universe calls its fuel (gas-station names come from js/citythemes.js: TIBANNA FUEL, VOLT CHARGE, ...)
const VEH_FUEL_NAME = { modern: "FUEL", neon: "CHARGE", galactic: "FUEL CELL", coruscant: "REPULSOR FUEL", starship: "DEUTERIUM", colony: "HYDROGEN",
  frontier: "FUEL", western: "HORSES", desert: "FUEL", pharaoh: "NAQUADAH", gothic: "PROMETHIUM", wasteland: "GUZZOLINE", medieval: "HORSE", wizard: "PETROL" };
const VEH_PROP_T = new Set(["car", "bus", "trailer", "armytruck", "tractor"]);
const VEH_FURN_T = new Set(["car", "firetruck", "forklift", "tractor"]);

/* === 2. STATE ====================================================================================================== */
const VEH = {
  list: [], byKey: new Map(), uid: 1, me: null, debris: [], skids: [], rebuild: new Map(), refresh: [],
  units: "mph", steer: "point", hornT: 0, msgT: 0, lastMsg: "", stats: { crashes: 0, parts: 0, kills: 0, explosions: 0 },
  baseSpr: new Map(), grid: new Map(), gridFrame: -1, tmpC: [], camZoom: 1
};
function vehReset() {
  VEH.list.length = 0; VEH.byKey.clear(); VEH.me = null; VEH.lastMine = null; VEH.debris.length = 0; VEH.skids.length = 0; VEH.rebuild.clear(); VEH.refresh.length = 0;
  VEH.baseSpr.clear(); VEH.grid.clear(); VEH.camZoom = 1; if (VEH.healed) VEH.healed.clear(); VEH.stats = { crashes: 0, parts: 0, kills: 0, explosions: 0 };
  if (typeof cityRT !== "undefined") { cityRT.gopen = cityRT.gopen || new Set(); cityRT.gopen.clear(); cityRT.fenceBroken = cityRT.fenceBroken || new Set(); cityRT.fenceBroken.clear(); }
}
function vehHash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

// which spec a prop / furniture piece becomes (mirrors the art choices of crVehicle so a promoted car looks the same)
function vehKindOf(t, v, themed, h) {
  const key = CITY.themeKey, T = CITY.theme;
  if (t === "car") {
    const k = themed ? (T.car || "sedan") : "sedan";
    if (k === "sedan") { if (v === 8) return "police"; if ((v & 7) === 6) return "pickup"; if ((v & 7) === 3) return "suv"; }
    return k;
  }
  if (t === "bus") return key === "western" || key === "medieval" ? "coach" : "bus";
  if (t === "tractor") return (typeof crFam === "function" && crFam() === "rustic" && key !== "frontier") ? "cart" : "tractor";
  if (t === "trailer") return "semi";
  return VK[t] ? t : "sedan";
}
function vehName(v) { return (typeof CITY_CAR_NAME !== "undefined" && CITY_CAR_NAME[v.kind]) || v.S.n || "VEHICLE"; }
function vehFuelName(v) { return v.S.horse ? (v.S.horse > 1 ? "HORSES" : "HORSE") : (VEH_FUEL_NAME[CITY.themeKey] || "FUEL"); }

/* === 3. CREATION / PROMOTION ======================================================================================= */
// perimeter: 24 points (4 corners + 4 front + 6 right + 4 rear + 6 left), drawing coords (front = −y), inward normals
function vehPerimeter(L, D) {
  const P = [], x0 = -L / 2, y0 = -D / 2, ci = Math.min(L, D) * 0.08;
  const add = (x, y, nx, ny, zone) => P.push({ x, y, nx, ny, zone });
  const s = Math.SQRT1_2;
  add(x0 + ci, y0 + ci, s, s, 0);
  for (let k = 0; k < 4; k++) add(x0 + L * (k + 0.5) / 4, y0, 0, 1, 0);
  add(-x0 - ci, y0 + ci, -s, s, 0);
  for (let k = 0; k < 6; k++) add(-x0, y0 + D * (k + 0.5) / 6, -1, 0, k < 2 ? 0 : k > 3 ? 2 : 1);
  add(-x0 - ci, -y0 - ci, -s, -s, 2);
  for (let k = 0; k < 4; k++) add(-x0 - L * (k + 0.5) / 4, -y0, 0, -1, 2);
  add(x0 + ci, -y0 - ci, s, -s, 2);
  for (let k = 0; k < 6; k++) add(x0, -y0 - D * (k + 0.5) / 6, 1, 0, k < 2 ? 2 : k > 3 ? 0 : 3);
  return P;   // zone: 0 front · 1 right · 2 rear · 3 left
}
function vehNew(kind, x, y, ang, L, D, o) {
  o = o || {};
  const S = Object.assign({}, VK_DEF, VK[kind] || VK.sedan), key = o.key || ("v" + VEH.uid), h = o.h != null ? o.h : vehHash(key);
  const v = {
    id: VEH.uid++, kind, S, key, x, y, ang, vx: 0, vy: 0, w: 0, L, D, m: S.m, I: S.m * (L * L + D * D) / 12,
    pv: o.v | 0, h, themed: !!o.themed, art: o.art || null, wreck: !!o.wreck, from: o.from || "prop",
    hp: S.hp, hpMax: S.hp, eng: 1, fuel: o.fuel != null ? o.fuel : 0.15 + (h % 1000) / 1000 * 0.7, stamina: 1,
    per: vehPerimeter(L, D), def: new Float32Array(24), parts: [], holes: [], scorch: 0,
    seats: (VSEATS[S.seats] || VSEATS.car5).map((s, i) => ({ i, u: s[0], w: s[1], type: s[2], side: s[3], occ: null })),
    ctl: { thr: 0, st: 0, hb: 0 }, steerA: 0, rpm: 0, gear: 1,
    sleep: 0, awake: true, dead: false, fire: 0, burnt: false, smokeT: 0, disabledT: 0,
    sprDirty: true, spr: null, samples: null, sampDirty: true, drv: null, ai: null, lastHit: 0, scrapeT: 0, skidT: 0, hitCD: 0,
    sunroof: false, brakeLit: 0, exhaust: 0, horseFled: 0, lastDv: 0, seen: 0, convoy: null, hold: 0
  };
  v.sunroof = S.roof >= 1 || (S.roof > 0 && (h % 997) / 997 < S.roof);
  if (v.seats.some(s => s.type === "r") && !v.sunroof && !S.hatch && S.roof < 1 && kind !== "armytruck") v.seats.forEach(s => { if (s.type === "r") s.type = "m"; });
  if (v.sunroof && kind !== "rusted" && !S.hatch) { const mid = v.seats.find(s => s.type === "m"); if (mid) mid.type = "r"; }
  vehBuildParts(v);
  if (v.wreck) { v.hp = 0; v.dead = true; v.burnt = true; v.eng = 0; v.fuel = 0; v.scorch = 1; for (let i = 0; i < 24; i++) v.def[i] = 2 + ((h >> (i % 20)) & 7); v.parts.forEach(p => { if (p.kind !== "wheel" && ((h >> (p.idx % 24)) & 3) === 0) p.on = false; }); v.sampDirty = true; }
  VEH.list.push(v); VEH.byKey.set(key, v);
  return v;
}
function vehPropPose(p) {
  const o = typeof p.o === "number" ? p.o : 0, W = p.w * 16, H = p.h * 16;
  return { x: (p.x + p.w / 2) * 16 - CITY.orx, y: (p.y + p.h / 2) * 16 - CITY.ory, ang: o * Math.PI / 2 - Math.PI / 2 + (p.ang || 0), L: Math.min(W, H), D: Math.max(W, H) };
}
// a parked prop becomes a live rigid body (removed from the baked tile art and the collision grid)
function vehPromoteProp(p, why) {
  if (!p || !VEH_PROP_T.has(p.t)) return null;
  const key = p.key || ("dyn" + p.x + "," + p.y);
  if (VEH.byKey.has(key)) return VEH.byKey.get(key);
  const P = vehPropPose(p), h = cH(CITY.seed, p.x | 0, p.y | 0, 5);
  const kind = vehKindOf(p.t, p.v | 0, p.t === "car", h);
  const v = vehNew(kind, P.x, P.y, P.ang, P.L, P.D, { key, h, v: p.v | 0, themed: p.t === "car", art: p.t, wreck: !!p.wreck, fuel: p.fuel });
  if (p.dyn) { const i = cityRT.dyn.indexOf(p); if (i >= 0) cityRT.dyn.splice(i, 1); } else cityRT.used.add(key);
  vehQueueRebuild(p.x + p.w / 2, p.y + p.h / 2, P.x, P.y, Math.max(P.L, P.D));
  v.why = why || "";
  return v;
}
// interior vehicles (garage cars, fire engines, barn tractors, warehouse forklifts)
function vehPromoteFurn(b, fi, why) {
  const G = b.int || cityInterior(b), f = G.furn[fi];
  if (!f || !VEH_FURN_T.has(f.t)) return null;
  const key = b.uid + ":f" + fi;
  if (VEH.byKey.has(key)) return VEH.byKey.get(key);
  const o = (f.o | 0) & 3, W = f.w * 16, H = f.h * 16, L = (o & 1) ? H : W, D = (o & 1) ? W : H;
  const x = (b.x + f.x + f.w / 2) * 16 - CITY.orx, y = (b.y + f.y + f.h / 2) * 16 - CITY.ory, h = cH(b.seed, f.x, f.y, 11);
  const kind = vehKindOf(f.t, f.v | 0, f.t === "car", h);
  const v = vehNew(kind, x, y, o * Math.PI / 2 - Math.PI / 2, Math.min(L, D), Math.max(L, D), { key, h, v: f.v | 0, themed: f.t === "car", art: f.t, from: "furn", fuel: 0.55 + (h % 100) / 230 });
  v.bid = b.uid;
  cityRT.used.add(key);
  vehQueueRebuild(b.x + f.x + f.w / 2, b.y + f.y + f.h / 2, x, y, Math.max(L, D));
  return v;
}
// flags are rebuilt at once (physics needs them this frame); the tile art is re-baked stale-while-revalidate
function vehQueueRebuild(wtx, wty, lx, ly, size) {
  // every chunk the footprint touches (a car parked across a chunk seam is stamped into both)
  const r = Math.ceil(size / 32) + 2, tx0 = Math.floor(wtx) - r, tx1 = Math.floor(wtx) + r, ty0 = Math.floor(wty) - r, ty1 = Math.floor(wty) + r;
  for (let cy = ty0 >> 7; cy <= ty1 >> 7; cy++) for (let cx = tx0 >> 7; cx <= tx1 >> 7; cx++) VEH.rebuild.set(cx * 4096 + cy, 1);
  VEH.refresh.push([lx - size / 2 - 24, ly - size / 2 - 24, size + 48, size + 48]);
  vehFlushRebuild();
}
function vehFlushRebuild() {
  for (const [key, t] of VEH.rebuild) { cityRT.chunks.delete(key); if (cityRT.lastKey === key) { cityRT.last = null; cityRT.lastKey = -1; } }
  VEH.rebuild.clear();
  if (VEH.refresh.length) { for (const r of VEH.refresh) { if (typeof cityRenderRefresh === "function") cityRenderRefresh(r[0], r[1], r[2], r[3]); else if (typeof cityRenderInvalidate === "function") cityRenderInvalidate(r[0], r[1], r[2], r[3]); } VEH.refresh.length = 0; }
}
// static vehicle owning a K_CAR tile (props first, then interior furniture)
function vehStaticAtTile(tx, ty) {
  const C = cityChunk(tx >> 7, ty >> 7);
  for (const p of C.props) if (VEH_PROP_T.has(p.t) && tx >= Math.floor(p.x) && tx < Math.ceil(p.x + p.w) && ty >= Math.floor(p.y) && ty < Math.ceil(p.y + p.h) && !(p.key && cityRT.used.has(p.key))) return { p };
  const b = cityBldT(tx, ty);
  if (b) { const G = b.int || cityInterior(b); for (let fi = 0; fi < G.furn.length; fi++) { const f = G.furn[fi]; if (!VEH_FURN_T.has(f.t) || cityRT.used.has(b.uid + ":f" + fi)) continue; const fx = b.x + f.x, fy = b.y + f.y; if (tx >= Math.floor(fx) && tx < Math.ceil(fx + f.w) && ty >= Math.floor(fy) && ty < Math.ceil(fy + f.h)) return { b, fi }; } }
  return null;
}
function vehPromoteAtTile(tx, ty, why) {
  const s = vehStaticAtTile(tx, ty);
  if (!s) return null;
  return s.p ? vehPromoteProp(s.p, why) : vehPromoteFurn(s.b, s.fi, why);
}
// nearest drivable vehicle (live or parked) around a local point - used by [F], followers and the convoy
function vehNearby(lx, ly, r, filter) {
  const out = [];
  for (const v of VEH.list) { if (filter && !filter(v)) continue; const d = Math.hypot(v.x - lx, v.y - ly); if (d < r + Math.max(v.L, v.D) / 2) out.push({ v, d: Math.max(0, d - vehReach(v, lx, ly)) }); }
  const tx = cityTX(lx), ty = cityTY(ly), R = Math.ceil(r / 16) + 14;
  for (let cy = (ty - R) >> 7; cy <= (ty + R) >> 7; cy++) for (let cx = (tx - R) >> 7; cx <= (tx + R) >> 7; cx++) {
    const C = cityChunk(cx, cy);
    for (const p of C.props) {
      if (!VEH_PROP_T.has(p.t) || (p.key && (cityRT.used.has(p.key) || VEH.byKey.has(p.key)))) continue;
      const P = vehPropPose(p), d = Math.hypot(P.x - lx, P.y - ly);
      if (d < r + P.D / 2) out.push({ p, x: P.x, y: P.y, d: Math.max(0, d - P.L / 2 - 6), wreck: !!p.wreck });
    }
    for (const b of C.blds) {
      if (Math.abs((b.x + b.w / 2) * 16 - CITY.orx - lx) > r + b.w * 8 + 200 || Math.abs((b.y + b.h / 2) * 16 - CITY.ory - ly) > r + b.h * 8 + 200) continue;
      const G = b.int || cityInterior(b);
      for (let fi = 0; fi < G.furn.length; fi++) {
        const f = G.furn[fi]; if (!VEH_FURN_T.has(f.t) || cityRT.used.has(b.uid + ":f" + fi)) continue;
        const x = (b.x + f.x + f.w / 2) * 16 - CITY.orx, y = (b.y + f.y + f.h / 2) * 16 - CITY.ory, d = Math.hypot(x - lx, y - ly);
        if (d < r + Math.max(f.w, f.h) * 8 && !out.some(q => q.b === b && q.fi === fi)) out.push({ b, fi, x, y, d: Math.max(0, d - Math.min(f.w, f.h) * 8 - 6) });
      }
    }
  }
  out.sort((a, b) => a.d - b.d);
  return out;
}
function vehReach(v, lx, ly) {   // distance from the centre to the body edge toward (lx, ly)
  const c = Math.cos(v.ang), s = Math.sin(v.ang), dx = lx - v.x, dy = ly - v.y, fw = dx * c + dy * s, rt = -dx * s + dy * c;
  const d = Math.hypot(fw, rt) || 1;
  return Math.min((v.D / 2) / Math.max(1e-3, Math.abs(fw) / d), (v.L / 2) / Math.max(1e-3, Math.abs(rt) / d));
}
function vehMakeLive(q, why) { return q.v || (q.p ? vehPromoteProp(q.p, why) : vehPromoteFurn(q.b, q.fi, why)); }

/* === 4. PARTS (attachment points) ================================================================================== */
// rects in drawing coords (x right, y toward the rear, front edge at −D/2). hp = attachment strength.
function vehBuildParts(v) {
  const L = v.L, D = v.D, x0 = -L / 2, y0 = -D / 2, S = v.S, k = v.kind, P = v.parts = [];
  let idx = 0;
  const add = (id, kind, x, y, w, h, hp, extra) => { const p = Object.assign({ id, kind, x, y, w, h, hp, max: hp, on: true, idx: idx++, side: 0 }, extra || {}); P.push(p); return p; };
  const wheels = (n, hp, ys) => { for (const yy of ys) { add("wheelL" + yy.toFixed(2), S.hover ? "pod" : "wheel", x0 - 1, y0 + D * yy, 3.5, Math.min(14, D * 0.11), hp, { side: -1 }); add("wheelR" + yy.toFixed(2), S.hover ? "pod" : "wheel", x0 + L - 2.5, y0 + D * yy, 3.5, Math.min(14, D * 0.11), hp, { side: 1 }); } };
  const lights = (yF, yR) => { add("lightFL", "light", x0 + 1.5, y0 + yF, 5, 2.5, 5); add("lightFR", "light", x0 + L - 6.5, y0 + yF, 5, 2.5, 5); add("lightRL", "light", x0 + 1.5, y0 + D - yR, 5, 2.5, 5, { rear: 1 }); add("lightRR", "light", x0 + L - 6.5, y0 + D - yR, 5, 2.5, 5, { rear: 1 }); };
  const mirrors = (yy, s) => { add("mirrorL", "mirror", x0 - 2.5 * s, y0 + yy, 3 * s, 3.5 * s, 6 * s, { side: -1 }); add("mirrorR", "mirror", x0 + L - 0.5 * s, y0 + yy, 3 * s, 3.5 * s, 6 * s, { side: 1 }); };
  const carLike = k === "sedan" || k === "police" || k === "pickup" || k === "suv" || k === "rusted" || k === "anglia" || k === "spinner" || k === "hover";
  if (carLike) {
    add("bumperF", "bumper", x0 + 3, y0 - 1, L - 6, 4.5, 18);
    add("bumperR", "bumper", x0 + 3, y0 + D - 3.5, L - 6, 4.5, 18, { rear: 1 });
    add("hood", "hood", x0 + 3, y0 + 3.5, L - 6, D * 0.26 - 3.5, 30);
    if (k === "pickup") add("tailgate", "trunk", x0 + 3, y0 + D - 6, L - 6, 3.5, 22, { rear: 1 });
    else add("trunk", "trunk", x0 + 4, y0 + D * 0.82, L - 8, D * 0.14, 26, { rear: 1 });
    add("doorFL", "door", x0 - 1.5, y0 + D * 0.3, 5, D * 0.23, 34, { side: -1, seatW: 0.06 });
    add("doorFR", "door", x0 + L - 3.5, y0 + D * 0.3, 5, D * 0.23, 34, { side: 1, seatW: 0.06 });
    if (k !== "pickup" && k !== "anglia" && k !== "spinner") { add("doorRL", "door", x0 - 1.5, y0 + D * 0.53, 5, D * 0.19, 34, { side: -1, seatW: -0.2 }); add("doorRR", "door", x0 + L - 3.5, y0 + D * 0.53, 5, D * 0.19, 34, { side: 1, seatW: -0.2 }); }
    mirrors(D * 0.32, 1); lights(0.5, 3);
    if (S.glass) {
      add("glassF", "glass", x0 + 3, y0 + D * 0.3, L - 6, D * 0.12, 2, { front: 1 }); add("glassB", "glass", x0 + 5, y0 + D * 0.74, L - 10, D * 0.08, 2, { rear: 1 });
      add("glassL", "glass", x0 + 0.5, y0 + D * 0.42, 3, D * 0.3, 2, { side: -1 }); add("glassR", "glass", x0 + L - 3.5, y0 + D * 0.42, 3, D * 0.3, 2, { side: 1 });
    }
    if (v.sunroof && k !== "rusted") add("sunroof", "sunroof", -L * 0.17, y0 + D * 0.47, L * 0.34, D * 0.13, 2);
    if (S.bar) add("lightbar", "lightbar", x0 + 6, y0 + D * 0.5, L - 12, 4, 12);
    if (k === "rusted") add("exhaust", "exhaust", x0 + L - 5, y0 + D * 0.08, 4, 9, 14, { side: 1 });
    wheels(4, 45, [0.14, 0.76]);
  } else if (k === "speeder" || k === "glider" || k === "mule" || k === "thopter") {
    add("bumperF", "bumper", x0 + 4, y0 - 0.5, L - 8, 3.5, 14);
    if (k === "speeder") { add("glassF", "glass", x0 + 3, y0 + D * 0.18, L - 6, D * 0.16, 2, { front: 1 }); for (const [n, ex] of [["eng1", x0 + 1], ["eng2", -2.5], ["eng3", x0 + L - 6]]) add(n, "engine", ex, y0 + D * 0.72, 5, D * 0.26, 30, { rear: 1 }); }
    if (k === "glider") { add("wingL", "wing", x0 - L * 0.9, y0 + D * 0.2, L * 0.9, 8, 40, { side: -1 }); add("wingR", "wing", x0 + L, y0 + D * 0.2, L * 0.9, 8, 40, { side: 1 }); }
    if (k === "thopter") { add("wingL1", "wing", -L * 1.25, y0 + D * 0.27, L * 1.05, 6, 34, { side: -1 }); add("wingR1", "wing", L * 0.2, y0 + D * 0.27, L * 1.05, 6, 34, { side: 1 }); add("wingL2", "wing", -L * 1.25, y0 + D * 0.52, L * 1.05, 6, 34, { side: -1 }); add("wingR2", "wing", L * 0.2, y0 + D * 0.52, L * 1.05, 6, 34, { side: 1 }); add("glassF", "glass", x0 + L * 0.27, y0 + 2, L * 0.46, D * 0.2, 2, { front: 1 }); }
    if (k === "mule") { add("rail", "rail", x0 + 3, y0 + D * 0.35, L - 6, D * 0.55, 30); }
    wheels(4, 40, [0.14, 0.72]);
  } else if (k === "bus" || k === "armytruck" || k === "firetruck" || k === "semi") {
    add("bumperF", "bumper", x0 + 2, y0 - 1.5, L - 4, 5, 34);
    add("bumperR", "bumper", x0 + 2, y0 + D - 3.5, L - 4, 5, 30, { rear: 1 });
    add("glassF", "glass", x0 + 3, y0 + 3, L - 6, k === "bus" ? D * 0.05 : D * 0.08, 3, { front: 1 });
    mirrors(k === "bus" ? 6 : 10, 1.6); lights(0.5, 3);
    if (k === "bus") { add("doorF", "door", x0 + L - 4, y0 + D * 0.06, 5, D * 0.08, 50, { side: 1, seatW: 0.32 }); add("doorB", "door", x0 + 8, y0 + D - 4, L - 16, 4, 40, { rear: 1, seatW: -0.45 }); add("glassL", "glass", x0 + 0.5, y0 + D * 0.12, 3, D * 0.78, 4, { side: -1 }); add("glassR", "glass", x0 + L - 3.5, y0 + D * 0.12, 3, D * 0.78, 4, { side: 1 }); wheels(4, 70, [0.12, 0.74]); }
    if (k === "armytruck") { add("doorL", "door", x0 - 1.5, y0 + D * 0.12, 5, D * 0.16, 50, { side: -1, seatW: 0.36 }); add("doorR", "door", x0 + L - 3.5, y0 + D * 0.12, 5, D * 0.16, 50, { side: 1, seatW: 0.36 }); add("canvas", "canvas", x0 + 2, y0 + D * 0.32, L - 4, D * 0.66, 60); add("tailgate", "trunk", x0 + 3, y0 + D - 5, L - 6, 4, 40, { rear: 1 }); wheels(6, 80, [0.14, 0.62, 0.8]); }
    if (k === "firetruck") { add("doorL", "door", x0 - 1.5, y0 + D * 0.06, 5, D * 0.12, 50, { side: -1, seatW: 0.38 }); add("doorR", "door", x0 + L - 3.5, y0 + D * 0.06, 5, D * 0.12, 50, { side: 1, seatW: 0.38 }); add("ladder", "ladder", -3.5, y0 + D * 0.22, 7, D * 0.72, 60); add("lightbar", "lightbar", x0 + 3, y0 + D * 0.15, L - 6, 3, 14); wheels(6, 80, [0.12, 0.66, 0.82]); }
    if (k === "semi") { add("doorL", "door", x0 - 1.5, y0 + D * 0.08, 5, D * 0.08, 50, { side: -1, seatW: 0.42 }); add("doorR", "door", x0 + L - 3.5, y0 + D * 0.08, 5, D * 0.08, 50, { side: 1, seatW: 0.42 }); add("doorB", "door", x0 + 3, y0 + D - 4, L - 6, 4, 60, { rear: 1 }); wheels(6, 90, [0.06, 0.2, 0.86]); }
  } else if (k === "apc" || k === "rhino") {
    add("hatch", "hatch", L * 0.02, y0 + D * 0.38, L * 0.28, D * 0.2, 60);
    add("trackL", "track", x0 - 2, y0 + 2, 4, D - 4, 140, { side: -1 }); add("trackR", "track", x0 + L - 2, y0 + 2, 4, D - 4, 140, { side: 1 });
    add("doorB", "door", x0 + 6, y0 + D - 4, L - 12, 4, 120, { rear: 1, seatW: -0.42 }); lights(1, 3);
  } else if (k === "wagon" || k === "coach" || k === "cart") {
    const n = S.horse, hs = Math.min(1, D / 140);
    for (let i = 0; i < n; i++) { const hx = n === 1 ? 0 : (i % 2 ? 1 : -1) * L * 0.18, hy = y0 + D * (0.16 - Math.floor(i / 2) * 0.12) - 7 * hs; add("horse" + i, "horse", hx - 4 * hs, hy - 8 * hs, 8 * hs, 18 * hs, 40, { hx, hy: hy + 8 * hs }); }
    if (k !== "cart") add("cover", "canvas", x0 + 1.5, y0 + D * 0.4, L - 3, D * 0.55, 40);
    wheels(4, 50, k === "cart" ? [0.4] : [0.42, 0.88]);
  } else if (k === "tractor") {
    add("weights", "bumper", x0 + 3, y0 - 1, L - 6, 4, 30); add("exhaust", "exhaust", x0 + L * 0.65, y0 + D * 0.2, 3, 3, 12);
    wheels(4, 60, [0.08, 0.66]); lights(2, 2);
  } else if (k === "forklift") {
    add("forks", "forks", x0 + 1, y0 - 1, L - 2, D * 0.32, 50, { front: 1 }); wheels(4, 50, [0.4, 0.8]);
  } else { add("bumperF", "bumper", x0 + 3, y0 - 1, L - 6, 4.5, 20); add("bumperR", "bumper", x0 + 3, y0 + D - 3.5, L - 6, 4.5, 20, { rear: 1 }); wheels(4, 45, [0.14, 0.76]); }
  v.partsOn = P.length;
}
function vehPart(v, id) { for (const p of v.parts) if (p.id === id) return p; return null; }
function vehWheelsLost(v) { let n = 0; for (const p of v.parts) if ((p.kind === "wheel" || p.kind === "pod" || p.kind === "track") && !p.on) n++; return n; }
function vehHorses(v) { let n = 0; for (const p of v.parts) if (p.kind === "horse" && p.on) n++; return n; }
function vehDoorOpen(v, side, seatW) {   // a door (or window glass) on this side near this seat is gone
  for (const p of v.parts) { if (p.kind !== "door" || p.on) continue; if ((p.side === side || (side === 0 && p.rear)) && (p.seatW == null || Math.abs(p.seatW - seatW) < 0.2)) return true; }
  return false;
}
function vehGlassGone(v, side) { for (const p of v.parts) if (p.kind === "glass" && !p.on && (side == null || p.side === side || (side === 2 && p.front))) return true; return false; }

/* === 5. ART: base sprite (same art as the baked props) + damage sprite =============================================== */
const VPAD = 14;
function vehBaseSprite(v) {
  const key = (v.art || v.kind) + "|" + v.kind + "|" + v.pv + "|" + (v.h & 0xffff) + "|" + v.L + "x" + v.D + "|" + CITY.themeKey + (v.wreck ? "|w" : "");
  let c = VEH.baseSpr.get(key);
  if (c) return c;
  const glider = v.kind === "glider" || v.kind === "thopter";
  const padX = glider ? v.L * 1.3 : VPAD;
  c = crCanvas(Math.ceil(v.L + padX * 2), Math.ceil(v.D + VPAD * 2));
  c.padX = padX;
  const g = c.getContext("2d"); g.translate(c.width / 2, c.height / 2);
  // same call (and the same shadow) as the baked props, so a car that wakes up looks exactly like it did parked
  crVehicle.noShadow = !!v.S.hover;
  try { if ((v.art || v.kind) === "car") crVehicle(g, "car", v.L, v.D, v.pv, v.h, true, v.wreck); else crVehicle(g, v.art || v.kind, v.L, v.D, v.pv, v.h, false, v.wreck); }
  finally { crVehicle.noShadow = false; }
  VEH.baseSpr.set(key, c);
  if (VEH.baseSpr.size > 160) VEH.baseSpr.delete(VEH.baseSpr.keys().next().value);
  return c;
}
function vehVisDamaged(v) {
  if (v.scorch > 0.02 || v.holes.length) return true;
  for (let i = 0; i < 24; i++) if (v.def[i] > 2.4) return true;
  for (const p of v.parts) if (!p.on || (p.kind === "glass" && p.hp < p.max)) return true;
  return false;
}
// deformed outline (drawing coords): the body is 2.5 px "fatter" than the art so mirrors survive until real dents start
function vehOutline(v, grow) {
  const out = [];
  for (let i = 0; i < 24; i++) { const P = v.per[i], g = (grow == null ? 2.5 : grow) - v.def[i]; out.push([P.x - P.nx * g, P.y - P.ny * g]); }
  return out;
}
function vehSprite(v) {
  if (!v.sprDirty && v.spr) return v.spr;
  const base = vehBaseSprite(v);
  v.sprDirty = false;
  if (!vehVisDamaged(v)) { v.spr = base; return base; }
  let c = v.sprOwn;
  if (!c || c.width !== base.width || c.height !== base.height) c = v.sprOwn = crCanvas(base.width, base.height);
  const g = c.getContext("2d");
  g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, c.width, c.height); g.drawImage(base, 0, 0);
  g.translate(c.width / 2, c.height / 2);
  const L = v.L, D = v.D, x0 = -L / 2, y0 = -D / 2, body = v.kind === "rusted" ? "#6a5040" : "#2a2c30";
  // 1) parts that fell off: erase them and show what was underneath
  for (const p of v.parts) {
    if (p.on || p.kind === "wheel" || p.kind === "pod" || p.kind === "glass" || p.kind === "sunroof") continue;
    g.save(); g.globalCompositeOperation = "destination-out"; g.fillStyle = "#000";
    if (p.kind === "horse") { g.beginPath(); g.ellipse(p.hx, p.hy - 1, p.w * 0.75, p.h * 0.62, 0, 0, 7); g.fill(); }
    else if (p.kind !== "canvas" && p.kind !== "hood" && p.kind !== "trunk" && p.kind !== "hatch" && p.kind !== "rail") g.fillRect(p.x, p.y, p.w, p.h);
    g.restore();
    switch (p.kind) {
      case "door": {   // the cabin shows: sill, seat cushion, floor
        const inX = p.side < 0 ? p.x + 1.5 : p.x - 3.5;
        g.fillStyle = "#141518"; g.fillRect(p.side ? inX : p.x, p.side ? p.y : p.y - 4, p.side ? 7 : p.w, p.side ? p.h : 6);
        g.fillStyle = "#3d3a36"; if (p.side) g.fillRect(inX + (p.side < 0 ? 3 : 1), p.y + p.h * 0.2, 3.5, p.h * 0.6);
        g.fillStyle = "#6b6f75"; if (p.side) { g.fillRect(p.x + (p.side < 0 ? 1.5 : 3), p.y - 1, 1.2, p.h + 2); }
        break;
      }
      case "hood": { g.fillStyle = "#1b1c1f"; g.fillRect(p.x, p.y, p.w, p.h); g.fillStyle = "#4d5056"; g.fillRect(p.x + p.w * 0.22, p.y + p.h * 0.22, p.w * 0.56, p.h * 0.56); g.fillStyle = "#7a7f86"; for (let k = 0; k < 4; k++) g.fillRect(p.x + p.w * 0.28 + k * p.w * 0.12, p.y + p.h * 0.3, p.w * 0.06, p.h * 0.4); g.fillStyle = "#3a3d42"; g.fillRect(p.x + 2, p.y + 1, p.w - 4, 2.5); break; }
      case "trunk": { g.fillStyle = "#18191c"; g.fillRect(p.x, p.y, p.w, p.h); g.fillStyle = "#2c2e33"; g.fillRect(p.x + 2, p.y + 2, p.w - 4, p.h - 4); break; }
      case "bumper": { g.fillStyle = "#26282c"; g.fillRect(x0 + L * 0.22, p.y + 1, 2.5, p.h - 1); g.fillRect(x0 + L * 0.78 - 2.5, p.y + 1, 2.5, p.h - 1); break; }
      case "light": { g.fillStyle = "#1a1a1a"; g.fillRect(p.x + 0.5, p.y + 0.5, p.w - 1, p.h - 1); break; }
      case "lightbar": { g.fillStyle = "#3b3e44"; g.fillRect(p.x, p.y + 1, p.w, p.h - 2); break; }
      case "canvas": { g.fillStyle = "#4a3c2c"; g.fillRect(p.x, p.y, p.w, p.h); g.fillStyle = "#6a5638"; g.fillRect(p.x + 1, p.y + 1, 4, p.h - 2); g.fillRect(p.x + p.w - 5, p.y + 1, 4, p.h - 2); g.fillStyle = "rgba(0,0,0,0.3)"; for (let k = 1; k < 6; k++) g.fillRect(p.x, p.y + k * p.h / 6, p.w, 1); break; }
      case "hatch": { g.fillStyle = "#121314"; g.beginPath(); g.arc(p.x + p.w / 2, p.y + p.h / 2, Math.min(p.w, p.h) * 0.45, 0, 7); g.fill(); break; }
      case "ladder": { g.fillStyle = "#8a1c1c"; g.fillRect(p.x, p.y, p.w, p.h); break; }
      case "horse": { g.strokeStyle = "#3a2a1a"; g.lineWidth = 1.4; g.beginPath(); g.moveTo(p.hx, p.hy + 8); g.lineTo(p.hx + 3, p.hy - 6); g.stroke(); break; }
      case "rail": { g.fillStyle = "#4a2e18"; g.fillRect(p.x, p.y, p.w, p.h); break; }
      case "track": { g.fillStyle = "#1a1a1a"; g.fillRect(p.x + 1, p.y, 2, p.h); break; }
      default: break;
    }
  }
  // 2) dents: carve the body back to the deformed outline, then crease shading along the crumpled edges
  let maxDef = 0; for (let i = 0; i < 24; i++) maxDef = Math.max(maxDef, v.def[i]);
  if (maxDef > 2.4) {
    const O = vehOutline(v), Wd = c.width, Hd = c.height;
    g.save(); g.globalCompositeOperation = "destination-out"; g.beginPath();
    g.rect(-Wd / 2, -Hd / 2, Wd, Hd);
    g.moveTo(O[0][0], O[0][1]); for (let i = 23; i >= 1; i--) g.lineTo(O[i][0], O[i][1]); g.closePath();
    g.fillStyle = "#000"; g.fill("evenodd"); g.restore();
    if (!v.S.hover) { g.save(); g.globalCompositeOperation = "destination-over"; g.beginPath(); g.moveTo(O[0][0] + 3, O[0][1] + 4); for (let i = 1; i < 24; i++) g.lineTo(O[i][0] + 3, O[i][1] + 4); g.closePath(); g.fillStyle = "rgba(0,0,0,0.28)"; g.fill(); g.restore(); }
    g.save(); g.lineJoin = "round";
    // shadowed band just inside the crumpled edge (metal folded under)
    g.save(); g.beginPath(); g.moveTo(O[0][0], O[0][1]); for (let i = 1; i < 24; i++) g.lineTo(O[i][0], O[i][1]); g.closePath(); g.clip();
    for (let i = 0; i < 24; i++) {
      const d = v.def[i]; if (d < 2.4) continue;
      const P = v.per[i], a = O[i], w = Math.min(9, 2 + d * 0.55);
      const gr = g.createLinearGradient(a[0], a[1], a[0] + P.nx * w, a[1] + P.ny * w); gr.addColorStop(0, "rgba(8,8,10," + Math.min(0.7, 0.25 + d * 0.03).toFixed(2) + ")"); gr.addColorStop(1, "rgba(8,8,10,0)");
      g.fillStyle = gr; g.beginPath(); g.arc(a[0], a[1], w + 4, 0, 7); g.fill();
    }
    g.restore();
    for (let i = 0; i < 24; i++) {
      const d = v.def[i]; if (d < 2.4) continue;
      const P = v.per[i], a = O[i], b = O[(i + 1) % 24], z = O[(i + 23) % 24];
      const tx = b[0] - z[0], ty = b[1] - z[1], tl = Math.hypot(tx, ty) || 1, ux = tx / tl, uy = ty / tl;
      const n = Math.min(5, 1 + Math.floor(d / 4)), span = Math.min(tl * 0.5, 6 + d * 1.6);
      g.strokeStyle = "rgba(0,0,0,0.68)"; g.lineWidth = 1.4; g.beginPath();
      for (let k = 0; k <= n * 2; k++) {
        const t = -span / 2 + span * k / (n * 2), amp = (k & 1 ? 1 : -0.4) * Math.min(4, 1 + d * 0.22);
        const px = a[0] + ux * t + P.nx * (2 + amp), py = a[1] + uy * t + P.ny * (2 + amp);
        if (k === 0) g.moveTo(px, py); else g.lineTo(px, py);
      }
      g.stroke();
      g.strokeStyle = "rgba(255,255,255,0.36)"; g.lineWidth = 0.9; g.beginPath();
      for (let k = 0; k <= n; k++) { const t = -span / 2 + span * k / n, px = a[0] + ux * t + P.nx * (4.5 + (k & 1) * 1.5), py = a[1] + uy * t + P.ny * (4.5 + (k & 1) * 1.5); if (k === 0) g.moveTo(px, py); else g.lineTo(px, py); }
      g.stroke();
      if (d > 9) { g.fillStyle = "rgba(10,10,12,0.55)"; g.beginPath(); g.arc(a[0] + P.nx * 3, a[1] + P.ny * 3, Math.min(6, d * 0.35), 0, 7); g.fill(); }   // torn metal / exposed radiator
    }
    // buckle lines: the hood / trunk lid / door skin folds parallel to the crushed edge
    const zMax = [0, 0, 0, 0];
    for (let i = 0; i < 24; i++) zMax[v.per[i].zone] = Math.max(zMax[v.per[i].zone], v.def[i]);
    for (let z = 0; z < 4; z++) {
      const dm = zMax[z]; if (dm < 5) continue;
      const depth = dm + 7 + Math.min(10, dm * 0.4), amp = Math.min(3.2, 1 + dm * 0.12), n = z === 0 || z === 2 ? 6 : 8;
      g.beginPath();
      for (let k = 0; k <= n; k++) {
        const t = k / n;
        let x, y;
        if (z === 0) { x = x0 + 5 + (L - 10) * t; y = y0 + depth + (k & 1 ? amp : -amp); }
        else if (z === 2) { x = x0 + 5 + (L - 10) * t; y = y0 + D - depth + (k & 1 ? amp : -amp); }
        else if (z === 1) { y = y0 + D * 0.2 + D * 0.6 * t; x = x0 + L - Math.min(L * 0.4, depth * 0.7) + (k & 1 ? amp : -amp) * 0.6; }
        else { y = y0 + D * 0.2 + D * 0.6 * t; x = x0 + Math.min(L * 0.4, depth * 0.7) + (k & 1 ? amp : -amp) * 0.6; }
        if (k === 0) g.moveTo(x, y); else g.lineTo(x, y);
      }
      g.strokeStyle = "rgba(0,0,0,0.42)"; g.lineWidth = 1.3; g.stroke();
      g.save(); g.translate(z === 1 ? -1 : z === 3 ? 1 : 0, z === 0 ? 1.4 : z === 2 ? -1.4 : 0); g.strokeStyle = "rgba(255,255,255,0.22)"; g.lineWidth = 0.8; g.stroke(); g.restore();
    }
    g.restore();
  }
  // 3) glass: cracked (spider web) or gone (dark cabin, jagged rim)
  for (const p of v.parts) {
    if (p.kind !== "glass" && p.kind !== "sunroof") continue;
    if (p.on && p.hp >= p.max) continue;
    const cx = p.x + p.w / 2, cy = p.y + p.h / 2;
    if (!p.on) {
      g.fillStyle = "#101114"; g.fillRect(p.x + 0.5, p.y + 0.5, p.w - 1, p.h - 1);
      g.fillStyle = "rgba(200,225,240,0.55)"; for (let k = 0; k < 4; k++) { const ex = p.x + (k * 0.27 + 0.1) * p.w, ey = k & 1 ? p.y + 0.5 : p.y + p.h - 1.5; g.beginPath(); g.moveTo(ex, ey); g.lineTo(ex + 1.6, ey + (k & 1 ? 1.8 : -1.8) * 0.8); g.lineTo(ex + 3, ey); g.fill(); }
    } else {
      g.strokeStyle = "rgba(235,245,255,0.75)"; g.lineWidth = 0.6; g.beginPath();
      const ox = cx + ((p.idx * 7) % 5 - 2), oy = cy + ((p.idx * 3) % 3 - 1);
      for (let k = 0; k < 7; k++) { const a = k * 0.9 + p.idx, r = Math.max(p.w, p.h) * 0.6; g.moveTo(ox, oy); g.lineTo(Math.max(p.x, Math.min(p.x + p.w, ox + Math.cos(a) * r)), Math.max(p.y, Math.min(p.y + p.h, oy + Math.sin(a) * r))); }
      g.stroke();
    }
  }
  // 4) bullet holes
  for (const hl of v.holes) { g.fillStyle = "rgba(255,255,255,0.35)"; g.beginPath(); g.arc(hl[0], hl[1], 1.6, 0, 7); g.fill(); g.fillStyle = "#0b0b0d"; g.beginPath(); g.arc(hl[0], hl[1], 1.0, 0, 7); g.fill(); }
  // 5) scorch / burnt-out shell
  if (v.scorch > 0.02) { g.save(); g.globalCompositeOperation = "source-atop"; g.fillStyle = "rgba(22,16,12," + Math.min(0.82, v.scorch * 0.82).toFixed(3) + ")"; g.fillRect(-c.width / 2, -c.height / 2, c.width, c.height); g.restore(); }
  v.spr = c;
  return c;
}

/* === 6. FRAMES & DAMAGE ============================================================================================ */
// drawing coords: x = right of the vehicle, y = toward its rear  (world = c + r·x − f·y)
function vehToLocal(v, wx, wy) { const dx = wx - v.x, dy = wy - v.y, c = Math.cos(v.ang), s = Math.sin(v.ang); return [-dx * s + dy * c, -(dx * c + dy * s)]; }
function vehToWorld(v, lx, ly) { const c = Math.cos(v.ang), s = Math.sin(v.ang); return [v.x - s * lx - c * ly, v.y + c * lx - s * ly]; }
function vehBodyCol(v) {
  const k = v.kind;
  if (k === "sedan" || k === "suv" || k === "pickup") return typeof CR_CARCOL !== "undefined" ? CR_CARCOL[v.pv & 7] : "#9e9e9e";
  return { police: "#eceff1", rusted: "#7a5a3a", anglia: "#7fc8c8", bus: "#f9a825", armytruck: "#4a5a3a", firetruck: "#c62828", apc: "#5a6a4a", rhino: "#3a4a3a", tractor: "#2e7d32",
    wagon: "#7a5432", coach: "#7a5432", cart: "#7a5432", semi: "#cfd2d4", forklift: "#f9a825", speeder: "#c0582c", spinner: "#15151c", hover: "#e8eef2", mule: "#9a5a2a", thopter: "#7a6a52", glider: "#b8902a" }[k] || "#8a8a8a";
}
function vehOcc(v) { let n = 0; for (const s of v.seats) if (s.occ) n++; return n; }
function vehNearestOcc(v, lx, ly, r) {
  let best = null, bd = r;
  for (const s of v.seats) { if (!s.occ) continue; const sx = s.u * v.L, sy = -s.w * v.D, d = Math.hypot(sx - lx, sy - ly); if (d < bd) { bd = d; best = s; } }
  return best;
}
// one hit on the vehicle. type: crash | person | bullet | blast | melee | scrape. Returns the share that reaches an occupant.
function vehDamage(v, lx, ly, dv, type, nx, ny, src) {
  const S = v.S, arm = S.arm;
  let hp = 0, dent = 0, partHit = 0, R = Math.max(18, Math.min(v.L * 0.62, 36)), glass = 0, pass = 0;
  switch (type) {
    case "crash": hp = Math.max(0, dv - 96) * 0.075 * arm; dent = Math.max(0, dv - 96) * 0.075 * Math.sqrt(arm); partHit = hp * 1.3; glass = dv > 420 ? 2 : dv > 260 ? 1 : 0; break;
    case "person": { const mr = (src && src.mass || 80) / 80; hp = Math.max(0, dv - 150) * 0.01 * mr * arm; dent = Math.max(0, dv - 100) * 0.004 * mr; partHit = hp * 2; glass = dv > 400 ? 1 : 0; R = 16; break; }
    case "bullet": hp = Math.max(0.4, Math.min(6, dv * 0.04)) * arm; partHit = hp * 3; R = 7; glass = 1; break;
    case "blast": hp = dv * arm; dent = Math.min(14, dv * 0.22); partHit = hp * 1.6; R = 70; glass = 2; break;
    case "melee": hp = Math.max(0.5, Math.min(8, dv * 0.05)) * arm; dent = 0.8; partHit = hp * 2.5; R = 14; glass = 1; break;
    case "scrape": hp = dv * 0.012 * arm; dent = 0.12; partHit = hp * 2; R = 12; break;
    default: break;
  }
  if (src === "player" || (src && src.player)) v.lastHitByPlayer = runTime;
  // crumple: where it landed, with falloff along the body; bumpers absorb the first hits
  if (dent > 0.04) {
    for (let i = 0; i < 24; i++) {
      const P = v.per[i], d = Math.hypot(P.x - lx, P.y - ly);
      if (d >= R) continue;
      const f = 1 - d / R, cap = (P.zone === 0 || P.zone === 2) ? v.D * 0.2 : v.L * 0.2;
      const bump = (P.zone === 0 && vehPart(v, "bumperF") && vehPart(v, "bumperF").on) || (P.zone === 2 && vehPart(v, "bumperR") && vehPart(v, "bumperR").on) ? 0.8 : 1;
      v.def[i] = Math.min(cap, v.def[i] + dent * f * f * bump);
    }
    v.sampDirty = true; v.sprDirty = true;
  }
  if (type === "bullet" && v.holes.length < 28) { v.holes.push([lx, ly]); v.sprDirty = true; }
  // 2.5D: seen from the front / side / back, part of the profile is glass (windshield above the hood, side windows
  // above the doors) - a share of the hits on that face goes through the glass and on toward whoever sits there
  if (type === "bullet") {
    const face = ly < -v.D / 2 + 7 ? "F" : ly > v.D / 2 - 7 ? "B" : Math.abs(lx) > v.L / 2 - 6 ? (lx < 0 ? "L" : "R") : null;
    const gp = face && v.parts.find(p => p.kind === "glass" && p.on !== undefined && (face === "F" ? p.front : face === "B" ? p.rear : face === "L" ? p.side < 0 && !p.front && !p.rear : p.side > 0 && !p.front && !p.rear));
    if (gp && Math.random() < (face === "F" ? 0.45 : 0.4)) {
      if (gp.on) { gp.hp -= 1; v.sprDirty = true; if (gp.hp <= 0) vehDetach(v, gp, nx, ny); }
      pass = Math.max(pass, gp.on ? 0.55 : 0.9);
      lx = gp.x + gp.w / 2; ly = gp.y + gp.h / 2;   // the round continues from the glass toward the seats
    }
  }
  // structure + engine
  if (hp > 0 && !v.burnt) {
    v.hp -= hp; v.lastHit = runTime;
    const inEng = S.eng === 1 ? ly < -v.D * 0.22 : S.eng === 2 ? ly > v.D * 0.22 : S.eng === 0 ? Math.abs(ly) < v.D * 0.22 : false;
    const hood = vehPart(v, "hood"), bare = hood && !hood.on ? 1.5 : 1;
    v.eng = Math.max(0, v.eng - hp / (v.hpMax * (inEng ? 0.55 / bare : 2.6)));
    if (S.horse) v.stamina = Math.max(0, v.stamina - hp / (v.hpMax * 1.5));
  }
  // parts within reach lose attachment strength (enemy fire too)
  for (const p of v.parts) {
    if (!p.on) continue;
    const qx = Math.max(p.x, Math.min(lx, p.x + p.w)), qy = Math.max(p.y, Math.min(ly, p.y + p.h)), d = Math.hypot(qx - lx, qy - ly);
    if (d >= R) continue;
    const share = 1 - d / R;
    if (p.kind === "glass" || p.kind === "sunroof") {
      if (glass && share > (type === "bullet" ? 0 : 0.25)) { p.hp -= glass; v.sprDirty = true; if (p.hp <= 0) vehDetach(v, p, nx, ny); else if (typeof sfx === "function" && vehNearPlayer(v, 700)) sfx(2400, 1600, 0.04, "triangle", 0.04); }
      if (type === "bullet" && share > 0) pass = Math.max(pass, p.on ? 0.55 : 0.9);
      continue;
    }
    p.hp -= partHit * share;
    if (type === "bullet" && p.kind === "door" && share > 0) pass = Math.max(pass, 0.3);
    if (p.hp <= 0) vehDetach(v, p, nx, ny);
  }
  if (type === "bullet") { if (pass === 0) pass = Math.abs(ly) < v.D * 0.25 ? 0.25 : 0; for (const p of v.parts) if (p.kind === "door" && !p.on && Math.abs(p.y + p.h / 2 - ly) < p.h && Math.sign(lx) === p.side) pass = 1; }
  if (type === "blast") pass = 0.45;
  if (v.hp <= 0 && !v.dead && !v.burnt) vehDisable(v, type);
  v.awake = true; v.sleep = 0;
  return pass;
}
function vehNearPlayer(v, r) { return player && Math.abs(v.x - player.x) < r && Math.abs(v.y - player.y) < r; }
function vehDetach(v, p, nx, ny) {
  if (!p.on) return;
  p.on = false; p.hp = 0; v.sprDirty = true; v.sampDirty = true; VEH.stats.parts++;
  const [wx, wy] = vehToWorld(v, p.x + p.w / 2, p.y + p.h / 2), near = vehNearPlayer(v, 900);
  if (p.kind === "glass" || p.kind === "sunroof") {
    for (let k = 0; k < 8; k++) spawnPt(wx, wy, v.vx * 0.5 + (Math.random() - 0.5) * 150, v.vy * 0.5 + (Math.random() - 0.5) * 150, 0.5, 1.6, 7, 3);
    if (typeof cityDecal === "function") cityDecal(wx, wy, "glass", 0);
    if (near && typeof playNoise === "function") playNoise(0.14, "highpass", 5200, 2600, 1.2, 0.16);
    if (typeof noiseEmit === "function") noiseEmit(wx, wy, 96, "glass", 1);
    return;
  }
  // out-of-body direction for the flying piece
  const ox = wx - v.x, oy = wy - v.y, ol = Math.hypot(ox, oy) || 1;
  const sp = 60 + Math.random() * 120, a = Math.atan2(oy / ol + (ny || 0) * -0.4, ox / ol + (nx || 0) * -0.4);
  const big = p.kind === "door" || p.kind === "hood" || p.kind === "trunk" || p.kind === "bumper" || p.kind === "canvas" || p.kind === "ladder";
  const d = { x: wx, y: wy, vx: v.vx * 0.7 + Math.cos(a) * sp, vy: v.vy * 0.7 + Math.sin(a) * sp, a: v.ang + Math.PI / 2, w: (Math.random() - 0.5) * (big ? 7 : 16),
    kind: p.kind, pw: Math.max(2, p.w), ph: Math.max(2, p.h), col: p.kind === "bumper" || p.kind === "wheel" || p.kind === "track" || p.kind === "pod" ? "#26282c" : (p.kind === "canvas" ? "#6b6b48" : p.kind === "light" ? "#fffde7" : p.kind === "lightbar" ? "#1565c0" : vehBodyCol(v)),
    t: 0, life: big ? 240 : 90, horse: p.kind === "horse" };
  if (d.horse) { d.vx = Math.cos(a) * 190; d.vy = Math.sin(a) * 190; d.a = a; d.w = 0; d.life = 9; }
  VEH.debris.push(d);
  if (VEH.debris.length > 90) VEH.debris.splice(0, VEH.debris.length - 90);
  for (let k = 0; k < 5; k++) spawnPt(wx, wy, (Math.random() - 0.5) * 120, (Math.random() - 0.5) * 120, 0.35, 1.8, k & 1 ? 15 : 12, 3);
  if (near) { if (typeof sfx === "function") sfx(big ? 170 : 600, big ? 60 : 240, big ? 0.14 : 0.06, "square", big ? 0.1 : 0.05); if (p.kind === "horse") spawnSpeech(wx, wy - 14, "THE HORSE BOLTS!", "#ffcc80", 1.2); }
  if (typeof noiseEmit === "function") noiseEmit(wx, wy, big ? 88 : 70, "crash", 1);
  if (v === VEH.me && (p.kind === "door" || p.kind === "wheel" || p.kind === "track" || p.kind === "horse")) vehToast(p.kind === "door" ? "DOOR TORN OFF" : p.kind === "horse" ? "LOST A HORSE" : p.kind === "track" ? "TRACK THROWN — PULLING" : "WHEEL GONE — PULLING " + (p.side < 0 ? "LEFT" : "RIGHT"), "#ffab40");
}
function vehDisable(v, why) {
  v.dead = true; v.eng = 0; v.hp = 0; v.disabledT = runTime;
  const fireP = why === "blast" ? 1 : why === "crash" ? 0.6 : why === "bullet" ? 0.45 : 0.35;
  if (!v.S.horse && Math.random() < fireP) v.fire = 6.5 + Math.random() * 2;
  if (v.S.horse) for (const p of v.parts) if (p.kind === "horse" && p.on) vehDetach(v, p, 0, 0);
  if (v === VEH.me) vehToast(v.fire > 0 ? "🔥 ON FIRE — BAIL OUT!" : "VEHICLE DISABLED", "#ff5252");
  if (typeof convoyOnDisabled === "function") convoyOnDisabled(v);
}
function vehExplode(v) {
  v.fire = 0; v.burnt = true; v.dead = true; v.scorch = 1; v.sprDirty = true; VEH.stats.explosions++;
  for (const p of v.parts) if (p.on && (p.kind === "glass" || p.kind === "door" || p.kind === "hood" || p.kind === "trunk" || p.kind === "sunroof" || p.kind === "canvas" || Math.random() < 0.35)) vehDetach(v, p, 0, 0);
  const R = 110 + Math.min(80, v.m / 200), dmg = 60 + (typeof waveNum === "number" ? waveNum : 1) * 9;
  if (typeof triggerRocketDetonation === "function") triggerRocketDetonation(v.x, v.y, dmg, R);
  if (typeof noiseEmit === "function") noiseEmit(v.x, v.y, 150, "explosion", 1);
  if (typeof cityDecal === "function") cityDecal(v.x, v.y, "scorch", 0);
  // occupants are thrown clear; people nearby get hurt (the player only when still inside / close)
  if (typeof convoyEjectAll === "function") convoyEjectAll(v, true);
  if (player && !(player.invulnT > 0)) { const d = Math.hypot(player.x - v.x, player.y - v.y); if (d < R) { player.hp -= player.maxHp * 0.32 * (1 - d / R); if (player.hp <= 0 && typeof resolvePlayerDeath === "function") resolvePlayerDeath(); } }
  vehBlast(v.x, v.y, R * 1.25, 18, v);
}
// a blast pushes and damages every vehicle around it (chain reactions)
function vehBlast(x, y, R, power, skip) {
  for (const u of VEH.list) {
    if (u === skip) continue;
    const d = Math.hypot(u.x - x, u.y - y) - Math.min(u.L, u.D) * 0.4;
    if (d >= R) continue;
    const f = 1 - Math.max(0, d) / R, ax = (u.x - x) / (Math.hypot(u.x - x, u.y - y) || 1), ay = (u.y - y) / (Math.hypot(u.x - x, u.y - y) || 1);
    const kick = 520 * f * Math.min(1.6, 1400 / u.m);
    u.vx += ax * kick; u.vy += ay * kick; u.w += (Math.random() - 0.5) * 3 * f * Math.min(1.5, 1400 / u.m);
    const [lx, ly] = vehToLocal(u, u.x - ax * Math.min(u.L, u.D) * 0.5, u.y - ay * Math.min(u.L, u.D) * 0.5);
    vehDamage(u, lx, ly, power * f * 2.2, "blast", ax, ay, null);
  }
  // parked vehicles in the blast wake up and take it too
  if (CITY.on) for (const q of vehNearby(x, y, R * 0.8)) if (!q.v && !q.wreck) { const v = vehMakeLive(q, "blast"); if (v && v !== skip) { const dd = Math.hypot(v.x - x, v.y - y) || 1; v.vx += (v.x - x) / dd * 160; v.vy += (v.y - y) / dd * 160; const [lx, ly] = vehToLocal(v, x, y); vehDamage(v, lx, ly, power * 1.6 * (1 - Math.min(1, dd / R)), "blast", 0, 0, null); } }
}
function vehToast(msg, col) {
  if (VEH.lastMsg === msg && runTime - VEH.msgT < 2.5) return;
  VEH.lastMsg = msg; VEH.msgT = runTime;
  if (player) spawnSpeech(player.x, player.y - 46, msg, col || "#80deea", 1.8);
}

/* === 7. HANDLING (bicycle model) ==================================================================================== */
function vehPower(v) {
  if (v.dead || v.fuel <= 0 || v.burnt) return 0;
  if (v.S.horse) return Math.min(1, vehHorses(v) / v.S.horse) * (0.3 + 0.7 * v.stamina);
  return 0.35 + 0.65 * v.eng;
}
function vehHandle(v, dt) {
  const S = v.S, c = Math.cos(v.ang), s = Math.sin(v.ang);
  let vf = v.vx * c + v.vy * s, vr = -v.vx * s + v.vy * c;
  const driven = !!v.drv, thr = driven ? v.ctl.thr : 0, st = driven ? v.ctl.st : 0, hb = driven ? v.ctl.hb : 1;
  const wl = vehWheelsLost(v), power = vehPower(v);
  const top = S.top * VPX * (1 - 0.22 * Math.min(2, wl)) * (!S.horse && v.eng < 0.25 ? 0.6 : 1), acc = S.acc * VPX * power, brk = S.brk * VPX, revTop = top * S.rev;
  v.brakeLit = 0;
  if (thr > 0.02) {
    if (vf < -8) { vf = Math.min(0, vf + brk * thr * dt); v.brakeLit = 1; }
    else { const fv = Math.max(0, vf) / top; vf += acc * thr * Math.max(0, 1 - fv * fv) * dt; }
  } else if (thr < -0.02) {
    if (vf > 8) { vf = Math.max(0, vf + brk * thr * dt); v.brakeLit = 1; }
    else { const rv = Math.max(0, -vf) / revTop; vf -= acc * 0.6 * -thr * Math.max(0, 1 - rv * rv) * dt; }
  }
  // rolling resistance, aero drag, engine braking; parked / locked wheels slide with full friction
  const mu = S.mu * (S.hover ? 1 : 1 - 0.12 * wl);
  if (!driven) {
    const dec = (S.hover ? 0.35 : mu) * VGRAV * dt, sp = Math.hypot(vf, vr);
    if (sp <= dec) { vf = 0; vr = 0; } else { vf -= vf / sp * dec; vr -= vr / sp * dec; }
  } else {
    const coast = (S.hover ? 0.25 : 0.6) * VPX + (Math.abs(thr) < 0.02 ? (S.hover ? 0.5 : 1.4) * VPX : 0) + 0.004 * vf * vf / VPX;
    if (Math.abs(vf) <= coast * dt) vf = 0; else vf -= Math.sign(vf) * coast * dt;
    if (hb) { const d = brk * 0.55 * dt; if (Math.abs(vf) <= d) vf = 0; else vf -= Math.sign(vf) * d; v.brakeLit = 1; }
  }
  // steering → yaw rate (speed-sensitive lock, lateral grip limit, pull from a missing wheel)
  const spd = Math.abs(vf), maxSt = S.st / (1 + spd / (14 * VPX));
  let pull = 0; if (wl) for (const p of v.parts) if ((p.kind === "wheel" || p.kind === "track") && !p.on) pull += p.side * (p.kind === "track" ? 0.5 : 0.18);
  v.steerA += ((st + pull * Math.min(1, spd / 120)) * maxSt - v.steerA) * Math.min(1, dt * 8);
  const wb = Math.max(30, v.D * 0.62), latMax = mu * VGRAV;
  let wT = driven || spd > 4 ? vf * Math.tan(v.steerA) / wb : 0;
  if (spd > 30) wT = Math.max(-latMax / spd, Math.min(latMax / spd, wT));
  const grip = (S.hover ? 3.2 : hb && driven ? 2.2 : 9) * (v.spinT > 0 ? 0.25 : 1);
  if (v.spinT > 0) v.spinT -= dt;
  v.w += (wT - v.w) * Math.min(1, dt * grip);
  const dvr = latMax * dt * (hb && driven ? 0.3 : 1) * (v.spinT > 0 ? 0.4 : 1);
  v.skid = Math.abs(vr) > 70 && !S.hover && spd + Math.abs(vr) > 120 ? Math.min(1, Math.abs(vr) / 260) : (hb && driven && spd > 90 && !S.hover ? 0.6 : 0);
  if (Math.abs(vr) <= dvr) vr = 0; else vr -= Math.sign(vr) * dvr;
  v.vx = vf * c - vr * s; v.vy = vf * s + vr * c;
  v.vf = vf;
  // fuel / horse stamina
  if (driven && !v.dead) {
    const use = S.use * (0.08 + 0.92 * Math.abs(thr) * (0.45 + 0.55 * Math.min(1, spd / (S.top * VPX))));
    if (S.horse) v.stamina = Math.max(0.05, Math.min(1, v.stamina - (Math.abs(thr) > 0.5 && spd > S.top * VPX * 0.6 ? use * 1.4 : -0.012) * dt));
    else if (v.fuel > 0) { v.fuel = Math.max(0, v.fuel - use * dt * (VEH.fuelMul || 1)); if (v.fuel <= 0 && v === VEH.me) vehToast("OUT OF " + vehFuelName(v) + " — FIND A STATION", "#ff5252"); }
  }
}

/* === 8. WORLD COLLISION (deformed perimeter samples vs tile flags) ==================================================== */
function vehSamples(v) {
  if (!v.sampDirty && v.samples) return v.samples;
  const O = vehOutline(v, 0), out = [];
  for (let i = 0; i < 24; i++) {
    const a = O[i], b = O[(i + 1) % 24], len = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.ceil(len / 7));
    for (let k = 0; k < n; k++) { const t = k / n; out.push(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t); }
  }
  v.samples = new Float32Array(out); v.sampDirty = false;
  return v.samples;
}
// small props / fences a vehicle smashes through (minimum impact speed, m/s). Heavy-only entries need ≥ 5 t.
const VEH_BREAK = { barricade: 2.5, bench: 4, busstop: 6, evacsign: 2.5, grill: 3, haybale: 3, hydrant: 5, icechest: 3, mailbox: 3, playset: 5, newsbox: 3, trash: 2.5,
  streetlight: 8, pole: 8, flagpole: 8, pricesign: 9, airpump: 5, booth: 8, bleachers: 8, stall: 2, grave: 99, sandbags: -1.2, pump: 7 };
const VEH_FENCE_BREAK = { 15: 4, 16: 6, 17: 3, 22: 7, 21: -6 };   // K_FENCE_WOOD, K_FENCE_CHAIN, K_FENCE_PICKET, K_HEDGE, K_STONE (heavy only)
function vehTryBreak(v, C, speed) {
  const ms = speed / VPX, k = C.k;
  if (VEH_FENCE_BREAK[k] !== undefined) {
    const need = VEH_FENCE_BREAK[k];
    if ((need > 0 && ms >= need) || (need < 0 && v.m >= 5000 && ms >= -need)) { vehBreakFence(C.tx, C.ty, v, k); return true; }
    return false;
  }
  if (k === K_POLE || k === K_HEDGE) {
    const Ch = cityChunk(C.tx >> 7, C.ty >> 7);
    for (const p of Ch.props) {
      if (!(C.tx >= Math.floor(p.x) && C.tx < Math.ceil(p.x + p.w) && C.ty >= Math.floor(p.y) && C.ty < Math.ceil(p.y + p.h))) continue;
      const need = VEH_BREAK[p.t];
      if (need === undefined) return false;
      if ((need > 0 && ms >= need) || (need < 0 && v.m >= 5000 && ms >= -need)) { vehBreakProp(p, v, ms); return true; }
      return false;
    }
  }
  return false;
}
function vehBreakProp(p, v, ms) {
  if (!p.key) return;
  cityRT.used.add(p.key);
  const x = (p.x + p.w / 2) * 16 - CITY.orx, y = (p.y + p.h / 2) * 16 - CITY.ory;
  vehQueueRebuild(p.x + p.w / 2, p.y + p.h / 2, x, y, Math.max(p.w, p.h) * 16 + 16);
  const n = Math.min(14, 5 + Math.floor(ms));
  for (let k = 0; k < n; k++) spawnPt(x, y, v.vx * 0.4 + (Math.random() - 0.5) * 160, v.vy * 0.4 + (Math.random() - 0.5) * 160, 0.6, 2.2, p.t === "haybale" ? 6 : 4, 3);
  if (p.t === "hydrant") VEH.geysers = (VEH.geysers || []).concat([{ x, y, t: 14 }]);
  if (p.t === "pump") { triggerRocketDetonation(x, y, 70, 130); vehBlast(x, y, 150, 16, null); if (typeof noiseEmit === "function") noiseEmit(x, y, 150, "explosion", 1); }
  if (typeof noiseEmit === "function") noiseEmit(x, y, 84, "crash", 1);
  if (vehNearPlayer(v, 800) && typeof sfx === "function") sfx(220, 90, 0.1, "square", 0.08);
  VEH.debris.push({ x, y, vx: v.vx * 0.6, vy: v.vy * 0.6, a: Math.random() * 6, w: (Math.random() - 0.5) * 9, kind: "prop", pw: Math.min(18, p.w * 12), ph: Math.min(10, p.h * 10), col: p.t === "hydrant" ? "#d32f2f" : p.t === "mailbox" ? "#1565c0" : "#6d6d6d", t: 0, life: 120 });
}
function vehBreakFence(tx, ty, v, k) {
  const C = cityChunk(tx >> 7, ty >> 7);
  let f = null;
  for (const q of C.fences) { const w = Math.max(1, q.x1 - q.x0), h = Math.max(1, q.y1 - q.y0); if (tx >= q.x0 && tx < q.x0 + w && ty >= q.y0 && ty < q.y0 + h) { f = q; break; } }
  const horiz = f ? (f.x1 - f.x0) >= (f.y1 - f.y0) : true, span = Math.ceil(Math.min(v.L, v.D) / 32) + 2;
  for (let d = -span; d <= span; d++) cityRT.fenceBroken.add(cityKeyT(horiz ? tx + d : tx, horiz ? ty : ty + d));
  const lx = tx * 16 + 8 - CITY.orx, ly = ty * 16 + 8 - CITY.ory;
  vehQueueRebuild(tx, ty, lx, ly, span * 32 + 32);
  cityRT.visGen++;
  for (let q = 0; q < 12; q++) spawnPt(lx, ly, v.vx * 0.35 + (Math.random() - 0.5) * 180, v.vy * 0.35 + (Math.random() - 0.5) * 180, 0.7, 2.4, k === 16 ? 8 : 4, 3);
  for (let q = 0; q < 3; q++) VEH.debris.push({ x: lx + (Math.random() - 0.5) * 30, y: ly + (Math.random() - 0.5) * 30, vx: v.vx * 0.5 + (Math.random() - 0.5) * 90, vy: v.vy * 0.5 + (Math.random() - 0.5) * 90, a: Math.random() * 6, w: (Math.random() - 0.5) * 10, kind: "plank", pw: 20, ph: 3.5, col: k === 16 ? "#9aa0a6" : k === 22 ? "#4a7a3a" : k === 21 ? "#8a8a80" : "#a07850", t: 0, life: 200 });
  if (typeof noiseEmit === "function") noiseEmit(lx, ly, 86, "crash", 1);
  if (vehNearPlayer(v, 800) && typeof sfx === "function") { sfx(300, 80, 0.12, "sawtooth", 0.09); if (typeof playNoise === "function") playNoise(0.12, "bandpass", 900, 300, 1, 0.14); }
}
const _vc = [];
function vehWorldCollide(v, ox, oy, oa) {
  const samp = vehSamples(v), c = Math.cos(v.ang), s = Math.sin(v.ang), c0 = Math.cos(oa), s0 = Math.sin(oa), hover = !!v.S.hover;
  const OX = CITY.orx, OY = CITY.ory;
  _vc.length = 0;
  for (let i = 0; i < samp.length; i += 2) {
    const lx = samp[i], ly = samp[i + 1];
    const wx = v.x - s * lx - c * ly, wy = v.y + c * lx - s * ly;
    const tx = Math.floor((wx + OX) / 16), ty = Math.floor((wy + OY) / 16);
    const f = cityFlagsT(tx, ty);
    if (!(f & F_MOVE)) continue;
    if (hover && (f & (F_LOW | F_WATER))) continue;
    const k = cityKindT(tx, ty);
    if (k === K_CAR) {
      if (vehPromoteAtTile(tx, ty, "hit")) continue;
      if (!vehStaticAtTile(tx, ty)) { const key = (tx >> 7) * 4096 + (ty >> 7); if (!VEH.healed || !VEH.healed.has(key)) { (VEH.healed || (VEH.healed = new Set())).add(key); VEH.rebuild.set(key, 1); vehFlushRebuild(); } continue; }   // orphan stamp: self-heal
    }
    if (k === K_GDOOR && v.drv && Math.hypot(v.vx, v.vy) > 4 * VPX && typeof cityAccessGarageBreak === "function") { cityAccessGarageBreak(tx, ty, v); continue; }
    const px0 = ox - s0 * lx - c0 * ly + OX, py0 = oy + c0 * lx - s0 * ly + OY, wxa = wx + OX, wya = wy + OY;
    let nx = 0, ny = 0, depth = 0;
    const ptx = Math.floor(px0 / 16), pty = Math.floor(py0 / 16);
    if (ptx !== tx && !(cityFlagsT(ptx, ty) & F_MOVE)) { nx = ptx < tx ? -1 : 1; depth = nx < 0 ? wxa - tx * 16 : tx * 16 + 16 - wxa; }
    else if (pty !== ty && !(cityFlagsT(tx, pty) & F_MOVE)) { ny = pty < ty ? -1 : 1; depth = ny < 0 ? wya - ty * 16 : ty * 16 + 16 - wya; }
    else {   // came in diagonally or by rotating: shortest exit through a free face
      let best = 1e9;
      const cand = [[-1, 0, wxa - tx * 16], [1, 0, tx * 16 + 16 - wxa], [0, -1, wya - ty * 16], [0, 1, ty * 16 + 16 - wya]];
      for (const q of cand) { if (cityFlagsT(tx + q[0], ty + q[1]) & F_MOVE) continue; if (q[2] < best) { best = q[2]; nx = q[0]; ny = q[1]; } }
      if (best === 1e9) { const dx = wxa - (tx * 16 + 8), dy = wya - (ty * 16 + 8); if (Math.abs(dx) > Math.abs(dy)) { nx = Math.sign(dx) || 1; depth = 8 - Math.abs(dx) + 8; } else { ny = Math.sign(dy) || 1; depth = 8 - Math.abs(dy) + 8; } }
      else depth = best;
    }
    _vc.push({ wx, wy, nx, ny, depth: Math.max(0, Math.min(16, depth)), tx, ty, k, f });
  }
  if (!_vc.length) return 0;
  // cluster by normal (tiles are axis aligned): centroid + deepest point per side
  const cl = [null, null, null, null];
  for (const C of _vc) {
    const id = C.nx > 0 ? 0 : C.nx < 0 ? 1 : C.ny > 0 ? 2 : 3;
    let K = cl[id];
    if (!K) K = cl[id] = { n: 0, x: 0, y: 0, nx: C.nx, ny: C.ny, depth: 0, C };
    K.n++; K.x += C.wx; K.y += C.wy; if (C.depth > K.depth) { K.depth = C.depth; K.C = C; }
  }
  let maxVn = 0, hit = null, maxDepth = 0;
  for (let it = 0; it < 2; it++) for (const K of cl) {
    if (!K) continue;
    const px = K.x / K.n, py = K.y / K.n, rx = px - v.x, ry = py - v.y;
    const vpx = v.vx - v.w * ry, vpy = v.vy + v.w * rx, vn = vpx * K.nx + vpy * K.ny;
    if (vn >= 0) continue;
    if (it === 0) {
      if (-vn > maxVn) { maxVn = -vn; hit = K; }
      if (vehTryBreak(v, K.C, -vn)) { K.broke = true; v.vx *= 0.82; v.vy *= 0.82; continue; }
    }
    if (K.broke) continue;
    const rn = rx * K.ny - ry * K.nx, e = v.m > 5000 ? 0.05 : 0.15;
    const jn = -(1 + e) * vn / (1 / v.m + rn * rn / v.I);
    v.vx += K.nx * jn / v.m; v.vy += K.ny * jn / v.m; v.w += rn * jn / v.I;
    // friction along the wall
    const tx = -K.ny, ty = K.nx, vt = (v.vx - v.w * ry) * tx + (v.vy + v.w * rx) * ty, rt = rx * ty - ry * tx;
    let jt = -vt / (1 / v.m + rt * rt / v.I); jt = Math.max(-0.3 * jn, Math.min(0.3 * jn, jt));
    v.vx += tx * jt / v.m; v.vy += ty * jt / v.m; v.w += rt * jt / v.I;
    if (Math.abs(vt) > 90) v.scrapeT = 0.15;
  }
  // push out (per side) and undo rotation that drove the body into a wall
  let pxp = 0, pxn = 0, pyp = 0, pyn = 0;
  for (const K of cl) { if (!K || K.broke) continue; maxDepth = Math.max(maxDepth, K.depth); if (K.nx > 0) pxp = K.depth; else if (K.nx < 0) pxn = K.depth; else if (K.ny > 0) pyp = K.depth; else pyn = K.depth; }
  v.x += (pxp - pxn) * (pxp && pxn ? 0 : 1) + (pxp ? 0.2 : pxn ? -0.2 : 0); v.y += (pyp - pyn) * (pyp && pyn ? 0 : 1) + (pyp ? 0.2 : pyn ? -0.2 : 0);
  if (maxDepth > 5 || (pxp && pxn) || (pyp && pyn)) { v.ang = oa; v.w *= -0.2; if ((pxp && pxn) || (pyp && pyn)) { v.x = ox; v.y = oy; } }
  // impact damage (once per sub-step, at the hardest contact)
  if (hit && !hit.broke && maxVn > 96 && v.hitCD <= 0) {
    const dv = maxVn * 1.12, [lx, ly] = vehToLocal(v, hit.C.wx, hit.C.wy);
    vehDamage(v, lx, ly, dv, "crash", hit.nx, hit.ny, v.drv === "P" ? "player" : null);
    vehImpactFx(v, hit.C.wx, hit.C.wy, dv, hit.C.k);
    if (dv > 300) v.spinT = 0.35;
    v.hitCD = 0.12;
    if (v.drv === "P") vehOccupantJolt(v, dv);
  } else if (hit && maxVn > 30 && v.scrapeT > 0 && hit.C) {
    if (Math.random() < 0.5) spawnPt(hit.C.wx, hit.C.wy, (Math.random() - 0.5) * 120, (Math.random() - 0.5) * 120, 0.25, 1.4, 1, 3);
    const [lx, ly] = vehToLocal(v, hit.C.wx, hit.C.wy); vehDamage(v, lx, ly, maxVn, "scrape", hit.nx, hit.ny, null);
  }
  return maxVn;
}
function vehImpactFx(v, x, y, dv, k) {
  VEH.stats.crashes++;
  const n = Math.min(16, 3 + Math.floor(dv / 60));
  for (let i = 0; i < n; i++) spawnPt(x, y, (Math.random() - 0.5) * dv * 0.5, (Math.random() - 0.5) * dv * 0.5, 0.3 + Math.random() * 0.3, 1.6, i % 3 === 0 ? 7 : 3, i % 3 === 0 ? 3 : 4);
  if (typeof noiseEmit === "function") noiseEmit(x, y, Math.min(110, 70 + dv / 18), "crash", v.drv === "P" ? 0 : 1);
  if (vehNearPlayer(v, 900)) {
    if (typeof sfx === "function") sfx(160 + Math.random() * 40, 50, Math.min(0.3, 0.08 + dv / 3000), "sawtooth", Math.min(0.26, 0.06 + dv / 3000));
    if (typeof playNoise === "function") playNoise(Math.min(0.32, 0.08 + dv / 2500), "lowpass", 1400, 200, 0.8, Math.min(0.3, 0.06 + dv / 2600));
    if (v.drv === "P" && typeof fxShake === "function") fxShake(Math.min(14, dv / 50), 0.25);
  }
}
// heavy crashes jolt the people inside (the player too - seat belts help, it still hurts)
function vehOccupantJolt(v, dv) {
  if (dv < 340 || !player) return;
  const dmg = (dv - 340) * 0.03 * (player.maxHp / 100);
  if (!(player.invulnT > 0)) { player.hp -= dmg; if (player.hp <= 0 && typeof resolvePlayerDeath === "function") resolvePlayerDeath(); }
  if (typeof convoyJolt === "function") convoyJolt(v, dv);
}

/* === 9. VEHICLE ↔ VEHICLE (OBB SAT + impulses) ======================================================================= */
function vehBox(v, B) {
  let fF = 0, fR = 0, sL = 0, sR = 0;
  for (let i = 0; i < 24; i++) { const z = v.per[i].zone, d = v.def[i]; if (z === 0) fF = Math.max(fF, d); else if (z === 2) fR = Math.max(fR, d); else if (z === 1) sR = Math.max(sR, d); else sL = Math.max(sL, d); }
  const ef = v.D / 2 - fF * 0.8, er = v.D / 2 - fR * 0.8, el = v.L / 2 - sL * 0.6, eg = v.L / 2 - sR * 0.6;
  const c = Math.cos(v.ang), s = Math.sin(v.ang), of = (ef - er) / 2, orr = (eg - el) / 2;
  B.c = c; B.s = s; B.hf = (ef + er) / 2; B.hw = (el + eg) / 2; B.cx = v.x + c * of - s * orr; B.cy = v.y + s * of + c * orr;
  return B;
}
const _BA = {}, _BB = {};
function vehCorners(B, out) {
  const fx = B.c * B.hf, fy = B.s * B.hf, rx = -B.s * B.hw, ry = B.c * B.hw;
  out[0] = B.cx + fx + rx; out[1] = B.cy + fy + ry; out[2] = B.cx + fx - rx; out[3] = B.cy + fy - ry;
  out[4] = B.cx - fx - rx; out[5] = B.cy - fy - ry; out[6] = B.cx - fx + rx; out[7] = B.cy - fy + ry;
  return out;
}
const _cA = new Float32Array(8), _cB = new Float32Array(8);
function vehSAT(A, B) {
  const axes = [A.c, A.s, -A.s, A.c, B.c, B.s, -B.s, B.c];
  let best = 1e9, bx = 0, by = 0;
  const dx = B.cx - A.cx, dy = B.cy - A.cy;
  for (let i = 0; i < 8; i += 2) {
    const ax = axes[i], ay = axes[i + 1];
    const pa = Math.abs(A.hf * (A.c * ax + A.s * ay)) + Math.abs(A.hw * (-A.s * ax + A.c * ay));
    const pb = Math.abs(B.hf * (B.c * ax + B.s * ay)) + Math.abs(B.hw * (-B.s * ax + B.c * ay));
    const d = dx * ax + dy * ay, o = pa + pb - Math.abs(d);
    if (o <= 0) return null;
    if (o < best) { best = o; bx = d < 0 ? -ax : ax; by = d < 0 ? -ay : ay; }
  }
  // contact: B's corners deepest along −n, A's deepest along +n (averaging near-ties for flat contacts)
  vehCorners(A, _cA); vehCorners(B, _cB);
  let mb = 1e9, ma = -1e9;
  for (let i = 0; i < 8; i += 2) { mb = Math.min(mb, _cB[i] * bx + _cB[i + 1] * by); ma = Math.max(ma, _cA[i] * bx + _cA[i + 1] * by); }
  let sx = 0, sy = 0, n = 0;
  for (let i = 0; i < 8; i += 2) { if (_cB[i] * bx + _cB[i + 1] * by < mb + 3) { sx += _cB[i]; sy += _cB[i + 1]; n++; } if (_cA[i] * bx + _cA[i + 1] * by > ma - 3) { sx += _cA[i]; sy += _cA[i + 1]; n++; } }
  return { nx: bx, ny: by, depth: best, px: sx / n, py: sy / n };
}
function vehPairStep() {
  const L = VEH.list, n = L.length;
  for (let i = 0; i < n; i++) {
    const A = L[i]; if (A.far) continue;
    const ra = Math.hypot(A.L, A.D) * 0.5;
    for (let j = i + 1; j < n; j++) {
      const B = L[j]; if (B.far || (!A.awake && !B.awake)) continue;
      const rb = Math.hypot(B.L, B.D) * 0.5, dx = B.x - A.x, dy = B.y - A.y;
      if (dx * dx + dy * dy > (ra + rb) * (ra + rb)) continue;
      const hit = vehSAT(vehBox(A, _BA), vehBox(B, _BB));
      if (!hit) continue;
      vehResolvePair(A, B, hit);
    }
  }
}
function vehResolvePair(A, B, h) {
  const nx = h.nx, ny = h.ny, rax = h.px - A.x, ray = h.py - A.y, rbx = h.px - B.x, rby = h.py - B.y;
  const vax = A.vx - A.w * ray, vay = A.vy + A.w * rax, vbx = B.vx - B.w * rby, vby = B.vy + B.w * rbx;
  const vn = (vbx - vax) * nx + (vby - vay) * ny;
  const ian = rax * ny - ray * nx, ibn = rbx * ny - rby * nx;
  const kN = 1 / A.m + 1 / B.m + ian * ian / A.I + ibn * ibn / B.I;
  // separate by inverse mass
  const sA = (1 / A.m) / (1 / A.m + 1 / B.m), corr = Math.max(0, h.depth - 0.3);
  A.x -= nx * corr * sA; A.y -= ny * corr * sA; B.x += nx * corr * (1 - sA); B.y += ny * corr * (1 - sA);
  A.awake = B.awake = true; A.sleep = B.sleep = 0;
  if (vn >= 0) return;
  const e = 0.12, j = -(1 + e) * vn / kN;
  A.vx -= nx * j / A.m; A.vy -= ny * j / A.m; A.w -= ian * j / A.I;
  B.vx += nx * j / B.m; B.vy += ny * j / B.m; B.w += ibn * j / B.I;
  const tx = -ny, ty = nx, vt = (vbx - vax) * tx + (vby - vay) * ty, iat = rax * ty - ray * tx, ibt = rbx * ty - rby * tx;
  let jt = -vt / (1 / A.m + 1 / B.m + iat * iat / A.I + ibt * ibt / B.I); jt = Math.max(-0.35 * j, Math.min(0.35 * j, jt));
  A.vx -= tx * jt / A.m; A.vy -= ty * jt / A.m; A.w -= iat * jt / A.I; B.vx += tx * jt / B.m; B.vy += ty * jt / B.m; B.w += ibt * jt / B.I;
  // each body feels its own Δv: the light car crumples, the bus barely notices
  const dA = j / A.m * 1.0, dB = j / B.m * 1.0;
  if (A.hitCD <= 0 && dA > 96) { const [lx, ly] = vehToLocal(A, h.px, h.py); vehDamage(A, lx, ly, dA, "crash", nx, ny, B.drv === "P" ? "player" : null); if (dA > 300) A.spinT = 0.35; A.hitCD = 0.12; if (A.drv === "P") vehOccupantJolt(A, dA); }
  if (B.hitCD <= 0 && dB > 96) { const [lx, ly] = vehToLocal(B, h.px, h.py); vehDamage(B, lx, ly, dB, "crash", -nx, -ny, A.drv === "P" ? "player" : null); if (dB > 300) B.spinT = 0.35; B.hitCD = 0.12; if (B.drv === "P") vehOccupantJolt(B, dB); }
  if (Math.max(dA, dB) > 96) vehImpactFx(Math.max(dA, dB) === dA ? A : B, h.px, h.py, Math.max(dA, dB), K_CAR);
  if (A.drv && typeof convoyOnBump === "function") convoyOnBump(A, B);
}

/* === 10. VEHICLES ↔ PEOPLE ============================================================================================ */
function vehPeopleStep(v, dt) {
  const sp = Math.hypot(v.vx, v.vy);
  const R = Math.hypot(v.L, v.D) * 0.5 + 16, c = Math.cos(v.ang), s = Math.sin(v.ang);
  const hw = v.L / 2, hf = v.D / 2;
  // enemies (allies are friends: they are shoved aside, never hit)
  for (let j = 0; j < MAX_E; j++) {
    if (!eAct[j]) continue;
    const dx = eX[j] - v.x, dy = eY[j] - v.y;
    if (dx > R || dx < -R || dy > R || dy < -R) continue;
    const er = eType[j] === 99 ? 20 : eType[j] === 98 ? 14 : 9;
    const fw = dx * c + dy * s, rt = -dx * s + dy * c;
    const ox = hw + er - Math.abs(rt), oy = hf + er - Math.abs(fw);
    if (ox <= 0 || oy <= 0) continue;
    let nx, ny, push;   // outward normal (world) from the body to the person
    if (ox < oy) { const sg = rt >= 0 ? 1 : -1; nx = -s * sg; ny = c * sg; push = ox; } else { const sg = fw >= 0 ? 1 : -1; nx = c * sg; ny = s * sg; push = oy; }
    const vpx = v.vx - v.w * dy, vpy = v.vy + v.w * dx, vn = vpx * nx + vpy * ny;
    const ally = typeof allyIs === "function" && allyCount > 0 && allyIs(j);
    const mass = eType[j] === 99 ? 1500 : eType[j] === 98 ? 320 : 85;
    const shareP = v.m / (v.m + mass);
    eX[j] += nx * (push + 1) * shareP; eY[j] += ny * (push + 1) * shareP;
    v.x -= nx * (push + 1) * (1 - shareP); v.y -= ny * (push + 1) * (1 - shareP);
    if (vn < 40 || ally || (typeof sdIgnore === "function" && sdIgnore(j)) || v.hitE === eUid[j] + ":" + Math.floor(runTime * 4)) continue;
    v.hitE = eUid[j] + ":" + Math.floor(runTime * 4);
    // the person takes the hit; the vehicle loses the momentum it gave away
    const dvV = vn * mass / (v.m + mass);
    v.vx -= nx * dvV; v.vy -= ny * dvV;
    const might = v.drv === "P" ? (player.might || 1) : 0.8;
    const dmg = Math.max(0, vn - 60) * 0.9 * Math.pow(v.m / 1400, 0.35) * might;
    if (dmg > 0) {
      eHP[j] -= dmg; eStun[j] = Math.max(eStun[j], Math.min(1.6, 0.3 + vn / 400));
      if (typeof spawnDmg === "function") spawnDmg(eX[j], eY[j], dmg, vn > 300);
      for (let k = 0; k < 3; k++) spawnPt(eX[j], eY[j], nx * vn * 0.4 + (Math.random() - 0.5) * 80, ny * vn * 0.4 + (Math.random() - 0.5) * 80, 0.4, 2, 0, 3);
      if (typeof stAlert === "function" && typeof ST !== "undefined" && ST.state) stAlert(j, v.x, v.y, false);
      if (eHP[j] <= 0) { if (v.drv === "P") VEH.stats.kills++; killEnemy(j, false, Math.atan2(ny, nx)); }
      else { eX[j] += nx * Math.min(26, vn * 0.05); eY[j] += ny * Math.min(26, vn * 0.05); }
    }
    const [lx, ly] = vehToLocal(v, eX[j] - nx * er, eY[j] - ny * er);
    vehDamage(v, lx, ly, vn, "person", -nx, -ny, { mass, player: v.drv === "P" });
    if (vehNearPlayer(v, 700) && typeof sfx === "function") sfx(140, 60, 0.08, "square", 0.1);
  }
  // squad members and the hero on foot just get shoved out of the way
  if (typeof MAX_MINION !== "undefined") for (let m = 0; m < MAX_MINION; m++) {
    if (!mAct[m] || (typeof mSeatOf === "function" && mSeatOf(m))) continue;
    const dx = mX[m] - v.x, dy = mY[m] - v.y; if (dx > R || dx < -R || dy > R || dy < -R) continue;
    const fw = dx * c + dy * s, rt = -dx * s + dy * c, ox = hw + 8 - Math.abs(rt), oy = hf + 8 - Math.abs(fw);
    if (ox <= 0 || oy <= 0) continue;
    if (ox < oy) { const sg = rt >= 0 ? 1 : -1; mX[m] += -s * sg * (ox + 1); mY[m] += c * sg * (ox + 1); } else { const sg = fw >= 0 ? 1 : -1; mX[m] += c * sg * (oy + 1); mY[m] += s * sg * (oy + 1); }
  }
  if (player && player.inVehicle !== 3 && !player.roof) {
    const dx = player.x - v.x, dy = player.y - v.y;
    if (Math.abs(dx) < R && Math.abs(dy) < R) {
      const fw = dx * c + dy * s, rt = -dx * s + dy * c, ox = hw + 9 - Math.abs(rt), oy = hf + 9 - Math.abs(fw);
      if (ox > 0 && oy > 0) {
        let nx, ny, push; if (ox < oy) { const sg = rt >= 0 ? 1 : -1; nx = -s * sg; ny = c * sg; push = ox; } else { const sg = fw >= 0 ? 1 : -1; nx = c * sg; ny = s * sg; push = oy; }
        const q = cityResolve(player.x + nx * (push + 1), player.y + ny * (push + 1), 7, false); player.x = q[0]; player.y = q[1];
        // a hostile car would hurt; your own convoy only shoves you
      }
    }
  }
}

/* === 11. THE STEP ===================================================================================================== */
function vehStepAll(dt) {
  if (!CITY.on || !player) return;
  const px = player.x, py = player.y;
  if (VEH.me && (!VEH.list.includes(VEH.me) || player.inVehicle !== 3)) { if (player.inVehicle === 3) player.inVehicle = 0; VEH.me = null; }
  if (typeof convoyStep === "function") convoyStep(dt);       // AI drivers set their controls first
  for (const v of VEH.list) {
    const d = Math.max(Math.abs(v.x - px), Math.abs(v.y - py));
    v.far = d > 2600 && !v.drv && !(v.convoy);
    if (v.far) continue;
    if (v.hitCD > 0) v.hitCD -= dt;
    if (v.scrapeT > 0) v.scrapeT -= dt;
    if (v.drv) { v.awake = true; v.sleep = 0; }
    if (v.awake) {
      vehHandle(v, dt);
      const sp = Math.hypot(v.vx, v.vy) + Math.abs(v.w) * v.D * 0.5;
      const n = Math.min(5, Math.max(1, Math.ceil(sp * dt / 6))), h = dt / n;
      for (let k = 0; k < n; k++) {
        const ox = v.x, oy = v.y, oa = v.ang;
        v.x += v.vx * h; v.y += v.vy * h; v.ang += v.w * h;
        vehWorldCollide(v, ox, oy, oa);
      }
      if (sp > 30) vehPeopleStep(v, dt);
      if (!v.drv && sp < 4 && Math.abs(v.w) < 0.03) { v.sleep += dt; if (v.sleep > 1.2) { v.awake = false; v.vx = v.vy = v.w = 0; } } else v.sleep = 0;
      vehTrailFx(v, dt, sp);
    }
    vehLifeFx(v, dt);
  }
  vehPairStep();
  vehBashStep(dt);
  vehDebrisStep(dt);
  if (VEH.me) {
    const v = VEH.me;
    player.x = v.x; player.y = v.y; player.vx = v.vx; player.vy = v.vy;
    player.vehicleHp = Math.max(1, v.hp);
    vehRefuelStep(v, dt);
    if (v.fire > 0 && runTime - (v.fireSeen || 0) > 1.4) { v.fireSeen = runTime; if (runTime - (v.fireStart || (v.fireStart = runTime)) > 1.2) vehExit(true); }
    if (v.dead && !v.deadSeen) { v.deadSeen = 1; vehToast(v.fire > 0 ? "🔥 ON FIRE — BAIL OUT!" : "VEHICLE DISABLED — [F] TO GET OUT", "#ff5252"); }
  }
  if (VEH.hornT > 0) VEH.hornT -= dt;
  // culling: keep a few hundred live bodies around; far, empty, quiet ones keep their place in the list (state survives)
  if (VEH.list.length > 260) { const far = VEH.list.filter(v => v.far && !v.drv && !v.convoy).sort((a, b) => Math.hypot(b.x - px, b.y - py) - Math.hypot(a.x - px, a.y - py)); for (let i = 0; i < far.length && VEH.list.length > 240; i++) { far[i].spr = far[i].sprOwn = null; } }
}
function vehTrailFx(v, dt, sp) {
  // skid marks + tyre squeal, hover wash, exhaust
  if (v.skid > 0.3 && !v.S.hover && !v.S.horse) {
    v.skidT -= dt;
    if (v.skidT <= 0) {
      v.skidT = 0.03;
      for (const s of [-1, 1]) { const [wx, wy] = vehToWorld(v, s * (v.L / 2 - 4), v.D * 0.32); VEH.skids.push([wx, wy, v.ang, runTime, v.skid]); }
      if (VEH.skids.length > 600) VEH.skids.splice(0, VEH.skids.length - 600);
      if (vehNearPlayer(v, 600) && Math.random() < 0.3 && typeof playNoise === "function") playNoise(0.08, "bandpass", 1800, 1500, 6, 0.05 * v.skid);
    }
  }
  if (v.drv && !v.dead && Math.random() < 0.25 + Math.abs(v.ctl.thr) * 0.5 && !v.S.horse) {
    const [ex, ey] = vehToWorld(v, (v.S.hover ? 0 : v.L * 0.28), v.D * 0.5 + 2);
    spawnPt(ex, ey, -Math.cos(v.ang) * 30 + (Math.random() - 0.5) * 16, -Math.sin(v.ang) * 30 + (Math.random() - 0.5) * 16, 0.5, v.S.hover ? 2.2 : 1.8, v.S.hover ? 9 : 7, 2);
  }
  if (v.drv && v.S.horse && sp > 40 && Math.random() < 0.35) spawnPt(v.x + (Math.random() - 0.5) * v.L, v.y + (Math.random() - 0.5) * v.L, (Math.random() - 0.5) * 30, (Math.random() - 0.5) * 30, 0.6, 3, 12, 5);
}
function vehLifeFx(v, dt) {
  if (v.burnt && v.fire <= 0) { if (Math.random() < dt * 1.5 && vehNearPlayer(v, 1200)) spawnPt(v.x + (Math.random() - 0.5) * v.L * 0.5, v.y + (Math.random() - 0.5) * v.L * 0.5, 4, -18, 2.2, 5, 15, 2); return; }
  const hpF = v.hp / v.hpMax, near = vehNearPlayer(v, 1300);
  const [ex, ey] = vehToWorld(v, 0, v.S.eng === 2 ? v.D * 0.36 : v.S.eng === 0 ? 0 : -v.D * 0.36);
  if (near && !v.S.horse && (hpF < 0.35 || v.eng < 0.4)) {
    const black = hpF < 0.15 || v.eng < 0.15;
    if (Math.random() < dt * (black ? 14 : 7)) spawnPt(ex + (Math.random() - 0.5) * 8, ey + (Math.random() - 0.5) * 8, (Math.random() - 0.5) * 14 - v.vx * 0.2, -20 - Math.random() * 16 - v.vy * 0.2, black ? 2.2 : 1.6, black ? 5.5 : 4.5, black ? 15 : 7, 2);
  }
  if (v.fire > 0) {
    v.fire -= dt;
    if (near) for (let k = 0; k < 2; k++) if (Math.random() < dt * 30) spawnPt(ex + (Math.random() - 0.5) * v.L * 0.6, ey + (Math.random() - 0.5) * v.L * 0.6, (Math.random() - 0.5) * 30, -30 - Math.random() * 40, 0.45, 5 + Math.random() * 4, 4, 1);
    if (near && Math.random() < dt * 10) spawnPt(ex, ey, (Math.random() - 0.5) * 20, -26, 2.4, 7, 15, 2);
    if (Math.random() < dt * 2 && typeof noiseEmit === "function") noiseEmit(v.x, v.y, 70, "fire", 1);
    // people next to a burning car get singed
    if (player && player.inVehicle !== 3 && Math.hypot(player.x - v.x, player.y - v.y) < Math.max(v.L, v.D) * 0.6 && !(player.invulnT > 0)) player.hp -= 6 * dt;
    if (v.fire <= 0) vehExplode(v);
  }
}
// hostile melee bashes the vehicle you are in (doors gone = they reach you)
function vehBashStep(dt) {
  const list = VEH.list;
  for (const v of list) {
    if (!v.drv && !vehOcc(v)) continue;
    const c = Math.cos(v.ang), s = Math.sin(v.ang), R = Math.hypot(v.L, v.D) * 0.5 + 18;
    for (let j = 0; j < MAX_E; j++) {
      if (!eAct[j] || eStun[j] > 0 || (typeof allyIs === "function" && allyCount > 0 && allyIs(j)) || (typeof sdIgnore === "function" && sdIgnore(j))) continue;
      const dx = eX[j] - v.x, dy = eY[j] - v.y; if (dx > R || dx < -R || dy > R || dy < -R) continue;
      if (typeof ST !== "undefined" && ST.state && ST.state[j] !== 4 && ST.city[j]) continue;   // only enemies in combat
      if (typeof ST !== "undefined" && ST.ranged && (ST.ranged[j] || eType[j] === 3)) continue;
      const fw = dx * c + dy * s, rt = -dx * s + dy * c;
      if (Math.abs(rt) > v.L / 2 + 14 || Math.abs(fw) > v.D / 2 + 14) continue;
      const key = "b" + j;
      if ((VEH.bashCD[key] || 0) > runTime) continue;
      VEH.bashCD[key] = runTime + 0.9 + Math.random() * 0.4;
      const lx = Math.max(-v.L / 2, Math.min(v.L / 2, rt)), ly = -Math.max(-v.D / 2, Math.min(v.D / 2, fw));
      const side = rt < 0 ? -1 : 1, open = vehDoorOpen(v, side, -ly / v.D) || vehGlassGone(v, side);
      const dmg = (eType[j] >= 98 ? 24 : 9) * (player.diff ? player.diff.hpMul || 1 : 1);
      vehDamage(v, lx, ly, dmg * (eType[j] >= 98 ? 3 : 1), "melee", -dx, -dy, null);
      if (open) { const st = vehNearestOcc(v, lx, ly, 40); if (st && typeof convoyHitOccupant === "function") convoyHitOccupant(v, st, dmg * 0.8); }
      spawnPt(v.x + dx * 0.6, v.y + dy * 0.6, (Math.random() - 0.5) * 60, (Math.random() - 0.5) * 60, 0.25, 1.6, 6, 4);
      if (vehNearPlayer(v, 600) && typeof sfx === "function") sfx(120, 70, 0.06, "square", 0.08);
    }
  }
}
VEH.bashCD = {};
function vehDebrisStep(dt) {
  for (let i = VEH.debris.length - 1; i >= 0; i--) {
    const d = VEH.debris[i];
    d.t += dt;
    if (d.t > d.life) { VEH.debris.splice(i, 1); continue; }
    if (d.horse) { d.x += d.vx * dt; d.y += d.vy * dt; continue; }
    const sp = Math.hypot(d.vx, d.vy);
    if (sp > 0.5) {
      const dec = Math.min(sp, 420 * dt), nx = d.x + d.vx * dt, ny = d.y + d.vy * dt;
      if (cityFlagsAt(nx, ny) & F_MOVE) { d.vx *= -0.3; d.vy *= -0.3; d.w *= 0.5; }
      else { d.x = nx; d.y = ny; }
      d.vx -= d.vx / sp * dec; d.vy -= d.vy / sp * dec; d.a += d.w * dt; d.w *= Math.max(0, 1 - dt * 2.5);
    }
  }
  if (VEH.geysers) for (let i = VEH.geysers.length - 1; i >= 0; i--) { const G = VEH.geysers[i]; G.t -= dt; if (G.t <= 0) { VEH.geysers.splice(i, 1); continue; } if (vehNearPlayer({ x: G.x, y: G.y }, 900)) for (let k = 0; k < 3; k++) spawnPt(G.x, G.y, (Math.random() - 0.5) * 40, -60 - Math.random() * 60, 0.6, 2.2, 9, 4); }
}

/* === 12. FUEL: themed pumps at gas stations ========================================================================== */
const VSTA = { cells: new Map(), list: [], q: [], scanT: 0, nearest: null };
// gas-station pumps are found lazily, 1 km cell by cell (budgeted), and remembered
function vehStationScan(budget) {
  if (!player) return;
  const [pxm, pym] = cityWorldM(player.x, player.y), cmx = Math.floor(pxm / 500), cmy = Math.floor(pym / 500);
  let done = 0;
  for (let r = 0; r <= 8 && done < budget; r++) for (let dy = -r; dy <= r && done < budget; dy++) for (let dx = -r; dx <= r && done < budget; dx++) {
    if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
    const kx = cmx + dx, ky = cmy + dy, key = kx * 1000 + ky;
    if (VSTA.cells.has(key) || kx < 0 || ky < 0 || kx >= 128 || ky >= 128) continue;
    const found = [];
    try {
      for (const B of cityBlocksInRect(kx * 500, ky * 500, kx * 500 + 500, ky * 500 + 500)) {
        const pumps = B.props.filter(p => p.t === "pump");
        if (!pumps.length) continue;
        const b = B.blds.find(q => q.kind === "gasstore");
        let sx = 0, sy = 0; for (const p of pumps) { sx += p.x + p.w / 2; sy += p.y + p.h / 2; }
        const st = { x: sx / pumps.length, y: sy / pumps.length, pumps: pumps.map(p => [p.x, p.y, p.w, p.h]), name: b ? (typeof cityThemedSign === "function" ? cityThemedSign("gasstore", b.name) : b.name) : "STATION", key: B.key };
        if (!VSTA.list.some(q => q.key === st.key && Math.abs(q.x - st.x) < 4)) { VSTA.list.push(st); found.push(st); }
      }
    } catch (e) { /* far / unknown cells */ }
    VSTA.cells.set(key, found); done++;
  }
}
function vehNearestStation() {
  if (!player || !VSTA.list.length) return null;
  const wx = player.x + CITY.orx, wy = player.y + CITY.ory;
  let best = null, bd = 1e12;
  for (const s of VSTA.list) { const d = (s.x * 16 - wx) ** 2 + (s.y * 16 - wy) ** 2; if (d < bd) { bd = d; best = s; } }
  if (best) best.dist = Math.sqrt(bd) / 32;
  return best;
}
function vehRefuelStep(v, dt) {
  if (typeof CONVOY !== "undefined") for (const u of CONVOY.vehicles) if (u !== v) vehRefuelOne(u, dt, true);
  VSTA.scanT -= dt;
  if (VSTA.scanT <= 0) { VSTA.scanT = 0.5; vehStationScan(v.fuel < 0.35 || v.S.horse ? 2 : 1); VSTA.nearest = vehNearestStation(); }
  vehRefuelOne(v, dt, false);
}
function vehRefuelOne(v, dt, quiet) {
  v.refuel = 0;
  if (Math.hypot(v.vx, v.vy) > 16 || v.dead) return;
  const S = VSTA.nearest;
  if (!S || S.dist > 60) return;
  const wx = v.x + CITY.orx, wy = v.y + CITY.ory, reach = Math.max(v.L, 60) * 0.5 + 64;
  let ok = false;
  for (const p of S.pumps) { const qx = Math.max(p[0] * 16, Math.min(wx, (p[0] + p[2]) * 16)), qy = Math.max(p[1] * 16, Math.min(wy, (p[1] + p[3]) * 16)); if (Math.hypot(qx - wx, qy - wy) < reach) { ok = true; break; } }
  if (!ok) return;
  const horse = !!v.S.horse, val = horse ? v.stamina : v.fuel;
  if (val >= 0.999) { if (!v.fullSaid && !quiet) { v.fullSaid = 1; vehToast(horse ? "HORSES FED & WATERED" : "TANK FULL — " + S.name, "#69f0ae"); } return; }
  v.fullSaid = 0; v.refuel = 1;
  if (horse) v.stamina = Math.min(1, v.stamina + dt * 0.12); else v.fuel = Math.min(1, v.fuel + dt * 0.08);
  if (Math.random() < dt * 3) spawnPt(v.x, v.y - 8, 0, -14, 0.5, 2, horse ? 12 : 9, 5);
}

/* === 13. DRIVING INPUT, ENTER / EXIT ================================================================================= */
function vehAngDiff(a, b) { return Math.atan2(Math.sin(a - b), Math.cos(a - b)); }
// called from js/sim.js instead of walking while player.inVehicle === 3. Returns true when it took over.
function vehDriveInput(dt, mx, my, mag) {
  const v = VEH.me;
  if (!v || !CITY.on) return false;
  const c = v.ctl, vf = v.vf || 0;
  c.hb = (keys && (keys.Space || keys.KeyX)) || VEH.touchHB ? 1 : 0;
  if (v.dead) { c.thr = 0; c.st = 0; return true; }
  if ((opts && opts.vehSteer === "classic")) {
    const up = (keys.KeyW || keys.ArrowUp ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0), side = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0);
    c.thr = joy && joy.act ? -joy.dy : up; c.st = joy && joy.act ? joy.dx : side;
    return true;
  }
  // point-to-steer: push where you want to go; pull back to brake / reverse
  if (mag < 0.15) { c.thr = 0; c.st *= 0.6; return true; }
  const want = Math.atan2(my, mx), diff = vehAngDiff(want, v.ang), sp = Math.abs(vf);
  if (Math.abs(diff) > 2.35 && (vf < 40 || v.revMode)) {          // behind you: back up toward it
    v.revMode = true;
    const e = vehAngDiff(want + Math.PI, v.ang);
    c.thr = -Math.min(1, mag); c.st = Math.max(-1, Math.min(1, -e * 2.4));
  } else if (Math.abs(diff) > 2.0 && vf > 40) {                  // hard U-turn at speed: brake first
    v.revMode = false; c.thr = -1; c.st = Math.sign(diff);
  } else {
    v.revMode = false;
    c.thr = Math.min(1, mag) * (Math.abs(diff) > 1.2 && sp > 200 ? 0.35 : 1);
    c.st = Math.max(-1, Math.min(1, diff * 2.2));
  }
  return true;
}
function vehCanDrive(v) { return v && !v.burnt && !v.wreck && v.fire <= 0; }
function vehFindForPlayer() {
  if (!player) return null;
  const list = vehNearby(player.x, player.y, 70);
  for (const q of list) { if (q.d > 46) break; if (q.wreck || (q.v && !vehCanDrive(q.v))) continue; return q; }
  return null;
}
function vehEnter(q) {
  const v = vehMakeLive(q, "enter");
  if (!v || !vehCanDrive(v)) return false;
  const ds = v.seats.find(s => s.type === "d") || v.seats[0];
  if (ds.occ && ds.occ.t !== "P" && typeof convoySwapDriver === "function") convoySwapDriver(v, ds);
  ds.occ = { t: "P" };
  v.drv = "P"; v.awake = true; v.sleep = 0; VEH.me = v; VEH.lastMine = v; v.convoy = null; v.ai = null;
  player.inVehicle = 3; player.vehicleHp = v.hp; player.cityCar = { kind: v.kind, v: v.pv, ang: v.ang, L: v.L, D: v.D };
  player.x = v.x; player.y = v.y;
  const b = typeof cityBuildingAt === "function" ? cityBuildingAt(v.x, v.y) : null;
  if (b && typeof cityAccessGarageOpen === "function") cityAccessGarageOpen(b, v);
  const fuel = v.S.horse ? Math.round(v.stamina * 100) + "% STAMINA" : Math.round(v.fuel * 100) + "% " + vehFuelName(v);
  spawnSpeech(player.x, player.y - 34, vehName(v) + " · " + fuel, "#80deea", 1.8);
  if (typeof sfx === "function") { if (v.S.horse) sfx(500, 900, 0.12, "triangle", 0.08); else { sfx(90, 180, 0.35, "sawtooth", 0.1); setTimeout(() => sfx(140, 230, 0.25, "sawtooth", 0.07), 260); } }
  if (typeof noiseEmit === "function") noiseEmit(v.x, v.y, v.S.horse ? 60 : 82, "engine", 0);
  if (typeof convoyOnEnter === "function") convoyOnEnter(v);
  if (typeof updateHUD === "function") updateHUD();
  vehTipOnce("drive");
  return true;
}
function vehExit(forced) {
  const v = VEH.me;
  if (!v) { player.inVehicle = 0; return; }
  const c = Math.cos(v.ang), s = Math.sin(v.ang), spots = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  let out = null;
  for (const [sx, sf] of spots) {
    const ex = v.x + (-s * sx) * (v.L / 2 + 16) + c * sf * (v.D / 2 + 16), ey = v.y + (c * sx) * (v.L / 2 + 16) + s * sf * (v.D / 2 + 16);
    if (!cityCircleBlocked(ex, ey, 8, false)) { out = [ex, ey]; break; }
  }
  if (!out) out = cityFindWalkable(v.x - s * -(v.L / 2 + 16), v.y + c * -(v.L / 2 + 16), 260, false);
  for (const st of v.seats) if (st.occ && st.occ.t === "P") st.occ = null;
  v.drv = null; v.ctl.thr = 0; v.ctl.st = 0; v.ctl.hb = 1; VEH.me = null; v.revMode = false;
  player.inVehicle = 0; player.cityCar = null; player.x = out[0]; player.y = out[1]; player.vx = 0; player.vy = 0;
  if (typeof convoyOnExit === "function") convoyOnExit(v, forced);
  if (forced) { player.invulnT = Math.max(player.invulnT || 0, 0.6); spawnSpeech(player.x, player.y - 24, "BAILED OUT!", "#ff8a65", 1.2); }
  if (typeof updateHUD === "function") updateHUD();
}
function vehHorn() {
  if (!VEH.me || VEH.hornT > 0) return;
  VEH.hornT = 0.45;
  const v = VEH.me, horse = v.S.horse;
  if (typeof sfx === "function") { if (horse) { sfx(900, 600, 0.18, "triangle", 0.09); } else { sfx(415, 415, 0.32, "square", 0.08, 0); sfx(523, 523, 0.32, "square", 0.06, 0); } }
  if (typeof noiseEmit === "function") noiseEmit(v.x, v.y, horse ? 80 : 104, "horn", 0);
  if (typeof convoyMountUp === "function") convoyMountUp(v);
}
function vehTipOnce(k) {
  if (typeof meta === "undefined") return;
  meta.vehTips = meta.vehTips || {};
  if (meta.vehTips[k]) return;
  meta.vehTips[k] = 1; if (typeof saveMeta === "function") saveMeta();
  const steer = opts && opts.vehSteer === "classic" ? "<b>W/S</b> throttle · <b>A/D</b> steer" : "push where you want to go (pull back = reverse)";
  const msg = { drive: "🚗 " + steer + " · <b>Space</b> handbrake · <b>H</b> horn = squad mount up · <b>F</b> get out. Crashes crumple the body — drive carefully, parts fall off." }[k];
  if (msg && typeof cityTip === "function") cityTip(msg, 7);
}

/* === 14. RENDER ======================================================================================================= */
function vehDraw(g, v, t) {
  const spr = vehSprite(v), sag = vehWheelsLost(v) ? 0.6 : 0;
  // hover vehicles float: a soft shadow further down + repulsor glow (wheeled ones carry the baked prop shadow)
  if (v.S.hover) { g.save(); g.translate(v.x + 5, v.y + 7); g.rotate(v.ang + Math.PI / 2); g.fillStyle = "rgba(0,0,0,0.2)"; crRR(g, -v.L / 2, -v.D / 2, v.L, v.D, Math.min(v.L, v.D) * 0.3); g.fill(); g.restore(); }
  g.save(); g.translate(v.x, v.y); g.rotate(v.ang + Math.PI / 2);
  if (v.S.hover && !v.dead) { const bob = Math.sin(t * 4 + v.id) * 0.8; g.translate(0, bob); if (v.drv || vehNearPlayer(v, 500)) { const gl = (CITY.theme.fu && CITY.theme.fu.glow) || "#4fc3ff"; g.fillStyle = crA(gl, 0.16); g.beginPath(); g.ellipse(0, 0, v.L * 0.62, v.D * 0.55, 0, 0, 7); g.fill(); } }
  if (sag) g.rotate((Math.sin(t * 30) * 0.006) * (Math.hypot(v.vx, v.vy) > 30 ? 1 : 0));
  g.drawImage(spr, -spr.width / 2, -spr.height / 2);
  const x0 = -v.L / 2, y0 = -v.D / 2;
  // live lights: brake lamps, police bar, headlights after dark
  if (v.brakeLit && !v.dead) { g.fillStyle = "rgba(255,40,40,0.85)"; for (const p of v.parts) if (p.kind === "light" && p.rear && p.on) { g.fillRect(p.x, p.y, p.w, p.h); crGlow(g, p.x + p.w / 2, p.y + p.h / 2, 9, "#ff1744", 0.35); } }
  if (v.S.bar && v.drv && !v.dead) { const lb = vehPart(v, "lightbar"); if (lb && lb.on) { const ph = Math.floor(t * 6) & 1; crGlow(g, lb.x + lb.w * 0.25, lb.y + 2, 16, ph ? "#ff1744" : "#2979ff", 0.6); crGlow(g, lb.x + lb.w * 0.75, lb.y + 2, 16, ph ? "#2979ff" : "#ff1744", 0.6); } }
  if (v.drv && !v.dead && (CITY.theme.dark || 0) > 0.25 && !v.S.horse) {
    g.save(); g.globalCompositeOperation = "lighter";
    for (const p of v.parts) if (p.kind === "light" && !p.rear && p.on) { const gr = g.createLinearGradient(0, y0, 0, y0 - 120); gr.addColorStop(0, "rgba(255,250,220,0.22)"); gr.addColorStop(1, "rgba(255,250,220,0)"); g.fillStyle = gr; g.beginPath(); g.moveTo(p.x + p.w / 2 - 3, y0); g.lineTo(p.x + p.w / 2 - 26, y0 - 120); g.lineTo(p.x + p.w / 2 + 26, y0 - 120); g.lineTo(p.x + p.w / 2 + 3, y0); g.fill(); }
    g.restore();
  }
  if (v.refuel) { g.strokeStyle = "rgba(105,240,174," + (0.5 + 0.4 * Math.sin(t * 8)).toFixed(2) + ")"; g.lineWidth = 2; crRR(g, x0 - 4, y0 - 4, v.L + 8, v.D + 8, 10); g.stroke(); }
  if (typeof convoyDrawOccupants === "function") convoyDrawOccupants(g, v, t);
  g.restore();
}
function vehDrawDebris(g, d, t) {
  const fade = Math.min(1, (d.life - d.t) / 3);
  g.save(); g.globalAlpha = Math.max(0, fade); g.translate(d.x, d.y); g.rotate(d.a);
  if (d.horse) { if (typeof crHorse === "function") crHorse(g, 0, 0, 1, "#6d4c2f"); g.restore(); return; }
  g.fillStyle = "rgba(0,0,0,0.25)"; g.fillRect(-d.pw / 2 + 1.5, -d.ph / 2 + 2, d.pw, d.ph);
  if (d.kind === "wheel" || d.kind === "pod") { g.fillStyle = "#1b1b1d"; crRR(g, -d.ph / 2, -d.pw * 0.9, d.ph, d.pw * 1.8, 2); g.fill(); g.fillStyle = "#8a8f96"; g.fillRect(-1, -d.pw * 0.4, 2, d.pw * 0.8); }
  else { g.fillStyle = d.col; g.fillRect(-d.pw / 2, -d.ph / 2, d.pw, d.ph); g.fillStyle = "rgba(255,255,255,0.18)"; g.fillRect(-d.pw / 2, -d.ph / 2, d.pw, Math.min(1.5, d.ph / 3)); if (d.kind === "door") { g.fillStyle = "rgba(0,0,0,0.35)"; g.fillRect(-d.pw / 2 + 1, -d.ph * 0.1, d.pw - 2, 1); } }
  g.restore();
}
// live layer (under roofs + fog): skid marks, debris, every live vehicle except yours
function vehRenderLayer(g, left, top, vw, vh) {
  if (!CITY.on) return;
  const t = runTime, x1 = left + vw, y1 = top + vh;
  if (VEH.skids.length) {
    g.save();
    const T0 = g.getTransform();
    g.fillStyle = "#121212";
    for (const s of VEH.skids) {
      if (s[0] < left - 20 || s[0] > x1 + 20 || s[1] < top - 20 || s[1] > y1 + 20) continue;
      const age = t - s[3]; if (age > 45 || age < 0) continue;
      g.globalAlpha = Math.min(0.5, s[4] * 0.55) * (1 - age / 45);
      g.setTransform(T0); g.translate(s[0], s[1]); g.rotate(s[2]); g.fillRect(-4, -1.6, 8, 3.2);
    }
    g.setTransform(T0);
    g.restore();
  }
  for (const d of VEH.debris) if (d.x > left - 40 && d.x < x1 + 40 && d.y > top - 40 && d.y < y1 + 40) vehDrawDebris(g, d, t);
  for (const v of VEH.list) {
    if (v === VEH.me || v.far) continue;
    const r = Math.max(v.L, v.D) * 0.75 + 30;
    if (v.x < left - r || v.x > x1 + r || v.y < top - r || v.y > y1 + r) continue;
    vehDraw(g, v, t);
  }
}
// your own vehicle: drawn after the fog (never greyed out), occupants and gunners on top
function vehRenderMine(g) {
  if (!CITY.on || !VEH.me) return;
  vehDraw(g, VEH.me, runTime);
}

/* === 15. HUD: speed, fuel, damage silhouette ========================================================================== */
function vehHudEl() {
  let el = document.getElementById("vehHud");
  if (el) return el;
  el = document.createElement("div"); el.id = "vehHud";
  el.innerHTML = '<canvas id="vehHudCv" width="64" height="92"></canvas><div class="vh-body"><div class="vh-name"></div><div class="vh-spd"><b>0</b><span>mph</span><i class="vh-gear">D</i></div>' +
    '<div class="vh-fuel"><span class="vh-fl">FUEL</span><div class="vh-bar"><i></i></div><span class="vh-fp">0%</span></div><div class="vh-st"></div><div class="vh-nav"></div></div>' +
    '<div class="vh-btns"><button class="btn vh-horn" title="Horn: squad mounts up (H)">📯</button><button class="btn vh-hb" title="Hold: handbrake (Space)">HB</button></div>';
  document.body.appendChild(el);
  el.querySelector(".vh-body").addEventListener("click", () => { VEH.units = VEH.units === "mph" ? "kmh" : "mph"; if (opts) { opts.vehUnits = VEH.units; if (typeof saveOpts === "function") saveOpts(); } });
  el.querySelector(".vh-horn").addEventListener("pointerdown", e => { e.stopPropagation(); vehHorn(); });
  const hb = el.querySelector(".vh-hb");
  hb.addEventListener("pointerdown", e => { e.stopPropagation(); VEH.touchHB = true; hb.classList.add("gold"); });
  for (const ev of ["pointerup", "pointerleave", "pointercancel"]) hb.addEventListener(ev, () => { VEH.touchHB = false; hb.classList.remove("gold"); });
  return el;
}
function vehHudFrame() {
  const v = VEH.me, el = vehHudEl();
  const on = !!(v && runActive && CITY.on && !(typeof MAPV !== "undefined" && MAPV.open));
  if (!on) { if (el.style.display !== "none") el.style.display = "none"; return; }
  el.style.display = "flex";
  const now = performance.now();
  if (now - (VEH.hudT || 0) < 90) return;
  VEH.hudT = now;
  const units = (opts && opts.vehUnits) || VEH.units, ms = Math.hypot(v.vx, v.vy) / VPX, spd = units === "kmh" ? ms * 3.6 : ms * 2.237;
  const q = s => el.querySelector(s);
  const nv = typeof CONVOY !== "undefined" ? CONVOY.vehicles.length : 0;
  q(".vh-name").textContent = vehName(v) + (nv ? "  ·  CONVOY LEAD (" + (nv + 1) + ")" : "");
  q(".vh-spd b").textContent = Math.round(spd); q(".vh-spd span").textContent = units === "kmh" ? "km/h" : "mph";
  q(".vh-gear").textContent = v.dead ? "×" : (v.vf || 0) < -10 ? "R" : Math.abs(v.vf || 0) < 10 && Math.abs(v.ctl.thr) < 0.05 ? "N" : "D";
  const horse = !!v.S.horse, val = horse ? v.stamina : v.fuel;
  q(".vh-fl").textContent = horse ? (v.S.horse > 1 ? "HORSES" : "HORSE") : vehFuelName(v);
  const bar = q(".vh-bar i"); bar.style.width = Math.round(val * 100) + "%"; bar.style.background = val < 0.15 ? "#ff5252" : val < 0.3 ? "#ffab40" : "#69f0ae";
  q(".vh-fp").textContent = Math.round(val * 100) + "%";
  const hpF = v.hp / v.hpMax, eng = v.fire > 0 ? "🔥 ON FIRE" : v.dead ? "DISABLED" : v.eng < 0.15 || hpF < 0.15 ? "ENGINE FAILING" : v.eng < 0.4 || hpF < 0.35 ? "SMOKING" : hpF < 0.7 ? "DAMAGED" : "OK";
  const seats = v.seats.length, occ = vehOcc(v);
  q(".vh-st").innerHTML = '<span style="color:' + (eng === "OK" ? "#69f0ae" : eng === "DAMAGED" ? "#ffd166" : "#ff5252") + '">' + (horse ? (eng === "OK" ? "HEALTHY" : eng) : eng) + "</span> · " + Math.round(hpF * 100) + "% · 👥 " + occ + "/" + seats;
  let nav = "";
  if (v.refuel) nav = "⛽ " + (horse ? "FEEDING THE HORSES" : "REFUELING") + "…";
  else if (val < 0.3 && VSTA.nearest) { const S = VSTA.nearest, a = Math.atan2(S.y * 16 - CITY.ory - v.y, S.x * 16 - CITY.orx - v.x), dirs = ["E", "SE", "S", "SW", "W", "NW", "N", "NE"]; nav = "⛽ " + S.name + " " + (S.dist > 1000 ? (S.dist / 1000).toFixed(1) + " km" : Math.round(S.dist) + " m") + " " + dirs[((Math.round(a / (Math.PI / 4)) % 8) + 8) % 8]; }
  else if (val < 0.3) nav = "⛽ LOW — SEARCHING FOR A STATION…";
  q(".vh-nav").textContent = nav; q(".vh-nav").style.display = nav ? "block" : "none";
  el.classList.toggle("warn", val < 0.15 || hpF < 0.25 || v.fire > 0);
  vehHudSilhouette(v, q("#vehHudCv"));
}
// top-down damage diagram: body coloured by local crush, missing parts marked
function vehHudSilhouette(v, cv) {
  const g = cv.getContext("2d"), W = cv.width, H = cv.height;
  g.clearRect(0, 0, W, H);
  const sc = Math.min((W - 14) / v.L, (H - 10) / v.D);
  g.save(); g.translate(W / 2, H / 2); g.scale(sc, sc);
  const O = vehOutline(v, 0);
  g.beginPath(); g.moveTo(O[0][0], O[0][1]); for (let i = 1; i < 24; i++) g.lineTo(O[i][0], O[i][1]); g.closePath();
  const hpF = Math.max(0, v.hp / v.hpMax);
  g.fillStyle = hpF > 0.66 ? "rgba(105,240,174,0.28)" : hpF > 0.33 ? "rgba(255,209,102,0.3)" : "rgba(255,82,82,0.32)"; g.fill();
  g.lineWidth = 1.5 / sc; g.strokeStyle = "rgba(220,240,255,0.75)"; g.stroke();
  for (let i = 0; i < 24; i++) { const d = v.def[i]; if (d < 2.5) continue; const k = Math.min(1, d / 12); g.fillStyle = "rgba(255," + Math.round(200 - 160 * k) + ",60," + (0.5 + 0.4 * k).toFixed(2) + ")"; g.beginPath(); g.arc(O[i][0], O[i][1], (2.5 + 3 * k) / sc * 1.6, 0, 7); g.fill(); }
  for (const p of v.parts) {
    if (p.kind === "light" || p.kind === "mirror" || p.kind === "exhaust") continue;
    if (p.on && !(p.kind === "glass" && p.hp < p.max)) continue;
    g.strokeStyle = p.kind === "glass" ? "rgba(128,222,234,0.9)" : "#ff5252"; g.lineWidth = 1.6 / sc;
    if (p.kind === "wheel" || p.kind === "pod" || p.kind === "track" || p.kind === "horse") { const cx = p.kind === "horse" ? p.hx : p.x + p.w / 2, cy = p.kind === "horse" ? p.hy : p.y + p.h / 2, r = 4 / sc; g.beginPath(); g.moveTo(cx - r, cy - r); g.lineTo(cx + r, cy + r); g.moveTo(cx + r, cy - r); g.lineTo(cx - r, cy + r); g.stroke(); }
    else { g.setLineDash([3 / sc, 2 / sc]); g.strokeRect(p.x, p.y, p.w, p.h); g.setLineDash([]); }
  }
  // seats: who rides where
  for (const s of v.seats) { g.fillStyle = s.occ ? (s.occ.t === "P" ? "#ffd166" : "#80deea") : "rgba(255,255,255,0.15)"; g.beginPath(); g.arc(s.u * v.L, -s.w * v.D, 3.2 / sc, 0, 7); g.fill(); }
  // nose marker
  g.fillStyle = "rgba(220,240,255,0.8)"; g.beginPath(); g.moveTo(0, -v.D / 2 - 6 / sc); g.lineTo(-4 / sc, -v.D / 2 - 1 / sc); g.lineTo(4 / sc, -v.D / 2 - 1 / sc); g.fill();
  g.restore();
}
// simple tip line (shares #cityTip with the city tips)
if (typeof cityTip !== "function") {
  window.cityTip = function (html, sec) {
    let el = document.getElementById("cityTip");
    if (!el) { el = document.createElement("div"); el.id = "cityTip"; document.body.appendChild(el); }
    el.innerHTML = html; el.style.opacity = 1;
    clearTimeout(window._cityTipT); window._cityTipT = setTimeout(() => { el.style.opacity = 0; }, (sec || 5) * 1000);
  };
}

/* === 16. CAMERA: look-ahead + gentle zoom-out at speed =============================================================== */
function vehCameraFrame(rawDt) {
  const v = VEH.me, k = Math.min(1, rawDt * 2.5);
  let tz = 1, tx = 0, ty = 0;
  if (v && CITY.on && !VEH.noCam) {
    const sp = Math.hypot(v.vx, v.vy), f = Math.min(1, sp / (22 * VPX));
    tz = 1 - 0.16 * f; tx = Math.max(-150, Math.min(150, v.vx * 0.22)); ty = Math.max(-110, Math.min(110, v.vy * 0.22));
  }
  VEH.camZoom += (tz - VEH.camZoom) * k; VEH.camFx = (VEH.camFx || 0) + (tx - (VEH.camFx || 0)) * k; VEH.camFy = (VEH.camFy || 0) + (ty - (VEH.camFy || 0)) * k;
}

/* === 17. ENGINE HOOKS ================================================================================================= */
// live vehicles block people (walk around them) - wraps the v14 tile collision
function vehCircleHit(x, y, r) {
  for (const v of VEH.list) {
    if (v.far || v === VEH.me) continue;
    const dx = x - v.x, dy = y - v.y, R = (v.D > v.L ? v.D : v.L) * 0.5 + r;
    if (dx > R || dx < -R || dy > R || dy < -R) continue;
    const c = Math.cos(v.ang), s = Math.sin(v.ang), fw = dx * c + dy * s, rt = -dx * s + dy * c;
    if (Math.abs(rt) < v.L / 2 + r - 1 && Math.abs(fw) < v.D / 2 + r - 1) return v;
  }
  return null;
}
function vehPushOut(q, r) {
  for (let pass = 0; pass < 2; pass++) {
    const v = vehCircleHit(q[0], q[1], r);
    if (!v) return q;
    const c = Math.cos(v.ang), s = Math.sin(v.ang), dx = q[0] - v.x, dy = q[1] - v.y, fw = dx * c + dy * s, rt = -dx * s + dy * c;
    const ox = v.L / 2 + r - Math.abs(rt), oy = v.D / 2 + r - Math.abs(fw);
    if (ox < oy) { const sg = rt >= 0 ? 1 : -1; q[0] += -s * sg * ox; q[1] += c * sg * ox; } else { const sg = fw >= 0 ? 1 : -1; q[0] += c * sg * oy; q[1] += s * sg * oy; }
  }
  return q;
}
(function vehPatchEngine() {
  if (typeof cityCircleBlocked === "function") {
    const _ccb = cityCircleBlocked;
    window.cityCircleBlocked = function (x, y, r, ignoreLow) { if (_ccb(x, y, r, ignoreLow)) return true; return VEH.list.length > 0 && !!vehCircleHit(x, y, r); };
  }
  if (typeof cityResolve === "function") {
    const _cr = cityResolve;
    window.cityResolve = function (x, y, r, ignoreLow) { const q = _cr(x, y, r, ignoreLow); return VEH.list.length ? vehPushOut(q, r) : q; };
  }
  // bullets / bolts hit live vehicles; parked ones wake up when shot
  if (typeof cityProjWall === "function") {
    const _cpw = cityProjWall;
    window.cityProjWall = function (i, dt) {
      const st = pStyle[i];
      if (st === 1 || st === 6 || st === 8) return _cpw(i, dt);
      const x1 = pX[i], y1 = pY[i], x0 = x1 - pVX[i] * dt, y0 = y1 - pVY[i] * dt;
      const h = cityRay(x0, y0, x1, y1, F_SHOT, 48);
      if (h.hit && h.k === K_CAR) vehPromoteAtTile(h.tx, h.ty, "shot");
      if (VEH.list.length && vehProjHit(i, x0, y0, x1, y1, h.hit ? h.t : 1)) return true;
      return _cpw(i, dt);
    };
  }
  if (typeof triggerRocketDetonation === "function") {
    const _trd = triggerRocketDetonation;
    window._vehTRD = _trd;
    window.triggerRocketDetonation = function (x, y, dmg, rad) { _trd(x, y, dmg, rad); if (CITY.on && !VEH.inBlast) { VEH.inBlast = true; try { vehBlast(x, y, rad * 1.3, Math.min(40, 6 + dmg * 0.12), null); } finally { VEH.inBlast = false; } } };
  }
  // [F] prompt names the vehicle and its fuel
  const _fit = window.findInteractTarget;
  if (typeof _fit === "function") window.findInteractTarget = function () {
    const t = _fit();
    if (CITY.on && player && t && t.kind === "cityCar" && t.car && t.car.q) {
      const q = t.car.q, v = q.v;
      let name = "VEHICLE", fuel = "";
      if (v) { name = vehName(v); fuel = v.S.horse ? "" : " · " + Math.round(v.fuel * 100) + "% " + vehFuelName(v); }
      else { const p = q.p, f = q.b ? (q.b.int || cityInterior(q.b)).furn[q.fi] : null, k = p ? vehKindOf(p.t, p.v | 0, p.t === "car", 0) : vehKindOf(f.t, f.v | 0, f.t === "car", 0); name = (typeof CITY_CAR_NAME !== "undefined" && CITY_CAR_NAME[k]) || (VK[k] && VK[k].n) || "VEHICLE"; }
      const ride = (v ? v.S.horse : name === "WAGON" || name === "CART" || name === "STAGECOACH") ? "RIDE " : "DRIVE ";
      t.label = "[F] " + ride + name + fuel + (v && v.convoy ? " (TAKE THE WHEEL)" : "");
    }
    return t;
  };
})();
// segment vs live vehicle OBBs (slab test in the vehicle frame); the shooter's own vehicle is ignored
function vehProjHit(i, x0, y0, x1, y1, tWall) {
  let best = null, bt = tWall;
  for (const v of VEH.list) {
    if (v.far) continue;
    const R = Math.max(v.L, v.D) * 0.5 + 4;
    if (Math.min(x0, x1) > v.x + R || Math.max(x0, x1) < v.x - R || Math.min(y0, y1) > v.y + R || Math.max(y0, y1) < v.y - R) continue;
    const [ax, ay] = vehToLocal(v, x0, y0), [bx, by] = vehToLocal(v, x1, y1), hw = v.L / 2, hd = v.D / 2;
    if (Math.abs(ax) < hw && Math.abs(ay) < hd) continue;                 // fired from inside (the vehicle's own crew)
    let t0 = 0, t1 = 1;
    const dx = bx - ax, dy = by - ay;
    const slab = (p, d, lo, hi) => { if (Math.abs(d) < 1e-9) return p >= lo && p <= hi; let ta = (lo - p) / d, tb = (hi - p) / d; if (ta > tb) { const q = ta; ta = tb; tb = q; } t0 = Math.max(t0, ta); t1 = Math.min(t1, tb); return t0 <= t1; };
    if (!slab(ax, dx, -hw, hw) || !slab(ay, dy, -hd, hd)) continue;
    if (t0 < bt) { bt = t0; best = { v, lx: ax + dx * t0, ly: ay + dy * t0 }; }
  }
  if (!best) return false;
  const v = best.v, byHero = !pEnemy[i], [hx, hy] = vehToWorld(v, best.lx, best.ly);
  if (pStyle[i] === 2) { pAct[i] = 0; triggerRocketDetonation(hx, hy, pDmg[i], pRad[i] * 4.8); return true; }
  // your convoy ignores your own bullets (friendly vehicles), enemies' bullets hurt them
  if (byHero && (v.convoy || v === VEH.me)) return false;
  const wid = pWpnId[i], prof = typeof stHeroProfile === "function" ? stHeroProfile(wid) : [160, "g", 1];
  const energy = byHero ? prof[1] !== "g" : !(typeof enemyIsKinetic === "function" ? enemyIsKinetic(wid) : true);
  const dmg = pDmg[i] * (energy ? 1.4 : 1);
  const pass = vehDamage(v, best.lx, best.ly, dmg, "bullet", 0, 0, byHero ? "player" : null);
  for (let k = 0; k < 3; k++) spawnPt(hx, hy, (Math.random() - 0.5) * 110, (Math.random() - 0.5) * 110, 0.22, 1.5, energy ? 4 : 3, 4);
  if (Math.hypot(hx - player.x, hy - player.y) < 600 && typeof sfx === "function" && Math.random() < 0.6) sfx(energy ? 900 : 1500, energy ? 300 : 700, 0.03, "square", 0.04);
  // what gets through reaches whoever sits there
  if (pass > 0 && !byHero) {
    const st = vehNearestOcc(v, best.lx, best.ly, 34);
    if (st && Math.random() < pass) { if (typeof convoyHitOccupant === "function") convoyHitOccupant(v, st, pDmg[i] * 0.85); }
  }
  // piercing rounds keep going (pierce count in pPrc), the rest stop in the body
  if (byHero && pPrc && pPrc[i] > 0) { pPrc[i]--; pDmg[i] *= 0.7; return false; }
  pAct[i] = 0;
  return true;
}
// the legacy circle car code in js/cityplay.js is replaced by the rigid bodies above
function cityFindCar() { const q = vehFindForPlayer(); return q ? { q, x: q.v ? q.v.x : q.x, y: q.v ? q.v.y : q.y, p: q.p || null } : null; }
function cityEnterCar(t) { if (t && t.q) vehEnter(t.q); }
function cityExitCar() { vehExit(false); }
function cityCarStep(dt) { vehStepAll(dt); }
function cityRenderCar(g) { vehRenderMine(g); }
window.addEventListener("keydown", e => {
  if (!runActive || runPaused || !CITY.on || e.repeat) return;
  if (e.code === "KeyH" && VEH.me) vehHorn();
  if (e.code === "Space" && VEH.me) e.preventDefault();
});
/* === 18. FEEL: engine sound you can hear, engine noise the enemies can hear, blades that cut metal ================== */
const VEH_SABER = new Set([0, 3, 32, 33, 55, 76, 77, 78, 79]);   // lightsabers + energy swords cut through panels
function vehEngineAudio(dt) {
  const v = VEH.me, on = !!(v && !v.dead && runActive && !runPaused && CITY.on && !v.S.horse && (v.fuel > 0));
  const A = VEH.audio;
  if (!on) { if (A) { try { A.g.gain.setTargetAtTime(0, A.ac.currentTime, 0.08); } catch (e) { } if (!v) { VEH.audioOff = (VEH.audioOff || 0) + dt; if (VEH.audioOff > 0.6) { try { A.o.stop(); A.o2.stop(); } catch (e) { } VEH.audio = null; } } } return; }
  VEH.audioOff = 0;
  let ac = null; try { ac = typeof ensureAudio === "function" ? ensureAudio() : null; } catch (e) { ac = null; }
  if (!ac) return;
  if (!A) {
    try {
      const o = ac.createOscillator(), o2 = ac.createOscillator(), f = ac.createBiquadFilter(), g = ac.createGain();
      o.type = v.S.hover ? "triangle" : "sawtooth"; o2.type = "square"; f.type = "lowpass"; f.frequency.value = 420; g.gain.value = 0;
      o.connect(f); o2.connect(f); f.connect(g); g.connect(ac.destination); o.start(); o2.start();
      VEH.audio = { ac, o, o2, f, g };
    } catch (e) { return; }
  }
  const B = VEH.audio, sp = Math.hypot(v.vx, v.vy) / (v.S.top * VPX), thr = Math.abs(v.ctl.thr);
  v.rpm += ((0.18 + sp * 0.75 + thr * 0.25) - v.rpm) * Math.min(1, dt * 6);
  const base = v.S.hover ? 140 : v.m > 5000 ? 34 : 48, f0 = base * (1 + v.rpm * 2.2), vol = (typeof opts !== "undefined" ? opts.vol : 0.45) * (v.S.hover ? 0.05 : 0.07) * (0.5 + 0.5 * v.rpm) * (v.eng < 0.3 ? 0.7 : 1);
  try { const t = B.ac.currentTime; B.o.frequency.setTargetAtTime(f0, t, 0.05); B.o2.frequency.setTargetAtTime(f0 * 0.5 * (v.eng < 0.3 ? 0.97 + Math.random() * 0.06 : 1), t, 0.05); B.f.frequency.setTargetAtTime(260 + v.rpm * 900, t, 0.08); B.g.gain.setTargetAtTime(vol, t, 0.08); } catch (e) { }
}
function vehNoiseStep(dt) {
  VEH.noiseT = (VEH.noiseT || 0) - dt;
  if (VEH.noiseT > 0 || typeof noiseEmit !== "function") return;
  VEH.noiseT = 0.45;
  const list = VEH.me ? [VEH.me].concat(typeof CONVOY !== "undefined" ? CONVOY.vehicles : []) : (typeof CONVOY !== "undefined" ? CONVOY.vehicles : []);
  for (const v of list) {
    if (!v || v.dead || (v.fuel <= 0 && !v.S.horse)) continue;
    const sp = Math.hypot(v.vx, v.vy) / VPX, base = v.S.horse ? 54 : v.S.hover ? 64 : v.m > 5000 ? 82 : 72;
    noiseEmit(v.x, v.y, base + Math.min(14, sp * 0.7) + Math.abs(v.ctl.thr) * 4, v.S.horse ? "hooves" : "engine", 0);
  }
}
function vehBladeStep() {
  if (!player || player.inVehicle || !(player.swordSwingTimer > 0)) { VEH.swingSeen = 0; return; }
  if (player.swordSwingTimer <= (VEH.swingSeen || 0)) { VEH.swingSeen = player.swordSwingTimer; return; }   // same swing
  VEH.swingSeen = player.swordSwingTimer;
  // the blade sweeps ~±90° around the aim and reaches ~1.1 m past the body: hit the nearest panel inside that arc
  const reach = 42, aim = player.aim || 0;
  let q = null, hx = 0, hy = 0;
  for (const c of vehNearby(player.x, player.y, 90)) {
    if (c.wreck || c.d > reach) continue;
    const v0 = c.v, P = v0 ? v0 : vehPropPose(c.p || { x: 0, y: 0, w: 1, h: 1 }); if (!v0 && !c.p) continue;
    const cs = Math.cos(P.ang), sn = Math.sin(P.ang), dx = player.x - P.x, dy = player.y - P.y, fw = dx * cs + dy * sn, rt = -dx * sn + dy * cs;
    const cf = Math.max(-P.D / 2, Math.min(P.D / 2, fw)), cr = Math.max(-P.L / 2, Math.min(P.L / 2, rt)), nx = P.x + cs * cf - sn * cr, ny = P.y + sn * cf + cs * cr;
    if (Math.abs(vehAngDiff(Math.atan2(ny - player.y, nx - player.x), aim)) > 1.6) continue;
    q = c; hx = nx; hy = ny; break;
  }
  if (!q) return;
  const v = vehMakeLive(q, "blade"); if (!v) return;
  const ax = Math.cos(aim), ay = Math.sin(aim), saber = VEH_SABER.has(player.cid), [lx, ly] = vehToLocal(v, hx, hy);
  vehDamage(v, Math.max(-v.L / 2, Math.min(v.L / 2, lx)), Math.max(-v.D / 2, Math.min(v.D / 2, ly)), saber ? 150 : 50, "melee", ax, ay, "player");
  if (saber) { for (let k = 0; k < 6; k++) spawnPt(hx, hy, (Math.random() - 0.5) * 140, (Math.random() - 0.5) * 140, 0.35, 1.8, 3, 4); if (v.holes.length < 28) { v.holes.push([lx, ly]); v.sprDirty = true; } }
  else spawnPt(hx, hy, (Math.random() - 0.5) * 80, (Math.random() - 0.5) * 80, 0.2, 1.4, 1, 4);
  if (typeof sfx === "function") sfx(saber ? 900 : 1400, saber ? 300 : 900, 0.05, "square", 0.05);
}
V10.onStep.push((dt) => { if (CITY.on && player) { vehNoiseStep(dt); vehBladeStep(); } });
// the Force (and every other kinetic push) shoves vehicles in the cone; a strong push crumples the near side
(function vehPatchForce() {
  const _fp = window.executeForceKineticPush;
  if (typeof _fp !== "function") return;
  window.executeForceKineticPush = function (ox, oy, aimAng, pushLvl, baseDmg) {
    const r = _fp(ox, oy, aimAng, pushLvl, baseDmg);
    if (!CITY.on) return r;
    const lvl = Math.max(1, Math.min(10, pushLvl || 1)), half = lvl >= 10 ? Math.PI : ((0.65 + (lvl - 1) * 0.24) * 0.5), R = (125 + lvl * 11) * (player ? player.area || 1 : 1);
    for (const q of vehNearby(ox, oy, R)) {
      const x = q.v ? q.v.x : q.x, y = q.v ? q.v.y : q.y, a = Math.atan2(y - oy, x - ox);
      if (Math.abs(vehAngDiff(a, aimAng)) > half + 0.25 || q.d > R) continue;
      const v = vehMakeLive(q, "force"); if (!v || v === VEH.me) continue;
      const k = (1 - Math.min(1, q.d / R)) * (220 + lvl * 40) * Math.min(1.8, 1400 / v.m);
      v.vx += Math.cos(a) * k; v.vy += Math.sin(a) * k; v.w += (Math.random() - 0.5) * 2 * Math.min(1.5, 1400 / v.m); v.awake = true; v.spinT = 0.4;
      const [lx, ly] = vehToLocal(v, ox + Math.cos(a) * (q.d + 2), oy + Math.sin(a) * (q.d + 2));
      if (lvl >= 4) vehDamage(v, Math.max(-v.L / 2, Math.min(v.L / 2, lx)), Math.max(-v.D / 2, Math.min(v.D / 2, ly)), 120 + lvl * 40, "crash", Math.cos(a), Math.sin(a), "player");
    }
    return r;
  };
})();
V10.onRunStart.push(() => { vehReset(); VSTA.cells.clear(); VSTA.list.length = 0; VSTA.nearest = null; if (opts) { VEH.units = opts.vehUnits || "mph"; } });
V10.onRunReset.push(() => { vehReset(); const el = document.getElementById("vehHud"); if (el) el.style.display = "none"; });
V10.onFrame.push((rawDt) => { vehHudFrame(); vehCameraFrame(rawDt || 0.016); vehEngineAudio(rawDt || 0.016); });
// EOF:js/vehicles.js
