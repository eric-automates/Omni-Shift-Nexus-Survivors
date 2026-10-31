/* =========================================================================
   OMNI-SHIFT v14 — MINIMAP, CITY MAP, MARKERS & NOTES
   • Minimap (bottom-right): zoom with [ ] / the wheel / the ± buttons
   • M opens the full 64 × 64 km map: drag to pan, wheel to zoom, click to
     drop a marker (6 colours × 8 symbols) with an optional note
   • markers you place show on the minimap edge while far away, on the
     minimap itself once in range, and as a coloured beacon on the main
     screen when you are really close
   • from the main menu the map doubles as the DROP ZONE picker
   Map style follows the universe: paper road map, holo-map or parchment.
   ========================================================================= */
"use strict";

const MAPV = {
  open: false, mode: "run", cx: 0, cy: 0, mpp: 8, drag: null, tiles: new Map(), tileQ: 0, mini: 1, miniSizes: [0.5, 1, 2, 4, 8],
  el: null, cv: null, g: null, editor: null, sel: null, hover: null, wasPaused: false, lastKey: "", built: 0
};
const MAP_COLS = ["#ff5252", "#ffab40", "#ffee58", "#69f0ae", "#40c4ff", "#e040fb"];
const MAP_SYMS = ["●", "★", "☠", "⚑", "⌂", "✚", "◎", "?"];
const MAP_STYLE = {
  earth: { bg: "#e8e4da", land: ["#e3efd8", "#e8ecd8", "#ecebe6", "#e6e4e0", "#dedbd6", "#dcd8d2", "#c8e0b8", "#cfe3f0"], road: "#ffffff", road2: "#fcfbf7", edge: "#c9c4b8", hw: "#ffd54f", hwEdge: "#d4a537", bld: "#d9cfc0", bldEdge: "#bfb3a0", civic: "#e5c9a8", park: "#c6e3b0", water: "#9ecbe8", woods: "#b5d6a0", lot: "#e2e0dc", txt: "#37474f", halo: "rgba(255,255,255,0.85)", grid: "rgba(0,0,0,0.05)" },
  scifi: { bg: "#06121e", land: ["#0b1e2c", "#0b1f2a", "#0d2232", "#0f2638", "#122c42", "#10283a", "#0a2226", "#08243a"], road: "#1e5a7a", road2: "#174a66", edge: "#0a2a3c", hw: "#4fc3ff", hwEdge: "#0a6a9a", bld: "#1a3a52", bldEdge: "#2a6a8a", civic: "#2a5a7a", park: "#0e3a34", water: "#08304a", woods: "#0c3030", lot: "#10283a", txt: "#80deea", halo: "rgba(0,10,20,0.85)", grid: "rgba(79,195,255,0.06)" },
  rustic: { bg: "#e8d8b0", land: ["#e6d6a8", "#e2d2a4", "#ddcc9c", "#d8c696", "#d2bf8e", "#d6c494", "#c8c890", "#c8d4c0"], road: "#b8956a", road2: "#c4a478", edge: "#8a6a44", hw: "#9a6a3a", hwEdge: "#5a3a1e", bld: "#a07a52", bldEdge: "#6a4a2a", civic: "#8a5a3a", park: "#b8c084", water: "#9ab8c0", woods: "#a8b078", lot: "#d0bc90", txt: "#3e2723", halo: "rgba(240,226,190,0.85)", grid: "rgba(90,60,30,0.06)" }
};
function mapStyle() { return MAP_STYLE[typeof crFam === "function" && CITY.theme ? crFam() : "earth"] || MAP_STYLE.earth; }

