/* ============================================================================================================
   js/actionui.js — v14.3 TOUCH-FIRST ACTIONS
   • One big ACTION button on the right (the thumb that isn't steering), never wider than about half the screen.
     It says what you can do here (an icon and plain words), works while you're moving (second thumb), and it
     STAYS for a moment after you stop or step past the spot — a prompt never vanishes from under your thumb.
   • On a roof there is ALWAYS a way down: ⬇ GET DOWN (the nearest ladder if there is one, else the nearest
     edge). Double-tap to jump off still works as before.
   • Heroes who can fly on their own get a 🚀 button (it used to be the G key only, except for the Ki-Surge class).
   • On touch screens the key hints go: "[F]", "press F", "<b>Shift</b> to sneak"… become what to tap.
   ============================================================================================================ */
const ACT = { el: null, fly: null, cur: null, seenT: -99, ax: 0, ay: 0, force: null, touch: false, key: "", live: false, busyT: 0 };
const ACT_ICONS = [[/CLIMB DOWN|LADDER|GRAV-LIFT/i, "🪜"], [/DROP|DOWN|JUMP/i, "⬇"], [/ONTO ROOF|ROOF/i, "🧗"], [/EXIT|GET OUT|LEAVE/i, "🚪"], [/DRIVE|RIDE|CAR\b|VEHICLE|SPEEDER|SPINNER|WAGON|APC|CART/i, "🚗"],
  [/SEARCH/i, "🔍"], [/SHOP|BUY|KIOSK|COUNTER|ORDER|MENU/i, "🛒"], [/TALK|ASK|CHAT|GREET|HIRE/i, "💬"], [/SLEEP|BED|REST/i, "🛏"], [/FLY|BOARD|TAKE OFF|COCKPIT|PILOT/i, "🛩"],
  [/FUEL|PUMP/i, "⛽"], [/WORK|JOB|SHIFT|CLOCK IN/i, "💼"], [/DOOR|OPEN|ENTER|GO IN|INSIDE/i, "🚪"], [/PICK|TAKE|GRAB|LOOT|COLLECT/i, "✋"], [/HEAL|MED/i, "💊"]];
const ACT_EMOJI = /(\p{Extended_Pictographic}\uFE0F?)/u;

function actIsTouch() {
  if (ACT.touch) return true;
  try { if (window.matchMedia && matchMedia("(pointer: coarse)").matches) return (ACT.touch = true); } catch (e) {}
  return false;
}
// "[F] CLIMB DOWN 🪜" → { icon: "🪜", text: "CLIMB DOWN" }
function actParse(label) {
  let s = String(label || "").replace(/\[(?:F|E|TAP)\]\s*/g, "").replace(/^\[(.*)\]$/, "$1").replace(/\s*\((?:F|E)\)\s*/g, " ").trim();
  let icon = "";
  const m = s.match(ACT_EMOJI);
  if (m) { icon = m[1]; s = s.replace(m[1], "").replace(/\s{2,}/g, " ").trim(); }
  if (!icon) for (const [re, ic] of ACT_ICONS) if (re.test(s)) { icon = ic; break; }
  return { icon: icon || "✋", text: s || "USE" };
}
function actIconFor(t) { return t ? actParse(t.label).icon : "✋"; }

