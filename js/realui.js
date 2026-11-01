/* =========================================================================
   OMNI-SHIFT v14.2 — REAL MAP · MENU & SESSION (js/realui.js)
   • 📍 LOCATION → 🗺️ REAL MAP, two modes:
       🏛️ INDIANA CITY — 14 Indiana places (Indianapolis by default), shipped
          with the game (data/realmap/), works without internet
       🌍 ANY CITY IN THE WORLD — search any place (OpenStreetMap search),
          streamed live from OpenFreeMap and cached for the next visit
     48 km across with the city in the middle; Highway 365 (under
     construction) rings the edge
   • WHO'S AFTER YOU: Snuck In (real locals + bounty hunters from your own
     universe who followed you — lawful ones play by local rules), Invasion,
     Locals Only, Open Season (any other hero can come to collect)
   • the loading screen before a real-map run, the offline fallback (a
     generated map + a banner), the first-start disclaimer
   ========================================================================= */
"use strict";

const RMUI = { busy: false, bypass: false, fallback: "", search: [], searchMsg: "", lastQuery: "", loadEl: null, cancel: false, packsOk: null };
const RM_INDIANA = [   // name, lat, lon, population (2020 census; GeoNames for the smallest towns) — matches data/realmap/index.json
  ["Indianapolis", 39.76838, -86.15804, 887642], ["Carmel", 39.97837, -86.11804, 99757], ["Fishers", 39.95559, -86.01387, 98977],
  ["Noblesville", 40.04559, -86.0086, 69604], ["Gary", 41.59337, -87.34643, 69093], ["Greenwood", 39.61366, -86.10665, 63830],
  ["Kokomo", 40.48643, -86.1336, 59604], ["Westfield", 40.04282, -86.12749, 46410], ["Lebanon", 40.04837, -86.46917, 16662],
  ["Beech Grove", 39.72199, -86.08998, 14717], ["Brazil", 39.52365, -87.12502, 8181], ["Sheridan", 40.13504, -86.22055, 2934],
  ["Thorntown", 40.12948, -86.60667, 1485], ["Clay City", 39.27671, -87.11279, 840]
];
const RM_WORLD_PICKS = [
  ["New York", 40.7128, -74.006, "New York, USA"], ["Los Angeles", 34.0522, -118.2437, "California, USA"], ["Chicago", 41.8781, -87.6298, "Illinois, USA"], ["Las Vegas", 36.1699, -115.1398, "Nevada, USA"],
  ["Miami", 25.7617, -80.1918, "Florida, USA"], ["San Francisco", 37.7749, -122.4194, "California, USA"], ["Washington", 38.9072, -77.0369, "D.C., USA"], ["Nashville", 36.1627, -86.7816, "Tennessee, USA"],
  ["New Orleans", 29.9511, -90.0715, "Louisiana, USA"], ["Seattle", 47.6062, -122.3321, "Washington, USA"], ["Toronto", 43.6532, -79.3832, "Canada"], ["Mexico City", 19.4326, -99.1332, "Mexico"],
  ["London", 51.5074, -0.1278, "United Kingdom"], ["Paris", 48.8566, 2.3522, "France"], ["Rome", 41.9028, 12.4964, "Italy"], ["Berlin", 52.52, 13.405, "Germany"],
  ["Tokyo", 35.6762, 139.6503, "Japan"], ["Seoul", 37.5665, 126.978, "South Korea"], ["Hong Kong", 22.3193, 114.1694, "China"], ["Singapore", 1.3521, 103.8198, "Singapore"],
  ["Sydney", -33.8688, 151.2093, "Australia"], ["Dubai", 25.2048, 55.2708, "UAE"], ["Cairo", 30.0444, 31.2357, "Egypt"], ["Rio de Janeiro", -22.9068, -43.1729, "Brazil"]
];
const RM_THREATS = {
  snuck: { icon: "🕵️", name: "SNUCK IN", desc: "You slipped into the real world. The streets belong to real locals — police on patrol, crews in the buildings — and bounty hunters from your own universe tracked you here. Lawful hunters play by local rules; lawless ones don't." },
  invasion: { icon: "👾", name: "INVASION", desc: "Your universe's forces poured through with you: your usual hunters, all over a real city." },
  locals: { icon: "🚓", name: "LOCALS ONLY", desc: "Just real life: police, SWAT and street crews. Nobody from your universe followed you." },
  open: { icon: "🎯", name: "OPEN SEASON", desc: "Every universe put a price on your head — any of the other heroes can turn up to collect, and their forces roam the streets." }
};
// hunters that keep to the law of the land they are in (the rest are lawless)
const RM_LAWLESS = new Set([2, 3, 7, 9, 11, 12, 17, 19, 21, 23, 26, 30, 35, 84, 85, 87, 88, 49, 55, 62, 68, 70, 72, 75, 76, 77, 54, 15, 29]);
function rmHunterLawful(cid) { if (typeof getHeroAlign === "function" && getHeroAlign(cid) === "bad") return false; return !RM_LAWLESS.has(cid); }
const RM_HUNT_LINES = {
  lawful: ["There's a warrant with your name on it — come quietly and nobody gets hurt.", "I followed you across universes. Not here, not in front of these people — outside.", "Local rules, local law. Hands where I can see them."],
  lawless: ["Rules? Not in this world. Not for you.", "Nice little planet. Shame about the mess we're going to make.", "Your bounty doesn't say 'alive'."]
};