/* --- map tiles: 256 px each, metres-per-pixel levels -------------------------------- */
const MAP_LEVELS = [0.5, 1, 2, 4, 8, 16, 32, 64, 128];
function mapTileKey(mpp, tx, ty) { return mpp + "|" + tx + "|" + ty + "|" + CITY.themeKey + "|" + CITY.seed; }
function mapTile(mpp, tx, ty, allowBuild) {
  const k = mapTileKey(mpp, tx, ty);
  let t = MAPV.tiles.get(k);
  if (t) { t.used = performance.now(); return t.c; }
  if (!allowBuild) return null;
  const c = document.createElement("canvas"); c.width = 256; c.height = 256;
  const g = c.getContext("2d"), S = mapStyle(), m0x = tx * 256 * mpp, m0y = ty * 256 * mpp, span = 256 * mpp;
  g.fillStyle = S.bg; g.fillRect(0, 0, 256, 256);
  const px = m => (m - m0x) / mpp, py = m => (m - m0y) / mpp;
  // land use per macro cell
  for (let my = Math.max(0, Math.floor(m0y / 1000)); my <= Math.min(63, Math.floor((m0y + span) / 1000)); my++) for (let mx = Math.max(0, Math.floor(m0x / 1000)); mx <= Math.min(63, Math.floor((m0x + span) / 1000)); mx++) {
    g.fillStyle = S.land[cityMacroClass(mx, my)]; g.fillRect(px(mx * 1000), py(my * 1000), 1000 / mpp + 1, 1000 / mpp + 1);
  }
  // surfaces & buildings when zoomed in
  if (mpp <= 4) {
    const blocks = cityBlocksInRect(m0x, m0y, m0x + span, m0y + span);
    for (const B of blocks) {
      for (const s of B.surf) {
        const col = s.t === "water" || s.t === "pool" ? S.water : (s.t === "park" || s.t === "field" || s.t === "yard" || s.t === "grass" || s.t === "clearing") ? S.park : s.t === "woods" ? S.woods : (s.t === "lot" || s.t === "drive" || s.t === "plaza") ? S.lot : null;
        if (!col || (mpp > 2 && (s.t === "yard" || s.t === "drive"))) continue;
        g.fillStyle = col;
        if (s.t === "water") { g.beginPath(); g.ellipse(px((s.x0 + s.x1) / 4), py((s.y0 + s.y1) / 4), (s.x1 - s.x0) / 4 / mpp, (s.y1 - s.y0) / 4 / mpp, 0, 0, 7); g.fill(); }
        else g.fillRect(px(s.x0 / 2), py(s.y0 / 2), (s.x1 - s.x0) / 2 / mpp, (s.y1 - s.y0) / 2 / mpp);
      }
      for (const b of B.blds) {
        const X = px(b.x / 2), Y = py(b.y / 2), Wd = Math.max(1, b.w / 2 / mpp), Hd = Math.max(1, b.h / 2 / mpp);
        g.fillStyle = b.type === "civic" || b.type === "church" ? S.civic : S.bld; g.fillRect(X, Y, Wd, Hd);
        if (mpp <= 1) { g.strokeStyle = S.bldEdge; g.lineWidth = 1; g.strokeRect(X + 0.5, Y + 0.5, Wd - 1, Hd - 1); }
      }
    }
  } else if (mpp <= 16) {   // water bodies from the macro map
    for (let my = Math.max(0, Math.floor(m0y / 1000)); my <= Math.min(63, Math.floor((m0y + span) / 1000)); my++) for (let mx = Math.max(0, Math.floor(m0x / 1000)); mx <= Math.min(63, Math.floor((m0x + span) / 1000)); mx++) {
      if (cityMacroClass(mx, my) === CL_LAKE) { g.fillStyle = S.water; g.beginPath(); g.ellipse(px(mx * 1000 + 500), py(my * 1000 + 500), 320 / mpp, 240 / mpp, 0, 0, 7); g.fill(); }
    }
  }
  // roads
  const maxRank = mpp <= 2 ? 3 : mpp <= 4 ? 2 : mpp <= 8 ? 1 : 0;
  const pass = (edge) => {
    for (let my = Math.max(0, Math.floor(m0y / 1000) - 1); my <= Math.min(63, Math.floor((m0y + span) / 1000)); my++) for (let mx = Math.max(0, Math.floor(m0x / 1000) - 1); mx <= Math.min(63, Math.floor((m0x + span) / 1000)); mx++) {
      const Sc = cityCell(mx, my);
      for (const l of Sc.vx) { if (l.closing || (l.r > maxRank && !l.hw) || (mpp >= 32 && !l.hw)) continue; const w = Math.max(l.hw ? 2.4 : 1, l.w / mpp) + (edge ? 1.6 : 0); g.fillStyle = edge ? (l.hw ? S.hwEdge : S.edge) : (l.hw ? S.hw : (l.r <= 1 ? S.road : S.road2)); g.fillRect(px(l.x) - w / 2, py(my * 1000), w, 1000 / mpp + 1); }
      for (const l of Sc.hy) { if (l.closing || (l.r > maxRank && !l.hw) || (mpp >= 32 && !l.hw)) continue; const w = Math.max(l.hw ? 2.4 : 1, l.w / mpp) + (edge ? 1.6 : 0); g.fillStyle = edge ? (l.hw ? S.hwEdge : S.edge) : (l.hw ? S.hw : (l.r <= 1 ? S.road : S.road2)); g.fillRect(px(mx * 1000), py(l.y) - w / 2, 1000 / mpp + 1, w); }
    }
  };
  if (mpp <= 8) pass(true);
  pass(false);
  if (mpp >= 16) { g.fillStyle = S.grid; for (let k = 0; k <= 256; k += 1000 / mpp) { g.fillRect(k, 0, 1, 256); g.fillRect(0, k, 256, 1); } }
  MAPV.tiles.set(k, { c, used: performance.now() });
  MAPV.built++;
  if (MAPV.tiles.size > 120) { const arr = [...MAPV.tiles.entries()].sort((a, b) => a[1].used - b[1].used); for (let i = 0; i < 24; i++) MAPV.tiles.delete(arr[i][0]); }
  return c;
}
// draw the map (metres) centred at (cxm, cym) into a rect on g, building at most `budget` new tiles this call
function mapDraw(g, x0, y0, w, h, cxm, cym, mpp, budget) {
  let lvl = MAP_LEVELS[0];
  for (const L of MAP_LEVELS) if (L <= mpp * 1.01) lvl = L;
  const tileM = 256 * lvl, leftM = cxm - w / 2 * mpp, topM = cym - h / 2 * mpp;
  const tx0 = Math.floor(leftM / tileM), ty0 = Math.floor(topM / tileM), tx1 = Math.floor((leftM + w * mpp) / tileM), ty1 = Math.floor((topM + h * mpp) / tileM);
  const S = mapStyle(), b0 = MAPV.built;
  g.save(); g.beginPath(); g.rect(x0, y0, w, h); g.clip();
  g.fillStyle = S.bg; g.fillRect(x0, y0, w, h);
  const order = [];
  for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) if (tx >= 0 && ty >= 0 && tx * tileM < 64000 && ty * tileM < 64000) order.push([tx, ty, (tx + 0.5 - cxm / tileM) ** 2 + (ty + 0.5 - cym / tileM) ** 2]);
  order.sort((a, b) => a[2] - b[2]);
  const sz = tileM / mpp;
  for (const [tx, ty] of order) {
    const X = x0 + (tx * tileM - leftM) / mpp, Y = y0 + (ty * tileM - topM) / mpp;
    const c = mapTile(lvl, tx, ty, MAPV.built - b0 < budget);
    if (c) { g.drawImage(c, X, Y, sz + 0.6, sz + 0.6); continue; }
    // not built yet: stretch a coarser tile (always cheap) as a placeholder
    const L2 = MAP_LEVELS[Math.min(MAP_LEVELS.length - 1, MAP_LEVELS.indexOf(lvl) + 3)], tm2 = 256 * L2, t2x = Math.floor(tx * tileM / tm2), t2y = Math.floor(ty * tileM / tm2);
    const c2 = mapTile(L2, t2x, t2y, true);
    if (c2) { const sx = (tx * tileM - t2x * tm2) / L2, sy = (ty * tileM - t2y * tm2) / L2, sw = tileM / L2; g.drawImage(c2, sx, sy, sw, sw, X, Y, sz + 0.6, sz + 0.6); }
  }
  g.restore();
  return { leftM, topM };
}
// EOF part 1

/* --- markers ------------------------------------------------------------------------- */
function mapMarkers() {
  if (typeof meta === "undefined") return [];
  if (!meta.cityMarkers || typeof meta.cityMarkers !== "object") meta.cityMarkers = {};
  const k = String(CITY.seed || 1979);
  if (!Array.isArray(meta.cityMarkers[k])) meta.cityMarkers[k] = [];
  return meta.cityMarkers[k];
}
function mapSave() { if (typeof saveMeta === "function") saveMeta(); }
function mapPlayerM() { return cityWorldM(player.x, player.y); }