/* --- the button ---------------------------------------------------------------------------------------------- */
function actEl() {
  if (ACT.el) return ACT.el;
  const st = document.createElement("style");
  st.textContent = "#btnInteract{display:none!important}" +
    "#actBtn{position:fixed;right:max(10px,env(safe-area-inset-right));bottom:calc(222px + env(safe-area-inset-bottom));z-index:60;display:none;align-items:center;gap:10px;" +
    "min-height:60px;min-width:118px;max-width:min(52vw,300px);padding:8px 16px 8px 12px;border-radius:20px;border:2px solid #ffd166;background:linear-gradient(#3a2c0b,#1d1606);" +
    "color:#fff8e1;font:800 15px/1.15 system-ui,'Segoe UI',sans-serif;letter-spacing:.3px;text-align:left;box-shadow:0 6px 22px rgba(0,0,0,.55),0 0 14px rgba(255,209,102,.28);" +
    "touch-action:none;user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent;transition:transform .08s,opacity .2s}" +
    "#actBtn .ab-ic{font-size:26px;line-height:1;flex-shrink:0}#actBtn .ab-tx{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}" +
    "#actBtn .ab-k{font:700 10px monospace;color:#ffd166;border:1px solid #ffd16688;border-radius:4px;padding:1px 4px;margin-left:2px;flex-shrink:0}" +
    "#actBtn.sticky{opacity:.82;border-style:dashed}#actBtn.compact{min-height:44px;min-width:0;padding:5px 12px 5px 9px;font-size:12px;opacity:.88}#actBtn.compact .ab-ic{font-size:19px}" +
    "#actBtn.hold{box-shadow:0 0 0 4px #ffd166,0 0 22px rgba(255,209,102,.6)}" +
    "#actBtn.down{transform:scale(.94)}#actBtn.roof{border-color:#80deea;background:linear-gradient(#0b2a33,#061519);color:#e0f7fa}" +
    "#actFly{position:fixed;right:max(10px,env(safe-area-inset-right));bottom:calc(292px + env(safe-area-inset-bottom));z-index:60;display:none;width:54px;height:54px;border-radius:50%;" +
    "border:2px solid #80deea;background:#0b2a33;color:#e0f7fa;font-size:24px;touch-action:none;box-shadow:0 4px 16px rgba(0,0,0,.5)}" +
    "@media (max-height:520px){#actBtn{bottom:calc(64px + env(safe-area-inset-bottom));right:calc(84px + env(safe-area-inset-right))}#actFly{bottom:calc(64px + env(safe-area-inset-bottom));right:calc(84px + min(52vw,300px) + 18px)}}";
  document.head.appendChild(st);
  const b = document.createElement("button");
  b.id = "actBtn"; b.type = "button";
  b.innerHTML = '<span class="ab-ic">✋</span><span class="ab-tx"></span><span class="ab-k">F</span>';
  // pointerdown: instant, and it works with another finger still on the stick
  // getting out of a moving vehicle is a short hold (no bailing out at 60 because a thumb slipped)
  b.addEventListener("pointerdown", e => {
    e.preventDefault(); e.stopPropagation(); if (e.pointerType === "touch") ACT.touch = true; b.classList.add("down");
    if (actMovingExit()) { b.classList.add("hold"); ACT.holdT = setTimeout(() => { ACT.holdT = 0; b.classList.remove("hold"); actFire(); }, 380); return; }
    actFire();
  });
  for (const ev of ["pointerup", "pointercancel", "pointerleave"]) b.addEventListener(ev, () => { b.classList.remove("down"); b.classList.remove("hold"); if (ACT.holdT) { clearTimeout(ACT.holdT); ACT.holdT = 0; } });
  b.addEventListener("click", e => { e.preventDefault(); e.stopPropagation(); });
  document.body.appendChild(b);
  const f = document.createElement("button");
  f.id = "actFly"; f.type = "button"; f.textContent = "🚀"; f.title = "Fly (G)";
  f.addEventListener("pointerdown", e => { e.preventDefault(); e.stopPropagation(); if (typeof flyToggleSelf === "function") flyToggleSelf(); });
  document.body.appendChild(f);
  ACT.el = b; ACT.fly = f;
  // left-handed HUD: the button lives on the left
  const st2 = document.createElement("style"); st2.textContent = "body.act-left #actBtn,body.act-left #actFly{right:auto;left:max(10px,env(safe-area-inset-left))}body.act-left #gaLight{right:auto!important;left:max(10px,env(safe-area-inset-left))}";
  document.head.appendChild(st2);
  return b;
}
function actHide() { if (ACT.el && ACT.el.style.display !== "none") ACT.el.style.display = "none"; ACT.key = ""; }

