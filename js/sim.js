// FILE: js/sim.js
// PART: 12 of 14
// DETAIL: v8.2 Overhaul — Per-Weapon Saber Slice Colors, Rival/Boss Weapon Drops & Pickup, Protected Veteran Corpses & Bisected Halves, Biographical Stances, and Allied Minion AI.

"use strict";

const keys = {};
window.addEventListener("keydown", e => { keys[e.code] = true; });
window.addEventListener("keyup", e => { keys[e.code] = false; });

const MAX_BLAST = 32;
const blX = new Float32Array(MAX_BLAST), blY = new Float32Array(MAX_BLAST),
      blRad = new Float32Array(MAX_BLAST), blMaxR = new Float32Array(MAX_BLAST),
      blLife = new Float32Array(MAX_BLAST), blAct = new Uint8Array(MAX_BLAST);
const blCol = new Array(MAX_BLAST).fill("#ff6d00");

/* === 1. BISECTED FALLING TORSO HALVES & CAUTERIZED SLICE SCAR POOLS === */
const MAX_SLICE = 64;
const slX = new Float32Array(MAX_SLICE), slY = new Float32Array(MAX_SLICE),
      slVX = new Float32Array(MAX_SLICE), slVY = new Float32Array(MAX_SLICE),
      slZ = new Float32Array(MAX_SLICE), slVZ = new Float32Array(MAX_SLICE),
      slRot = new Float32Array(MAX_SLICE), slVRot = new Float32Array(MAX_SLICE),
      slCutAng = new Float32Array(MAX_SLICE), slHeat = new Float32Array(MAX_SLICE),
      slRad = new Float32Array(MAX_SLICE), slHalf = new Uint8Array(MAX_SLICE),
      slIsVet = new Uint8Array(MAX_SLICE), slAct = new Uint8Array(MAX_SLICE);
const slBodyCol = new Array(MAX_SLICE).fill("#ff5252");
const slHeadCol = new Array(MAX_SLICE).fill("#90a4ae");
const slGlowCol = new Array(MAX_SLICE).fill("#00f0ff");
let slHead = 0;

const eScarAng = new Float32Array(MAX_E), eScarHeat = new Float32Array(MAX_E),
      eScarOffY = new Float32Array(MAX_E), eScarHitCD = new Float32Array(MAX_E),
      eKneel = new Uint8Array(MAX_E);

/* === 2. 4-STAGE THROWN BLADE IMPALE, KNEEL, FORCE-WIGGLE & RECALL STATE === */
let thrownBlade = {
  active: false, stage: 0, timer: 0, wpnId: 0, isSaber: true,
  x: 0, y: 0, ang: 0, targetIdx: -1, glowCol: "#00f0ff", dmg: 140
};

function launchThrownBladeImpale(w, glowCol) {
  let best = -1, bestScore = -1;
  for (let j = 0; j < MAX_E; j++) {
    if (!eAct[j] || !isEnemyOnScreen(j)) continue;
    const d = Math.hypot(eX[j] - player.x, eY[j] - player.y);
    if (d < 290) {
      const score = (eHP[j] * (eType[j] >= 98 ? 6 : 1)) / (1 + d * 0.015);
      if (score > bestScore) { bestScore = score; best = j; }
    }
  }
  const launchA = best >= 0 ? Math.atan2(eY[best] - player.y, eX[best] - player.x) : player.aim;
  const wCol = (w && w.bladeCol) ? w.bladeCol : (glowCol || "#00f0ff");
  thrownBlade.active = true;
  thrownBlade.stage = 1;
  thrownBlade.timer = 0.28;
  thrownBlade.wpnId = w ? w.id : player.cid;
  thrownBlade.isSaber = ![14, 18, 19, 24, 48, 50, 68].includes(thrownBlade.wpnId);
  thrownBlade.x = player.x + Math.cos(launchA) * 12;
  thrownBlade.y = player.y + Math.sin(launchA) * 12;
  thrownBlade.ang = launchA;
  thrownBlade.targetIdx = best;
  thrownBlade.glowCol = wCol;
  thrownBlade.dmg = (135 + (player.lvl || 1) * 18) * (player.might || 1);
  player.forceHandTimer = 1.15;
  player.forceHandAng = launchA;
  if (typeof sfxWeapon === "function") sfxWeapon("orbit", thrownBlade.wpnId, true);
}

function updateThrownBladeSim(simDt) {
  if (!thrownBlade.active) return;
  const tIdx = thrownBlade.targetIdx;

  if (thrownBlade.stage === 1) {
    thrownBlade.timer -= simDt;
    thrownBlade.ang += simDt * 28;
    const goalX = (tIdx >= 0 && eAct[tIdx]) ? eX[tIdx] : (player.x + Math.cos(player.forceHandAng) * 145);
    const goalY = (tIdx >= 0 && eAct[tIdx]) ? eY[tIdx] : (player.y + Math.sin(player.forceHandAng) * 145);
    const dx = goalX - thrownBlade.x, dy = goalY - thrownBlade.y, d = Math.hypot(dx, dy);

    if (d <= 18 || thrownBlade.timer <= 0) {
      if (tIdx >= 0 && eAct[tIdx]) {
        thrownBlade.stage = 2;
        thrownBlade.timer = 0.58;
        thrownBlade.x = eX[tIdx];
        thrownBlade.y = eY[tIdx];
        thrownBlade.ang = Math.atan2(eY[tIdx] - player.y, eX[tIdx] - player.x);
        eKneel[tIdx] = 1;
        eStun[tIdx] = Math.max(eStun[tIdx], 1.2);
        eScarAng[tIdx] = thrownBlade.ang;
        eScarHeat[tIdx] = 1.0;
        spawnParticles(eX[tIdx], eY[tIdx], 7);
        sfx(240, 95, 0.14, "sawtooth", 0.26);
      } else {
        thrownBlade.stage = 3;
        thrownBlade.timer = 0.28;
      }
    } else {
      const spd = 460 * simDt;
      thrownBlade.x += (dx / d) * Math.min(d, spd);
      thrownBlade.y += (dy / d) * Math.min(d, spd);
    }
  } else if (thrownBlade.stage === 2) {
    thrownBlade.timer -= simDt;
    player.forceHandTimer = 0.25;
    if (tIdx >= 0 && eAct[tIdx]) {
      eKneel[tIdx] = 1;
      eStun[tIdx] = 0.4;
      player.forceHandAng = Math.atan2(eY[tIdx] - player.y, eX[tIdx] - player.x);
      const wiggle = Math.sin(runTime * 62) * 3.2;
      thrownBlade.x = eX[tIdx] + Math.cos(thrownBlade.ang + 1.57) * wiggle * 0.4;
      thrownBlade.y = eY[tIdx] + Math.sin(thrownBlade.ang + 1.57) * wiggle * 0.4;
      eScarHeat[tIdx] = 1.0;
      if (Math.random() < 0.55) spawnParticles(thrownBlade.x, thrownBlade.y, 1);

      if (thrownBlade.timer <= 0) {
        const ripDmg = eType[tIdx] >= 98 ? Math.max(thrownBlade.dmg * 1.8, eMax[tIdx] * 0.35) : (eHP[tIdx] + 999);
        eHP[tIdx] -= ripDmg;
        spawnDmg(eX[tIdx], eY[tIdx], ripDmg, true);
        if (eHP[tIdx] <= 0) {
          killEnemy(tIdx, true, thrownBlade.ang + 0.4, thrownBlade.glowCol);
        } else {
          eKneel[tIdx] = 0;
        }
        sfx(520, 180, 0.12, "sawtooth", 0.25);
        thrownBlade.stage = 3;
        thrownBlade.timer = 0.28;
      }
    } else {
      thrownBlade.stage = 3;
      thrownBlade.timer = 0.25;
    }
  } else {
    thrownBlade.timer -= simDt;
    thrownBlade.ang += simDt * 26;
    const dx = player.x - thrownBlade.x, dy = player.y - thrownBlade.y, d = Math.hypot(dx, dy);
    if (d < 16 || thrownBlade.timer <= 0) {
      thrownBlade.active = false;
      sfx(880, 440, 0.04, "triangle", 0.14);
    } else {
      const spd = 520 * simDt;
      thrownBlade.x += (dx / d) * Math.min(d, spd);
      thrownBlade.y += (dy / d) * Math.min(d, spd);
    }
  }
}

