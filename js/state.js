// FILE: js/state.js
// PART: 9 of 14
// DETAIL: v7.0 Arcane Sanctum Overhaul — 11-Genre Starter Unlocks, Allied Minion SoA Pool (MAX_MINION=36), Corpse-Consumption Summoner, Enemy Levitation State, and Arcane Barriers.

"use strict";

/* === 1. PERSISTENT META-STORAGE & 11-GENRE STARTER UNLOCKS === */
const META_KEY = "OMNISHIFT_META_V1";
const DEFAULT_STARTERS = (typeof STARTER_HEROES_BY_FACTION !== "undefined")
  ? STARTER_HEROES_BY_FACTION
  : [0, 8, 13, 19, 22, 31, 34, 41, 45, 48, 56];

let meta = {
  dmEarned: 0, dmSpent: 0, chars: [...DEFAULT_STARTERS], stages: [1],
  ranks: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], selChar: 0, selStage: 1, diff: 1, outfits: {}
};

let opts = {
  zoom: 1.0, dmgNums: true, flash: true, lowPart: false, hiCon: true,
  fps: true, vol: 0.45, amb: true, joySize: 44, ttDelay: 350, hudFlip: false,
  persistCount: 100
};

let timeScale = 1.0;

function ensureStarterChars() {
  if (!Array.isArray(meta.chars)) meta.chars = [0];
  for (let i = 0; i < DEFAULT_STARTERS.length; i++) {
    const cid = DEFAULT_STARTERS[i];
    if (!meta.chars.includes(cid)) meta.chars.push(cid);
  }
}

/* === 2. CANVAS & ZERO-GC SOA TYPEDARRAY POOLS === */
const cv = document.getElementById("cv"), ctx = cv.getContext("2d");
let W = window.innerWidth, H = window.innerHeight;
function resize() { W = cv.width = window.innerWidth; H = cv.height = window.innerHeight; }
window.addEventListener("resize", resize); resize();

const MAX_E = 360, MAX_P = 520, MAX_O = 500, MAX_D = 140, MAX_PT = 240,
      MAX_DRIP = 320, MAX_SH = 100, MAX_CORPSE = 220, MAX_LIMB = 400, MAX_MINION = 36;

const eX = new Float32Array(MAX_E), eY = new Float32Array(MAX_E),
      eVX = new Float32Array(MAX_E), eVY = new Float32Array(MAX_E),
      eHP = new Float32Array(MAX_E), eMax = new Float32Array(MAX_E),
      eSpd = new Float32Array(MAX_E), eSlow = new Float32Array(MAX_E),
      eShred = new Float32Array(MAX_E), eStun = new Float32Array(MAX_E),
      eGrapple = new Float32Array(MAX_E), eFireCD = new Float32Array(MAX_E),
      eSeed = new Uint32Array(MAX_E), eWave = new Uint16Array(MAX_E),
      eMoveStyle = new Uint8Array(MAX_E), eRivalCid = new Int16Array(MAX_E),
      eFormType = new Uint8Array(MAX_E), eFormLeader = new Int16Array(MAX_E),
      eType = new Uint8Array(MAX_E), eAct = new Uint8Array(MAX_E);

const eLegDmg = new Float32Array(MAX_E), eTailDmg = new Float32Array(MAX_E),
      eLegsLost = new Uint8Array(MAX_E), eArmsLost = new Uint8Array(MAX_E),
      eBleed = new Uint8Array(MAX_E), eBleedRate = new Float32Array(MAX_E),
      eTurnAng = new Float32Array(MAX_E), eTurnTimer = new Float32Array(MAX_E);

// v7.0 Levitation / Wingardium Leviosa Float-Away State
const eLevitate = new Float32Array(MAX_E), eLevZ = new Float32Array(MAX_E),
      eLevVX = new Float32Array(MAX_E), eLevVY = new Float32Array(MAX_E);

// v7.0 Allied Necromancer & Transfiguration Minion Pool (0=Swordsman, 1=Critter/Hound/Viper, 2=Bowman, 3=Knight, 4=Bone Golem)
const mX = new Float32Array(MAX_MINION), mY = new Float32Array(MAX_MINION),
      mVX = new Float32Array(MAX_MINION), mVY = new Float32Array(MAX_MINION),
      mHP = new Float32Array(MAX_MINION), mMax = new Float32Array(MAX_MINION),
      mDmg = new Float32Array(MAX_MINION), mSpd = new Float32Array(MAX_MINION),
      mRad = new Float32Array(MAX_MINION), mAtkCD = new Float32Array(MAX_MINION),
      mLife = new Float32Array(MAX_MINION), mWalk = new Float32Array(MAX_MINION),
      mKind = new Uint8Array(MAX_MINION), mAct = new Uint8Array(MAX_MINION);
