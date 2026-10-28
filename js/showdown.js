// FILE: js/showdown.js
// PART: v12 module 1 of 2
// DETAIL: v12 Rival Showdown ("Get 'Em Space!", spec v9.0 §3.1, finally built). When a Rival (one of the heroes you did
//         NOT pick) arrives to hunt you, the fight stops being a brawl and becomes a duel:
//           1. ARRIVE    - the rival is announced; every regular enemy slowly backs away into a wide spectator ring
//                          around you and the rival (evenly spaced, two rows, the ring follows the fight).
//           2. CHALLENGE - one reckless grunt breaks from the crowd and charges the rival ("THIS BOUNTY IS MINE!").
//           3. FINISHER  - the rival destroys it with an instant signature finisher in its own style (saber bisect,
//                          point-blank shot, arcane disintegration, spine-rip, rip & tear, limb tear) as its opening
//                          statement - slow-mo, hit-stop, the crowd gasps - then turns to you.
//           4. DUEL      - it's you vs. the rival. The crowd watches and cheers, never attacks, and is ignored by your
//                          auto-aim, blades, squad and spells (stray shots can still hit them). New arrivals join the ring.
//           5. RELEASE   - when the rival falls the crowd is SHAKEN (some freeze, some flee) and the brawl resumes.
//         Boss and second-rival spawns wait until the duel is over; regular spawns slow to 35 %. Rewind-safe (the duel
//         ends by itself if the rival no longer exists) and capped at 90 s.

"use strict";

const SD_IDLE = 0, SD_ARRIVE = 1, SD_CHALLENGE = 2, SD_FINISH = 3, SD_DUEL = 4;
const SD_PHASE_NAMES = ["idle", "arrive", "challenge", "finisher", "duel"];
const sdSpectUid = new Uint32Array(MAX_E);    // eUid of the spectator in enemy slot j (0 = not a spectator)
const sdSlotA = new Float32Array(MAX_E);       // assigned ring angle
const sdSlotR = new Float32Array(MAX_E);       // assigned ring row offset (px)
const showdown = {
  phase: SD_IDLE, t: 0, total: 0, ri: -1, rUid: 0, rCid: -1, style: "gun", col: "#ff5252", hp0: 0,
  cx: 0, cy: 0, R: 200, ch: -1, chUid: 0, faceAng: null, lungeX0: 0, lungeY0: 0, fin: null,
  nSpect: 0, scanT: 0, cheerT: 1.6, count: 0, finishers: 0, lastReason: "", spawnedChallenger: false
};
const SD_CHALLENGE_LINES = ["THIS BOUNTY IS MINE!", "OUTTA MY WAY, I'LL TAKE 'EM!", "YOU'RE NOTHING!", "FOR THE BOSS!", "I GOT THIS ONE!"];
const SD_FINISH_LINES = {
  saber: ["You are not worthy.", "Stay out of this.", "Pathetic."],
  gun: ["Next.", "Wrong fight, friend.", "Stay down."],
  arcane: ["Begone.", "Dust.", "Know your place."],
  beast: ["RRRAAARGH!", "MINE!", "WEAK!"],
  spine: ["...trophy.", "*clicking*", "Not prey. Pest."],
  doom: ["RIP. AND. TEAR.", "Too slow.", "Next."]
};
const SD_CHEERS = ["FIGHT!", "GET 'EM!", "FINISH HIM!", "OOOH!", "AGAIN!", "THAT'S GOTTA HURT!", "DON'T STOP!", "SHOWDOWN!"];

/* === 1. QUERIES (used by targeting code all over the engine) === */
function showdownBusy() { return showdown.phase !== SD_IDLE; }
// v13: true while anything (showdown crowd OR Force-persuaded allies) must be filtered out of targeting
function targetFilterOn() { return showdown.phase !== SD_IDLE || allyCount > 0; }
function sdSpect(j) { return showdown.phase !== SD_IDLE && sdSpectUid[j] !== 0 && sdSpectUid[j] === eUid[j] && eAct[j] === 1; }
// true = auto-aim / blades / squad / spells must leave this enemy alone right now
function sdIgnore(j) {
  if (allyCount > 0 && allyIs(j)) return true;                                                 // v13: a Force-persuaded ally
  if (showdown.phase === SD_IDLE) return false;
  if (sdSpectUid[j] !== 0 && sdSpectUid[j] === eUid[j]) return true;                          // spectator
  if (j === showdown.ch && eUid[j] === showdown.chUid) return true;                            // the doomed challenger
  if (j === showdown.ri && eUid[j] === showdown.rUid && showdown.phase < SD_DUEL) return true; // rival during its entrance
  return false;
}
function showdownFaceAng(i) { return (showdown.phase !== SD_IDLE && i === showdown.ri && showdown.faceAng !== null) ? showdown.faceAng : null; }
function sdCheerBob(i) { return sdSpect(i) ? Math.abs(Math.sin(runTime * 7 + i * 1.7)) * 1.8 : 0; }
function sdRivalAlive() { const i = showdown.ri; return i >= 0 && eAct[i] === 1 && eUid[i] === showdown.rUid; }

