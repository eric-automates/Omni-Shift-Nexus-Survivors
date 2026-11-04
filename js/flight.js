/* =========================================================================
   OMNI-SHIFT v14.2 — FLIGHT (js/flight.js)
   One flight model for everything that flies: helicopters, planes and
   airliners at the airports, the ships of every universe (skyhoppers,
   freighters, transports, ornithopters, gliders, dropships, Ospreys,
   shuttles), flying cars (spinners, the Anglia), Pocket-Capsule ships
   (attack pod, gravity ship, capsule jet, capsule copter) — and heroes who
   fly by themselves (jetpacks, rocket boosters, suspensors, dark & hex
   flight, wizards' brooms; ki flight with the Ki-Surge class).
   • soft-Newtonian: push where you want to go and you keep drifting until
     drag or thrust says otherwise; ⏹ HOVER (H) kills the drift fast
   • 🛡 SAFE / ⚠ UNSAFE (K, asks first): flight assists off — no altitude
     hold, almost no drag, double top speed — red cabin lights on
   • ▲ Space / E climb · ▼ Shift / Q descend · 👁 C cockpit view · F get
     out (above the rooftops: bail out with a parachute) · G take off /
     land when you fly by yourself
   • from the treetops to the edge of space: the camera pulls back with
     altitude until the whole map is in view; above ~35 km the air thins
     and climbing slows to a stop. Ground detail steps down in levels
     (city art → aerial tiles → the whole region), Nanite-style, so it
     stays fast; two cloud layers, haze, the black of space at the top
   • components: engines, wings, rotor, tail, gear, cockpit take damage
     and break off (and change how it flies); hit the ground too hard and
     it breaks up
   ========================================================================= */
"use strict";

// kind → n name · vtol · top m/s · acc m/s² · climb m/s · ceil m · turn rad/s · hp · parts · dims [L, D] px · art (RG_SHIP_ART key / own) · sc art scale
const FLY_SPECS = {
  heli:      { n: "HELICOPTER", vtol: 1, top: 75, acc: 9, climb: 11, ceil: 6000, turn: 1.8, hp: 260, parts: ["rotor", "tail", "engine", "cockpit", "gear"], dims: [96, 380], own: "heli" },
  jet:       { n: "CAPSULE JET", vtol: 1, top: 240, acc: 26, climb: 38, ceil: 15000, turn: 1.3, hp: 220, parts: ["engineL", "engineR", "wingL", "wingR", "cockpit", "gear"], dims: [280, 400], own: "jet" },
  plane:     { n: "AIRLINER", vtol: 0, takeoff: 55, stall: 42, top: 250, acc: 6, climb: 14, ceil: 12000, turn: 0.5, hp: 700, parts: ["engineL", "engineR", "wingL", "wingR", "tail", "cockpit", "gear"], dims: [1088, 960], art: "plane" },
  pod:       { n: "ATTACK POD", vtol: 1, top: 380, acc: 55, climb: 80, ceil: 80000, turn: 2.6, hp: 170, parts: ["thruster", "shell", "cockpit"], dims: [112, 112], own: "pod", space: 1 },
  gship:     { n: "GRAVITY SHIP", vtol: 1, top: 280, acc: 22, climb: 45, ceil: 80000, turn: 1.0, hp: 420, parts: ["engineL", "engineR", "shell", "cockpit", "gear"], dims: [420, 420], own: "gship", space: 1 },
  skyhopper: { n: "SKYHOPPER", vtol: 1, top: 120, acc: 22, climb: 25, ceil: 9000, turn: 2.0, hp: 140, parts: ["engineL", "engineR", "tail", "cockpit"], dims: [208, 176], art: "skyhopper" },
  freighter: { n: "LIGHT FREIGHTER", vtol: 1, top: 320, acc: 30, climb: 60, ceil: 80000, turn: 1.1, hp: 600, parts: ["engineL", "engineR", "shell", "cockpit", "gear"], dims: [544, 416], art: "freighter", space: 1 },
  transport: { n: "TRANSPORT", vtol: 1, top: 200, acc: 14, climb: 30, ceil: 60000, turn: 0.8, hp: 520, parts: ["engineL", "engineR", "shell", "cockpit", "gear"], dims: [704, 352], art: "transport", space: 1 },
  firefly:   { n: "FIREFLY-CLASS TRANSPORT", vtol: 1, top: 230, acc: 16, climb: 34, ceil: 80000, turn: 0.9, hp: 560, parts: ["engineL", "engineR", "shell", "cockpit", "gear"], dims: [768, 448], art: "firefly", space: 1 },
  thopter:   { n: "ORNITHOPTER", vtol: 1, top: 90, acc: 14, climb: 16, ceil: 5000, turn: 1.9, hp: 160, parts: ["wingL", "wingR", "engine", "cockpit", "gear"], dims: [352, 288], art: "thopter" },
  glider:    { n: "DEATH GLIDER", vtol: 1, top: 210, acc: 30, climb: 40, ceil: 60000, turn: 1.6, hp: 150, parts: ["wingL", "wingR", "engine", "cockpit"], dims: [288, 224], art: "glider", space: 1 },
  dropship:  { n: "DROPSHIP", vtol: 1, top: 190, acc: 18, climb: 32, ceil: 40000, turn: 1.0, hp: 480, parts: ["engineL", "engineR", "wingL", "wingR", "cockpit", "gear"], dims: [576, 352], art: "dropship", space: 1 },
  osprey:    { n: "OSPREY", vtol: 1, top: 140, acc: 10, climb: 14, ceil: 7500, turn: 0.9, hp: 400, parts: ["rotor", "engineL", "engineR", "tail", "cockpit", "gear"], dims: [512, 448], art: "osprey" },
  shuttle:   { n: "SHUTTLECRAFT", vtol: 1, top: 220, acc: 20, climb: 40, ceil: 80000, turn: 1.2, hp: 300, parts: ["engineL", "engineR", "shell", "cockpit"], dims: [512, 288], art: "shuttle", space: 1 },
  spinner:   { n: "SPINNER", vtol: 1, top: 90, acc: 14, climb: 12, ceil: 2500, turn: 1.8, hp: 140, parts: ["engine", "shell", "cockpit"], dims: null },
  anglia:    { n: "FLYING ANGLIA", vtol: 1, top: 55, acc: 8, climb: 8, ceil: 1500, turn: 1.5, hp: 95, parts: ["engine", "shell", "cockpit", "gear"], dims: null },
  hover:     { n: "HOVERCAR", vtol: 1, top: 70, acc: 12, climb: 9, ceil: 1200, turn: 1.8, hp: 105, parts: ["engine", "shell", "cockpit"], dims: [76, 150] },
  broom:     { n: "BROOMSTICK", vtol: 1, top: 34, acc: 9, climb: 7, ceil: 600, turn: 2.6, hp: 60, parts: ["engine", "shell"], dims: [40, 80], own: "broom" }
};
// heroes who fly by themselves (their mobility class decides how)
const FLY_SELF = {
  "JETPACK": { n: "JETPACK", top: 42, acc: 16, climb: 9, ceil: 600, trail: "jet" }, "ROCKET BOOSTERS": { n: "ROCKET BOOSTERS", top: 60, acc: 22, climb: 14, ceil: 1500, trail: "jet" },
  "SUSPENSORS": { n: "SUSPENSORS", top: 10, acc: 4, climb: 3, ceil: 40, trail: "float" }, "THRUSTERS": { n: "THRUSTERS", top: 46, acc: 18, climb: 10, ceil: 900, trail: "jet" },
  "DARK FLIGHT": { n: "DARK FLIGHT", top: 36, acc: 14, climb: 8, ceil: 400, trail: "smoke" }, "HEX FLIGHT": { n: "HEX FLIGHT", top: 40, acc: 16, climb: 9, ceil: 600, trail: "hex" },
  "BROOM": { n: "BROOMSTICK", top: 34, acc: 12, climb: 7, ceil: 600, trail: "broom" }, "KI FLIGHT": { n: "KI FLIGHT", top: 170, acc: 60, climb: 45, ceil: 25000, trail: "ki" }
};
const FLY_DIMS = {};
for (const k in FLY_SPECS) if (FLY_SPECS[k].dims) FLY_DIMS[k] = FLY_SPECS[k].dims;
// the new kinds as vehicles (ground handling while parked / taxiing: they hover)
if (typeof VK !== "undefined") {
  const add = (k, o) => { if (!VK[k]) VK[k] = o; };
  add("heli", { n: "HELICOPTER", m: 2600, acc: 5, top: 18, brk: 6, mu: 0.4, st: 0.6, hp: 260, hover: 1, eng: 2, seats: "car4" });
  add("jet", { n: "CAPSULE JET", m: 3000, acc: 6, top: 30, brk: 6, mu: 0.4, hp: 220, hover: 1, eng: 2, seats: "two" });
  add("plane", { n: "AIRLINER", m: 60000, acc: 3, top: 80, brk: 4, mu: 0.6, st: 0.3, hp: 700, eng: 2, seats: "bus" });
  add("pod", { n: "ATTACK POD", m: 900, acc: 7, top: 22, brk: 6, mu: 0.4, hp: 170, hover: 1, eng: 2, seats: "one", glass: 1 });
  add("gship", { n: "GRAVITY SHIP", m: 9000, acc: 4, top: 20, brk: 6, mu: 0.4, hp: 420, hover: 1, eng: 2, seats: "car4" });
  for (const k of ["skyhopper", "freighter", "transport", "firefly", "dropship", "osprey", "shuttle"]) add(k, { n: FLY_SPECS[k].n, m: 8000, acc: 4, top: 20, brk: 6, mu: 0.4, hp: FLY_SPECS[k].hp, hover: 1, eng: 2, seats: k === "skyhopper" ? "two" : "car4" });
  add("broom", { n: "BROOMSTICK", m: 80, acc: 6, top: 14, brk: 6, mu: 0.4, hp: 60, hover: 1, eng: 2, seats: "one", glass: 0 });
}

const FLY = { on: false, self: false, v: null, S: null, alt: 0, vz: 0, vxm: 0, vym: 0, hdg: 0, air: false, safe: true, brake: 0, cockpit: false, lod: false, zoom: 1, parts: null,
  touchUp: 0, touchDn: 0, touchBrake: 0, tiles: new Map(), built: 0, noise: null, msgT: -99, lastHit: 0, chute: null, confirm: null, cloudT: 0, warnT: -99 };
