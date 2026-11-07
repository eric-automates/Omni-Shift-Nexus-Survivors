#!/usr/bin/env node
/* =========================================================================
   OMNI-SHIFT v14.2 — offline real-map pack builder (tools/realmap-build.js)
   Builds data/realmap/ for the "Indiana City" mode: 14 Indiana places
   (Indianapolis and its ring towns, Kokomo, Gary, Brazil and Clay City),
   48 km across each (24 km out from its centre).

     node tools/realmap-build.js download <cacheDir>   fetch the tiles (resumable, polite: 6 at a time)
     node tools/realmap-build.js pack <cacheDir> <outDir>   filter + pack → <outDir>/index.json + overview.bin + cNN.bin + pNN.bin + LICENSE.md
     node tools/realmap-build.js footprints <cacheDir> [zip] Microsoft building footprints for the houses OSM lacks
                                                            (before `pack`; zip = <cache>/ms/Indiana.geojson.zip)
     node tools/realmap-build.js license <outDir>           (re)write LICENSE.md (ODbL + attribution) next to the packs

   Source: OpenFreeMap vector tiles (OpenMapTiles schema), map data
   © OpenStreetMap contributors (ODbL), + Microsoft US Building Footprints
   (ODbL) where OSM has no buildings yet. The packs keep only what the game
   draws (no name translations, house numbers or street furniture POIs): one
   small overview pack (z10), one core pack per place (its middle 9 km) and
   ≈ 4 MB gzip detail packs of the other z14 tiles (z11 cells along a Hilbert
   curve), listed in index.json (tile / cell → pack).
   Node 18+ (built-in fetch), no dependencies.
   ========================================================================= */
"use strict";
const fs = require("fs"), path = require("path"), zlib = require("zlib");

const HALF = 24600;   // metres: the 24 km half-size + a margin for the border highway
const CITIES = [   // name, lat, lon, population (2020 census; GeoNames for the smallest towns) — the built-in Indiana places
  ["Indianapolis", 39.76838, -86.15804, 887642], ["Carmel", 39.97837, -86.11804, 99757], ["Fishers", 39.95559, -86.01387, 98977],
  ["Noblesville", 40.04559, -86.0086, 69604], ["Gary", 41.59337, -87.34643, 69093], ["Greenwood", 39.61366, -86.10665, 63830],
  ["Kokomo", 40.48643, -86.1336, 59604], ["Westfield", 40.04282, -86.12749, 46410], ["Lebanon", 40.04837, -86.46917, 16662],
  ["Beech Grove", 39.72199, -86.08998, 14717], ["Brazil", 39.52365, -87.12502, 8181], ["Sheridan", 40.13504, -86.22055, 2934],
  ["Thorntown", 40.12948, -86.60667, 1485], ["Clay City", 39.27671, -87.11279, 840]
];
const UA = { "User-Agent": "OmniShiftNexus/14.2 realmap-build (github.com/eric-automates/Omni-Shift-Nexus-Survivors)" };
const lon2x = (lon, z) => (lon + 180) / 360 * 2 ** z;
const lat2y = (lat, z) => { const r = lat * Math.PI / 180; return (1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2 * 2 ** z; };
let tileSet = function () {
  const t14 = new Set();
  for (const [, lat, lon] of CITIES) {
    const dlat = HALF / 110574, dlon = HALF / (111320 * Math.cos(lat * Math.PI / 180));
    const x0 = Math.floor(lon2x(lon - dlon, 14)), x1 = Math.floor(lon2x(lon + dlon, 14)), y0 = Math.floor(lat2y(lat + dlat, 14)), y1 = Math.floor(lat2y(lat - dlat, 14));
    for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) t14.add(x + "/" + y);
  }
  const t10 = new Set([...t14].map(k => { const [x, y] = k.split("/").map(Number); return (x >> 4) + "/" + (y >> 4); }));
  return { t14: [...t14], t10: [...t10] };
}

