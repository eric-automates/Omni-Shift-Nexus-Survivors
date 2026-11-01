/* =========================================================================
   OMNI-SHIFT v14.2 — LOCATION (js/location.js)
   The menu side of the world profiles.
   • 📍 LOCATION on the main menu: WHERE (your hero's homeworld · choose any
     world · Classic Nexus City), a live 64 km map preview, and the seed
     (a brand-new world every run, or keep this one, or type a seed)
   • the creator's "HAILS FROM" chips: your own hero's homeworld (or Real Life)
   • run start: the right world, its look, its enemies when you are a visitor;
     markers and the drop zone are remembered per world (Nexus keeps its old ones)
   • the next run's world is rolled when a run starts, so the drop-zone map in
     the menu always previews the world you will land on next
   ?region=<key>&rseed=<n> pins a world for tests (?region=nexus = exact v14.1).
   ========================================================================= */
"use strict";

const LOC = { dropKey: null, lastKey: "", previewKey: "", busy: false };
const LOC_WHERE = {
  home: { icon: "🏠", name: "HOMEWORLD", desc: "Your hero's own world, built as close to the films as it can be — a different one every run." },
  world: { icon: "🌍", name: "CHOOSE A WORLD", desc: "Visit any universe's homeworld. Its locals and its enemies come with it." },
  nexus: { icon: "🌆", name: "CLASSIC NEXUS CITY", desc: "The v14 region, dressed for your hero. Same layout every run (old markers kept)." }
};
// creator: where your own hero hails from
const RG_HAILS = (function () {
  const o = { auto: { name: "Auto", desc: "Follows the creator's universe pick (Outer Rim → Tatooine, Wizarding → the Highlands, Mob War → the Midwest…)." } };
  for (const k of RG_WORLD_ORDER) { const P = RG_PROFILES[k]; o[k] = { name: (P.group === "Real Life" ? "Real Life" : P.group) + " · " + P.name, desc: P.sub }; }
  return o;
})();
const LOC_UNI_HOME = { outerrim: "tatooine", core: "tatooine", clonewars: "tatooine", stargate: "abydos", mob: "midwest", manhunt: "midwest", matrix: "midwest", cyber: "nightcity",
  frontier: "persephone", west: "persephone", dune: "arrakis", trek: "sfearth", aliens: "lv426", doom: "lv426", w40k: "kiearth", waste: "midwest", middle: "continent", witcher: "continent", wizard: "highlands" };

