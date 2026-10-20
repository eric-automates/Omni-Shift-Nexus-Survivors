// FILE: js/chaos.js
// PART: 5 of 14
// DETAIL: ChaosMath deterministic RNG, polygon vertex mutator, obstacle tangent steering, enemy movement styles, and Web Audio API synthesizer.

"use strict";

const ChaosMath = {
  // Deterministic 32-bit integer hash returning float in [0, 1)
  hash(seed) {
    let h = (seed ^ 0x6d2b79f5) >>> 0;
    h = Math.imul(h ^ (h >>> 15), h | 1);
    h ^= h + Math.imul(h ^ (h >>> 7), h | 61);
    return ((h ^ (h >>> 14)) >>> 0) / 4294967296;
  },

  // Deterministic float within [min, max]
  range(seed, min, max) {
    return min + this.hash(seed) * (max - min);
  },

  // Deterministic integer within [min, max]
  int(seed, min, max) {
    return Math.floor(this.range(seed, min, max + 0.9999));
  },

  // Stateful seeded PRNG closure for chunk generation
  createRNG(seed) {
    let s = seed >>> 0;
    return () => {
      s = (s + 0x6d2b79f5) >>> 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  },

  // Generates morphed polygon vertices for props, trees, rocks, and mutating wave enemies
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
      // Higher waves extrude organic mutation spikes on alternating vertices
      const mutSpike = (waveMut > 0 && i % 2 === 0)
        ? 1 + Math.min(0.65, waveMut * 0.06) * this.range(seed + i * 197, 0.3, 1.0)
        : 1.0;
      const r = baseR * radVar * mutSpike;
      pts.push({
        x: Math.cos(baseAng + angJitter) * r * stretchX,
        y: Math.sin(baseAng + angJitter) * r * stretchY
      });
    }
    return pts;
  },

  // Lightweight movement style modifier for enemies:
  // 0 = Direct, 1 = Serpentine Sine, 2 = Flank Spiral, 3 = Tactical Lunge
  movePattern(styleId, baseAngle, runTime, seed) {
    const phase = (seed % 100) * 0.1;
    if (styleId === 1) {
      // Serpentine wave weaving toward target
      return baseAngle + Math.sin(runTime * 4.5 + phase) * 0.58;
    }
    if (styleId === 2) {
      // Spiral flanking approach
      const spiralBias = (seed & 1) ? 0.48 : -0.48;
      return baseAngle + spiralBias + Math.cos(runTime * 2.8 + phase) * 0.25;
    }
    if (styleId === 3) {
      // Erratic micro-zigzags
      return baseAngle + Math.sin(runTime * 8.0 + phase) * 0.32;
    }
    return baseAngle;
  },

  // Speed multiplier for Lunge/Serpentine enemy rhythms
  moveSpeedMul(styleId, runTime, seed) {
    if (styleId === 3) {
      const pulse = Math.sin(runTime * 3.6 + (seed % 50));
      return pulse > 0.45 ? 1.65 : 0.72;
    }
    if (styleId === 1) {
      return 1.08;
    }
    return 1.0;
  },

  // Tangent obstacle steering vector for higher-wave enemies maneuvering around props
  steerAround(ex, ey, tx, ty, obsList, steerStrength = 1.0, entitySeed = 1) {
    let dx = tx - ex;
    let dy = ty - ey;
    const distToTarget = Math.hypot(dx, dy) || 1;
    let vx = dx / distToTarget;
    let vy = dy / distToTarget;

    if (!obsList || obsList.length === 0 || steerStrength <= 0.01) {
      return { vx, vy };
    }

    const handedness = (entitySeed & 1) ? 1 : -1;
    let avoidX = 0;
    let avoidY = 0;

    for (let i = 0; i < obsList.length; i++) {
      const ob = obsList[i];
      const ox = ex - ob.x;
      const oy = ey - ob.y;
      const d = Math.hypot(ox, oy) || 0.001;
      const safeRad = (ob.rad || 22) + 28;

      if (d < safeRad) {
        const weight = ((safeRad - d) / safeRad) * steerStrength;
        // Normal repulsion away from obstacle center
        const nx = ox / d;
        const ny = oy / d;
        // Tangent vector to glide smoothly around obstacle perimeter
        const tanX = -ny * handedness;
        const tanY = nx * handedness;

        avoidX += (nx * 0.55 + tanX * 0.85) * weight;
        avoidY += (ny * 0.55 + tanY * 0.85) * weight;
      }
    }

    vx += avoidX;
    vy += avoidY;
    const mag = Math.hypot(vx, vy) || 1;
    return { vx: vx / mag, vy: vy / mag };
  }
};

// Deterministic chunk hash helper used by world.js
function hashChunk(cx, cy) {
  const seed = (typeof runSeed !== "undefined" ? runSeed : 1337) ^ (cx * 73856093) ^ (cy * 19349663);
  return ChaosMath.createRNG(seed >>> 0);
}

// Procedural Web Audio API Synthesizer
let actx = null;
let ambTimer = 0;

function sfx(f1, f2, dur = 0.08, type = "sawtooth", gainMul = 0.2) {
  const vol = (typeof opts !== "undefined" && typeof opts.vol === "number") ? opts.vol : 0.45;
  if (vol <= 0.01) return;
  try {
    if (!actx) {
      actx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (actx.state === "suspended") {
      actx.resume();
    }
    const osc = actx.createOscillator();
    const gain = actx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(24, f1), actx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(Math.max(24, f2), actx.currentTime + dur);
    gain.gain.setValueAtTime(vol * gainMul, actx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + dur);
    osc.connect(gain);
    gain.connect(actx.destination);
    osc.start();
    osc.stop(actx.currentTime + dur);
  } catch (e) {}
}
