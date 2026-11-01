/* =========================================================================
   OMNI-SHIFT v14.2 — REAL MAP · DATA (js/realdata.js)
   Real places from OpenStreetMap, 48 km across (24 km out from the centre):
   • two sources, one pipeline
       offline — "Indiana City": packs shipped with the game in data/realmap/
                 (14 Indiana places, Indianapolis first, pre-downloaded)
       online  — "Any City in the World": OpenFreeMap vector tiles (OpenMapTiles
                 schema, no key), cached in the browser for offline replays
   • a minimal Mapbox-Vector-Tile decoder, a local projection that puts the
     chosen centre in the middle of the 64 km world, tile → world-metre
     features (buildings, roads, names, water, land use, POIs, places,
     aeroways) clipped to exact tile bounds so nothing is counted twice;
     buildings cut by tile seams are stitched back together per km cell
   • streaming: tiles around the player load ahead of him; a km cell is only
     generated once every tile under it is in, so blocks never change later
   OpenFreeMap © OpenMapTiles · Data from OpenStreetMap (© OpenStreetMap contributors, ODbL);
   the Indiana packs add Microsoft US Building Footprints (ODbL) where OSM has no buildings yet.
   ========================================================================= */
"use strict";

// v14.3 MAP SCALE: world metres per real metre (RM.S). Real places are drawn at 1:3 by default — roads, houses and cars
// sized to the hero (his sprite is ~0.75 m tall at 32 px/m) — and the player can pick 1:2 or true size (1:1) in the menu.
// Everything real lands scaled at the projection; real-size constants elsewhere multiply by RM.S (rmZ).
const RM_HALF0 = 24000;               // REAL metres from the centre to the border highway (48 km across)
let RM_HALF = RM_HALF0 / 3;           // world metres (set by rmScaleSet)
let RM_LO = 32000 - RM_HALF, RM_HI = 32000 + RM_HALF;
const RM_SCALES = [[1 / 3, "1:3", "Hero-sized (default)"], [1 / 2, "1:2", "Roomier"], [1, "1:1", "True size"]];
// attribution the map data needs wherever it shows (OpenFreeMap's required wording + the OSM copyright link)
const RM_ATTR = "OpenFreeMap © OpenMapTiles · Data from OpenStreetMap";
const RM_ATTR_HTML = 'OpenFreeMap © OpenMapTiles · Data from <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener" style="color:inherit">OpenStreetMap</a> (ODbL)';
// the built-in Indiana packs also carry Microsoft's building footprints where OpenStreetMap has no houses yet (ODbL)
const RM_ATTR_MS = " · Building footprints © Microsoft (ODbL)";
function rmAttr(html, offline) {
  if (offline === undefined) offline = RM.mode === "offline" && !RM.viaOnline;
  const ms = offline && (!RM.index || /Microsoft/.test(RM.index.note || ""));
  return (html ? RM_ATTR_HTML : RM_ATTR) + (ms ? RM_ATTR_MS : "");
}
const RM_SRC = {
  tilejson: "https://tiles.openfreemap.org/planet",
  tplFallback: "https://tiles.openfreemap.org/planet/20261025_080012_pt/{z}/{x}/{y}.pbf",
  offline: "data/realmap/",
  cacheName: "omni-osm-v1"
};
const RM = {
  on: false, mode: "offline", place: null, lat0: 0, lon0: 0, k: 1, cx14: 0, cy14: 0, mpt: 1000,
  tpl: "", tplP: null, index: null, indexP: null, packs: new Map(),
  tiles: new Map(), cells: new Map(), q: [], active: 0, conc: 6, gen: 0,
  ovw: null, stats: { req: 0, ok: 0, fail: 0, bytes: 0, decodeMs: 0, cacheHits: 0 },
  readyCb: [], lastStream: 0, err: "", worldId: "", viaOnline: 0, offlineErr: "", noOnline: false, S: 1 / 3
};
// real metres → world metres
function rmZ(v) { return v * RM.S; }
// world m² → real m² (classification thresholds are real sizes)
function rmRealA(a) { return a / (RM.S * RM.S); }
function rmScaleNorm(S) { S = +S; for (const q of RM_SCALES) if (Math.abs(q[0] - S) < 1e-3) return q[0]; return RM_SCALES[0][0]; }
function rmScaleLabel(S) { const q = RM_SCALES.find(q => Math.abs(q[0] - S) < 1e-3); return q ? q[1] : "1:3"; }
// set the scale before a place is built; a different scale forgets the decoded tiles (they are stored scaled)
function rmScaleSet(S) {
  S = rmScaleNorm(S);
  const changed = Math.abs(S - RM.S) > 1e-6;
  RM.S = S; RM_HALF = RM_HALF0 * S; RM_LO = 32000 - RM_HALF; RM_HI = 32000 + RM_HALF; RM_PAD = Math.max(90, Math.round(260 * S));
  if (typeof rmGenScale === "function") rmGenScale(S);
  if (changed && typeof rmResetData === "function" && (RM.tiles.size || RM.cells.size || RM.ovw)) rmResetData();
  return S;
}