const FLY_LOD_ENTER = 0.40, FLY_LOD_EXIT = 0.44; // aerial cache hysteresis, in effective camera zoom
function flySpec(v) { return v && FLY_SPECS[v.kind] ? FLY_SPECS[v.kind] : null; }
function flyZoomFor(alt) { const z0 = typeof opts !== "undefined" ? opts.zoom || 1 : 1; return 1 / (1 + Math.max(0, alt) * z0 / 34); }   // relative to opts.zoom
// Ground can use cached aerial art before the character/craft is too small to draw normally.
function flyFarView() {
  if ((FLY.on && FLY.self) || FLY.chute) return false; // the hero, not an arrow, remains visible at every height
  const z = (typeof opts !== "undefined" ? opts.zoom || 1 : 1) * (FLY.zoom || 1);
  return FLY.lod && (z < 0.13 || (FLY.on && FLY.air && FLY.alt > 50 && Math.hypot(FLY.vxm, FLY.vym) > 55 && z < 0.32));
}
// Current projectiles and enemies live on a ground plane; flight above this
// boundary is travel, not an air-combat simulation. Landing/crash damage is separate.
function flyGroundSeparated() { return !!(player && (player.flyAlt || 0) > 60); }
function flyUnits(ms) { const mph = typeof opts !== "undefined" && opts.vehUnits === "kmh" ? false : true; return mph ? Math.round(ms * 2.237) + " mph" : Math.round(ms * 3.6) + " km/h"; }
// v14.3: on a scaled real map (1:3) horizontal speeds run at the same factor as cars (FLY_K); gauges show nominal speeds
function flyK() { return typeof RG !== "undefined" && RG.real && typeof RM !== "undefined" && RM.S < 1 && typeof vehSpeedK === "function" ? vehSpeedK(RM.S) : 1; }
function flyAltTxt(m) { return m >= 10000 ? (m / 1000).toFixed(1) + " km" : Math.round(m) + " m"; }
function flySelfSpec() {
  if (!player) return null;
  if (typeof accMob === "function") { const m = accMob(player.cid); if (m && m[0] === "jet" && FLY_SELF[m[1]]) return FLY_SELF[m[1]]; if (m && m[0] === "jet") return FLY_SELF.JETPACK; if (m && m[0] === "ki") return FLY_SELF["KI FLIGHT"]; }
  if (player.fac && player.fac.id === 10) return FLY_SELF.BROOM;
  return null;
}

/* --- taking the controls ----------------------------------------------------------------- */
function flyBegin(v) {
  const S = flySpec(v); if (!S) return;
  FLY.on = true; FLY.self = false; FLY.v = v; FLY.S = S; FLY.alt = v.flyAlt || 0; FLY.vz = 0; FLY.air = FLY.alt > 0.4; FLY.brake = 0; FLY.landing = false;
  FLY.vxm = v.vx / 32; FLY.vym = v.vy / 32;
  if (!v.fparts) { v.fparts = {}; for (const p of S.parts) v.fparts[p] = 1; v.fhpMax = S.hp; v.hp = Math.max(v.hp, S.hp); v.hpMax = Math.max(v.hpMax || 0, S.hp); }
  flyUiShow(true);
  if (typeof meta !== "undefined" && typeof cityTip === "function" && !(meta.vehTips && meta.vehTips.fly)) {
    meta.vehTips = meta.vehTips || {}; meta.vehTips.fly = 1; if (typeof saveMeta === "function") saveMeta();
    const touch = typeof actIsTouch === "function" ? actIsTouch() : !!(window.matchMedia && matchMedia("(pointer: coarse)").matches);
    const controls = touch
      ? " · hold <b>▲</b> to climb · hold <b>▼</b> to descend · hold <b>⏹</b> to hover · <b>🛡</b> flight assists · <b>👁</b> cockpit · tap <b>EXIT VEHICLE</b> to get out (hold while moving; bail out up high)"
      : " · <b>▲ Space/E</b> climb · <b>▼ Shift/Q</b> descend · <b>⏹ H</b> hover (kills the drift) · <b>🛡 K</b> flight assists · <b>👁 C</b> cockpit · <b>F</b> get out (bail out up high)";
    cityTip("🛩 <b>" + S.n + "</b> — push where you want to go" + controls + (S.vtol ? "" : " · planes need " + flyUnits(S.takeoff) + " on a runway to take off"), 9);
  } else flyTip("🛩 " + S.n + (S.vtol ? " — ▲ to lift off" : " — " + flyUnits(S.takeoff) + " to take off"));
}
function flyBeginSelf() {
  const S = flySelfSpec(); if (!S || !player || player.inVehicle) return false;
  FLY.on = true; FLY.self = true; FLY.v = null; FLY.S = Object.assign({ vtol: 1, turn: 6, hp: 1, parts: [] }, S); FLY.alt = 0.6; FLY.vz = S.climb * 0.6; FLY.air = true; FLY.brake = 0; FLY.landing = false;
  FLY.vxm = (player.vx || 0) / 32; FLY.vym = (player.vy || 0) / 32; FLY.hdg = player.moveDir || 0;
  player.flyingBy = S.n; player.flySaved = !!player.flying; player.flying = true;
  flyUiShow(true);
  if (typeof spawnSpeech === "function") spawnSpeech(player.x, player.y - 30, "⬆ " + S.n, "#80deea", 1.6);
  if (typeof sfx === "function") sfx(160, 520, 0.4, "sawtooth", 0.1);
  return true;
}
function flyToggleSelf() {
  if (FLY.on && FLY.self) { FLY.landing = true; flyTip("⬇ LANDING"); return true; }
  if (!FLY.on && !flyBeginSelf()) { flyTip("Your hero can't fly by themselves — find a ship at a spaceport or airport, or throw a Pocket Capsule"); return false; }
  return true;
}
function flyEnd(why) {
  // Ended flights must not carry a stale touch command into a later flight.
  // A jet-class pilot bailing out transfers directly into self-flight; keep
  // a still-held control through that immediate handoff until its release.
  const selfHandoff = why === "bail" && FLY.on && !FLY.self && !!flySelfSpec();
  if (!selfHandoff) FLY.touchUp = FLY.touchDn = FLY.touchBrake = 0;
  if (!FLY.on) return;
  if (FLY.self && player) { player.flying = !!player.flySaved; player.flyingBy = null; }
  if (FLY.v) { FLY.v.flyAir = false; FLY.v.flyAlt = 0; }
  FLY.on = false; FLY.self = false; FLY.v = null; FLY.air = false; FLY.alt = 0; FLY.lod = false; FLY.groundSeparated = false; FLY.cockpit = FLY.cockpit && false;
  if (player) player.flyAlt = 0;
  if (typeof VEH !== "undefined") VEH.noCam = false;
  flyUiShow(false);
}
function flyTip(t) { if (typeof vehToast === "function") vehToast(t, "#80deea"); else if (typeof spawnSpeech === "function" && player) spawnSpeech(player.x, player.y - 30, t, "#80deea", 3); }

