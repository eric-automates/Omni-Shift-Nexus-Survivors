/* =========================================================================
   OMNI-SHIFT v14.2 — SAGA: drawing & igniting lightsabers, new Jedi / Sith powers, Form matchups
   1. IGNITION CHOREOGRAPHY — a lightsaber is never just "on": the hilt hangs on
      the belt, the hand draws it, the blade ignites in that character's own way
      (film references, several variations each, picked at random every time),
      then settles into the Form's guard. Put away: blade retracts, hilt back on
      the belt. Luke (Endor stand / sail-barge catch / throne-room snatch),
      Sidious (hilt slides from the sleeve, instant light, spinning lunge),
      Vader (unlit hilt carried in hand when it's dangerous; slow ignition pointed
      at the floor, raised slowly — or kept low until someone walks up; calm
      Cloud City light; Rogue One stillness), Maul (one blade, a beat, the second
      blade slowly), Windu (snap-on at the throat / upright), Yoda (hand out, the
      hilt flies from his belt into it, deep ignition, twirl), Qui-Gon (raised
      before him / lit on the run), Dooku (Makashi salute), Obi-Wan (calm and
      raised / a twirl / straight into Soresu), Grievous (two hilts, then two more).
   2. NEW HEROES — The Count: straight-line Force lightning from the fingertips
      (passive, longer with every level), spinning sideways saber throw that sticks
      and snaps back, telekinetic pillar drop. Qui-Gon: Force Speed, meditation heal.
      Old Ben: Circle of Shelter, "these aren't the droids…", the High Ground.
   3. FORM MATCHUPS (lightsaber users only, bonuses never penalties, +25 %):
      Shii-Cho / Jar'Kai vs crowds · Makashi & Djem So vs saber / melee fighters ·
      Soresu & Shien vs blaster fire · Ataru vs a lone foe / elites · Niman vs
      saber-wielding Force users · Juyo / Vaapad vs elites, rivals and bosses.
   ========================================================================= */
"use strict";

