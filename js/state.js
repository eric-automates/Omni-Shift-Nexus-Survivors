// FILE: js/state.js
// PART: 9 of 14
// DETAIL: v8.2 Overhaul — Canonical Weapon Color Registry (getWeaponColor), Rival/Boss Weapon Drop Pool (activeWeaponDrops), Un-Fading Veteran Corpse & Outfit Preservation Pools, and Allied Minion SoA State.

"use strict";

/* === 1. PERSISTENT META-STORAGE & 11-GENRE STARTER UNLOCKS === */
const META_KEY = "OMNISHIFT_META_V1";
const DEFAULT_STARTERS = (typeof STARTER_HEROES_BY_FACTION !== "undefined")
  ? STARTER_HEROES_BY_FACTION
  : [0, 8, 13, 19, 22, 31, 34, 41, 45, 48, 56];

let meta = {
  dmEarned: 0, dmSpent: 0, chars: [...DEFAULT_STARTERS], stages: [1], cleared: [],
  ranks: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], selChar: 0, selStage: 1, diff: 1, outfits: {}
};

const OPTS_KEY = "OMNISHIFT_OPTS_V1";
let opts = {
  zoom: 1.0, dmgNums: true, flash: true, lowPart: false, hiCon: true,
  fps: true, vol: 0.45, amb: true, joySize: 44, ttDelay: 350, hudFlip: false,
  persistCount: 100, doubleTapDash: true, timeScale: 1.0,
  shake: true, perfHud: true, weather: true   // v10 game-feel options
};

// v9.01 Temporal Nexus step ladder (HUD "-" / "1.0x" / "+" buttons and the Options menu share it).
// Negative rungs stream BACKWARD through the rewind ring buffer (js/rewind.js); forward rungs run the
// simulation sub-stepped (js/sim.js updateSim). Only forward speeds are ever saved to options.
const TIME_LADDER = [-5.0, -2.5, -1.0, -0.5, -0.25, -0.1, 0.1, 0.25, 0.5, 0.75, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5];
const TIME_SCALE_MIN = -5.0, TIME_SCALE_MAX = 3.5, TIME_FWD_MIN = 0.1;
let timeScale = 1.0;

function snapToLadder(v, forwardOnly = false) {
  let best = 1.0, bestD = 1e9;
  for (let i = 0; i < TIME_LADDER.length; i++) {
    const r = TIME_LADDER[i];
    if (forwardOnly && r <= 0) continue;
    const d = Math.abs(r - v);
    if (d < bestD) { bestD = d; best = r; }
  }
  return best;
}
function fmtTimeScale(v) {
  const a = Math.abs(v);
  return ((a < 1 && Math.round(a * 100) % 10 !== 0) ? v.toFixed(2) : v.toFixed(1)) + "x";
}

/* === 1b. v10 MODULE HOOKS ===
   New feature modules (fx, rewind, arsenal, squad, glory, biomes, campaign, proving) register here
   instead of being wired into every core loop. A failing hook is reported once and skipped. */
const V10 = { onRunStart: [], onRunReset: [], onStep: [], onKill: [], onRenderWorld: [], onRenderScreen: [], onFrame: [] };
const v10ErrSeen = new Set();
function v10Run(list, a, b, c, d) {
  for (let i = 0; i < list.length; i++) {
    try { list[i](a, b, c, d); } catch (e) {
      const msg = (list[i].name || "hook") + ": " + (e && e.message);
      if (!v10ErrSeen.has(msg)) { v10ErrSeen.add(msg); if (window.trackProgress) window.trackProgress("v10 hook error " + msg, true); }
    }
  }
}

// FIX: options were never written to storage although the Options screen says "SAVE & BACK".
function loadOpts() {
  try {
    const raw = localStorage.getItem(OPTS_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw);
    if (!saved || typeof saved !== "object") return;
    Object.keys(opts).forEach(k => {
      if (k in saved && typeof saved[k] === typeof opts[k]) opts[k] = saved[k];
    });
    opts.zoom = Math.max(0.5, Math.min(2.0, opts.zoom || 1.0));
    opts.vol = Math.max(0, Math.min(1, opts.vol));
    // never boot into rewind; snap old free-form values (e.g. 2.2x) onto the ladder
    timeScale = snapToLadder(Math.max(TIME_FWD_MIN, Math.min(TIME_SCALE_MAX, opts.timeScale || 1.0)), true);
    opts.timeScale = timeScale;
  } catch (e) {}
}

