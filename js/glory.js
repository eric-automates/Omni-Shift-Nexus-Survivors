// FILE: js/glory.js
// PART: v10 module 5 of 8 (v12: always-on EXECUTE, rank targeting, execution chains)
// DETAIL: v10 Cinematic Glory-Kill Finishers — the Predator spine-rip grown into a universal execution system. Elites
//         (heavies, shield-wall leaders, rivals) are STAGGERED by heavy melee / CQC hits at <=35% HP (any damage at <=20%).
//         Walk into a staggered elite or tap EXECUTE to lunge into a hero-specific finisher (saber bisect, Yautja spine-rip,
//         Doom rip & tear, point-blank execution, arcane disintegration, limb tear) with slow-motion, camera push-in,
//         letterbox, hit-stop, a heal, a cooldown refund and an XP bonus.
//         v12: the EXECUTE button no longer pops in and out. After the first stagger of a run it stays on the HUD (dim when
//         nothing is executable). Each tap (or the E key) executes the HIGHEST-RANKED staggered elite in reach (rival >
//         heavy > shield leader > shield trooper, nearest first) from up to 230 px; tapping during a finisher queues the
//         next one (EXECUTION CHAIN xN, lighter slow-mo so the flow never stalls). A pulsing reticle marks who is next.

"use strict";

const gUid = new Uint32Array(MAX_E), gUsed = new Uint8Array(MAX_E), gMeleeT = new Float32Array(MAX_E).fill(-99);
const gloryState = { exec: null, count: 0, near: -1, nearD: 1e9, uiT: 0,
  best: -1, bestD: 1e9, inRange: 0, any: 0, seen: false, queued: false, chain: 0, lastEnd: -1e9, btnMode: "", noTgtT: 0 };
const GLORY_RANGE = 230;            // v12: EXECUTE lunge reach (was 160 px)
const GLORY_STAGGER_T = 4.5;        // v12: how long a staggered elite waits for its finisher (was 3.2 s)
const GLORY_RANK_NAMES = ["", "TROOPER", "SHIELD LEADER", "HEAVY", "RIVAL"];
const GLORY_STYLES = {
  saber:  { label: "BISECTED", heal: 0.12, col: "#00e5ff" },
  spine:  { label: "TROPHY TAKEN · SPINE RIPPED", heal: 0.18, col: "#76ff03" },
  doom:   { label: "RIP & TEAR", heal: 0.30, col: "#ff1744" },
  gun:    { label: "POINT-BLANK EXECUTION", heal: 0.12, col: "#ffd166" },
  arcane: { label: "DISINTEGRATED", heal: 0.14, col: "#e040fb" },
  beast:  { label: "LIMBS TORN", heal: 0.16, col: "#ff9100" }
};

function gloryIsElite(i) { return eType[i] === 3 || eType[i] === 98 || eFormType[i] === 1; }
// v12: execution priority - rival > heavy > shield-wall leader > shield-wall trooper
function gloryRank(i) {
  if (eType[i] === 98) return 4;
  if (eType[i] === 3) return 3;
  if (eFormType[i] === 1) return eFormLeader[i] < 0 ? 2 : 1;
  return 1;
}
function glorySync(i) { if (gUid[i] !== eUid[i]) { gUid[i] = eUid[i]; gUsed[i] = 0; gMeleeT[i] = -99; } }
function gloryOnHeavyHit(j) { glorySync(j); gMeleeT[j] = runTime; }

function gloryStyleFor(cid) { return gloryStyleForCid(cid, !!(player && player.hasSaber)); }
// v12: also used for Rival finishers (js/showdown.js)
function gloryStyleForCid(cid, hasSaber) {
  if (cid === CUSTOM_CID && typeof customGloryStyle === "function") return customGloryStyle(hasSaber);   // v13 creator builds
  if (cid === 29) return "spine";
  if (cid === 33) return "doom";
  if ([5, 17, 30, 37, 61].includes(cid)) return "beast";
  const c = CHAR_RAW[cid];
  const sword = hasSaber || (typeof isSwordWeapon === "function" && isSwordWeapon(cid)) || (c && c[6] === "orbit" && (cid < 56 || cid >= 76));
  if (sword) return "saber";
  if ((c && c[1] === 10) || [7, 10, 12, 18, 20, 38, 46, 49].includes(cid)) return "arcane";
  return "gun";
}

function gloryStagger(i) {
  gUsed[i] = 1; eStagger[i] = GLORY_STAGGER_T; eStun[i] = 0;
  gloryState.seen = true;
  spawnSpeech(eX[i], eY[i] - 16, "STAGGERED!", "#ff9100", 1.0);
  sfx(300, 160, 0.12, "square", 0.1);
}

