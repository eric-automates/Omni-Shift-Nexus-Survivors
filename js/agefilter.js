/* =========================================================================
   OMNI-SHIFT v14.2 — AGE-APPROPRIATE CONTENT FILTER
   One setting, three levels (Options → 🛡️ Age-Appropriate Content):
     OFF     the full experience — saber bisections, dismemberment, blood, bodies.
     NORMAL  no slicing / dismemberment: defeated foes simply fall, whole.
             Blood becomes a quick pop of SPARKS (or blue / green / nothing)
             that vanishes at once — no drips, pools, stains or severed parts.
     STRONG  very mild: no blood, no bodies, no gory finishers. Defeated foes
             vanish in a short sparkle "KO" puff, EXECUTE becomes TAKEDOWN and
             floating words are softened ("kill" → "defeat").
   An optional 4-digit parent PIN stops the level from being lowered.
   Everything is done by wrapping the gore spawners (spawnDrip, spawnGroundLimb,
   spawnCorpse, spawnBisectedBodyHalves, cityDecal "blood", enemyBloodCol,
   spawnSpeech) plus three render-side checks, so no gameplay changes: corpses
   still exist invisibly in STRONG mode (the necromancer can still raise them).
   ========================================================================= */
"use strict";

const AGE = { level: 0, fx: "sparks", pin: "" };
const AGE_NAMES = ["OFF", "NORMAL", "STRONG"];
const AGE_FX_LIST = ["sparks", "blue", "green", "none"];
const AGE_FX_NAMES = { sparks: "SPARKS", blue: "BLUE", green: "GREEN", none: "NOTHING" };
const AGE_INFO = [
  ["OFF", "Full experience: lightsaber bisections, dismemberment, blood and bodies."],
  ["NORMAL", "No slicing or dismemberment — foes fall whole. Blood becomes a quick pop of sparks (or blue / green / nothing) with no stains."],
  ["STRONG", "Very mild: no blood, no bodies, no gory finishers. Foes vanish in a quick sparkle, EXECUTE becomes TAKEDOWN and words are softened."]
];
if (typeof PT_PALETTE !== "undefined" && PT_PALETTE.indexOf("#2979ff") < 0) PT_PALETTE.push("#2979ff");   // index 16: blue pops
const AGE_PAL = { sparks: [0, 2, 1], blue: [16, 9, 16], green: [10, 10, 2], none: null };

function ageLoad() {
  const o = typeof opts !== "undefined" ? opts : {};
  AGE.level = [0, 1, 2].includes(o.age) ? o.age : 0;
  AGE.fx = AGE_FX_LIST.includes(o.ageFx) ? o.ageFx : "sparks";
  AGE.pin = typeof o.agePin === "string" ? o.agePin : "";
}
function ageSave() { if (typeof opts === "undefined") return; opts.age = AGE.level; opts.ageFx = AGE.fx; opts.agePin = AGE.pin; if (typeof saveOpts === "function") saveOpts(); }
function ageHashPin(p) { let h = 2166136261; const s = "omni" + p; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36); }
// level change; lowering a PIN-locked level asks for the PIN
function ageSetLevel(lv) {
  lv = Math.max(0, Math.min(2, lv | 0));
  if (AGE.pin && lv < AGE.level) {
    const p = window.prompt("Parent PIN required to lower the Age-Appropriate setting:");
    if (p === null || ageHashPin(p.trim()) !== AGE.pin) { if (p !== null) window.alert("Wrong PIN — setting unchanged."); return false; }
  }
  AGE.level = lv; ageSave(); ageApplyLabels(); return true;
}
function ageCycle() { return ageSetLevel(AGE.level === 2 ? 0 : AGE.level + 1); }
function ageCycleFx() { AGE.fx = AGE_FX_LIST[(AGE_FX_LIST.indexOf(AGE.fx) + 1) % AGE_FX_LIST.length]; ageSave(); }
function agePinToggle() {
  if (AGE.pin) {
    const p = window.prompt("Enter the parent PIN to remove the lock:");
    if (p !== null && ageHashPin(p.trim()) === AGE.pin) { AGE.pin = ""; ageSave(); window.alert("PIN lock removed."); }
    else if (p !== null) window.alert("Wrong PIN.");
    return;
  }
  const p = window.prompt("Choose a 4-digit parent PIN. With a PIN set, the Age-Appropriate level can only be RAISED without it:");
  if (p === null) return;
  if (!/^\d{4}$/.test(p.trim())) { window.alert("Please use exactly 4 digits."); return; }
  AGE.pin = ageHashPin(p.trim()); ageSave(); window.alert("PIN set. Current level: " + AGE_NAMES[AGE.level] + ".");
}

