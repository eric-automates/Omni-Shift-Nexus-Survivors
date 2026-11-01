/* =========================================================================
   OMNI-SHIFT v14.2 — ITEMS · SEARCHABLE FURNITURE · POCKET CAPSULES · COURIER (js/items.js)
   • every cabinet, shelf, fridge, dresser, wardrobe, desk, locker, crate,
     safe, gun rack… can be searched: [F] / the hand button next to it.
     Its contents are rolled the first time anyone opens it (what kind of
     furniture, what kind of building, which scenario) and REMEMBERED per
     world — come back next run and that fridge is still empty
   • automatic, never fiddly: searching takes everything you can carry;
     weapons land at your feet and the arsenal picks them up as usual
     (rare ★ UNIQUE weapons start at LV 3); a med kit is used by itself when
     you drop under a third of your health, a stim when you're swarmed
   • the 🎒 bag (button by the minimap, or I): wallet, supplies, Pocket
     Capsules (throw one → a ship / car pops out, yours to pilot) and the
     courier: send a weapon you don't want away and get paid what it's
     worth — a probe droid, a raven, an owl, a delivery drone or a
     transporter beam, whatever fits the universe
   ========================================================================= */
"use strict";

const IT = { bag: null, fit: null, fitT: -1, drone: [], pops: [], uniq: [], toastT: 0, autoT: 0, contCache: new WeakMap(), panel: null };
// kinds: i icon · n name · v base value (the market and the courier start from it) · cap how many fit in the bag
const IT_DEF = {
  med:      { i: "🩹", n: "Med kit", v: 45, cap: 9 },
  stim:     { i: "💉", n: "Stim shot", v: 60, cap: 5 },
  food:     { i: "🥫", n: "Food", v: 9, cap: 20 },
  water:    { i: "💧", n: "Water", v: 6, cap: 20 },
  ammo:     { i: "🔋", n: "Ammo", v: 14, cap: 30 },
  scrap:    { i: "⚙️", n: "Parts", v: 16, cap: 40 },
  valuable: { i: "💎", n: "Valuables", v: 120, cap: 20 },
  capsule:  { i: "💊", n: "Pocket Capsule", v: 450, cap: 6 }
};
// per universe (faction id; "real" = a real-world map): money, a food & ammo word, the courier
const IT_FLAVOR = {
  0: { cur: "credits", food: "Ration bars", ammo: "Power packs", courier: "probe droid", cIcon: "🛰️" },
  1: { cur: "credits", food: "MREs", ammo: "Magazines", courier: "MALP drone", cIcon: "🛰️" },
  2: { cur: "platinum", food: "Protein bars", ammo: "Ammo", courier: "courier drone", cIcon: "🛸" },
  3: { cur: "solaris", food: "Spice bread", ammo: "Charge packs", courier: "ornithopter courier", cIcon: "🦋" },
  4: { cur: "credits", food: "Replicator rations", ammo: "Power cells", courier: "transporter", cIcon: "✨", beam: 1 },
  5: { cur: "W-Y scrip", food: "Field rations", ammo: "Magazines", courier: "W-Y drone", cIcon: "🛸" },
  6: { cur: "zeni", food: "Meat buns", ammo: "Ki crystals", courier: "capsule drone", cIcon: "🛸" },
  7: { cur: "eddies", food: "Scop packs", ammo: "Smart rounds", courier: "delivery drone", cIcon: "🛸" },
  8: { cur: "credits", food: "Vending snacks", ammo: "Magazines", courier: "sentry drone", cIcon: "🛸" },
  9: { cur: "crowns", food: "Bread & cheese", ammo: "Bolts", courier: "raven", cIcon: "🐦‍⬛" },
  10: { cur: "galleons", food: "Pumpkin pasties", ammo: "Spell charges", courier: "owl", cIcon: "🦉" },
  real: { cur: "dollars", food: "Snacks", ammo: "Ammo", courier: "delivery drone", cIcon: "🛸", sym: "$" }
};
function itFlavor() {
  if (typeof RG !== "undefined" && RG.real) return IT_FLAVOR.real;
  const f = player && player.fac ? player.fac.id : 0;
  return IT_FLAVOR[f] || IT_FLAVOR[0];
}
function itName(k) { const F = itFlavor(); return k === "food" ? F.food : k === "ammo" ? F.ammo : IT_DEF[k] ? IT_DEF[k].n : k; }
function itMoney(n) { const F = itFlavor(); return F.sym ? F.sym + Math.round(n).toLocaleString() : Math.round(n).toLocaleString() + " " + F.cur; }