/* --- 1. MVT DECODER ------------------------------------------------------------------- */
const RM_TD = typeof TextDecoder !== "undefined" ? new TextDecoder() : null;
function rmMvt(u8) {
  let p = 0;
  const n = u8.length, dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
  const vi = () => { let r = 0, s = 0, b; do { b = u8[p++]; if (s < 28) r |= (b & 0x7f) << s; else r += (b & 0x7f) * Math.pow(2, s); s += 7; } while (b & 0x80); return r >>> 0 === r ? r : r; };
  const vl = () => { let r = 0, m = 1, b; do { b = u8[p++]; r += (b & 0x7f) * m; m *= 128; } while (b & 0x80); return r; };
  const skip = (wt) => { if (wt === 0) { while (u8[p++] & 0x80); } else if (wt === 1) p += 8; else if (wt === 2) { const l = vi(); p += l; } else if (wt === 5) p += 4; else throw new Error("mvt wire " + wt); };
  const str = (l) => { const s = RM_TD.decode(u8.subarray(p, p + l)); p += l; return s; };
  const packed = () => { const l = vi(), e = p + l, out = []; while (p < e) out.push(vi()); return out; };
  const layers = {};
  while (p < n) {
    const t = vi();
    if ((t >> 3) !== 3 || (t & 7) !== 2) { skip(t & 7); continue; }
    const lenL = vi(), end = p + lenL, L = { name: "", ext: 4096, keys: [], vals: [], feats: [] };
    while (p < end) {
      const t2 = vi(), f2 = t2 >> 3;
      if (f2 === 1) L.name = str(vi());
      else if (f2 === 2) {
        const lenF = vi(), fe = p + lenF, F = { type: 0, tags: null, geom: null };
        while (p < fe) { const t3 = vi(), f3 = t3 >> 3; if (f3 === 2) F.tags = packed(); else if (f3 === 3) F.type = vi(); else if (f3 === 4) F.geom = packed(); else skip(t3 & 7); }
        L.feats.push(F);
      } else if (f2 === 3) L.keys.push(str(vi()));
      else if (f2 === 4) {
        const lenV = vi(), ve = p + lenV; let v = null;
        while (p < ve) { const t4 = vi(), f4 = t4 >> 3; if (f4 === 1) v = str(vi()); else if (f4 === 2) { v = dv.getFloat32(p, true); p += 4; } else if (f4 === 3) { v = dv.getFloat64(p, true); p += 8; } else if (f4 === 4 || f4 === 5) v = vl(); else if (f4 === 6) { const z = vl(); v = z % 2 ? -(z + 1) / 2 : z / 2; } else if (f4 === 7) v = !!vi(); else skip(t4 & 7); }
        L.vals.push(v);
      } else if (f2 === 5) L.ext = vi();
      else skip(t2 & 7);
    }
    p = end;
    layers[L.name] = L;
  }
  return layers;
}
function rmProps(L, F) { const o = {}, t = F.tags; if (t) for (let i = 0; i + 1 < t.length; i += 2) o[L.keys[t[i]]] = L.vals[t[i + 1]]; return o; }
function rmGeom(F) {   // → rings / lines as arrays of [x, y] in tile units
  const g = F.geom || [], out = []; let x = 0, y = 0, cur = null, i = 0;
  while (i < g.length) {
    const c = g[i++], id = c & 7, cnt = c >> 3;
    if (id === 1 || id === 2) {
      for (let k = 0; k < cnt; k++) { const a = g[i++], b = g[i++]; x += (a >>> 1) ^ -(a & 1); y += (b >>> 1) ^ -(b & 1); if (id === 1) { cur = [[x, y]]; out.push(cur); } else if (cur) cur.push([x, y]); }
    } else if (id === 7) { if (cur && cur.length > 2) cur.push([cur[0][0], cur[0][1]]); }
  }
  return out;
}
function rmRingArea(r) { let s = 0; for (let i = 0, j = r.length - 1; i < r.length; j = i++) s += (r[j][0] - r[i][0]) * (r[i][1] + r[j][1]); return s; }
function rmPolys(rings) {   // classify rings into polygons (first ring's winding = exterior), like vector-tile-js
  const out = []; let cur = null, ccw;
  for (const r of rings) {
    const a = rmRingArea(r);
    if (!a) continue;
    if (ccw === undefined) ccw = a < 0;
    if (ccw === (a < 0)) { cur = [r]; out.push(cur); } else if (cur) cur.push(r);
  }
  return out;
}
function rmName(p) { return p.name_en || p["name:latin"] || p.name || ""; }

/* --- 2. PROJECTION -------------------------------------------------------------------- */
function rmLon2T(lon, z) { return (lon + 180) / 360 * Math.pow(2, z); }
function rmLat2T(lat, z) { const r = lat * Math.PI / 180; return (1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2 * Math.pow(2, z); }
function rmT2Lat(ty, z) { const n = Math.PI - 2 * Math.PI * ty / Math.pow(2, z); return 180 / Math.PI * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n))); }
function rmSetCentre(lat, lon) {
  RM.lat0 = lat; RM.lon0 = lon; RM.k = Math.cos(lat * Math.PI / 180);
  RM.cx14 = rmLon2T(lon, 14); RM.cy14 = rmLat2T(lat, 14);
  RM.mpt = 40075016.686 / 16384 * RM.k * RM.S;   // world metres across one z14 tile at this latitude (real metres × map scale)
}
function rmLL2W(lat, lon) { return [32000 + (rmLon2T(lon, 14) - RM.cx14) * RM.mpt, 32000 + (rmLat2T(lat, 14) - RM.cy14) * RM.mpt]; }
function rmW2LL(xm, ym) { const tx = RM.cx14 + (xm - 32000) / RM.mpt, ty = RM.cy14 + (ym - 32000) / RM.mpt; return [rmT2Lat(ty, 14), tx / 16384 * 360 - 180]; }
function rmTileBox(z, x, y) {   // world-metre box of a tile
  const s = Math.pow(2, 14 - z);
  return [32000 + (x * s - RM.cx14) * RM.mpt, 32000 + (y * s - RM.cy14) * RM.mpt, 32000 + ((x + 1) * s - RM.cx14) * RM.mpt, 32000 + ((y + 1) * s - RM.cy14) * RM.mpt];
}
// z14 tiles overlapping a world-metre rect (clamped to the real square + a little)
function rmTilesIn(x0, y0, x1, y1, z) {
  z = z || 14;
  const s = Math.pow(2, z - 14), lo = RM_LO - 400, hi = RM_HI + 400;
  x0 = Math.max(lo, x0); y0 = Math.max(lo, y0); x1 = Math.min(hi, x1); y1 = Math.min(hi, y1);
  if (x1 <= x0 || y1 <= y0) return [];
  const tx0 = Math.floor((RM.cx14 + (x0 - 32000) / RM.mpt) * s), tx1 = Math.floor((RM.cx14 + (x1 - 32000) / RM.mpt) * s);
  const ty0 = Math.floor((RM.cy14 + (y0 - 32000) / RM.mpt) * s), ty1 = Math.floor((RM.cy14 + (y1 - 32000) / RM.mpt) * s);
  const out = [];
  for (let y = ty0; y <= ty1; y++) for (let x = tx0; x <= tx1; x++) out.push(z + "/" + x + "/" + y);
  return out;
}
// EOF part 1 (realdata.js continues)

