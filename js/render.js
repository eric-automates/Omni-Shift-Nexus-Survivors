// FILE: js/render.js
// PART: 13 of 14
// DETAIL: v8.2 Anatomical & Canon Visual Overhaul — Independent Per-Weapon Blade Colors (Hand/Holster/Telekinetic), Dropped Rival Weapon Beacons, Un-Fading Veteran Corpses & Bisected Halves, and True Stature Scaling.

"use strict";

/* === 1. SIZED SVG ICON GENERATOR === */
function makeSVG(type, c1 = "#00e5ff", c2 = "#ffd166", wpnId = -1) {
  const sOpen = `<svg class="ico" viewBox="0 0 24 24" width="28" height="28" style="width:28px;height:28px;flex-shrink:0">`;
  let p = "";
  if (typeof WPN_SVG_56 !== "undefined" && wpnId >= 0 && WPN_SVG_56[wpnId]) {
    p = WPN_SVG_56[wpnId](c1, c2);
  } else if (type === "dash") {
    p = `<polygon points="4,12 13,5 11,10 21,10 12,19 14,14 4,14" fill="${c1}" stroke="${c2}" stroke-width="1.1"/>`;
  } else if (type === "orbit") {
    p = `<line x1="8" y1="16" x2="21" y2="3" stroke="${c1}" stroke-width="4" stroke-linecap="round"/><line x1="3" y1="21" x2="8" y2="16" stroke="#90a4ae" stroke-width="3"/>`;
  } else if (type === "beam") {
    p = `<path d="M2,15 L6,12 L18,12 L18,14.5 L8,14.5 L6,18 Z" fill="#90a4ae" stroke="${c1}" stroke-width="1"/><line x1="18" y1="13" x2="23" y2="13" stroke="${c2}" stroke-width="2.5"/>`;
  } else if (type === "cone") {
    p = `<path d="M2,16 L6,12 L16,12 L16,14.5 L7,14.5 L4,18 Z" fill="${c1}" stroke="#fff" stroke-width="0.9"/><circle cx="20" cy="10" r="1.4" fill="${c2}"/><circle cx="21" cy="14" r="1.4" fill="${c2}"/>`;
  } else if (type === "missile") {
    p = `<path d="M4,12 L15,12 L21,14 L15,16 L4,16 Z" fill="${c1}" stroke="#fff" stroke-width="0.9"/><polygon points="4,12 1,9 6,12" fill="${c2}"/>`;
  } else if (type === "chain") {
    p = `<rect x="2" y="11" width="8" height="4" fill="#78909c"/><polyline points="10,13 15,8 17,16 22,10" fill="none" stroke="${c1}" stroke-width="2.2"/>`;
  } else if (type === "nova") {
    p = `<polygon points="12,2 15,9 22,12 15,15 12,22 9,15 2,12 9,9" fill="${c1}" stroke="${c2}" stroke-width="1.2"/>`;
  } else if (type === "relic") {
    p = `<polygon points="12,2 21,9 17,21 7,21 3,9" fill="none" stroke="#e040fb" stroke-width="2"/><circle cx="12" cy="12" r="4" fill="${c2}"/>`;
  } else if (type === "grapple") {
    p = `<line x1="4" y1="20" x2="18" y2="6" stroke="${c1}" stroke-width="2"/><polygon points="20,4 13,5 19,11" fill="${c2}"/>`;
  } else if (type === "flame") {
    p = `<path d="M12,2 C16,8 20,11 18,17 C16,21 8,21 6,17 C4,11 8,8 12,2 Z" fill="#ff6d00" stroke="${c2}" stroke-width="1.5"/>`;
  } else if (type === "fort") {
    p = `<rect x="3" y="8" width="18" height="12" fill="none" stroke="${c2}" stroke-width="2"/><line x1="3" y1="14" x2="21" y2="14" stroke="${c1}" stroke-width="2"/>`;
  } else {
    p = `<rect x="4" y="4" width="16" height="16" rx="3" fill="none" stroke="${c1}" stroke-width="2"/><circle cx="12" cy="12" r="4" fill="${c2}"/>`;
  }
  return `${sOpen}${p}</svg>`;
}

function getHeroKinematicStyle(cid) {
  if (cid === CUSTOM_CID && typeof customKinStyle === "function") return customKinStyle();   // v13: follows the creator loadout
  if ([51, 19, 41, 42].includes(cid)) return 0;
  if ([52, 6, 13, 22].includes(cid)) return 1;
  if ([15, 28, 31, 33, 40, 44, 53].includes(cid)) return 2;
  if ([1, 16, 25, 47, 54].includes(cid)) return 3;
  if ([0, 14, 18, 24, 32, 34, 35, 36, 37, 38, 48, 50, 76, 77, 78, 79, 80, 81, 82, 83, 85, 86, 87, 88].includes(cid)) return 4;
  if ([3, 7, 10, 11, 12, 20, 21, 27, 39, 46, 49, 56, 57, 59, 66, 67, 69, 70, 71, 72, 73, 74, 75, 84].includes(cid)) return 5;
  return 6;
}

/* === 2. ANATOMICAL STATURE, ARCHETYPE GAIT & PROPORTION REGISTRY FOR ALL 88+1 HEROES (#00-#88) === */
const HERO_TACTICAL_GAIT = new Set([1, 2, 8, 13, 19, 22, 25, 26, 28, 31, 32, 40, 41, 43, 44, 47, 51, 53, 54]);
const HERO_HEAVY_GAIT = new Set([5, 15, 28, 32, 33, 40, 61, 76, 86]);
const HERO_HOVER_ALWAYS = new Set([16, 21, 73, 74]);          // Repulsor / suspensor / mystic levitators
const HERO_HOVER_CRUISE = new Set([70, 84]);                  // Grounded idle, glides menacingly while moving (Voldemort, Frieza)
const HERO_MARTIAL_GAIT = new Set([34, 35, 36, 37, 38, 85, 87, 88]);
const HERO_GAIT_OVERRIDES = Object.freeze({
  4:  Object.freeze({ cadence: 3.10, stride: 1.85, bob: 0.14, style: "astromech-tripod-roll", archetype: "astromech", stanceW: 2.8, liftMul: 0, kneeMul: 0, swayMul: 0.25, leanMul: 0.45, armSwingMul: 0, hoverMode: "none" }),
  5:  Object.freeze({ cadence: 1.72, stride: 3.75, bob: 0.65, style: "lumbering-gentle-giant", archetype: "heavy", stanceW: 3.25, liftMul: 0.78, kneeMul: 0.88, swayMul: 1.35, leanMul: 0.8, armSwingMul: 1.25, hoverMode: "none" }),
  16: Object.freeze({ cadence: 2.15, stride: 2.10, bob: 0.22, style: "repulsor-hover", archetype: "hover", stanceW: 2.55, liftMul: 0.3, kneeMul: 0.5, swayMul: 0.35, leanMul: 1.15, armSwingMul: 0.45, hoverMode: "always" }),
  21: Object.freeze({ cadence: 1.85, stride: 1.90, bob: 0.28, style: "suspensor-drift", archetype: "hover", stanceW: 2.75, liftMul: 0.2, kneeMul: 0.4, swayMul: 0.45, leanMul: 0.9, armSwingMul: 0.4, hoverMode: "always" }),
  28: Object.freeze({ cadence: 2.34, stride: 2.05, bob: 0.28, style: "smartgun-braced-marine", archetype: "heavy", stanceW: 3.05, liftMul: 0.75, kneeMul: 0.9, swayMul: 0.6, leanMul: 0.9, armSwingMul: 0.65, hoverMode: "none" }),
  32: Object.freeze({ cadence: 2.16, stride: 2.25, bob: 0.30, style: "armored-tank-alert", archetype: "heavy", stanceW: 3.10, liftMul: 0.78, kneeMul: 0.85, swayMul: 0.55, leanMul: 0.85, armSwingMul: 0.8, hoverMode: "none" }),
  33: Object.freeze({ cadence: 2.10, stride: 2.55, bob: 0.34, style: "praetor-juggernaut", archetype: "heavy", stanceW: 3.20, liftMul: 0.76, kneeMul: 0.85, swayMul: 0.65, leanMul: 1.0, armSwingMul: 0.9, hoverMode: "none" }),
  40: Object.freeze({ cadence: 2.42, stride: 2.30, bob: 0.16, style: "machine-efficient-cyborg", archetype: "heavy", stanceW: 2.95, liftMul: 0.72, kneeMul: 0.75, swayMul: 0.25, leanMul: 0.65, armSwingMul: 0.65, hoverMode: "none" }),
  61: Object.freeze({ cadence: 1.62, stride: 3.60, bob: 0.62, style: "half-giant-stomp", archetype: "heavy", stanceW: 3.30, liftMul: 0.72, kneeMul: 0.82, swayMul: 1.4, leanMul: 0.75, armSwingMul: 1.15, hoverMode: "none" }),
  70: Object.freeze({ cadence: 2.10, stride: 2.00, bob: 0.24, style: "dark-wraith-glide", archetype: "hover", stanceW: 2.55, liftMul: 0.35, kneeMul: 0.55, swayMul: 0.4, leanMul: 1.1, armSwingMul: 0.55, hoverMode: "move" }),
  73: Object.freeze({ cadence: 2.10, stride: 2.00, bob: 0.24, style: "cloak-levitation", archetype: "hover", stanceW: 2.55, liftMul: 0.3, kneeMul: 0.5, swayMul: 0.35, leanMul: 1.05, armSwingMul: 0.5, hoverMode: "always" }),
  74: Object.freeze({ cadence: 2.18, stride: 2.05, bob: 0.24, style: "chaos-levitation", archetype: "hover", stanceW: 2.45, liftMul: 0.3, kneeMul: 0.5, swayMul: 0.4, leanMul: 1.05, armSwingMul: 0.55, hoverMode: "always" }),
  76: Object.freeze({ cadence: 1.68, stride: 2.45, bob: 0.22, style: "measured-imperial-strut", archetype: "heavy", stanceW: 3.12, liftMul: 0.68, kneeMul: 0.78, swayMul: 0.45, leanMul: 0.6, armSwingMul: 0.7, hoverMode: "none" }),
  79: Object.freeze({ cadence: 2.15, stride: 1.55, bob: 0.38, style: "aged-deliberate-shuffle", archetype: "yoda", stanceW: 2.35, liftMul: 0.62, kneeMul: 0.78, swayMul: 1.55, leanMul: 0.75, armSwingMul: 0.85, hoverMode: "none" }),
  84: Object.freeze({ cadence: 2.20, stride: 2.15, bob: 0.22, style: "tyrant-imperial-glide", archetype: "hover", stanceW: 2.50, liftMul: 0.35, kneeMul: 0.55, swayMul: 0.35, leanMul: 1.1, armSwingMul: 0.6, hoverMode: "move" }),
  86: Object.freeze({ cadence: 1.80, stride: 2.65, bob: 0.24, style: "titan-android-march", archetype: "heavy", stanceW: 3.22, liftMul: 0.70, kneeMul: 0.80, swayMul: 0.45, leanMul: 0.7, armSwingMul: 0.75, hoverMode: "none" })
});
function getHeroGaitProfile(cid) {
  if (HERO_GAIT_OVERRIDES[cid]) return HERO_GAIT_OVERRIDES[cid];
  if (HERO_MARTIAL_GAIT.has(cid)) return { cadence: 2.85, stride: 3.25, bob: 0.76, style: "martial-athletic", archetype: "martial", stanceW: 2.75, liftMul: 1.18, kneeMul: 1.22, swayMul: 0.85, leanMul: 1.28, armSwingMul: 1.22, hoverMode: "none" };
  if (HERO_TACTICAL_GAIT.has(cid)) return { cadence: 2.68, stride: 2.40, bob: 0.36, style: "disciplined-tactical", archetype: "tactical", stanceW: 2.88, liftMul: 0.90, kneeMul: 0.98, swayMul: 0.62, leanMul: 0.95, armSwingMul: 0.82, hoverMode: "none" };
  const k = getHeroKinematicStyle(cid);
  if (k === 0) return { cadence: 2.22, stride: 2.55, bob: 0.46, style: "deliberate", archetype: "tactical", stanceW: 2.78, liftMul: 0.92, kneeMul: 0.96, swayMul: 0.72, leanMul: 0.92, armSwingMul: 0.88, hoverMode: "none" };
  if (k === 1) return { cadence: 2.48, stride: 2.80, bob: 0.64, style: "compact-ready", archetype: "agile", stanceW: 2.72, liftMul: 1.02, kneeMul: 1.05, swayMul: 0.88, leanMul: 1.05, armSwingMul: 1.02, hoverMode: "none" };
  if (k === 2) return { cadence: 2.02, stride: 2.45, bob: 0.38, style: "heavy-grounded", archetype: "heavy", stanceW: 3.12, liftMul: 0.74, kneeMul: 0.84, swayMul: 0.62, leanMul: 0.85, armSwingMul: 0.80, hoverMode: "none" };
  if (k === 3) return { cadence: 2.52, stride: 2.45, bob: 0.36, style: "jetpack-tactical", archetype: "tactical", stanceW: 2.85, liftMul: 0.92, kneeMul: 0.98, swayMul: 0.65, leanMul: 0.95, armSwingMul: 0.85, hoverMode: "none" };
  if (k === 5) return { cadence: 2.30, stride: 2.55, bob: 0.48, style: "poised-caster", archetype: "balanced", stanceW: 2.68, liftMul: 0.92, kneeMul: 0.95, swayMul: 0.78, leanMul: 0.92, armSwingMul: 0.90, hoverMode: "none" };
  if (k === 4) return { cadence: 2.78, stride: 3.20, bob: 0.78, style: "agile-melee", archetype: "agile", stanceW: 2.75, liftMul: 1.15, kneeMul: 1.18, swayMul: 0.92, leanMul: 1.22, armSwingMul: 1.18, hoverMode: "none" };
  return { cadence: 2.38, stride: 2.82, bob: 0.64, style: "balanced", archetype: "balanced", stanceW: 2.75, liftMul: 1.0, kneeMul: 1.0, swayMul: 1.0, leanMul: 1.0, armSwingMul: 1.0, hoverMode: "none" };
}

function getHeroBodySpec(cid) {
  if (cid === 4)  return { sx: 0.76, sy: 0.74, yOff: 3.5, kind: "astromech" }; // R2-D2 Small Astromech Droid
  if (cid === 79) return { sx: 0.68, sy: 0.60, yOff: 4.5, kind: "yoda" };      // Grandmaster Yoda Small Stature
  if (cid === 10) return { sx: 0.72, sy: 0.68, yOff: 3.5, kind: "grey" };      // Asgard Roswell Grey Small Alien
  if (cid === 61) return { sx: 1.34, sy: 1.28, yOff: -2.5, kind: "hagrid" };   // Rubeus Hagrid Half-Giant
  if (cid === 5)  return { sx: 1.16, sy: 1.20, yOff: -1.8, kind: "wookiee" };  // Chewbacca Tall Wookiee
  if (cid === 30) return { sx: 1.18, sy: 1.24, yOff: -2.0, kind: "xeno" };     // Xenomorph Queen
  if (cid === 21) return { sx: 1.28, sy: 1.10, yOff: -1.0, kind: "baron" };    // Baron Harkonnen
  if (cid === 76) return { sx: 1.12, sy: 1.15, yOff: -1.5, kind: "vader" };    // Darth Vader Tall Cybernetic Juggernaut
  if (cid === 55) return { sx: 1.12, sy: 1.16, yOff: -1.5, kind: "grievous" }; // General Grievous Tall Cyborg
  if (cid === 86) return { sx: 1.18, sy: 1.16, yOff: -1.6, kind: "heavy" };    // Android 16 Tall Gentle Giant
  if (cid === 85) return { sx: 1.08, sy: 1.10, yOff: -1.0, kind: "cell" };     // Cell Tall Bio-Android
  if (cid === 84) return { sx: 0.94, sy: 0.95, yOff: 0.6, kind: "frieza" };    // Frieza Compact Emperor
  if ([33, 40].includes(cid)) return { sx: 1.14, sy: 1.12, yOff: -1.0, kind: "heavy" };
  if ([14, 56, 57, 58, 59, 60, 62].includes(cid)) return { sx: 0.88, sy: 0.86, yOff: 1.5, kind: "youth" };
  return { sx: 1.0, sy: 1.0, yOff: 0, kind: "adult" };
}

function drawBallHand(tCtx, hx, hy, rad, fillCol, outlineCol = "#08101a") {
  tCtx.fillStyle = fillCol;
  tCtx.strokeStyle = outlineCol;
  tCtx.lineWidth = 1.1;
  tCtx.beginPath();
  tCtx.arc(hx, hy, rad, 0, Math.PI * 2);
  tCtx.fill();
  tCtx.stroke();
}

/* === 3. PROTRUDING WEAPON SILHOUETTES (INCLUDING MAUL DOUBLE-BLADE & YODA SHOTO) === */
const FEMALE_HEROES = new Set([8, 11, 14, 20, 23, 25, 27, 28, 30, 42, 47, 57, 59, 66, 68, 74]);

// bladeLenPx (v11): > 0 draws the blade at exactly the Saber Form Engine's hitbox length, < 0 draws only the hilt
// (retracted / stowed). dblOverride: true/false forces Maul's second blade on/off (null = always double).
// v12: lightsaber hilts. Custom-hero sabers carry their own hilt (SABER_HILTS index, js/creator.js); the canon saber
// heroes get their film hilt (Luke Graflex, Vader, Windu / Palpatine electrum, Yoda shoto, Grievous' trophies).
const CANON_HILTS = { 0: 0, 3: 4, 55: 2, 76: 3, 77: 3, 78: 4, 79: 6 };
function canonHiltFor(id) { return (typeof SABER_HILTS !== "undefined" && id in CANON_HILTS) ? SABER_HILTS[CANON_HILTS[id]] : null; }
function drawSaberHilt(t, H, isDouble) {
  if (isDouble) {                                              // saberstaff: long centre-gripped hilt, emitters at both ends
    t.fillStyle = H.body; t.fillRect(-5.2, -1.4, 10.4, 2.8);
    t.fillStyle = H.grip; t.fillRect(-1.8, -1.5, 3.6, 3.0);
    t.fillStyle = H.band; t.fillRect(-3.9, -1.55, 0.8, 3.1); t.fillRect(3.1, -1.55, 0.8, 3.1);
    t.fillStyle = H.accent; t.fillRect(-0.4, -1.8, 0.8, 0.5);
    t.fillStyle = "#cfd8dc"; t.fillRect(4.4, -1.65, 1.0, 3.3); t.fillRect(-5.4, -1.65, 1.0, 3.3);
    return;
  }
  const L = 5.6 * (H.len || 1), x0 = 3 - L;
  t.save();
  if (H.curve) { t.translate(2.2, 0); t.rotate(H.curve); t.translate(-2.2, 0); }     // Dooku's bent grip
  t.fillStyle = H.body; t.fillRect(x0, -1.35, L - 1.2, 2.7);
  t.fillStyle = H.grip; t.fillRect(x0 + L * 0.14, -1.45, L * 0.46, 2.9);
  t.fillStyle = H.band;
  if (H.ribs) { for (let k = 0; k < 5; k++) t.fillRect(x0 + L * 0.16 + k * L * 0.085, -1.6, L * 0.035, 3.2); }
  else if (H.wraps) { for (let k = 0; k < 4; k++) t.fillRect(x0 + L * 0.16 + k * L * 0.11, -1.5, L * 0.05, 3.0); }
  else { t.fillRect(x0 + L * 0.22, -1.55, 0.6, 3.1); t.fillRect(x0 + L * 0.44, -1.55, 0.6, 3.1); }
  t.fillRect(x0 - 0.5, -1.05, 0.7, 2.1);                                              // pommel
  t.fillStyle = H.accent; t.fillRect(x0 + L * 0.66, -1.8, 0.9, 0.55);                  // activation stud
  t.restore();
  const e = H.emitter;                                                                 // emitter head (blade axis stays true)
  if (e === "clamp") { t.fillStyle = "#cfd8dc"; t.fillRect(1.2, -1.75, 1.3, 3.5); t.fillStyle = "#263238"; t.fillRect(2.5, -1.45, 0.9, 2.9); }
  else if (e === "shroud") { t.fillStyle = "#b0bec5"; t.fillRect(1.3, -1.95, 2.1, 3.9); t.fillStyle = "#16181b"; t.fillRect(1.7, -1.95, 0.4, 3.9); t.fillRect(2.5, -1.95, 0.4, 3.9); }
  else if (e === "flare") { t.fillStyle = H.band; t.beginPath(); t.moveTo(1.3, -1.35); t.lineTo(3.4, -1.95); t.lineTo(3.4, 1.95); t.lineTo(1.3, 1.35); t.closePath(); t.fill(); }
  else if (e === "cross") { t.fillStyle = H.body; t.fillRect(1.3, -2.3, 2.0, 4.6); t.fillStyle = "#5d4037"; t.fillRect(1.7, -2.3, 0.5, 4.6); }
  else { t.fillStyle = H.band; t.beginPath(); t.moveTo(1.3, -1.4); t.lineTo(3.3, -1.1); t.lineTo(3.3, 1.1); t.lineTo(1.3, 1.4); t.closePath(); t.fill(); }
}