// furniture you can search: label + loot table
const IT_CONT = {
  cabinet: ["CABINET", "home"], shelf: ["SHELF", "shop"], bookshelf: ["BOOKSHELF", "books"], fridge: ["FRIDGE", "fridge"], stove: ["OVEN", "fridge"],
  dresser: ["DRESSER", "home"], wardrobe: ["WARDROBE", "home"], nightstand: ["NIGHTSTAND", "home"], tvstand: ["TV STAND", "home"],
  locker: ["LOCKER", "locker"], lockers: ["LOCKERS", "locker"], crate: ["CRATE", "crate"], rack: ["RACK", "crate"], safeboxes: ["SAFE", "safe"],
  desk: ["DESK", "office"], teacherdesk: ["DESK", "office"], deskpod: ["DESK", "office"], counter: ["COUNTER", "shop"], barcounter: ["BAR", "bar"], bar: ["BAR", "bar"],
  gunrack: ["GUN RACK", "guns"]
};
// [kind, weight, min, max] — "weapon" rolls a hero weapon (u = unique chance)
const IT_LOOT = {
  home:   { rolls: [0, 3], t: [["cash", 30, 4, 40], ["med", 9, 1, 1], ["food", 16, 1, 2], ["water", 10, 1, 2], ["scrap", 12, 1, 2], ["valuable", 6, 1, 1], ["stim", 3, 1, 1], ["capsule", 0.6, 1, 1], ["weapon", 1.2]] },
  fridge: { rolls: [0, 3], t: [["food", 50, 1, 3], ["water", 40, 1, 3], ["med", 2, 1, 1]] },
  shop:   { rolls: [0, 3], t: [["food", 20, 1, 3], ["water", 15, 1, 3], ["scrap", 20, 1, 3], ["cash", 14, 5, 25], ["med", 8, 1, 1], ["ammo", 8, 1, 2], ["capsule", 0.8, 1, 1], ["weapon", 1]] },
  books:  { rolls: [0, 2], t: [["cash", 15, 2, 15], ["valuable", 4, 1, 1], ["scrap", 6, 1, 1], ["capsule", 0.4, 1, 1]] },
  locker: { rolls: [0, 3], t: [["ammo", 20, 1, 3], ["med", 14, 1, 1], ["cash", 15, 5, 30], ["scrap", 15, 1, 2], ["stim", 8, 1, 1], ["weapon", 3]] },
  crate:  { rolls: [1, 3], t: [["scrap", 30, 1, 4], ["ammo", 18, 1, 3], ["food", 10, 1, 2], ["water", 10, 1, 2], ["capsule", 1.2, 1, 1], ["weapon", 2.5]] },
  safe:   { rolls: [1, 3], t: [["cash", 50, 40, 250], ["valuable", 30, 1, 3], ["capsule", 6, 1, 1], ["weapon", 8, 0, 0, 1]] },
  office: { rolls: [0, 2], t: [["cash", 30, 5, 30], ["scrap", 15, 1, 2], ["stim", 5, 1, 1], ["valuable", 5, 1, 1], ["capsule", 1, 1, 1]] },
  bar:    { rolls: [0, 3], t: [["water", 30, 1, 3], ["food", 20, 1, 2], ["cash", 25, 5, 40], ["weapon", 1.5]] },
  guns:   { rolls: [1, 3], t: [["ammo", 50, 2, 5], ["weapon", 20, 0, 0, 0.3], ["med", 5, 1, 1]] }
};
// what the building is shifts the odds (a clinic's cabinets hold medicine, a police station's lockers ammo)
const IT_BLD_MUL = {
  hospital: { med: 4, stim: 3 }, clinic: { med: 4, stim: 2 }, pharmacy: { med: 5, stim: 3 }, police: { ammo: 3, weapon: 2.5 }, military: { ammo: 4, weapon: 3 },
  school: { scrap: 2, food: 1.5 }, restaurant: { food: 3, water: 2 }, cafe: { food: 2.5, water: 2 }, bar: { water: 2 }, supermarket: { food: 3, water: 3 },
  grocery: { food: 3, water: 3 }, bank: { cash: 3, valuable: 2 }, jewelry: { valuable: 4 }, warehouse: { scrap: 2, capsule: 2 }, factory: { scrap: 3 }, hardware: { scrap: 3 }, gas: { food: 2, water: 2 }
};
// Pocket Capsules: what pops out (flight-capable kinds fly once js/flight.js has them; until then a hover car)
const IT_CAPSULES = [
  ["pod", "Attack pod", 0.18], ["gship", "Gravity ship", 0.16], ["jet", "Capsule jet", 0.22], ["heli", "Capsule copter", 0.14], ["hover", "Hover car", 0.3]
];