/* --- 3. CLIPPING & GEOMETRY ----------------------------------------------------------- */
function rmClipRing(r, e) {   // Sutherland–Hodgman against [0,e]²
  let pts = r;
  const edge = (inside, cross) => { const out = []; for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length], ia = inside(a), ib = inside(b); if (ia) out.push(a); if (ia !== ib) out.push(cross(a, b)); } pts = out; };
  if (pts.length && pts[0][0] === pts[pts.length - 1][0] && pts[0][1] === pts[pts.length - 1][1]) pts = pts.slice(0, -1);
  edge(p => p[0] >= 0, (a, b) => [0, a[1] + (b[1] - a[1]) * (0 - a[0]) / (b[0] - a[0])]); if (!pts.length) return pts;
  edge(p => p[0] <= e, (a, b) => [e, a[1] + (b[1] - a[1]) * (e - a[0]) / (b[0] - a[0])]); if (!pts.length) return pts;
  edge(p => p[1] >= 0, (a, b) => [a[0] + (b[0] - a[0]) * (0 - a[1]) / (b[1] - a[1]), 0]); if (!pts.length) return pts;
  edge(p => p[1] <= e, (a, b) => [a[0] + (b[0] - a[0]) * (e - a[1]) / (b[1] - a[1]), e]);
  return pts;
}
function rmClipLine(line, e) {   // Liang–Barsky per segment → pieces
  const out = []; let cur = null;
  for (let i = 0; i < line.length - 1; i++) {
    let [x0, y0] = line[i], [x1, y1] = line[i + 1], t0 = 0, t1 = 1;
    const dx = x1 - x0, dy = y1 - y0, P = [-dx, dx, -dy, dy], Q = [x0, e - x0, y0, e - y0];
    let ok = true;
    for (let k = 0; k < 4; k++) { if (P[k] === 0) { if (Q[k] < 0) { ok = false; break; } } else { const t = Q[k] / P[k]; if (P[k] < 0) { if (t > t1) { ok = false; break; } if (t > t0) t0 = t; } else { if (t < t0) { ok = false; break; } if (t < t1) t1 = t; } } }
    if (!ok) { cur = null; continue; }
    const a = [x0 + dx * t0, y0 + dy * t0], b = [x0 + dx * t1, y0 + dy * t1];
    if (!cur || t0 > 0) { cur = [a]; out.push(cur); }
    cur.push(b);
    if (t1 < 1) cur = null;
  }
  return out.filter(l => l.length > 1);
}
// tile-unit points → world-metre Float32Array [x0,y0,x1,y1,…]
function rmToW(pts, ox, oy, sc) { const a = new Float32Array(pts.length * 2); for (let i = 0; i < pts.length; i++) { a[i * 2] = ox + pts[i][0] * sc; a[i * 2 + 1] = oy + pts[i][1] * sc; } return a; }
function rmBBox(a) { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (let i = 0; i < a.length; i += 2) { const x = a[i], y = a[i + 1]; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } return [x0, y0, x1, y1]; }
function rmArea(a) { let s = 0; const n = a.length; for (let i = 0, j = n - 2; i < n; j = i, i += 2) s += (a[j] - a[i]) * (a[i + 1] + a[j + 1]); return s / 2; }
function rmCentroid(a) {
  let A = 0, cx = 0, cy = 0; const n = a.length;
  for (let i = 0, j = n - 2; i < n; j = i, i += 2) { const f = a[j] * a[i + 1] - a[i] * a[j + 1]; A += f; cx += (a[j] + a[i]) * f; cy += (a[j + 1] + a[i + 1]) * f; }
  if (Math.abs(A) < 1e-6) { const b = rmBBox(a); return [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2]; }
  return [cx / (3 * A), cy / (3 * A)];
}
function rmPip(px, py, a) { let c = false; const n = a.length; for (let i = 0, j = n - 2; i < n; j = i, i += 2) { const yi = a[i + 1], yj = a[j + 1]; if ((yi > py) !== (yj > py) && px < (a[j] - a[i]) * (py - yi) / (yj - yi) + a[i]) c = !c; } return c; }
function rmPipPoly(px, py, pg) { let c = false; for (const r of pg) if (rmPip(px, py, r)) c = !c; return c; }
function rmBoxHit(b, x0, y0, x1, y1) { return b[2] >= x0 && b[0] <= x1 && b[3] >= y0 && b[1] <= y1; }
// EOF part 2 (realdata.js continues)

