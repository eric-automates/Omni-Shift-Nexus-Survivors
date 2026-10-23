// FILE: js/chaos.js
// PART: 5 of 14
// DETAIL: ChaosMath RNG, polygon/limb mutator, obstacle steering, Realistic Weapon/Saber/Ricochet/Snap Acoustics, and All 56 Individually Composed 8-Bit Character Themes.

"use strict";

const ChaosMath = {
  hash(seed) {
    let h = (seed ^ 0x6d2b79f5) >>> 0;
    h = Math.imul(h ^ (h >>> 15), h | 1);
    h ^= h + Math.imul(h ^ (h >>> 7), h | 61);
    return ((h ^ (h >>> 14)) >>> 0) / 4294967296;
  },
  range(seed, min, max) {
    return min + this.hash(seed) * (max - min);
  },
  int(seed, min, max) {
    return Math.floor(this.range(seed, min, max + 0.9999));
  },
  createRNG(seed) {
    let s = seed >>> 0;
    return () => {
      s = (s + 0x6d2b79f5) >>> 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  },
  polyPoints(seed, baseR, sides = 6, jitter = 0.22, waveMut = 0) {
    const pts = [];
    const actualSides = Math.max(3, Math.min(12, sides + Math.floor(waveMut * 0.5)));
    const rotOffset = this.range(seed + 11, 0, Math.PI * 2);
    const stretchX = this.range(seed + 23, 0.82, 1.22);
    const stretchY = this.range(seed + 37, 0.82, 1.22);
    for (let i = 0; i < actualSides; i++) {
      const baseAng = rotOffset + (i / actualSides) * Math.PI * 2;
      const angJitter = this.range(seed + i * 71, -0.14, 0.14);
      const radVar = 1 + this.range(seed + i * 131, -jitter, jitter);
      const mutSpike = (waveMut > 0 && i % 2 === 0)
        ? 1 + Math.min(0.65, waveMut * 0.06) * this.range(seed + i * 197, 0.3, 1.0) : 1.0;
      const r = baseR * radVar * mutSpike;
      pts.push({ x: Math.cos(baseAng + angJitter) * r * stretchX, y: Math.sin(baseAng + angJitter) * r * stretchY });
    }
    return pts;
  },
  movePattern(styleId, baseAngle, runTime, seed) {
    const phase = (seed % 100) * 0.1;
    if (styleId === 1) return baseAngle + Math.sin(runTime * 4.5 + phase) * 0.58;
    if (styleId === 2) return baseAngle + ((seed & 1) ? 0.48 : -0.48) + Math.cos(runTime * 2.8 + phase) * 0.25;
    if (styleId === 3) return baseAngle + Math.sin(runTime * 8.0 + phase) * 0.32;
    return baseAngle;
  },
  moveSpeedMul(styleId, runTime, seed) {
    if (styleId === 3) return Math.sin(runTime * 3.6 + (seed % 50)) > 0.45 ? 1.65 : 0.72;
    return styleId === 1 ? 1.08 : 1.0;
  },
  steerAround(ex, ey, tx, ty, obsList, steerStrength = 1.0, entitySeed = 1) {
    let dx = tx - ex, dy = ty - ey;
    const distToTarget = Math.hypot(dx, dy) || 1;
    let vx = dx / distToTarget, vy = dy / distToTarget;
    if (!obsList || obsList.length === 0 || steerStrength <= 0.01) return { vx, vy };
    const handedness = (entitySeed & 1) ? 1 : -1;
    let avoidX = 0, avoidY = 0;
    for (let i = 0; i < obsList.length; i++) {
      const ob = obsList[i], ox = ex - ob.x, oy = ey - ob.y;
      const d = Math.hypot(ox, oy) || 0.001, safeRad = (ob.rad || 22) + 28;
      if (d < safeRad) {
        const w = ((safeRad - d) / safeRad) * steerStrength;
        const nx = ox / d, ny = oy / d, tanX = -ny * handedness, tanY = nx * handedness;
        avoidX += (nx * 0.55 + tanX * 0.85) * w;
        avoidY += (ny * 0.55 + tanY * 0.85) * w;
      }
    }
    vx += avoidX; vy += avoidY;
    const mag = Math.hypot(vx, vy) || 1;
    return { vx: vx / mag, vy: vy / mag };
  }
};

function hashChunk(cx, cy) {
  const seed = (typeof runSeed !== "undefined" ? runSeed : 1337) ^ (cx * 73856093) ^ (cy * 19349663);
  return ChaosMath.createRNG(seed >>> 0);
}

/* === 2. REALISTIC RNG-VARIED ACOUSTIC SYNTHESIZER === */
let actx = null, ambTimer = 0, themeTimer = 0, themeStep = 0;

function ensureAudio() {
  const vol = (typeof opts !== "undefined" && typeof opts.vol === "number") ? opts.vol : 0.45;
  if (vol <= 0.01) return null;
  if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
  if (actx.state === "suspended") actx.resume();
  return actx;
}

function sfx(f1, f2, dur = 0.08, type = "sawtooth", gainMul = 0.2, jitterPct = 0.055) {
  try {
    const ac = ensureAudio();
    if (!ac) return;
    const vol = opts.vol;
    const j1 = 1 + (Math.random() - 0.5) * 2 * jitterPct;
    const j2 = 1 + (Math.random() - 0.5) * 2 * jitterPct;
    const dVar = Math.max(0.025, dur * (1 + (Math.random() - 0.5) * 0.12));
    const now = ac.currentTime;
    const osc = ac.createOscillator(), gain = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(22, f1 * j1), now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(22, f2 * j2), now + dVar);
    gain.gain.setValueAtTime(vol * gainMul, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dVar);
    osc.connect(gain); gain.connect(ac.destination);
    osc.start(now); osc.stop(now + dVar);
  } catch (e) {}
}