// rival finisher style from its hero (mirrors the player's glory-kill styles)
function sdStyleFor(cid) {
  if (typeof gloryStyleForCid === "function") return gloryStyleForCid(cid, false);
  return "gun";
}

/* === 2. START === */
function showdownBegin(ri) {
  const S = showdown;
  if (!player || ri < 0 || !eAct[ri] || eType[ri] !== 98) return false;
  if (S.phase !== SD_IDLE) return false;
  for (let j = 0; j < MAX_E; j++) if (eAct[j] && eType[j] === 99) return false;   // a Titan is loose: no ceremony
  const rCid = eRivalCid[ri];
  S.phase = SD_ARRIVE; S.t = 0; S.total = 0; S.ri = ri; S.rUid = eUid[ri]; S.rCid = rCid;
  S.style = sdStyleFor(rCid);
  S.col = (typeof getWeaponColor === "function" && rCid >= 0) ? getWeaponColor(rCid) : "#ff5252";
  if (!S.col || S.col === "#212121") S.col = "#ff5252";
  S.hp0 = eHP[ri]; S.ch = -1; S.chUid = 0; S.faceAng = null; S.fin = null; S.cheerT = 1.4; S.scanT = 0; S.count++;
  S.spawnedChallenger = false;
  const viewMin = Math.min(W, H) / Math.max(0.5, opts.zoom || 1);
  S.R = Math.max(150, Math.min(260, viewMin * 0.42));
  S.cx = player.x + (eX[ri] - player.x) * 0.3; S.cy = player.y + (eY[ri] - player.y) * 0.3;
  sdSpectUid.fill(0);
  sdFlagNewSpectators(true);
  const name = (CHAR_RAW[rCid] ? CHAR_RAW[rCid][3] : "RIVAL").toUpperCase();
  const fac = (CHAR_RAW[rCid] && FACTIONS[CHAR_RAW[rCid][1]]) ? FACTIONS[CHAR_RAW[rCid][1]].name : "";
  if (typeof fxBanner === "function") fxBanner("⚔ RIVAL SHOWDOWN", name + (fac ? " · " + fac : ""), "#ff5252", 2.4, true, "showdown");
  if (typeof fxFocus === "function") fxFocus(eX[ri], eY[ri], 1.12, 1.0);
  sfx(70, 140, 0.6, "sawtooth", 0.3);
  return true;
}

/* === 3. CROWD RING === */
function sdEligibleSpectator(j) {
  return eAct[j] && !eDummy[j] && eType[j] < 98 && !(typeof eLevitate !== "undefined" && eLevitate[j] > 0) && j !== showdown.ch && !allyIs(j);
}
// flag every regular enemy (or just the newcomers) as a spectator. Each keeps the side of the ring it was standing on
// (it backs straight away from the fight); crowded sides stack into deeper rows.
function sdFlagNewSpectators(force) {
  const S = showdown;
  let added = 0;
  for (let j = 0; j < MAX_E; j++) {
    if (!sdEligibleSpectator(j)) continue;
    if (sdSpectUid[j] === eUid[j] && sdSpectUid[j] !== 0) continue;
    sdSpectUid[j] = eUid[j]; added++;
    sdSlotA[j] = Math.atan2(eY[j] - S.cy, eX[j] - S.cx) + ((eSeed[j] % 13) - 6) * 0.01;
  }
  if (added || force) sdAssignSlots();
}
function sdAssignSlots() {
  const S = showdown, binW = 30 / Math.max(120, S.R), nBins = Math.ceil(Math.PI * 2 / binW);
  const fill = new Uint16Array(nBins + 1), list = [];
  for (let j = 0; j < MAX_E; j++) if (sdSpect(j)) list.push(j);
  S.nSpect = list.length;
  list.sort((a, b) => eUid[a] - eUid[b]);                              // stable rows: first come, front row
  for (const j of list) {
    let a = sdSlotA[j] % (Math.PI * 2); if (a < 0) a += Math.PI * 2;
    const bin = Math.min(nBins, Math.floor(a / binW)), row = fill[bin]++;
    sdSlotR[j] = row * 17 + ((eSeed[j] % 5) - 2);
    if (row & 1) sdSlotA[j] = (bin + 0.5) * binW + ((eSeed[j] % 7) - 3) * 0.004;   // stagger the second row
  }
}

