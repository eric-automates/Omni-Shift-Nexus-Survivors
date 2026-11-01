/* =========================================================================
   OMNI-SHIFT v14.2 — WORLD PROFILES · SITES & LANDMARKS (js/regionsites.js)
   Builders for the homesteads, camps and film landmarks of every homeworld.
   Each builder gets the block (one 1 km cell), the site record (centre in
   metres, radius, gate direction towards its access road) and its own RNG,
   and composes buildings (round or square), ring walls, polygon rocks and
   region props (drawn by js/regionart.js). Everything stays deterministic.
   ========================================================================= */
"use strict";

/* --- helpers ---------------------------------------------------------------------- */
function rgCard(a) { const c = Math.cos(a), s = Math.sin(a); return Math.abs(c) > Math.abs(s) ? (c > 0 ? "E" : "W") : (s > 0 ? "S" : "N"); }
const RG_DIR = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0] }, RG_OPP = { N: "S", S: "N", E: "W", W: "E" }, RG_ANG = { E: 0, S: Math.PI / 2, W: Math.PI, N: -Math.PI / 2 };
function rgRing(B, cx, cy, r, th, gaps, kind, extra) {
  if (!B.rings) B.rings = [];
  const R = Object.assign({ cx, cy, r, th, gaps: gaps || [], kind: kind || "wall" }, extra || {});
  B.rings.push(R);
  return R;
}
// round building centred at (cx, cy) metres; door on side `front`
function rgDome(B, cx, cy, D, front, extra) {
  const ns = front === "N" || front === "S";
  const w = ns ? D : D * ((extra && extra.ell) || 1), h = ns ? D * ((extra && extra.ell) || 1) : D;
  return rgBld(B, "dome", cx - w / 2, cy - h / 2, w, h, front, Object.assign({ round: 1, roof: "dome", mat: "masonry" }, extra || {}));
}
function rgBox(B, type, cx, cy, along, depth, front, extra) {
  const ns = front === "N" || front === "S", w = ns ? along : depth, h = ns ? depth : along;
  return rgBld(B, type, cx - w / 2, cy - h / 2, w, h, front, Object.assign({ mat: (RG.P && RG.P.bld && RG.P.bld.mat) || "masonry", roof: (RG.P && RG.P.bld && RG.P.bld.roof) || "flat" }, extra || {}));
}
function rgPoly(B, t, ptsM, es, extra) {
  const pts = ptsM.map(p => [p[0] * 2, p[1] * 2]), xs = pts.map(p => p[0]), ys = pts.map(p => p[1]), x0 = Math.min(...xs), y0 = Math.min(...ys);
  return addProp(B, t, x0, y0, Math.max(...xs) - x0, Math.max(...ys) - y0, 0, Object.assign({ rg: 1, pg: pts, es }, extra || {}));
}
function rgRectPoly(cx, cy, L, W, ang) { const c = Math.cos(ang), s = Math.sin(ang), hx = L / 2, hy = W / 2; return [[-hx, -hy], [hx, -hy], [hx, hy], [-hx, hy]].map(([x, y]) => [cx + x * c - y * s, cy + x * s + y * c]); }
function rgDiscPoly(cx, cy, r, n, ry) { const P = []; for (let i = 0; i < (n || 12); i++) { const a = i / (n || 12) * Math.PI * 2; P.push([cx + Math.cos(a) * r, cy + Math.sin(a) * (ry || r)]); } return P; }
// a parked ship / big vehicle: drawn by regionart, collision = its hull outline
const RG_HULL = {
  freighter: [17, 13, "disc"], skyhopper: [6.5, 5.5, "rect"], podracer: [9, 4, "rect"], sandcrawler: [30, 15, "rect"], escapepod: [3.2, 3.2, "disc"],
  transport: [22, 11, "rect"], firefly: [24, 14, "rect"], harvester: [36, 18, "rect"], carryall: [26, 14, "rect"], thopter: [11, 9, "rect"], glider: [9, 7, "rect"],
  dropship: [18, 11, "rect"], apc: [10, 5, "rect"], crawler: [16, 9, "rect"], derelict: [120, 60, "derelict"], osprey: [16, 14, "rect"], plane: [34, 30, "plane"], shuttle: [16, 9, "rect"]
};
function rgShip(B, kind, cx, cy, ang, extra) {
  const H = RG_HULL[kind] || [10, 6, "rect"];
  let poly;
  if (H[2] === "disc") poly = rgDiscPoly(cx, cy, H[0] / 2, 12, H[1] / 2);
  else if (H[2] === "derelict") { poly = []; for (let i = 0; i <= 14; i++) { const a = Math.PI * (0.15 + 0.7 * i / 14); poly.push([cx + Math.cos(a + ang) * H[0] * 0.5, cy + Math.sin(a + ang) * H[0] * 0.5]); } for (let i = 14; i >= 0; i--) { const a = Math.PI * (0.15 + 0.7 * i / 14); poly.push([cx + Math.cos(a + ang) * H[0] * 0.28, cy + Math.sin(a + ang) * H[0] * 0.28]); } }
  else if (H[2] === "plane") { const c = Math.cos(ang), s = Math.sin(ang), P0 = [[-17, -1.8], [17, -1.8], [17, 1.8], [-17, 1.8]], P1 = [[-3, -15], [3, -15], [3, 15], [-3, 15]]; poly = P0.map(([x, y]) => [cx + x * c - y * s, cy + x * s + y * c]); return [rgPoly(B, "rgship", poly, FS_COVER, Object.assign({ kind, ang, cxm: cx, cym: cy }, extra || {})), rgPoly(B, "rgshipwing", P1.map(([x, y]) => [cx + x * c - y * s, cy + x * s + y * c]), FS_COVER, { kind, ang })][0]; }
  else poly = rgRectPoly(cx, cy, H[0], H[1], ang);
  return rgPoly(B, "rgship", poly, kind === "escapepod" ? FS_COVER : FS_TALL, Object.assign({ kind, ang, cxm: cx, cym: cy }, extra || {}));
}
function rgP(B, t, cx, cy, w, h, s, extra) { return rgProp(B, t, cx - w / 2, cy - h / 2, w, h, s, extra); }
function rgScatter(B, r, cx, cy, r0, r1, n, fn, clear) {
  let k = 0, tries = 0;
  while (k < n && tries++ < n * 12) {
    const a = r() * Math.PI * 2, d = cRange(r, r0, r1), x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d, c = clear || 1.5;
    if (!rgOccDiscFree(x, y, c)) continue;
    rgOccDisc(x, y, c * 0.8, 5); fn(x, y, a, k); k++;
  }
}
const RG_SURNAMES = ["Lars", "Darklighter", "Fixer", "Camie", "Deak", "Windy", "Owen", "Beru", "Whitesun", "Naberrie", "Skywalker", "Antilles", "Sunrider", "Tosche", "Bezzard", "Dhur", "Trehalt", "Mosep", "Ebon", "Kabe"];
function rgNameFrom(list, s) { return list[s.seed % list.length]; }

