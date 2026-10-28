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
  if ([51, 19, 41, 42].includes(cid)) return 0;
  if ([52, 6, 13, 22].includes(cid)) return 1;
  if ([15, 28, 31, 33, 34, 37, 40, 44, 53].includes(cid)) return 2;
  if ([1, 16, 25, 47, 54].includes(cid)) return 3;
  if ([0, 14, 18, 24, 32, 48, 50, 76, 77, 78, 79, 80].includes(cid)) return 4;
  if ([3, 7, 10, 11, 12, 20, 21, 27, 38, 39, 46, 49, 56, 57, 59, 66, 67, 69, 70, 71, 72, 73, 74, 75].includes(cid)) return 5;
  return 6;
}

/* === 2. ANATOMICAL STATURE & PROPORTION REGISTRY FOR ALL 80 HEROES (#00-#79) === */
function getHeroBodySpec(cid) {
  if (cid === 4)  return { sx: 0.76, sy: 0.74, yOff: 3.5, kind: "astromech" }; // R2-D2 Small Astromech Droid
  if (cid === 79) return { sx: 0.68, sy: 0.60, yOff: 4.5, kind: "yoda" };      // Grandmaster Yoda Small Stature
  if (cid === 10) return { sx: 0.72, sy: 0.68, yOff: 3.5, kind: "grey" };      // Asgard Roswell Grey Small Alien
  if (cid === 61) return { sx: 1.34, sy: 1.28, yOff: -2.5, kind: "hagrid" };   // Rubeus Hagrid Half-Giant
  if (cid === 5)  return { sx: 1.16, sy: 1.20, yOff: -1.8, kind: "wookiee" };  // Chewbacca Tall Wookiee
  if (cid === 30) return { sx: 1.18, sy: 1.24, yOff: -2.0, kind: "xeno" };     // Xenomorph Queen
  if (cid === 37) return { sx: 1.28, sy: 1.20, yOff: -1.8, kind: "ork" };      // Ork Warboss
  if (cid === 21) return { sx: 1.28, sy: 1.10, yOff: -1.0, kind: "baron" };    // Baron Harkonnen
  if (cid === 76) return { sx: 1.12, sy: 1.15, yOff: -1.5, kind: "vader" };    // Darth Vader Tall Cybernetic Juggernaut
  if (cid === 55) return { sx: 1.12, sy: 1.16, yOff: -1.5, kind: "grievous" }; // General Grievous Tall Cyborg
  if ([33, 34, 40].includes(cid)) return { sx: 1.14, sy: 1.12, yOff: -1.0, kind: "heavy" };
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
    const steelBlade = [14, 18, 19, 24, 34, 48, 50, 68, 71].includes(wpnId);

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

  const isHeavy = [15, 28, 31, 33, 34, 37, 40, 44, 53].includes(wpnId) || style === "cone";
  tCtx.fillStyle = "#263238";
  tCtx.fillRect(-3.5, -1.6, (isHeavy ? 15 : 12) * lenMul, isHeavy ? 3.4 : 2.6);
  tCtx.fillStyle = isSuper ? "#ffd166" : "#90a4ae";
  tCtx.fillRect(1 - rackShift * 3.0, -2.0, 6.5, 1.5);
  if (style === "beam" || style === "chain") {
    tCtx.fillStyle = effCol;
    tCtx.fillRect(6, -0.8, 6 * lenMul, 1.6);
  }
}

// v11: a blade posed by the Saber Form Engine (js/saberforms.js): exact sim geometry, grip, motion trail, stowed hilt.
// Grievous' extra blades (R.extra) are drawn the same way from their own engine states.
function drawSaberFormSlot(tCtx, w, R, col, handCol, aim, slotIdx) {
  drawSaberBladePose(tCtx, w, R, col, handCol, aim, slotIdx, R.st, true);
  if (R.extra) for (let k = 0; k < R.extra.length; k++) {
    const X = R.extra[k];
    if (X && typeof X.arm === "number") drawSaberBladePose(tCtx, w, X, col, handCol, aim, X.slot, X.st, false);
  }
}