function saveOpts() {
  opts.timeScale = timeScale > 0 ? timeScale : 1.0;
  try { localStorage.setItem(OPTS_KEY, JSON.stringify(opts)); } catch (e) {}
}

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

const MAX_E = 360, MAX_P = 520, MAX_O = 500, MAX_D = 140, MAX_PT = 1400,
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

// Levitation / Wingardium Leviosa Float-Away State
const eLevitate = new Float32Array(MAX_E), eLevZ = new Float32Array(MAX_E),
      eLevVX = new Float32Array(MAX_E), eLevVY = new Float32Array(MAX_E);

// v10: unique spawn id (rewind identity), rewind "temporal echo" flag (no second payout),
// glory-kill stagger timer, and Proving Ground training-dummy flag.
const eUid = new Uint32Array(MAX_E), eEcho = new Uint8Array(MAX_E),
      eStagger = new Float32Array(MAX_E), eDummy = new Uint8Array(MAX_E);
let enemyUidCounter = 1;

// Allied Necromancer & Transfiguration Minion Pool (0=Swordsman, 1=Critter/Hound/Viper, 2=Bowman, 3=Knight, 4=Bone Golem)
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

// Enhanced Corpse Pool with Veteran (Rival/Boss) Outfit Color & Identity Preservation
const corpX = new Float32Array(MAX_CORPSE), corpY = new Float32Array(MAX_CORPSE),
      corpSeed = new Uint32Array(MAX_CORPSE), corpType = new Uint8Array(MAX_CORPSE),
      corpLegs = new Uint8Array(MAX_CORPSE), corpArms = new Uint8Array(MAX_CORPSE),
      corpFade = new Float32Array(MAX_CORPSE), corpRot = new Float32Array(MAX_CORPSE),
      corpRivalCid = new Int16Array(MAX_CORPSE).fill(-1), corpAct = new Uint8Array(MAX_CORPSE);
const corpCol = new Array(MAX_CORPSE).fill("rgba(55, 68, 82, 0.82)");
const corpHeadCol = new Array(MAX_CORPSE).fill("#90a4ae");
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

// FIX: per-projectile hit memory. pHit[i] is the ring-buffer write head; pHitIdx/pHitT store
// which enemy slots this projectile already struck (and when), so pierce is spent across
// DIFFERENT enemies instead of re-hitting the same enemy every frame.
const PROJ_HIT_SLOTS = 8;
const pHitIdx = new Int16Array(MAX_P * PROJ_HIT_SLOTS).fill(-1);
const pHitT = new Float32Array(MAX_P * PROJ_HIT_SLOTS);
// FIX: saber deflection is rolled ONCE per incoming enemy bolt (was re-rolled every frame).
const pDeflRolled = new Uint8Array(MAX_P);

const oX = new Float32Array(MAX_O), oY = new Float32Array(MAX_O),
      oVal = new Float32Array(MAX_O), oHome = new Uint8Array(MAX_O), oAct = new Uint8Array(MAX_O);

const dX = new Float32Array(MAX_D), dY = new Float32Array(MAX_D),
      dVal = new Int32Array(MAX_D), dLife = new Float32Array(MAX_D),
      dCrit = new Uint8Array(MAX_D), dAct = new Uint8Array(MAX_D);
const dTxt = new Array(MAX_D).fill(""), dCol = new Array(MAX_D).fill("#ffffff");

const ptX = new Float32Array(MAX_PT), ptY = new Float32Array(MAX_PT),
      ptVX = new Float32Array(MAX_PT), ptVY = new Float32Array(MAX_PT),
      ptLife = new Float32Array(MAX_PT), ptAct = new Uint8Array(MAX_PT);
