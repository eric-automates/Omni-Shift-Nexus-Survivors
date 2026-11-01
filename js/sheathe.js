/* =========================================================================
   OMNI-SHIFT v14.2 — SHEATHE & HOLSTER
   Lightsabers already switch off when no foe is near (js/saberforms.js). Every
   OTHER weapon used to stay out forever — swords, axes, bat'leths, nodachis,
   energy swords, pistols and rifles. Now:
   • blades slide into a scabbard on your back (hilt over the shoulder) after
     ~3 s with no threat near, and are drawn with a "shing" the instant a foe
     comes within reach — fully automatic, no button;
   • guns holster on the hip / sling on the back after ~4 s of quiet;
   • a weapon is always drawn while you fight, dash or EXECUTE;
   • the state is exposed (sheatheArmed()) so other systems can react — in the
     Open-World Economy a drawn weapon in town alarms people (brandishing).
   CARRY OPTIONS (Options screen):
   • Idle Steel Blades — SHEATHE ON BACK (default: scabbard + auto-draw) or ALWAYS IN HAND.
     Glowing blades (lightsabers, energy swords) always retract to the belt — js/saberforms.js / js/saga.js.
   • Idle Guns — LOW READY (default: still in hand, muzzle lowered toward the ground ahead, snaps up
     when a foe comes within range), ALWAYS AIMED, or HOLSTER (hip holster / back sling, auto-draw).
   ========================================================================= */
"use strict";

const SHEATHE = { blade: 1, gun: 1, low: 0, bladeT: 0, gunT: 0, near: 1e9, scanT: 0, drawn: false, gunDrawn: false, forceT: 0 };
const SH_BLADE_IDLE = 3.0, SH_GUN_IDLE = 4.0, SH_BLADE_R = 360, SH_GUN_R = 560;

function sheatheIsBlade(w) {
  return (typeof isSwordWeapon === "function" && isSwordWeapon(w.id)) || (w.style === "orbit" && ![12, 16, 29, 44, 73].includes(w.id));
}
// keep everything out for a moment (dash, execute, explicit attack)
function sheatheForceDraw(sec = 2.5) { SHEATHE.forceT = Math.max(SHEATHE.forceT, sec); }
function sheatheArmed() { return SHEATHE.blade < 0.5 || SHEATHE.gun < 0.5; }
// steel blades: "sheathe" (default) | "hand" · guns: "lowready" (default) | "aim" | "holster"
function sheatheBladeMode() { const o = typeof opts !== "undefined" ? opts : {}; return o.carryBlade === "hand" ? "hand" : "sheathe"; }
function sheatheGunMode() { const o = typeof opts !== "undefined" ? opts : {}; return o.carryGun === "aim" || o.carryGun === "holster" ? o.carryGun : "lowready"; }
function sheatheMode() { return sheatheBladeMode(); }   // (kept for callers that only care about blades)
function sheatheCycleBlade() { opts.carryBlade = sheatheBladeMode() === "sheathe" ? "hand" : "sheathe"; if (typeof saveOpts === "function") saveOpts(); }
function sheatheCycleGun() { const L = ["lowready", "aim", "holster"]; opts.carryGun = L[(L.indexOf(sheatheGunMode()) + 1) % L.length]; if (typeof saveOpts === "function") saveOpts(); }
function sheatheLowK() { return sheatheGunMode() === "lowready" ? SHEATHE.low : 0; }
const SHEATHE_GUN_NAMES = { lowready: "LOW READY (RAISED WHEN A FOE IS NEAR)", aim: "ALWAYS AIMED", holster: "HOLSTER (AUTO-DRAW)" };

