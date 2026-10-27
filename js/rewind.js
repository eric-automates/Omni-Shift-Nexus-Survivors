// FILE: js/rewind.js
// PART: v10 module 2 of 8
// DETAIL: v9.01 Seamless Step-Ladder Temporal Rewind — keyframe ring buffer (enemies, bolts, corpses, bisected halves,
//         severed limbs & helmets, minions, hero), negative-rung playback (-0.1x ... -5.0x) with fractional keyframe
//         interpolation, time halt at the buffer start, "temporal echoes" (no double payouts) and a VHS rewind overlay.
//         Progression (XP, level, weapons, relics, kills, Dark Matter, collected orbs) is never rewound.

"use strict";

const REWIND_KEY_DT = 0.1;                      // seconds of simulated time between keyframes
const REWIND_BUDGET_BYTES = 30 * 1024 * 1024;   // ring buffer budget (~40 s of history at default pool sizes)
const REWIND_PLAYER_FIELDS = ["x", "y", "aim", "hp", "vehicleHp", "inVehicle", "walk", "moveDir", "vx", "vy", "dashCD", "dashTimer",
  "acrobatZ", "acrobatVZ", "acrobatFlip", "deflectStanceTimer", "whirlwindTimer", "sandTimer", "overclockTimer", "sigGearCD", "cqcCD",
  "autoFlameCD", "kneeDartCD", "swapTimer", "handSlotOffset", "swapPause", "defSweep", "defSpin", "adaptTimer", "vatsTimer", "vatsCD",
  "sandCD", "guardZone", "swordSwingTimer", "swordLungeTimer", "forceHandTimer", "armReach", "equipAnimTimer", "flourishPhase",
  "fortTimer", "sixShotsLeft", "sixBurstCD", "sixReloadCD"];
const RW_PSTRIDE = REWIND_PLAYER_FIELDS.length + 6;   // + 6 limb integrity values

const rewindState = {
  ready: false, K: 0, bytes: 0, count: 0, newest: -1, curKey: -1, lastKeyT: -1,
  active: false, halted: false, cursor: 0, rewoundSec: 0, scrubT: 0, killedUids: new Set()
};
let RW_TRACKS = [], RW_STR = [], RW_BY = new Map(), rwTimes = null, rwPlayer = null, rwUtil = null, rwWpn = null, rwScalars = null;

/* === 1. LAZY ALLOCATION (first run only) === */
function rewindSetup() {
  if (rewindState.ready) return true;
  try {
    const arrs = [eAct, eX, eY, eVX, eVY, eHP, eMax, eSpd, eSlow, eShred, eStun, eFireCD, eSeed, eWave, eMoveStyle, eRivalCid, eFormType,
      eFormLeader, eType, eLegsLost, eArmsLost, eBleed, eBleedRate, eTurnAng, eLevitate, eLevZ, eLevVX, eLevVY, eKneel, eUid, eDummy, eStagger,
      pAct, pX, pY, pVX, pVY, pDmg, pLife, pRad, pPrc, pStyle, pSup, pEnemy, pBounce, pWpnId, pSnap, pDeflRolled,
      corpAct, corpX, corpY, corpSeed, corpType, corpLegs, corpArms, corpFade, corpRot, corpRivalCid,
      slAct, slX, slY, slZ, slVX, slVY, slVZ, slRot, slVRot, slCutAng, slHeat, slRad, slHalf, slIsVet, slSeed, slHelmetOff,
      lmbAct, lmbX, lmbY, lmbRot, lmbKind, lmbFade,
      mAct, mX, mY, mVX, mVY, mHP, mMax, mDmg, mSpd, mRad, mAtkCD, mLife, mWalk, mKind];
    if (typeof squadRewindArrays === "function") arrs.push(...squadRewindArrays());
    const strs = [corpCol, corpHeadCol, slBodyCol, slHeadCol, slGlowCol, lmbCol, mCol];
    let bytes = 0; arrs.forEach(a => { bytes += a.byteLength; });
    let strN = 0; strs.forEach(a => { strN += a.length; });
    const perKey = bytes + strN * 8 + RW_PSTRIDE * 8 + 12 * 4 + 5 * 8;
    const K = Math.max(120, Math.min(600, Math.floor(REWIND_BUDGET_BYTES / perKey)));
    RW_TRACKS = arrs.map(a => ({ arr: a, n: a.length, ring: new a.constructor(a.length * K) }));
    RW_BY = new Map(RW_TRACKS.map(t => [t.arr, t]));
    RW_STR = strs.map(a => ({ arr: a, n: a.length, store: new Array(K) }));
    rwTimes = new Float64Array(K);
    rwPlayer = new Float64Array(K * RW_PSTRIDE);
    rwUtil = new Float32Array(K * 4); rwWpn = new Float32Array(K * 8);
    rwScalars = new Float64Array(K * 4);
    rewindState.K = K; rewindState.bytes = perKey * K; rewindState.ready = true;
    if (window.trackProgress) window.trackProgress(`Temporal ring buffer: ${K} keyframes (${(K * REWIND_KEY_DT).toFixed(0)} s, ${(perKey * K / 1048576).toFixed(1)} MB)`);
    return true;
  } catch (e) {
    rewindState.ready = false;
    if (window.trackProgress) window.trackProgress("Rewind buffer unavailable: " + e.message, true);
    return false;
  }
}