/* --- the flight model ---------------------------------------------------------------------- */
function flyInput() {
  let mx = 0, my = 0;
  if (typeof joy !== "undefined" && joy.act) { mx = joy.dx; my = joy.dy; }
  else { mx = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0); my = (keys.KeyS || keys.ArrowDown ? 1 : 0) - (keys.KeyW || keys.ArrowUp ? 1 : 0); }
  const up = (keys.Space || keys.KeyE || FLY.touchUp ? 1 : 0) - (keys.ShiftLeft || keys.ShiftRight || keys.KeyQ || FLY.touchDn ? 1 : 0);
  const brake = keys.KeyH || FLY.touchBrake;
  const mag = Math.min(1, Math.hypot(mx, my));
  return { mx, my, mag, up, brake };
}
function flyGroundAt(lx, ly) {   // what's under you: a rooftop (its height), a tree, open ground
  const f = cityFlagsAt(lx, ly);
  if (!(f & (F_MOVE | F_IN))) return 0;
  const b = typeof cityBldT === "function" ? cityBldT(cityTX(lx), cityTY(ly)) : null;
  if (b) {
    if (b.rm && b.rm.h) return Math.max(3, Math.min(320, b.rm.h));   // real buildings know their height
    const tall = b.cls === 4 ? 2.2 : b.cls === 3 ? 1.3 : 1;
    return ({ apartment: 14, civic: 12, warehouse: 9, church: 14, cinema: 10, motel: 6, shed: 3, barn: 8, house: 7, farmhouse: 7, cabin: 5 }[b.type] || 8) * tall;
  }
  return f & F_MOVE ? 3 : 0;
}
function flyPartsMul() {
  const P = FLY.v && FLY.v.fparts; if (!P) return { thrust: 1, lift: 1, yaw: 0 };
  const eng = ["engine", "engineL", "engineR", "thruster", "rotor"].filter(k => k in P), engOn = eng.filter(k => P[k] > 0).length;
  const thrust = eng.length ? Math.max(0.0, engOn / eng.length) : 1;
  let lift = 1, yaw = 0;
  if ("wingL" in P && P.wingL <= 0) { lift -= 0.35; yaw -= 0.5; }
  if ("wingR" in P && P.wingR <= 0) { lift -= 0.35; yaw += 0.5; }
  if ("tail" in P && P.tail <= 0) yaw += 0.9;
  if ("rotor" in P && P.rotor <= 0) lift = 0.15;
  return { thrust, lift: Math.max(0, lift), yaw };
}
function flyStep(dt) {
  if (!FLY.on || !player) return;
  if (!FLY.self && (!FLY.v || VEH.me !== FLY.v || player.inVehicle !== 3)) { if (!FLY.chute) flyEnd("left"); return; }
  const S = FLY.S, I = flyInput(), unsafe = !FLY.safe, PM = flyPartsMul(), FK = flyK();
  const v = FLY.v, px0 = FLY.self ? player.x : v.x, py0 = FLY.self ? player.y : v.y;
  // non-VTOL on the ground: it's a car until it's fast enough
  if (!FLY.self && !S.vtol && !FLY.air) {
    const gs = Math.hypot(v.vx, v.vy) / 32 / FK;
    v.flyAir = false;
    if (I.up > 0 && gs >= S.takeoff && PM.thrust > 0.3) { FLY.air = true; FLY.alt = 0.6; FLY.vz = 4; FLY.vxm = v.vx / 32; FLY.vym = v.vy / 32; flyTip("🛫 ROTATE — airborne"); }
    else { if (I.up > 0 && runTime - FLY.warnT > 3) { FLY.warnT = runTime; flyTip("🛫 " + flyUnits(S.takeoff) + " for takeoff — open road or a runway"); } FLY.alt = 0; player.flyAlt = 0; return; }
  }
  // VTOL on the ground: lift off with ▲
  if (!FLY.air) {
    if (I.up > 0 && PM.thrust > 0.2) { FLY.air = true; FLY.alt = 0.5; FLY.vz = S.climb * 0.4; FLY.vxm = (FLY.self ? player.vx || 0 : v.vx) / 32; FLY.vym = (FLY.self ? player.vy || 0 : v.vy) / 32; if (typeof sfx === "function") sfx(120, 300, 0.5, "sawtooth", 0.08); }
    else { if (v) v.flyAir = false; player.flyAlt = 0; return; }
  }
  if (v) v.flyAir = true;
  const altK = Math.min(14, Math.sqrt(1 + FLY.alt / 350));   // the higher you are, the faster the ground goes by
  const top = S.top * FK * (unsafe ? 2 : 1) * altK * (0.25 + 0.75 * PM.thrust);
  const acc = S.acc * FK * (unsafe ? 1.7 : 1) * altK * PM.thrust;
  const drag = FLY.brake > 0 || I.brake ? 3.4 : unsafe ? 0.07 : 0.5;
  // horizontal thrust where the stick points (screen up = north)
  if (I.mag > 0.12) {
    const ax = I.mx / Math.max(1e-3, Math.hypot(I.mx, I.my)), ay = I.my / Math.max(1e-3, Math.hypot(I.mx, I.my));
    FLY.vxm += ax * acc * I.mag * dt; FLY.vym += ay * acc * I.mag * dt;
    const want = Math.atan2(ay, ax), cur = FLY.self ? FLY.hdg : v.ang, d = Math.atan2(Math.sin(want - cur), Math.cos(want - cur)), tr = (S.turn || 1.5) * (unsafe ? 1.5 : 1) * dt;
    const nh = cur + Math.max(-tr, Math.min(tr, d));
    if (FLY.self) FLY.hdg = nh; else { v.ang = nh; v.w = 0; }
  } else if (!FLY.self) v.w = 0;
  // broken tail / wing: it yaws by itself
  if (!FLY.self && PM.yaw) { v.ang += PM.yaw * 0.6 * dt; const sp = Math.hypot(FLY.vxm, FLY.vym); FLY.vxm += Math.cos(v.ang + Math.PI / 2) * PM.yaw * sp * 0.08 * dt; FLY.vym += Math.sin(v.ang + Math.PI / 2) * PM.yaw * sp * 0.08 * dt; }
  const kd = Math.exp(-drag * dt); FLY.vxm *= kd; FLY.vym *= kd;
  let sp = Math.hypot(FLY.vxm, FLY.vym);
  if (sp > top) { const k = top / sp + (1 - top / sp) * Math.exp(-2 * dt); FLY.vxm *= k; FLY.vym *= k; sp = Math.hypot(FLY.vxm, FLY.vym); }
  // vertical: climb / descend, altitude hold when safe, the thin air near space, lift of a plane
  const ceil = S.ceil || 600, thin = FLY.alt > 35000 ? Math.max(0, 1 - (FLY.alt - 35000) / Math.max(1, ceil - 35000)) : 1;
  const climb = S.climb * (unsafe ? 1.6 : 1) * PM.lift * Math.min(1, PM.thrust + 0.2);
  if (I.up > 0) FLY.landing = false;
  if (FLY.landing && I.up <= 0) FLY.vz += (-Math.min(climb * 1.2, 2.5 + FLY.alt * 0.4) - FLY.vz) * Math.min(1, dt * 2.5);   // G: a steady descent to the ground
  else if (I.up > 0) FLY.vz += (climb * thin - FLY.vz) * Math.min(1, dt * 2.2);
  else if (I.up < 0) FLY.vz += (-climb * 1.2 - FLY.vz) * Math.min(1, dt * 2.2);
  else if (!unsafe) FLY.vz *= Math.exp(-4 * dt);   // assists hold the altitude
  else FLY.vz *= Math.exp(-0.3 * dt);
  if (!S.vtol && !FLY.self && sp < S.stall * FK) FLY.vz -= 9.8 * (1 - sp / (S.stall * FK)) * dt;   // a plane needs airspeed
  if (PM.lift < 0.5) FLY.vz -= 9.8 * (0.5 - PM.lift) * 1.6 * dt;                        // a lost rotor / wings: you come down
  if (FLY.alt >= ceil && FLY.vz > 0) { FLY.vz = 0; if (runTime - FLY.warnT > 5) { FLY.warnT = runTime; flyTip(ceil >= 60000 ? "🌌 THE EDGE OF SPACE — this is as high as it goes" : "⛔ SERVICE CEILING — " + flyAltTxt(ceil)); } }
  FLY.alt = Math.min(ceil + 50, FLY.alt + FLY.vz * dt);
  // the world's edge: the airspace ends a little past the map
  const rl = typeof RG !== "undefined" && RG.real && typeof RM_LO !== "undefined";
  const [xm, ym] = cityWorldM(px0, py0), lo = rl ? RM_LO - 600 : 200, hi = rl ? RM_HI + 600 : 63800;
  if (xm < lo || xm > hi || ym < lo || ym > hi) { const cx = Math.max(lo, Math.min(hi, xm)), cy = Math.max(lo, Math.min(hi, ym)); FLY.vxm += (cx - xm) * 2 * dt; FLY.vym += (cy - ym) * 2 * dt; if (runTime - FLY.warnT > 4) { FLY.warnT = runTime; flyTip("⛔ END OF THE MAP — turn back"); } }
  // obstacles: flying into something taller than you (a building's side, a tree) — rooftops below you are ground
  const low = FLY.alt < 340, ghHere = low ? flyGroundAt(px0, py0) : 0;
  if (low) {
    const ghNext = flyGroundAt(px0 + FLY.vxm * 32 * dt * 3, py0 + FLY.vym * 32 * dt * 3);
    if (ghNext > FLY.alt + 0.3 && ghNext > ghHere + 0.3) {
      const hit = Math.hypot(FLY.vxm, FLY.vym) / FK;
      if (hit > 6 && runTime - FLY.lastHit > 0.6) { FLY.lastHit = runTime; flyDamage(hit * 3, "front", "crash"); flyTip("💥 HIT A " + (ghNext > 3.5 ? "BUILDING" : "TREE")); }
      FLY.vxm *= -0.3; FLY.vym *= -0.3;
    }
  }
  if (ghHere > 0.5 && FLY.alt <= ghHere) {   // on a rooftop: you can perch there, not get out (bail out works)
    const vs = -FLY.vz;
    if (vs > (S.vtol ? 15 : 11)) { flyCrash("💥 CRASHED ONTO A ROOF"); return; }
    if (vs > 7) flyDamage(40 + vs * 10, "under", "landing");
    FLY.alt = ghHere; FLY.vz = Math.max(0, FLY.vz);
  }
  // touching down
  if (FLY.alt <= 0) {
    const hs = Math.hypot(FLY.vxm, FLY.vym) / FK, vs = -FLY.vz, gearOK = !(FLY.v && FLY.v.fparts && "gear" in FLY.v.fparts && FLY.v.fparts.gear <= 0);
    FLY.alt = 0; FLY.vz = 0;
    if (FLY.self) {
      if (vs > 14) { player.hp -= player.maxHp * 0.15; if (typeof spawnSpeech === "function") spawnSpeech(player.x, player.y - 20, "OOF — HARD LANDING", "#ffab40", 1.2); }
      flyEnd("landed"); return;
    }
    const limitV = S.vtol ? 7 : 5, limitH = S.vtol ? 22 : 85;
    if (vs > limitV * 2.2 || hs > limitH * 1.8) { flyCrash("💥 CRASHED"); return; }
    if (vs > limitV || hs > limitH || !gearOK) { flyDamage(60 + vs * 12 + hs * 2, "under", "landing"); flyTip(gearOK ? "⚠ HARD LANDING" : "⚠ NO LANDING GEAR — belly landing"); if (FLY.v.fparts && "gear" in FLY.v.fparts) FLY.v.fparts.gear = Math.max(0, FLY.v.fparts.gear - 0.5); }
    FLY.air = false; v.flyAir = false; v.vx = FLY.vxm * 32 * 0.5; v.vy = FLY.vym * 32 * 0.5;
    if (typeof sfx === "function") sfx(200, 90, 0.25, "triangle", 0.1);
    player.flyAlt = 0; v.flyAlt = 0;
    return;
  }
  // move
  if (FLY.self) {
    player.x += FLY.vxm * 32 * dt; player.y += FLY.vym * 32 * dt; player.vx = FLY.vxm * 32; player.vy = FLY.vym * 32; player.moveDir = FLY.hdg;
  } else { v.vx = FLY.vxm * 32; v.vy = FLY.vym * 32; v.flyAlt = FLY.alt; v.awake = true; v.sleep = 0; }
  player.flyAlt = FLY.alt;
  const separated = flyGroundSeparated();
  if (separated !== !!FLY.groundSeparated) {
    FLY.groundSeparated = separated;
    flyTip(separated ? "✈ GROUND OUT OF RANGE — descend to fight" : "⬇ GROUND COMBAT IN RANGE");
  }
  FLY.brake = Math.max(0, FLY.brake - dt);
  if (!FLY.self && v.hp <= 0) flyCrash("💥 BREAKING UP");
}

/* --- damage, break-ups, bailing out ------------------------------------------------------- */
const FLY_PART_NAME = { rotor: "ROTOR", tail: "TAIL", engine: "ENGINE", engineL: "LEFT ENGINE", engineR: "RIGHT ENGINE", wingL: "LEFT WING", wingR: "RIGHT WING", cockpit: "COCKPIT", gear: "LANDING GEAR", thruster: "THRUSTER", shell: "HULL" };
function flyDamage(dmg, where, type) {
  const v = FLY.v; if (!v || !v.fparts) return;
  v.hp -= dmg * 0.6;
  const P = v.fparts, keys2 = Object.keys(P), pref = where === "front" ? ["cockpit", "engine", "rotor", "shell"] : where === "under" ? ["gear", "shell", "engine"] : where === "left" ? ["wingL", "engineL"] : where === "right" ? ["wingR", "engineR"] : where === "rear" ? ["tail", "engine", "thruster", "engineL", "engineR"] : keys2;
  const cand = pref.filter(k => k in P && P[k] > 0), k = cand.length ? cand[Math.floor(Math.random() * cand.length)] : keys2.filter(q => P[q] > 0)[0];
  if (!k) return;
  const was = P[k];
  P[k] = Math.max(0, P[k] - dmg / Math.max(60, v.fhpMax * 0.35));
  if (k === "cockpit" && player) player.hp -= dmg * 0.04;
  if (was > 0 && P[k] <= 0) {
    flyTip("⚠ " + FLY_PART_NAME[k] + " GONE");
    flyDebris(v.x, v.y, 3, k);
    if (typeof sfx === "function") sfx(300, 60, 0.35, "sawtooth", 0.12);
  }
}
function flyDebris(x, y, n, k) {
  if (typeof VEH === "undefined" || !VEH.debris) return;
  for (let i = 0; i < n; i++) VEH.debris.push({ x: x + (Math.random() - 0.5) * 60, y: y + (Math.random() - 0.5) * 60, vx: (Math.random() - 0.5) * 300, vy: (Math.random() - 0.5) * 300, a: Math.random() * 6, w: (Math.random() - 0.5) * 8, t: 0, life: 6 + Math.random() * 3, s: 10 + Math.random() * 14, col: "#5a5f66", kind: "plate", k });
}
function flyCrash(msg) {
  const v = FLY.v; if (!v) return;
  flyTip(msg || "💥 CRASH");
  flyDebris(v.x, v.y, 10, "hull");
  const altWas = FLY.alt;
  v.flyAir = false; v.flyAlt = 0; v.hp = 0;
  if (typeof vehExplode === "function") { try { vehExplode(v); } catch (e) { /* art */ } }
  // you: thrown clear (heroes are tough) — a parachute if it happened high up
  if (typeof vehExit === "function") { try { FLY.crashing = 1; vehExit(true); } finally { FLY.crashing = 0; } }
  flyEnd("crash");
  if (altWas > 25 && player) flyChute(altWas); else if (player) { player.hp -= player.maxHp * 0.25; player.invulnT = Math.max(player.invulnT || 0, 1); }
}
function flyChute(alt) {
  // jet-class heroes just fly; everyone else gets a parachute
  if (flySelfSpec()) { flyBeginSelf(); FLY.alt = alt; FLY.vz = -2; return; }
  FLY.chute = { alt, t: 0 };
  player.flyAlt = alt; player.flying = true;
  if (typeof spawnSpeech === "function") spawnSpeech(player.x, player.y - 30, "🪂 PARACHUTE", "#ffd166", 2);
}
function flyChuteStep(dt) {
  const C = FLY.chute; if (!C || !player) return;
  C.t += dt; C.alt -= dt * (C.alt > 60 ? 9 : 5);
  player.flyAlt = Math.max(0, C.alt);
  if (C.alt <= 0) { FLY.chute = null; player.flyAlt = 0; player.flying = false; if (typeof spawnSpeech === "function") spawnSpeech(player.x, player.y - 24, "LANDED", "#69f0ae", 1.2); }
}