/* --- 4. TILE → WORLD FEATURES ------------------------------------------------------- */
const RM_POI_SKIP = new Set(["bollard", "waste_basket", "bench", "bicycle_parking", "information", "lift_gate", "gate", "vending_machine", "drinking_water", "post_box", "recycling", "bicycle_rental", "atm", "toilets", "telephone", "charging_station", "taxi", "bus_stop", "shelter", "clock", "fountain", "hunting_stand", "picnic_table", "viewpoint", "artwork", "memorial", "survey_point", "water_point", "dog_park", "parcel_locker", "motorcycle_parking", "stile", "cycle_barrier", "block", "kissing_gate", "entrance"]);
function rmExtract(z, x, y, L) {
  const T = { k: z + "/" + x + "/" + y, z, x, y, bld: [], roads: [], names: [], water: [], land: [], wways: [], pois: [], places: [], aero: [], used: 0 };
  const s = Math.pow(2, 14 - z), ox = 32000 + (x * s - RM.cx14) * RM.mpt, oy = 32000 + (y * s - RM.cy14) * RM.mpt;
  for (const lname in L) {
    const Ly = L[lname], e = Ly.ext || 4096, sc = s * RM.mpt / e;
    switch (lname) {
      case "building": {
        for (const F of Ly.feats) {
          if (F.type !== 3) continue;
          const P = rmProps(Ly, F);
          if ((P.render_min_height || 0) >= 3) continue;   // skybridges / overhangs: the ground floor is someone else
          const h = +P.render_height || 5;
          for (const pg of rmPolys(rmGeom(F))) {
            const r0 = pg[0];
            let mnx = 1e9, mny = 1e9, mxx = -1e9, mxy = -1e9;
            for (const q of r0) { if (q[0] < mnx) mnx = q[0]; if (q[0] > mxx) mxx = q[0]; if (q[1] < mny) mny = q[1]; if (q[1] > mxy) mxy = q[1]; }
            if (mxx <= 0 || mxy <= 0 || mnx >= e || mny >= e) continue;
            const inside = mnx >= 0 && mny >= 0 && mxx <= e && mxy <= e;
            let rings = pg, cut = 0;
            if (!inside) {   // cut by the tile seam: keep exactly the part inside this tile, stitch later
              const c0 = rmClipRing(r0, e);
              if (c0.length < 3) continue;
              rings = [c0].concat(pg.slice(1).map(r => rmClipRing(r, e)).filter(r => r.length >= 3));
              if (mnx < 0) cut |= 1; if (mxx > e) cut |= 2; if (mny < 0) cut |= 4; if (mxy > e) cut |= 8;
            }
            const W = rings.map(r => rmToW(r, ox, oy, sc)), area = Math.abs(rmArea(W[0]));
            if (rmRealA(area) < 4) continue;
            T.bld.push({ pg: W, h, bb: rmBBox(W[0]), area, cut, t: T.k, c: rmCentroid(W[0]), src: P.src === "ms" ? "ms" : "" });
          }
        }
        break;
      }
      case "transportation": case "transportation_name": case "waterway": {
        const nm = lname === "transportation_name", ww = lname === "waterway";
        for (const F of Ly.feats) {
          const P = rmProps(Ly, F);
          if (F.type === 3) {   // pedestrian areas, bridge decks, piers
            if (nm || ww) continue;
            for (const pg of rmPolys(rmGeom(F))) { const rings = pg.map(r => rmClipRing(r, e)).filter(r => r.length >= 3); if (!rings.length) continue; const W = rings.map(r => rmToW(r, ox, oy, sc)); T.land.push({ cls: P.class === "bridge" ? "deck" : P.class === "pier" ? "pier" : "plaza", pg: W, bb: rmBBox(W[0]) }); }
            continue;
          }
          if (F.type !== 2) continue;
          if (P.brunnel === "tunnel" && !nm) continue;
          for (const line of rmGeom(F)) for (const piece of rmClipLine(line, e)) {
            const a = rmToW(piece, ox, oy, sc), bb = rmBBox(a);
            if (nm) { const n = rmName(P); if (n || P.ref) T.names.push({ cls: P.class, name: n, ref: P.ref || "", pts: a, bb }); }
            else if (ww) T.wways.push({ cls: P.class, name: rmName(P), pts: a, bb, br: P.brunnel || "", inter: P.intermittent ? 1 : 0 });
            else T.roads.push({ cls: P.class, sub: P.subclass || "", br: P.brunnel || "", lay: P.layer || 0, ow: P.oneway ? 1 : 0, ramp: P.ramp ? 1 : 0, svc: P.service || "", surf: P.surface || "", pts: a, bb });
          }
        }
        break;
      }
      case "water": case "landuse": case "landcover": case "park": case "aeroway": {
        const dst = lname === "water" ? T.water : lname === "aeroway" ? T.aero : T.land;
        for (const F of Ly.feats) {
          const P = rmProps(Ly, F);
          if (lname === "water" && P.brunnel === "tunnel") continue;
          if (lname === "aeroway" && F.type === 2) { for (const line of rmGeom(F)) for (const piece of rmClipLine(line, e)) { const a = rmToW(piece, ox, oy, sc); T.aero.push({ cls: P.class, ref: P.ref || "", pts: a, bb: rmBBox(a), line: 1 }); } continue; }
          if (F.type !== 3) continue;
          for (const pg of rmPolys(rmGeom(F))) {
            const rings = pg.map(r => rmClipRing(r, e)).filter(r => r.length >= 3);
            if (!rings.length) continue;
            const W = rings.map(r => rmToW(r, ox, oy, sc));
            const o = { cls: P.class || "", pg: W, bb: rmBBox(W[0]) };
            if (lname === "landcover") { o.src = "lc"; o.sub = P.subclass || ""; }
            else if (lname === "landuse") o.src = "lu";
            else if (lname === "park") { o.src = "park"; o.name = rmName(P); }
            else if (lname === "water") o.inter = P.intermittent ? 1 : 0;
            else if (lname === "aeroway") o.ref = P.ref || "";
            dst.push(o);
          }
        }
        break;
      }
      case "poi": case "place": case "aerodrome_label": case "water_name": {
        for (const F of Ly.feats) {
          if (F.type !== 1) continue;
          const P = rmProps(Ly, F), g = rmGeom(F);
          for (const ln of g) {
            const q = ln[0];
            if (!q || q[0] < 0 || q[1] < 0 || q[0] >= e || q[1] >= e) continue;
            const xm = ox + q[0] * sc, ym = oy + q[1] * sc, name = rmName(P);
            if (lname === "poi") { if (RM_POI_SKIP.has(P.subclass) && !name) continue; if (P.subclass === "bus_stop") continue; T.pois.push({ cls: P.class || "", sub: P.subclass || "", name, x: xm, y: ym, rank: P.rank || 99 }); }
            else if (lname === "aerodrome_label") T.pois.push({ cls: "aerodrome", sub: P.class || "", name, x: xm, y: ym, rank: 1, iata: P.iata || "" });
            else if (lname === "water_name") { if (name) T.places.push({ cls: "water", name, x: xm, y: ym, rank: P.rank || 9 }); }
            else if (name) T.places.push({ cls: P.class || "", name, x: xm, y: ym, rank: P.rank || 9, cap: P.capital || 0 });
          }
        }
        break;
      }
      default: break;
    }
  }
  return T;
}
// EOF part 3 (realdata.js continues)