/* --- state --------------------------------------------------------------------------- */
function rmState() {
  const S = locState();
  const R = S.real && typeof S.real === "object" ? S.real : {};
  if (R.mode !== "online") R.mode = "offline";
  if (!RM_THREATS[R.threat]) R.threat = "snuck";
  if (!R.city || !RM_INDIANA.some(c => c[0] === R.city)) R.city = "Indianapolis";
  if (!Array.isArray(R.recent)) R.recent = [];
  if (R.place && !(typeof R.place.lat === "number" && typeof R.place.lon === "number")) R.place = null;
  S.real = R;
  return R;
}
function rmChosenPlace() {
  const R = rmState();
  if (R.mode === "offline") { const c = RM_INDIANA.find(q => q[0] === R.city) || RM_INDIANA[0]; return { name: c[0], region: "Indiana", lat: c[1], lon: c[2], mode: "offline", key: "in:" + c[0] }; }
  const p = R.place || { name: "Chicago", lat: 41.8781, lon: -87.6298, region: "Illinois, USA" };
  return { name: p.name, region: p.region || "", lat: p.lat, lon: p.lon, mode: "online", key: "w:" + p.lat.toFixed(4) + "," + p.lon.toFixed(4) };
}
function rmSeedOf(place) { let h = 2166136261; for (const ch of place.key) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return (h >>> 0) || 7; }
// point RM at a place (drops loaded data when it changes)
function rmUsePlace(place) {
  if (RM.place && RM.place.key === place.key && RM.mode === place.mode) return false;
  rmResetData(); RM.place = place; RM.mode = place.mode; rmSetCentre(place.lat, place.lon);
  RM.conc = place.mode === "offline" ? 3 : 6;
  return true;
}
// EOF part 1 (realui.js continues)

/* --- overview + preload ------------------------------------------------------------------ */
function rmLoadOverview() {
  if (RM.ovw) return Promise.resolve(RM.ovw);
  if (RM.ovwP && RM.ovwGen === RM.gen) return RM.ovwP;
  const gen = RM.gen, keys = rmTilesIn(RM_LO - 200, RM_LO - 200, RM_HI + 200, RM_HI + 200, 10);
  RM.ovwGen = gen;
  RM.ovwP = rmRequest(keys, 9).then(list => {
    if (gen !== RM.gen) throw new Error("cancelled");
    const O = { roads: [], water: [], land: [], places: [], aero: [], fail: 0 };
    for (const T of list) {
      if (T.st === 3) O.fail++;
      const F = T.f; if (!F) continue;
      for (const r of F.roads) if (/^(motorway|trunk|primary|secondary|tertiary|rail)/.test(r.cls)) O.roads.push(r);
      for (const w of F.water) if (w.cls !== "swimming_pool") O.water.push(w);
      for (const L of F.land) if (L.src === "lu" || L.src === "lc" || L.src === "park") O.land.push(L);
      for (const p of F.places) O.places.push(p);
      for (const a of F.aero) O.aero.push(a);
    }
    if (O.fail === list.length && list.length) throw new Error(RM.err || "map data unavailable");
    RM.ovw = O;
    return O;
  }).finally(() => { if (RM.ovwGen === gen) RM.ovwP = null; });
  return RM.ovwP;
}
// everything a run needs before it can start: the overview and the cells round the drop point
function rmPreload(place, drop, onProg) {
  rmUsePlace(place);
  const gen = RM.gen;
  return rmLoadOverview().then(() => {
    if (gen !== RM.gen) throw new Error("cancelled");
    const [xm, ym] = drop || [32000, 32000], cx = Math.floor(xm / 1000), cy = Math.floor(ym / 1000), set = new Set();
    for (let my = cy - 1; my <= cy + 1; my++) for (let mx = cx - 1; mx <= cx + 1; mx++) for (const k of rmCellKeys(mx, my)) set.add(k);   // the 3 × 3 km round the drop, complete
    const keys = [...set];
    let done = 0;
    const ps = keys.map(k => rmRequest([k], 9).then(r => { done++; if (onProg) onProg(done, keys.length); return r; }));
    return Promise.all(ps).then(() => {
      const failed = keys.filter(k => rmTileState(k) === 3).length;
      if (failed === keys.length && keys.length) throw new Error(RM.err || "map data unavailable");
      return { tiles: keys.length, failed };
    });
  });
}
function rmDropMetres() {   // the drop zone picked on the map for this place (world tiles → metres), if any
  if (typeof meta === "undefined") return null;
  const P = rmChosenPlace(), wk = "real|" + P.lat.toFixed(3) + "," + P.lon.toFixed(3);
  let d = null;
  if (typeof LOC !== "undefined" && LOC.dropKey === wk && Array.isArray(meta.cityDrop)) d = meta.cityDrop;
  else if (meta.cityDrops && Array.isArray(meta.cityDrops[wk])) d = meta.cityDrops[wk];
  return d && d.length === 2 ? [d[0] / 2, d[1] / 2] : null;
}
// EOF part 2 (realui.js continues)