const mCol = new Array(MAX_MINION).fill("#e0f7fa");

const drX = new Float32Array(MAX_DRIP), drY = new Float32Array(MAX_DRIP),
      drZ = new Float32Array(MAX_DRIP), drRad = new Float32Array(MAX_DRIP),
      drLife = new Float32Array(MAX_DRIP), drOwner = new Int16Array(MAX_DRIP), drAct = new Uint8Array(MAX_DRIP);
let drHead = 0;

const corpX = new Float32Array(MAX_CORPSE), corpY = new Float32Array(MAX_CORPSE),
      corpSeed = new Uint32Array(MAX_CORPSE), corpType = new Uint8Array(MAX_CORPSE),
      corpLegs = new Uint8Array(MAX_CORPSE), corpArms = new Uint8Array(MAX_CORPSE),
      corpFade = new Float32Array(MAX_CORPSE), corpAct = new Uint8Array(MAX_CORPSE);
let corpHead = 0, activeCorpseCount = 0;

const lmbX = new Float32Array(MAX_LIMB), lmbY = new Float32Array(MAX_LIMB),
      lmbRot = new Float32Array(MAX_LIMB), lmbKind = new Uint8Array(MAX_LIMB),
      lmbFade = new Float32Array(MAX_LIMB), lmbAct = new Uint8Array(MAX_LIMB);
const lmbCol = new Array(MAX_LIMB).fill("#ff1744");
let lmbHead = 0;

const shNX = new Float32Array(MAX_SH), shNY = new Float32Array(MAX_SH),
      shAtk = new Uint8Array(MAX_SH), shTgt = new Uint8Array(MAX_SH), shZone = new Uint8Array(MAX_SH);
let shWrite = 0, shCount = 0, selRangeTab = 0;

function recordShotImpact(nx, ny, atkType, rawEnemyType, zone) {
  let tgt = rawEnemyType === 1 ? 1 : (rawEnemyType === 2 ? 2 : (rawEnemyType === 3 ? 3 : (rawEnemyType === 99 ? 4 : 0)));
  shNX[shWrite] = Math.max(-0.94, Math.min(0.94, nx)); shNY[shWrite] = Math.max(-0.94, Math.min(0.94, ny));
  shAtk[shWrite] = atkType; shTgt[shWrite] = tgt; shZone[shWrite] = zone;
  shWrite = (shWrite + 1) % MAX_SH; if (shCount < MAX_SH) shCount++;
}

const pX = new Float32Array(MAX_P), pY = new Float32Array(MAX_P),
      pVX = new Float32Array(MAX_P), pVY = new Float32Array(MAX_P),
      pDmg = new Float32Array(MAX_P), pLife = new Float32Array(MAX_P),
      pRad = new Float32Array(MAX_P), pPrc = new Int8Array(MAX_P),
      pStyle = new Uint8Array(MAX_P), pSup = new Uint8Array(MAX_P),
      pEnemy = new Uint8Array(MAX_P), pHit = new Uint8Array(MAX_P),
      pBounce = new Uint8Array(MAX_P), pWpnId = new Int16Array(MAX_P),
      pSnap = new Uint8Array(MAX_P), pAct = new Uint8Array(MAX_P);

const oX = new Float32Array(MAX_O), oY = new Float32Array(MAX_O),
      oVal = new Float32Array(MAX_O), oHome = new Uint8Array(MAX_O), oAct = new Uint8Array(MAX_O);

const dX = new Float32Array(MAX_D), dY = new Float32Array(MAX_D),
      dVal = new Int32Array(MAX_D), dLife = new Float32Array(MAX_D),
      dCrit = new Uint8Array(MAX_D), dAct = new Uint8Array(MAX_D);
const dTxt = new Array(MAX_D).fill(""), dCol = new Array(MAX_D).fill("#ffffff");

const ptX = new Float32Array(MAX_PT), ptY = new Float32Array(MAX_PT),
      ptVX = new Float32Array(MAX_PT), ptVY = new Float32Array(MAX_PT),
      ptLife = new Float32Array(MAX_PT), ptAct = new Uint8Array(MAX_PT);

