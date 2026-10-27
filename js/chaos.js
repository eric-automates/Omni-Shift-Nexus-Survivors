// FILE: js/chaos.js
// PART: 5 of 14
// DETAIL: v8.0 Overhaul — ChaosMath RNG, Movie-Accurate Acoustic Synth + Bespoke Dash & Saberstaff FX, 80 16-Note Alignment Themes (#00-#79: Vader, Maul, Windu, Yoda), and 500-Track Music Player.

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

/* === 2. MOVIE-ACCURATE WEB AUDIO SYNTHESIZER (Noise Buffers + Biquad Filters + Spell & Dash FX) === */
let actx = null, noiseBuf = null, themeTimer = 0, themeStep = 0;

// FIX: the AudioContext used to be created on page load (menu theme), before any user gesture,
// which browsers block with an autoplay-policy warning. Wait for the first interaction instead.
let audioUnlocked = false;
(function armAudioUnlock() {
  const unlock = () => {
    audioUnlocked = true;
    ["pointerdown", "keydown", "touchstart"].forEach(t => window.removeEventListener(t, unlock, true));
    try { if (actx && actx.state === "suspended") actx.resume(); } catch (e) {}
  };
  ["pointerdown", "keydown", "touchstart"].forEach(t => window.addEventListener(t, unlock, true));
})();

function ensureAudio() {
  const vol = (typeof opts !== "undefined" && typeof opts.vol === "number") ? opts.vol : 0.45;
  if (vol <= 0.01) return null;
  if (!audioUnlocked && !actx) return null;
  if (!actx) {
    actx = new (window.AudioContext || window.webkitAudioContext)();
    const sr = actx.sampleRate;
    noiseBuf = actx.createBuffer(1, sr, sr);
    const data = noiseBuf.getChannelData(0);
    for (let i = 0; i < sr; i++) data[i] = Math.random() * 2 - 1;
  }
  if (actx.state === "suspended") actx.resume();
  return actx;
}

function playNoise(dur = 0.12, filterType = "bandpass", freqStart = 1200, freqEnd = 300, q = 1.5, gainMul = 0.22) {
  try {
    const ac = ensureAudio();
    if (!ac || !noiseBuf) return;
    const now = ac.currentTime, vol = opts.vol;
    const d = Math.max(0.02, dur * (0.92 + Math.random() * 0.16));
    const src = ac.createBufferSource(), flt = ac.createBiquadFilter(), g = ac.createGain();
    src.buffer = noiseBuf; src.loop = true;
    flt.type = filterType; flt.Q.setValueAtTime(q, now);
    flt.frequency.setValueAtTime(Math.max(30, freqStart * (0.94 + Math.random() * 0.12)), now);
    flt.frequency.exponentialRampToValueAtTime(Math.max(30, freqEnd), now + d);
    g.gain.setValueAtTime(vol * gainMul, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + d);
    src.connect(flt); flt.connect(g); g.connect(ac.destination);
    src.start(now, Math.random() * 0.5); src.stop(now + d);
  } catch (e) {}
}

function sfx(f1, f2, dur = 0.08, type = "sawtooth", gainMul = 0.2, jitterPct = 0.055) {
  try {
    const ac = ensureAudio();
    if (!ac) return;
    if (f1 === 140 && f2 === 75) { sfxFlamethrower(dur); return; }
    if (f1 === 150 && f2 === 65) { sfxFlamethrower(dur); return; }
    if (f1 === 120 && f2 === 45) { sfxExplosion(1.0); return; }
    if (f1 === 170 && f2 === 55) {
      playNoise(0.045, "lowpass", 520, 90, 1.2, 0.16);
      sfxTone(165, 48, 0.05, "triangle", 0.15, 0.08);
      return;
    }
    sfxTone(f1, f2, dur, type, gainMul, jitterPct);
  } catch (e) {}
}

function sfxTone(f1, f2, dur = 0.08, type = "sawtooth", gainMul = 0.2, jitterPct = 0.055) {
  const ac = ensureAudio();
  if (!ac) return;
  const vol = opts.vol, now = ac.currentTime;
  const j1 = 1 + (Math.random() - 0.5) * 2 * jitterPct;
  const j2 = 1 + (Math.random() - 0.5) * 2 * jitterPct;
  const dVar = Math.max(0.022, dur * (1 + (Math.random() - 0.5) * 0.12));
  const osc = ac.createOscillator(), gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(Math.max(22, f1 * j1), now);
  osc.frequency.exponentialRampToValueAtTime(Math.max(22, f2 * j2), now + dVar);
  gain.gain.setValueAtTime(vol * gainMul, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + dVar);
  osc.connect(gain); gain.connect(ac.destination);
  osc.start(now); osc.stop(now + dVar);
}

function sfxFlamethrower(dur = 0.45) {
  playNoise(dur, "bandpass", 950, 260, 0.9, 0.34);
  playNoise(dur * 0.8, "lowpass", 320, 85, 1.4, 0.28);
  sfxTone(115, 52, dur * 0.9, "sawtooth", 0.14, 0.08);
}

function sfxExplosion(scale = 1.0) {
  playNoise(0.32 * scale, "lowpass", 480, 42, 0.8, 0.38);
  playNoise(0.18 * scale, "bandpass", 1400, 180, 1.5, 0.24);
  sfxTone(95, 24, 0.28 * scale, "sawtooth", 0.32, 0.06);
}

function sfxDisintegrate() {
  sfxTone(980, 180, 0.06, "sine", 0.18, 0.02);
  setTimeout(() => {
    sfxTone(135, 26, 0.42, "sawtooth", 0.38, 0.02);
    sfxTone(68, 22, 0.46, "triangle", 0.36, 0.02);
    playNoise(0.35, "bandpass", 1800, 110, 2.2, 0.32);
  }, 55);
}

function sfxForceLightning() {
  for (let k = 0; k < 3; k++) {
    setTimeout(() => {
      playNoise(0.055, "highpass", 2400, 900, 3.2, 0.22);
      sfxTone(1650 + Math.random() * 900, 140, 0.05, "sawtooth", 0.18, 0.14);
    }, k * 28);
  }
}