function drawSaberBladePose(tCtx, w, R, col, handCol, aim, slotIdx, bladeSt, main) {
  const sideSign = (slotIdx % 2 === 0) ? 1 : -1, upper = slotIdx >= 2 ? -3.5 : 0;
  if (R.lit < 0.04) {                                     // retracted: hilt clipped to the belt, hand at rest
    tCtx.save();
    tCtx.translate(4.8 * sideSign, 5.2 + upper);
    tCtx.rotate(Math.PI / 2 - 0.3 * sideSign);
    drawWeaponModel(tCtx, w.id, "orbit", w.lvl >= 5, w.lvl >= 10, col, 0, 0, -1, R.dbl, w.hilt);
    tCtx.restore();
    drawBallHand(tCtx, 7.2 * sideSign, 1.2 + upper, 2.4, handCol);
    return;
  }
  if (typeof saberDrawTrail === "function") saberDrawTrail(tCtx, w, col, bladeSt);
  tCtx.save();
  tCtx.rotate(R.arm);
  tCtx.translate(R.reach, R.side);
  tCtx.save();
  tCtx.rotate(R.blade - R.arm);
  drawWeaponModel(tCtx, w.id, "orbit", w.lvl >= 5, w.lvl >= 10, col, 0, 0, Math.max(0.5, R.len), R.dbl, w.hilt);
  if (R.grip === 2 || R.dbl) drawBallHand(tCtx, R.dbl ? -4.2 : -3.6, 0, 2.3, handCol);   // second hand on the hilt
  tCtx.restore();
  drawBallHand(tCtx, 0, 0, 2.5, handCol);
  tCtx.restore();
  if (main && slotIdx === 0 && R.grip !== 2 && !R.dbl && !R.extra) {   // the free hand
    if (R.off === "front") drawBallHand(tCtx, Math.cos(aim) * 10, Math.sin(aim) * 10 - 3, 2.3, handCol);            // Soresu: extended
    else if (R.off === "back") drawBallHand(tCtx, -Math.cos(aim) * 5.5, -Math.sin(aim) * 5.5 - 5, 2.3, handCol);    // Makashi: raised behind
    else if (R.off === "fist") drawBallHand(tCtx, Math.cos(aim + 0.9) * 6.5, Math.sin(aim + 0.9) * 6.5, 2.4, handCol); // Vader: clenched
  }
}

/* === 4. CANON 80-HERO SPRITE RENDERER (STATURE SCALING, R2-D2 DROID, YODA, CLINT, VADER) === */
const HELMET_HEROES = new Set([1, 2, 4, 7, 9, 17, 19, 23, 26, 29, 30, 32, 33, 34, 35, 36, 47, 49, 50, 54, 55, 76]);

