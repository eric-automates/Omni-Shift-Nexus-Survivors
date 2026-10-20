// FILE: js/render.js
// PART: 13 of 14
// DETAIL: 2D Vector Renderer for Heroes (#51 Baba Yaga, #52 Man With No Name, #53 Vet, #54 Slav-1), ChaosMath morphed props/enemies, forts, vehicles, and HUD FX.

"use strict";

/* === 1. HERO & RIVAL VECTOR SPRITE RENDERER (Includes #51-#54 Custom Silhouettes) === */
function drawHeroSprite(x, y, fac, cid, walk, aim, inVehicle = false) {
  ctx.save();
  ctx.translate(x, y);

  // Hovercraft Vehicle Chassis Overlay
  if (inVehicle) {
    ctx.fillStyle = "#102838";
    ctx.strokeStyle = "#00f0ff";
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.ellipse(0, 4, 24, 15, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // Shadow & Animated Stride Feet
  ctx.fillStyle = "rgba(0,0,0,0.45)";
  ctx.beginPath();
  ctx.ellipse(0, 12, 12, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  const stride = Math.sin(walk) * 5;
  ctx.fillStyle = cid === 51 ? "#111111" : "#cfd8dc";
  ctx.fillRect(-7, 7 + stride, 5, 6);
  ctx.fillRect(2, 7 - stride, 5, 6);

  if (cid === 51) {
    // #51 Baba Yaga Suit-Assassin: Tailored Black Suit, White Shirt V, Black Tie & Long Black Hair
    ctx.fillStyle = "#141619";
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(-11, 8); ctx.lineTo(-9, -7); ctx.lineTo(9, -7); ctx.lineTo(11, 8);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#ffffff";
    ctx.beginPath(); ctx.moveTo(-3, -7); ctx.lineTo(3, -7); ctx.lineTo(0, 2); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#00e5ff";
    ctx.fillRect(-1, -5, 2, 7);
    ctx.fillStyle = "#f5d6ba";
    ctx.beginPath(); ctx.arc(0, -10, 6.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#0a0a0c";
    ctx.fillRect(-7, -16, 14, 5);
    ctx.fillRect(-8, -14, 3, 9);
    ctx.fillRect(5, -14, 3, 9);
  } else if (cid === 52) {
    // #52 The Man With No Name: Olive Drab Poncho, Flat Hat, Only Right Arm Extended with Six-Shooter
    ctx.fillStyle = "#6d6546";
    ctx.strokeStyle = "#ffd166";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-14, 9); ctx.lineTo(-10, -7); ctx.lineTo(10, -7); ctx.lineTo(14, 9);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#e0b890";
    ctx.beginPath(); ctx.arc(0, -10, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#4e342e";
    ctx.beginPath(); ctx.ellipse(0, -14, 12, 3.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(-6, -18, 12, 4);
    ctx.rotate(aim);
    ctx.fillStyle = "#6d6546";
    ctx.fillRect(2, 1, 9, 4);
    ctx.fillStyle = "#cfd8dc";
    ctx.fillRect(10, 0, 11, 3.5);
    ctx.restore();
    return;
  } else if (cid === 53) {
    // #53 Green-Beret Last-Stand Vet: Olive Tank/Camo + Iconic Red Headband Tails
    ctx.fillStyle = "#2e4c2b";
    ctx.strokeStyle = "#fff";
    ctx.beginPath();
    ctx.moveTo(-11, 8); ctx.lineTo(-9, -7); ctx.lineTo(9, -7); ctx.lineTo(11, 8);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#eccca2";
    ctx.beginPath(); ctx.arc(0, -10, 6.8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#d50000";
    ctx.fillRect(-7, -13, 14, 3);
    ctx.beginPath(); ctx.moveTo(-7, -12); ctx.lineTo(-14, -8 + stride * 0.5); ctx.lineTo(-12, -5); ctx.closePath(); ctx.fill();
  } else if (cid === 54) {
    // #54 Slav-1 Bounty Tracker: ESB Weathered Green Armor, Jetpack, Red/Black T-Visor & Rangefinder
    ctx.fillStyle = "#607d8b";
    ctx.fillRect(-8, -6, 16, 12);
    ctx.fillStyle = "#3e6b48";
    ctx.strokeStyle = "#ffd166";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-11, 8); ctx.lineTo(-9, -7); ctx.lineTo(9, -7); ctx.lineTo(11, 8);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#3e6b48";
    ctx.beginPath(); ctx.arc(0, -10, 7.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = "#d50000";
    ctx.lineWidth = 2;
    ctx.strokeRect(-5, -12, 10, 3);
    ctx.fillStyle = "#111";
    ctx.fillRect(-5, -12, 10, 2.5);
    ctx.fillRect(-1.5, -10, 3, 5);
    ctx.strokeStyle = "#cfd8dc";
    ctx.beginPath(); ctx.moveTo(6, -12); ctx.lineTo(6, -20); ctx.lineTo(9, -20); ctx.stroke();
  } else {
    // Standard Multiverse Hero Silhouette
    ctx.fillStyle = fac.c1;
    ctx.strokeStyle = opts.hiCon ? "#ffffff" : "#000000";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-11, 8); ctx.lineTo(-9, -7); ctx.lineTo(9, -7); ctx.lineTo(11, 8);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#eceff1";
    ctx.beginPath(); ctx.arc(0, -10, 7, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = fac.c2;
    ctx.fillRect(-5, -12, 10, 3);
    if (cid === 7 || cid === 50) {
      ctx.beginPath(); ctx.moveTo(-12, -14); ctx.lineTo(0, -22); ctx.lineTo(12, -14); ctx.closePath(); ctx.fill();
    }
  }

  ctx.rotate(aim);
  ctx.fillStyle = "#ffd166";
  ctx.fillRect(6, -2, 13, 4);
  ctx.restore();
}

/* === 2. CHAOSMATH MORPHED PROP & INTERACTABLE RENDERER === */
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
    ctx.fillStyle = fac.c2;
    ctx.beginPath(); ctx.arc(0, 0, 6, 0, Math.PI * 2); ctx.fill();
  } else if (pr.type === 3) {
    ctx.fillStyle = "#ffd166";
    ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(12, 0); ctx.lineTo(0, 12); ctx.lineTo(-12, 0); ctx.closePath();
    ctx.fill(); ctx.strokeStyle = "#fff"; ctx.stroke();
  } else if (pr.type === 4) {
    ctx.strokeStyle = "#ff5252"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, 0, 26 + Math.sin(runTime * 6) * 3, 0, Math.PI * 2); ctx.stroke();
  } else if (pr.type === 5) {
    // Settlement Hut
    const pts = ChaosMath.polyPoints(pr.seed, pr.rad, 6, 0.1, 0);
    ctx.fillStyle = "#37474f"; ctx.strokeStyle = "#ffd166"; ctx.lineWidth = 2;
    ctx.beginPath();
    pts.forEach((p, idx) => idx === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#111"; ctx.fillRect(-6, 12, 12, 14);
  } else if (pr.type === 6) {
    // Relic Chest
    ctx.fillStyle = "#4a148c"; ctx.strokeStyle = "#ffd166"; ctx.lineWidth = 2;
    ctx.fillRect(-14, -10, 28, 20); ctx.strokeRect(-14, -10, 28, 20);
    ctx.fillStyle = "#e040fb"; ctx.fillRect(-4, -3, 8, 6);
  } else if (pr.type === 7) {
    // Movable Barricade
    ctx.fillStyle = "#795548"; ctx.strokeStyle = "#ffd166"; ctx.lineWidth = 2;
    ctx.fillRect(-18, -8, 36, 16); ctx.strokeRect(-18, -8, 36, 16);
  } else if (pr.type === 8) {
    // Hovercraft Vehicle
    ctx.fillStyle = "#006064"; ctx.strokeStyle = "#00f0ff"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(0, 0, 22, 13, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  }
  ctx.restore();
}

/* === 3. MAIN SCENE & HUD FX COMPOSITOR === */
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

  // Grid & Distance Sub-Biome Tint
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

  // Chunk Props, Moved Barricades, Forts & Claymore Mines
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
    // Orbs
    ctx.fillStyle = "#00ff88";
    for (let i = 0; i < MAX_O; i++) {
      if (oAct[i]) { ctx.beginPath(); ctx.arc(oX[i], oY[i], 4.5, 0, Math.PI * 2); ctx.fill(); }
    }

    // Mutated Wave Enemies, Sector Bosses & Rival Bounty Hunters
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
        const boss = eType[i] === 99;
        const r = (boss ? 23 : 11) * (1 + Math.min(0.45, (eWave[i] - 1) * 0.04));
        const pts = ChaosMath.polyPoints(eSeed[i], r, 4 + (eType[i] % 4), 0.22, eWave[i] - 1);
        ctx.save();
        ctx.translate(eX[i], eY[i]);
        ctx.rotate(Math.sin(runTime * 8 + i) * 0.15);
        ctx.fillStyle = boss ? "#ffd166" : (eSlow[i] > 0 ? "#40c4ff" : fac.c2);
        ctx.beginPath();
        pts.forEach((p, idx) => idx === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
        ctx.closePath(); ctx.fill();
        if (opts.hiCon) { ctx.strokeStyle = "#000"; ctx.lineWidth = 1.2; ctx.stroke(); }
        ctx.restore();
      }
      if (eStun[i] > 0) {
        ctx.strokeStyle = "#ffd166"; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(eX[i], eY[i] - 16, 7, runTime * 6, runTime * 6 + 4); ctx.stroke();
      }
    }

    // Projectiles, Repulsor Shield & Flamethrower Cone
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
