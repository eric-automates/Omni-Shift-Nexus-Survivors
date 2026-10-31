// FILE: js/hudlayout.js
// PART: v14.1 module 4 of 4
// DETAIL: v14.1 HUD layout manager - nothing on the HUD overlaps, on any screen. Every HUD element lives in an anchor
//         zone (top bar · bottom-right minimap stack · bottom-left gauges · bottom-centre status) and the solver
//         places them, checks every pair for overlap and shrinks the LOWEST-priority element involved first (down
//         to its minimum size), then hides only optional extras (now-playing toast, FPS pill...). Options → HUD
//         LAYOUT lets you set the priority order, tick "Don't shrink" per element, hide elements, change the global
//         HUD size and see a live wireframe preview of your screen.

"use strict";

/* === 1. ELEMENTS ===================================================================================================== */
// prio: higher keeps its size longer · min: smallest scale · hideable: may be hidden when nothing else helps
const HUDL_DEF = [
  { id: "top",     label: "Health, weapons & stats bar",        prio: 100, min: 0.7 },
  { id: "glory",   label: "EXECUTE button",                     prio: 92,  min: 0.75 },
  { id: "veh",     label: "Vehicle gauge (speed · fuel · damage)", prio: 86, min: 0.7 },
  { id: "minimap", label: "Minimap",                            prio: 80,  min: 0.6 },
  { id: "stealth", label: "Stealth status pill",                prio: 70,  min: 0.72 },
  { id: "squad",   label: "Squad radio button",                 prio: 64,  min: 0.7 },
  { id: "mmctl",   label: "Minimap buttons",                    prio: 60,  min: 0.72 },
  { id: "tip",     label: "Tips & hints",                       prio: 50,  min: 0.78, hideable: true },
  { id: "city",    label: "District / street banner",           prio: 40,  min: 0.72, hideable: true },
  { id: "dev",     label: "Debug & Music buttons",              prio: 20,  min: 0.78, hideable: true },
  { id: "toast",   label: "Now-playing music toast",            prio: 10,  min: 0.8,  hideable: true },
  { id: "perf",    label: "FPS / telemetry pill",               prio: 6,   min: 0.8,  hideable: true }
];
const HUDL = { active: false, t: 0, scale: {}, hidden: {}, rects: {}, mini: null, stealthY: null, stealthS: 1, topH: 0, last: null, dirty: true, overlaps: 0, iters: 0 };
function hudOpts() {
  if (typeof opts === "undefined") return { auto: true, scale: 1, order: [], keep: {}, hide: {} };
  if (!opts.hud || typeof opts.hud !== "object") opts.hud = {};
  const H = opts.hud;
  if (typeof H.auto !== "boolean") H.auto = true;
  if (typeof H.scale !== "number") H.scale = 1;
  if (!Array.isArray(H.order)) H.order = [];
  if (!H.keep || typeof H.keep !== "object") H.keep = {};
  if (!H.hide || typeof H.hide !== "object") H.hide = {};
  return H;
}
// effective priority: the user's order (top of the list = most important) beats the defaults
function hudPrio(id) {
  const H = hudOpts(), i = H.order.indexOf(id);
  if (i >= 0) return 1000 - i * 10;
  const d = HUDL_DEF.find(q => q.id === id); return d ? d.prio : 0;
}
function hudOrdered() { return HUDL_DEF.slice().sort((a, b) => hudPrio(b.id) - hudPrio(a.id)); }
function hudEl(id) {
  switch (id) {
    case "top": return document.getElementById("hud");
    case "glory": return document.getElementById("gloryBtn");
    case "veh": return document.getElementById("vehHud");
    case "squad": return document.getElementById("squadBtn");
    case "mmctl": return document.getElementById("mmCtl");
    case "tip": return document.getElementById("cityTip");
    case "city": return document.getElementById("cityHud");
    case "toast": return document.getElementById("nexus-music-toast");
    case "perf": return document.getElementById("perfHud");
    default: return null;
  }
}
function hudShown(el) {
  if (!el) return false;
  const cs = getComputedStyle(el);
  if (cs.display === "none") return false;
  if (el.id === "cityTip" || el.id === "nexus-music-toast") return parseFloat(cs.opacity) > 0.02;
  return true;
}

