/* =========================================================================
   OMNI-SHIFT v14.2 — WORLD PROFILES · THE OTHER HOMEWORLDS (js/regionworlds.js)
   Landmarks, homesteads and camps for Abydos, Persephone, Arrakis, LV-426,
   Ki-Surge Earth, Black Mesa, the Continent and the Highlands (Tatooine is
   the reference set in regionsites.js), plus the props, ships and roofs they
   need. Same primitives: round/square buildings, ring walls, polygon hulls,
   region props drawn by regionart.js, per-world spawns (natives via `ros`).
   ========================================================================= */
"use strict";

/* --- helpers ---------------------------------------------------------------------- */
function rgWater(B, cx, cy, rx, ry) { addSurf(B, "water", Math.round((cx - rx) * 2), Math.round((cy - ry) * 2), Math.round((cx + rx) * 2), Math.round((cy + ry) * 2)); rgOccDisc(cx, cy, Math.max(rx, ry) + 2, 6); }
function rgFenceRect(B, kind, x0, y0, x1, y1, gateSide, gateW) {   // metres; one gate gap of gateW on side N/S/E/W
  const T = v => Math.round(v * 2), gw = (gateW || 6) / 2, mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
  const seg = (ax, ay, bx, by) => addFence(B, kind, T(ax), T(ay), T(bx), T(by));
  if (gateSide === "N") { seg(x0, y0, mx - gw, y0); seg(mx + gw, y0, x1, y0); } else seg(x0, y0, x1, y0);
  if (gateSide === "S") { seg(x0, y1, mx - gw, y1); seg(mx + gw, y1, x1, y1); } else seg(x0, y1, x1, y1);
  if (gateSide === "W") { seg(x0, y0, x0, my - gw); seg(x0, my + gw, x0, y1); } else seg(x0, y0, x0, y1);
  if (gateSide === "E") { seg(x1, y0, x1, my - gw); seg(x1, my + gw, x1, y1); } else seg(x1, y0, x1, y1);
}
function rgTree(B, x, y, r, sz) { addProp(B, "tree", Math.round(x * 2), Math.round(y * 2), 1, 1, FS_COVER, { v: Math.floor(r() * 4), sz: sz || (0.9 + r() * 0.8) }); }
function rgGate(s, r) { return rgCard(s.gateAng !== undefined ? s.gateAng : r() * 6.28); }
function rgGuard(B, x, y, n, ros, extra) { return addSpawn(B, "guard", n, Object.assign({ x: Math.round(x * 2), y: Math.round(y * 2), ros }, extra || {})); }
function rgPatrol(B, x, y, R, n, ros, extra) { return addSpawn(B, "patrol", n, Object.assign({ pts: [0, 1, 2, 3].map(k => [Math.round((x + Math.cos(k * 1.571) * R) * 2), Math.round((y + Math.sin(k * 1.571) * R) * 2)]), ros }, extra || {})); }
function rgRoomSpawn(B, b, n, heavy, extra) { return addSpawn(B, "room", n, Object.assign({ bid: b.id, bkey: b.key, heavy: heavy || 0.12 }, extra || {})); }
const RGW_G = RG_SITE_GEN;

/* --- ABYDOS ---------------------------------------------------------------------------- */
RGW_G.pyramid = function (B, s, r) {   // the great pyramid: an avenue of obelisks to the gate room that holds the Stargate
  const g = rgGate(s, r), [gx, gy] = RG_DIR[g], cx = s.x - gx * 30, cy = s.y - gy * 30, S = 92;
  rgOccDisc(cx, cy, 80, 6);
  const b = rgBox(B, "pyramid", cx, cy, S, S, g, { name: "PYRAMID OF RA", rgRoof: "pyramid", rgLandmark: 1, mat: "masonry", imp: 3 });
  rgRoomSpawn(B, b, cInt(r, 5, 8), 0.35, { elite: 1 });
  for (let k = 1; k <= 5; k++) for (const sd of [-1, 1]) { const x = cx + gx * (S / 2 + k * 14) + (-gy) * sd * 12, y = cy + gy * (S / 2 + k * 14) + gx * sd * 12; rgPoly(B, "rgobelisk", rgDiscPoly(x, y, 1.3, 4), FS_TALL, { h: 1 }); }
  rgGuard(B, cx + gx * (S / 2 + 20), cy + gy * (S / 2 + 20), cInt(r, 3, 5), undefined, { heavy: 0.3 });
  rgShip(B, "glider", cx + (-gy) * 70, cy + gx * 70, r() * 6.28);
};
RGW_G.mine = function (B, s, r) {
  const g = rgGate(s, r), [gx, gy] = RG_DIR[g];
  rgOccDisc(s.x, s.y, 50, 6);
  rgPoly(B, "rgrock", rgDiscPoly(s.x - gx * 22, s.y - gy * 22, 16, 11), FS_TALL, { kind: "mesa", v: 1, seed: 11 });
  rgP(B, "rgminemouth", s.x - gx * 8, s.y - gy * 8, 7, 7, FS_NONE, { ang: RG_ANG[g] });
  rgP(B, "rgrail", s.x + gx * 14, s.y + gy * 14, 30, 30, FS_NONE, { ang: RG_ANG[g], len: 40 });
  for (let k = 0; k < 3; k++) rgP(B, "rgcart", s.x + gx * (8 + k * 9), s.y + gy * (8 + k * 9), 2.4, 2.4, FS_COVER, { ang: RG_ANG[g] });
  const sh = rgBox(B, "warehouse", s.x + gx * 30 + gy * 18, s.y + gy * 30 - gx * 18, 20, 14, g, { kind: "warehouse", name: "ORE SHED" });
  rgScatter(B, r, s.x, s.y, 30, 60, 5, (x, y) => rgRock(B, x, y, cRange(r, 2, 4), r, "boulder"), 5);
  if (r() < 0.6) rgRoomSpawn(B, sh, cInt(r, 2, 4), 0.2);
  rgPatrol(B, s.x, s.y, 30, cInt(r, 2, 3), undefined, { heavy: 0.2 });
};
RGW_G.caravan = function (B, s, r) {
  rgOccDisc(s.x, s.y, 10, 6); rgP(B, "rgfire", s.x, s.y, 2.4, 2.4, FS_LOW);
  for (let k = 0; k < cInt(r, 3, 5); k++) { const a = k * 1.6 + r(), d = cRange(r, 8, 13), R = cRange(r, 2.4, 3.2); rgPoly(B, "rgtent", rgDiscPoly(s.x + Math.cos(a) * d, s.y + Math.sin(a) * d, R, 9), FS_TALL, { kind: "cloth", r: R, ang: a, seed: Math.floor(r() * 1e9) }); }
  rgScatter(B, r, s.x, s.y, 18, 34, cInt(r, 4, 8), (x, y, a) => rgP(B, "rgmastadge", x, y, 5, 3, FS_COVER, { ang: a + 1.57 }), 3.5);
  rgScatter(B, r, s.x, s.y, 5, 10, 4, (x, y) => rgP(B, "crate", x, y, 1.4, 1.4, FS_COVER, { rg: 0 }), 1.2);
};
RGW_G.obelisks = function (B, s, r) {
  const n = cInt(r, 6, 9);
  rgOccDisc(s.x, s.y, 26, 6);
  for (let k = 0; k < n; k++) { const a = k / n * 6.28, x = s.x + Math.cos(a) * 18, y = s.y + Math.sin(a) * 18; if (r() < 0.25) rgP(B, "rgobeliskdown", x, y, 7, 7, FS_COVER, { ang: r() * 6.28 }); else rgPoly(B, "rgobelisk", rgDiscPoly(x, y, 1.2, 4), FS_TALL, { h: 1 }); }
  rgP(B, "rgdhd", s.x, s.y, 3, 3, FS_COVER);
};
RGW_G.glider = function (B, s, r) { const a = r() * 6.28; rgOccDisc(s.x, s.y, 10, 6); rgShip(B, "glider", s.x, s.y, a, { wreck: 1 }); rgP(B, "rgtrail", s.x - Math.cos(a) * 18, s.y - Math.sin(a) * 18, 36, 36, FS_NONE, { ang: a, len: 30 }); };
RGW_G.oasis = function (B, s, r) {
  rgWater(B, s.x, s.y, cRange(r, 22, 34), cRange(r, 15, 24));
  for (let k = 0; k < 14; k++) { const a = r() * 6.28, d = cRange(r, 30, 46); rgTree(B, s.x + Math.cos(a) * d, s.y + Math.sin(a) * d * 0.8, r, 1.2 + r() * 0.6); }
  for (let k = 0; k < 2; k++) { const a = r() * 6.28; rgPoly(B, "rgtent", rgDiscPoly(s.x + Math.cos(a) * 55, s.y + Math.sin(a) * 50, 3, 9), FS_TALL, { kind: "cloth", r: 3, ang: a, seed: Math.floor(r() * 1e9) }); }
};

/* --- PERSEPHONE ------------------------------------------------------------------------ */
RGW_G.ranch = function (B, s, r) {
  const g = rgGate(s, r), [gx, gy] = RG_DIR[g];
  rgOccDisc(s.x, s.y, 60, 6);
  const h = rgBox(B, "rgbox", s.x + gx * 10, s.y + gy * 10, 15, 10, g, { name: "RANCH HOUSE", mat: "wood", roof: "gable" });
  rgBox(B, "barn", s.x - gx * 18 + gy * 16, s.y - gy * 18 - gx * 16, 18, 13, g, { kind: "barn", name: "BARN", mat: "wood", roof: "gable" });
  const ox = s.x - gx * 10 - gy * 24, oy = s.y - gy * 10 + gx * 24;
  rgFenceRect(B, "wood", ox - 16, oy - 12, ox + 16, oy + 12, g, 4);
  for (let k = 0; k < cInt(r, 4, 9); k++) rgP(B, "rgcow", ox + cRange(r, -12, 12), oy + cRange(r, -8, 8), 2.4, 1.2, FS_COVER, { ang: r() * 6.28, v: k & 1 });
  rgP(B, "rgwatertower", s.x + gy * 14, s.y - gx * 14, 4, 4, FS_TALL);
  if (r() < 0.35) rgRoomSpawn(B, h, cInt(r, 1, 3), 0.1);
};
RGW_G.estate = function (B, s, r) {
  const g = rgGate(s, r);
  rgOccDisc(s.x, s.y, 95, 6);
  rgFenceRect(B, "stone", s.x - 70, s.y - 55, s.x + 70, s.y + 55, g, 10);
  const m = rgBox(B, "civic", s.x, s.y, 44, 28, g, { kind: "council", name: "HARROW ESTATE", mat: "masonry", roof: "hip", imp: 2 });
  rgRoomSpawn(B, m, cInt(r, 3, 5), 0.25);
  rgP(B, "fountain", s.x + RG_DIR[g][0] * 30, s.y + RG_DIR[g][1] * 30, 6, 6, FS_COVER, { rg: 0 });
  for (let k = -3; k <= 3; k++) { const [gx, gy] = RG_DIR[g]; addProp(B, "hedge", Math.round((s.x + gx * 42 + (-gy) * k * 9 - 2) * 2), Math.round((s.y + gy * 42 + gx * k * 9 - 1) * 2), 8, 3, FS_COVER); }
  rgPatrol(B, s.x, s.y, 50, 3, undefined, { heavy: 0.3 });
};
RGW_G.wreck = function (B, s, r) { const a = r() * 6.28; rgOccDisc(s.x, s.y, 18, 6); rgShip(B, "transport", s.x, s.y, a, { wreck: 1 }); rgP(B, "rgtrail", s.x - Math.cos(a) * 24, s.y - Math.sin(a) * 24, 48, 48, FS_NONE, { ang: a, len: 44 }); rgScatter(B, r, s.x, s.y, 12, 30, 6, (x, y) => rgP(B, "rgjunk", x, y, 2, 1.6, FS_COVER, { v: 1 }), 2); };
RGW_G.outlaw = function (B, s, r) {
  rgOccDisc(s.x, s.y, 26, 6); rgP(B, "rgfire", s.x, s.y, 2.4, 2.4, FS_LOW);
  for (let k = 0; k < 2; k++) { const a = k * 3.14 + r(); const b = rgBox(B, "cabin", s.x + Math.cos(a) * 14, s.y + Math.sin(a) * 14, 10, 8, rgCard(a + Math.PI), { kind: "cabin", mat: "wood", roof: "gable" }); if (k === 0) rgRoomSpawn(B, b, 2, 0.15); }
  rgGuard(B, s.x, s.y, cInt(r, 3, 5), undefined, { heavy: 0.2 });
};