/* --- parked ships, airports & airfields: everything that flies can be taken ------------------------- */
function flyParkedNear() {
  if (!player || typeof cityRT === "undefined") return null;
  const cx = Math.floor((player.x + CITY.orx) / 2048), cy = Math.floor((player.y + CITY.ory) / 2048);
  let best = null, bd = 1e9;
  for (let y = cy - 1; y <= cy + 1; y++) for (let x = cx - 1; x <= cx + 1; x++) {
    const C = cityRT.chunks.get(x * 4096 + y); if (!C) continue;
    for (const p of C.props) {
      if (p.t !== "rgship" || p.gone || !FLY_SPECS[p.kind]) continue;
      const H = typeof RG_HULL !== "undefined" ? RG_HULL[p.kind] || [10, 6] : [10, 6], sx = (p.cxm || (p.x + p.w / 2) / 2) * 32 - CITY.orx, sy = (p.cym || (p.y + p.h / 2) / 2) * 32 - CITY.ory;
      const d = Math.hypot(sx - player.x, sy - player.y) - Math.max(H[0], H[1]) * 16;
      if (d < 50 && d < bd) { bd = d; best = { p, x: sx, y: sy }; }
    }
  }
  return best;
}
function flyTakeParked(t) {
  const p = t.p, S = FLY_SPECS[p.kind], H = typeof RG_HULL !== "undefined" ? RG_HULL[p.kind] || [10, 6] : [10, 6];
  p.gone = true;
  if (typeof vehQueueRebuild === "function") vehQueueRebuild((t.x + CITY.orx) / 16, (t.y + CITY.ory) / 16, t.x, t.y, Math.max(H[0], H[1]) * 34);
  const L = S.dims ? S.dims[0] : H[1] * 32, D = S.dims ? S.dims[1] : H[0] * 32;
  const v = vehNew(p.kind, t.x, t.y, (p.ang || 0), Math.min(L, D), Math.max(L, D), { key: "ship:" + (p.key || (p.x + "," + p.y)), from: "parked", fuel: 1, v: p.v | 0 });
  v.shipProp = p;
  vehEnter({ v });
}
// real maps: helicopters on the helipads, a plane and a helicopter on each apron, as you get near
function flyAirfieldScan() {
  if (typeof RG === "undefined" || !RG.real || typeof rmCellData !== "function" || !player) return;
  const [xm, ym] = cityWorldM(player.x, player.y), mx = Math.floor(xm / 1000), my = Math.floor(ym / 1000);
  FLY.fields = FLY.fields || new Set();
  for (let y = my - 1; y <= my + 1; y++) for (let x = mx - 1; x <= mx + 1; x++) {
    let C; try { C = rmCellData(x, y); } catch (e) { continue; }
    if (!C || !C.aero) continue;
    for (const a of C.aero) {
      if (!a.pg || (a.cls !== "helipad" && a.cls !== "apron")) continue;
      const key = a.cls + ":" + Math.round(a.bb[0]) + "," + Math.round(a.bb[1]);
      if (FLY.fields.has(key)) continue;
      const cxm = (a.bb[0] + a.bb[2]) / 2, cym = (a.bb[1] + a.bb[3]) / 2;
      if (Math.hypot(cxm - xm, cym - ym) > 700) continue;
      FLY.fields.add(key);
      const lx = cxm * 32 - CITY.orx, ly = cym * 32 - CITY.ory, area = (a.bb[2] - a.bb[0]) * (a.bb[3] - a.bb[1]);
      const spot = (dx, dy) => { const q = cityFindWalkable(lx + dx, ly + dy, 400, true); return q; };
      const wk = typeof vehWorldK === "function" ? vehWorldK() : 1, ra = typeof rmRealA === "function" ? rmRealA(area) : area;
      const h = spot(0, 0); vehNew("heli", h[0], h[1], Math.random() * 6.28, FLY_DIMS.heli[0], FLY_DIMS.heli[1], { key: "heli:" + key, from: "airfield", fuel: 1, k: wk });
      if (a.cls === "apron" && ra > 6000) { const q = spot(900 * wk, 300 * wk); vehNew("jet", q[0], q[1], Math.random() * 6.28, FLY_DIMS.jet[0], FLY_DIMS.jet[1], { key: "jet:" + key, from: "airfield", fuel: 1, k: wk }); }
    }
  }
}

/* --- drawing the craft --------------------------------------------------------------------- */
function flyDrawOwn(g, kind, t, v) {
  switch (kind) {
    case "heli": {
      g.fillStyle = "#37474f"; g.beginPath(); g.ellipse(0, 0, 70, 44, 0, 0, 7); g.fill();
      g.fillStyle = "#263238"; g.fillRect(-200, -9, 150, 18); g.fillRect(-210, -30, 18, 60);
      g.fillStyle = "rgba(120,200,255,0.75)"; g.beginPath(); g.ellipse(36, 0, 28, 30, 0, -1.3, 1.3); g.fill();
      g.fillStyle = "#212121"; g.fillRect(-30, -52, 60, 6); g.fillRect(-30, 46, 60, 6);
      const r = t * (v && v.flyAir ? 40 : 12);
      g.save(); g.rotate(r); g.fillStyle = "rgba(30,30,30,0.55)"; for (let k = 0; k < 4; k++) { g.rotate(Math.PI / 2); g.fillRect(0, -6, 175, 12); } g.restore();
      g.strokeStyle = "rgba(255,255,255,0.12)"; g.lineWidth = 2; g.beginPath(); g.arc(0, 0, 175, 0, 7); g.stroke();
      break;
    }
    case "jet": {
      g.fillStyle = "#eceff1"; g.beginPath(); g.moveTo(190, 0); g.lineTo(-120, -140); g.lineTo(-160, -140); g.lineTo(-100, 0); g.lineTo(-160, 140); g.lineTo(-120, 140); g.closePath(); g.fill();
      g.fillStyle = "#cfd8dc"; g.beginPath(); g.ellipse(0, 0, 190, 34, 0, 0, 7); g.fill();
      g.fillStyle = "#ffca28"; g.fillRect(-60, -6, 110, 12);
      g.fillStyle = "rgba(80,170,255,0.85)"; g.beginPath(); g.ellipse(110, 0, 44, 18, 0, 0, 7); g.fill();
      g.fillStyle = "#455a64"; g.fillRect(-190, -40, 40, 26); g.fillRect(-190, 14, 40, 26);
      break;
    }
    case "pod": {
      g.fillStyle = "#e0e0e0"; g.beginPath(); g.arc(0, 0, 56, 0, 7); g.fill();
      g.fillStyle = "#9e9e9e"; g.beginPath(); g.arc(0, 0, 56, 0.6, 2.5); g.fill();
      g.fillStyle = "rgba(255,60,60,0.85)"; g.beginPath(); g.arc(22, 0, 22, 0, 7); g.fill();
      g.fillStyle = "rgba(255,255,255,0.5)"; g.beginPath(); g.arc(28, -8, 7, 0, 7); g.fill();
      break;
    }
    case "gship": {
      g.fillStyle = "#f5f5f5"; g.beginPath(); g.arc(0, 0, 200, 0, 7); g.fill();
      g.strokeStyle = "#bdbdbd"; g.lineWidth = 6; g.beginPath(); g.arc(0, 0, 150, 0, 7); g.stroke();
      g.fillStyle = "#ffca28"; for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + Math.PI / 4; g.fillRect(Math.cos(a) * 170 - 16, Math.sin(a) * 170 - 16, 32, 32); }
      g.fillStyle = "rgba(80,170,255,0.8)"; g.beginPath(); g.arc(90, 0, 40, 0, 7); g.fill();
      g.fillStyle = "#212121"; g.font = "bold 34px sans-serif"; g.textAlign = "center"; g.fillText("CC", -30, 12);
      break;
    }
    case "broom": {
      g.fillStyle = "#6d4c41"; g.fillRect(-40, -3, 80, 6);
      g.fillStyle = "#c8a165"; g.beginPath(); g.moveTo(-40, -4); g.lineTo(-70, -14); g.lineTo(-74, 14); g.lineTo(-40, 4); g.fill();
      break;
    }
    default: g.fillStyle = "#8a9096"; g.fillRect(-60, -30, 120, 60);
  }
}
function flyDrawCraft(g, v, t, scale) {
  const S = flySpec(v); if (!S) return false;
  g.save(); g.translate(v.x, v.y); g.rotate(v.ang); if (scale) g.scale(scale, scale);
  if (S.own) flyDrawOwn(g, S.own, t, v);
  else if (S.art && typeof RG_SHIP_ART !== "undefined" && RG_SHIP_ART[S.art]) {
    const H = typeof RG_HULL !== "undefined" ? RG_HULL[S.art] || [10, 6] : [10, 6];
    const sc = S.art === "freighter" ? H[0] * 32 / 520 : S.art === "skyhopper" ? H[0] * 32 / 200 : 1;
    g.scale(sc, sc);
    try { RG_SHIP_ART[S.art](g, v.pv | 0); } catch (e) { g.fillStyle = "#8a9096"; g.fillRect(-60, -30, 120, 60); }
  } else return g.restore(), false;
  // engines glowing when it flies
  if (v.flyAir) { g.globalCompositeOperation = "lighter"; g.fillStyle = "rgba(120,200,255,0.35)"; g.beginPath(); g.arc(-Math.max(v.L, v.D) * 0.42 / (scale || 1), 0, 22, 0, 7); g.fill(); g.globalCompositeOperation = "source-over"; }
  g.restore();
  return true;
}