/* --- download ------------------------------------------------------------------------- */
async function download(cache) {
  const tj = await (await fetch("https://tiles.openfreemap.org/planet", { headers: UA })).json(), tpl = tj.tiles[0];
  fs.mkdirSync(cache, { recursive: true }); fs.writeFileSync(path.join(cache, "tilejson.json"), JSON.stringify({ tiles: tj.tiles, at: Date.now() }));
  const { t14, t10 } = tileSet();
  for (const [z, list] of [[10, t10], [14, t14]]) {
    const todo = list.filter(k => !fs.existsSync(path.join(cache, "raw" + z, k + ".pbf")));
    console.log("z" + z, "tiles", list.length, "to fetch", todo.length);
    let i = 0, done = 0;
    await Promise.all(Array.from({ length: 6 }, async () => {
      while (i < todo.length) {
        const k = todo[i++], [x, y] = k.split("/"), url = tpl.replace("{z}", z).replace("{x}", x).replace("{y}", y), dst = path.join(cache, "raw" + z, k + ".pbf");
        for (let a = 0; a < 5; a++) {
          try {
            const r = await fetch(url, { headers: UA });
            const buf = r.status === 204 || r.status === 404 ? Buffer.alloc(0) : r.ok ? Buffer.from(await r.arrayBuffer()) : null;
            if (!buf) throw new Error("HTTP " + r.status);
            fs.mkdirSync(path.dirname(dst), { recursive: true }); fs.writeFileSync(dst + ".tmp", buf); fs.renameSync(dst + ".tmp", dst); break;
          } catch (e) { await new Promise(r => setTimeout(r, 800 * (a + 1))); }
        }
        if (++done % 500 === 0) console.log("  ", done, "/", todo.length);
      }
    }));
  }
}