/* === 4. PER-ENEMY CONTROL (called from the js/sim.js enemy loop; true = handled this step) === */
function showdownEnemyStep(i, simDt) {
  const S = showdown;
  if (S.phase === SD_IDLE) return false;
  if (i === S.ri && eUid[i] === S.rUid) return sdRivalStep(i, simDt);
  if (i === S.ch && eUid[i] === S.chUid) return sdChallengerStep(i, simDt);
  if (!sdSpect(i)) return false;
  const a = sdSlotA[i], R = S.R + sdSlotR[i];
  const tx = S.cx + Math.cos(a) * R, ty = S.cy + Math.sin(a) * R;
  const dx = tx - eX[i], dy = ty - eY[i], d = Math.hypot(dx, dy);
  const dP = Math.hypot(eX[i] - player.x, eY[i] - player.y);
  // far-away grunts jog in to watch; close ones back up slowly ("give 'em space"), faster if you walk at them
  let spd = d > 150 ? eSpd[i] * 0.95 : Math.min(eSpd[i], 58);
  if (dP < S.R * 0.7) spd = Math.max(spd, 92);
  if (d > 1.5) {
    const step = Math.min(d, spd * simDt);
    eX[i] += dx / d * step; eY[i] += dy / d * step;
    eVX[i] = dx / d * spd; eVY[i] = dy / d * spd;
  } else { eVX[i] = 0; eVY[i] = 0; }
  eTurnAng[i] = Math.atan2(S.cy - eY[i], S.cx - eX[i]);          // face the fight
  return true;
}

function sdRivalStep(i, simDt) {
  const S = showdown;
  if (S.phase >= SD_DUEL) { S.faceAng = null; return false; }      // the duel: normal rival AI
  if (eHP[i] < S.hp0) eHP[i] = S.hp0;                               // untouchable during its entrance
  if (S.phase === SD_ARRIVE) {                                      // stride into view, stop ~125 px from you
    const dx = player.x - eX[i], dy = player.y - eY[i], d = Math.hypot(dx, dy);
    S.faceAng = Math.atan2(dy, dx);
    if (d > 125) {
      const v = Math.min(170, Math.max(eSpd[i] * 0.6, (d - 125) / Math.max(0.25, 1.1 - S.t)));
      const sp = Math.min(d - 125, v * simDt);
      eX[i] += dx / d * sp; eY[i] += dy / d * sp; eVX[i] = dx / d * v; eVY[i] = dy / d * v;
    } else { eVX[i] = 0; eVY[i] = 0; }
    return true;
  }
  if (S.phase === SD_CHALLENGE) {                                   // stand and turn to the challenger
    if (S.ch >= 0 && eAct[S.ch] && eUid[S.ch] === S.chUid) S.faceAng = Math.atan2(eY[S.ch] - eY[i], eX[S.ch] - eX[i]);
    eVX[i] = 0; eVY[i] = 0;
    return true;
  }
  if (S.phase === SD_FINISH) {                                      // the lunge (melee styles) or the shot
    const F = S.fin;
    if (F && F.melee && S.t < 0.14) {
      const k = SF_EASE_OUT(Math.min(1, S.t / 0.12));
      eX[i] = F.rx0 + (F.tx - F.rx0) * k; eY[i] = F.ry0 + (F.ty - F.ry0) * k;
    }
    if (F && F.style === "saber") S.faceAng = F.ang + (Math.min(1, S.t / 0.12) * 2.2 - 1.1);   // the blade sweeps through
    return true;
  }
  return true;
}
function SF_EASE_OUT(t) { return 1 - (1 - t) * (1 - t); }