/* --- effects ------------------------------------------------------------------- */
// a hit / wound "pop": NORMAL = a few quick sparks in the chosen colour; STRONG = nothing
function agePop(x, y, n = 3) {
  if (AGE.level !== 1 || typeof spawnPt !== "function") return;
  const pal = AGE_PAL[AGE.fx]; if (!pal) return;
  for (let k = 0; k < n; k++) {
    const a = Math.random() * 6.283, s = 50 + Math.random() * 90;
    spawnPt(x + (Math.random() - 0.5) * 6, y + (Math.random() - 0.5) * 6, Math.cos(a) * s, Math.sin(a) * s - 20, 0.18 + Math.random() * 0.14, 1.6 + Math.random() * 1.2, pal[k % pal.length], 0);
  }
}
// STRONG-mode defeat: a short sparkle ring instead of a body
function ageKOPuff(x, y, big) {
  if (typeof spawnPt !== "function") return;
  const n = big ? 14 : 8;
  for (let k = 0; k < n; k++) {
    const a = k / n * 6.283, s = (big ? 120 : 85) + Math.random() * 30;
    spawnPt(x, y - 4, Math.cos(a) * s, Math.sin(a) * s, 0.28 + Math.random() * 0.12, 2 + Math.random() * 1.5, k % 2 ? 1 : 2, 0);
  }
  if (typeof spawnBlastWave === "function") spawnBlastWave(x, y, big ? 34 : 22, "#ffffff");
}

/* --- wording -------------------------------------------------------------------- */
const AGE_WORDS_1 = [[/BISECT(ED|ING|S)?/g, "STRUCK"], [/DISMEMBER(ED|ING|S)?/g, "STRUCK"], [/DECAPITAT(ED|ION|E)/g, "KNOCKED OUT"],
  [/LIMBS? TORN/g, "TORN DOWN"], [/SPINE RIPPED/g, "TROPHY TAKEN"], [/BLOOD ?/g, ""], [/GORE/g, "FURY"], [/SEVER(ED|S)?/g, "STRUCK"]];
const AGE_WORDS_2 = AGE_WORDS_1.concat([[/KILLS/g, "KOs"], [/KILLED/g, "DEFEATED"], [/KILLING/g, "DEFEATING"], [/KILL/g, "DEFEAT"], [/EXECUTION/g, "TAKEDOWN"],
  [/EXECUTE/g, "TAKEDOWN"], [/RIP & TEAR/g, "TAKEDOWN"], [/DISINTEGRAT(ED|E|ION)/g, "BANISHED"], [/\bDIE\b/g, "FALL"], [/\bDEAD\b/g, "DOWN"],
  [/MURDER(ED|ER)?/g, "TROUBLE"], [/SLAUGHTER/g, "SHOWDOWN"], [/CARNAGE/g, "CHAOS"], [/☠/g, "★"]]);
function ageText(s) {
  if (!AGE.level || typeof s !== "string" || !s) return s;
  const L = AGE.level === 2 ? AGE_WORDS_2 : AGE_WORDS_1;
  let o = s;
  for (const [re, rep] of L) o = o.replace(new RegExp(re.source, "gi"), m => {   // keep the case of what was replaced
    if (!rep) return rep;
    if (m === m.toUpperCase()) return rep.toUpperCase();
    if (m[0] === m[0].toUpperCase()) return rep[0].toUpperCase() + rep.slice(1).toLowerCase();
    return rep.toLowerCase();
  });
  return o;
}
// glory-kill banners & the EXECUTE button
const AGE_GLORY_ORIG = {};
function ageApplyLabels() {
  if (typeof GLORY_STYLES === "undefined") return;
  for (const k in GLORY_STYLES) {
    if (!(k in AGE_GLORY_ORIG)) AGE_GLORY_ORIG[k] = GLORY_STYLES[k].label;
    GLORY_STYLES[k].label = AGE.level === 0 ? AGE_GLORY_ORIG[k] : (AGE.level === 2 ? "TAKEDOWN" : ageText(AGE_GLORY_ORIG[k]));
  }
}
function ageExecWord() { return AGE.level === 2 ? "★ TAKEDOWN" : AGE.level === 1 ? "⚡ EXECUTE" : "☠ EXECUTE"; }

