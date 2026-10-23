// FILE: js/render.js
// PART: 13 of 14
// DETAIL: All 56 Heroes' Bespoke Voxel Sprites, 56 Secondary Hardware Attachments (Shoulder Casters, Power Packs, Servo-Arms, Quivers), Start-of-Run Equip Animations, and Gore/ms Telemetry.

"use strict";

const HERO_VOXEL_STYLE = [
  0, 1, 2, 3, 4, 5, 0, 6, 7, 15, 8, 0, 3, 25, 0, 9, 0, 10, 11, 15,
  3, 8, 0, 20, 12, 15, 1, 15, 26, 13, 14, 15, 15, 15, 16, 3, 10, 17, 18, 19,
  20, 0, 0, 0, 10, 21, 21, 15, 22, 23, 24, 0, 25, 26, 1, 27
];

/* === 1. BESPOKE SIGNATURE HARDWARE & HOLSTERED ARSENAL FOR ALL 56 HEROES === */
function drawHolsteredWeapons(c, cid, aim, bladeCol) {
  const eqGlow = (c === ctx && player && player.equipAnimTimer > 0);
  // 1. Character-Specific Shoulder / Wrist / Back Signature Hardware across the entire roster!
  if (cid === 54 || cid === 1) {
    // Boba Fett / Mando Wrist Flamethrower & Whistling Bird Gauntlets
    c.fillStyle = eqGlow ? "#ffd166" : "#b71c1c"; c.fillRect(-11, -3, 3.5, 5.5);
    c.fillStyle = "#90a4ae"; c.fillRect(7.5, -3, 3.5, 5.5);
  } else if (cid === 29 || cid === 33 || cid === 34) {
    // Predator Shoulder Plasma Caster / Doom Slayer Flame-Belcher / Astartes Backpack Krak Launcher
    c.fillStyle = eqGlow ? "#00f0ff" : "#546e7a";
    c.fillRect(-11, -13, 4.5, 7); c.strokeRect(-11, -13, 4.5, 7);
    c.fillStyle = "#ff5252"; c.fillRect(-10, -14, 2.5, 2);
  } else if (cid === 35 || cid === 23) {
    // Tech-Magos Mechadendrite Servo-Arm / Borg Assimilation Tubules
    c.strokeStyle = eqGlow ? "#ffd166" : "#90a4ae"; c.lineWidth = 2;
    c.beginPath(); c.moveTo(-7, -5); c.lineTo(-15, -14); c.lineTo(-11, -19); c.stroke();
  } else if (cid === 48 || cid === 50) {
    // Witcher Dual Back-Scabbards / Kenshi Ronin Nodachi Sheath
    c.strokeStyle = "#cfd8dc"; c.lineWidth = 1.6;
    c.beginPath(); c.moveTo(-6, -15); c.lineTo(5, 7);
    if (cid === 48) { c.moveTo(-3, -16); c.lineTo(7, 6); }
    c.stroke();
  } else if (cid === 28 || cid === 53) {
    // Sulaco Smartgun Articulated Servo-Mount / Rambo Quiver & Survival Knife
    c.fillStyle = "#ffd166"; c.fillRect(-11, -4, 3, 9);
  } else if (cid === 42 || cid === 43 || cid === 47) {
    // Pip-Boy 3000 / Cyberware Wrist Launcher / Chozo Grapple Emitter
    c.fillStyle = "#00e676"; c.fillRect(-11, -2, 3.5, 4.5);
  }

  if (!player || c !== ctx) return;
  const wpns = player.weapons;
  for (let i = 0; i < wpns.length; i++) {
    const w = wpns[i];
    if (i === 0 && w.enabled !== false) continue;
    if (w.style === "orbit" && typeof isSwordWeapon === "function" && isSwordWeapon(w.id)) {
      c.fillStyle = "#cfd8dc"; c.fillRect(-10, 3 + (i % 2) * 2, 5, 2.2);
      c.fillStyle = bladeCol; c.fillRect(-6, 3 + (i % 2) * 2, 1.5, 2.2);
    } else if (w.style === "beam" || w.style === "cone" || [15, 28, 31, 34, 53, 54].includes(w.id)) {
      c.save(); c.rotate(-0.55 + (i % 2) * 1.1);
      c.fillStyle = "#37474f"; c.strokeStyle = "#90a4ae"; c.lineWidth = 1;
      c.fillRect(-3, -11, 5, 19); c.strokeRect(-3, -11, 5, 19);
      c.restore();
    } else {
      const hx = (i % 2 === 0) ? -9.5 : 6.5, hy = i >= 3 ? -1 : 4;
      c.fillStyle = "#263238"; c.fillRect(hx, hy, 3.5, 5);
      c.fillStyle = "#ffd166"; c.fillRect(hx + 0.5, hy, 2, 2);
    }
  }
}