/* --- the bag ---------------------------------------------------------------------- */
function itNewBag() { return { med: 0, stim: 0, food: 0, water: 0, ammo: 0, scrap: 0, valuable: 0, caps: [] }; }
function itBag() { if (!IT.bag) IT.bag = itNewBag(); return IT.bag; }
function itWallet() { return typeof meta !== "undefined" ? (meta.wallet || 0) : 0; }
function itPay(n, why) {
  if (typeof meta === "undefined") return;
  meta.wallet = Math.max(0, Math.round((meta.wallet || 0) + n));
  if (typeof saveMeta === "function") saveMeta();
  itHudCash();
  if (why) itToast((n >= 0 ? "+" : "−") + itMoney(Math.abs(n)) + " · " + why, n >= 0 ? "#00e676" : "#ffab40");
}
function itAdd(k, n) {   // → how many fitted
  const B = itBag(), D = IT_DEF[k];
  if (!D) return 0;
  if (k === "capsule") return 0;
  const room = Math.max(0, D.cap - (B[k] || 0)), got = Math.min(room, n);
  B[k] = (B[k] || 0) + got;
  return got;
}
function itToast(msg, col) {
  if (!player) return;
  if (typeof spawnSpeech === "function") spawnSpeech(player.x, player.y - 30 - (IT.toastT > runTime ? 14 : 0), msg, col || "#ffd166", 2.6);
  IT.toastT = runTime + 0.6;
}
function itHudCash() {
  let el = document.getElementById("hudCash");
  if (!el) {
    const dm = document.getElementById("hudDM"); if (!dm) return;
    el = document.createElement("div"); el.className = "stat-pill"; el.id = "hudCash"; el.title = "Wallet — spend it at a kiosk or computer terminal";
    dm.insertAdjacentElement("afterend", el);
  }
  el.textContent = "💵 " + itMoney(itWallet());
  el.style.display = typeof CITY !== "undefined" && CITY.on ? "" : "none";
}