/* --- what's here (with a short memory) ------------------------------------------------------------------------ */
function actStill(t) {
  if (!t || !player) return false;
  if (t.kind === "exitVeh") return !!player.inVehicle;
  if (player.inVehicle && t.kind !== "exitVeh") return false;
  if (t.kind === "accDrop" || t.kind === "accDown") return !!player.roof;
  if (t.kind === "accUp") return !player.roof;
  if (t.kind === "cityCar") return !player.inVehicle;
  return true;
}
function actRoofExit() {
  if (!player || !player.roof || player.inVehicle || (typeof ACC !== "undefined" && (ACC.climb || ACC.cross))) return null;
  return { kind: "actRoof", label: "GET DOWN ⬇", x: player.x, y: player.y - 16 };
}
function actFrame() {
  requestAnimationFrame(actFrame);
  if (typeof runActive === "undefined") return;
  const el = actEl();
  if (!runActive || !player || (typeof showdownActive !== "undefined" && showdownActive)) { actHide(); if (ACT.fly) ACT.fly.style.display = "none"; ACT.cur = null; return; }
  const now = performance.now() / 1000;
  document.body.classList.toggle("act-left", !!(typeof opts !== "undefined" && opts.hudFlip));
  let t = null;
  try { t = typeof findInteractTarget === "function" ? findInteractTarget() : null; } catch (e) { t = null; }
  if (t) { ACT.cur = t; ACT.seenT = now; ACT.ax = player.x; ACT.ay = player.y; ACT.live = true; }
  else if (ACT.cur && now - ACT.seenT < 2.6 && Math.hypot(player.x - ACT.ax, player.y - ACT.ay) < 72 && actStill(ACT.cur)) ACT.live = false;
  else { ACT.cur = null; ACT.live = false; }
  const show = ACT.cur || (typeof CITY !== "undefined" && CITY.on ? actRoofExit() : null);
  if (!show || (typeof runPaused !== "undefined" && runPaused)) actHide();
  else {
    const P = actParse(show.label), mv = show.kind === "exitVeh" && actMovingExit(), key = P.icon + "|" + P.text + "|" + (ACT.live ? 1 : 0) + "|" + show.kind + "|" + mv;
    el.classList.toggle("compact", mv);
    if (key !== ACT.key) {
      ACT.key = key;
      el.querySelector(".ab-ic").textContent = P.icon;
      el.querySelector(".ab-tx").textContent = P.text;
      el.querySelector(".ab-k").style.display = actIsTouch() ? "none" : "";
      el.classList.toggle("sticky", !!ACT.cur && !ACT.live);
      el.classList.toggle("roof", show.kind === "actRoof" || show.kind === "accDrop" || show.kind === "accDown");
      el.querySelector(".ab-tx").textContent = P.text + (show.kind === "exitVeh" && actMovingExit() ? " (HOLD)" : "");
      el.style.display = "flex";
    }
  }
  // 🚀 for heroes who fly on their own (the Ki-Surge class keeps its own button)
  if (ACT.fly) {
    let can = false;
    try { can = typeof CITY !== "undefined" && CITY.on && !player.inVehicle && typeof flySelfSpec === "function" && !!flySelfSpec() && !(document.getElementById("kiFly") && document.getElementById("kiFly").offsetParent); } catch (e) {}
    const on = typeof FLY !== "undefined" && FLY.on && FLY.self;
    if (on) can = true;
    ACT.fly.style.display = can ? "block" : "none";
    if (can) ACT.fly.textContent = on ? "🛬" : "🚀";
  }
}
function actMovingExit() {
  try { const v = typeof VEH !== "undefined" ? VEH.me : null; return !!(v && player.inVehicle && (typeof vehRealMs === "function" ? vehRealMs(v) : Math.hypot(v.vx, v.vy) / 32) > 3.6); } catch (e) { return false; }
}
function actFire() {
  const now = performance.now();   // a wall clock: runTime restarts with every run
  if (now < ACT.busyT) return;
  ACT.busyT = now + 250;
  const t = ACT.cur || actRoofExit();
  if (!t) return;
  try { if (navigator.vibrate) navigator.vibrate(12); } catch (e) {}
  if (t.kind === "actRoof") { actGetDown(); return; }
  let live = null; try { live = findInteractTarget(); } catch (e) {}
  if (live && live.kind === t.kind) { if (typeof triggerWorldInteract === "function") triggerWorldInteract(); }
  else { ACT.force = t; try { if (typeof triggerWorldInteract === "function") triggerWorldInteract(); } finally { ACT.force = null; } }
  ACT.cur = null; ACT.seenT = -99; ACT.key = "";
}
// off the roof from anywhere on it: the nearest ladder (within ~7 m), else straight off the nearest edge
function actGetDown() {
  if (!player || !player.roof || typeof accDropFromRoof !== "function") return;
  let lad = null, bd = 230;
  try { for (const b of accNearBuildings(320)) for (const q of accLadders(b)) { const d = Math.hypot(q.tx - player.x, q.ty - player.y); if (d < bd) { bd = d; lad = q; } } } catch (e) {}
  if (lad) { accDropFromRoof(0, 0, lad); return; }
  let dir = null, dd = 1e9;
  for (let a = 0; a < 16; a++) {
    const dx = Math.cos(a * Math.PI / 8), dy = Math.sin(a * Math.PI / 8);
    let s = 0; while (s < 900 && accRoofTile(player.x + dx * s, player.y + dy * s)) s += 6;
    if (s < dd) { dd = s; dir = [dx, dy]; }
  }
  if (dir) accDropFromRoof(dir[0], dir[1]);
}