function sdChallengerStep(i, simDt) {
  const S = showdown;
  if (!sdRivalAlive()) return false;
  const ri = S.ri, dx = eX[ri] - eX[i], dy = eY[ri] - eY[i], d = Math.hypot(dx, dy);
  if (S.phase === SD_CHALLENGE) {
    const sp = Math.max(95, eSpd[i] * 1.7);
    if (d > 4) { eX[i] += dx / d * sp * simDt; eY[i] += dy / d * sp * simDt; eVX[i] = dx / d * sp; eVY[i] = dy / d * sp; }
    const reach = S.style === "gun" || S.style === "arcane" ? 95 : 30;
    if (d < reach || S.t > 1.5) sdStartFinisher();
  }
  return true;   // never attacks the player
}

/* === 5. CHALLENGER + FINISHER === */
function sdPickChallenger() {
  const S = showdown, ri = S.ri;
  let best = -1, bd = 1e9;
  for (let j = 0; j < MAX_E; j++) {
    if (!sdSpect(j) || eType[j] === 3 || eFormType[j] === 1) continue;    // a regular grunt, not a heavy / shield leader
    const d = Math.hypot(eX[j] - eX[ri], eY[j] - eY[ri]);
    if (d > 520) continue;
    // prefer an on-screen grunt on your side of the rival, so the execution happens where you can see it
    const s = d + 0.6 * Math.hypot(eX[j] - player.x, eY[j] - player.y) + (isEnemyOnScreen(j) ? 0 : 400);
    if (s < bd) { bd = s; best = j; }
  }
  if (best < 0) {                                                            // nobody around: one rushes in from the edge
    const a = Math.atan2(eY[ri] - player.y, eX[ri] - player.x) + (Math.random() < 0.5 ? 1 : -1) * 0.9;
    best = allocEnemySlot(eX[ri] + Math.cos(a) * 150, eY[ri] + Math.sin(a) * 150, 0, 1.0, 0, -1);
    S.spawnedChallenger = best >= 0;
  }
  if (best < 0) return false;
  sdSpectUid[best] = 0;
  S.ch = best; S.chUid = eUid[best];
  spawnSpeech(eX[best], eY[best] - 8, SD_CHALLENGE_LINES[Math.floor(Math.random() * SD_CHALLENGE_LINES.length)], "#ffab91", 1.6);
  return true;
}

function sdStartFinisher() {
  const S = showdown, ri = S.ri, ch = S.ch;
  if (S.phase !== SD_CHALLENGE || !(ch >= 0 && eAct[ch] && eUid[ch] === S.chUid)) return;
  const ang = Math.atan2(eY[ch] - eY[ri], eX[ch] - eX[ri]);
  const melee = !(S.style === "gun" || S.style === "arcane");
  S.fin = { style: S.style, ang, melee, rx0: eX[ri], ry0: eY[ri], tx: eX[ch] - Math.cos(ang) * 14, ty: eY[ch] - Math.sin(ang) * 14,
            x0: eX[ri], y0: eY[ri], x1: eX[ch], y1: eY[ch], hit: false, t: 0 };
  S.phase = SD_FINISH; S.t = 0;
  eStun[ch] = 1;                                   // frozen in place for the blow
  if (typeof fxSlowMo === "function") { fxSlowMo(0.25, 0.6); fxFocus(eX[ch], eY[ch], 1.22, 0.65); }
}

