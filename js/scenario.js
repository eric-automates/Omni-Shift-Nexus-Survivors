/* =========================================================================
   OMNI-SHIFT v14.2 — SCENARIOS · CLOCK · DAY & NIGHT (js/scenario.js)
   • 📍 LOCATION → SCENARIO:
       🛡️ SURVIVORS — the game as it always was (optional day & night)
       ☢️ POST-APOCALYPTIC — ruins, loot, raider parties, holed-up survivors;
          ZOMBIES: off / a few / horde (js/apoc.js)
       🏙️ SIMULATED ECONOMY — a living town: people with homes, jobs and
          shifts, a market driven by who's working, the law (js/townsfolk.js,
          js/economy.js)
     + SURVIVAL NEEDS (food, water, ammo) for the last two, off by default
   • the clock: 1 game hour = 1 real minute (a day is 24 minutes); runs in
     the apocalypse and the economy, and in Survivors when day & night is on
   • night: one low-resolution light map over the world — street lights,
     headlights, lit windows, your own light — so it stays fast
   ========================================================================= */
"use strict";

const SCN = { mode: "survivors", zombies: "few", needs: false, night: false, clockOn: false, min: 720, day: 1, dark: 0, lc: null, lg: null, m: null, lastHud: "" };
const SCN_MODES = {
  survivors: { icon: "🛡️", name: "SURVIVORS", desc: "The game as it always was: you against the hunters. Day & night is optional." },
  apoc: { icon: "☢️", name: "POST-APOCALYPTIC", desc: "The world ended. Ruins and wrecks, loot in every cupboard, raider parties on the roads, survivors holed up in houses — and the dead, if you want them." },
  economy: { icon: "🏙️", name: "SIMULATED ECONOMY", desc: "A living town: everyone has a home, a job and a shift. Prices follow who's working. Break the law and security, police, the military — then your universe's elite — come for you." }
};
const SCN_ZOMBIES = { off: ["OFF", "No undead — just raiders and the wasteland."], few: ["A FEW", "Shamblers here and there; noise draws them in."], horde: ["HORDE", "The streets belong to the dead. Gunfire brings hundreds."] };
const SCN_START = { survivors: 12 * 60, apoc: 16 * 60, economy: 7 * 60 + 30 };

function scnState() {
  const S = typeof locState === "function" ? locState() : {};
  const Q = S.scen && typeof S.scen === "object" ? S.scen : {};
  if (!SCN_MODES[Q.mode]) Q.mode = "survivors";
  if (!SCN_ZOMBIES[Q.zombies]) Q.zombies = "few";
  Q.needs = !!Q.needs; Q.night = !!Q.night;
  S.scen = Q;
  return Q;
}
function scnTime(min) { const m = ((min % 1440) + 1440) % 1440, h = Math.floor(m / 60), mm = Math.floor(m % 60); return (h < 10 ? "0" : "") + h + ":" + (mm < 10 ? "0" : "") + mm; }
function scnHour() { return (((SCN.min % 1440) + 1440) % 1440) / 60; }
function scnIsNight() { const h = scnHour(); return h < 6 || h >= 20.5; }
// darkness 0 (day) … 0.72 (deep night) with an hour of dusk and of dawn
function scnDarkness(min) {
  const h = (((min % 1440) + 1440) % 1440) / 60;
  if (h >= 7 && h < 19.5) return 0;
  if (h >= 19.5 && h < 21) return 0.72 * (h - 19.5) / 1.5;
  if (h >= 5.5 && h < 7) return 0.72 * (7 - h) / 1.5;
  return 0.72;
}