// v9.01 coloured particles: palette index, size, max life (for fades) and behaviour kind
// (0 spark, 1 fire, 2 smoke, 3 brass casing, 4 ember, 5 dust). Allocation is a ring buffer, so an
// emission never fails (the oldest particle is recycled) - missile trails are continuous.
const PT_PALETTE = ["#ffd166", "#ffffff", "#fff59d", "#ffb300", "#ff6d00", "#ff1744", "#90a4ae", "#cfd8dc",
                    "#d4a537", "#00e5ff", "#00e676", "#e040fb", "#a1887f", "#b71c1c", "#ffe082", "#546e7a"];
const ptCol = new Uint8Array(MAX_PT), ptSize = new Float32Array(MAX_PT),
      ptMax = new Float32Array(MAX_PT), ptKind = new Uint8Array(MAX_PT);
let ptHead = 0;

let runChunkDeltas = new Map();
let activeForts = [], activeMines = [], movedBarricades = [], activeBarriers = [], activeWeaponDrops = [];
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
    // Prefer consuming regular henchman corpses first so Rival/Boss trophy bodies stay on the ground!
    if (!corpAct[i] || corpType[i] >= 98) continue;
    const d = Math.hypot(corpX[i] - x, corpY[i] - y);
    if (d <= bestD) { bestD = d; best = i; }
  }
  if (best < 0) {
    for (let i = 0; i < MAX_CORPSE; i++) {
      if (!corpAct[i]) continue;
      const d = Math.hypot(corpX[i] - x, corpY[i] - y);
      if (d <= bestD) { bestD = d; best = i; }
    }
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
  if (!Array.isArray(meta.stages) || meta.stages.length === 0) meta.stages = [1];
  if (!meta.stages.includes(1)) meta.stages.unshift(1);
  if (!Array.isArray(meta.cleared)) meta.cleared = [];
  if (!meta.stages.includes(meta.selStage)) meta.selStage = 1;
  // Older saves could hold fractional DM (the "+30% boss DM" relic used to add a raw 0.3 DM).
  meta.dmEarned = Math.round(+meta.dmEarned || 0); meta.dmSpent = Math.round(+meta.dmSpent || 0);
  ensureStarterChars();
  // v12 Custom Hero (#80): validate the saved design and register it as CHAR_RAW[80] (js/creator.js)
  if (meta.custom && typeof customHeroSanitize === "function") meta.custom = customHeroSanitize(meta.custom);
  if (typeof customHeroRegister === "function") customHeroRegister();
  if (meta.selChar === 80 && !(meta.custom && meta.custom.created)) meta.selChar = 0;
  loadOpts();
}

function saveMeta() {
  ensureStarterChars();
  try { localStorage.setItem(META_KEY, JSON.stringify(meta)); } catch (e) {}
  if (typeof updateMenuUI === "function") updateMenuUI();
}

/* === 4. CANONICAL BLADE & WEAPON COLOR REGISTRY === */
function getDefaultBladeIdx(cid) {
  if ([3, 33, 76, 77].includes(cid)) return 2; // Sith Crimson / Crucible Red (Sidious, Doom Slayer, Vader, Maul)
  if (cid === 78) return 3;                    // Amethyst Purple (Mace Windu)
  if ([55, 79].includes(cid)) return 1;        // Emerald Green (General Grievous, Grandmaster Yoda)
  if ([7, 12].includes(cid)) return 4;         // Solar / Ori Gold
  if (cid === 1) return 5;                     // Mandalorian Darksaber Obsidian
  if ([48, 71].includes(cid)) return 6;        // Silver / Istari Pure White
  return 0;                                    // Default Skywalker Cyan
}

function getWeaponColor(wpnId) {
  const hexes = ["#00f0ff", "#00e676", "#ff1744", "#d500f9", "#ffd166", "#212121", "#ffffff"];
  // Check explicit hero blade palette first if available
  if (typeof getHeroOutfits === "function") {
    const pal = getHeroOutfits(wpnId);
    const defIdx = getDefaultBladeIdx(wpnId);
    if (pal && pal.blade && pal.blade[defIdx] && pal.blade[defIdx][1]) {
      return pal.blade[defIdx][1];
    }
  }
  const defIdx = getDefaultBladeIdx(wpnId);
  return hexes[defIdx] || "#00f0ff";
}