/* --- engine hooks: resolve, start, scenarios ------------------------------------------- */
(function rmUiWire() {
  if (typeof LOC_WHERE !== "undefined") LOC_WHERE.real = { icon: "🗺️", name: "REAL MAP", desc: "A real place from OpenStreetMap, 48 km across with the city in the middle: every street, building and business where it really is." };
  if (typeof locResolve === "function") {
    const _lr = locResolve;
    window.locResolve = locResolve = function (cid) {
      const q = typeof location !== "undefined" ? new URLSearchParams(location.search) : null;
      const S = locState();
      if ((S.where === "real" && !(q && q.get("region"))) || (q && q.get("region") === "real")) {
        if (RMUI.fallback) return { key: "midwest", seed: S.next || 4242, fallback: true };
        const P = rmChosenPlace();
        rmUsePlace(P);
        if (RG.genKey === "real" && RM.ovw && !RMG.ovwBuilt) CITY.ready = false;   // built before the overview arrived: rebuild
        return { key: "real", seed: rmSeedOf(P), real: true, pinned: !!(q && q.get("region") === "real") };
      }
      return _lr(cid);
    };
  }
  if (typeof locLabel === "function") {
    const _ll = locLabel;
    window.locLabel = locLabel = function () { const S = locState(); if (S.where !== "real") return _ll(); const P = rmChosenPlace(); return "📍 LOCATION: 🗺️ " + P.name.toUpperCase() + " (REAL MAP" + (P.mode === "online" ? " · ONLINE" : "") + ")"; };
  }
  // the run waits for the map data (loading screen), or falls back to a generated world
  if (typeof startRun === "function") {
    const _sr = startRun;
    window.startRun = startRun = function () {
      const S = typeof meta !== "undefined" ? locState() : null;
      const want = S && S.where === "real" && (typeof meta === "undefined" || meta.world !== "classic");
      if (!want || RMUI.bypass) return _sr.apply(this, arguments);
      if (RMUI.busy) return;
      const P = rmChosenPlace(), drop = rmDropMetres(), args = arguments, self = this;
      RMUI.busy = true; RMUI.cancel = false; RMUI.fallback = "";
      rmLoading(true, "Building " + P.name + "…", 0);
      rmPreload(P, drop, (d, n) => rmLoading(true, "Building " + P.name + "… " + d + " / " + n + " map tiles", d / Math.max(1, n)))
        .then(() => { if (RMUI.cancel) throw new Error("cancelled"); })
        .catch(e => { if (String(e && e.message) === "cancelled" || RMUI.cancel) throw e; RMUI.fallback = (e && e.message) || "no data"; })
        .then(() => {
          rmLoading(false);
          RMUI.bypass = true;
          try { _sr.apply(self, args); } finally { RMUI.bypass = false; RMUI.busy = false; }
          const why = RMUI.fallback;
          if (why && typeof fxBanner === "function") setTimeout(() => fxBanner("REAL MAP UNAVAILABLE", "Playing a generated map · " + (P.mode === "offline" ? "built-in maps not found and no internet to stream them" : why), "#ffb300", 3.6, true, "city"), 600);
          else if (P.mode === "offline" && RM.viaOnline > 0 && typeof fxBanner === "function") setTimeout(() => fxBanner("BUILT-IN MAPS NOT FOUND", "Streaming " + P.name + " online instead · " + rmOfflineMissingWhy(), "#ffd166", 4.2, true, "city"), 4300);
          RMUI.fallback = "";
        })
        .catch(() => { rmLoading(false); RMUI.busy = false; });
    };
  }
  // scenarios: who hunts you on a real map
  if (typeof cityRunStart === "function") {
    const _rs = cityRunStart;
    window.cityRunStart = cityRunStart = function (p) {
      const r = _rs(p);
      if (RG.real && p) {
        const R = rmState(), th = R.threat;
        RMUI.threat = th;
        p.hostileRoster = th === "invasion" || th === "open" ? null : "streets";
        p.rivalEvery = th === "locals" ? 1e9 : th === "open" ? 50 : th === "snuck" ? 95 : 75;
        p.rivalPool = th === "snuck" ? "faction" : th === "open" ? "all" : "";
        if (typeof cityTipsReal === "function") cityTipsReal(p, th);
      } else if (p) { p.rivalPool = ""; RMUI.threat = ""; }
      return r;
    };
    if (typeof V10 !== "undefined" && V10.onRunStart) { const i = V10.onRunStart.indexOf(_rs); if (i >= 0) V10.onRunStart[i] = cityRunStart; }
  }
  // spawns carry a role (police / crew); the scenario turns it into a roster when they spawn
  if (typeof stSpawnGroup === "function") {
    const _sg = stSpawnGroup;
    window.stSpawnGroup = stSpawnGroup = function (s, S) {
      if (!RG.real || !s || !s.rmRole) return _sg(s, S);
      const th = RMUI.threat || "snuck", keep = s.ros;
      if (th === "invasion") s.ros = undefined;
      else if (th === "open") { let h = 0; for (let i = 0; i < s.id.length; i++) h = (h * 31 + s.id.charCodeAt(i)) >>> 0; s.ros = RM_OPEN_ROSTERS[(h + Math.floor(Date.now() / 90000)) % RM_OPEN_ROSTERS.length]; }
      else s.ros = s.rmRole === "police" ? "lapd" : "streets";
      try { return _sg(s, S); } finally { s.ros = keep; }
    };
  }
  // rival hunters: from your own universe (Snuck In) or any hero (Open Season); lawful ones announce themselves
  if (typeof randomRosterHero === "function") {
    const _rh = randomRosterHero;
    window.randomRosterHero = randomRosterHero = function (exclude) {
      if (!RMUI.pickingRival || typeof player === "undefined" || !player || player.rivalPool !== "faction") return _rh(exclude);
      const fac = CHAR_RAW[player.cid] ? CHAR_RAW[player.cid][1] : -1, ids = (typeof heroRosterIds === "function" ? heroRosterIds() : []).filter(i => i !== exclude && CHAR_RAW[i] && CHAR_RAW[i][1] === fac);
      return ids.length ? ids[Math.floor(Math.random() * ids.length)] : _rh(exclude);
    };
  }
  if (typeof spawnEnemy === "function") {
    const _se = spawnEnemy;
    window.spawnEnemy = spawnEnemy = function (isBoss, isRival) { if (!isRival) return _se.apply(this, arguments); RMUI.pickingRival = true; try { return _se.apply(this, arguments); } finally { RMUI.pickingRival = false; } };
  }
  if (typeof getRivalCallout === "function") {
    const _gc = getRivalCallout;
    window.getRivalCallout = getRivalCallout = function (rCid, pCid) {
      if (!RG.real) return _gc(rCid, pCid);
      const L = rmHunterLawful(rCid) ? RM_HUNT_LINES.lawful : RM_HUNT_LINES.lawless;
      return L[Math.floor(Math.random() * L.length)] + (rmHunterLawful(rCid) ? " [LAWFUL]" : " [LAWLESS]");
    };
  }
})();
if (typeof mapOpen === "function") {
  const _mo = mapOpen;
  window.mapOpen = mapOpen = function (mode) {
    const r = _mo.apply(this, arguments), nb = document.getElementById("mapNew");
    if (nb) nb.style.display = RG.real ? "none" : "";
    const ov = document.getElementById("mapOv");
    if (ov) {
      let at = document.getElementById("mapAttr");
      if (!at) { at = document.createElement("div"); at.id = "mapAttr"; at.style.cssText = "position:absolute;left:10px;bottom:8px;z-index:3;font:600 10.5px 'Segoe UI',sans-serif;color:#b8c8d0;background:rgba(4,8,14,0.72);padding:3px 8px;border-radius:5px;pointer-events:auto"; ov.appendChild(at); }
      at.innerHTML = rmAttr(true); at.style.display = RG.real ? "" : "none";
    }
    if (RG.real && (mode || (runActive ? "run" : "drop")) === "drop") { const t = document.getElementById("mapTitle"); if (t && RM.place) t.textContent = "CHOOSE YOUR DROP ZONE · " + RM.place.name.toUpperCase() + " (REAL MAP)"; if (!RM.ovw) rmLoadOverview().then(() => { CITY.ready = false; locApply(meta.selChar); MAPV.tiles.clear(); MAPV.lastSig = ""; }).catch(() => {}); }
    return r;
  };
}
const RM_OPEN_ROSTERS = ["imperial", "separatist", "goauld", "alliance", "harkonnen", "borg", "xenomorph", "agents", "arasaka", "death_eaters", "orcs", "witcher_foes", "demons", "lapd", "bratva", "outlaws"];
if (typeof erDef === "function") erDef("streets", "Street Crews", "rgba(130,10,16,0.62)", [
  ["Corner Lookout", "h", ["#2c3e50", "#1a1a1e", "#e8e8e8"], "buzz", "pistol", 1, 1, 1, "tracksuit"],
  ["Crew Enforcer", "h", ["#3a2a22", "#1e1a18", "#9a9a9a"], "slick", "smg", 1, 1, 1, "leather"],
  ["Guard Dog", "b", ["#3a2e26", "#2a201a", "#b8a890"], "pitbull", "none", 0, 0, 0.82, ""],
  ["Crew Boss", "h", ["#1e2226", "#14171a", "#d4a537"], "tactical", "shotgun", 1, 1, 1.15, "leather vest"]]);