/* --- the Location screen: SCENARIO -------------------------------------------------- */
function scnRenderSection() {
  const body = document.getElementById("locBody");
  if (!body || document.getElementById("scnSec")) return;
  const Q = scnState();
  const card = (k) => { const M = SCN_MODES[k]; return '<div class="lc-card' + (Q.mode === k ? " on" : "") + '" data-scn="' + k + '"><b>' + M.icon + " " + M.name + "</b>" + M.desc + "</div>"; };
  let h = '<div id="scnSec"><div class="lc-sec">SCENARIO</div><div class="lc-row">' + card("survivors") + card("apoc") + card("economy") + "</div>";
  if (Q.mode === "apoc") h += '<div class="lc-row" style="align-items:stretch">' + Object.keys(SCN_ZOMBIES).map(z => '<div class="lc-card lc-world' + (Q.zombies === z ? " on" : "") + '" data-scnz="' + z + '"><b>🧟 ZOMBIES: ' + SCN_ZOMBIES[z][0] + "</b>" + SCN_ZOMBIES[z][1] + "</div>").join("") + "</div>";
  h += '<div class="lc-row" style="font-size:12px;color:#cde;gap:18px;justify-content:center;align-items:center">';
  if (Q.mode === "survivors") h += '<label style="cursor:pointer"><input type="checkbox" id="scnNight"' + (Q.night ? " checked" : "") + "> 🌗 Day & night (1 game hour = 1 minute)</label>";
  else h += '<span>🌗 Day & night is always on here (1 game hour = 1 minute; starts at ' + scnTime(SCN_START[Q.mode]) + ")</span>" +
    '<label style="cursor:pointer" title="Hunger and thirst build up over the day; guns use ammo. Supplies in your bag are used automatically."><input type="checkbox" id="scnNeeds"' + (Q.needs ? " checked" : "") + "> 🥫 Survival needs (food, water, ammo)</label>";
  h += "</div></div>";
  body.insertAdjacentHTML("beforeend", h);
  body.querySelectorAll("[data-scn]").forEach(b => b.onclick = () => { Q.mode = b.dataset.scn; locChanged(); });
  body.querySelectorAll("[data-scnz]").forEach(b => b.onclick = () => { Q.zombies = b.dataset.scnz; locChanged(); });
  const n = body.querySelector("#scnNight"); if (n) n.onchange = () => { Q.night = n.checked; locChanged(); };
  const d = body.querySelector("#scnNeeds"); if (d) d.onchange = () => { Q.needs = d.checked; locChanged(); };
}
(function scnLocWire() {
  if (typeof locRender !== "function") return;
  const _lr = locRender;
  window.locRender = function () { const r = _lr.apply(this, arguments); try { scnRenderSection(); } catch (e) { if (window.trackProgress) window.trackProgress("scenario section: " + e.message, true); } return r; };
  if (typeof locLabel === "function") {
    const _ll = locLabel;
    window.locLabel = function () { const s = _ll.apply(this, arguments), Q = typeof meta !== "undefined" && meta.region && meta.region.scen; return Q && Q.mode && Q.mode !== "survivors" ? s + " · " + SCN_MODES[Q.mode].icon : s; };
  }
})();

