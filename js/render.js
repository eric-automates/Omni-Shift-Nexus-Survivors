// FILE: js/render.js
// PART: 13 of 14
// DETAIL: v6.0 Physics Overhaul — Prequel Wrist-Pivot Saber Flourishes & Motion Trails, Bisected Falling Torso Halves, Glowing-to-Dark Cauterized Slice Scars, Kneeling Impaled Enemies, Force Push Waves & Boomerang Discs.

"use strict";

/* === 1. SIZED SVG ICON GENERATOR (Delegates to WPN_SVG_56 for All 56 Heroes) === */
function makeSVG(type, c1 = "#00e5ff", c2 = "#ffd166", wpnId = -1) {
  const sOpen = `<svg class="ico" viewBox="0 0 24 24" width="28" height="28" style="width:28px;height:28px;flex-shrink:0">`;
  let p = "";
  if (typeof WPN_SVG_56 !== "undefined" && wpnId >= 0 && WPN_SVG_56[wpnId]) {
    p = WPN_SVG_56[wpnId](c1, c2);
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
  if ([0, 14, 18, 24, 32, 48, 50].includes(cid)) return 4;
  if ([3, 7, 10, 11, 12, 20, 21, 27, 38, 39, 46, 49].includes(cid)) return 5;
  return 6;
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

/* === 2. PROTRUDING WEAPON SILHOUETTES + PREQUEL SABER MOTION BLUR TRAIL === */
function drawWeaponModel(tCtx, wpnId, style, isLv5, isSuper, bladeCol, rackShift = 0, angVel = 0) {
  const lenMul = isLv5 ? 1.24 : 1.0;
  if (style === "orbit") {
    const bLen = 21 * lenMul;
    // Prequel Motion Blur Fan Trail when flourishing
    if (Math.abs(angVel) > 1.2) {
      const trailSweep = Math.max(-0.65, Math.min(0.65, -angVel * 0.045));
      tCtx.save();
      tCtx.fillStyle = [18, 19, 24, 48, 50].includes(wpnId) ? "#cfd8dc" : bladeCol;
      tCtx.globalAlpha = 0.28;
      tCtx.beginPath();
      tCtx.moveTo(3, 0);
      tCtx.arc(0, 0, bLen, 0, trailSweep, trailSweep < 0);
      tCtx.closePath();
      tCtx.fill();
      tCtx.restore();
    }

    tCtx.fillStyle = "#b0bec5";
    tCtx.fillRect(-2.5, -1.4, 5.5, 2.8);
    if ([18, 19, 24, 48, 50].includes(wpnId)) {
      tCtx.fillStyle = "#cfd8dc";
      tCtx.beginPath();
      tCtx.moveTo(3, -1.9);
      tCtx.lineTo(bLen, 0);
      tCtx.lineTo(3, 1.9);
      tCtx.closePath();
      tCtx.fill();
    } else {
      tCtx.strokeStyle = bladeCol;
      tCtx.lineWidth = isSuper ? 4.0 : 3.0;
      tCtx.lineCap = "round";
      tCtx.beginPath(); tCtx.moveTo(3, 0); tCtx.lineTo(bLen, 0); tCtx.stroke();
      tCtx.strokeStyle = "#ffffff";
      tCtx.lineWidth = 1.3;
      tCtx.beginPath(); tCtx.moveTo(3, 0); tCtx.lineTo(bLen - 1, 0); tCtx.stroke();
    }
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

  const isHeavy = [15, 28, 31, 33, 34, 37, 40, 44, 53].includes(wpnId) || style === "cone";
  tCtx.fillStyle = "#263238";
  tCtx.fillRect(-3.5, -1.6, (isHeavy ? 15 : 12) * lenMul, isHeavy ? 3.4 : 2.6);
  tCtx.fillStyle = isSuper ? "#ffd166" : "#90a4ae";
  tCtx.fillRect(1 - rackShift * 3.0, -2.0, 6.5, 1.5);
  if (style === "beam" || style === "chain") {
    tCtx.fillStyle = bladeCol;
    tCtx.fillRect(6, -0.8, 6 * lenMul, 1.6);
  }
}

/* === 3. FRONT-FACING 56-HERO SPRITE WITH WRIST-PIVOTED PREQUEL FLOURISHES & FORCE HAND === */
const HELMET_HEROES = new Set([1, 2, 4, 7, 9, 17, 19, 23, 26, 29, 30, 32, 33, 34, 35, 36, 47, 49, 50, 54, 55]);

function drawHeroSprite(x, y, fac, cid, walk = 0, aim = 0, inVeh = 0, tCtx = ctx, guardZone = -1) {
  const out = typeof getOutfit === "function" ? getOutfit(cid) : { head: 0, torso: 0, legs: 0, back: 0, blade: 0 };
  const pal = typeof getHeroOutfits === "function" ? getHeroOutfits(cid) : null;
  const cHead = (pal && pal.head && pal.head[out.head || 0]) ? pal.head[out.head || 0][1] : fac.c1;
  const cTorso = (pal && pal.torso && pal.torso[out.torso || 0]) ? pal.torso[out.torso || 0][1] : fac.c2;
  const cLegs = (pal && pal.legs && pal.legs[out.legs || 0]) ? pal.legs[out.legs || 0][1] : "#37474f";
  const cBack = (pal && pal.back && pal.back[out.back || 0]) ? pal.back[out.back || 0][1] : "#263238";
  const cBlade = (pal && pal.blade && pal.blade[out.blade || 0]) ? pal.blade[out.blade || 0][1] : fac.c1;

  const isLivePlayer = (tCtx === ctx && typeof player !== "undefined" && player && player.cid === cid);
  const kStyle = getHeroKinematicStyle(cid);
  const stride = Math.sin(walk * 2.2) * 3.2;
  const hoverBob = (kStyle === 3 || kStyle === 5) ? Math.sin((typeof runTime !== "undefined" ? runTime : 0) * 5.5) * 2.2 : 0;
  const bankAng = isLivePlayer ? (player.bankTilt || 0) : 0;

  tCtx.save();
  tCtx.translate(x, y + hoverBob);
  if (bankAng !== 0) tCtx.rotate(bankAng);

  if (inVeh === 1) {
    tCtx.fillStyle = "#00acc1";
    tCtx.beginPath(); tCtx.ellipse(0, 6, 18, 9, 0, 0, Math.PI * 2); tCtx.fill();
    tCtx.strokeStyle = "#00e5ff"; tCtx.lineWidth = 1.4; tCtx.stroke();
  } else if (inVeh === 2) {
    tCtx.fillStyle = "#455a64";
    tCtx.fillRect(-15, -10, 30, 24);
    tCtx.strokeStyle = "#ffd166"; tCtx.lineWidth = 1.5; tCtx.strokeRect(-15, -10, 30, 24);
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
    if (!rocketInFlight && (cid === 54 || cid === 1 || cid === 34)) {
      const sway = Math.sin(walk * 1.8) * 0.9;
      tCtx.fillStyle = "#cfd8dc";
      tCtx.fillRect(-1.8 + sway, -18.5, 3.6, 6.5);
      tCtx.fillStyle = cid === 54 ? "#d84315" : "#ff1744";
      tCtx.beginPath();
      tCtx.moveTo(-2.4 + sway, -18.5); tCtx.lineTo(0 + sway, -23.0); tCtx.lineTo(2.4 + sway, -18.5);
      tCtx.closePath(); tCtx.fill();
    }
  } else if (cBack && cBack !== "none") {
    tCtx.fillStyle = cBack;
    tCtx.fillRect(-6.5, -3.5, 13, 11.5);
  }

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
      tCtx.save();
      if (hIdx % 2 === 0) { tCtx.translate(-4, -3); tCtx.rotate(-0.85 - hIdx * 0.18); }
      else { tCtx.translate(hIdx === 1 ? -6.5 : 6.5, 4); tCtx.rotate(Math.PI * 0.48); }
      tCtx.scale(0.72, 0.72);
      drawWeaponModel(tCtx, w.id, w.style, w.lvl >= 5, w.lvl >= 10, cBlade, 0, 0);
      tCtx.restore();
      hIdx++;
    });
  }

  tCtx.fillStyle = cLegs;
  tCtx.fillRect(-4.8, 4 + stride * 0.5, 3.8, 6.5);
  tCtx.fillRect(1.0, 4 - stride * 0.5, 3.8, 6.5);

  tCtx.fillStyle = cTorso;
  tCtx.fillRect(-5.8, -5.5, 11.6, 10.5);

  tCtx.fillStyle = cHead;
  tCtx.beginPath();
  tCtx.moveTo(-3.2, -5.5); tCtx.lineTo(3.2, -5.5); tCtx.lineTo(0, -1.2);
  tCtx.closePath(); tCtx.fill();

  tCtx.fillStyle = "#1c262b"; tCtx.fillRect(-5.8, 2.6, 11.6, 2.2);
  tCtx.fillStyle = "#ffd166"; tCtx.fillRect(-1.6, 2.6, 3.2, 2.2);

  const isHelmeted = HELMET_HEROES.has(cid);
  const eyeLookX = Math.cos(aim) * 0.9;
  const eyeLookY = Math.sin(aim) * 0.45;

  if (isHelmeted) {
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
    } else if (cid === 32 || cid === 33 || cid === 47) {
      tCtx.fillStyle = cid === 33 ? "#00e676" : "#ffd166";
      tCtx.fillRect(-3.6 + eyeLookX * 0.5, -11.0, 7.2, 2.6);
      tCtx.strokeStyle = "#111"; tCtx.lineWidth = 0.8;
      tCtx.strokeRect(-3.6 + eyeLookX * 0.5, -11.0, 7.2, 2.6);
    } else if (cid === 2 || cid === 19 || cid === 34 || cid === 55) {
      tCtx.fillStyle = cid === 34 || cid === 2 ? "#ff1744" : "#ffd166";
      tCtx.fillRect(-3.2 + eyeLookX, -10.6, 2.2, 1.6);
      tCtx.fillRect(1.0 + eyeLookX, -10.6, 2.2, 1.6);
      tCtx.fillStyle = "#263238"; tCtx.fillRect(-1.8, -7.8, 3.6, 2.0);
    } else {
      tCtx.fillStyle = "#111"; tCtx.fillRect(-3.8, -10.8, 7.6, 2.2);
      tCtx.fillStyle = cid === 4 ? "#00e5ff" : (cid === 36 ? "#00e676" : "#ff1744");
      tCtx.fillRect(-2.4 + eyeLookX, -10.4, 4.8, 1.5);
    }
  } else {
    const skinCol = cid === 5 ? "#795548" : (cid === 10 ? "#b0bec5" : (cid === 11 ? "#90a4ae" : (cid === 37 ? "#558b2f" : ([8, 9, 24].includes(cid) ? "#c68642" : "#f1c27d"))));
    tCtx.fillStyle = skinCol;
    tCtx.beginPath(); tCtx.arc(0, -9.3, 5.2, 0, Math.PI * 2); tCtx.fill();

    tCtx.fillStyle = cHead;
    tCtx.beginPath(); tCtx.arc(0, -10.3, 5.4, Math.PI * 0.92, Math.PI * 2.08); tCtx.fill();
    tCtx.fillRect(-5.3, -11.0, 1.6, 4.2);
    tCtx.fillRect(3.7, -11.0, 1.6, 4.2);

    if (cid === 51 || cid === 24) { tCtx.fillStyle = "#212121"; tCtx.fillRect(-3.6, -6.8, 7.2, 2.2); }
    if (cid === 39) {
      tCtx.fillStyle = "#0a0a0a";
      tCtx.fillRect(-3.8 + eyeLookX * 0.5, -10.6, 3.2, 1.8);
      tCtx.fillRect(0.6 + eyeLookX * 0.5, -10.6, 3.2, 1.8);
      tCtx.fillRect(-1.0, -10.2, 2.0, 0.7);
    } else {
      const eyeGlow = [3, 12, 21].includes(cid) ? "#ff1744" : (cid === 18 ? "#00b0ff" : (cid === 48 ? "#ffd166" : "#111111"));
      tCtx.fillStyle = "#ffffff";
      tCtx.fillRect(-3.3, -10.5, 2.2, 1.8);
      tCtx.fillRect(1.1, -10.5, 2.2, 1.8);
      tCtx.fillStyle = eyeGlow;
      tCtx.fillRect(-2.7 + eyeLookX * 0.6, -10.2 + eyeLookY * 0.4, 1.3, 1.3);
      tCtx.fillRect(1.7 + eyeLookX * 0.6, -10.2 + eyeLookY * 0.4, 1.3, 1.3);
      if (cid === 40) { tCtx.fillStyle = "#ff1744"; tCtx.fillRect(1.2, -10.6, 2.2, 1.9); }
    }
    if (cid === 52) { tCtx.fillStyle = "#4e342e"; tCtx.fillRect(-7.5, -13.2, 15, 2.0); }
    else if (cid === 53) { tCtx.fillStyle = "#ff1744"; tCtx.fillRect(-5.4, -12.2, 10.8, 1.8); }
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
    : [{ id: cid, style: (CHAR_RAW[cid] ? CHAR_RAW[cid][6] : "beam"), lvl: 1 }];

  const handCol = isHelmeted ? cHead : "#f1c27d";

  // Outstretched Force Push / Telekinetic Pull Hand Animation
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
      const isMeleeBlade = (typeof isSwordWeapon === "function" && isSwordWeapon(w.id)) || (w.style === "orbit" && ![12, 16, 29, 35, 44].includes(w.id));
      // If primary blade is currently thrown & impaled in an enemy, show outstretched empty Force hand!
      if (isLivePlayer && slotIdx === 0 && typeof thrownBlade !== "undefined" && thrownBlade.active && isMeleeBlade) {
        return;
      }

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
        drawWeaponModel(tCtx, w.id, w.style, w.lvl >= 5, w.lvl >= 10, cBlade, 0, w.angVel || 0);
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
      // Pivot the hilt inside the ball hand by wristSpin for authentic Prequel flourishes!
      tCtx.save();
      tCtx.rotate(wristSpin);
      drawWeaponModel(tCtx, w.id, w.style, w.lvl >= 5, w.lvl >= 10, cBlade, rackShift, w.angVel || 0);
      tCtx.restore();
      drawBallHand(tCtx, 0, 0, 2.5, handCol);

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

/* === 4. FULL WORLD CHUNK RENDERER === */
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

  const cSize = typeof CHUNK_SIZE !== "undefined" ? CHUNK_SIZE : 256;
  const cx0 = Math.floor(left / cSize), cx1 = Math.floor((left + viewW) / cSize);
  const cy0 = Math.floor(top / cSize), cy1 = Math.floor((top + viewH) / cSize);

  for (let cy = cy0; cy <= cy1; cy++) {
    for (let cx = cx0; cx <= cx1; cx++) {
      const h = (cx * 73856093) ^ (cy * 19349663) ^ (typeof runSeed !== "undefined" ? runSeed : 1337);
      for (let p = 0; p < 3; p++) {
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
      ctx.strokeStyle = "#00e676"; ctx.lineWidth = 3.0;
      ctx.strokeRect(-ft.rad * 0.7, -ft.rad * 0.7, ft.rad * 1.4, ft.rad * 1.4);
      ctx.fillStyle = "rgba(0, 230, 118, 0.12)";
      ctx.fillRect(-ft.rad * 0.7, -ft.rad * 0.7, ft.rad * 1.4, ft.rad * 1.4);
      ctx.fillStyle = "#ffd166"; ctx.beginPath(); ctx.arc(0, 0, 7, 0, Math.PI * 2); ctx.fill();
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

/* === 5. MASTER SCENE RENDERER (BISECTED HALVES, SMOLDERING SCARS, IMPALED KNEEL & FORCE PUSH) === */
const ENEMY_NAMES = ["SECTOR HENCHMAN", "CYBER-WOLF", "ARACHNID DRONE", "HEAVY BRUTE"];

function drawSmolderingSliceLine(tCtx, len, heat, glowCol) {
  // 1. Dark Charring / Smoldering Cut Seam (Always visible)
  tCtx.strokeStyle = "#08080a";
  tCtx.lineWidth = 3.2;
  tCtx.lineCap = "round";
  tCtx.beginPath(); tCtx.moveTo(-len, 0); tCtx.lineTo(len, 0); tCtx.stroke();

  // 2. Glowing Hot Plasma / Ember Core that fades to dark char as heat -> 0
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

  ctx.save();
  ctx.translate(W * 0.5, H * 0.5);
  ctx.scale(opts.zoom, opts.zoom);
  ctx.translate(-player.x, -player.y);

  renderBiomeAndWorld();

  // 1. Blood Puddles & Drips
  for (let i = 0; i < MAX_DRIP; i++) {
    if (!drAct[i]) continue;
    ctx.fillStyle = drZ[i] > 0.5 ? "#ff1744" : "rgba(155, 12, 28, 0.72)";
    ctx.beginPath(); ctx.arc(drX[i], drY[i] - drZ[i], drRad[i], 0, Math.PI * 2); ctx.fill();
  }

  // 2. Severed Limbs, Persistent Corpses & v6.0 Bisected Falling Torso Halves!
  for (let i = 0; i < MAX_LIMB; i++) {
    if (!lmbAct[i]) continue;
    ctx.save(); ctx.translate(lmbX[i], lmbY[i]); ctx.rotate(lmbRot[i]);
    ctx.fillStyle = lmbCol[i];
    if (lmbKind[i] === 2) { ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI * 2); ctx.fill(); }
    else ctx.fillRect(-4, -1.8, 8, 3.6);
    ctx.restore();
  }
  for (let i = 0; i < MAX_CORPSE; i++) {
    if (!corpAct[i]) continue;
    ctx.fillStyle = "rgba(45, 52, 64, 0.68)";
    ctx.fillRect(corpX[i] - 7, corpY[i] - 4, 14, 8);
  }
  if (typeof slAct !== "undefined") {
    for (let i = 0; i < MAX_SLICE; i++) {
      if (!slAct[i]) continue;
      const r = slRad[i] || 11;
      ctx.save();
      ctx.translate(slX[i], slY[i] - slZ[i]);
      ctx.rotate(slCutAng[i] + slRot[i]);
      ctx.fillStyle = slBodyCol[i];
      if (slHalf[i] === 0) {
        // Upper bisected torso + head half
        ctx.fillRect(-r * 0.65, -r * 0.85, r * 1.3, r * 0.85);
        ctx.beginPath(); ctx.arc(0, -r * 0.95, r * 0.42, 0, Math.PI * 2); ctx.fill();
      } else {
        // Lower bisected waist + legs half
        ctx.fillRect(-r * 0.6, 0, r * 1.2, r * 0.65);
        ctx.fillRect(-4, r * 0.5, 3, 5);
        ctx.fillRect(1, r * 0.5, 3, 5);
      }
      // Glowing-to-dark cauterized slice seam right along the cut plane (y = 0)
      drawSmolderingSliceLine(ctx, r * 0.72, slHeat[i], slGlowCol[i]);
      ctx.restore();
    }
  }

  // 3. XP Orbs
  for (let i = 0; i < MAX_O; i++) {
    if (!oAct[i]) continue;
    ctx.fillStyle = oHome[i] ? "#00ff88" : "#00e5ff";
    ctx.beginPath(); ctx.arc(oX[i], oY[i], oVal[i] > 15 ? 4.8 : 3.2, 0, Math.PI * 2); ctx.fill();
  }

  // 4. Enemies (with Kneeling Impaled State + Cauterized Angular Slice Scars)
  const visorMode = player.activeVisor || 0;
  let bestTarget = -1, bestTargetScore = -1;

  for (let i = 0; i < MAX_E; i++) {
    if (!eAct[i] || !isEnemyOnScreen(i)) continue;
    const score = eHP[i] * (eType[i] >= 98 ? 10 : 1);
    if (score > bestTargetScore) { bestTargetScore = score; bestTarget = i; }

    const isKneeling = typeof eKneel !== "undefined" && eKneel[i] > 0;
    const ex = eX[i], ey = eY[i] + (isKneeling ? 5 : 0), et = eType[i];
    const baseR = et === 99 ? 22 : (et === 3 ? 15 : 11);

    if (et === 98 && eRivalCid[i] >= 0) {
      const rFac = FACTIONS[CHAR_RAW[eRivalCid[i]][1]] || player.fac;
      drawHeroSprite(ex, ey, rFac, eRivalCid[i], runTime * 4, Math.atan2(player.y - ey, player.x - ex), 0, ctx, -1);
    } else {
      if (visorMode === 3) {
        ctx.fillStyle = "rgba(48, 79, 254, 0.45)";
        ctx.beginPath(); ctx.arc(ex, ey, baseR + 4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#ff3d00";
        ctx.fillRect(ex - baseR * 0.65, ey - baseR * 0.6, baseR * 1.3, baseR * 1.2);
        ctx.fillStyle = "#ffd600";
        ctx.beginPath(); ctx.arc(ex, ey - baseR * 0.55, baseR * 0.45, 0, Math.PI * 2); ctx.fill();
      } else {
        ctx.fillStyle = et === 99 ? "#ff1744" : (eFormType[i] === 1 ? "#ffd166" : player.fac.c2);
        const crawlOff = (eLegsLost[i] >= 2 || isKneeling) ? 4 : 0;
        if (!isKneeling) {
          if (eLegsLost[i] < 1) ctx.fillRect(ex - 4, ey + 4, 3, 6);
          if (eLegsLost[i] < 2) ctx.fillRect(ex + 1, ey + 4, 3, 6);
        } else {
          // Bent knees on the ground when impaled by thrown lightsaber!
          ctx.fillRect(ex - 6, ey + 5, 5, 3);
          ctx.fillRect(ex + 1, ey + 5, 5, 3);
        }
        ctx.fillRect(ex - baseR * 0.6, ey - baseR * 0.5 + crawlOff, baseR * 1.2, baseR);
        ctx.beginPath(); ctx.arc(ex, ey - baseR * 0.75 + crawlOff, baseR * 0.45, 0, Math.PI * 2); ctx.fill();

        ctx.fillStyle = "#111";
        ctx.fillRect(ex - baseR * 0.32, ey - baseR * 0.85 + crawlOff, baseR * 0.64, 2.2);
        ctx.fillStyle = et === 99 ? "#ffff00" : "#00e5ff";
        ctx.fillRect(ex - baseR * 0.24, ey - baseR * 0.82 + crawlOff, 2.0, 1.6);
        ctx.fillRect(ex + baseR * 0.08, ey - baseR * 0.82 + crawlOff, 2.0, 1.6);

        if (eFormType[i] === 1) {
          ctx.strokeStyle = "#ffd166"; ctx.lineWidth = 2.2;
          ctx.strokeRect(ex - 8, ey - 7, 16, 14);
        }
      }

      if (eGrapple[i] > 0) {
        ctx.strokeStyle = "#00e5ff"; ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.moveTo(player.x, player.y); ctx.lineTo(ex, ey); ctx.stroke();
      }
    }

    // Live Angular Cauterized Slice Scar on Enemy Body (Glows hot -> cools to dark smoldering line)
    if (typeof eScarHeat !== "undefined" && eScarHeat[i] > 0.05) {
      ctx.save();
      ctx.translate(ex, ey + (eScarOffY[i] || 0));
      ctx.rotate(eScarAng[i]);
      drawSmolderingSliceLine(ctx, baseR * 0.68, eScarHeat[i], player.fac ? player.fac.c1 : "#00f0ff");
      ctx.restore();
    }

    if (eHP[i] < eMax[i] || et >= 98) {
      const bw = et === 99 ? 36 : 20;
      ctx.fillStyle = "rgba(0,0,0,0.65)";
      ctx.fillRect(ex - bw * 0.5, ey - 22, bw, 3.2);
      ctx.fillStyle = et >= 98 ? "#ff1744" : "#00e676";
      ctx.fillRect(ex - bw * 0.5, ey - 22, bw * Math.max(0, eHP[i] / eMax[i]), 3.2);
    }
  }

  // 5. LIVE TACTICAL VISOR PRIORITY HUD OVERLAYS
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

  // 6. DIRECTIONAL-TO-360 FORCE KINETIC PUSH SHOCKWAVE CONE / RING!
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

  // 7. WRIST-TRACKED FLAMETHROWER CONE
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

  // 8. Draw Player Sprite
  drawHeroSprite(player.x, player.y, player.fac, player.cid, player.walk, player.aim, player.inVehicle, ctx, player.guardZone);

  // 9. Draw 4-Stage Thrown & Impaled Lightsaber / Blade (Flight -> Impaled Wiggle -> Force-Pull Recall)
  if (typeof thrownBlade !== "undefined" && thrownBlade.active) {
    ctx.save();
    // Telekinetic Force tether line when pulling the impaled blade back!
    if (thrownBlade.stage >= 2) {
      ctx.strokeStyle = "rgba(0, 229, 255, 0.45)";
      ctx.lineWidth = 1.2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(player.x, player.y - 4); ctx.lineTo(thrownBlade.x, thrownBlade.y); ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.translate(thrownBlade.x, thrownBlade.y);
    const wiggleAng = thrownBlade.stage === 2 ? Math.sin(runTime * 65) * 0.24 : 0;
    ctx.rotate(thrownBlade.ang + wiggleAng);
    drawWeaponModel(ctx, thrownBlade.wpnId, "orbit", true, false, thrownBlade.glowCol, 0, thrownBlade.stage === 2 ? 0 : 18);
    ctx.restore();
  }

  // 10. Projectiles: Parabolic Returning Smart-Discs (st===8), ROTJ Lightning, Rockets & Bolts
  const handOriginX = player.x + Math.cos(player.aim) * 9;
  const handOriginY = player.y + Math.sin(player.aim) * 9;

  for (let i = 0; i < MAX_P; i++) {
    if (!pAct[i]) continue;
    const st = pStyle[i];
    if (st === 8) {
      // Spinning Parabolic Boomerang Smart-Disc / Chakram
      ctx.save();
      ctx.translate(pX[i], pY[i]);
      ctx.rotate(runTime * 24 + i);
      ctx.strokeStyle = pSup[i] ? "#ffd166" : player.fac.c1;
      ctx.fillStyle = "#37474f";
      ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.arc(0, 0, 7.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#ff1744";
      ctx.beginPath(); ctx.arc(0, 0, 2.5, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    } else if (st === 5 && !pEnemy[i]) {
      ctx.save();
      for (let branch = 0; branch < 2; branch++) {
        ctx.strokeStyle = branch === 0 ? "#7c4dff" : "#e0f7fa";
        ctx.lineWidth = branch === 0 ? 2.6 : 1.2;
        ctx.beginPath();
        ctx.moveTo(handOriginX, handOriginY);
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
    } else if (st === 2 && !pEnemy[i]) {
      const rAng = Math.atan2(pVY[i], pVX[i]);
      ctx.save();
      ctx.translate(pX[i], pY[i]);
      ctx.rotate(rAng);
      for (let sm = 1; sm <= 3; sm++) {
        ctx.fillStyle = `rgba(176, 190, 197, ${0.42 - sm * 0.11})`;
        ctx.beginPath(); ctx.arc(-6 * sm, (Math.random() - 0.5) * 3, 2.2 + sm * 1.4, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = "#ff9100";
      ctx.beginPath(); ctx.arc(-4.5, 0, 2.8 + Math.random() * 1.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#eceff1";
      ctx.fillRect(-4, -2, 7.5, 4);
      ctx.fillStyle = "#ff1744";
      ctx.beginPath(); ctx.moveTo(3.5, -2.4); ctx.lineTo(7.5, 0); ctx.lineTo(3.5, 2.4); ctx.closePath(); ctx.fill();
      ctx.restore();
    } else if (st === 6) {
      ctx.strokeStyle = pSup[i] ? "#ffd166" : player.fac.c1;
      ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.arc(pX[i], pY[i], pRad[i], 0, Math.PI * 2); ctx.stroke();
    } else {
      ctx.fillStyle = pSup[i] === 2 ? "#ffffff" : (pEnemy[i] ? "#ff1744" : (pSup[i] ? "#ffd166" : player.fac.c1));
      ctx.beginPath(); ctx.arc(pX[i], pY[i], Math.max(2.5, pRad[i] * 0.45), 0, Math.PI * 2); ctx.fill();
    }
  }

  // 11. Multi-Ring Fiery Explosion Shockwaves
  if (typeof blAct !== "undefined") {
    for (let i = 0; i < MAX_BLAST; i++) {
      if (!blAct[i]) continue;
      const alpha = Math.max(0, blLife[i] / 0.38);
      ctx.save();
      ctx.strokeStyle = blCol[i];
      ctx.globalAlpha = alpha;
      ctx.lineWidth = 3.5;
      ctx.beginPath(); ctx.arc(blX[i], blY[i], blRad[i], 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = "rgba(255, 196, 0, 0.32)";
      ctx.beginPath(); ctx.arc(blX[i], blY[i], blRad[i] * 0.65, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
  }

  // 12. Particles & Floating Damage / Speech Text
  ctx.fillStyle = "#ffd166";
  for (let i = 0; i < MAX_PT; i++) {
    if (ptAct[i]) ctx.fillRect(ptX[i] - 1.5, ptY[i] - 1.5, 3, 3);
  }
  ctx.textAlign = "center";
  for (let i = 0; i < MAX_D; i++) {
    if (!dAct[i]) continue;
    ctx.fillStyle = dCol[i];
    ctx.font = dCrit[i] === 2 ? "bold 9.5px sans-serif" : (dCrit[i] === 1 ? "bold 10px monospace" : "8.5px monospace");
    ctx.fillText(dTxt[i] || String(dVal[i]), dX[i], dY[i]);
  }

  ctx.restore();

  if (joy.act) {
    ctx.strokeStyle = "rgba(0, 229, 255, 0.38)";
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(joy.ox, joy.oy, opts.joySize, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = "rgba(255, 209, 102, 0.65)";
    ctx.beginPath(); ctx.arc(joy.ox + joy.dx * opts.joySize, joy.oy + joy.dy * opts.joySize, 14, 0, Math.PI * 2); ctx.fill();
  }
}
// EOF:js/render.js