// EOF part 3 (realui.js continues)

/* --- the LOCATION screen: real map section --------------------------------------------- */
function rmFmtPop(n) { return n >= 1e6 ? (n / 1e6).toFixed(1) + "M" : n >= 1e4 ? Math.round(n / 1000) + "k" : n >= 1000 ? (n / 1000).toFixed(1) + "k" : String(n); }
(function rmLocWire() {
  if (typeof locRender !== "function") return;
  const _lr = locRender;
  window.locRender = locRender = function () {
    const S = locState(), body = document.getElementById("locBody");
    if (!body) return _lr();
    if (S.where !== "real") {
      _lr();
      const row = body.querySelector(".lc-row");
      if (row && !row.querySelector('[data-where="real"]')) {
        row.classList.add("lc-where");
        const d = document.createElement("div"); d.className = "lc-card"; d.dataset.where = "real";
        d.innerHTML = "<b>🗺️ REAL MAP</b>" + LOC_WHERE.real.desc;
        const nexus = row.querySelector('[data-where="nexus"]'); row.insertBefore(d, nexus);
        d.onclick = () => { S.where = "real"; locChanged(); };
      }
      return;
    }
    rmRenderReal(body, S);
  };
  if (typeof locPreview === "function") { const _lp = locPreview; window.locPreview = locPreview = function () { return locState().where === "real" ? rmPreview() : _lp(); }; }
  const st = document.createElement("style");
  st.textContent = "#locBody .lc-row.lc-where .lc-card{flex:1 1 160px;max-width:200px}#locBody .rm-chips{display:flex;flex-wrap:wrap;gap:5px;justify-content:center;max-height:150px;overflow:auto;padding:4px;border:1px solid #00e5ff22;border-radius:8px;background:#060d16}" +
    "#locBody .rm-chip{padding:4px 8px;border-radius:12px;border:1px solid #00e5ff44;background:#0b1622;color:#cfe;cursor:pointer;font-size:11px;white-space:nowrap}#locBody .rm-chip i{color:#7aa;font-style:normal;margin-left:4px;font-size:10px}" +
    "#locBody .rm-chip.on{border-color:#ffd166;background:#2a2410;color:#fff;box-shadow:0 0 8px #ffd16655}#locBody .rm-search{display:flex;gap:6px;justify-content:center;margin:6px 0}#locBody .rm-search input{width:260px}" +
    "#locBody .rm-foot{font-size:10.5px;color:#89a;text-align:center;margin:8px auto;max-width:620px;line-height:1.5}#locBody .rm-foot a{color:#80deea;cursor:pointer;text-decoration:underline}#locBody .rm-msg{font-size:11px;color:#9ab;text-align:center;margin:4px}";
  document.head.appendChild(st);
})();
function rmRenderReal(body, S) {
  const R = rmState(), cid = typeof meta !== "undefined" ? meta.selChar : 0, home = locHomeKey(cid), H = RG_PROFILES[home], hero = (CHAR_RAW[cid] || [0, 0, 0, "Hero"])[3];
  const card = (k) => { const w = LOC_WHERE[k], on = S.where === k; return '<div class="lc-card' + (on ? " on" : "") + '" data-where="' + k + '"><b>' + w.icon + " " + w.name + "</b>" + (k === "home" ? "<u>" + H.icon + " " + H.name + "</u> for " + hero + "<br>" : "") + w.desc + "</div>"; };
  let html = '<div class="lc-sec">WHERE</div><div class="lc-row lc-where">' + card("home") + card("world") + card("real") + card("nexus") + "</div>";
  html += '<div class="lc-sec">REAL MAP</div><div class="lc-row">' +
    '<div class="lc-card' + (R.mode === "offline" ? " on" : "") + '" data-rmmode="offline"><b>🏛️ INDIANA CITY</b>Indianapolis and 13 more Indiana places, built into the game. Works without internet.</div>' +
    '<div class="lc-card' + (R.mode === "online" ? " on" : "") + '" data-rmmode="online"><b>🌍 ANY CITY IN THE WORLD</b>Search any town or city on Earth. Needs internet: streets stream in as you go and stay cached for next time.</div></div>';
  if (R.mode === "offline") {
    html += '<div class="rm-chips">' + RM_INDIANA.map(c => '<span class="rm-chip' + (R.city === c[0] ? " on" : "") + '" data-rmcity="' + c[0] + '">' + c[0] + "<i>" + rmFmtPop(c[3]) + "</i></span>").join("") + "</div>";
    if (RMUI.packsOk === false) html += '<div class="rm-msg" style="color:#ffd166;max-width:640px;margin:6px auto">⚠ Built-in maps not found: ' + rmEsc(rmOfflineMissingWhy()) + '.<br>Until then, Indiana cities <b>stream online</b> instead (same real map, needs internet).</div>';
  } else {
    html += '<div class="rm-search"><input id="rmQ" placeholder="Town, city or address…" value="' + rmEsc(RMUI.lastQuery || "") + '"><button class="btn" id="rmGo">🔎 SEARCH</button></div>';
    if (RMUI.searchMsg) html += '<div class="rm-msg">' + rmEsc(RMUI.searchMsg) + "</div>";
    if (RMUI.search.length) html += '<div class="rm-chips">' + RMUI.search.map((p, i) => '<span class="rm-chip" data-rmres="' + i + '">' + rmEsc(p.name) + "<i>" + rmEsc(p.region) + "</i></span>").join("") + "</div>";
    const cur = R.place;
    if (R.recent.length) html += '<div class="rm-msg">Recent</div><div class="rm-chips">' + R.recent.map((p, i) => '<span class="rm-chip' + (cur && cur.lat === p.lat && cur.lon === p.lon ? " on" : "") + '" data-rmrecent="' + i + '">' + rmEsc(p.name) + "<i>" + rmEsc(p.region || "") + "</i></span>").join("") + "</div>";
    html += '<div class="rm-msg">Quick picks</div><div class="rm-chips">' + RM_WORLD_PICKS.map((p, i) => '<span class="rm-chip' + (cur && cur.lat === p[1] && cur.lon === p[2] ? " on" : "") + '" data-rmpick="' + i + '">' + p[0] + "<i>" + p[3] + "</i></span>").join("") + "</div>";
  }
  html += '<div class="lc-sec">WHO\'S AFTER YOU</div><div class="lc-row">' + Object.keys(RM_THREATS).map(k => { const T = RM_THREATS[k]; return '<div class="lc-card lc-world' + (R.threat === k ? " on" : "") + '" data-rmthreat="' + k + '" style="flex:1 1 170px;max-width:185px"><b>' + T.icon + " " + T.name + "</b><i style=\"font-size:10.5px;color:#9bb\">" + T.desc + "</i></div>"; }).join("") + "</div>";
  html += '<div class="lc-sec">THE MAP</div><div class="lc-prev"><canvas id="locCv" width="300" height="300"></canvas><div class="lc-info" id="locInfo"></div></div>';
  html += '<div class="rm-foot">' + rmAttr(true, R.mode === "offline") + ' · Real names appear only because they are on the map — <a id="rmDisc">ⓘ disclaimer</a>' + (R.mode === "online" ? ' · <a id="rmClear">🗑 clear downloaded maps</a>' : "") + "</div>";
  body.innerHTML = html;
  body.querySelectorAll("[data-where]").forEach(b => b.onclick = () => { S.where = b.dataset.where; locChanged(); });
  body.querySelectorAll("[data-rmmode]").forEach(b => b.onclick = () => { R.mode = b.dataset.rmmode; locChanged(); });
  body.querySelectorAll("[data-rmcity]").forEach(b => b.onclick = () => { R.city = b.dataset.rmcity; locChanged(); });
  body.querySelectorAll("[data-rmthreat]").forEach(b => b.onclick = () => { R.threat = b.dataset.rmthreat; locChanged(); });
  const pickPlace = (p) => { R.place = { name: p.name, region: p.region || "", lat: +p.lat, lon: +p.lon }; R.recent = [R.place].concat(R.recent.filter(q => !(q.lat === R.place.lat && q.lon === R.place.lon))).slice(0, 6); locChanged(); };
  body.querySelectorAll("[data-rmres]").forEach(b => b.onclick = () => pickPlace(RMUI.search[+b.dataset.rmres]));
  body.querySelectorAll("[data-rmrecent]").forEach(b => b.onclick = () => pickPlace(R.recent[+b.dataset.rmrecent]));
  body.querySelectorAll("[data-rmpick]").forEach(b => b.onclick = () => { const p = RM_WORLD_PICKS[+b.dataset.rmpick]; pickPlace({ name: p[0], region: p[3], lat: p[1], lon: p[2] }); });
  const q = body.querySelector("#rmQ"), go = body.querySelector("#rmGo");
  if (q && go) { const run = () => rmSearch(q.value); go.onclick = run; q.onkeydown = e => { if (e.key === "Enter") run(); }; }
  const dsc = body.querySelector("#rmDisc"); if (dsc) dsc.onclick = () => rmDisclaimer(true);
  const clr = body.querySelector("#rmClear"); if (clr) clr.onclick = async () => { try { if (typeof caches !== "undefined") await caches.delete(RM_SRC.cacheName); } catch (e) { /* none */ } clr.textContent = "cleared ✓"; };
  if (R.mode === "offline" && RMUI.packsOk === null) rmLoadIndex().then(() => { RMUI.packsOk = true; }).catch(() => { RMUI.packsOk = false; if (locState().where === "real") locRender(); });
  setTimeout(locPreview, 20);
}
async function rmSearch(q) {
  q = (q || "").trim(); if (!q) return;
  RMUI.lastQuery = q; RMUI.search = []; RMUI.searchMsg = "Searching OpenStreetMap…"; locRender();
  const tidy = (name, region, lat, lon) => ({ name, region, lat: +(+lat).toFixed(5), lon: +(+lon).toFixed(5) });
  try {
    const r = await fetch("https://nominatim.openstreetmap.org/search?format=jsonv2&limit=8&accept-language=en&q=" + encodeURIComponent(q));
    if (!r.ok) throw new Error("HTTP " + r.status);
    const j = await r.json();
    RMUI.search = j.map(e => { const parts = String(e.display_name || "").split(",").map(s => s.trim()).filter(Boolean); return tidy(e.name || parts[0] || q, parts.slice(1).slice(-3).join(", "), e.lat, e.lon); });
  } catch (e) {
    try {
      const r = await fetch("https://photon.komoot.io/api/?limit=8&lang=en&q=" + encodeURIComponent(q));
      const j = await r.json();
      RMUI.search = (j.features || []).map(f => { const p = f.properties || {}; return tidy(p.name || q, [p.city, p.state, p.country].filter(Boolean).join(", "), f.geometry.coordinates[1], f.geometry.coordinates[0]); });
    } catch (e2) { RMUI.searchMsg = "Search needs an internet connection (" + (e2.message || e.message) + "). Quick picks below still work online."; locRender(); return; }
  }
  RMUI.searchMsg = RMUI.search.length ? "" : "Nothing found for “" + q + "”.";
  locRender();
}
function rmPreview() {
  const cv = document.getElementById("locCv"), info = document.getElementById("locInfo");
  if (!cv || !info) return;
  const P = rmChosenPlace(), R = rmState(), g = cv.getContext("2d");
  rmUsePlace(P);
  g.fillStyle = "#060b14"; g.fillRect(0, 0, 300, 300); g.fillStyle = "#80deea"; g.font = "700 12px 'Segoe UI', sans-serif"; g.textAlign = "center"; g.fillText("Loading " + P.name + "…", 150, 150);
  const T = RM_THREATS[R.threat];
  const head = "<b>🗺️ " + rmEsc(P.name) + "</b>" + (P.region ? " — " + rmEsc(P.region) : "") + "<br><small>48 × 48 km, the city in the middle · Highway 365 (under construction) rings the edge</small>";
  const srcLine = () => P.mode === "offline" ? (RM.viaOnline > 0 ? "🌐 Built-in maps not found here — streaming from OpenFreeMap" : "📦 Offline data shipped with the game") : "🌐 Streams from OpenFreeMap" + (RM.stats.cacheHits ? " · " + RM.stats.cacheHits + " cached tiles reused" : "");
  info.innerHTML = head + "<br><br><small>" + srcLine() + "</small>";
  const key = P.key;
  rmLoadOverview().then(() => {
    if (!document.getElementById("locCv") || rmChosenPlace().key !== key) return;
    regionSetProfile("real"); CITY.ready = false; regionGenerate("real", rmSeedOf(P)); RG.genKey = "real";
    if (typeof cityApplyTheme === "function") try { cityApplyTheme("modern"); } catch (e) { /* menu */ }
    if (typeof MAPV !== "undefined") { MAPV.tiles.clear(); MAPV.lastSig = ""; }
    const draw = () => {
      if (!document.getElementById("locCv")) return;
      mapDraw(g, 0, 0, 300, 300, 32000, 32000, 50000 / 300, 9);
      const St = mapStyle(); g.save(); g.textAlign = "center"; g.lineWidth = 3; g.strokeStyle = St.halo; g.fillStyle = St.txt;
      const towns = CITY.cities.filter(c => c.kind <= 1).slice(0, 14);
      for (const c of towns) { const x = 150 + (c.x - 32000) / 50000 * 300, y = 150 + (c.y - 32000) / 50000 * 300; g.font = (c.idx === 0 ? "900 12px" : "700 9.5px") + " 'Segoe UI', sans-serif"; g.strokeText(c.name, x, y); g.fillText(c.name, x, y); }
      g.restore();
    };
    draw(); setTimeout(draw, 150); setTimeout(draw, 500);
    const O = RM.ovw, n = CITY.cities.length;
    info.innerHTML = head + "<br><br>" + n + " cities, towns & villages on the map" + (O.aero.some(a => a.cls === "runway") ? " · airports" : "") +
      "<br><small>" + srcLine() + "</small>" +
      "<br><br><b>" + T.icon + " " + T.name + "</b><br><small>" + T.desc + "</small>";
  }).catch(e => {
    if (!document.getElementById("locInfo")) return;
    info.innerHTML = head + "<br><br>⚠ Couldn't load the map: " + rmEsc(e.message || String(e)) + (P.mode === "online" ? "<br><small>Any City needs internet. Without it, the run uses a generated map.</small>" : "<br><small>Built-in maps not found (" + rmEsc(rmOfflineMissingWhy()) + ") and no internet to stream them — the run uses a generated map.</small>");
  });
}
// EOF part 4 (realui.js continues)