/* === 2. SOLVER ======================================================================================================= */
function hudRectOverlap(a, b) { return a && b && a.w > 0 && b.w > 0 && a.x < b.x + b.w - 1 && a.x + a.w > b.x + 1 && a.y < b.y + b.h - 1 && a.y + a.h > b.y + 1; }
function hudSolve() {
  const H = hudOpts(), Wd = innerWidth, Hd = innerHeight, m = 8, flip = typeof opts !== "undefined" && opts.hudFlip;
  const city = typeof CITY !== "undefined" && CITY.on && typeof runActive !== "undefined" && runActive;
  // small screens start a little more compact (phones), then your HUD size multiplies on top
  const density = Math.max(0.78, Math.min(1, Math.min(Wd, Hd) / 640));
  const user = Math.max(0.55, Math.min(1.4, (H.scale || 1) * density));
  const sc = {}, hid = {};
  for (const d of HUDL_DEF) { sc[d.id] = user; hid[d.id] = !!H.hide[d.id]; }
  // natural (unscaled) sizes
  const nat = {};
  for (const d of HUDL_DEF) {
    if (d.id === "minimap") { nat.minimap = city ? { w: Math.round(Math.min(210, Math.max(132, Math.min(Wd, Hd) * 0.26))) + 8, h: 0 } : null; if (nat.minimap) nat.minimap.h = nat.minimap.w; continue; }
    if (d.id === "stealth") { nat.stealth = city ? { w: Math.min(Wd - 20, 440), h: 24 } : null; continue; }
    if (d.id === "dev") { const a = document.getElementById("live-debug-toggle"), b = document.getElementById("nexus-music-toggle"); nat.dev = (a || b) ? { w: (a ? a.offsetWidth : 0) + (b ? b.offsetWidth + 4 : 0), h: Math.max(a ? a.offsetHeight : 0, b ? b.offsetHeight : 0) } : null; continue; }
    const el = hudEl(d.id);
    if (!el || !hudShown(el) || (d.id === "top" && !el.classList.contains("active"))) { nat[d.id] = null; continue; }
    nat[d.id] = d.id === "top" ? null : { w: el.offsetWidth, h: el.offsetHeight };
  }
  if (nat.stealth && nat.stealth.w > Wd * 0.9) nat.stealth.w = Wd * 0.9;
  const topEl = hudEl("top"), topOn = topEl && topEl.classList.contains("active");
  let R = {}, iters = 0, overlaps = 0;
  const place = () => {
    R = {};
    // top bar: scaled with width compensation so it still spans the screen
    if (topOn && !hid.top) {
      const s = sc.top; topEl.style.transformOrigin = "0 0"; topEl.style.transform = s !== 1 ? "scale(" + s + ")" : ""; topEl.style.width = (100 / s) + "%";
      R.top = { x: 0, y: 0, w: Wd, h: topEl.offsetHeight * s };
    }
    const right = !flip, xR = (w) => right ? Wd - m - w : m, xL = (w) => right ? m : Wd - m - w;
    // bottom-left: dev row (Debug · Music · FPS pill) → toast → vehicle gauge
    let yL = Hd - m;
    if (nat.dev && !hid.dev) { const w = nat.dev.w * sc.dev, h = nat.dev.h * sc.dev; R.dev = { x: xL(w + (nat.perf && !hid.perf ? nat.perf.w * sc.perf + 6 : 0)), y: yL - h, w, h }; if (nat.perf && !hid.perf) { const pw = nat.perf.w * sc.perf, ph = nat.perf.h * sc.perf; R.perf = { x: right ? R.dev.x + w + 6 : R.dev.x - 6 - pw, y: yL - ph - (h - ph) / 2, w: pw, h: ph }; } yL = R.dev.y - 6; }
    else if (nat.perf && !hid.perf) { const w = nat.perf.w * sc.perf, h = nat.perf.h * sc.perf; R.perf = { x: xL(w), y: yL - h, w, h }; yL = R.perf.y - 6; }
    if (nat.toast && !hid.toast) { const w = nat.toast.w * sc.toast, h = nat.toast.h * sc.toast; R.toast = { x: xL(w), y: yL - h, w, h }; yL = R.toast.y - 6; }
    if (nat.veh && !hid.veh) { const w = nat.veh.w * sc.veh, h = nat.veh.h * sc.veh; R.veh = { x: xL(w), y: yL - h, w, h }; yL = R.veh.y - 6; }
    // bottom-right: minimap → its buttons → district banner; squad radio sits beside the minimap
    let yR = Hd - m;
    if (nat.minimap && !hid.minimap) { const S = Math.round((nat.minimap.w - 8) * sc.minimap); R.minimap = { x: xR(S + 8), y: yR - S - 8, w: S + 8, h: S + 8, S }; yR = R.minimap.y - 4; }
    if (nat.mmctl && !hid.mmctl) { const w = nat.mmctl.w * sc.mmctl, h = nat.mmctl.h * sc.mmctl; R.mmctl = { x: xR(w), y: yR - h, w, h }; yR = R.mmctl.y - 4; }
    if (nat.city && !hid.city) { const w = nat.city.w * sc.city, h = nat.city.h * sc.city; R.city = { x: xR(w), y: yR - h, w, h }; yR = R.city.y - 4; }
    if (nat.squad && !hid.squad) {
      const w = nat.squad.w * sc.squad, h = nat.squad.h * sc.squad, mm = R.minimap;
      R.squad = mm ? { x: right ? mm.x - 8 - w : mm.x + mm.w + 8, y: mm.y + mm.h - h, w, h } : { x: xR(w), y: yR - h, w, h };
    }
    // bottom-centre: stealth pill → tip → EXECUTE, as low as possible: an item that would touch a side stack climbs
    // just above whatever it touches (portrait phones end up with the centre column above both side stacks)
    const sides = ["dev", "perf", "toast", "veh", "minimap", "mmctl", "city", "squad"].map(k => R[k]).filter(Boolean);
    let yC = Hd - m - 34;
    const putC = (id, w, h, yMax) => {
      let y = Math.min(yC, yMax == null ? 1e9 : yMax) - h, x = (Wd - w) / 2;
      for (let guard = 0; guard < 12; guard++) { const hit = sides.find(r => hudRectOverlap(r, { x, y, w, h })); if (!hit) break; y = hit.y - 8 - h; }
      R[id] = { x, y, w, h }; yC = y - 8;
    };
    if (nat.stealth && !hid.stealth) putC("stealth", nat.stealth.w * sc.stealth, nat.stealth.h * sc.stealth);
    if (nat.tip && !hid.tip) putC("tip", Math.min(nat.tip.w * sc.tip, Wd * 0.94), nat.tip.h * sc.tip);
    if (nat.glory && !hid.glory) putC("glory", nat.glory.w * sc.glory, nat.glory.h * sc.glory, Hd - 175);
  };
  const ids = HUDL_DEF.map(d => d.id);
  for (iters = 0; iters < 60; iters++) {
    place();
    const inv = new Set(); overlaps = 0;
    for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) {
      const a = R[ids[i]], b = R[ids[j]];
      if (!hudRectOverlap(a, b)) continue;
      if ((ids[i] === "dev" && ids[j] === "perf") || (ids[i] === "perf" && ids[j] === "dev")) continue;
      overlaps++; inv.add(ids[i]); inv.add(ids[j]);
    }
    // nothing may leave the screen either
    for (const id of ids) { const r = R[id]; if (r && (r.y < (R.top && id !== "top" ? 0 : -1) || r.x < -1 || r.x + r.w > Wd + 1)) { overlaps++; inv.add(id); } }
    if (!overlaps || !H.auto) break;
    const cand = [...inv].map(id => HUDL_DEF.find(d => d.id === id)).filter(d => d && !H.keep[d.id] && sc[d.id] > d.min * user + 1e-3).sort((a, b) => hudPrio(a.id) - hudPrio(b.id));
    if (cand.length) { const d = cand[0]; sc[d.id] = Math.max(d.min * user, sc[d.id] - 0.05); continue; }
    const hideC = [...inv].map(id => HUDL_DEF.find(d => d.id === id)).filter(d => d && d.hideable && !H.keep[d.id] && !hid[d.id]).sort((a, b) => hudPrio(a.id) - hudPrio(b.id));
    if (hideC.length) { hid[hideC[0].id] = true; continue; }
    break;
  }
  HUDL.scale = sc; HUDL.hidden = hid; HUDL.rects = R; HUDL.iters = iters; HUDL.overlaps = overlaps; HUDL.user = user;
  return R;
}