function sdImpact() {
  const S = showdown, ch = S.ch, F = S.fin;
  if (!(ch >= 0 && eAct[ch] && eUid[ch] === S.chUid)) return;
  const ex = eX[ch], ey = eY[ch], col = S.col;
  F.x1 = ex; F.y1 = ey; F.hit = true; F.t = 0;
  if (typeof killNoPayDepth !== "undefined") killNoPayDepth++;
  try {
    if (S.style === "saber" || S.style === "doom") {
      killEnemy(ch, false, F.ang + Math.PI / 2 + (Math.random() - 0.5) * 0.5, S.style === "doom" ? "#ff1744" : col);
    } else if (S.style === "spine") {
      killEnemy(ch, true, null);
    } else if (S.style === "beast") {
      spawnGroundLimb(ex + 9, ey - 2, enemyCol2(), 1); spawnGroundLimb(ex - 9, ey + 2, enemyCol2(), 1);
      killEnemy(ch, false, null);
    } else if (S.style === "arcane") {
      for (let k = 0; k < (opts.lowPart ? 8 : 24); k++) {
        const a = Math.random() * Math.PI * 2, sp = 40 + Math.random() * 120;
        spawnPt(ex, ey, Math.cos(a) * sp, Math.sin(a) * sp, 0.4 + Math.random() * 0.4, 2.5, k & 1 ? 11 : 9, 4);
      }
      killEnemy(ch, false, null);
    } else {
      for (let k = 0; k < 6; k++) spawnPt(ex + Math.cos(F.ang) * 6, ey + Math.sin(F.ang) * 6, Math.cos(F.ang) * 70 + (Math.random() - 0.5) * 40, Math.sin(F.ang) * 70 + (Math.random() - 0.5) * 40, 0.1, 3.2, 2, 0);
      killEnemy(ch, true, null);
    }
  } finally {
    if (typeof killNoPayDepth !== "undefined") killNoPayDepth = Math.max(0, killNoPayDepth - 1);
  }
  S.finishers++;
  spawnBlastWave(ex, ey, 40, col);
  if (typeof fxHitStop === "function") { fxHitStop(0.07); fxShake(5, 0.3); }
  sfx(90, 40, 0.3, "sawtooth", 0.3);
  const lines = SD_FINISH_LINES[S.style] || SD_FINISH_LINES.gun;
  spawnSpeech(eX[S.ri], eY[S.ri] - 12, lines[Math.floor(Math.random() * lines.length)], "#ff8a80", 1.6);
  sdCrowdShout(2, ["OOOOH!", "WHOA!", "DAMN!", "NO WAY!"]);
}

function sdCrowdShout(n, pool) {
  const S = showdown;
  if (!S.nSpect) return;
  for (let k = 0; k < n; k++) {
    for (let tries = 0; tries < 12; tries++) {
      const j = Math.floor(Math.random() * MAX_E);
      if (sdSpect(j) && Math.hypot(eX[j] - player.x, eY[j] - player.y) < 360) {
        spawnSpeech(eX[j], eY[j] - 6, pool[Math.floor(Math.random() * pool.length)], "#ffe0b2", 1.1);
        break;
      }
    }
  }
}

/* === 6. MAIN STEP (V10.onStep) === */
function showdownStep(simDt) {
  const S = showdown;
  if (S.phase === SD_IDLE || !player) return;
  S.t += simDt; S.total += simDt;
  if (!sdRivalAlive()) { showdownEnd(S.phase >= SD_DUEL ? "rival down" : "rival lost"); return; }
  if (S.total > 90) { showdownEnd("timeout"); return; }
  const ri = S.ri;
  // the ring follows the fight: centred a little toward the rival, always wide enough to hold both duelists
  const tcx = player.x + (eX[ri] - player.x) * 0.3, tcy = player.y + (eY[ri] - player.y) * 0.3, k = Math.min(1, simDt * 1.6);
  S.cx += (tcx - S.cx) * k; S.cy += (tcy - S.cy) * k;
  const need = Math.hypot(player.x - eX[ri], player.y - eY[ri]) * 0.7 + 75;
  const viewMin = Math.min(W, H) / Math.max(0.5, opts.zoom || 1);
  const base = Math.max(150, Math.min(260, viewMin * 0.42));
  S.R += (Math.max(base, Math.min(330, need)) - S.R) * k;
  S.scanT -= simDt;
  if (S.scanT <= 0) { S.scanT = 0.3; sdFlagNewSpectators(false); }

  if (S.phase === SD_ARRIVE && S.t > 1.15) {
    S.phase = SD_CHALLENGE; S.t = 0;
    if (!sdPickChallenger()) { S.phase = SD_DUEL; S.t = 0; sdDuelStart(); }
  } else if (S.phase === SD_CHALLENGE) {
    if (!(S.ch >= 0 && eAct[S.ch] && eUid[S.ch] === S.chUid)) { S.phase = SD_DUEL; S.t = 0; sdDuelStart(); }   // killed by a stray shot
  } else if (S.phase === SD_FINISH) {
    if (!S.fin.hit && S.t >= 0.12) sdImpact();
    if (S.fin) S.fin.t += simDt;
    if (S.t > 0.55) { S.phase = SD_DUEL; S.t = 0; sdDuelStart(); }
  } else if (S.phase === SD_DUEL) {
    S.cheerT -= simDt;
    if (S.cheerT <= 0) { S.cheerT = 1.5 + Math.random() * 1.3; sdCrowdShout(1, SD_CHEERS); }
  }
}