function sheatheStep(dt) {
  if (!player) return;
  SHEATHE.scanT -= dt;
  if (SHEATHE.scanT <= 0) {
    SHEATHE.scanT = 0.15;
    let best = 1e18;
    for (let j = 0; j < MAX_E; j++) {
      if (!eAct[j]) continue;
      if (typeof allyIs === "function" && allyIs(j)) continue;
      if (typeof npcIsCivilianSlot === "function" && npcIsCivilianSlot(j)) continue;
      const dx = eX[j] - player.x, dy = eY[j] - player.y, d = dx * dx + dy * dy;
      if (d < best) best = d;
    }
    SHEATHE.near = Math.sqrt(best);
  }
  SHEATHE.forceT = Math.max(0, SHEATHE.forceT - dt);
  const fight = SHEATHE.forceT > 0 || (player.dashTimer > 0) || (typeof gloryState !== "undefined" && gloryState.exec) || (player.whirlwindTimer > 0)
    || (player.invulnT > 0 && SHEATHE.near < 600) || (typeof SD !== "undefined" && SD.active);
  const wantBlade = fight || SHEATHE.near < SH_BLADE_R, wantGun = fight || SHEATHE.near < SH_GUN_R;
  SHEATHE.bladeT = wantBlade ? 0 : SHEATHE.bladeT + dt;
  SHEATHE.gunT = wantGun ? 0 : SHEATHE.gunT + dt;
  const bOut = SHEATHE.bladeT < SH_BLADE_IDLE, gOut = SHEATHE.gunT < SH_GUN_IDLE;
  // draw fast (0.12 s), sheathe slower (0.35 s)
  if (sheatheBladeMode() === "hand") SHEATHE.blade = 0;
  else SHEATHE.blade = bOut ? Math.max(0, SHEATHE.blade - dt / 0.12) : Math.min(1, SHEATHE.blade + dt / 0.35);
  const gm = sheatheGunMode();
  if (gm === "holster") { SHEATHE.gun = gOut ? Math.max(0, SHEATHE.gun - dt / 0.12) : Math.min(1, SHEATHE.gun + dt / 0.35); SHEATHE.low = 0; }
  else { SHEATHE.gun = 0; SHEATHE.low = gm === "aim" || gOut ? Math.max(0, SHEATHE.low - dt / 0.1) : Math.min(1, SHEATHE.low + dt / 0.45); }
  const hasBlade = player.weapons && player.weapons.some(w => w.enabled !== false && sheatheIsBlade(w) && !(player.hasSaber && typeof saberRenderState === "function" && saberRenderState(w)));
  if (sheatheBladeMode() === "hand") { SHEATHE.drawn = true; SHEATHE.gunDrawn = gOut; return; }
  if (bOut !== SHEATHE.drawn) {
    SHEATHE.drawn = bOut;
    if (hasBlade && typeof sfx === "function" && runTime > 1) {
      if (bOut) { sfx(1700, 3400, 0.11, "triangle", 0.07); sfx(5200, 2800, 0.2, "sine", 0.035); }
      else sfx(2600, 900, 0.16, "triangle", 0.045);
    }
  }
  SHEATHE.gunDrawn = gOut;
}

// render.js asks per active weapon: draw it stowed instead of in the hand?
function sheatheStowed(w, isBlade) {
  return isBlade ? SHEATHE.blade > 0.5 : (sheatheGunMode() === "holster" && SHEATHE.gun > 0.5);
}
// stowed weapon on the hero's body: blades in a scabbard on the back, guns on the hip / slung
function sheatheDraw(tCtx, w, slotIdx, isBlade, col, handCol) {
  const side = slotIdx % 2 === 0 ? 1 : -1;
  tCtx.save();
  if (isBlade) {
    // hilt pokes up over the shoulder, the scabbard runs diagonally down across the back
    tCtx.translate(5.5 * side, -10.5 + slotIdx * 1.2);
    tCtx.rotate(side > 0 ? 2.2 : 0.94);
    tCtx.scale(0.82, 0.82);
    drawWeaponModel(tCtx, w.id, w.style, w.lvl >= 5, w.lvl >= 10, col, 0, 0, 0, w.dbl ? true : null, w.hilt);
    tCtx.fillStyle = "#7a5236"; tCtx.strokeStyle = "#2b1d16"; tCtx.lineWidth = 1;
    tCtx.beginPath(); tCtx.moveTo(4.5, -2.5); tCtx.lineTo(25, -2); tCtx.quadraticCurveTo(29, 0, 25, 2); tCtx.lineTo(4.5, 2.5); tCtx.closePath(); tCtx.fill(); tCtx.stroke();
    tCtx.fillStyle = "rgba(255,255,255,0.18)"; tCtx.fillRect(6, -2.1, 18, 1.1);
    tCtx.fillStyle = "#d8c690"; tCtx.fillRect(4.1, -2.8, 2.4, 5.6); tCtx.fillRect(23.4, -1.9, 1.8, 3.8);
    tCtx.strokeStyle = "#3e2723"; tCtx.lineWidth = 1.1; tCtx.beginPath(); tCtx.moveTo(9, -2.4); tCtx.lineTo(4, -9); tCtx.stroke();   // strap
  } else {
    tCtx.translate(6.2 * side, 4.2);
    tCtx.rotate(side > 0 ? 1.45 : 1.7);
    tCtx.scale(0.68, 0.68);
    drawWeaponModel(tCtx, w.id, w.style, w.lvl >= 5, w.lvl >= 10, col, 0, 0, 0, w.dbl ? true : null, w.hilt);
  }
  tCtx.restore();
  if (slotIdx === 0) { drawBallHand(tCtx, 1.5, 7.2, 2.4, handCol); drawBallHand(tCtx, 1.5, -7.2, 2.4, handCol); }
}

if (typeof V10 !== "undefined") {
  V10.onStep.push(sheatheStep);
  V10.onRunStart.push(() => { const h = sheatheBladeMode() === "hand", g = sheatheGunMode(); SHEATHE.blade = h ? 0 : 1; SHEATHE.gun = g === "holster" ? 1 : 0; SHEATHE.low = g === "lowready" ? 1 : 0; SHEATHE.bladeT = h ? 0 : 99; SHEATHE.gunT = 99; SHEATHE.drawn = h; SHEATHE.forceT = 0; });
}
// EOF:js/sheathe.js