function sfxDash(dashStyle = "tacDash") {
  try {
    const ac = ensureAudio();
    if (!ac) return;
    if (dashStyle === "vaderLunge") {
      // Vader respirator-like low air draw + heavy crimson saber cleave
      playNoise(0.24, "bandpass", 420, 180, 2.2, 0.30);
      sfxTone(62, 148, 0.26, "sawtooth", 0.32, 0.03);
      setTimeout(() => sfxWeapon("orbit", 76, true), 90);
    } else if (dashStyle === "yodaFlip") {
      // Yoda rapid multi-flip Ataru Force whoosh + high-speed shoto hums
      [0, 75, 150].forEach((ms, idx) => {
        setTimeout(() => {
          sfxTone(135 + idx * 45, 340 + idx * 60, 0.11, "triangle", 0.24, 0.04);
          playNoise(0.08, "bandpass", 1400, 480, 1.8, 0.18);
        }, ms);
      });
    } else if (dashStyle === "maulSpin") {
      // Maul double-bladed saberstaff butterfly-twist Doppler spin
      [0, 65, 130].forEach((ms) => {
        setTimeout(() => {
          sfxTone(78, 210, 0.12, "sawtooth", 0.26, 0.04);
          sfxTone(158, 92, 0.12, "triangle", 0.20, 0.04);
        }, ms);
      });
    } else if (dashStyle === "vaapadBlitz") {
      // Mace Windu superconducting Vaapad electric purple blitz
      playNoise(0.18, "highpass", 2200, 620, 2.5, 0.26);
      sfxTone(104, 290, 0.22, "sawtooth", 0.28, 0.03);
      sfxTone(620, 180, 0.16, "square", 0.18, 0.04);
    } else if (dashStyle === "jetpackSlam") {
      // Boba / Mando Jetpack Rocket-Jump ignition + landing blast
      playNoise(0.32, "bandpass", 1100, 280, 1.1, 0.34);
      sfxTone(180, 420, 0.24, "sawtooth", 0.22, 0.04);
    } else if (dashStyle === "apparitionBlink") {
      // Wizarding Apparition sharp vacuum crack + smoke pop
      playNoise(0.06, "highpass", 3400, 800, 3.0, 0.36);
      sfxTone(1450, 95, 0.12, "sawtooth", 0.28, 0.03);
    } else {
      playNoise(0.14, "bandpass", 1600, 420, 1.6, 0.24);
      sfxTone(240, 580, 0.14, "triangle", 0.20, 0.04);
    }
  } catch (e) {}
}

function sfxSpell(spellType = "wand") {
  try {
    const ac = ensureAudio();
    if (!ac) return;
    if (spellType === "avada") {
      playNoise(0.18, "bandpass", 3200, 420, 2.8, 0.34);
      sfxTone(1880, 95, 0.22, "sawtooth", 0.32, 0.05);
      sfxTone(140, 32, 0.28, "square", 0.26, 0.03);
    } else if (spellType === "patronus" || spellType === "leviosa") {
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
        setTimeout(() => sfxTone(freq, freq * 1.06, 0.32, "sine", 0.12, 0.01), idx * 25);
      });
    } else if (spellType === "sectum") {
      playNoise(0.09, "highpass", 3600, 950, 3.5, 0.28);
      sfxTone(1420, 260, 0.08, "triangle", 0.24, 0.04);
    } else if (spellType === "youShallNotPass") {
      playNoise(0.38, "lowpass", 620, 45, 1.1, 0.40);
      sfxTone(110, 28, 0.42, "sawtooth", 0.36, 0.03);
      sfxTone(440, 220, 0.32, "triangle", 0.22, 0.02);
    } else if (spellType === "raiseDead") {
      [0, 35, 70].forEach((d, idx) => {
        setTimeout(() => {
          playNoise(0.04, "bandpass", 2600 - idx * 300, 1200, 4.0, 0.20);
          sfxTone(180 + idx * 90, 320 + idx * 110, 0.14, "triangle", 0.18, 0.04);
        }, d);
      });
    } else {
      playNoise(0.048, "bandpass", 2900, 780, 2.6, 0.20);
      sfxTone(980, 1640, 0.065, "sine", 0.16, 0.05);
    }
  } catch (e) {}
}