/* --- wrappers --------------------------------------------------------------------- */
(function ageWrap() {
  if (typeof spawnDrip === "function") {
    const _drip = spawnDrip;
    spawnDrip = function (x, y, owner, rad) { if (!AGE.level) return _drip(x, y, owner, rad); if (Math.random() < 0.5) agePop(x, y, 2); };
  }
  if (typeof spawnGroundLimb === "function") {
    const _limb = spawnGroundLimb;
    spawnGroundLimb = function (x, y, col, kind = 0) { if (!AGE.level) return _limb(x, y, col, kind); agePop(x, y, 4); };
  }
  if (typeof spawnCorpse === "function") {
    const _corpse = spawnCorpse;
    spawnCorpse = function (x, y, seed, type, legsLost, armsLost = 0, customCol = null, headCol = null, rivalCid = -1) {
      if (!AGE.level) return _corpse(x, y, seed, type, legsLost, armsLost, customCol, headCol, rivalCid);
      _corpse(x, y, seed, type, 0, 0, customCol, headCol, rivalCid);   // whole body (kept invisibly in STRONG mode)
      if (AGE.level === 2) ageKOPuff(x, y, type >= 98);
    };
  }
  if (typeof spawnBisectedBodyHalves === "function") {
    const _halves = spawnBisectedBodyHalves;
    spawnBisectedBodyHalves = function (x, y, cutAngle, baseR, bodyCol, glowCol, headCol = null, isVet = false, seed = 0) {
      if (!AGE.level) return _halves(x, y, cutAngle, baseR, bodyCol, glowCol, headCol, isVet, seed);
      agePop(x, y, 5);
      // killEnemy already drops a corpse for veterans; henchmen get a whole body instead of two halves
      if (!isVet) spawnCorpse(x, y, seed >>> 0, baseR >= 14 ? 3 : 0, 0, 0, bodyCol, headCol, -1);
    };
  }
  if (typeof enemyBloodCol === "function") {
    const _bc = enemyBloodCol;
    enemyBloodCol = function (j) { if (!AGE.level) return _bc(j); return AGE.level === 2 || AGE.fx === "none" ? "rgba(0,0,0,0)" : AGE.fx === "blue" ? "#2979ff" : AGE.fx === "green" ? "#00e676" : "#ffd166"; };
  }
  if (typeof cityDecal === "function") {
    const _dec = cityDecal;
    cityDecal = function (lx, ly, kind, ang, col) { if (AGE.level && kind === "blood") return; return _dec(lx, ly, kind, ang, col); };
  }
  if (typeof spawnSpeech === "function") {
    const _sp = spawnSpeech;
    spawnSpeech = function (x, y, text, color, dur) { return _sp(x, y, ageText(text), color, dur); };
  }
})();
// render-side helpers (used by render.js / enemylook.js)
function ageLegs(i) { return AGE.level ? 0 : eLegsLost[i]; }
function ageArms(i) { return AGE.level ? 0 : eArmsLost[i]; }

/* --- options panel explanation -------------------------------------------------- */
function ageInfoHTML() {
  return '<div class="age-info" style="text-align:left;font-size:0.72rem;line-height:1.35;background:rgba(0,30,40,0.55);border:1px solid #2a6f7a;border-radius:6px;padding:7px 9px;margin:4px 0">' +
    '<b style="color:#80deea">🛡️ Age-Appropriate Content</b>' + (AGE.pin ? ' <span style="color:#ffd166">· 🔒 PIN-locked</span>' : "") + "<br>" +
    AGE_INFO.map((r, i) => `<div style="margin-top:3px;${i === AGE.level ? "color:#fff" : "color:#90a4ae"}">${i === AGE.level ? "▶" : "•"} <b>${r[0]}</b> — ${r[1]}</div>`).join("") +
    (AGE.level === 1 ? `<div style="margin-top:3px;color:#ffd166">Hit effect: ${AGE_FX_NAMES[AGE.fx]}</div>` : "") + "</div>";
}

ageLoad();
ageApplyLabels();
if (typeof V10 !== "undefined") V10.onRunStart.push(() => { ageLoad(); ageApplyLabels(); });
// EOF:js/agefilter.js