/* --- searchable furniture ------------------------------------------------------------- */
function itWorldKey() { try { return typeof regionWorldKey === "function" ? regionWorldKey() : "nexus"; } catch (e) { return "nexus"; } }
function itStore() {
  if (typeof meta === "undefined") return {};
  if (!meta.cont || typeof meta.cont !== "object") meta.cont = {};
  const wk = itWorldKey();
  if (!meta.cont[wk]) {
    meta.cont[wk] = { t: Date.now(), c: {} };
    const ks = Object.keys(meta.cont);
    if (ks.length > 12) { ks.sort((a, b) => (meta.cont[a].t || 0) - (meta.cont[b].t || 0)); delete meta.cont[ks[0]]; }   // the 12 worlds you played last
  }
  meta.cont[wk].t = Date.now();
  return meta.cont[wk].c;
}
function itContList(b) {   // searchable furniture of a building: [{fi, t, x0, y0, x1, y1}] in world tiles
  const G = b.int || (typeof cityInterior === "function" ? cityInterior(b) : null);
  if (!G) return [];
  let L = IT.contCache.get(G);
  if (L) return L;
  L = [];
  G.furn.forEach((f, fi) => { if (IT_CONT[f.t]) L.push({ fi, t: f.t, x0: b.x + f.x, y0: b.y + f.y, x1: b.x + f.x + f.w, y1: b.y + f.y + f.h }); });
  IT.contCache.set(G, L);
  return L;
}
function itNearCont() {
  if (!player || player.inVehicle || typeof cityBuildingAt !== "function" || !CITY.on) return null;
  const b = cityBuildingAt(player.x, player.y);
  if (!b) return null;
  const tx = (player.x + CITY.orx) / 16, ty = (player.y + CITY.ory) / 16;
  let best = null, bd = 2.4;   // tiles (1.2 m) from the furniture's edge
  for (const c of itContList(b)) {
    const dx = Math.max(c.x0 - tx, 0, tx - c.x1), dy = Math.max(c.y0 - ty, 0, ty - c.y1), d = Math.hypot(dx, dy);
    if (d < bd) { bd = d; best = c; }
  }
  return best ? { b, c: best } : null;
}
function itRollN(r, a, b) { return a + Math.floor(r() * (b - a + 1)); }
function itPickWeapon(r) {
  const canon = []; const n = typeof CHAR_RAW !== "undefined" ? CHAR_RAW.length : 80;
  for (let i = 0; i < n; i++) { if (i === 80 || !CHAR_RAW[i]) continue; canon.push(i); }
  const fac = player && player.fac ? player.fac.id : -1, mine = canon.filter(i => CHAR_RAW[i][1] === fac);
  const pool = mine.length && r() < 0.6 ? mine : canon;
  return pool[Math.floor(r() * pool.length)];
}
function itRoll(b, c) {
  const L = IT_LOOT[IT_CONT[c.t][1]], mul = IT_BLD_MUL[b.kind] || IT_BLD_MUL[b.type] || {}, r = Math.random, out = [];
  const apoc = typeof APOC !== "undefined" && APOC.on;
  let rolls = itRollN(r, L.rolls[0], L.rolls[1]) + (apoc ? 1 : 0);
  const tbl = L.t.map(e => [e[0], e[1] * (mul[e[0]] || 1) * (apoc && (e[0] === "ammo" || e[0] === "food" || e[0] === "water" || e[0] === "med") ? 1.6 : 1) * (apoc && e[0] === "cash" ? 0.4 : 1), e[2], e[3], e[4]]);
  const tot = tbl.reduce((t, e) => t + e[1], 0);
  while (rolls-- > 0) {
    let x = r() * tot, e = tbl[0];
    for (const q of tbl) { x -= q[1]; if (x <= 0) { e = q; break; } }
    if (e[0] === "weapon") { const w = itPickWeapon(r); out.push({ k: "weapon", w, u: r() < (e[4] != null ? e[4] : 0.25) ? 1 : 0 }); }
    else if (e[0] === "capsule") { let x2 = r(), q = IT_CAPSULES[IT_CAPSULES.length - 1]; for (const cp of IT_CAPSULES) { x2 -= cp[2]; if (x2 <= 0) { q = cp; break; } } out.push({ k: "capsule", q: q[0] }); }
    else { const n = itRollN(r, e[2], e[3]); const same = out.find(o => o.k === e[0]); if (same) same.n += n; else out.push({ k: e[0], n }); }
  }
  return out;
}
function itSearch(t) {
  const S = itStore(), key = t.b.uid + ":" + t.c.fi, lbl = IT_CONT[t.c.t][0];
  let items = S[key];
  const first = !Array.isArray(items);
  if (first) items = itRoll(t.b, t.c);
  const got = [], left = [];
  for (const it of items) {
    if (it.k === "cash") { itPay(it.n); got.push("💵 " + itMoney(it.n)); continue; }
    if (it.k === "weapon") { itDropWeapon(it.w, it.u); got.push((it.u ? "★ " : "") + (CHAR_RAW[it.w] ? CHAR_RAW[it.w][4] : "weapon")); continue; }
    if (it.k === "capsule") { const B = itBag(); if (B.caps.length < IT_DEF.capsule.cap) { B.caps.push(it.q); got.push("💊 " + itCapName(it.q)); } else left.push(it); continue; }
    const n = itAdd(it.k, it.n);
    if (n) got.push(IT_DEF[it.k].i + " " + (n > 1 ? n + "× " : "") + itName(it.k));
    if (n < it.n) left.push({ k: it.k, n: it.n - n });
  }
  S[key] = left;
  if (typeof saveMeta === "function") saveMeta();
  if (typeof sfx === "function") sfx(first ? 520 : 300, first ? 780 : 260, 0.12, "triangle", 0.12);
  if (got.length) itToast("🔍 " + lbl + ": " + got.slice(0, 4).join(" · ") + (got.length > 4 ? " …" : ""), "#ffd166");
  else itToast("🔍 " + lbl + (first ? ": nothing useful" : ": already searched — empty") + (left.length ? " (bag full)" : ""), "#90a4ae");
  if (typeof updateHUD === "function") updateHUD();
  if (typeof ECO !== "undefined" && typeof ecoWitnessTheft === "function") ecoWitnessTheft(t.b, got.length);
  return got;
}
function itDropWeapon(w, u) {
  if (typeof spawnWeaponDrop !== "function" || !CHAR_RAW[w]) return;
  spawnWeaponDrop(player.x + 6, player.y + 6, w);
  const d = activeWeaponDrops[activeWeaponDrops.length - 1];
  if (d && u) { d.unique = 1; IT.uniq.push({ w, t: runTime }); }
}
function itSearched(b, fi) { const S = itStore(), v = S[b.uid + ":" + fi]; return Array.isArray(v) ? (v.length ? 1 : 2) : 0; }