/* --- state ------------------------------------------------------------------------- */
function locState() {
  if (typeof meta === "undefined") return { where: "nexus", world: "tatooine", seedMode: "new", seed: 0, next: 0 };
  const d = meta.region && typeof meta.region === "object" ? meta.region : {};
  if (!LOC_WHERE[d.where]) d.where = "home";
  if (!RG_PROFILES[d.world] || d.world === "nexus") d.world = "tatooine";
  if (d.seedMode !== "keep") d.seedMode = "new";
  d.seed = d.seed >>> 0; d.next = d.next >>> 0;
  if (!d.next) d.next = locRandSeed();
  if (!d.seed) d.seed = d.next;
  meta.region = d;
  if (!meta.cityDrops || typeof meta.cityDrops !== "object") meta.cityDrops = Array.isArray(meta.cityDrop) ? { nexus: meta.cityDrop.slice() } : {};
  return d;
}
function locRandSeed() { return 1000 + Math.floor(Math.random() * 2e9); }
function locHeroGroup(cid) {
  const c = typeof CHAR_RAW !== "undefined" ? CHAR_RAW[cid] : null;
  return c ? c[1] : 0;
}
function locHomeKey(cid) {
  if (cid === (typeof CUSTOM_CID !== "undefined" ? CUSTOM_CID : 80)) {
    const d = typeof customHeroDesign === "function" ? customHeroDesign() : null;
    if (d && d.hails && d.hails !== "auto" && RG_PROFILES[d.hails]) return d.hails;
    const u = typeof customCityUniverse === "function" ? customCityUniverse() : null;
    if (u && LOC_UNI_HOME[u.key]) return LOC_UNI_HOME[u.key];
  }
  return RG_GROUP_HOME[locHeroGroup(cid)] || "midwest";
}
// the world the next run will use
function locResolve(cid) {
  const S = locState(), q = typeof location !== "undefined" ? new URLSearchParams(location.search) : null;
  const qr = q && q.get("region"), qs = q && q.get("rseed");
  if (qr && (RG_PROFILES[qr] || qr === "home")) {
    const key = qr === "home" ? locHomeKey(cid) : qr;
    return { key, seed: key === "nexus" ? ((typeof meta !== "undefined" && meta.citySeed >>> 0) || 1979) : ((+qs >>> 0) || 4242), pinned: true };
  }
  if (S.where === "nexus") return { key: "nexus", seed: (typeof meta !== "undefined" && meta.citySeed >>> 0) || 1979 };
  const key = S.where === "home" ? locHomeKey(cid) : S.world;
  return { key, seed: S.seedMode === "keep" ? S.seed : S.next };
}
// make CITY the resolved world (generates only when it changed)
function locApply(cid) {
  const L = locResolve(cid);
  regionSetProfile(L.key);
  if (!CITY.ready || CITY.seed !== (L.seed >>> 0) || RG.genKey !== L.key) { regionGenerate(L.key, L.seed); RG.genKey = L.key; }
  else RG.seed = L.seed >>> 0;
  if (typeof cityApplyTheme === "function") cityApplyTheme(cityThemeKeyForHero(cid));
  locSyncDrop();
  return L;
}
// one drop zone per world (Nexus keeps the v14 one); markers are keyed in mapMarkers below
function locWorldKey() { return RG.key === "nexus" ? "nexus" : regionWorldKey(); }
function locSyncDrop() {
  if (typeof meta === "undefined") return;
  locState();
  const wk = locWorldKey();
  if (LOC.dropKey === wk) return;
  if (LOC.dropKey) { if (Array.isArray(meta.cityDrop)) meta.cityDrops[LOC.dropKey] = meta.cityDrop.slice(); else delete meta.cityDrops[LOC.dropKey]; }
  if (Array.isArray(meta.cityDrops[wk])) meta.cityDrop = meta.cityDrops[wk].slice(); else delete meta.cityDrop;
  LOC.dropKey = wk;
  const keys = Object.keys(meta.cityDrops);
  if (keys.length > 40) for (const k of keys.slice(0, keys.length - 40)) if (k !== "nexus") delete meta.cityDrops[k];
}