/* --- the loading screen, the disclaimer, first-run tips ------------------------------------------ */
function rmLoading(on, msg, frac) {
  let el = RMUI.loadEl || document.getElementById("rmLoad");
  if (!on) { if (el) el.style.display = "none"; return; }
  if (!el) {
    el = document.createElement("div"); el.id = "rmLoad";
    el.style.cssText = "position:fixed;inset:0;z-index:99990;background:rgba(4,8,14,0.86);display:flex;align-items:center;justify-content:center;font-family:'Segoe UI',sans-serif";
    el.innerHTML = '<div style="width:min(460px,90vw);text-align:center;color:#cfe"><div id="rmLoadT" style="font-weight:800;font-size:17px;margin-bottom:12px"></div>' +
      '<div style="height:10px;border-radius:6px;background:#0b1622;border:1px solid #00e5ff55;overflow:hidden"><div id="rmLoadF" style="height:100%;width:0;background:linear-gradient(90deg,#00e5ff,#ffd166);transition:width .2s"></div></div>' +
      '<div style="font-size:11px;color:#89a;margin-top:10px">48 km of real streets, buildings and businesses<br><span id="rmLoadA"></span></div>' +
      '<button class="btn" id="rmLoadX" style="margin-top:14px">✖ CANCEL</button></div>';
    document.body.appendChild(el); RMUI.loadEl = el;
    el.querySelector("#rmLoadX").onclick = () => { RMUI.cancel = true; RM.gen++; RM.q.length = 0; rmLoading(false); RMUI.busy = false; RM.place = null; };
  }
  el.style.display = "flex";
  el.querySelector("#rmLoadA").textContent = rmAttr(false);
  el.querySelector("#rmLoadT").textContent = "🗺️ " + msg;
  el.querySelector("#rmLoadF").style.width = Math.round((frac || 0) * 100) + "%";
}
const RM_DISCLAIMER = "<h3 style=\"margin:0 0 10px;color:#ffd166\">BEFORE YOU PLAY</h3>" +
  "<p style=\"margin:0 0 9px\">Omni-Shift is a free, non-commercial fan project — a work of art and parody, made for fun and good old-fashioned time-wasting. It is not sold and makes no money.</p>" +
  "<p style=\"margin:0 0 9px\">Some game modes use real-world map data (© OpenStreetMap contributors). Real places, streets and businesses appear only because they are on the map: none of them is affiliated with, sponsors or endorses this game, and no real person, business or organization is portrayed, targeted or meant to be harmed. Everything that happens in the game is fiction.</p>" +
  "<p style=\"margin:0 0 9px\">Characters and worlds inspired by films, shows, games and books are affectionate parody; all names, trademarks and copyrights belong to their owners, who have nothing to do with this project.</p>" +
  "<p style=\"margin:0 0 9px\"><b>Please never act out anything from this game in real life.</b></p>";