/* --- using things ---------------------------------------------------------------- */
function itUse(k) {
  const B = itBag();
  if (!(B[k] > 0) || !player) return false;
  if (k === "med") { if (player.hp >= player.maxHp) return false; player.hp = Math.min(player.maxHp, player.hp + player.maxHp * 0.4); itToast("🩹 MED KIT +40%", "#00e676"); }
  else if (k === "stim") { player.itStimT = runTime + 20; itToast("💉 STIM — faster for 20 s", "#4fc3f7"); }
  else if (k === "food" || k === "water") { if (typeof ecoEat === "function") { if (!ecoEat(k)) return false; } else if (player.hp < player.maxHp) player.hp = Math.min(player.maxHp, player.hp + player.maxHp * 0.06); else return false; }
  else return false;
  B[k]--;
  if (typeof sfx === "function") sfx(660, 990, 0.1, "sine", 0.1);
  if (typeof updateHUD === "function") updateHUD();
  return true;
}
function itAutoUse(dt) {
  if (!player || !runActive || runPaused) return;
  if (runTime < IT.autoT) return;
  IT.autoT = runTime + 0.5;
  const B = itBag();
  if (B.med > 0 && player.hp > 0 && player.hp < player.maxHp * 0.34) itUse("med");
  if (B.stim > 0 && !(player.itStimT > runTime) && player.hp < player.maxHp * 0.6 && typeof eAct !== "undefined") {
    let n = 0; for (let j = 0; j < eAct.length && n < 6; j++) if (eAct[j] && Math.abs(eX[j] - player.x) < 320 && Math.abs(eY[j] - player.y) < 320) n++;
    if (n >= 6) itUse("stim");
  }
}

/* --- Pocket Capsules -------------------------------------------------------------- */
function itCapName(q) { const c = IT_CAPSULES.find(e => e[0] === q); return c ? c[1] : "Capsule"; }
function itThrowCapsule(i) {
  const B = itBag(), q = B.caps[i];
  if (!q || !player || player.inVehicle || typeof vehNew !== "function" || !CITY.on) return false;
  // a clear spot a few metres ahead (outdoors, nothing solid)
  const a = player.moveDir != null ? player.moveDir : 0;
  let spot = null;
  for (const d of [130, 170, 100, 210, 70]) for (const da of [0, 0.6, -0.6, 1.3, -1.3, Math.PI]) {
    const x = player.x + Math.cos(a + da) * d, y = player.y + Math.sin(a + da) * d;
    if (spot) break;
    let ok = true;
    for (let k = 0; k < 9 && ok; k++) { const fx = x + ((k % 3) - 1) * 48, fy = y + (Math.floor(k / 3) - 1) * 64; if (cityFlagsAt(fx, fy) & (F_MOVE | F_IN | F_WATER)) ok = false; }
    if (ok) spot = [x, y];
  }
  if (!spot) { itToast("💊 No room to open it here — step outside", "#ffab40"); return false; }
  const kind = (typeof VK !== "undefined" && VK[q]) ? q : "hover";
  const dims = (typeof FLY_DIMS !== "undefined" && FLY_DIMS[kind]) || [76, 150];
  const v = vehNew(kind, spot[0], spot[1], a, dims[0], dims[1], { key: "cap" + Date.now() + "_" + i, from: "capsule", fuel: 1, k: typeof vehWorldK === "function" ? vehWorldK() : 1 });
  v.capsule = q; v.mine = true; VEH.lastMine = v;
  if (typeof vehQueueRebuild === "function") vehQueueRebuild((spot[0] + CITY.orx) / 16, (spot[1] + CITY.ory) / 16, spot[0], spot[1], 200);
  B.caps.splice(i, 1);
  IT.pops.push({ x: spot[0], y: spot[1], t: runTime });
  if (typeof sfx === "function") { sfx(200, 1400, 0.25, "square", 0.14); setTimeout(() => sfx(900, 300, 0.2, "sine", 0.1), 120); }
  itToast("💊 POP! " + itCapName(q).toUpperCase() + " — press F to board", "#ffd166");
  return true;
}