/* --- the ground from up high: aerial tiles (Nanite-style levels) ------------------------------- */
function flyNoise() {
  if (FLY.noise) return FLY.noise;
  const c = document.createElement("canvas"); c.width = c.height = 128; const g = c.getContext("2d"), im = g.createImageData(128, 128);
  for (let i = 0; i < im.data.length; i += 4) { const v = 110 + Math.random() * 40; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; }
  g.putImageData(im, 0, 0); FLY.noise = c; return c;
}
// the ground seen from above: natural colours per kind of world (the map's own palette is for reading, not flying)
const FLY_AERIAL = {
  earth: { bg: "#7d8f63", land: ["#97a66a", "#8da064", "#a3a594", "#9b9b95", "#8f8f8c", "#8a8780", "#4f6b3a", "#4a7ea8"], road: "#5a5d63", road2: "#64676d", edge: "#3f4247", hw: "#4f5257", hwEdge: "#2f3236", bld: "#b9b1a5", bldEdge: "#6b6258", civic: "#c9a37a", park: "#6f9a4f", water: "#3f74a3", woods: "#46663a", lot: "#8e8c87", txt: "#fff", halo: "rgba(0,0,0,0.5)", grid: "rgba(0,0,0,0)" },
  desert: { bg: "#c9a46a", land: ["#d2b07a", "#cba872", "#c4a06c", "#bf9b66", "#b99560", "#b39060", "#a68e5a", "#6f8fa8"], road: "#a8875a", road2: "#b08f62", edge: "#8a6a44", hw: "#9a7a52", hwEdge: "#6a4a2e", bld: "#e2d4b4", bldEdge: "#8a7458", civic: "#e8d0a0", park: "#9aa070", water: "#5a8aa8", woods: "#7a8a5a", lot: "#b89a70", txt: "#fff", halo: "rgba(0,0,0,0.5)", grid: "rgba(0,0,0,0)" },
  night: { bg: "#11141c", land: ["#151a22", "#161b24", "#1a1f2a", "#1c2230", "#202636", "#1d2230", "#121a18", "#0c1a2a"], road: "#ff2bd6", road2: "#7a2a8a", edge: "#2a1030", hw: "#4cc9f0", hwEdge: "#0a4a6a", bld: "#2a3042", bldEdge: "#4a5272", civic: "#3a3a5a", park: "#14261e", water: "#0a1e30", woods: "#10201a", lot: "#1a1e28", txt: "#fff", halo: "rgba(0,0,0,0.5)", grid: "rgba(0,0,0,0)" },
  metal: { bg: "#5a6470", land: ["#6a7480", "#66707c", "#727c88", "#7a8490", "#828c98", "#6e7884", "#4a5a58", "#3a5a7a"], road: "#3a424c", road2: "#444c56", edge: "#2a3038", hw: "#4fc3ff", hwEdge: "#1a4a6a", bld: "#9aa4b0", bldEdge: "#4a5460", civic: "#b0bac6", park: "#4a6a5a", water: "#2a4a6a", woods: "#3a5a4a", lot: "#5e6874", txt: "#fff", halo: "rgba(0,0,0,0.5)", grid: "rgba(0,0,0,0)" },
  rock: { bg: "#4a4640", land: ["#5a554c", "#55504a", "#605a52", "#66605a", "#6a645e", "#5e5850", "#3e4a3a", "#2e4450"], road: "#3a3632", road2: "#44403a", edge: "#2a2622", hw: "#6a5a40", hwEdge: "#3a2e1e", bld: "#7a746c", bldEdge: "#3a3630", civic: "#8a7a60", park: "#4a5a40", water: "#2a3e4a", woods: "#3a4a34", lot: "#524c46", txt: "#fff", halo: "rgba(0,0,0,0.5)", grid: "rgba(0,0,0,0)" },
  green: { bg: "#6f8a4e", land: ["#88a058", "#7f9a52", "#93a070", "#8f9478", "#8a8c74", "#7a7a6a", "#3e5a30", "#46708e"], road: "#9a8a6a", road2: "#a89878", edge: "#6a5a40", hw: "#8a7a5a", hwEdge: "#5a4a32", bld: "#a07a5a", bldEdge: "#5a3a24", civic: "#b08a64", park: "#6a944a", water: "#3e6a8e", woods: "#3a5630", lot: "#8a8468", txt: "#fff", halo: "rgba(0,0,0,0.5)", grid: "rgba(0,0,0,0)" }
};
function flyAerialStyle() {
  const k = CITY.themeKey;
  const m = { desert: "desert", galactic: "desert", pharaoh: "desert", western: "desert", frontier: "desert", neon: "night", coruscant: "metal", starship: "metal", colony: "rock", gothic: "rock", wasteland: "rock", medieval: "green", wizard: "green" }[k] || "earth";
  return FLY_AERIAL[m];
}
function flyAerialTile(lvl, tx, ty, allow) {
  const k = lvl + "|" + tx + "|" + ty + "|" + CITY.themeKey + "|" + CITY.seed + "|" + (typeof RG !== "undefined" ? RG.key : "");
  const T = FLY.tiles.get(k);
  if (T) { T.u = FLY.frame; return T.c; }
  if (!allow || typeof mapTile !== "function") return null;
  // build the map tile in the aerial palette without disturbing the minimap's cached copy
  const mk = typeof mapTileKey === "function" ? mapTileKey(lvl, tx, ty) : null, old = mk ? MAPV.tiles.get(mk) : null, ms = window.mapStyle, St = flyAerialStyle();
  if (mk) MAPV.tiles.delete(mk);
  let src = null;
  window.mapStyle = mapStyle = () => St;
  try { src = mapTile(lvl, tx, ty, true); } catch (e) { src = null; } finally { window.mapStyle = mapStyle = ms; if (mk) { MAPV.tiles.delete(mk); if (old) MAPV.tiles.set(mk, old); } }
  if (!src) return null;
  const c = document.createElement("canvas"); c.width = c.height = 256; const g = c.getContext("2d");
  g.drawImage(src, 0, 0);
  g.globalCompositeOperation = "multiply"; g.globalAlpha = 0.32;                                  // relief: every edge casts a soft shadow
  for (const [ox, oy] of [[2, 2], [2 - 256, 2], [2, 2 - 256], [2 - 256, 2 - 256]]) g.drawImage(src, ox, oy);   // (wrapped, so no seams between tiles)
  g.globalAlpha = 0.2; g.globalCompositeOperation = "overlay"; g.drawImage(flyNoise(), 0, 0, 256, 256); // grain
  g.globalCompositeOperation = "saturation"; g.globalAlpha = 0.25; g.fillStyle = "#808080"; g.fillRect(0, 0, 256, 256);
  g.globalCompositeOperation = "source-over"; g.globalAlpha = 1;
  FLY.tiles.set(k, { c, u: FLY.frame }); FLY.built++;
  if (FLY.tiles.size > 180) { const arr = [...FLY.tiles.entries()].sort((a, b) => a[1].u - b[1].u); for (let i = 0; i < 40; i++) FLY.tiles.delete(arr[i][0]); }
  return c;
}
function flyRenderGround(left, top, vw, vh) {
  const g = ctx, M = g.getTransform(), z = Math.hypot(M.a, M.b), cv = g.canvas;
  const mpp = 1 / (z * 32), cwx = (cv.width / 2 - M.e) / M.a, cwy = (cv.height / 2 - M.f) / M.d;
  const cxm = (cwx + CITY.orx) / 32, cym = (cwy + CITY.ory) / 32;
  let lvl = MAP_LEVELS[0]; for (const L of MAP_LEVELS) if (L <= mpp * 1.01) lvl = L;
  const tileM = 256 * lvl, W0 = cv.width, H0 = cv.height, leftM = cxm - W0 / 2 * mpp, topM = cym - H0 / 2 * mpp;
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
  g.fillStyle = "#4f5a46"; g.fillRect(0, 0, W0, H0);
  const tx0 = Math.floor(leftM / tileM), ty0 = Math.floor(topM / tileM), tx1 = Math.floor((leftM + W0 * mpp) / tileM), ty1 = Math.floor((topM + H0 * mpp) / tileM), sz = tileM / mpp;
  const order = [];
  for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) if (tx >= 0 && ty >= 0 && tx * tileM < 64000 && ty * tileM < 64000) order.push([tx, ty, (tx + 0.5 - cxm / tileM) ** 2 + (ty + 0.5 - cym / tileM) ** 2]);
  order.sort((a, b) => a[2] - b[2]);
  const budget = FLY.air && Math.abs(FLY.vz) > 20 ? 1 : 3, b0 = FLY.built;
  for (const [tx, ty] of order) {
    const X = (tx * tileM - leftM) / mpp, Y = (ty * tileM - topM) / mpp;
    const c = flyAerialTile(lvl, tx, ty, FLY.built - b0 < budget);
    if (c) { g.drawImage(c, X, Y, sz + 0.7, sz + 0.7); continue; }
    // not built yet: a coarser level stretched (always cheap), so nothing is ever blank
    for (let up = 2; up <= 5; up++) {
      const L2 = MAP_LEVELS[Math.min(MAP_LEVELS.length - 1, MAP_LEVELS.indexOf(lvl) + up)], tm2 = 256 * L2, t2x = Math.floor(tx * tileM / tm2), t2y = Math.floor(ty * tileM / tm2);
      const c2 = flyAerialTile(L2, t2x, t2y, FLY.built - b0 < budget + 2);
      if (c2) { const sx = (tx * tileM - t2x * tm2) / L2, sy = (ty * tileM - t2y * tm2) / L2, sw = tileM / L2; g.drawImage(c2, sx, sy, sw, sw, X, Y, sz + 0.7, sz + 0.7); break; }
    }
  }
  g.restore();
}

