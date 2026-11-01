/* =========================================================================
   OMNI-SHIFT v14.2 — LOCALS (js/locals.js)
   Per-enemy rosters, so a world can field its own inhabitants next to the
   hunters that come for your hero: Sand People in the Jundland canyons of
   Tatooine, a xenomorph hive out on LV-426's ridges, monster nests in Velen…
   • eRos[j] = which roster enemy j belongs to (0 = the run's normal roster)
   • a spawn with { ros: "<roster key>" } tags every enemy it creates
   • enemySpec / names / weapons / blood / looks follow the tag
   The post-apocalypse (zombies, raiders) and the simulated economy
   (civilians) extend this module.
   ========================================================================= */
"use strict";

const LOCALS = { j: -1, pending: 0, keys: [""], idx: { "": 0 } };
const eRos = new Uint8Array(typeof MAX_E === "number" ? MAX_E : 512);
function locRosIndex(key) {
  if (!key || typeof ER === "undefined" || !ER[key]) return 0;
  let i = LOCALS.idx[key];
  if (i === undefined) { i = LOCALS.keys.length; LOCALS.keys.push(key); LOCALS.idx[key] = i; }
  return i;
}
// spec of enemy j, honouring its own roster
function enemySpecJ(j) {
  const k = eRos[j], t = eType[j];
  if (k && LOCALS.keys[k] && ER[LOCALS.keys[k]]) return ER[LOCALS.keys[k]].t[t === 99 ? 3 : (t & 3)];
  return enemySpec(t);
}
function enemyRosterJ(j) { const k = eRos[j]; return (k && ER[LOCALS.keys[k]]) || (typeof enemyRoster === "function" ? enemyRoster() : null); }

/* --- native rosters ------------------------------------------------------------------ */
if (typeof erDef === "function") {
  const RED = "rgba(130,10,16,0.62)";
  // Sand People: wrapped heads, breath masks and goggles; gaffi sticks and cycler rifles; massiffs; a warlord
  erDef("tusken", "Sand People", RED, [
    ["Tusken Raider", "h", ["#bca482", "#8a7458", "#4a4038"], "tusken", "spear", 0, 0, 1, "rags bandolier"],
    ["Tusken Sniper", "h", ["#a8906a", "#7a6448", "#4a4038"], "tusken", "rifle", 1, 1, 1, "rags"],
    ["Massiff", "b", ["#a89a78", "#7a6a50", "#3a2a1a"], "dog", "none", 0, 0, 0.9, ""],
    ["Tusken Warlord", "h", ["#d0b890", "#6a4a2e", "#c0392b"], "tusken", "mace", 0, 0, 1.2, "rags bandolier"]]);
}