/* --- 1. IGNITION CHOREOGRAPHY ------------------------------------------------------------- */
// keyframes: poses relative to the facing (like SF_POSES) — arm / blade (rad), reach (px), lit = blade out (0..1),
// hand = hilt in the hand (0 = on the belt), len = blade foreshortening, len2 = Maul's second blade, sub = Grievous'
// extra blades; d = seconds to reach it. Flags: hold (keep the pose; "near" = until a foe walks up), pull / toss /
// sleeve (how the hilt reaches the hand), spin (a twirl), guard (blend back into the Form engine's guard).
const SAGA_CHOREO = {
  standard:     [{ d: 0.14, arm: 0.9, blade: 1.2, reach: 6, lit: 0, hand: 1 }, { d: 0.14, arm: 0.5, blade: -0.4, reach: 7, lit: 1 }, { d: 0.12, guard: true }],
  lukeEndor:    [{ d: 0.16, arm: 0.8, blade: 1.0, reach: 6, lit: 0, hand: 1 }, { d: 0.16, arm: 0.25, blade: -1.45, reach: 6.5, lit: 1 }, { d: 0.32, hold: true }, { d: 0.16, guard: true }],
  lukeCatch:    [{ d: 0.34, toss: true, arm: -0.2, blade: -0.3, reach: 9, lit: 0, hand: 0 }, { d: 0.1, arm: 0.1, blade: 0.05, reach: 9.5, lit: 1, hand: 1 }, { d: 0.18, guard: true }],
  lukeSnatch:   [{ d: 0.18, pull: true, arm: 0.05, blade: 0.0, reach: 10, lit: 0, hand: 0 }, { d: 0.06, arm: 0.1, blade: -0.6, reach: 8, lit: 1, hand: 1 }, { d: 0.12, guard: true }],
  sidiousSleeve:[{ d: 0.13, sleeve: true, arm: 0.6, blade: 0.9, reach: 7, lit: 0, hand: 1 }, { d: 0.06, arm: 0.2, blade: 0.3, reach: 9, lit: 1 }, { d: 0.34, spin: 1, reach: 10 }, { d: 0.1, guard: true }],
  vaderSlow:    [{ d: 0.12, arm: 0.95, blade: 1.25, reach: 6.5, lit: 0, hand: 1 }, { d: 0.62, lit: 1, len: 0.82 }, { d: 1.1, hold: "near" }, { d: 0.85, guard: true, len: 1 }],
  vaderCalm:    [{ d: 0.16, arm: 0.7, blade: 0.95, reach: 7, lit: 0, hand: 1 }, { d: 0.24, lit: 1 }, { d: 0.4, guard: true }],
  vaderStill:   [{ d: 0.14, arm: 0.6, blade: 0.6, reach: 7.5, lit: 0, hand: 1 }, { d: 0.3, lit: 1 }, { d: 0.65, hold: true }, { d: 0.22, guard: true }],
  maulDouble:   [{ d: 0.16, arm: 0.6, blade: 1.0, reach: 6.5, lit: 0, hand: 1, len2: 0 }, { d: 0.14, arm: 0.3, blade: -0.9, reach: 7.5, lit: 1 }, { d: 0.32, hold: true }, { d: 0.45, len2: 1, arm: 0.2, blade: 1.45 }, { d: 0.3, spin: 1 }, { d: 0.1, guard: true }],
  winduSnap:    [{ d: 0.05, arm: 0.0, blade: 0.0, reach: 11, lit: 0, hand: 1 }, { d: 0.05, lit: 1 }, { d: 0.22, hold: true }, { d: 0.14, guard: true }],
  winduUp:      [{ d: 0.15, arm: 0.6, blade: 1.0, reach: 6.5, lit: 0, hand: 1 }, { d: 0.15, arm: 0.2, blade: -1.5, lit: 1 }, { d: 0.2, guard: true }],
  yodaPull:     [{ d: 0.3, pull: true, arm: 0.1, blade: 0.0, reach: 9, lit: 0, hand: 0 }, { d: 0.14, arm: 0.2, blade: -1.0, reach: 7, lit: 1, hand: 1 }, { d: 0.34, spin: 1 }, { d: 0.12, guard: true }],
  quigonUp:     [{ d: 0.2, arm: 0.8, blade: 1.0, reach: 6, lit: 0, hand: 1 }, { d: 0.16, arm: 0.15, blade: -1.55, lit: 1 }, { d: 0.3, hold: true }, { d: 0.2, guard: true }],
  quigonRun:    [{ d: 0.12, arm: 0.6, blade: 0.6, reach: 7, lit: 0, hand: 1 }, { d: 0.12, arm: 0.4, blade: -0.2, reach: 8, lit: 1 }, { d: 0.1, guard: true }],
  dookuSalute:  [{ d: 0.2, arm: 0.7, blade: 1.0, reach: 6, lit: 0, hand: 1 }, { d: 0.14, arm: 0.05, blade: -1.57, reach: 5.5, lit: 1 }, { d: 0.28, hold: true }, { d: 0.3, arm: 0.5, blade: 0.9, reach: 9 }, { d: 0.14, guard: true }],
  obiHigh:      [{ d: 0.18, arm: 0.8, blade: 1.0, reach: 6, lit: 0, hand: 1 }, { d: 0.18, arm: 0.3, blade: -1.4, reach: 6.5, lit: 1 }, { d: 0.22, hold: true }, { d: 0.2, guard: true }],
  obiTwirl:     [{ d: 0.15, arm: 0.7, blade: 0.9, reach: 6.5, lit: 0, hand: 1 }, { d: 0.12, arm: 0.4, blade: -0.5, reach: 7, lit: 1 }, { d: 0.36, spin: 1 }, { d: 0.12, guard: true }],
  obiSoresu:    [{ d: 0.18, arm: 0.7, blade: 1.0, reach: 6, lit: 0, hand: 1 }, { d: 0.15, arm: -0.4, blade: -0.9, lit: 1 }, { d: 0.3, guard: true }],
  grievous:     [{ d: 0.22, arm: 0.7, blade: 1.0, reach: 6, lit: 0, hand: 1, sub: 0 }, { d: 0.14, arm: 0.4, blade: -0.3, reach: 7.5, lit: 1 }, { d: 0.34, hold: true, sub: 1 }, { d: 0.14, guard: true }],
  // crossguard (unstable kyber): a sputtering ignition held low and out to the side, then a menacing pause
  kyloCrackle:  [{ d: 0.16, arm: 0.9, blade: 1.0, reach: 6.5, lit: 0, hand: 1 }, { d: 0.34, arm: 0.95, blade: 0.85, reach: 7.5, lit: 1 }, { d: 0.3, hold: true }, { d: 0.18, guard: true }]
};
const SAGA_VARIANTS = {
  0: [["lukeEndor", 3], ["lukeCatch", 1], ["lukeSnatch", 1]], 3: [["sidiousSleeve", 1]], 55: [["grievous", 1]],
  76: [["vaderSlow", 3], ["vaderCalm", 2], ["vaderStill", 1]], 77: [["maulDouble", 1]], 78: [["winduSnap", 1], ["winduUp", 2]],
  79: [["yodaPull", 1]], 81: [["quigonUp", 2], ["quigonRun", 1]], 82: [["dookuSalute", 1]], 83: [["obiHigh", 2], ["obiTwirl", 1], ["obiSoresu", 1]]
};
// the custom hero's hilt choice picks its style (creator presets are named after their film owners)
const SAGA_HILT_STYLE = { graflex: "lukeEndor", knight: "lukeSnatch", hermit: "obiHigh", darklord: "vaderCalm", electrum: "winduUp", curved: "dookuSalute",
  shoto: "yodaPull", crossguard: "kyloCrackle", temple: "winduUp", scavenger: "quigonRun" };