/* --- sky: clouds, haze, space ------------------------------------------------------------------ */
const FLY_CLOUD_LAYERS = [[2200, 3000, 0.55], [9000, 7000, 0.28]];   // altitude m · cell size m · opacity
function flyCloudsInCell(L, cx, cy) {
  const out = [], h = (k) => { let x = Math.imul(cx * 73856093 ^ cy * 19349663 ^ k * 83492791 ^ L[0], 2654435761); x ^= x >>> 15; return (x >>> 0) / 4294967296; };
  const n = h(1) < 0.55 ? 1 + Math.floor(h(2) * 3) : 0;
  for (let i = 0; i < n; i++) out.push({ x: (cx + h(10 + i)) * L[1], y: (cy + h(20 + i)) * L[1], r: L[1] * (0.12 + h(30 + i) * 0.2), s: h(40 + i) });
  return out;
}
function flyRenderSky(g) {
  if (!FLY.on && !FLY.chute) return;
  const alt = FLY.chute ? FLY.chute.alt : FLY.alt; if (alt < 25) return;
  const cv = g.canvas, W0 = cv.width, H0 = cv.height, M = FLY.worldM; if (!M) return;
  const zG = Math.hypot(M.a, M.b), camWX = (W0 / 2 - M.e) / M.a, camWY = (H0 / 2 - M.f) / M.d;
  const camXM = (camWX + CITY.orx) / 32, camYM = (camWY + CITY.ory) / 32, z0 = typeof opts !== "undefined" ? opts.zoom || 1 : 1;
  const wind = runTime * 6;   // m/s drift
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
  // haze thickens with height
  const hz = Math.min(0.32, alt / 22000); if (hz > 0.01) { g.fillStyle = "rgba(176,202,232," + hz.toFixed(3) + ")"; g.fillRect(0, 0, W0, H0); }
  for (const L of FLY_CLOUD_LAYERS) {
    const above = alt - L[0];
    const zc = above > 30 ? zG * (1 + alt * z0 / 34) / (1 + above * z0 / 34) : 0;   // canvas px per world px at that height
    // shadows on the ground (always), clouds themselves only when you're above them; inside = white-out
    const reach = Math.max(W0, H0) / (zG * 32) * 0.75 + L[1];
    const c0x = Math.floor((camXM - wind - reach) / L[1]), c1x = Math.floor((camXM - wind + reach) / L[1]), c0y = Math.floor((camYM - reach) / L[1]), c1y = Math.floor((camYM + reach) / L[1]);
    if ((c1x - c0x + 1) * (c1y - c0y + 1) > 400) continue;
    let inside = 0;
    for (let cy = c0y; cy <= c1y; cy++) for (let cx = c0x; cx <= c1x; cx++) for (const C of flyCloudsInCell(L, cx, cy)) {
      const wx = C.x + wind, wy = C.y;
      if (alt < L[0] + 60) {   // under it: its shadow on the ground
        const sx = W0 / 2 + (wx - camXM) * 32 * zG, sy = H0 / 2 + (wy - camYM) * 32 * zG, sr = C.r * 32 * zG;
        if (sx < -sr || sy < -sr || sx > W0 + sr || sy > H0 + sr) continue;
        g.fillStyle = "rgba(10,20,30," + (0.1 * L[2]).toFixed(3) + ")"; g.beginPath(); g.ellipse(sx, sy, sr, sr * 0.7, 0, 0, 7); g.fill();
        if (Math.abs(above) < 140 && Math.hypot(wx - camXM, wy - camYM) < C.r) inside = Math.max(inside, 1 - Math.abs(above) / 140);
        continue;
      }
      const sx = W0 / 2 + (wx - camXM) * 32 * zc, sy = H0 / 2 + (wy - camYM) * 32 * zc, sr = C.r * 32 * zc;
      if (sx < -sr * 1.6 || sy < -sr * 1.6 || sx > W0 + sr * 1.6 || sy > H0 + sr * 1.6) continue;
      for (let b = 0; b < 5; b++) {
        const a = b * 1.3 + C.s * 6, rr = sr * (0.55 + 0.25 * Math.sin(b * 2.1 + C.s * 9)), bx = sx + Math.cos(a) * sr * 0.55, by = sy + Math.sin(a) * sr * 0.4;
        const G = g.createRadialGradient(bx, by, rr * 0.1, bx, by, rr);
        G.addColorStop(0, "rgba(255,255,255," + L[2] + ")"); G.addColorStop(1, "rgba(255,255,255,0)");
        g.fillStyle = G; g.beginPath(); g.arc(bx, by, rr, 0, 7); g.fill();
      }
      if (Math.abs(above) < 140 && Math.hypot(wx - camXM, wy - camYM) < C.r) inside = Math.max(inside, 1 - Math.abs(above) / 140);
    }
    if (inside > 0) { g.fillStyle = "rgba(240,244,248," + (inside * 0.8).toFixed(3) + ")"; g.fillRect(0, 0, W0, H0); }
  }
  // the edge of space: the sky goes black round the rim, stars come out
  if (alt > 28000) {
    const k = Math.min(1, (alt - 28000) / 30000), R0 = Math.min(W0, H0) * (0.62 - 0.18 * k);
    const G = g.createRadialGradient(W0 / 2, H0 / 2, R0 * 0.75, W0 / 2, H0 / 2, Math.hypot(W0, H0) / 2);
    G.addColorStop(0, "rgba(0,0,0,0)"); G.addColorStop(0.35, "rgba(70,140,255," + (0.25 * k).toFixed(3) + ")"); G.addColorStop(1, "rgba(0,0,8," + (0.92 * k).toFixed(3) + ")");
    g.fillStyle = G; g.fillRect(0, 0, W0, H0);
    g.fillStyle = "rgba(255,255,255," + (0.8 * k).toFixed(3) + ")";
    for (let i = 0; i < 70; i++) { const a = i * 2.39996, r = Math.hypot(W0, H0) * (0.36 + ((i * 37) % 100) / 700); const x = W0 / 2 + Math.cos(a) * r, y = H0 / 2 + Math.sin(a) * r * 0.8; if (x > 0 && y > 0 && x < W0 && y < H0) g.fillRect(x, y, 1.6, 1.6); }
  }
  g.restore();
}