let runChunkDeltas = new Map();
let activeForts = [], activeMines = [], movedBarricades = [], activeBarriers = [];
let runActive = false, runPaused = false, runSeed = 1337, runTime = 0, totalRunTime = 0, waveNum = 1;
let rivalTimer = 0, orbWarpTimer = 0, fpsCount = 60, frameMs = 4.2, flashAlpha = 0, flameVisTimer = 0, muzzleFlashTimer = 0;
let player = null, joy = { act: false, id: -1, ox: 0, oy: 0, dx: 0, dy: 0 }, pinchDist = 0;

/* === 3. STRICT ON-SCREEN TARGET LOCK & CORPSE-CONSUMPTION HELPERS === */
function isEnemyOnScreen(j) {
  if (!eAct[j] || !player) return false;
  const screenW = (W / (opts.zoom || 1)) * 0.52, screenH = (H / (opts.zoom || 1)) * 0.52;
  return Math.abs(eX[j] - player.x) <= screenW && Math.abs(eY[j] - player.y) <= screenH;
}

function countActiveCorpsesNear(x, y, maxDist = 280) {
  let cnt = 0;
  for (let i = 0; i < MAX_CORPSE; i++) {
    if (corpAct[i] && Math.hypot(corpX[i] - x, corpY[i] - y) <= maxDist) cnt++;
  }
  return cnt;
}

function consumeCorpseAt(x, y, maxDist = 280) {
  let best = -1, bestD = maxDist;
  for (let i = 0; i < MAX_CORPSE; i++) {
    if (!corpAct[i]) continue;
    const d = Math.hypot(corpX[i] - x, corpY[i] - y);
    if (d <= bestD) { bestD = d; best = i; }
  }
  if (best < 0) return null;
  const cx = corpX[best], cy = corpY[best];
  corpAct[best] = 0;
  if (activeCorpseCount > 0) activeCorpseCount--;
  spawnParticles(cx, cy, 8);
  return { x: cx, y: cy };
}

function countActiveMinions(kindFilter = -1) {
  let cnt = 0;
  for (let i = 0; i < MAX_MINION; i++) {
    if (mAct[i] && (kindFilter < 0 || mKind[i] === kindFilter)) cnt++;
  }
  return cnt;
}

function spawnMinion(x, y, kind = 0, hp = 120, dmg = 32, spd = 115, life = 24, col = "#b388ff") {
  let slot = -1;
  for (let i = 0; i < MAX_MINION; i++) {
    if (!mAct[i]) { slot = i; break; }
  }
  if (slot < 0) {
    // Replace oldest lowest-tier minion if pool is full
    slot = 0;
    for (let i = 1; i < MAX_MINION; i++) {
      if (mKind[i] < mKind[slot] || mLife[i] < mLife[slot]) slot = i;
    }
  }
  mX[slot] = x + (Math.random() - 0.5) * 14;
  mY[slot] = y + (Math.random() - 0.5) * 14;
  mVX[slot] = 0; mVY[slot] = 0;
  mHP[slot] = mMax[slot] = hp;
  mDmg[slot] = dmg;
  mSpd[slot] = spd;
  mRad[slot] = kind === 4 ? 17 : (kind === 3 ? 12 : (kind === 1 ? 7 : 9.5));
  mAtkCD[slot] = 0.1;
  mLife[slot] = life;
  mWalk[slot] = Math.random() * 6.28;
  mKind[slot] = kind;
  mCol[slot] = col;
  mAct[slot] = 1;
  spawnParticles(mX[slot], mY[slot], 6);
  return slot;
}

function loadMeta() {
  try {
    const raw = localStorage.getItem(META_KEY);
    if (raw) {
      meta = { ...meta, ...JSON.parse(raw) };
      if (typeof meta.diff !== "number") meta.diff = 1;
      if (!meta.outfits || typeof meta.outfits !== "object") meta.outfits = {};
    }
  } catch (e) {}
  ensureStarterChars();
}

function saveMeta() {
  ensureStarterChars();
  try { localStorage.setItem(META_KEY, JSON.stringify(meta)); } catch (e) {}
  if (typeof updateMenuUI === "function") updateMenuUI();
}

function getOutfit(cid) {
  if (!meta.outfits) meta.outfits = {};
  if (!meta.outfits[cid]) meta.outfits[cid] = { head: 0, torso: 0, legs: 0, back: 0, blade: cid === 3 ? 2 : 0 };
  if (typeof meta.outfits[cid].blade !== "number") meta.outfits[cid].blade = cid === 3 ? 2 : 0;
  return meta.outfits[cid];
}

function cycleOutfitPart(cid, partKey) {
  const o = getOutfit(cid), spec = typeof getHeroOutfits === "function" ? getHeroOutfits(cid) : null;
  const maxLen = (spec && spec[partKey]) ? spec[partKey].length : 3;
  o[partKey] = ((o[partKey] || 0) + 1) % maxLen;
  saveMeta(); sfx(380, 620, 0.06, "triangle", 0.14);
}