function drawHeroSprite(x, y, fac, cid, walk, aim, inVehicle = 0, c = ctx, guardZone = -1) {
  const out = typeof getOutfit === "function" ? getOutfit(cid) : { head: 0, torso: 0, legs: 0, back: 0, blade: 0 };
  const pal = typeof getHeroOutfits === "function" ? getHeroOutfits(cid) : null;
  const hCol = (pal && pal.head[out.head]) ? pal.head[out.head][1] : "#eceff1";
  const tCol = (pal && pal.torso[out.torso]) ? pal.torso[out.torso][1] : fac.c1;
  const lCol = (pal && pal.legs[out.legs]) ? pal.legs[out.legs][1] : "#cfd8dc";
  const bCol = (pal && pal.back[out.back]) ? pal.back[out.back][1] : "none";
  const bladeCol = (pal && pal.blade && pal.blade[out.blade || 0]) ? pal.blade[out.blade || 0][1] : fac.c1;
  const vStyle = HERO_VOXEL_STYLE[cid] || 0;
  const eqAnim = (c === ctx && player && player.equipAnimTimer > 0) ? player.equipAnimTimer : 0;

  c.save();
  c.translate(x, y);

  if (inVehicle === 1) {
    c.fillStyle = "#102838"; c.strokeStyle = "#00f0ff"; c.lineWidth = 2.2;
    c.beginPath(); c.ellipse(0, 4, 24, 15, 0, 0, Math.PI * 2); c.fill(); c.stroke();
  } else if (inVehicle === 2) {
    const mStep = Math.sin(walk) * 5;
    c.fillStyle = "#263238"; c.strokeStyle = "#ffd166"; c.lineWidth = 2;
    c.fillRect(-16, 6 + mStep, 10, 12); c.strokeRect(-16, 6 + mStep, 10, 12);
    c.fillRect(6, 6 - mStep, 10, 12); c.strokeRect(6, 6 - mStep, 10, 12);
    c.fillRect(-18, -14, 36, 22); c.strokeRect(-18, -14, 36, 22);
    c.fillStyle = "#00f0ff"; c.fillRect(-10, -8, 20, 5);
  }

  c.fillStyle = "rgba(0,0,0,0.45)";
  c.beginPath(); c.ellipse(0, 13, 12, 5, 0, 0, Math.PI * 2); c.fill();

  const flutter = Math.sin(walk * 1.4 + performance.now() * 0.008) * 3.5;
  const moveBillow = (c === ctx && player) ? Math.min(8, Math.hypot(player.vx || 0, player.vy || 0) * 0.04) : 2;
  if (bCol && bCol !== "none") {
    c.fillStyle = bCol; c.strokeStyle = "#111"; c.lineWidth = 1;
    c.beginPath(); c.moveTo(-8, -6); c.lineTo(8, -6);
    c.lineTo(12 + flutter * 0.5, 11 + moveBillow); c.lineTo(-12 + flutter, 11 + moveBillow);
    c.closePath(); c.fill(); c.stroke();
  }

  if (cid === 54 || cid === 34 || cid === 31) {
    // Z-6 Jetpack / Astartes Power Pack / Drop-Trooper Jump-Pack
    c.fillStyle = "#546e7a"; c.strokeStyle = "#263238"; c.lineWidth = 1.2;
    c.fillRect(-9, -7, 4, 13); c.fillRect(5, -7, 4, 13); c.fillRect(-5, -6, 10, 11);
    if (cid === 54 && (!player || c !== ctx || player.sigGearCD < 6.0)) {
      c.fillStyle = "#d32f2f";
      c.beginPath(); c.moveTo(-2.5, -6); c.lineTo(0, -16); c.lineTo(2.5, -6); c.closePath(); c.fill();
    }
  }

  const stride = Math.sin(walk) * 4.5;
  if (vStyle === 4) {
    c.fillStyle = lCol; c.fillRect(-9, -3, 3, 14); c.fillRect(6, -3, 3, 14); c.fillRect(-2, 6, 4, 6);
    c.fillStyle = tCol; c.strokeStyle = "#1e88e5"; c.lineWidth = 1.4;
    c.fillRect(-7, -8, 14, 14); c.strokeRect(-7, -8, 14, 14);
    c.fillStyle = hCol; c.beginPath(); c.arc(0, -8, 7, Math.PI, 0); c.fill(); c.stroke();
    c.fillStyle = "#d50000"; c.fillRect(-1.5, -13, 3, 3);
    c.restore(); return;
  }

  c.fillStyle = lCol; c.strokeStyle = "#090d16"; c.lineWidth = 1.2;
  c.fillRect(-6.5, 4 + stride * 0.5, 5, 5); c.strokeRect(-6.5, 4 + stride * 0.5, 5, 5);
  c.fillRect(1.5, 4 - stride * 0.5, 5, 5); c.strokeRect(1.5, 4 - stride * 0.5, 5, 5);
  c.fillStyle = "#16191f";
  c.fillRect(-7, 8 + stride, 5.5, 4.5); c.fillRect(1.5, 8 - stride, 5.5, 4.5);

  const torsoW = (vStyle === 16 || vStyle === 17) ? 10.5 : 8.5;
  c.fillStyle = tCol;
  c.fillRect(-torsoW, -7, torsoW * 2, 12); c.strokeRect(-torsoW, -7, torsoW * 2, 12);
  c.fillStyle = "#261c14"; c.fillRect(-torsoW, 3, torsoW * 2, 2.5);

  if (cid === 54 || cid === 1) {
    c.fillStyle = "#2e5736"; c.fillRect(-7, -5.5, 6, 4.5); c.fillRect(1, -5.5, 6, 4.5);
    c.fillStyle = "#ffd166"; c.fillRect(-10.5, -6.5, 3, 5); c.fillRect(7.5, -6.5, 3, 5);
  } else if (cid === 51) {
    c.fillStyle = "#ffffff"; c.beginPath(); c.moveTo(-3, -7); c.lineTo(3, -7); c.lineTo(0, 1); c.closePath(); c.fill();
    c.fillStyle = "#0a0a0c"; c.fillRect(-1, -5, 2, 6);
  } else if (cid === 5 || cid === 24 || cid === 13 || cid === 15) {
    c.strokeStyle = "#cfd8dc"; c.lineWidth = 2; c.beginPath(); c.moveTo(-7, -6); c.lineTo(7, 4); c.stroke();
  } else if (vStyle === 16 || cid === 47) {
    c.fillStyle = hCol; c.fillRect(-13, -8, 5, 7); c.strokeRect(-13, -8, 5, 7);
    c.fillRect(8, -8, 5, 7); c.strokeRect(8, -8, 5, 7);
  } else if (cid === 45) {
    c.fillStyle = "#ff9100"; c.fillRect(-4, -4, 8, 5);
  }

  drawHolsteredWeapons(c, cid, aim, bladeCol);

  if (vStyle === 1) {
    c.fillStyle = hCol; c.fillRect(-6.5, -16.5, 13, 10.5); c.strokeRect(-6.5, -16.5, 13, 10.5);
    c.fillStyle = "#d50000"; c.fillRect(-5.5, -13.5, 11, 2.5);
    c.fillStyle = "#0a0a0c"; c.fillRect(-4.5, -13, 9, 1.8); c.fillRect(-1.5, -11.5, 3, 5);
    c.strokeStyle = "#cfd8dc"; c.beginPath(); c.moveTo(6.5, -13); c.lineTo(6.5, -20); c.lineTo(9.5, -20); c.stroke();
  } else if (vStyle === 2) {
    c.fillStyle = "#ffffff"; c.fillRect(-6.5, -16.5, 13, 10.5); c.strokeRect(-6.5, -16.5, 13, 10.5);
    c.fillStyle = "#111"; c.fillRect(-5, -13, 4, 2); c.fillRect(1, -13, 4, 2); c.fillRect(-3, -9.5, 6, 1.5);
  } else if (vStyle === 6) {
    c.fillStyle = hCol; c.fillRect(-6, -16, 12, 10); c.fillRect(-5, -23, 3, 7); c.fillRect(2, -23, 3, 7);
    c.fillStyle = "#00e5ff"; c.fillRect(-4, -13, 3, 2); c.fillRect(1, -13, 3, 2);
  } else if (vStyle === 8) {
    c.fillStyle = hCol; c.beginPath(); c.arc(0, -13, 7.5, 0, Math.PI * 2); c.fill(); c.stroke();
    c.fillStyle = "#0a0a0c"; c.fillRect(-5, -13, 3.5, 3); c.fillRect(1.5, -13, 3.5, 3);
  } else if (vStyle === 13) {
    c.fillStyle = "#111"; c.fillRect(-8, -16, 2.5, 10); c.fillRect(5.5, -16, 2.5, 10);
    c.fillStyle = hCol; c.fillRect(-6, -16.5, 12, 10); c.strokeRect(-6, -16.5, 12, 10);
    c.fillStyle = "#ff1744"; c.fillRect(-4, -13, 3, 2); c.fillRect(1, -13, 3, 2);
  } else if (vStyle === 14) {
    c.fillStyle = "#0d1117";
    c.beginPath(); c.moveTo(-8, -19); c.lineTo(0, -23); c.lineTo(8, -19); c.lineTo(5, -7); c.lineTo(-5, -7); c.closePath(); c.fill(); c.stroke();
  } else if (vStyle === 15 || vStyle === 16) {
    c.fillStyle = tCol; c.fillRect(-6.5, -16.5, 13, 10.5); c.strokeRect(-6.5, -16.5, 13, 10.5);
    c.fillStyle = cid === 32 ? "#ffd166" : (cid === 47 ? "#00e676" : fac.c2);
    c.fillRect(-5, -13.5, 10, 3.2);
  } else if (vStyle === 17) {
    c.fillStyle = "#2e7d32"; c.fillRect(-7, -16, 14, 10); c.strokeRect(-7, -16, 14, 10);
    c.fillStyle = "#eceff1"; c.fillRect(-6, -9, 2.5, 3.5); c.fillRect(3.5, -9, 2.5, 3.5);
  } else if (vStyle === 23) {
    c.fillStyle = "#00695c"; c.fillRect(-6, -16, 12, 10);
    for (let t = -4; t <= 4; t += 4) c.fillRect(t - 1, -8, 2, 5 + Math.sin(walk + t) * 2);
  } else if (vStyle === 24) {
    c.fillStyle = "#eccca2"; c.fillRect(-5, -15, 10, 8.5);
    c.fillStyle = hCol; c.beginPath(); c.moveTo(-13, -13); c.lineTo(0, -21); c.lineTo(13, -13); c.closePath(); c.fill(); c.stroke();
  } else if (vStyle === 27) {
    c.fillStyle = hCol; c.beginPath(); c.moveTo(-8, -16); c.lineTo(0, -19); c.lineTo(8, -16); c.lineTo(5, -7); c.lineTo(-5, -7); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = "#ffd166"; c.fillRect(-4, -13, 2.5, 2); c.fillRect(1.5, -13, 2.5, 2);
  } else {
    c.fillStyle = vStyle === 5 ? "#5d4037" : (vStyle === 20 && out.head === 2 ? "#cfd8dc" : "#eccca2");
    c.fillRect(-5.5, -15.5, 11, 9); c.strokeRect(-5.5, -15.5, 11, 9);
    c.fillStyle = vStyle === 11 ? "#00b0ff" : "#111";
    c.fillRect(-3.5, -12.5, 2, 2); c.fillRect(1.5, -12.5, 2, 2);
    if (vStyle === 20) { c.fillStyle = "#ff1744"; c.fillRect(1.5, -12.5, 2.5, 2.5); }
    if (vStyle === 19 || vStyle === 21) { c.strokeStyle = "#111"; c.strokeRect(-4.5, -13.5, 4, 3); c.strokeRect(0.5, -13.5, 4, 3); }
    if (vStyle === 11) { c.fillStyle = "#37474f"; c.fillRect(-5.5, -10.5, 11, 4); }

    c.fillStyle = hCol;
    if (vStyle === 25 && out.head !== 2) {
      c.fillRect(-10, -15.5, 20, 2.5); c.fillRect(-6, -19, 12, 4);
    } else if (vStyle === 18) {
      c.fillRect(-11, -15.5, 22, 2.5); c.fillRect(-5, -20, 10, 5);
    } else if (vStyle === 9) {
      c.fillRect(-6.5, -18.5, 13, 4.5); c.fillRect(-7.5, -15, 2.5, 6); c.fillRect(5, -15, 2.5, 6);
    } else if (vStyle === 26) {
      c.fillRect(-6.5, -18.5, 13, 4); c.fillStyle = "#d50000"; c.fillRect(-6.5, -15, 13, 2.2);
    } else {
      c.fillRect(-6.5, -18.5, 13, 5);
      if ([0, 3, 22].includes(vStyle)) { c.fillRect(-7.5, -16, 2.5, 8); c.fillRect(5, -16, 2.5, 8); }
    }
  }

  // Universal Start-of-Run Equip Pose / Hold-to-Guard Pose for all 56 Heroes!
  if (guardZone >= 0 || eqAnim > 0) {
    c.fillStyle = cid === 40 ? "#cfd8dc" : tCol; c.strokeStyle = "#ffd166"; c.lineWidth = 1.6;
    const gy = guardZone === 0 ? -13 : -3;
    c.fillRect(-10, gy, 20, 5); c.strokeRect(-10, gy, 20, 5);
  }

  // Aiming Arms, Hands & In-Hand Weapons (Includes Equip Flourish Spin & Lv.5/Lv.10 Weapon Scaling!)
  c.rotate(aim + (eqAnim > 0 ? Math.sin(eqAnim * 12) * 0.45 : 0));
  const armCnt = cid === 55 ? 4 : 2;
  for (let a = 0; a < armCnt; a++) {
    const ay = (a % 2 === 0 ? 1 : -1) * (a >= 2 ? 9 : 6);
    if (cid === 52 && a % 2 === 1) continue;
    c.fillStyle = tCol; c.fillRect(0, ay - 2, 8, 3.8); c.strokeRect(0, ay - 2, 8, 3.8);
    c.fillStyle = "#eccca2"; c.fillRect(7.5, ay - 1.8, 3, 3.2);
  }

  const w0 = (c === ctx && player && player.weapons[0]) ? player.weapons[0] : null;
  const wLvl = w0 ? w0.lvl : 1;
  const useSword = (typeof isSwordWeapon === "function" && isSwordWeapon(cid)) || (w0 && w0.style === "orbit" && isSwordWeapon(w0.id));
  if (useSword) {
    const swingOff = (c === ctx && player && player.swordSwingTimer > 0) ? Math.sin(player.swordSwingTimer * 26) * 1.15 : 0;
    const bLen = wLvl >= 10 ? 36 : (wLvl >= 5 ? 33 : 29);
    c.rotate(swingOff);
    c.fillStyle = "#cfd8dc"; c.fillRect(8, 2, 5, 2.6);
    c.strokeStyle = bladeCol; c.lineWidth = wLvl >= 5 ? 4.4 : 3.6;
    c.beginPath(); c.moveTo(13, 3.3); c.lineTo(bLen, 3.3); c.stroke();
    c.strokeStyle = "#ffffff"; c.lineWidth = 1.6;
    c.beginPath(); c.moveTo(13, 3.3); c.lineTo(bLen - 1, 3.3); c.stroke();
  } else {
    c.fillStyle = wLvl >= 10 ? "#ffd166" : (wLvl >= 5 ? "#546e7a" : "#37474f");
    c.strokeStyle = wLvl >= 5 ? "#ffd166" : "#cfd8dc"; c.lineWidth = 1;
    const isLong = [2, 5, 8, 15, 28, 31, 32, 33, 34, 36, 37, 40, 53, 54].includes(cid) || wLvl >= 5;
    const gLen = (isLong ? 15 : 10) + (wLvl >= 5 ? 3 : 0);
    c.fillRect(7, 2, gLen, 3.8); c.strokeRect(7, 2, gLen, 3.8);
    if (c === ctx && typeof muzzleFlashTimer !== "undefined" && muzzleFlashTimer > 0) {
      c.fillStyle = "#ffd166";
      c.beginPath(); c.moveTo(7 + gLen, 1); c.lineTo(15 + gLen, 3.8); c.lineTo(7 + gLen, 6.8); c.closePath(); c.fill();
    }
  }
  c.restore();
}