const SAGA_STOW = { arm: 1.35, blade: 1.9, reach: 5 };
const SAGA = { carry: false, calmT: 0, last: "", lightningT: 0, bolts: [], pillars: [], shelterT: 0, medT: 0, still: 0, lx: 0, ly: 0, matchShown: {} };

function sagaPick(w) {
  if (player.cid === CUSTOM_CID) { const H = typeof SABER_HILTS !== "undefined" ? SABER_HILTS[w.hilt] : null, k = H && SAGA_HILT_STYLE[H.key]; return SAGA_CHOREO[k] ? k : "standard"; }   // the creator's hilt preset
  const L = SAGA_VARIANTS[w.id] || SAGA_VARIANTS[player.cid];
  if (!L) return "standard";
  if (w.id === 0 && Math.hypot(player.vx || 0, player.vy || 0) < 60) { const r = Math.random(); return r < 0.75 ? "lukeEndor" : "lukeSnatch"; }   // the barge catch is a leap — only on the move
  let tot = 0; for (const v of L) tot += v[1];
  let r = Math.random() * tot; for (const v of L) { r -= v[1]; if (r <= 0) return v[0]; }
  return L[0][0];
}
const sagaEase = t => t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t);
function sagaNearest() { let d = 1e9; if (typeof sfGlobal !== "undefined") for (let k = 0; k < sfGlobal.nearN; k++) d = Math.min(d, sfGlobal.near[k].d); return d; }

// Vader carries the unlit hilt in his hand while it's dangerous (foes about, hostile districts), clips it to his belt when calm
function sagaVaderCarries(dt) {
  let danger = !(typeof CITY !== "undefined" && CITY.on);                        // the arena is always hostile
  if (!danger) {
    for (let j = 0; j < MAX_E && !danger; j++) if (eAct[j] && !(typeof allyIs === "function" && allyIs(j)) && Math.hypot(eX[j] - player.x, eY[j] - player.y) < 760) danger = true;
    if (!danger && typeof cityMacroClass === "function" && typeof cityWorldM === "function") { const m = cityWorldM(player.x, player.y), c = cityMacroClass(Math.floor(m[0] / 1000), Math.floor(m[1] / 1000)); danger = c === CL_URBAN || c === CL_DOWNTOWN || c === CL_INDUSTRIAL; }
  }
  SAGA.calmT = danger ? 0 : SAGA.calmT + dt;
  if (danger) SAGA.carry = true; else if (SAGA.calmT > 6) SAGA.carry = false;
  return SAGA.carry;
}

