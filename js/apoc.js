/* =========================================================================
   OMNI-SHIFT v14.2 — ☢️ POST-APOCALYPTIC (js/apoc.js)
   • the same world, after the end: a dusty, washed-out look, most cars
     burnt-out wrecks (a few still run), rubble and trash in the streets,
     weeds through the asphalt, smoke over the rooftops
   • loot everywhere: cupboards hold more (food, water, meds, ammo, parts —
     cash is nearly worthless), and supply caches lie in the streets
   • raider parties roam the roads (Wasteland Raiders, War Boys — Reavers
     in the Verse); your universe's bounty hunters still come, less often
   • holed-up survivors: a few houses are barricaded and lived in — talk to
     them, trade with them (the apocalypse has its own prices)
   • ZOMBIES (Location → Scenario): OFF · A FEW · HORDE — walkers, runners,
     crawlers and brutes; noise draws them, and in a horde gunfire pulls in
     dozens more; they're bolder at night
   ========================================================================= */
"use strict";

const APOC = { on: false, z: "few", look: false, raidT: 60, msgT: -99, cells: new Map(), lastLook: null, tagN: 0 };
if (typeof erDef === "function") {
  erDef("zombies", "The Dead", "rgba(70,24,20,0.7)", [
    ["Walker", "h", ["#6b7f5a", "#4a5440", "#2a2a2a"], "ghoul", "none", 0, 0, 1, "rags"],
    ["Runner", "h", ["#7a8a66", "#3e4a36", "#2a2a2a"], "ghoul", "claws", 0, 0, 0.95, "rags thin"],
    ["Crawler", "h", ["#5a6a4a", "#3a4232", "#2a2a2a"], "ghoul", "claws", 0, 0, 0.85, "crouch rags"],
    ["Brute", "h", ["#4e5a42", "#333a2c", "#5a1a1a"], "mutant", "none", 0, 0, 1.35, "bulky rags"]]);
}
const APOC_SPD = [0.5, 1.12, 0.38, 0.62];   // walker · runner · crawler · brute
function apocRaiders() {
  const f = player && player.fac ? player.fac.id : -1, r = Math.random();
  if (f === 2 && r < 0.5) return "alliance";          // Reavers
  if (f === 0 && r < 0.4) return "outlaws";
  return r < 0.3 && typeof ER !== "undefined" && ER.warboys ? "warboys" : "wasteland";
}
function apocZombieShare() { return APOC.z === "off" ? 0 : APOC.z === "horde" ? 0.85 : 0.5; }
function apocNight() { return typeof scnIsNight === "function" && scnIsNight(); }
// tag an enemy as one of the dead (look, roster, gait) or a raider
function apocTag(j, zombie) {
  if (j < 0 || typeof eRos === "undefined") return;
  if (zombie) {
    eRos[j] = locRosIndex("zombies");
    eSpd[j] *= APOC_SPD[eType[j] === 99 ? 3 : eType[j] & 3] * (apocNight() ? 1.15 : 1);
    eFireCD[j] = 1e9;   // the dead don't shoot
    APOC.tagN++;
  } else eRos[j] = locRosIndex(apocRaiders());
}