function drawHeroSprite(x, y, fac, cid, walk = 0, aim = 0, inVeh = 0, tCtx = ctx, guardZone = -1) {
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
  const stride = Math.sin(walk * 2.2) * 3.2;
  const acrobatZ = isLivePlayer ? (player.acrobatZ || 0) : 0;
  const hoverBob = (kStyle === 3 || kStyle === 5) ? Math.sin((typeof runTime !== "undefined" ? runTime : 0) * 5.5) * 2.0 : 0;
  const bankAng = isLivePlayer ? (player.bankTilt || 0) : 0;

  tCtx.save();
  tCtx.translate(x, y + hoverBob + bSpec.yOff - acrobatZ);
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

  // SPECIAL CASE #04: R2-D2 Small Cylindrical Astromech Droid
  if (cid === 4) {
    tCtx.fillStyle = cLegs;
    tCtx.fillRect(-7.5, -3, 2.6, 12.5);
    tCtx.fillRect(4.9, -3, 2.6, 12.5);
    tCtx.fillRect(-1.5, 4 + Math.abs(stride) * 0.25, 3.0, 5.5);
    tCtx.fillStyle = "#90a4ae";
    tCtx.fillRect(-8.2, 8.2, 4.0, 2.2);
    tCtx.fillRect(4.2, 8.2, 4.0, 2.2);

    tCtx.fillStyle = cTorso;
    tCtx.fillRect(-5.5, -5.5, 11.0, 11.5);
    tCtx.fillStyle = cHead;
    tCtx.fillRect(-3.8, -4.2, 7.6, 1.8);
    tCtx.fillRect(-3.8, -1.5, 3.2, 4.2);
    tCtx.fillRect(0.6, -1.5, 3.2, 4.2);

    tCtx.fillStyle = "#cfd8dc";
    tCtx.beginPath(); tCtx.arc(0, -5.5, 5.5, Math.PI, 0); tCtx.fill();
    tCtx.fillStyle = cHead;
    tCtx.fillRect(-4.2, -9.2, 2.6, 2.2);
    tCtx.fillRect(1.6, -9.2, 2.6, 2.2);
    tCtx.fillStyle = "#111111";
    tCtx.beginPath(); tCtx.arc(Math.cos(aim) * 1.2, -8.2, 1.5, 0, Math.PI * 2); tCtx.fill();
    tCtx.fillStyle = "#ff1744";
    tCtx.beginPath(); tCtx.arc(2.2, -6.8, 0.9, 0, Math.PI * 2); tCtx.fill();

    tCtx.save();
    tCtx.rotate(aim);
    tCtx.fillStyle = "#90a4ae";
    tCtx.fillRect(5, -1.2, 8.5, 2.4);
    tCtx.fillStyle = "#00e5ff";
    tCtx.beginPath(); tCtx.arc(14, 0, 2.0, 0, Math.PI * 2); tCtx.fill();
    tCtx.restore();
    tCtx.restore();
    return;
  }

  const hasJetpack = [1, 16, 25, 34, 47, 54].includes(cid);
  if (hasJetpack) {
    tCtx.fillStyle = cBack !== "none" ? cBack : "#37474f";
    tCtx.fillRect(-6.8, -5.5, 13.6, 9.5);
    if (Math.abs(stride) > 0.4) {
      tCtx.fillStyle = "#ff9100";
      tCtx.fillRect(-5, 4, 3, 4 + Math.random() * 3);
      tCtx.fillRect(2, 4, 3, 4 + Math.random() * 3);
    }
    const sigDef = (typeof HERO_SIG_GEAR !== "undefined" && HERO_SIG_GEAR[cid]) ? HERO_SIG_GEAR[cid] : null;
    const maxCD = sigDef ? sigDef[5] * (isLivePlayer ? player.cdr : 1) : 7.5;
    const rocketInFlight = isLivePlayer && player.sigGearCD > (maxCD - 1.55);
    if (!rocketInFlight && cid === 54) {
      const sway = Math.sin(walk * 1.8) * 0.9;
      tCtx.fillStyle = "#cfd8dc";
      tCtx.fillRect(-1.8 + sway, -18.5, 3.6, 6.5);
      tCtx.fillStyle = "#d84315";
      tCtx.beginPath();
      tCtx.moveTo(-2.4 + sway, -18.5); tCtx.lineTo(0 + sway, -23.0); tCtx.lineTo(2.4 + sway, -18.5);
      tCtx.closePath(); tCtx.fill();
    }
  } else if (cBack && cBack !== "none") {
    tCtx.fillStyle = cBack;
    tCtx.fillRect(-6.8, -3.5, 13.6, 12.0);
  }

  if (cid === 30) {
    tCtx.strokeStyle = "#111"; tCtx.lineWidth = 2.2;
    tCtx.beginPath(); tCtx.moveTo(0, 5);
    tCtx.quadraticCurveTo(12, 8 + Math.sin(walk * 3) * 4, 16, -2);
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
      if (hIdx % 2 === 0) { tCtx.translate(-4, -3); tCtx.rotate(-0.85 - hIdx * 0.18); }
      else { tCtx.translate(hIdx === 1 ? -6.5 : 6.5, 4); tCtx.rotate(Math.PI * 0.48); }
      tCtx.scale(0.72, 0.72);
      drawWeaponModel(tCtx, w.id, w.style, w.lvl >= 5, w.lvl >= 10, wHolsterCol, 0, 0, 0, w.dbl ? true : null, w.hilt);
      tCtx.restore();
      hIdx++;
    });
  }

  tCtx.fillStyle = cLegs;
  tCtx.fillRect(-4.8, 4 + stride * 0.5, 3.8, 6.5);
  tCtx.fillRect(1.0, 4 - stride * 0.5, 3.8, 6.5);

  tCtx.fillStyle = cTorso;
  tCtx.fillRect(-5.8, -5.5, 11.6, 10.5);

  if (cid === 34 || cid === 33) {
    tCtx.fillStyle = cTorso;
    tCtx.fillRect(-8.2, -5.8, 3.2, 5.2);
    tCtx.fillRect(5.0, -5.8, 3.2, 5.2);
  }

  if (cid === 5) {
    tCtx.strokeStyle = "#cfd8dc"; tCtx.lineWidth = 2.0;
    tCtx.beginPath(); tCtx.moveTo(-5.5, -5.0); tCtx.lineTo(5.5, 4.0); tCtx.stroke();
  }

  if (cid === 76) {
    tCtx.fillStyle = "#263238"; tCtx.fillRect(-2.6, -2.8, 5.2, 4.2);
    tCtx.fillStyle = "#ff1744"; tCtx.fillRect(-1.8, -2.0, 1.4, 1.4);
    tCtx.fillStyle = "#00e676"; tCtx.fillRect(0.4, -2.0, 1.4, 1.4);
  } else {
    tCtx.fillStyle = cHead;
    tCtx.beginPath();
    tCtx.moveTo(-3.2, -5.5); tCtx.lineTo(3.2, -5.5); tCtx.lineTo(0, -1.2);
    tCtx.closePath(); tCtx.fill();
  }

  tCtx.fillStyle = "#1c262b"; tCtx.fillRect(-5.8, 2.6, 11.6, 2.2);
  tCtx.fillStyle = "#ffd166"; tCtx.fillRect(-1.6, 2.6, 3.2, 2.2);

  const isHelmeted = HELMET_HEROES.has(cid);
  const isFemale = FEMALE_HEROES.has(cid);
  const isBlinking = isLivePlayer && (player.blinkDur || 0) > 0;
  const eyeLookX = Math.cos(aim) * 0.9;
  const eyeLookY = Math.sin(aim) * 0.45;

  if (isHelmeted) {
    if (cid === 30) {
      tCtx.fillStyle = cHead;
      tCtx.beginPath();
      tCtx.moveTo(-6.5, -8.5); tCtx.lineTo(-8.5, -18.0); tCtx.lineTo(0, -15.5); tCtx.lineTo(8.5, -18.0); tCtx.lineTo(6.5, -8.5);
      tCtx.closePath(); tCtx.fill();
      tCtx.beginPath(); tCtx.arc(0, -9.5, 5.0, 0, Math.PI * 2); tCtx.fill();
      tCtx.fillStyle = "#cfd8dc"; tCtx.fillRect(-2.2, -7.2, 4.4, 1.4);
    } else if (cid === 76) {
      tCtx.fillStyle = cHead;
      tCtx.beginPath();
      tCtx.arc(0, -10.2, 5.8, Math.PI, 0);
      tCtx.lineTo(7.0, -5.8); tCtx.lineTo(-7.0, -5.8);
      tCtx.closePath(); tCtx.fill();
      tCtx.fillStyle = "#263238";
      tCtx.beginPath(); tCtx.arc(-2.1 + eyeLookX * 0.4, -9.8, 1.7, 0, Math.PI * 2); tCtx.fill();
      tCtx.beginPath(); tCtx.arc(2.1 + eyeLookX * 0.4, -9.8, 1.7, 0, Math.PI * 2); tCtx.fill();
      tCtx.strokeStyle = "#546e7a"; tCtx.lineWidth = 0.9;
      tCtx.beginPath(); tCtx.moveTo(0, -8.8); tCtx.lineTo(-2.4, -6.0); tCtx.lineTo(2.4, -6.0); tCtx.closePath(); tCtx.stroke();
    } else {
      tCtx.fillStyle = cHead;
      tCtx.beginPath(); tCtx.arc(0, -9.5, 5.5, 0, Math.PI * 2); tCtx.fill();

      if (cid === 54 || cid === 1) {
        tCtx.fillStyle = "#111";
        tCtx.fillRect(-3.8, -10.8, 7.6, 1.8);
        tCtx.fillRect(-1.0, -10.8, 2.0, 4.6);
        const visorOn = !isLivePlayer || player.activeVisor === 1;
        tCtx.strokeStyle = "#b0bec5"; tCtx.lineWidth = 1.2;
        tCtx.beginPath(); tCtx.moveTo(5.2, -10);
        if (visorOn) {
          tCtx.lineTo(7.2, -12.5); tCtx.lineTo(2.5, -12.5); tCtx.stroke();
          tCtx.fillStyle = "#00e676"; tCtx.fillRect(1.2, -13.2, 2.2, 1.5);
        } else {
          tCtx.lineTo(5.2, -16.5); tCtx.stroke();
          tCtx.fillStyle = "#cfd8dc"; tCtx.fillRect(4.2, -17.2, 2.6, 1.5);
        }
      } else if (cid === 55) {
        tCtx.fillStyle = cHead;
        tCtx.fillRect(-7.5, -12.0, 2.2, 5.0);
        tCtx.fillRect(5.3, -12.0, 2.2, 5.0);
        tCtx.fillStyle = "#ffd166";
        tCtx.fillRect(-3.2 + eyeLookX, -10.6, 2.2, 1.6);
        tCtx.fillRect(1.0 + eyeLookX, -10.6, 2.2, 1.6);
        tCtx.fillStyle = "#263238";
        for (let k = -2; k <= 2; k += 2) tCtx.fillRect(k - 0.4, -7.8, 0.8, 2.2);
      } else if (cid === 32 || cid === 33 || cid === 47) {
        tCtx.fillStyle = cid === 33 ? "#00e676" : "#ffd166";
        tCtx.fillRect(-3.6 + eyeLookX * 0.5, -11.0, 7.2, 2.6);
        tCtx.strokeStyle = "#111"; tCtx.lineWidth = 0.8;
        tCtx.strokeRect(-3.6 + eyeLookX * 0.5, -11.0, 7.2, 2.6);
      } else if (cid === 2 || cid === 19 || cid === 34) {
        tCtx.fillStyle = cid === 34 || cid === 2 ? "#ff1744" : "#ffd166";
        tCtx.fillRect(-3.2 + eyeLookX, -10.6, 2.2, 1.6);
        tCtx.fillRect(1.0 + eyeLookX, -10.6, 2.2, 1.6);
        tCtx.fillStyle = "#263238"; tCtx.fillRect(-1.8, -7.8, 3.6, 2.0);
      } else {
        tCtx.fillStyle = "#111"; tCtx.fillRect(-3.8, -10.8, 7.6, 2.2);
        tCtx.fillStyle = cid === 36 ? "#00e676" : "#ff1744";
        tCtx.fillRect(-2.4 + eyeLookX, -10.4, 4.8, 1.5);
      }
    }
  } else {
    const skinCol = (cid === CUSTOM_CID && typeof customSkinCol === "function") ? customSkinCol()
      : cid === 79 ? "#7cb342"
      : (cid === 77 ? "#d50000"
      : (cid === 78 ? "#5d4037"
      : (cid === 70 ? "#e0e7e9"
      : (cid === 75 ? "#cfd8dc"
      : (cid === 5 ? "#795548"
      : (cid === 10 ? "#b0bec5"
      : (cid === 11 ? "#90a4ae"
      : (cid === 37 ? "#558b2f"
      : ([8, 9, 24].includes(cid) ? "#c68642" : "#f1c27d")))))))));

    if (cid === 79) {
      tCtx.fillStyle = "#7cb342";
      tCtx.beginPath();
      tCtx.moveTo(-4.5, -10.8); tCtx.lineTo(-11.8, -12.2); tCtx.lineTo(-4.5, -7.5);
      tCtx.moveTo(4.5, -10.8);  tCtx.lineTo(11.8, -12.2);  tCtx.lineTo(4.5, -7.5);
      tCtx.closePath(); tCtx.fill();
    }

    tCtx.fillStyle = skinCol;
    tCtx.beginPath(); tCtx.arc(0, cid === 10 ? -10.2 : -9.3, cid === 10 ? 6.2 : 5.2, 0, Math.PI * 2); tCtx.fill();

    if (cid === 77) {
      tCtx.fillStyle = "#111111";
      tCtx.fillRect(-3.8, -12.5, 2.2, 6.5);
      tCtx.fillRect(1.6, -12.5, 2.2, 6.5);
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
        tCtx.fillRect(-5.3, -11.0, 1.6, 4.2);
        tCtx.fillRect(3.7, -11.0, 1.6, 4.2);
      }
    }

    if (cid === 61) {
      tCtx.fillStyle = "#3e2723";
      tCtx.beginPath(); tCtx.arc(0, -5.8, 5.8, 0, Math.PI); tCtx.fill();
    } else if ([69, 71, 72].includes(cid)) {
      tCtx.fillStyle = "#eceff1";
      tCtx.beginPath();
      tCtx.moveTo(-3.8, -6.8); tCtx.lineTo(3.8, -6.8); tCtx.lineTo(0, 1.8);
      tCtx.closePath(); tCtx.fill();
    } else if ([51, 24, 45, 73].includes(cid)) {
      tCtx.fillStyle = "#212121"; tCtx.fillRect(-3.4, -6.6, 6.8, 1.8);
    }

    if (cid === 37) {
      tCtx.fillStyle = "#fff9c4";
      tCtx.fillRect(-3.6, -7.8, 1.5, 2.2);
      tCtx.fillRect(2.1, -7.8, 1.5, 2.2);
    }

    if (cid === 10) {
      tCtx.fillStyle = "#0a0a0c";
      tCtx.beginPath(); tCtx.ellipse(-2.4, -10.0, 2.1, 1.3, 0.25, 0, Math.PI * 2); tCtx.fill();
      tCtx.beginPath(); tCtx.ellipse(2.4, -10.0, 2.1, 1.3, -0.25, 0, Math.PI * 2); tCtx.fill();
    } else if (cid === 39) {
      tCtx.fillStyle = "#0a0a0a";
      tCtx.fillRect(-3.8 + eyeLookX * 0.5, -10.6, 3.2, 1.8);
      tCtx.fillRect(0.6 + eyeLookX * 0.5, -10.6, 3.2, 1.8);
      tCtx.fillRect(-1.0, -10.2, 2.0, 0.7);
    } else if (!isBlinking) {
      const eyeW = isFemale ? 2.4 : 2.2;
      const eyeH = cid === 52 ? 0.9 : (isFemale ? 2.0 : 1.8);
      tCtx.fillStyle = cid === 75 ? "#111111" : "#ffffff";
      tCtx.fillRect(-3.5, -10.6, eyeW, eyeH);
      tCtx.fillRect(1.1, -10.6, eyeW, eyeH);
      const pupilCol = [3, 12, 21, 70].includes(cid) ? "#ff1744"
        : (cid === 77 ? "#ffab00"
        : (cid === 75 ? "#00ff88"
        : (cid === 18 ? "#00b0ff"
        : (cid === 48 ? "#ffd166" : "#111111"))));
      tCtx.fillStyle = pupilCol;
      tCtx.fillRect(-2.8 + eyeLookX * 0.6, -10.3 + eyeLookY * 0.4, 1.4, cid === 52 ? 0.9 : 1.4);
      tCtx.fillRect(1.8 + eyeLookX * 0.6, -10.3 + eyeLookY * 0.4, 1.4, cid === 52 ? 0.9 : 1.4);
      if (isFemale) {
        tCtx.strokeStyle = "#111"; tCtx.lineWidth = 0.8;
        tCtx.beginPath(); tCtx.moveTo(-3.6, -10.6); tCtx.lineTo(-1.1, -10.6); tCtx.stroke();
        tCtx.beginPath(); tCtx.moveTo(1.0, -10.6); tCtx.lineTo(3.5, -10.6); tCtx.stroke();
      }
      if (cid === 40) { tCtx.fillStyle = "#ff1744"; tCtx.fillRect(1.2, -10.6, 2.2, 1.9); }
      if (cid === 65) {
        tCtx.strokeStyle = "#3e2723"; tCtx.lineWidth = 1.0;
        tCtx.beginPath(); tCtx.moveTo(-5, -11.5); tCtx.lineTo(5, -9.0); tCtx.stroke();
        tCtx.fillStyle = "#00e5ff";
        tCtx.beginPath(); tCtx.arc(2.1, -9.8, 1.8, 0, Math.PI * 2); tCtx.fill();
      }
      if (cid === 56) {
        tCtx.strokeStyle = "#111111"; tCtx.lineWidth = 0.85;
        tCtx.beginPath(); tCtx.arc(-2.3, -9.7, 1.8, 0, Math.PI * 2); tCtx.stroke();
        tCtx.beginPath(); tCtx.arc(2.3, -9.7, 1.8, 0, Math.PI * 2); tCtx.stroke();
        tCtx.strokeStyle = "#ff1744"; tCtx.lineWidth = 0.9;
        tCtx.beginPath(); tCtx.moveTo(1.2, -13.2); tCtx.lineTo(0.6, -12.0); tCtx.lineTo(1.5, -11.2); tCtx.stroke();
      }
      if (cid === 59) {
        tCtx.strokeStyle = "#ff4081"; tCtx.lineWidth = 1.1;
        tCtx.beginPath(); tCtx.arc(-2.3, -9.7, 2.0, 0, Math.PI * 2); tCtx.stroke();
        tCtx.strokeStyle = "#00e5ff";
        tCtx.beginPath(); tCtx.arc(2.3, -9.7, 2.0, 0, Math.PI * 2); tCtx.stroke();
      }
    } else {
      tCtx.strokeStyle = "#111"; tCtx.lineWidth = 1.0;
      tCtx.beginPath(); tCtx.moveTo(-3.5, -9.8); tCtx.lineTo(-1.1, -9.8); tCtx.stroke();
      tCtx.beginPath(); tCtx.moveTo(1.1, -9.8); tCtx.lineTo(3.5, -9.8); tCtx.stroke();
    }

    if (cid === 52) {
      tCtx.fillStyle = "#4e342e";
      tCtx.beginPath();
      tCtx.moveTo(-4.8, -12.4); tCtx.lineTo(-3.4, -16.8); tCtx.lineTo(3.4, -16.8); tCtx.lineTo(4.8, -12.4);
      tCtx.closePath(); tCtx.fill();
      tCtx.fillStyle = "#3e2723";
      tCtx.fillRect(-8.0, -12.8, 16.0, 1.6);
      tCtx.fillStyle = "#6d4c41";
      tCtx.fillRect(1.2, -6.8, 4.2, 1.1);
      tCtx.fillStyle = "#ff6d00";
      tCtx.fillRect(5.0, -6.8, 1.1, 1.1);
    } else if ([66, 69, 71].includes(cid)) {
      tCtx.fillStyle = cHead;
      tCtx.beginPath();
      tCtx.moveTo(-6.5, -12.2); tCtx.lineTo(0, -19.5); tCtx.lineTo(6.5, -12.2);
      tCtx.closePath(); tCtx.fill();
    } else if (cid === 53) {
      tCtx.fillStyle = "#ff1744"; tCtx.fillRect(-5.4, -12.2, 10.8, 1.8);
    }
    if (cid === CUSTOM_CID && typeof drawCustomSpeciesExtras === "function") {   // v12 creator: hood + species details
      if (customHairStyle() === "hood") customHoodOver(tCtx, cHead);
      drawCustomSpeciesExtras(tCtx, eyeLookX);
    }
  }

  const swapP = isLivePlayer ? (player.swapPause || 0) : 0;
  const recoil = isLivePlayer ? (player.recoilKick || 0) * 2.4 : 0;
  const armReach = isLivePlayer ? (player.armReach || 0) : 0;

  let reachBack = 0, rackShift = 0;
  if (swapP > 0.16) reachBack = ((swapP - 0.16) / 0.08) * 8.5;
  else if (swapP > 0.08) reachBack = ((0.16 - swapP) / 0.08) * 6.5;
  else if (swapP > 0) rackShift = Math.sin((swapP / 0.08) * Math.PI);

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

  const handCol = isHelmeted ? cHead : ((cid === CUSTOM_CID && typeof customSkinCol === "function") ? customSkinCol()
    : (cid === 79 ? "#7cb342" : (cid === 77 ? "#111111" : (cid === 78 ? "#5d4037" : "#f1c27d"))));

  if (isLivePlayer && player.forceHandTimer > 0) {
    tCtx.save();
    tCtx.rotate(player.forceHandAng || aim);
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
      const isMeleeBlade = (typeof isSwordWeapon === "function" && isSwordWeapon(w.id)) || (w.style === "orbit" && ![12, 16, 29, 35, 44, 73].includes(w.id));
      if (isLivePlayer && slotIdx === 0 && typeof thrownBlade !== "undefined" && thrownBlade.active && isMeleeBlade) {
        return;
      }

      // Each weapon uses its own independent canonical bladeCol (while primary weapon respects your Outfit Customizer)!
      const wActiveCol = (w.id === cid && !w.ownCol)
        ? cBlade
        : (w.bladeCol || (typeof getWeaponColor === "function" ? getWeaponColor(w.id) : cBlade));

      const sfR = (isLivePlayer && isMeleeBlade && typeof saberRenderState === "function") ? saberRenderState(w) : null;
      if (sfR) { drawSaberFormSlot(tCtx, w, sfR, wActiveCol, handCol, aim, slotIdx); return; }

      const isTelekineticSlot = (slotIdx >= 2 && kStyle === 5) || (kStyle === 5 && slotIdx >= 1 && w.style !== "chain");
      const armAng = (isLivePlayer && typeof w.armAng === "number")
        ? w.armAng
        : (aim + (slotIdx === 0 ? 0 : (slotIdx === 1 ? 0.18 : (slotIdx === 2 ? -0.35 : 0.42))));
      const wristSpin = (isLivePlayer && typeof w.wristSpin === "number") ? w.wristSpin : 0;

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
      const reachDist = (kStyle === 0 ? 7.2 : (kStyle === 1 ? 9.2 : 8.5)) + armReach - recoil - reachBack;

      tCtx.save();
      tCtx.rotate(armAng);
      const hx = reachDist;
      const hy = sideSign * (activeWpns.length === 1 && kStyle <= 2 ? 1.5 : 4.5) + (slotIdx >= 2 ? upperArmY * 0.5 : 0);

      tCtx.save();
      tCtx.translate(hx, hy);
      tCtx.save();
      tCtx.rotate(wristSpin);
      drawWeaponModel(tCtx, w.id, w.style, w.lvl >= 5, w.lvl >= 10, wActiveCol, rackShift, w.angVel || 0, 0, w.dbl ? true : null, w.hilt);
      tCtx.restore();
      drawBallHand(tCtx, 0, 0, 2.5, handCol);

      if (w.id === 77) {
        drawBallHand(tCtx, -4.2, 0, 2.3, handCol);
      }

      if (activeWpns.length === 1 && (kStyle === 0 || kStyle === 2 || kStyle === 3 || rackShift > 0.05)) {
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
    });
  }

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