/* --- 5. SOURCES: offline packs & online tiles ---------------------------------------- */
function rmQuery() { try { return new URLSearchParams(location.search); } catch (e) { return new URLSearchParams(""); } }
function rmOfflineBase() { const w = typeof window !== "undefined" && window.RM_DATA_BASE; if (w) return w; const q = rmQuery().get("realdata"); return q ? (q.endsWith("/") ? q : q + "/") : RM_SRC.offline; }
async function rmGunzipMaybe(ab) {
  const u = new Uint8Array(ab);
  if (u[0] !== 0x1f || u[1] !== 0x8b) return ab;
  if (typeof DecompressionStream === "undefined") throw new Error("this browser cannot unpack offline maps (no DecompressionStream)");
  return await new Response(new Blob([ab]).stream().pipeThrough(new DecompressionStream("gzip"))).arrayBuffer();
}
function rmLoadIndex() {
  if (RM.index) return Promise.resolve(RM.index);
  if (RM.indexP) return RM.indexP;
  const base = rmOfflineBase(), F = RM.indexFail;
  // a known miss is not asked for again tile after tile (20 s memo); a file:// page can't fetch local files at all
  if (F && F.base === base && performance.now() - F.t < 20000) return Promise.reject(new Error(F.msg));
  if (typeof location !== "undefined" && location.protocol === "file:" && !/^https?:/i.test(base)) { RM.indexFail = { base, t: performance.now(), msg: "built-in maps can't load from a file:// page" }; return Promise.reject(new Error(RM.indexFail.msg)); }
  RM.indexP = fetch(base + "index.json", { cache: "no-cache" }).then(r => { if (!r.ok) throw new Error("offline map index missing (" + r.status + ")"); return r.json(); })
    .then(j => { RM.index = j; RM.indexFail = null; return j; }).catch(e => { RM.indexP = null; RM.indexFail = { base, t: performance.now(), msg: (e && e.message) || "offline map index missing" }; throw e; });
  return RM.indexP;
}
// which pack holds a tile — index v2: every z10 tile in one small overview pack, the middle of each place in its own
// core pack (index.tile), the other z14 tiles in ≈ 4 MB packs listed per z11 cell (index.cell); v1 (older builds):
// one pack per z10 tile. null = outside the shipped area (an empty tile)
function rmPackKey(z, x, y) {
  const I = RM.index || {};
  if (I.ovw && z <= (I.ovwZ || 10)) return I.ovw;
  if (I.tile && I.tile[x + "_" + y] && z === (I.z || 14)) return I.tile[x + "_" + y];
  if (I.cell) { const d = z - (I.cellZ || 11); return d >= 0 ? I.cell[(x >> d) + "_" + (y >> d)] || null : null; }
  const d = z - (I.packZ || 10); return d >= 0 ? (x >> d) + "_" + (y >> d) : null;
}
function rmLoadPack(pk) {
  let P = RM.packs.get(pk);
  if (P) { P.used = performance.now(); return P.p; }
  P = { st: 1, used: performance.now(), dir: null, buf: null };
  RM.packs.set(pk, P);
  const meta = RM.index && RM.index.packs ? RM.index.packs[pk] : null;
  if (!meta) { P.st = 3; P.p = Promise.resolve(P); return P.p; }   // outside the shipped area: empty
  P.p = fetch(rmOfflineBase() + meta.f).then(r => { if (!r.ok) throw new Error("pack " + pk + " HTTP " + r.status); return r.arrayBuffer(); })
    .then(rmGunzipMaybe).then(ab => {
      const dv = new DataView(ab), m = String.fromCharCode(dv.getUint8(0), dv.getUint8(1), dv.getUint8(2), dv.getUint8(3));
      if (m !== "OSMP") throw new Error("bad pack " + pk);
      const n = dv.getUint32(8, true), dir = new Map();
      for (let i = 0; i < n; i++) { const o = 12 + i * 20; dir.set(dv.getUint8(o) + "/" + dv.getUint32(o + 4, true) + "/" + dv.getUint32(o + 8, true), [dv.getUint32(o + 12, true), dv.getUint32(o + 16, true)]); }
      P.dir = dir; P.buf = new Uint8Array(ab); P.st = 2; RM.stats.bytes += ab.byteLength;
      // keep the overview + the 4 most recently used detail packs in memory (unpacked, a detail pack is ≈ 6 MB)
      const ov = RM.index && RM.index.ovw;
      if (RM.packs.size > 5) { const arr = [...RM.packs.entries()].filter(e => e[1].st >= 2 && e[0] !== ov && e[0] !== pk).sort((a, b) => a[1].used - b[1].used); for (let i = 0; i < arr.length && RM.packs.size > 5; i++) RM.packs.delete(arr[i][0]); }
      return P;
    }).catch(e => { P.st = 3; P.err = e.message; RM.err = e.message; return P; });
  return P.p;
}
function rmTileTemplate() {
  const w = typeof window !== "undefined" && window.RM_TILES_TPL;   // QA / self-hosted tiles
  if (w) { RM.tpl = w; return Promise.resolve(w); }
  const q = rmQuery().get("realtiles");
  if (q) { RM.tpl = q; return Promise.resolve(q); }
  if (RM.tpl) return Promise.resolve(RM.tpl);
  if (RM.tplP) return RM.tplP;
  let stored = null;
  try { stored = JSON.parse(localStorage.getItem("omniRealTpl") || "null"); } catch (e) { stored = null; }
  if (stored && stored.t && Date.now() - stored.at < 3 * 864e5) { RM.tpl = stored.t; return Promise.resolve(RM.tpl); }
  RM.tplP = fetch(RM_SRC.tilejson).then(r => r.json()).then(j => { RM.tpl = j.tiles[0]; try { localStorage.setItem("omniRealTpl", JSON.stringify({ t: RM.tpl, at: Date.now() })); } catch (e) { /* private mode */ } return RM.tpl; })
    .catch(() => { RM.tpl = (stored && stored.t) || RM_SRC.tplFallback; return RM.tpl; }).finally(() => { RM.tplP = null; });
  return RM.tplP;
}
async function rmCacheOpen() { try { if (typeof caches !== "undefined" && (location.protocol === "https:" || location.hostname === "localhost" || location.hostname === "127.0.0.1")) return await caches.open(RM_SRC.cacheName); } catch (e) { /* no cache storage */ } return null; }
async function rmFetchOnline(z, x, y) {
  const tpl = await rmTileTemplate(), url = tpl.replace("{z}", z).replace("{x}", x).replace("{y}", y);
  const c = await rmCacheOpen();
  if (c) { try { const hit = await c.match(url); if (hit) { RM.stats.cacheHits++; return new Uint8Array(await hit.arrayBuffer()); } } catch (e) { /* ignore */ } }
  const r = await fetch(url, { mode: "cors" });
  if (r.status === 204 || r.status === 404) return new Uint8Array(0);
  if (!r.ok) throw new Error("tile HTTP " + r.status);
  const ab = await r.arrayBuffer();
  RM.stats.bytes += ab.byteLength;
  if (c) { try { await c.put(url, new Response(ab.slice(0), { headers: { "Content-Type": "application/x-protobuf" } })); } catch (e) { /* quota */ } }
  return new Uint8Array(ab);
}
async function rmFetchOfflinePack(z, x, y) {
  await rmLoadIndex();
  const P = await rmLoadPack(rmPackKey(z, x, y));
  if (P.st !== 2) { if (P.err) throw new Error(P.err); return new Uint8Array(0); }
  const e = P.dir.get(z + "/" + x + "/" + y);
  return e ? P.buf.subarray(e[0], e[0] + e[1]) : new Uint8Array(0);
}
// the shipped Indiana packs; when they can't be read (not uploaded yet, one file missing, the game opened as a
// file:// page, a browser that can't unpack gzip) the same tile streams from OpenFreeMap instead — same data
// source, so the city still builds for real (needs internet; RM.viaOnline counts it for the menu and banner)
async function rmFetchOffline(z, x, y) {
  try { return await rmFetchOfflinePack(z, x, y); }
  catch (e) {
    if (RM.noOnline) throw e;
    if (!RM.offlineErr) RM.offlineErr = (e && e.message) || String(e);
    const u8 = await rmFetchOnline(z, x, y);
    RM.viaOnline++; RM.conc = 6;
    return u8;
  }
}
function rmOfflineMissingWhy() {   // a short, fixable reason for the menu / banners
  if (typeof location !== "undefined" && location.protocol === "file:") return "the game was opened as a file — the built-in Indiana maps load when the game is hosted (GitHub Pages)";
  if (typeof DecompressionStream === "undefined") return "this browser can't unpack the built-in maps";
  return "the Indiana map files (data/realmap/) aren't installed next to the game";
}
// EOF part 4 (realdata.js continues)

