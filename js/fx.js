// FILE: js/fx.js
// PART: v10 module 1 of 8
// DETAIL: v10 "Game Feel" layer — camera shake & cinematic zoom, hit-stop & slow-motion, kill-streak announcer,
//         Titan intro / boss-down cinematics, brass casings & muzzle smoke, low-HP heartbeat vignette, damage flash,
//         temporal-echo & stagger markers, and the bottom-right run telemetry pill (#perfHud).

"use strict";

/* === 1. STATE === */
// Slug-throwers that eject brass (energy weapons, wands and blades do not).
const BALLISTIC_IDS = new Set([8, 13, 15, 25, 28, 31, 32, 33, 34, 37, 39, 44, 51, 53]);
const STREAK_TIERS = [
  [2, "DOUBLE KILL", "#80deea"], [3, "TRIPLE KILL", "#80deea"], [5, "MULTI KILL", "#ffd166"], [8, "MEGA KILL", "#ffd166"],
  [12, "ULTRA KILL", "#ff9100"], [18, "MONSTER KILL", "#ff9100"], [25, "RAMPAGE", "#ff5252"], [40, "UNSTOPPABLE", "#ff1744"],
  [60, "GODLIKE", "#e040fb"], [100, "BEYOND GODLIKE", "#e040fb"]
];
const fxState = {
  shakeMag: 0, shakeT: 0, shakeDur: 0.001,
  hitStop: 0, slowT: 0, slowMul: 1, uiSlow: 1,
  zoomCur: 1, zoomTarget: 1, zoomT: 0,
  focusX: 0, focusY: 0, focusOffX: 0, focusOffY: 0, focusT: 0,
  letterbox: 0, letterboxT: 0,
  banners: [],
  streak: 0, streakT: 0, streakTier: -1, bestStreak: 0,
  lastHp: -1, hurtFlash: 0, heartT: 0, casingT: 0, bossAnnounced: false, perfT: 0, glories: 0
};
const fxCamOut = { sx: 0, sy: 0, zoom: 1, fx: 0, fy: 0 };

/* === 2. PUBLIC API (used by glory / rewind / squad / campaign / proving) === */
function fxShake(mag, dur) {
  if (opts.shake === false) return;
  const remaining = fxState.shakeT > 0 ? fxState.shakeMag * (fxState.shakeT / fxState.shakeDur) : 0;
  if (mag >= remaining) { fxState.shakeMag = mag; fxState.shakeDur = Math.max(0.05, dur); fxState.shakeT = fxState.shakeDur; }
}
function fxHitStop(sec) { fxState.hitStop = Math.min(0.12, Math.max(fxState.hitStop, sec)); }
function fxSlowMo(mul, sec) { fxState.slowMul = Math.min(fxState.slowT > 0 ? fxState.slowMul : 1, mul); fxState.slowT = Math.max(fxState.slowT, sec); }
function fxFocus(x, y, zoom, sec) {
  fxState.focusX = x; fxState.focusY = y; fxState.focusT = sec;
  fxState.zoomTarget = zoom; fxState.zoomT = sec; fxState.letterboxT = Math.max(fxState.letterboxT, sec);
}
function fxLetterbox(sec) { fxState.letterboxT = Math.max(fxState.letterboxT, sec); }
function fxBanner(text, sub = "", col = "#ffd166", dur = 1.6, big = false, slot = "") {
  const b = fxState.banners;
  for (let i = 0; i < b.length; i++) if (b[i].text === text && b[i].t < 0.3) return;   // no instant duplicates
  if (slot) for (let i = b.length - 1; i >= 0; i--) if (b[i].slot === slot) b.splice(i, 1);   // e.g. a new streak tier replaces the last
  b.push({ text, sub, col, t: 0, dur, big, slot });
  if (b.length > 3) b.shift();
}

// Hit-stop + slow-mo multiplier applied to real time before the sim sub-steps (js/sim.js updateSim).
function fxTimeMul(rawDt) {
  const f = fxState;
  if (f.hitStop > 0) { f.hitStop = Math.max(0, f.hitStop - rawDt); return 0; }
  let m = 1;
  if (f.slowT > 0) {
    f.slowT = Math.max(0, f.slowT - rawDt);
    const ease = f.slowT < 0.2 ? (1 - f.slowT / 0.2) : 0;          // ease back to full speed
    m = f.slowMul + (1 - f.slowMul) * ease;
    if (f.slowT <= 0) f.slowMul = 1;
  }
  if (f.uiSlow < 1) m = Math.min(m, f.uiSlow);
  return m;
}