function sdDuelStart() {
  const S = showdown;
  S.faceAng = null; S.ch = -1; S.chUid = 0;
  if (sdRivalAlive()) {
    eFireCD[S.ri] = 0.6;
    spawnSpeech(eX[S.ri], eY[S.ri] - 14, "Now... YOU.", "#ff5252", 1.5);
  }
  if (typeof fxBanner === "function") fxBanner("DUEL!", "the crowd gives you space — finish the rival", "#ffd166", 1.6, false, "showdown");
}

/* === 7. END === */
function showdownEnd(reason) {
  const S = showdown;
  if (S.phase === SD_IDLE) return;
  const won = reason === "rival down";
  S.lastReason = reason;
  if (won && player) {
    // the crowd is SHAKEN: some freeze, the rest scatter for a moment before the brawl resumes
    let n = 0;
    for (let j = 0; j < MAX_E; j++) {
      if (!sdSpect(j)) continue;
      const d = Math.hypot(eX[j] - player.x, eY[j] - player.y);
      if (d < 420 && (eSeed[j] & 1)) { eStun[j] = Math.max(eStun[j], 0.9 + (eSeed[j] % 5) * 0.12); if (n++ < 3) spawnSpeech(eX[j], eY[j] - 6, "SHAKEN!", "#90caf9", 0.9); }
    }
    if (typeof fxBanner === "function") fxBanner("RIVAL DEFEATED", "the crowd is shaken", "#ffd166", 1.8, true, "showdown");
  }
  S.phase = SD_IDLE; S.t = 0; S.ri = -1; S.rUid = 0; S.ch = -1; S.chUid = 0; S.faceAng = null; S.fin = null; S.nSpect = 0;
  sdSpectUid.fill(0);
}
function showdownReset() { showdown.phase = SD_IDLE; showdown.count = 0; showdown.finishers = 0; showdown.ri = -1; showdown.rUid = 0; showdown.ch = -1; showdown.faceAng = null; showdown.fin = null; sdSpectUid.fill(0); }

/* === 8. RENDER (world space): arena ring + finisher strike === */
function showdownRenderWorld(c) {
  const S = showdown;
  if (S.phase === SD_IDLE || !player) return;
  const a0 = Math.min(1, S.total / 0.8);
  c.save();
  c.globalAlpha = 0.22 * a0;
  c.strokeStyle = S.col; c.lineWidth = 2;
  c.setLineDash([7, 9]); c.lineDashOffset = -runTime * 12;
  c.beginPath(); c.arc(S.cx, S.cy, S.R - 22, 0, Math.PI * 2); c.stroke();
  c.setLineDash([]);
  c.globalAlpha = 0.08 * a0; c.lineWidth = 16;
  c.beginPath(); c.arc(S.cx, S.cy, S.R - 22, 0, Math.PI * 2); c.stroke();
  c.restore();
  const F = S.fin;
  if (F && F.hit && F.t < 0.22) {
    const k = 1 - F.t / 0.22;
    c.save(); c.globalAlpha = k;
    if (F.style === "gun" || F.style === "arcane") {
      c.strokeStyle = F.style === "arcane" ? "#e040fb" : "#fff59d"; c.lineWidth = F.style === "arcane" ? 3.5 : 1.6;
      c.beginPath(); c.moveTo(F.x0, F.y0); c.lineTo(F.x1, F.y1); c.stroke();
    } else if (F.style === "beast") {
      c.strokeStyle = "#ff9100"; c.lineWidth = 1.5;
      for (let m = -1; m <= 1; m++) { c.beginPath(); c.moveTo(F.x1 - 8, F.y1 - 8 + m * 4); c.lineTo(F.x1 + 8, F.y1 + 6 + m * 4); c.stroke(); }
    } else {
      c.strokeStyle = "#ffffff"; c.lineWidth = 3;
      c.beginPath(); c.arc(F.x1 - Math.cos(F.ang) * 14, F.y1 - Math.sin(F.ang) * 14, 20, F.ang - 1.1, F.ang + 1.1); c.stroke();
      c.strokeStyle = S.col; c.lineWidth = 6; c.globalAlpha = k * 0.35; c.stroke();
    }
    c.restore();
  }
}

V10.onRunStart.push(function showdownRunStart() { showdownReset(); });
V10.onRunReset.push(function showdownRunReset() { showdownReset(); });
V10.onStep.push(showdownStep);
V10.onRenderWorld.push(showdownRenderWorld);
// EOF:js/showdown.js