/* === 2. ENEMY ANATOMY, NUB-CRAWLING & PERSISTENT CORPSES === */
function drawDeflectorGear(fac, torsoW, step) {
  if (fac.id === 0) {
    ctx.strokeStyle = fac.c1; ctx.lineWidth = 3.2;
    ctx.beginPath(); ctx.moveTo(torsoW + 2, 2); ctx.lineTo(torsoW + 13, -13 + step * 0.5); ctx.stroke();
    ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 1.3;
    ctx.beginPath(); ctx.moveTo(torsoW + 2, 2); ctx.lineTo(torsoW + 13, -13 + step * 0.5); ctx.stroke();
  } else if ([1, 3, 4, 8].includes(fac.id)) {
    ctx.strokeStyle = fac.c1; ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.arc(2, -2, torsoW + 7, -1.1, 1.1); ctx.stroke();
  } else {
    ctx.fillStyle = "#263238"; ctx.strokeStyle = fac.c1; ctx.lineWidth = 1.8;
    ctx.fillRect(torsoW + 1, -9 + step * 0.3, 4.5, 14); ctx.strokeRect(torsoW + 1, -9 + step * 0.3, 4.5, 14);
  }
}

function drawEnemyAnatomy(i, fac) {
  const x = eX[i], y = eY[i], seed = eSeed[i], type = eType[i], wave = eWave[i];
  const boss = type === 99, lostL = eLegsLost[i] || 0, lostA = eArmsLost[i] || 0;
  const isCrawler = lostL >= 2 && lostA >= 2;
  const scale = (boss ? 1.85 : 1.0) * ChaosMath.range(seed + 5, 0.88, 1.18);
  const cyc = (eStun[i] > 0 || eGrapple[i] > 0) ? 0 : (runTime * 11 + (seed % 17));
  const step = Math.sin(cyc) * 4.5;
  const col = boss ? "#ffd166" : (eSlow[i] > 0 ? "#40c4ff" : fac.c2);
  const faceX = player && player.x < x ? -1 : 1;
  const isElite = !boss && (wave >= 2 && (seed % 5 === 0) || eFormType[i] === 1);

  ctx.save(); ctx.translate(x, y);
  if (isCrawler) ctx.rotate(Math.sin(runTime * 14 + i) * 0.45);
  ctx.scale(scale * faceX, scale);

  ctx.fillStyle = col; ctx.strokeStyle = "#090d16"; ctx.lineWidth = 1.35;
  if (type === 0) {
    const legL = ChaosMath.range(seed + 11, 7, 10), torsoW = ChaosMath.range(seed + 19, 6, 8.5);
    if (lostL < 1) { ctx.fillRect(-5, 3 + step * 0.6, 3.5, legL); ctx.strokeRect(-5, 3 + step * 0.6, 3.5, legL); }
    if (lostL < 2) { ctx.fillRect(1.5, 3 - step * 0.6, 3.5, legL); ctx.strokeRect(1.5, 3 - step * 0.6, 3.5, legL); }
    ctx.beginPath(); ctx.moveTo(-torsoW, -6); ctx.lineTo(torsoW, -6); ctx.lineTo(torsoW * 0.7, 4); ctx.lineTo(-torsoW * 0.7, 4); ctx.closePath(); ctx.fill(); ctx.stroke();
    if (lostA < 1) { ctx.fillRect(-torsoW - 3, -5 - step * 0.5, 3, 8.5); ctx.strokeRect(-torsoW - 3, -5 - step * 0.5, 3, 8.5); }
    if (lostA < 2) { ctx.fillRect(torsoW, -5 + step * 0.5, 3, 8.5); ctx.strokeRect(torsoW, -5 + step * 0.5, 3, 8.5); }
    ctx.beginPath(); ctx.arc(0, -10.5, 5.4, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    if (isElite && lostA < 2) drawDeflectorGear(fac, torsoW, step);
  } else if (type === 1) {
    const bodyL = 11.5, lx = [-bodyL + 1, -bodyL + 4.5, bodyL - 7, bodyL - 3.5];
    for (let k = 0; k < 4; k++) {
      if (k >= lostL) { const s = (k % 2 === 0 ? step : -step) * 0.7; ctx.fillRect(lx[k], 2 + s, 3, 8.5); ctx.strokeRect(lx[k], 2 + s, 3, 8.5); }
    }
    if (eTailDmg[i] < 45) { ctx.beginPath(); ctx.moveTo(-bodyL, -2); ctx.lineTo(-bodyL - 9, -5); ctx.lineTo(-bodyL - 7, -1); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    ctx.fillRect(-bodyL, -4, bodyL * 2, 7); ctx.strokeRect(-bodyL, -4, bodyL * 2, 7);
    ctx.beginPath(); ctx.moveTo(bodyL - 2, -9); ctx.lineTo(bodyL + 7, -4); ctx.lineTo(bodyL + 5, 0); ctx.lineTo(bodyL - 2, -1); ctx.closePath(); ctx.fill(); ctx.stroke();
  } else if (type === 2) {
    for (let k = -1; k <= 1; k++) {
      if (lostL >= 2 && k === 0) continue;
      const ly = k * 4.5, s = (k % 2 === 0 ? step : -step) * 0.6;
      ctx.beginPath(); ctx.moveTo(-3, ly); ctx.lineTo(-14, ly + 4 + s); ctx.moveTo(3, ly); ctx.lineTo(14, ly + 4 - s); ctx.stroke();
    }
    ctx.beginPath(); ctx.ellipse(-5, 0, 7.5, 5.5, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(4, 0, 5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  } else {
    const w = boss ? 12 : 9.5;
    if (lostL < 1) ctx.fillRect(-w * 0.65, 4 + step * 0.5, 5, 9);
    if (lostL < 2) ctx.fillRect(w * 0.2, 4 - step * 0.5, 5, 9);
    ctx.fillRect(-w, -8, w * 2, 13); ctx.strokeRect(-w, -8, w * 2, 13);
    if (lostA < 1) ctx.fillRect(-w - 4.5, -6 - step * 0.5, 4.5, 11);
    if (lostA < 2) ctx.fillRect(w, -6 + step * 0.5, 4.5, 11);
    ctx.beginPath(); ctx.arc(0, -10, boss ? 6.5 : 5.2, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    if ((boss || isElite) && lostA < 2) drawDeflectorGear(fac, w, step);
  }
  ctx.restore();
}

/* === 3. CITY STRUCTURES, MECHS & MAIN SCENE COMPOSITOR === */
function drawWorldProp(pr, fac) {
  ctx.save(); ctx.translate(pr.x, pr.y);
  if (pr.type === 0 || pr.type === 1) {
    const pts = ChaosMath.polyPoints(pr.seed, pr.rad, pr.type === 0 ? 5 : 6, 0.25, 0);
    ctx.fillStyle = pr.type === 0 ? fac.c1 : "#455a64"; ctx.strokeStyle = pr.type === 0 ? "#ffffff" : fac.c2; ctx.lineWidth = 1.6;
    ctx.beginPath(); pts.forEach((p, idx) => idx === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
    ctx.closePath(); ctx.fill(); ctx.stroke();
  } else if (pr.type === 2) {
    ctx.fillStyle = fac.c2; ctx.beginPath(); ctx.arc(0, 0, 6, 0, Math.PI * 2); ctx.fill();
  } else if (pr.type === 3) {
    ctx.fillStyle = "#ffd166"; ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(12, 0); ctx.lineTo(0, 12); ctx.lineTo(-12, 0); ctx.closePath(); ctx.fill();
  } else if (pr.type === 4) {
    ctx.strokeStyle = "#ff5252"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, 26 + Math.sin(runTime * 6) * 3, 0, Math.PI * 2); ctx.stroke();
  } else if (pr.type === 5) {
    ctx.fillStyle = "#1c2632"; ctx.strokeStyle = fac.c1; ctx.lineWidth = 2;
    ctx.fillRect(-28, -28, 56, 56); ctx.strokeRect(-28, -28, 56, 56);
    ctx.fillStyle = "#101720"; ctx.fillRect(-22, -22, 44, 44);
    ctx.fillStyle = "#ffd166";
    for (let wx = -16; wx <= 12; wx += 14) { ctx.fillRect(wx, -26, 6, 3); ctx.fillRect(wx, 23, 6, 3); }
  } else if (pr.type === 6) {
    ctx.fillStyle = "#4a148c"; ctx.strokeStyle = "#ffd166"; ctx.lineWidth = 2;
    ctx.fillRect(-14, -10, 28, 20); ctx.strokeRect(-14, -10, 28, 20);
  } else if (pr.type === 7) {
    ctx.fillStyle = "#795548"; ctx.strokeStyle = "#ffd166"; ctx.lineWidth = 2;
    ctx.fillRect(-18, -8, 36, 16); ctx.strokeRect(-18, -8, 36, 16);
  } else if (pr.type === 8) {
    ctx.fillStyle = "#006064"; ctx.strokeStyle = "#00f0ff"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(0, 0, 22, 13, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  } else if (pr.type === 9) {
    ctx.fillStyle = "#37474f"; ctx.strokeStyle = "#ffd166"; ctx.lineWidth = 2;
    ctx.fillRect(-16, -14, 32, 24); ctx.strokeRect(-16, -14, 32, 24);
    ctx.fillStyle = "#00f0ff"; ctx.fillRect(-8, -8, 16, 5);
  }
  ctx.restore();
}

const STROBE_HEX = ["#ff1744", "#ff5252", "#ff6d00", "#ff9100", "#ffd166", "#ffea00"];
function getBounceBoltColor(i, fac) {
  const b = typeof pBounce !== "undefined" ? pBounce[i] : 0;
  if (b <= 0) return pEnemy[i] === 1 ? "#ff1744" : (pSup[i] ? "#ffd166" : fac.c1);
  const flashOn = Math.sin(performance.now() * 0.01 * (10 + Math.min(35, b * 4.5)) + i) > 0;
  if (b === 1) return flashOn ? "#ffab40" : "#ff6d00";
  if (b === 2) return flashOn ? "#ffd740" : "#ff9100";
  if (b === 3) return flashOn ? "#fff59d" : "#ffd166";
  return flashOn ? "#ffffff" : STROBE_HEX[Math.floor(ChaosMath.range(i * 31 + Math.floor(performance.now() * 0.03), 0, STROBE_HEX.length - 0.01))];
}

function renderScene() {
  const t0 = performance.now();
  const fac = player ? player.fac : FACTIONS[CHAR_RAW[meta.selChar][1]];
  ctx.fillStyle = fac.bg; ctx.fillRect(0, 0, W, H);

  ctx.save();
  const z = opts.zoom, camX = player ? player.x : (performance.now() * 0.02), camY = player ? player.y : 256;
  ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-camX, -camY);

  ctx.strokeStyle = fac.grid; ctx.lineWidth = 2;
  const gx0 = Math.floor((camX - W / z) / 64) * 64, gx1 = camX + W / z;
  const gy0 = Math.floor((camY - H / z) / 64) * 64, gy1 = camY + H / z;
  ctx.beginPath();
  for (let x = gx0; x <= gx1; x += 64) { ctx.moveTo(x, gy0); ctx.lineTo(x, gy1); }
  for (let y = gy0; y <= gy1; y += 64) { ctx.moveTo(gx0, y); ctx.lineTo(gx1, y); }
  ctx.stroke();

  if (player) {
    ctx.fillStyle = "#05070c";
    for (let i = 0; i < MAX_DRIP; i++) {
      if (!drAct[i]) continue;
      if (drZ[i] > 0) ctx.fillRect(drX[i], drY[i] - drZ[i], 1.6, 1.6);
      else { const r = drRad[i] || 3.2; ctx.beginPath(); ctx.arc(drX[i], drY[i], r, 0, Math.PI * 2); ctx.fill(); }
    }
    for (let i = 0; i < MAX_CORPSE; i++) {
      if (!corpAct[i]) continue;
      ctx.save(); ctx.globalAlpha = Math.max(0.05, corpFade[i] * 0.65);
      ctx.translate(corpX[i], corpY[i]); ctx.rotate((corpSeed[i] % 6) + 0.5);
      ctx.fillStyle = "#1b222c"; ctx.strokeStyle = fac.c2; ctx.lineWidth = 1;
      ctx.fillRect(-8, -5, 16, 10); ctx.strokeRect(-8, -5, 16, 10);
      ctx.beginPath(); ctx.arc(10, 0, 4.5, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    for (let i = 0; i < MAX_LIMB; i++) {
      if (!lmbAct[i]) continue;
      ctx.save(); ctx.globalAlpha = Math.max(0.05, lmbFade[i] * 0.85);
      ctx.translate(lmbX[i], lmbY[i]); ctx.rotate(lmbRot[i]);
      ctx.fillStyle = lmbCol[i]; ctx.strokeStyle = "#000"; ctx.lineWidth = 1;
      ctx.fillRect(-4, -1.8, 8, 3.5); ctx.strokeRect(-4, -1.8, 8, 3.5);
      ctx.restore();
    }
  }

  const pcx = Math.floor(camX / 512), pcy = Math.floor(camY / 512);
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) getChunkProps(pcx + dx, pcy + dy).forEach(pr => drawWorldProp(pr, fac));
  }
  movedBarricades.forEach(b => drawWorldProp(b, fac));
  activeForts.forEach(f => { ctx.fillStyle = "#5d4037"; ctx.strokeStyle = "#00e676"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(f.x, f.y, f.rad, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); });
  activeMines.forEach(m => { ctx.fillStyle = "#ff1744"; ctx.beginPath(); ctx.arc(m.x, m.y, 5 + Math.sin(runTime * 10) * 1.5, 0, Math.PI * 2); ctx.fill(); });

  if (player) {
    ctx.fillStyle = "#00ff88";
    for (let i = 0; i < MAX_O; i++) { if (oAct[i]) { ctx.beginPath(); ctx.arc(oX[i], oY[i], 4.5, 0, Math.PI * 2); ctx.fill(); } }

    for (let i = 0; i < MAX_E; i++) {
      if (!eAct[i]) continue;
      if (eGrapple[i] > 0) { ctx.strokeStyle = "#00f0ff"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(player.x, player.y); ctx.lineTo(eX[i], eY[i]); ctx.stroke(); }
      if (eType[i] === 98 && eRivalCid[i] >= 0) {
        const rc = CHAR_RAW[eRivalCid[i]];
        drawHeroSprite(eX[i], eY[i], FACTIONS[rc[1]], rc[0], runTime * 10, Math.atan2(player.y - eY[i], player.x - eX[i]), 0, ctx, -1);
      } else drawEnemyAnatomy(i, fac);
    }

    for (let i = 0; i < MAX_P; i++) {
      if (!pAct[i]) continue;
      const col = getBounceBoltColor(i, fac);
      ctx.strokeStyle = col; ctx.fillStyle = col;
      if (pStyle[i] === 7) {
        const ang = Math.atan2(pVY[i], pVX[i]);
        ctx.lineWidth = 3.5; ctx.beginPath(); ctx.arc(pX[i], pY[i], 18, ang - 0.85, ang + 0.85); ctx.stroke();
      } else if (pWpnId[i] === 52 || pWpnId[i] === 13) {
        ctx.fillStyle = "#fff59d"; ctx.fillRect(pX[i] - 1, pY[i] - 1, 2.2, 2.2);
      } else if (pStyle[i] === 6) {
        ctx.lineWidth = pSup[i] ? 4 : 2.5;
        ctx.beginPath(); ctx.arc(pX[i], pY[i], pRad[i] * (1 - pLife[i]), 0, Math.PI * 2); ctx.stroke();
      } else if (pStyle[i] === 4 || pBounce[i] > 0) {
        const spd = Math.hypot(pVX[i], pVY[i]) || 1;
        const bLen = (pWpnId[i] === 51 || pWpnId[i] === 54 || pWpnId[i] === 6) ? 8 : 16;
        ctx.lineWidth = pBounce[i] > 0 ? 3.8 : 2.8;
        ctx.beginPath(); ctx.moveTo(pX[i], pY[i]); ctx.lineTo(pX[i] + (pVX[i] / spd) * bLen, pY[i] + (pVY[i] / spd) * bLen); ctx.stroke();
      } else {
        ctx.beginPath(); ctx.arc(pX[i], pY[i], 3.5, 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.fillStyle = "#ffd166";
    for (let i = 0; i < MAX_PT; i++) { if (ptAct[i]) ctx.fillRect(ptX[i], ptY[i], 3, 3); }

    drawHeroSprite(player.x, player.y, fac, player.cid, player.walk, player.aim, player.inVehicle, ctx, player.guardZone);

    ctx.font = "bold 11px sans-serif"; ctx.textAlign = "center";
    for (let i = 0; i < MAX_D; i++) {
      if (dAct[i]) { ctx.fillStyle = dCol[i]; ctx.fillText(dTxt[i] ? dTxt[i] : (dVal[i] + (dCrit[i] ? "!" : "")), dX[i], dY[i]); }
    }
  }
  ctx.restore();

  if (flashAlpha > 0) { ctx.fillStyle = `rgba(255,255,255,${flashAlpha})`; ctx.fillRect(0, 0, W, H); }
  if (joy.act) {
    ctx.strokeStyle = "#00e5ff88"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(joy.ox, joy.oy, opts.joySize, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = "#00e5ffcc";
    ctx.beginPath(); ctx.arc(joy.ox + joy.dx * opts.joySize * 0.8, joy.oy + joy.dy * opts.joySize * 0.8, 15, 0, Math.PI * 2); ctx.fill();
  }

  const elapsedMs = performance.now() - t0;
  frameMs = +(frameMs * 0.88 + elapsedMs * 0.12).toFixed(1);
  if (opts.fps) {
    ctx.fillStyle = frameMs > 12 ? "#ff5252" : (frameMs > 7 ? "#ffd166" : "#00e676");
    ctx.font = "10.5px monospace"; ctx.textAlign = "right";
    ctx.fillText(`${fpsCount} FPS | ${frameMs}ms | B:${activeCorpseCount}/${opts.persistCount || 100}`, W - 8, H - 10);
  }
}
// EOF:js/render.js
