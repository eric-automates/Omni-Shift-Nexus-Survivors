// FILE: js/render.js
// PART: 13 of 14
// DETAIL: 2D Vector Renderer featuring Articulated Multi-Limb Enemies, Crippled Leg/Severed Tail visuals, Black Pixel Drip & 2x Ground Pools, and `%` Hit Popups.

"use strict";

/* === 1. HERO & RIVAL VECTOR SPRITE RENDERER === */
function drawHeroSprite(x, y, fac, cid, walk, aim, inVehicle = false) {
  ctx.save();
  ctx.translate(x, y);

  if (inVehicle) {
    ctx.fillStyle = "#102838";
    ctx.strokeStyle = "#00f0ff";
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.ellipse(0, 4, 24, 15, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  ctx.fillStyle = "rgba(0,0,0,0.45)";
  ctx.beginPath();
  ctx.ellipse(0, 12, 12, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  const stride = Math.sin(walk) * 5;
  ctx.fillStyle = cid === 51 ? "#111111" : "#cfd8dc";
  ctx.fillRect(-7, 7 + stride, 5, 6);
  ctx.fillRect(2, 7 - stride, 5, 6);

  if (cid === 51) {
    ctx.fillStyle = "#141619"; ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 1.3;
    ctx.beginPath(); ctx.moveTo(-11, 8); ctx.lineTo(-9, -7); ctx.lineTo(9, -7); ctx.lineTo(11, 8); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.moveTo(-3, -7); ctx.lineTo(3, -7); ctx.lineTo(0, 2); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#00e5ff"; ctx.fillRect(-1, -5, 2, 7);
    ctx.fillStyle = "#f5d6ba"; ctx.beginPath(); ctx.arc(0, -10, 6.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#0a0a0c"; ctx.fillRect(-7, -16, 14, 5); ctx.fillRect(-8, -14, 3, 9); ctx.fillRect(5, -14, 3, 9);
  } else if (cid === 52) {
    ctx.fillStyle = "#6d6546"; ctx.strokeStyle = "#ffd166"; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(-14, 9); ctx.lineTo(-10, -7); ctx.lineTo(10, -7); ctx.lineTo(14, 9); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#e0b890"; ctx.beginPath(); ctx.arc(0, -10, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#4e342e"; ctx.beginPath(); ctx.ellipse(0, -14, 12, 3.5, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillRect(-6, -18, 12, 4);
    ctx.rotate(aim);
    ctx.fillStyle = "#6d6546"; ctx.fillRect(2, 1, 9, 4);
    ctx.fillStyle = "#cfd8dc"; ctx.fillRect(10, 0, 11, 3.5);
    ctx.restore();
    return;
  } else if (cid === 53) {
    ctx.fillStyle = "#2e4c2b"; ctx.strokeStyle = "#fff";
    ctx.beginPath(); ctx.moveTo(-11, 8); ctx.lineTo(-9, -7); ctx.lineTo(9, -7); ctx.lineTo(11, 8); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#eccca2"; ctx.beginPath(); ctx.arc(0, -10, 6.8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#d50000"; ctx.fillRect(-7, -13, 14, 3);
    ctx.beginPath(); ctx.moveTo(-7, -12); ctx.lineTo(-14, -8 + stride * 0.5); ctx.lineTo(-12, -5); ctx.closePath(); ctx.fill();
  } else if (cid === 54) {
    ctx.fillStyle = "#607d8b"; ctx.fillRect(-8, -6, 16, 12);
    ctx.fillStyle = "#3e6b48"; ctx.strokeStyle = "#ffd166"; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(-11, 8); ctx.lineTo(-9, -7); ctx.lineTo(9, -7); ctx.lineTo(11, 8); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#3e6b48"; ctx.beginPath(); ctx.arc(0, -10, 7.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = "#d50000"; ctx.lineWidth = 2; ctx.strokeRect(-5, -12, 10, 3);
    ctx.fillStyle = "#111"; ctx.fillRect(-5, -12, 10, 2.5); ctx.fillRect(-1.5, -10, 3, 5);
    ctx.strokeStyle = "#cfd8dc"; ctx.beginPath(); ctx.moveTo(6, -12); ctx.lineTo(6, -20); ctx.lineTo(9, -20); ctx.stroke();
  } else {
    ctx.fillStyle = fac.c1; ctx.strokeStyle = opts.hiCon ? "#ffffff" : "#000000"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(-11, 8); ctx.lineTo(-9, -7); ctx.lineTo(9, -7); ctx.lineTo(11, 8); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#eceff1"; ctx.beginPath(); ctx.arc(0, -10, 7, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = fac.c2; ctx.fillRect(-5, -12, 10, 3);
    if (cid === 7 || cid === 50) {
      ctx.beginPath(); ctx.moveTo(-12, -14); ctx.lineTo(0, -22); ctx.lineTo(12, -14); ctx.closePath(); ctx.fill();
    }
  }

  ctx.rotate(aim);
  ctx.fillStyle = "#ffd166";
  ctx.fillRect(6, -2, 13, 4);
  ctx.restore();
}

/* === 2. ARTICULATED MULTI-LIMB ENEMY ANATOMY RENDERER (With Crippled Limbs & Severed Tails) === */
function drawEnemyAnatomy(i, fac) {
  const x = eX[i], y = eY[i], seed = eSeed[i], type = eType[i], wave = eWave[i];
  const boss = type === 99, lost = eLegsLost[i] || 0;
  const scale = (boss ? 1.85 : 1.0) * ChaosMath.range(seed + 5, 0.88, 1.18) * (1 + Math.min(0.35, (wave - 1) * 0.03));
  const cyc = (eStun[i] > 0 || eGrapple[i] > 0) ? 0 : (runTime * 11 + (seed % 17));
  const step = Math.sin(cyc) * 4.5;
  const col = boss ? "#ffd166" : (eSlow[i] > 0 ? "#40c4ff" : fac.c2);
  const faceX = player && player.x < x ? -1 : 1;
  const isElite = !boss && wave >= 2 && (seed % 5 === 0);

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale * faceX, scale);
  ctx.fillStyle = "rgba(0,0,0,0.4)";
  ctx.beginPath(); ctx.ellipse(0, 12, 10, 4, 0, 0, Math.PI * 2); ctx.fill();

  ctx.fillStyle = col;
  ctx.strokeStyle = opts.hiCon ? "#090d16" : "#000000";
  ctx.lineWidth = 1.35;

  if (type === 0) {
    // TYPE 0: HUMANOID TROOPER / SKELETON (Shortens & darkens crippled legs)
    const legL = ChaosMath.range(seed + 11, 7, 10), torsoW = ChaosMath.range(seed + 19, 6, 8.5);
    const lLeg = lost >= 1 ? legL * 0.45 : legL, rLeg = lost >= 2 ? legL * 0.45 : legL;
    ctx.fillStyle = lost >= 1 ? "#1a1a1a" : col;
    ctx.fillRect(-5, 3 + step * 0.6, 3.5, lLeg); ctx.strokeRect(-5, 3 + step * 0.6, 3.5, lLeg);
    ctx.fillStyle = lost >= 2 ? "#1a1a1a" : col;
    ctx.fillRect(1.5, 3 - step * 0.6, 3.5, rLeg); ctx.strokeRect(1.5, 3 - step * 0.6, 3.5, rLeg);
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.moveTo(-torsoW, -6); ctx.lineTo(torsoW, -6); ctx.lineTo(torsoW * 0.7, 4); ctx.lineTo(-torsoW * 0.7, 4); ctx.closePath(); ctx.fill(); ctx.stroke();
    if ((seed & 1) === 1) {
      ctx.beginPath(); ctx.moveTo(-torsoW * 0.6, -3); ctx.lineTo(torsoW * 0.6, -3); ctx.moveTo(-torsoW * 0.5, 0); ctx.lineTo(torsoW * 0.5, 0); ctx.stroke();
    }
    ctx.fillRect(-torsoW - 3, -5 - step * 0.5, 3, 8.5); ctx.strokeRect(-torsoW - 3, -5 - step * 0.5, 3, 8.5);
    ctx.fillRect(torsoW, -5 + step * 0.5, 3, 8.5); ctx.strokeRect(torsoW, -5 + step * 0.5, 3, 8.5);
    ctx.beginPath(); ctx.arc(0, -10.5, ChaosMath.range(seed + 29, 4.8, 6.2), 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#111"; ctx.fillRect(1, -12, 3.5, 2);
    if (isElite) {
      ctx.strokeStyle = fac.c1; ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.moveTo(torsoW + 2, 1); ctx.lineTo(torsoW + 11, -11 + step * 0.4); ctx.stroke();
    }
  } else if (type === 1) {
    // TYPE 1: QUADRUPED HOUND (4 individual legs + severable balancing tail)
    const bodyL = ChaosMath.range(seed + 13, 10, 13.5), tailL = ChaosMath.range(seed + 31, 7, 11);
    const wag = Math.cos(cyc * 1.3) * 3.5;
    const lx = [-bodyL + 1, -bodyL + 4.5, bodyL - 7, bodyL - 3.5];
    for (let k = 0; k < 4; k++) {
      const crippled = k < lost;
      const s = (k % 2 === 0 ? step : -step) * (crippled ? 0.15 : 0.7);
      const h = crippled ? 4.0 : 8.5;
      ctx.fillStyle = crippled ? "#151515" : col;
      ctx.fillRect(lx[k], 2 + s, 3, h); ctx.strokeRect(lx[k], 2 + s, 3, h);
    }
    ctx.fillStyle = col;
    if (eTailDmg[i] >= 45) {
      // Crippled / Severed Tail Stub
      ctx.fillStyle = "#151515";
      ctx.fillRect(-bodyL - 3, -3, 3, 3);
      ctx.fillStyle = col;
    } else {
      ctx.beginPath(); ctx.moveTo(-bodyL, -2); ctx.lineTo(-bodyL - tailL, -6 + wag); ctx.lineTo(-bodyL - tailL + 2, -2 + wag); ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    ctx.beginPath(); ctx.moveTo(-bodyL, -4); ctx.lineTo(bodyL - 2, -5); ctx.lineTo(bodyL, 3); ctx.lineTo(-bodyL, 3); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(bodyL - 3, -9); ctx.lineTo(bodyL + 7, -5); ctx.lineTo(bodyL + 5, 0); ctx.lineTo(bodyL - 3, -1); ctx.closePath(); ctx.fill(); ctx.stroke();
  } else if (type === 2) {
    // TYPE 2: XENO-STALKER / ARACHNID (6 Articulated Legs)
    const abR = ChaosMath.range(seed + 17, 6.5, 9.5);
    for (let k = -1; k <= 1; k++) {
      const ly = k * 4.5, s = (k % 2 === 0 ? step : -step) * 0.6;
      const reach = (lost > 0 && k === 0) ? 7 : 15;
      ctx.beginPath();
      ctx.moveTo(-3, ly); ctx.lineTo(-9, ly - 4 + s); ctx.lineTo(-reach, ly + 5 + s);
      ctx.moveTo(3, ly); ctx.lineTo(9, ly - 4 - s); ctx.lineTo(reach, ly + 5 - s);
      ctx.stroke();
    }
    ctx.beginPath(); ctx.ellipse(-5, 0, abR, abR * 0.75, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(4, 0, 5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(8, -3); ctx.lineTo(13, -1); ctx.moveTo(8, 3); ctx.lineTo(13, 1); ctx.stroke();
  } else {
    // TYPE 3 & 99: HEAVY BRUTE / 4-ARMED TITAN BOSS
    const w = boss ? 12 : ChaosMath.range(seed + 41, 8.5, 11);
    const lH = lost >= 1 ? 5 : 9, rH = lost >= 2 ? 5 : 9;
    ctx.fillRect(-w * 0.65, 4 + step * 0.5, 5, lH); ctx.strokeRect(-w * 0.65, 4 + step * 0.5, 5, lH);
    ctx.fillRect(w * 0.2, 4 - step * 0.5, 5, rH); ctx.strokeRect(w * 0.2, 4 - step * 0.5, 5, rH);
    ctx.beginPath(); ctx.moveTo(-w, -8); ctx.lineTo(w, -8); ctx.lineTo(w * 0.8, 5); ctx.lineTo(-w * 0.8, 5); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillRect(-w - 4.5, -6 - step * 0.5, 4.5, 11); ctx.strokeRect(-w - 4.5, -6 - step * 0.5, 4.5, 11);
    ctx.fillRect(w, -6 + step * 0.5, 4.5, 11); ctx.strokeRect(w, -6 + step * 0.5, 4.5, 11);
    if (boss) {
      ctx.fillRect(-w - 3, -14 + step * 0.5, 3.5, 9); ctx.strokeRect(-w - 3, -14 + step * 0.5, 3.5, 9);
      ctx.fillRect(w - 0.5, -14 - step * 0.5, 3.5, 9); ctx.strokeRect(w - 0.5, -14 - step * 0.5, 3.5, 9);
    }
    ctx.beginPath(); ctx.arc(0, -10, boss ? 6.5 : 5.2, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    if (boss || isElite) {
      ctx.strokeStyle = fac.c1; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(w + 2, 3); ctx.lineTo(w + 12, -10); ctx.stroke();
    }
  }
  ctx.restore();
}

/* === 3. CHAOSMATH MORPHED PROP & INTERACTABLE RENDERER === */
function drawWorldProp(pr, fac) {
  ctx.save();
  ctx.translate(pr.x, pr.y);
  if (pr.type === 0 || pr.type === 1) {
    const pts = ChaosMath.polyPoints(pr.seed, pr.rad, pr.type === 0 ? 5 : 6, 0.25, 0);
    ctx.fillStyle = pr.type === 0 ? fac.c1 : "#455a64";
    ctx.strokeStyle = pr.type === 0 ? "#ffffff" : fac.c2;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    pts.forEach((p, idx) => idx === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
    ctx.closePath(); ctx.fill(); ctx.stroke();
  } else if (pr.type === 2) {
    ctx.fillStyle = fac.c2; ctx.beginPath(); ctx.arc(0, 0, 6, 0, Math.PI * 2); ctx.fill();
  } else if (pr.type === 3) {
    ctx.fillStyle = "#ffd166";
    ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(12, 0); ctx.lineTo(0, 12); ctx.lineTo(-12, 0); ctx.closePath();
    ctx.fill(); ctx.strokeStyle = "#fff"; ctx.stroke();
  } else if (pr.type === 4) {
    ctx.strokeStyle = "#ff5252"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, 0, 26 + Math.sin(runTime * 6) * 3, 0, Math.PI * 2); ctx.stroke();
  } else if (pr.type === 5) {
    const pts = ChaosMath.polyPoints(pr.seed, pr.rad, 6, 0.1, 0);
    ctx.fillStyle = "#37474f"; ctx.strokeStyle = "#ffd166"; ctx.lineWidth = 2;
    ctx.beginPath();
    pts.forEach((p, idx) => idx === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#111"; ctx.fillRect(-6, 12, 12, 14);
  } else if (pr.type === 6) {
    ctx.fillStyle = "#4a148c"; ctx.strokeStyle = "#ffd166"; ctx.lineWidth = 2;
    ctx.fillRect(-14, -10, 28, 20); ctx.strokeRect(-14, -10, 28, 20);
    ctx.fillStyle = "#e040fb"; ctx.fillRect(-4, -3, 8, 6);
  } else if (pr.type === 7) {
    ctx.fillStyle = "#795548"; ctx.strokeStyle = "#ffd166"; ctx.lineWidth = 2;
    ctx.fillRect(-18, -8, 36, 16); ctx.strokeRect(-18, -8, 36, 16);
  } else if (pr.type === 8) {
    ctx.fillStyle = "#006064"; ctx.strokeStyle = "#00f0ff"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(0, 0, 22, 13, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  }
  ctx.restore();
}

/* === 4. MAIN SCENE & HUD FX COMPOSITOR === */
function renderScene() {
  const fac = player ? player.fac : FACTIONS[CHAR_RAW[meta.selChar][1]];
  ctx.fillStyle = fac.bg;
  ctx.fillRect(0, 0, W, H);

  ctx.save();
  const z = opts.zoom;
  const camX = player ? player.x : (performance.now() * 0.02);
  const camY = player ? player.y : 256;
  ctx.translate(W / 2, H / 2);
  ctx.scale(z, z);
  ctx.translate(-camX, -camY);

  ctx.strokeStyle = fac.grid;
  ctx.lineWidth = 2;
  const gx0 = Math.floor((camX - W / z) / 64) * 64, gx1 = camX + W / z;
  const gy0 = Math.floor((camY - H / z) / 64) * 64, gy1 = camY + H / z;
  ctx.beginPath();
  for (let x = gx0; x <= gx1; x += 64) { ctx.moveTo(x, gy0); ctx.lineTo(x, gy1); }
  for (let y = gy0; y <= gy1; y += 64) { ctx.moveTo(gx0, y); ctx.lineTo(gx1, y); }
  ctx.stroke();

  if (player) {
    const bRing = getDistBiome(player.x, player.y);
    if (bRing.id > 0) {
      ctx.fillStyle = bRing.tint;
      ctx.fillRect(gx0, gy0, gx1 - gx0, gy1 - gy0);
    }
  }

  const pcx = Math.floor(camX / 512), pcy = Math.floor(camY / 512);
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      getChunkProps(pcx + dx, pcy + dy).forEach(pr => drawWorldProp(pr, fac));
    }
  }
  movedBarricades.forEach(b => drawWorldProp(b, fac));
  activeForts.forEach(f => {
    ctx.fillStyle = "#5d4037"; ctx.strokeStyle = "#00e676"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(f.x, f.y, f.rad, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  });
  activeMines.forEach(m => {
    ctx.fillStyle = "#ff1744";
    ctx.beginPath(); ctx.arc(m.x, m.y, 5 + Math.sin(runTime * 10) * 1.5, 0, Math.PI * 2); ctx.fill();
  });

  if (player) {
    // Render Black Pixel Drips (1.5px while falling, 2x 3.2px pooled blot on ground)
    ctx.fillStyle = "#05070c";
    for (let i = 0; i < MAX_DRIP; i++) {
      if (!drAct[i]) continue;
      if (drZ[i] > 0) {
        ctx.fillRect(drX[i], drY[i] - drZ[i], 1.6, 1.6);
      } else {
        ctx.fillRect(drX[i] - 1.6, drY[i] - 1.6, 3.2, 3.2);
      }
    }

    ctx.fillStyle = "#00ff88";
    for (let i = 0; i < MAX_O; i++) {
      if (oAct[i]) { ctx.beginPath(); ctx.arc(oX[i], oY[i], 4.5, 0, Math.PI * 2); ctx.fill(); }
    }

    for (let i = 0; i < MAX_E; i++) {
      if (!eAct[i]) continue;
      if (eGrapple[i] > 0) {
        ctx.strokeStyle = "#00f0ff"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(player.x, player.y); ctx.lineTo(eX[i], eY[i]); ctx.stroke();
      }
      if (eType[i] === 98 && eRivalCid[i] >= 0) {
        const rc = CHAR_RAW[eRivalCid[i]];
        drawHeroSprite(eX[i], eY[i], FACTIONS[rc[1]], rc[0], runTime * 10, Math.atan2(player.y - eY[i], player.x - eX[i]), false);
      } else {
        drawEnemyAnatomy(i, fac);
      }
      if (eStun[i] > 0) {
        ctx.strokeStyle = "#ffd166"; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(eX[i], eY[i] - 18, 7, runTime * 6, runTime * 6 + 4); ctx.stroke();
      }
    }

    if (player.hasRepulsor) {
      ctx.strokeStyle = "rgba(255, 209, 102, 0.35)"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(player.x, player.y, 56, 0, Math.PI * 2); ctx.stroke();
    }
    if (flameVisTimer > 0) {
      ctx.fillStyle = "rgba(255, 109, 0, 0.45)";
      ctx.beginPath(); ctx.moveTo(player.x, player.y);
      ctx.arc(player.x, player.y, 120 * player.area, player.aim - 0.6, player.aim + 0.6);
      ctx.closePath(); ctx.fill();
    }
    for (let i = 0; i < MAX_P; i++) {
      if (!pAct[i]) continue;
      const col = pEnemy[i] === 1 ? "#ff1744" : (pSup[i] ? "#ffd166" : fac.c1);
      ctx.strokeStyle = col; ctx.fillStyle = col;
      if (pStyle[i] === 6) {
        ctx.lineWidth = pSup[i] ? 4 : 2.5;
        ctx.beginPath(); ctx.arc(pX[i], pY[i], pRad[i] * (1 - pLife[i]), 0, Math.PI * 2); ctx.stroke();
      } else if (pStyle[i] === 4) {
        ctx.lineWidth = pSup[i] ? 5 : 3;
        ctx.beginPath(); ctx.moveTo(pX[i], pY[i]); ctx.lineTo(pX[i] - pVX[i] * 0.06, pY[i] - pVY[i] * 0.06); ctx.stroke();
      } else {
        ctx.beginPath(); ctx.arc(pX[i], pY[i], pSup[i] ? 7 : 4.5, 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.fillStyle = "#ffd166";
    for (let i = 0; i < MAX_PT; i++) { if (ptAct[i]) ctx.fillRect(ptX[i], ptY[i], 3, 3); }

    drawHeroSprite(player.x, player.y, fac, player.cid, player.walk, player.aim, player.inVehicle);

    ctx.font = "bold 11px sans-serif";
    ctx.textAlign = "center";
    for (let i = 0; i < MAX_D; i++) {
      if (dAct[i]) {
        ctx.fillStyle = dCol[i];
        const txt = dTxt[i] ? dTxt[i] : (dVal[i] + (dCrit[i] ? "!" : ""));
        ctx.fillText(txt, dX[i], dY[i]);
      }
    }
  }
  ctx.restore();

  if (flashAlpha > 0) {
    ctx.fillStyle = `rgba(255,255,255,${flashAlpha})`;
    ctx.fillRect(0, 0, W, H);
  }
  if (joy.act) {
    ctx.strokeStyle = "#00e5ff88"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(joy.ox, joy.oy, opts.joySize, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = "#00e5ffcc";
    ctx.beginPath(); ctx.arc(joy.ox + joy.dx * opts.joySize * 0.8, joy.oy + joy.dy * opts.joySize * 0.8, 15, 0, Math.PI * 2); ctx.fill();
  }
  if (opts.fps) {
    ctx.fillStyle = "#00e676"; ctx.font = "11px monospace"; ctx.textAlign = "left";
    ctx.fillText(fpsCount + " FPS", W - 58, H - 10);
  }
}