/* --- engine hooks ---------------------------------------------------------------------- */
(function locWire() {
  // the world's look (Classic Nexus keeps dressing itself for the hero)
  if (typeof cityThemeKeyForHero === "function") {
    const _tk = cityThemeKeyForHero;
    window.cityThemeKeyForHero = cityThemeKeyForHero = function (cid) { return (RG.key !== "nexus" && RG.P && RG.P.theme && CITY_THEMES[RG.P.theme]) ? RG.P.theme : _tk(cid); };
  }
  // run start: generate the world, then let the classic start do the rest (its own seed check sees the same seed)
  if (typeof cityRunStart === "function") {
    const _rs = cityRunStart;
    window.cityRunStart = cityRunStart = function (p) {
      if (typeof cityWorldWanted === "function" && !cityWorldWanted()) return _rs(p);
      let L = null;
      try { L = locApply(p.cid); } catch (e) { if (window.trackProgress) window.trackProgress("locApply: " + e.message, true); regionSetProfile("nexus"); }
      const keep = meta.citySeed;
      meta.citySeed = CITY.seed;
      try {
        // visitors meet the world's own enemies; at home your usual hunters are waiting
        if (L && L.key !== "nexus") p.hostileRoster = (L.key !== locHomeKey(p.cid) && RG.P.roster) ? RG.P.roster : null;
        return _rs(p);
      } finally {
        meta.citySeed = keep;
        const S = locState();
        if (L && L.key !== "nexus" && !L.pinned) { if (S.seedMode === "new") S.next = locRandSeed(); S.seed = L.seed >>> 0; if (typeof saveMeta === "function") saveMeta(); }
        LOC.lastKey = L ? L.key : "nexus";
      }
    };
    // cityplay registered the original directly in the run-start hook list
    if (typeof V10 !== "undefined" && V10.onRunStart) { const i = V10.onRunStart.indexOf(_rs); if (i >= 0) V10.onRunStart[i] = cityRunStart; }
  }
  // drop zone: per world; organic worlds land you on a street of the main town
  if (typeof cityPickDrop === "function") {
    const _pd = cityPickDrop;
    window.cityPickDrop = cityPickDrop = function () {
      if (RG.org) {
        const d = typeof meta !== "undefined" ? meta.cityDrop : null;
        if (Array.isArray(d) && d.length === 2 && d.every(v => typeof v === "number" && v > 64 && v < CITY.WORLD_T - 64)) return [d[0] * 16 + 8, d[1] * 16 + 8];
        return regionPickDrop();
      }
      return _pd();
    };
  }
  // markers per world
  if (typeof mapMarkers === "function") {
    const _mm = mapMarkers;
    window.mapMarkers = mapMarkers = function () {
      if (RG.key === "nexus" || typeof meta === "undefined") return _mm();
      if (!meta.cityMarkers || typeof meta.cityMarkers !== "object") meta.cityMarkers = {};
      const k = regionWorldKey();
      if (!Array.isArray(meta.cityMarkers[k])) meta.cityMarkers[k] = [];
      return meta.cityMarkers[k];
    };
  }
  // the drop-zone map previews the world of the next run; NEW REGION rolls a fresh one of the same world
  if (typeof mapOpen === "function") {
    const _mo = mapOpen;
    window.mapOpen = mapOpen = function (mode) {
      const m = mode || (runActive ? "run" : "drop");
      if (m !== "drop") return _mo(mode);
      try { locApply(typeof meta !== "undefined" ? meta.selChar : 0); } catch (e) { regionSetProfile("nexus"); }
      const keep = meta.citySeed; meta.citySeed = CITY.seed;
      try { _mo(mode); } finally { meta.citySeed = keep; }
      const nb = document.getElementById("mapNew");
      if (nb && !nb._loc) {
        const orig = nb.onclick; nb._loc = 1;
        nb.onclick = () => {
          if (RG.key === "nexus") { orig && orig(); LOC.dropKey = null; locSyncDrop(); return; }
          const S = locState(); S.next = locRandSeed(); if (S.seedMode === "keep") S.seed = S.next;
          if (typeof saveMeta === "function") saveMeta();
          locApply(meta.selChar); MAPV.tiles.clear(); MAPV.lastSig = "";
          const c = RG.towns[0] || { x: 32000, y: 32000 }; MAPV.cx = c.x; MAPV.cy = c.y; MAPV.mpp = 40; if (typeof mapSideSync === "function") mapSideSync();
          document.getElementById("mapTitle").textContent = "CHOOSE YOUR DROP ZONE · " + RG.P.name.toUpperCase();
        };
      }
      document.getElementById("mapTitle").textContent = "CHOOSE YOUR DROP ZONE · " + (RG.P ? RG.P.name : "Nexus City").toUpperCase();
    };
  }
  if (typeof mapDropLabel === "function") {
    const _dl = mapDropLabel;
    window.mapDropLabel = mapDropLabel = function () { return _dl().replace("CITY MAP", "MAP"); };
  }
  // names: towns of organic worlds have their own; grid capitals are renamed per world
  if (typeof cityName === "function") {
    const _cn = cityName;
    window.cityName = cityName = function (c) {
      if (!c) return "";
      if (RG.org) return c.name || "";
      if (RG.grid && c.idx === 0 && RG.P.capital) return RG.P.capital;
      return _cn(c);
    };
  }
  if (typeof cityShortName === "function") {
    const _sn = cityShortName;
    window.cityShortName = cityShortName = function () { return RG.org ? locPlaceName(...cityWorldM(player.x, player.y)).top : _sn(); };
  }
  if (typeof cityUpdateBanner === "function") {
    const _ub = cityUpdateBanner;
    window.cityUpdateBanner = cityUpdateBanner = function (force) {
      if (RG.org) return locBanner(force);
      const r = _ub(force);
      if (RG.grid && RG.airCell.size && player) {   // airports have their own name
        const [xm, ym] = cityWorldM(player.x, player.y), A = RG.airCell.get(rgCK(Math.floor(xm / 1000), Math.floor(ym / 1000))), el = document.getElementById("cityHud");
        if (A && el) { const top = A.name + " · Airfield"; if (CITYP.banner !== top && typeof fxBanner === "function") fxBanner(A.name.toUpperCase(), "Airfield", "#80deea", 1.6, false, "city"); CITYP.banner = top; el.innerHTML = "<b>" + top + "</b><span>Runways, hangars & the terminal</span>"; }
      }
      return r;
    };
  }
})();
if (typeof enemyRosterKey === "function") {   // a visitor's world roster beats the creator universe's
  const _ek = enemyRosterKey;
  window.enemyRosterKey = enemyRosterKey = function () { if (typeof player !== "undefined" && player && player.hostileRoster && RG.key !== "nexus" && typeof ER !== "undefined" && ER[player.hostileRoster]) return player.hostileRoster; return _ek(); };
}
RG_PROFILES.midwest.capital = "Meridian"; RG_PROFILES.nightcity.capital = "Night City"; RG_PROFILES.sfearth.capital = "San Francisco";