/* --- hooks ------------------------------------------------------------------------------ */
(function localsWire() {
  const wrapJ = (name) => {   // functions taking an enemy index: evaluate them in that enemy's roster
    if (typeof window[name] !== "function") return;
    const f = window[name];
    window[name] = function (j) { const p = LOCALS.j; LOCALS.j = j; try { return f.apply(this, arguments); } finally { LOCALS.j = p; } };
  };
  if (typeof enemySpec === "function") {
    const _es = enemySpec;
    window.enemySpec = enemySpec = function (type) {
      const j = LOCALS.j;
      if (j >= 0 && eRos[j]) { const R = ER[LOCALS.keys[eRos[j]]]; if (R) return R.t[type === 99 ? 3 : (type & 3)]; }
      return _es(type);
    };
  }
  if (typeof enemyBloodCol === "function") {
    const _bc = enemyBloodCol;
    window.enemyBloodCol = enemyBloodCol = function (j) { if (eRos[j] && ER[LOCALS.keys[eRos[j]]] && (typeof AGE === "undefined" || !AGE.level)) return ER[LOCALS.keys[eRos[j]]].blood; return _bc(j); };
  }
  ["drawEnemyDetailed", "enemyWeaponId", "enemyDisplayName"].forEach(wrapJ);
  // a new enemy inherits the roster of the spawn that is creating it (0 otherwise)
  if (typeof stealthOnAlloc === "function") {
    const _oa = stealthOnAlloc;
    window.stealthOnAlloc = stealthOnAlloc = function (j) { eRos[j] = LOCALS.pending; const p = LOCALS.j; LOCALS.j = j; try { return _oa(j); } finally { LOCALS.j = p; } };
  }
  if (typeof allocEnemySlot === "function") {
    const _al = allocEnemySlot;
    window.allocEnemySlot = allocEnemySlot = function () { const i = _al.apply(this, arguments); if (i >= 0 && !(typeof CITY !== "undefined" && CITY.on)) eRos[i] = 0; return i; };
  }
  if (typeof stSpawnGroup === "function") {
    const _sg = stSpawnGroup;
    window.stSpawnGroup = stSpawnGroup = function (s, S) {
      if (s && s.rosSkipIf && typeof enemyRosterKey === "function" && enemyRosterKey() === s.rosSkipIf) { if (S) S.left = 0; return; }   // e.g. Fremen don't fight Paul
      const p = LOCALS.pending; LOCALS.pending = s && s.ros ? locRosIndex(s.ros) : 0; try { return _sg(s, S); } finally { LOCALS.pending = p; } };
  }
  if (typeof erHead === "function") {
    const _eh = erHead;
    window.erHead = erHead = function (g, s, i, dir, back, t) {
      if (s.hd !== "tusken" && s.hd !== "jawa") return _eh(g, s, i, dir, back, t);
      const c = s.c;
      if (s.hd === "tusken") {   // cloth-wrapped head, metal breath mask, goggle tubes, two short horns
        g.fillStyle = c[0]; g.beginPath(); g.ellipse(0, -10, 5, 5.6, 0, 0, 7); g.fill();
        g.strokeStyle = erShade(c[0], -0.25); g.lineWidth = 0.7; for (let k = -2; k <= 2; k++) { g.beginPath(); g.moveTo(-4.6, -12 + k * 1.6); g.lineTo(4.6, -11 + k * 1.6); g.stroke(); }
        g.fillStyle = erShade(c[0], 0.12); g.beginPath(); g.moveTo(-3.6, -14.5); g.lineTo(-4.8, -17.5); g.lineTo(-2.2, -15.2); g.fill(); g.beginPath(); g.moveTo(3.6, -14.5); g.lineTo(4.8, -17.5); g.lineTo(2.2, -15.2); g.fill();
        if (!back) {
          g.fillStyle = "#3a3632"; g.beginPath(); g.arc(-1.8 + dir, -11, 1.5, 0, 7); g.arc(1.8 + dir, -11, 1.5, 0, 7); g.fill();
          g.fillStyle = "#8a8e94"; erRR(g, -1.6 + dir, -9.4, 3.2, 3.2, 1); g.fill(); g.fillStyle = "#4a4e54"; for (let k = 0; k < 3; k++) g.fillRect(-1.2 + dir + k * 1.1, -7.2, 0.6, 1.8);
        }
      } else {   // jawa: brown hood, glowing eyes in the dark
        g.fillStyle = "#5a3e26"; g.beginPath(); g.moveTo(0, -17); g.quadraticCurveTo(6, -12, 4.6, -6); g.lineTo(-4.6, -6); g.quadraticCurveTo(-6, -12, 0, -17); g.fill();
        if (!back) { g.fillStyle = "#120c08"; g.beginPath(); g.ellipse(dir, -10, 3, 2.6, 0, 0, 7); g.fill(); g.fillStyle = "#ffd54f"; g.beginPath(); g.arc(-1.2 + dir, -10.2, 0.9, 0, 7); g.arc(1.2 + dir, -10.2, 0.9, 0, 7); g.fill(); erGlow(g, dir, -10.2, 3.5, "#ffd54f", 0.35); }
      }
    };
  }
  if (typeof V10 !== "undefined" && V10.onRunStart) V10.onRunStart.push(() => { eRos.fill(0); LOCALS.pending = 0; LOCALS.j = -1; });
})();
/* --- living locals: the Jawas round their sandcrawler (Tatooine) ----------------------------------------
   Not enemies: they potter about the ramp and the scrap piles, chatter, scatter when shots ring out or something
   blows up (and drift back once it's quiet), and trade — [F] TRADE opens their stall (scrap, parts, salvage). */