function sfxWeapon(style, wpnId = 0, isSaber = false) {
  try {
    const ac = ensureAudio();
    if (!ac) return;
    const now = ac.currentTime, vol = opts.vol;
    if (isSaber) {
      const swingPitch = 78 + Math.random() * 58, swingPeak = 165 + Math.random() * 115, dur = 0.19 + Math.random() * 0.09;
      const o1 = ac.createOscillator(), o2 = ac.createOscillator(), g = ac.createGain();
      o1.type = "sawtooth"; o2.type = "triangle";
      o1.frequency.setValueAtTime(swingPitch, now);
      o1.frequency.exponentialRampToValueAtTime(swingPeak, now + dur * 0.45);
      o1.frequency.exponentialRampToValueAtTime(swingPitch * 0.82, now + dur);
      o2.frequency.setValueAtTime(swingPitch * 1.98, now);
      o2.frequency.exponentialRampToValueAtTime(swingPeak * 1.5, now + dur * 0.5);
      g.gain.setValueAtTime(0.001, now);
      g.gain.linearRampToValueAtTime(vol * 0.24, now + dur * 0.35);
      g.gain.exponentialRampToValueAtTime(0.001, now + dur);
      o1.connect(g); o2.connect(g); g.connect(ac.destination);
      o1.start(now); o2.start(now); o1.stop(now + dur); o2.stop(now + dur);
      return;
    }
    if (wpnId === 52 || wpnId === 13) { sfx(1450, 180, 0.045, "square", 0.26, 0.04); sfx(240, 48, 0.075, "sawtooth", 0.22, 0.04); }
    else if (wpnId === 54) { sfx(980, 210, 0.065, "sawtooth", 0.22, 0.035); sfx(620, 130, 0.08, "square", 0.16, 0.04); }
    else if (wpnId === 15 || wpnId === 53 || wpnId === 28) { sfx(310, 52, 0.085, "sawtooth", 0.26, 0.04); sfx(1100, 420, 0.03, "triangle", 0.14, 0.05); }
    else if (wpnId === 51) { sfx(880, 165, 0.05, "triangle", 0.24, 0.03); }
    else if (style === "cone") { sfx(220, 55, 0.07, "square", 0.22, 0.05); }
    else if (style === "beam") { sfx(920, 240, 0.075, "sawtooth", 0.19, 0.045); }
    else if (style === "missile") { sfx(540, 190, 0.09, "sawtooth", 0.18, 0.06); }
    else if (style === "chain") { sfx(1150, 290, 0.065, "square", 0.18, 0.08); }
    else { sfx(380, 680, 0.08, "sine", 0.16, 0.07); }
  } catch (e) {}
}

function sfxRicochet() { sfx(1650, 2950, 0.045, "triangle", 0.16, 0.12); sfx(2600, 780, 0.065, "sine", 0.12, 0.12); }
function sfxSnap() { sfx(2100, 340, 0.038, "square", 0.20, 0.09); }

/* === 3. ALL 56 INDIVIDUALLY COMPOSED 8-BIT CHARACTER THEMES (#00-#55) ===
   Format: [tempoSec, waveType, [8-note lead melody Hz]] */
