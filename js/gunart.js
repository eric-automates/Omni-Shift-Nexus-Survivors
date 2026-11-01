/* ============================================================================================================
   js/gunart.js — v14.3 GUNS THAT LOOK LIKE GUNS
   • Every firearm and blaster gets its own silhouette (P90 bullpup, 1911, Navy revolver, MA5B, Morita, Vera,
     M60, Smartgun, Uzi, super shotgun, sawed-off, E-11, DL-44, EE-3, IB-94, phaser, plasma & laser rifles…):
     matte metal, polymer and wood — no glowing emitters, no orbs (the old P90 had a coloured square at the muzzle).
   • Suppressors are visible: each gun has its own can (long and slim on the P90, fat on Vera, short on pistols)
     that screws on and off with a quick animation; the stock tool-less "pew" bits are gone.
   • Weapon light: at night a 🔦 button (or L) switches on a flashlight under the barrel. It throws a cone of
     light where you aim (walls stop it) — you see further that way — but a lit torch also gives you away.
   ============================================================================================================ */
const GA = { supK: 0, owner: false, light: false, btn: null, lastT: 0, twist: 0 };
const GA_C = { k: "#24282b", m: "#353b40", e: "#4f575e", p: "#1c1f22", w: "#6b4a33", wd: "#4e3424", b: "#8f7244", o: "#4a5040", od: "#3a3f30", g: "#7a8086", s: "#a7afb5", wh: "#c9ced2", r: "#3a2b25", am: "#8a6a2c", h: "#0f1113" };
// parts: [x, y, w, h, colour, flags]  flags: 1 slide (moves with the recoil), 2 rounded, 4 vent holes, 8 hole (dark cut-out)
// mz: muzzle [x, y]; can: suppressor [length, diameter, colour] (only on the guns that take one)
const GUNS = {
  // FN P90 — bullpup shell, thumbhole stock, translucent magazine on top, ring sight, short flash hider
  8: { mz: [10.8, -0.25], can: [7.2, 2.2, "#1b1e21"], parts: [[-5.2, -2.2, 12.2, 3.9, "p", 2], [-3.8, -3.15, 9.4, 1.0, "#5a5145", 2], [0.8, -4.0, 3.2, 0.85, "k", 2], [-2.5, 0.1, 2.9, 1.05, "h", 8], [6.6, -0.8, 2.9, 1.1, "k", 0], [9.2, -1.0, 1.6, 1.5, "m", 0], [-5.2, -2.2, 12.2, 0.45, "e", 0]] },
  // Kimber 1911 — slide, frame, short barrel bushing
  51: { mz: [8.3, -0.75], can: [5.0, 1.75, "#202326"], parts: [[-1.4, -1.55, 9.4, 1.55, "k", 1], [-1.0, 0, 7.2, 0.85, "m", 0], [-1.6, 0.8, 2.4, 2.4, "#2a2622", 2], [-1.4, -1.55, 9.4, 0.35, "e", 1], [6.6, -1.2, 0.6, 0.9, "h", 9]] },
  // Moses Brothers Frontier B ("brass pistol") — brass frame, long round barrel, wood grip
  13: { mz: [10.4, -0.6], can: [5.4, 1.8, "#3a3128"], parts: [[-2.4, -0.9, 3.4, 2.9, "w", 2], [0.6, -1.7, 3.8, 3.1, "b", 2], [4.2, -1.15, 6.2, 1.15, "m", 0], [4.2, -1.15, 6.2, 0.3, "e", 0], [1.2, -2.2, 1.4, 0.6, "k", 1]] },
  // Vera (Callahan full-bore autolock) — long heavy rifle, big scope, drum, wooden stock
  15: { mz: [16.4, -0.5], can: [8.2, 3.0, "#1f2225"], parts: [[-7.5, -1.4, 5.5, 2.6, "w", 2], [-2.2, -1.9, 10.5, 3.2, "m", 0], [8.2, -1.05, 8.2, 1.3, "k", 0], [0, -3.7, 6.2, 1.4, "k", 2], [-0.2, -3.95, 1.0, 1.9, "e", 0], [5.2, -3.95, 1.0, 1.9, "e", 0], [1.5, 1.3, 3.4, 2.8, "p", 2], [-2.2, -1.9, 10.5, 0.4, "e", 1]] },
  // MA5B — bullpup, carry handle, round counter (unlit), muzzle shroud
  32: { mz: [12.6, -0.3], can: [6.4, 2.4, "#23272a"], parts: [[-6.5, -1.9, 14.5, 3.6, "o", 2], [-6.5, -1.9, 14.5, 0.45, "#5c6450", 0], [8, -1.15, 4.6, 1.7, "od", 4], [-4.0, 1.7, 2.2, 2.4, "k", 0], [-1.5, -3.0, 5.5, 1.1, "od", 2], [1.0, -1.3, 1.5, 0.9, "#1e2a2a", 0]] },
  // Morita Mk1 — long rifle, under-barrel shotgun tube, fore grip
  31: { mz: [15.6, -0.6], parts: [[-7.5, -1.4, 6, 2.6, "od", 2], [-1.8, -1.8, 9.5, 3.0, "o", 0], [7.7, -1.1, 7.9, 1.0, "k", 0], [7.4, 0.15, 6.4, 1.1, "m", 0], [0.5, 1.2, 1.8, 2.4, "k", 0], [-1.8, -1.8, 9.5, 0.4, "#5c6450", 1]] },
  // M-8 Avenger — angular white-grey assault rifle
  27: { mz: [13.2, -0.4], parts: [[-6.5, -1.3, 5.2, 2.4, "g", 2], [-1.6, -2.0, 10.6, 3.4, "wh", 2], [9, -1.1, 4.2, 1.4, "k", 0], [-1.6, -2.0, 10.6, 0.45, "s", 0], [1, 1.4, 2.2, 2.2, "k", 0], [2.8, -0.7, 4.6, 0.7, "m", 0]] },
  // M56 Smartgun — boxy, perforated shroud, articulated mount stub
  28: { mz: [16.5, -0.2], parts: [[-6, -2.4, 11, 4.6, "m", 2], [5, -1.6, 11.5, 2.8, "k", 4], [-4.5, 2.2, 3, 2.2, "e", 0], [-6, -2.4, 11, 0.5, "e", 0], [-1.5, -3.6, 4.5, 1.2, "k", 2]] },
  // M60 — long receiver, feed cover, belt box, bipod legs folded
  53: { mz: [17.5, -0.5], parts: [[-7.5, -1.4, 5.8, 2.6, "od", 2], [-1.8, -2.0, 9.5, 3.2, "k", 0], [7.7, -1.0, 9.8, 1.1, "m", 0], [7.7, -2.0, 4.5, 1.0, "k", 4], [0.2, 1.2, 3.6, 2.8, "o", 2], [12.5, 0.1, 4.5, 0.5, "e", 0], [-1.8, -2.0, 9.5, 0.4, "e", 1]] },
  // Lucifer super shotgun — side-by-side double barrel, wood stock
  33: { mz: [12.4, -0.4], parts: [[-6.5, -1.2, 5.6, 2.6, "w", 2], [-1.2, -1.6, 4.4, 2.9, "m", 0], [3.2, -1.6, 9.2, 1.25, "k", 0], [3.2, -0.2, 9.2, 1.25, "k", 0], [3.2, -1.6, 9.2, 0.3, "e", 0], [4.5, 1.1, 3.6, 0.9, "wd", 0]] },
  // sawed-off double barrel — pistol grip, short barrels
  44: { mz: [9.2, -0.4], parts: [[-2.6, -0.9, 2.6, 2.8, "wd", 2], [-0.2, -1.6, 3.6, 2.9, "m", 0], [3.2, -1.6, 6.0, 1.25, "k", 0], [3.2, -0.2, 6.0, 1.25, "k", 0], [3.2, -1.6, 6.0, 0.3, "e", 0]] },
  // Micro Uzi — compact receiver, magazine in the grip, wire stock folded
  39: { mz: [8.2, -0.5], can: [4.6, 1.7, "#202326"], parts: [[-1.6, -1.7, 8.4, 2.5, "k", 2], [-0.3, 0.7, 1.7, 3.2, "p", 0], [6.6, -1.0, 1.6, 1.0, "m", 0], [-1.6, -1.7, 8.4, 0.4, "e", 1], [0.8, -2.2, 3.6, 0.5, "m", 0]] },
  // Colt 1851 Navy — octagonal barrel, brass frame, walnut grip, cylinder
  52: { mz: [12.2, -0.75], parts: [[-2.6, -0.8, 3.2, 2.8, "w", 2], [0.4, -1.6, 2.2, 2.6, "b", 2], [2.4, -1.75, 2.6, 2.6, "m", 2], [5, -1.25, 7.2, 1.0, "k", 0], [5, -1.25, 7.2, 0.28, "e", 0], [5.3, -0.3, 4.5, 0.55, "m", 0]] },
  // KEW flak magnum — heavy revolver
  25: { mz: [10.4, -0.6], parts: [[-2.4, -0.8, 3.0, 2.9, "p", 2], [0.6, -1.9, 3.2, 3.0, "m", 2], [3.8, -1.4, 6.6, 1.6, "k", 0], [3.8, -1.4, 6.6, 0.35, "e", 0]] },
  // IB-94 (Mandalorian) — long-barrelled heavy blaster pistol, scope, flash hider
  1: { mz: [13.0, -0.7], parts: [[-2.2, -1.0, 3.6, 2.8, "w", 2], [1.2, -1.8, 4.2, 2.6, "k", 0], [5.4, -1.3, 6.8, 1.15, "m", 0], [12.0, -1.6, 1.2, 1.7, "k", 0], [1.8, -3.1, 4.2, 1.0, "k", 2], [5.4, -1.3, 6.8, 0.3, "e", 0]] },
  // DL-44 — Mauser-style box magazine ahead of the grip, scope, conical flash hider
  6: { mz: [11.4, -0.6], parts: [[-2.4, -0.8, 3.0, 2.9, "wd", 2], [0.5, -1.8, 6.2, 2.4, "k", 0], [2.2, 0.6, 2.0, 2.0, "m", 0], [6.6, -1.3, 3.8, 1.2, "m", 0], [10.2, -1.7, 1.4, 2.0, "k", 0], [1.2, -3.2, 5.2, 1.1, "k", 2], [6.8, -1.65, 2.6, 0.4, "e", 4]] },
  // E-11 — Sterling-pattern tube with cooling holes, scope, folding stock, side magazine
  2: { mz: [11.6, -0.4], parts: [[-6, -0.5, 4.6, 1.0, "m", 0], [-1.6, -1.6, 11.6, 2.4, "k", 4], [1.2, 0.8, 1.6, 2.2, "m", 0], [0.5, -3.0, 5.6, 1.0, "k", 2], [9.6, -1.25, 2.0, 1.7, "m", 0]] },
  // EE-3 — sawed-stock carbine, long barrel, scope
  54: { mz: [14.4, -0.4], parts: [[-4.6, -1.0, 4.4, 2.4, "wd", 2], [-0.4, -1.6, 7.4, 2.6, "k", 0], [7, -1.0, 7.4, 1.1, "m", 0], [0.8, -3.0, 5.4, 1.0, "k", 2], [12.8, -1.35, 1.6, 1.7, "k", 0]] },
  // Blade Runner blaster — chunky revolver frame, amber grips
  41: { mz: [10.4, -0.6], parts: [[-2.4, -0.9, 3.0, 3.0, "am", 2], [0.6, -2.0, 4.4, 3.2, "k", 2], [5, -1.4, 5.4, 1.6, "m", 0], [1, -2.6, 3.4, 0.6, "e", 0]] },
  // Type-II phaser — grey hand phaser, dark emitter lens
  22: { mz: [8.4, -0.3], parts: [[-1.8, -1.2, 9.6, 2.0, "s", 2], [-1.2, 0.6, 2.4, 2.6, "g", 2], [7.4, -0.8, 1.0, 1.0, "m", 0], [1.5, -1.5, 2.6, 0.5, "k", 0]] },
  // Westinghouse M-25 plasma rifle — heavy angular body, vents (unlit)
  40: { mz: [15.2, -0.3], parts: [[-7, -1.4, 5.6, 2.6, "k", 2], [-1.6, -2.3, 11.2, 4.0, "m", 2], [9.4, -1.2, 5.8, 1.8, "k", 4], [0.4, 1.5, 2.2, 2.4, "k", 0], [-1.6, -2.3, 11.2, 0.45, "e", 0]] },
  // AER9 laser rifle — retro body, finned focus housing (unlit)
  43: { mz: [14.6, -0.3], parts: [[-7, -1.2, 5.6, 2.4, "w", 2], [-1.6, -1.8, 8.4, 3.0, "m", 0], [6.8, -1.3, 7.8, 1.8, "k", 4], [1.6, 1.1, 1.8, 2.2, "k", 0], [-1.6, -1.8, 8.4, 0.4, "e", 0]] },
  // gravity gun — orange-and-grey body, three prongs (no glow)
  45: { mz: [11.6, -0.2], parts: [[-4.5, -2.0, 9.5, 3.8, "#8a5a2b", 2], [-4.5, -2.0, 9.5, 0.5, "#b07a3c", 0], [4.8, -1.2, 3.2, 2.2, "m", 0], [7.8, -2.4, 3.6, 0.7, "e", 0], [7.8, 1.0, 3.6, 0.7, "e", 0], [8.4, -0.45, 3.2, 0.6, "k", 0]] },
  // Chozo arm cannon — banded cylinder, dark muzzle
  47: { mz: [10.8, -0.2], parts: [[-3, -2.6, 9.2, 4.8, "#a5502e", 2], [-1, -2.8, 1.2, 5.2, "#6e3a20", 0], [2.6, -2.8, 1.2, 5.2, "#6e3a20", 0], [6.2, -1.9, 4.6, 3.4, "#7d8a3c", 2], [10, -1.0, 0.9, 1.6, "h", 0]] },
  // Asgard beam device — sleek grey
  10: { mz: [9.0, -0.2], parts: [[-2.0, -1.4, 10.6, 2.4, "s", 2], [-2.0, -1.4, 10.6, 0.4, "wh", 0], [7.6, -0.8, 1.2, 1.2, "g", 2]] },
  // Cylon forearm cannon — silver housing
  26: { mz: [12.6, -0.2], parts: [[-3, -2.2, 11.5, 4.0, "s", 2], [8.5, -1.4, 4.2, 2.4, "g", 4], [-3, -2.2, 11.5, 0.5, "wh", 0]] }
};
function gaRR(g, x, y, w, h, r) { r = Math.min(r, w / 2, h / 2); g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); g.fill(); }
function gaDraw(g, id, rack, isSuper) {
  const G = GUNS[id];
  const rs = Math.max(-1.2, Math.min(1.2, rack || 0));
  g.save();
  if (!G.parts.some(p => p[5] & 1)) g.translate(-rs * 1.1, 0);   // no slide: the whole gun kicks back a touch
  for (const p of G.parts) {
    const [x, y, w, h, c, f] = p, dx = f & 1 ? -rs * 2.2 : 0;
    g.fillStyle = GA_C[c] || c;
    if (f & 2) gaRR(g, x + dx, y, w, h, Math.min(1.2, h * 0.4)); else g.fillRect(x + dx, y, w, h);
    if (f & 4) { g.fillStyle = "#0d0f11"; const n = Math.max(2, Math.floor(w / 1.45)); for (let i = 0; i < n; i++) g.fillRect(x + dx + 0.55 + i * (w - 1) / n, y + h * 0.3, Math.min(0.55, w / n * 0.45), h * 0.4); }
  }
  // a quiet brass line marks a level-10 weapon (it used to be a bright gold bar)
  if (isSuper) { g.fillStyle = "#9e8040"; const P = G.parts[1] || G.parts[0]; g.fillRect(P[0] + 0.6, P[1] + P[3] - 0.45, Math.max(1, P[2] - 1.2), 0.3); }
  // the suppressor on the player's gun (screws on / off)
  if (G.can && GA.owner && GA.supK > 0.01) {
    const [L, D, col] = G.can, k = GA.supK, ease = k * k * (3 - 2 * k), x0 = G.mz[0] + (1 - ease) * 3.2, y0 = G.mz[1] - D / 2;
    g.globalAlpha = Math.min(1, k * 1.6);
    g.fillStyle = col; gaRR(g, x0 - 0.4, y0, L * (0.55 + 0.45 * ease), D, D * 0.35);
    g.fillStyle = "rgba(255,255,255,0.10)"; g.fillRect(x0, y0 + 0.2, L * (0.55 + 0.45 * ease) - 0.8, Math.max(0.25, D * 0.18));
    // thread / end-cap rings (they turn while it's being fitted)
    g.fillStyle = "rgba(0,0,0,0.45)"; const tw = (GA.twist * 3) % 1;
    g.fillRect(x0 + 0.5 + tw * 0.6, y0, 0.32, D); g.fillRect(x0 + L * (0.55 + 0.45 * ease) - 1.3, y0, 0.32, D);
    g.globalAlpha = 1;
  }
  // the weapon light under the barrel
  if (GA.owner && GA.light) {
    const lx = Math.max(2.5, G.mz[0] - 6.2), ly = (G.parts[0][1] + G.parts[0][3]) + 0.1;
    g.fillStyle = "#1b1d20"; gaRR(g, lx, ly - 0.2, 3.4, 1.3, 0.5);
    if (gaNight()) { g.fillStyle = "#fff6d5"; g.fillRect(lx + 3.1, ly - 0.05, 0.45, 1.0); }
  }
  g.restore();
}
function gaIsGun(id) { return !!GUNS[id]; }
function gaNight() { return typeof SCN !== "undefined" && SCN.clockOn !== false && (SCN.dark || 0) > 0.18; }
function gaPlayerHasGun() {
  if (!player || !player.weapons) return false;
  if (typeof stHeroProfile === "function") { const p = stHeroProfile(player.cid); if (p && p[1] === "g") return true; }
  return player.weapons.some(w => w && w.enabled !== false && GUNS[w.id] && [1, 2, 6, 8, 13, 15, 22, 25, 27, 28, 31, 32, 33, 39, 40, 41, 43, 44, 51, 52, 53, 54].includes(w.id));
}