/* === 3. APPLY ======================================================================================================== */
function hudApplyEl(el, r, s, origin, hidden) {
  if (!el) return;
  el.dataset.hudl = "1";
  if (hidden) { el.style.visibility = "hidden"; return; }
  el.style.visibility = "";
  el.style.position = "fixed"; el.style.left = r.x + "px"; el.style.top = r.y + "px"; el.style.right = "auto"; el.style.bottom = "auto";
  el.style.transformOrigin = "0 0"; el.style.transform = s !== 1 ? "scale(" + s.toFixed(3) + ")" : "none";
}
function hudLayoutNow() {
  if (!HUDL.enabled) return;
  const R = hudSolve(), sc = HUDL.scale, hid = HUDL.hidden;
  for (const id of ["glory", "veh", "squad", "mmctl", "tip", "city", "toast", "perf"]) { const el = hudEl(id); if (el && R[id]) hudApplyEl(el, R[id], sc[id], "0 0", false); else if (el && hid[id] && hudShown(el)) hudApplyEl(el, null, 1, "", true); }
  const top = hudEl("top"); if (top) top.style.visibility = hid.top ? "hidden" : "";
  if (R.dev) {
    const a = document.getElementById("live-debug-toggle"), b = document.getElementById("nexus-music-toggle"), flip = typeof opts !== "undefined" && opts.hudFlip;
    if (a) hudApplyEl(a, { x: R.dev.x, y: R.dev.y }, sc.dev, "0 0", false);
    if (b) hudApplyEl(b, { x: R.dev.x + (a ? (a.offsetWidth + 4) * sc.dev : 0), y: R.dev.y }, sc.dev, "0 0", false);
    void flip;
  } else if (hid.dev) { for (const id of ["live-debug-toggle", "nexus-music-toggle"]) { const el = document.getElementById(id); if (el) el.style.visibility = "hidden"; } }
  HUDL.mini = R.minimap ? { S: R.minimap.S, x: R.minimap.x + 4, y: R.minimap.y + 4 } : null;
  HUDL.miniHidden = !!hid.minimap;
  HUDL.stealthY = R.stealth ? R.stealth.y : null; HUDL.stealthS = sc.stealth || 1; HUDL.stealthHidden = !!hid.stealth;
  HUDL.topH = R.top ? R.top.h : 0;
  HUDL.last = { W: innerWidth, H: innerHeight, R: JSON.parse(JSON.stringify(R)), sc: Object.assign({}, sc), hid: Object.assign({}, hid), user: HUDL.user };
  window.HUD_CANVAS_RECTS = [R.minimap && Object.assign({ id: "minimap" }, R.minimap), R.stealth && Object.assign({ id: "stealth" }, R.stealth)].filter(Boolean);
}
// runs ~5×/s while a run is active (and right away on resize / option changes)
function hudFrame() {
  if (HUDL.off) { HUDL.enabled = false; return; }
  HUDL.enabled = true;
  const now = performance.now();
  if (!HUDL.dirty && now - HUDL.t < 200) return;
  HUDL.t = now; HUDL.dirty = false;
  try { hudLayoutNow(); } catch (e) { if (window.trackProgress) window.trackProgress("hud layout: " + e.message, true); }
}
window.addEventListener("resize", () => { HUDL.dirty = true; });
if (typeof V10 !== "undefined") { V10.onFrame.push(hudFrame); V10.onRunStart.push(() => { HUDL.dirty = true; }); }