function spawnBisectedBodyHalves(x, y, cutAngle, baseR, bodyCol, glowCol, headCol = null, isVet = false) {
  const normA = cutAngle + Math.PI * 0.5;
  for (let h = 0; h < 2; h++) {
    let idx = slHead;
    // Protect Veteran (Rival/Boss) bisected halves from being overwritten by regular henchmen!
    for (let tries = 0; tries < MAX_SLICE; tries++) {
      const cand = (slHead + tries) % MAX_SLICE;
      if (!slAct[cand] || !slIsVet[cand] || isVet) {
        idx = cand;
        slHead = (cand + 1) % MAX_SLICE;
        break;
      }
    }
    const dir = h === 0 ? -1 : 1;
    slX[idx] = x + Math.cos(normA) * dir * 3;
    slY[idx] = y + Math.sin(normA) * dir * 3;
    slVX[idx] = Math.cos(normA) * dir * (28 + Math.random() * 18) + Math.cos(cutAngle) * 14;
    slVY[idx] = Math.sin(normA) * dir * (28 + Math.random() * 18) + Math.sin(cutAngle) * 14;
    slZ[idx] = h === 0 ? 6 : 2;
    slVZ[idx] = h === 0 ? 42 : 18;
    slRot[idx] = 0;
    slVRot[idx] = dir * (2.6 + Math.random() * 2.2);
    slCutAng[idx] = cutAngle;
    slHeat[idx] = 1.0;
    slRad[idx] = baseR;
    slHalf[idx] = h;
    slIsVet[idx] = isVet ? 1 : 0;
    slBodyCol[idx] = bodyCol;
    slHeadCol[idx] = headCol || bodyCol;
    slGlowCol[idx] = glowCol;
    slAct[idx] = 1;
  }
}

function spawnBlastWave(x, y, maxRadius = 68, color = "#ff6d00") {
  for (let i = 0; i < MAX_BLAST; i++) {
    if (!blAct[i]) {
      blX[i] = x; blY[i] = y; blRad[i] = 6;
      blMaxR[i] = maxRadius; blLife[i] = 0.38;
      blCol[i] = color; blAct[i] = 1;
      return;
    }
  }
}

function triggerRocketDetonation(x, y, dmg, blastRadius) {
  spawnBlastWave(x, y, blastRadius, "#ff6d00");
  spawnParticles(x, y, 12);
  sfx(120, 45, 0.28, "sawtooth", 0.32);
  for (let j = 0; j < MAX_E; j++) {
    if (!eAct[j]) continue;
    const d = Math.hypot(eX[j] - x, eY[j] - y);
    if (d <= blastRadius) {
      const splash = dmg * 1.35 * (1 - (d / blastRadius) * 0.45);
      eHP[j] -= splash;
      eStun[j] = Math.max(eStun[j], 0.85);
      spawnDmg(eX[j], eY[j], splash, true);
      if (eHP[j] <= 0) killEnemy(j, false);
    }
  }
}

function killEnemy(idx, wasHeadshot = false, sliceAngle = null, glowCol = "#00f0ff") {
  if (!eAct[idx]) return;
  const ex = eX[idx], ey = eY[idx], et = eType[idx], rCid = eRivalCid[idx];
  eAct[idx] = 0;
  eKneel[idx] = 0;
  if (typeof eLevitate !== "undefined") { eLevitate[idx] = 0; eLevZ[idx] = 0; }
  player.kills++;

  if (player.cid === 33 && Math.hypot(ex - player.x, ey - player.y) <= 95) player.hp = Math.min(player.maxHp, player.hp + 1.5);
  if ([3, 75, 76, 77].includes(player.cid)) player.hp = Math.min(player.maxHp, player.hp + 0.9);
  if (player.cid === 11 && player.kills % 10 === 0) player.hp = Math.min(player.maxHp, player.hp + 3.0);

  // Resolve exact Rival / Boss outfit colors so their corpse & severed halves match their live look!
  let bodyCol = et === 99 ? "#ff1744" : (eFormType[idx] === 1 ? "#ffd166" : (player.fac ? player.fac.c2 : "#ff5252"));
  let headCol = et === 99 ? "#ffff00" : (player.fac ? player.fac.c1 : "#90a4ae");

  if (et === 98 && rCid >= 0 && typeof CHAR_RAW !== "undefined" && CHAR_RAW[rCid]) {
    const rFac = FACTIONS[CHAR_RAW[rCid][1]] || player.fac || FACTIONS[0];
    const out = typeof getOutfit === "function" ? getOutfit(rCid) : { head: 0, torso: 0 };
    const pal = typeof getHeroOutfits === "function" ? getHeroOutfits(rCid) : null;
    headCol = (pal && pal.head && pal.head[out.head || 0]) ? pal.head[out.head || 0][1] : rFac.c1;
    bodyCol = (pal && pal.torso && pal.torso[out.torso || 0]) ? pal.torso[out.torso || 0][1] : rFac.c2;
  }

  // Rival Bounty Hunter & Boss Signature Weapon Drop on Death!
  if (et >= 98) {
    const dropWpnId = (et === 98 && rCid >= 0) ? rCid : Math.floor(Math.random() * CHAR_RAW.length);
    if (typeof spawnWeaponDrop === "function") {
      spawnWeaponDrop(ex, ey, dropWpnId);
    } else if (typeof activeWeaponDrops !== "undefined" && CHAR_RAW[dropWpnId]) {
      activeWeaponDrops.push({
        x: ex, y: ey, wpnId: dropWpnId,
        name: CHAR_RAW[dropWpnId][4], superName: CHAR_RAW[dropWpnId][5], style: CHAR_RAW[dropWpnId][6],
        bladeCol: typeof getWeaponColor === "function" ? getWeaponColor(dropWpnId) : "#00f0ff",
        spawnTime: runTime || 0
      });
    }
    const dropName = CHAR_RAW[dropWpnId] ? CHAR_RAW[dropWpnId][4] : "Signature Weapon";
    spawnSpeech(ex, ey - 10, `WEAPON DROPPED: ${dropName.toUpperCase()}!`, "#ffd166", 3.0);
  }

  if (sliceAngle !== null) {
    const baseR = et === 99 ? 20 : (et === 98 ? 13 : (et === 3 ? 14 : 11));
    spawnBisectedBodyHalves(ex, ey, sliceAngle, baseR, bodyCol, glowCol, headCol, et >= 98);
    if (player.cid === 75 || et >= 98) {
      spawnCorpse(ex, ey, eSeed[idx], et, eLegsLost[idx], eArmsLost[idx], bodyCol, headCol, rCid);
    }
  } else {
    spawnCorpse(ex, ey, eSeed[idx], et, eLegsLost[idx], eArmsLost[idx], bodyCol, headCol, rCid);
    if (wasHeadshot) spawnGroundLimb(ex, ey - 8, headCol, 2);
  }

  spawnParticles(ex, ey, 6);
  const xpVal = et === 99 ? 120 : (et === 98 ? 65 : (3.2 + waveNum * 0.55));
  spawnOrb(ex, ey, xpVal);
  if (et >= 98 && typeof grantRelic === "function") grantRelic();
  if (player.kills % 10 === 0 && typeof updateHUD === "function") updateHUD();
}

