/* =========================================================================
   OMNI-SHIFT v13 — THE LIGHT SIDE: FORCE PERSUASION & YODA'S GRAND MASTER POWERS

   • Force Persuasion (automatic): light-side Force users — Luke (0), Mace (78), Yoda (79) and a custom
     hero who is Light + Strong in the Force — turn a few nearby enemies to their side when a crowd
     closes in. Converted enemies glow, get lifted, are healed to double health and fight FOR you
     (they hunt hostiles, ranged ones shoot friendly bolts, hostiles brawl back). When the effect
     wears off they lay down their arms and walk away (half XP). If hostiles kill them you get nothing.
     Rivals and Sector Titans can never be persuaded. A custom hero with the "Mind Trick" skill gets
     the same effect on a button.
   • Yoda only:
       Lv5+  FORCE LIFT & HURL  — lifts up to 8 nearby enemies, then hurls them outward for heavy damage.
       Lv7   WILL OF THE FORCE  — the ultimate: he stows his lightsaber, raises a hand and a wave of
             the Force crosses the whole screen. Every enemy it touches levitates — the weak are
             obliterated, the rest are turned to the light and fight for him for 25 s. Rivals and Titans
             resist. Anything that spawns afterwards is still hostile.
       Lv7   Grand Master Ataru bounds from foe to foe (js/saberforms.js "ataruGrand").
   ========================================================================= */
"use strict";

const FORCE_PERSUADE_LINES = {
  0:  ["You will fight with me now.", "There is still good in you.", "These aren't the enemies you're looking for."],
  78: ["Stand down — and stand with me.", "This party's over. Pick a side.", "You'll find I'm very persuasive."],
  79: ["Join me, you will.", "Fight for the light, you shall.", "Help me, you will. Mm."],
  80: ["These aren't the droids you're looking for.", "You will join me.", "Move along… with me."]
};
const FORCE_LAYDOWN_LINES = ["I'm going home.", "Thank you…", "*lays down weapon*", "Peace.", "No more war."];
const FORCE_LIFT_LINES = ["Do. Or do not.", "Luminous beings are we!", "Size matters not.", "Feel the Force flow!"];

const forceState = {
  persuadeCD: 6, liftCD: 2.5, willCD: 3, willT: -1, willX: 0, willY: 0, willR: 0, willMax: 0, willSeen: null,
  beams: [], lifts: [], crush: [], puffs: [], speechCD: 0, listStep: -1,
  total: 0, persuades: 0, liftsCast: 0, wills: 0, lastWillTurned: 0, lastWillCrushed: 0
};
const allyList = new Int16Array(MAX_E);
let allyListN = 0;
const allyTgt = new Int16Array(MAX_E).fill(-1), allyTgtUid = new Uint32Array(MAX_E), allyScanT = new Float32Array(MAX_E);

/* --- 1. WHO CAN DO WHAT ------------------------------------------------------ */
function forceAllyColor() {
  if (!player) return "#4fc3f7";
  if (player.cid === 79) return "#9cff57";
  if (player.cid === 78) return "#d580ff";
  if (player.cid === CUSTOM_CID && typeof customAllyColor === "function") return customAllyColor();
  return "#4fc3f7";
}
function forceLightUser() {
  if (!player) return false;
  const c = player.cid;
  if (c === 0 || c === 78 || c === 79) return true;
  if (c === CUSTOM_CID && typeof customForceTier === "function") return customForceTier() >= 2 && customAllegiance() === "light";
  return false;
}
function yodaSaberLvl() {
  if (!player || player.cid !== 79) return 0;
  let l = 0;
  for (const w of player.weapons) if (w && w.id === 79) l = Math.max(l, w.lvl || 1);
  return l;
}
function forceHeroSaberLvl() {
  let l = 1;
  for (const w of player.weapons) if (w && (w.id === player.cid || w.id === CUSTOM_CID)) l = Math.max(l, w.lvl || 1);
  return l;
}
function forceSdBusy() { return typeof showdownBusy === "function" && showdownBusy(); }