/* --- HUD: the flight strip, buttons, the cockpit ------------------------------------------------- */
function flyUiShow(on) {
  let el = document.getElementById("flyUi");
  if (!el && on) {
    el = document.createElement("div"); el.id = "flyUi";
    el.style.cssText = "position:fixed;right:10px;top:38%;z-index:9000;display:flex;flex-direction:column;gap:6px;touch-action:none;user-select:none";
    // Keep the flight strip inside short landscape touch viewports. The
    // action/exit button occupies a separate lane, so do not move it or
    // transform the flight toggle while a player is holding it.
    const style = document.createElement("style");
    style.textContent = "@media (pointer:coarse) and (orientation:landscape) and (max-height:520px){" +
      "#flyUi{top:clamp(24px,38vh,calc(100vh - 296px))!important;gap:2px!important}" +
      "#flyUi>button{min-height:48px;box-sizing:border-box}}" +
      "@media (pointer:coarse) and (orientation:landscape) and (max-height:300px){" +
      "#flyUi{top:8px!important;right:auto!important;left:50%;transform:translateX(-50%);flex-direction:row!important;gap:6px!important}" +
      "#flyUi>button{min-width:48px!important}}";
    document.head.appendChild(style);
    const b = (id, txt, title) => '<button class="btn" id="' + id + '" title="' + title + '" style="min-width:54px;padding:8px 6px;font-size:15px">' + txt + "</button>";
    el.innerHTML = b("flyUp", "▲", "Climb (Space / E)") + b("flyDn", "▼", "Descend (Shift / Q)") + b("flyBrk", "⏹", "Hover — kill the drift (H)") + b("flySafe", "🛡", "Flight assists (K)") + b("flyCam", "👁", "Cockpit view (C)");
    document.body.appendChild(el);
    const hold = (id, k) => { const q = el.querySelector("#" + id); q.onpointerdown = (e) => { e.preventDefault(); FLY[k] = 1; }; q.onpointerup = q.onpointerleave = q.onpointercancel = () => { FLY[k] = 0; }; };
    hold("flyUp", "touchUp"); hold("flyDn", "touchDn"); hold("flyBrk", "touchBrake");
    el.querySelector("#flySafe").onclick = () => flySafetyToggle();
    el.querySelector("#flyCam").onclick = () => { FLY.cockpit = !FLY.cockpit; };
  }
  if (el) { el.style.display = on ? "flex" : "none"; const s = el.querySelector("#flySafe"); if (s) { s.textContent = FLY.safe ? "🛡" : "⚠"; s.style.background = FLY.safe ? "" : "#7f1010"; } }
}
function flySafetyToggle() {
  if (!FLY.on) return;
  if (!FLY.safe) { FLY.safe = true; flyUiShow(true); flyTip("🛡 FLIGHT ASSISTS ON"); return; }
  if (FLY.confirm) return;
  const el = document.createElement("div"); FLY.confirm = el; const wasP = runPaused; runPaused = true;
  el.style.cssText = "position:fixed;inset:0;z-index:99990;background:rgba(40,0,0,0.55);display:flex;align-items:center;justify-content:center;font-family:'Segoe UI',sans-serif";
  el.innerHTML = '<div style="width:min(420px,92vw);background:#1a0606;border:2px solid #ff5252;border-radius:10px;padding:16px;color:#ffdede;text-align:center"><b style="font-size:18px;color:#ff5252">⚠ TURN OFF FLIGHT ASSISTS?</b><p style="font-size:13px">No altitude hold, almost no drag, double top speed — full inertia. Much faster, much less forgiving. ⏹ HOVER still works.</p><button class="btn" id="flyYes" style="background:#7f1010">YES — UNSAFE</button> <button class="btn" id="flyNo">NO</button></div>';
  // Finger-sized confirmation targets; keep the desktop dialog unchanged.
  if (typeof matchMedia === "function" && matchMedia("(pointer: coarse)").matches)
    for (const b of el.querySelectorAll("button")) { b.style.minWidth = "48px"; b.style.minHeight = "48px"; }
  document.body.appendChild(el);
  const close = (yes) => { el.remove(); FLY.confirm = null; runPaused = wasP; if (yes) { FLY.safe = false; flyTip("⚠ ASSISTS OFF — red light, hands steady"); if (typeof sfx === "function") sfx(700, 350, 0.3, "square", 0.12); } flyUiShow(true); };
  el.querySelector("#flyYes").onclick = () => close(true); el.querySelector("#flyNo").onclick = () => close(false);
}
function flyRenderScreen(g) {
  if (!FLY.on && !FLY.chute) return;
  const cv = g.canvas, W0 = cv.width, H0 = cv.height, alt = FLY.chute ? FLY.chute.alt : FLY.alt, sp = Math.hypot(FLY.vxm, FLY.vym) / flyK();
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
  const dpr = W0 / Math.max(1, window.innerWidth || W0);
  // you, when the world is far below: a marker at the centre
  if (flyFarView()) {
    g.translate(W0 / 2, H0 / 2); g.rotate(FLY.self ? FLY.hdg : (FLY.v ? FLY.v.ang : 0));
    g.fillStyle = "rgba(0,0,0,0.35)"; g.beginPath(); g.moveTo(16 * dpr, 2 * dpr); g.lineTo(-10 * dpr, -9 * dpr); g.lineTo(-5 * dpr, 2 * dpr); g.lineTo(-10 * dpr, 12 * dpr); g.fill();
    g.fillStyle = FLY.safe ? "#80deea" : "#ff5252"; g.beginPath(); g.moveTo(14 * dpr, 0); g.lineTo(-11 * dpr, -11 * dpr); g.lineTo(-6 * dpr, 0); g.lineTo(-11 * dpr, 11 * dpr); g.closePath(); g.fill();
    g.setTransform(1, 0, 0, 1, 0, 0);
  }
  if (FLY.chute) { g.restore(); return; }
  // unsafe: red cabin light
  if (!FLY.safe) { g.fillStyle = "rgba(255,0,0," + (0.08 + 0.05 * Math.sin(runTime * 5)).toFixed(3) + ")"; g.fillRect(0, 0, W0, H0); }
  const vs = FLY.vz, head = ((FLY.self ? FLY.hdg : FLY.v ? FLY.v.ang : 0) * 180 / Math.PI + 90 + 360) % 360;
  if (FLY.cockpit && !FLY.self) flyDrawCockpit(g, W0, H0, dpr, alt, sp, vs, head);
  else {
    // the compact strip at the top centre
    const txt = "✈ " + flyAltTxt(alt) + "  ·  " + flyUnits(sp) + "  ·  " + (vs >= 0 ? "▲" : "▼") + Math.abs(vs).toFixed(1) + " m/s  ·  " + Math.round(head) + "°" + (FLY.safe ? "" : "  ·  ⚠ ASSISTS OFF");
    g.font = "700 " + Math.round(13 * dpr) + "px 'Segoe UI', sans-serif"; g.textAlign = "center";
    const tw = g.measureText(txt).width + 24 * dpr;
    g.fillStyle = FLY.safe ? "rgba(4,16,24,0.72)" : "rgba(60,0,0,0.78)"; g.fillRect(W0 / 2 - tw / 2, 82 * dpr, tw, 24 * dpr);
    g.fillStyle = FLY.safe ? "#b2ebf2" : "#ffcdd2"; g.fillText(txt, W0 / 2, 99 * dpr);
    if (FLY.v && FLY.v.fparts) { let x = W0 / 2 - tw / 2; const bad = Object.entries(FLY.v.fparts).filter(e => e[1] < 0.5); if (bad.length) { g.font = "700 " + Math.round(11 * dpr) + "px sans-serif"; g.fillStyle = "#ffab40"; g.textAlign = "left"; g.fillText("⚠ " + bad.map(e => FLY_PART_NAME[e[0]] + (e[1] <= 0 ? " GONE" : " " + Math.round(e[1] * 100) + "%")).join(" · "), x, 122 * dpr); } }
  }
  g.restore();
}
function flyDrawCockpit(g, W0, H0, d, alt, sp, vs, head) {
  const red = !FLY.safe;
  // canopy frame: dark struts, a window shape, reflections
  g.save();
  g.fillStyle = red ? "rgba(40,6,6,0.94)" : "rgba(14,18,24,0.94)";
  g.beginPath(); g.rect(0, 0, W0, H0);
  g.moveTo(W0 * 0.08, H0 * 0.62); g.quadraticCurveTo(W0 * 0.06, H0 * 0.12, W0 * 0.3, H0 * 0.06); g.lineTo(W0 * 0.7, H0 * 0.06); g.quadraticCurveTo(W0 * 0.94, H0 * 0.12, W0 * 0.92, H0 * 0.62); g.lineTo(W0 * 0.78, H0 * 0.7); g.lineTo(W0 * 0.22, H0 * 0.7); g.closePath();
  g.fill("evenodd");
  g.strokeStyle = red ? "#5a1414" : "#2a3440"; g.lineWidth = 10 * d; g.beginPath(); g.moveTo(W0 * 0.5, H0 * 0.06); g.lineTo(W0 * 0.5, H0 * 0.22); g.stroke();
  const R = g.createLinearGradient(W0 * 0.2, 0, W0 * 0.45, H0 * 0.4); R.addColorStop(0, "rgba(255,255,255,0.06)"); R.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = R; g.fillRect(W0 * 0.1, H0 * 0.07, W0 * 0.35, H0 * 0.4);
  // the dashboard
  const dy = H0 * 0.7;
  g.fillStyle = red ? "#2a0808" : "#151b22"; g.fillRect(0, dy, W0, H0 - dy);
  const gauge = (x, label, val, frac, col) => {
    const r = Math.min(W0, H0) * 0.065;
    g.fillStyle = "#0a0e12"; g.beginPath(); g.arc(x, dy + r * 1.4, r, 0, 7); g.fill();
    g.strokeStyle = "#37474f"; g.lineWidth = 3 * d; g.stroke();
    g.strokeStyle = col; g.lineWidth = 4 * d; g.beginPath(); g.arc(x, dy + r * 1.4, r * 0.8, Math.PI * 0.75, Math.PI * 0.75 + Math.PI * 1.5 * Math.max(0, Math.min(1, frac))); g.stroke();
    g.fillStyle = "#e0f7fa"; g.font = "700 " + Math.round(12 * d) + "px sans-serif"; g.textAlign = "center"; g.fillText(val, x, dy + r * 1.5);
    g.fillStyle = "#78909c"; g.font = "600 " + Math.round(9 * d) + "px sans-serif"; g.fillText(label, x, dy + r * 2.3);
  };
  const S = FLY.S;
  gauge(W0 * 0.2, "ALTITUDE", flyAltTxt(alt), alt / (S.ceil || 1000), "#4dd0e1");
  gauge(W0 * 0.33, "AIRSPEED", flyUnits(sp), sp / (S.top * 2), "#ffd54f");
  gauge(W0 * 0.67, "CLIMB", (vs >= 0 ? "+" : "") + vs.toFixed(1), 0.5 + vs / (S.climb * 3), vs >= 0 ? "#69f0ae" : "#ff8a65");
  gauge(W0 * 0.8, "HEADING", Math.round(head) + "°", head / 360, "#b388ff");
  // the damage diagram + the safety lamp
  const cx = W0 * 0.5, cy = dy + H0 * 0.1, P = FLY.v && FLY.v.fparts ? FLY.v.fparts : {};
  const col = (k) => !(k in P) ? "#263238" : P[k] <= 0 ? "#b71c1c" : P[k] < 0.5 ? "#ffab00" : "#2e7d32";
  const u = Math.min(W0, H0) * 0.012;
  g.fillStyle = col("cockpit"); g.fillRect(cx - u, cy - 4 * u, 2 * u, 2 * u);
  g.fillStyle = col("shell") === "#263238" ? col("engine") : col("shell"); g.fillRect(cx - u, cy - 2 * u, 2 * u, 5 * u);
  g.fillStyle = col("wingL"); g.fillRect(cx - 5 * u, cy - u, 4 * u, 1.6 * u); g.fillStyle = col("wingR"); g.fillRect(cx + u, cy - u, 4 * u, 1.6 * u);
  g.fillStyle = col("engineL"); g.fillRect(cx - 3 * u, cy + u, 1.4 * u, 2 * u); g.fillStyle = col("engineR"); g.fillRect(cx + 1.6 * u, cy + u, 1.4 * u, 2 * u);
  g.fillStyle = col("tail"); g.fillRect(cx - 2 * u, cy + 3.4 * u, 4 * u, 1 * u);
  g.fillStyle = col("rotor"); if ("rotor" in P) { g.beginPath(); g.arc(cx, cy - u, 6 * u, 0, 7); g.globalAlpha = 0.35; g.fill(); g.globalAlpha = 1; }
  const lamp = red ? (Math.floor(runTime * 4) & 1 ? "#ff1744" : "#5a0000") : "#00e676";
  g.fillStyle = lamp; g.beginPath(); g.arc(cx, dy + H0 * 0.22, 7 * d, 0, 7); g.fill();
  g.fillStyle = "#b0bec5"; g.font = "700 " + Math.round(10 * d) + "px sans-serif"; g.textAlign = "center"; g.fillText(red ? "ASSISTS OFF" : "ASSISTS ON", cx, dy + H0 * 0.26);
  // your hands on the yoke
  const cuff = player && player.fac ? player.fac.c1 : "#cfd8dc";
  g.strokeStyle = "#263238"; g.lineWidth = 9 * d; g.beginPath(); g.moveTo(cx - W0 * 0.09, H0 * 0.98); g.quadraticCurveTo(cx, H0 * 0.86, cx + W0 * 0.09, H0 * 0.98); g.stroke();
  for (const s of [-1, 1]) {   // gloved hands on the yoke, sleeves in your colours
    const hx = cx + s * W0 * 0.085, hy = H0 * 0.955;
    g.fillStyle = cuff; g.beginPath(); g.ellipse(hx + s * 14 * d, hy + 14 * d, 13 * d, 10 * d, s * 0.5, 0, 7); g.fill();
    g.fillStyle = "#3a3a3a"; g.beginPath(); g.ellipse(hx, hy, 15 * d, 11 * d, s * 0.4, 0, 7); g.fill();
    g.strokeStyle = "rgba(255,255,255,0.18)"; g.lineWidth = 1.5 * d; g.beginPath(); for (let f = -1; f <= 1; f++) { g.moveTo(hx - s * 4 * d + f * 4 * d, hy - 6 * d); g.lineTo(hx - s * 6 * d + f * 4 * d, hy + 2 * d); } g.stroke();
  }
  if (red) { g.fillStyle = "rgba(255,0,0," + (0.1 + 0.06 * Math.sin(runTime * 6)).toFixed(3) + ")"; g.fillRect(0, 0, W0, H0); }
  g.restore();
}