function fxCamera() {
  const f = fxState;
  let sx = 0, sy = 0;
  if (f.shakeT > 0) {
    const k = f.shakeT / f.shakeDur, m = f.shakeMag * k * k;
    sx = (Math.random() * 2 - 1) * m; sy = (Math.random() * 2 - 1) * m;
  }
  fxCamOut.sx = sx; fxCamOut.sy = sy; fxCamOut.zoom = f.zoomCur; fxCamOut.fx = f.focusOffX; fxCamOut.fy = f.focusOffY;
  if (typeof VEH !== "undefined" && VEH.camZoom) { fxCamOut.zoom *= VEH.camZoom; fxCamOut.fx += VEH.camFx || 0; fxCamOut.fy += VEH.camFy || 0; }   // v14.1 driving camera
  return fxCamOut;
}

/* === 3. EVENT HOOKS === */
function fxOnPlayerShot(x, y, vx, vy, style, wpnId) {
  if (!player || !BALLISTIC_IDS.has(wpnId) || Math.hypot(x - player.x, y - player.y) > 30) return;
  const now = performance.now();
  if (now - fxState.casingT < 45) return;
  fxState.casingT = now;
  const a = Math.atan2(vy, vx), side = a + Math.PI * 0.5 * (Math.random() < 0.85 ? 1 : -1), sp = 55 + Math.random() * 45;
  spawnPt(x + Math.cos(a) * 6, y + Math.sin(a) * 6, Math.cos(side) * sp - Math.cos(a) * 15, Math.sin(side) * sp - Math.sin(a) * 15,
          0.7 + Math.random() * 0.4, 2, 8, 3);                                         // ejected brass
  spawnPt(x + Math.cos(a) * 21, y + Math.sin(a) * 21, Math.cos(a) * 16, Math.sin(a) * 16 - 5, 0.4, 2.0, 7, 2);   // muzzle smoke
}

function fxOnKill(idx, x, y, et, isEcho) {
  if (isEcho || !player) return;
  const f = fxState;
  f.streak = f.streakT > 0 ? f.streak + 1 : 1;
  f.streakT = 1.15;
  if (f.streak > f.bestStreak) f.bestStreak = f.streak;
  let tier = -1;
  for (let k = 0; k < STREAK_TIERS.length; k++) if (f.streak >= STREAK_TIERS[k][0]) tier = k;
  if (tier > f.streakTier) {
    f.streakTier = tier;
    const t = STREAK_TIERS[tier];
    fxBanner(t[1], tier >= 4 ? f.streak + " KILL STREAK" : "", t[2], 1.3, tier >= 6, "streak");
    player.xp += (tier + 1) * 2 * (player.greed || 1);               // small streak bonus
    sfx(420 + tier * 70, 820 + tier * 90, 0.12, "triangle", 0.12);
  }
  if (et === 3 || et >= 98) fxShake(et === 99 ? 9 : 3.2, et === 99 ? 0.6 : 0.16);
}

function fxBossDown(x, y) {
  fxSlowMo(0.22, 1.4); fxShake(11, 1.0); fxFocus(x, y, 1.28, 1.4);
  fxBanner("SECTOR CLEARED", (player && player.bossName ? player.bossName + " has fallen" : "The Sector Titan has fallen"), "#00e676", 2.6, true);
}

function fxDetonation(x, y, rad) {
  if (!player) return;
  const d = Math.hypot(x - player.x, y - player.y);
  if (d < 420) fxShake(Math.min(6, 1.5 + rad / 30) * (1 - d / 520), 0.22);
}

/* === 4. PER-STEP / PER-FRAME === */
function fxStep(simDt) {
  const f = fxState;
  if (player.invulnT > 0) player.invulnT = Math.max(0, player.invulnT - simDt);
  // Titan intro cinematic
  if (!f.bossAnnounced && player.bossSpawned) {
    for (let i = 0; i < MAX_E; i++) {
      if (eAct[i] && eType[i] === 99) {
        f.bossAnnounced = true;
        fxBanner("⚠ " + (player.bossName || "SECTOR TITAN"), player.bossTrait || "Defeat it to clear the sector", "#ff1744", 3.0, true);
        fxSlowMo(0.35, 0.9); fxShake(7, 0.9); fxFocus(eX[i], eY[i], 1.12, 1.1);
        sfx(70, 140, 0.6, "sawtooth", 0.3);
        break;
      }
    }
  }
  // damage feedback
  if (f.lastHp >= 0 && player.hp < f.lastHp - 0.35) {
    const lost = f.lastHp - player.hp;
    f.hurtFlash = Math.min(1, f.hurtFlash + (lost / Math.max(1, player.maxHp)) * 7 + 0.12);
    if (lost > 2) fxShake(Math.min(5, 1.2 + lost * 0.25), 0.16);
  }
  f.lastHp = player.hp;
}