/* --- 2. ALLIES --------------------------------------------------------------- */
function allyEligible(j) {
  return eAct[j] !== 0 && !eDummy[j] && eType[j] < 98 && !allyIs(j) && !(eStagger[j] > 0) && !(eLevitate[j] > 0) &&
    !(eFLiftZ[j] > 0) && !(typeof sdSpect === "function" && sdSpect(j));
}
function allyConvert(j, dur, lift) {
  if (!allyEligible(j)) return false;
  allyUid[j] = eUid[j]; allyT[j] = dur; allyDur[j] = dur; allyLift[j] = lift === undefined ? 1 : lift;
  allyAtkCD[j] = 0.5 + Math.random() * 0.4; allyTgt[j] = -1; allyScanT[j] = 0;
  eMax[j] *= 2; eHP[j] = eMax[j];                              // renewed by the Force
  eStun[j] = 0; eGrapple[j] = 0; eSlow[j] = 0; eBleed[j] = 0; eFireCD[j] = 1.2;
  if (typeof eScarHeat !== "undefined") eScarHeat[j] = 0;
  allyCount++; forceState.total++;
  spawnParticles(eX[j], eY[j], 4);
  return true;
}
// the effect wears off: the ally lays down its arms and leaves the battle (half XP, never a kill)
function allyLayDown(j) {
  const x = eX[j], y = eY[j], col = forceAllyColor();
  allyUid[j] = 0; allyCount = Math.max(0, allyCount - 1);
  eAct[j] = 0; eStagger[j] = 0; eFLiftZ[j] = 0;
  spawnOrb(x, y, (3.5 + waveNum * 0.55) * 0.5);
  forceState.puffs.push({ x, y, t: 0.7, col });
  if (forceState.speechCD <= 0) {
    spawnSpeech(x, y - 12, FORCE_LAYDOWN_LINES[Math.floor(Math.random() * FORCE_LAYDOWN_LINES.length)], col, 1.2);
    forceState.speechCD = 1.6;
  }
}
// hostiles hit an ally they are brawling with
function allyTakeHit(a, i, dt) {
  if (!allyIs(a)) return;
  const base = (42 + runTime * 1.15) * (player.stg ? player.stg.hpMul : 1) * (player.diff ? player.diff.hpMul : 1);
  const k = eType[i] === 99 ? 3.5 : (eType[i] === 98 ? 2.5 : (eType[i] === 3 ? 1.3 : 1));
  eHP[a] -= base * 0.2 * k * dt;
  if (eHP[a] <= 0) {
    allyUid[a] = 0; allyCount = Math.max(0, allyCount - 1);
    killNoPayDepth++;
    try { killEnemy(a, false); } finally { killNoPayDepth = Math.max(0, killNoPayDepth - 1); }
  }
}
function allyRebuildList() {
  let n = 0;
  for (let j = 0; j < MAX_E; j++) if (allyUid[j] !== 0) { if (allyIs(j)) allyList[n++] = j; else allyUid[j] = 0; }
  allyListN = n; allyCount = n;
}
// nearest ally to hostile i within r px (or -1)
function allyNearestFor(i, r) {
  let best = -1, bd = r * r;
  const x = eX[i], y = eY[i];
  for (let k = 0; k < allyListN; k++) {
    const j = allyList[k];
    if (!allyIs(j)) continue;
    const dx = eX[j] - x, dy = eY[j] - y;
    if (dx > r || dx < -r || dy > r || dy < -r) continue;
    const d2 = dx * dx + dy * dy;
    if (d2 < bd) { bd = d2; best = j; }
  }
  return best;
}
function allyTargetOk(t) {
  return t >= 0 && eAct[t] !== 0 && !allyIs(t) && !eDummy[t] && !(eStagger[t] > 0) && !(eLevitate[t] > 0) && !(typeof sdSpect === "function" && sdSpect(t));
}
// the ally AI (called from the js/sim.js enemy loop instead of the hostile AI)
function allyEnemyStep(i, dt) {
  allyT[i] -= dt;
  if (allyT[i] <= 0 || Math.hypot(eX[i] - player.x, eY[i] - player.y) > 900) { allyLayDown(i); return; }
  if (allyLift[i] > 0) {                                        // lifted and turned: floats for a moment first
    allyLift[i] = Math.max(0, allyLift[i] - dt / 1.1);
    if (allyLift[i] > 0.3) return;
  }
  if (eStun[i] > 0) { eStun[i] = Math.max(0, eStun[i] - dt); return; }
  allyAtkCD[i] -= dt;
  const sd = forceSdBusy();
  // pick / keep a target (re-scan 4x a second)
  let t = allyTgt[i];
  if (sd) t = -1;
  else {
    if (!(allyTargetOk(t) && eUid[t] === allyTgtUid[i])) t = -1;
    allyScanT[i] -= dt;
    if (t < 0 || allyScanT[i] <= 0) {
      allyScanT[i] = 0.25;
      let best = -1, bd = 300 * 300;
      for (let j = 0; j < MAX_E; j++) {
        if (!allyTargetOk(j)) continue;
        const dx = eX[j] - eX[i], dy = eY[j] - eY[i];
        if (dx > 300 || dx < -300 || dy > 300 || dy < -300) continue;
        // prefer foes that are near the hero (protect the Jedi)
        const d2 = dx * dx + dy * dy + 0.35 * ((eX[j] - player.x) ** 2 + (eY[j] - player.y) ** 2);
        if (d2 < bd) { bd = d2; best = j; }
      }
      t = best;
    }
  }
  allyTgt[i] = t; allyTgtUid[i] = t >= 0 ? eUid[t] : 0;
  let gx, gy;
  if (t >= 0) { gx = eX[t]; gy = eY[t]; }
  else {                                                        // escort the hero on a loose ring
    const a = (eSeed[i] % 628) / 100 + runTime * 0.18;
    gx = player.x + Math.cos(a) * 62; gy = player.y + Math.sin(a) * 62;
  }
  const dx = gx - eX[i], dy = gy - eY[i], d = Math.hypot(dx, dy) || 1;
  const ranged = eType[i] === 3;
  const stopAt = t >= 0 ? (ranged ? 95 : 13) : 8;
  const spd = Math.max(78, eSpd[i] * 1.25);
  if (d > stopAt) {
    eVX[i] = dx / d * spd; eVY[i] = dy / d * spd;
    const nx = eX[i] + eVX[i] * dt, ny = eY[i] + eVY[i] * dt;
    if (typeof isPointBlockedByObstacle !== "function" || !isPointBlockedByObstacle(nx, ny, false)) { eX[i] = nx; eY[i] = ny; }
    else { eX[i] += -eVY[i] * dt * 0.6; eY[i] += eVX[i] * dt * 0.6; }
    eTurnAng[i] = Math.atan2(dy, dx);
  } else { eVX[i] = 0; eVY[i] = 0; }
  if (t < 0 || allyAtkCD[i] > 0) return;
  const base = (42 + runTime * 1.15) * (player.stg ? player.stg.hpMul : 1) * (player.diff ? player.diff.hpMul : 1);
  if (ranged && d < 240) {                                      // friendly blaster bolt (player-owned: passes through allies)
    allyAtkCD[i] = 0.85;
    const fa = Math.atan2(dy, dx);
    spawnProj(eX[i], eY[i], Math.cos(fa) * 300, Math.sin(fa) * 300, base * 0.4, 1.0, 4, 0, 4, 0, 0, -1);
  } else if (d < 21) {
    allyAtkCD[i] = 0.45;
    const dmg = base * 0.3 * (eType[t] >= 98 ? 0.8 : 1);
    eHP[t] -= dmg;
    eStun[t] = Math.max(eStun[t], 0.12);
    spawnDmg(eX[t], eY[t], dmg, false);
    if (Math.random() < 0.5) spawnParticles(eX[t], eY[t], 2);
    if (eHP[t] <= 0 && !(eStagger[t] > 0)) killEnemy(t, false);
  }
}