function rewindReset() {
  const S = rewindState;
  S.count = 0; S.newest = -1; S.curKey = -1; S.lastKeyT = -1; S.active = false; S.halted = false;
  S.cursor = 0; S.rewoundSec = 0; S.killedUids.clear();
  if (typeof cv !== "undefined" && cv.style.filter) cv.style.filter = "";
}

/* === 2. RECORD === */
function rewindCapture() {
  const S = rewindState, K = S.K, slot = (S.newest + 1) % K;
  for (let t = 0; t < RW_TRACKS.length; t++) { const tr = RW_TRACKS[t]; tr.ring.set(tr.arr, slot * tr.n); }
  for (let t = 0; t < RW_STR.length; t++) {
    const st = RW_STR[t]; let a = st.store[slot];
    if (!a) a = st.store[slot] = new Array(st.n);
    for (let i = 0; i < st.n; i++) a[i] = st.arr[i];
  }
  const PF = REWIND_PLAYER_FIELDS, base = slot * RW_PSTRIDE;
  for (let f = 0; f < PF.length; f++) { const v = player[PF[f]]; rwPlayer[base + f] = typeof v === "number" ? v : NaN; }
  for (let l = 0; l < 6; l++) rwPlayer[base + PF.length + l] = player.limbs ? player.limbs[l] : 100;
  for (let u = 0; u < 4; u++) rwUtil[slot * 4 + u] = (player.utils && player.utils[u]) ? player.utils[u].cd : NaN;
  for (let w = 0; w < 8; w++) rwWpn[slot * 8 + w] = (player.weapons && player.weapons[w]) ? player.weapons[w].cd : NaN;
  rwScalars[slot * 4] = rivalTimer; rwScalars[slot * 4 + 1] = orbWarpTimer;
  rwScalars[slot * 4 + 2] = player.bossSpawned ? 1 : 0; rwScalars[slot * 4 + 3] = waveNum;
  rwTimes[slot] = runTime;
  S.newest = slot; S.count = Math.min(K, S.count + 1); S.lastKeyT = runTime;
}

function rewindStep() {
  const S = rewindState;
  if (!S.ready || S.active || timeScale <= 0) return;
  if (S.lastKeyT < 0 || runTime - S.lastKeyT >= REWIND_KEY_DT - 1e-6) rewindCapture();
}