function fxFrame(rawDt) {
  const f = fxState;
  if (f.shakeT > 0) f.shakeT = Math.max(0, f.shakeT - rawDt);
  if (f.streakT > 0) { f.streakT -= rawDt; if (f.streakT <= 0) { f.streak = 0; f.streakTier = -1; } }
  if (f.zoomT > 0) { f.zoomT -= rawDt; if (f.zoomT <= 0) f.zoomTarget = 1; }
  f.zoomCur += (f.zoomTarget - f.zoomCur) * Math.min(1, rawDt * 7);
  if (f.focusT > 0) f.focusT -= rawDt;
  let tx = 0, ty = 0;
  if (f.focusT > 0 && player) {
    tx = Math.max(-70, Math.min(70, (f.focusX - player.x) * 0.5));
    ty = Math.max(-70, Math.min(70, (f.focusY - player.y) * 0.5));
  }
  f.focusOffX += (tx - f.focusOffX) * Math.min(1, rawDt * 8);
  f.focusOffY += (ty - f.focusOffY) * Math.min(1, rawDt * 8);
  if (f.letterboxT > 0) f.letterboxT -= rawDt;
  f.letterbox += ((f.letterboxT > 0 ? 1 : 0) - f.letterbox) * Math.min(1, rawDt * 6);
  if (f.hurtFlash > 0) f.hurtFlash = Math.max(0, f.hurtFlash - rawDt * 2.2);
  for (let i = f.banners.length - 1; i >= 0; i--) { f.banners[i].t += rawDt; if (f.banners[i].t >= f.banners[i].dur) f.banners.splice(i, 1); }
  // low-HP heartbeat
  if (runActive && player && !runPaused && player.hp < player.maxHp * 0.3) {
    f.heartT -= rawDt;
    if (f.heartT <= 0) { sfx(78, 46, 0.11, "sine", 0.22); f.heartT = 0.42 + 0.7 * (player.hp / (player.maxHp * 0.3)); }
  }
  fxUpdatePerfHud(rawDt);
}

// v9.01 #perfHud — bottom-right run telemetry pill (FPS | ms/frame | Bodies X/Max | Enemies Y).
function fxUpdatePerfHud(dt) {
  fxState.perfT -= dt;
  if (fxState.perfT > 0) return;
  fxState.perfT = 0.25;
  let el = document.getElementById("perfHud");
  if (!el) { el = document.createElement("div"); el.id = "perfHud"; document.body.appendChild(el); }
  const show = runActive && !!player && opts.perfHud !== false;
  el.style.display = show ? "block" : "none";
  if (!show) return;
  let en = 0, bodies = 0;
  for (let i = 0; i < MAX_E; i++) if (eAct[i]) en++;
  for (let i = 0; i < MAX_CORPSE; i++) if (corpAct[i]) bodies++;
  const fps = typeof fpsCount === "number" ? fpsCount : 60;
  el.textContent = `${fps} FPS | ${(+frameMs || 0).toFixed(1)} ms | Bodies ${bodies}/${opts.persistCount || 100} | Enemies ${en}`;
  el.style.color = fps >= 50 ? "#00e676" : (fps >= 30 ? "#ffd166" : "#ff5252");
}