/* --- ARRAKIS --------------------------------------------------------------------------- */
RGW_G.sietch = function (B, s, r) {   // Fremen sietch hidden in the rock: a cave hall behind a narrow cleft
  const g = rgCard(r() * 6.28), [gx, gy] = RG_DIR[g];
  rgOccDisc(s.x, s.y, 60, 6);
  const pts = []; for (let i = 0; i < 16; i++) { const a = i / 16 * 6.28; pts.push([s.x + Math.cos(a) * 46 * cRange(r, 0.9, 1.08), s.y + Math.sin(a) * 38 * cRange(r, 0.9, 1.08)]); }
  // carve the cave: the hall sits inside, the cleft opens towards g
  const hall = rgBox(B, "rgbox", s.x, s.y, 30, 20, g, { name: "SIETCH", mat: "stone", roof: "flat", rgCave: 1 });
  rgPoly(B, "rgcave", pts, FS_TALL, { kind: "mesa", v: 0, seed: 7, hole: [s.x, s.y, 17, 12], gate: RG_ANG[g], cleft: 4.5 });
  hall.rgRoof = "rockroof";
  for (const [ox, oy] of [[-1, 0], [1, 0]]) { const sx = s.x + gx * 30 + (-gy) * ox * 9, sy = s.y + gy * 30 + gx * ox * 9; rgRock(B, sx, sy, 6, r, "rock"); }
  rgP(B, "rgwindtrap", s.x - gx * 26, s.y - gy * 26, 3, 3, FS_COVER);
  rgRoomSpawn(B, hall, cInt(r, 3, 5), 0.2, { ros: "fremen", rosSkipIf: "harkonnen" });
  rgGuard(B, s.x + gx * 34, s.y + gy * 34, cInt(r, 2, 4), "fremen", { rosSkipIf: "harkonnen" });
};
RGW_G.harvester = function (B, s, r) {
  const a = r() * 6.28;
  rgOccDisc(s.x, s.y, 30, 6);
  rgShip(B, "harvester", s.x, s.y, a);
  rgP(B, "rgspiceplume", s.x + Math.cos(a) * 26, s.y + Math.sin(a) * 26, 30, 30, FS_NONE, { ang: a });
  rgShip(B, "carryall", s.x - Math.sin(a) * 40, s.y + Math.cos(a) * 40, a + 0.3);
  rgP(B, "rgthumper", s.x + Math.cos(a + 2) * 60, s.y + Math.sin(a + 2) * 60, 1.2, 1.2, FS_COVER);
  rgPatrol(B, s.x, s.y, 36, cInt(r, 2, 4), undefined, { heavy: 0.25 });
};
RGW_G.windtrap = function (B, s, r) {
  const g = rgGate(s, r);
  rgOccDisc(s.x, s.y, 30, 6);
  rgDome(B, s.x, s.y, 12, g, { name: "WINDTRAP STATION" });
  for (let k = 0; k < 3; k++) { const a = k * 2.09 + 0.5; rgP(B, "rgwindtrap", s.x + Math.cos(a) * 16, s.y + Math.sin(a) * 16, 3, 3, FS_COVER); }
  rgP(B, "rgcistern", s.x + RG_DIR[g][1] * 14, s.y - RG_DIR[g][0] * 14, 6, 6, FS_COVER);
};
RGW_G.wormsign = function (B, s, r) { rgOccDisc(s.x, s.y, 20, 6); rgP(B, "rgworm", s.x, s.y, 340, 340, FS_NONE, { seed: Math.floor(r() * 1e9) }); rgP(B, "rgthumper", s.x + 30, s.y - 20, 1.2, 1.2, FS_COVER); };
RGW_G.testing = function (B, s, r) { const g = rgGate(s, r); rgOccDisc(s.x, s.y, 26, 6); const b = rgDome(B, s.x, s.y, 14, g, { name: "TESTING STATION" }); rgBox(B, "rgbox", s.x + 14, s.y + 4, 10, 8, g, {}); rgP(B, "rgantenna", s.x - 12, s.y - 8, 2, 2, FS_COVER); if (r() < 0.5) rgRoomSpawn(B, b, 2, 0.15); };
RGW_G.thopterpad = function (B, s, r) {
  const g = rgGate(s, r);
  rgOccDisc(s.x, s.y, 46, 6);
  rgP(B, "rgpad", s.x, s.y, 36, 36, FS_NONE, { r: 17 });
  rgShip(B, "thopter", s.x - 7, s.y, r() * 6.28); rgShip(B, "thopter", s.x + 9, s.y + 4, r() * 6.28);
  rgBox(B, "warehouse", s.x + RG_DIR[g][1] * 30, s.y - RG_DIR[g][0] * 30, 20, 14, g, { kind: "warehouse", name: "THOPTER HANGAR", mat: "metal" });
};

/* --- LV-426 ---------------------------------------------------------------------------- */
RGW_G.processor = function (B, s, r) {   // the atmosphere processor: a vast round reactor stack, pipes and plant sheds
  const g = rgGate(s, r), [gx, gy] = RG_DIR[g];
  rgOccDisc(s.x, s.y, 120, 6);
  const core = rgDome(B, s.x, s.y, 56, g, { name: "ATMOSPHERE PROCESSOR", rgRoof: "processor", mat: "metal", imp: 3, domeKind: "warehouse" });
  rgRoomSpawn(B, core, cInt(r, 4, 7), 0.3, { ros: "xenomorph" });
  for (let k = 0; k < 4; k++) { const a = RG_ANG[g] + 0.8 + k * 1.2, x = s.x + Math.cos(a) * 66, y = s.y + Math.sin(a) * 66; rgDome(B, x, y, 18, rgCard(a), { name: "", rgRoof: "processor", mat: "metal", domeKind: "warehouse" }); }
  for (let k = -1; k <= 1; k++) rgBox(B, "warehouse", s.x + gx * 76 + (-gy) * k * 30, s.y + gy * 76 + gx * k * 30, 24, 16, g, { kind: "warehouse", name: "PLANT SHED", mat: "metal" });
  rgScatter(B, r, s.x, s.y, 34, 52, 10, (x, y, a) => rgP(B, "rgpipe", x, y, 10, 2, FS_COVER, { ang: a + 1.57 }), 3);
};
RGW_G.derelict = function (B, s, r) {
  const a = r() * 6.28;
  rgOccDisc(s.x, s.y, 75, 6);
  rgShip(B, "derelict", s.x, s.y, a);
  rgScatter(B, r, s.x + Math.cos(a) * 40, s.y + Math.sin(a) * 40, 4, 22, cInt(r, 8, 14), (x, y) => rgP(B, "rgegg", x, y, 1.2, 1.2, FS_LOW), 1.2);
  rgGuard(B, s.x + Math.cos(a) * 40, s.y + Math.sin(a) * 40, cInt(r, 3, 6), "xenomorph", { heavy: 0.2 });
};
RGW_G.dropship = function (B, s, r) { const a = r() * 6.28; rgOccDisc(s.x, s.y, 16, 6); rgShip(B, "dropship", s.x, s.y, a, { wreck: 1 }); rgP(B, "rgtrail", s.x - Math.cos(a) * 22, s.y - Math.sin(a) * 22, 44, 44, FS_NONE, { ang: a, len: 40 }); rgScatter(B, r, s.x, s.y, 10, 26, 6, (x, y) => rgP(B, "rgjunk", x, y, 2, 1.6, FS_COVER, { v: 2 }), 2); };
RGW_G.relay = function (B, s, r) { const g = rgGate(s, r); rgOccDisc(s.x, s.y, 20, 6); rgP(B, "rgantenna", s.x, s.y, 4, 4, FS_TALL, { big: 1 }); const b = rgBox(B, "rgbox", s.x + RG_DIR[g][0] * 9, s.y + RG_DIR[g][1] * 9, 9, 7, g, { name: "COMM RELAY", mat: "metal" }); if (r() < 0.4) rgRoomSpawn(B, b, 1, 0.1, { ros: "xenomorph" }); };
RGW_G.hive = function (B, s, r) {
  rgOccDisc(s.x, s.y, 34, 6);
  rgP(B, "rghive", s.x, s.y, 64, 64, FS_NONE, { seed: Math.floor(r() * 1e9) });
  rgScatter(B, r, s.x, s.y, 4, 26, cInt(r, 10, 18), (x, y) => rgP(B, "rgegg", x, y, 1.2, 1.2, FS_LOW), 1.2);
  rgGuard(B, s.x, s.y, cInt(r, 5, 8), "xenomorph", { heavy: 0.25 });
};
RGW_G.crawler = function (B, s, r) { rgOccDisc(s.x, s.y, 12, 6); rgShip(B, "crawler", s.x, s.y, r() * 6.28, { wreck: 1 }); };

/* --- KI-SURGE EARTH -------------------------------------------------------------------- */
RGW_G.kamehouse = function (B, s, r) {   // the pink house on a tiny island, one palm tree, a sand spit to wade over
  const rx = 95, ry = 70, gap = 3;
  rgWater(B, s.x - rx / 2 - gap, s.y, rx / 2, ry); rgWater(B, s.x + rx / 2 + gap, s.y, rx / 2, ry);
  B.surf.push({ t: "rgdisc", x0: (s.x - 13) * 2, y0: (s.y - 11) * 2, x1: (s.x + 13) * 2, y1: (s.y + 11) * 2, pat: "sand", col: "#ecdcaa" });
  rgOccDisc(s.x, s.y, 14, 6);
  rgBox(B, "house", s.x - 1, s.y - 1, 14, 10, "S", { name: "KAME HOUSE", rgRoof: "kame", mat: "wood", spec: { mw: 28, gw: 0, gh: 0, garage: false } });
  rgTree(B, s.x + 8, s.y + 6, r, 1.5);
  rgP(B, "rgbeachchair", s.x - 6, s.y + 8, 2, 1, FS_LOW);
};
RGW_G.gokuhouse = function (B, s, r) { const g = rgGate(s, r); rgOccDisc(s.x, s.y, 22, 6); rgDome(B, s.x, s.y, 12, g, { name: "SON FAMILY HOME", rgRoof: "capsuledome" }); rgP(B, "rgwoodpile", s.x + 9, s.y + 6, 3, 1.4, FS_COVER); addSurf(B, "crop", Math.round((s.x - 30) * 2), Math.round((s.y + 12) * 2), Math.round((s.x - 10) * 2), Math.round((s.y + 26) * 2), 2); };
RGW_G.tournament = function (B, s, r) {
  const g = rgGate(s, r), [gx, gy] = RG_DIR[g];
  rgOccDisc(s.x, s.y, 80, 6);
  rgRing(B, s.x, s.y, 58, 7, [{ a: RG_ANG[g], w: 14 }, { a: RG_ANG[g] + Math.PI, w: 10 }], "stand");
  rgP(B, "rgstage", s.x, s.y, 36, 36, FS_NONE);
  rgBox(B, "commercial", s.x + gx * 72, s.y + gy * 72, 22, 10, g, { kind: "store", name: "TENKAICHI BUDOKAI", mat: "masonry", roof: "hip" });
  rgPatrol(B, s.x, s.y, 24, cInt(r, 2, 4), undefined, { heavy: 0.3 });
};
RGW_G.lake = function (B, s, r) {
  const n = cInt(r, 2, 4);
  for (let k = 0; k < n; k++) { const a = r() * 6.28, d = k ? cRange(r, 30, 90) : 0; rgWater(B, s.x + Math.cos(a) * d, s.y + Math.sin(a) * d, cRange(r, 50, 110), cRange(r, 40, 80)); }
  for (let k = 0; k < 10; k++) { const a = r() * 6.28, d = cRange(r, 120, 160); rgTree(B, s.x + Math.cos(a) * d, s.y + Math.sin(a) * d, r); }
};
RGW_G.ribbon = function (B, s, r) {
  const g = rgGate(s, r);
  rgOccDisc(s.x, s.y, 90, 6);
  rgFenceRect(B, "chain", s.x - 75, s.y - 60, s.x + 75, s.y + 60, g, 10);
  const hq = rgBox(B, "civic", s.x, s.y, 36, 24, g, { kind: "police", name: "RED RIBBON HQ", mat: "metal" });
  rgRoomSpawn(B, hq, cInt(r, 4, 6), 0.35);
  for (let k = -1; k <= 1; k += 2) rgBox(B, "warehouse", s.x + k * 48, s.y + 18, 24, 16, g, { kind: "warehouse", name: "HANGAR", mat: "metal" });
  for (let k = 0; k < 3; k++) rgShip(B, "apc", s.x - 30 + k * 14, s.y - 40, 0);
  rgP(B, "rgflag", s.x + RG_DIR[g][0] * 20, s.y + RG_DIR[g][1] * 20, 1.4, 1.4, FS_COVER, { col: "#c62828" });
  rgPatrol(B, s.x, s.y, 50, cInt(r, 3, 5), undefined, { heavy: 0.35 });
};
RGW_G.farmhouse = function (B, s, r) { const g = rgGate(s, r); rgOccDisc(s.x, s.y, 50, 6); const b = rgDome(B, s.x, s.y, cRange(r, 11, 14), g, {}); for (let k = 0; k < 3; k++) addSurf(B, "crop", Math.round((s.x - 60 + k * 40) * 2), Math.round((s.y + 22) * 2), Math.round((s.x - 24 + k * 40) * 2), Math.round((s.y + 70) * 2), k); addProp(B, "tractor", Math.round((s.x + 14) * 2), Math.round((s.y + 6) * 2), 5, 8, FS_COVER, { o: 0, v: 1 }); if (r() < 0.3) rgRoomSpawn(B, b, 1, 0.1); };
RGW_G.crater = function (B, s, r) { rgOccDisc(s.x, s.y, 30, 6); rgP(B, "rgcrater", s.x, s.y, 70, 70, FS_NONE); rgShip(B, "escapepod", s.x, s.y, r() * 6.28, { saiyan: 1 }); rgScatter(B, r, s.x, s.y, 36, 50, 8, (x, y) => rgRock(B, x, y, cRange(r, 1.5, 3.5), r, "boulder"), 4); };