const CHARACTER_THEMES = [
  [0.24, "square",   [293, 440, 392, 349, 329, 587, 440, 392]], // #00 Twin-Sun Initiate
  [0.22, "triangle", [196, 293, 261, 220, 196, 146, 196, 220]], // #01 Beskar Tracker
  [0.19, "sawtooth", [196, 196, 196, 155, 233, 196, 155, 233]], // #02 Imperial March
  [0.26, "sawtooth", [146, 155, 146, 110, 146, 155, 185, 174]], // #03 Sith Sovereign
  [0.14, "square",   [523, 659, 880, 784, 987, 587, 784, 659]], // #04 R2 Chirp Arpeggio
  [0.25, "sawtooth", [130, 196, 174, 164, 146, 130, 196, 220]], // #05 Kashyyyk Roar
  [0.18, "square",   [329, 392, 440, 493, 587, 493, 440, 392]], // #06 Corellian Smuggler
  [0.26, "sawtooth", [220, 233, 277, 293, 277, 233, 220, 164]], // #07 Anupas Solar Phrygian
  [0.20, "square",   [261, 329, 392, 523, 493, 392, 329, 293]], // #08 Chevron-1 Fanfare
  [0.21, "sawtooth", [164, 196, 220, 196, 164, 146, 164, 220]], // #09 Serpent Jaffa March
  [0.23, "triangle", [392, 493, 587, 659, 587, 493, 440, 392]], // #10 Othala Sage Chime
  [0.25, "sawtooth", [185, 220, 207, 164, 146, 185, 164, 138]], // #11 Pegasus Hive Dirge
  [0.28, "triangle", [261, 392, 349, 329, 293, 392, 329, 261]], // #12 Hallowed Origin Chant
  [0.22, "triangle", [220, 246, 293, 329, 293, 246, 196, 220]], // #13 Browncoat Ballad
  [0.17, "triangle", [329, 392, 493, 587, 523, 493, 392, 329]], // #14 Miranda Music Box
  [0.20, "square",   [196, 246, 293, 392, 349, 293, 246, 196]], // #15 Hero of Canton
  [0.18, "triangle", [293, 370, 440, 587, 554, 440, 370, 293]], // #16 Soaring Leaf Breeze
  [0.15, "sawtooth", [110, 146, 116, 155, 123, 164, 110, 146]], // #17 Reaver Static Grind
  [0.26, "triangle", [164, 174, 207, 220, 246, 207, 174, 164]], // #18 Muad'Dib Desert Prophecy
  [0.19, "sawtooth", [130, 130, 196, 196, 174, 164, 130, 98]],  // #19 Sardaukar Throat Chant
  [0.27, "triangle", [246, 261, 311, 329, 311, 261, 246, 196]], // #20 Bene-Voice Litany
  [0.28, "sawtooth", [98,  116, 110, 92,  98,  130, 110, 87]],  // #21 Harkonnen Industrial Bass
  [0.21, "square",   [261, 329, 440, 523, 493, 392, 329, 587]], // #22 Starfleet Bridge Theme
  [0.20, "sawtooth", [130, 138, 130, 196, 185, 130, 138, 130]], // #23 Borg Collective Pulse
  [0.19, "sawtooth", [146, 220, 196, 293, 261, 220, 174, 146]], // #24 Klingon Warrior Anthem
  [0.18, "triangle", [220, 261, 293, 329, 392, 329, 293, 220]], // #25 Viper Watchtower Riff
  [0.21, "sawtooth", [174, 207, 233, 261, 233, 207, 174, 155]], // #26 Cylon Raider Sweep
  [0.20, "square",   [220, 329, 293, 440, 392, 329, 261, 220]], // #27 Spectre Normandy Synth
  [0.17, "square",   [196, 207, 196, 233, 196, 207, 261, 233]], // #28 Sulaco Motion Pulse
  [0.24, "sawtooth", [146, 164, 146, 110, 146, 196, 174, 146]], // #29 Yautja Jungle Percussion
  [0.22, "sawtooth", [164, 174, 233, 220, 164, 155, 138, 130]], // #30 Xeno-Queen Hive Suspense
  [0.18, "square",   [261, 261, 349, 440, 392, 349, 293, 261]], // #31 Klendathu Drop March
  [0.25, "triangle", [164, 196, 220, 246, 261, 246, 220, 196]], // #32 Spartan Gregorian Chant
  [0.14, "sawtooth", [82,  82,  164, 82,  82,  146, 82,  138]], // #33 Slayer Rip & Tear Riff
  [0.22, "sawtooth", [130, 155, 196, 233, 196, 155, 146, 130]], // #34 Astartes Gothic Crusade
  [0.21, "square",   [174, 220, 261, 277, 261, 220, 196, 174]], // #35 Omnissiah Organ Canticle
  [0.26, "sawtooth", [123, 146, 185, 164, 123, 110, 123, 146]], // #36 Tomb-World Gauss Hum
  [0.16, "square",   [146, 146, 196, 174, 146, 220, 196, 146]], // #37 Waaagh Warboss Stomp
  [0.23, "triangle", [207, 246, 311, 370, 329, 246, 207, 185]], // #38 Inquisitor Tarot Choir
  [0.16, "square",   [220, 293, 329, 440, 329, 293, 261, 220]], // #39 Zion Breakbeat Arpeggio
  [0.20, "sawtooth", [146, 146, 146, 174, 164, 146, 130, 110]], // #40 T-800 Brad Fiedel Pulse
  [0.28, "triangle", [261, 329, 392, 493, 440, 392, 329, 246]], // #41 Neon Rain Blues Synth
  [0.15, "sawtooth", [246, 293, 370, 440, 392, 370, 293, 246]], // #42 Sandevistan Hyper-Synth
  [0.23, "triangle", [196, 246, 293, 349, 329, 293, 246, 196]], // #43 Vault-Tec Ink Spots Swing
  [0.16, "sawtooth", [110, 110, 164, 146, 110, 174, 164, 146]], // #44 Doof-Wagon V8 Guitar
  [0.18, "square",   [164, 220, 246, 329, 293, 246, 220, 164]], // #45 Black-Mesa Hazard Pulse
  [0.17, "triangle", [246, 246, 246, 293, 329, 370, 329, 246]], // #46 Gallifrey Time-Vortex
  [0.21, "triangle", [196, 233, 293, 370, 349, 293, 233, 196]], // #47 Brinstar Chozo Fanfare
  [0.22, "sawtooth", [220, 261, 293, 311, 293, 261, 220, 196]], // #48 Witcher Slavic Hurdy-Lute
  [0.27, "triangle", [138, 164, 196, 233, 207, 164, 138, 116]], // #49 R'lyeh Deep-Sea Dissonance
  [0.25, "triangle", [196, 220, 261, 329, 293, 261, 220, 164]], // #50 Kenshi Scorched Cello
  [0.17, "sawtooth", [164, 164, 196, 164, 220, 196, 164, 146]], // #51 Baba Yaga Club Bassline
  [0.23, "square",   [329, 440, 329, 293, 261, 392, 329, 220]], // #52 Ennio Whistle & Whip
  [0.24, "triangle", [220, 261, 329, 293, 261, 246, 220, 164]], // #53 First Blood Brass Solitude
  [0.22, "sawtooth", [174, 185, 220, 174, 261, 233, 185, 174]], // #54 Slav-1 Bounty Tracker Motif
  [0.16, "sawtooth", [146, 174, 207, 233, 207, 174, 146, 110]]  // #55 General Kaleesh War March
];