/* === 5. WORLD-SPACE STATUS MARKERS (called from the enemy pass in renderScene) === */
function drawEnemyStatusFx(i, ex, ey, baseR) {
  ctx.save();
  if (eStagger[i] > 0) {
    const p = 0.5 + 0.5 * Math.sin(runTime * 14 + i);
    ctx.strokeStyle = p > 0.5 ? "#ff9100" : "#40c4ff"; ctx.lineWidth = 2.2; ctx.globalAlpha = 0.85;
    ctx.beginPath(); ctx.arc(ex, ey, baseR + 6 + p * 3, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = 1; ctx.fillStyle = "#fff"; ctx.font = "bold 10px sans-serif"; ctx.textAlign = "center";
    ctx.fillText("☠", ex, ey - baseR - 10);
    if (player && Math.hypot(player.x - ex, player.y - ey) < 130) {
      ctx.fillStyle = "#ff9100"; ctx.font = "bold 7px monospace"; ctx.fillText("EXECUTE", ex, ey - baseR - 19);
    }
  } else if (eEcho[i]) {
    ctx.strokeStyle = "#00e5ff"; ctx.globalAlpha = 0.45 + 0.25 * Math.sin(runTime * 9 + i); ctx.lineWidth = 1.3;
    ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.arc(ex, ey, baseR + 4, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.restore();
}

/* === 6. SCREEN-SPACE OVERLAYS === */
function fxRenderScreen(c) {
  const f = fxState;
  if (!player) return;
  // damage flash + low-HP vignette
  const lowHp = player.hp < player.maxHp * 0.3 ? (1 - player.hp / (player.maxHp * 0.3)) : 0;
  const pulse = lowHp > 0 ? (0.55 + 0.45 * Math.sin(performance.now() / 1000 * (5 + lowHp * 4))) : 0;
  const redA = Math.min(0.6, f.hurtFlash * 0.45 + lowHp * 0.32 * pulse);
  if (redA > 0.01) {
    const g = c.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.32, W / 2, H / 2, Math.max(W, H) * 0.72);
    g.addColorStop(0, "rgba(255,0,40,0)"); g.addColorStop(1, `rgba(200,0,30,${redA.toFixed(3)})`);
    c.fillStyle = g; c.fillRect(0, 0, W, H);
  }
  // cinematic letterbox
  if (f.letterbox > 0.01) {
    const bh = H * 0.075 * f.letterbox;
    c.fillStyle = "#000"; c.fillRect(0, 0, W, bh); c.fillRect(0, H - bh, W, bh);
  }
  // banners (kill streaks, boss intro, glory kills, sector clear)
  c.save(); c.textAlign = "center";
  let yOff = Math.max(H * 0.3, (typeof HUDL !== "undefined" && HUDL.enabled ? HUDL.topH + 40 : 0));   // v14.1: below the top bar
  for (let i = 0; i < f.banners.length; i++) {
    const b = f.banners[i], t = b.t, k = Math.min(1, t / 0.12), out = Math.max(0, (t - (b.dur - 0.35)) / 0.35);
    const scale = (b.big ? 1.0 : 0.82) * (1.35 - 0.35 * k);
    c.globalAlpha = Math.max(0, 1 - out);
    c.font = `900 ${Math.round(24 * scale)}px sans-serif`;
    c.lineWidth = 4; c.strokeStyle = "rgba(0,0,0,0.75)"; c.strokeText(b.text, W / 2, yOff);
    c.fillStyle = b.col; c.fillText(b.text, W / 2, yOff);
    if (b.sub) {
      c.font = "bold 11px monospace"; c.strokeText(b.sub, W / 2, yOff + 16); c.fillStyle = "#e0f7fa"; c.fillText(b.sub, W / 2, yOff + 16);
    }
    yOff += b.sub ? 44 : 32;
  }
  if (f.streak >= 5) {
    c.globalAlpha = Math.min(1, f.streakT * 2);
    c.font = "bold 12px monospace"; c.fillStyle = "#ffd166"; c.strokeStyle = "rgba(0,0,0,0.7)"; c.lineWidth = 3;
    c.strokeText("🔥 x" + f.streak, W / 2, H * 0.2); c.fillText("🔥 x" + f.streak, W / 2, H * 0.2);
  }
  c.restore();
}

function fxReset() {
  const f = fxState;
  f.shakeT = 0; f.hitStop = 0; f.slowT = 0; f.slowMul = 1; f.uiSlow = 1; f.zoomCur = 1; f.zoomTarget = 1; f.zoomT = 0;
  f.focusT = 0; f.focusOffX = 0; f.focusOffY = 0; f.letterbox = 0; f.letterboxT = 0; f.banners.length = 0;
  f.streak = 0; f.streakT = 0; f.streakTier = -1; f.bestStreak = 0; f.lastHp = -1; f.hurtFlash = 0; f.bossAnnounced = false; f.glories = 0;
}

V10.onRunStart.push(function fxRunStart() { fxReset(); });
V10.onRunReset.push(function fxRunReset() { fxReset(); });
V10.onStep.push(fxStep);
V10.onKill.push(fxOnKill);
V10.onFrame.push(fxFrame);
V10.onRenderScreen.push(fxRenderScreen);
// EOF:js/fx.js