/* --- minimap (screen space) ------------------------------------------------------------- */
function miniRect() { const S = Math.round(Math.min(210, Math.max(132, Math.min(W, H) * 0.26))); return { S, x: W - S - 10, y: H - S - 30 }; }
function miniLayout() {
  const r = miniRect(), hud = document.getElementById("cityHud"), ctl = document.getElementById("mmCtl");
  if (hud) hud.style.bottom = (30 + r.S + 30) + "px";
  if (ctl) { ctl.style.bottom = (30 + r.S + 6) + "px"; ctl.style.right = "10px"; ctl.style.display = CITY.on && runActive ? "flex" : "none"; }
}
function minimapRender(g) {
  if (!CITY.on || !player || !runActive || MAPV.open) return;
  const { S, x: x0, y: y0 } = miniRect(), mpp = MAPV.miniSizes[MAPV.mini], [pxm, pym] = mapPlayerM(), St = mapStyle();
  g.save();
  g.fillStyle = "rgba(4,8,14,0.55)"; crRR(g, x0 - 4, y0 - 4, S + 8, S + 8, 12); g.fill();
  crRR(g, x0, y0, S, S, 9); g.clip();
  mapDraw(g, x0, y0, S, S, pxm, pym, mpp, 1);
  const toS = (xm, ym) => [x0 + S / 2 + (xm - pxm) / mpp, y0 + S / 2 + (ym - pym) / mpp];
  // enemies you can see (red), or track (vision blips)
  const vp = typeof visionProfile === "function" ? visionProfile(player.cid) : ["none"], trackR = vp[2] * 32;
  for (let j = 0; j < MAX_E; j++) {
    if (!eAct[j] || eDummy[j]) continue;
    const vis = cityVisibleAt(eX[j], eY[j]), d = Math.hypot(eX[j] - player.x, eY[j] - player.y);
    const sensed = !vis && d < trackR && (vp[0] === "tracker" ? Math.hypot(eVX[j], eVY[j]) > 8 : (vp[0] === "pulse" ? VIS.reveal[j] > 0 : (vp[0] === "hive" || vp[0] === "xray")));
    if (!vis && !sensed) continue;
    const [sx, sy] = toS((eX[j] + CITY.orx) / 32, (eY[j] + CITY.ory) / 32);
    const ally = allyCount > 0 && allyIs(j);
    g.fillStyle = ally ? "#69f0ae" : (vis ? (typeof ST !== "undefined" && ST.state[j] === 4 ? "#ff1744" : "#ff8a65") : vp[1]);
    g.beginPath(); g.arc(sx, sy, eType[j] >= 3 ? 3.2 : 2.3, 0, 7); g.fill();
  }
  g.restore();
  // markers: inside -> symbol, outside -> clamped to the edge with an arrow
  g.save();
  for (const m of mapMarkers()) {
    let [sx, sy] = toS(m.x, m.y);
    const inside = sx > x0 + 7 && sx < x0 + S - 7 && sy > y0 + 7 && sy < y0 + S - 7, col = MAP_COLS[m.c] || "#ff5252";
    if (!inside) {
      const a = Math.atan2(sy - (y0 + S / 2), sx - (x0 + S / 2)), hw = S / 2 - 7, t = Math.min(hw / Math.abs(Math.cos(a) || 1e-6), hw / Math.abs(Math.sin(a) || 1e-6));
      sx = x0 + S / 2 + Math.cos(a) * t; sy = y0 + S / 2 + Math.sin(a) * t;
      g.save(); g.translate(sx, sy); g.rotate(a); g.fillStyle = col; g.beginPath(); g.moveTo(7, 0); g.lineTo(-3, -5); g.lineTo(-3, 5); g.closePath(); g.fill(); g.restore();
    } else mapDrawSymbol(g, sx, sy, m, 0.85);
  }
  // you
  const a = typeof player.aim === "number" ? player.aim : 0, cx = x0 + S / 2, cy = y0 + S / 2;
  g.translate(cx, cy); g.rotate(a); g.fillStyle = "#ffffff"; g.strokeStyle = "#0d47a1"; g.lineWidth = 1.5;
  g.beginPath(); g.moveTo(7, 0); g.lineTo(-5, -4.5); g.lineTo(-2.5, 0); g.lineTo(-5, 4.5); g.closePath(); g.fill(); g.stroke();
  g.restore();
  g.save(); g.font = "800 10px 'Segoe UI', sans-serif"; g.textAlign = "center"; g.fillStyle = St.txt; g.strokeStyle = St.halo; g.lineWidth = 3;
  g.strokeText("N", x0 + S / 2, y0 + 12); g.fillText("N", x0 + S / 2, y0 + 12);
  const sc = mpp * 40 >= 1000 ? (mpp * 40 / 1000).toFixed(1) + " km" : Math.round(mpp * 40) + " m";
  g.textAlign = "left"; g.font = "700 9px 'Segoe UI', sans-serif"; g.fillRect(x0 + 8, y0 + S - 9, 40, 2); g.strokeText(sc, x0 + 8, y0 + S - 12); g.fillText(sc, x0 + 8, y0 + S - 12);
  g.restore();
  g.strokeStyle = "rgba(128,222,234,0.55)"; g.lineWidth = 1.5; crRR(g, x0, y0, S, S, 9); g.stroke();
}
function mapDrawSymbol(g, x, y, m, k) {
  const col = MAP_COLS[m.c] || "#ff5252";
  g.save(); g.translate(x, y); g.scale(k, k);
  g.fillStyle = "rgba(0,0,0,0.45)"; g.beginPath(); g.arc(1, 2, 9, 0, 7); g.fill();
  g.fillStyle = col; g.beginPath(); g.arc(0, 0, 9, 0, 7); g.fill();
  g.strokeStyle = "#ffffff"; g.lineWidth = 1.6; g.stroke();
  g.fillStyle = "#101418"; g.font = "900 11px 'Segoe UI Symbol', 'Segoe UI', sans-serif"; g.textAlign = "center"; g.textBaseline = "middle";
  g.fillText(MAP_SYMS[m.s] || "●", 0, 0.5);
  if (m.n) { g.fillStyle = "#fff"; g.beginPath(); g.arc(7, -7, 3.2, 0, 7); g.fill(); g.fillStyle = "#101418"; g.font = "900 6px sans-serif"; g.fillText("✎", 7, -6.6); }
  g.restore();
}