/* --- BLACK MESA ------------------------------------------------------------------------ */
RGW_G.facility = function (B, s, r) {   // Black Mesa Research Facility: fenced sectors, labs, the tram line, helipad, car parks
  const g = rgGate(s, r), [gx, gy] = RG_DIR[g], W = 300, H = 250;
  rgOccDisc(s.x, s.y, 240, 6);
  rgFenceRect(B, "chain", s.x - W / 2, s.y - H / 2, s.x + W / 2, s.y + H / 2, g, 14);
  addSurf(B, "lot", Math.round((s.x - W / 2 + 6) * 2), Math.round((s.y - 8) * 2), Math.round((s.x + W / 2 - 6) * 2), Math.round((s.y + 8) * 2));
  addSurf(B, "lot", Math.round((s.x - 8) * 2), Math.round((s.y - H / 2 + 6) * 2), Math.round((s.x + 8) * 2), Math.round((s.y + H / 2 - 6) * 2));
  rgP(B, "rgrail", s.x, s.y - H / 2 + 20, W - 20, 6, FS_NONE, { ang: 0, len: W - 20 });
  const labs = [["SECTOR C · ANOMALOUS MATERIALS", "council", 60, 34], ["SECTOR A · ADMINISTRATION", "council", 46, 28], ["SECTOR E · BIODOME", "clinic", 40, 28], ["SECTOR D · SECURITY", "police", 40, 26]];
  labs.forEach(([nm, kind, w, h], k) => { const qx = k & 1 ? 1 : -1, qy = k & 2 ? 1 : -1, b = rgBox(B, "civic", s.x + qx * 70, s.y + qy * 62, w, h, qy < 0 ? "S" : "N", { kind, name: nm, mat: "masonry", imp: 2 }); rgRoomSpawn(B, b, cInt(r, 3, 6), 0.3); });
  for (let k = 0; k < 4; k++) rgBox(B, "warehouse", s.x + (k - 1.5) * 64, s.y + (k & 1 ? 104 : -104), 30, 18, k & 1 ? "N" : "S", { kind: "warehouse", name: "STORAGE " + (k + 1), mat: "metal" });
  rgP(B, "rgpad", s.x + 120, s.y, 22, 22, FS_NONE, { r: 10, h: 1 });
  rgPatrol(B, s.x, s.y, 90, cInt(r, 4, 6), undefined, { heavy: 0.35 });
  rgGuard(B, s.x + gx * (W / 2 - 8), s.y + gy * (H / 2 - 8), cInt(r, 2, 3), undefined, { heavy: 0.3 });
};
RGW_G.lambda = function (B, s, r) { const g = rgGate(s, r); rgOccDisc(s.x, s.y, 60, 6); const b = rgDome(B, s.x, s.y, 40, g, { name: "LAMBDA COMPLEX", rgRoof: "lambda", mat: "metal", domeKind: "civic", imp: 3 }); rgRoomSpawn(B, b, cInt(r, 3, 5), 0.35); for (let k = 0; k < 2; k++) addSurf(B, "pool", Math.round((s.x + 30 + k * 16) * 2), Math.round((s.y - 30) * 2), Math.round((s.x + 42 + k * 16) * 2), Math.round((s.y - 14) * 2)); };
RGW_G.radar = function (B, s, r) { const g = rgGate(s, r); rgOccDisc(s.x, s.y, 30, 6); for (let k = 0; k < 3; k++) rgP(B, "rgdish", s.x - 18 + k * 18, s.y - 6, 8, 8, FS_TALL, { ang: r() * 6.28 }); rgBox(B, "rgbox", s.x, s.y + 14, 12, 8, g, { name: "RADAR STATION", mat: "metal" }); };
RGW_G.xen = function (B, s, r) { rgOccDisc(s.x, s.y, 20, 6); rgP(B, "rgportal", s.x, s.y, 12, 12, FS_NONE); rgScatter(B, r, s.x, s.y, 6, 20, cInt(r, 6, 10), (x, y) => rgP(B, "rgcrystal", x, y, 1.6, 1.6, FS_COVER, { v: Math.floor(r() * 3) }), 1.6); rgGuard(B, s.x, s.y, cInt(r, 3, 5), undefined, { heavy: 0.3 }); };
RGW_G.osprey = function (B, s, r) { const a = r() * 6.28; rgOccDisc(s.x, s.y, 14, 6); rgShip(B, "osprey", s.x, s.y, a, { wreck: 1 }); rgScatter(B, r, s.x, s.y, 10, 24, 5, (x, y) => rgP(B, "rgjunk", x, y, 2, 1.6, FS_COVER, { v: 2 }), 2); };
RGW_G.ranchmesa = function (B, s, r) { const g = rgGate(s, r); rgOccDisc(s.x, s.y, 50, 6); const h = rgBox(B, "house", s.x, s.y, 16, 11, g, { mat: "wood", roof: "gable", spec: { mw: 32, gw: 0, gh: 0, garage: false } }); rgBox(B, "barn", s.x + 22, s.y - 12, 16, 12, g, { kind: "barn", name: "BARN", mat: "wood", roof: "gable" }); rgP(B, "rgwindpump", s.x - 18, s.y - 14, 3, 3, FS_COVER); rgFenceRect(B, "wood", s.x - 40, s.y + 14, s.x - 10, s.y + 36, g, 4); if (r() < 0.3) rgRoomSpawn(B, h, 1, 0.1); };