function sfxWeapon(style, wpnId = 0, isSaber = false) {
  try {
    const ac = ensureAudio();
    if (!ac) return;
    const now = ac.currentTime, vol = opts.vol;
    if (wpnId >= 56 && wpnId <= 75 && !isSaber) {
      if (wpnId === 70) sfxSpell("avada");
      else if (wpnId === 67) sfxSpell("sectum");
      else if (wpnId === 75) sfxSpell("raiseDead");
      else if (wpnId === 59 || wpnId === 69 || wpnId === 71) sfxSpell("patronus");
      else sfxSpell("wand");
      return;
    }
    if (isSaber) {
      if ([18, 19, 24, 48, 50, 67, 71].includes(wpnId)) {
        playNoise(0.14, "bandpass", 1800, 420, 2.2, 0.25);
        sfxTone(540, 180, 0.11, "triangle", 0.18, 0.08);
        sfxTone(2400, 1650, 0.06, "sine", 0.08, 0.05);
        return;
      }
      // Bespoke Lightsaber Hum Profiles (#76 Vader 62Hz, #77 Maul 78Hz, #78 Windu 104Hz, #79 Yoda 124Hz)
      const baseMap = { 3: 68, 55: 88, 76: 62, 77: 78, 78: 104, 79: 124 };
      const baseH = (baseMap[wpnId] || 92) + (Math.random() - 0.5) * 20;
      const peakH = baseH * (wpnId === 77 ? 2.15 : (1.85 + Math.random() * 0.50));
      const dur = wpnId === 79 ? 0.16 : (0.21 + Math.random() * 0.08);
      const o1 = ac.createOscillator(), o2 = ac.createOscillator(), flt = ac.createBiquadFilter(), g = ac.createGain();
      o1.type = "sawtooth"; o2.type = "triangle";
      flt.type = "lowpass"; flt.frequency.setValueAtTime(420, now);
      flt.frequency.exponentialRampToValueAtTime(1450, now + dur * 0.42);
      flt.frequency.exponentialRampToValueAtTime(360, now + dur);
      o1.frequency.setValueAtTime(baseH, now);
      o1.frequency.exponentialRampToValueAtTime(peakH, now + dur * 0.42);
      o1.frequency.exponentialRampToValueAtTime(baseH * 0.86, now + dur);
      o2.frequency.setValueAtTime(baseH * (wpnId === 77 ? 2.45 : 2.02), now);
      o2.frequency.exponentialRampToValueAtTime(peakH * 1.65, now + dur * 0.45);
      g.gain.setValueAtTime(0.001, now);
      g.gain.linearRampToValueAtTime(vol * 0.28, now + dur * 0.35);
      g.gain.exponentialRampToValueAtTime(0.001, now + dur);
      o1.connect(flt); o2.connect(flt); flt.connect(g); g.connect(ac.destination);
      o1.start(now); o2.start(now); o1.stop(now + dur); o2.stop(now + dur);
      playNoise(dur * 0.85, "bandpass", 650, 220, 1.8, 0.14);
      return;
    }
    if (wpnId === 54 && style === "missile") {
      playNoise(0.28, "bandpass", 1400, 280, 1.1, 0.32);
      sfxTone(380, 95, 0.24, "sawtooth", 0.24, 0.05);
      return;
    }
    if (wpnId === 54) {
      [0, 0.026, 0.052].forEach((delay, idx) => {
        setTimeout(() => {
          sfxTone(1380 - idx * 140, 240, 0.048, "sawtooth", 0.22, 0.03);
          sfxTone(680, 135, 0.052, "square", 0.14, 0.03);
        }, delay * 1000);
      });
      playNoise(0.05, "bandpass", 2200, 600, 2.5, 0.16);
      return;
    }
    if (wpnId === 3 || wpnId === 11 || wpnId === 38 || wpnId === 49 || style === "chain") { sfxForceLightning(); return; }
    if (wpnId === 52 || wpnId === 13) {
      playNoise(0.065, "bandpass", 2800, 480, 1.2, 0.34);
      sfxTone(1600, 170, 0.048, "square", 0.25, 0.035);
      sfxTone(260, 52, 0.085, "sawtooth", 0.24, 0.035);
      return;
    }
    if (wpnId === 51) {
      playNoise(0.055, "highpass", 1800, 520, 1.5, 0.28);
      sfxTone(940, 145, 0.052, "triangle", 0.26, 0.03);
      sfxTone(190, 58, 0.06, "square", 0.18, 0.03);
      return;
    }
    if ([15, 28, 31, 34, 37, 53].includes(wpnId)) {
      playNoise(0.08, "lowpass", 1600, 240, 1.0, 0.32);
      sfxTone(320, 48, 0.085, "sawtooth", 0.26, 0.04);
      sfxTone(1350, 480, 0.028, "triangle", 0.15, 0.04);
      return;
    }
    if ([33, 44].includes(wpnId) || style === "cone") {
      playNoise(0.11, "lowpass", 1200, 140, 0.9, 0.36);
      sfxTone(210, 42, 0.095, "square", 0.26, 0.05);
      return;
    }
    if ([0, 2, 6, 7, 9, 10, 19, 22, 32, 36, 40, 41, 43, 45, 47].includes(wpnId) || style === "beam") {
      const hi = wpnId === 6 ? 1520 : (wpnId === 40 ? 1180 : 1320);
      sfxTone(hi, 195, 0.078, "sawtooth", 0.22, 0.04);
      sfxTone(hi * 0.5, 92, 0.082, "triangle", 0.16, 0.04);
      playNoise(0.04, "bandpass", 2400, 700, 3.0, 0.12);
      return;
    }
    if (style === "missile") {
      playNoise(0.16, "bandpass", 1500, 320, 1.4, 0.26);
      sfxTone(520, 140, 0.14, "sawtooth", 0.19, 0.05);
    } else {
      playNoise(0.09, "bandpass", 900, 220, 1.6, 0.18);
      sfxTone(380, 680, 0.085, "sine", 0.17, 0.06);
    }
  } catch (e) {}
}

function sfxRicochet() {
  playNoise(0.035, "highpass", 3200, 1200, 3.5, 0.18);
  sfxTone(1750, 3100, 0.048, "triangle", 0.18, 0.10);
  sfxTone(2800, 680, 0.075, "sine", 0.14, 0.10);
}

function sfxSnap() {
  playNoise(0.032, "bandpass", 3600, 900, 2.8, 0.26);
  sfxTone(2300, 320, 0.036, "square", 0.22, 0.08);
}