/* --- the courier: send away a weapon you don't want, get paid ----------------------------- */
function itWeaponValue(w) {
  const base = 80 * (1 + 0.5 * (w.lvl || 1)) * (w.unique ? 3 : 1);
  const m = typeof ecoPriceMul === "function" ? ecoPriceMul("weapon") : 1;
  return Math.round(base * m);
}
function itCourierSend(wi) {
  if (!player || !player.weapons[wi]) return false;
  const en = player.weapons.filter(pw => pw.enabled !== false);
  if (en.length <= 1 && player.weapons[wi].enabled !== false) { itToast("Keep at least one weapon", "#ffab40"); return false; }
  const w = player.weapons[wi], F = itFlavor(), pay = itWeaponValue(w);
  player.weapons.splice(wi, 1);
  player.handSlotOffset = 0; player.swapTimer = 0;
  if (!player.weapons.some(pw => pw.style === "orbit" || (typeof isSwordWeapon === "function" && isSwordWeapon(pw.id)))) player.hasSaber = player.hasSaber && player.weapons.length > 0 && player.weapons.some(pw => pw.style === "orbit");
  const ang = Math.random() * Math.PI * 2;
  IT.drone.push({ w, pay, name: F.courier, icon: F.cIcon, beam: !!F.beam, t: 0, x: player.x + Math.cos(ang) * 900, y: player.y + Math.sin(ang) * 900, ox: Math.cos(ang), oy: Math.sin(ang), st: 0 });
  if (typeof updateHUD === "function") updateHUD();
  itToast((F.beam ? "✨ Beaming away " : "📦 A " + F.courier + " is coming for ") + w.name, "#4fc3f7");
  return true;
}
function itDroneStep(dt) {
  for (let i = IT.drone.length - 1; i >= 0; i--) {
    const D = IT.drone[i]; D.t += dt;
    if (D.beam) { if (D.t > 1.4) { itPay(D.pay, "transporter: " + D.w.name); IT.drone.splice(i, 1); } continue; }
    const tx = D.st === 0 ? player.x + 18 : player.x + D.ox * 1400, ty = D.st === 0 ? player.y - 26 : player.y + D.oy * 1400;
    const dx = tx - D.x, dy = ty - D.y, d = Math.hypot(dx, dy), sp = D.st === 0 ? 520 : 640;
    if (D.st === 0 && d < 14) { D.st = 1; D.hold = 0.6; if (typeof sfx === "function") sfx(700, 1200, 0.08, "square", 0.08); }
    if (D.st === 1) { D.hold -= dt; if (D.hold <= 0) { D.st = 2; itPay(D.pay, "the " + D.name + " took " + D.w.name); } continue; }
    if (d > 1) { D.x += dx / d * Math.min(d, sp * dt); D.y += dy / d * Math.min(d, sp * dt); }
    if (D.st === 2 && d < 30) IT.drone.splice(i, 1);
  }
}
function itRenderWorld(g) {
  if (!player) return;
  // the courier
  for (const D of IT.drone) {
    if (D.beam) {
      const k = Math.min(1, D.t / 1.4);
      g.save(); g.globalAlpha = 1 - k * 0.6;
      for (let s = 0; s < 14; s++) { const yy = player.y - 40 + ((s * 37 + D.t * 300) % 70), xx = player.x + 20 + Math.sin(s * 9 + D.t * 20) * 9; g.fillStyle = s % 2 ? "#bbdefb" : "#ffffff"; g.fillRect(xx, yy, 2, 2); }
      g.restore(); continue;
    }
    g.save(); g.translate(D.x, D.y);
    g.fillStyle = "rgba(0,0,0,0.25)"; g.beginPath(); g.ellipse(4, 22, 12, 4, 0, 0, Math.PI * 2); g.fill();
    g.font = "24px serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(D.icon, 0, 0);
    if (D.st >= 1) { g.fillStyle = D.w.bladeCol || "#ffd166"; g.fillRect(-3, 12, 6, 14); }
    g.restore();
  }
  // capsule pops
  for (let i = IT.pops.length - 1; i >= 0; i--) {
    const P = IT.pops[i], k = (runTime - P.t) / 0.9;
    if (k > 1) { IT.pops.splice(i, 1); continue; }
    g.save(); g.globalAlpha = 1 - k;
    for (let s = 0; s < 10; s++) { const a = s / 10 * Math.PI * 2; g.fillStyle = s % 2 ? "#ffffff" : "#e0e0e0"; g.beginPath(); g.arc(P.x + Math.cos(a) * 60 * k, P.y + Math.sin(a) * 60 * k, 26 * (1 - k * 0.5), 0, Math.PI * 2); g.fill(); }
    g.restore();
  }
  // searched furniture close by: a small tag (✓ empty · • something left)
  if (CITY.on && !player.inVehicle && typeof cityBuildingAt === "function") {
    const b = cityBuildingAt(player.x, player.y);
    if (b) {
      g.save(); g.font = "9px sans-serif"; g.textAlign = "center";
      for (const c of itContList(b)) {
        const s = itSearched(b, c.fi); if (!s) continue;
        const x = (c.x0 + c.x1) / 2 * 16 - CITY.orx, y = (c.y0 + c.y1) / 2 * 16 - CITY.ory;
        if (Math.abs(x - player.x) > 520 || Math.abs(y - player.y) > 400) continue;
        g.fillStyle = s === 2 ? "rgba(144,164,174,0.85)" : "rgba(255,209,102,0.95)"; g.fillText(s === 2 ? "✓" : "•", x, y + 3);
      }
      g.restore();
    }
  }
}