/* --- beacons: markers you are close to, on the main screen ----------------------------- */
const MAP_BEACON_M = 160;
function mapBeaconsWorld(g) {
  if (!CITY.on || !player) return;
  const [pxm, pym] = mapPlayerM(), z = opts.zoom || 1;
  for (const m of mapMarkers()) {
    const dm = Math.hypot(m.x - pxm, m.y - pym);
    if (dm > MAP_BEACON_M) continue;
    const x = m.x * 32 - CITY.orx, y = m.y * 32 - CITY.ory, col = MAP_COLS[m.c] || "#ff5252", a = Math.min(1, (MAP_BEACON_M - dm) / 30), pulse = 0.5 + 0.5 * Math.sin(runTime * 3);
    g.save(); g.globalAlpha = a;
    const gr = g.createLinearGradient(x, y - 140 / z, x, y); gr.addColorStop(0, crA(col, 0)); gr.addColorStop(1, crA(col, 0.55));
    g.fillStyle = gr; g.fillRect(x - 3 / z, y - 140 / z, 6 / z, 140 / z);
    g.strokeStyle = col; g.lineWidth = 2 / z; g.beginPath(); g.arc(x, y, (10 + pulse * 6) / z, 0, 7); g.stroke();
    mapDrawSymbol(g, x, y - 150 / z, m, 1.2 / z);
    g.font = "800 " + (11 / z) + "px 'Segoe UI', sans-serif"; g.textAlign = "center"; g.fillStyle = "#fff"; g.strokeStyle = "rgba(0,0,0,0.8)"; g.lineWidth = 3 / z;
    const lab = Math.round(dm) + " m" + (m.n ? " · " + m.n.slice(0, 26) : "");
    g.strokeText(lab, x, y - 168 / z); g.fillText(lab, x, y - 168 / z);
    g.restore();
  }
}
function mapBeaconsScreen(g) {
  if (!CITY.on || !player || !runActive || MAPV.open) return;
  const [pxm, pym] = mapPlayerM(), z = opts.zoom || 1;
  for (const m of mapMarkers()) {
    const dm = Math.hypot(m.x - pxm, m.y - pym);
    if (dm > MAP_BEACON_M * 2.5) continue;
    const sx = (m.x * 32 - CITY.orx - player.x) * z + W / 2, sy = (m.y * 32 - CITY.ory - player.y) * z + H / 2;
    if (sx > 30 && sy > 60 && sx < W - 30 && sy < H - 30) continue;
    const a = Math.atan2(sy - H / 2, sx - W / 2), mx = W / 2 - 34, my = H / 2 - 50, t = Math.min(mx / Math.abs(Math.cos(a) || 1e-6), my / Math.abs(Math.sin(a) || 1e-6));
    const ex = W / 2 + Math.cos(a) * t, ey = H / 2 + Math.sin(a) * t, col = MAP_COLS[m.c] || "#ff5252";
    g.save(); g.translate(ex, ey);
    g.save(); g.rotate(a); g.fillStyle = col; g.beginPath(); g.moveTo(16, 0); g.lineTo(6, -6); g.lineTo(6, 6); g.closePath(); g.fill(); g.restore();
    mapDrawSymbol(g, 0, 0, m, 0.95);
    g.font = "800 10px 'Segoe UI', sans-serif"; g.textAlign = "center"; g.fillStyle = "#fff"; g.strokeStyle = "rgba(0,0,0,0.8)"; g.lineWidth = 3;
    g.strokeText(Math.round(dm) + " m", 0, 20); g.fillText(Math.round(dm) + " m", 0, 20);
    g.restore();
  }
}
// EOF part 2