function drawWeaponModel(tCtx, wpnId, style, isLv5, isSuper, bladeCol, rackShift = 0, angVel = 0, bladeLenPx = 0, dblOverride = null, hilt = null) {
  const lenMul = isLv5 ? 1.22 : 1.0;
  const effCol = bladeCol || (typeof getWeaponColor === "function" ? getWeaponColor(wpnId) : "#00f0ff");

  if (style === "orbit") {
    const ownHilt = hilt !== null && hilt !== undefined && typeof SABER_HILTS !== "undefined" && SABER_HILTS[hilt];
    const H = ownHilt || canonHiltFor(wpnId);
    const bLen = bladeLenPx > 0 ? bladeLenPx : (wpnId === 79 ? 16.5 : 21.5) * lenMul * ((ownHilt && ownHilt.blade) || 1);
    const isDouble = dblOverride === null ? (wpnId === 77) : !!dblOverride; // Darth Maul Double-Bladed Saberstaff
    const steelBlade = [14, 18, 19, 24, 37, 48, 50, 68, 71].includes(wpnId);

    if (bladeLenPx === 0 && Math.abs(angVel) > 1.2) {
      const trailSweep = Math.max(-0.65, Math.min(0.65, -angVel * 0.045));
      tCtx.save();
      tCtx.fillStyle = [18, 19, 24, 48, 50, 68].includes(wpnId) ? "#cfd8dc" : effCol;
      tCtx.globalAlpha = 0.28;
      tCtx.beginPath();
      tCtx.moveTo(3, 0);
      tCtx.arc(0, 0, bLen, 0, trailSweep, trailSweep < 0);
      tCtx.closePath();
      tCtx.fill();
      if (isDouble) {
        tCtx.beginPath();
        tCtx.moveTo(-3, 0);
        tCtx.arc(0, 0, bLen, Math.PI, Math.PI + trailSweep, trailSweep < 0);
        tCtx.closePath();
        tCtx.fill();
      }
      tCtx.restore();
    }

    if (H && !steelBlade) {
      drawSaberHilt(tCtx, H, isDouble);
      if (bladeLenPx < 0) return;              // retracted: just the hilt
    } else {
      tCtx.fillStyle = wpnId === 78 ? "#ffd166" : (wpnId === 76 ? "#212121" : "#b0bec5");
      tCtx.fillRect(isDouble ? -5.0 : -2.5, -1.4, isDouble ? 10.0 : 5.5, 2.8);
      if (bladeLenPx < 0) {                       // retracted: emitter shroud only
        tCtx.fillStyle = "#37474f"; tCtx.fillRect(isDouble ? 4.0 : 2.4, -1.7, 1.4, 3.4);
        if (isDouble) tCtx.fillRect(-5.4, -1.7, 1.4, 3.4);
        return;
      }
    }

    if (steelBlade) {
      tCtx.fillStyle = "#cfd8dc";
      tCtx.beginPath();
      tCtx.moveTo(3, -1.9); tCtx.lineTo(bLen, 0); tCtx.lineTo(3, 1.9);
      tCtx.closePath(); tCtx.fill();
    } else {
      // v12: the Darksaber is a black blade with a white corona
      const darkBlade = effCol === "#212121";
      const glowCol = darkBlade ? "#eceff1" : effCol;
      if (H && H.emitter === "cross" && !isDouble) {     // Kylo-style crossguard quillons
        tCtx.save();
        tCtx.strokeStyle = glowCol; tCtx.globalAlpha = 0.3; tCtx.lineWidth = 3.4; tCtx.lineCap = "round";
        tCtx.beginPath(); tCtx.moveTo(2.3, -2.4); tCtx.lineTo(2.3, -5.6); tCtx.moveTo(2.3, 2.4); tCtx.lineTo(2.3, 5.6); tCtx.stroke();
        tCtx.globalAlpha = 1; tCtx.strokeStyle = darkBlade ? "#111" : effCol; tCtx.lineWidth = 1.5;
        tCtx.beginPath(); tCtx.moveTo(2.3, -2.4); tCtx.lineTo(2.3, -5.4); tCtx.moveTo(2.3, 2.4); tCtx.lineTo(2.3, 5.4); tCtx.stroke();
        tCtx.restore();
      }
      // v11: soft plasma glow around the core
      tCtx.save();
      tCtx.globalAlpha = darkBlade ? 0.32 : 0.22;
      tCtx.strokeStyle = glowCol;
      tCtx.lineWidth = (isSuper ? 4.0 : 3.0) + 4.5;
      tCtx.lineCap = "round";
      tCtx.beginPath();
      tCtx.moveTo(isDouble ? 4.5 : 3, 0); tCtx.lineTo(bLen, 0);
      if (isDouble) { tCtx.moveTo(-4.5, 0); tCtx.lineTo(-bLen, 0); }
      tCtx.stroke();
      tCtx.restore();
      tCtx.strokeStyle = darkBlade ? "#0d0d0d" : effCol;
      tCtx.lineWidth = isSuper ? 4.0 : 3.0;
      tCtx.lineCap = "round";
      tCtx.beginPath();
      tCtx.moveTo(isDouble ? 4.5 : 3, 0);
      tCtx.lineTo(bLen, 0);
      if (isDouble) {
        tCtx.moveTo(-4.5, 0);
        tCtx.lineTo(-bLen, 0);
      }
      tCtx.stroke();

      tCtx.strokeStyle = darkBlade ? "#616161" : "#ffffff";
      tCtx.lineWidth = darkBlade ? 0.6 : 1.3;
      tCtx.beginPath();
      tCtx.moveTo(isDouble ? 4.5 : 3, 0);
      tCtx.lineTo(bLen - 1, 0);
      if (isDouble) {
        tCtx.moveTo(-4.5, 0);
        tCtx.lineTo(-(bLen - 1), 0);
      }
      tCtx.stroke();
      if (H && H.unstable) {                              // cracked kyber: the blade spits and crackles
        tCtx.save(); tCtx.strokeStyle = effCol; tCtx.lineWidth = 0.9; tCtx.globalAlpha = 0.75;
        tCtx.beginPath();
        for (let k = 0; k < 4; k++) {
          const x = 4 + Math.random() * (bLen - 6), dy = (Math.random() < 0.5 ? -1 : 1) * (1.6 + Math.random() * 1.6);
          tCtx.moveTo(x, 0); tCtx.lineTo(x + 1.2, dy);
        }
        tCtx.stroke(); tCtx.restore();
      }
    }
    return;
  }

  if (wpnId === 1) {   // v9.01: IB-94 Beskar heavy blaster pistol (Mandalorian primary)
    tCtx.fillStyle = "#37474f"; tCtx.fillRect(-2.5, -1.1, 3.4, 3.2);
    tCtx.fillStyle = "#cfd8dc"; tCtx.fillRect(0, -1.9, 9.5 * lenMul, 2.6);
    tCtx.fillStyle = "#78909c"; tCtx.fillRect(9.5 * lenMul, -1.3, 3.2, 1.7);
    tCtx.fillStyle = "#263238"; tCtx.fillRect(2 - rackShift * 2.0, -3.1, 4.6, 1.2);
    return;
  }
  if (wpnId === 54) {
    tCtx.fillStyle = "#6d4c41"; tCtx.fillRect(-5, -1.2, 5, 2.6);
    tCtx.fillStyle = "#263238"; tCtx.fillRect(0, -1.6, 14 * lenMul, 3.0);
    tCtx.fillStyle = "#37474f"; tCtx.fillRect(11 * lenMul, -2.3, 4.5, 4.4);
    tCtx.fillStyle = "#90a4ae"; tCtx.fillRect(2 - rackShift * 2.5, -3.2, 6, 1.3);
    return;
  }
  if (wpnId === 52 || wpnId === 13) {
    tCtx.fillStyle = "#6d4c41"; tCtx.fillRect(-2.5, -1.2, 3.5, 2.8);
    tCtx.fillStyle = wpnId === 13 ? "#ffd166" : "#cfd8dc"; tCtx.fillRect(1, -1.8, 3.5, 3.2);
    tCtx.fillStyle = "#90a4ae"; tCtx.fillRect(4, -1.3, 9.5 * lenMul, 2.0);
    return;
  }
  if (wpnId === 51) {
    tCtx.fillStyle = "#1c262b"; tCtx.fillRect(-1.5, -1.4, (isLv5 ? 15 : 10.5), 2.6);
    tCtx.fillStyle = isLv5 ? "#546e7a" : "#90a4ae"; tCtx.fillRect(0.5 - rackShift * 3.5, -1.8, (isLv5 ? 9 : 7.5), 1.6);
    tCtx.fillStyle = "#ffd166"; tCtx.fillRect((isLv5 ? 13 : 8.5), -1.5, 2.4, 2.6);
    return;
  }

  if (wpnId === 75) {
    tCtx.fillStyle = "#311b92"; tCtx.fillRect(-2, -4.5, 8, 9);
    tCtx.strokeStyle = "#b388ff"; tCtx.lineWidth = 1.1; tCtx.strokeRect(-2, -4.5, 8, 9);
    tCtx.fillStyle = "#00ff88"; tCtx.beginPath(); tCtx.arc(2, 0, 1.8, 0, Math.PI * 2); tCtx.fill();
    return;
  }
  if (wpnId >= 56 && wpnId <= 74) {
    const isStaff = [65, 71, 72].includes(wpnId);
    tCtx.fillStyle = wpnId === 70 ? "#cfd8dc" : (wpnId === 71 ? "#eceff1" : "#5d4037");
    tCtx.fillRect(-2, -1.0, (isStaff ? 17 : 11.5) * lenMul, isStaff ? 2.2 : 1.6);
    tCtx.fillStyle = effCol;
    tCtx.beginPath(); tCtx.arc((isStaff ? 15 : 10) * lenMul, 0, isStaff ? 2.6 : 1.8, 0, Math.PI * 2); tCtx.fill();
    return;
  }

  const isHeavy = [15, 28, 31, 33, 40, 44, 53].includes(wpnId) || style === "cone";
  tCtx.fillStyle = "#263238";
  tCtx.fillRect(-3.5, -1.6, (isHeavy ? 15 : 12) * lenMul, isHeavy ? 3.4 : 2.6);
  tCtx.fillStyle = isSuper ? "#ffd166" : "#90a4ae";
  tCtx.fillRect(1 - rackShift * 3.0, -2.0, 6.5, 1.5);
  if (style === "beam" || style === "chain") {               // v14.2: a dark barrel with a tiny energy emitter — guns never get a glowing blade
    tCtx.fillStyle = "#37474f";
    tCtx.fillRect(6, -0.8, 6 * lenMul, 1.6);
    tCtx.fillStyle = effCol;
    tCtx.fillRect(6 + 6 * lenMul - 1.1, -0.65, 1.1, 1.3);
  }
}

// v11: a blade posed by the Saber Form Engine (js/saberforms.js): exact sim geometry, grip, motion trail, stowed hilt.
// Grievous' extra blades (R.extra) are drawn the same way from their own engine states.
function drawHeroSwingingArm(tCtx, arm, sleeveCol, handCol, strokeW = 2.6) {
  if (!arm) return;
  tCtx.save();
  tCtx.strokeStyle = sleeveCol; tCtx.lineWidth = strokeW; tCtx.lineCap = "round"; tCtx.lineJoin = "round";
  tCtx.beginPath(); tCtx.moveTo(arm.shX, arm.shY); tCtx.lineTo(arm.elbowX, arm.elbowY); tCtx.lineTo(arm.handX, arm.handY); tCtx.stroke();
  if (arm.isRear) {
    tCtx.strokeStyle = "rgba(0,0,0,0.22)";
    tCtx.beginPath(); tCtx.moveTo(arm.shX, arm.shY); tCtx.lineTo(arm.elbowX, arm.elbowY); tCtx.lineTo(arm.handX, arm.handY); tCtx.stroke();
  }
  drawBallHand(tCtx, arm.handX, arm.handY, 2.25, handCol);
  tCtx.restore();
}

function drawSaberFormSlot(tCtx, w, R, col, handCol, aim, slotIdx, pose = null, sleeveCol = "#37474f") {
  drawSaberBladePose(tCtx, w, R, col, handCol, aim, slotIdx, R.st, true, pose, sleeveCol);
  if (R.extra) for (let k = 0; k < R.extra.length; k++) {
    const X = R.extra[k];
    if (X && typeof X.arm === "number") drawSaberBladePose(tCtx, w, X, col, handCol, aim, X.slot, X.st, false, pose, sleeveCol);
  }
}

function drawSaberBladePose(tCtx, w, R, col, handCol, aim, slotIdx, bladeSt, main, pose = null, sleeveCol = "#37474f") {
  const sideSign = (slotIdx % 2 === 0) ? 1 : -1, upper = slotIdx >= 2 ? -3.5 : 0;
  if (R.lit < 0.5 && typeof SF_STEEL_IDS !== "undefined" && SF_STEEL_IDS.includes(w.id) && typeof sheatheDraw === "function") {   // v14.2: steel goes in the scabbard
    if (main) sheatheDraw(tCtx, w, slotIdx, true, col, handCol, pose, sleeveCol);
    return;
  }
  if (bladeSt && bladeSt.fly && typeof sagaDrawFly === "function" && sagaDrawFly(tCtx, w, R, bladeSt, col, handCol, slotIdx)) return;   // v14.2: hilt flying to the hand
  if (R.lit < 0.04 && !(bladeSt && bladeSt.hand > 0.5)) {  // retracted: hilt clipped to the belt, arms swing naturally with gait
    const beltX = pose ? (pose.torsoShiftX + 4.8 * pose.torsoScaleX * sideSign) : (4.8 * sideSign);
    const beltY = (pose ? pose.torsoBobY : 0) + 4.8 + upper;
    tCtx.save();
    tCtx.translate(beltX, beltY);
    tCtx.rotate(Math.PI / 2 - 0.3 * sideSign);
    drawWeaponModel(tCtx, w.id, "orbit", w.lvl >= 5, w.lvl >= 10, col, 0, 0, -1, R.dbl, w.hilt);
    tCtx.restore();
    if (main && slotIdx === 0 && pose && pose.arms) {
      drawHeroSwingingArm(tCtx, pose.arms[1], sleeveCol, handCol, 2.5);
    } else if (!pose) {
      drawBallHand(tCtx, 7.2 * sideSign, 1.2 + upper, 2.4, handCol);
    }
    return;
  }
  if (typeof saberDrawTrail === "function") saberDrawTrail(tCtx, w, col, bladeSt);
  // Connect matching-side shoulder(s) to the active saber grip hand(s) with clean upper-arm sleeves.
  const sHandX = Math.cos(R.arm) * R.reach - Math.sin(R.arm) * R.side;
  const sHandY = Math.sin(R.arm) * R.reach + Math.cos(R.arm) * R.side;
  const pTx = pose ? pose.torsoShiftX : 0;
  const pTy = pose ? pose.torsoBobY : 0;
  const pSx = pose ? pose.torsoScaleX : 1;
  const leadSide = sHandX >= pTx ? 1 : -1;
  tCtx.save();
  tCtx.strokeStyle = sleeveCol; tCtx.lineWidth = 2.35; tCtx.lineCap = "round";
  tCtx.beginPath(); tCtx.moveTo(pTx + leadSide * 4.5 * pSx, -3.3 + pTy + upper * 0.5); tCtx.lineTo(sHandX, sHandY); tCtx.stroke();
  if (R.grip === 2 || R.dbl) {
    const offDist = R.dbl ? -4.2 : -3.6;
    const h2X = sHandX + Math.cos(R.blade) * offDist;
    const h2Y = sHandY + Math.sin(R.blade) * offDist;
    tCtx.beginPath(); tCtx.moveTo(pTx - leadSide * 4.5 * pSx, -3.3 + pTy + upper * 0.5); tCtx.lineTo(h2X, h2Y); tCtx.stroke();
  }
  tCtx.restore();

  tCtx.save();
  tCtx.rotate(R.arm);
  tCtx.translate(R.reach, R.side);
  tCtx.save();
  tCtx.rotate(R.blade - R.arm);
  const blade2Grow = R.dbl && bladeSt && bladeSt.len2K != null && bladeSt.len2K < 0.999 && typeof sagaDrawBlade2 === "function";   // v14.2 Maul: the second blade ignites late
  drawWeaponModel(tCtx, w.id, "orbit", w.lvl >= 5, w.lvl >= 10, col, 0, 0, Math.max(0.5, R.len), blade2Grow ? false : R.dbl, w.hilt);
  if (blade2Grow) sagaDrawBlade2(tCtx, R, bladeSt, col);
  if (R.grip === 2 || R.dbl) drawBallHand(tCtx, R.dbl ? -4.2 : -3.6, 0, 2.3, handCol);   // second hand on the hilt
  tCtx.restore();
  drawBallHand(tCtx, 0, 0, 2.5, handCol);
  tCtx.restore();
  if (main && slotIdx === 0 && R.grip !== 2 && !R.dbl && !R.extra) {   // the free hand
    let ox = null, oy = null;
    if (R.off === "front") { ox = Math.cos(aim) * 10; oy = Math.sin(aim) * 10 - 3; }             // Soresu: extended
    else if (R.off === "back") { ox = -Math.cos(aim) * 5.5; oy = -Math.sin(aim) * 5.5 - 5; }     // Makashi: raised behind
    else if (R.off === "fist") { ox = Math.cos(aim + 0.9) * 6.5; oy = Math.sin(aim + 0.9) * 6.5; } // Vader: clenched
    if (ox !== null) {
      tCtx.save();
      tCtx.strokeStyle = sleeveCol; tCtx.lineWidth = 2.2; tCtx.lineCap = "round";
      tCtx.beginPath(); tCtx.moveTo(pTx - leadSide * 4.5 * pSx, -3.3 + pTy); tCtx.lineTo(ox, oy); tCtx.stroke();
      tCtx.restore();
      drawBallHand(tCtx, ox, oy, R.off === "fist" ? 2.4 : 2.3, handCol);
    }
  }
}

/*
 * Directional pose, isometric 8-direction walk-cycle & cel-light helpers.
 * Characters are upright 2.5D/isometric sprites, never rotated sideways or
 * tilted backward/horizontally to fake heading. Ground locomotion keeps the
 * vertical upright axis intact (bodyRot === 0) while movement heading drives:
 *   - true isometric leg projection (hip sockets, forward knee flexion,
 *     directional heel-strike / toe-off boots, rear-to-front depth sorting),
 *   - velocity-driven walkBlend so idle heroes plant both feet cleanly,
 *   - continuous 3/4 and side-profile torso narrowing, shoulder counter-twist,
 *     cloak/pack trailing shift, and directional head/visor/hair cues.
 * Sun key is upper-left.
 */
const HERO_KEY_LIGHT_ANGLE = -2.28; // upper-left in screen/world coordinates
function heroBodyRotation(facingAngle) {
  // Grounded sprites never rotate off vertical.
  return 0;
}

function computeHeroWalkPose(cid, walk = 0, facingAngle = Math.PI / 2, walkBlend = null, flightPose = null, airOpts = null) {
  const ang = Number.isFinite(facingAngle) ? facingAngle : Math.PI / 2;
  const fx = Math.cos(ang), fy = Math.sin(ang);
  const absFx = Math.abs(fx), absFy = Math.abs(fy);
  const profileK = absFx;                 // 0 = pure N/S front/back, 1 = pure E/W side profile
  const backView = fy < -0.35;            // N / NE / NW show back of head/cloak/pack
  const sideSign = fx >= 0 ? 1 : -1;
  const gait = getHeroGaitProfile(cid);
  const archetype = gait.archetype || "balanced";
  const stanceW = gait.stanceW || 2.75;
  const liftMul = gait.liftMul !== undefined ? gait.liftMul : 1.0;
  const kneeMul = gait.kneeMul !== undefined ? gait.kneeMul : 1.0;
  const swayMul = gait.swayMul !== undefined ? gait.swayMul : 1.0;
  const leanMul = gait.leanMul !== undefined ? gait.leanMul : 1.0;
  const armSwingMul = gait.armSwingMul !== undefined ? gait.armSwingMul : 1.0;
  const hoverMode = gait.hoverMode || "none";
  const gaitPhase = (walk || 0) * gait.cadence;
  const rawMove = walkBlend !== null && walkBlend !== undefined
    ? walkBlend
    : (Math.abs(walk || 0) > 0.001 ? 1 : 0);
  const moveKBase = Math.max(0, Math.min(1, rawMove));

  const isJetFlyer = !!(airOpts && airOpts.flyer);
  const acrobatZ = (airOpts && airOpts.acrobatZ) ? airOpts.acrobatZ : 0;
  const isAcroAir = acrobatZ > 3;
  const isHoverCruising = hoverMode === "always" || (hoverMode === "move" && moveKBase > 0.15);
  const isHovering = !!flightPose || isJetFlyer || isHoverCruising;
  const moveK = (flightPose || isJetFlyer || isAcroAir || hoverMode === "always" || (hoverMode === "move" && moveKBase > 0.45))
    ? (isHoverCruising && !flightPose && !isJetFlyer ? moveKBase * 0.25 : 0)
    : moveKBase;

  const flightSpeed = flightPose ? Math.hypot(flightPose.vx || 0, flightPose.vy || 0) : 0;
  const flightAngle = flightSpeed > 0.01 ? Math.atan2(flightPose.vy || 0, flightPose.vx || 0) - ang : 0;
  const flightAmount = flightPose
    ? Math.min(1, flightSpeed / Math.max(1, flightPose.top || 42))
    : ((isJetFlyer || isHoverCruising) ? moveKBase : 0);

  // Double-frequency bipedal vertical bob: hips dip on heel-strike contact, rise smoothly on mid-stance passing.
  const walkBob = isHovering || isAcroAir || archetype === "astromech"
    ? 0
    : -Math.cos(gaitPhase * 2) * Math.min(0.88, gait.bob * 0.95) * moveK;
  // Hover elevation for true levitators (steady hover float, NEVER applied to grounded soldiers/Jedi).
  const hoverLift = isHoverCruising && !flightPose && !isJetFlyer
    ? (hoverMode === "always" ? 3.2 : 2.6 * moveKBase)
    : 0;
  // Lateral hip weight shift over stance foot (pronounced on Chewbacca/Hagrid/Yoda, tight on T-800/tactical).
  const hipShiftX = -Math.sin(gaitPhase) * (1 - profileK * 0.72) * 0.65 * swayMul * moveK;
  // Subtle forward horizontal athletic commitment (no sprite rotation, never backward/upward tilt).
  const torsoShiftX = hipShiftX * 0.5 + fx * 0.72 * leanMul * (isHovering ? flightAmount * 0.9 : moveK);
  const torsoScaleX = 1 - profileK * (archetype === "heavy" ? 0.20 : 0.26);
  const torsoBobY = walkBob * 0.6;
  const headShiftX = torsoShiftX + fx * 0.35 * leanMul * (isHovering ? flightAmount * 0.8 : moveK);
  const headBobY = walkBob * 0.85;
  const faceShiftX = fx * 2.05;
  const shoulderTwist = -Math.sin(gaitPhase) * 0.9 * armSwingMul * moveK;
  const backPackShiftX = -fx * (1.7 + profileK * 2.1);
  const capeSway = Math.sin(gaitPhase) * 1.15 * (isHovering ? (0.4 + flightAmount * 0.8) : moveK);

  // Perpendicular axis in top-down ground space: left/right sockets narrow naturally into depth in side profile.
  const px = -fy, py = fx;
  const strideLen = gait.stride * 1.22;
  const isoY = 0.52;

  const buildLeg = (side) => {
    const phase = gaitPhase + (side < 0 ? 0 : Math.PI);
    const hipX = hipShiftX + side * px * stanceW;
    const hipY = 3.5 + side * py * 0.55;
    let ankleX, ankleY, kneeX, kneeY, lift = 0, swing = 0, bootAng = 0;

    if (isAcroAir) {
      // Agile mid-air Form-IV / acrobat leap tuck: knees pulled cleanly up, zero mid-air pedaling.
      const tuckLead = side < 0 ? 1 : -0.5;
      swing = tuckLead * 0.55;
      kneeX = hipX + fx * (1.4 + tuckLead * 0.8);
      kneeY = hipY + 2.2 - (side < 0 ? 0.7 : 0.2);
      ankleX = hipX - fx * 0.5 + fx * tuckLead * 0.6;
      ankleY = 8.1 - (side < 0 ? 1.1 : 0.5);
      lift = 1.6;
      bootAng = fx * 0.28;
    } else if (flightPose || isJetFlyer || isHoverCruising) {
      // Hover/flight posture: relaxed trailing legs angled behind travel direction, calm poised vertical drop at hover idle.
      const fLead = (side < 0 ? 0.85 : -0.55) * flightAmount;
      swing = fLead;
      ankleX = hipX - fx * (1.1 + fLead * 1.35) * flightAmount;
      ankleY = 9.4 + side * py * 0.4 - fy * fLead * 0.85 - (side < 0 ? 0.65 : 0.2) * (0.35 + 0.65 * flightAmount);
      kneeX = (hipX + ankleX) * 0.5 + fx * (0.85 * flightAmount + (side < 0 ? 0.25 : 0));
      kneeY = (hipY + ankleY) * 0.5 - (side < 0 ? 0.3 : 0);
      bootAng = fx * 0.24 * flightAmount;
    } else {
      swing = Math.sin(phase) * moveK;                        // +1 forward along heading, -1 pushing off behind
      const recovery = Math.max(0, Math.cos(phase)) * moveK;  // >0 ONLY while swinging forward & moving (0 at idle!)
      lift = recovery * (1.95 + absFy * 0.45) * liftMul;
      const stepX = fx * swing * strideLen;
      const stepY = fy * swing * strideLen * isoY;
      ankleX = hipX + stepX;
      ankleY = 9.7 + side * py * 0.45 + stepY - lift;
      // Anatomical forward knee bend along movement heading (never bends backward).
      const kneeForward = (0.35 + recovery * 1.55) * kneeMul * moveK;
      kneeX = (hipX + ankleX) * 0.5 + fx * kneeForward;
      kneeY = (hipY + ankleY) * 0.5 + fy * kneeForward * 0.35 - recovery * 0.6 * liftMul;
      bootAng = fx * (-swing * 0.22 * moveK);
    }
    const toeX = fx * (1.45 + profileK * 0.55);
    const toeY = fy * 0.55;
    // Depth key: larger depth draws closer to viewer (in front).
    const depth = (ankleY - 9.7) * 0.8 + side * py * 1.25;
    return { side, phase, hipX, hipY, kneeX, kneeY, ankleX, ankleY, toeX, toeY, bootAng, lift, swing, depth, isRear: false };
  };

  const legL = buildLeg(-1), legR = buildLeg(1);
  const legs = legL.depth <= legR.depth ? [legL, legR] : [legR, legL];
  legs[0].isRear = true;
  legs[1].isRear = false;

  const buildArm = (side) => {
    const phase = gaitPhase + (side < 0 ? Math.PI : 0); // opposite leg phase: natural counter-swing!
    const swing = Math.sin(phase) * moveK * armSwingMul;
    const shHalf = (archetype === "heavy" ? 5.8 : 5.4) * torsoScaleX;
    const shX = torsoShiftX + side * px * shHalf + fx * shoulderTwist * side;
    const shY = -3.6 + torsoBobY + side * py * 0.45;
    const armReachX = fx * swing * 2.85 + side * px * 0.7;
    const armReachY = fy * swing * 1.35;
    const elbowX = shX + armReachX * 0.5 - fx * 0.45 * moveK;
    const elbowY = shY + 3.2 + armReachY * 0.45;
    const handX = shX + armReachX;
    const handY = shY + 6.2 + armReachY - Math.abs(swing) * 0.45;
    const depth = side * py * 1.5 + fy * swing * 0.5;
    return { side, shX, shY, elbowX, elbowY, handX, handY, swing, depth, isRear: false };
  };
  const armL = buildArm(-1), armR = buildArm(1);
  const arms = armL.depth <= armR.depth ? [armL, armR] : [armR, armL];
  arms[0].isRear = true;
  arms[1].isRear = false;

  const strideSpread = Math.abs(legR.ankleX - legL.ankleX);
  const stride = flightPose
    ? (Math.sin(flightAngle) * 2.1 + Math.cos(flightAngle) * 0.8) * flightAmount
    : Math.sin(gaitPhase) * gait.stride * moveK;

  return {
    ang, fx, fy, absFx, absFy, profileK, backView, sideSign,
    gait, archetype, gaitPhase, moveK, moveKBase, bodyRot: 0,
    isHovering, hoverLift, isAcroAir, tripodK: archetype === "astromech" ? moveKBase : 0,
    walkBob, hipShiftX, torsoShiftX, torsoScaleX, torsoBobY,
    headShiftX, headBobY, faceShiftX, shoulderTwist, backPackShiftX, capeSway,
    stride, legs, arms,
    shadow: { rx: (archetype === "heavy" ? 6.8 : 6.1) + absFx * Math.min(2.4, strideSpread * 0.28), ry: 2.55 + absFy * 0.35, ox: hipShiftX * 0.5 }
  };
}