// "Mos Eisley · Spaceport Quarter" / "Lars Homestead · Moisture Farms" / "Dune Sea"
function locPlaceName(xm, ym) {
  const mx = Math.floor(xm / 1000), my = Math.floor(ym / 1000), cls = cityMacroClass(mx, my);
  const T = rgTownAt(xm, ym, 1.06);
  if (T) return { top: T.name, sub: CL_NAMES[cls], cls };
  for (const s of RG.sites) if (Math.hypot(s.x - xm, s.y - ym) < s.rad + 30) return { top: s.name || rgAreaName(mx, my), sub: rgAreaName(mx, my), cls, site: s };
  return { top: rgAreaName(mx, my), sub: RG.P.name, cls };
}
function locBanner(force) {
  const [xm, ym] = cityWorldM(player.x, player.y), P = locPlaceName(xm, ym);
  const onRoof = !!player.roof, b = onRoof ? cityBldT(cityTX(player.x), cityTY(player.y)) : cityBuildingAt(player.x, player.y);
  const inside = b ? (cityBuildingLabel(b) || (b.type === "dome" ? (b.round ? "Dome" : "House") : b.type === "rgbox" ? "House" : b.type === "house" ? "House" : "Building")) : "";
  const nr = rgNearestRoad(xm, ym, 40);
  const top = P.top + " · " + P.sub, sub = inside ? (onRoof ? "On the roof: " : "Inside: ") + inside : (nr ? nr.s.r.name : "");
  const el = document.getElementById("cityHud");
  if (!el) return;
  el.style.display = "block";
  if (force || top !== CITYP.banner) {
    if (CITYP.banner && top !== CITYP.banner && typeof fxBanner === "function") fxBanner(P.top.toUpperCase(), P.sub, "#80deea", 1.6, false, "city");
    CITYP.banner = top;
  }
  el.innerHTML = "<b>" + top + "</b><span>" + sub + "</span>";
}
// EOF part 1 (location.js continues)