/* --- touch: say what to tap, not which key to press -------------------------------------------------------------- */
const ACT_TXT = [
  [/<b>F<\/b> at the edge or ladder to get down\./g, "Tap <b>✋</b> at the edge or ladder — or <b>⬇ GET DOWN</b> any time — to get down."],
  [/press F at a wall to get on the roof/g, "tap ✋ at a wall to get on the roof"], [/press F at a wall/g, "tap ✋ at a wall"], [/press F to board/g, "tap ✋ to board"],
  [/Hold <b>Shift<\/b> to sneak/g, "Tap <b>🥷</b> to sneak"], [/<b>V<\/b> fits a suppressor/g, "<b>🔇</b> fits a suppressor"],
  [/<b>M<\/b> map &amp; markers|<b>M<\/b> map & markers/g, "<b>🗺</b> map & markers"], [/<b>\[ \]<\/b> zoom the minimap/g, "<b>− +</b> zoom the minimap"],
  [/\(<b>\[ \]<\/b> or the wheel to zoom\)/g, "(<b>− +</b> to zoom)"], [/<b>M<\/b> opens the full map: click/g, "<b>🗺</b> opens the full map: tap"],
  [/<b>▲ Space\/E<\/b>/g, "<b>▲</b>"], [/<b>▼ Shift\/Q<\/b>/g, "<b>▼</b>"], [/<b>⏹ H<\/b>/g, "<b>⏹</b>"], [/<b>🛡 K<\/b>/g, "<b>🛡</b>"], [/<b>👁 C<\/b>/g, "<b>👁</b>"],
  [/with <b>G<\/b>\. <b>Space\/E<\/b> up · <b>Shift\/Q<\/b> down · <b>H<\/b> hover/g, "with <b>🚀</b>. <b>▲</b> up · <b>▼</b> down · <b>⏹</b> hover"],
  [/<b>Space<\/b> handbrake/g, "<b>HB</b> handbrake"], [/<b>H<\/b> horn/g, "<b>📯</b> horn"], [/hold R \(or 🔥\)/g, "hold 🔥"],
  [/and press <b>F<\/b>/g, "and tap <b>✋</b>"], [/,? or press <b>E<\/b>,?/g, ""], [/ \(or press <b>Q<\/b>\)/g, ""], [/ \(keys 1-4\)/g, ""],
  [/\[F\]\s*/g, ""], [/<b>F<\/b>/g, "<b>✋</b>"], [/\bpress F\b/g, "tap ✋"], [/\bPress F\b/g, "Tap ✋"]
];
function actTxt(s) {
  if (typeof s !== "string" || !actIsTouch()) return s;
  if (!/F|Shift|Space|<b>[A-Z]|\[ \]|hold R|keys 1/.test(s)) return s;
  for (const [re, to] of ACT_TXT) s = s.replace(re, to);
  return s;
}
function actTouchifyEl(el) {
  if (!el || !actIsTouch() || el.__actBusy) return;
  const h = el.innerHTML, n = actTxt(h);
  if (n !== h) { el.__actBusy = true; el.innerHTML = n; el.__actBusy = false; }
}