/* --- the weapon light ------------------------------------------------------------------------------------------ */
function gaLightToggle(on) {
  GA.light = on === undefined ? !GA.light : !!on;
  if (typeof sfx === "function") sfx(GA.light ? 2200 : 1700, GA.light ? 2200 : 1700, 0.025, "square", 0.05);
  if (GA.btn) GA.btn.classList.toggle("on", GA.light);
}
function gaBeam() {
  if (!GA.light || !player || !gaNight() || player.inVehicle) return null;
  const a = player.aim || 0, c = Math.cos(a), s = Math.sin(a), x0 = player.x + c * 14, y0 = player.y + s * 14;
  let reach = 420;
  try { const h = cityRay(x0, y0, x0 + c * reach, y0 + s * reach, F_SIGHT, 520); if (h.hit) reach = Math.max(30, h.t * reach); } catch (e) {}
  return { x0, y0, c, s, reach };
}
function gaLights(push) {
  const B = gaBeam(); if (!B) return;
  for (let i = 1; i <= 6; i++) { const d = Math.min(B.reach, i * 70); push(B.x0 + B.c * d, B.y0 + B.s * d, 26 + d * 0.32, 0.95, "torch"); if (d >= B.reach) break; }
}
function gaDrawBeam(g) {
  const B = gaBeam(); if (!B) return;
  const L = B.reach, w = L * 0.36;
  g.save(); g.translate(B.x0, B.y0); g.rotate(Math.atan2(B.s, B.c));
  const gr = g.createLinearGradient(0, 0, L, 0); gr.addColorStop(0, "rgba(255,246,213,0.30)"); gr.addColorStop(1, "rgba(255,246,213,0)");
  g.globalCompositeOperation = "lighter"; g.fillStyle = gr;
  g.beginPath(); g.moveTo(0, -1.5); g.lineTo(L, -w); g.lineTo(L, w); g.lineTo(0, 1.5); g.closePath(); g.fill();
  g.restore();
}
function gaUi() {
  if (!GA.btn) {
    const b = document.createElement("button");
    b.id = "gaLight"; b.type = "button"; b.textContent = "🔦"; b.title = "Weapon light (L)";
    b.style.cssText = "position:fixed;right:max(10px,env(safe-area-inset-right));bottom:calc(352px + env(safe-area-inset-bottom));z-index:60;display:none;width:54px;height:54px;border-radius:50%;border:2px solid #fff3c4;background:#2b2715;color:#fff;font-size:24px;touch-action:none;box-shadow:0 4px 16px rgba(0,0,0,.5)";
    const st = document.createElement("style"); st.textContent = "#gaLight.on{background:#8a7a2a;box-shadow:0 0 16px rgba(255,240,170,.6)}@media (max-height:520px){#gaLight{bottom:calc(124px + env(safe-area-inset-bottom))!important;right:calc(84px + env(safe-area-inset-right))!important}}";
    document.head.appendChild(st);
    b.addEventListener("pointerdown", e => { e.preventDefault(); e.stopPropagation(); gaLightToggle(); });
    document.body.appendChild(b); GA.btn = b;
  }
  const show = typeof runActive !== "undefined" && runActive && !runPaused && typeof CITY !== "undefined" && CITY.on && player && !player.inVehicle && gaPlayerHasGun() && (gaNight() || GA.light);
  GA.btn.style.display = show ? "block" : "none";
}