/* --- 3. FORCE PERSUASION ------------------------------------------------------ */
function forceGatherNear(x, y, r, onScreenOnly) {
  const out = [];
  for (let j = 0; j < MAX_E; j++) {
    if (!allyEligible(j)) continue;
    if (onScreenOnly && !isEnemyOnScreen(j)) continue;
    const d = Math.hypot(eX[j] - x, eY[j] - y);
    if (r > 0 && d > r) continue;
    out.push({ j, d });
  }
  out.sort((a, b) => a.d - b.d);
  return out;
}
function forceGesture(list, dur) {
  if (!list.length) return;
  let cx = 0, cy = 0;
  for (const o of list) { cx += eX[o.j]; cy += eY[o.j]; }
  player.forceHandTimer = Math.max(player.forceHandTimer || 0, dur);
  player.forceHandAng = Math.atan2(cy / list.length - player.y, cx / list.length - player.x);
}
// converts up to n of the given candidates; returns how many turned
function forcePersuade(cands, n, dur, line) {
  let got = 0;
  const col = forceAllyColor();
  for (let k = 0; k < cands.length && got < n; k++) {
    const j = cands[k].j;
    if (!allyConvert(j, dur, 1)) continue;
    forceState.beams.push({ j, uid: eUid[j], t: 0.5, col });
    got++;
  }
  if (got > 0) {
    forceState.persuades++;
    forceGesture(cands.slice(0, got), 0.7);
    if (line) spawnSpeech(player.x, player.y - 22, line, col, 2.0);
    if (opts.vol > 0) { sfxTone(392, 523, 0.5, "sine", 0.12, 0); sfxTone(262, 392, 0.6, "triangle", 0.07, 0); }
  }
  return got;
}
function forcePersuadeStep(dt) {
  if (!forceLightUser()) return;
  const F = forceState;
  F.persuadeCD -= dt;
  if (F.persuadeCD > 0 || F.willT >= 0 || forceSdBusy()) return;
  const cands = forceGatherNear(player.x, player.y, 170, true);
  if (cands.length < 4) { F.persuadeCD = 0.5; return; }
  const yoda = player.cid === 79, lvl = forceHeroSaberLvl();
  const n = yoda ? (lvl >= 5 ? 6 : 4) : (lvl >= 5 ? 3 : 2);
  const lines = FORCE_PERSUADE_LINES[player.cid] || FORCE_PERSUADE_LINES[80];
  const got = forcePersuade(cands, n, yoda ? 20 : 15, "FORCE PERSUADE — \"" + lines[Math.floor(Math.random() * lines.length)] + "\"");
  F.persuadeCD = got > 0 ? (yoda ? 14 : 22) * (player.cdr || 1) : 1;
}
// "Mind Trick" skill (creator) — the same effect on a button
function forceMindTrick() {
  if (!player) return 0;
  const strong = typeof customForceTier === "function" ? customForceTier() >= 2 : false;
  const cands = forceGatherNear(player.x, player.y, 210, true);
  if (!cands.length) { executeForceKineticPush(player.x, player.y, player.aim, 8, 60 * (player.might || 1)); return 0; }
  return forcePersuade(cands, strong ? 3 : 2, 12, "MIND TRICK — \"You will fight for me.\"");
}