// Called by the Form engine instead of its plain lit ramp. Drives st.lit (blade out), st.hand (hilt in hand), the pose
// override (st.igW / igArm / igBlade / igReach), blade foreshortening (st.igLenK), Maul's second blade (st.len2K),
// Grievous' extra blades (st.subLit) and the flying hilt (st.fly). Returns true when it handled the step.
function sagaLitStep(w, st, wantLit, stow, dt, slot) {
  if (!player || (typeof SF_STEEL_IDS !== "undefined" && SF_STEEL_IDS.includes(w.id))) return false;   // steel: js/sheathe.js
  if (stow) { st.ig = null; st.igW = 0; st.fly = null; st.lit = Math.max(0, st.lit - dt / 0.1); st.hand = st.lit > 0 ? 1 : Math.max(0, (st.hand || 0) - dt / 0.2); return true; }   // Yoda's Will of the Force
  const carry = w.id === 76 && sagaVaderCarries(dt);
  if (st.hand == null) st.hand = st.lit > 0.5 ? 1 : (carry ? 1 : 0);
  const want = wantLit || st.idle < 3.0;
  if (want && !st.ig && st.lit < 0.05) {                                          // start a draw + ignition
    const key = sagaPick(w);
    const from = carry || st.hand > 0.5 ? { arm: 1.1, blade: 1.35, reach: 5.5, lit: 0, hand: 1, len: 1, len2: 1, sub: 1 } : { arm: SAGA_STOW.arm, blade: SAGA_STOW.blade, reach: SAGA_STOW.reach, lit: 0, hand: 0, len: 1, len2: 1, sub: 1 };
    st.ig = { key, seg: 0, t: 0, from, to: null, spin: 0, w: 1 };
    SAGA.last = key;
    if (slot === 0 && (SAGA_CHOREO[key][0].pull) && typeof sfx === "function") { sfx(240, 620, 0.22, "sine", 0.05); sfx(90, 140, 0.25, "triangle", 0.04); }   // Force pull whoosh
  }
  if (st.ig) {
    const I = st.ig, C = SAGA_CHOREO[I.key];
    // never let theatre cost a hit: a bolt incoming or a foe in your face skips straight to the guard
    if (I.seg < C.length && (C[I.seg].hold) && st.lit > 0.5 && ((typeof sfGlobal !== "undefined" && sfGlobal.boltNear) || sagaNearest() < (C[I.seg].hold === "near" ? 150 : 60))) { I.seg++; I.t = 0; I.from = Object.assign({}, I.cur || I.from); }
    if (!want && st.lit < 0.5) { st.ig = null; }                                   // foe gone before the blade was out: put it back
    else if (I.seg >= C.length) { st.ig = null; st.lit = 1; st.hand = 1; st.igW = 0; st.fly = null; st.igLenK = 1; st.len2K = 1; st.subLit = null; }
    else {
      const K = C[I.seg], f = I.from;
      I.t += dt;
      const k = sagaEase(Math.min(1, I.t / K.d));
      const tgt = { arm: K.arm ?? f.arm, blade: K.blade ?? f.blade, reach: K.reach ?? f.reach, lit: K.lit ?? f.lit, hand: K.hand ?? f.hand, len: K.len ?? f.len, len2: K.len2 ?? f.len2, sub: K.sub ?? f.sub };
      const cur = I.cur = {
        arm: f.arm + (tgt.arm - f.arm) * k, blade: f.blade + (tgt.blade - f.blade) * k + (K.spin ? K.spin * Math.PI * 2 * k : 0), reach: f.reach + (tgt.reach - f.reach) * k,
        lit: f.lit + (tgt.lit - f.lit) * (K.lit != null && K.lit > f.lit ? Math.min(1, I.t / K.d) : k), hand: tgt.hand >= f.hand ? (k > 0.5 || K.pull || K.toss ? tgt.hand : f.hand) : tgt.hand,
        len: f.len + (tgt.len - f.len) * k, len2: f.len2 + (tgt.len2 - f.len2) * Math.min(1, I.t / K.d), sub: f.sub + (tgt.sub - f.sub) * Math.min(1, I.t / K.d)
      };
      I.w = K.guard ? 1 - k : 1;
      st.lit = cur.lit; st.hand = cur.hand; st.igW = I.w; st.igArm = cur.arm; st.igBlade = cur.blade; st.igReach = cur.reach;
      st.igLenK = cur.len; st.len2K = cur.len2; st.subLit = w.id === 55 ? Math.min(st.lit, cur.sub) : null;
      st.fly = (K.pull || K.toss || K.sleeve) ? { kind: K.pull ? "pull" : (K.toss ? "toss" : "sleeve"), k: Math.min(1, I.t / K.d) } : null;
      if (I.t >= K.d) { I.seg++; I.t = 0; I.from = Object.assign({}, cur, { blade: tgt.blade, spin: 0 }); }
    }
    return true;
  }
  // no choreography running: hold, or put it away (blade retracts, then the hilt goes back on the belt — unless Vader carries it)
  st.fly = null; st.igLenK = 1; st.len2K = 1; st.subLit = null;
  if (want) { st.lit = Math.min(1, st.lit + dt / 0.16); st.hand = 1; st.igW = 0; return true; }
  st.lit = Math.max(0, st.lit - dt / (w.id === 76 ? 0.34 : 0.24));
  if (st.lit <= 0) {
    if (carry) { st.hand = 1; st.igW = Math.min(1, (st.igW || 0) + dt / 0.3); st.igArm = 1.1; st.igBlade = 1.35; st.igReach = 5.5; }   // unlit hilt held low at his side
    else { st.hand = Math.max(0, st.hand - dt / 0.22); st.igW = 0; }
  }
  return true;
}

// render: the flying hilt (Yoda / Luke's Force snatch from the belt, the sail-barge toss, Sidious' sleeve)
function sagaDrawFly(tCtx, w, R, st, col, handCol, slotIdx) {
  const F = st.fly; if (!F) return false;
  const side = slotIdx % 2 === 0 ? 1 : -1;
  const hx = Math.cos(R.arm) * R.reach - Math.sin(R.arm) * R.side, hy = Math.sin(R.arm) * R.reach + Math.cos(R.arm) * R.side;
  let bx = 4.8 * side, by = 5.2;
  if (F.kind === "sleeve") { bx = hx * 0.55; by = hy * 0.55 + 1.5; }
  const k = sagaEase(F.k);
  let x = bx + (hx - bx) * k, y = by + (hy - by) * k;
  if (F.kind === "toss") y -= Math.sin(Math.PI * F.k) * 22;                        // a high arc into the hand
  drawBallHand(tCtx, hx, hy, 2.5, handCol);                                       // the hand waits for it
  if (F.kind === "pull" && !opts.lowPart) {                                        // a Force ripple along the path
    tCtx.save(); tCtx.strokeStyle = "rgba(180,230,255," + (0.35 * (1 - F.k)).toFixed(3) + ")"; tCtx.lineWidth = 1;
    tCtx.beginPath(); tCtx.arc(hx, hy, 4 + 6 * F.k, 0, Math.PI * 2); tCtx.stroke(); tCtx.restore();
  }
  tCtx.save(); tCtx.translate(x, y); tCtx.rotate((F.kind === "sleeve" ? R.blade : F.k * Math.PI * (F.kind === "toss" ? 5 : 2.4)) + Math.PI / 2);
  drawWeaponModel(tCtx, w.id, "orbit", w.lvl >= 5, w.lvl >= 10, col, 0, 0, -1, false, w.hilt);
  tCtx.restore();
  return true;
}
// render: Maul's second blade growing out of the far end of the hilt
function sagaDrawBlade2(tCtx, R, st, col) {
  const L = R.len * (st.len2K ?? 1);
  if (L < 1) return;
  tCtx.save(); tCtx.rotate(Math.PI); tCtx.translate(6, 0);
  tCtx.lineCap = "round";
  tCtx.strokeStyle = col; tCtx.globalAlpha = 0.55; tCtx.lineWidth = 4.2; tCtx.beginPath(); tCtx.moveTo(0, 0); tCtx.lineTo(L, 0); tCtx.stroke();
  tCtx.globalAlpha = 1; tCtx.strokeStyle = "#ffffff"; tCtx.lineWidth = 1.6; tCtx.beginPath(); tCtx.moveTo(0, 0); tCtx.lineTo(L, 0); tCtx.stroke();
  tCtx.restore();
}

