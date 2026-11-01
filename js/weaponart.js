/* =========================================================================
   OMNI-SHIFT v14.2 — WEAPON ART: no glowing blades on things that shoot
   • Only real blades glow (lightsabers, energy swords). Weapons that SHOOT never
     get a glowing blade any more: the V8 Interceptor's sawed-off shotgun, the
     Yautja smart-disc, Strange's mandala sigil, the Ori Prior's staff, the
     Serenity pilot's thruster pod and the servo-skull are drawn as what they are.
   • Wands are thin, pointed sticks of real wood — each one modelled on its film
     owner (holly with knobbly handle, vine-carved, the Elder Wand's nodes, the
     bone-white hooked yew, Bellatrix's crooked walnut, Snape's slender ebony…);
     at most a tiny, faint glint at the tip right after a spell.
   • Staffs are twisted wood with a faint vein of light down the middle — not glowing
     orbs. Wanda casts from bare hands (chaos wisps), Hagrid has his pink umbrella.
   ========================================================================= */
"use strict";

// wood: shaft colour · handle: grip colour · kind: decoration · len: length (px at lvl 1)
const WAND_ART = {
  56: { wood: "#a87d5a", handle: "#6d4c41", kind: "bumps", len: 12.5 },      // holly & phoenix feather — knobbly handle
  57: { wood: "#b89470", handle: "#7a5a3c", kind: "vine", len: 12.0 },       // vine wood, a carved vine winding up the handle
  58: { wood: "#c6a27c", handle: "#8d6e63", kind: "plain", len: 12.5 },      // ash
  59: { wood: "#d2b48c", handle: "#a1887f", kind: "leaf", len: 11.5 },       // pale wood with a carved leaf
  60: { wood: "#c8a882", handle: "#8d6e63", kind: "plain", len: 12.0 },      // springy ash
  62: { wood: "#5d4037", handle: "#b0bec5", kind: "ornate", len: 12.0 },     // hawthorn, silver-capped handle
  63: { wood: "#8d6e63", handle: "#6d4c41", kind: "plain", len: 12.5 },      // cypress
  64: { wood: "#3e2723", handle: "#5d4037", kind: "runes", len: 12.5 },      // dark wood, runes on the grip
  66: { wood: "#4e342e", handle: "#3e2723", kind: "ornate", len: 13.0 },     // fir, elegant turned handle
  67: { wood: "#1b1b1b", handle: "#2b2b2b", kind: "ornate", len: 13.0 },     // ebony — slender, carved handle
  68: { wood: "#4e342e", handle: "#3e2723", kind: "curved", len: 12.5 },     // crooked walnut, claw-like
  69: { wood: "#9e8e7e", handle: "#7d6e60", kind: "nodes", len: 14.0 },      // the Elder Wand — beaded nodes along its length
  70: { wood: "#e8e2d4", handle: "#d7cfbd", kind: "hook", len: 12.5 }       // bone-white yew with a hooked talon end
};
const STAFF_ART = {
  65: { wood: "#6d4c41", vein: "#80deea", len: 19, twist: 1.0 },             // Mad-Eye's gnarled walking staff
  72: { wood: "#202124", vein: "#eceff1", len: 20, twist: 0.3, crystal: "#eceff1", prongs: true },   // Saruman: black staff, small pale stone
  12: { wood: "#5d4037", vein: "#ffe082", len: 20, twist: 0.6, ring: "#a8862a" }                    // Ori Prior: tall wooden staff, metal ring
};

