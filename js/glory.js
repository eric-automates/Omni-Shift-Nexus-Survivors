// FILE: js/glory.js
// PART: v10 module 5 of 8
// DETAIL: v10 Cinematic Glory-Kill Finishers — the Predator spine-rip grown into a universal execution system. Elites
//         (heavies, shield-wall leaders, rivals) are STAGGERED by heavy melee / CQC hits at <=35% HP (any damage at <=20%).
//         Walk into a staggered elite or tap EXECUTE to lunge into a hero-specific finisher (saber bisect, Yautja spine-rip,
//         Doom rip & tear, point-blank execution, arcane disintegration, limb tear) with slow-motion, camera push-in,
//         letterbox, hit-stop, a heal, a cooldown refund and an XP bonus.

"use strict";

const gUid = new Uint32Array(MAX_E), gUsed = new Uint8Array(MAX_E), gMeleeT = new Float32Array(MAX_E).fill(-99);
const gloryState = { exec: null, count: 0, near: -1, nearD: 1e9, uiT: 0 };
const GLORY_STYLES = {
  saber:  { label: "BISECTED", heal: 0.12, col: "#00e5ff" },
  spine:  { label: "TROPHY TAKEN · SPINE RIPPED", heal: 0.18, col: "#76ff03" },
  doom:   { label: "RIP & TEAR", heal: 0.30, col: "#ff1744" },
  gun:    { label: "POINT-BLANK EXECUTION", heal: 0.12, col: "#ffd166" },
  arcane: { label: "DISINTEGRATED", heal: 0.14, col: "#e040fb" },
  beast:  { label: "LIMBS TORN", heal: 0.16, col: "#ff9100" }
};

function gloryIsElite(i) { return eType[i] === 3 || eType[i] === 98 || eFormType[i] === 1; }
function glorySync(i) { if (gUid[i] !== eUid[i]) { gUid[i] = eUid[i]; gUsed[i] = 0; gMeleeT[i] = -99; } }
function gloryOnHeavyHit(j) { glorySync(j); gMeleeT[j] = runTime; }

function gloryStyleFor(cid) {
  if (cid === 29) return "spine";
  if (cid === 33) return "doom";
  if ([5, 17, 30, 37, 61].includes(cid)) return "beast";
  const c = CHAR_RAW[cid];
  const sword = player.hasSaber || (typeof isSwordWeapon === "function" && isSwordWeapon(cid)) || (c && c[6] === "orbit" && (cid < 56 || cid >= 76));
  if (sword) return "saber";
  if ((c && c[1] === 10) || [7, 10, 12, 18, 20, 38, 46, 49].includes(cid)) return "arcane";
  return "gun";
}

function gloryStagger(i) {
  gUsed[i] = 1; eStagger[i] = 3.2; eStun[i] = 0;
  spawnSpeech(eX[i], eY[i] - 16, "STAGGERED!", "#ff9100", 1.0);
  sfx(300, 160, 0.12, "square", 0.1);
}

/* === 1. STAGGER DETECTION + EXECUTION TRIGGER === */
function gloryStep(simDt) {
  const G = gloryState;
  if (G.exec) gloryExecTick();
  let near = -1, nearD = 1e9;
  for (let i = 0; i < MAX_E; i++) {
    if (!eAct[i]) continue;
    if (eStagger[i] > 0) {
      if (!G.exec || G.exec.i !== i) {
        eStagger[i] -= simDt;
        if (eStagger[i] <= 0) { eStagger[i] = 0; spawnSpeech(eX[i], eY[i] - 14, "RECOVERED", "#90a4ae", 0.8); continue; }
      }
      const d = Math.hypot(player.x - eX[i], player.y - eY[i]);
      if (d < nearD) { nearD = d; near = i; }
      if (d < 55 && !G.exec) gloryExecute(i);
      continue;
    }
    if (!gloryIsElite(i)) continue;
    glorySync(i);
    if (gUsed[i] || eHP[i] <= 0) continue;
    const melee = runTime - gMeleeT[i] < 0.6 || (player.hasSaber && Math.hypot(player.x - eX[i], player.y - eY[i]) < 60);
    if (eHP[i] < eMax[i] * (melee ? 0.35 : 0.2)) gloryStagger(i);
  }
  G.near = near; G.nearD = nearD;
}