const THEME_MOTIFS = CHARACTER_THEMES.slice(0, 10).map(t => t[2]);

function updateThemeMusic(rawDt) {
  if (typeof opts === "undefined" || !opts.amb || opts.vol <= 0.01) return;
  const mainScr = document.getElementById("scrMain");
  const lvlScr = document.getElementById("scrLevel");
  const pauseBar = document.getElementById("pauseBar");
  const onMainMenu = mainScr && mainScr.classList.contains("active");
  const onPauseMenu = lvlScr && lvlScr.classList.contains("active") && pauseBar && pauseBar.style.display !== "none";
  if (!onMainMenu && !onPauseMenu) return;

  const cid = (typeof meta !== "undefined" && typeof meta.selChar === "number") ? meta.selChar : 0;
  const spec = CHARACTER_THEMES[cid] || CHARACTER_THEMES[0];
  const tempo = spec[0], wave = spec[1], notes = spec[2];

  themeTimer += rawDt;
  if (themeTimer >= tempo) {
    themeTimer = 0;
    const freq = notes[themeStep % notes.length];
    themeStep++;
    sfx(freq, freq * 0.995, tempo * 0.78, wave, 0.072, 0.008);
    if (themeStep % 2 === 0) {
      sfx(freq * 0.5, freq * 0.5, tempo * 0.88, "triangle", 0.048, 0.005);
    }
  }
}
// EOF:js/chaos.js