/* --- MVT decode / filter / encode ------------------------------------------------------------ */
function decode(u8) {
  let p = 0; const dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength), td = new TextDecoder();
  const vi = () => { let r = 0, m = 1, b; do { b = u8[p++]; r += (b & 0x7f) * m; m *= 128; } while (b & 0x80); return r; };
  const skip = wt => { if (wt === 0) { while (u8[p++] & 0x80); } else if (wt === 1) p += 8; else if (wt === 2) { const l = vi(); p += l; } else if (wt === 5) p += 4; };
  const str = l => { const s = td.decode(u8.subarray(p, p + l)); p += l; return s; };
  const packed = () => { const l = vi(), e = p + l, o = []; while (p < e) o.push(vi()); return o; };
  const layers = [];
  while (p < u8.length) {
    const t = vi(); if ((t >> 3) !== 3) { skip(t & 7); continue; }
    const lenL = vi(), end = p + lenL, L = { name: "", ext: 4096, keys: [], vals: [], feats: [] };
    while (p < end) {
      const t2 = vi(), f = t2 >> 3;
      if (f === 1) L.name = str(vi());
      else if (f === 2) { const lenF = vi(), fe = p + lenF, F = { type: 0, tags: [], geom: [] }; while (p < fe) { const t3 = vi(), f3 = t3 >> 3; if (f3 === 2) F.tags = packed(); else if (f3 === 3) F.type = vi(); else if (f3 === 4) F.geom = packed(); else skip(t3 & 7); } L.feats.push(F); }
      else if (f === 3) L.keys.push(str(vi()));
      else if (f === 4) { const lenV = vi(), ve = p + lenV; let v = null; while (p < ve) { const t4 = vi(), f4 = t4 >> 3; if (f4 === 1) v = str(vi()); else if (f4 === 2) { v = dv.getFloat32(p, true); p += 4; } else if (f4 === 3) { v = dv.getFloat64(p, true); p += 8; } else if (f4 === 4 || f4 === 5) v = vi(); else if (f4 === 6) { const z = vi(); v = z % 2 ? -(z + 1) / 2 : z / 2; } else if (f4 === 7) v = !!vi(); else skip(t4 & 7); } L.vals.push(v); }
      else if (f === 5) L.ext = vi(); else skip(t2 & 7);
    }
    p = end; layers.push(L);
  }
  return layers;
}
const KEEP = {
  building: ["render_height", "render_min_height"],
  transportation: ["class", "subclass", "brunnel", "layer", "oneway", "ramp", "service", "surface"],
  transportation_name: ["class", "name", "name_en", "ref"],
  water: ["class", "intermittent", "brunnel"], waterway: ["class", "name", "name_en", "brunnel", "intermittent"],
  landuse: ["class"], landcover: ["class", "subclass"], park: ["class", "name", "name_en"],
  poi: ["class", "subclass", "name", "name_en"], place: ["class", "name", "name_en", "rank", "capital"],
  aeroway: ["class", "ref"], aerodrome_label: ["class", "name", "name_en", "iata"], water_name: ["class", "name", "name_en"]
};
const POI_SKIP = new Set(["bollard", "waste_basket", "bench", "bicycle_parking", "information", "lift_gate", "gate", "vending_machine", "drinking_water", "post_box", "recycling", "bicycle_rental", "atm", "toilets", "telephone", "charging_station", "taxi", "bus_stop", "shelter", "clock", "fountain", "hunting_stand", "picnic_table", "viewpoint", "artwork", "memorial", "survey_point", "water_point", "dog_park", "parcel_locker", "motorcycle_parking", "stile", "cycle_barrier", "block", "kissing_gate", "entrance"]);
const POI_KEEP_UNNAMED = new Set(["fuel", "hospital", "police", "fire_station", "school", "place_of_worship", "college", "town_hall", "pharmacy", "grocery"]);
// Douglas–Peucker on an MVT line geometry (MoveTo/LineTo command stream), tolerance in tile units
function simplifyLines(g, tol) {
  const lines = []; let x = 0, y = 0, cur = null, i = 0;
  while (i < g.length) { const c = g[i++], id = c & 7, n = c >> 3; if (id === 1 || id === 2) { for (let k = 0; k < n; k++) { const a = g[i++], b = g[i++]; x += (a >>> 1) ^ -(a & 1); y += (b >>> 1) ^ -(b & 1); if (id === 1) { cur = [[x, y]]; lines.push(cur); } else cur.push([x, y]); } } }
  const dp = (pts) => { if (pts.length < 3) return pts; const keep = new Uint8Array(pts.length); keep[0] = keep[pts.length - 1] = 1; const st = [[0, pts.length - 1]]; while (st.length) { const [a, b] = st.pop(); const [ax, ay] = pts[a], [bx, by] = pts[b], L = Math.hypot(bx - ax, by - ay) || 1; let md = -1, mi = -1; for (let k = a + 1; k < b; k++) { const d = Math.abs((bx - ax) * (ay - pts[k][1]) - (ax - pts[k][0]) * (by - ay)) / L; if (d > md) { md = d; mi = k; } } if (md > tol) { keep[mi] = 1; st.push([a, mi], [mi, b]); } } return pts.filter((_, k) => keep[k]); };
  const out = []; x = 0; y = 0;
  const zz = v => (v << 1) ^ (v >> 31);
  for (const ln of lines) { const p = dp(ln); out.push((1 & 7) | (1 << 3), zz(p[0][0] - x), zz(p[0][1] - y)); x = p[0][0]; y = p[0][1]; if (p.length > 1) { out.push((2 & 7) | ((p.length - 1) << 3)); for (let k = 1; k < p.length; k++) { out.push(zz(p[k][0] - x), zz(p[k][1] - y)); x = p[k][0]; y = p[k][1]; } } }
  return out;
}
function filterLayer(L) {
  const keep = KEEP[L.name]; if (!keep) return null;
  const out = { name: L.name, ext: L.ext, feats: [] };
  for (const F of L.feats) {
    const P = {}; for (let i = 0; i + 1 < F.tags.length; i += 2) P[L.keys[F.tags[i]]] = L.vals[F.tags[i + 1]];
    if (L.name === "poi" && (P.subclass === "bus_stop" || (POI_SKIP.has(P.subclass) && !P.name) || (!P.name && !POI_KEEP_UNNAMED.has(P.class)))) continue;
    if (L.name === "building" && (P.render_min_height || 0) >= 3) continue;
    if ((L.name === "transportation" || L.name === "waterway" || L.name === "water") && P.brunnel === "tunnel") continue;
    const Q = {};
    for (const k of keep) { if (P[k] === undefined || P[k] === null || P[k] === "") continue; if (k === "name_en" && P.name_en === P.name) continue; if (k === "render_min_height" && !P[k]) continue; if (k === "oneway" && !P[k]) continue; if (k === "layer" && !P[k]) continue; Q[k] = P[k]; }
    out.feats.push({ type: F.type, geom: L.name === "transportation_name" && F.type === 2 ? simplifyLines(F.geom, 6) : F.geom, P: Q });
  }
  return out.feats.length ? out : null;
}
function encode(layers) {
  const bytes = [];
  const vint = (a, v) => { while (v >= 128) { a.push((v % 128) | 128); v = Math.floor(v / 128); } a.push(v); };
  const key = (a, f, wt) => vint(a, f * 8 + wt);
  const lenField = (a, f, sub) => { key(a, f, 2); vint(a, sub.length); for (const b of sub) a.push(b); };
  const strBytes = s => Array.from(Buffer.from(s, "utf8"));
  for (const L of layers) {
    const keys = [], kIdx = new Map(), vals = [], vIdx = new Map(), feats = [];
    for (const F of L.feats) {
      const tags = [];
      for (const k in F.P) {
        if (!kIdx.has(k)) { kIdx.set(k, keys.length); keys.push(k); }
        const v = F.P[k], vk = typeof v + ":" + v;
        if (!vIdx.has(vk)) { vIdx.set(vk, vals.length); vals.push(v); }
        tags.push(kIdx.get(k), vIdx.get(vk));
      }
      const fb = [];
      if (tags.length) { const pk = []; for (const t of tags) vint(pk, t); lenField(fb, 2, pk); }
      key(fb, 3, 0); vint(fb, F.type);
      const g = []; for (const c of F.geom) vint(g, c); lenField(fb, 4, g);
      feats.push(fb);
    }
    const lb = [];
    key(lb, 15, 0); vint(lb, 2);
    lenField(lb, 1, strBytes(L.name));
    for (const f of feats) lenField(lb, 2, f);
    for (const k of keys) lenField(lb, 3, strBytes(k));
    for (const v of vals) {
      const vb = [];
      if (typeof v === "string") lenField(vb, 1, strBytes(v));
      else if (typeof v === "boolean") { key(vb, 7, 0); vint(vb, v ? 1 : 0); }
      else if (Number.isInteger(v) && v >= 0) { key(vb, 5, 0); vint(vb, v); }
      else if (Number.isInteger(v)) { key(vb, 6, 0); vint(vb, -2 * v - 1); }
      else { key(vb, 3, 1); const b = Buffer.alloc(8); b.writeDoubleLE(v); for (const x of b) vb.push(x); }
      lenField(lb, 4, vb);
    }
    key(lb, 5, 0); vint(lb, L.ext);
    lenField(bytes, 3, lb);
  }
  return Buffer.from(bytes);
}
// Packs, sized for a static host (GitHub Pages) and phones:
//   overview.bin  every z10 tile (the whole-map view a run starts with) — small, loaded first
//   cNN.bin       the core of each place: the z14 tiles within CORE_M of its centre, so a run (dropped in the middle
//                 by default) starts with one small pack
//   pNN.bin       the rest of the z14 detail, grouped by z11 cell (~15 km) along a Hilbert curve into packs of
//                 ≈ 4 MB that stream in as you travel
//   Few files in all (GitHub's web upload takes < 100 at a time), none near the 25 MiB browser limit.
const CELL_Z = 11, PACK_TARGET = 6e6, CORE_M = 4500;   // uncompressed bytes per detail pack (≈ 4 MB once gzipped)
function hilbertD(n, x, y) {   // Hilbert-curve distance of (x, y) in an n × n grid (n a power of 2)
  let d = 0;
  for (let s = n >> 1; s > 0; s >>= 1) {
    const rx = (x & s) > 0 ? 1 : 0, ry = (y & s) > 0 ? 1 : 0;
    d += s * s * ((3 * rx) ^ ry);
    if (ry === 0) { if (rx === 1) { x = n - 1 - x; y = n - 1 - y; } const t = x; x = y; y = t; }
  }
  return d;
}
function packFile(out, name, blobs) {
  const head = Buffer.alloc(12 + blobs.length * 20);
  head.write("OSMP", 0, "latin1"); head.writeUInt8(1, 4); head.writeUInt8(CELL_Z, 5); head.writeUInt32LE(blobs.length, 8);
  let off = head.length;
  blobs.forEach(([z, x, y, b], i) => { const o = 12 + i * 20; head.writeUInt8(z, o); head.writeUInt32LE(x, o + 4); head.writeUInt32LE(y, o + 8); head.writeUInt32LE(off, o + 12); head.writeUInt32LE(b.length, o + 16); off += b.length; });
  const gz = zlib.gzipSync(Buffer.concat([head, ...blobs.map(b => b[3])]), { level: 9 });
  fs.writeFileSync(path.join(out, name + ".bin"), gz);
  return gz.length;
}
function pack(cache, out) {
  const { t14, t10 } = tileSet(), d = 14 - CELL_Z;
  fs.mkdirSync(out, { recursive: true });
  for (const f of fs.readdirSync(out)) if (/\.bin$/.test(f)) fs.unlinkSync(path.join(out, f));   // no stale packs
  const index = { v: 2, name: "Indiana", note: ATTRIBUTION, built: new Date().toISOString().slice(0, 10), z: 14, half: 24000, tiles: "",
    ovw: "overview", ovwZ: 10, cellZ: CELL_Z, cell: {}, tile: {}, cities: CITIES.map(([n, lat, lon, pop]) => ({ n, lat, lon, pop })), packs: {} };
  try { index.tiles = JSON.parse(fs.readFileSync(path.join(cache, "tilejson.json"), "utf8")).tiles[0].split("/")[4] || ""; } catch (e) { /* unknown */ }
  let rawTot = 0, outTot = 0, msAdded = 0;
  const useMs = fs.existsSync(path.join(cache, "ms14"));
  if (useMs) index.note += " · building footprints © Microsoft (ODbL)";
  const enc = (z, x, y) => {
    const f = path.join(cache, "raw" + z, x + "/" + y + ".pbf");
    if (!fs.existsSync(f)) { console.warn("missing", f); return null; }
    const raw = fs.readFileSync(f); rawTot += raw.length;
    if (!raw.length && !(z === 14 && useMs)) return null;
    const layers = decode(new Uint8Array(raw)).map(filterLayer).filter(Boolean);
    if (z === 14 && useMs) msAdded += addFootprints(layers, msRings(cache, x, y));
    return layers.length ? encode(layers) : null;
  };
  // 1. the overview
  const ob = [];
  for (const k of t10.slice().sort()) { const [x, y] = k.split("/").map(Number), b = enc(10, x, y); if (b) ob.push([10, x, y, b]); }
  const og = packFile(out, "overview", ob); index.packs.overview = { f: "overview.bin", b: og, n: ob.length }; outTot += og;
  // 2. the cores: each place's centre tiles (first place first — a tile shared by two cores stays in the first)
  const inSet = new Set(t14), taken = new Set();
  let ci = 0;
  for (const [, lat, lon] of (pack.spots || CITIES)) {
    const dlat = CORE_M / 110574, dlon = CORE_M / (111320 * Math.cos(lat * Math.PI / 180)), blobs = [];
    for (let y = Math.floor(lat2y(lat + dlat, 14)); y <= Math.floor(lat2y(lat - dlat, 14)); y++)
      for (let x = Math.floor(lon2x(lon - dlon, 14)); x <= Math.floor(lon2x(lon + dlon, 14)); x++) {
        const k = x + "/" + y; if (!inSet.has(k) || taken.has(k)) continue;
        taken.add(k); const b = enc(14, x, y); if (b) blobs.push([14, x, y, b]);
      }
    if (!blobs.length) continue;
    const name = "c" + String(ci++).padStart(2, "0"), gz = packFile(out, name, blobs);
    index.packs[name] = { f: name + ".bin", b: gz, n: blobs.length };
    for (const [, x, y] of blobs) index.tile[x + "_" + y] = name;
    outTot += gz;
  }
  // 3. the rest: z11 cells along a Hilbert curve, cut into ≈ PACK_TARGET packs (and at every gap between places)
  const cells = new Map();
  for (const k of t14) { if (taken.has(k)) continue; const [x, y] = k.split("/").map(Number), ck = (x >> d) + "_" + (y >> d); if (!cells.has(ck)) cells.set(ck, []); cells.get(ck).push([x, y]); }
  const cx = [...cells.keys()].map(k => k.split("_").map(Number)), minX = Math.min(...cx.map(c => c[0])), minY = Math.min(...cx.map(c => c[1]));
  let n = 1; while (n <= Math.max(...cx.map(c => Math.max(c[0] - minX, c[1] - minY)))) n <<= 1;
  const order = cx.map(([x, y]) => ({ x, y, h: hilbertD(n, x - minX, y - minY) })).sort((a, b) => a.h - b.h);
  let cur = [], curB = 0, curCells = [], prev = null, pi = 0;
  const flush = () => {
    if (!cur.length) { curCells = []; return; }
    const name = "p" + String(pi++).padStart(2, "0"), gz = packFile(out, name, cur);
    index.packs[name] = { f: name + ".bin", b: gz, n: cur.length };
    for (const c of curCells) index.cell[c] = name;
    outTot += gz; cur = []; curB = 0; curCells = [];
  };
  for (const c of order) {
    const blobs = [];
    for (const [x, y] of cells.get(c.x + "_" + c.y).sort((a, b) => a[1] - b[1] || a[0] - b[0])) { const b = enc(14, x, y); if (b) blobs.push([14, x, y, b]); }
    const sz = blobs.reduce((t, b) => t + b[3].length, 0);
    const gap = prev && Math.max(Math.abs(prev.x - c.x), Math.abs(prev.y - c.y)) > 2;
    if (cur.length && (gap || curB + sz > PACK_TARGET)) flush();
    cur.push(...blobs); curB += sz; curCells.push(c.x + "_" + c.y); prev = c;
  }
  flush();
  fs.writeFileSync(path.join(out, "index.json"), JSON.stringify(index));
  license(out, index);
  console.log("done:", Object.keys(index.packs).length, "packs (" + ci + " core + " + pi + " detail + overview), raw MB", (rawTot / 1e6).toFixed(1), "→ out MB", (outTot / 1e6).toFixed(1),
    "· biggest MB", (Math.max(...Object.values(index.packs).map(p => p.b)) / 1e6).toFixed(2), useMs ? "· footprints added " + msAdded : "· no footprints (run `footprints` first)");
}