/* === 4. OPTIONS: priority order, Don't shrink, Hide, size, live preview ============================================= */
function hudOptsOpen() {
  let box = document.getElementById("hudOpts");
  if (!box) { box = document.createElement("div"); box.id = "hudOpts"; document.body.appendChild(box); }
  box.style.display = "flex";
  hudOptsRender();
}
function hudOptsClose() { const box = document.getElementById("hudOpts"); if (box) box.style.display = "none"; if (typeof saveOpts === "function") saveOpts(); HUDL.dirty = true; }
function hudOptsRender() {
  const box = document.getElementById("hudOpts"); if (!box) return;
  const H = hudOpts(), list = hudOrdered();
  if (!H.order.length) H.order = list.map(d => d.id);
  const rows = list.map((d, i) => `<div class="ho-row" data-id="${d.id}">
      <span class="ho-rank">${i + 1}</span>
      <button class="btn ho-mv" data-mv="-1" ${i === 0 ? "disabled" : ""} title="More important">▲</button><button class="btn ho-mv" data-mv="1" ${i === list.length - 1 ? "disabled" : ""} title="Less important">▼</button>
      <span class="ho-name">${d.label}</span>
      <label class="ho-chk" title="Never shrink this one - others make room instead"><input type="checkbox" data-k="keep" ${H.keep[d.id] ? "checked" : ""}> Don't shrink</label>
      <label class="ho-chk" title="Hide it completely"><input type="checkbox" data-k="hide" ${H.hide[d.id] ? "checked" : ""}> Hide</label>
    </div>`).join("");
  box.innerHTML = `<div class="ho-panel">
    <div class="ho-head"><div class="ho-title">🧩 HUD LAYOUT</div><span>Nothing overlaps: when space runs out the <em>lowest</em> item in this list shrinks first (down to its minimum), then optional extras hide. Tick <em>Don't shrink</em> to protect an item — the others make room.</span></div>
    <div class="ho-top">
      <button class="btn ${H.auto ? "gold" : ""}" id="hoAuto">AUTO-FIT: ${H.auto ? "ON" : "OFF"}</button>
      <span class="ho-lbl">HUD SIZE</span>${[0.8, 0.9, 1, 1.1, 1.2].map(v => `<button class="btn ho-sz ${Math.abs((H.scale || 1) - v) < 0.01 ? "gold" : ""}" data-sz="${v}">${Math.round(v * 100)}%</button>`).join("")}
      <button class="btn" id="hoReset">RESET</button>
    </div>
    <div class="ho-body"><div class="ho-list">${rows}</div>
      <div class="ho-prev"><canvas id="hoCv" width="300" height="190"></canvas><div class="ho-note" id="hoNote"></div></div></div>
    <div class="ho-foot"><button class="btn gold" id="hoDone">SAVE & BACK</button></div></div>`;
  box.querySelectorAll(".ho-mv").forEach(b => b.onclick = () => { const id = b.closest(".ho-row").dataset.id, i = H.order.indexOf(id), j = i + (+b.dataset.mv); if (j < 0 || j >= H.order.length) return; H.order.splice(i, 1); H.order.splice(j, 0, id); hudChanged(); });
  box.querySelectorAll(".ho-chk input").forEach(c => c.onchange = () => { const id = c.closest(".ho-row").dataset.id, k = c.dataset.k; H[k][id] = c.checked; if (!c.checked) delete H[k][id]; hudChanged(); });
  box.querySelectorAll(".ho-sz").forEach(b => b.onclick = () => { H.scale = +b.dataset.sz; hudChanged(); });
  box.querySelector("#hoAuto").onclick = () => { H.auto = !H.auto; hudChanged(); };
  box.querySelector("#hoReset").onclick = () => { opts.hud = { auto: true, scale: 1, order: [], keep: {}, hide: {} }; hudChanged(); };
  box.querySelector("#hoDone").onclick = hudOptsClose;
  hudPreview();
}
function hudChanged() { if (typeof saveOpts === "function") saveOpts(); HUDL.dirty = true; if (typeof runActive !== "undefined" && runActive) hudLayoutNow(); hudOptsRender(); }
// wireframe of your current screen (from the last solve; a phone-sized mock when no run is active)
function hudPreview() {
  const cv = document.getElementById("hoCv"); if (!cv) return;
  const g = cv.getContext("2d"), L = HUDL.last, Wd = L ? L.W : innerWidth, Hd = L ? L.H : innerHeight;
  const s = Math.min(cv.width / Wd, cv.height / Hd), ox = (cv.width - Wd * s) / 2, oy = (cv.height - Hd * s) / 2;
  g.clearRect(0, 0, cv.width, cv.height); g.fillStyle = "#0b1420"; g.fillRect(ox, oy, Wd * s, Hd * s); g.strokeStyle = "#37474f"; g.strokeRect(ox + 0.5, oy + 0.5, Wd * s - 1, Hd * s - 1);
  const cols = { top: "#ff5252", glory: "#ff9100", veh: "#69f0ae", minimap: "#4fc3f7", stealth: "#b2ff59", squad: "#c5e1a5", mmctl: "#80deea", tip: "#ffd166", city: "#80cbc4", dev: "#90a4ae", toast: "#ce93d8", perf: "#78909c" };
  const note = document.getElementById("hoNote");
  if (!L) { if (note) note.textContent = "Start a run to see your live layout here."; return; }
  let shrunk = [];
  for (const id in L.R) {
    const r = L.R[id]; if (!r) continue;
    g.fillStyle = crA ? crA(cols[id] || "#fff", 0.22) : "rgba(255,255,255,0.2)"; g.strokeStyle = cols[id] || "#fff";
    g.fillRect(ox + r.x * s, oy + r.y * s, r.w * s, r.h * s); g.strokeRect(ox + r.x * s + 0.5, oy + r.y * s + 0.5, Math.max(1, r.w * s - 1), Math.max(1, r.h * s - 1));
    if ((L.sc[id] || 1) < (L.user || hudOpts().scale || 1) - 0.01) shrunk.push((HUDL_DEF.find(d => d.id === id) || {}).label + " " + Math.round(L.sc[id] * 100) + "%");
  }
  const hidden = Object.keys(L.hid).filter(k => L.hid[k]).map(k => (HUDL_DEF.find(d => d.id === k) || {}).label);
  if (note) note.innerHTML = (HUDL.overlaps ? "<b style='color:#ff5252'>" + HUDL.overlaps + " overlap(s) left — AUTO-FIT is off or everything is at minimum.</b><br>" : "<b style='color:#69f0ae'>No overlaps on this " + Wd + "×" + Hd + " screen.</b><br>") +
    (shrunk.length ? "Shrunk: " + shrunk.join(" · ") + "<br>" : "") + (hidden.length ? "Hidden: " + hidden.join(" · ") : "");
}
// EOF:js/hudlayout.js