/* --- 6. TILE QUEUE ------------------------------------------------------------------- */
// state: 1 queued/loading · 2 ready · 3 failed (treated as empty after retries)
function rmTile(k) { return RM.tiles.get(k); }
function rmTileState(k) { const T = RM.tiles.get(k); return T ? T.st : 0; }
function rmRequest(keys, prio) {
  const ps = [];
  for (const k of keys) {
    let T = RM.tiles.get(k);
    if (!T) { const zxy = k.split("/").map(Number); T = { k, z: zxy[0], x: zxy[1], y: zxy[2], st: 1, prio: prio || 0, tries: 0, gen: RM.gen, cbs: [] }; RM.tiles.set(k, T); RM.q.push(T); }
    else if (T.st === 1 && (prio || 0) > T.prio) T.prio = prio;
    if (T.st >= 2) ps.push(Promise.resolve(T)); else ps.push(new Promise(res => T.cbs.push(res)));
  }
  RM.q.sort((a, b) => b.prio - a.prio);
  rmPump();
  return Promise.all(ps);
}
function rmPump() {
  while (RM.active < RM.conc && RM.q.length) {
    const T = RM.q.shift();
    if (T.st !== 1 || T.gen !== RM.gen) continue;
    RM.active++; RM.stats.req++;
    const [z, x, y] = T.k.split("/").map(Number), gen = RM.gen;
    (RM.mode === "offline" ? rmFetchOffline(z, x, y) : rmFetchOnline(z, x, y)).then(u8 => {
      if (gen !== RM.gen) return;
      const t0 = performance.now();
      const L = u8.length ? rmMvt(u8) : {};
      T.f = rmExtract(z, x, y, L); T.st = 2; T.at = performance.now(); RM.stats.ok++;
      RM.stats.decodeMs += performance.now() - t0;
      rmTileReady(T);
    }).catch(e => {
      if (gen !== RM.gen) return;
      T.tries++;
      if (T.tries < 4 && (RM.mode === "online" || RM.viaOnline > 0)) { setTimeout(() => { if (gen === RM.gen && T.st === 1) { RM.q.push(T); rmPump(); } }, 700 * T.tries); return; }
      T.st = 3; T.f = rmExtract(z, x, y, {}); RM.stats.fail++; RM.err = e.message || String(e);
      rmTileReady(T);
    }).finally(() => { RM.active--; rmPump(); });
  }
}
function rmTileReady(T) {
  const cb = T.cbs; T.cbs = [];
  for (const f of cb) try { f(T); } catch (e) { console.warn(e); }
  if (typeof rmOnTile === "function") try { rmOnTile(T); } catch (e) { if (window.trackProgress) window.trackProgress("rmOnTile: " + e.message, true); }
}
// forget everything (a new place was chosen)
function rmResetData() {
  // settle every waiter of the old place first (their promises must not hang), then forget it all
  for (const T of RM.tiles.values()) if (T.st === 1) { T.st = 3; T.f = null; const cb = T.cbs; T.cbs = []; for (const f of cb) try { f(T); } catch (e) { /* ignore */ } }
  RM.gen++; RM.tiles.clear(); RM.cells.clear(); RM.q.length = 0; RM.ovw = null; RM.ovwP = null; RM.err = ""; RM.viaOnline = 0; RM.offlineErr = "";
  RM.stats = { req: 0, ok: 0, fail: 0, bytes: 0, decodeMs: 0, cacheHits: 0 };
}
// unload far tiles (keep memory bounded): decoded features of tiles > 4.5 km from the player
function rmTrim(xm, ym) {
  if (RM.tiles.size < 90) return;
  const far = Math.max(1600, rmZ(4500)), farC = Math.max(2200, rmZ(5000));
  for (const [k, T] of RM.tiles) {
    if (T.st < 2 || k.indexOf("14/") !== 0) continue;
    const [, x, y] = k.split("/").map(Number), b = rmTileBox(14, x, y);
    if (Math.max(b[0] - xm, xm - b[2], b[1] - ym, ym - b[3]) > far) { RM.tiles.delete(k); }
  }
  for (const [ck, C] of RM.cells) if (Math.hypot(C.mx * 1000 + 500 - xm, C.my * 1000 + 500 - ym) > farC) RM.cells.delete(ck);
}
// EOF part 5 (realdata.js continues)