// Microsoft US Building Footprints (ODbL, computer-traced from imagery) fill in the houses OpenStreetMap hasn't mapped
// yet — most small Indiana towns have only a handful of buildings in OSM. Streamed from the state GeoJSON (one
// feature per line), every footprint inside the built-in places goes to <cache>/ms14/<x>_<y>.bin (each tile its bbox
// touches: u16 n, then n × i16 x,y in tile units); `pack` then adds the ones OSM doesn't already have.
const MS_URL = "https://minedbuildings.z5.web.core.windows.net/legacy/usbuildings-v2/Indiana.geojson.zip";
async function footprints(cache, src) {
  src = src || path.join(cache, "ms", "Indiana.geojson.zip");
  if (!fs.existsSync(src)) { console.log("get it first:  curl -o " + src + " " + MS_URL); return; }
  const want = new Set(tileSet().t14), dir = path.join(cache, "ms14");
  fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
  const child = /\.zip$/i.test(src) ? require("child_process").spawn("unzip", ["-p", src]) : null;
  const rl = require("readline").createInterface({ input: child ? child.stdout : fs.createReadStream(src), crlfDelay: Infinity });
  const buf = new Map(); let held = 0, n = 0, kept = 0, rings = 0;
  const flush = () => { for (const [k, arr] of buf) fs.appendFileSync(path.join(dir, k + ".bin"), Buffer.concat(arr)); buf.clear(); held = 0; };
  for await (const line of rl) {
    const i = line.indexOf('"coordinates":'); if (i < 0) continue;
    n++;
    let g; try { g = JSON.parse(line.trim().replace(/,$/, "")).geometry; } catch (e) { continue; }
    const polys = g.type === "Polygon" ? [g.coordinates] : g.type === "MultiPolygon" ? g.coordinates : [];
    let any = false;
    for (const pg of polys) {
      const r = pg[0]; if (!r || r.length < 4) continue;
      let a = 1e9, b = -1e9, c = 1e9, d = -1e9;
      for (const [lon, lat] of r) { if (lon < a) a = lon; if (lon > b) b = lon; if (lat < c) c = lat; if (lat > d) d = lat; }
      const X = r.map(q => lon2x(q[0], 14)), Y = r.map(q => lat2y(q[1], 14));
      for (let x = Math.floor(lon2x(a, 14)); x <= Math.floor(lon2x(b, 14)); x++)
        for (let y = Math.floor(lat2y(d, 14)); y <= Math.floor(lat2y(c, 14)); y++) {
          const k = x + "/" + y; if (!want.has(k)) continue;
          const m = r.length - 1, bb = Buffer.alloc(2 + m * 4);   // the closing point is implied
          bb.writeUInt16LE(m, 0);
          for (let j = 0; j < m; j++) { bb.writeInt16LE(Math.round((X[j] - x) * 4096), 2 + j * 4); bb.writeInt16LE(Math.round((Y[j] - y) * 4096), 4 + j * 4); }
          const fk = x + "_" + y; if (!buf.has(fk)) buf.set(fk, []); buf.get(fk).push(bb); held += bb.length; rings++; any = true;
        }
    }
    if (any) kept++;
    if (held > 48e6) flush();
    if (n % 500000 === 0) console.log("  ", n, "footprints read,", kept, "inside the places");
  }
  flush();
  console.log("footprints:", n, "read ·", kept, "inside the built-in places ·", rings, "tile rings ·", fs.readdirSync(dir).length, "tiles");
}
function msRings(cache, x, y) {   // → [[x, y], …] rings in tile units, or []
  const f = path.join(cache, "ms14", x + "_" + y + ".bin");
  if (!fs.existsSync(f)) return [];
  const b = fs.readFileSync(f), out = [];
  for (let o = 0; o + 2 <= b.length;) { const m = b.readUInt16LE(o); o += 2; const r = []; for (let j = 0; j < m; j++, o += 4) r.push([b.readInt16LE(o), b.readInt16LE(o + 2)]); out.push(r); }
  return out;
}
// rings of a decoded polygon feature (MVT command stream → [[x, y], …][])
function geomRings(g) {
  const out = []; let x = 0, y = 0, cur = null, i = 0;
  while (i < g.length) { const c = g[i++], id = c & 7, n = c >> 3; if (id === 1 || id === 2) { for (let k = 0; k < n; k++) { const a = g[i++], b = g[i++]; x += (a >>> 1) ^ -(a & 1); y += (b >>> 1) ^ -(b & 1); if (id === 1) { cur = [[x, y]]; out.push(cur); } else cur.push([x, y]); } } }
  return out;
}
function ringGeom(r) {   // one closed ring → MVT commands (MoveTo, LineTo × n-1, ClosePath)
  const zz = v => (v << 1) ^ (v >> 31), g = [9, zz(r[0][0]), zz(r[0][1]), 2 | ((r.length - 1) << 3)];
  for (let k = 1; k < r.length; k++) g.push(zz(r[k][0] - r[k - 1][0]), zz(r[k][1] - r[k - 1][1]));
  g.push(15);
  return g;
}
function pip(px, py, r) { let c = false; for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const [xi, yi] = r[i], [xj, yj] = r[j]; if ((yi > py) !== (yj > py) && px < (xj - xi) * (py - yi) / (yj - yi) + xi) c = !c; } return c; }
// add the footprints OSM doesn't have to a tile's building layer (a footprint is OSM's already when its middle lies in
// an OSM building or its box mostly overlaps one); returns how many were added
function addFootprints(layers, ms) {
  if (!ms.length) return 0;
  let L = layers.find(l => l.name === "building");
  if (!L) { L = { name: "building", ext: 4096, feats: [] }; layers.push(L); }
  const osm = [];
  for (const F of L.feats) if (F.type === 3) for (const r of geomRings(F.geom)) { if (r.length < 3) continue; let a = 1e9, b = 1e9, c = -1e9, d = -1e9; for (const [x, y] of r) { if (x < a) a = x; if (y < b) b = y; if (x > c) c = x; if (y > d) d = y; } osm.push({ r, bb: [a, b, c, d] }); }
  const G = 64, grid = new Map(), cell = v => Math.max(-4, Math.min(G + 4, Math.floor(v / 64)));
  osm.forEach((o, i) => { for (let gx = cell(o.bb[0]); gx <= cell(o.bb[2]); gx++) for (let gy = cell(o.bb[1]); gy <= cell(o.bb[3]); gy++) { const k = gx * 1000 + gy; if (!grid.has(k)) grid.set(k, []); grid.get(k).push(i); } });
  let added = 0;
  for (const r of ms) {
    let a = 1e9, b = 1e9, c = -1e9, d = -1e9, sx = 0, sy = 0;
    for (const [x, y] of r) { if (x < a) a = x; if (y < b) b = y; if (x > c) c = x; if (y > d) d = y; sx += x; sy += y; }
    if (c <= 0 || d <= 0 || a >= 4096 || b >= 4096) continue;
    const mx = sx / r.length, my = sy / r.length, area = Math.max(1, (c - a) * (d - b));
    let dup = false;
    const seen = new Set();
    for (let gx = cell(a); gx <= cell(c) && !dup; gx++) for (let gy = cell(b); gy <= cell(d) && !dup; gy++) {
      for (const i of grid.get(gx * 1000 + gy) || []) {
        if (seen.has(i)) continue; seen.add(i);
        const o = osm[i], ox = Math.min(c, o.bb[2]) - Math.max(a, o.bb[0]), oy = Math.min(d, o.bb[3]) - Math.max(b, o.bb[1]);
        if (ox <= 0 || oy <= 0) continue;
        if (ox * oy > 0.3 * area || pip(mx, my, o.r)) { dup = true; break; }
      }
    }
    if (dup) continue;
    L.feats.push({ type: 3, geom: ringGeom(r), P: { src: "ms" } });
    added++;
  }
  return added;
}