/* === 3. ALLIED MINION AI SIMULATION === */
function updateMinionsSim(simDt) {
  if (typeof mAct === "undefined") return;
  for (let m = 0; m < MAX_MINION; m++) {
    if (!mAct[m]) continue;
    mLife[m] -= simDt;
    if (mLife[m] <= 0 || mHP[m] <= 0) {
      mAct[m] = 0;
      spawnParticles(mX[m], mY[m], 4);
      continue;
    }
    if (mAtkCD[m] > 0) mAtkCD[m] = Math.max(0, mAtkCD[m] - simDt);

    let bestE = -1, bestD = 360;
    for (let j = 0; j < MAX_E; j++) {
      if (!eAct[j] || (typeof eLevitate !== "undefined" && eLevitate[j] > 0)) continue;
      const d = Math.hypot(eX[j] - mX[m], eY[j] - mY[m]);
      if (d < bestD) { bestD = d; bestE = j; }
    }

    const kind = mKind[m];
    if (bestE >= 0) {
      const dx = eX[bestE] - mX[m], dy = eY[bestE] - mY[m], d = Math.hypot(dx, dy) || 1;
      const ang = Math.atan2(dy, dx);

      if (kind === 2) {
        if (d > 135) {
          mVX[m] = (dx / d) * mSpd[m]; mVY[m] = (dy / d) * mSpd[m];
          mX[m] += mVX[m] * simDt; mY[m] += mVY[m] * simDt;
          mWalk[m] += simDt * 7;
        } else if (d < 75) {
          mVX[m] = -(dx / d) * mSpd[m] * 0.65; mVY[m] = -(dy / d) * mSpd[m] * 0.65;
          mX[m] += mVX[m] * simDt; mY[m] += mVY[m] * simDt;
          mWalk[m] += simDt * 5;
        }
        if (mAtkCD[m] <= 0) {
          mAtkCD[m] = 0.82;
          spawnProj(mX[m], mY[m], Math.cos(ang) * 380, Math.sin(ang) * 380, mDmg[m], 0.85, 5, 1, 4, 0, 0, 75);
          sfx(640, 280, 0.04, "triangle", 0.09);
        }
      } else {
        const eRad = eType[bestE] === 99 ? 22 : 12;
        const reach = mRad[m] + eRad + 6;
        if (d > reach * 0.85) {
          mVX[m] = (dx / d) * mSpd[m]; mVY[m] = (dy / d) * mSpd[m];
          mX[m] += mVX[m] * simDt; mY[m] += mVY[m] * simDt;
          mWalk[m] += simDt * (kind === 1 ? 11 : 7.5);
        }
        if (d <= reach && mAtkCD[m] <= 0) {
          mAtkCD[m] = kind === 1 ? 0.34 : (kind === 4 ? 0.92 : 0.52);
          if (kind === 4) {
            spawnBlastWave(mX[m], mY[m], 62, mCol[m]);
            sfx(110, 42, 0.18, "sawtooth", 0.24);
            for (let k = 0; k < MAX_E; k++) {
              if (!eAct[k]) continue;
              const dk = Math.hypot(eX[k] - mX[m], eY[k] - mY[m]);
              if (dk <= 64) {
                eHP[k] -= mDmg[m];
                eStun[k] = Math.max(eStun[k], 0.85);
                spawnDmg(eX[k], eY[k], mDmg[m], true);
                if (eHP[k] <= 0) killEnemy(k, false);
              }
            }
          } else {
            eHP[bestE] -= mDmg[m];
            eScarAng[bestE] = ang + 0.4;
            eScarHeat[bestE] = 0.85;
            if (kind === 1) { eBleed[bestE] = 1; eBleedRate[bestE] = eMax[bestE] * 0.08; eSlow[bestE] = 1.5; }
            if ((kind === 0 || kind === 3) && Math.random() < 0.28 && eArmsLost[bestE] < 2) {
              eArmsLost[bestE]++;
              spawnGroundLimb(eX[bestE], eY[bestE], "#ff5252", 1);
            }
            spawnDmg(eX[bestE], eY[bestE], mDmg[m], kind === 3);
            sfx(260, 110, 0.045, "triangle", 0.11);
            if (eHP[bestE] <= 0) killEnemy(bestE, false, (kind === 0 || kind === 3) ? ang : null, mCol[m]);
          }
          mHP[m] -= (eType[bestE] >= 98 ? 14 : 5);
        }
      }
    } else {
      const formAng = (m * 1.15) + runTime * 0.8;
      const gx = player.x + Math.cos(formAng) * 44, gy = player.y + Math.sin(formAng) * 44;
      const dx = gx - mX[m], dy = gy - mY[m], d = Math.hypot(dx, dy);
      if (d > 8) {
        mVX[m] = (dx / d) * mSpd[m] * 0.8; mVY[m] = (dy / d) * mSpd[m] * 0.8;
        mX[m] += mVX[m] * simDt; mY[m] += mVY[m] * simDt;
        mWalk[m] += simDt * 6;
      }
    }
  }
}

/* === 4. REAL-TIME PHYSICAL BLADE SLICING (GUARANTEED LIMB SEVER + TORSO BISECTION) === */
function checkBladeSegmentSlice(hx, hy, tx, ty, w, bladeSweepAngle, glowCol) {
  const segDX = tx - hx, segDY = ty - hy;
  const segLenSq = segDX * segDX + segDY * segDY;
  if (segLenSq < 1) return;

  const isPlasmaSaber = ![18, 19, 24, 48, 50, 67, 71].includes(w.id);
  const visorBonus = (player.activeVisor && player.activeVisor > 0) ? 0.10 : 0;

  for (let j = 0; j < MAX_E; j++) {
    if (!eAct[j] || eScarHitCD[j] > 0) continue;
    const eRad = eType[j] === 99 ? 22 : (eType[j] === 3 ? 15 : 11);
    const ex = eX[j], ey = eY[j];

    let t = ((ex - hx) * segDX + (ey - hy) * segDY) / segLenSq;
    t = Math.max(0, Math.min(1, t));
    const cx = hx + t * segDX, cy = hy + t * segDY;
    const dist = Math.hypot(ex - cx, ey - cy);
    if (dist > eRad + 4.5) continue;

    eScarHitCD[j] = w.id === 77 ? 0.14 : 0.20;
    player.combatAlertTimer = 1.6;
    const relX = Math.max(-0.95, Math.min(0.95, (cx - ex) / eRad));
    const relY = Math.max(-0.95, Math.min(0.95, (cy - ey) / eRad));
    recordShotImpact(relX, relY, 1, eType[j], relY < -0.35 ? 2 : 1);

    eScarAng[j] = bladeSweepAngle;
    eScarHeat[j] = 1.0;
    eScarOffY[j] = (cy - ey) * 0.55;

    const isCrit = Math.random() < ((player.crit || 0.08) + visorBonus + (w.lvl * 0.04));
    const isBossOrRival = eType[j] >= 98;
    const ignoresShields = (w.id === 76 || w.id === 78);
    const hasHeavyShield = !ignoresShields && (eFormType[j] === 1 || eType[j] === 3) && !isCrit && eArmsLost[j] === 0;

    if (typeof sfxWeapon === "function") sfxWeapon("orbit", w.id, true);

    if (!isBossOrRival && !hasHeavyShield) {
      if (Math.abs(relX) > 0.52 && eArmsLost[j] < 2) {
        eArmsLost[j]++;
        eBleed[j] = 1; eBleedRate[j] = eMax[j] * 0.14;
        spawnGroundLimb(ex + (relX > 0 ? 9 : -9), ey, isPlasmaSaber ? "#263238" : "#ff1744", 1);
        const limbDmg = eMax[j] * 0.65;
        eHP[j] -= limbDmg;
        spawnDmg(ex, ey, limbDmg, true, true);
        if (eHP[j] <= 0) killEnemy(j, false, bladeSweepAngle, glowCol);
      } else if (relY > 0.42 && eLegsLost[j] < 2) {
        eLegsLost[j]++;
        eBleed[j] = 1; eBleedRate[j] = eMax[j] * 0.16;
        spawnGroundLimb(ex, ey + 8, isPlasmaSaber ? "#263238" : "#ff1744", 0);
        const legDmg = eMax[j] * 0.65;
        eHP[j] -= legDmg;
        spawnDmg(ex, ey, legDmg, true, true);
        if (eHP[j] <= 0) killEnemy(j, false, bladeSweepAngle, glowCol);
      } else {
        const fatalDmg = Math.max(eHP[j] + 10, (55 + w.lvl * 16) * player.might * 2.5);
        spawnDmg(ex, ey, fatalDmg, true);
        eHP[j] = 0;
        killEnemy(j, relY < -0.35, bladeSweepAngle, glowCol);
      }
    } else {
      if (eArmsLost[j] < 2 && !isBossOrRival) {
        eArmsLost[j]++;
        eFormType[j] = 0;
        eBleed[j] = 1; eBleedRate[j] = eMax[j] * 0.12;
        spawnGroundLimb(ex + (relX >= 0 ? 9 : -9), ey, "#ffd166", 1);
      }
      if (w.id === 78) eShred[j] = Math.min(12, eShred[j] + 4);
      const baseDmg = (42 + w.lvl * 14) * (w.lvl >= 5 ? 1.35 : 1.0) * player.might * (isCrit ? player.cdmg : 1.0) * (isBossOrRival ? (player.bossMul || 1.0) : 1.0);
      eHP[j] -= baseDmg;
      spawnDmg(ex, ey, baseDmg, isCrit, true);
      spawnParticles(cx, cy, 4);
      const kb = (isBossOrRival ? 4 : 10) * (player.kb || 1.0);
      const ka = Math.atan2(ey - player.y, ex - player.x);
      eX[j] += Math.cos(ka) * kb;
      eY[j] += Math.sin(ka) * kb;
      if (eHP[j] <= 0) killEnemy(j, relY < -0.35, bladeSweepAngle, glowCol);
    }
  }
}