/* === 1. STAGGER DETECTION + EXECUTION TRIGGER === */
function gloryStep(simDt) {
  const G = gloryState;
  if (G.exec) gloryExecTick();
  let near = -1, nearD = 1e9, best = -1, bestD = 1e9, bestR = -1, inRange = 0, any = 0;
  const sdOn = typeof targetFilterOn === "function" && targetFilterOn();   // v13: + Force-persuaded allies
  for (let i = 0; i < MAX_E; i++) {
    if (!eAct[i]) continue;
    if (eStagger[i] > 0) {
      if (!G.exec || G.exec.i !== i) {
        eStagger[i] -= simDt;
        if (eStagger[i] <= 0) { eStagger[i] = 0; spawnSpeech(eX[i], eY[i] - 14, "RECOVERED", "#90a4ae", 0.8); continue; }
      }
      if (sdOn && sdIgnore(i)) continue;                 // v12: a staggered spectator is not part of the duel
      any++;
      const d = Math.hypot(player.x - eX[i], player.y - eY[i]);
      if (d < nearD) { nearD = d; near = i; }
      if (!G.exec || G.exec.i !== i) {
        if (d <= GLORY_RANGE) {
          inRange++;
          const r = gloryRank(i);
          if (r > bestR || (r === bestR && d < bestD)) { bestR = r; bestD = d; best = i; }
        }
      }
      if (d < 55 && !G.exec) gloryExecute(i);
      continue;
    }
    if (!gloryIsElite(i)) continue;
    glorySync(i);
    if (gUsed[i] || eHP[i] <= 0) continue;
    const melee = runTime - gMeleeT[i] < 0.6 || (player.hasSaber && Math.hypot(player.x - eX[i], player.y - eY[i]) < 60);
    if (eHP[i] < eMax[i] * (melee ? 0.35 : 0.2)) gloryStagger(i);
  }
  G.near = near; G.nearD = nearD; G.best = best; G.bestD = bestD; G.inRange = inRange; G.any = any;
}

// v12: one entry point for the button, the E key and the Proving Ground - executes the best target, or queues the
// next one while a finisher is still playing.
function gloryRequest() {
  const G = gloryState;
  if (!runActive || !player || runPaused) return false;
  if (G.exec) { if (G.inRange > 0) { G.queued = true; gloryFrameForce(); } return false; }
  if (G.best >= 0 && eAct[G.best] && eStagger[G.best] > 0) return gloryExecute(G.best);
  G.noTgtT = 0.45; gloryFrameForce();
  return false;
}

/* === 2. FINISHER TIMELINE (real time, so slow-motion does not stretch it) === */
function gloryExecute(i) {
  const G = gloryState;
  if (G.exec || !eAct[i] || !player) return false;
  const style = gloryStyleFor(player.cid);
  const ang = Math.atan2(eY[i] - player.y, eX[i] - player.x);
  const now = performance.now();
  G.chain = (now - G.lastEnd < 2600) ? G.chain + 1 : 1;
  G.exec = { i, uid: eUid[i], t0: now, style, x0: player.x, y0: player.y, ang, hit: false, echo: eEcho[i] === 1, hp0: eHP[i],
             chain: G.chain, dist: Math.hypot(eX[i] - player.x, eY[i] - player.y) };
  eStagger[i] = Math.max(eStagger[i], 2.0); eKneel[i] = 1;
  // lock the victim for the finisher: stray blade sweeps / bullets can't steal the kill mid-animation
  eHP[i] = 1e7; eScarHitCD[i] = 99;
  player.invulnT = Math.max(player.invulnT || 0, 1.6);
  if (typeof fxSlowMo === "function") {
    if (G.chain <= 1) { fxSlowMo(0.18, 0.8); fxFocus(eX[i], eY[i], 1.38, 0.95); fxLetterbox(1.0); }
    else { fxSlowMo(0.4, 0.5); fxFocus(eX[i], eY[i], 1.25, 0.6); }          // chained finishers keep the flow going
  }
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
    if (k < 1 && E.dist > 70 && typeof spawnPt === "function" && !opts.lowPart) {   // v12: Force-leap afterimage streak
      spawnPt(player.x, player.y, 0, 0, 0.22, 3.2, 9, 4);
    }
    player.aim = E.ang; eStagger[i] = Math.max(eStagger[i], 1.0);
    // v11: the Saber Form Engine plays the Form's own finisher (Falling Avalanche, Makashi lunge, Juyo spin cut...)
    if (E.style === "saber" && t > 0.18 && !(typeof saberGloryActive === "function" && saberGloryActive())) player.whirlwindTimer = 0.2;
  }
  if (!E.hit && t >= 0.5) {
    E.hit = true;
    if (alive) gloryImpact(E);
  }
  if (t >= 0.8) {
    G.exec = null; G.lastEnd = performance.now();
    if (G.queued) {                     // v12: execution chain - go straight into the next-highest-ranked target
      G.queued = false;
      gloryStep(0);
      if (G.best >= 0) gloryExecute(G.best);
    }
  }
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
    const cutA = (E.style === "saber" && typeof saberGloryCutAngle === "function") ? saberGloryCutAngle(E.ang) : E.ang + Math.PI / 2;
    killEnemy(i, false, cutA, col);
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
  const chainTxt = (E.chain || 1) > 1 ? ` · EXECUTION CHAIN ×${E.chain}` : "";
  if (typeof fxBanner === "function") fxBanner((E.chain || 1) > 1 ? "CHAIN KILL" : "GLORY KILL", st.label + (E.echo ? " · ECHO" : ` · +${Math.round(st.heal * 100)}% HP`) + chainTxt, st.col, 1.8, true);
  if (typeof updateHUD === "function") updateHUD();
}