function drawHeroCellShading(tCtx, bodyRot, walk = 0, pose = null, cloakCoversLegs = false) {
  if (!tCtx || typeof opts !== "undefined" && opts.cellShade === false) return;
  const light = HERO_KEY_LIGHT_ANGLE - (bodyRot || 0), lx = Math.cos(light), ly = Math.sin(light);
  const shade = (paint) => {
    tCtx.save(); paint(); tCtx.clip();
    const grad = tCtx.createLinearGradient(-lx * 8, -ly * 10, lx * 8, ly * 10);
    grad.addColorStop(0, "rgba(255,255,230,0.22)"); grad.addColorStop(0.24, "rgba(255,255,255,0.08)");
    grad.addColorStop(0.48, "rgba(0,0,0,0)"); grad.addColorStop(0.74, "rgba(0,0,0,0.10)"); grad.addColorStop(1, "rgba(0,0,0,0.32)");
    tCtx.fillStyle = grad; tCtx.fillRect(-16, -23, 32, 38); tCtx.restore();
  };
  const tx = pose ? pose.torsoShiftX : 0;
  const ty = pose ? pose.torsoBobY : 0;
  const sx = pose ? pose.torsoScaleX : 1;
  const hx = pose ? pose.headShiftX : 0;
  const hy = pose ? pose.headBobY : 0;

  // Shoulder/torso cel bands follow the actual turned 3/4 or profile torso silhouette.
  shade(() => {
    tCtx.beginPath();
    tCtx.moveTo(tx - 4.8 * sx, ty - 5.5); tCtx.lineTo(tx - 5.9 * sx, ty - 3.5);
    tCtx.lineTo(tx - 5.4 * sx, ty + 3.9); tCtx.quadraticCurveTo(tx, ty + 5.3, tx + 5.4 * sx, ty + 3.9);
    tCtx.lineTo(tx + 5.9 * sx, ty - 3.5); tCtx.lineTo(tx + 4.8 * sx, ty - 5.5);
    tCtx.closePath();
  });
  // Head volume rim + shadow band aligned with live head offset.
  shade(() => { tCtx.beginPath(); tCtx.ellipse(hx, hy - 9.4, 5.4, 5.7, 0, 0, Math.PI * 2); });
  // Leg volume shading synced to articulated leg joints — skip when rear cloak occludes the legs in North views!
  if (pose && pose.legs && !cloakCoversLegs) {
    for (const lg of pose.legs) {
      shade(() => {
        tCtx.beginPath();
        tCtx.moveTo(lg.hipX - 1.7, lg.hipY); tCtx.lineTo(lg.kneeX - 1.7, lg.kneeY); tCtx.lineTo(lg.ankleX - 1.7, lg.ankleY + 0.8);
        tCtx.lineTo(lg.ankleX + 1.7, lg.ankleY + 0.8); tCtx.lineTo(lg.kneeX + 1.7, lg.kneeY); tCtx.lineTo(lg.hipX + 1.7, lg.hipY);
        tCtx.closePath();
      });
    }
  }
  // Thin ink contour and sunlit upper-left shoulder rim.
  tCtx.save(); tCtx.strokeStyle = "rgba(10,16,24,0.68)"; tCtx.lineWidth = 0.78;
  tCtx.beginPath();
  tCtx.moveTo(tx - 5.8 * sx, ty - 3.2); tCtx.lineTo(tx - 5.3 * sx, ty + 3.9);
  tCtx.quadraticCurveTo(tx, ty + 5.3, tx + 5.3 * sx, ty + 3.9); tCtx.lineTo(tx + 5.8 * sx, ty - 3.2);
  tCtx.stroke();
  tCtx.strokeStyle = "rgba(255,248,214,0.46)"; tCtx.lineWidth = 0.68;
  tCtx.beginPath(); tCtx.moveTo(tx - 4.5 * sx, ty - 5.0); tCtx.quadraticCurveTo(tx - 6.0 * sx, ty - 2.3, tx - 5.1 * sx, ty + 0.5); tCtx.stroke();
  tCtx.restore();
}

/* === 4. CANON 88+1 HERO SPRITE RENDERER (ISOMETRIC 8-DIR GAIT, STATURE SCALING, SPECIAL HEROES) === */
const HELMET_HEROES = new Set([1, 2, 4, 7, 9, 17, 19, 23, 26, 29, 30, 32, 33, 47, 49, 50, 54, 55, 76]);