/* --- 2. NEW HEROES' POWERS -------------------------------------------------------------------- */
function sagaSaberW() { return player && player.weapons ? player.weapons.find(q => q.enabled !== false && typeof saberEngineOwns === "function" && saberEngineOwns(q)) || player.weapons[0] : null; }
function sagaFoes(x, y, r) { const out = []; for (let j = 0; j < MAX_E; j++) { if (!eAct[j] || (typeof allyIs === "function" && allyIs(j)) || (typeof sdIgnore === "function" && sdIgnore(j))) continue; const d = Math.hypot(eX[j] - x, eY[j] - y); if (d < r) out.push([d, j]); } out.sort((a, b) => a[0] - b[0]); return out.map(q => q[1]); }
function sagaHurt(j, dmg, stun, ang) {
  if (!eAct[j] || (typeof allyIs === "function" && allyIs(j))) return;
  eHP[j] -= dmg; eStun[j] = Math.max(eStun[j], stun || 0);
  if (typeof spawnDmg === "function") spawnDmg(eX[j], eY[j], dmg, dmg > 120);
  if (eHP[j] <= 0 && typeof killEnemy === "function") killEnemy(j, false, ang || 0, "#80d8ff");
}

// The Count — Sith lightning: straight, crackling lines from his fingertips; reach and bolt count grow with level
function sagaDookuLightning(dt) {
  SAGA.lightningT -= dt;
  const w = sagaSaberW(), lv = w ? Math.min(10, w.lvl || 1) : 1;
  const range = 170 + lv * 22, every = Math.max(1.5, 2.7 - lv * 0.11);
  if (SAGA.lightningT > 0) return;
  const foes = sagaFoes(player.x, player.y, range);
  if (!foes.length) { SAGA.lightningT = 0.25; return; }
  SAGA.lightningT = every;
  const n = Math.min(foes.length, 1 + Math.floor(lv / 3)), aim = Math.atan2(eY[foes[0]] - player.y, eX[foes[0]] - player.x);
  const fx = player.x + Math.cos(aim) * 9 + Math.cos(aim - 1.4) * 4, fy = player.y + Math.sin(aim) * 9 + Math.sin(aim - 1.4) * 4 - 3;
  player.forceHandTimer = 0.4; player.forceHandAng = aim;
  for (let k = 0; k < n; k++) {
    const j = foes[k], pts = [[fx, fy]], tx = eX[j], ty = eY[j], L = Math.hypot(tx - fx, ty - fy), segs = 3 + Math.floor(L / 70);
    for (let s = 1; s < segs; s++) { const t = s / segs, jit = (Math.random() - 0.5) * 7; pts.push([fx + (tx - fx) * t - (ty - fy) / L * jit, fy + (ty - fy) * t + (tx - fx) / L * jit]); }
    pts.push([tx, ty]);
    SAGA.bolts.push({ pts, t: 0.24, fork: Math.random() < 0.5 ? Math.floor(segs / 2) : -1 });
    sagaHurt(j, (14 + lv * 7) * (player.might || 1), 0.6, aim);
  }
  if (typeof sfx === "function") { sfx(1800, 600, 0.18, "sawtooth", 0.035); sfx(3200, 900, 0.12, "square", 0.02); }
}
function sagaDrawLightning(g) {
  for (let i = SAGA.bolts.length - 1; i >= 0; i--) {
    const B = SAGA.bolts[i]; B.t -= 1 / 60;
    if (B.t <= 0) { SAGA.bolts.splice(i, 1); continue; }
    const a = Math.min(1, B.t / 0.12);
    for (const [wid, col] of [[5, "rgba(100,181,246," + (0.35 * a) + ")"], [2.2, "rgba(207,232,255," + (0.85 * a) + ")"], [1, "rgba(255,255,255," + a + ")"]]) {
      g.strokeStyle = col; g.lineWidth = wid; g.lineJoin = "miter"; g.beginPath();
      B.pts.forEach((p, k) => k ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.stroke();
      if (B.fork > 0) { const p = B.pts[B.fork], q = B.pts[B.pts.length - 1]; g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(p[0] + (q[0] - p[0]) * 0.35 + 9, p[1] + (q[1] - p[1]) * 0.35 - 7); g.stroke(); }
    }
  }
}
// The Count — spinning sideways saber throw: flat spin, sticks into the target, snaps straight back
function sagaDookuThrow() {
  const w = sagaSaberW(); if (!w || typeof launchThrownBladeImpale !== "function" || thrownBlade.active) return false;
  launchThrownBladeImpale(w, typeof getWeaponColor === "function" ? getWeaponColor(82) : "#ff1744");
  thrownBlade.dooku = true; thrownBlade.timer = 0.24;
  spawnSpeech(player.x, player.y - 26, "SABER THROW!", "#ff8a80", 1.0);
  return true;
}
// The Count — telekinetic pillar drop (Geonosis): a column of debris crashes onto the densest knot of foes ahead
function sagaPillarDrop() {
  const w = sagaSaberW(), lv = w ? Math.min(10, w.lvl || 1) : 1, foes = sagaFoes(player.x, player.y, 260);
  let x = player.x + Math.cos(player.aim || 0) * 110, y = player.y + Math.sin(player.aim || 0) * 110, best = 0;
  for (const j of foes) { let n = 0; for (const q of foes) if (Math.hypot(eX[q] - eX[j], eY[q] - eY[j]) < 70) n++; if (n > best) { best = n; x = eX[j]; y = eY[j]; } }
  SAGA.pillars.push({ x, y, t: 0.42, r: 64, dmg: (90 + lv * 20) * (player.might || 1), hit: false });
  player.forceHandTimer = 0.6; player.forceHandAng = Math.atan2(y - player.y, x - player.x);
  spawnSpeech(player.x, player.y - 26, "PILLAR DROP!", "#ffcc80", 1.0);
  return true;
}
function sagaPillarStep(dt) {
  for (let i = SAGA.pillars.length - 1; i >= 0; i--) {
    const P = SAGA.pillars[i]; P.t -= dt;
    if (!P.hit && P.t <= 0) {
      P.hit = true; P.t = -0.0001;
      for (const j of sagaFoes(P.x, P.y, P.r)) { const a = Math.atan2(eY[j] - P.y, eX[j] - P.x); eX[j] += Math.cos(a) * 22; eY[j] += Math.sin(a) * 22; sagaHurt(j, P.dmg, 1.2, a); }
      if (typeof fxShake === "function") fxShake(6, 0.3);
      if (typeof spawnParticles === "function") spawnParticles(P.x, P.y, 14);
      if (typeof sfx === "function") { sfx(70, 30, 0.45, "sawtooth", 0.2); sfx(140, 50, 0.3, "triangle", 0.12); }
    }
    if (P.t < -0.5) SAGA.pillars.splice(i, 1);
  }
}
function sagaDrawPillars(g) {
  for (const P of SAGA.pillars) {
    if (!P.hit) {   // shadow grows, the column falls
      const k = 1 - Math.max(0, P.t) / 0.42;
      g.fillStyle = "rgba(0,0,0," + (0.15 + 0.3 * k) + ")"; g.beginPath(); g.ellipse(P.x, P.y, P.r * (0.4 + 0.6 * k), P.r * 0.5 * (0.4 + 0.6 * k), 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = "#8d7b68"; g.strokeStyle = "#4e4033"; g.lineWidth = 2;
      const h = (1 - k) * 160;
      g.fillRect(P.x - 14, P.y - 70 - h, 28, 64); g.strokeRect(P.x - 14, P.y - 70 - h, 28, 64);
    } else {        // rubble + dust ring
      const k = Math.min(1, -P.t / 0.5);
      g.strokeStyle = "rgba(190,170,140," + (0.6 * (1 - k)) + ")"; g.lineWidth = 6 * (1 - k) + 1; g.beginPath(); g.arc(P.x, P.y, P.r * (0.6 + k), 0, Math.PI * 2); g.stroke();
      g.fillStyle = "#6d5d4b"; for (let q = 0; q < 6; q++) { const a = q * 1.05 + P.x * 0.01; g.fillRect(P.x + Math.cos(a) * P.r * 0.45 - 4, P.y + Math.sin(a) * P.r * 0.35 - 3, 9, 6); }
    }
  }
}
// Qui-Gon — the Living Force: standing still with no foe close, he meditates and heals (the laser-gate moment)
function sagaQuiGonStep(dt) {
  const moved = Math.hypot(player.x - SAGA.lx, player.y - SAGA.ly) > 0.6;
  SAGA.lx = player.x; SAGA.ly = player.y;
  SAGA.still = moved ? 0 : SAGA.still + dt;
  const calm = !sagaFoes(player.x, player.y, 240).length;
  if (SAGA.still > 1.2 && calm && player.hp < player.maxHp) {
    if (SAGA.medT <= 0) spawnSpeech(player.x, player.y - 28, "MEDITATING…", "#b9f6ca", 1.2);
    SAGA.medT += dt; player.hp = Math.min(player.maxHp, player.hp + player.maxHp * 0.05 * dt);
  } else SAGA.medT = 0;
}
// Old Ben — the High Ground (+25 % damage & deflection on a roof); Circle of Shelter (every bolt sent back for 3 s)
function sagaHighGround() { return player && player.cid === 83 && !!player.roof; }

/* --- 3. FORM MATCHUPS (+25 %, lightsaber users only) ---------------------------------------------------- */
const SAGA_MATCH_TXT = { shiicho: "vs crowds", jarkai: "vs crowds", makashi: "vs saber & melee fighters", djemso: "vs saber & melee fighters", soresu: "deflecting blaster fire", shien: "vs blaster fire",
  ataru: "vs a lone foe & elites", niman: "vs saber-wielding Force users", juyo: "vs elites, rivals & bosses", vaapad: "vs elites, rivals & bosses" };
function sagaFormBase(w) { if (!w || typeof saberFormInfo !== "function" || typeof sfIsSaberId !== "function" || !sfIsSaberId(w.id)) return null; const i = saberFormInfo(w); return i && i.saber ? ((i.form && i.form.base) || i.key) : null; }
function sagaFoeClass(j) {
  const s = typeof enemySpecJ === "function" ? enemySpecJ(j) : typeof enemySpec === "function" ? enemySpec(eType[j]) : null, wk = (s && s.w) || "";
  const ranged = !!(s && s.r), saber = !ranged && /saber|esword/.test(wk);          // Jedi sabers, energy swords (a Goa'uld staff weapon is a gun)
  return { ranged, saber, melee: saber || (!ranged && /sword|blade|axe|knife|club|spear|hammer|baton|machete|mace|whip|scythe|cleaver|katana|halberd|pike|sickle|lance|polearm|scimitar|choppa|klaw|wrench|pitchfork/.test(wk)), elite: eType[j] >= 98 || eFormType[j] === 1 };
}
function sagaMatchK(w, j) {
  const base = sagaFormBase(w); if (!base) return 1;
  const c = sagaFoeClass(j);
  let on = false;
  if (base === "makashi" || base === "djemso") on = c.melee;
  else if (base === "shien") on = c.ranged;
  else if (base === "ataru") { on = c.elite; if (!on) { let n = 0; for (let q = 0; q < MAX_E && n < 2; q++) if (eAct[q] && q !== j && Math.hypot(eX[q] - eX[j], eY[q] - eY[j]) < 120) n++; on = n === 0; } }
  else if (base === "niman") on = c.saber;
  else if (base === "juyo" || base === "vaapad") on = c.elite;
  else if (base === "shiicho" || base === "jarkai") { let n = 0; for (let q = 0; q < MAX_E && n < 4; q++) if (eAct[q] && Math.hypot(eX[q] - player.x, eY[q] - player.y) < 200) n++; on = n >= 4; }
  if (on && !SAGA.matchShown[base] && typeof spawnSpeech === "function") { SAGA.matchShown[base] = 1; spawnSpeech(player.x, player.y - 34, (SABER_FORMS[base] ? SABER_FORMS[base].name.toUpperCase() : base.toUpperCase()) + " +25% " + SAGA_MATCH_TXT[base].toUpperCase(), "#ffe082", 1.6); }
  return on ? 1.25 : 1;
}
function sagaMatchText(w) { const b = sagaFormBase(w); return b && SAGA_MATCH_TXT[b] ? `+25% ${SAGA_MATCH_TXT[b]}` : ""; }

/* --- wiring ------------------------------------------------------------------------------------------------ */
(function sagaWire() {
  if (typeof bladeHitEnemy === "function") {                // matchup + High Ground damage, applied to the hit only
    const _bhe = bladeHitEnemy;
    bladeHitEnemy = function (j, cx, cy, w, ang, col, hm) {
      const k = sagaMatchK(w, j) * (sagaHighGround() ? 1.25 : 1);
      if (k === 1) return _bhe(j, cx, cy, w, ang, col, hm);
      const m = player.might; player.might = (m || 1) * k;
      try { return _bhe(j, cx, cy, w, ang, col, hm); } finally { player.might = m; }
    };
  }
  if (typeof getSaberDeflectChance === "function") {
    const _gdc = getSaberDeflectChance;
    getSaberDeflectChance = function () {
      let c = _gdc();
      if (c <= 0) return c;
      if (SAGA.shelterT > 0) return 1;
      const w = sagaSaberW(), b = sagaFormBase(w);
      if (b === "soresu" || b === "shien") c *= 1.25;
      if (sagaHighGround()) c *= 1.25;
      return Math.min(0.97, c);
    };
  }
  if (typeof updateThrownBladeSim === "function") {         // The Count's throw: faster flat spin, a short stick, a fast return
    const _uts = updateThrownBladeSim;
    updateThrownBladeSim = function (dt) {
      if (thrownBlade.active && thrownBlade.dooku) {
        if (thrownBlade.stage === 1) thrownBlade.ang += dt * 22;
        if (thrownBlade.stage === 2 && thrownBlade.timer > 0.14) thrownBlade.timer = 0.14;
        if (thrownBlade.stage === 3) thrownBlade.ang += dt * 30;
      }
      const r = _uts(dt);
      if (!thrownBlade.active) thrownBlade.dooku = false;
      return r;
    };
  }
  if (typeof triggerUtility === "function") {
    const _tu = triggerUtility;
    const mine = { dookuThrow: sagaDookuThrow, pillarDrop: sagaPillarDrop,
      forceSpeed() { player.overclockTimer = Math.max(player.overclockTimer || 0, 3.0); spawnSpeech(player.x, player.y - 26, "FORCE SPEED!", "#b9f6ca", 1.0); if (typeof sfx === "function") sfx(300, 900, 0.25, "sine", 0.05); return true; },
      soresuShelter() { SAGA.shelterT = 3.0; spawnSpeech(player.x, player.y - 26, "CIRCLE OF SHELTER", "#81d4fa", 1.2); return true; },
      kenobiTrick() {
        const c = typeof forceGatherNear === "function" ? forceGatherNear(player.x, player.y, 230, false) : [];   // [{j, d}] nearest first
        const weak = c.filter(o => eType[o.j] < 98 && eFormType[o.j] !== 1), strong = c.filter(o => !weak.includes(o));
        strong.forEach(o => { eStun[o.j] = Math.max(eStun[o.j], 2.5); });
        if (weak.length && typeof forcePersuade === "function") forcePersuade(weak, 4, 10, "\"These aren't the droids you're looking for.\"");
        else spawnSpeech(player.x, player.y - 26, "\"MOVE ALONG.\"", "#81d4fa", 1.2);
        return true;
      } };
    triggerUtility = function (uIdx) {
      const u = player && player.utils && player.utils[uIdx];
      if (!u || !mine[u.type]) return _tu(uIdx);
      if (typeof flyGroundSeparated === "function" && flyGroundSeparated() && !["forceSpeed", "soresuShelter"].includes(u.type)) { if (typeof flyTip === "function") flyTip("⬇ DESCEND TO REACH THE GROUND"); return; }
      if (u.cd > 0) return;
      if (mine[u.type]() !== false) { u.cd = u.cdMax * (player.utilCdrMul || 1); player.combatAlertTimer = 2.0; }
      if (typeof updateHUD === "function") updateHUD();
    };
  }
  if (typeof V10 !== "undefined") {
    V10.onRunStart.push(() => { SAGA.carry = player && player.cid === 76 && !(typeof CITY !== "undefined" && CITY.on); SAGA.calmT = 0; SAGA.bolts.length = 0; SAGA.pillars.length = 0; SAGA.shelterT = 0; SAGA.lightningT = 1.2; SAGA.matchShown = {}; SAGA.medT = 0; SAGA.still = 0; if (player) { SAGA.lx = player.x; SAGA.ly = player.y; } });
    V10.onStep.push(dt => {
      if (!player) return;
      if (SAGA.shelterT > 0) SAGA.shelterT -= dt;
      if (player.cid === 82 && !(typeof flyGroundSeparated === "function" && flyGroundSeparated())) sagaDookuLightning(dt);
      if (player.cid === 81) sagaQuiGonStep(dt);
      if (SAGA.pillars.length) sagaPillarStep(dt);
    });
    V10.onRenderWorld.push(g => {
      if (SAGA.bolts.length) sagaDrawLightning(g);
      if (SAGA.pillars.length) sagaDrawPillars(g);
      if (player && SAGA.shelterT > 0) { g.strokeStyle = "rgba(129,212,250," + (0.25 + 0.2 * Math.sin(runTime * 18)) + ")"; g.lineWidth = 2; g.beginPath(); g.arc(player.x, player.y - 4, 26, 0, Math.PI * 2); g.stroke(); }
      if (player && player.cid === 81 && SAGA.medT > 0) { g.strokeStyle = "rgba(105,240,174,0.35)"; g.lineWidth = 1.5; g.beginPath(); g.arc(player.x, player.y - 4, 16 + Math.sin(runTime * 3) * 2, 0, Math.PI * 2); g.stroke(); }
      if (sagaHighGround()) { g.fillStyle = "rgba(129,212,250,0.85)"; g.font = "bold 9px sans-serif"; g.textAlign = "center"; g.fillText("HIGH GROUND", player.x, player.y - 30); }
    });
  }
})();
// EOF:js/saga.js