/* --- engine hooks ------------------------------------------------------------------------- */
(function flyWire() {
  const wrap = (name, fn) => { if (typeof window[name] === "function") { const o = window[name]; window[name] = fn(o); } };
  // the vehicle system steps aside while a craft is in the air
  wrap("vehHandle", o => function (v, dt) { if (v.flyAir) return; return o.apply(this, arguments); });
  wrap("vehWorldCollide", o => function (v) { if (v.flyAir) return; return o.apply(this, arguments); });
  wrap("vehPeopleStep", o => function (v) { if (v.flyAir) return; return o.apply(this, arguments); });
  wrap("vehResolvePair", o => function (A, B) { if (A.flyAir || B.flyAir) return; return o.apply(this, arguments); });
  wrap("vehHorn", o => function () { if (FLY.on && VEH.me && flySpec(VEH.me)) return; return o.apply(this, arguments); });   // H = hover in the air
  wrap("vehTipOnce", o => function (k) { if (k === "drive" && VEH.me && flySpec(VEH.me)) return; return o.apply(this, arguments); });
  wrap("vehProjHit", o => function (i, x0, y0, x1, y1, t) { const r = o.apply(this, arguments); return r; });
  wrap("vehDriveInput", o => function (dt, mx, my, mag) {
    const v = VEH.me;
    if (v && flySpec(v)) { if (!FLY.on || FLY.v !== v) flyBegin(v); if (FLY.air || flySpec(v).vtol) { if (v.ctl) { v.ctl.thr = 0; v.ctl.st = 0; v.ctl.hb = FLY.air ? 0 : 1; } return true; } }
    return o.apply(this, arguments);
  });
  wrap("vehDraw", o => function (g, v, t) {
    if (flySpec(v) && (flySpec(v).own || flySpec(v).art)) {
      if (v.flyAir) return;   // drawn by flight (above the rooftops)
      g.save(); g.globalAlpha = 0.25; g.fillStyle = "#000"; g.beginPath(); g.ellipse(v.x + 8, v.y + 10, v.L * 0.5, v.D * 0.42, v.ang, 0, 7); g.fill(); g.restore();
      if (flyDrawCraft(g, v, t, 1)) return;
    }
    return o.apply(this, arguments);
  });
  wrap("vehCameraFrame", o => function (rawDt) {
    if (!(FLY.on || FLY.chute)) return o.apply(this, arguments);
    // in the air the camera follows the altitude (log-smooth, so a fast climb doesn't lag behind)
    const alt = FLY.chute ? FLY.chute.alt : FLY.alt, tz = flyZoomFor(alt), k = Math.min(1, (rawDt || 0.016) * 4);
    VEH.camZoom = Math.exp(Math.log(Math.max(1e-5, VEH.camZoom || 1)) + (Math.log(tz) - Math.log(Math.max(1e-5, VEH.camZoom || 1))) * k);
    VEH.camFx = (VEH.camFx || 0) * (1 - k); VEH.camFy = (VEH.camFy || 0) * (1 - k);
    FLY.zoom = VEH.camZoom;
  });
  wrap("vehExit", o => function (forced) {
    if (FLY.on && !FLY.self && FLY.air && FLY.alt > 3 && !FLY.crashing) {
      // bailing out: the craft carries on (and comes down); you jump
      const v = FLY.v, alt = FLY.alt;
      const r = o.apply(this, arguments);
      if (v) { v.flyAir = true; v.ghost = { alt, vz: -2, vx: v.vx, vy: v.vy }; }
      flyEnd("bail"); flyChute(alt);
      return r;
    }
    const r = o.apply(this, arguments);
    if (FLY.on && !FLY.self) flyEnd("exit");
    return r;
  });
  // A zoomed-out city view can contain hundreds of detailed tiles, even for a
  // slow jetpack. Use the existing bounded aerial cache once those details are
  // tiny on screen, not only for fast aircraft. Hysteresis avoids flickering.
  // Close to a roof/tree retain the detailed view for safe approach and landing;
  // only rendering changes: ground simulation, collisions and interactions run.
  wrap("cityRenderGround", o => function (left, top, vw, vh) {
    const flying = FLY.on || !!FLY.chute;
    const z = (typeof opts !== "undefined" ? opts.zoom || 1 : 1) * (flying ? FLY.zoom : 1);
    const alt = FLY.chute ? FLY.chute.alt : FLY.alt;
    const clearance = flying && player && alt > 40 ? alt - flyGroundAt(player.x, player.y) : 0;
    const farEnough = clearance > (FLY.lod ? 30 : 40);
    FLY.lod = !!(flying && farEnough && z < (FLY.lod ? FLY_LOD_EXIT : FLY_LOD_ENTER));
    FLY.frame = (FLY.frame || 0) + 1;
    if (FLY.lod) { flyRenderGround(left, top, vw, vh); return; }
    return o.apply(this, arguments);
  });
  wrap("cityRenderOverlay", o => function () { if (FLY.lod) return; return o.apply(this, arguments); });
  // up above the rooftops: no sign labels, door markers or line-of-sight fog to draw (everything is in view)
  const high = () => (FLY.on && FLY.alt > 40) || (FLY.chute && FLY.chute.alt > 40);
  wrap("crLabel", o => function () { if (high()) return; return o.apply(this, arguments); });
  wrap("crFog", o => function () { if (high()) return; return o.apply(this, arguments); });
  wrap("accRenderOverlay", o => function () { if (high()) return; return o.apply(this, arguments); });
  // people seen from far up are a few pixels: a dot in their colours instead of the full figure
  wrap("drawEnemyDetailed", o => function (i, ex, ey, baseR, ally, kneel, lev, spect, tCtx) {
    if (!(FLY.on && FLY.alt > 40) || (opts.zoom || 1) * (FLY.zoom || 1) > 0.3) return o.apply(this, arguments);
    const g = tCtx || ctx, s = typeof enemySpecJ === "function" ? enemySpecJ(i) : null, c = s && s.c ? s.c : ["#c62828", "#8e1a1a"];
    g.fillStyle = c[0]; g.beginPath(); g.arc(ex, ey, 9, 0, 7); g.fill(); g.fillStyle = c[1] || c[0]; g.beginPath(); g.arc(ex, ey - 3, 5, 0, 7); g.fill();
    return true;
  });
  wrap("cityComputeVis", o => function (r) { if (FLY.lod || (FLY.on && FLY.alt > 30)) { cityVis.grid = null; return cityVis; } return o.apply(this, arguments); });
  // weapons don't reach the ground from far up
  wrap("fireWeapon", o => function () { if (player && (player.flyAlt || 0) > 60) return; return o.apply(this, arguments); });
  // [F]: parked ships you can fly; G: fly by yourself
  const _fit = window.findInteractTarget, _twi = window.triggerWorldInteract;
  if (typeof _fit === "function") window.findInteractTarget = function () {
    const t = _fit();
    if (!CITY.on || !player || player.inVehicle || (t && t.kind !== "itCont" && t.kind !== "tfTalk")) return t;
    if (FLY.pkT !== runTime) { FLY.pkT = runTime; const P = flyParkedNear(); FLY.pk = P ? { kind: "flyShip", P, x: P.x, y: P.y - 30, label: "[F] FLY " + FLY_SPECS[P.p.kind].n } : null; }
    return FLY.pk || t;
  };
  if (typeof _twi === "function") window.triggerWorldInteract = function () {
    if (CITY.on && player && !player.inVehicle) { const t = findInteractTarget(); if (t && t.kind === "flyShip") { flyTakeParked(t.P); FLY.pkT = -1; return; } }
    return _twi();
  };
  window.addEventListener("keydown", e => {
    if (!runActive || runPaused || !CITY.on || e.repeat) return;
    if (e.code === "KeyK" && FLY.on) flySafetyToggle();
    else if (e.code === "KeyC" && FLY.on && !FLY.self) FLY.cockpit = !FLY.cockpit;
    else if (e.code === "KeyH" && FLY.on) FLY.brake = 0.4;
    else if (e.code === "KeyG" && !player.inVehicle) flyToggleSelf();
  });
  if (typeof V10 !== "undefined") {
    V10.onRunStart.push(() => { flyEnd("start"); FLY.chute = null; FLY.safe = true; FLY.cockpit = false; FLY.fields = new Set(); FLY.tiles.clear(); flyUiShow(false); if (typeof VEH !== "undefined") VEH.camZoom = 1; });
    V10.onStep.push((dt) => {
      if (!CITY.on) return;
      flyStep(dt); flyChuteStep(dt);
      // a bailed-out craft keeps falling until it hits the ground
      if (typeof VEH !== "undefined") for (const v of VEH.list) if (v.ghost) { const G = v.ghost; G.vz -= 9.8 * dt; G.alt += G.vz * dt; v.vx = G.vx * 0.99; v.vy = G.vy * 0.99; v.flyAlt = Math.max(0, G.alt); if (G.alt <= 0) { v.ghost = null; v.flyAir = false; v.flyAlt = 0; v.hp = 0; try { vehExplode(v); } catch (e) { /* art */ } } }
      FLY.scanT = (FLY.scanT || 0) - dt; if (FLY.scanT <= 0) { FLY.scanT = 3; flyAirfieldScan(); }
    });
    V10.onRenderWorld.push((g) => {
      if (!CITY.on) return;
      FLY.worldM = g.getTransform();
      // craft in the air: shadow on the ground, then the craft, bigger the closer it is to you
      if (typeof VEH !== "undefined") for (const v of VEH.list) {
        if (!v.flyAir) continue;
        const alt = v.flyAlt || 0, sc = 1 + Math.min(0.5, alt / 120);
        if (alt < 250) { g.save(); g.globalAlpha = Math.max(0.05, 0.3 - alt / 900); g.fillStyle = "#000"; g.beginPath(); g.ellipse(v.x + alt * 9, v.y + alt * 12, v.L * 0.5, v.D * 0.4, v.ang, 0, 7); g.fill(); g.restore(); }
        if (!flyFarView() || v !== FLY.v) flyDrawCraft(g, v, runTime, sc);
      }
      if (FLY.on && FLY.self && FLY.alt < 300 && player) {   // a hero in the air: shadow + trail
        const a = FLY.alt; g.save(); g.globalAlpha = Math.max(0.05, 0.3 - a / 600); g.fillStyle = "#000"; g.beginPath(); g.ellipse(player.x + a * 9, player.y + a * 12, 10, 6, 0, 0, 7); g.fill(); g.restore();
        const tr = FLY.S.trail, c = tr === "ki" ? "#fff59d" : tr === "smoke" ? "rgba(20,20,20,0.6)" : tr === "hex" ? "#ff1744" : tr === "broom" ? "#c8a165" : "#ffab40";
        g.save(); g.globalCompositeOperation = tr === "smoke" ? "source-over" : "lighter"; g.fillStyle = c;
        for (let k = 0; k < 5; k++) { const d = (k + 1) * 7; g.globalAlpha = 0.35 - k * 0.06; g.beginPath(); g.arc(player.x - Math.cos(FLY.hdg) * d, player.y - Math.sin(FLY.hdg) * d + 6, 5 - k * 0.6, 0, 7); g.fill(); }
        g.restore();
      }
    });
    V10.onRenderScreen.splice(1, 0, flyRenderSky, flyRenderScreen);   // after the night light, before the minimap
    V10.onRunReset.push(() => { flyEnd("reset"); FLY.chute = null; flyUiShow(false); });
  }
})();
// RG_ART ships that were taken off the ground aren't drawn or solid any more
(function flyParkedWire() {
  if (typeof RG_ART !== "undefined" && RG_ART.rgship) { const o = RG_ART.rgship; RG_ART.rgship = function (g, p) { if (p && p.gone) return; return o.apply(this, arguments); }; }
  if (typeof rgStampPoly === "function") { const o = rgStampPoly; window.rgStampPoly = rgStampPoly = function (C, p) { if (p && p.gone) return; return o.apply(this, arguments); }; }
})();
// EOF:js/flight.js