/* === 3. ALL 80 BESPOKE 16-NOTE ALIGNMENT CHARACTER THEMES (#00-#79) === */
const CHARACTER_THEMES = [
  [0.21,"square",  [293,293,392,587,523,493,440,784,587,523,493,440,784,587,523,493]],
  [0.20,"sawtooth",[146,146,220,196,174,146,130,146,146,220,261,233,196,174,146,130]],
  [0.21,"sawtooth",[196,196,196,155,233,196,155,233,196,293,293,293,311,233,185,155]],
  [0.24,"sawtooth",[146,155,146,110,146,155,185,174,146,155,220,207,185,155,146,110]],
  [0.15,"square",  [523,659,784,1046,987,784,659,523,587,784,880,1174,1046,880,784,659]],
  [0.20,"square",  [196,261,293,392,349,293,261,196,220,293,329,440,392,329,293,261]],
  [0.18,"sawtooth",[164,196,220,246,293,246,220,196,164,220,261,293,329,293,220,164]],
  [0.23,"sawtooth",[164,174,207,220,207,174,164,146,164,174,246,220,207,174,164,130]],
  [0.19,"square",  [261,329,392,523,493,440,392,329,349,440,523,659,587,523,392,523]],
  [0.22,"sawtooth",[146,146,174,196,174,146,130,110,146,174,220,207,174,146,130,146]],
  [0.20,"triangle",[392,440,493,587,659,587,493,392,440,523,587,784,659,587,493,392]],
  [0.23,"sawtooth",[138,164,155,123,138,185,164,123,138,164,207,196,164,155,138,110]],
  [0.24,"sawtooth",[130,155,196,185,155,130,116,130,155,196,233,220,196,155,146,130]],
  [0.19,"triangle",[220,261,293,392,349,293,261,220,246,293,329,440,392,329,293,220]],
  [0.17,"square",  [329,392,493,659,587,493,392,329,370,440,587,784,659,587,493,392]],
  [0.19,"sawtooth",[146,196,220,261,220,196,174,146,164,220,246,293,261,220,196,146]],
  [0.17,"square",  [293,370,440,587,523,440,370,293,329,392,493,659,587,493,440,587]],
  [0.16,"sawtooth",[110,116,146,110,155,146,116,98, 110,116,164,155,146,116,110,92]],
  [0.20,"square",  [220,261,329,440,392,329,293,261,293,349,440,523,493,440,329,440]],
  [0.21,"sawtooth",[130,130,155,146,130,98, 116,130,130,174,164,155,130,116,98, 130]],
  [0.20,"triangle",[261,329,392,493,440,392,329,261,293,370,440,587,523,440,392,523]],
  [0.24,"sawtooth",[98, 103,130,116,98, 87, 98, 116,98, 103,146,130,116,103,98, 82]],
  [0.18,"square",  [261,349,440,523,493,392,329,587,523,440,392,659,587,523,440,523]],
  [0.20,"sawtooth",[130,138,130,110,130,164,155,130,130,138,185,174,155,138,130,103]],
  [0.19,"square",  [196,261,293,392,349,293,261,392,440,392,349,293,349,392,440,523]],
  [0.18,"square",  [293,349,440,587,523,440,392,349,392,440,523,659,587,523,440,587]],
  [0.21,"sawtooth",[146,155,196,185,155,146,130,116,146,155,220,207,185,155,146,110]],
  [0.19,"square",  [261,329,392,523,587,523,392,329,349,440,523,659,587,523,440,523]],
  [0.18,"square",  [220,261,329,440,392,329,293,220,261,329,392,523,493,440,392,440]],
  [0.20,"sawtooth",[146,146,220,174,164,146,130,146,164,220,261,220,196,174,146,130]],
  [0.22,"sawtooth",[123,130,164,155,130,123,110,98, 123,130,185,174,155,130,123,103]],
  [0.18,"square",  [261,261,349,440,523,440,392,349,392,440,523,587,523,440,392,523]],
  [0.20,"triangle",[220,261,293,329,392,349,329,293,329,392,440,523,493,440,392,440]],
  [0.15,"sawtooth",[110,110,220,110,196,110,174,146,110,110,261,233,220,196,174,146]],
  [0.19,"square",  [196,246,293,392,349,293,246,196,220,261,329,440,392,329,293,392]],
  [0.20,"square",  [220,261,329,392,440,392,329,261,293,349,440,523,493,440,392,440]],
  [0.23,"sawtooth",[123,130,164,146,123,110,103,123,130,185,164,146,130,123,110,98]],
  [0.17,"sawtooth",[130,130,174,155,130,196,174,130,146,146,196,174,155,146,130,110]],
  [0.19,"square",  [246,293,370,493,440,370,329,293,329,392,493,587,523,493,392,493]],
  [0.17,"square",  [261,329,392,523,659,523,392,329,293,370,440,587,659,587,440,523]],
  [0.20,"sawtooth",[146,146,146,174,164,146,130,130,146,146,146,220,196,174,164,146]],
  [0.20,"sawtooth",[164,220,246,293,261,220,196,164,174,220,261,329,293,246,220,164]],
  [0.16,"sawtooth",[196,246,293,392,370,293,246,196,220,261,329,440,392,329,261,196]],
  [0.19,"triangle",[261,329,392,440,523,440,392,329,349,440,523,587,523,440,392,523]],
  [0.17,"square",  [196,246,293,392,440,392,293,246,220,293,349,440,493,440,349,392]],
  [0.18,"square",  [220,293,329,440,392,329,293,220,261,329,392,523,493,440,392,440]],
  [0.17,"triangle",[246,293,370,493,440,370,329,246,293,370,440,587,523,440,370,493]],
  [0.19,"square",  [261,329,392,523,587,523,440,392,349,440,523,659,587,523,440,523]],
  [0.19,"sawtooth",[164,196,220,261,246,220,196,164,174,220,246,293,261,246,220,164]],
  [0.24,"sawtooth",[116,123,155,146,123,116,98, 92, 116,123,174,164,146,123,116,87]],
  [0.20,"sawtooth",[146,174,220,261,220,196,174,146,164,196,246,293,261,220,174,146]],
  [0.16,"sawtooth",[164,164,220,164,246,220,196,164,164,164,261,246,220,196,174,164]],
  [0.20,"square",  [220,293,220,196,174,261,220,146,220,293,329,293,261,349,293,220]],
  [0.19,"square",  [220,261,329,440,392,329,261,220,246,293,392,493,440,392,329,440]],
  [0.19,"sawtooth",[146,146,220,174,207,196,164,146,146,146,261,233,220,174,164,146]],
  [0.17,"sawtooth",[130,138,174,164,138,130,110,98, 130,138,196,185,164,138,130,103]],
  // #56-#75 Arcane Sanctum Spellcasters
  [0.19,"triangle",[493,659,784,740,659,987,880,740,659,784,740,622,659,493,659,784]], // #56 Harry
  [0.17,"triangle",[523,659,784,987,880,784,659,587,659,784,1046,987,880,784,659,523]], // #57 Hermione
  [0.18,"square",  [293,370,440,587,523,440,370,329,293,370,440,659,587,493,440,293]], // #58 Ron
  [0.21,"triangle",[587,698,880,1046,987,880,698,659,587,740,880,1174,1046,880,698,587]], // #59 Luna
  [0.18,"square",  [261,329,392,523,587,523,440,392,329,392,493,659,587,523,392,261]], // #60 Cedric
  [0.23,"triangle",[146,196,220,261,246,220,196,164,146,196,246,293,261,220,196,146]], // #61 Hagrid
  [0.20,"sawtooth",[164,196,246,233,196,164,146,130,164,196,261,246,220,196,164,146]], // #62 Draco
  [0.20,"triangle",[220,261,329,392,370,329,261,246,220,293,349,440,392,329,261,220]], // #63 Lupin
  [0.18,"sawtooth",[196,233,293,349,329,293,233,196,220,261,329,392,349,293,233,196]], // #64 Sirius
  [0.19,"sawtooth",[146,185,220,261,246,220,185,146,164,196,246,293,261,220,185,146]], // #65 Moody
  [0.18,"square",  [329,392,493,587,659,587,493,392,349,440,523,659,587,493,392,329]], // #66 McGonagall
  [0.21,"sawtooth",[146,174,220,207,174,164,146,130,146,185,233,220,185,164,146,110]], // #67 Snape
  [0.17,"sawtooth",[155,185,233,220,185,155,138,123,155,196,246,233,196,155,138,110]], // #68 Bellatrix
  [0.20,"triangle",[392,493,587,784,740,659,587,493,440,523,659,880,784,659,587,392]], // #69 Dumbledore
  [0.23,"sawtooth",[110,116,146,138,116,110,98, 87, 110,130,164,155,130,116,110,82]],  // #70 Voldemort
  [0.19,"square",  [261,329,392,523,659,587,523,392,349,440,523,698,659,523,392,261]], // #71 Gandalf
  [0.22,"sawtooth",[130,130,155,196,185,155,130,110,130,130,174,220,196,155,130,98]],  // #72 Saruman
  [0.18,"triangle",[329,392,493,622,587,493,392,329,370,440,554,659,587,493,392,329]], // #73 Doctor Strange
  [0.19,"sawtooth",[196,233,293,311,293,233,196,174,196,246,311,349,311,246,196,164]], // #74 Scarlet Witch
  [0.22,"sawtooth",[116,138,164,155,138,116,103,92, 116,146,185,174,146,138,116,87]],  // #75 Necromancer
  // #76-#79 Star Wars Legends Themes
  [0.22,"sawtooth",[196,196,196,155,233,196,155,233,196,293,293,293,311,233,185,155]], // #76 Darth Vader (Imperial March)
  [0.15,"sawtooth",[146,164,174,146,164,174,146,164,220,233,220,196,174,164,146,130]], // #77 Darth Maul (Duel of the Fates)
  [0.18,"square",  [196,220,261,293,349,329,293,261,220,261,329,392,349,293,261,196]], // #78 Mace Windu (Vaapad Shatterpoint)
  [0.17,"triangle",[261,293,329,392,440,392,329,293,329,392,523,493,440,392,329,261]]  // #79 Grandmaster Yoda (Force/Ataru)
];