/* --- THE CONTINENT --------------------------------------------------------------------- */
RGW_G.keep = function (B, s, r) {   // a hill keep: curtain wall, corner towers, the keep, stables and a well
  const g = rgGate(s, r), [gx, gy] = RG_DIR[g], H = 44;
  rgOccDisc(s.x, s.y, 75, 6);
  rgFenceRect(B, "stone", s.x - H, s.y - H, s.x + H, s.y + H, g, 8);
  for (const [qx, qy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) rgDome(B, s.x + qx * H, s.y + qy * H, 10, g, { name: "", rgRoof: "cone", mat: "stone" });
  const k = rgBox(B, "civic", s.x - gx * 12, s.y - gy * 12, 30, 24, g, { kind: "council", name: (s.name || "KEEP").toUpperCase(), mat: "stone", roof: "hip", imp: 2 });
  rgRoomSpawn(B, k, cInt(r, 3, 5), 0.3);
  rgBox(B, "barn", s.x + gx * 20 + gy * 22, s.y + gy * 20 - gx * 22, 16, 9, g, { kind: "barn", name: "STABLES", mat: "wood" });
  rgP(B, "rgwell", s.x + gx * 22 - gy * 18, s.y + gy * 22 + gx * 18, 3, 3, FS_COVER);
  rgGuard(B, s.x + gx * (H + 6), s.y + gy * (H + 6), cInt(r, 2, 4), undefined, { heavy: 0.25 });
};
RGW_G.windmill = function (B, s, r) { const g = rgGate(s, r); rgOccDisc(s.x, s.y, 40, 6); rgPoly(B, "rgwindmill", rgDiscPoly(s.x, s.y, 4, 10), FS_TALL, { seed: Math.floor(r() * 1e9) }); rgBox(B, "cabin", s.x + RG_DIR[g][0] * 14, s.y + RG_DIR[g][1] * 14, 10, 8, g, { kind: "cabin", mat: "wood", roof: "gable", name: "MILLER'S HOUSE" }); for (let k = 0; k < 2; k++) addSurf(B, "crop", Math.round((s.x - 50 + k * 54) * 2), Math.round((s.y + 22) * 2), Math.round((s.x - 2 + k * 54) * 2), Math.round((s.y + 60) * 2), k * 2 + 1); };
RGW_G.bog = function (B, s, r) {   // Crookback Bog: black pools, dead trees, a crooked hut
  for (let k = 0; k < cInt(r, 7, 12); k++) { const a = r() * 6.28, d = cRange(r, 0, 220); rgWater(B, s.x + Math.cos(a) * d, s.y + Math.sin(a) * d, cRange(r, 8, 26), cRange(r, 6, 18)); }
  for (let k = 0; k < 40; k++) { const a = r() * 6.28, d = cRange(r, 10, 260), x = s.x + Math.cos(a) * d, y = s.y + Math.sin(a) * d; if (rgOccDiscFree(x, y, 1.5)) { rgOccDisc(x, y, 1, 5); addProp(B, "tree", Math.round(x * 2), Math.round(y * 2), 1, 1, FS_COVER, { v: 3, sz: 0.8 + r() * 0.6, dead: 1 }); } }
  const hx = s.x + cRange(r, -60, 60), hy = s.y + cRange(r, -60, 60);
  if (rgOccFree(hx - 8, hy - 7, hx + 8, hy + 7)) { const h = rgBox(B, "cabin", hx, hy, 11, 8, "S", { kind: "cabin", mat: "wood", roof: "gable", name: "CRONES' HUT" }); rgRoomSpawn(B, h, cInt(r, 1, 2), 0.4, { ros: "witcher_foes", elite: 1 }); }
  rgPatrol(B, s.x, s.y, 80, cInt(r, 3, 5), "witcher_foes");
};
RGW_G.nest = function (B, s, r) { rgOccDisc(s.x, s.y, 16, 6); rgP(B, "rgbones", s.x, s.y, 22, 22, FS_NONE, { seed: Math.floor(r() * 1e9) }); rgGuard(B, s.x, s.y, cInt(r, 3, 6), "witcher_foes", { heavy: 0.25 }); };
RGW_G.inn = function (B, s, r) { const g = rgGate(s, r), [gx, gy] = RG_DIR[g]; rgOccDisc(s.x, s.y, 40, 6); const b = rgBox(B, "commercial", s.x, s.y, 20, 14, g, { kind: "bar", name: "CROSSROADS INN", mat: "wood", roof: "gable" }); rgBox(B, "barn", s.x + gy * 20, s.y - gx * 20, 14, 9, g, { kind: "barn", name: "STABLE", mat: "wood" }); rgP(B, "rgwell", s.x + gx * 16 - gy * 12, s.y + gy * 16 + gx * 12, 3, 3, FS_COVER); addProp(B, "cart", Math.round((s.x - gy * 18) * 2), Math.round((s.y + gx * 18) * 2), 4, 6, FS_COVER); if (r() < 0.5) rgRoomSpawn(B, b, cInt(r, 2, 3), 0.15); };
RGW_G.ruin = function (B, s, r) { rgOccDisc(s.x, s.y, 30, 6); for (let k = 0; k < 9; k++) { const a = r() * 6.28, d = cRange(r, 4, 22), x = s.x + Math.cos(a) * d, y = s.y + Math.sin(a) * d, L = cRange(r, 4, 10), T = v => Math.round(v * 2); if (r() < 0.5) addFence(B, "stone", T(x), T(y), T(x + L), T(y)); else addFence(B, "stone", T(x), T(y), T(x), T(y + L)); } rgScatter(B, r, s.x, s.y, 2, 20, 6, (x, y) => rgPoly(B, "rgpillar", rgDiscPoly(x, y, 0.8, 8), FS_TALL, {}), 2); if (r() < 0.6) rgGuard(B, s.x, s.y, cInt(r, 2, 4), "witcher_foes"); };
RGW_G.farm = function (B, s, r) { const g = rgGate(s, r), [gx, gy] = RG_DIR[g]; rgOccDisc(s.x, s.y, 40, 6); const h = rgBox(B, "cabin", s.x + gx * 8, s.y + gy * 8, 11, 8, g, { kind: "cabin", mat: "wood", roof: "gable" }); rgBox(B, "barn", s.x - gx * 14 + gy * 14, s.y - gy * 14 - gx * 14, 16, 11, g, { kind: "barn", name: "BARN", mat: "wood" }); for (let k = 0; k < 3; k++) addSurf(B, "crop", Math.round((s.x - 80 + k * 52) * 2), Math.round((s.y + 30) * 2), Math.round((s.x - 32 + k * 52) * 2), Math.round((s.y + 90) * 2), (k + 1) & 3); rgScatter(B, r, s.x, s.y, 24, 34, 4, (x, y) => addProp(B, "haybale", Math.round(x * 2), Math.round(y * 2), 3, 3, FS_COVER), 2); if (r() < 0.3) rgRoomSpawn(B, h, 1, 0.1); };

/* --- THE HIGHLANDS --------------------------------------------------------------------- */
RGW_G.castle = function (B, s, r) {   // the castle on the loch: great hall, towers with conical roofs, courtyards, the boathouse
  const g = rgGate(s, r), [gx, gy] = RG_DIR[g], ox = -gy, oy = gx;
  rgOccDisc(s.x, s.y, 170, 6);
  rgWater(B, s.x - gx * 230, s.y - gy * 230, 120, 110);
  const hall = rgBox(B, "church", s.x, s.y, 50, 22, g, { kind: "church", name: "GREAT HALL", mat: "stone", roof: "gable", imp: 3 });
  rgRoomSpawn(B, hall, cInt(r, 4, 6), 0.3);
  const wing = (dx, dy, w, h, nm) => { const b = rgBox(B, "civic", s.x + dx, s.y + dy, w, h, g, { kind: "school", name: nm, mat: "stone", roof: "gable" }); if (r() < 0.6) rgRoomSpawn(B, b, cInt(r, 2, 4), 0.25); };
  wing(ox * 50 - gx * 10, oy * 50 - gy * 10, 40, 26, "CLASSROOM WING"); wing(-ox * 50 - gx * 10, -oy * 50 - gy * 10, 40, 26, "LIBRARY WING");
  wing(-gx * 52, -gy * 52, 46, 24, "DUNGEONS");
  const towers = [[ox * 80, oy * 80, 16, "GRYFFINDOR TOWER"], [-ox * 80, -oy * 80, 14, "RAVENCLAW TOWER"], [ox * 30 - gx * 86, oy * 30 - gy * 86, 18, "ASTRONOMY TOWER"], [-ox * 34 + gx * 34, -oy * 34 + gy * 34, 12, "CLOCK TOWER"], [ox * 30 + gx * 36, oy * 30 + gy * 36, 12, ""]];
  for (const [dx, dy, D, nm] of towers) rgDome(B, s.x + dx, s.y + dy, D, g, { name: nm, rgRoof: "cone", mat: "stone" });
  rgRing(B, s.x + gx * 60, s.y + gy * 60, 24, 1.4, [{ a: RG_ANG[g], w: 6 }, { a: RG_ANG[g] + Math.PI, w: 6 }], "low");
  rgBox(B, "barn", s.x - gx * 120 + ox * 40, s.y - gy * 120 + oy * 40, 16, 10, g, { kind: "barn", name: "BOATHOUSE", mat: "stone" });
  rgPatrol(B, s.x + gx * 60, s.y + gy * 60, 30, cInt(r, 3, 5), undefined, { heavy: 0.3 });
};
RGW_G.hagrid = function (B, s, r) { rgOccDisc(s.x, s.y, 24, 6); rgDome(B, s.x, s.y, 9, rgCard(r() * 6.28), { name: "HAGRID'S HUT", mat: "stone", rgRoof: "cone" }); rgScatter(B, r, s.x + 14, s.y + 4, 2, 8, cInt(r, 6, 10), (x, y) => rgP(B, "rgpumpkin", x, y, 1.4, 1.4, FS_COVER, { v: Math.floor(r() * 3) }), 1.4); };
RGW_G.pitch = function (B, s, r) { rgOccDisc(s.x, s.y, 85, 6); rgRing(B, s.x, s.y, 72, 5, [{ a: 0, w: 10 }, { a: Math.PI, w: 10 }], "stand"); rgP(B, "rgpitch", s.x, s.y, 128, 128, FS_NONE, { r: 64 }); for (const sd of [-1, 1]) for (let k = -1; k <= 1; k++) rgPoly(B, "rghoop", rgDiscPoly(s.x + sd * 52, s.y + k * 5, 0.6, 6), FS_COVER, { big: k === 0 }); };
RGW_G.willow = function (B, s, r) { rgOccDisc(s.x, s.y, 16, 6); rgPoly(B, "rgwillow", rgDiscPoly(s.x, s.y, 2, 9), FS_TALL, { seed: Math.floor(r() * 1e9) }); };
RGW_G.loch = function (B, s, r) { for (let k = 0; k < cInt(r, 3, 5); k++) { const a = r() * 6.28, d = k ? cRange(r, 60, 160) : 0; rgWater(B, s.x + Math.cos(a) * d, s.y + Math.sin(a) * d, cRange(r, 80, 160), cRange(r, 50, 110)); } };
RGW_G.croft = function (B, s, r) { const g = rgGate(s, r); rgOccDisc(s.x, s.y, 36, 6); const h = rgBox(B, "rgbox", s.x, s.y, 13, 7, g, { name: "", mat: "stone", roof: "gable" }); rgFenceRect(B, "stone", s.x - 30, s.y - 24, s.x + 30, s.y + 24, g, 4); for (let k = 0; k < cInt(r, 4, 9); k++) rgP(B, "rgsheep", s.x + cRange(r, -26, 26), s.y + cRange(r, 10, 20) * (r() < 0.5 ? -1 : 1), 1.4, 0.9, FS_COVER, { ang: r() * 6.28 }); if (r() < 0.25) rgRoomSpawn(B, h, 1, 0.1); };
RGW_G.standing = function (B, s, r) { const n = cInt(r, 9, 13); rgOccDisc(s.x, s.y, 20, 6); for (let k = 0; k < n; k++) { const a = k / n * 6.28; rgPoly(B, "rgstone", rgRectPoly(s.x + Math.cos(a) * 12, s.y + Math.sin(a) * 12, 2.2, 1.2, a), FS_TALL, {}); } rgP(B, "rgaltar", s.x, s.y, 3, 2, FS_LOW); };
RGW_G.lair = function (B, s, r) { rgOccDisc(s.x, s.y, 24, 6); rgP(B, "rgweb", s.x, s.y, 40, 40, FS_NONE, { seed: Math.floor(r() * 1e9) }); rgGuard(B, s.x, s.y, cInt(r, 4, 7), "arachnids", { heavy: 0.25 }); };
// EOF part 1 (regionworlds.js continues)

/* --- props ---------------------------------------------------------------------------------- */
const RGW_A = RG_ART;
const RGW_C0 = (p) => [(p.x + p.w / 2) * 16, (p.y + p.h / 2) * 16];
["rgminemouth", "rgrail", "rgspiceplume", "rgworm", "rghive", "rgstage", "rgcrater", "rgportal", "rgpad", "rgbones", "rgweb", "rgpitch"].forEach(k => RG_FLOOR.add(k));
RGW_A.rgobelisk = function (g, p) { const pts = p.pg.map(q => [q[0] * 16, q[1] * 16]); let cx = 0, cy = 0; for (const q of pts) { cx += q[0]; cy += q[1]; } cx /= 4; cy /= 4; g.strokeStyle = "rgba(30,16,4,0.3)"; g.lineWidth = 22; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + 70, cy + 84); g.stroke(); g.fillStyle = "#c8a868"; rgPath2(g, pts); g.fill(); g.fillStyle = "#e8cc88"; g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); g.lineTo(cx, cy); g.lineTo(pts[1][0], pts[1][1]); g.fill(); g.fillStyle = "#d4a537"; g.beginPath(); g.arc(cx, cy, 4, 0, 7); g.fill(); };
RGW_A.rgobeliskdown = function (g, p) { const [cx, cy] = RGW_C0(p); g.save(); g.translate(cx, cy); g.rotate(p.ang || 0); g.fillStyle = "rgba(30,16,4,0.25)"; g.fillRect(-100, -10, 210, 30); g.fillStyle = "#c8a868"; g.fillRect(-104, -18, 200, 36); g.fillStyle = "#d4a537"; g.beginPath(); g.moveTo(96, -18); g.lineTo(118, 0); g.lineTo(96, 18); g.fill(); g.fillStyle = "rgba(0,0,0,0.15)"; for (let k = -90; k < 90; k += 22) g.fillRect(k, -12, 10, 6); g.restore(); };
RGW_A.rgdhd = function (g, p) { const [cx, cy] = RGW_C0(p); g.fillStyle = "rgba(0,0,0,0.25)"; g.beginPath(); g.arc(cx + 6, cy + 8, 24, 0, 7); g.fill(); g.fillStyle = "#8a7a5a"; g.beginPath(); g.arc(cx, cy, 24, 0, 7); g.fill(); g.fillStyle = "#c8b080"; for (let k = 0; k < 9; k++) { const a = k / 9 * 6.28; g.beginPath(); g.arc(cx + Math.cos(a) * 15, cy + Math.sin(a) * 15, 4, 0, 7); g.fill(); } g.fillStyle = "#ff5a2a"; g.beginPath(); g.arc(cx, cy, 7, 0, 7); g.fill(); };
RGW_A.rgstargate = RGW_A.rgdhd;
RGW_A.rgmastadge = function (g, p) { const [cx, cy] = RGW_C0(p); g.save(); g.translate(cx, cy); g.rotate(p.ang || 0); g.fillStyle = "rgba(20,10,0,0.25)"; g.beginPath(); g.ellipse(10, 12, 44, 24, 0, 0, 7); g.fill(); g.fillStyle = "#7a5a3a"; g.beginPath(); g.ellipse(0, 0, 42, 22, 0, 0, 7); g.fill(); g.strokeStyle = "#5a4028"; g.lineWidth = 2; for (let k = -34; k < 32; k += 5) { g.beginPath(); g.moveTo(k, -18); g.lineTo(k + 2, 18); g.stroke(); } g.fillStyle = "#c8b08a"; g.fillRect(-14, -20, 22, 40); g.fillStyle = "#5a4028"; g.beginPath(); g.ellipse(44, 0, 12, 10, 0, 0, 7); g.fill(); g.restore(); };
RGW_A.rgminemouth = function (g, p) { const [cx, cy] = RGW_C0(p); const gr = g.createRadialGradient(cx, cy, 6, cx, cy, p.w * 9); gr.addColorStop(0, "#0a0806"); gr.addColorStop(0.6, "#2a1e14"); gr.addColorStop(1, "rgba(40,30,20,0)"); g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, p.w * 9, 0, 7); g.fill(); g.strokeStyle = "#6a4a2a"; g.lineWidth = 8; g.beginPath(); g.arc(cx, cy, p.w * 6, 3.6, 5.8); g.stroke(); };
RGW_A.rgrail = function (g, p) { const [cx, cy] = RGW_C0(p), L = (p.len || 30) * 32; g.save(); g.translate(cx, cy); g.rotate(p.ang || 0); g.fillStyle = "#5a4630"; for (let x = -L / 2; x < L / 2; x += 20) g.fillRect(x, -26, 8, 52); g.fillStyle = "#8a8e94"; g.fillRect(-L / 2, -18, L, 4); g.fillRect(-L / 2, 14, L, 4); g.restore(); };
RGW_A.rgcart = function (g, p) { const [cx, cy] = RGW_C0(p); g.save(); g.translate(cx, cy); g.rotate(p.ang || 0); g.fillStyle = "#4a4a4e"; g.fillRect(-36, -26, 72, 52); g.fillStyle = "#6a5a4a"; g.fillRect(-30, -20, 60, 40); g.fillStyle = "#8a7a5a"; for (let k = 0; k < 6; k++) { g.beginPath(); g.arc(-20 + (k % 3) * 20, -8 + Math.floor(k / 3) * 16, 7, 0, 7); g.fill(); } g.restore(); };
RGW_A.rgcow = function (g, p) { const [cx, cy] = RGW_C0(p); g.save(); g.translate(cx, cy); g.rotate(p.ang || 0); g.fillStyle = "rgba(20,10,0,0.22)"; g.beginPath(); g.ellipse(6, 7, 38, 18, 0, 0, 7); g.fill(); g.fillStyle = p.v ? "#6a4a2e" : "#e8e2d8"; g.beginPath(); g.ellipse(0, 0, 36, 17, 0, 0, 7); g.fill(); if (!p.v) { g.fillStyle = "#2a2420"; g.beginPath(); g.ellipse(-10, -4, 9, 6, 0.4, 0, 7); g.ellipse(12, 6, 7, 5, 0, 0, 7); g.fill(); } g.fillStyle = p.v ? "#4a3420" : "#d8d0c4"; g.beginPath(); g.ellipse(38, 0, 10, 9, 0, 0, 7); g.fill(); g.restore(); };
RGW_A.rgsheep = function (g, p) { const [cx, cy] = RGW_C0(p); g.save(); g.translate(cx, cy); g.rotate(p.ang || 0); g.fillStyle = "rgba(20,10,0,0.2)"; g.beginPath(); g.ellipse(4, 5, 22, 13, 0, 0, 7); g.fill(); g.fillStyle = "#ecebe2"; for (let k = 0; k < 7; k++) { g.beginPath(); g.arc(-12 + (k % 4) * 8, -5 + Math.floor(k / 4) * 10, 8, 0, 7); g.fill(); } g.fillStyle = "#2a2420"; g.beginPath(); g.ellipse(22, 0, 6, 5, 0, 0, 7); g.fill(); g.restore(); };
RGW_A.rgwatertower = function (g, p) { const [cx, cy] = RGW_C0(p); g.fillStyle = "rgba(30,16,4,0.28)"; g.beginPath(); g.ellipse(cx + 60, cy + 70, 34, 30, 0.6, 0, 7); g.fill(); g.strokeStyle = "#5a4630"; g.lineWidth = 5; for (const [dx, dy] of [[-24, -24], [24, -24], [24, 24], [-24, 24]]) { g.beginPath(); g.moveTo(cx + dx, cy + dy); g.lineTo(cx + dx * 0.4, cy + dy * 0.4); g.stroke(); } g.fillStyle = "#8a6a48"; g.beginPath(); g.arc(cx, cy, 30, 0, 7); g.fill(); g.fillStyle = "#6a5038"; g.beginPath(); g.arc(cx, cy, 24, 0, 7); g.fill(); g.strokeStyle = "#4a3828"; g.lineWidth = 2; for (let k = 0; k < 8; k++) { g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(k * 0.785) * 24, cy + Math.sin(k * 0.785) * 24); g.stroke(); } };
RGW_A.rgwindpump = function (g, p) { const [cx, cy] = RGW_C0(p); g.strokeStyle = "rgba(30,16,4,0.3)"; g.lineWidth = 4; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + 80, cy + 96); g.stroke(); g.strokeStyle = "#7a7f86"; g.lineWidth = 3; for (let k = 0; k < 12; k++) { const a = k / 12 * 6.28; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a) * 26, cy + Math.sin(a) * 26); g.stroke(); } g.strokeStyle = "#a8aeb4"; g.beginPath(); g.arc(cx, cy, 26, 0, 7); g.stroke(); g.fillStyle = "#c0392b"; g.fillRect(cx + 4, cy - 3, 30, 6); };
RGW_A.rgwindtrap = function (g, p) { const [cx, cy] = RGW_C0(p); g.fillStyle = "rgba(30,16,4,0.3)"; g.beginPath(); g.ellipse(cx + 50, cy + 60, 26, 22, 0.6, 0, 7); g.fill(); g.fillStyle = "#8a7a62"; g.beginPath(); g.arc(cx, cy, 24, 0, 7); g.fill(); g.strokeStyle = "#5a4a32"; g.lineWidth = 3; for (let a = 0; a < 6.28; a += 0.52) { g.beginPath(); g.moveTo(cx + Math.cos(a) * 8, cy + Math.sin(a) * 8); g.lineTo(cx + Math.cos(a) * 24, cy + Math.sin(a) * 24); g.stroke(); } g.fillStyle = "#3a6ab0"; g.beginPath(); g.arc(cx, cy, 6, 0, 7); g.fill(); };
RGW_A.rgcistern = function (g, p) { const [cx, cy] = RGW_C0(p), R = p.w * 8; g.fillStyle = "rgba(0,0,0,0.25)"; g.beginPath(); g.arc(cx + 8, cy + 10, R, 0, 7); g.fill(); g.fillStyle = "#a8885a"; g.beginPath(); g.arc(cx, cy, R, 0, 7); g.fill(); g.fillStyle = "#2a6a8a"; g.beginPath(); g.arc(cx, cy, R * 0.7, 0, 7); g.fill(); };
RGW_A.rgthumper = function (g, p) { const [cx, cy] = RGW_C0(p); g.strokeStyle = "rgba(30,16,4,0.3)"; g.lineWidth = 5; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + 40, cy + 48); g.stroke(); g.fillStyle = "#6a5a46"; g.beginPath(); g.arc(cx, cy, 8, 0, 7); g.fill(); g.fillStyle = "#c8a060"; g.beginPath(); g.arc(cx, cy, 4, 0, 7); g.fill(); g.strokeStyle = crA("#6a4a2a", 0.35); g.lineWidth = 2; for (const k of [20, 34, 50]) { g.beginPath(); g.arc(cx, cy, k, 0, 7); g.stroke(); } };
RGW_A.rgworm = function (g, p) { const [cx, cy] = RGW_C0(p), r = cRng(p.seed || 3); g.save(); g.lineCap = "round"; let x = cx - 1600, y = cy + (r() - 0.5) * 600, a = (r() - 0.5) * 0.6; const pts = []; for (let k = 0; k < 40; k++) { pts.push([x, y]); a += (r() - 0.5) * 0.35; x += Math.cos(a) * 90; y += Math.sin(a) * 90; } for (const [w, col] of [[230, "rgba(90,50,20,0.16)"], [150, "rgba(255,230,190,0.18)"], [70, "rgba(90,50,20,0.22)"]]) { g.strokeStyle = col; g.lineWidth = w; g.beginPath(); pts.forEach((q, i) => i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1])); g.stroke(); } g.restore(); };
RGW_A.rgspiceplume = function (g, p) { const [cx, cy] = RGW_C0(p); const gr = g.createRadialGradient(cx, cy, 10, cx, cy, p.w * 8); gr.addColorStop(0, "rgba(230,110,30,0.45)"); gr.addColorStop(1, "rgba(230,110,30,0)"); g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, p.w * 8, 0, 7); g.fill(); };
RGW_A.rgantenna = function (g, p) { const [cx, cy] = RGW_C0(p), big = p.big ? 2 : 1; g.strokeStyle = "rgba(0,0,0,0.3)"; g.lineWidth = 4; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + 90 * big, cy + 108 * big); g.stroke(); g.strokeStyle = "#8a9096"; g.lineWidth = 3; g.beginPath(); for (const [dx, dy] of [[-14, -14], [14, -14], [14, 14], [-14, 14]]) { g.moveTo(cx, cy); g.lineTo(cx + dx * big, cy + dy * big); } g.stroke(); g.fillStyle = "#c0c6cc"; g.beginPath(); g.arc(cx, cy, 6 * big, 0, 7); g.fill(); g.fillStyle = "#ff3b3b"; g.beginPath(); g.arc(cx, cy, 2.5, 0, 7); g.fill(); };
RGW_A.rgdish = function (g, p) { const [cx, cy] = RGW_C0(p), R = p.w * 8; g.fillStyle = "rgba(0,0,0,0.28)"; g.beginPath(); g.ellipse(cx + 30, cy + 36, R, R * 0.8, 0.6, 0, 7); g.fill(); g.fillStyle = "#d8dce0"; g.beginPath(); g.arc(cx, cy, R, 0, 7); g.fill(); g.fillStyle = "#b0b6bc"; g.beginPath(); g.arc(cx + 4, cy + 4, R * 0.75, 0, 7); g.fill(); g.strokeStyle = "#8a9096"; g.lineWidth = 3; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(p.ang || 0) * R * 0.9, cy + Math.sin(p.ang || 0) * R * 0.9); g.stroke(); };
RGW_A.rgcrystal = function (g, p) { const [cx, cy] = RGW_C0(p), c = ["#7dff6a", "#4ae0c8", "#c8ff4a"][p.v | 0]; g.save(); g.shadowColor = c; g.shadowBlur = 14; g.fillStyle = c; for (let k = 0; k < 4; k++) { const a = k * 1.57 + 0.4; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a - 0.25) * 22, cy + Math.sin(a - 0.25) * 22); g.lineTo(cx + Math.cos(a) * 30, cy + Math.sin(a) * 30); g.lineTo(cx + Math.cos(a + 0.25) * 22, cy + Math.sin(a + 0.25) * 22); g.fill(); } g.restore(); };
RGW_A.rgportal = function (g, p) { const [cx, cy] = RGW_C0(p), R = p.w * 8; for (let k = 5; k > 0; k--) { g.fillStyle = "rgba(" + (60 + k * 20) + ",255," + (100 + k * 25) + "," + (0.06 * k) + ")"; g.beginPath(); g.arc(cx, cy, R * k / 5, 0, 7); g.fill(); } g.strokeStyle = "rgba(160,255,200,0.6)"; g.lineWidth = 3; for (let k = 0; k < 3; k++) { g.beginPath(); g.arc(cx, cy, R * (0.3 + k * 0.25), k, k + 4); g.stroke(); } };
RGW_A.rgegg = function (g, p) { const [cx, cy] = RGW_C0(p); g.fillStyle = "rgba(0,0,0,0.3)"; g.beginPath(); g.ellipse(cx + 4, cy + 5, 15, 12, 0, 0, 7); g.fill(); g.fillStyle = "#6a6a52"; g.beginPath(); g.ellipse(cx, cy, 14, 12, 0, 0, 7); g.fill(); g.strokeStyle = "#3a3a2a"; g.lineWidth = 2; g.beginPath(); g.moveTo(cx - 8, cy - 4); g.lineTo(cx, cy); g.lineTo(cx + 8, cy - 4); g.moveTo(cx, cy); g.lineTo(cx, cy + 9); g.stroke(); };
RGW_A.rghive = function (g, p) { const [cx, cy] = RGW_C0(p), R = p.w * 8, r = cRng(p.seed || 9); const gr = g.createRadialGradient(cx, cy, 10, cx, cy, R); gr.addColorStop(0, "rgba(20,24,22,0.85)"); gr.addColorStop(0.7, "rgba(30,36,30,0.55)"); gr.addColorStop(1, "rgba(30,36,30,0)"); g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, R, 0, 7); g.fill(); g.strokeStyle = "rgba(90,110,90,0.35)"; g.lineWidth = 4; for (let k = 0; k < 26; k++) { const a = r() * 6.28, d = r() * R * 0.8; g.beginPath(); g.moveTo(cx + Math.cos(a) * d, cy + Math.sin(a) * d); g.quadraticCurveTo(cx + Math.cos(a + 0.4) * (d + 60), cy + Math.sin(a + 0.4) * (d + 60), cx + Math.cos(a + 0.2) * (d + 120), cy + Math.sin(a + 0.2) * (d + 120)); g.stroke(); } };
RGW_A.rgpipe = function (g, p) { const [cx, cy] = RGW_C0(p); g.save(); g.translate(cx, cy); g.rotate(p.ang || 0); g.fillStyle = "rgba(0,0,0,0.25)"; g.fillRect(-150, 4, 310, 30); g.fillStyle = "#7a8086"; g.fillRect(-160, -16, 320, 32); g.fillStyle = "#a8aeb4"; g.fillRect(-160, -12, 320, 6); g.fillStyle = "#f2c200"; for (let k = -150; k < 160; k += 60) g.fillRect(k, -16, 8, 32); g.restore(); };
RGW_A.rgstage = function (g, p) { const [cx, cy] = RGW_C0(p), S = p.w * 16; g.fillStyle = "rgba(0,0,0,0.25)"; g.fillRect(cx - S / 2 + 14, cy - S / 2 + 18, S, S); g.fillStyle = crPat("flag", "#d8d2c4"); g.fillRect(cx - S / 2, cy - S / 2, S, S); g.strokeStyle = "#8a8478"; g.lineWidth = 8; g.strokeRect(cx - S / 2, cy - S / 2, S, S); g.fillStyle = "#f2f0ea"; g.fillRect(cx - S / 2 + 4, cy - S / 2 + 4, S - 8, 8); };
RGW_A.rgcrater = function (g, p) { const [cx, cy] = RGW_C0(p), R = p.w * 8; const gr = g.createRadialGradient(cx - R * 0.15, cy - R * 0.15, R * 0.1, cx, cy, R); gr.addColorStop(0, "rgba(60,40,24,0.55)"); gr.addColorStop(0.75, "rgba(80,60,40,0.3)"); gr.addColorStop(0.9, "rgba(255,240,210,0.25)"); gr.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, R, 0, 7); g.fill(); };
RGW_A.rgpad = function (g, p) { const [cx, cy] = RGW_C0(p), R = p.r * 32; g.fillStyle = "#6a6e74"; g.beginPath(); g.arc(cx, cy, R, 0, 7); g.fill(); g.strokeStyle = "#f2c200"; g.lineWidth = 8; g.beginPath(); g.arc(cx, cy, R * 0.82, 0, 7); g.stroke(); g.fillStyle = "#f2f2f2"; g.font = "900 " + Math.round(R * 0.7) + "px sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("H", cx, cy + 4); };
RGW_A.rgflag = function (g, p) { const [cx, cy] = RGW_C0(p); g.strokeStyle = "#5a5f66"; g.lineWidth = 3; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + 60, cy + 72); g.stroke(); g.fillStyle = p.col || "#c62828"; g.fillRect(cx, cy - 18, 34, 20); g.fillStyle = "#fff"; g.font = "900 13px sans-serif"; g.fillText("RR", cx + 6, cy - 3); };
RGW_A.rgbeachchair = function (g, p) { const [cx, cy] = RGW_C0(p); g.fillStyle = "#e84a4a"; g.fillRect(cx - 14, cy - 7, 28, 14); g.fillStyle = "#fff"; for (let k = -10; k < 14; k += 8) g.fillRect(cx + k, cy - 7, 3, 14); };
RGW_A.rgwoodpile = function (g, p) { const [cx, cy] = RGW_C0(p); for (let k = 0; k < 7; k++) { g.fillStyle = k & 1 ? "#8a6440" : "#6a4a2e"; g.beginPath(); g.arc(cx - 18 + k * 6, cy - 4 + (k % 3) * 4, 6, 0, 7); g.fill(); g.fillStyle = "#c8a070"; g.beginPath(); g.arc(cx - 18 + k * 6, cy - 4 + (k % 3) * 4, 3, 0, 7); g.fill(); } };
RGW_A.rgwindmill = function (g, p) { const pts = p.pg.map(q => [q[0] * 16, q[1] * 16]); let cx = 0, cy = 0; for (const q of pts) { cx += q[0]; cy += q[1]; } cx /= pts.length; cy /= pts.length; g.fillStyle = "rgba(30,16,4,0.28)"; g.beginPath(); g.arc(cx + 50, cy + 60, 70, 0, 7); g.fill(); g.fillStyle = "#d8cfb8"; rgPath2(g, pts); g.fill(); g.fillStyle = "#8a6a44"; g.beginPath(); g.arc(cx, cy, 52, 0, 7); g.fill(); g.fillStyle = "#6a4e30"; g.beginPath(); g.arc(cx, cy, 40, 0, 7); g.fill(); const a0 = ((p.seed || 0) % 100) / 100; g.save(); g.translate(cx, cy); g.rotate(a0); for (let k = 0; k < 4; k++) { g.rotate(1.5708); g.fillStyle = "#5a4630"; g.fillRect(-4, 0, 8, 190); g.fillStyle = "rgba(240,232,210,0.9)"; g.fillRect(4, 40, 34, 150); g.strokeStyle = "#5a4630"; g.lineWidth = 1.5; for (let y = 50; y < 190; y += 20) { g.beginPath(); g.moveTo(4, y); g.lineTo(38, y); g.stroke(); } } g.restore(); g.fillStyle = "#3a2a1a"; g.beginPath(); g.arc(cx, cy, 9, 0, 7); g.fill(); };
RGW_A.rgbones = function (g, p) { const [cx, cy] = RGW_C0(p), r = cRng(p.seed || 4); g.fillStyle = "rgba(60,30,20,0.25)"; g.beginPath(); g.arc(cx, cy, p.w * 7, 0, 7); g.fill(); g.strokeStyle = "#e8dcc0"; g.lineCap = "round"; for (let k = 0; k < 22; k++) { const a = r() * 6.28, d = r() * p.w * 6, x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d, b = r() * 6.28; g.lineWidth = 3 + r() * 3; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(b) * 20, y + Math.sin(b) * 20); g.stroke(); } for (let k = 0; k < 3; k++) { g.fillStyle = "#e8dcc0"; g.beginPath(); g.arc(cx + (r() - 0.5) * 120, cy + (r() - 0.5) * 120, 8, 0, 7); g.fill(); } };
RGW_A.rgweb = function (g, p) { const [cx, cy] = RGW_C0(p), R = p.w * 8, r = cRng(p.seed || 8); g.strokeStyle = "rgba(240,240,236,0.45)"; g.lineWidth = 1.5; for (let k = 0; k < 14; k++) { const a = k / 14 * 6.28 + r() * 0.2; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); g.stroke(); } for (let q = 1; q < 8; q++) { g.beginPath(); for (let k = 0; k <= 14; k++) { const a = k / 14 * 6.28, rr = R * q / 8 * (0.9 + r() * 0.2); k ? g.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr) : g.moveTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); } g.stroke(); } };
RGW_A.rgpillar = function (g, p) { const pts = p.pg.map(q => [q[0] * 16, q[1] * 16]); let cx = 0, cy = 0; for (const q of pts) { cx += q[0]; cy += q[1]; } cx /= pts.length; cy /= pts.length; g.strokeStyle = "rgba(30,16,4,0.28)"; g.lineWidth = 22; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + 50, cy + 60); g.stroke(); g.fillStyle = "#b8b2a4"; rgPath2(g, pts); g.fill(); g.strokeStyle = "#8a847a"; g.lineWidth = 2; g.beginPath(); g.arc(cx, cy, 8, 0, 7); g.stroke(); };
RGW_A.rgstone = function (g, p) { const pts = p.pg.map(q => [q[0] * 16, q[1] * 16]); let cx = 0, cy = 0; for (const q of pts) { cx += q[0]; cy += q[1]; } cx /= 4; cy /= 4; g.fillStyle = "rgba(30,16,4,0.3)"; rgPath2(g, pts.map(q => [q[0] + 30, q[1] + 36])); g.fill(); g.fillStyle = "#7a7670"; rgPath2(g, pts); g.fill(); g.fillStyle = "#9a968e"; rgPath2(g, rgShade(pts, 0.7, cx - 3, cy - 4)); g.fill(); g.fillStyle = "rgba(90,130,60,0.35)"; g.beginPath(); g.arc(cx + 4, cy + 3, 5, 0, 7); g.fill(); };
RGW_A.rgaltar = function (g, p) { const X = p.x * 16, Y = p.y * 16, W = p.w * 16, H = p.h * 16; g.fillStyle = "rgba(0,0,0,0.25)"; g.fillRect(X + 6, Y + 8, W, H); g.fillStyle = "#8a867e"; g.fillRect(X, Y, W, H); g.fillStyle = "#a8a49c"; g.fillRect(X + 4, Y + 4, W - 8, H - 8); };
RGW_A.rgpumpkin = function (g, p) { const [cx, cy] = RGW_C0(p), R = 9 + (p.v | 0) * 3; g.fillStyle = "#e07a1a"; g.beginPath(); g.arc(cx, cy, R, 0, 7); g.fill(); g.strokeStyle = "#a8500a"; g.lineWidth = 1.5; for (let k = -1; k <= 1; k++) { g.beginPath(); g.ellipse(cx + k * R * 0.35, cy, R * 0.35, R, 0, 0, 7); g.stroke(); } g.fillStyle = "#3a6a2a"; g.fillRect(cx - 1.5, cy - R - 3, 3, 5); };
RGW_A.rghoop = function (g, p) { const pts = p.pg.map(q => [q[0] * 16, q[1] * 16]); let cx = 0, cy = 0; for (const q of pts) { cx += q[0]; cy += q[1]; } cx /= pts.length; cy /= pts.length; const R = p.big ? 30 : 22; g.strokeStyle = "rgba(0,0,0,0.25)"; g.lineWidth = 6; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + 140, cy + 170); g.stroke(); g.strokeStyle = "#d4a537"; g.lineWidth = 7; g.beginPath(); g.arc(cx, cy, R, 0, 7); g.stroke(); };
RGW_A.rgpitch = function (g, p) { const [cx, cy] = RGW_C0(p), R = p.r * 32; g.fillStyle = crPat("grass", "#5a9a48"); g.beginPath(); g.ellipse(cx, cy, R * 0.92, R * 0.6, 0, 0, 7); g.fill(); g.strokeStyle = "rgba(255,255,255,0.6)"; g.lineWidth = 6; g.beginPath(); g.ellipse(cx, cy, R * 0.86, R * 0.54, 0, 0, 7); g.stroke(); g.beginPath(); g.arc(cx, cy, R * 0.1, 0, 7); g.stroke(); };
RGW_A.rgwillow = function (g, p) { const pts = p.pg.map(q => [q[0] * 16, q[1] * 16]); let cx = 0, cy = 0; for (const q of pts) { cx += q[0]; cy += q[1]; } cx /= pts.length; cy /= pts.length; const r = cRng(p.seed || 6); g.fillStyle = "rgba(20,30,10,0.28)"; g.beginPath(); g.arc(cx + 60, cy + 70, 230, 0, 7); g.fill(); g.strokeStyle = "#4a3a24"; g.lineCap = "round"; for (let k = 0; k < 9; k++) { const a = k / 9 * 6.28 + r() * 0.3; g.lineWidth = 16 - k; g.beginPath(); g.moveTo(cx, cy); g.quadraticCurveTo(cx + Math.cos(a + 0.6) * 120, cy + Math.sin(a + 0.6) * 120, cx + Math.cos(a) * 230, cy + Math.sin(a) * 230); g.stroke(); } g.fillStyle = "rgba(70,110,50,0.55)"; for (let k = 0; k < 30; k++) { const a = r() * 6.28, d = 60 + r() * 170; g.beginPath(); g.arc(cx + Math.cos(a) * d, cy + Math.sin(a) * d, 26 + r() * 20, 0, 7); g.fill(); } g.fillStyle = "#3a2a18"; rgPath2(g, pts); g.fill(); };
RGW_A.rgcave = function (g, p) {   // a rock mass with the sietch hall hidden inside: the rock is painted round the hall and the cleft that leads to it
  const [hx, hy, hw, hh] = p.hole, a = p.gate || 0, cw = (p.cleft || 4) * 32;
  g.save(); g.beginPath(); g.rect(p.x * 16 - 600, p.y * 16 - 600, p.w * 16 + 1200, p.h * 16 + 1200);
  g.rect((hx - hw - 0.5) * 32, (hy - hh - 0.5) * 32, (hw * 2 + 1) * 32, (hh * 2 + 1) * 32);
  const c = Math.cos(a), sn = Math.sin(a), X = hx * 32, Y = hy * 32, L = Math.max(p.w, p.h) * 16 + 400;
  g.moveTo(X - sn * cw, Y + c * cw); g.lineTo(X + c * L - sn * cw, Y + sn * L + c * cw); g.lineTo(X + c * L + sn * cw, Y + sn * L - c * cw); g.lineTo(X + sn * cw, Y - c * cw); g.closePath();
  g.clip("evenodd");
  RG_ART.rgrock(g, p);
  g.restore();
};
RG_ROOF.rockroof = function (b) { const G = cityInterior(b), pad = 10, W = G.w * 16 + pad * 2, H = G.h * 16 + pad * 2, c = crCanvas(W, H), g = c.getContext("2d"), col = ((RG.P && RG.P.rocks && RG.P.rocks.col) || ["#8e6040"])[0]; g.fillStyle = crPat("rock", crSh(col, 0.05)); g.fillRect(0, 0, W, H); const gr = g.createLinearGradient(0, 0, W, H); gr.addColorStop(0, "rgba(255,240,220,0.2)"); gr.addColorStop(1, "rgba(30,15,5,0.3)"); g.fillStyle = gr; g.fillRect(0, 0, W, H); return { c, x0: b.x * 16 - pad, y0: b.y * 16 - pad, w: W, h: H, used: CR.frame, x1: b.x * 16 + W, y1: b.y * 16 + H }; };
// ships & vehicles for the other worlds
Object.assign(RG_SHIP_ART, {
  firefly(g) { g.fillStyle = "#8a7a62"; g.beginPath(); g.ellipse(0, 0, 360, 150, 0, 0, 7); g.fill(); g.fillStyle = "#a8967a"; g.beginPath(); g.ellipse(160, 0, 150, 90, 0, 0, 7); g.fill(); g.fillStyle = "#3a4a5a"; g.fillRect(260, -30, 60, 60); for (const s of [-1, 1]) { g.fillStyle = "#6a5a46"; g.fillRect(-330, s * 150 - 50, 140, 100); g.fillStyle = "#ff9a3a"; g.beginPath(); g.arc(-340, s * 150, 40, 0, 7); g.fill(); } g.fillStyle = "#ffb84a"; g.beginPath(); g.arc(-360, 0, 60, 0, 7); g.fill(); },
  transport(g) { g.fillStyle = "#7a8086"; g.fillRect(-340, -150, 680, 300); g.fillStyle = "#5a5f66"; g.fillRect(-300, -110, 520, 220); g.fillStyle = "#2a3a4a"; g.fillRect(260, -60, 60, 120); g.fillStyle = "#ffb84a"; g.fillRect(-350, -100, 20, 200); },
  harvester(g) { g.fillStyle = "#2e2a26"; g.fillRect(-560, -280, 1120, 90); g.fillRect(-560, 190, 1120, 90); g.fillStyle = "#8a6a40"; g.fillRect(-520, -200, 1040, 400); g.fillStyle = "#a8844e"; g.fillRect(-420, -150, 700, 300); g.fillStyle = "#5a4a36"; for (let k = -400; k < 280; k += 80) g.fillRect(k, -150, 10, 300); g.fillStyle = "#c86a2a"; g.beginPath(); g.moveTo(520, -200); g.lineTo(640, 0); g.lineTo(520, 200); g.fill(); },
  carryall(g) { g.fillStyle = "#6a6458"; g.fillRect(-400, -60, 800, 120); for (const s of [-1, 1]) { g.fillStyle = "#8a8070"; g.beginPath(); g.moveTo(-200, s * 60); g.lineTo(100, s * 60); g.lineTo(40, s * 210); g.lineTo(-260, s * 210); g.fill(); } g.fillStyle = "#3a4a5a"; g.fillRect(360, -30, 40, 60); },
  thopter(g) { g.fillStyle = "#8a7a62"; g.beginPath(); g.ellipse(0, 0, 160, 50, 0, 0, 7); g.fill(); g.fillStyle = "#3a4a5a"; g.beginPath(); g.ellipse(110, 0, 50, 30, 0, 0, 7); g.fill(); g.fillStyle = "rgba(200,190,160,0.75)"; for (const s of [-1, 1]) for (const k of [-1, 1]) { g.beginPath(); g.ellipse(k * 50, s * 120, 120, 28, s * k * 0.25, 0, 7); g.fill(); } },
  glider(g, v, L, W, p) { g.fillStyle = "#b8964a"; g.beginPath(); g.moveTo(130, 0); g.lineTo(-60, -130); g.lineTo(-90, -120); g.lineTo(-30, 0); g.lineTo(-90, 120); g.lineTo(-60, 130); g.closePath(); g.fill(); g.fillStyle = "#6a5a3a"; g.beginPath(); g.arc(40, 0, 34, 0, 7); g.fill(); g.fillStyle = "#3a8aa0"; g.beginPath(); g.arc(50, 0, 16, 0, 7); g.fill(); },
  dropship(g) { g.fillStyle = "#4a5246"; g.beginPath(); g.moveTo(300, 0); g.lineTo(120, -110); g.lineTo(-280, -120); g.lineTo(-300, 120); g.lineTo(120, 110); g.closePath(); g.fill(); g.fillStyle = "#2a3a4a"; g.fillRect(180, -30, 80, 60); for (const s of [-1, 1]) { g.fillStyle = "#3a4236"; g.fillRect(-140, s * 170 - 30, 200, 60); } g.fillStyle = "rgba(20,20,20,0.5)"; g.beginPath(); g.arc(-60, 40, 60, 0, 7); g.fill(); },
  apc(g) { g.fillStyle = "#5a5e4a"; g.fillRect(-150, -70, 300, 140); g.fillStyle = "#3a3e32"; g.fillRect(-150, -80, 300, 18); g.fillRect(-150, 62, 300, 18); g.fillStyle = "#7a7e6a"; g.beginPath(); g.arc(20, 0, 40, 0, 7); g.fill(); g.fillStyle = "#2a2e22"; g.fillRect(40, -6, 110, 12); },
  crawler(g) { g.fillStyle = "#2e2a26"; g.fillRect(-250, -140, 500, 44); g.fillRect(-250, 96, 500, 44); g.fillStyle = "#c8a832"; g.fillRect(-220, -100, 440, 200); g.fillStyle = "#3a4a5a"; g.fillRect(140, -60, 60, 120); },
  derelict(g) { g.save(); g.fillStyle = "#2a2622"; g.beginPath(); for (let i = 0; i <= 30; i++) { const a = Math.PI * (0.15 + 0.7 * i / 30); g.lineTo(Math.cos(a) * 1920, Math.sin(a) * 1920); } for (let i = 30; i >= 0; i--) { const a = Math.PI * (0.15 + 0.7 * i / 30); g.lineTo(Math.cos(a) * 1080, Math.sin(a) * 1080); } g.closePath(); g.fill(); g.strokeStyle = "#4a4238"; g.lineWidth = 14; for (let k = 0; k < 24; k++) { const a = Math.PI * (0.17 + 0.66 * k / 23); g.beginPath(); g.moveTo(Math.cos(a) * 1120, Math.sin(a) * 1120); g.lineTo(Math.cos(a) * 1880, Math.sin(a) * 1880); g.stroke(); } g.fillStyle = "#0e0c0a"; g.beginPath(); g.ellipse(0, 1500, 120, 60, 0, 0, 7); g.fill(); g.restore(); },
  osprey(g) { g.fillStyle = "#5a6050"; g.fillRect(-250, -40, 500, 80); g.fillRect(-40, -230, 80, 460); for (const s of [-1, 1]) { g.fillStyle = "#3a3e34"; g.beginPath(); g.arc(0, s * 230, 30, 0, 7); g.fill(); g.strokeStyle = "rgba(60,60,60,0.5)"; g.lineWidth = 10; g.beginPath(); g.arc(0, s * 230, 170, 0, 7); g.stroke(); } g.fillStyle = "#2a3a4a"; g.fillRect(190, -26, 50, 52); },
  plane(g) { g.fillStyle = "#e8ecf0"; g.beginPath(); g.ellipse(0, 0, 540, 58, 0, 0, 7); g.fill(); g.beginPath(); g.moveTo(80, -40); g.lineTo(-60, -470); g.lineTo(-150, -470); g.lineTo(-80, -40); g.moveTo(80, 40); g.lineTo(-60, 470); g.lineTo(-150, 470); g.lineTo(-80, 40); g.fill(); g.beginPath(); g.moveTo(-400, -20); g.lineTo(-500, -170); g.lineTo(-540, -170); g.lineTo(-500, 0); g.lineTo(-540, 170); g.lineTo(-500, 170); g.lineTo(-400, 20); g.fill(); g.fillStyle = "#2a5ad8"; g.fillRect(-520, -6, 980, 12); g.fillStyle = "#9aa0a6"; for (const s of [-1, 1]) for (const k of [160, 330]) { g.beginPath(); g.ellipse(-20, s * k, 46, 20, 0, 0, 7); g.fill(); } },
  shuttle(g) { g.fillStyle = "#e4eaee"; g.beginPath(); g.moveTo(260, 0); g.lineTo(160, -130); g.lineTo(-240, -140); g.lineTo(-240, 140); g.lineTo(160, 130); g.closePath(); g.fill(); g.fillStyle = "#3a4a6a"; g.fillRect(150, -40, 70, 80); g.fillStyle = "#4fc3ff"; g.fillRect(-250, -100, 16, 200); }
});
// roofs for landmarks
Object.assign(RG_ROOF, {
  pyramid(b) { const G = cityInterior(b), pad = 4, W = G.w * 16 + pad * 2, H = G.h * 16 + pad * 2, sc = Math.min(1, Math.sqrt(500000 / (W * H))); const c = crCanvas(Math.ceil(W * sc), Math.ceil(H * sc)), g = c.getContext("2d"); g.scale(sc, sc); const cx = W / 2, cy = H / 2, cols = ["#e6c88a", "#cfae6c", "#b8955a", "#d9ba7c"]; const faces = [[[0, 0], [W, 0]], [[W, 0], [W, H]], [[W, H], [0, H]], [[0, H], [0, 0]]]; faces.forEach((f, i) => { g.fillStyle = cols[i]; g.beginPath(); g.moveTo(f[0][0], f[0][1]); g.lineTo(f[1][0], f[1][1]); g.lineTo(cx, cy); g.closePath(); g.fill(); }); g.strokeStyle = "rgba(90,60,20,0.25)"; g.lineWidth = 2; for (let k = 1; k < 14; k++) { const t = k / 14; g.strokeRect(cx - W / 2 * (1 - t), cy - H / 2 * (1 - t), W * (1 - t), H * (1 - t)); } g.fillStyle = "#d4a537"; g.beginPath(); g.moveTo(cx - 40, cy); g.lineTo(cx, cy - 40); g.lineTo(cx + 40, cy); g.lineTo(cx, cy + 40); g.fill(); return { c, x0: b.x * 16 - pad, y0: b.y * 16 - pad, w: W, h: H, used: CR.frame, x1: b.x * 16 + W, y1: b.y * 16 + H }; },
  kame(b) { const G = cityInterior(b), pad = 6, W = G.w * 16 + pad * 2, H = G.h * 16 + pad * 2, c = crCanvas(W, H), g = c.getContext("2d"); g.fillStyle = "#e84a5a"; g.fillRect(0, 0, W, H / 2); g.fillStyle = "#c83a4a"; g.fillRect(0, H / 2, W, H / 2); g.fillStyle = "#f2a8b8"; g.fillRect(W * 0.1, H * 0.2, W * 0.8, H * 0.12); g.fillStyle = "#fff"; g.font = "900 " + Math.round(H * 0.16) + "px sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("KAME HOUSE", W / 2, H * 0.62); return { c, x0: b.x * 16 - pad, y0: b.y * 16 - pad, w: W, h: H, used: CR.frame, x1: b.x * 16 + W, y1: b.y * 16 + H }; },
  processor(b) { const R = rgDomeRoof(b), g = R.c.getContext("2d"), W = R.c.width, H = R.c.height; g.save(); g.beginPath(); g.ellipse(W / 2, H / 2, W / 2 - 2, H / 2 - 2, 0, 0, 7); g.clip(); g.fillStyle = "rgba(40,44,48,0.65)"; g.fillRect(0, 0, W, H); g.strokeStyle = "#f2c200"; g.lineWidth = Math.max(2, W * 0.02); for (let k = 1; k < 4; k++) { g.beginPath(); g.arc(W / 2, H / 2, W * k / 9, 0, 7); g.stroke(); } g.fillStyle = "#1a1c1e"; for (let k = 0; k < 6; k++) { const a = k * 1.047; g.beginPath(); g.arc(W / 2 + Math.cos(a) * W * 0.3, H / 2 + Math.sin(a) * H * 0.3, W * 0.05, 0, 7); g.fill(); } g.fillStyle = "rgba(255,120,40,0.75)"; g.beginPath(); g.arc(W / 2, H / 2, W * 0.07, 0, 7); g.fill(); g.restore(); return R; },
  lambda(b) { const R = rgDomeRoof(b), g = R.c.getContext("2d"), W = R.c.width, H = R.c.height; g.fillStyle = "#ff8a1a"; g.font = "900 " + Math.round(Math.min(W, H) * 0.5) + "px serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("λ", W / 2, H / 2 + 4); return R; },
  capsuledome(b) { return rgDomeRoof(b); },
  cone(b) { const G = cityInterior(b), pad = 4, W = G.w * 16 + pad * 2, H = G.h * 16 + pad * 2, c = crCanvas(W, H), g = c.getContext("2d"), cx = W / 2, cy = H / 2, R = Math.min(W, H) / 2 - 1, T = CITY.theme, col = (T.r.gable && T.r.gable[0]) || "#4a4250"; const n = 16; for (let k = 0; k < n; k++) { const a0 = k / n * 6.28, a1 = (k + 1) / n * 6.28; g.fillStyle = crSh(col, Math.cos((a0 + a1) / 2 + 2.4) * 0.22); g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a0) * R, cy + Math.sin(a0) * R); g.lineTo(cx + Math.cos(a1) * R, cy + Math.sin(a1) * R); g.closePath(); g.fill(); } g.strokeStyle = crSh(col, -0.4); g.lineWidth = 3; g.beginPath(); g.arc(cx, cy, R, 0, 7); g.stroke(); g.fillStyle = "#d4a537"; g.beginPath(); g.arc(cx, cy, 4, 0, 7); g.fill(); return { c, x0: b.x * 16 - pad, y0: b.y * 16 - pad, w: W, h: H, used: CR.frame, x1: b.x * 16 + W, y1: b.y * 16 + H }; }
});
// EOF part 2 (regionworlds.js continues)