function availDM() { return Math.max(0, meta.dmEarned - meta.dmSpent); }

function respecAll() {
  meta.dmSpent = 0;
  meta.chars = [...DEFAULT_STARTERS];
  meta.ranks.fill(0);
  meta.selChar = 0;
  saveMeta();
  sfx(280, 680, 0.22, "triangle");
}

function setTimeScale(delta, reset = false) {
  timeScale = reset ? 1.0 : Math.max(0.1, +(timeScale + delta).toFixed(1));
  const lbl = document.getElementById("timeScaleLbl");
  if (lbl) lbl.textContent = timeScale.toFixed(1) + "x";
  sfx(300 + timeScale * 80, 420 + timeScale * 80, 0.05, "sine", 0.12);
}

function clearEnemyLimbState(idx, fadeDrips = true) {
  eLegDmg[idx] = 0; eTailDmg[idx] = 0; eLegsLost[idx] = 0; eArmsLost[idx] = 0;
  eBleed[idx] = 0; eBleedRate[idx] = 0; eTurnAng[idx] = 0; eTurnTimer[idx] = 0;
  eFormType[idx] = 0; eFormLeader[idx] = -1;
  eLevitate[idx] = 0; eLevZ[idx] = 0; eLevVX[idx] = 0; eLevVY[idx] = 0;
}

function spawnDrip(x, y, ownerIdx, initRad = 2.6) {
  const i = drHead; drHead = (drHead + 1) % MAX_DRIP;
  drX[i] = x + (Math.random() - 0.5) * 7; drY[i] = y + (Math.random() - 0.5) * 5;
  drZ[i] = 5.5; drRad[i] = initRad; drLife[i] = 28.0; drOwner[i] = ownerIdx; drAct[i] = 1;
}

function spawnGroundLimb(x, y, col, kind = 0) {
  const i = lmbHead; lmbHead = (lmbHead + 1) % MAX_LIMB;
  lmbX[i] = x + (Math.random() - 0.5) * 14; lmbY[i] = y + (Math.random() - 0.5) * 10;
  lmbRot[i] = Math.random() * Math.PI * 2; lmbKind[i] = kind;
  lmbCol[i] = col; lmbFade[i] = 1.0; lmbAct[i] = 1;
  spawnDrip(lmbX[i], lmbY[i], -1, 4.2);
}

function spawnCorpse(x, y, seed, type, legsLost, armsLost = 0) {
  const i = corpHead; corpHead = (corpHead + 1) % MAX_CORPSE;
  corpX[i] = x; corpY[i] = y; corpSeed[i] = seed; corpType[i] = type;
  corpLegs[i] = legsLost; corpArms[i] = armsLost; corpFade[i] = 1.0; corpAct[i] = 1;
  spawnDrip(x, y, -1, 6.0);
}

function purgeRunMemory() {
  runActive = false; runPaused = false; runChunkDeltas.clear();
  activeForts.length = 0; activeMines.length = 0; movedBarricades.length = 0; activeBarriers.length = 0;
  eAct.fill(0); eLegDmg.fill(0); eTailDmg.fill(0); eLegsLost.fill(0); eArmsLost.fill(0);
  eBleed.fill(0); eBleedRate.fill(0); eLevitate.fill(0); eLevZ.fill(0);
  mAct.fill(0); drAct.fill(0); corpAct.fill(0); lmbAct.fill(0);
  pAct.fill(0); pHit.fill(0); pBounce.fill(0); pSnap.fill(0); oAct.fill(0); oHome.fill(0); dAct.fill(0); ptAct.fill(0);
  shWrite = 0; shCount = 0; activeCorpseCount = 0; player = null;
}

function spawnDmg(x, y, val, isCrit, isLimb = false) {
  if (!opts.dmgNums) return;
  for (let i = 0; i < MAX_D; i++) {
    if (!dAct[i]) {
      dX[i] = x + (Math.random() - 0.5) * 14; dY[i] = y - 10;
      dVal[i] = Math.min(9999, Math.max(1, Math.round(val)));
      dTxt[i] = ""; dCol[i] = isLimb ? "#9e9e9e" : (isCrit ? "#ffd166" : "#ffffff");
      dLife[i] = 0.58; dCrit[i] = isCrit ? 1 : 0; dAct[i] = 1; return;
    }
  }
}