/* --- wiring ---------------------------------------------------------------------------------------------------- */
(function gaWire() {
  if (typeof drawWeaponModel === "function") {
    const _dw = drawWeaponModel;
    window.drawWeaponModel = drawWeaponModel = function (tCtx, wpnId, style, isLv5, isSuper, bladeCol, rackShift = 0, angVel = 0, bladeLenPx = 0, dblOverride = null, hilt = null) {
      if (GUNS[wpnId] && !(bladeLenPx > 0)) { gaDraw(tCtx, wpnId, rackShift, isSuper); return; }
      return _dw(tCtx, wpnId, style, isLv5, isSuper, bladeCol, rackShift, angVel, bladeLenPx, dblOverride, hilt);
    };
  }
  if (typeof drawHeroSprite === "function") {
    const _dh = drawHeroSprite;
    window.drawHeroSprite = drawHeroSprite = function (x, y, fac, cid, walk, aim, inVeh, tCtx, guardZone) {
      const me = player && cid === player.cid && Math.abs(x - player.x) < 2 && Math.abs(y - player.y) < 2;
      GA.owner = !!me;
      try { return _dh.apply(this, arguments); } finally { GA.owner = false; }
    };
  }
  if (typeof stealthToggleSuppressor === "function") {
    const _ts = stealthToggleSuppressor;
    window.stealthToggleSuppressor = stealthToggleSuppressor = function () {
      const was = typeof ST !== "undefined" && ST.suppressed;
      _ts();
      if (typeof ST !== "undefined" && ST.suppressed !== was && typeof sfx === "function") for (let i = 0; i < 3; i++) setTimeout(() => sfx(3200 - i * 400, 2600 - i * 400, 0.018, "square", 0.035), 90 + i * 110);
    };
  }
  if (typeof stHeroVisMul === "function") { const _hv = stHeroVisMul; window.stHeroVisMul = stHeroVisMul = function () { let m = _hv(); if (GA.light && gaNight()) m *= 1.5; return m; }; }
  if (typeof scnLights === "function") { const _sl = scnLights; window.scnLights = scnLights = function (push) { _sl(push); try { gaLights(push); } catch (e) {} }; }
  if (typeof V10 !== "undefined") {
    V10.onRunStart.push(() => { GA.supK = typeof ST !== "undefined" && ST.suppressed ? 1 : 0; GA.light = false; if (GA.btn) GA.btn.classList.remove("on"); });
    V10.onRenderWorld.push(g => { try { gaDrawBeam(g || ctx); } catch (e) {} });
    V10.onFrame.push(dt => {
      const want = typeof ST !== "undefined" && ST.suppressed && typeof CITY !== "undefined" && CITY.on ? 1 : 0, d = (dt || 0.016) / 0.45;
      if (GA.supK !== want) { GA.supK = want > GA.supK ? Math.min(1, GA.supK + d) : Math.max(0, GA.supK - d); GA.twist += (dt || 0.016) * 4; }
      gaUi();
    });
  }
  window.addEventListener("keydown", e => { if (e.code === "KeyL" && !e.repeat && typeof runActive !== "undefined" && runActive && !runPaused && gaPlayerHasGun()) gaLightToggle(); });
})();
// EOF:js/gunart.js