function rmDisclaimer(force) {
  if (!force) { if (typeof meta === "undefined" || meta.disclaimerOk) return; try { if (navigator.webdriver || /[?&]nodisclaimer/.test(location.search)) return; } catch (e) { /* ok */ } }
  if (document.getElementById("rmDiscBox")) return;
  const el = document.createElement("div"); el.id = "rmDiscBox";
  el.style.cssText = "position:fixed;inset:0;z-index:99995;background:rgba(2,6,12,0.88);display:flex;align-items:center;justify-content:center;font-family:'Segoe UI',sans-serif";
  el.innerHTML = '<div style="max-width:560px;width:92vw;max-height:86vh;overflow:auto;background:#0b1622;border:1px solid #ffd16688;border-radius:12px;padding:18px 22px;color:#d8e6ee;font-size:13.5px;line-height:1.5;box-shadow:0 0 40px #000">' + RM_DISCLAIMER +
    '<div style="text-align:center;margin-top:12px"><button class="btn gold" id="rmDiscOk">✔ I UNDERSTAND — LET\'S PLAY</button></div></div>';
  document.body.appendChild(el);
  el.querySelector("#rmDiscOk").onclick = () => { el.remove(); if (typeof meta !== "undefined") { meta.disclaimerOk = 1; if (typeof saveMeta === "function") saveMeta(); } };
}
window.addEventListener("load", () => setTimeout(() => rmDisclaimer(false), 400));
function cityTipsReal(p, th) {
  const T = RM_THREATS[th], P = RM.place;
  if (typeof fxBanner === "function" && P) setTimeout(() => fxBanner(P.name.toUpperCase() + " · REAL MAP", T.icon + " " + T.name + " · Highway 365 rings the map", "#80deea", 3.2, true, "city"), 900);
}
// EOF:js/realui.js