function spawnSpeech(x, y, text, color = "#ffd166", dur = 2.4) {
  for (let i = 0; i < MAX_D; i++) {
    if (!dAct[i]) {
      dX[i] = x; dY[i] = y - 28; dVal[i] = 0; dTxt[i] = text;
      dCol[i] = color; dLife[i] = dur; dCrit[i] = 2; dAct[i] = 1; return;
    }
  }
}

function spawnParticles(x, y, cnt = 5) {
  if (opts.lowPart) cnt = Math.min(2, cnt);
  for (let k = 0; k < cnt; k++) {
    for (let i = 0; i < MAX_PT; i++) {
      if (!ptAct[i]) {
        const a = Math.random() * Math.PI * 2, s = 40 + Math.random() * 90;
        ptX[i] = x; ptY[i] = y; ptVX[i] = Math.cos(a) * s; ptVY[i] = Math.sin(a) * s;
        ptLife[i] = 0.25 + Math.random() * 0.2; ptAct[i] = 1; break;
      }
    }
  }
}

function spawnOrb(x, y, val) {
  const autoHome = (player && player.orbVacuumRate > 0 && Math.random() < player.orbVacuumRate) ? 1 : 0;
  for (let i = 0; i < MAX_O; i++) {
    if (!oAct[i]) { oX[i] = x; oY[i] = y; oVal[i] = val; oHome[i] = autoHome; oAct[i] = 1; return; }
  }
  let farIdx = 0, maxDist = -1, px = player ? player.x : x, py = player ? player.y : y;
  for (let i = 0; i < MAX_O; i++) { const d = Math.hypot(oX[i] - px, oY[i] - py); if (d > maxDist) { maxDist = d; farIdx = i; } }
  oX[farIdx] = x; oY[farIdx] = y; oVal[farIdx] += val; oHome[farIdx] = autoHome; oAct[farIdx] = 1;
}

function vacuumDistantOrbs(fraction = 0.35) {
  if (!player) return 0;
  const candidates = [];
  for (let i = 0; i < MAX_O; i++) { if (oAct[i] && !oHome[i]) candidates.push(i); }
  candidates.sort(() => Math.random() - 0.5);
  const targetCount = Math.ceil(candidates.length * fraction);
  for (let k = 0; k < targetCount; k++) oHome[candidates[k]] = 1;
  spawnSpeech(player.x, player.y, "ORB VACUUM: " + Math.round(fraction * 100) + "% PULLED!", "#00ff88", 1.8);
  sfx(360, 880, 0.18, "sine"); return targetCount;
}

function compressOffscreenOrbsToChest() {
  if (!player) return;
  let pooledXP = 0, count = 0;
  for (let i = 0; i < MAX_O; i++) {
    if (oAct[i] && !oHome[i] && Math.hypot(oX[i] - player.x, oY[i] - player.y) > 340) { pooledXP += oVal[i]; oAct[i] = 0; count++; }
  }
  if (count === 0) return;
  const ang = player.aim || 0, cx = player.x + Math.cos(ang) * 85, cy = player.y + Math.sin(ang) * 85;
  spawnOrb(cx, cy, pooledXP * 1.15); movedBarricades.push({ x: cx + 26, y: cy, rad: 16, type: 6, seed: 999 });
  spawnParticles(cx, cy, 14); spawnSpeech(player.x, player.y - 16, "XP WARP CHEST (" + count + " ORBS)!", "#00f0ff", 3.0);
  sfx(280, 960, 0.28, "triangle");
}

function spawnProj(x, y, vx, vy, dmg, life, rad, prc, style, sup, isEnemy = 0, wpnId = -1) {
  for (let i = 0; i < MAX_P; i++) {
    if (!pAct[i]) {
      const spd = Math.hypot(vx, vy);
      const muzzleOff = (spd > 1 && style !== 1 && style !== 6 && style !== 8) ? (isEnemy ? 16 : 20) : 0;
      pX[i] = x + (spd > 1 ? (vx / spd) * muzzleOff : 0);
      pY[i] = y + (spd > 1 ? (vy / spd) * muzzleOff : 0);
      if (!isEnemy && muzzleOff > 0) muzzleFlashTimer = 0.055;
      pVX[i] = vx; pVY[i] = vy; pDmg[i] = dmg; pLife[i] = life;
      pRad[i] = rad; pPrc[i] = prc; pStyle[i] = style; pSup[i] = sup;
      pEnemy[i] = isEnemy; pHit[i] = 0; pBounce[i] = 0; pSnap[i] = 0;
      pWpnId[i] = wpnId >= 0 ? wpnId : (player ? player.cid : 0);
      pAct[i] = 1; return;
    }
  }
}
// EOF:js/state.js