/* --- the 🎒 panel --------------------------------------------------------------- */
function itPanelOpen() {
  if (!runActive || IT.panel) return;
  const el = document.createElement("div"); el.id = "itPanel";
  el.style.cssText = "position:fixed;inset:0;z-index:99980;background:rgba(3,7,12,0.78);display:flex;align-items:center;justify-content:center;font-family:'Segoe UI',sans-serif";
  document.body.appendChild(el); IT.panel = el; IT.wasPaused = runPaused; runPaused = true;
  el.addEventListener("click", e => { if (e.target === el) itPanelClose(); });
  itPanelRender();
}
function itPanelClose() { if (!IT.panel) return; IT.panel.remove(); IT.panel = null; runPaused = !!IT.wasPaused; }
function itPanelRender() {
  const el = IT.panel; if (!el) return;
  const B = itBag(), F = itFlavor();
  const row = (k) => { const n = B[k] || 0, can = (k === "med" || k === "stim" || k === "food" || k === "water") && n > 0; return '<div class="it-row"><span>' + IT_DEF[k].i + " " + itName(k) + "</span><b>" + n + "</b>" + (can ? '<button class="btn" data-ituse="' + k + '">USE</button>' : "<i></i>") + "</div>"; };
  let h = '<div style="width:min(560px,94vw);max-height:88vh;overflow:auto;background:#08111b;border:1px solid #00e5ff55;border-radius:10px;padding:14px 16px;color:#d6e9f5">';
  h += '<div style="display:flex;justify-content:space-between;align-items:center"><b style="font-size:17px;color:#ffd166">🎒 BAG</b><span style="font-size:15px">💵 ' + itMoney(itWallet()) + '</span><button class="btn" id="itX">✖</button></div>';
  h += '<div style="font-size:11px;color:#89a;margin:4px 0 10px">Searching furniture fills the bag by itself · med kits and stims are used automatically when you need them' + (typeof ECO !== "undefined" && ECO.needs ? " · food & water too" : "") + ".</div>";
  h += '<style>#itPanel .it-row{display:grid;grid-template-columns:1fr 40px 74px;align-items:center;gap:8px;padding:3px 0;border-bottom:1px solid #ffffff10}#itPanel .it-row b{text-align:right}#itPanel .btn{padding:3px 8px;font-size:12px}</style>';
  for (const k of ["med", "stim", "food", "water", "ammo", "scrap", "valuable"]) h += row(k);
  h += '<div style="margin:12px 0 4px;color:#ffd166;font-weight:700">💊 POCKET CAPSULES</div>';
  h += B.caps.length ? B.caps.map((q, i) => '<div class="it-row"><span>💊 ' + itCapName(q) + '</span><b></b><button class="btn" data-itcap="' + i + '">THROW</button></div>').join("") : '<div style="font-size:12px;color:#789">None yet — they turn up in desks, safes and crates.</div>';
  h += '<div style="margin:12px 0 4px;color:#ffd166;font-weight:700">' + F.cIcon + " COURIER — send away a weapon, get paid (" + F.courier + ")</div>";
  h += (player.weapons || []).map((w, i) => '<div class="it-row"><span>' + (w.unique ? "★ " : "") + w.name + " <small style=\"color:#789\">LV " + w.lvl + '</small></span><b style="color:#00e676;font-weight:600;font-size:12px">' + itMoney(itWeaponValue(w)) + '</b><button class="btn" data-itsend="' + i + '">SEND</button></div>').join("");
  h += "</div>";
  el.innerHTML = h;
  el.querySelector("#itX").onclick = itPanelClose;
  el.querySelectorAll("[data-ituse]").forEach(b => b.onclick = () => { itUse(b.dataset.ituse); itPanelRender(); });
  el.querySelectorAll("[data-itcap]").forEach(b => b.onclick = () => { itPanelClose(); itThrowCapsule(+b.dataset.itcap); });
  el.querySelectorAll("[data-itsend]").forEach(b => b.onclick = () => { if (confirm("Send " + player.weapons[+b.dataset.itsend].name + " away for " + itMoney(itWeaponValue(player.weapons[+b.dataset.itsend])) + "?")) { itCourierSend(+b.dataset.itsend); itPanelRender(); } });
}