function getOutfit(cid) {
  if (!meta.outfits) meta.outfits = {};
  const defBlade = getDefaultBladeIdx(cid);
  if (!meta.outfits[cid]) {
    meta.outfits[cid] = { head: 0, torso: 0, legs: 0, back: 0, blade: defBlade };
  } else if (typeof meta.outfits[cid].blade !== "number" || (!meta.outfits[cid]._userSetBlade && meta.outfits[cid].blade === 0 && defBlade !== 0)) {
    meta.outfits[cid].blade = defBlade;
  }
  return meta.outfits[cid];
}

function cycleOutfitPart(cid, partKey) {
  const o = getOutfit(cid), spec = typeof getHeroOutfits === "function" ? getHeroOutfits(cid) : null;
  const maxLen = (spec && spec[partKey]) ? spec[partKey].length : 3;
  o[partKey] = ((o[partKey] || 0) + 1) % maxLen;
  if (partKey === "blade") {
    o._userSetBlade = true;
    // Sync active primary weapon color if player is currently this hero
    if (player && player.cid === cid && player.weapons && player.weapons[0] && player.weapons[0].id === cid) {
      if (spec && spec.blade && spec.blade[o.blade]) {
        player.weapons[0].bladeCol = spec.blade[o.blade][1];
      }
    }
  }
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

// FIX: the Character-screen respec button used to call respecAll(), which also wiped every
// Dark Matter Shop upgrade. This one refunds and re-locks purchased heroes only.
function respecHeroes() {
  let refund = 0;
  const keep = [...DEFAULT_STARTERS];
  meta.chars.forEach(cid => {
    const c = (typeof CHAR_RAW !== "undefined") ? CHAR_RAW[cid] : null;
    if (!c || keep.includes(cid)) return;
    refund += c[2] || 0;
  });
  meta.dmSpent = Math.max(0, meta.dmSpent - refund);
  meta.chars = keep;
  if (!meta.chars.includes(meta.selChar)) meta.selChar = 0;
  saveMeta();
  sfx(280, 680, 0.22, "triangle");
  return refund;
}

// v9.01: the "-" / "+" buttons now walk one rung of TIME_LADDER (+3.5x ... 1.0x ... -0.1x ... -5.0x)
// instead of jumping in 0.5x steps; "1.0x" resets. delta only gives the direction (sign).
function setTimeScale(delta, reset = false) {
  const prev = timeScale;
  let idx = TIME_LADDER.indexOf(snapToLadder(timeScale));
  if (reset) idx = TIME_LADDER.indexOf(1.0);
  else if (delta > 0) idx = Math.min(TIME_LADDER.length - 1, idx + 1);
  else if (delta < 0) idx = Math.max(0, idx - 1);
  applyTimeScale(TIME_LADDER[idx], prev);
}
function setTimeScaleExact(v) { applyTimeScale(snapToLadder(Math.max(TIME_SCALE_MIN, Math.min(TIME_SCALE_MAX, v))), timeScale); }
function applyTimeScale(next, prev) {
  timeScale = next;
  if (typeof onTimeScaleChanged === "function") onTimeScaleChanged(prev, timeScale);
  updateTimeLabel();
  if (timeScale < 0) sfx(900 + timeScale * 60, 260, 0.09, "sawtooth", 0.08);
  else sfx(300 + timeScale * 80, 420 + timeScale * 80, 0.05, "sine", 0.12);
  saveOpts();
}
function updateTimeLabel() {
  const lbl = document.getElementById("timeScaleLbl");
  if (!lbl) return;
  const halted = (typeof rewindState !== "undefined") && rewindState.halted && timeScale < 0;
  lbl.textContent = halted ? "0.0x ⏸ BUFFER START" : (timeScale < 0 ? "⏪ " + fmtTimeScale(timeScale) + " REWIND" : fmtTimeScale(timeScale));
  lbl.style.color = timeScale < 0 ? "#ff80ab" : (timeScale > 1 ? "#ffd166" : (timeScale < 1 ? "#80deea" : ""));
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

function spawnCorpse(x, y, seed, type, legsLost, armsLost = 0, customCol = null, headCol = null, rivalCid = -1) {
  // Never overwrite a fallen Rival (98) or Boss (99) corpse when the ring buffer wraps around!
  let i = corpHead;
  for (let tries = 0; tries < MAX_CORPSE; tries++) {
    const cand = (corpHead + tries) % MAX_CORPSE;
    if (!corpAct[cand] || corpType[cand] < 98) {
      i = cand;
      corpHead = (cand + 1) % MAX_CORPSE;
      break;
    }
  }
  corpX[i] = x; corpY[i] = y; corpSeed[i] = seed; corpType[i] = type;
  corpLegs[i] = legsLost; corpArms[i] = armsLost; corpFade[i] = 1.0;
  corpRot[i] = ((seed % 628) / 100) - 3.14;
  corpRivalCid[i] = rivalCid;

  if (type === 98 && rivalCid >= 0 && typeof CHAR_RAW !== "undefined" && CHAR_RAW[rivalCid]) {
    const rFac = FACTIONS[CHAR_RAW[rivalCid][1]] || (player ? player.fac : FACTIONS[0]);
    const out = getOutfit(rivalCid);
    const pal = typeof getHeroOutfits === "function" ? getHeroOutfits(rivalCid) : null;
    corpHeadCol[i] = (pal && pal.head && pal.head[out.head || 0]) ? pal.head[out.head || 0][1] : rFac.c1;
    corpCol[i] = (pal && pal.torso && pal.torso[out.torso || 0]) ? pal.torso[out.torso || 0][1] : rFac.c2;
  } else if (type === 99) {
    corpHeadCol[i] = "#ffff00";
    corpCol[i] = customCol || "#ff1744";
  } else {
    corpHeadCol[i] = headCol || (player && player.fac ? player.fac.c1 : "#90a4ae");
    corpCol[i] = customCol || (player && player.fac ? player.fac.c2 : "rgba(55, 68, 82, 0.85)");
  }
  corpAct[i] = 1;
  spawnDrip(x, y, -1, type >= 98 ? 8.0 : 6.0);
  // v9.0/9.01 procedural heads: ~55% of henchmen lose their helmet/hood on death. The decision is a
  // pure function of the corpse seed (corpseHelmetOff), so the head drawn every frame never flickers.
  if (type < 98 && corpseHelmetOff(seed)) {
    const ang = corpRot[i] + ((seed >>> 3) % 100) / 100 * 1.6 - 0.8;
    const dist = 11 + ((seed >>> 9) % 7);
    const li = lmbHead; lmbHead = (lmbHead + 1) % MAX_LIMB;
    lmbX[li] = x + Math.cos(ang) * dist; lmbY[li] = y + Math.sin(ang) * dist;
    lmbRot[li] = ((seed >>> 5) % 628) / 100; lmbKind[li] = 3;
    lmbCol[li] = corpHeadCol[i]; lmbFade[li] = 1.0; lmbAct[li] = 1;
  }
}

// v10 campaign: hostile faction palette for enemies (null = classic look mirroring the hero's faction).
let hostileFac = null;
function enemyCol2() { return hostileFac ? hostileFac.c2 : (player && player.fac ? player.fac.c2 : "#ff5252"); }
function enemyCol1() { return hostileFac ? hostileFac.c1 : (player && player.fac ? player.fac.c1 : "#90a4ae"); }

// Deterministic per-body face/helmet state (shared by corpses and bisected halves).
function corpseHelmetOff(seed) { return (Math.imul(seed >>> 0, 2654435761) >>> 0) % 100 < 55; }

function spawnWeaponDrop(x, y, wpnId) {
  if (typeof CHAR_RAW === "undefined" || !CHAR_RAW[wpnId]) return;
  const rc = CHAR_RAW[wpnId];
  const bCol = getWeaponColor(wpnId);
  activeWeaponDrops.push({
    x, y,
    wpnId,
    name: rc[4],
    superName: rc[5],
    style: rc[6],
    bladeCol: bCol,
    spawnTime: runTime || 0
  });
}

function purgeRunMemory() {
  runActive = false; runPaused = false; runChunkDeltas.clear();
  activeForts.length = 0; activeMines.length = 0; movedBarricades.length = 0;
  activeBarriers.length = 0; activeWeaponDrops.length = 0;
  eAct.fill(0); eLegDmg.fill(0); eTailDmg.fill(0); eLegsLost.fill(0); eArmsLost.fill(0);
  eBleed.fill(0); eBleedRate.fill(0); eLevitate.fill(0); eLevZ.fill(0);
  mAct.fill(0); drAct.fill(0); corpAct.fill(0); corpRivalCid.fill(-1); lmbAct.fill(0);
  pAct.fill(0); pHit.fill(0); pBounce.fill(0); pSnap.fill(0); oAct.fill(0); oHome.fill(0); dAct.fill(0); ptAct.fill(0);
  pHitIdx.fill(-1); pDeflRolled.fill(0);
  eStun.fill(0); eSlow.fill(0); eShred.fill(0); eGrapple.fill(0); eLevVX.fill(0); eLevVY.fill(0);

  // FIX: these pools live in js/sim.js / js/combat.js and were never cleared, so bisected
  // halves, blast rings, slice scars and a mid-flight thrown blade carried over into the next
  // run (they piled up around the (256, 256) spawn point).
  if (typeof slAct !== "undefined") slAct.fill(0);
  if (typeof blAct !== "undefined") blAct.fill(0);
  if (typeof eScarHeat !== "undefined") {
    eScarHeat.fill(0); eScarAng.fill(0); eScarOffY.fill(0); eScarHitCD.fill(0); eKneel.fill(0);
  }
  if (typeof thrownBlade !== "undefined" && thrownBlade) {
    thrownBlade.active = false; thrownBlade.stage = 0; thrownBlade.timer = 0; thrownBlade.targetIdx = -1;
  }
  if (typeof forcePushVis !== "undefined" && forcePushVis) forcePushVis.timer = 0;
  flashAlpha = 0; flameVisTimer = 0; muzzleFlashTimer = 0;

  eUid.fill(0); eEcho.fill(0); eStagger.fill(0); eDummy.fill(0); ptHead = 0;
  v10Run(V10.onRunReset);

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

function spawnPt(x, y, vx, vy, life, size = 3, pal = 0, kind = 0) {
  const i = ptHead; ptHead = (ptHead + 1) % MAX_PT;
  ptX[i] = x; ptY[i] = y; ptVX[i] = vx; ptVY[i] = vy;
  ptLife[i] = life; ptMax[i] = life; ptSize[i] = size; ptCol[i] = pal; ptKind[i] = kind; ptAct[i] = 1;
  return i;
}

function spawnParticles(x, y, cnt = 5, pal = 0, size = 3, speedMul = 1) {
  if (opts.lowPart) cnt = Math.min(2, cnt);
  for (let k = 0; k < cnt; k++) {
    const a = Math.random() * Math.PI * 2, s = (40 + Math.random() * 90) * speedMul;
    spawnPt(x, y, Math.cos(a) * s, Math.sin(a) * s, 0.25 + Math.random() * 0.2, size, pal, 0);
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
      if (!isEnemy && muzzleOff > 0) {
        muzzleFlashTimer = 0.055;
        if (typeof fxOnPlayerShot === "function") fxOnPlayerShot(x, y, vx, vy, style, wpnId);
      }
      pVX[i] = vx; pVY[i] = vy; pDmg[i] = dmg; pLife[i] = life;
      pRad[i] = rad; pPrc[i] = prc; pStyle[i] = style; pSup[i] = sup;
      pEnemy[i] = isEnemy; pHit[i] = 0; pBounce[i] = 0; pSnap[i] = 0; pDeflRolled[i] = 0;
      pHitIdx.fill(-1, i * PROJ_HIT_SLOTS, (i + 1) * PROJ_HIT_SLOTS);
      pWpnId[i] = wpnId >= 0 ? wpnId : (player ? player.cid : 0);
      pAct[i] = 1; return;
    }
  }
}
// EOF:js/state.js
