// FILE: js/state.js
// PART: 9 of 14
// DETAIL: Meta-Save localStorage persistence, Temporal Nexus speed scaling, Zero-GC TypedArray SoA pools, and entity spawners.

"use strict";

/* === 1. PERSISTENT META-STORAGE & OPTIONS === */
const META_KEY = "OMNISHIFT_META_V1";
let meta = {
  dmEarned: 0,
  dmSpent: 0,
  chars: [0],
  stages: [1],
  ranks: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  selChar: 0,
  selStage: 1,
  diff: 1
};

let opts = {
  zoom: 1.0,
  dmgNums: true,
  flash: true,
  lowPart: false,
  hiCon: true,
  fps: true,
  vol: 0.45,
  amb: true,
  joySize: 44,
  ttDelay: 350,
  hudFlip: false
};

let timeScale = 1.0;

function loadMeta() {
  try {
    const raw = localStorage.getItem(META_KEY);
    if (raw) {
      meta = { ...meta, ...JSON.parse(raw) };
      if (typeof meta.diff !== "number") meta.diff = 1;
    }
  } catch (e) {}
}

function saveMeta() {
  try {
    localStorage.setItem(META_KEY, JSON.stringify(meta));
  } catch (e) {}
  if (typeof updateMenuUI === "function") updateMenuUI();
}

function availDM() {
  return Math.max(0, meta.dmEarned - meta.dmSpent);
}

function respecAll() {
  meta.dmSpent = 0;
  meta.chars = [0];
  meta.ranks = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  meta.selChar = 0;
  saveMeta();
  sfx(280, 680, 0.22, "triangle");
}

function setTimeScale(delta, reset = false) {
  if (reset) {
    timeScale = 1.0;
  } else {
    timeScale = Math.max(0.1, +(timeScale + delta).toFixed(1));
  }
  const lbl = document.getElementById("timeScaleLbl");
  if (lbl) lbl.textContent = timeScale.toFixed(1) + "x";
  sfx(300 + timeScale * 80, 420 + timeScale * 80, 0.05, "sine", 0.12);
}

/* === 2. CANVAS & ZERO-GC SOA TYPEDARRAY POOLS === */
const cv = document.getElementById("cv");
const ctx = cv.getContext("2d");
let W = window.innerWidth;
let H = window.innerHeight;

function resize() {
  W = cv.width = window.innerWidth;
  H = cv.height = window.innerHeight;
}
window.addEventListener("resize", resize);
resize();

const MAX_E = 360, MAX_P = 520, MAX_O = 500, MAX_D = 140, MAX_PT = 240;

// Enemy Pools (with Wave Mutation, Stun, Grapple, Movement Style & Rival Hero ID)
const eX = new Float32Array(MAX_E), eY = new Float32Array(MAX_E),
      eVX = new Float32Array(MAX_E), eVY = new Float32Array(MAX_E),
      eHP = new Float32Array(MAX_E), eMax = new Float32Array(MAX_E),
      eSpd = new Float32Array(MAX_E), eSlow = new Float32Array(MAX_E),
      eShred = new Float32Array(MAX_E), eStun = new Float32Array(MAX_E),
      eGrapple = new Float32Array(MAX_E), eFireCD = new Float32Array(MAX_E),
      eSeed = new Uint32Array(MAX_E), eWave = new Uint16Array(MAX_E),
      eMoveStyle = new Uint8Array(MAX_E), eRivalCid = new Int16Array(MAX_E),
      eType = new Uint8Array(MAX_E), eAct = new Uint8Array(MAX_E);

// Projectile Pools (pEnemy=1 denotes enemy/rival projectiles stoppable by Goa'uld Repulsor)
const pX = new Float32Array(MAX_P), pY = new Float32Array(MAX_P),
      pVX = new Float32Array(MAX_P), pVY = new Float32Array(MAX_P),
      pDmg = new Float32Array(MAX_P), pLife = new Float32Array(MAX_P),
      pRad = new Float32Array(MAX_P), pPrc = new Int8Array(MAX_P),
      pStyle = new Uint8Array(MAX_P), pSup = new Uint8Array(MAX_P),
      pEnemy = new Uint8Array(MAX_P), pAct = new Uint8Array(MAX_P);

