// FILE: js/arsenal.js
// PART: v10 module 3 of 8
// DETAIL: v9.01 Mandalorian (#1) rework — Whistling Birds active Skill 1 (120 s): a vambrace swarm of looping, homing
//         micro-munitions that wipes every non-boss enemy on screen (Titans & Rivals take heavy damage instead), each
//         dart leaving a fiery mini-trail. (The IB-94 Beskar heavy pistol primary lives in combat.js / render.js.)

"use strict";

const BIRD_MAX = 72;
const whistlingBirds = [];
let birdPopT = 0;

function castWhistlingBirds(u) {
  if (!player) return;
  const targets = [];
  for (let i = 0; i < MAX_E; i++) if (eAct[i] && !eDummy[i] && isEnemyOnScreen(i) && !(typeof sdIgnore === "function" && sdIgnore(i))) targets.push(i);
  targets.sort((a, b) => Math.hypot(eX[a] - player.x, eY[a] - player.y) - Math.hypot(eX[b] - player.x, eY[b] - player.y));
  const n = Math.max(14, Math.min(BIRD_MAX, targets.length));
  const queues = Array.from({ length: n }, () => []);
  targets.forEach((idx, k) => queues[k % n].push({ idx, uid: eUid[idx] }));
  const armAng = player.aim - 0.6;   // left vambrace
  const ox = player.x + Math.cos(armAng) * 8, oy = player.y + Math.sin(armAng) * 8 - 4;
  for (let b = 0; b < n; b++) {
    const a = armAng + (b / n) * Math.PI * 2, sp = 170 + Math.random() * 60;
    whistlingBirds.push({ x: ox, y: oy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, t: 0, launch: 0.2 + Math.random() * 0.22,
      loop: (b & 1) ? 1 : -1, q: queues[b], tgt: null, life: 3.2, emit: 0, ang: a });
  }
  // failsafe: anything non-boss that was on screen at cast time is gone within ~1.9 s, guaranteed
  player.wbTargets = new Set(targets.map(i => eUid[i]));
  player.wbFailsafe = 1.9;
  spawnSpeech(player.x, player.y - 16, "WHISTLING BIRDS!", "#e0f7fa", 1.8);
  for (let k = 0; k < 4; k++) setTimeout(() => sfx(1700 + k * 160, 2900 + k * 120, 0.32, "sine", 0.07), k * 70);
  if (typeof fxShake === "function") fxShake(2.5, 0.25);
}

function birdHit(i) {
  const ex = eX[i], ey = eY[i];
  spawnBlastWave(ex, ey, 16, "#ffd166");
  for (let k = 0; k < (opts.lowPart ? 2 : 5); k++) {
    const a = Math.random() * Math.PI * 2, sp = 40 + Math.random() * 70;
    spawnPt(ex, ey, Math.cos(a) * sp, Math.sin(a) * sp, 0.2 + Math.random() * 0.15, 2.5, 2, 1);
  }
  const now = performance.now();
  if (now - birdPopT > 40) { birdPopT = now; sfx(900 + Math.random() * 300, 160, 0.05, "square", 0.06); }
  if (eType[i] >= 98) {        // Titans & Rivals: heavy damage, never an instant kill
    const dmg = eMax[i] * (eType[i] === 99 ? 0.06 : 0.16) + 60 * (player.might || 1);
    eHP[i] -= dmg; spawnDmg(ex, ey, dmg, true); eStun[i] = Math.max(eStun[i], 0.25);
    if (eHP[i] <= 0) killEnemy(i, false);
  } else {
    spawnDmg(ex, ey, Math.max(1, Math.round(eHP[i])), true);
    eHP[i] = 0;
    killEnemy(i, Math.random() < 0.3, null, "#ff9100");
  }
}

function updateWhistlingBirds(simDt) {
  if (player.wbFailsafe > 0) {
    player.wbFailsafe -= simDt;
    if (player.wbFailsafe <= 0 && player.wbTargets) {
      for (let i = 0; i < MAX_E; i++) if (eAct[i] && eType[i] < 98 && player.wbTargets.has(eUid[i])) birdHit(i);
      player.wbTargets = null;
    }
  }
  for (let b = whistlingBirds.length - 1; b >= 0; b--) {
    const B = whistlingBirds[b];
    B.t += simDt; B.life -= simDt;
    if (B.life <= 0) { whistlingBirds.splice(b, 1); continue; }
    if (!B.tgt || !eAct[B.tgt.idx] || eUid[B.tgt.idx] !== B.tgt.uid) {
      B.tgt = null;
      while (B.q.length) { const c = B.q.shift(); if (eAct[c.idx] && eUid[c.idx] === c.uid) { B.tgt = c; break; } }
      if (!B.tgt && B.t > B.launch) B.life = Math.min(B.life, 0.35);   // job done: peel off and burn out
    }
    let ang = Math.atan2(B.vy, B.vx), spd = Math.hypot(B.vx, B.vy);
    if (B.t < B.launch) {
      ang += B.loop * 7.5 * simDt;                 // the signature loop-the-loop
      spd = Math.min(260, spd + 120 * simDt);
    } else if (B.tgt) {
      const tx = eX[B.tgt.idx], ty = eY[B.tgt.idx];
      let d = Math.atan2(ty - B.y, tx - B.x) - ang;
      while (d > Math.PI) d -= Math.PI * 2;
      while (d < -Math.PI) d += Math.PI * 2;
      const turn = 9 + B.t * 6;
      ang += Math.max(-turn * simDt, Math.min(turn * simDt, d));
      spd = Math.min(620, spd + 900 * simDt);
      if (Math.hypot(tx - B.x, ty - B.y) < 9 + spd * simDt) { birdHit(B.tgt.idx); B.tgt = null; continue; }
    }
    B.vx = Math.cos(ang) * spd; B.vy = Math.sin(ang) * spd; B.ang = ang;
    B.x += B.vx * simDt; B.y += B.vy * simDt;
    B.emit += simDt * (opts.lowPart ? 14 : 34);
    while (B.emit >= 1) {
      B.emit -= 1;
      spawnPt(B.x - Math.cos(ang) * 4, B.y - Math.sin(ang) * 4, -Math.cos(ang) * 20 + (Math.random() - 0.5) * 14,
              -Math.sin(ang) * 20 + (Math.random() - 0.5) * 14, 0.12 + Math.random() * 0.1, 1.6, 2, 1);
    }
  }
}

function renderWhistlingBirds(c) {
  for (let b = 0; b < whistlingBirds.length; b++) {
    const B = whistlingBirds[b], ca = Math.cos(B.ang), sa = Math.sin(B.ang);
    c.save();
    c.transform(ca, sa, -sa, ca, B.x, B.y);
    c.fillStyle = "#cfd8dc"; c.fillRect(-4, -1, 7, 2);
    c.fillStyle = "#ff9100"; c.fillRect(3, -0.8, 2.2, 1.6);
    c.restore();
  }
}

V10.onRunStart.push(function arsenalRunStart() { whistlingBirds.length = 0; });
V10.onRunReset.push(function arsenalRunReset() { whistlingBirds.length = 0; });
V10.onStep.push(updateWhistlingBirds);
V10.onRenderWorld.push(renderWhistlingBirds);
// EOF:js/arsenal.js