/* === 2. FINISHER TIMELINE (real time, so slow-motion does not stretch it) === */
function gloryExecute(i) {
  const G = gloryState;
  if (G.exec || !eAct[i] || !player) return false;
  const style = gloryStyleFor(player.cid);
  const ang = Math.atan2(eY[i] - player.y, eX[i] - player.x);
  G.exec = { i, uid: eUid[i], t0: performance.now(), style, x0: player.x, y0: player.y, ang, hit: false, echo: eEcho[i] === 1, hp0: eHP[i] };
  eStagger[i] = Math.max(eStagger[i], 2.0); eKneel[i] = 1;
  // lock the victim for the finisher: stray blade sweeps / bullets can't steal the kill mid-animation
  eHP[i] = 1e7; eScarHitCD[i] = 99;
  player.invulnT = Math.max(player.invulnT || 0, 1.6);
  if (typeof fxSlowMo === "function") { fxSlowMo(0.18, 0.8); fxFocus(eX[i], eY[i], 1.38, 0.95); fxLetterbox(1.0); }
  sfx(180, 620, 0.12, "sawtooth", 0.14);
  return true;
}

function gloryExecTick() {
  const G = gloryState, E = G.exec, i = E.i;
  const t = (performance.now() - E.t0) / 1000;
  const alive = eAct[i] && eUid[i] === E.uid;
  if (alive && t < 0.5) {
    // lunge: end up just in front of the victim
    const k = Math.min(1, t / 0.18), tx = eX[i] - Math.cos(E.ang) * 13, ty = eY[i] - Math.sin(E.ang) * 13;
    player.x = E.x0 + (tx - E.x0) * k; player.y = E.y0 + (ty - E.y0) * k;
    player.aim = E.ang; eStagger[i] = Math.max(eStagger[i], 1.0);
    if (E.style === "saber" && t > 0.18) player.whirlwindTimer = 0.2;
  }
  if (!E.hit && t >= 0.5) {
    E.hit = true;
    if (alive) gloryImpact(E);
  }
  if (t >= 0.8) G.exec = null;
}