// Orb, Floating Text/Speech & Particle Pools
const oX = new Float32Array(MAX_O), oY = new Float32Array(MAX_O),
      oVal = new Float32Array(MAX_O), oAct = new Uint8Array(MAX_O);

const dX = new Float32Array(MAX_D), dY = new Float32Array(MAX_D),
      dVal = new Int32Array(MAX_D), dLife = new Float32Array(MAX_D),
      dCrit = new Uint8Array(MAX_D), dAct = new Uint8Array(MAX_D);
const dTxt = new Array(MAX_D).fill("");
const dCol = new Array(MAX_D).fill("#ffffff");

const ptX = new Float32Array(MAX_PT), ptY = new Float32Array(MAX_PT),
      ptVX = new Float32Array(MAX_PT), ptVY = new Float32Array(MAX_PT),
      ptLife = new Float32Array(MAX_PT), ptAct = new Uint8Array(MAX_PT);

/* === 3. RUN STATE & CHUNK MEMORY === */
let runChunkDeltas = new Map();
let activeForts = [];
let activeMines = [];
let movedBarricades = [];
let runActive = false, runPaused = false, runSeed = 1337, runTime = 0, waveNum = 1;
let rivalTimer = 0, fpsCount = 60, flashAlpha = 0, flameVisTimer = 0;
let player = null;
let joy = { act: false, id: -1, ox: 0, oy: 0, dx: 0, dy: 0 };
let pinchDist = 0;

function purgeRunMemory() {
  runActive = false;
  runPaused = false;
  runChunkDeltas.clear();
  activeForts.length = 0;
  activeMines.length = 0;
  movedBarricades.length = 0;
  eAct.fill(0);
  pAct.fill(0);
  oAct.fill(0);
  dAct.fill(0);
  ptAct.fill(0);
  player = null;
}

/* === 4. LIGHTWEIGHT ENTITY SPAWNERS === */
function spawnDmg(x, y, val, isCrit) {
  if (!opts.dmgNums) return;
  for (let i = 0; i < MAX_D; i++) {
    if (!dAct[i]) {
      dX[i] = x + (Math.random() - 0.5) * 14;
      dY[i] = y - 10;
      dVal[i] = Math.round(val);
      dTxt[i] = "";
      dCol[i] = isCrit ? "#ffd166" : "#ffffff";
      dLife[i] = 0.55;
      dCrit[i] = isCrit ? 1 : 0;
      dAct[i] = 1;
      return;
    }
  }
}

function spawnSpeech(x, y, text, color = "#ffd166", dur = 2.4) {
  for (let i = 0; i < MAX_D; i++) {
    if (!dAct[i]) {
      dX[i] = x;
      dY[i] = y - 28;
      dVal[i] = 0;
      dTxt[i] = text;
      dCol[i] = color;
      dLife[i] = dur;
      dCrit[i] = 2;
      dAct[i] = 1;
      return;
    }
  }
}

function spawnParticles(x, y, cnt = 5) {
  if (opts.lowPart) cnt = Math.min(2, cnt);
  for (let k = 0; k < cnt; k++) {
    for (let i = 0; i < MAX_PT; i++) {
      if (!ptAct[i]) {
        const a = Math.random() * Math.PI * 2;
        const s = 40 + Math.random() * 90;
        ptX[i] = x;
        ptY[i] = y;
        ptVX[i] = Math.cos(a) * s;
        ptVY[i] = Math.sin(a) * s;
        ptLife[i] = 0.25 + Math.random() * 0.2;
        ptAct[i] = 1;
        break;
      }
    }
  }
}

function spawnOrb(x, y, val) {
  for (let i = 0; i < MAX_O; i++) {
    if (!oAct[i]) {
      oX[i] = x;
      oY[i] = y;
      oVal[i] = val;
      oAct[i] = 1;
      return;
    }
  }
}

function spawnProj(x, y, vx, vy, dmg, life, rad, prc, style, sup, isEnemy = 0) {
  for (let i = 0; i < MAX_P; i++) {
    if (!pAct[i]) {
      pX[i] = x;
      pY[i] = y;
      pVX[i] = vx;
      pVY[i] = vy;
      pDmg[i] = dmg;
      pLife[i] = life;
      pRad[i] = rad;
      pPrc[i] = prc;
      pStyle[i] = style;
      pSup[i] = sup;
      pEnemy[i] = isEnemy;
      pAct[i] = 1;
      return;
    }
  }
}