/* --- run start / the clock -------------------------------------------------------------- */
function scnRunStart() {
  const Q = typeof meta !== "undefined" && meta.region && meta.region.scen ? meta.region.scen : { mode: "survivors" };
  const city = typeof CITY !== "undefined" && CITY.on;
  SCN.mode = city && SCN_MODES[Q.mode] ? Q.mode : "survivors";
  SCN.zombies = SCN_ZOMBIES[Q.zombies] ? Q.zombies : "few";
  SCN.needs = SCN.mode !== "survivors" && !!Q.needs;
  SCN.night = !!Q.night;
  SCN.clockOn = city && (SCN.mode !== "survivors" || SCN.night);
  // the world remembers its clock between runs (economy / apocalypse), else the scenario's start time
  const E = scnWorldMem();
  SCN.min = E && E.min != null && SCN.mode !== "survivors" ? E.min : SCN_START[SCN.mode];
  SCN.day = E && E.day ? E.day : 1;
  SCN.dark = SCN.clockOn ? scnDarkness(SCN.min) : 0;
  scnHud();
}
function scnWorldMem() {
  if (typeof meta === "undefined" || SCN.mode === "survivors") return null;
  if (!meta.scnMem || typeof meta.scnMem !== "object") meta.scnMem = {};
  const wk = (typeof itWorldKey === "function" ? itWorldKey() : "w") + "|" + SCN.mode;
  if (!meta.scnMem[wk]) { meta.scnMem[wk] = { min: null, day: 1, t: Date.now() }; const ks = Object.keys(meta.scnMem); if (ks.length > 12) { ks.sort((a, b) => meta.scnMem[a].t - meta.scnMem[b].t); delete meta.scnMem[ks[0]]; } }
  return meta.scnMem[wk];
}
function scnStep(dt) {
  if (!SCN.clockOn) return;
  const m0 = SCN.min;
  SCN.min += dt;   // 1 game minute per real second
  if (Math.floor(m0 / 1440) !== Math.floor(SCN.min / 1440)) { SCN.day++; if (typeof spawnSpeech === "function" && player) spawnSpeech(player.x, player.y - 34, "🌅 DAY " + SCN.day, "#ffd166", 2.6); }
  SCN.dark = scnDarkness(SCN.min);
  if (Math.floor(m0) !== Math.floor(SCN.min)) {
    scnHud();
    if (Math.floor(SCN.min) % 30 === 0) { const E = scnWorldMem(); if (E) { E.min = SCN.min % 1440; E.day = SCN.day; E.t = Date.now(); } }
  }
}
function scnHud() {
  let el = document.getElementById("hudClock");
  if (!el) {
    const dm = document.getElementById("hudDM"); if (!dm) return;
    el = document.createElement("div"); el.className = "stat-pill"; el.id = "hudClock"; el.title = "Game time — 1 game hour = 1 real minute";
    dm.insertAdjacentElement("beforebegin", el);
  }
  if (!SCN.clockOn) { el.style.display = "none"; return; }
  el.style.display = "";
  const h = scnHour(), ic = h < 5 || h >= 21 ? "🌙" : h < 7 ? "🌅" : h < 18 ? "☀️" : h < 21 ? "🌇" : "🌙";
  const txt = ic + " " + scnTime(SCN.min) + " · D" + SCN.day;
  if (txt !== SCN.lastHud) { el.textContent = txt; SCN.lastHud = txt; }
}