function hitTestPlayerProj(i) {
  for (let j = 0; j < MAX_E; j++) {
    if (!eAct[j]) continue;
    const eRad = eType[j] === 99 ? 24 : (eType[j] === 3 ? 17 : 13);
    const dx = pX[i] - eX[j], dy = pY[i] - eY[j];
    if (Math.hypot(dx, dy) > pRad[i] + eRad) continue;

    if (pStyle[i] === 2) {
      triggerRocketDetonation(pX[i], pY[i], pDmg[i], Math.max(58, pRad[i] * 5.2));
      pAct[i] = 0;
      return;
    }

    const nx = Math.max(-0.95, Math.min(0.95, dx / eRad));
    const ny = Math.max(-0.95, Math.min(0.95, dy / eRad));
    const isHead = ny < -0.38 && Math.abs(nx) < 0.48;
    const isLeg = ny > 0.32;
    const isArm = !isHead && !isLeg && Math.abs(nx) > 0.42;
    const atkType = (pStyle[i] === 8 || pStyle[i] === 7) ? 1 : 0;
    recordShotImpact(nx, ny, atkType, eType[j], isHead ? 2 : 1);

    if (eFormType[j] === 1 && !isHead && pStyle[i] !== 8 && pSup[i] !== 3 && Math.random() < 0.38) {
      if (typeof sfxRicochet === "function") sfxRicochet();
      pVX[i] = -pVX[i] * 0.7; pVY[i] = -pVY[i] * 0.7;
      pPrc[i]--;
      if (pPrc[i] < 0) pAct[i] = 0;
      return;
    }

    if (pSup[i] === 3 && eType[j] < 98) {
      const avadaDmg = Math.max(eHP[j] + 999, pDmg[i] * 3.0);
      eHP[j] = 0;
      spawnDmg(eX[j], eY[j], avadaDmg, true);
      spawnParticles(eX[j], eY[j], 10);
      killEnemy(j, true);
      pPrc[i]--;
      if (pPrc[i] < 0) pAct[i] = 0;
      return;
    }

    const visorBonus = (player.activeVisor && player.activeVisor > 0) ? 0.10 : 0;
    const vatsGuaranteed = (player.cid === 43 && player.vatsTimer > 0);
    const isCrit = isHead || vatsGuaranteed || (Math.random() < ((player.crit || 0.08) + visorBonus));
    const bossBoost = eType[j] >= 98 ? (player.bossMul || 1.0) : 1.0;
    const finalDmg = pDmg[i] * (isCrit ? (player.cdmg || 1.75) : 1.0) * bossBoost * (1 + eShred[j] * 0.04);

    eHP[j] -= finalDmg;
    if (player.shred > 0) eShred[j] = Math.min(12, eShred[j] + player.shred * 5);
    if (player.slow > 0) eSlow[j] = 2.2;
    spawnDmg(eX[j], eY[j], finalDmg, isCrit, isLeg || isArm);
    sfx(170, 55, 0.045, "triangle", 0.14);

    if (pStyle[i] === 8) {
      eScarAng[j] = pVX[i];
      eScarHeat[j] = 0.9;
      eScarOffY[j] = ny * 6;
    }

    if (isLeg && eLegsLost[j] < 2) {
      eLegDmg[j] += finalDmg;
      if (eLegDmg[j] > eMax[j] * (pStyle[i] === 8 ? 0.16 : 0.26)) {
        eLegDmg[j] = 0; eLegsLost[j]++;
        eBleed[j] = 1; eBleedRate[j] = eMax[j] * 0.09;
        spawnGroundLimb(eX[j], eY[j] + 8, "#ff1744", 0);
      }
    } else if (isArm && eArmsLost[j] < 2) {
      eTailDmg[j] += finalDmg;
      if (eTailDmg[j] > eMax[j] * (pStyle[i] === 8 ? 0.16 : 0.24)) {
        eTailDmg[j] = 0; eArmsLost[j]++;
        eBleed[j] = 1; eBleedRate[j] = eMax[j] * 0.08;
        spawnGroundLimb(eX[j] + (nx > 0 ? 9 : -9), eY[j], "#ff5252", 1);
      }
    }

    const ka = Math.atan2(eY[j] - player.y, eX[j] - player.x);
    const kbDist = (eType[j] === 99 ? 2 : 7) * (player.kb || 1.0);
    eX[j] += Math.cos(ka) * kbDist;
    eY[j] += Math.sin(ka) * kbDist;

    if (eHP[j] <= 0) {
      killEnemy(j, isHead, pStyle[i] === 8 ? pVX[i] : null, "#ff9100");
    }

    if (pBounce[i] > 0 && pStyle[i] !== 8) {
      pBounce[i]--;
      let nextE = -1, nextD = 180;
      for (let k = 0; k < MAX_E; k++) {
        if (k !== j && eAct[k]) {
          const dk = Math.hypot(eX[k] - pX[i], eY[k] - pY[i]);
          if (dk < nextD) { nextD = dk; nextE = k; }
        }
      }
      if (nextE >= 0) {
        const spd = Math.hypot(pVX[i], pVY[i]) || 380;
        const ba = Math.atan2(eY[nextE] - pY[i], eX[nextE] - pX[i]);
        pVX[i] = Math.cos(ba) * spd;
        pVY[i] = Math.sin(ba) * spd;
        if (typeof sfxRicochet === "function") sfxRicochet();
        return;
      }
    }

    pPrc[i]--;
    if (pPrc[i] < 0) {
      pAct[i] = 0;
      return;
    }
  }
}