/* ============================================================================
   NOTE FOR TRACK NAMING & AUTOMATIC SHUFFLE (UP TO 500 TRACKS):
   ----------------------------------------------------------------------------
   FORMAT:
     music/track_<Number>_<Genre>_<Song-Name>.mp3
   ============================================================================ */

const CUSTOM_TRACK_LIST = [
  "track_1_Electronic_Star_Birth.mp3",
  "track_2_Synthwave_Hello_World.mp3",
  "track_3_Beats_Darkstar.mp3"
];

const AUTO_GENRES = [
  "Chill", "Electronic", "Dubstep", "Synthwave", "Rock",
  "Metal", "Ambient", "Techno", "LoFi", "Action"
];

let runAudio = new Audio();
runAudio.preload = "auto";
let runAudioFailed = false;
let MASTER_TRACKS = [];
let enabledGenres = new Set();
let activeQueue = [];
let playedHistory = [];
let currentTrack = null;
let playlistInitialized = false, isDiscoveringMusic = false;
let userPausedMusic = false, repeatOneMode = false;
let fadeAnimId = 0, currentFadeMode = "none";
let lastBackTapTime = 0, toastHideTimer = null;

function clampVol(v) {
  return Math.max(0, Math.min(1, Number.isFinite(v) ? v : 0));
}

function parseTrackMetadata(urlOrName, fallbackNum = 1) {
  const rawFile = decodeURIComponent(String(urlOrName).split("/").pop().split("?")[0]);
  const noExt = rawFile.replace(/\.(mp3|ogg|wav|m4a)$/i, "");
  const m = noExt.match(/^track_(\d+)(?:_([^_]+))?(?:_(.+))?$/i);
  if (m) {
    const num = parseInt(m[1], 10) || fallbackNum;
    const rawGenre = m[2] ? m[2].replace(/-/g, " ").trim() : "OST";
    const rawTitle = m[3] ? m[3].replace(/[-_]+/g, " ").trim() : `Track ${num}`;
    const fmtGenre = rawGenre.charAt(0).toUpperCase() + rawGenre.slice(1);
    const fmtTitle = rawTitle.replace(/\b\w/g, c => c.toUpperCase());
    return {
      url: urlOrName.includes("/") ? urlOrName : ("music/" + rawFile),
      fileName: rawFile,
      num,
      genre: fmtGenre,
      title: fmtTitle,
      label: `${fmtTitle} (${fmtGenre})`
    };
  }
  const cleanTitle = noExt.replace(/[-_]+/g, " ").trim().replace(/\b\w/g, c => c.toUpperCase()) || `Track ${fallbackNum}`;
  return {
    url: urlOrName.includes("/") ? urlOrName : ("music/" + rawFile),
    fileName: rawFile,
    num: fallbackNum,
    genre: "OST",
    title: cleanTitle,
    label: `${cleanTitle} (OST)`
  };
}

async function enrichTrackFromID3(meta) {
  if (!meta || meta.title !== `Track ${meta.num}`) return;
  try {
    const res = await fetch(meta.url, { headers: { Range: "bytes=0-16384" } });
    if (!res.ok) return;
    const bytes = new Uint8Array(await res.arrayBuffer());
    if (bytes[0] !== 0x49 || bytes[1] !== 0x44 || bytes[2] !== 0x33) return;
    const text = new TextDecoder("latin1").decode(bytes);
    const readFrame = (id) => {
      const idx = text.indexOf(id);
      if (idx === -1 || idx + 11 >= bytes.length) return "";
      const size = (bytes[idx + 4] << 21) | (bytes[idx + 5] << 14) | (bytes[idx + 6] << 7) | bytes[idx + 7];
      if (size <= 1 || size > 120) return "";
      return text.slice(idx + 10, idx + 10 + size).replace(/[\x00-\x1f]+/g, "").trim();
    };
    const id3Title = readFrame("TIT2");
    const id3Genre = readFrame("TCON");
    if (id3Title && id3Title.length > 1) meta.title = id3Title;
    if (id3Genre && id3Genre.length > 1 && !/^\(\d+\)$/.test(id3Genre)) {
      meta.genre = id3Genre;
      enabledGenres.add(id3Genre);
    }
    meta.label = `${meta.title} (${meta.genre})`;
    if (currentTrack && currentTrack.url === meta.url) showMusicToast(meta);
    renderGenreFilterList();
  } catch (e) {}
}

async function checkFileExists(url) {
  try {
    const res = await fetch(url, { method: "HEAD" });
    if (res.ok) return true;
    if (res.status === 404 || res.status === 410) return false;   // FIX: don't re-request a known-missing file
  } catch (e) {}
  try {
    const res2 = await fetch(url, { headers: { Range: "bytes=0-1" } });
    return res2.ok;
  } catch (e) {
    return false;
  }
}