/* === 3. EXECUTE BUTTON (v12: always on after the first stagger; never pops in and out) === */
function gloryButton() {
  let btn = document.getElementById("gloryBtn");
  if (!btn) {
    btn = document.createElement("button");
    btn.id = "gloryBtn"; btn.innerHTML = '<span class="gb-main">☠ EXECUTE</span><span class="gb-sub"></span>';
    btn.addEventListener("pointerdown", e => { e.preventDefault(); e.stopPropagation(); gloryRequest(); });
    document.body.appendChild(btn);
  }
  return btn;
}
function gloryFrameForce() { gloryState.uiT = 0; gloryFrame(0); }
function gloryFrame(rawDt) {
  const G = gloryState;
  G.uiT -= rawDt;
  if (G.noTgtT > 0) G.noTgtT -= rawDt;
  if (G.uiT > 0) return;
  G.uiT = 0.1;
  const live = runActive && !!player && !runPaused;
  if (!live || (!G.seen && G.inRange === 0 && !G.exec)) {
    const b = document.getElementById("gloryBtn"); if (b && b.style.display !== "none") b.style.display = "none";
    G.btnMode = ""; return;
  }
  const btn = gloryButton();
  let mode, main = "☠ EXECUTE", sub = "";
  if (G.exec) {
    mode = "busy";
    if (G.queued) { main = "☠ CHAIN QUEUED"; sub = "next: " + (G.best >= 0 ? GLORY_RANK_NAMES[gloryRank(G.best)] : "—"); }
    else if (G.inRange > 0) { main = "☠ NEXT ▸"; sub = "tap to chain"; }
    else { main = "☠ …"; }
  } else if (G.best >= 0) {
    mode = "ready";
    sub = GLORY_RANK_NAMES[gloryRank(G.best)] + (G.inRange > 1 ? ` · ×${G.inRange}` : "");
  } else {
    mode = G.noTgtT > 0 ? "idle shake" : "idle";
    sub = G.noTgtT > 0 ? "no target" : (G.any > 0 ? "move closer" : "stagger an elite");
  }
  const key = mode + "|" + main + "|" + sub;
  if (G.btnMode !== key) {
    G.btnMode = key;
    btn.className = mode;
    btn.querySelector(".gb-main").textContent = main;
    btn.querySelector(".gb-sub").textContent = sub;
  }
  if (btn.style.display !== "block") btn.style.display = "block";
}

// v12: reticle over the next execution target (and faint brackets on the other staggered elites in reach)
function gloryRenderWorld(c) {
  const G = gloryState;
  if (!runActive || !player || G.any === 0) return;
  const pulse = 1 + Math.sin(performance.now() / 110) * 0.12;
  for (let i = 0; i < MAX_E; i++) {
    if (!eAct[i] || !(eStagger[i] > 0) || (G.exec && G.exec.i === i)) continue;
    const isBest = i === G.best, d = Math.hypot(player.x - eX[i], player.y - eY[i]);
    if (!isBest && d > GLORY_RANGE) continue;
    const r = (eType[i] === 98 ? 15 : 13) * (isBest ? pulse : 1), x = eX[i], y = eY[i] - 2;
    c.save();
    c.strokeStyle = isBest ? "#ff3d00" : "rgba(255,145,0,0.45)"; c.lineWidth = isBest ? 1.8 : 1.0;
    const q = r * 0.45;
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sy]) => {
      c.beginPath(); c.moveTo(x + sx * r, y + sy * (r - q)); c.lineTo(x + sx * r, y + sy * r); c.lineTo(x + sx * (r - q), y + sy * r); c.stroke();
    });
    if (isBest) {
      c.fillStyle = "#ffccbc"; c.font = "bold 9px sans-serif"; c.textAlign = "center";
      c.fillText("☠", x, y - r - 3);
    }
    c.restore();
  }
}

function gloryReset() {
  gloryState.exec = null; gloryState.count = 0; gloryState.near = -1;
  gloryState.best = -1; gloryState.inRange = 0; gloryState.any = 0; gloryState.seen = false; gloryState.queued = false;
  gloryState.chain = 0; gloryState.lastEnd = -1e9; gloryState.btnMode = ""; gloryState.noTgtT = 0;
  gUid.fill(0); gUsed.fill(0); gMeleeT.fill(-99);
  const b = document.getElementById("gloryBtn"); if (b) b.style.display = "none";
}

V10.onRunStart.push(function gloryRunStart() { gloryReset(); });
V10.onRunReset.push(function gloryRunReset() { gloryReset(); });
V10.onStep.push(gloryStep);
V10.onFrame.push(gloryFrame);
V10.onRenderWorld.push(gloryRenderWorld);
window.addEventListener("keydown", e => { if (e.code === "KeyE" && !e.repeat) gloryRequest(); });
// EOF:js/glory.js