/* === 5. MASTER SIMULATION STEP (60 FPS) === */
function updateSim(rawDt) {
  const t0 = performance.now();
  if (typeof updateThemeMusic === "function") updateThemeMusic(rawDt);
  if (!runActive || runPaused || !player) return;

  // Pick up dropped Rival / Boss Signature Weapons from the battlefield!
  if (typeof activeWeaponDrops !== "undefined" && activeWeaponDrops.length > 0) {
    for (let w = activeWeaponDrops.length - 1; w >= 0; w--) {
      const drop = activeWeaponDrops[w];
      if (Math.hypot(player.x - drop.x, player.y - drop.y) < 34) {
        const rc = CHAR_RAW[drop.wpnId] || CHAR_RAW[0];
        const existingWpn = player.weapons.find(pw => pw.id === drop.wpnId);
        if (existingWpn) {
          existingWpn.lvl = Math.min(10, existingWpn.lvl + 2);
          existingWpn.enabled = true;
          spawnSpeech(player.x, player.y - 18, `UPGRADED ${rc[4].toUpperCase()} (LV.${existingWpn.lvl})!`, "#ffd166", 2.8);
        } else {
          const wCol = drop.bladeCol || (typeof getWeaponColor === "function" ? getWeaponColor(drop.wpnId) : "#00f0ff");
          player.weapons.push({
            id: drop.wpnId,
            name: rc[4],
            superName: rc[5],
            style: rc[6],
            lvl: 1,
            cd: 0,
            ang: 0,
            angVel: 0,
            enabled: true,
            evolvedLv5: false,
            bladeCol: wCol
          });
          if (rc[6] === "orbit" || (typeof isSwordWeapon === "function" && isSwordWeapon(drop.wpnId))) {
            player.hasSaber = true;
            player.saberMastery = Math.max(20, player.saberMastery || 0);
          }
          const en = player.weapons.filter(pw => pw.enabled !== false);
          player.handSlotOffset = Math.max(0, en.length - 1);
          player.swapTimer = 0;
          spawnSpeech(player.x, player.y - 18, `CLAIMED RIVAL WEAPON: ${rc[4].toUpperCase()}!`, drop.bladeCol || "#00e676", 2.8);
        }
        sfx(440, 880, 0.22, "triangle");
        activeWeaponDrops.splice(w, 1);
        if (typeof updateHUD === "function") updateHUD();
      }
    }
  }

  const simDt = rawDt * timeScale;
  runTime += simDt;
  totalRunTime += rawDt;
  orbWarpTimer += simDt;
  if (orbWarpTimer >= 600) {
    orbWarpTimer = 0;
    if (typeof compressOffscreenOrbsToChest === "function") compressOffscreenOrbsToChest();
  }

  const newWave = 1 + Math.floor(runTime / 30);
  if (newWave > waveNum) { waveNum = newWave; sfx(240, 520, 0.18, "triangle", 0.18); }

  if (flameVisTimer > 0) flameVisTimer = Math.max(0, flameVisTimer - simDt);
  if (muzzleFlashTimer > 0) muzzleFlashTimer = Math.max(0, muzzleFlashTimer - simDt);
  if (player.recoilKick > 0) player.recoilKick = Math.max(0, player.recoilKick - simDt * 6.5);
  if (player.regen > 0 && player.hp < player.maxHp) player.hp = Math.min(player.maxHp, player.hp + player.regen * simDt);

  if ((player.acrobatZ || 0) > 0 || (player.acrobatVZ || 0) !== 0) {
    player.acrobatZ = Math.max(0, (player.acrobatZ || 0) + (player.acrobatVZ || 0) * simDt);
    player.acrobatVZ = (player.acrobatVZ || 0) - 185 * simDt;
    if (player.acrobatZ <= 0) {
      player.acrobatZ = 0;
      player.acrobatVZ = 0;
      player.acrobatFlip = 0;
    } else if (player.acrobatFlip > 0) {
      player.acrobatFlip = Math.max(0, player.acrobatFlip - simDt * 18);
    }
  }

  let mx = joy.act ? joy.dx : 0, my = joy.act ? joy.dy : 0;
  if (keys["KeyW"] || keys["ArrowUp"]) my -= 1;
  if (keys["KeyS"] || keys["ArrowDown"]) my += 1;
  if (keys["KeyA"] || keys["ArrowLeft"]) mx -= 1;
  if (keys["KeyD"] || keys["ArrowRight"]) mx += 1;

  const mag = Math.hypot(mx, my);
  if (mag > 1) { mx /= mag; my /= mag; }

  const legFactor = 0.35 + 0.65 * ((player.limbs[4] + player.limbs[5]) / 200);
  const legImbalance = (player.limbs[4] - player.limbs[5]) / 100;
  const vehBoost = (typeof player.vehBoostMul === "number") ? player.vehBoostMul : 1.0;
  const vehMul = player.inVehicle === 1 ? (1.42 * vehBoost) : (player.inVehicle === 2 ? 0.88 : 1.0);
  const rushSpdMul = (player.overclockTimer > 0 ? 2.0 : 1.0) * (player.sandTimer > 0 ? 1.8 : 1.0);
  const effSpd = (player.spd || 110) * legFactor * vehMul * rushSpdMul * (player.guardZone >= 0 ? 0.82 : 1.0);

  if (mag > 0.04) {
    const moveAng = Math.atan2(my, mx) + legImbalance * 0.28;
    const vx = Math.cos(moveAng) * effSpd * Math.min(1, mag);
    const vy = Math.sin(moveAng) * effSpd * Math.min(1, mag);
    player.vx = vx; player.vy = vy; player.moveDir = moveAng;
    player.walk += simDt * (6.5 + effSpd * 0.025);
    const targetBank = Math.max(-0.32, Math.min(0.32, (vx / Math.max(1, effSpd)) * 0.26));
    player.bankTilt = (player.bankTilt || 0) * 0.82 + targetBank * 0.18;

    const nx = player.x + vx * simDt, ny = player.y + vy * simDt;
    const ignoreLow = player.hover || (player.acrobatZ > 4) || player.inVehicle > 0 || [1, 16, 21, 25, 47, 54, 70, 73, 74, 79].includes(player.cid);
    if (typeof isPointBlockedByObstacle !== "function" || !isPointBlockedByObstacle(nx, player.y, ignoreLow)) player.x = nx;
    if (typeof isPointBlockedByObstacle !== "function" || !isPointBlockedByObstacle(player.x, ny, ignoreLow)) player.y = ny;

    if ([1, 16, 25, 47, 54].includes(player.cid) && Math.random() < 0.45) {
      spawnParticles(player.x - Math.cos(moveAng) * 10, player.y + 8, 1);
    }
  } else {
    player.vx = 0; player.vy = 0;
    player.bankTilt = (player.bankTilt || 0) * 0.82;
  }

  let aimTarget = -1, bestAimDist = 380;
  for (let j = 0; j < MAX_E; j++) {
    if (eAct[j] && isEnemyOnScreen(j)) {
      const d = Math.hypot(eX[j] - player.x, eY[j] - player.y);
      if (d < bestAimDist) { bestAimDist = d; aimTarget = j; }
    }
  }

  if (player.cid === 79 && aimTarget >= 0 && bestAimDist < 82) {
    if ((player.acrobatZ || 0) <= 0.5) {
      player.acrobatVZ = 44;
      player.acrobatFlip = Math.PI * 2;
    }
    const orbitTan = Math.atan2(eY[aimTarget] - player.y, eX[aimTarget] - player.x) + Math.PI * 0.5;
    const ox = player.x + Math.cos(orbitTan) * 95 * simDt;
    const oy = player.y + Math.sin(orbitTan) * 95 * simDt;
    if (typeof isPointBlockedByObstacle !== "function" || !isPointBlockedByObstacle(ox, oy, true)) {
      player.x = ox; player.y = oy;
    }
  }

  const desiredAim = (player.deflectStanceTimer > 0)
    ? player.deflectAng
    : (aimTarget >= 0
      ? Math.atan2(eY[aimTarget] - player.y, eX[aimTarget] - player.x)
      : (typeof player.moveDir === "number" ? player.moveDir : (player.aim || 0)));
  let aimDiff = desiredAim - (player.aim || 0);
  while (aimDiff > Math.PI) aimDiff -= Math.PI * 2;
  while (aimDiff < -Math.PI) aimDiff += Math.PI * 2;
  player.aim = (player.aim || 0) + aimDiff * Math.min(1, simDt * (player.deflectStanceTimer > 0 ? 28 : 14));

  const out = typeof getOutfit === "function" ? getOutfit(player.cid) : { blade: 0 };
  const pal = typeof getHeroOutfits === "function" ? getHeroOutfits(player.cid) : null;
  const bladeGlowCol = (pal && pal.blade && pal.blade[out.blade || 0]) ? pal.blade[out.blade || 0][1] : (player.fac ? player.fac.c1 : "#00f0ff");

  if (player.whirlwindTimer > 1.05 && !thrownBlade.active && ![55, 77, 79].includes(player.cid)) {
    player.whirlwindTimer = 0;
    const w0 = player.weapons[0];
    const w0Col = (w0 && w0.id !== player.cid && w0.bladeCol) ? w0.bladeCol : bladeGlowCol;
    launchThrownBladeImpale(w0, w0Col);
  }
  updateThrownBladeSim(simDt);
  updateMinionsSim(simDt);

  if (typeof activeBarriers !== "undefined") {
    for (let b = activeBarriers.length - 1; b >= 0; b--) {
      const br = activeBarriers[b];
      br.life -= simDt;
      if (br.life <= 0) {
        activeBarriers.splice(b, 1);
        continue;
      }
      for (let j = 0; j < MAX_E; j++) {
        if (!eAct[j]) continue;
        const dx = eX[j] - br.x, dy = eY[j] - br.y, d = Math.hypot(dx, dy) || 1;
        if (d < br.rad + 14) {
          eX[j] = br.x + (dx / d) * (br.rad + 18);
          eY[j] = br.y + (dy / d) * (br.rad + 18);
          eStun[j] = Math.max(eStun[j], 0.45);
          eHP[j] -= 42 * (player.might || 1) * simDt;
          if (eHP[j] <= 0) killEnemy(j, false);
        }
      }
    }
  }

  /* === v8.0 BIOGRAPHICAL EARLY-TO-PRIME STANCE & DEFLECTION ENGINE === */
  const primaryWpn = player.weapons[0] || { id: player.cid, lvl: 1 };
  const isDeflectingNow = (player.deflectStanceTimer || 0) > 0;
  const stanceSpec = typeof getHeroStanceSpec === "function"
    ? getHeroStanceSpec(player.cid, primaryWpn.lvl, isDeflectingNow)
    : { pattern: 2, speedMul: 1.2, arcWidth: 1.0, wristAmp: 0.7, isDoubleBlade: false, isAcrobaticLeaper: false };

  player.activeStanceName = stanceSpec.stageName;
  const enemyCloseBoost = (aimTarget >= 0 && bestAimDist < 78) ? 1.45 : 1.0;
  const fRate = (player.whirlwindTimer > 0 ? 15.5 : (3.6 * stanceSpec.speedMul)) * enemyCloseBoost;
  player.flourishPhase = (player.flourishPhase || 0) + simDt * fRate;

  const enabledWpns = player.weapons.filter(w => w.enabled !== false);
  const armCap = player.armCap || 2;
  if (enabledWpns.length > armCap) {
    player.swapTimer = (player.swapTimer || 0) + simDt;
    if (player.swapTimer >= 2.65) {
      player.swapTimer = 0;
      player.handSlotOffset = ((player.handSlotOffset || 0) + 1) % enabledWpns.length;
      player.swapPause = 0.24;
      sfx(1180, 440, 0.038, "triangle", 0.11);
    }
  } else player.handSlotOffset = 0;

  if (player.swapPause > 0) player.swapPause = Math.max(0, player.swapPause - simDt);

  const reaverCdr = player.cid === 17 ? (1 - 0.38 * (1 - Math.max(0, player.hp / Math.max(1, player.maxHp)))) : 1.0;
  const hasteCdr = (player.overclockTimer > 0 ? 0.5 : 1.0) * (player.sandTimer > 0 ? 0.55 : 1.0) * reaverCdr;

  const activeSlots = Math.min(armCap, enabledWpns.length);
  for (let s = 0; s < activeSlots; s++) {
    const w = enabledWpns[(player.handSlotOffset + s) % enabledWpns.length];
    const isMeleeBlade = (typeof isSwordWeapon === "function" && isSwordWeapon(w.id)) || (w.style === "orbit" && ![12, 16, 29, 35, 44, 73].includes(w.id));

    if (s === 0 && thrownBlade.active && isMeleeBlade) continue;

    // Each weapon uses its own independent canonical bladeCol (while primary weapon respects your Outfit Customizer)!
    const wBladeCol = (w.id === player.cid)
      ? bladeGlowCol
      : (w.bladeCol || (typeof getWeaponColor === "function" ? getWeaponColor(w.id) : bladeGlowCol));

    const wStance = typeof getHeroStanceSpec === "function"
      ? getHeroStanceSpec(w.id, w.lvl, isDeflectingNow && s === 0)
      : stanceSpec;
    const pat = (player.whirlwindTimer > 0) ? 7 : wStance.pattern;
    const ph = player.flourishPhase + s * 1.85;

    if (isMeleeBlade) {
      let flourishOffset = 0;
      let wristSpin = 0;

      if (pat === 0) {
        flourishOffset = Math.sin(ph) * (0.95 * wStance.arcWidth);
        wristSpin = Math.cos(ph) * (0.45 * wStance.wristAmp);
      } else if (pat === 1) {
        flourishOffset = Math.sin(ph * 1.4) * (0.52 * wStance.arcWidth);
        wristSpin = Math.sin(ph * 2.8) * (0.85 * wStance.wristAmp);
      } else if (pat === 2) {
        flourishOffset = Math.sin(ph) * (0.78 * wStance.arcWidth) + Math.sin(ph * 2.0) * 0.28;
        wristSpin = Math.sin(ph * 2.0) * (0.95 * wStance.wristAmp);
      } else if (pat === 3) {
        flourishOffset = Math.sin(ph) * (1.35 * wStance.arcWidth) + Math.cos(ph * 0.5) * 0.55;
        wristSpin = (ph * 1.35) % (Math.PI * 2);
      } else if (pat === 4) {
        const cleaveWave = Math.sin(ph);
        flourishOffset = Math.sign(cleaveWave) * Math.pow(Math.abs(cleaveWave), 0.65) * (1.28 * wStance.arcWidth);
        wristSpin = cleaveWave * (0.75 * wStance.wristAmp);
      } else if (pat === 5) {
        flourishOffset = Math.sin(ph * 0.85) * (0.92 * wStance.arcWidth);
        wristSpin = Math.sin(ph * 1.7) * (0.75 * wStance.wristAmp);
      } else if (pat === 6) {
        flourishOffset = Math.sin(ph * 1.25) * (1.42 * wStance.arcWidth) + Math.cos(ph * 2.5) * 0.62;
        wristSpin = Math.sin(ph * 2.5) * (1.55 * wStance.wristAmp);
      } else {
        flourishOffset = Math.sin(ph * 0.65) * (0.88 * wStance.arcWidth);
        wristSpin = ph % (Math.PI * 2);
      }

      const prevAng = typeof w.ang === "number" ? w.ang : player.aim;
      const armAng = player.aim + flourishOffset + (s % 2 === 1 ? -0.38 : 0.22);
      const bladeWorldAng = armAng + wristSpin;
      w.armAng = armAng;
      w.wristSpin = wristSpin;
      w.ang = bladeWorldAng;
      w.angVel = (bladeWorldAng - prevAng) / Math.max(0.001, simDt);
      w.isDoubleBlade = (w.id === 77 && (w.lvl >= 2 || player.whirlwindTimer > 0));

      const reach = (w.id === 79 ? 6.5 : 8.5) + (player.armReach || 0);
      const sideSign = (s % 2 === 0) ? 1 : -1;
      const hx = player.x + Math.cos(armAng) * reach - Math.sin(armAng) * (sideSign * 4.5);
      const hy = player.y + Math.sin(armAng) * reach + Math.cos(armAng) * (sideSign * 4.5);
      const baseLen = w.id === 79 ? 18 : (w.lvl >= 5 ? 28 : 23);
      const bladeLen = baseLen * (player.area || 1.0);
      const tx = hx + Math.cos(bladeWorldAng) * bladeLen;
      const ty = hy + Math.sin(bladeWorldAng) * bladeLen;

      const sweepTangent = bladeWorldAng + (w.angVel >= 0 ? Math.PI * 0.35 : -Math.PI * 0.35);
      checkBladeSegmentSlice(hx, hy, tx, ty, w, sweepTangent, wBladeCol);

      if (w.isDoubleBlade) {
        const tx2 = hx - Math.cos(bladeWorldAng) * bladeLen;
        const ty2 = hy - Math.sin(bladeWorldAng) * bladeLen;
        checkBladeSegmentSlice(hx, hy, tx2, ty2, w, sweepTangent + Math.PI, wBladeCol);
      }
    } else {
      const rangedSway = pat === 11 ? Math.sin(ph) * wStance.arcWidth : (pat === 8 ? Math.sin(ph * 1.5) * 0.12 : 0);
      w.ang = player.aim + (s * 0.2) + rangedSway;
      w.armAng = w.ang;
      w.wristSpin = pat === 11 ? Math.cos(ph) * wStance.wristAmp : 0;
    }

    if (player.swapPause > 0.05) continue;

    if (w.id === 52) {
      if (player.sixReloadCD > 0) {
        player.sixReloadCD -= simDt;
        if (player.sixReloadCD <= 0) { player.sixShotsLeft = 6; sfx(920, 1480, 0.045, "triangle", 0.14); }
      } else {
        player.sixBurstCD -= simDt;
        if (player.sixBurstCD <= 0) {
          fireWeapon(w); player.recoilKick = 1.0; player.sixShotsLeft--;
          player.sixReloadCD = player.sixShotsLeft <= 0 ? Math.max(0.32, 0.55 * (player.cdr || 1) * hasteCdr) : 0;
          if (player.sixShotsLeft > 0) player.sixBurstCD = Math.max(0.06, 0.12 * (player.cdr || 1) * hasteCdr);
        }
      }
    } else {
      w.cd -= simDt;
      if (w.cd <= 0) {
        const baseCD = w.style === "orbit" ? 0.36 : (w.style === "beam" ? 0.48 : (w.style === "cone" ? 0.62 : 0.52));
        w.cd = Math.max(0.06, baseCD * (player.cdr || 1) * hasteCdr * (w.lvl >= 10 ? 0.78 : 1.0));
        fireWeapon(w);
        if (!isMeleeBlade) player.recoilKick = 1.0;
      }
    }
  }

  if (typeof updateHeroSpecials === "function") updateHeroSpecials(simDt);
  if (typeof updateWorldObjects === "function") updateWorldObjects(simDt);

  let activeEnemies = 0;
  for (let i = 0; i < MAX_E; i++) if (eAct[i]) activeEnemies++;
  const diffSpawnMul = (player.diff && typeof player.diff.spawnMul === "number")
    ? player.diff.spawnMul
    : ((player.diff && typeof player.diff.hpMul === "number") ? Math.max(0.8, Math.min(1.6, player.diff.hpMul)) : 1.0);
  const targetPop = Math.min(MAX_E - 12, Math.floor((14 + waveNum * 4.5) * diffSpawnMul));

  if (activeEnemies < 5 && runTime < 2.5) {
    spawnEnemy(false, false);
  } else if (activeEnemies < targetPop && Math.random() < (2.6 + waveNum * 0.38) * simDt) {
    spawnEnemy(false, false);
  }

  if (runTime > 120 && !player.bossSpawned) {
    player.bossSpawned = true; spawnEnemy(true, false);
    spawnSpeech(player.x, player.y - 24, "SECTOR TITAN DETECTED!", "#ff1744", 3.2);
  }
  rivalTimer += simDt;
  if (rivalTimer >= 75) { rivalTimer = 0; spawnEnemy(false, true); }

  const nearObs = typeof getNearbyObstacles === "function" ? getNearbyObstacles(player.x, player.y, 340) : [];
  const diffHpMul = (player.diff && typeof player.diff.hpMul === "number") ? player.diff.hpMul : 1.0;

  for (let i = 0; i < MAX_E; i++) {
    if (!eAct[i]) continue;
    if (eScarHitCD[i] > 0) eScarHitCD[i] = Math.max(0, eScarHitCD[i] - simDt);
    if (eScarHeat[i] > 0.08) eScarHeat[i] = Math.max(0.08, eScarHeat[i] - simDt * 0.75);

    if (typeof eLevitate !== "undefined" && eLevitate[i] > 0) {
      eLevitate[i] -= simDt;
      eLevZ[i] = Math.min(95, (eLevZ[i] || 4) + 22 * simDt);
      eX[i] += eLevVX[i] * simDt;
      eY[i] += eLevVY[i] * simDt;
      if (!isEnemyOnScreen(i) || eLevitate[i] <= 0) {
        const ox = Math.max(player.x - 160, Math.min(player.x + 160, eX[i]));
        const oy = Math.max(player.y - 160, Math.min(player.y + 160, eY[i]));
        eAct[i] = 0; eLevitate[i] = 0; eLevZ[i] = 0;
        player.kills++;
        const xpVal = eType[i] >= 98 ? 65 : (3.5 + waveNum * 0.55);
        spawnOrb(ox, oy, xpVal);
        for (let k = 0; k < MAX_O; k++) {
          if (oAct[k] && Math.hypot(oX[k] - ox, oY[k] - oy) < 8) oHome[k] = 1;
        }
      }
      continue;
    }

    if (eBleed[i] > 0) {
      eHP[i] -= eBleedRate[i] * simDt;
      if (Math.random() < 3.5 * simDt) spawnDrip(eX[i], eY[i] + 8, i, 2.5 + Math.random() * 1.8);
      if (eHP[i] <= 0) { killEnemy(i, false); continue; }
    }
    if (eSlow[i] > 0) eSlow[i] = Math.max(0, eSlow[i] - simDt);
    if (eStun[i] > 0) { eStun[i] = Math.max(0, eStun[i] - simDt); continue; }
    if (eGrapple[i] > 0) {
      eGrapple[i] = Math.max(0, eGrapple[i] - simDt);
      const ga = Math.atan2(player.y - eY[i], player.x - eX[i]);
      eX[i] += Math.cos(ga) * 260 * simDt; eY[i] += Math.sin(ga) * 260 * simDt;
      continue;
    }

    let goalX = player.x, goalY = player.y;
    const ldr = eFormLeader[i];
    if (eFormType[i] === 1 && ldr >= 0 && eAct[ldr]) {
      const la = Math.atan2(player.y - eY[ldr], player.x - eX[ldr]) + Math.PI * 0.5;
      goalX = eX[ldr] + Math.cos(la) * ((i & 1) ? 18 : -18);
      goalY = eY[ldr] + Math.sin(la) * ((i & 1) ? 18 : -18);
    } else if (eFormType[i] === 2 && ldr >= 0 && eAct[ldr]) {
      const la = Math.atan2(player.y - eY[ldr], player.x - eX[ldr]) + ((i & 1) ? 0.95 : -0.95);
      goalX = player.x + Math.cos(la) * 42; goalY = player.y + Math.sin(la) * 42;
    }

    const baseAng = Math.atan2(goalY - eY[i], goalX - eX[i]);
    const patAng = ChaosMath.movePattern(eMoveStyle[i], baseAng, runTime, eSeed[i]);
    const steered = ChaosMath.steerAround(eX[i], eY[i], eX[i] + Math.cos(patAng) * 60, eY[i] + Math.sin(patAng) * 60, nearObs, 0.95, eSeed[i]);
    const targetHeading = Math.atan2(steered.vy, steered.vx);
    eTurnTimer[i] += simDt;
    if (eTurnTimer[i] >= 0.08) {
      eTurnTimer[i] = 0;
      let hDiff = targetHeading - (eTurnAng[i] || targetHeading);
      while (hDiff > Math.PI) hDiff -= Math.PI * 2;
      while (hDiff < -Math.PI) hDiff += Math.PI * 2;
      eTurnAng[i] = (eTurnAng[i] || targetHeading) + hDiff * 0.65;
    }
    const useHeading = eTurnAng[i] || targetHeading;
    const legPenalty = eLegsLost[i] >= 2 ? 0.28 : (eLegsLost[i] === 1 ? 0.58 : 1.0);
    const spd = eSpd[i] * legPenalty * (eSlow[i] > 0 ? Math.max(0.25, 1 - (player.slow || 0)) : 1.0) * ChaosMath.moveSpeedMul(eMoveStyle[i], runTime, eSeed[i]);

    eVX[i] = Math.cos(useHeading) * spd; eVY[i] = Math.sin(useHeading) * spd;
    eX[i] += eVX[i] * simDt; eY[i] += eVY[i] * simDt;

    const distP = Math.hypot(player.x - eX[i], player.y - eY[i]);
    if ((eType[i] === 3 || eType[i] >= 98) && distP < 275 && eArmsLost[i] < 2) {
      eFireCD[i] -= simDt;
      if (eFireCD[i] <= 0) {
        eFireCD[i] = eType[i] >= 98 ? 1.15 : 2.35;
        const fa = Math.atan2(player.y - eY[i], player.x - eX[i]);
        spawnProj(eX[i], eY[i], Math.cos(fa) * 215, Math.sin(fa) * 215, 11 * diffHpMul, 1.8, 5, 0, 4, 0, 1, eRivalCid[i] >= 0 ? eRivalCid[i] : 2);
      }
    }

    if (distP < (eType[i] === 99 ? 26 : 16)) {
      player.combatAlertTimer = 2.0;
      if (player.cid === 30) {
        const acidDmg = 80 * simDt * 3.0;
        eHP[i] -= acidDmg;
        if (Math.random() < 0.25) spawnDmg(eX[i], eY[i], acidDmg, false);
        if (eHP[i] <= 0) { killEnemy(i, false); continue; }
      }
      if (player.cid === 47 && mag > 0.2) {
        const screwDmg = 65 * (player.might || 1) * simDt * 3.0;
        eHP[i] -= screwDmg;
        if (eHP[i] <= 0) { killEnemy(i, false); continue; }
      }

      if ((player.acrobatZ || 0) > 8 || (player.dodge > 0 && Math.random() < Math.min(0.65, player.dodge))) {
        spawnSpeech(player.x, player.y - 12, (player.acrobatZ || 0) > 8 ? "ATARU LEAP!" : "EVADED!", "#00e5ff", 0.55);
      } else {
        if (player.cid === 23) player.adaptTimer = 5.0;
        if (player.cid === 50) {
          player.maxHp += 2.0 * simDt * 3.2;
          player.might += 0.02 * simDt * 3.2;
          player.xp += 1.5 * simDt * (player.greed || 1);
        }

        const hitZone = Math.random() < 0.16 ? 0 : (Math.random() < 0.45 ? 1 : (2 + Math.floor(Math.random() * 4)));
        let rawDmg = (eType[i] === 99 ? 24 : 9) * simDt * 3.2;
        if (player.guardZone === hitZone) rawDmg *= (player.cid === 51 || player.cid === 40) ? 0.05 : 0.25;
        if ([1, 61, 76].includes(player.cid)) rawDmg *= 0.80;
        const effArmor = (player.armor || 0) + (player.adaptTimer > 0 ? 5 : 0);
        const netDmg = Math.max(0.4, rawDmg * (100 / (100 + effArmor * 8)));

        if (player.inVehicle > 0) {
          player.vehicleHp -= netDmg;
          if (player.vehicleHp <= 0) { player.inVehicle = 0; spawnBlastWave(player.x, player.y, 75, "#00e5ff"); sfx(120, 45, 0.25); }
        } else {
          player.hp -= netDmg;
          player.limbs[hitZone] = Math.max(15, player.limbs[hitZone] - netDmg * 0.85);
          player.xp += netDmg * 0.18 * (player.greed || 1);
        }
        if (player.hp <= 0) {
          if (player.revives > 0) {
            player.revives--; player.hp = player.maxHp * 0.6; player.limbs.fill(100);
            if ([46, 69, 70, 76].includes(player.cid)) {
              player.might *= 1.20; player.spd *= 1.15; player.area *= 1.15;
            }
            spawnBlastWave(player.x, player.y, 130, "#ffd166");
            const revMsg = player.cid === 69 ? "FAWKES PHOENIX REBIRTH!" : (player.cid === 70 ? "HORCRUX SOUL ANCHOR!" : "SECOND WIND REVIVAL!");
            spawnSpeech(player.x, player.y, revMsg, "#ffd166", 2.4);
            sfx(220, 880, 0.35, "triangle");
          } else {
            meta.dmEarned += Math.max(1, Math.floor(player.kills / 18) + (player.dmRun || 0));
            saveMeta(); purgeRunMemory();
            document.getElementById("hud").classList.remove("active");
            showScreen("scrMain"); return;
          }
        }
      }
    }
  }

  for (let i = 0; i < MAX_P; i++) {
    if (!pAct[i]) continue;
    pLife[i] -= simDt;
    if (pLife[i] <= 0) {
      if (pStyle[i] === 2) triggerRocketDetonation(pX[i], pY[i], pDmg[i], pRad[i] * 4.8);
      pAct[i] = 0; continue;
    }

    if (pStyle[i] === 8) {
      const totalDur = 1.35;
      const u = Math.max(0, Math.min(1, 1 - (pLife[i] / totalDur)));
      const baseAng = pVX[i];
      const curveWidth = pVY[i] * 95 * (player.area || 1.0);
      const maxReach = 165 * (player.area || 1.0);
      const fwdDist = Math.sin(u * Math.PI) * maxReach;
      const sideDist = Math.sin(u * Math.PI * 2) * curveWidth;
      pX[i] = player.x + Math.cos(baseAng) * fwdDist - Math.sin(baseAng) * sideDist;
      pY[i] = player.y + Math.sin(baseAng) * fwdDist + Math.cos(baseAng) * sideDist;
    } else if (pStyle[i] === 1) {
      pVX[i] += simDt * 5.2;
      pX[i] = player.x + Math.cos(pVX[i]) * pVY[i];
      pY[i] = player.y + Math.sin(pVX[i]) * pVY[i];
    } else if (pStyle[i] === 6) {
      pX[i] = player.x; pY[i] = player.y;
    } else {
      if (pStyle[i] === 2 && !pEnemy[i]) {
        let best = -1, bestScore = -1;
        for (let j = 0; j < MAX_E; j++) {
          if (eAct[j] && isEnemyOnScreen(j)) {
            const d = Math.hypot(eX[j] - pX[i], eY[j] - pY[i]);
            if (d < 340) {
              const score = eHP[j] * (eType[j] >= 98 ? 4 : 1) / (1 + d * 0.01);
              if (score > bestScore) { bestScore = score; best = j; }
            }
          }
        }
        const curSpd = Math.min(440, Math.hypot(pVX[i], pVY[i]) * (1 + 1.85 * simDt));
        let curAng = Math.atan2(pVY[i], pVX[i]);
        if (best >= 0) {
          let diff = Math.atan2(eY[best] - pY[i], eX[best] - pX[i]) - curAng;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          curAng += Math.max(-4.5 * simDt, Math.min(4.5 * simDt, diff));
        }
        pVX[i] = Math.cos(curAng) * curSpd; pVY[i] = Math.sin(curAng) * curSpd;
        if (Math.random() < 0.75) spawnParticles(pX[i] - Math.cos(curAng) * 8, pY[i] - Math.sin(curAng) * 8, 1);
      }
      pX[i] += pVX[i] * simDt; pY[i] += pVY[i] * simDt;
    }

    if (pEnemy[i]) {
      if (typeof activeBarriers !== "undefined") {
        let reflected = false;
        for (let b = 0; b < activeBarriers.length; b++) {
          const br = activeBarriers[b];
          if (Math.hypot(pX[i] - br.x, pY[i] - br.y) <= br.rad + 6) {
            pEnemy[i] = 0; pVX[i] = -pVX[i] * 1.4; pVY[i] = -pVY[i] * 1.4;
            pSup[i] = 2; pLife[i] = 0.9; reflected = true;
            if (typeof sfxRicochet === "function") sfxRicochet();
            break;
          }
        }
        if (reflected) continue;
      }

      const dp = Math.hypot(pX[i] - player.x, pY[i] - player.y);
      if (dp < 38 && !pSnap[i]) { pSnap[i] = 1; if (typeof sfxSnap === "function") sfxSnap(); }

      if (player.hasRepulsor && dp < 30) {
        pAct[i] = 0; spawnParticles(pX[i], pY[i], 3); sfx(680, 1220, 0.04, "sine", 0.12); continue;
      }

      if (player.hasSaber && dp < 34 && Math.random() < (0.35 + (player.saberMastery / 100) * 0.65)) {
        pEnemy[i] = 0; pVX[i] = -pVX[i] * 1.55; pVY[i] = -pVY[i] * 1.55;
        pDmg[i] = (36 + player.lvl * 10) * (player.might || 1) * (player.cid === 78 ? 1.45 : 1.0);
        pSup[i] = 2; pLife[i] = 0.95;
        player.deflectStanceTimer = 0.28;
        player.deflectAng = Math.atan2(pY[i] - player.y, pX[i] - player.x);
        player.swordSwingTimer = 0.22;
        player.saberMastery = Math.min(100, player.saberMastery + 0.40);
        if (typeof sfxRicochet === "function") sfxRicochet();
        continue;
      }
      if (dp < 14) {
        player.combatAlertTimer = 2.0;
        const effArmor = (player.armor || 0) + (player.adaptTimer > 0 ? 5 : 0);
        player.hp -= Math.max(1, pDmg[i] * (100 / (100 + effArmor * 8)));
        pAct[i] = 0; spawnParticles(player.x, player.y, 3);
      }
      continue;
    }

    hitTestPlayerProj(i);
  }

  for (let i = 0; i < MAX_SLICE; i++) {
    if (!slAct[i]) continue;
    if (slZ[i] > 0 || slVZ[i] !== 0) {
      slX[i] += slVX[i] * simDt;
      slY[i] += slVY[i] * simDt;
      slVX[i] *= (1 - 3.2 * simDt);
      slVY[i] *= (1 - 3.2 * simDt);
      slZ[i] += slVZ[i] * simDt;
      slVZ[i] -= 145 * simDt;
      slRot[i] += slVRot[i] * simDt;
      if (slZ[i] <= 0) {
        slZ[i] = 0; slVZ[i] = 0; slVRot[i] = 0;
      }
    }
    if (slHeat[i] > 0) slHeat[i] = Math.max(0, slHeat[i] - simDt * 0.65);
  }

  let leveledUp = false;
  for (let i = 0; i < MAX_O; i++) {
    if (!oAct[i]) continue;
    const d = Math.hypot(player.x - oX[i], player.y - oY[i]);
    if (d < player.mag || oHome[i]) {
      oHome[i] = 1;
      const pullSpd = 340 + (player.mag * 0.8);
      const a = Math.atan2(player.y - oY[i], player.x - oX[i]);
      oX[i] += Math.cos(a) * pullSpd * simDt; oY[i] += Math.sin(a) * pullSpd * simDt;
      if (d < 18) {
        oAct[i] = 0; player.xp += oVal[i] * (player.greed || 1);
        sfx(580, 880, 0.035, "sine", 0.08);
        if (player.xp >= player.nextXp) {
          player.xp -= player.nextXp; player.lvl++;
          player.nextXp = Math.floor(player.nextXp * 1.24 + 8);
          leveledUp = true;
        }
      }
    }
  }
  if (leveledUp) {
    if (typeof syncHeroSpellbook === "function") syncHeroSpellbook();
    if (typeof updateHUD === "function") updateHUD();
    if (typeof triggerLevelUp === "function") triggerLevelUp();
  }

  player.hudSyncTimer = (player.hudSyncTimer || 0) + rawDt;
  const curInteract = (typeof findInteractTarget === "function" && findInteractTarget()) ? 1 : 0;
  if (curInteract !== (player.lastInteractFlag || 0) || player.hudSyncTimer >= 0.25) {
    player.lastInteractFlag = curInteract;
    player.hudSyncTimer = 0;
    if (typeof updateHUD === "function") updateHUD();
  }

  for (let i = 0; i < MAX_D; i++) if (dAct[i]) { dY[i] -= 18 * simDt; dLife[i] -= simDt; if (dLife[i] <= 0) dAct[i] = 0; }
  for (let i = 0; i < MAX_PT; i++) if (ptAct[i]) { ptX[i] += ptVX[i] * simDt; ptY[i] += ptVY[i] * simDt; ptLife[i] -= simDt; if (ptLife[i] <= 0) ptAct[i] = 0; }
  for (let i = 0; i < MAX_DRIP; i++) if (drAct[i]) { if (drZ[i] > 0) drZ[i] = Math.max(0, drZ[i] - 18 * simDt); drLife[i] -= simDt; if (drLife[i] <= 0) drAct[i] = 0; }
  for (let i = 0; i < MAX_BLAST; i++) if (blAct[i]) {
    blLife[i] -= simDt;
    blRad[i] = 6 + (blMaxR[i] - 6) * (1 - Math.max(0, blLife[i] / 0.38));
    if (blLife[i] <= 0) blAct[i] = 0;
  }

  let cCnt = 0;
  for (let i = 0; i < MAX_CORPSE; i++) if (corpAct[i]) cCnt++;
  activeCorpseCount = cCnt;
  const maxPersist = opts.persistCount || 100;
  if (cCnt > maxPersist) {
    let toRemove = cCnt - maxPersist;
    for (let i = 0; i < MAX_CORPSE && toRemove > 0; i++) {
      // Never delete fallen Rival (98) or Boss (99) trophy corpses!
      if (corpAct[i] && corpType[i] < 98) { corpAct[i] = 0; toRemove--; }
    }
  }

  frameMs = +(performance.now() - t0).toFixed(1);
}
// EOF:js/sim.js