function renderBiomeAndWorld() {
  const bRing = (typeof getDistBiome === "function") ? getDistBiome(player.x, player.y) : null;
  const bgCol = (player.fac && player.fac.bg) ? player.fac.bg : "#0c1624";
  const gridCol = (player.fac && player.fac.c1) ? player.fac.c1 : "#00e5ff";
  const accCol = (player.fac && player.fac.c2) ? player.fac.c2 : "#ffd166";

  const viewW = (W / opts.zoom) + 140;
  const viewH = (H / opts.zoom) + 140;
  const left = player.x - viewW * 0.5;
  const top = player.y - viewH * 0.5;

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
      ctx.fillStyle = "#ffd166"; ctx.font = "bold 8.5px monospace"; ctx.textAlign = "center";
      ctx.fillText(tgt.label || "[INTERACT]", tgt.x, tgt.y - pulse - 5);
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

  for (let i = 0; i < MAX_DRIP; i++) {
    if (!drAct[i]) continue;
    ctx.fillStyle = drZ[i] > 0.5 ? "#ff1744" : "rgba(155, 12, 28, 0.72)";
    ctx.beginPath(); ctx.arc(drX[i], drY[i] - drZ[i], drRad[i], 0, Math.PI * 2); ctx.fill();
  }

  for (let i = 0; i < MAX_LIMB; i++) {
    if (!lmbAct[i]) continue;
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
    if (!corpAct[i]) continue;
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
      if (!slAct[i]) continue;
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
    const score = eHP[i] * (eType[i] >= 98 ? 10 : 1);
    if (score > bestTargetScore) { bestTargetScore = score; bestTarget = i; }

    const isLevitating = typeof eLevitate !== "undefined" && eLevitate[i] > 0;
    const isKneeling = typeof eKneel !== "undefined" && eKneel[i] > 0;
    const spect = sdOn && sdSpect(i);
    const ex = eX[i], ey = eY[i] - (isLevitating ? (eLevZ[i] || 0) : (isKneeling ? -5 : 0)) - (spect ? sdCheerBob(i) : 0), et = eType[i];
    const baseR = et === 99 ? 22 : (et === 3 ? 15 : 11);

    if (eDummy[i] && typeof drawTrainingDummy === "function") {
      drawTrainingDummy(ex, ey, baseR, i);
    } else if (et === 98 && eRivalCid[i] >= 0) {
      const rFac = FACTIONS[CHAR_RAW[eRivalCid[i]][1]] || player.fac;
      const faceOv = sdOn ? showdownFaceAng(i) : null;     // v12: the rival turns to its challenger during its entrance
      drawHeroSprite(ex, ey, rFac, eRivalCid[i], runTime * 4, faceOv !== null ? faceOv : Math.atan2(player.y - ey, player.x - ex), 0, ctx, -1);
    } else {
      if (visorMode === 3) {
        ctx.fillStyle = "rgba(48, 79, 254, 0.45)";
        ctx.beginPath(); ctx.arc(ex, ey, baseR + 4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#ff3d00";
        ctx.fillRect(ex - baseR * 0.65, ey - baseR * 0.6, baseR * 1.3, baseR * 1.2);
        ctx.fillStyle = "#ffd600";
        ctx.beginPath(); ctx.arc(ex, ey - baseR * 0.55, baseR * 0.45, 0, Math.PI * 2); ctx.fill();
      } else {
        ctx.fillStyle = et === 99 ? "#ff1744" : (eFormType[i] === 1 ? "#ffd166" : enemyCol2());
        const crawlOff = (eLegsLost[i] >= 2 || isKneeling) ? 4 : 0;
        if (!isKneeling) {
          if (eLegsLost[i] < 1) ctx.fillRect(ex - 4, ey + 4, 3, 6);
          if (eLegsLost[i] < 2) ctx.fillRect(ex + 1, ey + 4, 3, 6);
        } else {
          ctx.fillRect(ex - 6, ey + 5, 5, 3); ctx.fillRect(ex + 1, ey + 5, 5, 3);
        }
        ctx.fillRect(ex - baseR * 0.6, ey - baseR * 0.5 + crawlOff, baseR * 1.2, baseR);
        ctx.beginPath(); ctx.arc(ex, ey - baseR * 0.75 + crawlOff, baseR * 0.45, 0, Math.PI * 2); ctx.fill();
        if (spect && eArmsLost[i] < 2) {          // v12: spectators pump their fists while they watch the duel
          const pump = Math.sin(runTime * 9 + i) > 0 ? 1.5 : 0;
          ctx.fillRect(ex - baseR * 0.82, ey - baseR * 1.15 - pump, 2.2, baseR * 0.75);
          if (eArmsLost[i] < 1) ctx.fillRect(ex + baseR * 0.82 - 2.2, ey - baseR * 1.15 - (1.5 - pump), 2.2, baseR * 0.75);
        }

        ctx.fillStyle = "#111";
        ctx.fillRect(ex - baseR * 0.32, ey - baseR * 0.85 + crawlOff, baseR * 0.64, 2.2);
        ctx.fillStyle = et === 99 ? "#ffff00" : "#00e5ff";
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

    if (eHP[i] < eMax[i] || et >= 98) {
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
    const tName = bType === 99 ? "APEX TITAN BOSS" : (bType === 98 ? "RIVAL BOUNTY HUNTER" : (ENEMY_NAMES[bType % 4] || "HOSTILE"));
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

  // v11: the body steps into Form strikes (lunge offset from js/saberforms.js)
  drawHeroSprite(player.x + (player.sfLX || 0), player.y + (player.sfLY || 0), player.fac, player.cid, player.walk, player.aim, player.inVehicle, ctx, player.guardZone);

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
    } else {
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