/* === 3. RESTORE + FRACTIONAL INTERPOLATION === */
function rewindRestore(slot) {
  for (let t = 0; t < RW_TRACKS.length; t++) { const tr = RW_TRACKS[t]; tr.arr.set(tr.ring.subarray(slot * tr.n, (slot + 1) * tr.n)); }
  for (let t = 0; t < RW_STR.length; t++) { const st = RW_STR[t], a = st.store[slot]; if (a) for (let i = 0; i < st.n; i++) st.arr[i] = a[i]; }
  const PF = REWIND_PLAYER_FIELDS, base = slot * RW_PSTRIDE;
  for (let f = 0; f < PF.length; f++) { const v = rwPlayer[base + f]; if (v === v) player[PF[f]] = v; }   // skip NaN
  if (player.limbs) for (let l = 0; l < 6; l++) player.limbs[l] = rwPlayer[base + PF.length + l];
  for (let u = 0; u < 4; u++) { const v = rwUtil[slot * 4 + u]; if (v === v && player.utils[u]) player.utils[u].cd = v; }
  for (let w = 0; w < 8; w++) { const v = rwWpn[slot * 8 + w]; if (v === v && player.weapons[w]) player.weapons[w].cd = v; }
  rivalTimer = rwScalars[slot * 4]; orbWarpTimer = rwScalars[slot * 4 + 1];
  if (!player.sectorCleared) player.bossSpawned = rwScalars[slot * 4 + 2] > 0;
  waveNum = Math.max(1, Math.round(rwScalars[slot * 4 + 3]) || 1);
  // enemies that were already killed (and paid out) in the abandoned future come back as echoes
  const killed = rewindState.killedUids;
  for (let i = 0; i < MAX_E; i++) eEcho[i] = (eAct[i] && killed.has(eUid[i])) ? 1 : 0;
  pHitIdx.fill(-1);
}

function rwLerpPool(actArr, xArr, yArr, k2, f, idArr, maxJump) {
  const ta = RW_BY.get(actArr), tx = RW_BY.get(xArr), ty = RW_BY.get(yArr), ti = idArr ? RW_BY.get(idArr) : null;
  if (!ta || !tx || !ty) return;
  const n = ta.n, o = k2 * n;
  for (let i = 0; i < n; i++) {
    if (!actArr[i] || !ta.ring[o + i]) continue;
    if (ti && ti.ring[o + i] !== idArr[i]) continue;
    const nx = tx.ring[o + i], ny = ty.ring[o + i];
    if (maxJump && Math.abs(nx - xArr[i]) + Math.abs(ny - yArr[i]) > maxJump) continue;
    xArr[i] += (nx - xArr[i]) * f; yArr[i] += (ny - yArr[i]) * f;
  }
}

function rewindLerp(k2, f) {
  rwLerpPool(eAct, eX, eY, k2, f, eUid, 0);
  rwLerpPool(pAct, pX, pY, k2, f, pStyle, 160);
  rwLerpPool(mAct, mX, mY, k2, f, mKind, 160);
  rwLerpPool(slAct, slX, slY, k2, f, null, 80);
  const b2 = k2 * RW_PSTRIDE, nx = rwPlayer[b2], ny = rwPlayer[b2 + 1];
  if (nx === nx && ny === ny) { player.x += (nx - player.x) * f; player.y += (ny - player.y) * f; }
}

/* === 4. PLAYBACK (called by updateSim while timeScale < 0) === */
function rewindBegin() {
  const S = rewindState;
  S.active = true; S.cursor = runTime; S.rewoundSec = 0; S.curKey = S.newest;
  if (S.lastKeyT < runTime - 1e-6) rewindCapture();      // start exactly at "now"
  if (typeof thrownBlade !== "undefined" && thrownBlade) { thrownBlade.active = false; thrownBlade.stage = 0; }
  if (typeof cv !== "undefined") cv.style.filter = "saturate(0.45) contrast(1.08) hue-rotate(-10deg)";
  sfx(1600, 220, 0.35, "sawtooth", 0.12);
}

function rewindPlayback(rawDt) {
  const S = rewindState;
  if (!S.ready || S.count < 2) {
    if (!S.halted) { S.halted = true; updateTimeLabel(); }
    return;
  }
  if (!S.active) rewindBegin();
  const K = S.K, rate = -timeScale;
  const oldest = (S.newest - S.count + 1 + K) % K, tOld = rwTimes[oldest];
  const prev = S.cursor;
  S.cursor = Math.max(tOld, S.cursor - rate * rawDt);
  S.rewoundSec += prev - S.cursor;
  const halted = S.cursor <= tOld + 1e-6;
  if (halted !== S.halted) {
    S.halted = halted; updateTimeLabel();
    if (halted) { sfx(220, 110, 0.25, "square", 0.1); if (typeof fxBanner === "function") fxBanner("TIME HALTED", "Rewind buffer start · press + or 1.0x", "#ff80ab", 2.2); }
  }
  let k = S.newest, guard = 0;
  while (rwTimes[k] > S.cursor + 1e-9 && guard < S.count - 1) { k = (k - 1 + K) % K; guard++; }
  S.curKey = k;
  rewindRestore(k);
  if (k !== S.newest) {
    const k2 = (k + 1) % K, span = rwTimes[k2] - rwTimes[k];
    if (span > 1e-6) rewindLerp(k2, Math.max(0, Math.min(1, (S.cursor - rwTimes[k]) / span)));
  }
  runTime = S.cursor;
  S.scrubT -= rawDt;
  if (S.scrubT <= 0 && !halted) { S.scrubT = 0.11; sfx(1300 + Math.random() * 300 - rate * 60, 320, 0.05, "sawtooth", 0.04); }
}

