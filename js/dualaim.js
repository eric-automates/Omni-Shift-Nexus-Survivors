/* ============================================================================================================
   js/dualaim.js — v14.3 INDEPENDENT HANDS
   A hero with a ranged weapon in each hand (twin pistols, two different guns, Neo's two Micro-Uzis, four-armed
   heroes, a wizard's floating extras…) no longer has every hand locked to one aim line: each hand picks its own
   target and swings to it on its own.
   • hand 1 takes the nearest threat; every other hand the nearest one nobody covers yet
   • the hands only double up on one target when it is close (inside ≈ 3.5 m and the only one that close) — or
     when it's the only target there is
   • each hand turns at its own speed, so they visibly split apart and come back together; no front-arc limit
   The guns fire where their hand points: js/combat.js asks dualAimTarget(w) (and dualPairAngles(w) for a matched
   pair held as one weapon, like Neo's Uzis).
   ============================================================================================================ */
const DUAL = { hands: [], inSet: new Set(), t: 0, close: 110, prev: new Set(), pair: new Set([39]) };

function dualIsRanged(w) {
  if (!w) return false;
  if (typeof isSwordWeapon === "function" && isSwordWeapon(w.id)) return false;
  if (w.style === "orbit" && ![12, 16, 29, 44, 73].includes(w.id)) return false;   // blades & sabers (the Form engine moves those)
  return true;
}
// the weapons in use this frame, in the sim's slot order
function dualSlots() {
  if (!player || !player.weapons) return [];
  const en = player.weapons.filter(w => w.enabled !== false), cap = Math.min(player.armCap || 2, en.length), out = [];
  for (let s = 0; s < cap; s++) out.push(en[((player.handSlotOffset || 0) + s) % en.length]);
  return out;
}
// a matched pair held as one weapon (Neo's Micro-Uzis) fills both hands while it is the weapon in hand
function dualPairFree(n) {
  // the second hand is free when nothing else is held, or when the extras float (telekinetic heroes)
  return n === 1 || (typeof getHeroKinematicStyle === "function" && player && getHeroKinematicStyle(player.cid) === 5);
}
function dualPairOn(w) { const S = dualSlots(); return !!w && DUAL.pair.has(w.id) && S[0] === w && dualPairFree(S.length); }
// every ranged hand: { w, h } — h 1 is the second gun of a matched pair
function dualHandList() {
  const out = [];
  const S = dualSlots();
  S.forEach((w, s) => {
    if (!dualIsRanged(w)) return;
    out.push({ w, h: 0 });
    if (s === 0 && DUAL.pair.has(w.id) && dualPairFree(S.length)) out.push({ w, h: 1 });
  });
  return out;
}
function dualSt(w, h) { const a = w._dh || (w._dh = [{ t: -1, ang: null }, { t: -1, ang: null }]); return a[h]; }
function dualCandidates() {
  const c = [];
  for (let i = 0; i < MAX_E; i++) {
    if (!eAct[i] || allyIs(i) || eStagger[i] > 0) continue;
    if (typeof sdIgnore === "function" && sdIgnore(i)) continue;
    if (typeof isEnemyOnScreen === "function" && !isEnemyOnScreen(i)) continue;
    c.push([i, Math.hypot(eX[i] - player.x, eY[i] - player.y)]);
  }
  c.sort((a, b) => a[1] - b[1]);
  return c;
}
// give every ranged hand a target (only when two or more ranged hands are out)
function dualAssign() {
  const H = dualHandList();
  DUAL.hands = H; DUAL.inSet = new Set(H.map(o => o.w));
  for (const o of H) dualSt(o.w, o.h).t = -1;
  if (H.length < 2) return;
  const C = dualCandidates(); if (!C.length) return;
  const loneClose = C[0][1] < DUAL.close && !(C[1] && C[1][1] < DUAL.close);
  const used = new Set();
  H.forEach((o, i) => {
    // a close threat gets every gun; otherwise the next target nobody covers yet
    const pick = i === 0 || loneClose ? C[0] : (C.find(e => !used.has(e[0])) || C[0]);
    used.add(pick[0]);
    dualSt(o.w, o.h).t = pick[0];
  });
}
function dualAimTarget(w, h) {
  if (!w || DUAL.hands.length < 2 || !DUAL.inSet.has(w) || !w._dh) return -1;
  const j = w._dh[h || 0].t;
  if (j < 0 || !eAct[j] || allyIs(j) || eStagger[j] > 0) return -1;
  // re-checked between assignments: a foe can turn into a duel spectator, get staggered or leave the screen
  if (typeof sdIgnore === "function" && sdIgnore(j)) return -1;
  return (typeof isEnemyOnScreen === "function" && !isEnemyOnScreen(j)) ? -1 : j;
}
// the two firing angles of a matched pair (falls back to the shared aim)
function dualPairAngles(w, fb) {
  const r = [fb, fb];
  for (let h = 0; h < 2; h++) {
    const j = dualAimTarget(w, h);
    if (j >= 0) r[h] = Math.atan2(eY[j] - player.y, eX[j] - player.x);
    else if (h === 1) r[1] = r[0];
  }
  return r;
}
// after the sim's weapon loop: point every ranged hand at its own target
function dualStep(dt) {
  if (!player || typeof runActive === "undefined" || !runActive) return;
  DUAL.t -= dt;
  if (DUAL.t <= 0) { DUAL.t = 0.12; dualAssign(); }
  const H = DUAL.hands;
  if (H.length < 2) { DUAL.prev.clear(); return; }
  const seen = new Set();
  H.forEach((o, i) => {
    const st = dualSt(o.w, o.h), key = o.w._dk || (o.w._dk = Math.random());
    // a hand that just came into play starts from where the sim put it (no swing from a stale angle)
    if (!DUAL.prev.has(key + o.h) || typeof st.ang !== "number") st.ang = (typeof o.w.armAng === "number" ? o.w.armAng : (player.aim || 0)) + (o.h ? 0.18 : 0);
    seen.add(key + o.h);
    const j = dualAimTarget(o.w, o.h);
    const want = j >= 0 ? Math.atan2(eY[j] - player.y, eX[j] - player.x) : (player.aim || 0) + (i % 2 ? 0.18 : 0);
    let d = want - st.ang; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2;
    st.ang += d * Math.min(1, dt * (11 + i * 2.5));   // each hand at its own pace
    if (o.h === 0) { o.w.armAng = st.ang; o.w.ang = st.ang; } else o.w.armAng2 = st.ang;
  });
  DUAL.prev = seen;
}
(function dualWire() {
  if (typeof V10 === "undefined") return;
  V10.onRunStart.push(() => { DUAL.hands = []; DUAL.inSet = new Set(); DUAL.t = 0; DUAL.prev.clear(); });
  V10.onStep.push(dt => { try { dualStep(dt); } catch (e) {} });
})();
// EOF:js/dualaim.js