/* --- the look ----------------------------------------------------------------------- */
function apocHash(x, y, k) { let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(k | 0, 2246822519); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
function apocMarkChunk(C) {   // cars → wrecks (3 in 4), restored when the world is visited without the apocalypse
  if (!C || !C.props) return;
  for (const p of C.props) {
    if (p.t !== "car" && p.t !== "bus" && p.t !== "trailer" || p._w0 === undefined) continue;
    p.wreck = APOC.on ? (p._w0 || apocHash(p.x, p.y, 7) < 0.75) : p._w0;
  }
}
function apocRenderWorld(g) {
  if (!APOC.on || !player) return;
  // rubble, trash and weeds on open ground near you (stable per tile, drawn live — nothing to bake)
  const z = (typeof opts !== "undefined" ? opts.zoom || 1 : 1) * (typeof FLY !== "undefined" && FLY.on ? FLY.zoom || 1 : 1), R = Math.min(48, Math.round(26 / Math.max(0.35, z)));
  const ptx = Math.floor((player.x + CITY.orx) / 32), pty = Math.floor((player.y + CITY.ory) / 32);
  g.save();
  if (z >= 0.3) for (let y = pty - R; y <= pty + R; y++) for (let x = ptx - R; x <= ptx + R; x++) {   // (from the air the litter is too small to see: skipped)
    const hsh = apocHash(x, y, 3); if (hsh > 0.065) continue;
    const lx = x * 32 + 16 - CITY.orx, ly = y * 32 + 16 - CITY.ory, f = cityFlagsAt(lx, ly);
    if (f & (F_MOVE | F_IN | F_WATER)) continue;
    const k = Math.floor(apocHash(x, y, 4) * 5), ox = (apocHash(x, y, 5) - 0.5) * 20, oy = (apocHash(x, y, 6) - 0.5) * 20;
    if (k === 0) { g.fillStyle = "rgba(60,52,44,0.75)"; g.beginPath(); g.moveTo(lx + ox - 7, ly + oy); g.lineTo(lx + ox - 2, ly + oy - 6); g.lineTo(lx + ox + 6, ly + oy - 3); g.lineTo(lx + ox + 4, ly + oy + 5); g.closePath(); g.fill(); }   // rubble
    else if (k === 1) { g.fillStyle = "rgba(200,190,170,0.55)"; g.fillRect(lx + ox, ly + oy, 5, 3); g.fillStyle = "rgba(120,110,90,0.6)"; g.fillRect(lx + ox + 7, ly + oy + 2, 3, 3); }   // trash
    else if (k === 2) { g.strokeStyle = "rgba(90,120,50,0.7)"; g.lineWidth = 1.2; g.beginPath(); for (let s = 0; s < 4; s++) { g.moveTo(lx + ox + s * 2, ly + oy + 4); g.lineTo(lx + ox + s * 2 + (s - 1.5) * 2, ly + oy - 4); } g.stroke(); }   // weeds
    else if (k === 3) { g.strokeStyle = "rgba(20,18,16,0.45)"; g.lineWidth = 1; g.beginPath(); g.moveTo(lx + ox - 9, ly + oy); g.lineTo(lx + ox - 2, ly + oy + 2); g.lineTo(lx + ox + 3, ly + oy - 3); g.lineTo(lx + ox + 9, ly + oy - 1); g.stroke(); }   // cracks
    else { g.fillStyle = "rgba(30,26,22,0.35)"; g.beginPath(); g.ellipse(lx + ox, ly + oy, 9, 5, apocHash(x, y, 8) * 3, 0, 7); g.fill(); }   // scorch
  }
  // supply caches and barricades
  apocCachesRender(g);
  apocHoldoutsRender(g);
  g.restore();
  // the washed-out, dusty light of the end of the world
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
  const cv = g.canvas;
  g.globalCompositeOperation = "saturation"; g.fillStyle = "rgba(128,128,128,0.5)"; g.fillRect(0, 0, cv.width, cv.height);
  g.globalCompositeOperation = "multiply"; g.fillStyle = "rgba(214,196,160,0.42)"; g.fillRect(0, 0, cv.width, cv.height);
  g.restore();
}

/* --- supply caches in the streets ------------------------------------------------------- */
function apocCellCaches(mx, my) {
  const key = mx * 100 + my;
  let L = APOC.cells.get(key);
  if (L) return L;
  L = [];
  for (let k = 0; k < 14 && L.length < 4; k++) {
    const xm = mx * 1000 + apocHash(mx, my, 40 + k) * 1000, ym = my * 1000 + apocHash(mx, my, 80 + k) * 1000, lx = xm * 32 - CITY.orx, ly = ym * 32 - CITY.ory;
    const f = cityFlagsAt(lx, ly); if (f & (F_MOVE | F_IN | F_WATER)) continue;
    L.push({ uid: "g|" + mx + "|" + my, k, x: lx, y: ly, kind: Math.floor(apocHash(mx, my, 120 + k) * 3), t: -99 });
  }
  APOC.cells.set(key, L);
  if (APOC.cells.size > 60) APOC.cells.delete(APOC.cells.keys().next().value);
  return L;
}
function apocCachesNear(fn) {
  const [xm, ym] = cityWorldM(player.x, player.y), mx = Math.floor(xm / 1000), my = Math.floor(ym / 1000), S = typeof itStore === "function" ? itStore() : {};
  for (let y = my - 1; y <= my + 1; y++) for (let x = mx - 1; x <= mx + 1; x++) for (const c of apocCellCaches(x, y)) { const v = S[c.uid + ":" + c.k]; if (!Array.isArray(v) || v.length) fn(c, S); }
}
function apocCachesStep() {
  apocCachesNear((c, S) => {
    if (Math.hypot(c.x - player.x, c.y - player.y) > 30 || player.inVehicle || runTime - c.t < 6) return;
    c.t = runTime;
    itSearch({ b: { uid: c.uid, kind: "warehouse", type: "warehouse" }, c: { fi: c.k, t: c.kind === 0 ? "crate" : c.kind === 1 ? "locker" : "rack" } });
  });
}
function apocCachesRender(g) {
  apocCachesNear((c) => {
    if (Math.abs(c.x - player.x) > 1400 || Math.abs(c.y - player.y) > 1000) return;
    if (typeof cityVisibleAt === "function" && !cityVisibleAt(c.x, c.y)) return;
    g.save(); g.translate(c.x, c.y);
    g.fillStyle = "rgba(0,0,0,0.3)"; g.beginPath(); g.ellipse(2, 7, 12, 4, 0, 0, 7); g.fill();
    if (c.kind === 0) { g.fillStyle = "#6d5a3a"; g.fillRect(-9, -7, 18, 14); g.strokeStyle = "#3e3020"; g.lineWidth = 1.5; g.strokeRect(-9, -7, 18, 14); g.beginPath(); g.moveTo(-9, -7); g.lineTo(9, 7); g.stroke(); }
    else if (c.kind === 1) { g.fillStyle = "#4a5a3a"; g.beginPath(); g.ellipse(0, 0, 11, 7, 0.3, 0, 7); g.fill(); g.fillStyle = "#3a4a2a"; g.fillRect(-3, -8, 6, 4); }
    else { g.fillStyle = "#8a2a1a"; g.fillRect(-8, -8, 16, 16); g.fillStyle = "#e0e0e0"; g.fillRect(-2, -6, 4, 12); g.fillRect(-6, -2, 12, 4); }
    g.globalAlpha = 0.25 + 0.2 * Math.sin(runTime * 3 + c.x); g.strokeStyle = "#ffd166"; g.lineWidth = 2; g.beginPath(); g.arc(0, 0, 15, 0, 7); g.stroke();
    g.restore();
  });
}

/* --- holdouts: barricaded houses with survivors ------------------------------------------- */
function apocIsHoldout(b) { return !!b && (b.type === "house" || b.type === "farmhouse" || b.type === "cabin" || b.kind === "house") && apocHash(b.x, b.y, 61) < 0.08; }
function apocHoldoutsRender(g) {
  if (typeof TF === "undefined" || !TF.nearList) return;
  for (const b of TF.nearList) {
    if (!apocIsHoldout(b)) continue;
    const G = b.int; if (!G || !G.doors) continue;
    for (const d of G.doors) {
      if (!d.ext) continue;
      const x = (b.x + d.x) * 16 - CITY.orx, y = (b.y + d.y) * 16 - CITY.ory;
      if (Math.abs(x - player.x) > 1200 || Math.abs(y - player.y) > 900) continue;
      g.fillStyle = "#7a5a32"; g.strokeStyle = "#3e2a14"; g.lineWidth = 1;
      for (let k = 0; k < 3; k++) { g.save(); g.translate(x + 8, y + 8); g.rotate((k - 1) * 0.5); g.fillRect(-14, -2, 28, 4); g.strokeRect(-14, -2, 28, 4); g.restore(); }
    }
    // a fire barrel by the door at night
    if (apocNight() && G.doors.length) { const d = G.doors.find(q => q.ext) || G.doors[0], x = (b.x + d.x) * 16 - CITY.orx + 26, y = (b.y + d.y) * 16 - CITY.ory + 26; g.fillStyle = "#3a3a3a"; g.beginPath(); g.arc(x, y, 6, 0, 7); g.fill(); g.fillStyle = "rgba(255," + (140 + Math.floor(Math.sin(runTime * 9 + x) * 40)) + ",40,0.9)"; g.beginPath(); g.arc(x, y - 2, 4, 0, 7); g.fill(); }
  }
}
// survivors' prices: what keeps you alive is dear, money and trinkets are worth little
const APOC_PRICE = { food: 2.6, water: 2.4, med: 2.2, stim: 1.8, ammo: 2.0, scrap: 0.6, valuable: 0.25, capsule: 1.5 };

/* --- raiders & the dead ------------------------------------------------------------------- */
function apocRaidStep(dt) {
  APOC.raidT -= dt * (apocNight() ? 1.4 : 1);
  if (APOC.raidT > 0) return;
  APOC.raidT = 80 + Math.random() * 70;
  let live = 0; for (let j = 0; j < MAX_E; j++) if (eAct[j]) live++;
  if (live > 70) return;
  const a = Math.random() * 6.283, d = 2600 + Math.random() * 900, q = cityFindWalkable(player.x + Math.cos(a) * d, player.y + Math.sin(a) * d, 360, true);
  if (cityVisibleAt(q[0], q[1])) return;
  const route = [q]; for (let k = 0; k < 4; k++) route.push(stRandomNear(route[route.length - 1][0], route[route.length - 1][1], 1400, false));
  const n = 3 + Math.floor(Math.random() * 4), ros = apocRaiders();
  for (let k = 0; k < n; k++) {
    const j = stCityEnemy(q[0] + (k % 3 - 1) * 26, q[1] + Math.floor(k / 3) * 26, k === 0 ? 3 : stPickType(0.1), 1.05, typeof ST_PATROL !== "undefined" ? ST_PATROL : 1);
    if (j < 0) break;
    eRos[j] = locRosIndex(ros); ST.route[j] = route; ST.rk[j] = 0;
  }
  if (runTime - APOC.msgT > 40) { APOC.msgT = runTime; itToast("📻 Engines in the distance — a " + (ER[ros] ? ER[ros].name : "raider") + " party is out on the roads", "#ffab40"); }
}
// noise pulls the dead in from the streets around — a few, or dozens in a horde
function apocNoiseHorde(x, y, L0) {
  if (APOC.z === "off" || L0 < 95) return;
  if (runTime - (APOC.hordeT || -99) < (APOC.z === "horde" ? 4 : 12)) return;
  APOC.hordeT = runTime;
  let live = 0; for (let j = 0; j < MAX_E; j++) if (eAct[j]) live++;
  const cap = APOC.z === "horde" ? 120 : 60, n = Math.min(cap - live, APOC.z === "horde" ? 8 + Math.floor(Math.random() * 8) : 2 + Math.floor(Math.random() * 3));
  for (let k = 0; k < n; k++) {
    const a = Math.random() * 6.283, d = 1800 + Math.random() * 1500, q = cityFindWalkable(x + Math.cos(a) * d, y + Math.sin(a) * d, 300, true);
    if (cityVisibleAt(q[0], q[1]) && Math.hypot(q[0] - player.x, q[1] - player.y) < 1200) continue;
    const r = Math.random(), j = stCityEnemy(q[0], q[1], r < 0.55 ? 0 : r < 0.8 ? 1 : r < 0.93 ? 2 : 3, 1, typeof ST_INVEST !== "undefined" ? ST_INVEST : 2);
    if (j < 0) break;
    apocTag(j, true); ST.tx[j] = x + (Math.random() - 0.5) * 260; ST.ty[j] = y + (Math.random() - 0.5) * 260; ST.urg[j] = 1;
  }
  if (n > 3 && runTime - APOC.msgT > 25) { APOC.msgT = runTime; itToast(APOC.z === "horde" ? "🧟 THE HORDE HEARD THAT" : "🧟 Something heard that…", "#c5e1a5"); }
}

/* --- hooks --------------------------------------------------------------------------------- */
(function apocWire() {
  // cars become wrecks where they're drawn (tiles bake once; a promoted car keeps the same state)
  if (typeof crProp === "function") { const _cp = crProp; window.crProp = crProp = function (g, p) { if (p && (p.t === "car" || p.t === "bus" || p.t === "trailer")) { if (p._w0 === undefined) p._w0 = !!p.wreck; p.wreck = APOC.on ? (p._w0 || apocHash(p.x, p.y, 7) < 0.75) : p._w0; } return _cp.apply(this, arguments); }; }
  // spawn groups from the map: the dead or raiders instead of the usual forces (bigger groups in a horde)
  if (typeof stSpawnGroup === "function") {
    const _sg = stSpawnGroup;
    window.stSpawnGroup = function (s, S) {
      if (!APOC.on) return _sg.apply(this, arguments);
      const zombie = Math.random() < apocZombieShare();
      if (zombie && APOC.z === "horde" && !S.apocX) { S.apocX = 1; S.left = Math.min(14, S.left * 2 + 1); }
      const before = new Uint8Array(MAX_E); for (let j = 0; j < MAX_E; j++) before[j] = eAct[j];
      const r = _sg.apply(this, arguments);
      for (let j = 0; j < MAX_E; j++) if (eAct[j] && !before[j]) apocTag(j, zombie);
      return r;
    };
  }
  if (typeof stResponders === "function") { const _sr = stResponders; window.stResponders = function (x, y, L0) { if (APOC.on) { apocNoiseHorde(x, y, L0); if (APOC.z === "horde") return; } return _sr.apply(this, arguments); }; }
  if (typeof stHunters === "function") { const _sh = stHunters; window.stHunters = function (dt) { if (APOC.on) { ST.hunterT -= dt * 0.5; if (ST.hunterT > 0) return; } return _sh.apply(this, arguments); }; }
  if (typeof V10 !== "undefined") {
    V10.onRunStart.push(() => {
      APOC.on = typeof CITY !== "undefined" && CITY.on && SCN.mode === "apoc";
      APOC.z = SCN.zombies; APOC.raidT = 45; APOC.msgT = -99; APOC.hordeT = -99; APOC.cells.clear(); APOC.tagN = 0;
      if (APOC.lastLook === null ? APOC.on : APOC.lastLook !== APOC.on) {   // the look changed: re-mark cars and re-bake tiles
        if (typeof cityRenderReset === "function") cityRenderReset();
        if (typeof cityRT !== "undefined") for (const C of cityRT.chunks.values()) apocMarkChunk(C);
      }
      APOC.lastLook = APOC.on;
      if (APOC.on && player) { player.rivalEvery = Math.max(player.rivalEvery || 0, 180); itToast("☢️ THE WORLD ENDED · " + (APOC.z === "off" ? "raiders & scavengers" : APOC.z === "horde" ? "THE DEAD OWN THE STREETS" : "the dead walk") + " · search everything", "#ffd166"); }
    });
    V10.onStep.push((dt) => { if (!APOC.on || !CITY.on) return; apocRaidStep(dt); if ((TF.frame & 7) === 0) apocCachesStep(); });
    V10.onRenderWorld.push(apocRenderWorld);
    V10.onRunReset.push(() => { APOC.on = false; });
  }
})();
// EOF:js/apoc.js