function waTaper(t, x0, len, w0, w1, col) {   // a tapered stick from (x0,0) pointing +x
  t.fillStyle = col; t.beginPath(); t.moveTo(x0, -w0 / 2); t.lineTo(x0 + len, -w1 / 2); t.lineTo(x0 + len + 0.6, 0); t.lineTo(x0 + len, w1 / 2); t.lineTo(x0, w0 / 2); t.closePath(); t.fill();
}
function waWand(t, id, isLv5, col, rack) {
  const A = WAND_ART[id], L = A.len * (isLv5 ? 1.12 : 1);
  const hl = L * 0.32;                                         // handle length
  if (A.kind === "curved") {                                   // Bellatrix: a crooked, claw-like wand
    t.strokeStyle = A.wood; t.lineCap = "round"; t.lineWidth = 1.3;
    t.beginPath(); t.moveTo(-1, 0); t.quadraticCurveTo(L * 0.45, -2.6, L, 0.6); t.stroke();
    t.lineWidth = 2.0; t.strokeStyle = A.handle; t.beginPath(); t.moveTo(-1.5, 0.4); t.quadraticCurveTo(hl * 0.5, -0.9, hl, -1.0); t.stroke();
  } else {
    waTaper(t, hl - 0.4, L - hl, 1.25, 0.45, A.wood);          // shaft to a point
    waTaper(t, -1.5, hl + 0.6, 1.9, 1.5, A.handle);             // grip
    t.fillStyle = A.handle;
    if (A.kind === "bumps") for (let k = 0; k < 3; k++) { t.beginPath(); t.arc(0.4 + k * 1.3, (k % 2 ? 1 : -1) * 0.95, 0.45, 0, 7); t.fill(); }
    if (A.kind === "nodes") { t.fillStyle = A.wood; for (let k = 0; k < 5; k++) { t.beginPath(); t.arc(hl + 0.8 + k * (L - hl - 2) / 5, 0, 0.75, 0, 7); t.fill(); } }
    if (A.kind === "hook") { t.strokeStyle = A.handle; t.lineWidth = 1.0; t.beginPath(); t.moveTo(-1.4, 0); t.quadraticCurveTo(-3.2, -0.4, -3.0, -2.0); t.stroke(); }
    if (A.kind === "ornate") { t.fillStyle = "rgba(255,255,255,0.25)"; t.fillRect(hl - 0.7, -0.95, 0.6, 1.9); t.fillRect(0.6, -0.95, 0.5, 1.9); }
    if (A.kind === "vine") { t.strokeStyle = "rgba(60,40,20,0.75)"; t.lineWidth = 0.4; t.beginPath(); for (let x = -1.2; x < hl; x += 0.4) t.lineTo(x, Math.sin(x * 2.6) * 0.8); t.stroke(); }
    if (A.kind === "runes") { t.fillStyle = "#bcaaa4"; for (let k = 0; k < 3; k++) t.fillRect(-0.6 + k * 1.2, -0.3, 0.5, 0.6); }
    if (A.kind === "leaf") { t.fillStyle = "#9ccc65"; t.beginPath(); t.ellipse(hl + 0.8, -1.0, 0.9, 0.45, -0.5, 0, 7); t.fill(); }
  }
  if (rack > 0.05) {                                           // a tiny, faint glint right after a spell — never a glowing orb
    t.fillStyle = col; t.globalAlpha = Math.min(0.55, rack * 0.9); t.beginPath(); t.arc(L + 0.6, 0, 0.9, 0, 7); t.fill(); t.globalAlpha = 1;
  }
}
function waStaff(t, id, isLv5, col) {
  const A = STAFF_ART[id], L = A.len * (isLv5 ? 1.1 : 1);
  t.lineCap = "round";
  const path = () => { t.beginPath(); for (let k = 0; k <= 16; k++) { const x = -3 + k * L / 16; t.lineTo(x, Math.sin(k * 1.7) * 0.55 * A.twist + Math.sin(k * 0.6) * 0.3 * A.twist); } };
  t.strokeStyle = "rgba(0,0,0,0.45)"; t.lineWidth = 3.0; path(); t.stroke();      // outline
  t.strokeStyle = A.wood; t.lineWidth = 2.1; path(); t.stroke();                   // twisted wood
  t.strokeStyle = A.vein; t.globalAlpha = 0.22; t.lineWidth = 0.5; path(); t.stroke(); t.globalAlpha = 1;   // faint vein down the middle
  const tx = -3 + L;
  if (A.prongs) { t.strokeStyle = A.wood; t.lineWidth = 0.9; t.beginPath(); t.moveTo(tx - 1, 0); t.lineTo(tx + 1.6, -1.8); t.moveTo(tx - 1, 0); t.lineTo(tx + 1.6, 1.8); t.stroke(); }
  if (A.crystal) { t.fillStyle = A.crystal; t.globalAlpha = 0.8; t.beginPath(); t.arc(tx + 1.2, 0, 0.9, 0, 7); t.fill(); t.globalAlpha = 1; }
  if (A.ring) { t.strokeStyle = A.ring; t.lineWidth = 0.8; t.beginPath(); t.arc(tx + 1.4, 0, 1.7, 0, 7); t.stroke(); }
}
function waSpecial(t, id, isLv5, col, rack) {
  const m = isLv5 ? 1.15 : 1;
  switch (id) {
    case 44: {   // V8 Interceptor: sawed-off double-barrel shotgun
      t.fillStyle = "#5d4037"; t.fillRect(-4, -1.4, 5, 2.8);                     // stock grip
      t.fillStyle = "#37474f"; t.fillRect(1, -1.7, 10 * m, 1.6); t.fillRect(1, 0.1, 10 * m, 1.6);   // two barrels
      t.fillStyle = "#90a4ae"; t.fillRect(1 - rack * 2, -2.1, 3.5, 4.2);         // receiver
      return true;
    }
    case 29: {   // Yautja smart-disc: serrated steel disc
      t.fillStyle = "#b0bec5"; t.beginPath(); for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2, r = k % 2 ? 4.2 : 5.2; t.lineTo(6 + Math.cos(a) * r, Math.sin(a) * r); } t.closePath(); t.fill();
      t.fillStyle = "#546e7a"; t.beginPath(); t.arc(6, 0, 1.8, 0, 7); t.fill();
      return true;
    }
    case 73: {   // Doctor Strange: an orange sling-ring mandala at the hand (a spell shape, not a blade)
      t.strokeStyle = "rgba(255,171,64,0.85)"; t.lineWidth = 0.9; t.beginPath(); t.arc(4, 0, 4.2, 0, 7); t.stroke();
      t.beginPath(); for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2 + (typeof runTime !== "undefined" ? runTime : 0); t.moveTo(4 + Math.cos(a) * 2, Math.sin(a) * 2); t.lineTo(4 + Math.cos(a) * 4.2, Math.sin(a) * 4.2); } t.stroke();
      return true;
    }
    case 16: {   // Serenity pilot: a little thruster pod
      t.fillStyle = "#78909c"; t.fillRect(1, -2, 6, 4); t.fillStyle = "#37474f"; t.fillRect(7, -1.2, 2, 2.4);
      t.fillStyle = "rgba(129,212,250,0.8)"; t.fillRect(-0.4, -0.8, 1.4, 1.6);
      return true;
    }
    case 61: {   // Hagrid's pink umbrella
      t.fillStyle = "#8d6e63"; t.fillRect(-2, -0.6, 4, 1.2);
      t.fillStyle = "#f48fb1"; t.beginPath(); t.moveTo(2, -2.2); t.lineTo(13 * m, -0.5); t.lineTo(13 * m, 0.5); t.lineTo(2, 2.2); t.closePath(); t.fill();
      t.strokeStyle = "#ad1457"; t.lineWidth = 0.4; t.beginPath(); t.moveTo(2, 0); t.lineTo(13 * m, 0); t.stroke();
      return true;
    }
    case 74: {   // Wanda: chaos magic from the bare hand — a few red wisps
      const tt = typeof runTime !== "undefined" ? runTime : 0;
      t.strokeStyle = "rgba(255,23,68,0.6)"; t.lineWidth = 0.8;
      for (let k = 0; k < 3; k++) { t.beginPath(); t.moveTo(1, 0); t.quadraticCurveTo(4, Math.sin(tt * 6 + k * 2) * 3, 7 + k, Math.cos(tt * 5 + k) * 2); t.stroke(); }
      return true;
    }
  }
  return false;
}

(function waWrap() {
  if (typeof drawWeaponModel !== "function") return;
  const _dwm = drawWeaponModel;
  drawWeaponModel = function (tCtx, wpnId, style, isLv5, isSuper, bladeCol, rackShift = 0, angVel = 0, bladeLenPx = 0, dblOverride = null, hilt = null) {
    if (WAND_ART[wpnId]) { waWand(tCtx, wpnId, isLv5, bladeCol || "#ffffff", rackShift || 0); return; }
    if (STAFF_ART[wpnId]) { waStaff(tCtx, wpnId, isLv5, bladeCol); return; }
    if ([44, 29, 73, 16, 61, 74].includes(wpnId) && waSpecial(tCtx, wpnId, isLv5, bladeCol, rackShift || 0)) return;
    return _dwm.apply(this, arguments);
  };
  // Snape's cutting curse reads as a pale magical slash, not a coloured lightsaber sweep
  if (typeof getDefaultBladeIdx === "function") { const _g = getDefaultBladeIdx; getDefaultBladeIdx = function (cid) { return cid === 67 ? 6 : _g(cid); }; }
})();
// EOF:js/weaponart.js