/* --- interiors: the pyramid (entry passage → gate room with the Stargate → side chambers) ------- */
ICT.pyramid = function (G, b, r) {
  const W = G.w, H = G.h;
  icRect(G, 0, 0, W, H);
  const cw = Math.round(W * 0.36), ch = Math.round(H * 0.36), cx0 = Math.floor((W - cw) / 2), cy0 = Math.floor((H - ch) / 2);
  // inner wall ring round the gate room
  for (let x = cx0 - 1; x <= cx0 + cw; x++) { icSet(G, x, cy0 - 1, IC_INT); icSet(G, x, cy0 + ch, IC_INT); }
  for (let y = cy0 - 1; y <= cy0 + ch; y++) { icSet(G, cx0 - 1, y, IC_INT); icSet(G, cx0 + cw, y, IC_INT); }
  const gate = icRoom(G, "gateroom", cx0, cy0, cw, ch);
  const gs = Math.min(14, cw - 6, ch - 6);
  icAdd(G, "rgstargate", cx0 + Math.floor((cw - gs) / 2), cy0 + Math.floor((ch - gs) / 2) - 2, gs, gs, 0, FS_COVER);
  icAdd(G, "rgdhd", cx0 + Math.floor(cw / 2) - 2, cy0 + ch - 7, 4, 4, 0, FS_COVER);
  // passage from the front (bottom) to the gate room
  const px = Math.floor(W / 2) - 3;
  for (let y = cy0 + ch; y < H - 1; y++) { icSet(G, px - 1, y, IC_INT); icSet(G, px + 6, y, IC_INT); }
  const pass = icRoom(G, "hall", px, cy0 + ch + 1, 6, H - 2 - (cy0 + ch + 1) + 1);
  for (let k = 0; k < 6; k++) icSet(G, px + k, cy0 + ch, IC_DOOR);
  icExtDoor(G, pass, 2, r, 4, IC_EDOOR, 1);
  // the gallery behind the gate room
  const gal = icRoom(G, "hall", 1, 1, W - 2, cy0 - 2);
  icConnect(G, gal, gate, r, 4);
  G.spawnRooms = [gate.id, gal.id];
  b.rgGate = 1;
};
/* --- AIRPORTS (grid worlds): runway, taxiway, apron with parked airliners, terminal, tower, hangars ------- */
function rgGenAirport(mx, my, i, j, key, A) {
  const S = cityCell(mx, my), L0 = S.vx[0], L1 = S.vx[S.vx.length - 1], H0 = S.hy[0], H1 = S.hy[S.hy.length - 1];
  const bx0 = L0.x + L0.w / 2 + 2, bx1 = L1.x - L1.w / 2 - 2, by0 = H0.y + H0.w / 2 + 2, by1 = H1.y - H1.w / 2 - 2;
  const B = { key, mx, my, i, j, cls: S.cls, seed: cH(CITY.seed, mx * 64 + my, 77, 4247), x0: Math.round(bx0 * 2), x1: Math.round(bx1 * 2), y0: Math.round(by0 * 2), y1: Math.round(by1 * 2),
    side: { N: H0, S: H1, W: L0, E: L1 }, blds: [], props: [], surf: [], fences: [], spawns: [], airport: A.name };
  const r = cRng(B.seed), T = v => Math.round(v * 2);
  // work in a local frame: u along the runway, v across; ns = runway runs north-south
  const ns = !!A.ns, W = bx1 - bx0, Hh = by1 - by0, uL = ns ? Hh : W, vL = ns ? W : Hh;
  const P = (u, v) => ns ? [bx0 + v, by0 + u] : [bx0 + u, by0 + v];
  const rect = (t, u0, v0, u1, v1, extra) => { const [x0, y0] = P(u0, v0), [x1, y1] = P(u1, v1); const q = { t, x0: T(Math.min(x0, x1)), y0: T(Math.min(y0, y1)), x1: T(Math.max(x0, x1)), y1: T(Math.max(y0, y1)), v: 0 }; Object.assign(q, extra || {}); B.surf.push(q); return q; };
  const rv = vL * 0.3, tv = rv + 95, av0 = tv + 30, av1 = av0 + 150;
  rect("gravel", 30, rv - 40, uL - 30, rv + 40);
  rect("lot", 50, rv - 22, uL - 50, rv + 22);                              // runway 45 m
  rect("lot", 90, tv - 11, uL - 90, tv + 11);                              // parallel taxiway
  for (const u of [110, uL / 2, uL - 110]) rect("lot", u - 12, rv, u + 12, tv);   // connectors
  rect("lot", uL * 0.22, av0, uL * 0.78, av1);                             // apron
  rect("lot", uL * 0.3, av1 + 75, uL * 0.62, av1 + 150);                    // car park
  const [rcx, rcy] = P(uL / 2, rv);
  rgP(B, "rgrunway", rcx, rcy, ns ? 45 : uL - 100, ns ? uL - 100 : 45, FS_NONE, { ns, len: uL - 100, num: 1 + Math.floor(r() * 35) });
  // buildings along the apron
  const front = ns ? "W" : "N";
  const [tx, ty] = P(uL * 0.45, av1 + 36);
  const term = rgBox(B, "civic", tx, ty, 90, 36, front, { kind: "council", name: A.name.toUpperCase() + " TERMINAL", mat: "metal", roof: "flat", imp: 2 });
  rgRoomSpawn(B, term, cInt(r, 3, 5), 0.25);
  const [cx2, cy2] = P(uL * 0.66, av1 + 30);
  rgDome(B, cx2, cy2, 12, front, { name: "CONTROL TOWER", rgRoof: "cone", mat: "metal", domeKind: "civic" });
  for (let k = 0; k < 3; k++) { const [hx, hy] = P(uL * 0.08 + k * 62, av0 + 60); const h = rgBox(B, "warehouse", hx, hy, 52, 42, front, { kind: "warehouse", name: "HANGAR " + (k + 1), mat: "metal" }); if (r() < 0.4) rgRoomSpawn(B, h, 2, 0.2); }
  // airliners on the apron, nose to the terminal
  const nPl = cInt(r, 3, 5);
  for (let k = 0; k < nPl; k++) { const [px, py] = P(uL * 0.26 + k * (uL * 0.5 / nPl) + 18, av0 + 75); rgShip(B, "plane", px, py, ns ? 0 : Math.PI / 2, { v: k }); }
  // a light aircraft at the end of the taxiway
  const [lx, ly] = P(uL - 140, tv); rgShip(B, "shuttle", lx, ly, ns ? Math.PI / 2 : 0);
  // perimeter fence with the gate on the landside
  const g = ns ? "E" : "S";
  rgFenceRect(B, "chain", bx0 + 6, by0 + 6, bx1 - 6, by1 - 6, g, 16);
  rgPatrol(B, tx, ty, 60, cInt(r, 2, 4), undefined, { heavy: 0.25 });
  return B;
}
RGW_A.rgrunway = function (g, p) {   // threshold piano keys, runway numbers, centreline dashes, touchdown zone bars
  const cx = (p.x + p.w / 2) * 16, cy = (p.y + p.h / 2) * 16, L = p.len * 32, Wd = 45 * 32;
  g.save(); g.translate(cx, cy); if (p.ns) g.rotate(Math.PI / 2);
  g.fillStyle = "rgba(255,255,255,0.85)";
  for (const s of [-1, 1]) {
    for (let k = -6; k < 6; k++) g.fillRect(s * (L / 2 - 120) - (s > 0 ? 100 : 0), k * 110 + 20, 100, 70);
    for (let k = 0; k < 4; k++) for (const q of [-1, 1]) g.fillRect(s * (L / 2 - 420 - k * 300) - 70, q * 330 - 30, 140, 60);
    g.save(); g.translate(s * (L / 2 - 300), 0); g.rotate(s > 0 ? -Math.PI / 2 : Math.PI / 2); g.font = "900 220px 'Segoe UI', sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; const n = s > 0 ? p.num : (p.num + 18 - 1) % 36 + 1; g.fillText(String(n).padStart(2, "0"), 0, 0); g.restore();
  }
  for (let x = -L / 2 + 700; x < L / 2 - 700; x += 400) g.fillRect(x, -12, 220, 24);
  g.fillStyle = "rgba(255,255,255,0.6)"; g.fillRect(-L / 2, -Wd / 2 + 16, L, 10); g.fillRect(-L / 2, Wd / 2 - 26, L, 10);
  g.restore();
};
RG_FLOOR.add("rgrunway");
(function rgFurnWire() {   // furniture drawn by the region art (the Stargate and its DHD in the pyramid)
  if (typeof crFurn !== "function") return;
  const _cf = crFurn;
  window.crFurn = crFurn = function (g, f, b, P, fam, st) {
    if (f.t === "rgstargate") { const cx = (b.x + f.x + f.w / 2) * 16, cy = (b.y + f.y + f.h / 2) * 16, R = f.w * 8; g.save(); g.fillStyle = "rgba(0,0,0,0.3)"; g.beginPath(); g.arc(cx + 8, cy + 10, R, 0, 7); g.fill(); g.strokeStyle = "#6a6e74"; g.lineWidth = R * 0.24; g.beginPath(); g.arc(cx, cy, R * 0.86, 0, 7); g.stroke(); g.strokeStyle = "#8a8e94"; g.lineWidth = R * 0.1; g.beginPath(); g.arc(cx, cy, R * 0.86, 0, 7); g.stroke(); const gr = g.createRadialGradient(cx, cy, R * 0.1, cx, cy, R * 0.72); gr.addColorStop(0, "rgba(140,210,255,0.85)"); gr.addColorStop(1, "rgba(40,110,220,0.55)"); g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, R * 0.72, 0, 7); g.fill(); for (let k = 0; k < 9; k++) { const a = -Math.PI / 2 + k * 0.698; g.fillStyle = "#ff7a1a"; g.save(); g.translate(cx + Math.cos(a) * R * 0.92, cy + Math.sin(a) * R * 0.92); g.rotate(a + Math.PI / 2); g.beginPath(); g.moveTo(-R * 0.08, -R * 0.05); g.lineTo(R * 0.08, -R * 0.05); g.lineTo(0, R * 0.09); g.fill(); g.restore(); } g.restore(); return; }
    if (f.t === "rgdhd") { RGW_A.rgdhd(g, { x: b.x + f.x, y: b.y + f.y, w: f.w, h: f.h }); return; }
    return _cf(g, f, b, P, fam, st);
  };
})();
// EOF:js/regionworlds.js