/* --- radii & names ------------------------------------------------------------------- */
const RG_SITE_RAD = {
  moisture: 115, tusken: 85, sandcrawler: 70, krayt: 60, sarlacc: 55, jabba: 190, benhut: 50, tosche: 70, escapepod: 45, podarena: 230,
  pyramid: 260, mine: 140, caravan: 70, obelisks: 70, glider: 50, oasis: 140,
  ranch: 130, estate: 170, wreck: 60, outlaw: 90,
  sietch: 120, harvester: 90, windtrap: 70, wormsign: 180, testing: 70, thopterpad: 90,
  processor: 260, derelict: 150, dropship: 60, relay: 60, hive: 120, crawler: 50,
  kamehouse: 220, gokuhouse: 80, tournament: 160, lake: 300, ribbon: 160, farmhouse: 110, crater: 120,
  facility: 400, lambda: 140, radar: 80, xen: 70, osprey: 60, ranchmesa: 110,
  keep: 170, windmill: 70, bog: 300, nest: 70, inn: 90, ruin: 90, farm: 120,
  castle: 360, hagrid: 70, pitch: 170, willow: 50, loch: 360, croft: 90, standing: 60, lair: 80
};
const RG_SITE_NAME = {
  moisture: s => rgNameFrom(RG_SURNAMES, s) + " Homestead", tusken: () => "Tusken Raider Camp", sandcrawler: () => "Jawa Sandcrawler", krayt: () => "Krayt Dragon Bones",
  sarlacc: () => "Great Pit of Carkoon", jabba: () => "Jabba's Palace", benhut: () => "Old Ben's Hut", tosche: () => "Tosche Station", escapepod: () => "Escape Pod Crash Site", podarena: () => "Mos Espa Grand Arena",
  pyramid: () => "Great Pyramid of Ra", mine: s => ["Naquadah Mine", "Deep Mine", "Quarry", "North Mine", "Old Mine"][s.seed % 5], caravan: () => "Mastadge Caravan", obelisks: () => "Obelisk Ruins", glider: () => "Crashed Death Glider", oasis: () => "Oasis",
  ranch: s => ["Shan Yu", "Hooper", "Sir Warrick", "Patience", "Cobb", "Frye", "Washburne", "Book", "Tam", "Reynolds"][s.seed % 10] + " Ranch", estate: () => "Harrow Estate", wreck: () => "Transport Wreck", outlaw: () => "Outlaw Hideout",
  sietch: s => ["Sietch Tabr", "Sietch Jacurutu", "Red Wall Sietch", "Cave of Ridges", "Sietch Gara Kulon", "False Wall Sietch", "Habbanya Sietch"][s.seed % 7], harvester: () => "Spice Harvester", windtrap: () => "Windtrap Station",
  wormsign: () => "Worm Sign", testing: () => "Ecological Testing Station", thopterpad: () => "Ornithopter Pad",
  processor: () => "Atmosphere Processor", derelict: () => "The Derelict", dropship: () => "Crashed Dropship", relay: () => "Comm Relay", hive: () => "Hive Nest", crawler: () => "Abandoned Crawler",
  kamehouse: () => "Kame House", gokuhouse: () => "Mount Paozu House", tournament: () => "World Martial Arts Tournament", lake: () => "Lake", ribbon: () => "Red Ribbon Base", farmhouse: () => "Farmhouse", crater: () => "Impact Crater",
  facility: () => "Black Mesa Research Facility", lambda: () => "Lambda Complex", radar: () => "Radar Station", xen: () => "Xen Anomaly", osprey: () => "Downed Osprey", ranchmesa: () => "Ranch",
  keep: s => ["Kaer Morhen", "Crow's Perch Keep", "Wyzima Keep", "Hindarsfjall Keep", "Lindenvale Keep"][s.seed % 5], windmill: () => "Windmill", bog: () => "Crookback Bog", nest: () => "Monster Nest", inn: () => "Crossroads Inn", ruin: () => "Elven Ruins", farm: () => "Farmstead",
  castle: () => "Hogwarts Castle", hagrid: () => "Hagrid's Hut", pitch: () => "Quidditch Pitch", willow: () => "The Whomping Willow", loch: () => "Black Lake", croft: () => "Croft", standing: () => "Standing Stones", lair: () => "Acromantula Lair"
};