/* --- 4. YODA: FORCE LIFT & HURL (Lv5+) ------------------------------------------- */
function yodaLiftStep(dt) {
  const F = forceState;
  for (let k = F.lifts.length - 1; k >= 0; k--) {
    const L = F.lifts[k];
    const j = L.j;
    if (!eAct[j] || eUid[j] !== L.uid) { F.lifts.splice(k, 1); continue; }
    L.t += dt;
    if (L.t < 0.55) {                                            // rise
      eFLiftZ[j] = 24 * Math.sin(Math.min(1, L.t / 0.55) * Math.PI * 0.5);
      eX[j] = L.x0 + Math.sin(L.t * 23 + k) * 0.8; eY[j] = L.y0;
      eStun[j] = Math.max(eStun[j], 0.3);
    } else if (L.t < 0.82) {                                     // hurl
      const u = (L.t - 0.55) / 0.27;
      eFLiftZ[j] = 24 * (1 - u);
      eX[j] = L.x0 + Math.cos(L.ang) * 120 * u; eY[j] = L.y0 + Math.sin(L.ang) * 120 * u;
      eStun[j] = Math.max(eStun[j], 0.3);
    } else {                                                     // impact
      eFLiftZ[j] = 0;
      const dmg = Math.max(eMax[j] * 0.75, 160 + 45 * yodaSaberLvl()) * (player.might || 1);
      eHP[j] -= dmg; eStun[j] = Math.max(eStun[j], 1.2);
      spawnDmg(eX[j], eY[j], dmg, true);
      spawnParticles(eX[j], eY[j], 6);
      if (eHP[j] <= 0) killEnemy(j, false, L.ang, "#9cff57");
      F.lifts.splice(k, 1);
    }
  }
  if (player.cid !== 79 || yodaSaberLvl() < 5) return;
  F.liftCD -= dt;
  if (F.liftCD > 0 || F.willT >= 0 || forceSdBusy() || F.lifts.length) return;
  const cands = forceGatherNear(player.x, player.y, 205, true);
  if (cands.length < 5) { F.liftCD = 0.4; return; }
  const n = Math.min(8, cands.length);
  for (let k = 0; k < n; k++) {
    const j = cands[k].j;
    F.lifts.push({ j, uid: eUid[j], t: -k * 0.04, x0: eX[j], y0: eY[j], ang: Math.atan2(eY[j] - player.y, eX[j] - player.x) });
    eFLiftZ[j] = 0.01;
  }
  F.liftCD = 10 * (player.cdr || 1); F.liftsCast++;
  forceGesture(cands.slice(0, n), 0.9);
  spawnSpeech(player.x, player.y - 22, "FORCE LIFT! \"" + FORCE_LIFT_LINES[Math.floor(Math.random() * FORCE_LIFT_LINES.length)] + "\"", "#9cff57", 1.8);
  if (typeof fxShake === "function") fxShake(2.5, 0.3);
  if (opts.vol > 0) { sfxTone(98, 196, 0.6, "sine", 0.16, 0); sfxTone(147, 294, 0.6, "triangle", 0.08, 0); }
}