function drawHeroSprite(x, y, fac, cid, walk = 0, aim = 0, inVeh = 0, tCtx = ctx, guardZone = -1, flightPose = null, facingAngle = Math.PI / 2, walkBlend = null) {
  const out = typeof getOutfit === "function" ? getOutfit(cid) : { head: 0, torso: 0, legs: 0, back: 0, blade: 0 };
  const pal = typeof getHeroOutfits === "function" ? getHeroOutfits(cid) : null;
  const cHead = (pal && pal.head && pal.head[out.head || 0]) ? pal.head[out.head || 0][1] : fac.c1;
  const cTorso = (pal && pal.torso && pal.torso[out.torso || 0]) ? pal.torso[out.torso || 0][1] : fac.c2;
  const cLegs = (pal && pal.legs && pal.legs[out.legs || 0]) ? pal.legs[out.legs || 0][1] : "#37474f";
  const cBack = (pal && pal.back && pal.back[out.back || 0]) ? pal.back[out.back || 0][1] : "#263238";
  const cBlade = (pal && pal.blade && pal.blade[out.blade || 0])
    ? pal.blade[out.blade || 0][1]
    : (typeof getWeaponColor === "function" ? getWeaponColor(cid) : fac.c1);

  const isLivePlayer = (tCtx === ctx && typeof player !== "undefined" && player && player.cid === cid);
  const kStyle = getHeroKinematicStyle(cid);
  const bSpec = getHeroBodySpec(cid);
  const acrobatZ = isLivePlayer ? (player.acrobatZ || 0) : 0;
  // v13 creator jetpack: the hero really flies - raised sprite over a ground shadow
  const flyer = cid === CUSTOM_CID && typeof customHasJetpack === "function" && customHasJetpack();
  const pose = computeHeroWalkPose(cid, walk, facingAngle, walkBlend, flightPose, { flyer, acrobatZ });
  const bodyRot = pose.bodyRot, localAim = aim - bodyRot;
  const gait = pose.gait, gaitPhase = pose.gaitPhase, backView = pose.backView, stride = pose.stride;
  const hoverBob = pose.isHovering
    ? Math.sin((typeof runTime !== "undefined" ? runTime : 0) * 5.2) * 1.45
    : pose.walkBob;
  // Ground movement never rolls the full sprite; only airborne flight gets a tiny bank.
  const flightSpeed = flightPose ? Math.hypot(flightPose.vx || 0, flightPose.vy || 0) : 0;
  const flightAngle = flightSpeed > 0.01 ? Math.atan2(flightPose.vy || 0, flightPose.vx || 0) - pose.ang : 0;
  const flightAmount = flightPose ? Math.min(1, flightSpeed / Math.max(1, flightPose.top || 42)) : 0;
  const bankAng = flightPose ? Math.max(-0.045, Math.min(0.045, Math.sin(flightAngle) * flightAmount * 0.045)) : 0;

  const flyLift = (flyer ? 7.5 + Math.sin((typeof runTime !== "undefined" ? runTime : 0) * 3.1) * 1.4 : 0) + (pose.hoverLift || 0);
  // Ground contact shadow anchors every hero cleanly to the terrain plane.
  if (!inVeh && tCtx === ctx) {
    const airLift = flyLift + acrobatZ;
    const shScale = Math.max(0.55, 1 - airLift * 0.022);
    tCtx.save();
    tCtx.fillStyle = airLift > 1 ? "rgba(0,0,0,0.28)" : "rgba(0,0,0,0.34)";
    tCtx.beginPath();
    tCtx.ellipse(x + pose.shadow.ox * bSpec.sx, y + (10.5 + bSpec.yOff) * 1, pose.shadow.rx * bSpec.sx * shScale, pose.shadow.ry * bSpec.sy * shScale, 0, 0, Math.PI * 2);
    tCtx.fill();
    tCtx.restore();
  }
  tCtx.save();
  tCtx.translate(x, y + hoverBob + bSpec.yOff - acrobatZ - flyLift);
  if (bodyRot) tCtx.rotate(bodyRot);
  if (bankAng !== 0) tCtx.rotate(bankAng);
  if (acrobatZ > 2 && isLivePlayer && player.acrobatFlip) tCtx.rotate(player.acrobatFlip * 0.5);

  if (inVeh === 1) {
    tCtx.fillStyle = "#00acc1";
    tCtx.beginPath(); tCtx.ellipse(0, 6, 18, 9, 0, 0, Math.PI * 2); tCtx.fill();
    tCtx.strokeStyle = "#00e5ff"; tCtx.lineWidth = 1.4; tCtx.stroke();
  } else if (inVeh === 2) {
    tCtx.fillStyle = "#455a64";
    tCtx.fillRect(-15, -10, 30, 24);
    tCtx.strokeStyle = "#ffd166"; tCtx.lineWidth = 1.5; tCtx.strokeRect(-15, -10, 30, 24);
  }

  tCtx.scale(bSpec.sx, bSpec.sy);

  // SPECIAL CASE #04: R2-D2 Small Cylindrical Astromech Droid (8-dir tripod rolling + rotating dome + wheel treads)
  if (cid === 4) {
    const tK = pose.tripodK || 0;
    const px = -pose.fy, py = pose.fx;
    const bodyScaleX = 1 - pose.profileK * 0.14;
    const treadOff = ((walk || 0) * 5.2) % 2.4;
    const drawSideLeg = (side, isRear) => {
      const lx = side * px * 6.0 - pose.fx * tK * 0.8;
      const ly = side * py * 0.65;
      tCtx.save();
      tCtx.translate(lx, ly);
      tCtx.fillStyle = isRear ? "#90a4ae" : cLegs;
      tCtx.fillRect(-1.4, -3.2, 2.8, 12.6);
      tCtx.fillStyle = isRear ? "#546e7a" : "#90a4ae";
      tCtx.fillRect(-2.1, 8.2, 4.2, 2.4);
      // Rolling wheel tread markers inside foot housing
      tCtx.fillStyle = "#263238";
      tCtx.fillRect(-1.6, 9.8, 3.2, 1.1);
      if (tK > 0.08) {
        tCtx.fillStyle = "#cfd8dc";
        tCtx.fillRect(-1.3 + treadOff * 0.7, 9.9, 0.8, 0.9);
      }
      tCtx.restore();
    };
    const lLeft = { side: -1, depth: -1 * py }, lRight = { side: 1, depth: 1 * py };
    const farLeg = lLeft.depth <= lRight.depth ? lLeft : lRight;
    const nearLeg = lLeft.depth <= lRight.depth ? lRight : lLeft;

    // Far side leg behind chassis
    drawSideLeg(farLeg.side, true);

    // Center third tripod leg deploys forward/down along heading while rolling
    const cLegX = pose.fx * (1.2 + tK * 2.6);
    const cLegY = 4.2 + pose.fy * tK * 1.4 + tK * 1.3;
    if (backView) {
      tCtx.fillStyle = cLegs; tCtx.fillRect(cLegX - 1.4, cLegY, 2.8, 5.2);
      tCtx.fillStyle = "#78909c"; tCtx.fillRect(cLegX - 1.9, cLegY + 4.2, 3.8, 1.8);
    }

    // Cylindrical astromech barrel chassis
    tCtx.save();
    tCtx.scale(bodyScaleX, 1);
    tCtx.fillStyle = cTorso;
    tCtx.fillRect(-5.5, -5.5, 11.0, 11.5);
    if (backView) {
      // Rear utility panel & power vents when rolling North
      tCtx.fillStyle = cHead;
      tCtx.fillRect(-3.6, -3.4, 7.2, 1.6);
      tCtx.fillStyle = "#90a4ae";
      tCtx.fillRect(-3.2, -0.8, 6.4, 4.4);
      tCtx.fillStyle = "#455a64";
      tCtx.fillRect(-2.2, 0.2, 4.4, 1.0);
      tCtx.fillRect(-2.2, 2.0, 4.4, 1.0);
    } else {
      const fS = pose.faceShiftX * 0.55;
      tCtx.fillStyle = cHead;
      tCtx.fillRect(-3.8 + fS * 0.4, -4.2, 7.6 * (1 - pose.profileK * 0.18), 1.8);
      tCtx.fillRect(-3.6 + fS * 0.45, -1.5, 3.0, 4.2);
      tCtx.fillRect(0.6 + fS * 0.45, -1.5, 3.0, 4.2);
    }
    tCtx.restore();

    if (!backView && tK > 0.05) {
      tCtx.fillStyle = cLegs; tCtx.fillRect(cLegX - 1.4, cLegY, 2.8, 5.2);
      tCtx.fillStyle = "#90a4ae"; tCtx.fillRect(cLegX - 2.0, cLegY + 4.3, 4.0, 1.9);
      tCtx.fillStyle = "#263238"; tCtx.fillRect(cLegX - 1.5, cLegY + 5.6, 3.0, 1.0);
    }

    // Near side leg in front of barrel (reads cleanly in E/W side profile!)
    drawSideLeg(nearLeg.side, false);

    // Rotating silver astromech dome
    tCtx.fillStyle = "#cfd8dc";
    tCtx.beginPath(); tCtx.arc(0, -5.5, 5.5, Math.PI, 0); tCtx.fill();
    if (backView) {
      tCtx.fillStyle = cHead;
      tCtx.fillRect(-3.8, -8.8, 7.6, 2.0);
      tCtx.fillStyle = "#546e7a";
      tCtx.fillRect(-1.4, -10.0, 2.8, 1.2);
    } else {
      const domeShift = pose.faceShiftX * 0.72;
      tCtx.fillStyle = cHead;
      tCtx.fillRect(-4.1 + domeShift * 0.45, -9.2, 2.4, 2.2);
      tCtx.fillRect(1.5 + domeShift * 0.45, -9.2, 2.4, 2.2);
      tCtx.fillStyle = "#111111";
      tCtx.beginPath(); tCtx.arc(domeShift * 0.9, -8.2, 1.5, 0, Math.PI * 2); tCtx.fill();
      tCtx.fillStyle = "#ff1744";
      tCtx.beginPath(); tCtx.arc(domeShift * 0.8 + 2.0, -6.8, 0.85, 0, Math.PI * 2); tCtx.fill();
    }

    tCtx.save();
    tCtx.rotate(localAim);
    tCtx.fillStyle = "#90a4ae";
    tCtx.fillRect(5, -1.2, 8.5, 2.4);
    tCtx.fillStyle = "#00e5ff";
    tCtx.beginPath(); tCtx.arc(14, 0, 2.0, 0, Math.PI * 2); tCtx.fill();
    tCtx.restore();
    tCtx.restore();
    return;
  }

  const hasJetpack = [1, 16, 25, 47, 54].includes(cid) || flyer;
  const drawBackGear = () => {
    const bpX = pose.torsoShiftX + pose.backPackShiftX;
    const bpY = pose.torsoBobY;
    const bpScaleX = backView ? pose.torsoScaleX : (0.72 + (1 - pose.profileK) * 0.28);
    tCtx.save();
    tCtx.translate(bpX, bpY);
    if (hasJetpack) {
      const jpW = 12.6 * bpScaleX;
      tCtx.fillStyle = cBack !== "none" ? cBack : "#37474f";
      tCtx.fillRect(-jpW * 0.5, -5.4, jpW, 9.2);
      tCtx.fillStyle = "rgba(0,0,0,0.22)";
      tCtx.fillRect(-jpW * 0.5 + 1.0, -4.4, jpW * 0.34, 7.2);
      tCtx.fillRect(jpW * 0.16, -4.4, jpW * 0.34, 7.2);
      if (flyer) {
        tCtx.fillStyle = "#455a64";
        tCtx.fillRect(-jpW * 0.42, 3.6, 3.1 * bpScaleX, 2.0);
        tCtx.fillRect(jpW * 0.12, 3.6, 3.1 * bpScaleX, 2.0);
      } else if ((flightPose && flightPose.jet) || (pose.moveK > 0.25 && Math.abs(stride) > 0.6)) {
        tCtx.fillStyle = "#ff9100";
        tCtx.fillRect(-jpW * 0.38, 3.8, 2.6 * bpScaleX, 3.5 + Math.random() * 2.5);
        tCtx.fillRect(jpW * 0.12, 3.8, 2.6 * bpScaleX, 3.5 + Math.random() * 2.5);
      }
      const sigDef = (typeof HERO_SIG_GEAR !== "undefined" && HERO_SIG_GEAR[cid]) ? HERO_SIG_GEAR[cid] : null;
      const maxCD = sigDef ? sigDef[5] * (isLivePlayer ? player.cdr : 1) : 7.5;
      const rocketInFlight = isLivePlayer && player.sigGearCD > (maxCD - 1.55);
      if (!rocketInFlight && cid === 54) {
        const sway = pose.capeSway * 0.55;
        tCtx.fillStyle = "#cfd8dc";
        tCtx.fillRect(-1.7 + sway, -18.2, 3.4, 6.4);
        tCtx.fillStyle = "#d84315";
        tCtx.beginPath();
        tCtx.moveTo(-2.3 + sway, -18.2); tCtx.lineTo(sway, -22.6); tCtx.lineTo(2.3 + sway, -18.2);
        tCtx.closePath(); tCtx.fill();
      }
    } else if (cBack && cBack !== "none") {
      const topW = 6.2 * bpScaleX;
      const botW = (7.2 + pose.moveK * 1.1) * bpScaleX;
      const trailX = -pose.fx * (1.4 + pose.moveK * 1.8) + pose.capeSway;
      tCtx.fillStyle = cBack;
      tCtx.beginPath();
      tCtx.moveTo(-topW, -4.4);
      tCtx.lineTo(topW, -4.4);
      tCtx.quadraticCurveTo(topW + trailX * 0.35, 2.4, botW + trailX * 0.55, 8.6);
      tCtx.quadraticCurveTo(trailX * 0.45, 9.6, -botW + trailX * 0.35, 8.6);
      tCtx.quadraticCurveTo(-topW + trailX * 0.15, 2.4, -topW, -4.4);
      tCtx.closePath();
      tCtx.fill();
      tCtx.fillStyle = "rgba(0,0,0,0.16)";
      tCtx.fillRect(-topW * 0.45, -4.0, topW * 0.9, 11.4);
    }
    tCtx.restore();
  };

  // Cloak/jetpack renders BEHIND body when facing South/East/West, and OVER torso back when walking North!
  if (!backView) drawBackGear();

  if (cid === 30) {
    tCtx.strokeStyle = "#111"; tCtx.lineWidth = 2.2;
    tCtx.beginPath(); tCtx.moveTo(pose.torsoShiftX, 5);
    tCtx.quadraticCurveTo(pose.torsoShiftX - pose.fx * 10 + 4, 8 + Math.sin(walk * 3) * 3.5, pose.torsoShiftX - pose.fx * 14 + 6, -2);
    tCtx.stroke();
  }

  // Holstered Secondary Weapons on Back/Hips (Each retains its own w.bladeCol!)
  if (isLivePlayer && player.weapons && player.weapons.length > 1) {
    const enabled = player.weapons.filter(w => w.enabled !== false);
    const armCap = player.armCap || 2;
    const activeSet = new Set();
    for (let s = 0; s < Math.min(armCap, enabled.length); s++) {
      activeSet.add(enabled[(player.handSlotOffset + s) % enabled.length]);
    }
    let hIdx = 0;
    player.weapons.forEach(w => {
      if (activeSet.has(w)) return;
      const wHolsterCol = (w.id === cid && !w.ownCol)
        ? cBlade
        : (w.bladeCol || (typeof getWeaponColor === "function" ? getWeaponColor(w.id) : cBlade));
      tCtx.save();
      if (hIdx % 2 === 0) { tCtx.translate(pose.torsoShiftX - 4 * pose.torsoScaleX, -3 + pose.torsoBobY); tCtx.rotate(-0.85 - hIdx * 0.18); }
      else { tCtx.translate(pose.torsoShiftX + (hIdx === 1 ? -6.2 : 6.2) * pose.torsoScaleX, 4 + pose.torsoBobY); tCtx.rotate(Math.PI * 0.48); }
      tCtx.scale(0.72, 0.72);
      drawWeaponModel(tCtx, w.id, w.style, w.lvl >= 5, w.lvl >= 10, wHolsterCol, 0, 0, 0, w.dbl ? true : null, w.hilt);
      tCtx.restore();
      hIdx++;
    });
  }

  const isHelmeted = HELMET_HEROES.has(cid);
  const isFemale = FEMALE_HEROES.has(cid);
  const isBlinking = isLivePlayer && (player.blinkDur || 0) > 0;
  const handCol = (cid === CUSTOM_CID && typeof customHandCol === "function") ? customHandCol() : isHelmeted ? cHead : ((cid === CUSTOM_CID && typeof customSkinCol === "function") ? customSkinCol()
    : (cid === 79 ? "#7cb342" : (cid === 77 ? "#111111" : (cid === 78 ? "#5d4037" : "#f1c27d"))));

  // Determine active weapons early so we only draw a free swinging off-arm when the hero is NOT already holding a 2-handed or dual weapon!
  const activeWpns = isLivePlayer
    ? (() => {
        const en = player.weapons.filter(w => w.enabled !== false);
        const cap = Math.min(player.armCap || 2, en.length);
        const arr = [];
        for (let s = 0; s < cap; s++) arr.push(en[(player.handSlotOffset + s) % en.length]);
        return arr;
      })()
    : ((cid === CUSTOM_CID && typeof customPreviewWeapons === "function") ? customPreviewWeapons()
      : [{ id: cid, style: (CHAR_RAW[cid] ? CHAR_RAW[cid][6] : "beam"), lvl: 1, bladeCol: cBlade }]);

  const primaryWpn = activeWpns[0] || null;
  const primaryIsBlade = primaryWpn && (typeof isMeleeBladeWeapon === "function"
    ? isMeleeBladeWeapon(primaryWpn)
    : ((typeof isSwordWeapon === "function" && isSwordWeapon(primaryWpn.id)) || (primaryWpn.style === "orbit" && ![12, 16, 29, 35, 44, 73].includes(primaryWpn.id))));
  const primarySfR = (isLivePlayer && primaryIsBlade && typeof saberRenderState === "function") ? saberRenderState(primaryWpn) : null;
  const primaryHybridGun = !!(primaryWpn && typeof isHybridGunBlade === "function" && isHybridGunBlade(primaryWpn.id) && (!primarySfR || primarySfR.lit < 0.08));
  const primaryCarryBlade = !!(primaryIsBlade && !primaryHybridGun);
  const primaryCarryGun = !!(primaryWpn && !primaryCarryBlade && (kStyle <= 3 || (typeof gaIsGun === "function" && gaIsGun(primaryWpn.id))));
  const primaryNeoTwin = !!(primaryWpn && primaryWpn.id === 39 && (activeWpns.length === 1 || kStyle === 5));
  const primaryStowed = isLivePlayer && primaryWpn && (
    (primaryCarryBlade && primarySfR && primarySfR.lit < 0.04 && !(primarySfR.st && primarySfR.st.hand > 0.5)) ||
    (typeof sheatheStowed === "function" && (primaryCarryBlade || primaryCarryGun) && sheatheStowed(primaryWpn, primaryCarryBlade))
  );
  const rearArmFree = guardZone < 0 && !primaryNeoTwin && (primaryStowed || (activeWpns.length === 1 && !primaryHybridGun && (kStyle === 4 || kStyle === 5)));

  // Depth-sorted rear swinging arm renders BEHIND the torso ONLY when the hero actually has a free off-hand (zero phantom 3rd hands!).
  if (rearArmFree && pose.arms && pose.arms[0]) {
    drawHeroSwingingArm(tCtx, pose.arms[0], cTorso, handCol, 2.45);
  }

  // Isometric 2-segment articulated legs (depth-sorted rear-to-front, forward-bending knees, directional boots, planted idle).
  const legWidth = kStyle === 1 ? 3.05 : 3.45;
  const drawArticulatedLeg = (lg) => {
    tCtx.save();
    tCtx.lineCap = "round"; tCtx.lineJoin = "round";
    // Thigh (hip -> knee) and shin (knee -> ankle)
    tCtx.strokeStyle = cLegs; tCtx.lineWidth = legWidth;
    tCtx.beginPath();
    tCtx.moveTo(lg.hipX, lg.hipY);
    tCtx.lineTo(lg.kneeX, lg.kneeY);
    tCtx.lineTo(lg.ankleX, lg.ankleY);
    tCtx.stroke();
    if (lg.isRear) {
      tCtx.strokeStyle = "rgba(0,0,0,0.24)"; tCtx.lineWidth = legWidth;
      tCtx.beginPath();
      tCtx.moveTo(lg.hipX, lg.hipY);
      tCtx.lineTo(lg.kneeX, lg.kneeY);
      tCtx.lineTo(lg.ankleX, lg.ankleY);
      tCtx.stroke();
    }
    // Subtle knee cap highlight on forward-bending leg
    if (!lg.isRear && pose.moveK > 0.15) {
      tCtx.fillStyle = "rgba(255,255,255,0.12)";
      tCtx.beginPath(); tCtx.arc(lg.kneeX, lg.kneeY, 1.05, 0, Math.PI * 2); tCtx.fill();
    }
    // Directional boot pointing along movement heading with heel-strike / toe-off pitch
    tCtx.translate(lg.ankleX + lg.toeX * 0.45, lg.ankleY + 0.65 + lg.toeY * 0.25);
    if (lg.bootAng) tCtx.rotate(lg.bootAng);
    const bootRx = 2.05 + pose.profileK * 0.65;
    const bootRy = 1.12;
    tCtx.fillStyle = lg.isRear ? "#182026" : "#263238";
    tCtx.beginPath(); tCtx.ellipse(0, 0, bootRx, bootRy, 0, 0, Math.PI * 2); tCtx.fill();
    tCtx.fillStyle = lg.isRear ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.16)";
    tCtx.beginPath(); tCtx.ellipse(pose.fx * 0.45, -0.25, bootRx * 0.55, bootRy * 0.42, 0, 0, Math.PI * 2); tCtx.fill();
    tCtx.restore();
  };
  for (const lg of pose.legs) drawArticulatedLeg(lg);

  if (flyer) {                                                    // v13: thruster jets blasting down toward the ground shadow
    const burn = 4.5 + Math.abs(stride) * 1.2 + Math.random() * 2.5;
    for (const lg of pose.legs) {
      const jx = lg.ankleX, jy = lg.ankleY + 1.0;
      tCtx.fillStyle = "rgba(255,120,0,0.9)";
      tCtx.beginPath(); tCtx.moveTo(jx - 1.6, jy); tCtx.lineTo(jx + 1.6, jy); tCtx.lineTo(jx, jy + burn); tCtx.closePath(); tCtx.fill();
      tCtx.fillStyle = "#fff59d";
      tCtx.beginPath(); tCtx.moveTo(jx - 0.8, jy); tCtx.lineTo(jx + 0.8, jy); tCtx.lineTo(jx, jy + burn * 0.55); tCtx.closePath(); tCtx.fill();
    }
  }

  // Contoured torso narrows cleanly into 3/4 and side profile without breaking custom armor or emblems.
  tCtx.save();
  tCtx.translate(pose.torsoShiftX, pose.torsoBobY);
  tCtx.scale(pose.torsoScaleX, 1);

  tCtx.fillStyle = cTorso;
  tCtx.beginPath();
  tCtx.moveTo(-4.8, -5.5); tCtx.lineTo(-5.9, -3.5);
  tCtx.lineTo(-5.3, 4.4); tCtx.quadraticCurveTo(0, 5.4, 5.3, 4.4);
  tCtx.lineTo(5.9, -3.5); tCtx.lineTo(4.8, -5.5);
  tCtx.closePath(); tCtx.fill();
  if (cid === CUSTOM_CID && typeof drawCustomArmor === "function") drawCustomArmor(tCtx, stride, cTorso, pose);   // v13 creator armour

  if (cid === 33) {
    tCtx.fillStyle = cTorso;
    tCtx.fillRect(-8.0, -5.8, 3.0, 5.1);
    tCtx.fillRect(5.0, -5.8, 3.0, 5.1);
  }

  if (cid === 5) {
    tCtx.strokeStyle = "#cfd8dc"; tCtx.lineWidth = 2.0;
    tCtx.beginPath();
    if (backView) { tCtx.moveTo(5.4, -4.9); tCtx.lineTo(-5.4, 3.9); }
    else { tCtx.moveTo(-5.4, -4.9); tCtx.lineTo(5.4, 3.9); }
    tCtx.stroke();
    tCtx.fillStyle = "#90a4ae";
    for (let k = -2; k <= 2; k++) {
      const bx = (backView ? -k : k) * 1.9, by = -0.5 + k * 1.4;
      tCtx.fillRect(bx - 0.65, by - 0.65, 1.3, 1.3);
    }
  }

  if (!backView) {
    if (cid === 76) {
      tCtx.fillStyle = "#263238"; tCtx.fillRect(-2.6, -2.8, 5.2, 4.2);
      tCtx.fillStyle = "#ff1744"; tCtx.fillRect(-1.8, -2.0, 1.4, 1.4);
      tCtx.fillStyle = "#00e676"; tCtx.fillRect(0.4, -2.0, 1.4, 1.4);
    } else if (cid !== CUSTOM_CID || (typeof customNeckCol === "function" && customNeckCol())) {
      tCtx.fillStyle = cid === CUSTOM_CID ? customNeckCol() : cHead;   // v13: the creator's collar is skin (none under beskar / plating)
      tCtx.beginPath();
      tCtx.moveTo(-3.2, -5.5); tCtx.lineTo(3.2, -5.5); tCtx.lineTo(0, -1.2);
      tCtx.closePath(); tCtx.fill();
    }
  }

  tCtx.fillStyle = "#1c262b"; tCtx.fillRect(-5.5, 2.5, 11.0, 2.2);
  if (!backView) {
    tCtx.fillStyle = "#ffd166"; tCtx.fillRect(-1.5 + pose.fx * 1.1, 2.5, 3.0, 2.2);
  }
  tCtx.restore();

  // Back-facing octants (N / NE / NW): draw cape or jetpack ON the character's back!
  if (backView) drawBackGear();

  // Directional head/helmet/face assembly tracks heading (front, 3/4, profile, rear) smoothly.
  const eyeLookX = pose.faceShiftX * 0.45 + Math.cos(localAim) * 0.45;
  const eyeLookY = Math.sin(localAim) * 0.35;
  const fShift = pose.faceShiftX;

  tCtx.save();
  tCtx.translate(pose.headShiftX, pose.headBobY);
  if (isHelmeted) {
    if (cid === CUSTOM_CID && typeof drawCustomHelmet === "function") {
      drawCustomHelmet(tCtx, eyeLookX, isLivePlayer, pose);
    } else if (cid === 30) {
      tCtx.fillStyle = cHead;
      tCtx.beginPath();
      tCtx.moveTo(-6.5, -8.5); tCtx.lineTo(-8.5, -18.0); tCtx.lineTo(0, -15.5); tCtx.lineTo(8.5, -18.0); tCtx.lineTo(6.5, -8.5);
      tCtx.closePath(); tCtx.fill();
      tCtx.beginPath(); tCtx.arc(0, -9.5, 5.0, 0, Math.PI * 2); tCtx.fill();
      if (!backView) {
        tCtx.fillStyle = "#cfd8dc"; tCtx.fillRect(-2.2 + fShift * 0.65, -7.2, 4.4, 1.4);
      }
    } else if (cid === 76) {
      tCtx.fillStyle = cHead;
      tCtx.beginPath();
      tCtx.arc(0, -10.2, 5.8, Math.PI, 0);
      tCtx.lineTo(7.0, -5.8); tCtx.lineTo(-7.0, -5.8);
      tCtx.closePath(); tCtx.fill();
      if (backView) {
        tCtx.strokeStyle = "rgba(255,255,255,0.18)"; tCtx.lineWidth = 0.9;
        tCtx.beginPath(); tCtx.moveTo(0, -15.8); tCtx.lineTo(0, -6.0); tCtx.stroke();
        tCtx.fillStyle = "rgba(0,0,0,0.26)"; tCtx.fillRect(-6.2, -7.2, 12.4, 1.6);
      } else {
        tCtx.fillStyle = "#263238";
        tCtx.beginPath(); tCtx.arc(-2.0 + fShift * 0.72, -9.8, 1.65, 0, Math.PI * 2); tCtx.fill();
        tCtx.beginPath(); tCtx.arc(2.0 + fShift * 0.72, -9.8, 1.65, 0, Math.PI * 2); tCtx.fill();
        tCtx.strokeStyle = "#546e7a"; tCtx.lineWidth = 0.9;
        tCtx.beginPath(); tCtx.moveTo(fShift * 0.72, -8.8); tCtx.lineTo(-2.3 + fShift * 0.72, -6.0); tCtx.lineTo(2.3 + fShift * 0.72, -6.0); tCtx.closePath(); tCtx.stroke();
      }
    } else {
      tCtx.fillStyle = cHead;
      tCtx.beginPath(); tCtx.arc(0, -9.5, 5.5, 0, Math.PI * 2); tCtx.fill();

      if (cid === 54 || cid === 1) {
        if (backView) {
          tCtx.fillStyle = "rgba(0,0,0,0.24)"; tCtx.fillRect(-4.6, -7.2, 9.2, 2.2);
          tCtx.strokeStyle = "rgba(255,255,255,0.16)"; tCtx.lineWidth = 0.9;
          tCtx.beginPath(); tCtx.moveTo(0, -14.8); tCtx.lineTo(0, -5.0); tCtx.stroke();
        } else {
          const vW = 7.4 * (1 - pose.profileK * 0.25);
          const vx = fShift * 0.85;
          tCtx.fillStyle = "#111";
          tCtx.fillRect(vx - vW * 0.5, -10.8, vW, 1.8);
          tCtx.fillRect(vx - 0.95, -10.8, 1.9, 4.6);
        }
        const visorOn = !isLivePlayer || player.activeVisor === 1;
        const rfSide = pose.fx < -0.3 ? -1 : 1;
        tCtx.strokeStyle = "#b0bec5"; tCtx.lineWidth = 1.2;
        tCtx.beginPath(); tCtx.moveTo(5.1 * rfSide, -10);
        if (visorOn && !backView) {
          tCtx.lineTo(7.0 * rfSide, -12.5); tCtx.lineTo(2.4 * rfSide, -12.5); tCtx.stroke();
          tCtx.fillStyle = "#00e676"; tCtx.fillRect(rfSide > 0 ? 1.2 : -3.4, -13.2, 2.2, 1.5);
        } else {
          tCtx.lineTo(5.1 * rfSide, -16.5); tCtx.stroke();
          tCtx.fillStyle = "#cfd8dc"; tCtx.fillRect(5.1 * rfSide - 1.3, -17.2, 2.6, 1.5);
        }
      } else if (backView) {
        tCtx.fillStyle = "rgba(0,0,0,0.22)"; tCtx.fillRect(-4.6, -7.2, 9.2, 2.1);
        tCtx.strokeStyle = "rgba(255,255,255,0.16)"; tCtx.lineWidth = 0.85;
        tCtx.beginPath(); tCtx.moveTo(0, -14.8); tCtx.lineTo(0, -5.2); tCtx.stroke();
      } else if (cid === 55) {
        tCtx.fillStyle = cHead;
        tCtx.fillRect(-7.5, -12.0, 2.2, 5.0);
        tCtx.fillRect(5.3, -12.0, 2.2, 5.0);
        tCtx.fillStyle = "#ffd166";
        tCtx.fillRect(-3.0 + fShift * 0.72, -10.6, 2.1, 1.6);
        tCtx.fillRect(0.9 + fShift * 0.72, -10.6, 2.1, 1.6);
        tCtx.fillStyle = "#263238";
        for (let k = -2; k <= 2; k += 2) tCtx.fillRect(k + fShift * 0.55 - 0.4, -7.8, 0.8, 2.2);
      } else if (cid === 32 || cid === 33 || cid === 47) {
        const vW = 7.0 * (1 - pose.profileK * 0.25);
        tCtx.fillStyle = cid === 33 ? "#00e676" : "#ffd166";
        tCtx.fillRect(fShift * 0.85 - vW * 0.5, -11.0, vW, 2.6);
        tCtx.strokeStyle = "#111"; tCtx.lineWidth = 0.8;
        tCtx.strokeRect(fShift * 0.85 - vW * 0.5, -11.0, vW, 2.6);
      } else if (cid === 2 || cid === 19) {
        tCtx.fillStyle = cid === 2 ? "#ff1744" : "#ffd166";
        tCtx.fillRect(-3.0 + fShift * 0.72, -10.6, 2.1, 1.6);
        tCtx.fillRect(0.9 + fShift * 0.72, -10.6, 2.1, 1.6);
        tCtx.fillStyle = "#263238"; tCtx.fillRect(-1.7 + fShift * 0.72, -7.8, 3.4, 2.0);
      } else {
        const vW = 7.2 * (1 - pose.profileK * 0.25);
        tCtx.fillStyle = "#111"; tCtx.fillRect(fShift * 0.85 - vW * 0.5, -10.8, vW, 2.2);
        tCtx.fillStyle = "#ff1744";
        tCtx.fillRect(fShift * 0.85 - vW * 0.34, -10.4, vW * 0.68, 1.5);
      }
    }
  } else {
    const skinCol = (cid === CUSTOM_CID && typeof customSkinCol === "function") ? customSkinCol()
      : (typeof heroExtraSkin === "function" && heroExtraSkin(cid)) ? heroExtraSkin(cid)
      : cid === 79 ? "#7cb342"
      : (cid === 77 ? "#d50000"
      : (cid === 78 ? "#5d4037"
      : (cid === 70 ? "#e0e7e9"
      : (cid === 75 ? "#cfd8dc"
      : (cid === 5 ? "#795548"
      : (cid === 10 ? "#b0bec5"
      : (cid === 11 ? "#90a4ae"
      : ([8, 9, 24].includes(cid) ? "#c68642" : "#f1c27d"))))))));

    if (cid === 79) {
      // Yoda's iconic long ears sweep subtly back in profile and stay symmetric in front/back views.
      const leftSpan = backView ? 11.8 : (11.8 - Math.max(0, -pose.fx) * 5.2 + Math.max(0, pose.fx) * 1.4);
      const rightSpan = backView ? 11.8 : (11.8 - Math.max(0, pose.fx) * 5.2 + Math.max(0, -pose.fx) * 1.4);
      tCtx.fillStyle = "#7cb342";
      tCtx.beginPath();
      tCtx.moveTo(-4.3, -10.8); tCtx.lineTo(-leftSpan, -12.1 + pose.profileK * 0.7); tCtx.lineTo(-4.3, -7.6);
      tCtx.moveTo(4.3, -10.8);  tCtx.lineTo(rightSpan, -12.1 + pose.profileK * 0.7);  tCtx.lineTo(4.3, -7.6);
      tCtx.closePath(); tCtx.fill();
    } else if (pose.profileK > 0.35 && !backView) {
      // Subtle ear silhouette on the trailing side of the head strengthens East/West profile reading.
      tCtx.fillStyle = skinCol;
      tCtx.beginPath(); tCtx.arc(-pose.sideSign * 4.9, -9.2, 1.35, 0, Math.PI * 2); tCtx.fill();
    }

    tCtx.fillStyle = skinCol;
    tCtx.beginPath(); tCtx.arc(0, cid === 10 ? -10.2 : -9.3, cid === 10 ? 6.2 : 5.2, 0, Math.PI * 2); tCtx.fill();

    if (cid === 77) {
      tCtx.fillStyle = "#111111";
      tCtx.fillRect(-3.8 + fShift * 0.4, -12.5, 2.2, 6.5);
      tCtx.fillRect(1.6 + fShift * 0.4, -12.5, 2.2, 6.5);
      tCtx.fillStyle = "#d7ccc8";
      [[-4.2, -13.5], [-1.8, -14.8], [0, -15.2], [1.8, -14.8], [4.2, -13.5]].forEach(([hx, hy]) => {
        tCtx.beginPath();
        tCtx.moveTo(hx - 1.0, -12.2); tCtx.lineTo(hx, hy); tCtx.lineTo(hx + 1.0, -12.2);
        tCtx.closePath(); tCtx.fill();
      });
    } else if (cid === 79) {
      tCtx.fillStyle = "#eceff1";
      tCtx.fillRect(-5.4, -11.5, 1.4, 2.8);
      tCtx.fillRect(4.0, -11.5, 1.4, 2.8);
    } else if (cid === 75) {
      tCtx.fillStyle = "#212121";
      tCtx.beginPath();
      tCtx.moveTo(-5.5, -12.5); tCtx.lineTo(-4.0, -17.0); tCtx.lineTo(0, -14.0); tCtx.lineTo(4.0, -17.0); tCtx.lineTo(5.5, -12.5);
      tCtx.closePath(); tCtx.fill();
    } else if (![10, 21, 70, 78].includes(cid)) {
      tCtx.fillStyle = cHead;
      tCtx.beginPath(); tCtx.arc(0, -10.3, 5.4, Math.PI * 0.92, Math.PI * 2.08); tCtx.fill();
      if (cid !== 52) {
        // Side hair drapes thicker on the trailing side during side profile so the face opens toward the direction of travel!
        const leftW = pose.fx > 0.25 ? 2.5 : 1.5;
        const rightW = pose.fx < -0.25 ? 2.5 : 1.5;
        tCtx.fillRect(-5.3, -11.0, leftW, 4.4);
        tCtx.fillRect(5.3 - rightW, -11.0, rightW, 4.4);
      }
    }

    if (!backView) {
      tCtx.save();
      tCtx.translate(fShift * 0.82, 0);
      if (cid === 61) {
        tCtx.fillStyle = "#3e2723";
        tCtx.beginPath(); tCtx.arc(0, -5.8, 5.4, 0, Math.PI); tCtx.fill();
      } else if ([69, 71, 72].includes(cid)) {
        tCtx.fillStyle = "#eceff1";
        tCtx.beginPath();
        tCtx.moveTo(-3.6, -6.8); tCtx.lineTo(3.6, -6.8); tCtx.lineTo(0, 1.8);
        tCtx.closePath(); tCtx.fill();
      } else if ([51, 24, 45, 73].includes(cid)) {
        tCtx.fillStyle = "#212121"; tCtx.fillRect(-3.2, -6.6, 6.4, 1.8);
      }
      tCtx.restore();

      if (typeof heroExtraHead === "function") heroExtraHead(tCtx, cid, cHead);   // v14.2 registered heroes (js/heroreg.js)

      // Directional eyes & glasses shift naturally across 3/4 and profile views (far eye foreshortens in full profile).
      const fxEye = fShift * 0.92;
      const showLeftEye = !(pose.profileK > 0.78 && pose.fx > 0);
      const showRightEye = !(pose.profileK > 0.78 && pose.fx < 0);
      const leftEyeX = -3.3 + fxEye;
      const rightEyeX = 1.0 + fxEye;

      if (cid === 10) {
        tCtx.fillStyle = "#0a0a0c";
        if (showLeftEye) { tCtx.beginPath(); tCtx.ellipse(leftEyeX + 1.0, -10.0, 2.0, 1.3, 0.25, 0, Math.PI * 2); tCtx.fill(); }
        if (showRightEye) { tCtx.beginPath(); tCtx.ellipse(rightEyeX + 1.0, -10.0, 2.0, 1.3, -0.25, 0, Math.PI * 2); tCtx.fill(); }
      } else if (cid === 39) {
        tCtx.fillStyle = "#0a0a0a";
        if (showLeftEye) tCtx.fillRect(leftEyeX - 0.3, -10.6, 3.0, 1.8);
        if (showRightEye) tCtx.fillRect(rightEyeX - 0.2, -10.6, 3.0, 1.8);
        if (showLeftEye && showRightEye) tCtx.fillRect(fxEye - 0.8, -10.2, 1.8, 0.7);
      } else if (!isBlinking) {
        const eyeW = (isFemale ? 2.3 : 2.1) * (1 - pose.profileK * 0.16);
        const eyeH = cid === 52 ? 0.9 : (isFemale ? 2.0 : 1.8);
        tCtx.fillStyle = cid === 75 ? "#111111" : "#ffffff";
        if (showLeftEye) tCtx.fillRect(leftEyeX, -10.6, eyeW, eyeH);
        if (showRightEye) tCtx.fillRect(rightEyeX, -10.6, eyeW, eyeH);
        const pupilCol = [3, 12, 21, 70].includes(cid) ? "#ff1744"
          : (cid === 77 ? "#ffab00"
          : (cid === 75 ? "#00ff88"
          : (cid === 18 ? "#00b0ff"
          : (cid === 48 ? "#ffd166" : "#111111"))));
        tCtx.fillStyle = pupilCol;
        const pOffX = pose.fx * 0.45 + Math.cos(localAim) * 0.25;
        if (showLeftEye) tCtx.fillRect(leftEyeX + 0.5 + pOffX * 0.4, -10.3 + eyeLookY * 0.35, 1.3, cid === 52 ? 0.9 : 1.35);
        if (showRightEye) tCtx.fillRect(rightEyeX + 0.5 + pOffX * 0.4, -10.3 + eyeLookY * 0.35, 1.3, cid === 52 ? 0.9 : 1.35);
        if (isFemale) {
          tCtx.strokeStyle = "#111"; tCtx.lineWidth = 0.8;
          if (showLeftEye) { tCtx.beginPath(); tCtx.moveTo(leftEyeX - 0.1, -10.6); tCtx.lineTo(leftEyeX + eyeW, -10.6); tCtx.stroke(); }
          if (showRightEye) { tCtx.beginPath(); tCtx.moveTo(rightEyeX - 0.1, -10.6); tCtx.lineTo(rightEyeX + eyeW, -10.6); tCtx.stroke(); }
        }
        if (cid === 40 && showRightEye) { tCtx.fillStyle = "#ff1744"; tCtx.fillRect(rightEyeX, -10.6, eyeW, 1.9); }
        if (cid === 65) {
          tCtx.strokeStyle = "#3e2723"; tCtx.lineWidth = 1.0;
          tCtx.beginPath(); tCtx.moveTo(-4.8 + fxEye * 0.4, -11.5); tCtx.lineTo(4.8 + fxEye * 0.4, -9.0); tCtx.stroke();
          if (showRightEye) { tCtx.fillStyle = "#00e5ff"; tCtx.beginPath(); tCtx.arc(rightEyeX + 1.0, -9.8, 1.75, 0, Math.PI * 2); tCtx.fill(); }
        }
        if (cid === 56) {
          tCtx.strokeStyle = "#111111"; tCtx.lineWidth = 0.85;
          if (showLeftEye) { tCtx.beginPath(); tCtx.arc(leftEyeX + 1.0, -9.7, 1.75, 0, Math.PI * 2); tCtx.stroke(); }
          if (showRightEye) { tCtx.beginPath(); tCtx.arc(rightEyeX + 1.0, -9.7, 1.75, 0, Math.PI * 2); tCtx.stroke(); }
          tCtx.strokeStyle = "#ff1744"; tCtx.lineWidth = 0.9;
          tCtx.beginPath(); tCtx.moveTo(1.1 + fxEye * 0.7, -13.2); tCtx.lineTo(0.5 + fxEye * 0.7, -12.0); tCtx.lineTo(1.4 + fxEye * 0.7, -11.2); tCtx.stroke();
        }
        if (cid === 59) {
          tCtx.strokeStyle = "#ff4081"; tCtx.lineWidth = 1.1;
          if (showLeftEye) { tCtx.beginPath(); tCtx.arc(leftEyeX + 1.0, -9.7, 1.9, 0, Math.PI * 2); tCtx.stroke(); }
          tCtx.strokeStyle = "#00e5ff";
          if (showRightEye) { tCtx.beginPath(); tCtx.arc(rightEyeX + 1.0, -9.7, 1.9, 0, Math.PI * 2); tCtx.stroke(); }
        }
      } else {
        tCtx.strokeStyle = "#111"; tCtx.lineWidth = 1.0;
        if (showLeftEye) { tCtx.beginPath(); tCtx.moveTo(leftEyeX, -9.8); tCtx.lineTo(leftEyeX + 2.1, -9.8); tCtx.stroke(); }
        if (showRightEye) { tCtx.beginPath(); tCtx.moveTo(rightEyeX, -9.8); tCtx.lineTo(rightEyeX + 2.1, -9.8); tCtx.stroke(); }
      }
    } else if (![4, 10, 30, 55, 79].includes(cid)) {
      // Back-facing octants (N / NE / NW): render rear hair/cranium & nape contour while hiding eyes/face.
      tCtx.fillStyle = [21, 70, 78].includes(cid) ? skinCol : cHead;
      tCtx.beginPath(); tCtx.ellipse(0, -9.8, 5.45, 5.55, 0, 0, Math.PI * 2); tCtx.fill();
      if (cid === 81) {
        // Qui-Gon's signature shoulder-length hair drapes cleanly over the back of his neck.
        tCtx.fillRect(-5.2, -9.5, 10.4, 7.6);
      }
      tCtx.fillStyle = "rgba(0,0,0,0.16)";
      tCtx.beginPath(); tCtx.ellipse(0, -6.5, 4.1, 1.85, 0, 0, Math.PI * 2); tCtx.fill();
      if (typeof heroExtraHead === "function" && [34, 35, 36, 37, 38, 84, 85, 86, 87, 88].includes(cid)) heroExtraHead(tCtx, cid, cHead);
    }

    if (cid === 52) {
      tCtx.fillStyle = "#4e342e";
      tCtx.beginPath();
      tCtx.moveTo(-4.8, -12.4); tCtx.lineTo(-3.4, -16.8); tCtx.lineTo(3.4, -16.8); tCtx.lineTo(4.8, -12.4);
      tCtx.closePath(); tCtx.fill();
      tCtx.fillStyle = "#3e2723";
      tCtx.fillRect(-8.0, -12.8, 16.0, 1.6);
      if (!backView) {
        tCtx.fillStyle = "#6d4c41";
        tCtx.fillRect(1.0 + fShift * 0.7, -6.8, 4.0, 1.1);
        tCtx.fillStyle = "#ff6d00";
        tCtx.fillRect(4.8 + fShift * 0.7, -6.8, 1.1, 1.1);
      }
    } else if ([66, 69, 71].includes(cid)) {
      tCtx.fillStyle = cHead;
      tCtx.beginPath();
      tCtx.moveTo(-6.5, -12.2); tCtx.lineTo(0, -19.5); tCtx.lineTo(6.5, -12.2);
      tCtx.closePath(); tCtx.fill();
    } else if (cid === 53) {
      tCtx.fillStyle = "#ff1744"; tCtx.fillRect(-5.4, -12.2, 10.8, 1.8);
    }
    if (cid === CUSTOM_CID && typeof drawCustomSpeciesExtras === "function") {   // v12/v13 creator: species details + headgear
      drawCustomSpeciesExtras(tCtx, eyeLookX, pose);
    }
  }
  tCtx.restore();

  const swapP = isLivePlayer ? (player.swapPause || 0) : 0;
  const recoil = isLivePlayer ? (player.recoilKick || 0) * 2.4 : 0;
  const armReach = isLivePlayer ? (player.armReach || 0) : 0;

  let reachBack = 0, rackShift = 0;
  if (swapP > 0.16) reachBack = ((swapP - 0.16) / 0.08) * 8.5;
  else if (swapP > 0.08) reachBack = ((0.16 - swapP) / 0.08) * 6.5;
  else if (swapP > 0) rackShift = Math.sin((swapP / 0.08) * Math.PI);

  if (isLivePlayer && player.forceHandTimer > 0) {
    tCtx.save();
    tCtx.rotate((player.forceHandAng || aim) - bodyRot);
    drawBallHand(tCtx, 11.5, -3.5, 2.7, handCol, "#00e5ff");
    tCtx.strokeStyle = "rgba(0, 229, 255, 0.75)";
    tCtx.lineWidth = 1.3;
    tCtx.beginPath(); tCtx.arc(13.5, -3.5, 4.5 + Math.sin(runTime * 35) * 1.5, -0.9, 0.9); tCtx.stroke();
    tCtx.restore();
  }

  if (guardZone >= 0) {
    drawBallHand(tCtx, 5.5, -7.5, 2.8, handCol);
    drawBallHand(tCtx, -5.5, -5.5, 2.8, handCol);
  } else {
    activeWpns.forEach((w, slotIdx) => {
      const isMeleeBlade = typeof isMeleeBladeWeapon === "function"
        ? isMeleeBladeWeapon(w)
        : ((typeof isSwordWeapon === "function" && isSwordWeapon(w.id)) || (w.style === "orbit" && ![12, 16, 29, 35, 44, 73].includes(w.id)));
      if (isLivePlayer && slotIdx === 0 && typeof thrownBlade !== "undefined" && thrownBlade.active && isMeleeBlade) {
        return;
      }

      // Each weapon uses its own independent canonical bladeCol (while primary weapon respects your Outfit Customizer)!
      const wActiveCol = (w.id === cid && !w.ownCol)
        ? cBlade
        : (w.bladeCol || (typeof getWeaponColor === "function" ? getWeaponColor(w.id) : cBlade));

      const isHybrid = typeof isHybridGunBlade === "function" && isHybridGunBlade(w.id);
      const sfR = (isLivePlayer && isMeleeBlade && typeof saberRenderState === "function") ? saberRenderState(w) : null;
      // Hybrid gun+blade heroes (#32 Master Chief MA5B/Energy Sword, #33 Doom Slayer Super Shotgun/Crucible)
      // render their glowing blade in CQC (sfR.lit >= 0.08), and cleanly fall through to their firearm at range.
      if (sfR && (!isHybrid || sfR.lit >= 0.08)) { drawSaberFormSlot(tCtx, w, sfR, wActiveCol, handCol, localAim, slotIdx, pose, cTorso); return; }
      const carryBlade = isMeleeBlade && !isHybrid;
      const carryGun = !carryBlade && (kStyle <= 3 || (typeof gaIsGun === "function" && gaIsGun(w.id)));
      // v14.2: blades sheathe on the back and guns holster when no threat is near (js/sheathe.js)
      if (isLivePlayer && typeof sheatheStowed === "function" && (carryBlade || carryGun) && sheatheStowed(w, carryBlade)) { sheatheDraw(tCtx, w, slotIdx, carryBlade, wActiveCol, handCol, pose, cTorso); return; }

      const isTelekineticSlot = (slotIdx >= 2 && kStyle === 5) || (kStyle === 5 && slotIdx >= 1 && w.style !== "chain");
      const armAng = (isLivePlayer && typeof w.armAng === "number")
        ? w.armAng - bodyRot
        : (localAim + (slotIdx === 0 ? 0 : (slotIdx === 1 ? 0.18 : (slotIdx === 2 ? -0.35 : 0.42))));
      const wristSpin = (isLivePlayer && typeof w.wristSpin === "number") ? w.wristSpin : 0;
      // v14.2 low ready: an idle gun stays in hand, muzzle lowered toward the ground ahead (js/sheathe.js)
      const lowK = (isLivePlayer && carryGun && typeof sheatheLowK === "function") ? sheatheLowK() : 0;

      if (isTelekineticSlot) {
        const floatAng = (typeof runTime !== "undefined" ? runTime * 2.6 : 0) + slotIdx * 2.1;
        const fx = Math.cos(floatAng) * 16, fy = Math.sin(floatAng) * 16 - 6;
        tCtx.save();
        tCtx.translate(fx, fy);
        tCtx.strokeStyle = "rgba(0, 229, 255, 0.55)";
        tCtx.lineWidth = 1.0;
        tCtx.beginPath(); tCtx.arc(0, 0, 6.5, 0, Math.PI * 2); tCtx.stroke();
        tCtx.rotate(armAng + wristSpin);
        drawWeaponModel(tCtx, w.id, w.style, w.lvl >= 5, w.lvl >= 10, wActiveCol, 0, w.angVel || 0);
        tCtx.restore();
        return;
      }

      const sideSign = (slotIdx % 2 === 0) ? 1 : -1;
      const upperArmY = slotIdx >= 2 ? -6.5 : -1.5;
      const strideBob = lowK > 0.05 ? Math.sin(pose.gaitPhase * 2) * 0.65 * pose.moveK : 0;
      const reachDist = (kStyle === 0 ? 7.2 : (kStyle === 1 ? 9.2 : 8.5)) + armReach - recoil - reachBack - lowK * 2.4;
      // In Low Ready while walking, carry the gun along actual movement heading instead of aiming backward at an old target!
      let carryAng = armAng;
      if (lowK > 0.05) {
        let angDiff = pose.ang - armAng;
        while (angDiff > Math.PI) angDiff -= Math.PI * 2;
        while (angDiff < -Math.PI) angDiff += Math.PI * 2;
        carryAng = armAng + angDiff * lowK;
      }
      const effAng = carryAng + lowK * 0.58 * (Math.cos(carryAng) >= 0 ? 1 : -1);
      const hx = reachDist;
      const hy = sideSign * (activeWpns.length === 1 && kStyle <= 2 ? 1.5 : 4.5) + (slotIdx >= 2 ? upperArmY * 0.5 : 0) + strideBob;

      // Connect matching-side shoulder to active weapon hand with a clean upper-arm sleeve (never crossing across the back cape!).
      const wxHand = Math.cos(effAng) * hx - Math.sin(effAng) * hy;
      const wyHand = Math.sin(effAng) * hx + Math.cos(effAng) * hy;
      const armSide = wxHand >= pose.torsoShiftX ? 1 : -1;
      const shX = pose.torsoShiftX + armSide * 4.6 * pose.torsoScaleX;
      const shY = -3.3 + pose.torsoBobY;
      tCtx.save();
      tCtx.strokeStyle = cTorso; tCtx.lineWidth = 2.4; tCtx.lineCap = "round";
      tCtx.beginPath(); tCtx.moveTo(shX, shY); tCtx.lineTo(wxHand, wyHand); tCtx.stroke();
      tCtx.restore();

      const drawMuzzleFlashAtTip = () => {
        if (!isLivePlayer || carryBlade || lowK >= 0.35 || typeof muzzleFlashTimer === "undefined" || muzzleFlashTimer <= 0) return;
        const gDef = (typeof GUNS !== "undefined" && GUNS[w.id]) ? GUNS[w.id] : null;
        if (!gDef && w.id !== 86) return;
        const supOn = typeof gauSuppressed === "function" && gauSuppressed(w.id);
        const canExt = (supOn && gDef && gDef.can && typeof GA !== "undefined") ? gDef.can[0] * (GA.supK || 0) : 0;
        const mx = (gDef ? gDef.mz[0] : 6.4) + canExt;
        const my = gDef ? gDef.mz[1] : 0;
        const fk = Math.min(1, muzzleFlashTimer / 0.055);
        const isBallistic = typeof GAU_GUN !== "undefined" && !!GAU_GUN[w.id];
        const boltPal = typeof ENERGY_BOLT_ART_PROFILES !== "undefined" ? ENERGY_BOLT_ART_PROFILES[w.id] : null;
        tCtx.save();
        tCtx.globalCompositeOperation = "lighter";
        if (supOn) {
          tCtx.globalAlpha = 0.28 * fk;
          tCtx.fillStyle = "#cfd8dc";
          tCtx.beginPath(); tCtx.arc(mx + 1.5, my, 2.2 * fk + 0.8, 0, Math.PI * 2); tCtx.fill();
        } else {
          const outerCol = isBallistic ? "#ffab40" : ((boltPal && boltPal[0]) || wActiveCol || "#80d8ff");
          const rad = (isBallistic ? 4.4 : 3.6) * (0.65 + 0.35 * fk);
          tCtx.globalAlpha = 0.62 * fk;
          tCtx.fillStyle = outerCol;
          tCtx.beginPath();
          tCtx.moveTo(mx - 0.6, my - rad * 0.45);
          tCtx.lineTo(mx + rad * 1.45, my);
          tCtx.lineTo(mx - 0.6, my + rad * 0.45);
          tCtx.lineTo(mx + rad * 0.2, my);
          tCtx.closePath(); tCtx.fill();
          tCtx.globalAlpha = 0.92 * fk;
          tCtx.fillStyle = (boltPal && boltPal[1]) || "#fffde7";
          tCtx.beginPath(); tCtx.arc(mx + 1.1, my, rad * 0.38, 0, Math.PI * 2); tCtx.fill();
        }
        tCtx.restore();
      };

      tCtx.save();
      tCtx.rotate(effAng);

      tCtx.save();
      tCtx.translate(hx, hy);
      tCtx.save();
      const lowTiltSign = Math.cos(carryAng) >= 0 ? 1 : -1;
      tCtx.rotate(wristSpin + lowK * 0.32 * lowTiltSign);
      if (lowK > 0) tCtx.scale(1 - 0.2 * lowK, 1);          // foreshortened: the muzzle points at the ground
      drawWeaponModel(tCtx, w.id, w.style, w.lvl >= 5, w.lvl >= 10, wActiveCol, rackShift, w.angVel || 0, 0, w.dbl ? true : null, w.hilt);
      drawMuzzleFlashAtTip();
      tCtx.restore();
      drawBallHand(tCtx, 0, 0, 2.5, handCol);

      if (w.id === 77) {
        drawBallHand(tCtx, -4.2, 0, 2.3, handCol);
      }

      if (activeWpns.length === 1 && w.id !== 86 && (kStyle === 0 || kStyle === 2 || kStyle === 3 || isHybrid || rackShift > 0.05)) {
        const offX = rackShift > 0.05 ? (2.5 - rackShift * 3.2) : (kStyle === 0 ? 1.8 : 5.8);
        const offY = rackShift > 0.05 ? -1.8 : 1.6;
        drawBallHand(tCtx, offX, offY, 2.3, handCol);
      }
      tCtx.restore();

      if (activeWpns.length === 1 && kStyle === 1) {
        const fanBob = (isLivePlayer && player.sixReloadCD > 0) ? Math.sin(runTime * 35) * 2.5 : 0;
        drawBallHand(tCtx, 2.5 + fanBob, -5.8, 2.3, handCol);
      }
      tCtx.restore();

      // v14.3: a matched pair (Neo's Micro-Uzis) — the twin sits in the free hand, aims on its own (js/dualaim.js),
      // gets a matching shoulder-to-hand arm sleeve, downward Low-Ready carry posture, recoil slide & muzzle flash.
      if (slotIdx === 0 && w.id === 39 && (activeWpns.length === 1 || kStyle === 5)) {
        const rawA2 = (isLivePlayer && typeof w.armAng2 === "number") ? w.armAng2 - bodyRot : armAng + 0.18;
        let carryA2 = rawA2;
        if (lowK > 0.05) {
          let d2 = pose.ang - rawA2;
          while (d2 > Math.PI) d2 -= Math.PI * 2;
          while (d2 < -Math.PI) d2 += Math.PI * 2;
          carryA2 = rawA2 + d2 * lowK;
        }
        const lowSign2 = Math.cos(carryA2) >= 0 ? 1 : -1;
        const effA2 = carryA2 + lowK * 0.50 * lowSign2;
        const hy2 = -4.5 * (1 - lowK * 0.65) + strideBob;
        const wx2 = Math.cos(effA2) * reachDist - Math.sin(effA2) * hy2;
        const wy2 = Math.sin(effA2) * reachDist + Math.cos(effA2) * hy2;
        const sh2X = pose.torsoShiftX - armSide * 4.6 * pose.torsoScaleX;
        tCtx.save();
        tCtx.strokeStyle = cTorso; tCtx.lineWidth = 2.4; tCtx.lineCap = "round";
        tCtx.beginPath(); tCtx.moveTo(sh2X, shY); tCtx.lineTo(wx2, wy2); tCtx.stroke();
        tCtx.restore();
        tCtx.save();
        tCtx.rotate(effA2);
        tCtx.translate(reachDist, hy2);
        tCtx.save();
        tCtx.rotate(lowK * 0.28 * lowSign2);
        if (lowK > 0) tCtx.scale(1 - 0.2 * lowK, 1);
        drawWeaponModel(tCtx, w.id, w.style, w.lvl >= 5, w.lvl >= 10, wActiveCol, rackShift, 0, 0, null, w.hilt);
        drawMuzzleFlashAtTip();
        tCtx.restore();
        drawBallHand(tCtx, 0, 0, 2.5, handCol);
        tCtx.restore();
      }
    });
  }
  const cloakCoversLegs = backView && !hasJetpack && !!cBack && cBack !== "none";
  drawHeroCellShading(tCtx, bodyRot, walk, pose, cloakCoversLegs);

  tCtx.restore();
}