/* --- 7. KM CELLS: everything under one 1 km cell, buildings stitched across seams ----- */
let RM_PAD = 260;   // world metres of neighbouring tiles a cell waits for (big buildings, roads crossing the edge) — 260 real m × scale
function rmCellKeys(mx, my) { return rmTilesIn(mx * 1000 - RM_PAD, my * 1000 - RM_PAD, (mx + 1) * 1000 + RM_PAD, (my + 1) * 1000 + RM_PAD); }
function rmCellReady(mx, my) { for (const k of rmCellKeys(mx, my)) if (rmTileState(k) < 2) return false; return true; }
function rmCellData(mx, my) {
  const ck = mx * 64 + my;
  let C = RM.cells.get(ck);
  if (C) return C;
  const keys = rmCellKeys(mx, my), tiles = [];
  for (const k of keys) { const T = RM.tiles.get(k); if (!T || T.st < 2) return null; tiles.push(T.f); }
  const x0 = mx * 1000, y0 = my * 1000, x1 = x0 + 1000, y1 = y0 + 1000;
  C = { mx, my, blds: [], roads: [], names: [], water: [], land: [], wways: [], pois: [], places: [], aero: [] };
  const cuts = [];
  for (const F of tiles) {
    F.used = performance.now();
    for (const b of F.bld) {
      if (b.cut) { if (rmBoxHit(b.bb, x0 - RM_PAD, y0 - RM_PAD, x1 + RM_PAD, y1 + RM_PAD)) cuts.push(b); continue; }
      if (b.c[0] >= x0 && b.c[0] < x1 && b.c[1] >= y0 && b.c[1] < y1) C.blds.push({ pg: b.pg, h: b.h, bb: b.bb, area: b.area, c: b.c, src: b.src });
    }
    const pad = 40;
    for (const r of F.roads) if (rmBoxHit(r.bb, x0 - pad, y0 - pad, x1 + pad, y1 + pad)) C.roads.push(r);
    for (const r of F.names) if (rmBoxHit(r.bb, x0 - pad, y0 - pad, x1 + pad, y1 + pad)) C.names.push(r);
    for (const r of F.wways) if (rmBoxHit(r.bb, x0 - pad, y0 - pad, x1 + pad, y1 + pad)) C.wways.push(r);
    for (const p of F.water) if (rmBoxHit(p.bb, x0 - 4, y0 - 4, x1 + 4, y1 + 4)) C.water.push(p);
    for (const p of F.land) if (rmBoxHit(p.bb, x0 - 4, y0 - 4, x1 + 4, y1 + 4)) C.land.push(p);
    for (const p of F.aero) if (rmBoxHit(p.bb, x0 - 4, y0 - 4, x1 + 4, y1 + 4)) C.aero.push(p);
    for (const p of F.pois) if (p.x >= x0 - 80 && p.x < x1 + 80 && p.y >= y0 - 80 && p.y < y1 + 80) C.pois.push(p);
    for (const p of F.places) if (p.x >= x0 && p.x < x1 && p.y >= y0 && p.y < y1) C.places.push(p);
  }
  // stitch seam-cut pieces: same height, touching along a shared tile edge
  if (cuts.length) {
    const par = cuts.map((_, i) => i), find = i => { while (par[i] !== i) i = par[i] = par[par[i]]; return i; }, tol = Math.max(0.2, 0.6 * RM.S), ovl = Math.max(0.27, 0.8 * RM.S);
    for (let i = 0; i < cuts.length; i++) for (let j = i + 1; j < cuts.length; j++) {
      const a = cuts[i], b = cuts[j];
      if (a.t === b.t || Math.abs(a.h - b.h) > 0.6) continue;
      if (a.bb[2] < b.bb[0] - tol || b.bb[2] < a.bb[0] - tol || a.bb[3] < b.bb[1] - tol || b.bb[3] < a.bb[1] - tol) continue;
      const ov = Math.min(a.bb[2], b.bb[2]) - Math.max(a.bb[0], b.bb[0]), oh = Math.min(a.bb[3], b.bb[3]) - Math.max(a.bb[1], b.bb[1]);
      if (Math.max(ov, oh) > ovl) par[find(i)] = find(j);
    }
    const groups = new Map();
    cuts.forEach((b, i) => { const r = find(i); if (!groups.has(r)) groups.set(r, []); groups.get(r).push(b); });
    for (const g of groups.values()) {
      let A = 0, cx = 0, cy = 0; const pg = [], bb = [1e9, 1e9, -1e9, -1e9];
      for (const b of g) { A += b.area; cx += b.c[0] * b.area; cy += b.c[1] * b.area; for (const r of b.pg) pg.push(r); bb[0] = Math.min(bb[0], b.bb[0]); bb[1] = Math.min(bb[1], b.bb[1]); bb[2] = Math.max(bb[2], b.bb[2]); bb[3] = Math.max(bb[3], b.bb[3]); }
      cx /= A; cy /= A;
      // pieces abut along the seam, so an even-odd fill of every ring is their union (holes stay holes)
      if (cx >= x0 && cx < x1 && cy >= y0 && cy < y1) C.blds.push({ pg, multi: g.length > 1 ? 1 : 0, h: Math.max(...g.map(b => b.h)), bb, area: A, c: [cx, cy], src: g[0].src });
    }
  }
  RM.cells.set(ck, C);
  return C;
}
// tiles a position needs soon (on foot ~1.4 real km, driving / flying look further ahead) — radii in real terms × scale,
// never under one cell's worth of world so a 1:3 map still streams the block you are in and its neighbours
function rmWantAround(xm, ym, vx, vy) {
  const sp = Math.hypot(vx || 0, vy || 0), z = RM.S, ahead = Math.min(rmZ(5000) + 1200, sp * 25), R = Math.max(650, rmZ(1400)) + Math.min(Math.max(700, rmZ(1600)), sp * 30);
  const ax = xm + (sp > 1 ? vx / sp * ahead : 0), ay = ym + (sp > 1 ? vy / sp * ahead : 0), fr = Math.max(600, rmZ(1200));
  const near = rmTilesIn(xm - R, ym - R, xm + R, ym + R), far = sp > 6 * z ? rmTilesIn(ax - fr, ay - fr, ax + fr, ay + fr) : [];
  return { near, far };
}
function rmStream(xm, ym, vx, vy) {
  if (!RM.on) return;
  const now = performance.now();
  if (now - RM.lastStream < 300) return;
  RM.lastStream = now;
  const W = rmWantAround(xm, ym, vx, vy);
  // closest first
  const d = k => { const [, x, y] = k.split("/").map(Number), b = rmTileBox(14, x, y); return Math.hypot((b[0] + b[2]) / 2 - xm, (b[1] + b[3]) / 2 - ym); };
  const miss = W.near.filter(k => !RM.tiles.has(k)).sort((a, b) => d(a) - d(b));
  if (miss.length) rmRequest(miss, 5);
  const far = W.far.filter(k => !RM.tiles.has(k));
  if (far.length) rmRequest(far, 2);
  rmTrim(xm, ym);
}
// EOF:js/realdata.js