/* --- 5. YODA: WILL OF THE FORCE (Lv7 ultimate) ------------------------------------ */
function yodaWillStep(dt) {
  const F = forceState;
  if (F.willT >= 0) {
    F.willT += dt;
    player.saberStowT = Math.max(player.saberStowT || 0, 0.3);
    player.forceHandTimer = Math.max(player.forceHandTimer || 0, 0.3); player.forceHandAng = -Math.PI / 2;
    if (F.willT >= 0.45) {
      F.willR = Math.min(F.willMax, (F.willT - 0.45) / 0.9 * F.willMax);
      for (let j = 0; j < MAX_E; j++) {
        if (!eAct[j] || eDummy[j] || allyIs(j) || F.willSeen.has(eUid[j])) continue;
        const d = Math.hypot(eX[j] - F.willX, eY[j] - F.willY);
        if (d > F.willR || !isEnemyOnScreen(j)) continue;
        F.willSeen.add(eUid[j]);
        if (eType[j] >= 98) {                                     // Titans & rivals resist the light
          eStun[j] = Math.max(eStun[j], 1.6);
          spawnSpeech(eX[j], eY[j] - 18, "RESISTS!", "#ff5252", 1.2);
          continue;
        }
        if (typeof sdSpect === "function" && sdSpect(j)) continue;
        if (eStagger[j] > 0) continue;                            // a waiting EXECUTE target stays yours to finish
        if (eHP[j] < eMax[j] * 0.3) {                             // the weak are obliterated
          F.crush.push({ j, uid: eUid[j], t: 0 }); eFLiftZ[j] = 0.01; F.lastWillCrushed++;
        } else if (allyConvert(j, 25, 1)) {
          F.lastWillTurned++;
        }
      }
    }
    if (F.willT >= 1.6) {
      F.willT = -1; F.willCD = 45 * (player.cdr || 1); F.wills++;
      player.saberStowT = 0.25;
      if (typeof fxBanner === "function") fxBanner(F.lastWillTurned + " TURNED TO THE LIGHT", F.lastWillCrushed ? F.lastWillCrushed + " obliterated" : "They fight for Yoda now", "#9cff57", 1.8, false, "will");
    }
    return;
  }
  if (player.cid !== 79 || yodaSaberLvl() < 7) return;
  F.willCD -= dt;
  if (F.willCD > 0 || forceSdBusy()) return;
  let n = 0;
  for (let j = 0; j < MAX_E; j++) if (allyEligible(j) && isEnemyOnScreen(j)) n++;
  if (n < 8) { F.willCD = 0.5; return; }
  F.willT = 0; F.willX = player.x; F.willY = player.y; F.willR = 0; F.willSeen = new Set(); F.lastWillTurned = 0; F.lastWillCrushed = 0;
  F.willMax = Math.hypot(W, H) * 0.5 / Math.max(0.3, opts.zoom || 1) + 30;
  player.saberStowT = 2.0; player.invulnT = Math.max(player.invulnT || 0, 1.8);
  spawnSpeech(player.x, player.y - 26, "\"Size matters not.\"", "#9cff57", 2.4);
  if (typeof fxBanner === "function") fxBanner("WILL OF THE FORCE", "Yoda stows his blade… and the battlefield rises", "#9cff57", 2.2, true, "will");
  if (typeof fxSlowMo === "function") fxSlowMo(0.5, 1.3);
  if (typeof fxShake === "function") fxShake(4, 0.9);
  if (opts.vol > 0) { sfxTone(65, 131, 1.4, "sine", 0.2, 0); sfxTone(196, 392, 1.2, "triangle", 0.08, 0); setTimeout(() => sfxTone(262, 523, 0.9, "sine", 0.1, 0), 450); }
}
function forceCrushStep(dt) {
  const F = forceState;
  for (let k = F.crush.length - 1; k >= 0; k--) {
    const C = F.crush[k], j = C.j;
    if (!eAct[j] || eUid[j] !== C.uid) { F.crush.splice(k, 1); continue; }
    C.t += dt;
    eStun[j] = Math.max(eStun[j], 0.3);
    eFLiftZ[j] = 30 * Math.min(1, C.t / 0.6);
    if (C.t >= 0.75) {
      eFLiftZ[j] = 0;
      spawnParticles(eX[j], eY[j], 8);
      killEnemy(j, false, Math.random() * Math.PI, "#9cff57");
      F.crush.splice(k, 1);
    }
  }
}