/* === 5. FULL WORLD CHUNK RENDERER === */
function drawPolyPath(tCtx, poly, fallbackR) {
  tCtx.beginPath();
  if (poly && poly.length > 2) {
    tCtx.moveTo(poly[0].x, poly[0].y);
    for (let k = 1; k < poly.length; k++) tCtx.lineTo(poly[k].x, poly[k].y);
    tCtx.closePath();
  } else {
    tCtx.arc(0, 0, fallbackR, 0, Math.PI * 2);
  }
}

// v14.1: the world rectangle the camera really shows (zoom × cinematic/driving zoom, look-ahead offset)
function camView(pad) {
  const c = typeof fxCamOut !== "undefined" ? fxCamOut : null, z = opts.zoom * (c ? Math.min(1, c.zoom || 1) : 1), p = pad == null ? 140 : pad;
  const vw = W / z + p, vh = H / z + p;
  return { left: player.x + (c ? c.fx || 0 : 0) - vw * 0.5, top: player.y + (c ? c.fy || 0 : 0) - vh * 0.5, vw, vh, z };
}
function renderBiomeAndWorld() {
  const bRing = (typeof getDistBiome === "function") ? getDistBiome(player.x, player.y) : null;
  const bgCol = (player.fac && player.fac.bg) ? player.fac.bg : "#0c1624";
  const gridCol = (player.fac && player.fac.c1) ? player.fac.c1 : "#00e5ff";
  const accCol = (player.fac && player.fac.c2) ? player.fac.c2 : "#ffd166";

  // v14.1: cull with the real camera (cinematic / driving zoom-out and look-ahead)
  const CV = camView(140), viewW = CV.vw, viewH = CV.vh, left = CV.left, top = CV.top;

  // v14 Nexus City (js/cityrender.js) paints the generated city instead of the arena ground & rocks
  const cityOn = typeof CITY !== "undefined" && CITY.on;
  if (cityOn) cityRenderGround(left, top, viewW, viewH);
  if (!cityOn) {
  // v10 adaptive biomes (js/biomes.js) paint the ground, decals and hazards for the hero's universe.
  const themed = (typeof biomeRenderGround === "function") && biomeRenderGround(left, top, viewW, viewH, bRing);
  if (!themed) {
  ctx.fillStyle = bgCol;
  ctx.fillRect(left, top, viewW, viewH);
  if (bRing && bRing.tint && bRing.tint !== "rgba(0,0,0,0)") {
    ctx.fillStyle = bRing.tint;
    ctx.fillRect(left, top, viewW, viewH);
  }

  const gStep = 64;
  const gx0 = Math.floor(left / gStep) * gStep;
  const gy0 = Math.floor(top / gStep) * gStep;
  ctx.lineWidth = 1;
  ctx.strokeStyle = "rgba(128, 222, 234, 0.08)";
  ctx.beginPath();
  for (let gx = gx0; gx < left + viewW; gx += gStep) { ctx.moveTo(gx, top); ctx.lineTo(gx, top + viewH); }
  for (let gy = gy0; gy < top + viewH; gy += gStep) { ctx.moveTo(left, gy); ctx.lineTo(left + viewW, gy); }
  ctx.stroke();
  }

  const cSize = typeof CHUNK_SIZE !== "undefined" ? CHUNK_SIZE : 256;
  const cx0 = Math.floor(left / cSize), cx1 = Math.floor((left + viewW) / cSize);
  const cy0 = Math.floor(top / cSize), cy1 = Math.floor((top + viewH) / cSize);

  for (let cy = cy0; cy <= cy1; cy++) {
    for (let cx = cx0; cx <= cx1; cx++) {
      const h = (cx * 73856093) ^ (cy * 19349663) ^ (typeof runSeed !== "undefined" ? runSeed : 1337);
      for (let p = 0; p < 3 && !themed; p++) {
        const px = cx * cSize + ChaosMath.range(h + p * 31, 24, cSize - 24);
        const py = cy * cSize + ChaosMath.range(h + p * 59, 24, cSize - 24);
        const pr = ChaosMath.range(h + p * 83, 14, 38);
        ctx.fillStyle = (p & 1) ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.20)";
        ctx.beginPath(); ctx.arc(px, py, pr, 0, Math.PI * 2); ctx.fill();
      }

      if (typeof getChunk !== "function") continue;
      const objs = getChunk(cx, cy);
      for (let i = 0; i < objs.length; i++) {
        const o = objs[i];
        if (o.used) continue;
        const r = o.rad || 20;
        ctx.save();
        ctx.translate(o.x, o.y);
        if ((themed && o.type <= 3 && biomeDrawObject(o, r)) ||
            (o.type >= 7 && typeof drawExtraWorldObject === "function" && drawExtraWorldObject(o, r))) { ctx.restore(); continue; }

        if (o.type === 0) {
          ctx.save(); ctx.translate(4, 5);
          ctx.fillStyle = "rgba(0,0,0,0.45)"; drawPolyPath(ctx, o.poly, r); ctx.fill();
          ctx.restore();
          ctx.fillStyle = "#16222f"; ctx.strokeStyle = gridCol; ctx.lineWidth = 1.8;
          drawPolyPath(ctx, o.poly, r); ctx.fill(); ctx.stroke();
          ctx.save(); ctx.scale(0.62, 0.62);
          ctx.fillStyle = "#223548"; drawPolyPath(ctx, o.poly, r); ctx.fill();
          ctx.restore();
          ctx.fillStyle = accCol; ctx.fillRect(-r * 0.35, -2, r * 0.7, 3);
        } else if (o.type === 1) {
          ctx.fillStyle = "#2b3945"; ctx.strokeStyle = accCol; ctx.lineWidth = 1.4;
          drawPolyPath(ctx, o.poly, r); ctx.fill(); ctx.stroke();
          ctx.strokeStyle = "rgba(255,255,255,0.18)"; ctx.strokeRect(-r * 0.45, -r * 0.45, r * 0.9, r * 0.9);
        } else if (o.type === 2) {
          ctx.fillStyle = gridCol; ctx.globalAlpha = 0.78; drawPolyPath(ctx, o.poly, r); ctx.fill();
          ctx.globalAlpha = 1.0; ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 1.0; ctx.stroke();
        } else if (o.type === 3) {
          const pulse = 0.22 + Math.sin(runTime * 5 + o.seed) * 0.06;
          ctx.fillStyle = `rgba(255, 82, 82, ${pulse})`; drawPolyPath(ctx, o.poly, r); ctx.fill();
          ctx.strokeStyle = "rgba(255, 145, 0, 0.65)"; ctx.lineWidth = 1.4; ctx.stroke();
        } else if (o.type === 4) {
          ctx.fillStyle = "#1e3246"; ctx.strokeStyle = "#ffd166"; ctx.lineWidth = 1.8;
          ctx.fillRect(-11, -9, 22, 18); ctx.strokeRect(-11, -9, 22, 18);
          ctx.fillStyle = "#00e676"; ctx.fillRect(-6, -2, 12, 4);
        } else if (o.type === 5) {
          ctx.fillStyle = "#00acc1"; ctx.strokeStyle = "#00e5ff"; ctx.lineWidth = 1.6;
          ctx.beginPath(); ctx.ellipse(0, 0, 18, 10, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
          ctx.fillStyle = "#102027"; ctx.fillRect(-6, -5, 10, 10);
        } else if (o.type === 6) {
          ctx.fillStyle = "#37474f"; ctx.strokeStyle = "#ffd166"; ctx.lineWidth = 1.8;
          ctx.fillRect(-14, -12, 28, 24); ctx.strokeRect(-14, -12, 28, 24);
          ctx.fillStyle = "#ff1744"; ctx.fillRect(-5, -4, 10, 4);
        }
        ctx.restore();
      }
    }
  }
  }   // v14: end of the arena-only ground

  if (typeof movedBarricades !== "undefined") {
    for (let i = 0; i < movedBarricades.length; i++) {
      const b = movedBarricades[i];
      if (b.used) continue;
      ctx.save(); ctx.translate(b.x, b.y);
      ctx.fillStyle = b.type === 6 ? "#4a148c" : "#2b3945";
      ctx.strokeStyle = b.type === 6 ? "#ffd166" : accCol; ctx.lineWidth = 2.0;
      ctx.fillRect(-12, -10, 24, 20); ctx.strokeRect(-12, -10, 24, 20);
      ctx.restore();
    }
  }

  if (typeof activeForts !== "undefined") {
    for (let i = 0; i < activeForts.length; i++) {
      const ft = activeForts[i];
      ctx.save(); ctx.translate(ft.x, ft.y);
      // Fade out during the last 5 s of the fort's lifetime.
      ctx.globalAlpha = typeof ft.life === "number" ? Math.max(0.25, Math.min(1, ft.life / 5)) : 1;
      ctx.strokeStyle = "#00e676"; ctx.lineWidth = 3.0;
      ctx.strokeRect(-ft.rad * 0.7, -ft.rad * 0.7, ft.rad * 1.4, ft.rad * 1.4);
      ctx.fillStyle = "rgba(0, 230, 118, 0.12)";
      ctx.fillRect(-ft.rad * 0.7, -ft.rad * 0.7, ft.rad * 1.4, ft.rad * 1.4);
      ctx.fillStyle = "#ffd166"; ctx.beginPath(); ctx.arc(0, 0, 7, 0, Math.PI * 2); ctx.fill();
      if (ft.maxHp) {
        const bw = ft.rad * 1.4, frac = Math.max(0, Math.min(1, ft.hp / ft.maxHp));
        ctx.fillStyle = "rgba(0,0,0,0.55)"; ctx.fillRect(-bw / 2, -ft.rad * 0.7 - 8, bw, 4);
        ctx.fillStyle = frac > 0.5 ? "#00e676" : (frac > 0.25 ? "#ffd166" : "#ff5252");
        ctx.fillRect(-bw / 2, -ft.rad * 0.7 - 8, bw * frac, 4);
      }
      ctx.restore();
    }
  }
  if (typeof activeMines !== "undefined") {
    for (let i = 0; i < activeMines.length; i++) {
      const mn = activeMines[i];
      ctx.fillStyle = (Math.floor(runTime * 6) & 1) ? "#ff1744" : "#ffd166";
      ctx.beginPath(); ctx.arc(mn.x, mn.y, 4.5, 0, Math.PI * 2); ctx.fill();
    }
  }

  if (typeof activeBarriers !== "undefined") {
    for (let i = 0; i < activeBarriers.length; i++) {
      const br = activeBarriers[i];
      const alpha = Math.max(0, br.life / br.maxLife);
      ctx.save();
      ctx.strokeStyle = br.col || "#ffd166";
      ctx.globalAlpha = alpha;
      ctx.lineWidth = 3.5;
      ctx.beginPath(); ctx.arc(br.x, br.y, br.rad, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = "rgba(255, 209, 102, 0.15)";
      ctx.beginPath(); ctx.arc(br.x, br.y, br.rad, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
  }

  // Render Dropped Rival / Boss Signature Weapons on the Battlefield!
  if (typeof activeWeaponDrops !== "undefined" && activeWeaponDrops.length > 0) {
    for (let i = 0; i < activeWeaponDrops.length; i++) {
      const drop = activeWeaponDrops[i];
      const pulse = 15 + Math.sin(runTime * 7 + i) * 3;
      const wCol = drop.bladeCol || (typeof getWeaponColor === "function" ? getWeaponColor(drop.wpnId) : "#ffd166");
      ctx.save();
      ctx.translate(drop.x, drop.y);
      ctx.fillStyle = "rgba(255, 209, 102, 0.16)";
      ctx.beginPath(); ctx.arc(0, 0, pulse, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = wCol === "#212121" ? "#ffffff" : wCol;
      ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.arc(0, 0, pulse, 0, Math.PI * 2); ctx.stroke();
      ctx.save();
      ctx.rotate(runTime * 2.4 + i);
      drawWeaponModel(ctx, drop.wpnId, drop.style || "orbit", true, false, wCol, 0, 0);
      ctx.restore();
      ctx.fillStyle = "#ffd166";
      ctx.font = "bold 7.5px monospace";
      ctx.textAlign = "center";
      ctx.fillText(`⚔ ${drop.name}`, 0, -pulse - 4);
      ctx.restore();
    }
  }

  if (typeof findInteractTarget === "function") {
    const tgt = findInteractTarget();
    if (tgt && tgt.kind !== "exitVeh" && typeof tgt.x === "number") {
      const pulse = 20 + Math.sin(runTime * 7) * 3;
      ctx.save();
      ctx.strokeStyle = "#ffd166"; ctx.lineWidth = 2.0;
      ctx.beginPath(); ctx.arc(tgt.x, tgt.y, pulse, 0, Math.PI * 2); ctx.stroke();
      // v14.1: the full label is the HUD button (#btnInteract) — the world shows only a keycap, never the same text twice
      if (window.__coarsePtr === undefined) window.__coarsePtr = !!(window.matchMedia && matchMedia("(pointer: coarse)").matches);
      const cap = window.__coarsePtr ? (typeof actIconFor === "function" ? actIconFor(tgt) : "TAP") : "F", cw = window.__coarsePtr ? 22 : 12, cy = tgt.y - pulse - 15;
      ctx.fillStyle = "rgba(10,12,18,0.85)"; ctx.beginPath(); ctx.moveTo(tgt.x - cw / 2 + 3, cy); ctx.arcTo(tgt.x + cw / 2, cy, tgt.x + cw / 2, cy + 11, 3); ctx.arcTo(tgt.x + cw / 2, cy + 11, tgt.x - cw / 2, cy + 11, 3); ctx.arcTo(tgt.x - cw / 2, cy + 11, tgt.x - cw / 2, cy, 3); ctx.arcTo(tgt.x - cw / 2, cy, tgt.x + cw / 2, cy, 3); ctx.closePath(); ctx.fill();
      ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = "#ffd166"; ctx.font = "bold 8px monospace"; ctx.textAlign = "center";
      ctx.fillText(cap, tgt.x, cy + 8.3);
      ctx.restore();
    }
  }
}

/* === 6. RENDER ALLIED MINIONS === */
function renderAlliedMinions() {
  if (typeof mAct === "undefined") return;
  if (typeof squadRenderMinions === "function") { squadRenderMinions(); return; }   // v10 js/squad.js
  for (let i = 0; i < MAX_MINION; i++) {
    if (!mAct[i]) continue;
    const mx = mX[i], my = mY[i], kind = mKind[i], rad = mRad[i] || 10;
    ctx.save();
    ctx.translate(mx, my);
    ctx.fillStyle = mCol[i] || "#b388ff";
    if (kind === 4) {
      ctx.fillRect(-16, -14, 32, 26);
      ctx.beginPath(); ctx.arc(0, -18, 9, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#00ff88"; ctx.fillRect(-4, -6, 8, 4);
    } else if (kind === 3) {
      ctx.fillRect(-11, -10, 22, 20);
      ctx.beginPath(); ctx.arc(0, -12, 6.5, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "#ffd166"; ctx.lineWidth = 1.4; ctx.strokeRect(-11, -10, 22, 20);
    } else if (kind === 1) {
      ctx.beginPath(); ctx.ellipse(0, 0, rad + 4, rad, 0, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.fillRect(-5, -6, 10, 12);
      ctx.beginPath(); ctx.arc(0, -9, 4.8, 0, Math.PI * 2); ctx.fill();
    }
    if (mHP[i] < mMax[i]) {
      ctx.fillStyle = "rgba(0,0,0,0.6)"; ctx.fillRect(-12, -18, 24, 2.5);
      ctx.fillStyle = "#00ff88"; ctx.fillRect(-12, -18, 24 * Math.max(0, mHP[i] / mMax[i]), 2.5);
    }
    ctx.restore();
  }
}

/* === 6b. v9.01 DEAD HEADS, KNOCKED HELMETS & COLOURED PARTICLES === */
const DEAD_SKIN = ["#f1c27d", "#e0ac69", "#c68642", "#8d5524", "#ffdbac", "#d1a17a"];
const DEAD_HAIR = ["#2b1b12", "#4e342e", "#1b1b1b", "#8d6e63", "#d7ccc8", "#3e2723"];
// Draws a dead head centred on (0,0), face "up" = -y. Everything derives from `seed`, so the same
// body always renders the same face/helmet, and eyes are fixed (no gaze tracking, no blinking).
function drawDeadHead(tCtx, seed, helmCol, helmetOff, type, rOverride) {
  const h = Math.imul((seed >>> 0) ^ 0x9e3779b9, 2246822519) >>> 0;
  const r = rOverride > 0 ? rOverride : (type === 99 ? 5.2 : 3.1 + (h % 11) / 10);
  if (!helmetOff) {
    tCtx.fillStyle = helmCol || "#90a4ae";
    tCtx.beginPath(); tCtx.arc(0, 0, r, 0, Math.PI * 2); tCtx.fill();
    tCtx.fillStyle = "#0b0f14";                                   // visor - lights out
    tCtx.fillRect(-r * 0.72, -r * 0.42, r * 1.44, r * 0.5);
    tCtx.fillStyle = "rgba(120, 144, 156, 0.55)";                 // dead lens glints, fixed
    tCtx.fillRect(-r * 0.5, -r * 0.34, r * 0.32, r * 0.22);
    tCtx.fillRect(r * 0.18, -r * 0.34, r * 0.32, r * 0.22);
    return;
  }
  const skin = DEAD_SKIN[h % DEAD_SKIN.length], hair = DEAD_HAIR[(h >>> 4) % DEAD_HAIR.length];
  tCtx.fillStyle = skin;
  tCtx.beginPath(); tCtx.arc(0, 0, r, 0, Math.PI * 2); tCtx.fill();
  if ((h >>> 8) % 4 !== 0) {                                      // hair (25% shaved / bald)
    tCtx.fillStyle = hair;
    tCtx.beginPath(); tCtx.arc(0, 0, r, Math.PI * 1.08, Math.PI * 1.92); tCtx.closePath(); tCtx.fill();
  }
  const sp = r * (0.36 + ((h >>> 12) % 5) * 0.04), ey = -r * 0.12, es = r * (0.22 + ((h >>> 15) % 3) * 0.04);
  const gaze = ((h >>> 18) % 8) / 8 * Math.PI * 2, gx = Math.cos(gaze) * es * 0.35, gy = Math.sin(gaze) * es * 0.25;
  for (let side = -1; side <= 1; side += 2) {
    tCtx.fillStyle = "#cfd8dc";                                   // faded, glassy whites
    tCtx.fillRect(side * sp - es, ey - es * 0.55, es * 2, es * 1.1);
    tCtx.fillStyle = "#546e7a";                                   // dull pupils, fixed gaze
    tCtx.fillRect(side * sp - es * 0.38 + gx, ey - es * 0.3 + gy, es * 0.76, es * 0.62);
    tCtx.fillStyle = skin;                                        // heavy half-closed lids
    tCtx.fillRect(side * sp - es * 1.05, ey - es * 0.75, es * 2.1, es * 0.62);
    tCtx.strokeStyle = hair; tCtx.lineWidth = Math.max(0.5, r * 0.14);   // brow, seeded tilt
    const tilt = (((h >>> 21) % 5) - 2) * 0.08 * side;
    tCtx.beginPath(); tCtx.moveTo(side * sp - es * 1.1, ey - es * 1.15 - tilt * r); tCtx.lineTo(side * sp + es * 1.1, ey - es * 1.15 + tilt * r); tCtx.stroke();
  }
  tCtx.strokeStyle = "rgba(60, 30, 20, 0.55)"; tCtx.lineWidth = Math.max(0.45, r * 0.11);
  tCtx.beginPath(); tCtx.moveTo(0, ey + es * 0.2); tCtx.lineTo(r * 0.06, ey + es * 0.2 + r * (0.22 + ((h >>> 24) % 3) * 0.05)); tCtx.stroke();   // nose
  tCtx.beginPath(); tCtx.moveTo(-r * 0.22, r * 0.5); tCtx.lineTo(r * 0.24, r * 0.46); tCtx.stroke();                                              // slack mouth
}

function drawKnockedHelmet(tCtx, col) {
  tCtx.fillStyle = col || "#90a4ae";
  tCtx.beginPath(); tCtx.ellipse(0, 0, 4.6, 3.8, 0, Math.PI * 0.95, Math.PI * 2.05); tCtx.closePath(); tCtx.fill();
  tCtx.fillStyle = "#0b0f14"; tCtx.fillRect(-3.2, -1.4, 6.4, 1.6);
  tCtx.strokeStyle = "rgba(255,255,255,0.28)"; tCtx.lineWidth = 0.7;
  tCtx.beginPath(); tCtx.ellipse(0, 0, 4.6, 3.8, 0, Math.PI * 1.1, Math.PI * 1.6); tCtx.stroke();
}

function drawSpineTrophy(tCtx) {
  tCtx.fillStyle = "#eceff1";
  tCtx.beginPath(); tCtx.arc(6, 0, 3.4, 0, Math.PI * 2); tCtx.fill();
  tCtx.fillStyle = "#263238"; tCtx.fillRect(6.6, -1.6, 1.3, 1.2); tCtx.fillRect(6.6, 0.5, 1.3, 1.2);
  tCtx.fillStyle = "#d7ccc8";
  for (let v = 0; v < 6; v++) tCtx.fillRect(1.5 - v * 2.4, -1.1, 1.8, 2.2);
  tCtx.fillStyle = "#b71c1c"; tCtx.fillRect(-13, -0.5, 14, 1.0);
}

function drawParticles() {
  ctx.save();
  for (let i = 0; i < MAX_PT; i++) {            // smoke underneath
    if (!ptAct[i] || ptKind[i] !== 2) continue;
    const f = ptLife[i] / (ptMax[i] || 1);
    ctx.globalAlpha = Math.min(0.4, f * 0.5);
    ctx.fillStyle = PT_PALETTE[ptCol[i]] || "#90a4ae";
    ctx.beginPath(); ctx.arc(ptX[i], ptY[i], ptSize[i], 0, Math.PI * 2); ctx.fill();
  }
  for (let i = 0; i < MAX_PT; i++) {
    if (!ptAct[i]) continue;
    const k = ptKind[i];
    if (k === 2) continue;
    const f = ptLife[i] / (ptMax[i] || 1), sz = ptSize[i] || 3;
    if (k === 1) {                                 // flame: white-hot -> orange -> red, shrinking
      ctx.globalAlpha = Math.min(1, 0.3 + f);
      ctx.fillStyle = f > 0.66 ? "#fff59d" : (f > 0.33 ? "#ff9100" : "#ff3d00");
      const s2 = sz * (0.45 + f * 0.65);
      ctx.fillRect(ptX[i] - s2 * 0.5, ptY[i] - s2 * 0.5, s2, s2);
    } else if (k === 5) {                          // dust puff
      ctx.globalAlpha = Math.min(0.32, f * 0.4);
      ctx.fillStyle = PT_PALETTE[ptCol[i]] || "#a1887f";
      ctx.beginPath(); ctx.arc(ptX[i], ptY[i], sz, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.globalAlpha = k === 3 ? Math.min(1, f * 3) : (k === 4 ? Math.min(1, f * 1.4) : 1);
      ctx.fillStyle = PT_PALETTE[ptCol[i]] || "#ffd166";
      if (k === 3) ctx.fillRect(ptX[i] - 1.2, ptY[i] - 0.6, 2.4, 1.2);   // brass casing
      else ctx.fillRect(ptX[i] - sz * 0.5, ptY[i] - sz * 0.5, sz, sz);
    }
  }
  ctx.restore();
}

/* === 7. MASTER SCENE RENDERER === */
const ENEMY_NAMES = ["SECTOR HENCHMAN", "CYBER-WOLF", "ARACHNID DRONE", "HEAVY BRUTE"];

function drawSmolderingSliceLine(tCtx, len, heat, glowCol) {
  tCtx.strokeStyle = "#08080a";
  tCtx.lineWidth = 3.2; tCtx.lineCap = "round";
  tCtx.beginPath(); tCtx.moveTo(-len, 0); tCtx.lineTo(len, 0); tCtx.stroke();
  if (heat > 0.04) {
    tCtx.save();
    tCtx.globalAlpha = Math.min(1, heat * 1.15);
    tCtx.strokeStyle = heat > 0.55 ? "#fff59d" : (glowCol || "#ff6d00");
    tCtx.lineWidth = 1.8 * heat + 0.6;
    tCtx.beginPath(); tCtx.moveTo(-len * 0.92, 0); tCtx.lineTo(len * 0.92, 0); tCtx.stroke();
    tCtx.restore();
  }
}

// Conventional ammunition is a direction-aligned tracer/slug, never a round
// faction-colored orb. GAU_GUN is the canonical per-weapon firearm class map.
// Damage, spread, speed, penetration and collision remain in the unchanged sim.
const BALLISTIC_ART_PROFILES = Object.freeze({
  pistol: Object.freeze([4.5, 8, 0.95]), smg: Object.freeze([4.2, 8.5, 1.0]),
  rifle: Object.freeze([5.0, 13, 1.05]), magnum: Object.freeze([5.5, 10, 1.05]),
  shotgun: Object.freeze([4.0, 5.5, 0.8]), mg: Object.freeze([4.7, 11.5, 1.1])
});
const ENERGY_BOLT_ART_PROFILES = Object.freeze({
  1: Object.freeze(["#f6c453", "#fff6d8"]),  // Beskar heavy blaster
  6: Object.freeze(["#55c7ff", "#e8faff"]),  // DL-44 heavy blaster
  22: Object.freeze(["#ff725e", "#fff0b5"]), // Type-II phaser
  34: Object.freeze(["#ffad42", "#fff4cb"]), // Goku ki wave
  35: Object.freeze(["#8fc8ff", "#f4fbff"]), // Royal Flash
  36: Object.freeze(["#a8f06a", "#f5ffd8"]), // Piccolo spiral beam
  38: Object.freeze(["#ffd54f", "#fff8d6"]), // Gohan rising ki blast
  40: Object.freeze(["#ff6248", "#ffe6b7"]), // M-25 plasma
  43: Object.freeze(["#ff3d3d", "#fff2e0"]), // AER9 laser rifle
  84: Object.freeze(["#d36bff", "#fff0ff"]), // Frieza Death Beam
  85: Object.freeze(["#76ff03", "#f1ffd8"]), // Cell Perfect Ki Wave
  86: Object.freeze(["#ff9100", "#fff3d0"]), // Android 16 Twin Arm Cannons
  87: Object.freeze(["#69f0ae", "#ecfff6"]), // Android 17 Power Blitz
  88: Object.freeze(["#4fc3f7", "#eefaff"])  // Android 18 Infinite Barrage
});
function drawEnergyBoltProjectile(g, i) {
  if (pArt[i] !== 2 || (pStyle[i] !== 3 && pStyle[i] !== 4)) return false;
  const palette = ENERGY_BOLT_ART_PROFILES[pWpnId[i]], speed = Math.hypot(pVX[i], pVY[i]);
  if (!palette || !(speed > 0.01)) return false;
  const [edge, core] = palette, scale = Math.max(0.75, Math.min(1.8, (pRad[i] || 7) / 8));
  g.save(); g.translate(pX[i], pY[i]); g.rotate(Math.atan2(pVY[i], pVX[i]));
  g.globalCompositeOperation = "lighter"; g.lineCap = "round";
  g.globalAlpha = pEnemy[i] ? 0.52 : 0.62; g.strokeStyle = edge; g.lineWidth = 8 * scale;
  g.beginPath(); g.moveTo(-13 * scale, 0); g.lineTo(1 * scale, 0); g.stroke();
  g.globalAlpha = 0.96; g.fillStyle = edge; g.beginPath();
  g.moveTo(-7 * scale, -2.8 * scale); g.lineTo(3 * scale, -2.8 * scale); g.lineTo(9 * scale, 0);
  g.lineTo(3 * scale, 2.8 * scale); g.lineTo(-7 * scale, 2.8 * scale); g.closePath(); g.fill();
  g.strokeStyle = core; g.lineWidth = 1.7 * scale; g.globalAlpha = 0.95;
  g.beginPath(); g.moveTo(-5 * scale, 0); g.lineTo(7 * scale, 0); g.stroke();
  g.restore(); return true;
}
// Utility-only family renderers use launch-time pArt tags set by reviewed caller IDs.
// These are deliberately presentation-only: collision, impact and sound remain in their owners.
const UTILITY_ENERGY_PALETTES = Object.freeze({
  2: ["#ff7043", "#fff0cf"], 6: ["#45bfff", "#effbff"], 9: ["#ff854a", "#fff1c4"],
  19: ["#b7f0ff", "#f5ffff"], 22: ["#54d9ff", "#f0fdff"], 23: ["#9affdb", "#f4fff8"],
  35: ["#ff9b55", "#fff2c9"], 37: ["#ffb84d", "#fff6dd"], 41: ["#49d5ff", "#effdff"],
  45: ["#a9a5ff", "#f4f1ff"], 87: ["#77ff92", "#f0fff3"], 88: ["#8aff80", "#f5ffed"]
});
const UTILITY_ARCANE_PALETTES = Object.freeze({
  3: ["#a75cff", "#f5ddff"], 12: ["#9cff57", "#f0ffd8"],
  60: ["#ffd166", "#fff8d7"], 65: ["#d76bff", "#fff0ff"]
});
const UTILITY_FAMILY_IDS = Object.freeze({
  ballistic: Object.freeze([8,13,15,28,31,43,44,51,52]),
  energy: Object.freeze([2,6,9,19,22,23,35,37,41,45,87,88]),
  arcane: Object.freeze([3,12,60,65]), fragment: Object.freeze([17,21,25]),
  arrow: Object.freeze([5,50]), rocketBody: Object.freeze([26])
});
function drawUtilityProjectile(g, i) {
  const art = pArt[i];
  if (art < 3 || art > 8 || (pStyle[i] !== 3 && pStyle[i] !== 4)) return false;
  const id = pWpnId[i], speed = Math.hypot(pVX[i], pVY[i]);
  if (!(speed > 0.01)) return false;
  const energy = UTILITY_ENERGY_PALETTES[id], arcane = UTILITY_ARCANE_PALETTES[id];
  const edge = art === 3 ? "#d4dce3" : art === 4 ? (energy ? energy[0] : "#65cfff") : art === 5 ? (arcane ? arcane[0] : "#bc7cff") : "#ffb65e";
  const core = art === 3 ? "#fff0c0" : art === 4 ? (energy ? energy[1] : "#f3fdff") : art === 5 ? (arcane ? arcane[1] : "#fff2ff") : "#fff0cf";
  const sc = Math.max(.75, Math.min(1.55, (pRad[i] || 8) / 8));
  g.save(); g.translate(pX[i], pY[i]); g.rotate(Math.atan2(pVY[i], pVX[i])); g.lineCap = "round";
  if (art === 3) {
    g.globalAlpha = .32; g.strokeStyle = "#ffc66e"; g.lineWidth = 2.2 * sc;
    g.beginPath(); g.moveTo(-15 * sc, 0); g.lineTo(-2 * sc, 0); g.stroke();
    g.globalAlpha = .9; g.fillStyle = edge; g.beginPath(); g.moveTo(-5*sc,-2*sc); g.lineTo(4*sc,-1.6*sc); g.lineTo(8*sc,0); g.lineTo(4*sc,1.6*sc); g.lineTo(-5*sc,2*sc); g.closePath(); g.fill();
    g.globalAlpha=.95;g.strokeStyle=core;g.lineWidth=1.1*sc;g.beginPath();g.moveTo(-3*sc,0);g.lineTo(6*sc,0);g.stroke();
  } else if (art === 6) {
    // Kinetic shrapnel: opaque steel shard with a warm edge, not an energy bolt.
    g.globalAlpha=.72;g.strokeStyle="#9b6545";g.lineWidth=1.1*sc;g.beginPath();g.moveTo(-11*sc,0);g.lineTo(-4*sc,-1.2*sc);g.stroke();
    g.globalAlpha=.94;g.fillStyle="#87929c";g.beginPath();g.moveTo(8*sc,-.7*sc);g.lineTo(1*sc,-1.4*sc);g.lineTo(-6*sc,-3.4*sc);g.lineTo(-3*sc,-.4*sc);g.lineTo(-8*sc,.6*sc);g.lineTo(-1*sc,1.2*sc);g.lineTo(4*sc,2.5*sc);g.closePath();g.fill();
    g.globalAlpha=.9;g.strokeStyle="#e3ad72";g.lineWidth=.75*sc;g.beginPath();g.moveTo(-5*sc,-2.8*sc);g.lineTo(6*sc,-.45*sc);g.stroke();
  } else if (art === 7) {
    // Physical quarrel/arrow: straight shaft and four-fletch tail, no glow/explosion.
    g.globalAlpha=.82;g.strokeStyle="#c9b48a";g.lineWidth=1.25*sc;g.beginPath();g.moveTo(-13*sc,0);g.lineTo(7*sc,0);g.stroke();
    g.globalAlpha=.94;g.fillStyle="#d9e0e5";g.beginPath();g.moveTo(8*sc,-1.6*sc);g.lineTo(13*sc,0);g.lineTo(8*sc,1.6*sc);g.closePath();g.fill();
    g.fillStyle="#8d6e63";g.beginPath();g.moveTo(-10*sc,-1*sc);g.lineTo(-6*sc,-3.1*sc);g.lineTo(-5*sc,-.6*sc);g.lineTo(-5*sc,.6*sc);g.lineTo(-6*sc,3.1*sc);g.lineTo(-10*sc,1*sc);g.closePath();g.fill();
  } else if (art === 8) {
    // Rocket body only: no new trail logic, detonation, or area damage implied.
    g.globalAlpha=.42;g.strokeStyle="#ff9d52";g.lineWidth=2*sc;g.beginPath();g.moveTo(-15*sc,0);g.lineTo(-7*sc,0);g.stroke();
    g.globalAlpha=.94;g.fillStyle="#b8c1c9";g.beginPath();g.moveTo(-9*sc,-2.4*sc);g.lineTo(6*sc,-2.4*sc);g.lineTo(12*sc,0);g.lineTo(6*sc,2.4*sc);g.lineTo(-9*sc,2.4*sc);g.closePath();g.fill();
    g.fillStyle="#777f87";g.beginPath();g.moveTo(-8*sc,-2.2*sc);g.lineTo(-12*sc,-4.2*sc);g.lineTo(-5*sc,-2.4*sc);g.moveTo(-8*sc,2.2*sc);g.lineTo(-12*sc,4.2*sc);g.lineTo(-5*sc,2.4*sc);g.closePath();g.fill();
    g.globalAlpha=.92;g.strokeStyle="#fff0cf";g.lineWidth=.8*sc;g.beginPath();g.moveTo(-5*sc,0);g.lineTo(8*sc,0);g.stroke();
  } else {
    const palette=art===4?energy:arcane;g.globalCompositeOperation="lighter";
    g.globalAlpha=.48;g.strokeStyle=edge;g.lineWidth=(art===5?6:7)*sc;g.beginPath();g.moveTo(-12*sc,0);g.lineTo(2*sc,0);g.stroke();
    g.globalAlpha=.94;g.fillStyle=edge;g.beginPath();g.moveTo(-5*sc,-2.5*sc);g.lineTo(3*sc,-2.3*sc);g.lineTo(8*sc,0);g.lineTo(3*sc,2.3*sc);g.lineTo(-5*sc,2.5*sc);g.closePath();g.fill();
    if(art===5){g.globalAlpha=.82;g.strokeStyle=core;g.lineWidth=1;g.beginPath();g.moveTo(-2*sc,-3.6*sc);g.lineTo(1*sc,-1*sc);g.lineTo(-2*sc,0);g.lineTo(1*sc,1*sc);g.lineTo(-2*sc,3.6*sc);g.stroke()}
    else{g.globalAlpha=.95;g.strokeStyle=core;g.lineWidth=1.4*sc;g.beginPath();g.moveTo(-3*sc,0);g.lineTo(6*sc,0);g.stroke()}
  }
  g.restore();return true;
}
function drawBallisticProjectile(g, i) {
  // Explicit art identity avoids confusing hero-ID-tagged magic/signature shots
  // with a firearm whose weapon ID happens to share the same integer.
  if (pArt[i] !== 1 || (pStyle[i] !== 3 && pStyle[i] !== 4)) return false;
  const soundProfile = typeof GAU_GUN !== "undefined" && GAU_GUN[pWpnId[i]];
  if (!soundProfile) return false;
  const profile = BALLISTIC_ART_PROFILES[soundProfile[0]];
  if (!profile) return false;
  const speed = Math.hypot(pVX[i], pVY[i]);
  if (!(speed > 0.01)) return false;
  const [bodyLen, trailLen, width] = profile;
  g.save();
  g.translate(pX[i], pY[i]);
  g.rotate(Math.atan2(pVY[i], pVX[i]));
  g.lineCap = "round";
  // A faint tracer is deliberately restrained; the shaped slug stays readable
  // without suggesting a glowing energy ball. Shots keep their real travel path.
  g.globalAlpha = pEnemy[i] ? 0.46 : 0.34;
  g.strokeStyle = pSup[i] ? "#ffd166" : "#ffcf78";
  g.lineWidth = width * 1.65;
  g.beginPath(); g.moveTo(-trailLen, 0); g.lineTo(-0.6, 0); g.stroke();
  g.globalAlpha = pEnemy[i] ? 0.92 : 0.84;
  g.fillStyle = "#c8d0d8";
  g.beginPath();
  g.moveTo(-bodyLen * 0.52, -width * 0.36);
  g.lineTo(bodyLen * 0.18, -width * 0.36);
  g.lineTo(bodyLen * 0.52, 0);
  g.lineTo(bodyLen * 0.18, width * 0.36);
  g.lineTo(-bodyLen * 0.52, width * 0.36);
  g.closePath(); g.fill();
  g.globalAlpha = 0.92;
  g.strokeStyle = pSup[i] ? "#fff3c4" : "#fff0c0";
  g.lineWidth = Math.max(0.65, width * 0.52);
  g.beginPath(); g.moveTo(-bodyLen * 0.3, 0); g.lineTo(bodyLen * 0.36, 0); g.stroke();
  g.restore();
  return true;
}

function renderScene() {
  ctx.fillStyle = "#060b14";
  ctx.fillRect(0, 0, W, H);
  if (!runActive || !player) return;

  // v10 camera: screen shake, cinematic zoom and focus offset (glory kills / boss kills) from js/fx.js
  const cam = (typeof fxCamera === "function") ? fxCamera() : null;
  ctx.save();
  ctx.translate(W * 0.5 + (cam ? cam.sx : 0), H * 0.5 + (cam ? cam.sy : 0));
  const camZoom = opts.zoom * (cam ? cam.zoom : 1);
  ctx.scale(camZoom, camZoom);
  ctx.translate(-(player.x + (cam ? cam.fx : 0)), -(player.y + (cam ? cam.fy : 0)));

  renderBiomeAndWorld();

  const ageLv = typeof AGE !== "undefined" ? AGE.level : 0;   // v14.2 age-appropriate filter: hide gore that already exists
  for (let i = 0; i < MAX_DRIP; i++) {
    if (!drAct[i] || ageLv) continue;
    ctx.fillStyle = drZ[i] > 0.5 ? "#ff1744" : "rgba(155, 12, 28, 0.72)";
    ctx.beginPath(); ctx.arc(drX[i], drY[i] - drZ[i], drRad[i], 0, Math.PI * 2); ctx.fill();
  }

  for (let i = 0; i < MAX_LIMB; i++) {
    if (!lmbAct[i] || (ageLv && (ageLv > 1 || lmbKind[i] !== 3))) continue;
    ctx.save(); ctx.translate(lmbX[i], lmbY[i]); ctx.rotate(lmbRot[i]);
    ctx.fillStyle = lmbCol[i];
    if (lmbKind[i] === 2) { ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI * 2); ctx.fill(); }
    else if (lmbKind[i] === 3) drawKnockedHelmet(ctx, lmbCol[i]);
    else if (lmbKind[i] === 4) drawSpineTrophy(ctx);
    else ctx.fillRect(-4, -1.8, 8, 3.6);
    ctx.restore();
  }

  // Render Intact Corpses (Veterans/Rivals/Bosses keep 100% un-faded outfit colors & head/torso anatomy!)
  for (let i = 0; i < MAX_CORPSE; i++) {
    if (!corpAct[i] || ageLv > 1) continue;
    const isVet = corpType[i] >= 98;
    const scale = corpType[i] === 99 ? 1.55 : (isVet ? 1.15 : 0.95);
    ctx.save();
    ctx.translate(corpX[i], corpY[i]);
    ctx.rotate(typeof corpRot !== "undefined" ? corpRot[i] : 0.4);
    ctx.scale(scale, scale);
    ctx.globalAlpha = isVet ? 1.0 : 0.78;

    if (corpLegs[i] < 2) {
      ctx.fillStyle = "#263238";
      if (corpLegs[i] < 1) ctx.fillRect(-6, -3.5, 4, 2.5);
      ctx.fillRect(-6, 1.0, 4, 2.5);
    }

    ctx.fillStyle = (typeof corpCol !== "undefined" && corpCol[i]) ? corpCol[i] : "rgba(55, 68, 82, 0.85)";
    ctx.fillRect(-3.5, -4.5, 9, 9);
    if (isVet) {
      ctx.strokeStyle = corpType[i] === 99 ? "#ff1744" : "#ffd166";
      ctx.lineWidth = 1.0;
      ctx.strokeRect(-3.5, -4.5, 9, 9);
    }

    // v9.01: deterministic dead head - helmet kept or knocked off is a pure function of corpSeed, eyes
    // are static, faded and fixed in one direction (no blinking, no per-frame re-roll).
    const cHead = (typeof corpHeadCol !== "undefined" && corpHeadCol[i]) ? corpHeadCol[i] : "#90a4ae";
    ctx.save(); ctx.translate(7.5, 0); ctx.rotate(Math.PI * 0.5);
    drawDeadHead(ctx, corpSeed[i], cHead, corpType[i] < 98 && corpseHelmetOff(corpSeed[i]), corpType[i], 0);
    ctx.restore();
    ctx.restore();
  }

  // Render Bisected Torso Halves (Preserves Head Color, Armor Color & Veteran Trophy Outline!)
  if (typeof slAct !== "undefined") {
    for (let i = 0; i < MAX_SLICE; i++) {
      if (!slAct[i] || ageLv) continue;
      const r = slRad[i] || 11;
      const isVet = (typeof slIsVet !== "undefined" && slIsVet[i]);
      ctx.save();
      ctx.translate(slX[i], slY[i] - slZ[i]);
      ctx.rotate(slCutAng[i] + slRot[i]);
      ctx.globalAlpha = isVet ? 1.0 : 0.90;
      ctx.fillStyle = slBodyCol[i];
      if (slHalf[i] === 0) {
        ctx.fillRect(-r * 0.65, -r * 0.85, r * 1.3, r * 0.85);
        if (isVet) {
          ctx.strokeStyle = "#ffd166";
          ctx.lineWidth = 0.9;
          ctx.strokeRect(-r * 0.65, -r * 0.85, r * 1.3, r * 0.85);
        }
        const sHead = (typeof slHeadCol !== "undefined" && slHeadCol[i]) ? slHeadCol[i] : slBodyCol[i];
        ctx.save(); ctx.translate(0, -r * 0.95);
        drawDeadHead(ctx, slSeed[i], sHead, slHelmetOff[i] === 1, isVet ? 98 : 0, r * 0.42);   // locked to slSeed / slHelmetOff
        ctx.restore();
      } else {
        ctx.fillRect(-r * 0.6, 0, r * 1.2, r * 0.65);
        ctx.fillStyle = "#263238";
        ctx.fillRect(-4, r * 0.5, 3, 5); ctx.fillRect(1, r * 0.5, 3, 5);
      }
      drawSmolderingSliceLine(ctx, r * 0.72, slHeat[i], slGlowCol[i]);
      ctx.restore();
    }
  }

  for (let i = 0; i < MAX_O; i++) {
    if (!oAct[i]) continue;
    ctx.fillStyle = oHome[i] ? "#00ff88" : "#00e5ff";
    ctx.beginPath(); ctx.arc(oX[i], oY[i], oVal[i] > 15 ? 4.8 : 3.2, 0, Math.PI * 2); ctx.fill();
  }

  renderAlliedMinions();

  const visorMode = player.activeVisor || 0;
  let bestTarget = -1, bestTargetScore = -1;
  const sdOn = typeof showdownBusy === "function" && showdownBusy();   // v12 Rival Showdown crowd

  for (let i = 0; i < MAX_E; i++) {
    if (!eAct[i] || !isEnemyOnScreen(i)) continue;
    const ally = allyCount > 0 && allyIs(i);                     // v13 Force-persuaded ally
    const score = ally ? -1 : eHP[i] * (eType[i] >= 98 ? 10 : 1);
    if (score > bestTargetScore) { bestTargetScore = score; bestTarget = i; }

    const isLevitating = typeof eLevitate !== "undefined" && eLevitate[i] > 0;
    const isKneeling = typeof eKneel !== "undefined" && eKneel[i] > 0;
    const spect = sdOn && sdSpect(i);
    const ex = eX[i], ey = eY[i] - (isLevitating ? (eLevZ[i] || 0) : (isKneeling ? -5 : 0)) - (spect ? sdCheerBob(i) : 0)
      - (ally && typeof allyLiftOffset === "function" ? allyLiftOffset(i) : 0) - (eFLiftZ[i] || 0), et = eType[i];
    const baseR = et === 99 ? 22 : (et === 3 ? 15 : 11);
    if (ally && typeof drawAllyAura === "function") drawAllyAura(ctx, i, ex, ey, baseR);

    if (eDummy[i] && typeof drawTrainingDummy === "function") {
      drawTrainingDummy(ex, ey, baseR, i);
    } else if (et === 98 && eRivalCid[i] >= 0) {
      const rFac = FACTIONS[CHAR_RAW[eRivalCid[i]][1]] || player.fac;
      const faceOv = sdOn ? showdownFaceAng(i) : null;     // v12: the rival turns to its challenger during its entrance
      const rSpd = Math.hypot(eVX[i], eVY[i]);
      const rAim = faceOv !== null ? faceOv : Math.atan2(player.y - ey, player.x - ex);
      const rRawFace = rSpd > 8 ? Math.atan2(eVY[i], eVX[i]) : rAim;
      const rGait = typeof erGetEnemyGait === "function"
        ? erGetEnemyGait(i, rSpd, rRawFace, null)
        : { walk: rSpd > 6 ? runTime * Math.min(10, Math.max(2.6, rSpd * 0.056)) : 0, walkBlend: Math.min(1, rSpd / 65), face: rRawFace };
      drawHeroSprite(ex, ey, rFac, eRivalCid[i], rGait.walk, rAim, 0, ctx, -1, null, rGait.face, rGait.walkBlend);
    } else if (typeof drawEnemyDetailed === "function" && (visorMode !== 3 || (ctx.fillStyle = "rgba(255, 110, 40, 0.22)", ctx.beginPath(), ctx.arc(ex, ey, baseR + 5, 0, Math.PI * 2), ctx.fill(), true)) && drawEnemyDetailed(i, ex, ey, baseR, ally, isKneeling, isLevitating, spect)) {
      // v14+: detailed per-hero roster enemies, Force-persuaded allies & showdown crowds (js/enemylook.js)
      if (eGrapple[i] > 0) { ctx.strokeStyle = "#00e5ff"; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(player.x, player.y); ctx.lineTo(ex, ey); ctx.stroke(); }
    } else {
      if (visorMode === 3) {
        ctx.fillStyle = "rgba(48, 79, 254, 0.45)";
        ctx.beginPath(); ctx.arc(ex, ey, baseR + 4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#ff3d00";
        ctx.fillRect(ex - baseR * 0.65, ey - baseR * 0.6, baseR * 1.3, baseR * 1.2);
        ctx.fillStyle = "#ffd600";
        ctx.beginPath(); ctx.arc(ex, ey - baseR * 0.55, baseR * 0.45, 0, Math.PI * 2); ctx.fill();
      } else {
        ctx.fillStyle = ally ? "#cfd8dc" : (et === 99 ? "#ff1744" : (eFormType[i] === 1 ? "#ffd166" : enemyCol2()));
        const lgL = ageLv ? 0 : eLegsLost[i], amL = ageLv ? 0 : eArmsLost[i];   // v14.2 age filter: nobody is drawn maimed
        const crawlOff = (lgL >= 2 || isKneeling) ? 4 : 0;
        const fbSpd = Math.hypot(eVX[i], eVY[i]), fbStep = fbSpd > 6 ? Math.sin(runTime * 8 + i) * 1.8 : 0;
        if (!isKneeling) {
          if (lgL < 1) ctx.fillRect(ex - 4, ey + 4 + fbStep, 3, 6);
          if (lgL < 2) ctx.fillRect(ex + 1, ey + 4 - fbStep, 3, 6);
        } else {
          ctx.fillRect(ex - 6, ey + 5, 5, 3); ctx.fillRect(ex + 1, ey + 5, 5, 3);
        }
        ctx.fillRect(ex - baseR * 0.6, ey - baseR * 0.5 + crawlOff, baseR * 1.2, baseR);
        ctx.beginPath(); ctx.arc(ex, ey - baseR * 0.75 + crawlOff, baseR * 0.45, 0, Math.PI * 2); ctx.fill();
        if (spect && amL < 2) {          // v12: spectators pump their fists while they watch the duel
          const pump = Math.sin(runTime * 9 + i) > 0 ? 1.5 : 0;
          ctx.fillRect(ex - baseR * 0.82, ey - baseR * 1.15 - pump, 2.2, baseR * 0.75);
          if (amL < 1) ctx.fillRect(ex + baseR * 0.82 - 2.2, ey - baseR * 1.15 - (1.5 - pump), 2.2, baseR * 0.75);
        }

        ctx.fillStyle = "#111";
        ctx.fillRect(ex - baseR * 0.32, ey - baseR * 0.85 + crawlOff, baseR * 0.64, 2.2);
        ctx.fillStyle = ally ? forceAllyColor() : (et === 99 ? "#ffff00" : "#00e5ff");
        ctx.fillRect(ex - baseR * 0.24, ey - baseR * 0.82 + crawlOff, 2.0, 1.6);
        ctx.fillRect(ex + baseR * 0.08, ey - baseR * 0.82 + crawlOff, 2.0, 1.6);

        if (isLevitating) {
          ctx.strokeStyle = "#80deea"; ctx.lineWidth = 1.6;
          ctx.beginPath(); ctx.arc(ex, ey, baseR + 8, 0, Math.PI * 2); ctx.stroke();
        }
      }

      if (eGrapple[i] > 0) {
        ctx.strokeStyle = "#00e5ff"; ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.moveTo(player.x, player.y); ctx.lineTo(ex, ey); ctx.stroke();
      }
    }

    if (typeof eScarHeat !== "undefined" && eScarHeat[i] > 0.05) {
      const activeW = (player.weapons && player.weapons[0]) ? player.weapons[0] : null;
      const scarGlow = (activeW && activeW.bladeCol) ? activeW.bladeCol : (player.fac ? player.fac.c1 : "#00f0ff");
      ctx.save();
      ctx.translate(ex, ey + (eScarOffY[i] || 0));
      ctx.rotate(eScarAng[i]);
      drawSmolderingSliceLine(ctx, baseR * 0.68, eScarHeat[i], scarGlow);
      ctx.restore();
    }

    if ((eEcho[i] || eStagger[i] > 0) && typeof drawEnemyStatusFx === "function") drawEnemyStatusFx(i, ex, ey, baseR);

    if (ally) {                                                   // v13: ally health (green) + time left (Force colour)
      ctx.fillStyle = "rgba(0,0,0,0.65)"; ctx.fillRect(ex - 10, ey - 24, 20, 4.4);
      ctx.fillStyle = "#69f0ae"; ctx.fillRect(ex - 10, ey - 24, 20 * Math.max(0, eHP[i] / eMax[i]), 2.4);
      ctx.fillStyle = forceAllyColor(); ctx.fillRect(ex - 10, ey - 21.2, 20 * Math.max(0, allyT[i] / Math.max(1, allyDur[i])), 1.4);
    } else if (eHP[i] < eMax[i] || et >= 98) {
      const bw = et === 99 ? 36 : 20;
      ctx.fillStyle = "rgba(0,0,0,0.65)";
      ctx.fillRect(ex - bw * 0.5, ey - 22, bw, 3.2);
      ctx.fillStyle = et >= 98 ? "#ff1744" : "#00e676";
      ctx.fillRect(ex - bw * 0.5, ey - 22, bw * Math.max(0, eHP[i] / eMax[i]), 3.2);
    }
  }

  if (visorMode > 0 && bestTarget >= 0) {
    const bx = eX[bestTarget], by = eY[bestTarget];
    const bType = eType[bestTarget];
    const tName = bType === 99 ? "APEX TITAN BOSS" : (bType === 98 ? "RIVAL BOUNTY HUNTER" : (typeof enemyDisplayName === "function" ? enemyDisplayName(bestTarget) : (ENEMY_NAMES[bType % 4] || "HOSTILE")));
    const headPct = Math.max(1, Math.round((eHP[bestTarget] / Math.max(1, eMax[bestTarget])) * 100));
    const pulse = 20 + Math.sin(runTime * 8) * 3;

    ctx.save();
    if (visorMode === 1) {
      ctx.strokeStyle = "#00e676"; ctx.lineWidth = 1.6;
      ctx.strokeRect(bx - pulse, by - pulse, pulse * 2, pulse * 2);
      ctx.fillStyle = "#00e676"; ctx.font = "bold 7.5px monospace";
      ctx.fillText(`LOCK: ${tName} [${Math.round(Math.hypot(bx - player.x, by - player.y))}m]`, bx - 38, by - pulse - 5);
    } else if (visorMode === 2) {
      ctx.strokeStyle = "#ff1744"; ctx.lineWidth = 1.8;
      ctx.strokeRect(bx - pulse, by - pulse, pulse * 2, pulse * 2);
      ctx.fillStyle = "rgba(255, 23, 68, 0.88)"; ctx.font = "bold 7.5px monospace";
      ctx.fillText(`TARGET: ${tName}`, bx - 44, by - pulse - 13);
      ctx.fillText(`HEAD LIFE: ${headPct}% | WEAKNESS: HEAD`, bx - 44, by - pulse - 4);
    } else if (visorMode === 3) {
      ctx.strokeStyle = "#ff1744"; ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(bx, by - pulse); ctx.lineTo(bx - pulse, by + pulse * 0.8); ctx.lineTo(bx + pulse, by + pulse * 0.8);
      ctx.closePath(); ctx.stroke();
      ctx.fillStyle = "#ff1744";
      [[0, -6], [-5, 4], [5, 4]].forEach(([ox, oy]) => {
        ctx.beginPath(); ctx.arc(bx + ox, by - 6 + oy, 1.8, 0, Math.PI * 2); ctx.fill();
      });
    } else if (visorMode === 4) {
      ctx.strokeStyle = "#00ff88"; ctx.lineWidth = 1.4;
      ctx.strokeRect(bx - pulse, by - pulse, pulse * 2, pulse * 2);
      ctx.fillStyle = "#00ff88"; ctx.font = "bold 8px monospace";
      ctx.fillText(`0110 [${tName}] CRIT+10%`, bx - 42, by - pulse - 5);
      ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + eVX[bestTarget] * 0.45, by + eVY[bestTarget] * 0.45); ctx.stroke();
    }
    ctx.restore();
  }

  if (typeof forcePushVis !== "undefined" && forcePushVis.timer > 0) {
    const prog = 1 - (forcePushVis.timer / Math.max(0.01, forcePushVis.maxT));
    const curR = 14 + (forcePushVis.maxR - 14) * prog;
    const halfA = forcePushVis.arc * 0.5;
    ctx.save();
    ctx.strokeStyle = forcePushVis.col || "#00e5ff";
    ctx.globalAlpha = Math.max(0, 1 - prog * 0.85);
    for (let ring = 0; ring < 3; ring++) {
      const rr = Math.max(6, curR - ring * 14);
      ctx.lineWidth = 3.2 - ring * 0.8;
      ctx.beginPath();
      ctx.arc(forcePushVis.x, forcePushVis.y, rr, forcePushVis.ang - halfA, forcePushVis.ang + halfA);
      ctx.stroke();
    }
    ctx.restore();
  }

  if (player.dashTimer > 0) {
    const dProg = player.dashTimer / 0.30;
    ctx.save();
    ctx.strokeStyle = player.dashCol || "#00e5ff";
    ctx.globalAlpha = dProg * 0.55;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(player.dashStartX, player.dashStartY);
    ctx.lineTo(player.dashEndX, player.dashEndY);
    ctx.stroke();
    ctx.restore();
  }

  if (flameVisTimer > 0) {
    const wristX = player.x + Math.cos(player.aim) * 10;
    const wristY = player.y + Math.sin(player.aim) * 10;
    const coneLen = 122 * player.area;
    ctx.save();
    for (let f = 0; f < 16; f++) {
      const frac = f / 16;
      const spread = (Math.sin(runTime * 28 + f * 1.9) * 0.26) * frac;
      const fx = wristX + Math.cos(player.aim + spread) * (14 + frac * coneLen);
      const fy = wristY + Math.sin(player.aim + spread) * (14 + frac * coneLen);
      const rad = 3.5 + frac * 18;
      ctx.fillStyle = frac < 0.25 ? "#fff59d" : (frac < 0.65 ? "rgba(255, 145, 0, 0.72)" : "rgba(216, 67, 21, 0.45)");
      ctx.beginPath(); ctx.arc(fx, fy, rad, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  // Keep a self-flying hero at their normal screen size while the ground and
  // NPCs recede. Scale around the hero only, never the world or hitboxes.
  const selfFlight = typeof FLY !== "undefined" && ((FLY.on && FLY.self && FLY.air) || !!FLY.chute);
  const legacyHover = !player.inVehicle && player.flying && !selfFlight;
  const pose = selfFlight ? { vx: FLY.vxm || 0, vy: FLY.vym || 0, top: (FLY.S && FLY.S.top) || 42, jet: !!(FLY.S && FLY.S.trail === "jet") } :
    legacyHover ? { vx: player.vx || 0, vy: player.vy || 0, top: player.spd || 145, jet: true } : null;
  const hx = player.x + (player.sfLX || 0), hy = player.y + (player.sfLY || 0);
  ctx.save();
  if (selfFlight) { const k = 1 / Math.max(0.00001, FLY.zoom || 1); ctx.translate(hx, hy); ctx.scale(k, k); ctx.translate(-hx, -hy); }
  if (selfFlight && FLY.on && FLY.self && FLY.S && FLY.S.trail === "broom" && typeof flyDrawOwn === "function") {
    ctx.save(); ctx.translate(hx, hy + 8); ctx.rotate(FLY.hdg); ctx.scale(0.32, 0.32); flyDrawOwn(ctx, "broom", runTime, null); ctx.restore();
  }
  if (selfFlight && FLY.chute) {
    ctx.save(); ctx.translate(hx, hy); ctx.strokeStyle = "#cfd8dc"; ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(-4, -2); ctx.lineTo(-16, -23); ctx.moveTo(4, -2); ctx.lineTo(16, -23); ctx.stroke();
    ctx.fillStyle = "#ffca70"; ctx.beginPath(); ctx.arc(0, -23, 16, Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.restore();
  }
  const playerFacing = typeof player.facingAng === "number"
    ? player.facingAng
    : (Math.hypot(player.vx || 0, player.vy || 0) > 12 ? Math.atan2(player.vy, player.vx) : Math.PI / 2);
  // v16.0-s06-6: When driving a Nexus City rigid-body vehicle or aircraft (inVehicle === 3),
  // vehRenderMine / flyDrawCraft renders the vehicle (and open-cockpit driver) cleanly on top
  // without leaking a full-size hero sprite or saber underneath closed roofs or 1:3 real-map cars.
  const hideCityDriver = player.inVehicle === 3 && typeof VEH !== "undefined" && !!VEH.me;
  if (!hideCityDriver) {
    drawHeroSprite(hx, hy, player.fac, player.cid, player.walk, player.aim, player.inVehicle, ctx, player.guardZone, pose, playerFacing, player.walkBlend || 0);
  }
  ctx.restore();

  if (typeof thrownBlade !== "undefined" && thrownBlade.active) {
    ctx.save();
    if (thrownBlade.stage >= 2) {
      ctx.strokeStyle = "rgba(0, 229, 255, 0.45)"; ctx.lineWidth = 1.2; ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(player.x, player.y - 4); ctx.lineTo(thrownBlade.x, thrownBlade.y); ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.translate(thrownBlade.x, thrownBlade.y);
    const wiggleAng = thrownBlade.stage === 2 ? Math.sin(runTime * 65) * 0.24 : 0;
    ctx.rotate(thrownBlade.ang + wiggleAng);
    drawWeaponModel(ctx, thrownBlade.wpnId, "orbit", true, false, thrownBlade.glowCol, 0, thrownBlade.stage === 2 ? 0 : 18);
    ctx.restore();
  }

  const handOriginX = player.x + Math.cos(player.aim) * 9;
  const handOriginY = player.y + Math.sin(player.aim) * 9;


  for (let i = 0; i < MAX_P; i++) {
    if (!pAct[i]) continue;
    const st = pStyle[i];
    if (st === 8) {
      ctx.save();
      ctx.translate(pX[i], pY[i]);
      ctx.rotate(runTime * 24 + i);
      ctx.strokeStyle = pSup[i] ? "#ffd166" : player.fac.c1;
      ctx.fillStyle = "#37474f"; ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.arc(0, 0, 7.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#ff1744"; ctx.beginPath(); ctx.arc(0, 0, 2.5, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    } else if (st === 7) {
      const sAng = Math.atan2(pVY[i], pVX[i]);
      const slashR = Math.max(14, (pRad[i] || 20) * 0.85);
      ctx.save(); ctx.translate(pX[i], pY[i]); ctx.rotate(sAng);
      ctx.strokeStyle = pSup[i] ? "#ffd166" : player.fac.c1;
      ctx.lineWidth = pSup[i] ? 4.2 : 3.0;
      ctx.beginPath(); ctx.arc(-slashR * 0.35, 0, slashR, -0.72, 0.72); ctx.stroke();
      ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.arc(-slashR * 0.35, 0, slashR * 0.92, -0.58, 0.58); ctx.stroke();
      ctx.restore();
    } else if (st === 1) {
      ctx.save();
      ctx.strokeStyle = pSup[i] ? "#ffd166" : player.fac.c1;
      ctx.lineWidth = 2.6; ctx.globalAlpha = 0.65;
      ctx.beginPath(); ctx.arc(player.x, player.y, pVY[i] || 28, pVX[i] - 0.55, pVX[i] + 0.55); ctx.stroke();
      ctx.restore();
    } else if (st === 5 && !pEnemy[i]) {
      ctx.save();
      for (let branch = 0; branch < 2; branch++) {
        ctx.strokeStyle = branch === 0 ? "#7c4dff" : "#e0f7fa";
        ctx.lineWidth = branch === 0 ? 2.6 : 1.2;
        ctx.beginPath(); ctx.moveTo(handOriginX, handOriginY);
        const segs = 6;
        for (let s = 1; s <= segs; s++) {
          const t = s / segs;
          const jx = s < segs ? (Math.random() - 0.5) * 16 : 0;
          const jy = s < segs ? (Math.random() - 0.5) * 16 : 0;
          ctx.lineTo(handOriginX + (pX[i] - handOriginX) * t + jx, handOriginY + (pY[i] - handOriginY) * t + jy);
        }
        ctx.stroke();
      }
      ctx.restore();
    } else if (pSup[i] === 3) {
      ctx.save();
      ctx.strokeStyle = "#00ff88"; ctx.lineWidth = 3.5;
      ctx.beginPath(); ctx.moveTo(handOriginX, handOriginY);
      const segs = 5;
      for (let s = 1; s <= segs; s++) {
        const t = s / segs;
        const jx = s < segs ? (Math.random() - 0.5) * 14 : 0;
        const jy = s < segs ? (Math.random() - 0.5) * 14 : 0;
        ctx.lineTo(handOriginX + (pX[i] - handOriginX) * t + jx, handOriginY + (pY[i] - handOriginY) * t + jy);
      }
      ctx.stroke();
      ctx.restore();
    } else if (st === 2 && !pEnemy[i]) {
      const rAng = Math.atan2(pVY[i], pVX[i]);
      ctx.save(); ctx.translate(pX[i], pY[i]); ctx.rotate(rAng);
      const flick = 2.9 + Math.sin(runTime * 61 + i * 1.7) * 0.9;
      ctx.fillStyle = "#ff9100"; ctx.beginPath(); ctx.arc(-4.8, 0, flick, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#fff59d"; ctx.beginPath(); ctx.arc(-4.2, 0, flick * 0.45, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#eceff1"; ctx.fillRect(-4, -2, 7.5, 4);
      ctx.fillStyle = "#ff1744";
      ctx.beginPath(); ctx.moveTo(3.5, -2.4); ctx.lineTo(7.5, 0); ctx.lineTo(3.5, 2.4); ctx.closePath(); ctx.fill();
      ctx.restore();
    } else if (st === 9) {   // v10 squad rifle tracer
      const sp = Math.hypot(pVX[i], pVY[i]) || 1;
      ctx.strokeStyle = pSup[i] ? "#ffd166" : "#ffe082"; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(pX[i] - pVX[i] / sp * 10, pY[i] - pVY[i] / sp * 10); ctx.lineTo(pX[i], pY[i]); ctx.stroke();
    } else if (st === 6) {
      ctx.strokeStyle = pSup[i] ? "#ffd166" : player.fac.c1; ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.arc(pX[i], pY[i], pRad[i], 0, Math.PI * 2); ctx.stroke();
    } else if (!drawBallisticProjectile(ctx, i) && !drawEnergyBoltProjectile(ctx, i) && !drawUtilityProjectile(ctx, i)) {
      ctx.fillStyle = pSup[i] === 2 ? "#ffffff" : (pEnemy[i] ? "#ff1744" : (pSup[i] ? "#ffd166" : player.fac.c1));
      ctx.beginPath(); ctx.arc(pX[i], pY[i], Math.max(2.5, pRad[i] * 0.45), 0, Math.PI * 2); ctx.fill();
    }
  }

  if (typeof blAct !== "undefined") {
    for (let i = 0; i < MAX_BLAST; i++) {
      if (!blAct[i]) continue;
      const alpha = Math.max(0, blLife[i] / 0.38);
      ctx.save();
      ctx.strokeStyle = blCol[i]; ctx.globalAlpha = alpha; ctx.lineWidth = 3.5;
      ctx.beginPath(); ctx.arc(blX[i], blY[i], blRad[i], 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = "rgba(255, 196, 0, 0.32)";
      ctx.beginPath(); ctx.arc(blX[i], blY[i], blRad[i] * 0.65, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
  }

  drawParticles();
  if (V10.onRenderWorld.length) v10Run(V10.onRenderWorld, ctx);
  ctx.textAlign = "center";
  for (let i = 0; i < MAX_D; i++) {
    if (!dAct[i]) continue;
    ctx.fillStyle = dCol[i];
    ctx.font = dCrit[i] === 2 ? "bold 9.5px sans-serif" : (dCrit[i] === 1 ? "bold 10px monospace" : "8.5px monospace");
    ctx.fillText(dTxt[i] || String(dVal[i]), dX[i], dY[i]);
  }

  ctx.restore();

  if (joy.act) {
    ctx.strokeStyle = "rgba(0, 229, 255, 0.38)"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(joy.ox, joy.oy, opts.joySize, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = "rgba(255, 209, 102, 0.65)";
    ctx.beginPath(); ctx.arc(joy.ox + joy.dx * opts.joySize, joy.oy + joy.dy * opts.joySize, 14, 0, Math.PI * 2); ctx.fill();
  }
  if (V10.onRenderScreen.length) v10Run(V10.onRenderScreen, ctx);
}
// EOF:js/render.js
