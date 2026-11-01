/* ============================================================================================================
   js/gunaudio.js — v14.3 GUNSHOTS
   • Firearms sound like firearms: a sharp crack, a low thump and the mechanism — tuned per class (pistol, SMG,
     rifle, magnum/revolver, shotgun, machine gun); the old laser "pew" on the P90 and the Force-lightning sound on
     the Lucifer super shotgun are gone. Blasters keep their blaster voices.
   • Suppressed (the visible can): the crack drops away to a dull, still clearly audible "thup" plus the action
     cycling (and a faint supersonic snap from rifles) — quieter, not silent, not a movie "pfft".
   • Unsuppressed shots get a small echo off the surroundings: a quick slap between buildings, a longer softer
     one in the open, a short room ring indoors. Rifles and big guns echo more than pistols. When lots of shots
     overlap the echoes are thinned out and capped so a firefight never turns into a wash of reverb.
   ============================================================================================================ */
const GAU = { recent: [], voices: 0 };
// class, crack (0-1), thump (Hz), body (Hz), loudness, echo amount
const GAU_GUN = {
  51: ["pistol", 0.8, 150, 1500, 0.9, 0.55], 13: ["pistol", 0.85, 135, 1300, 0.95, 0.6], 39: ["smg", 0.7, 160, 1700, 0.75, 0.45],
  8: ["smg", 0.8, 145, 1900, 0.85, 0.6], 15: ["rifle", 1.0, 95, 1100, 1.15, 1.0], 32: ["rifle", 0.95, 110, 1300, 1.0, 0.9],
  31: ["rifle", 0.95, 105, 1250, 1.0, 0.9], 27: ["rifle", 0.9, 115, 1400, 0.95, 0.85], 25: ["magnum", 1.0, 90, 1000, 1.15, 0.85],
  52: ["magnum", 0.95, 85, 900, 1.1, 0.9], 33: ["shotgun", 0.9, 70, 800, 1.2, 1.0], 44: ["shotgun", 0.95, 75, 850, 1.15, 0.95],
  28: ["mg", 0.9, 100, 1200, 1.05, 0.8], 53: ["mg", 0.95, 95, 1150, 1.1, 0.9]
};
function gauEnv() {
  try {
    if (typeof CITY === "undefined" || !CITY.on || !player) return "open";
    if (typeof cityBuildingAt === "function" && cityBuildingAt(player.x, player.y)) return "room";
    // buildings close by on two sides or more: a street canyon
    let near = 0; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const h = cityRay(player.x, player.y, player.x + dx * 420, player.y + dy * 420, F_SIGHT, 480); if (h.hit) near++; }
    return near >= 2 ? "street" : "open";
  } catch (e) { return "open"; }
}
function gauSuppressed(wpnId) {
  return typeof ST !== "undefined" && ST.suppressed && typeof CITY !== "undefined" && CITY.on && player && player.weapons && player.weapons.some(w => w.id === wpnId) && typeof stHeroProfile === "function" && !!stHeroProfile(wpnId)[2];
}
function gauNoise(ac, t, dur, type, f0, f1, q, gain, dest) {
  const src = ac.createBufferSource(), flt = ac.createBiquadFilter(), g = ac.createGain();
  src.buffer = noiseBuf; src.loop = true;
  flt.type = type; flt.Q.setValueAtTime(q, t);
  flt.frequency.setValueAtTime(Math.max(30, f0), t); flt.frequency.exponentialRampToValueAtTime(Math.max(30, f1), t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(gain, t + 0.002); g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
  src.connect(flt); flt.connect(g); g.connect(dest || ac.destination);
  src.start(t, Math.random() * 0.5); src.stop(t + dur + 0.02);
}
function gauTone(ac, t, dur, type, f0, f1, gain, dest) {
  const o = ac.createOscillator(), g = ac.createGain();
  o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(gain, t + 0.003); g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
  o.connect(g); g.connect(dest || ac.destination); o.start(t); o.stop(t + dur + 0.02);
}
function gauShot(wpnId) {
  const S = GAU_GUN[wpnId];
  const ac = ensureAudio(); if (!ac || !noiseBuf) return;
  const now = ac.currentTime, vol = (typeof opts !== "undefined" ? opts.vol : 0.5) || 0;
  if (vol <= 0) return;
  const [cls, crack, thump, body, loud, echo] = S, sup = gauSuppressed(wpnId), j = 0.94 + Math.random() * 0.12;
  // how busy is it? (shots in the last half second)
  const tn = performance.now(); GAU.recent = GAU.recent.filter(x => tn - x < 500); GAU.recent.push(tn);
  const busy = GAU.recent.length, thin = 1 / (1 + Math.max(0, busy - 2) * 0.45);
  const out = ac.createGain(); out.gain.value = vol * loud * (busy > 6 ? 0.8 : 1); out.connect(ac.destination);
  if (!sup) {
    gauNoise(ac, now, 0.035, "highpass", 2600 * j, 1400, 0.7, 0.55 * crack, out);                 // the crack
    gauNoise(ac, now, cls === "shotgun" ? 0.2 : 0.13, "bandpass", body * j, body * 0.28, 0.9, 0.42, out);   // the blast body
    gauTone(ac, now, cls === "shotgun" || cls === "magnum" ? 0.2 : 0.12, "sine", thump * 1.6 * j, thump * 0.5, 0.5, out);   // the thump
    if (cls === "smg" || cls === "mg" || cls === "rifle" || cls === "pistol") gauTone(ac, now + 0.045, 0.012, "square", 3100 * j, 2400, 0.05, out);   // the action
  } else {
    gauNoise(ac, now, 0.07, "bandpass", 520 * j, 210, 1.1, 0.42, out);      // the dull "thup" — still a real report
    gauTone(ac, now, 0.07, "sine", thump * 1.2 * j, thump * 0.45, 0.32, out);
    gauNoise(ac, now, 0.018, "highpass", 1800, 1200, 0.8, 0.07, out);     // gas at the ports
    gauTone(ac, now + 0.028, 0.012, "square", 2800 * j, 2200, 0.07, out);  // the action cycling, clearly audible now
    gauTone(ac, now + 0.05, 0.01, "square", 2300 * j, 1900, 0.05, out);
    if (cls === "rifle" || cls === "mg") gauNoise(ac, now + 0.004, 0.012, "highpass", 4200, 3000, 0.8, 0.1, out);   // supersonic snap
  }
  // echo off the surroundings (thinned and capped when many overlap)
  const env = gauEnv(), amt = (sup ? 0.12 : 1) * echo * thin;
  if (amt < 0.06 || GAU.voices > 4) return;
  const taps = env === "room" ? [[0.018, 0.22], [0.041, 0.14]] : env === "street" ? [[0.1 + Math.random() * 0.03, 0.26], [0.24 + Math.random() * 0.05, 0.12]] : [[0.32 + Math.random() * 0.12, 0.13]];
  GAU.voices++; setTimeout(() => { GAU.voices = Math.max(0, GAU.voices - 1); }, 700);
  for (const [d, g] of taps) {
    const lp = env === "room" ? 2400 : env === "street" ? 1500 : 900;
    gauNoise(ac, now + d, cls === "shotgun" ? 0.28 : 0.2, "lowpass", lp, lp * 0.35, 0.6, 0.3 * g * amt, out);
    gauTone(ac, now + d, 0.14, "sine", thump * 1.1, thump * 0.5, 0.18 * g * amt, out);
  }
}
(function gauWire() {
  if (typeof sfxWeapon !== "function") return;
  const _sw = sfxWeapon;
  window.sfxWeapon = sfxWeapon = function (style, wpnId = 0, isSaber = false) {
    if (!isSaber && GAU_GUN[wpnId]) { try { gauShot(wpnId); } catch (e) {} return; }
    return _sw(style, wpnId, isSaber);
  };
})();
// EOF:js/gunaudio.js