async function discoverMusicFiles() {
  if (isDiscoveringMusic) return;
  isDiscoveringMusic = true;
  const foundMap = new Map();

  let highestListed = 0;
  for (let i = 0; i < CUSTOM_TRACK_LIST.length; i++) {
    const raw = CUSTOM_TRACK_LIST[i].trim();
    if (!raw) continue;
    const url = raw.startsWith("music/") ? raw : ("music/" + raw);
    if (await checkFileExists(url)) {
      const meta = parseTrackMetadata(url, i + 1);
      foundMap.set(meta.num + "_" + meta.fileName, meta);
      highestListed = Math.max(highestListed, meta.num || 0);
    }
  }

  // FIX: start probing after the numbers CUSTOM_TRACK_LIST already covers. Slot 1 used to be probed
  // with 11 name variants (22 requests, all 404) even though track_1_... was in the list.
  for (let i = highestListed + 1; i <= 500; i++) {
    let matchedInSlot = false;
    const plainUrl = `music/track_${i}.mp3`;
    if (await checkFileExists(plainUrl)) {
      const meta = parseTrackMetadata(plainUrl, i);
      foundMap.set(String(i), meta);
      enrichTrackFromID3(meta);
      matchedInSlot = true;
    } else {
      for (let g = 0; g < AUTO_GENRES.length; g++) {
        const gUrl = `music/track_${i}_${AUTO_GENRES[g]}.mp3`;
        if (await checkFileExists(gUrl)) {
          const meta = parseTrackMetadata(gUrl, i);
          foundMap.set(String(i), meta);
          enrichTrackFromID3(meta);
          matchedInSlot = true;
          break;
        }
      }
    }
    if (!matchedInSlot) break;
  }

  if (foundMap.size === 0 && (await checkFileExists("music/roguelike_active_run_music.mp3"))) {
    foundMap.set("fallback", parseTrackMetadata("music/roguelike_active_run_music.mp3", 1));
  }

  if (foundMap.size > 0) {
    MASTER_TRACKS = Array.from(foundMap.values()).sort((a, b) => a.num - b.num);
    if (enabledGenres.size === 0) {
      MASTER_TRACKS.forEach(t => enabledGenres.add(t.genre));
    } else {
      MASTER_TRACKS.forEach(t => {
        if (!playlistInitialized) enabledGenres.add(t.genre);
      });
    }
    if (window.trackProgress && !playlistInitialized) {
      window.trackProgress(`Music auto-discovery complete: ${MASTER_TRACKS.length} track(s) ready.`);
    }
  }

  playlistInitialized = true;
  isDiscoveringMusic = false;
  if (activeQueue.length === 0 && MASTER_TRACKS.length > 0) rebuildShuffleQueue();
  renderGenreFilterList();
}

function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function rebuildShuffleQueue() {
  let pool = MASTER_TRACKS.filter(t => enabledGenres.has(t.genre));
  if (pool.length === 0) pool = [...MASTER_TRACKS];
  activeQueue = shuffleArray(pool);
  if (currentTrack && activeQueue.length > 1 && activeQueue[0].url === currentTrack.url) {
    activeQueue.push(activeQueue.shift());
  }
}

async function getNextTrackMeta() {
  if (!playlistInitialized) await discoverMusicFiles();
  // FIX: re-shuffle the known tracks when the queue runs dry. Discovery (and its burst of 404
  // probes) used to re-run every time the 3-track queue emptied.
  if (activeQueue.length === 0) rebuildShuffleQueue();
  return activeQueue.shift() || MASTER_TRACKS[0] || null;
}

function showMusicToast(trackMeta) {
  if (!trackMeta) return;
  const toast = document.getElementById("nexus-music-toast");
  const titleEl = document.getElementById("nexus-Player-Title");
  if (titleEl) titleEl.textContent = trackMeta.label;
  if (!toast) return;
  toast.innerHTML = `<span style="color:#ffd166">🎵</span> <b>${trackMeta.title}</b> <span style="color:#00e5ff">(${trackMeta.genre})</span>`;
  toast.style.opacity = "1";
  toast.style.transform = "translateY(0)";
  clearTimeout(toastHideTimer);
  toastHideTimer = setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(8px)";
  }, 3800);
}

function fadeInAudio(audioElem, targetVol, duration = 1800) {
  if (!audioElem) return;
  cancelAnimationFrame(fadeAnimId);
  currentFadeMode = "in";
  const safeTarget = clampVol(targetVol);
  const startVol = clampVol(audioElem.volume);
  const startTime = performance.now();

  function step(now) {
    if (currentFadeMode !== "in" || audioElem.paused) return;
    const elapsed = Math.max(0, now - startTime);
    const progress = Math.min(1, elapsed / Math.max(1, duration));
    audioElem.volume = clampVol(startVol + (safeTarget - startVol) * progress);
    if (progress < 1) {
      fadeAnimId = requestAnimationFrame(step);
    } else {
      currentFadeMode = "none";
    }
  }
  fadeAnimId = requestAnimationFrame(step);
}

function fadeOutAndPauseAudio(audioElem, duration = 1200) {
  if (!audioElem || audioElem.paused || currentFadeMode === "out") return;
  cancelAnimationFrame(fadeAnimId);
  currentFadeMode = "out";
  const startVol = clampVol(audioElem.volume);
  const startTime = performance.now();

  function step(now) {
    if (currentFadeMode !== "out") return;
    const elapsed = Math.max(0, now - startTime);
    const progress = Math.min(1, elapsed / Math.max(1, duration));
    audioElem.volume = clampVol(startVol * (1 - progress));
    if (progress < 1) {
      fadeAnimId = requestAnimationFrame(step);
    } else {
      currentFadeMode = "none";
      audioElem.pause();
    }
  }
  fadeAnimId = requestAnimationFrame(step);
}

runAudio.onended = () => {
  if (repeatOneMode && currentTrack) {
    runAudio.currentTime = 0;
    runAudio.play().catch(() => {});
    showMusicToast(currentTrack);
  } else {
    skipTrackForward();
  }
};

runAudio.onerror = () => {
  if (activeQueue.length > 0) skipTrackForward();
  else runAudioFailed = true;
};

async function playSpecificTrack(trackMeta, pushHistory = true) {
  if (!trackMeta) return;
  if (pushHistory && currentTrack && currentTrack.url !== trackMeta.url) {
    playedHistory.push(currentTrack);
    if (playedHistory.length > 50) playedHistory.shift();
  }
  currentTrack = trackMeta;
  runAudioFailed = false;
  cancelAnimationFrame(fadeAnimId);
  currentFadeMode = "none";
  runAudio.src = trackMeta.url;
  runAudio.volume = 0;
  userPausedMusic = false;

  showMusicToast(trackMeta);
  renderGenreFilterList();
  updateMusicPlayerButtons();

  try {
    await runAudio.play();
    const targetVol = clampVol((typeof opts !== "undefined" ? opts.vol : 0.45) * 0.65);
    fadeInAudio(runAudio, targetVol, 1800);
    updateMusicPlayerButtons();
  } catch (e) {
    updateMusicPlayerButtons();
  }
}

async function skipTrackForward() {
  const nextMeta = await getNextTrackMeta();
  if (nextMeta) await playSpecificTrack(nextMeta, true);
}

async function skipTrackBackward() {
  const now = performance.now();
  const isDoubleTap = (now - lastBackTapTime) < 650;
  lastBackTapTime = now;

  if ((isDoubleTap || (runAudio && runAudio.currentTime < 3.0)) && playedHistory.length > 0) {
    if (currentTrack) activeQueue.unshift(currentTrack);
    const prevMeta = playedHistory.pop();
    await playSpecificTrack(prevMeta, false);
  } else if (runAudio && currentTrack) {
    runAudio.currentTime = 0;
    if (runAudio.paused && !userPausedMusic) runAudio.play().catch(() => {});
    showMusicToast(currentTrack);
  }
}