function gloryImpact(E) {
  const i = E.i, ex = eX[i], ey = eY[i], st = GLORY_STYLES[E.style] || GLORY_STYLES.gun;
  const headCol = enemyCol1(), bodyCol = eType[i] === 98 ? "#ffd166" : enemyCol2();
  eStagger[i] = 0; eKneel[i] = 0; eScarHitCD[i] = 0;
  spawnDmg(ex, ey, Math.max(1, Math.round(E.hp0 || 1)), true);
  eHP[i] = 0;
  for (let k = 0; k < 6; k++) spawnDrip(ex + (Math.random() - 0.5) * 16, ey + (Math.random() - 0.5) * 12, -1, 3 + Math.random() * 3);
  if (E.style === "saber" || E.style === "doom") {
    const col = E.style === "doom" ? "#ff1744" : (player.weapons[0] && player.weapons[0].bladeCol) || "#00e5ff";
    killEnemy(i, false, E.ang + Math.PI / 2, col);
    if (E.style === "doom") { spawnGroundLimb(ex + 8, ey, bodyCol, 1); spawnGroundLimb(ex - 8, ey, bodyCol, 1); }
  } else if (E.style === "spine") {
    killEnemy(i, true, null);
    const li = lmbHead; lmbHead = (lmbHead + 1) % MAX_LIMB;
    lmbX[li] = player.x + Math.cos(E.ang + 2.4) * 10; lmbY[li] = player.y + Math.sin(E.ang + 2.4) * 10;
    lmbRot[li] = E.ang + Math.PI; lmbKind[li] = 4; lmbCol[li] = headCol; lmbFade[li] = 1; lmbAct[li] = 1;
  } else if (E.style === "beast") {
    spawnGroundLimb(ex + 9, ey - 2, bodyCol, 1); spawnGroundLimb(ex - 9, ey + 2, bodyCol, 1);
    killEnemy(i, false, null);
  } else if (E.style === "arcane") {
    for (let k = 0; k < (opts.lowPart ? 8 : 26); k++) {
      const a = Math.random() * Math.PI * 2, sp = 40 + Math.random() * 120;
      spawnPt(ex, ey, Math.cos(a) * sp, Math.sin(a) * sp, 0.4 + Math.random() * 0.4, 2.5, k & 1 ? 11 : 9, 4);
    }
    killEnemy(i, false, null);
  } else {
    for (let k = 0; k < 6; k++) spawnPt(ex - Math.cos(E.ang) * 10, ey - Math.sin(E.ang) * 10, Math.cos(E.ang) * -60 + (Math.random() - 0.5) * 40, Math.sin(E.ang) * -60 + (Math.random() - 0.5) * 40, 0.08, 3.5, 2, 0);
    killEnemy(i, true, null);
  }
  spawnBlastWave(ex, ey, 34, st.col);
  if (typeof fxHitStop === "function") { fxHitStop(0.08); fxShake(6, 0.3); }
  sfx(90, 40, 0.3, "sawtooth", 0.3);
  if (!E.echo) {
    gloryState.count++;
    if (typeof fxState !== "undefined") fxState.glories = gloryState.count;
    player.hp = Math.min(player.maxHp, player.hp + player.maxHp * st.heal);
    player.invulnT = Math.max(player.invulnT || 0, 1.2);
    for (let u = 0; u < (player.utils || []).length; u++) player.utils[u].cd = Math.max(0, player.utils[u].cd * 0.75);
    spawnOrb(ex, ey, 10 + waveNum * 2);
    for (let k = 0; k < (opts.lowPart ? 4 : 10); k++) {
      const a = Math.random() * Math.PI * 2;
      spawnPt(player.x + Math.cos(a) * 14, player.y + Math.sin(a) * 14, -Math.cos(a) * 30, -Math.sin(a) * 30 - 10, 0.5, 2.4, 10, 4);
    }
  }
  if (typeof fxBanner === "function") fxBanner("GLORY KILL", st.label + (E.echo ? " · ECHO" : ` · +${Math.round(st.heal * 100)}% HP`), st.col, 1.8, true);
  if (typeof updateHUD === "function") updateHUD();
}

/* === 3. EXECUTE BUTTON (lunge from up to 160 px) === */
function gloryFrame(rawDt) {
  const G = gloryState;
  G.uiT -= rawDt;
  if (G.uiT > 0) return;
  G.uiT = 0.1;
  let btn = document.getElementById("gloryBtn");
  const show = runActive && !!player && !runPaused && !G.exec && G.near >= 0 && G.nearD < 160 && eAct[G.near] && eStagger[G.near] > 0;
  if (!btn) {
    if (!show) return;
    btn = document.createElement("button");
    btn.id = "gloryBtn"; btn.textContent = "☠ EXECUTE";
    btn.addEventListener("pointerdown", e => { e.preventDefault(); e.stopPropagation(); if (gloryState.near >= 0) gloryExecute(gloryState.near); });
    document.body.appendChild(btn);
  }
  btn.style.display = show ? "block" : "none";
}

function gloryReset() {
  gloryState.exec = null; gloryState.count = 0; gloryState.near = -1;
  gUid.fill(0); gUsed.fill(0); gMeleeT.fill(-99);
  const b = document.getElementById("gloryBtn"); if (b) b.style.display = "none";
}

V10.onRunStart.push(function gloryRunStart() { gloryReset(); });
V10.onRunReset.push(function gloryRunReset() { gloryReset(); });
V10.onStep.push(gloryStep);
V10.onFrame.push(gloryFrame);
// EOF:js/glory.js
