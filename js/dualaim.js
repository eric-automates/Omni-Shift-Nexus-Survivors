/* ============================================================================================================
   js/dualaim.js — v14.3 INDEPENDENT HANDS
   A hero with a ranged weapon in each hand (twin pistols, two different guns, four-armed heroes…) no longer has
   both hands locked to one aim line: every hand picks its own target and swings to it on its own.
   • hand 1 takes the nearest threat; hand 2 the next one, and so on (a target already covered is skipped)
   • both hands only double up on one target when it is close (inside ≈ 3.5 m) — or when it's the only target
   • each hand turns at its own speed, so they visibly move apart and back together
   The guns fire where their hand points (js/combat.js asks dualAimTarget(w) for the target).
   ============================================================================================================ */
const DUAL = { slots: [], tgt: new Map(), t: 0, close: 110, prev: new Set() };

function dualIsRanged(w) {
  if (!w) return false;
  if (typeof isSwordWeapon === "function" && isSwordWeapon(w.id)) return false;
  if (w.style === "orbit" && ![12, 16, 29, 44, 73].includes(w.id)) return false;   // blades & sabers (the Form engine moves those)
  return true;
}
// the hands in use this frame, in the sim's slot order
function dualHands() {
  if (!player || !player.weapons) return [];
  const en = player.weapons.filter(w => w.enabled !== false), cap = Math.min(player.armCap || 2, en.length), out = [];
  for (let s = 0; s < cap; s++) out.push(en[((player.handSlotOffset || 0) + s) % en.length]);
  return out;
}
function dualCandidates() {
  const c = [];
  for (let i = 0; i < MAX_E; i++) {
    if (!eAct[i] || eStagger[i] > 0) continue;
    if (typeof sdIgnore === "function" && sdIgnore(i)) continue;
    if (typeof isEnemyOnScreen === "function" && !isEnemyOnScreen(i)) continue;
    c.push([i, Math.hypot(eX[i] - player.x, eY[i] - player.y)]);
  }
  c.sort((a, b) => a[1] - b[1]);
  return c;
}
// assign a target to every ranged hand (only when two or more ranged hands are out)
function dualAssign() {
  DUAL.tgt.clear();
  const hands = dualHands().filter(dualIsRanged);
  DUAL.slots = hands;
  if (hands.length < 2) return;
  const C = dualCandidates(); if (!C.length) return;
  const used = new Set();
  hands.forEach((w, h) => {
    let pick = null;
    if (h === 0) pick = C[0];
    else {
      // a close threat gets both guns; otherwise the next target nobody covers yet
      if (C[0][1] < DUAL.close && !(C[1] && C[1][1] < DUAL.close)) pick = C[0];
      else pick = C.find(e => !used.has(e[0])) || C[0];
    }
    used.add(pick[0]);
    DUAL.tgt.set(w, pick[0]);
  });
}
function dualAimTarget(w) {
  const j = DUAL.tgt.get(w);
  if (j === undefined || !eAct[j] || eStagger[j] > 0) return -1;
  // re-check between assignments: a foe can turn into a duel spectator, get staggered or leave the screen
  if (typeof sdIgnore === "function" && sdIgnore(j)) return -1;
  return (typeof isEnemyOnScreen === "function" && !isEnemyOnScreen(j)) ? -1 : j;
}
// after the sim's weapon loop: point every ranged hand at its own target
function dualStep(dt) {
  if (!player || typeof runActive === "undefined" || !runActive) return;
  DUAL.t -= dt;
  if (DUAL.t <= 0) { DUAL.t = 0.12; dualAssign(); }
  if (DUAL.slots.length < 2) { DUAL.prev.clear(); return; }
  for (const w of DUAL.slots) {
    // a hand that just came into play starts from where the sim put it (no swing from a stale angle)
    if (!DUAL.prev.has(w)) w.dualAng = typeof w.armAng === "number" ? w.armAng : (player.aim || 0);
    const j = dualAimTarget(w);
    const want = j >= 0 ? Math.atan2(eY[j] - player.y, eX[j] - player.x) : (player.aim || 0) + (DUAL.slots.indexOf(w) % 2 ? 0.18 : 0);
    let d = want - w.dualAng; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2;
    w.dualAng += d * Math.min(1, dt * (11 + DUAL.slots.indexOf(w) * 2.5));   // each hand at its own pace
    w.armAng = w.dualAng; w.ang = w.dualAng;
  }
  DUAL.prev = new Set(DUAL.slots);
}
(function dualWire() {
  if (typeof V10 === "undefined") return;
  V10.onRunStart.push(() => { DUAL.tgt.clear(); DUAL.slots = []; DUAL.t = 0; DUAL.prev.clear(); });
  V10.onStep.push(dt => { try { dualStep(dt); } catch (e) {} });
})();
// EOF:js/dualaim.js