/* --- the full map --------------------------------------------------------------------- */
function mapEnsureDom() {
  if (MAPV.el) return;
  const el = document.createElement("div"); el.id = "mapOv";
  el.innerHTML = '<canvas id="mapCv"></canvas>' +
    '<div class="map-top"><b id="mapTitle">NEXUS REGION</b><span id="mapHint"></span></div>' +
    '<div class="map-btns"><button class="btn" id="mapZo" title="Zoom out (−)">−</button><button class="btn" id="mapZi" title="Zoom in (+)">+</button>' +
    '<button class="btn" id="mapMe" title="Centre on you">◎</button><button class="btn" id="mapNotes" title="Markers & notes">📝</button>' +
    '<button class="btn gold" id="mapRand" style="display:none">🎲 RANDOM DROP</button><button class="btn" id="mapNew" style="display:none" title="Generate a brand-new 64 × 64 km region (markers are kept per region)">🌍 NEW REGION</button><button class="btn warn" id="mapClose" title="Close (M / Esc)">✕</button></div>' +
    '<div class="map-info" id="mapInfo"></div><div class="map-side" id="mapSide"></div>' +
    '<div class="map-ed" id="mapEd"><b id="mapEdT">NEW MARKER</b><div class="map-row" id="mapEdC"></div><div class="map-row" id="mapEdS"></div>' +
    '<textarea id="mapEdN" maxlength="140" placeholder="Note (optional) — e.g. sniper on the roof, cache inside"></textarea>' +
    '<div class="map-row"><button class="btn gold" id="mapEdOk">SAVE</button><button class="btn warn" id="mapEdDel">DELETE</button><button class="btn" id="mapEdX">CANCEL</button></div></div>';
  document.body.appendChild(el);
  MAPV.el = el; MAPV.cv = el.querySelector("#mapCv"); MAPV.g = MAPV.cv.getContext("2d"); MAPV.editor = el.querySelector("#mapEd");
  const C = el.querySelector("#mapEdC"), S = el.querySelector("#mapEdS");
  MAP_COLS.forEach((c, i) => { const b = document.createElement("button"); b.className = "map-sw"; b.style.background = c; b.dataset.c = i; b.onclick = () => { MAPV.sel.c = i; mapEdSync(); }; C.appendChild(b); });
  MAP_SYMS.forEach((s, i) => { const b = document.createElement("button"); b.className = "map-sym"; b.textContent = s; b.dataset.s = i; b.onclick = () => { MAPV.sel.s = i; mapEdSync(); }; S.appendChild(b); });
  el.querySelector("#mapEdOk").onclick = () => { const m = MAPV.sel; m.n = el.querySelector("#mapEdN").value.trim(); const L = mapMarkers(); if (!L.includes(m.ref || m)) { const o = { x: m.x, y: m.y, c: m.c, s: m.s, n: m.n }; L.push(o); } else Object.assign(m.ref || m, { c: m.c, s: m.s, n: m.n }); mapSave(); mapEdClose(); mapSideSync(); };
  el.querySelector("#mapEdDel").onclick = () => { const L = mapMarkers(), i = L.indexOf(MAPV.sel.ref); if (i >= 0) L.splice(i, 1); mapSave(); mapEdClose(); mapSideSync(); };
  el.querySelector("#mapEdX").onclick = mapEdClose;
  el.querySelector("#mapZo").onclick = () => mapZoom(1.6, MAPV.cv.width / 2, MAPV.cv.height / 2);
  el.querySelector("#mapZi").onclick = () => mapZoom(1 / 1.6, MAPV.cv.width / 2, MAPV.cv.height / 2);
  el.querySelector("#mapMe").onclick = () => { const p = mapHomePoint(); MAPV.cx = p[0]; MAPV.cy = p[1]; };
  el.querySelector("#mapNotes").onclick = () => { const s = el.querySelector("#mapSide"); s.classList.toggle("on"); mapSideSync(); };
  el.querySelector("#mapRand").onclick = () => { if (typeof meta !== "undefined") { delete meta.cityDrop; mapSave(); } mapClose(); };
  el.querySelector("#mapClose").onclick = mapClose;
  el.querySelector("#mapNew").onclick = () => {
    if (typeof meta === "undefined") return;
    meta.citySeed = 1000 + Math.floor(Math.random() * 2e9); delete meta.cityDrop; mapSave();
    cityGenInit(meta.citySeed); cityApplyTheme(cityThemeKeyForHero(meta.selChar)); MAPV.tiles.clear(); MAPV.lastSig = "";
    const c = CITY.cities[CITY.capital]; MAPV.cx = c.x; MAPV.cy = c.y; MAPV.mpp = 40; mapSideSync();
  };
  const cv = MAPV.cv;
  const down = (x, y) => { MAPV.drag = { x, y, cx: MAPV.cx, cy: MAPV.cy, moved: false }; };
  const move = (x, y) => {
    const D = MAPV.drag;
    if (D) { const dx = x - D.x, dy = y - D.y; if (Math.abs(dx) + Math.abs(dy) > 5) D.moved = true; if (D.moved) { MAPV.cx = D.cx - dx * MAPV.mpp; MAPV.cy = D.cy - dy * MAPV.mpp; } }
    MAPV.hover = [x, y];
  };
  const up = (x, y) => { const D = MAPV.drag; MAPV.drag = null; if (D && !D.moved) mapClick(x, y); };
  cv.addEventListener("mousedown", e => down(e.offsetX, e.offsetY));
  cv.addEventListener("mousemove", e => move(e.offsetX, e.offsetY));
  window.addEventListener("mouseup", e => { if (MAPV.open && MAPV.drag) { const r = cv.getBoundingClientRect(); up(e.clientX - r.left, e.clientY - r.top); } });
  cv.addEventListener("wheel", e => { e.preventDefault(); mapZoom(e.deltaY > 0 ? 1.25 : 0.8, e.offsetX, e.offsetY); }, { passive: false });
  let pinch = 0;
  cv.addEventListener("touchstart", e => { e.preventDefault(); const r = cv.getBoundingClientRect(); if (e.touches.length === 2) { pinch = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY); MAPV.drag = null; } else down(e.touches[0].clientX - r.left, e.touches[0].clientY - r.top); }, { passive: false });
  cv.addEventListener("touchmove", e => { e.preventDefault(); const r = cv.getBoundingClientRect(); if (e.touches.length === 2 && pinch) { const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY); mapZoom(pinch / d, cv.width / 2, cv.height / 2); pinch = d; } else if (e.touches.length === 1) move(e.touches[0].clientX - r.left, e.touches[0].clientY - r.top); }, { passive: false });
  cv.addEventListener("touchend", e => { const r = cv.getBoundingClientRect(); if (!e.touches.length && MAPV.drag) { const t = e.changedTouches[0]; up(t.clientX - r.left, t.clientY - r.top); } pinch = 0; });
}
function mapHomePoint() {
  if (MAPV.mode === "run" && player && CITY.on) return mapPlayerM();
  if (typeof meta !== "undefined" && Array.isArray(meta.cityDrop)) return [meta.cityDrop[0] / 2, meta.cityDrop[1] / 2];
  const c = CITY.cities[CITY.capital]; return [c.x, c.y];
}
function mapZoom(f, sx, sy) {
  const cv = MAPV.cv, mx = MAPV.cx + (sx - cv.width / 2) * MAPV.mpp, my = MAPV.cy + (sy - cv.height / 2) * MAPV.mpp;
  MAPV.mpp = Math.max(0.5, Math.min(110, MAPV.mpp * f));
  MAPV.cx = mx - (sx - cv.width / 2) * MAPV.mpp; MAPV.cy = my - (sy - cv.height / 2) * MAPV.mpp;
}
function mapScreenToM(sx, sy) { const cv = MAPV.cv; return [MAPV.cx + (sx - cv.width / 2) * MAPV.mpp, MAPV.cy + (sy - cv.height / 2) * MAPV.mpp]; }
function mapClick(sx, sy) {
  const [xm, ym] = mapScreenToM(sx, sy);
  if (MAPV.mode === "drop") {
    if (typeof meta !== "undefined") { meta.cityDrop = [Math.round(xm * 2), Math.round(ym * 2)]; mapSave(); }
    MAPV.dropFlash = performance.now();
    return;
  }
  // existing marker under the cursor?
  const cv = MAPV.cv;
  for (const m of mapMarkers()) { const px = cv.width / 2 + (m.x - MAPV.cx) / MAPV.mpp, py = cv.height / 2 + (m.y - MAPV.cy) / MAPV.mpp; if (Math.hypot(px - sx, py - sy) < 14) { mapEdOpen({ x: m.x, y: m.y, c: m.c, s: m.s, n: m.n || "", ref: m }, sx, sy); return; } }
  mapEdOpen({ x: xm, y: ym, c: MAPV.lastC || 0, s: MAPV.lastS || 0, n: "" }, sx, sy);
}
function mapEdOpen(m, sx, sy) {
  MAPV.sel = m; const E = MAPV.editor;
  E.style.display = "flex";
  E.style.left = Math.min(window.innerWidth - 270, Math.max(8, sx + 14)) + "px"; E.style.top = Math.min(window.innerHeight - 230, Math.max(60, sy - 20)) + "px";
  E.querySelector("#mapEdT").textContent = m.ref ? "EDIT MARKER" : "NEW MARKER";
  E.querySelector("#mapEdDel").style.display = m.ref ? "" : "none";
  E.querySelector("#mapEdN").value = m.n || "";
  mapEdSync();
  setTimeout(() => E.querySelector("#mapEdN").focus(), 30);
}
function mapEdSync() { const E = MAPV.editor, m = MAPV.sel; E.querySelectorAll(".map-sw").forEach(b => b.classList.toggle("on", +b.dataset.c === m.c)); E.querySelectorAll(".map-sym").forEach(b => { b.classList.toggle("on", +b.dataset.s === m.s); b.style.color = +b.dataset.s === m.s ? MAP_COLS[m.c] : ""; }); MAPV.lastC = m.c; MAPV.lastS = m.s; }
function mapEdClose() { if (MAPV.editor) MAPV.editor.style.display = "none"; MAPV.sel = null; }
function mapSideSync() {
  const s = document.getElementById("mapSide");
  if (!s || !s.classList.contains("on")) return;
  const L = mapMarkers(), here = mapHomePoint();
  s.innerHTML = '<b>MARKERS & NOTES (' + L.length + ')</b>' + (L.length ? "" : '<p>Click anywhere on the map to drop a marker.</p>') +
    L.map((m, i) => '<div class="map-li" data-i="' + i + '"><span style="color:' + MAP_COLS[m.c] + '">' + MAP_SYMS[m.s] + '</span> ' + (m.n ? m.n.replace(/[<>&]/g, "") : "<i>no note</i>") + '<em>' + (Math.hypot(m.x - here[0], m.y - here[1]) / 1000).toFixed(1) + ' km</em></div>').join("");
  s.querySelectorAll(".map-li").forEach(d => { d.onclick = () => { const m = L[+d.dataset.i]; MAPV.cx = m.x; MAPV.cy = m.y; MAPV.mpp = Math.min(MAPV.mpp, 2); }; });
}
function mapOpen(mode) {
  mapEnsureDom();
  MAPV.mode = mode || (runActive ? "run" : "drop");
  if (MAPV.mode === "drop") {
    const seed = (typeof meta !== "undefined" && meta.citySeed >>> 0) || 1979;
    if (!CITY.ready || CITY.seed !== seed) cityGenInit(seed);
    cityApplyTheme(cityThemeKeyForHero(typeof meta !== "undefined" ? meta.selChar : 0));
  }
  MAPV.open = true; MAPV.el.style.display = "block";
  const p = mapHomePoint(); MAPV.cx = p[0]; MAPV.cy = p[1]; MAPV.mpp = MAPV.mode === "drop" ? 16 : 4;
  MAPV.wasPaused = runPaused; if (runActive) runPaused = true;
  document.getElementById("mapRand").style.display = MAPV.mode === "drop" ? "" : "none";
  document.getElementById("mapNew").style.display = MAPV.mode === "drop" ? "" : "none";
  document.getElementById("mapTitle").textContent = MAPV.mode === "drop" ? "CHOOSE YOUR DROP ZONE" : (cityShortNameSafe() + " · " + (CITY.theme ? CITY.theme.name : ""));
  document.getElementById("mapHint").textContent = MAPV.mode === "drop" ? "Click anywhere to land there next deploy · drag to pan · wheel to zoom" : "Click to drop a marker · drag to pan · wheel to zoom · M / Esc to close";
  mapResize(); mapEdClose(); mapSideSync();
  requestAnimationFrame(mapFrame);
}
function cityShortNameSafe() { try { return typeof cityShortName === "function" && player ? cityShortName().toUpperCase() : "NEXUS REGION"; } catch (e) { return "NEXUS REGION"; } }
function mapClose() {
  if (!MAPV.open) return;
  MAPV.open = false; mapEdClose(); if (MAPV.el) MAPV.el.style.display = "none";
  if (runActive) runPaused = MAPV.wasPaused;
  const b = document.getElementById("goDrop"); if (b) b.textContent = mapDropLabel();
}
function mapResize() { if (!MAPV.cv) return; MAPV.cv.width = window.innerWidth; MAPV.cv.height = window.innerHeight; }
function mapFrame() {
  if (!MAPV.open) return;
  const g = MAPV.g, cv = MAPV.cv, w = cv.width, h = cv.height, mpp = MAPV.mpp, St = mapStyle();
  const sig = [MAPV.cx.toFixed(1), MAPV.cy.toFixed(1), mpp.toFixed(3), w, h, MAPV.hover ? MAPV.hover.join(",") : "", mapMarkers().length, JSON.stringify(mapMarkers().map(m => [m.c, m.s, m.n])), typeof meta !== "undefined" ? String(meta.cityDrop) : "", MAPV.dropFlash || 0].join("|");
  const flashing = MAPV.dropFlash && performance.now() - MAPV.dropFlash < 700;
  if (sig === MAPV.lastSig && !MAPV.pending && !flashing) { requestAnimationFrame(mapFrame); return; }
  MAPV.lastSig = sig;
  const b0 = MAPV.built;
  mapDraw(g, 0, 0, w, h, MAPV.cx, MAPV.cy, mpp, 4);
  MAPV.pending = MAPV.built > b0;   // keep drawing while tiles are still being built
  const toS = (xm, ym) => [w / 2 + (xm - MAPV.cx) / mpp, h / 2 + (ym - MAPV.cy) / mpp];
  g.save(); g.textAlign = "center"; g.textBaseline = "middle"; g.lineJoin = "round";
  // street names when close, interstate shields, city names
  if (mpp <= 1.6) {
    g.font = "600 11px 'Segoe UI', sans-serif"; g.fillStyle = St.txt; g.strokeStyle = St.halo; g.lineWidth = 3;
    const [l0, t0] = [MAPV.cx - w / 2 * mpp, MAPV.cy - h / 2 * mpp], seen = new Set();
    // vertical streets: named in the row under the view centre; horizontal ones in the centre column
    const cmy = Math.max(0, Math.min(63, Math.floor(MAPV.cy / 1000))), cmx = Math.max(0, Math.min(63, Math.floor(MAPV.cx / 1000)));
    for (let mx = Math.max(0, Math.floor(l0 / 1000)); mx <= Math.min(63, Math.floor((l0 + w * mpp) / 1000)); mx++) {
      const S = cityCell(mx, cmy);
      for (const l of S.vx) { if (l.closing || seen.has("x" + Math.round(l.x))) continue; seen.add("x" + Math.round(l.x)); const [sx] = toS(l.x, 0); if (sx < 0 || sx > w) continue; const [, sy] = toS(0, MAPV.cy); g.save(); g.translate(sx, sy - 60); g.rotate(-Math.PI / 2); const nm = cityStreetName(0, l, mx, cmy); g.strokeText(nm, 0, 0); g.fillText(nm, 0, 0); g.restore(); }
    }
    for (let my = Math.max(0, Math.floor(t0 / 1000)); my <= Math.min(63, Math.floor((t0 + h * mpp) / 1000)); my++) {
      const S = cityCell(cmx, my);
      for (const l of S.hy) { if (l.closing || seen.has("y" + Math.round(l.y))) continue; seen.add("y" + Math.round(l.y)); const [, sy] = toS(0, l.y); if (sy < 0 || sy > h) continue; const [sx] = toS(MAPV.cx, 0); const nm = cityStreetName(1, l, cmx, my); g.strokeText(nm, sx + 90, sy); g.fillText(nm, sx + 90, sy); }
    }
  }
  if (mpp >= 3) {
    g.font = "800 10px 'Segoe UI', sans-serif";
    CITY.hwX.forEach((v, i) => { for (let y = 2000; y < 64000; y += Math.max(4000, mpp * 600)) { const [sx, sy] = toS(v * 1000, y); if (sx < -20 || sx > w + 20 || sy < -20 || sy > h + 20) continue; mapShield(g, sx, sy, CITY.hwNameX[i]); } });
    CITY.hwY.forEach((v, i) => { for (let x = 2000; x < 64000; x += Math.max(4000, mpp * 600)) { const [sx, sy] = toS(x, v * 1000); if (sx < -20 || sx > w + 20 || sy < -20 || sy > h + 20) continue; mapShield(g, sx, sy, CITY.hwNameY[i]); } });
  }
  for (const c of CITY.cities) {
    if (c.kind === 2 && mpp > 24) continue;
    if (c.kind === 1 && mpp > 60) continue;
    const [sx, sy] = toS(c.x, c.y); if (sx < -100 || sx > w + 100 || sy < -40 || sy > h + 40) continue;
    const fs = c.idx === 0 ? 20 : c.kind === 0 ? 16 : c.kind === 1 ? 13 : 11;
    g.font = (c.kind === 2 ? "700 " : "900 ") + fs + "px 'Segoe UI', sans-serif"; g.fillStyle = St.txt; g.strokeStyle = St.halo; g.lineWidth = 4;
    const nm = (typeof cityName === "function" ? cityName(c) : c.name); const lab = c.kind === 2 ? nm : nm.toUpperCase();
    g.strokeText(lab, sx, sy); g.fillText(lab, sx, sy);
  }
  // markers
  for (const m of mapMarkers()) { const [sx, sy] = toS(m.x, m.y); if (sx < -20 || sx > w + 20 || sy < -20 || sy > h + 20) continue; mapDrawSymbol(g, sx, sy, m, 1.15); if (m.n && mpp < 12) { g.font = "700 11px 'Segoe UI', sans-serif"; g.fillStyle = St.txt; g.strokeStyle = St.halo; g.lineWidth = 3; g.strokeText(m.n.slice(0, 40), sx, sy + 20); g.fillText(m.n.slice(0, 40), sx, sy + 20); } }
  // drop zone / you
  if (typeof meta !== "undefined" && Array.isArray(meta.cityDrop) && (MAPV.mode === "drop" || !runActive)) {
    const [sx, sy] = toS(meta.cityDrop[0] / 2, meta.cityDrop[1] / 2), k = MAPV.dropFlash ? Math.max(0, 1 - (performance.now() - MAPV.dropFlash) / 600) : 0;
    g.strokeStyle = "#ffd166"; g.lineWidth = 2.5; g.beginPath(); g.arc(sx, sy, 12 + k * 20, 0, 7); g.stroke(); g.beginPath(); g.moveTo(sx - 18, sy); g.lineTo(sx + 18, sy); g.moveTo(sx, sy - 18); g.lineTo(sx, sy + 18); g.stroke();
    g.font = "900 12px 'Segoe UI', sans-serif"; g.fillStyle = "#ffd166"; g.strokeStyle = "rgba(0,0,0,0.75)"; g.lineWidth = 3; g.strokeText("DROP ZONE", sx, sy - 26); g.fillText("DROP ZONE", sx, sy - 26);
  }
  if (MAPV.mode === "run" && player && CITY.on) {
    const [pxm, pym] = mapPlayerM(), [sx, sy] = toS(pxm, pym);
    g.save(); g.translate(sx, sy); g.rotate(player.aim || 0); g.fillStyle = "#fff"; g.strokeStyle = "#0d47a1"; g.lineWidth = 2; g.beginPath(); g.moveTo(11, 0); g.lineTo(-7, -7); g.lineTo(-3, 0); g.lineTo(-7, 7); g.closePath(); g.fill(); g.stroke(); g.restore();
    g.font = "900 11px 'Segoe UI', sans-serif"; g.fillStyle = "#fff"; g.strokeStyle = "#0d47a1"; g.lineWidth = 3; g.strokeText("YOU", sx, sy - 16); g.fillText("YOU", sx, sy - 16);
  }
  // scale bar
  const nice = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000], target = mpp * 120; let sbm = nice[0]; for (const v of nice) if (v <= target) sbm = v;
  g.fillStyle = St.halo; g.fillRect(16, h - 34, sbm / mpp + 12, 22); g.fillStyle = St.txt; g.fillRect(22, h - 18, sbm / mpp, 3);
  g.font = "700 11px 'Segoe UI', sans-serif"; g.textAlign = "left"; g.fillText(sbm >= 1000 ? sbm / 1000 + " km" : sbm + " m", 22, h - 26);
  g.restore();
  // cursor readout
  const info = document.getElementById("mapInfo");
  if (info && MAPV.hover) {
    const [xm, ym] = mapScreenToM(MAPV.hover[0], MAPV.hover[1]);
    const mx = Math.floor(xm / 1000), my = Math.floor(ym / 1000);
    if (mx >= 0 && my >= 0 && mx < 64 && my < 64) { const ci = cityMacroCityIdx(mx, my); info.textContent = (xm / 1000).toFixed(2) + " km E · " + (ym / 1000).toFixed(2) + " km S · " + (ci >= 0 ? cityName(CITY.cities[ci]) + " · " : "") + CL_NAMES[cityMacroClass(mx, my)]; }
  }
  requestAnimationFrame(mapFrame);
}
function mapShield(g, x, y, name) {
  g.save(); g.fillStyle = "#1a3a8a"; g.strokeStyle = "#ffffff"; g.lineWidth = 1.5;
  g.beginPath(); g.moveTo(x - 13, y - 9); g.lineTo(x + 13, y - 9); g.lineTo(x + 13, y + 3); g.quadraticCurveTo(x, y + 13, x - 13, y + 3); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = "#c62828"; g.fillRect(x - 13, y - 9, 26, 4); g.fillStyle = "#fff"; g.font = "800 9px 'Segoe UI', sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(name.replace("I-", ""), x, y + 1);
  g.restore();
}