// Leaving rewind (any forward rung): the abandoned future is discarded and the sim resumes from here.
function rewindCommit() {
  const S = rewindState;
  if (!S.active) { S.halted = false; return; }
  const K = S.K, k = S.curKey >= 0 ? S.curKey : S.newest;
  while (S.newest !== k && S.count > 1) { S.newest = (S.newest - 1 + K) % K; S.count--; }
  S.lastKeyT = rwTimes[S.newest];
  S.active = false; S.halted = false;
  if (typeof cv !== "undefined") cv.style.filter = "";
  if (S.rewoundSec > 0.05 && typeof fxBanner === "function") fxBanner("TIMELINE RESUMED", "-" + S.rewoundSec.toFixed(1) + "s rewound · echoes pay nothing", "#80deea", 1.6);
  sfx(240, 720, 0.18, "triangle", 0.12);
}

function onTimeScaleChanged(prev, next) {
  if (prev < 0 && next > 0) rewindCommit();
}

function rewindBufferSeconds() {
  const S = rewindState;
  if (!S.ready || S.count < 2) return 0;
  const K = S.K, oldest = (S.newest - S.count + 1 + K) % K;
  return Math.max(0, (S.active ? S.cursor : runTime) - rwTimes[oldest]);
}

/* === 5. VHS OVERLAY === */
function rewindRenderScreen(c) {
  const S = rewindState;
  if (!S.active || !player) return;
  const t = performance.now() / 1000;
  c.save();
  c.fillStyle = "rgba(0,0,0,0.16)";
  for (let y = (t * 40) % 3; y < H; y += 3) c.fillRect(0, y, W, 1);
  const by = (t * 160) % (H + 40) - 20;
  c.fillStyle = "rgba(255,255,255,0.07)"; c.fillRect(0, by, W, 12);
  c.fillStyle = "rgba(255,64,129,0.05)"; c.fillRect(0, 0, W, H);
  const cx = W / 2, cy = H - 96;
  c.textAlign = "center"; c.lineWidth = 4; c.strokeStyle = "rgba(0,0,0,0.75)";
  c.font = "900 22px monospace";
  const label = S.halted ? "⏸ TIME HALTED" : "⏪ REWIND " + fmtTimeScale(timeScale);
  c.strokeText(label, cx, cy); c.fillStyle = S.halted ? "#ffd166" : "#ff80ab"; c.fillText(label, cx, cy);
  const secs = rewindBufferSeconds(), maxS = S.K * REWIND_KEY_DT, bw = Math.min(220, W * 0.6);
  c.fillStyle = "rgba(0,0,0,0.6)"; c.fillRect(cx - bw / 2, cy + 8, bw, 6);
  c.fillStyle = "#ff80ab"; c.fillRect(cx - bw / 2, cy + 8, bw * Math.min(1, secs / maxS), 6);
  c.font = "bold 10px monospace"; c.fillStyle = "#e0f7fa";
  c.fillText(S.halted ? "Buffer start reached · press + or 1.0x to resume" : `BUFFER ${secs.toFixed(1)}s · progression is kept`, cx, cy + 28);
  c.restore();
}

/* === 6. HOOKS === */
V10.onRunStart.push(function rewindRunStart() {
  rewindSetup(); rewindReset();
  if (timeScale < 0) setTimeScaleExact(1.0);   // never start a run inside a rewind
});
V10.onRunReset.push(function rewindRunReset() { rewindReset(); });
V10.onStep.push(rewindStep);
V10.onKill.push(function rewindOnKill(idx) { if (eUid[idx]) rewindState.killedUids.add(eUid[idx]); });
V10.onRenderScreen.push(rewindRenderScreen);
// EOF:js/rewind.js