// the map data's licence travels with the packs (ODbL share-alike: the derived tiles stay open under the same terms)
const ATTRIBUTION = "OpenFreeMap © OpenMapTiles · Data from OpenStreetMap (© OpenStreetMap contributors, ODbL)";
function license(out, index) {
  index = index || JSON.parse(fs.readFileSync(path.join(out, "index.json"), "utf8"));
  const md = [
    "# Offline map data — licence & attribution",
    "",
    "These files (`index.json`, `overview.bin`, `cNN.bin`, `pNN.bin`) are the built-in real maps of Omni-Shift: " + (index.cities || []).map(c => c.n).join(", ") + " — 48 km across each.",
    "Each `.bin` is a gzip pack of OpenMapTiles-schema vector tiles (`overview.bin`: zoom 10; `cNN`: the middle of each place, zoom 14; `pNN`: the rest, zoom 14), filtered to what the game draws.",
    "",
    "**" + ATTRIBUTION + "**",
    "",
    "- Map data © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright), available under the [Open Database License (ODbL) 1.0](https://opendatacommons.org/licenses/odbl/1-0/).",
    "  These packs are a derived database of OpenStreetMap and are offered under the same licence: you may copy, share and adapt them as long as you credit OpenStreetMap and keep any adapted version open under the ODbL.",
    "- Vector tile schema © [OpenMapTiles](https://openmaptiles.org/) (CC-BY 4.0); tiles served by [OpenFreeMap](https://openfreemap.org/).",
    ...(/Microsoft/.test(index.note || "") ? ["- Where OpenStreetMap has no buildings yet (most small towns), the houses are [Microsoft US Building Footprints](https://github.com/microsoft/USBuildingFootprints) © Microsoft, also under the ODbL 1.0 — computer-traced from aerial imagery, so a few may be missing, out of date or slightly off. Those features carry `src=ms`."] : []),
    "- City list and coordinates: [GeoNames](https://www.geonames.org/) (CC-BY 4.0), populations from the 2020 US census (GeoNames estimates for the smallest towns).",
    "",
    "Tiles version `" + (index.tiles || "unknown") + "` · packed " + (index.built || "") + " · " + Object.keys(index.packs || {}).length + " packs.",
    "Rebuild or refresh with `node tools/realmap-build.js download <cache>`, `footprints <cache>`, then `pack <cache> <out>` (see the tool's header).",
    "",
    "Real places, streets and businesses appear in the game only because they are on the map; none of them is affiliated with or endorses the game.",
    ""
  ].join("\n");
  fs.writeFileSync(path.join(out, "LICENSE.md"), md);
}