function toggleMusicPlayPause() {
  if (!currentTrack) {
    skipTrackForward();
    return;
  }
  if (runAudio.paused) {
    userPausedMusic = false;
    runAudio.volume = 0;
    runAudio.play().catch(() => {}).then(() => {
      fadeInAudio(runAudio, clampVol((typeof opts !== "undefined" ? opts.vol : 0.45) * 0.65), 800);
      updateMusicPlayerButtons();
    });
  } else {
    userPausedMusic = true;
    fadeOutAndPauseAudio(runAudio, 500);
  }
  updateMusicPlayerButtons();
}

function updateMusicPlayerButtons() {
  const ppBtn = document.getElementById("mpPlayPauseBtn");
  const rptBtn = document.getElementById("mpRepeatBtn");
  const titleEl = document.getElementById("nexus-Player-Title");
  if (titleEl && currentTrack) titleEl.textContent = currentTrack.label;
  if (ppBtn) ppBtn.textContent = (runAudio && !runAudio.paused && !userPausedMusic && currentFadeMode !== "out") ? "⏸" : "▶";
  if (rptBtn) {
    rptBtn.textContent = repeatOneMode ? "🔂 1" : "🔀 All";
    rptBtn.style.color = repeatOneMode ? "#ffd166" : "#00e676";
  }
}

async function updateActiveRunMP3(shouldPlayRunMusic) {
  if (typeof opts === "undefined" || !opts.amb || opts.vol <= 0.01) {
    if (runAudio && !runAudio.paused) fadeOutAndPauseAudio(runAudio, 800);
    return;
  }
  if (!shouldPlayRunMusic) {
    if (runAudio && !runAudio.paused) fadeOutAndPauseAudio(runAudio, 1200);
    return;
  }
  if (userPausedMusic) return;

  if (!currentTrack && !runAudioFailed && !isDiscoveringMusic) {
    const firstMeta = await getNextTrackMeta();
    if (firstMeta) await playSpecificTrack(firstMeta, false);
    return;
  }

  if (currentTrack && !runAudioFailed) {
    const targetVol = clampVol(opts.vol * 0.65);
    if (runAudio.paused && currentFadeMode !== "out") {
      runAudio.volume = 0;
      runAudio.play().then(() => {
        fadeInAudio(runAudio, targetVol, 1600);
        showMusicToast(currentTrack);
        updateMusicPlayerButtons();
      }).catch(() => {});
    } else if (!runAudio.paused && currentFadeMode === "none") {
      runAudio.volume = targetVol;
    }
  }
}

function updateThemeMusic(rawDt) {
  if (typeof opts === "undefined" || !opts.amb || opts.vol <= 0.01) {
    updateActiveRunMP3(false);
    return;
  }
  const mainScr = document.getElementById("scrMain");
  const onMainMenu = mainScr && mainScr.classList.contains("active");

  const mp3IsPlaying = (runAudio && !runAudio.paused && !userPausedMusic && currentFadeMode !== "out");
  const inRunSession = (typeof runActive !== "undefined" && runActive && !onMainMenu);
  updateActiveRunMP3(inRunSession || (onMainMenu && mp3IsPlaying));

  if (onMainMenu && mp3IsPlaying) return;
  if (!onMainMenu) return;

  const cid = (typeof meta !== "undefined" && typeof meta.selChar === "number") ? meta.selChar : 0;
  const spec = CHARACTER_THEMES[cid] || CHARACTER_THEMES[0];
  const tempo = spec[0], wave = spec[1], notes = spec[2];

  themeTimer += rawDt;
  if (themeTimer >= tempo) {
    themeTimer = 0;
    const freq = notes[themeStep % notes.length];
    themeStep++;
    sfxTone(freq, freq * 0.996, tempo * 0.82, wave, 0.075, 0.006);
    if (themeStep % 2 === 0) {
      sfxTone(freq * 0.5, freq * 0.498, tempo * 0.92, "triangle", 0.055, 0.004);
    }
  }
}

/* === 4. AUTOMATED MUSIC PLAYER, SEEK BAR, GENRE FILTER & NOW-PLAYING TOAST === */
function formatSec(s) {
  if (!Number.isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60), sec = Math.floor(s % 60);
  return m + ":" + (sec < 10 ? "0" : "") + sec;
}

function renderGenreFilterList() {
  const gBox = document.getElementById("mpGenreBox");
  const tBox = document.getElementById("mpTrackList");
  if (!gBox || !tBox) return;

  window._inHudUpdate = true;
  try {
    const genres = Array.from(new Set(MASTER_TRACKS.map(t => t.genre)));
    gBox.innerHTML = "";
    genres.forEach(g => {
      const checked = enabledGenres.has(g);
      const lbl = document.createElement("label");
      lbl.style.cssText = `display:inline-flex;align-items:center;gap:4px;padding:3px 7px;border-radius:4px;font-size:10px;cursor:pointer;border:1px solid ${checked ? "#00e676" : "#546e7a"};background:${checked ? "#0d2b1d" : "#101824"};color:${checked ? "#00e676" : "#90a4ae"}`;
      lbl.innerHTML = `<input type="checkbox" ${checked ? "checked" : ""} style="margin:0"> ${g}`;
      lbl.querySelector("input").onchange = (e) => {
        if (e.target.checked) enabledGenres.add(g);
        else if (enabledGenres.size > 1) enabledGenres.delete(g);
        else e.target.checked = true;
        rebuildShuffleQueue();
        renderGenreFilterList();
        if (currentTrack && !enabledGenres.has(currentTrack.genre)) skipTrackForward();
      };
      gBox.appendChild(lbl);
    });

    tBox.innerHTML = "";
    MASTER_TRACKS.filter(t => enabledGenres.has(t.genre)).forEach(t => {
      const active = currentTrack && currentTrack.url === t.url;
      const row = document.createElement("div");
      row.style.cssText = `padding:3px 6px;border-radius:3px;font-size:9.5px;cursor:pointer;display:flex;justify-content:space-between;background:${active ? "#12324a" : "transparent"};color:${active ? "#ffd166" : "#cfd8dc"}`;
      row.innerHTML = `<span>${active ? "▶ " : ""}${t.num}. ${t.title}</span><span style="color:#00e5ff">${t.genre}</span>`;
      row.onclick = () => playSpecificTrack(t, true);
      tBox.appendChild(row);
    });
  } finally {
    window._inHudUpdate = false;
  }
}

