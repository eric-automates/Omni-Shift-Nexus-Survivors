// FILE: js/chaos.js
// PART: 5 of 14
// DETAIL: ChaosMath RNG, Noise-Buffer + FM Acoustic Synth (All 56 Weapons, Lightning, Flamethrower, Rockets, Explosions, Sabers), 56 Extended 16-Note Alignment Themes, and External Run MP3 Streamer.

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

/* === 2. MOVIE-ACCURATE WEB AUDIO SYNTHESIZER (Noise Buffers + Biquad Filters + FM) === */
let actx = null, noiseBuf = null, ambTimer = 0, themeTimer = 0, themeStep = 0;
let runAudio = null, runAudioFailed = false;

function ensureAudio() {
  const vol = (typeof opts !== "undefined" && typeof opts.vol === "number") ? opts.vol : 0.45;
  if (vol <= 0.01) return null;
  if (!actx) {
    actx = new (window.AudioContext || window.webkitAudioContext)();
    // Pre-allocate 1.0s White/Pink Noise Buffer for realistic gunfire, flamethrowers, rockets & explosions
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
    // Automatically upgrade special game call signatures into rich multi-layered acoustics!
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

function sfxForceLightning() {
  for (let k = 0; k < 3; k++) {
    setTimeout(() => {
      playNoise(0.055, "highpass", 2400, 900, 3.2, 0.22);
      sfxTone(1650 + Math.random() * 900, 140, 0.05, "sawtooth", 0.18, 0.14);
    }, k * 28);
  }
}

// Movie-Accurate Weapon & Utility Acoustics Across All 56 Heroes (#00-#55)
function sfxWeapon(style, wpnId = 0, isSaber = false) {
  try {
    const ac = ensureAudio();
    if (!ac) return;
    const now = ac.currentTime, vol = opts.vol;

    if (isSaber) {
      if ([18, 19, 24, 48, 50].includes(wpnId)) {
        // Metallic Steel Sword / Crysknife / Bat'leth / Nodachi Air Whoosh + Blade Ring
        playNoise(0.14, "bandpass", 1800, 420, 2.2, 0.25);
        sfxTone(540, 180, 0.11, "triangle", 0.18, 0.08);
        sfxTone(2400, 1650, 0.06, "sine", 0.08, 0.05);
        return;
      }
      // Authentic Plasma Lightsaber: Dual Detuned Hum + Doppler Swing Whoosh
      const baseH = wpnId === 3 ? 68 : (wpnId === 55 ? 88 : 92) + (Math.random() - 0.5) * 24;
      const peakH = baseH * (1.85 + Math.random() * 0.55);
      const dur = 0.21 + Math.random() * 0.08;
      const o1 = ac.createOscillator(), o2 = ac.createOscillator(), flt = ac.createBiquadFilter(), g = ac.createGain();
      o1.type = "sawtooth"; o2.type = "triangle";
      flt.type = "lowpass"; flt.frequency.setValueAtTime(420, now);
      flt.frequency.exponentialRampToValueAtTime(1450, now + dur * 0.42);
      flt.frequency.exponentialRampToValueAtTime(360, now + dur);
      o1.frequency.setValueAtTime(baseH, now);
      o1.frequency.exponentialRampToValueAtTime(peakH, now + dur * 0.42);
      o1.frequency.exponentialRampToValueAtTime(baseH * 0.86, now + dur);
      o2.frequency.setValueAtTime(baseH * 2.02, now);
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
      // Boba Fett Z-6 Jetpack Missile Ignition Pop + Rocket Exhaust Whoosh
      playNoise(0.28, "bandpass", 1400, 280, 1.1, 0.32);
      sfxTone(380, 95, 0.24, "sawtooth", 0.24, 0.05);
      return;
    }
    if (wpnId === 54) {
      // Boba Fett ESB EE-3 Carbine: Iconic 3-Pulse Metallic Guy-Wire Laser Chirp + Chamber Thump
      [0, 0.026, 0.052].forEach((delay, idx) => {
        setTimeout(() => {
          sfxTone(1380 - idx * 140, 240, 0.048, "sawtooth", 0.22, 0.03);
          sfxTone(680, 135, 0.052, "square", 0.14, 0.03);
        }, delay * 1000);
      });
      playNoise(0.05, "bandpass", 2200, 600, 2.5, 0.16);
      return;
    }
    if (wpnId === 3 || wpnId === 11 || wpnId === 38 || wpnId === 49 || style === "chain") {
      // ROTJ Sith Force Lightning / Tesla Arc Crackle
      sfxForceLightning();
      return;
    }
    if (wpnId === 52 || wpnId === 13) {
      // Western Colt Navy Six-Shooter / Mal's Brass Revolver: Crisp Hammer Snap + Gunpowder Crack + Cylinder Echo
      playNoise(0.065, "bandpass", 2800, 480, 1.2, 0.34);
      sfxTone(1600, 170, 0.048, "square", 0.25, 0.035);
      sfxTone(260, 52, 0.085, "sawtooth", 0.24, 0.035);
      return;
    }
    if (wpnId === 51) {
      // Baba Yaga Compensated 9mm / Lv.5 Benelli Tactical Shotgun
      playNoise(0.055, "highpass", 1800, 520, 1.5, 0.28);
      sfxTone(940, 145, 0.052, "triangle", 0.26, 0.03);
      sfxTone(190, 58, 0.06, "square", 0.18, 0.03);
      return;
    }
    if ([15, 28, 31, 34, 37, 53].includes(wpnId)) {
      // Vera / M60 / M56 Smartgun / Godwyn Bolter: Heavy Ballistic Chamber Boom + Bolt Carrier Clack
      playNoise(0.08, "lowpass", 1600, 240, 1.0, 0.32);
      sfxTone(320, 48, 0.085, "sawtooth", 0.26, 0.04);
      sfxTone(1350, 480, 0.028, "triangle", 0.15, 0.04);
      return;
    }
    if ([33, 44].includes(wpnId) || style === "cone") {
      // Super Shotgun / Scatter-Blaster: Wide Concussive Buckshot Boom
      playNoise(0.11, "lowpass", 1200, 140, 0.9, 0.36);
      sfxTone(210, 42, 0.095, "square", 0.26, 0.05);
      return;
    }
    if ([0, 2, 6, 7, 9, 10, 19, 22, 32, 36, 40, 41, 43, 45, 47].includes(wpnId) || style === "beam") {
      // Star Wars / Sci-Fi Blaster & Phased-Plasma Rifle (Ben Burtt Guy-Wire Twang)
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

/* === 3. 56 EXTENDED 16-NOTE ALIGNMENT-STYLED HERO THEMES & ACTIVE-RUN MP3 STREAMER ===
   Heroes (Good) = Upbeat Heroic Fanfares | Bounty = Badass Bass Grooves | Villains (Bad) = Dark Imposing Marches */
const CHARACTER_THEMES = [
  [0.21,"square",  [293,293,392,587,523,493,440,784,587,523,493,440,784,587,523,493]], // #00 Heroic Twin-Sun Fanfare
  [0.20,"sawtooth",[146,146,220,196,174,146,130,146,146,220,261,233,196,174,146,130]], // #01 Bounty Beskar Groove
  [0.21,"sawtooth",[196,196,196,155,233,196,155,233,196,293,293,293,311,233,185,155]], // #02 Villain Imperial March
  [0.24,"sawtooth",[146,155,146,110,146,155,185,174,146,155,220,207,185,155,146,110]], // #03 Villain Sith Throne Dirge
  [0.15,"square",  [523,659,784,1046,987,784,659,523,587,784,880,1174,1046,880,784,659]],// #04 Heroic R2 Upbeat Chiptune
  [0.20,"square",  [196,261,293,392,349,293,261,196,220,293,329,440,392,329,293,261]], // #05 Heroic Wookiee Anthem
  [0.18,"sawtooth",[164,196,220,246,293,246,220,196,164,220,261,293,329,293,220,164]], // #06 Bounty Kessel Run Bass
  [0.23,"sawtooth",[164,174,207,220,207,174,164,146,164,174,246,220,207,174,164,130]], // #07 Villain Anupas Phrygian
  [0.19,"square",  [261,329,392,523,493,440,392,329,349,440,523,659,587,523,392,523]], // #08 Heroic SG-1 Brass March
  [0.22,"sawtooth",[146,146,174,196,174,146,130,110,146,174,220,207,174,146,130,146]], // #09 Villain Serpent Guard
  [0.20,"triangle",[392,440,493,587,659,587,493,392,440,523,587,784,659,587,493,392]], // #10 Heroic Othala Starlight
  [0.23,"sawtooth",[138,164,155,123,138,185,164,123,138,164,207,196,164,155,138,110]], // #11 Villain Wraith Culling
  [0.24,"sawtooth",[130,155,196,185,155,130,116,130,155,196,233,220,196,155,146,130]], // #12 Villain Origin Crusade
  [0.19,"triangle",[220,261,293,392,349,293,261,220,246,293,329,440,392,329,293,220]], // #13 Heroic Serenity Ballad
  [0.17,"square",  [329,392,493,659,587,493,392,329,370,440,587,784,659,587,493,392]], // #14 Heroic Miranda Dance
  [0.19,"sawtooth",[146,196,220,261,220,196,174,146,164,220,246,293,261,220,196,146]], // #15 Bounty Canton Merc Riff
  [0.17,"square",  [293,370,440,587,523,440,370,293,329,392,493,659,587,493,440,587]], // #16 Heroic Leaf on the Wind
  [0.16,"sawtooth",[110,116,146,110,155,146,116,98, 110,116,164,155,146,116,110,92]],  // #17 Villain Reaver Core Terror
  [0.20,"square",  [220,261,329,440,392,329,293,261,293,349,440,523,493,440,329,440]], // #18 Heroic Muad'Dib Triumph
  [0.21,"sawtooth",[130,130,155,146,130,98, 116,130,130,174,164,155,130,116,98, 130]], // #19 Villain Sardaukar Chant
  [0.20,"triangle",[261,329,392,493,440,392,329,261,293,370,440,587,523,440,392,523]], // #20 Heroic Bene Matron
  [0.24,"sawtooth",[98, 103,130,116,98, 87, 98, 116,98, 103,146,130,116,103,98, 82]],  // #21 Villain Harkonnen Doom
  [0.18,"square",  [261,349,440,523,493,392,329,587,523,440,392,659,587,523,440,523]], // #22 Heroic Starfleet Fanfare
  [0.20,"sawtooth",[130,138,130,110,130,164,155,130,130,138,185,174,155,138,130,103]], // #23 Villain Borg Cube Threat
  [0.19,"square",  [196,261,293,392,349,293,261,392,440,392,349,293,349,392,440,523]], // #24 Heroic Klingon Glory
  [0.18,"square",  [293,349,440,587,523,440,392,349,392,440,523,659,587,523,440,587]], // #25 Heroic Starbuck Ace
  [0.21,"sawtooth",[146,155,196,185,155,146,130,116,146,155,220,207,185,155,146,110]], // #26 Villain Cylon Basestar
  [0.19,"square",  [261,329,392,523,587,523,392,329,349,440,523,659,587,523,440,523]], // #27 Heroic Spectre Vanguard
  [0.18,"square",  [220,261,329,440,392,329,293,220,261,329,392,523,493,440,392,440]], // #28 Heroic Colonial Marines
  [0.20,"sawtooth",[146,146,220,174,164,146,130,146,164,220,261,220,196,174,146,130]], // #29 Bounty Predator Hunt
  [0.22,"sawtooth",[123,130,164,155,130,123,110,98, 123,130,185,174,155,130,123,103]], // #30 Villain Xeno-Queen Horror
  [0.18,"square",  [261,261,349,440,523,440,392,349,392,440,523,587,523,440,392,523]], // #31 Heroic Klendathu Drop
  [0.20,"triangle",[220,261,293,329,392,349,329,293,329,392,440,523,493,440,392,440]], // #32 Heroic Spartan-117 Finish
  [0.15,"sawtooth",[110,110,220,110,196,110,174,146,110,110,261,233,220,196,174,146]], // #33 Heroic Slayer Rip & Tear
  [0.19,"square",  [196,246,293,392,349,293,246,196,220,261,329,440,392,329,293,392]], // #34 Heroic Astartes Triumph
  [0.20,"square",  [220,261,329,392,440,392,329,261,293,349,440,523,493,440,392,440]], // #35 Heroic Omnissiah Hymn
  [0.23,"sawtooth",[123,130,164,146,123,110,103,123,130,185,164,146,130,123,110,98]],  // #36 Villain Necron Tomb March
  [0.17,"sawtooth",[130,130,174,155,130,196,174,130,146,146,196,174,155,146,130,110]], // #37 Villain Ork Waaagh Stomp
  [0.19,"square",  [246,293,370,493,440,370,329,293,329,392,493,587,523,493,392,493]], // #38 Heroic Inquisitor Light
  [0.17,"square",  [261,329,392,523,659,523,392,329,293,370,440,587,659,587,440,523]], // #39 Heroic Bullet-Time One
  [0.20,"sawtooth",[146,146,146,174,164,146,130,130,146,146,146,220,196,174,164,146]], // #40 Heroic T-800 Brad Fiedel
  [0.20,"sawtooth",[164,220,246,293,261,220,196,164,174,220,261,329,293,246,220,164]], // #41 Bounty Blade-Runner Bass
  [0.16,"sawtooth",[196,246,293,392,370,293,246,196,220,261,329,440,392,329,261,196]], // #42 Bounty Edgerunner Synth
  [0.19,"triangle",[261,329,392,440,523,440,392,329,349,440,523,587,523,440,392,523]], // #43 Heroic Vault Wanderer
  [0.17,"square",  [196,246,293,392,440,392,293,246,220,293,349,440,493,440,349,392]], // #44 Heroic V8 Interceptor
  [0.18,"square",  [220,293,329,440,392,329,293,220,261,329,392,523,493,440,392,440]], // #45 Heroic Black-Mesa Pulse
  [0.17,"triangle",[246,293,370,493,440,370,329,246,293,370,440,587,523,440,370,493]], // #46 Heroic Time-Lord Theme
  [0.19,"square",  [261,329,392,523,587,523,440,392,349,440,523,659,587,523,440,523]], // #47 Heroic Chozo Brinstar
  [0.19,"sawtooth",[164,196,220,261,246,220,196,164,174,220,246,293,261,246,220,164]], // #48 Bounty Witcher Hunt
  [0.24,"sawtooth",[116,123,155,146,123,116,98, 92, 116,123,174,164,146,123,116,87]],  // #49 Villain Cthulhu Abyss
  [0.20,"sawtooth",[146,174,220,261,220,196,174,146,164,196,246,293,261,220,174,146]], // #50 Bounty Kenshi Ronin Groove
  [0.16,"sawtooth",[164,164,220,164,246,220,196,164,164,164,261,246,220,196,174,164]], // #51 Bounty Baba Yaga Club Bass
  [0.20,"square",  [220,293,220,196,174,261,220,146,220,293,329,293,261,349,293,220]], // #52 Bounty High-Noon Ennio
  [0.19,"square",  [220,261,329,440,392,329,261,220,246,293,392,493,440,392,329,440]], // #53 Heroic First-Blood Brass
  [0.19,"sawtooth",[146,146,220,174,207,196,164,146,146,146,261,233,220,174,164,146]], // #54 Bounty Slav-1 Boba Groove
  [0.17,"sawtooth",[130,138,174,164,138,130,110,98, 130,138,196,185,164,138,130,103]]  // #55 Villain Kaleesh War March
];

const THEME_MOTIFS = CHARACTER_THEMES.slice(0, 10).map(t => t[2]);

function updateActiveRunMP3(isPlayingRun) {
  if (typeof opts === "undefined" || !opts.amb || opts.vol <= 0.01) {
    if (runAudio && !runAudio.paused) runAudio.pause();
    return;
  }
  if (!runAudio && !runAudioFailed) {
    try {
      runAudio = new Audio("music/roguelike_active_run_music.mp3");
      runAudio.loop = true;
      runAudio.onerror = () => { runAudioFailed = true; };
    } catch (e) { runAudioFailed = true; }
  }
  if (runAudio && !runAudioFailed) {
    runAudio.volume = Math.min(1.0, opts.vol * 0.65);
    if (isPlayingRun) {
      if (runAudio.paused) runAudio.play().catch(() => {});
    } else {
      if (!runAudio.paused) runAudio.pause();
    }
  }
}

function updateThemeMusic(rawDt) {
  if (typeof opts === "undefined" || !opts.amb || opts.vol <= 0.01) {
    updateActiveRunMP3(false);
    return;
  }
  const mainScr = document.getElementById("scrMain");
  const lvlScr = document.getElementById("scrLevel");
  const pauseBar = document.getElementById("pauseBar");
  const onMainMenu = mainScr && mainScr.classList.contains("active");
  const onPauseMenu = lvlScr && lvlScr.classList.contains("active") && pauseBar && pauseBar.style.display !== "none";
  const inActiveRun = (typeof runActive !== "undefined" && runActive && !runPaused);

  // Stream external MP3 during active combat runs; pause MP3 on Main Menu & Pause Menu
  updateActiveRunMP3(inActiveRun);
  if (!onMainMenu && !onPauseMenu) return;

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

// Lock in the upgraded 16-note theme sequencer even if an older ui.js attempts to overwrite it
window.addEventListener("load", () => {
  window.updateThemeMusic = updateThemeMusic;
});
// EOF:js/chaos.js