// a small test fixture: only the tiles round a few points (QA uses ?realdata=/qa/fixtures/realmap/)
function fixture(cache, out, spots) {
  const t14 = new Set();
  for (const [lat, lon, r] of spots) {
    const dlat = r / 110574, dlon = r / (111320 * Math.cos(lat * Math.PI / 180));
    for (let x = Math.floor(lon2x(lon - dlon, 14)); x <= Math.floor(lon2x(lon + dlon, 14)); x++) for (let y = Math.floor(lat2y(lat + dlat, 14)); y <= Math.floor(lat2y(lat - dlat, 14)); y++) t14.add(x + "/" + y);
  }
  const t10 = new Set([...t14].map(k => { const [x, y] = k.split("/").map(Number); return (x >> 4) + "/" + (y >> 4); }));
  const keep = { t14: [...t14], t10: [...t10] };
  const _ts = tileSet; tileSet = () => keep; pack.spots = spots.map(([lat, lon]) => ["", lat, lon]);
  try { pack(cache, out); } finally { tileSet = _ts; pack.spots = null; }
  console.log("fixture tiles", t14.size, "+", t10.size, "z10");
}

const [cmd, a, b, ...rest] = process.argv.slice(2);
if (cmd === "download" && a) download(a);
else if (cmd === "pack" && a && b) pack(a, b);
else if (cmd === "license" && a) license(a);
else if (cmd === "footprints" && a) footprints(a, b);
else if (cmd === "fixture" && a && b) fixture(a, b, (rest.length ? rest : ["39.76838,-86.15804,2900"]).map(t => t.split(",").map(Number)));
else console.log("usage:\n  node tools/realmap-build.js download <cacheDir>\n  node tools/realmap-build.js footprints <cacheDir> [Indiana.geojson.zip]\n  node tools/realmap-build.js pack <cacheDir> <outDir>\n  node tools/realmap-build.js license <outDir>\n  node tools/realmap-build.js fixture <cacheDir> <outDir> [lat,lon,radius_m …]");