/* --- menu, keys, hooks -------------------------------------------------------------------- */
function mapDropLabel() { const city = typeof meta === "undefined" || meta.world !== "classic"; return "🗺️ CITY MAP · DROP ZONE: " + (!city ? "(ARENA MODE)" : (Array.isArray(meta.cityDrop) ? "CHOSEN" : "RANDOM")); }
function mapWorldLabel() { return "🌆 WORLD: " + (typeof meta !== "undefined" && meta.world === "classic" ? "CLASSIC ARENA" : "NEXUS CITY (64 × 64 KM)"); }
(function mapMenuInit() {
  const go = document.getElementById("goPlay");
  if (!go) return;
  const w = document.createElement("button"); w.className = "btn"; w.id = "goWorld"; w.textContent = mapWorldLabel();
  w.onclick = () => { meta.world = meta.world === "classic" ? "city" : "classic"; mapSave(); w.textContent = mapWorldLabel(); d.textContent = mapDropLabel(); };
  const d = document.createElement("button"); d.className = "btn"; d.id = "goDrop"; d.textContent = mapDropLabel();
  d.onclick = () => mapOpen("drop");
  go.insertAdjacentElement("afterend", d); go.insertAdjacentElement("afterend", w);
  const ctl = document.createElement("div"); ctl.id = "mmCtl";
  ctl.innerHTML = '<button class="btn" id="mmOut" title="Minimap zoom out ( [ )">−</button><button class="btn" id="mmIn" title="Minimap zoom in ( ] )">+</button><button class="btn" id="mmMap" title="City map (M)">🗺</button><button class="btn" id="mmSneak" title="Sneak (hold Shift)">🥷</button><button class="btn" id="mmSup" title="Suppressor (V)">🔇</button>';
  document.body.appendChild(ctl);
  ctl.querySelector("#mmOut").onclick = () => { MAPV.mini = Math.min(MAPV.miniSizes.length - 1, MAPV.mini + 1); };
  ctl.querySelector("#mmIn").onclick = () => { MAPV.mini = Math.max(0, MAPV.mini - 1); };
  ctl.querySelector("#mmMap").onclick = () => mapOpen("run");
  ctl.querySelector("#mmSneak").onclick = () => { if (typeof ST !== "undefined") { ST.touchSneak = !ST.touchSneak; ctl.querySelector("#mmSneak").classList.toggle("gold", ST.touchSneak); } };
  ctl.querySelector("#mmSup").onclick = () => { if (typeof stealthToggleSuppressor === "function") stealthToggleSuppressor(); };
})();
window.addEventListener("keydown", e => {
  if (MAPV.open) {
    if (e.target && e.target.tagName === "TEXTAREA") { if (e.code === "Escape") mapEdClose(); return; }
    if (e.code === "KeyM" || e.code === "Escape") { e.preventDefault(); if (MAPV.sel) mapEdClose(); else mapClose(); }
    else if (e.code === "Equal" || e.code === "NumpadAdd") mapZoom(0.7, MAPV.cv.width / 2, MAPV.cv.height / 2);
    else if (e.code === "Minus" || e.code === "NumpadSubtract") mapZoom(1.4, MAPV.cv.width / 2, MAPV.cv.height / 2);
    return;
  }
  if (!runActive || !CITY.on || e.repeat) return;
  if (e.code === "KeyM") { e.preventDefault(); mapOpen("run"); }
  else if (e.code === "BracketLeft") MAPV.mini = Math.min(MAPV.miniSizes.length - 1, MAPV.mini + 1);
  else if (e.code === "BracketRight") MAPV.mini = Math.max(0, MAPV.mini - 1);
});
window.addEventListener("resize", () => { if (MAPV.open) mapResize(); });
window.addEventListener("wheel", e => {
  if (!runActive || !CITY.on || MAPV.open) return;
  const r = miniRect(); if (e.clientX >= r.x && e.clientX <= r.x + r.S && e.clientY >= r.y && e.clientY <= r.y + r.S) { MAPV.mini = Math.max(0, Math.min(MAPV.miniSizes.length - 1, MAPV.mini + (e.deltaY > 0 ? 1 : -1))); }
}, { passive: true });
V10.onRenderWorld.push((g) => { if (CITY.on) mapBeaconsWorld(g); });
V10.onRenderScreen.push((g) => { if (CITY.on) { minimapRender(g); mapBeaconsScreen(g); } miniLayout(); });
V10.onRunStart.push(() => { MAPV.tiles.clear(); miniLayout(); });
V10.onRunReset.push(() => { mapClose(); miniLayout(); });
// EOF:js/minimap.js