/* --- 6. STEP / RENDER / RESET -------------------------------------------------------- */
function forceStep(simDt) {
  if (!player || !runActive) return;
  const F = forceState;
  if (F.speechCD > 0) F.speechCD -= simDt;
  if ((player.saberStowT || 0) > 0) player.saberStowT = Math.max(0, player.saberStowT - simDt);
  allyRebuildList();
  if (!player.noSpawns || player.forceTest) {
    forcePersuadeStep(simDt);
    yodaWillStep(simDt);
    yodaLiftStep(simDt);
  }
  forceCrushStep(simDt);
  for (let k = F.beams.length - 1; k >= 0; k--) { F.beams[k].t -= simDt; if (F.beams[k].t <= 0) F.beams.splice(k, 1); }
  for (let k = F.puffs.length - 1; k >= 0; k--) { F.puffs[k].t -= simDt; if (F.puffs[k].t <= 0) F.puffs.splice(k, 1); }
}
function forceRenderWorld(c) {
  if (!player) return;
  const F = forceState, now = performance.now() / 1000;
  c.save();
  // persuasion beams: from the hero's hand to each converted enemy
  for (const b of F.beams) {
    if (!eAct[b.j] || eUid[b.j] !== b.uid) continue;
    const hx = player.x + Math.cos(player.forceHandAng || 0) * 10, hy = player.y - 4 + Math.sin(player.forceHandAng || 0) * 10;
    c.globalAlpha = Math.min(1, b.t / 0.25) * 0.75; c.strokeStyle = b.col; c.lineWidth = 2;
    c.setLineDash([3, 4]); c.lineDashOffset = -now * 40;
    c.beginPath(); c.moveTo(hx, hy); c.lineTo(eX[b.j], eY[b.j] - 8); c.stroke();
  }
  c.setLineDash([]);
  // Force Lift: shimmering columns under lifted foes
  for (const L of F.lifts.concat(F.crush)) {
    const j = L.j; if (!eAct[j] || eUid[j] !== L.uid) continue;
    c.globalAlpha = 0.55; c.strokeStyle = "#9cff57"; c.lineWidth = 1.4;
    c.beginPath(); c.ellipse(eX[j], eY[j] + 9, 11, 4, 0, 0, Math.PI * 2); c.stroke();
    c.globalAlpha = 0.25; c.beginPath(); c.moveTo(eX[j], eY[j] + 9); c.lineTo(eX[j], eY[j] - eFLiftZ[j]); c.stroke();
  }
  // Will of the Force: the wave
  if (F.willT >= 0) {
    if (F.willT < 0.45) {                                        // gathering at the raised hand
      const k = F.willT / 0.45;
      c.globalAlpha = 0.5 + 0.5 * k; c.fillStyle = "#9cff57";
      c.beginPath(); c.arc(player.x + 2, player.y - 20, 2 + k * 6, 0, Math.PI * 2); c.fill();
      c.strokeStyle = "#ccff90"; c.lineWidth = 1.2; c.globalAlpha = 0.6 * k;
      for (let n = 0; n < 6; n++) { const a = n * 1.047 + now * 3; c.beginPath(); c.moveTo(player.x + 2 + Math.cos(a) * 26 * (1 - k), player.y - 20 + Math.sin(a) * 26 * (1 - k)); c.lineTo(player.x + 2, player.y - 20); c.stroke(); }
    } else {
      const r = F.willR;
      c.globalAlpha = Math.max(0, 0.85 - F.willT * 0.35); c.strokeStyle = "#ccff90"; c.lineWidth = 5;
      c.beginPath(); c.arc(F.willX, F.willY, r, 0, Math.PI * 2); c.stroke();
      c.globalAlpha *= 0.5; c.lineWidth = 14; c.strokeStyle = "#76ff03";
      c.beginPath(); c.arc(F.willX, F.willY, Math.max(1, r - 9), 0, Math.PI * 2); c.stroke();
      const g = c.createRadialGradient(F.willX, F.willY, Math.max(1, r * 0.6), F.willX, F.willY, Math.max(2, r));
      g.addColorStop(0, "rgba(118,255,3,0)"); g.addColorStop(1, "rgba(156,255,87,0.16)");
      c.globalAlpha = 1; c.fillStyle = g; c.beginPath(); c.arc(F.willX, F.willY, Math.max(2, r), 0, Math.PI * 2); c.fill();
    }
  }
  // laid-down allies: a soft fade of light
  for (const p of F.puffs) {
    c.globalAlpha = p.t / 0.7 * 0.6; c.strokeStyle = p.col; c.lineWidth = 1.5;
    c.beginPath(); c.arc(p.x, p.y, 6 + (0.7 - p.t) * 30, 0, Math.PI * 2); c.stroke();
  }
  c.restore();
}
// ally look (called by js/render.js before the enemy body is drawn)
function drawAllyAura(c, i, ex, ey, baseR) {
  const col = forceAllyColor(), t = performance.now() / 1000;
  c.save();
  c.globalAlpha = 0.5 + 0.2 * Math.sin(t * 5 + i);
  c.strokeStyle = col; c.lineWidth = 1.6;
  c.beginPath(); c.ellipse(eX[i], eY[i] + baseR * 0.85, baseR + 3, (baseR + 3) * 0.38, 0, 0, Math.PI * 2); c.stroke();
  c.globalAlpha = 0.85; c.lineWidth = 1.2;
  c.beginPath(); c.ellipse(ex, ey - baseR * 1.38, baseR * 0.5, baseR * 0.17, 0, 0, Math.PI * 2); c.stroke();
  if (allyLift[i] > 0) {
    c.globalAlpha = allyLift[i] * 0.6; c.fillStyle = col;
    c.beginPath(); c.arc(ex, ey, baseR + 6, 0, Math.PI * 2); c.fill();
  }
  c.restore();
}
function allyLiftOffset(i) { return allyLift[i] > 0 ? Math.sin((1 - allyLift[i]) * Math.PI) * 15 : 0; }

function forceReset() {
  const F = forceState;
  F.persuadeCD = 6; F.liftCD = 2.5; F.willCD = 3; F.willT = -1; F.willSeen = null;
  F.beams.length = 0; F.lifts.length = 0; F.crush.length = 0; F.puffs.length = 0; F.speechCD = 0;
  F.total = 0; F.persuades = 0; F.liftsCast = 0; F.wills = 0;
  allyUid.fill(0); allyCount = 0; allyListN = 0; eFLiftZ.fill(0);
  if (player) player.saberStowT = 0;
}
V10.onRunStart.push(function forceRunStart() { forceReset(); });
V10.onRunReset.push(function forceRunReset() { forceReset(); });
V10.onStep.push(forceStep);
V10.onRenderWorld.push(forceRenderWorld);
// EOF:js/force.js