/* --- engine hooks ------------------------------------------------------------------- */
(function itWire() {
  const _fit = window.findInteractTarget, _twi = window.triggerWorldInteract;
  if (typeof _fit === "function") window.findInteractTarget = function () {
    const t = _fit();
    if (t || !CITY.on || !player || player.inVehicle) return t;
    if (IT.fitT === runTime) return IT.fit;
    IT.fitT = runTime;
    const n = itNearCont();
    IT.fit = n ? { kind: "itCont", b: n.b, c: n.c, x: (n.c.x0 + n.c.x1) / 2 * 16 - CITY.orx, y: (n.c.y0 + n.c.y1) / 2 * 16 - CITY.ory - 10, label: "[F] SEARCH " + IT_CONT[n.c.t][0] + (itSearched(n.b, n.c.fi) === 2 ? " (empty)" : "") } : null;
    return IT.fit;
  };
  if (typeof _twi === "function") window.triggerWorldInteract = function () {
    if (CITY.on && player && !player.inVehicle) { const t = findInteractTarget(); if (t && t.kind === "itCont") { itSearch(t); IT.fitT = -1; return; } }
    return _twi();
  };
  window.addEventListener("keydown", e => {
    if (e.repeat) return;
    if (e.code === "KeyI" && runActive && typeof CITY !== "undefined" && CITY.on) { if (IT.panel) itPanelClose(); else if (!runPaused) itPanelOpen(); }
    else if (e.code === "Escape" && IT.panel) itPanelClose();
  });
  const addBtn = () => {
    const ctl = document.getElementById("mmCtl");
    if (!ctl || document.getElementById("mmBag")) return;
    const b = document.createElement("button"); b.className = "btn"; b.id = "mmBag"; b.title = "Bag, capsules & courier (I)"; b.textContent = "🎒";
    b.onclick = () => { if (IT.panel) itPanelClose(); else itPanelOpen(); };
    ctl.insertBefore(b, ctl.firstChild);
  };
  if (typeof V10 !== "undefined") {
    V10.onRunStart.push(() => { IT.bag = itNewBag(); IT.drone.length = 0; IT.pops.length = 0; IT.uniq.length = 0; IT.fitT = -1; IT.contCache = new WeakMap(); addBtn(); itHudCash(); });
    V10.onStep.push((dt) => {
      if (!CITY.on) return;
      itAutoUse(dt); itDroneStep(dt);
      // a stim: +35 % speed while it lasts (applied to the hero's base speed and taken back after)
      const stim = player.itStimT > runTime;
      if (stim && !player.itStimOn) { player.itStimOn = 1; player.spd = (player.spd || 110) * 1.35; }
      else if (!stim && player.itStimOn) { player.itStimOn = 0; player.spd = (player.spd || 148.5) / 1.35; }
      // ★ unique weapons: once the arsenal took it, it starts at LV 3 and wears a star
      for (let i = IT.uniq.length - 1; i >= 0; i--) {
        const U = IT.uniq[i], still = activeWeaponDrops.some(d => d.wpnId === U.w && d.unique);
        if (still && runTime - U.t < 30) continue;
        const pw = player.weapons.find(p => p.id === U.w);
        if (pw && !pw.unique) { pw.unique = 1; pw.lvl = Math.max(pw.lvl, 3); pw.name = "★ " + pw.name.replace(/^★ /, ""); itToast("★ UNIQUE: " + pw.name + " (LV " + pw.lvl + ")", "#ffd166"); }
        IT.uniq.splice(i, 1);
      }
    });
    V10.onRenderWorld.push((g) => { if (CITY.on) itRenderWorld(g); });
    V10.onRunReset.push(() => { itPanelClose(); const el = document.getElementById("hudCash"); if (el) el.style.display = "none"; });
  }
  setTimeout(addBtn, 0);
})();
// EOF:js/items.js