/* --- the LOCATION screen ------------------------------------------------------------------ */
function locLabel() {
  const S = locState(), cid = typeof meta !== "undefined" ? meta.selChar : 0;
  if (S.where === "nexus") return "📍 LOCATION: CLASSIC NEXUS CITY";
  const k = S.where === "home" ? locHomeKey(cid) : S.world, P = RG_PROFILES[k];
  return "📍 LOCATION: " + P.icon + " " + P.name.toUpperCase() + (S.where === "home" ? " (HOMEWORLD)" : "") + (S.seedMode === "keep" ? " · 📌" : "");
}
function locEnsureScreen() {
  if (document.getElementById("scrLocation")) return;
  const el = document.createElement("div");
  el.id = "scrLocation"; el.className = "screen";
  el.innerHTML = '<h2>📍 LOCATION</h2><div class="sub">Where your next run drops you. Every universe has its own homeworld — a brand-new one each run unless you keep it.</div>' +
    '<div id="locBody" style="max-width:760px;margin:auto;width:100%"></div>' +
    '<div class="bar"><button class="btn gold" id="locDone">✔ DONE</button><button class="btn" id="locDrop">🗺️ CHOOSE DROP ZONE</button></div>';
  (document.getElementById("ui") || document.body).appendChild(el);
  if (typeof enableScreenCardScroll === "function") try { enableScreenCardScroll(); } catch (e) { /* optional */ }
  const st = document.createElement("style");
  st.textContent = "#locBody .lc-row{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin:6px 0}#locBody .lc-card{flex:1 1 200px;max-width:250px;text-align:left;padding:9px 11px;border-radius:9px;border:1px solid #00e5ff44;background:#0b1622;color:#cfe;cursor:pointer;font-size:12px;line-height:1.35}" +
    "#locBody .lc-card b{display:block;font-size:13px;color:#fff;margin-bottom:3px}#locBody .lc-card.on{border-color:#ffd166;box-shadow:0 0 0 1px #ffd166 inset,0 0 14px #ffd16655;background:#16202a}" +
    "#locBody .lc-world{flex:0 1 172px;padding:7px 9px;font-size:11px}#locBody .lc-world b{font-size:12px}#locBody .lc-world i{display:block;color:#8ab;font-style:normal;font-size:10px}" +
    "#locBody .lc-sec{margin:10px 0 2px;color:#80deea;font-weight:800;font-size:12px;letter-spacing:.08em;text-align:center}#locBody .lc-prev{display:flex;gap:12px;align-items:flex-start;justify-content:center;flex-wrap:wrap}" +
    "#locBody canvas{border:1px solid #00e5ff55;border-radius:8px;background:#060b14}#locBody .lc-info{max-width:330px;font-size:12px;color:#cde;line-height:1.45}#locBody .lc-info b{color:#ffd166}#locBody input{background:#081018;color:#fff;border:1px solid #00e5ff66;border-radius:5px;padding:4px 6px;width:120px}";
  document.head.appendChild(st);
  el.querySelector("#locDone").onclick = () => { showScreen("scrMain"); if (typeof updateMenuUI === "function") updateMenuUI(); locMenuSync(); };
  el.querySelector("#locDrop").onclick = () => { if (typeof mapOpen === "function") mapOpen("drop"); };
}
function locOpen() { locEnsureScreen(); showScreen("scrLocation"); locRender(); }
function locRender() {
  const S = locState(), body = document.getElementById("locBody"), cid = typeof meta !== "undefined" ? meta.selChar : 0;
  if (!body) return;
  const home = locHomeKey(cid), H = RG_PROFILES[home], hero = (CHAR_RAW[cid] || [0, 0, 0, "Hero"])[3];
  const card = (k) => { const w = LOC_WHERE[k], on = S.where === k; return '<div class="lc-card' + (on ? " on" : "") + '" data-where="' + k + '"><b>' + w.icon + " " + w.name + "</b>" + (k === "home" ? "<u>" + H.icon + " " + H.name + "</u> for " + hero + "<br>" : "") + w.desc + "</div>"; };
  let html = '<div class="lc-sec">WHERE</div><div class="lc-row">' + card("home") + card("world") + card("nexus") + "</div>";
  if (S.where === "world") html += '<div class="lc-row">' + RG_WORLD_ORDER.map(k => { const P = RG_PROFILES[k]; return '<div class="lc-card lc-world' + (S.world === k ? " on" : "") + '" data-world="' + k + '" title="' + P.sub.replace(/"/g, "") + '"><b>' + P.icon + " " + P.name + "</b><i>" + P.group + (k === home ? " · your homeworld" : "") + "</i></div>"; }).join("") + "</div>";
  if (S.where !== "nexus") {
    html += '<div class="lc-sec">THE WORLD</div><div class="lc-prev"><canvas id="locCv" width="300" height="300"></canvas><div class="lc-info" id="locInfo"></div></div>' +
      '<div class="lc-sec">SEED</div><div class="lc-row">' +
      '<div class="lc-card' + (S.seedMode === "new" ? " on" : "") + '" data-seed="new"><b>🎲 NEW WORLD EVERY RUN</b>Each deploy builds a fresh world. The map shows the next one.</div>' +
      '<div class="lc-card' + (S.seedMode === "keep" ? " on" : "") + '" data-seed="keep"><b>📌 KEEP THIS WORLD</b>Land in the same world every run — your markers and drop zone stay put.</div></div>' +
      '<div class="lc-row" style="align-items:center;font-size:12px;color:#cde">Seed <input id="locSeed" inputmode="numeric" value="' + (S.seedMode === "keep" ? S.seed : S.next) + '"> <button class="btn" id="locReroll">🎲 REROLL</button></div>';
  } else html += '<div class="lc-row" style="font-size:12px;color:#cde;max-width:520px;margin:8px auto">Classic Nexus City uses the region seed from the drop-zone map (🌍 NEW REGION there), exactly like v14.1.</div>';
  body.innerHTML = html;
  body.querySelectorAll("[data-where]").forEach(b => b.onclick = () => { S.where = b.dataset.where; locChanged(); });
  body.querySelectorAll("[data-world]").forEach(b => b.onclick = () => { S.world = b.dataset.world; locChanged(); });
  body.querySelectorAll("[data-seed]").forEach(b => b.onclick = () => { if (b.dataset.seed === "keep" && S.seedMode !== "keep") S.seed = S.next; S.seedMode = b.dataset.seed; if (S.seedMode === "new") S.next = S.seed || S.next; locChanged(); });
  const inp = body.querySelector("#locSeed");
  if (inp) inp.onchange = () => { const v = (parseInt(inp.value, 10) >>> 0) || locRandSeed(); if (S.seedMode === "keep") S.seed = v; else S.next = v; locChanged(); };
  const rr = body.querySelector("#locReroll");
  if (rr) rr.onclick = () => { const v = locRandSeed(); if (S.seedMode === "keep") S.seed = v; else S.next = v; locChanged(); };
  if (S.where !== "nexus") setTimeout(locPreview, 20);
}
function locChanged() { if (typeof saveMeta === "function") saveMeta(); locRender(); locMenuSync(); }
function locPreview() {
  const cv = document.getElementById("locCv"), info = document.getElementById("locInfo");
  if (!cv) return;
  const cid = typeof meta !== "undefined" ? meta.selChar : 0;
  const t0 = performance.now();
  let L;
  try { L = locApply(cid); } catch (e) { info.textContent = "Could not build the preview: " + e.message; return; }
  const ms = performance.now() - t0;
  const g = cv.getContext("2d");
  if (typeof MAPV !== "undefined") { if (LOC.previewKey !== L.key + "|" + L.seed) MAPV.tiles.clear(); LOC.previewKey = L.key + "|" + L.seed; }
  // whole 64 km square at 213 m per pixel; coarse tiles first, then refine
  const draw = () => { if (!document.getElementById("locCv")) return; mapDraw(g, 0, 0, 300, 300, 32000, 32000, 64000 / 300, 6); const St = mapStyle(); g.save(); g.font = "800 10px 'Segoe UI', sans-serif"; g.textAlign = "center"; g.lineWidth = 3; g.strokeStyle = St.halo; g.fillStyle = St.txt; for (const c of CITY.cities) { if (c.kind === 2) continue; const x = c.x / 64000 * 300, y = c.y / 64000 * 300, n = cityName(c); g.strokeText(n, x, y); g.fillText(n, x, y); } g.restore(); };
  draw(); setTimeout(draw, 120); setTimeout(draw, 400);
  const P = RG.P, towns = CITY.cities.length, sites = RG.sites.length;
  const kinds = {}; for (const s of RG.sites) kinds[s.name.replace(/^[A-Z][a-z]+ (Homestead|Ranch)$/, "$1s")] = (kinds[s.name.replace(/^[A-Z][a-z]+ (Homestead|Ranch)$/, "$1s")] || 0) + 1;
  const top = Object.entries(kinds).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([n, c]) => (c > 1 ? c + "× " : "") + n).join(" · ");
  info.innerHTML = "<b>" + P.icon + " " + P.name + "</b> — " + P.sub + "<br><br>" + (RG.org ? towns + " towns & settlements · " + sites + " sites" + (top ? "<br><small>" + top + "</small>" : "") : CITY.cities.length + " cities & towns · interstates & an edge beltway" + (RG.airports.length ? " · " + RG.airports.length + " airports" : "")) +
    "<br><small>Seed " + L.seed + " · built in " + Math.round(ms) + " ms</small>" + (L.key === locHomeKey(cid) ? "<br><small>🏠 your hero's homeworld — your usual hunters are waiting</small>" : "<br><small>👥 you are a visitor: " + (typeof ER !== "undefined" && ER[P.roster] ? ER[P.roster].name : "the locals") + " hunt you here</small>");
}
function locMenuSync() { const b = document.getElementById("goLocation"); if (b) b.textContent = locLabel(); const d = document.getElementById("goDrop"); if (d && typeof mapDropLabel === "function") d.textContent = mapDropLabel(); }
(function locMenuInit() {
  const go = document.getElementById("goPlay");
  if (!go || document.getElementById("goLocation")) return;
  const b = document.createElement("button"); b.className = "btn gold"; b.id = "goLocation"; b.textContent = locLabel();
  b.onclick = locOpen;
  go.insertAdjacentElement("afterend", b);
  // ui.js (updateMenuUI, loadMeta) loads after this module: hook in once every script has run
  const hook = () => {
    if (typeof updateMenuUI !== "function" || updateMenuUI._loc) return;
    const _u = updateMenuUI; window.updateMenuUI = updateMenuUI = function () { const r = _u.apply(this, arguments); locMenuSync(); return r; }; updateMenuUI._loc = 1;
    locMenuSync();
  };
  setTimeout(hook, 0); window.addEventListener("load", hook);
})();
// EOF:js/location.js