/* --- night: the light map ---------------------------------------------------------------- */
function scnCaptureWorld(g) { if (SCN.dark > 0.01) SCN.m = g.getTransform(); }
function scnLights(push) {   // push(worldX, worldY, radiusPx, strength, kind)
  if (!player) return;
  // you: a torch / visor / glow
  push(player.x, player.y, player.inVehicle ? 120 : 210, 1, "me");
  // street lights in the chunks around you
  if (typeof cityChunk === "function") {
    const cx = Math.floor((player.x + CITY.orx) / 2048), cy = Math.floor((player.y + CITY.ory) / 2048);
    for (let y = cy - 1; y <= cy + 1; y++) for (let x = cx - 1; x <= cx + 1; x++) {
      let C; try { C = cityChunk(x, y); } catch (e) { continue; }
      if (!C || !C.props) continue;
      for (const p of C.props) {
        if (p.t !== "streetlight" && p.t !== "trafficlight" && p.t !== "pump" && p.t !== "busstop") continue;
        const wx = (p.x + (p.w || 1) / 2) * 16 - CITY.orx, wy = (p.y + (p.h || 1) / 2) * 16 - CITY.ory;
        if (Math.abs(wx - player.x) > 1400 || Math.abs(wy - player.y) > 1000) continue;
        push(wx, wy, p.t === "streetlight" ? 300 : 170, 0.9, "lamp");
      }
    }
  }
  // headlights of anything with a driver
  if (typeof VEH !== "undefined") for (const v of VEH.list) {
    if (!v.drv && !(player.inVehicle === 3 && VEH.ride === v) || v.dead) continue;
    if (Math.abs(v.x - player.x) > 1600 || Math.abs(v.y - player.y) > 1200) continue;
    const fx = Math.cos(v.ang), fy = Math.sin(v.ang);
    for (let k = 1; k <= 3; k++) push(v.x + fx * (v.D * 0.5 + 70 * k), v.y + fy * (v.D * 0.5 + 70 * k), 70 + 40 * k, 0.8, "car");
  }
  // the building you're in has its lights on
  if (typeof cityBuildingAt === "function") { const b = cityBuildingAt(player.x, player.y); if (b) push(player.x, player.y, 520, 0.85, "room"); }
  if (typeof townsLights === "function") townsLights(push);
}
function scnRenderNight(g) {
  if (!SCN.clockOn || SCN.dark < 0.01 || !SCN.m || typeof CITY === "undefined" || !CITY.on) return;
  const cv = g.canvas, W0 = cv.width, H0 = cv.height, q = 3, w = Math.ceil(W0 / q), h = Math.ceil(H0 / q);
  if (!SCN.lc || SCN.lc.width !== w || SCN.lc.height !== h) { SCN.lc = document.createElement("canvas"); SCN.lc.width = w; SCN.lc.height = h; SCN.lg = SCN.lc.getContext("2d"); }
  const L = SCN.lg, M = SCN.m, sc = Math.hypot(M.a, M.b) / q;
  L.globalCompositeOperation = "source-over"; L.clearRect(0, 0, w, h);
  L.fillStyle = "rgba(4,8,26," + SCN.dark.toFixed(3) + ")"; L.fillRect(0, 0, w, h);
  L.globalCompositeOperation = "destination-out";
  scnLights((x, y, r, s) => {
    const sx = (M.a * x + M.c * y + M.e) / q, sy = (M.b * x + M.d * y + M.f) / q, R = r * sc;
    if (sx < -R || sy < -R || sx > w + R || sy > h + R || R < 1) return;
    const G = L.createRadialGradient(sx, sy, 0, sx, sy, R);
    G.addColorStop(0, "rgba(0,0,0," + s + ")"); G.addColorStop(0.55, "rgba(0,0,0," + (s * 0.55) + ")"); G.addColorStop(1, "rgba(0,0,0,0)");
    L.fillStyle = G; L.beginPath(); L.arc(sx, sy, R, 0, Math.PI * 2); L.fill();
  });
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.imageSmoothingEnabled = true; g.drawImage(SCN.lc, 0, 0, w * q, h * q);
  // a warm touch round the lamps
  if (SCN.dark > 0.3) {
    g.globalCompositeOperation = "lighter"; g.globalAlpha = Math.min(0.22, SCN.dark * 0.3);
    scnLights((x, y, r, s, kind) => {
      if (kind !== "lamp" && kind !== "car") return;
      const sx = M.a * x + M.c * y + M.e, sy = M.b * x + M.d * y + M.f, R = r * Math.hypot(M.a, M.b) * 0.6;
      if (sx < -R || sy < -R || sx > W0 + R || sy > H0 + R) return;
      const G = g.createRadialGradient(sx, sy, 0, sx, sy, R); G.addColorStop(0, kind === "car" ? "#fff8e1" : "#ffcc80"); G.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = G; g.beginPath(); g.arc(sx, sy, R, 0, Math.PI * 2); g.fill();
    });
  }
  g.restore();
}

if (typeof V10 !== "undefined") {
  V10.onRunStart.push(scnRunStart);
  V10.onStep.push(scnStep);
  V10.onRenderWorld.push(scnCaptureWorld);
  V10.onRenderScreen.unshift(scnRenderNight);   // before the minimap & HUD canvases, so they aren't darkened
  V10.onRunReset.push(() => { SCN.clockOn = false; const el = document.getElementById("hudClock"); if (el) el.style.display = "none"; const E = scnWorldMem(); if (E && SCN.mode !== "survivors") { E.min = SCN.min % 1440; E.day = SCN.day; } });
}
// EOF:js/scenario.js