function mountNexusMusicPlayer() {
  if (document.getElementById("nexus-music-toast")) return;
  window._inHudUpdate = true;
  try {
    const toast = document.createElement("div");
    toast.id = "nexus-music-toast";
    toast.style.cssText = "position:fixed;bottom:26px;right:8px;z-index:999998;background:rgba(6,14,26,0.92);border:1px solid #00e5ff;border-radius:6px;padding:5px 10px;font-family:monospace;font-size:10.5px;color:#fff;pointer-events:none;opacity:0;transform:translateY(8px);transition:opacity 0.45s ease,transform 0.45s ease;box-shadow:0 2px 10px rgba(0,0,0,0.6);max-width:260px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;";
    document.body.appendChild(toast);

    const mBtn = document.createElement("button");
    mBtn.id = "nexus-music-toggle";
    mBtn.innerText = "🎵 Music";
    mBtn.style.cssText = "position:fixed;bottom:4px;left:78px;z-index:1000000;padding:4px 10px;background:#1a2636;color:#ffd166;border:1px solid #ffd16688;border-radius:4px;font-size:11px;font-family:monospace;";
    document.body.appendChild(mBtn);

    const panel = document.createElement("div");
    panel.id = "nexus-music-panel";
    panel.style.cssText = "position:fixed;bottom:38px;right:6px;width:272px;background:rgba(6,12,22,0.96);border:1px solid #00e5ff;border-radius:8px;padding:8px;z-index:1000000;display:none;flex-direction:column;gap:6px;font-family:monospace;color:#e0f7fa;box-shadow:0 4px 16px rgba(0,0,0,0.75);";
    panel.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #1e324a;padding-bottom:4px">
        <span id="nexus-Player-Title" style="font-size:10.5px;font-weight:bold;color:#ffd166;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:195px">Auto-Shuffle Ready</span>
        <span id="mpTimeLbl" style="font-size:9.5px;color:#80deea">0:00 / 0:00</span>
      </div>
      <input id="mpSeekBar" type="range" min="0" max="100" value="0" style="width:100%;height:4px;accent-color:#00e5ff;cursor:pointer;margin:0">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:4px">
        <button id="mpPrevBtn" title="Tap: Restart | Double-Tap: Previous Song" style="flex:1;background:#152438;color:#fff;border:1px solid #00e5ff66;border-radius:4px;padding:4px 0;font-size:11px;cursor:pointer">⏮</button>
        <button id="mpPlayPauseBtn" style="flex:1.2;background:#152438;color:#00e676;border:1px solid #00e67688;border-radius:4px;padding:4px 0;font-size:11px;cursor:pointer">▶</button>
        <button id="mpNextBtn" title="Next Song" style="flex:1;background:#152438;color:#fff;border:1px solid #00e5ff66;border-radius:4px;padding:4px 0;font-size:11px;cursor:pointer">⏭</button>
        <button id="mpRepeatBtn" style="flex:1.2;background:#152438;color:#00e676;border:1px solid #546e7a;border-radius:4px;padding:4px 2px;font-size:10px;cursor:pointer">🔀 All</button>
        <button id="mpGenresToggle" style="flex:1.5;background:#1c3144;color:#ffd166;border:1px solid #ffd16688;border-radius:4px;padding:4px 4px;font-size:10px;cursor:pointer">🏷️ Genres</button>
      </div>
      <div id="mpGenreDrawer" style="display:none;flex-direction:column;gap:5px;border-top:1px solid #1e324a;padding-top:5px">
        <span style="font-size:9px;color:#80deea">ACTIVE GENRES (UNCHECK TO FILTER):</span>
        <div id="mpGenreBox" style="display:flex;flex-wrap:wrap;gap:4px"></div>
        <div id="mpTrackList" style="max-height:95px;overflow-y:auto;border:1px solid #162638;border-radius:4px;padding:3px;background:#040810"></div>
      </div>
    `;
    document.body.appendChild(panel);

    mBtn.onclick = (e) => {
      e.stopPropagation();
      const open = panel.style.display === "none";
      panel.style.display = open ? "flex" : "none";
      mBtn.style.backgroundColor = open ? "#ffd166" : "#1a2636";
      mBtn.style.color = open ? "#000" : "#ffd166";
      if (open) { renderGenreFilterList(); updateMusicPlayerButtons(); }
    };

    document.getElementById("mpPrevBtn").onclick = (e) => { e.stopPropagation(); skipTrackBackward(); };
    document.getElementById("mpPlayPauseBtn").onclick = (e) => { e.stopPropagation(); toggleMusicPlayPause(); };
    document.getElementById("mpNextBtn").onclick = (e) => { e.stopPropagation(); skipTrackForward(); };
    document.getElementById("mpRepeatBtn").onclick = (e) => {
      e.stopPropagation();
      repeatOneMode = !repeatOneMode;
      updateMusicPlayerButtons();
    };
    document.getElementById("mpGenresToggle").onclick = (e) => {
      e.stopPropagation();
      const drw = document.getElementById("mpGenreDrawer");
      drw.style.display = drw.style.display === "none" ? "flex" : "none";
      renderGenreFilterList();
    };

    const seek = document.getElementById("mpSeekBar");
    seek.oninput = (e) => {
      if (runAudio && Number.isFinite(runAudio.duration) && runAudio.duration > 0) {
        runAudio.currentTime = (parseFloat(e.target.value) / 100) * runAudio.duration;
      }
    };

    const playBtn = document.getElementById("goPlay");
    if (playBtn) {
      playBtn.addEventListener("click", () => {
        userPausedMusic = false;
        if (!currentTrack) skipTrackForward();
        else if (runAudio.paused) {
          runAudio.volume = 0;
          runAudio.play().then(() => {
            fadeInAudio(runAudio, clampVol((typeof opts !== "undefined" ? opts.vol : 0.45) * 0.65), 1600);
            showMusicToast(currentTrack);
          }).catch(() => {});
        }
      });
    }

    setInterval(() => {
      if (!runAudio) return;
      const cur = runAudio.currentTime || 0, dur = runAudio.duration || 0;
      const lbl = document.getElementById("mpTimeLbl");
      if (lbl) lbl.textContent = `${formatSec(cur)} / ${formatSec(dur)}`;
      if (seek && dur > 0) seek.value = String(Math.min(100, (cur / dur) * 100));
      updateMusicPlayerButtons();
    }, 500);

    discoverMusicFiles();
  } finally {
    window._inHudUpdate = false;
  }
}

window.addEventListener("DOMContentLoaded", mountNexusMusicPlayer);
window.addEventListener("load", () => {
  window.updateThemeMusic = updateThemeMusic;
  mountNexusMusicPlayer();
});
// EOF:js/chaos.js