/* --- wiring ---------------------------------------------------------------------------------------------------- */
(function actWire() {
  // the outermost interact wrapper: a sticky prompt can still be used after it's gone
  const _fit = window.findInteractTarget;
  // on a roof only the ways down count: a shop counter, a terminal, a drawer or a resident in the rooms BELOW used to
  // win the prompt (economy's counter outranks everything) — that is how "CLIMB DOWN" vanished once you stood still
  if (typeof _fit === "function") window.findInteractTarget = function () {
    if (ACT.force) return ACT.force;
    const t = _fit();
    if (t && player && player.roof && !player.inVehicle && !(t.kind && (t.kind.startsWith("acc") || t.kind === "exitVeh"))) {
      try { const a = typeof accInteractTarget === "function" ? accInteractTarget() : null; return a || null; } catch (e) { return null; }
    }
    return t;
  };
  window.addEventListener("keydown", e => {
    if (e.code !== "KeyF" || e.repeat || !runActive || !player) return;
    let live = null; try { live = _fit(); } catch (err) {}
    if (!live && (ACT.cur || actRoofExit())) setTimeout(actFire, 0);
  });
  window.addEventListener("pointerdown", e => { if (e.pointerType === "touch" && !ACT.touch) { ACT.touch = true; actTouchAll(); } }, { capture: true, passive: true });
  if (typeof window.cityTip === "function") { const _ct = window.cityTip; window.cityTip = function (html, sec) { return _ct(actTxt(html), sec); }; }
  if (typeof itToast === "function") { const _it = itToast; window.itToast = itToast = function (msg, col) { return _it(actTxt(msg), col); }; }
  if (typeof vehToast === "function") { const _vt = vehToast; window.vehToast = vehToast = function (msg, col) { return _vt(actTxt(msg), col); }; }
  if (typeof spawnSpeech === "function") { const _sp = spawnSpeech; window.spawnSpeech = spawnSpeech = function (x, y, text, color, dur) { if (typeof text === "string" && text.indexOf("F") >= 0) text = actTxt(text); return _sp(x, y, text, color, dur); }; }
  // tips written straight into the page (the city tips, the help screen)
  const watch = () => {
    for (const id of ["cityTip", "rmTip", "scnTip"]) {
      const el = document.getElementById(id);
      if (!el || el.__actObs) continue;
      el.__actObs = new MutationObserver(() => actTouchifyEl(el));
      el.__actObs.observe(el, { childList: true, characterData: true, subtree: true });
      actTouchifyEl(el);
    }
  };
  setInterval(watch, 1500);
  if (typeof V10 !== "undefined") V10.onRunStart.push(() => { ACT.cur = null; ACT.key = ""; watch(); });
  requestAnimationFrame(actFrame);
})();
function actTouchAll() {
  if (!actIsTouch()) return;
  const help = document.getElementById("scrHelp");
  // only text blocks (inline formatting inside, no buttons) are rewritten, so nothing loses its handlers
  const inlineOnly = el => [...el.children].every(c => /^(B|I|SPAN|BR|EM|STRONG|KBD|SMALL|U)$/.test(c.tagName) && !c.querySelector("button,input,select,a"));
  if (help) for (const box of help.querySelectorAll("div, p, li")) if (inlineOnly(box) && /F|Shift|Space|<b>[A-Z]|\[ \]/.test(box.innerHTML)) actTouchifyEl(box);
  for (const id of ["cityTip", "rmTip", "scnTip"]) actTouchifyEl(document.getElementById(id));
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", actTouchAll); else setTimeout(actTouchAll, 0);
// EOF:js/actionui.js