/* --- TATOOINE ------------------------------------------------------------------------- */
const RG_SITE_GEN = {};
// Lars-style homestead: sunken round courtyard, an entrance dome toward the road, rooms round the pit, a garage, a field of vaporators
RG_SITE_GEN.moisture = function (B, s, r) {
  const g = rgCard(s.gateAng !== undefined ? s.gateAng : r() * 6.28), cx = s.x, cy = s.y, CR = 9;
  rgOccDisc(cx, cy, 28, 6);
  const gaps = [];
  // entrance dome (door to the outside + a back door into the pit)
  const [gx, gy] = RG_DIR[g];
  rgDome(B, cx + gx * (CR + 4.6), cy + gy * (CR + 4.6), 8, g, { door2: 1, name: "HOMESTEAD", rgHome: 1 });
  gaps.push({ a: RG_ANG[g], w: 2.2 });
  // rooms dug round the pit, each opening onto the courtyard
  for (const d of ["N", "E", "S", "W"]) {
    if (d === g || r() < 0.2) continue;
    const D = cRange(r, 7, 9), [dx, dy] = RG_DIR[d];
    const b = rgDome(B, cx + dx * (CR + 0.6 + D / 2), cy + dy * (CR + 0.6 + D / 2), D, RG_OPP[d], { name: "" });
    gaps.push({ a: RG_ANG[d], w: 2.2 });
    if (r() < 0.25) addSpawn(B, "room", 1, { bid: b.id, bkey: b.key, heavy: 0.05 });
  }
  rgRing(B, cx, cy, CR, 1.1, gaps, "court");
  rgP(B, "rgcourt", cx, cy, CR * 2 - 1, CR * 2 - 1, FS_NONE, { r: CR });
  rgP(B, "crate", cx + 3.5, cy - 2.5, 1.5, 1.5, FS_COVER, { rg: 0 }); rgP(B, "rgdroidpart", cx - 3, cy + 3, 1.6, 1.2, FS_LOW);
  // garage with a landspeeder outside
  const ga = RG_ANG[g] + (r() < 0.5 ? 1 : -1) * cRange(r, 0.9, 1.3), gd = 26, gfx = cx + Math.cos(ga) * gd, gfy = cy + Math.sin(ga) * gd;
  const gf = rgCard(ga);
  const gar = rgBox(B, "rgbox", gfx, gfy, 12, 9, gf, { name: "GARAGE", rgGarage: 1 });
  const [fx, fy] = RG_DIR[gf];
  addProp(B, "car", (gfx + fx * 9 - (fx ? 2.25 : 1)) * 2, (gfy + fy * 9 - (fy ? 2.25 : 1)) * 2, fx ? 9 : 4, fx ? 4 : 9, FS_COVER, { o: fx ? 1 : 0, v: cInt(r, 0, 7) });
  if (r() < 0.32) addSpawn(B, "room", cInt(r, 1, 3), { bid: gar.id, bkey: gar.key, heavy: 0.1 });
  // vaporators
  rgScatter(B, r, cx, cy, 34, s.rad - 8, cInt(r, 7, 14), (x, y) => rgP(B, "rgvap", x, y, 1.2, 1.2, FS_COVER, { v: Math.floor(r() * 3) }), 3);
  rgScatter(B, r, cx, cy, 30, 60, cInt(r, 1, 3), (x, y) => rgP(B, "rgjunk", x, y, 2.4, 1.6, FS_COVER, { v: Math.floor(r() * 4) }), 2.5);
};
// Sand People: hide tents round a fire, banthas, gaffi racks — and they do not like visitors
RG_SITE_GEN.tusken = function (B, s, r) {
  const cx = s.x, cy = s.y, n = cInt(r, 4, 8);
  rgOccDisc(cx, cy, 6, 6); rgP(B, "rgfire", cx, cy, 2.4, 2.4, FS_LOW);
  for (let k = 0; k < n; k++) {
    const a = k / n * Math.PI * 2 + r() * 0.4, d = cRange(r, 9, 16), x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d, R = cRange(r, 2.2, 3.2);
    if (!rgOccDiscFree(x, y, R + 0.6)) continue;
    rgOccDisc(x, y, R + 0.4, 6);
    rgPoly(B, "rgtent", rgDiscPoly(x, y, R, 9), FS_TALL, { kind: "hide", r: R, seed: Math.floor(r() * 1e9), ang: a });
  }
  rgScatter(B, r, cx, cy, 18, 30, cInt(r, 2, 4), (x, y, a) => rgP(B, "rgbantha", x, y, 3.6, 2.2, FS_COVER, { ang: a + 1.57, v: Math.floor(r() * 2) }), 3);
  rgScatter(B, r, cx, cy, 6, 12, 2, (x, y) => rgP(B, "rggaffi", x, y, 1.6, 0.6, FS_LOW), 1.2);
  addSpawn(B, "guard", cInt(r, 4, 7), { x: Math.round(cx * 2), y: Math.round(cy * 2), ros: "tusken", heavy: 0.15 });
  addSpawn(B, "patrol", cInt(r, 2, 3), { pts: [0, 1, 2, 3].map(k => [Math.round((cx + Math.cos(k * 1.57) * 45) * 2), Math.round((cy + Math.sin(k * 1.57) * 45) * 2)]), ros: "tusken", heavy: 0.1 });
};
// a Jawa sandcrawler halted on the dunes, scrap and droids for sale round its ramp
RG_SITE_GEN.sandcrawler = function (B, s, r) {
  const ang = r() * Math.PI * 2, cx = s.x, cy = s.y;
  rgOccDisc(cx, cy, 20, 6);
  rgShip(B, "sandcrawler", cx, cy, ang, { seed: Math.floor(r() * 1e9) });
  const fx = Math.cos(ang + Math.PI / 2), fy = Math.sin(ang + Math.PI / 2);
  rgP(B, "rgramp", cx + fx * 9.5, cy + fy * 9.5, 5, 5, FS_NONE, { ang });
  rgScatter(B, r, cx + fx * 16, cy + fy * 16, 2, 10, cInt(r, 4, 7), (x, y) => rgP(B, r() < 0.5 ? "rgdroid" : "rgjunk", x, y, 1.2, 1.2, FS_COVER, { v: Math.floor(r() * 4) }), 1.4);
  if (!B.npcs) B.npcs = []; B.npcs.push({ kind: "jawa", n: cInt(r, 5, 9), x: cx + fx * 14, y: cy + fy * 14 });
};
RG_SITE_GEN.krayt = function (B, s, r) {
  const ang = r() * Math.PI * 2;
  rgOccDisc(s.x, s.y, 26, 6);
  rgP(B, "rgkrayt", s.x, s.y, 46, 46, FS_NONE, { ang, seed: Math.floor(r() * 1e9) });
  const c = Math.cos(ang), sn = Math.sin(ang);
  rgPoly(B, "rgbonehit", rgDiscPoly(s.x + c * 18, s.y + sn * 18, 2.6, 8), FS_COVER, { inv: 1 });   // the skull
  for (let k = -2; k <= 2; k++) rgPoly(B, "rgbonehit", rgDiscPoly(s.x + c * k * 5, s.y + sn * k * 5, 0.9, 6), FS_COVER, { inv: 1 });
};
RG_SITE_GEN.sarlacc = function (B, s, r) {
  rgOccDisc(s.x, s.y, 30, 6);
  rgP(B, "rgsarlacc", s.x, s.y, 44, 44, FS_NONE, { seed: Math.floor(r() * 1e9) });
  rgPoly(B, "rgpit", rgDiscPoly(s.x, s.y, 5.5, 14), FS_LOW, { inv: 1 });
  rgScatter(B, r, s.x, s.y, 26, 40, 3, (x, y) => rgP(B, "rgskiff", x, y, 3, 8, FS_COVER, { ang: r() * 6.28 }), 4);
};
// Jabba's palace: a squat fortress with its great round tower and the gate on the road side
RG_SITE_GEN.jabba = function (B, s, r) {
  const g = rgCard(s.gateAng !== undefined ? s.gateAng : 0), [gx, gy] = RG_DIR[g], cx = s.x, cy = s.y;
  rgOccDisc(cx, cy, 70, 6);
  const main = rgBox(B, "civic", cx - gx * 6, cy - gy * 6, 64, 44, g, { kind: "council", name: "JABBA'S PALACE", imp: 3, mat: "masonry", roof: "flat", rgLandmark: 1, rgRoof: "palace" });
  addSpawn(B, "room", cInt(r, 6, 9), { bid: main.id, bkey: main.key, heavy: 0.35, elite: 1 });
  const sx = -gy, sy = gx;   // side axis
  rgDome(B, cx + sx * 40 - gx * 6, cy + sy * 40 - gy * 6, 24, g, { name: "PALACE TOWER", imp: 2 });
  rgDome(B, cx - sx * 38 - gx * 14, cy - sy * 38 - gy * 14, 14, g, { name: "" });
  addSpawn(B, "guard", cInt(r, 4, 6), { x: Math.round((cx + gx * 26) * 2), y: Math.round((cy + gy * 26) * 2), heavy: 0.3 });
  rgScatter(B, r, cx, cy, 60, 90, 4, (x, y) => rgP(B, "rgskiff", x, y, 3, 8, FS_COVER, { ang: r() * 6.28 }), 4);
};
RG_SITE_GEN.benhut = function (B, s, r) {
  const g = rgCard(r() * 6.28), [gx, gy] = RG_DIR[g];
  rgOccDisc(s.x, s.y, 14, 6);
  rgDome(B, s.x, s.y, 9.5, g, { name: "OLD BEN'S HUT", door2: 0 });
  rgRing(B, s.x + gx * 2, s.y + gy * 2, 11, 0.7, [{ a: RG_ANG[g], w: 3 }], "low");
  rgP(B, "rgvap", s.x - gy * 7, s.y + gx * 7, 1.2, 1.2, FS_COVER, { v: 1 });
};
RG_SITE_GEN.tosche = function (B, s, r) {
  const g = rgCard(s.gateAng !== undefined ? s.gateAng : 0), [gx, gy] = RG_DIR[g];
  rgOccDisc(s.x, s.y, 40, 6);
  const st = rgBox(B, "commercial", s.x, s.y, 18, 12, g, { kind: "hardware", name: "TOSCHE STATION", roof: "flat" });
  rgDome(B, s.x - gy * 16, s.y + gx * 16, 10, g, { name: "" });
  rgShip(B, "skyhopper", s.x + gx * 16 + gy * 8, s.y + gy * 16 - gx * 8, RG_ANG[g] + 0.4);
  rgScatter(B, r, s.x, s.y, 16, 34, 6, (x, y) => rgP(B, "rgconverter", x, y, 2, 2, FS_COVER, { v: Math.floor(r() * 2) }), 2);
  if (r() < 0.5) addSpawn(B, "room", cInt(r, 2, 3), { bid: st.id, bkey: st.key, heavy: 0.1 });
};
RG_SITE_GEN.escapepod = function (B, s, r) {
  const ang = r() * Math.PI * 2;
  rgOccDisc(s.x, s.y, 8, 6);
  rgShip(B, "escapepod", s.x, s.y, ang);
  rgP(B, "rgtrail", s.x - Math.cos(ang) * 18, s.y - Math.sin(ang) * 18, 36, 36, FS_NONE, { ang, len: 34 });
};
// Mos Espa Grand Arena: the grandstands, the hangars and podracers on the starting grid
RG_SITE_GEN.podarena = function (B, s, r) {
  const g = rgCard(s.gateAng !== undefined ? s.gateAng : 0), cx = s.x, cy = s.y, RX = 70;
  rgOccDisc(cx, cy, RX + 16, 6);
  rgRing(B, cx, cy, RX, 7, [{ a: RG_ANG[g], w: 16 }, { a: RG_ANG[g] + Math.PI, w: 26 }], "stand");
  rgP(B, "rgarena", cx, cy, RX * 2 - 6, RX * 2 - 6, FS_NONE, { r: RX - 4 });
  const ax = Math.cos(RG_ANG[g] + Math.PI), ay = Math.sin(RG_ANG[g] + Math.PI), sxv = -ay, syv = ax;
  for (let k = -3; k <= 3; k++) for (let row = 0; row < 2; row++) rgShip(B, "podracer", cx + ax * (20 + row * 14) + sxv * k * 9, cy + ay * (20 + row * 14) + syv * k * 9, RG_ANG[g] + Math.PI, { v: (k + 3 + row) % 5 });
  for (let k = -1; k <= 1; k++) rgBox(B, "warehouse", cx + ax * (RX + 26) + sxv * k * 30, cy + ay * (RX + 26) + syv * k * 30, 26, 18, g, { kind: "warehouse", name: "PODRACE HANGAR", mat: "metal", roof: "flat" });
  addSpawn(B, "patrol", 3, { pts: [0, 1, 2, 3].map(k => [Math.round((cx + Math.cos(k * 1.57) * 40) * 2), Math.round((cy + Math.sin(k * 1.57) * 40) * 2)]), heavy: 0.2 });
};
// docking bays in a spaceport town: open-topped round pits with a freighter inside
function rgTownBays(B, mx, my, r) {
  const P = RG.P, nb = P.bld && P.bld.bays;
  if (!nb) return;
  for (const T of RG.towns) {
    if (T.kind > 1) continue;
    const want = T.kind === 0 ? nb : Math.max(1, Math.floor(nb / 3));
    const cx0 = mx * 1000, cy0 = my * 1000;
    if (Math.hypot(rgClamp(T.x, cx0, cx0 + 1000) - T.x, rgClamp(T.y, cy0, cy0 + 1000) - T.y) > T.r * 0.75) continue;
    const rr = cRng(cH(CITY.seed, T.idx, mx * 64 + my, 31));
    let placed = 0;
    for (let tries = 0; tries < 60 && placed < want; tries++) {
      const a = rr() * Math.PI * 2, d = T.r * cRange(rr, 0.18, 0.62), x = T.x + Math.cos(a) * d, y = T.y + Math.sin(a) * d, R = cRange(rr, 15, 19);
      if (x < cx0 + R + 4 || y < cy0 + R + 4 || x > cx0 + 1000 - R - 4 || y > cy0 + 1000 - R - 4) continue;
      if (!rgOccDiscFree(x, y, R + 3)) continue;
      const nr = rgNearestRoad(x, y, 120), ga = nr ? Math.atan2((nr.s.ay + nr.s.by) / 2 - y, (nr.s.ax + nr.s.bx) / 2 - x) : a + Math.PI;
      rgOccDisc(x, y, R + 2, 6);
      rgRing(B, x, y, R, 1.6, [{ a: ga, w: 7 }], "bay", { label: ((P.bld && P.bld.bayName) || "DOCKING BAY") + " " + (94 - T.idx * 7 - placed * 3 + Math.floor(rr() * 3)) });
      rgP(B, "rgbayfloor", x, y, R * 2 - 2, R * 2 - 2, FS_NONE, { r: R - 1 });
      const ships = (P.bld && P.bld.bayShips) || ["freighter", "freighter", "freighter", "skyhopper"];
      if (rr() < 0.8) rgShip(B, ships[Math.floor(rr() * ships.length)], x, y, ga + Math.PI / 2 + (rr() - 0.5) * 0.6, { v: Math.floor(rr() * 4) });
      if (rr() < 0.4) addSpawn(B, "patrol", cInt(rr, 2, 3), { pts: [0, 1, 2].map(k => [Math.round((x + Math.cos(ga + k * 2.1) * (R - 4)) * 2), Math.round((y + Math.sin(ga + k * 2.1) * (R - 4)) * 2)]), heavy: 0.2 });
      placed++;
    }
  }
}
// any site without a dedicated builder: a small walled-in cluster so nothing is ever empty
function rgSiteFallback(B, s, r) {
  const g = rgCard(s.gateAng !== undefined ? s.gateAng : r() * 6.28);
  rgOccDisc(s.x, s.y, 24, 6);
  const b = rgBox(B, "rgbox", s.x, s.y, 14, 10, g, { name: (s.name || "").toUpperCase() });
  rgBox(B, "shed", s.x + 14, s.y + 4, 6, 5, g, {});
  if (r() < 0.5) addSpawn(B, "room", cInt(r, 1, 3), { bid: b.id, bkey: b.key, heavy: 0.15 });
}
// EOF:js/regionsites.js