const LOCN = { list: [], groups: new Map(), scanT: 0 };
const JAWA_SPEC = { n: "Jawa", b: "h", c: ["#6d4c41", "#4e342e", "#2a1a10"], hd: "jawa", w: "none", r: 0, k: 0, s: 0.62, x: "rags" };
const JAWA_LINES = ["Utinni!", "Utini!", "M'um m'aloo!", "Ooteenee!", "Mombay m'bwa!", "Eeh-yoo-tee-nee!"];
function locnScan() {
  if (typeof RG === "undefined" || !RG.sites || !RG.sites.length || typeof CITY === "undefined" || !CITY.on || !player) { if (LOCN.list.length) locnClear(); return; }
  const [xm, ym] = cityWorldM(player.x, player.y), keep = new Set();
  for (const site of RG.sites) {
    if (site.k !== "sandcrawler" || Math.abs(site.x - xm) > 320 || Math.abs(site.y - ym) > 320) continue;
    const key = "jawa:" + Math.round(site.x) + ":" + Math.round(site.y);
    keep.add(key);
    if (LOCN.groups.has(key)) continue;
    // the exact spot by the ramp comes from the generated block; the crawler's centre is the fallback
    let spot = null;
    if (typeof cityBlocksInRect === "function") for (const B of cityBlocksInRect(site.x - 60, site.y - 60, site.x + 60, site.y + 60)) for (const g of (B.npcs || [])) if (g.kind === "jawa" && Math.hypot(g.x - site.x, g.y - site.y) < 45) spot = g;
    const n = spot ? spot.n : 6, cxm = spot ? spot.x : site.x + 18, cym = spot ? spot.y : site.y;
    const cx = cxm * 32 - CITY.orx, cy = cym * 32 - CITY.ory, members = [];
    for (let i = 0; i < n; i++) {
      const a = i / n * 6.283 + Math.random() * 0.6, d = 24 + Math.random() * 110;
      const q = typeof cityFindWalkable === "function" ? cityFindWalkable(cx + Math.cos(a) * d, cy + Math.sin(a) * d, 160, false) : [cx + Math.cos(a) * d, cy + Math.sin(a) * d];
      const J = { key, x: q[0], y: q[1], hx: cx, hy: cy, tx: q[0], ty: q[1], vx: 0, vy: 0, face: Math.random() * 6.28, idle: Math.random() * 3, flee: 0, fx: 0, fy: 0, say: "", sayT: 0, seed: (Math.random() * 1e9) | 0 };
      members.push(J); LOCN.list.push(J);
    }
    LOCN.groups.set(key, members);
  }
  for (const key of [...LOCN.groups.keys()]) if (!keep.has(key)) { LOCN.groups.delete(key); LOCN.list = LOCN.list.filter(J => J.key !== key); }
}
function locnClear() { LOCN.list.length = 0; LOCN.groups.clear(); }
function locnMove(J, tx, ty, spd, dt) {
  const dx = tx - J.x, dy = ty - J.y, d = Math.hypot(dx, dy);
  if (d < 4) { J.vx = J.vy = 0; return d; }
  const a = Math.atan2(dy, dx), step = Math.min(spd * dt, d);
  let diff = a - J.face; diff = Math.atan2(Math.sin(diff), Math.cos(diff)); J.face += diff * Math.min(1, dt * 8);
  const q = typeof cityResolve === "function" ? cityResolve(J.x + Math.cos(a) * step, J.y + Math.sin(a) * step, 6, false) : [J.x + Math.cos(a) * step, J.y + Math.sin(a) * step];
  if (step > 0.5 && Math.hypot(q[0] - J.x, q[1] - J.y) < step * 0.3) J.idle = 0;   // blocked: pick another spot
  J.vx = (q[0] - J.x) / Math.max(1e-4, dt); J.vy = (q[1] - J.y) / Math.max(1e-4, dt); J.x = q[0]; J.y = q[1];
  return d;
}
function locnScare(x, y, R, t) { for (const J of LOCN.list) if (Math.hypot(J.x - x, J.y - y) < R) { J.flee = Math.max(J.flee, t); J.fx = x; J.fy = y; if (Math.random() < 0.35) { J.say = "Utinni!"; J.sayT = runTime + 1.2; } } }
function locnStep(dt) {
  LOCN.scanT -= dt;
  if (LOCN.scanT <= 0) { LOCN.scanT = 1.5; locnScan(); }
  if (!LOCN.list.length || !player) return;
  const armedClose = typeof sheatheArmed === "function" && sheatheArmed() && !player.inVehicle;
  for (const J of LOCN.list) {
    const dp = Math.hypot(J.x - player.x, J.y - player.y);
    if (armedClose && dp < 40 && J.flee <= 0) { J.flee = 1.2; J.fx = player.x; J.fy = player.y; }
    if (J.flee > 0) { J.flee -= dt; const a = Math.atan2(J.y - J.fy, J.x - J.fx); locnMove(J, J.x + Math.cos(a) * 120, J.y + Math.sin(a) * 120, 125, dt); continue; }
    J.idle -= dt;
    if (J.idle <= 0) { J.idle = 2 + Math.random() * 5; const a = Math.random() * 6.283, d = 20 + Math.random() * 120; J.tx = J.hx + Math.cos(a) * d; J.ty = J.hy + Math.sin(a) * d; }
    locnMove(J, J.tx, J.ty, 36 + (J.seed % 10), dt);
    if (dp < 240 && J.sayT < runTime && Math.random() < dt * 0.12) { J.say = JAWA_LINES[(J.seed + Math.floor(runTime)) % JAWA_LINES.length]; J.sayT = runTime + 1.8; }
  }
}
function locnRender(g) {
  if (!LOCN.list.length || typeof erBodyHuman !== "function" || !player) return;
  for (const J of LOCN.list) {
    if (Math.abs(J.x - player.x) > 1500 || Math.abs(J.y - player.y) > 1100) continue;
    if (typeof cityVisibleAt === "function" && !cityVisibleAt(J.x, J.y)) continue;
    const moving = Math.hypot(J.vx, J.vy) > 6, walk = moving ? runTime * 11 + (J.seed % 7) : 0;
    g.save(); g.translate(J.x, J.y); g.scale(JAWA_SPEC.s, JAWA_SPEC.s);
    try { erBodyHuman(g, JAWA_SPEC, 200000 + (J.seed % 50000), J.face, walk, 0, false, false); } catch (e) { g.fillStyle = "#6d4c41"; g.beginPath(); g.arc(0, 0, 6, 0, 7); g.fill(); }
    g.restore();
    if (J.sayT > runTime && J.say) { g.save(); g.font = "bold 9px sans-serif"; g.textAlign = "center"; const tw = g.measureText(J.say).width + 8; g.fillStyle = "rgba(0,0,0,0.55)"; g.fillRect(J.x - tw / 2, J.y - 30, tw, 12); g.fillStyle = "#ffe0b2"; g.fillText(J.say, J.x, J.y - 21); g.restore(); }
  }
}
function locnNearJawa(r) { let best = null, bd = r; for (const J of LOCN.list) { const d = Math.hypot(J.x - player.x, J.y - player.y); if (d < bd) { bd = d; best = J; } } return best; }
function locnTrade(J) {
  if (typeof ecoKioskOpen !== "function") return;
  if (typeof ECO_SHOP !== "undefined" && !ECO_SHOP.jawa) ECO_SHOP.jawa = ["scrap", "valuable", "ammo", "med", "water", "capsule"];
  J.say = "Utinni!"; J.sayT = runTime + 1.5;
  ecoKioskOpen({ shop: true, kind: "jawa", jawa: true, x: J.x, y: J.y });
}
(function locnWire() {
  const _fit = window.findInteractTarget, _twi = window.triggerWorldInteract;
  if (typeof _fit === "function") window.findInteractTarget = function () {
    const t = _fit();
    if (!LOCN.list.length || typeof CITY === "undefined" || !CITY.on || !player || player.inVehicle) return t;
    if (t && !(t.kind && (t.kind.startsWith("acc") || t.kind === "itCont"))) return t;
    const J = locnNearJawa(48);
    return J ? { kind: "jawaTrade", J, x: J.x, y: J.y - 16, label: "[F] TRADE — Jawas" } : t;
  };
  if (typeof _twi === "function") window.triggerWorldInteract = function () {
    if (LOCN.list.length && typeof CITY !== "undefined" && CITY.on && player && !player.inVehicle) { const t = findInteractTarget(); if (t && t.kind === "jawaTrade") { locnTrade(t.J); return; } }
    return _twi();
  };
  if (typeof noiseEmit === "function") { const _ne = noiseEmit; window.noiseEmit = noiseEmit = function (x, y, L0) { const r = _ne.apply(this, arguments); if (LOCN.list.length && L0 >= 95) locnScare(x, y, 520, 4 + Math.random() * 2); return r; }; }
  if (typeof spawnBlastWave === "function") { const _sb = spawnBlastWave; window.spawnBlastWave = spawnBlastWave = function (x, y, R) { const r = _sb.apply(this, arguments); if (LOCN.list.length) locnScare(x, y, (R || 60) * 3, 5); return r; }; }
  if (typeof V10 !== "undefined") {
    V10.onRunStart.push(() => { locnClear(); LOCN.scanT = 0; });
    V10.onStep.push(locnStep);
    V10.onRenderWorld.push(locnRender);
    V10.onRunReset.push(locnClear);
  }
})();
// EOF:js/locals.js
