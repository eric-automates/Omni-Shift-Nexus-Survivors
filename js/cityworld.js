/* =========================================================================
   OMNI-SHIFT v14 — NEXUS CITY · RUNTIME WORLD
   Rasterises the generator (js/citygen.js) into 64 m chunks of 0.5 m tiles
   and answers every spatial question the game asks:

   • flags per tile: MOVE (walls, furniture, cars, fences, trunks), SIGHT
     (walls, closed doors, tall shelves, privacy fences), SHOT (things a bullet
     hits), WINDOW, DOOR, INDOOR, LOW (hover-able furniture), WATER
   • kind per tile: wood / brick / masonry / metal exterior wall, interior
     wall, door, window, car, fence… — drives sound transmission loss, bullet
     ricochets and impact effects
   • building id per tile (which building am I in? whose roof is this?)
   • circle collision with wall sliding, grid ray casts, doors that swing open
     for anyone who walks up (closed doors block sight & muffle sound),
     windows that shatter, a shadow-cast line-of-sight grid for the fog of war

   Local frame: local px = world px − (CITY.orx, CITY.ory). The drop zone maps
   to local (256, 256), so all classic code keeps working unchanged.
   ========================================================================= */
"use strict";

const F_MOVE = 1, F_SIGHT = 2, F_SHOT = 4, F_WIN = 8, F_DOOR = 16, F_IN = 32, F_LOW = 64, F_WATER = 128;
const K_NONE = 0, K_EXT_WOOD = 1, K_EXT_BRICK = 2, K_EXT_MASON = 3, K_EXT_METAL = 4, K_INT = 5, K_DOOR = 6, K_EDOOR = 7, K_WIN = 8, K_GDOOR = 9,
  K_BARS = 10, K_COUNTER = 11, K_FURN = 12, K_FURN_HARD = 13, K_CAR = 14, K_FENCE_WOOD = 15, K_FENCE_CHAIN = 16, K_FENCE_PICKET = 17, K_TREE = 18,
  K_WATER = 19, K_POLE = 20, K_STONE = 21, K_HEDGE = 22;
const CH = 128, CH_MASK = 127;

const cityRT = {
  chunks: new Map(), last: null, lastKey: -1,
  doors: new Map(),            // door id -> runtime door
  broken: new Set(),           // broken window tile keys
  used: new Set(),             // used / removed prop keys (cars you drove off, looted caches)
  dyn: [],                     // dynamic props (parked vehicles you left behind)
  spawnState: new Map(),       // spawn id -> { left, active }
  visGen: 0, buildMs: 0, built: 0
};
function cityKeyT(x, y) { return y * 131072 + x; }

/* --- 1. CHUNKS -------------------------------------------------------------- */
function cityChunk(cx, cy) {
  const key = cx * 4096 + cy;
  if (key === cityRT.lastKey && cityRT.last) return cityRT.last;
  let C = cityRT.chunks.get(key);
  if (!C) {
    C = cityBuildChunk(cx, cy);
    cityRT.chunks.set(key, C);
    if (cityRT.chunks.size > 150) {   // LRU-ish: drop the oldest that is far from the player
      const pcx = cityPlayerChunk();
      for (const [k, v] of cityRT.chunks) {
        if (Math.abs(v.cx - pcx[0]) > 3 || Math.abs(v.cy - pcx[1]) > 3) { cityRT.chunks.delete(k); if (cityRT.chunks.size <= 120) break; }
      }
    }
  }
  cityRT.last = C; cityRT.lastKey = key;
  return C;
}
function cityPlayerChunk() {
  if (typeof player === "undefined" || !player) return [0, 0];
  return [Math.floor((player.x + CITY.orx) / 16) >> 7, Math.floor((player.y + CITY.ory) / 16) >> 7];
}
function cityBuildChunk(cx, cy) {
  const t0 = (typeof performance !== "undefined") ? performance.now() : 0;
  const x0 = cx * CH, y0 = cy * CH;
  const C = { cx, cy, x0, y0, flags: new Uint8Array(CH * CH), kind: new Uint8Array(CH * CH), bid: new Int16Array(CH * CH).fill(-1),
    blds: [], doors: new Map(), props: [], surf: [], fences: [], trees: [], spawns: [], caches: [] };
  if (cx < 0 || cy < 0 || x0 >= CITY.WORLD_T || y0 >= CITY.WORLD_T) { C.flags.fill(F_MOVE | F_SIGHT | F_SHOT); return C; }
  const blocks = cityBlocksInRect(x0 / 2, y0 / 2, (x0 + CH) / 2, (y0 + CH) / 2);
  const inC = (x, y, w, h) => x < x0 + CH && y < y0 + CH && x + w > x0 && y + h > y0;
  const stamp = (x, y, w, h, fl, kd, onlyEmpty) => {
    const xa = Math.max(x0, Math.floor(x)), ya = Math.max(y0, Math.floor(y)), xb = Math.min(x0 + CH, Math.ceil(x + w)), yb = Math.min(y0 + CH, Math.ceil(y + h));
    for (let yy = ya; yy < yb; yy++) for (let xx = xa; xx < xb; xx++) {
      const i = ((yy - y0) << 7) | (xx - x0);
      if (onlyEmpty && (C.flags[i] & (F_MOVE | F_IN))) continue;
      C.flags[i] |= fl; if (kd) C.kind[i] = kd;
    }
  };
  for (const B of blocks) {
    // surfaces: water bodies & pools block movement
    for (const s of B.surf) {
      if (!inC(s.x0, s.y0, s.x1 - s.x0, s.y1 - s.y0)) continue;
      C.surf.push(s);
      if (s.t === "water" || s.t === "pool") {
        if (s.t === "pool") stamp(s.x0, s.y0, s.x1 - s.x0, s.y1 - s.y0, F_MOVE | F_WATER, K_WATER);
        else {   // elliptical lake
          const cxm = (s.x0 + s.x1) / 2, cym = (s.y0 + s.y1) / 2, rx = (s.x1 - s.x0) / 2, ry = (s.y1 - s.y0) / 2;
          const xa = Math.max(x0, s.x0), ya = Math.max(y0, s.y0), xb = Math.min(x0 + CH, s.x1), yb = Math.min(y0 + CH, s.y1);
          for (let yy = ya; yy < yb; yy++) for (let xx = xa; xx < xb; xx++) { const dx = (xx + 0.5 - cxm) / rx, dy = (yy + 0.5 - cym) / ry; if (dx * dx + dy * dy < 1) { const i = ((yy - y0) << 7) | (xx - x0); C.flags[i] |= F_MOVE | F_WATER; C.kind[i] = K_WATER; } }
        }
      }
    }
    // fences
    for (const f of B.fences) {
      const w = Math.max(1, f.x1 - f.x0), h = Math.max(1, f.y1 - f.y0);
      if (!inC(f.x0, f.y0, w, h)) continue;
      C.fences.push(f);
      const fl = f.kind === "wood" ? F_MOVE | F_SIGHT : f.kind === "stone" ? F_MOVE | F_SIGHT | F_SHOT : F_MOVE;
      const kd = f.kind === "wood" ? K_FENCE_WOOD : f.kind === "chain" ? K_FENCE_CHAIN : f.kind === "stone" ? K_STONE : K_FENCE_PICKET;
      stamp(f.x0, f.y0, w, h, fl, kd, true);
    }
    // props
    for (let pi = 0; pi < B.props.length; pi++) {
      const p = B.props[pi];
      if (!inC(p.x, p.y, p.w, p.h)) continue;
      const key = B.key + "|" + pi;
      if (cityRT.used.has(key)) continue;
      p.key = key;
      C.props.push(p);
      if (p.t === "tree") { C.trees.push(p); stamp(p.x, p.y, 1, 1, F_MOVE | F_SHOT, K_TREE); continue; }
      if (!p.s) continue;
      const fl = p.s === FS_TALL ? F_MOVE | F_SIGHT | F_SHOT : p.s === FS_COVER ? F_MOVE | F_SHOT : F_MOVE | F_LOW;
      const kd = p.t === "car" || p.t === "bus" || p.t === "trailer" || p.t === "armytruck" || p.t === "tractor" ? K_CAR : p.t === "hedge" ? K_HEDGE
        : (p.t === "fountain" || p.t === "statue" || p.t === "silo") ? K_STONE : K_POLE;
      if (p.ang && p.t === "car") stamp(p.x + p.w * 0.15, p.y + p.h * 0.15, p.w * 0.7, p.h * 0.7, fl, kd, true);
      else stamp(p.x, p.y, p.w, p.h, fl, kd, true);
    }
    // buildings
    for (const b of B.blds) {
      if (!inC(b.x, b.y, b.w, b.h)) continue;
      const bi = C.blds.length; C.blds.push(b);
      const G = cityInterior(b), extK = b.mat === "wood" ? K_EXT_WOOD : b.mat === "brick" ? K_EXT_BRICK : b.mat === "metal" ? K_EXT_METAL : K_EXT_MASON;
      const xa = Math.max(x0, b.x), ya = Math.max(y0, b.y), xb = Math.min(x0 + CH, b.x + G.w), yb = Math.min(y0 + CH, b.y + G.h);
      for (let yy = ya; yy < yb; yy++) for (let xx = xa; xx < xb; xx++) {
        const v = G.c[(yy - b.y) * G.w + (xx - b.x)];
        if (v === IC_OUT) continue;
        const i = ((yy - y0) << 7) | (xx - x0);
        C.bid[i] = bi;
        let fl = F_IN, kd = K_NONE;
        switch (v) {
          case IC_EXT: fl |= F_MOVE | F_SIGHT | F_SHOT; kd = extK; break;
          case IC_INT: fl |= F_MOVE | F_SIGHT | F_SHOT; kd = K_INT; break;
          case IC_DOOR: fl |= F_DOOR; kd = K_DOOR; break;
          case IC_EDOOR: fl |= F_DOOR; kd = K_EDOOR; break;
          case IC_WIN: if (cityRT.broken.has(cityKeyT(xx, yy))) { fl |= F_LOW; kd = K_WIN; } else { fl |= F_MOVE | F_WIN; kd = K_WIN; } break;   // broken panes can be climbed through
          case IC_GDOOR: fl |= F_MOVE | F_SIGHT | F_SHOT; kd = K_GDOOR; break;
          case IC_BARS: fl |= F_MOVE; kd = K_BARS; break;
          case IC_COUNTER: fl |= F_MOVE | F_LOW; kd = K_COUNTER; break;
          default: break;
        }
        C.flags[i] = fl; C.kind[i] = kd;
      }
      for (const f of G.furn) {
        if (!f.s) continue;
        const fx = b.x + f.x, fy = b.y + f.y;
        if (!inC(fx, fy, f.w, f.h)) continue;
        const fl = f.s === FS_TALL ? F_MOVE | F_SIGHT | F_SHOT : f.s === FS_COVER ? F_MOVE | F_SHOT : F_MOVE | F_LOW;
        const kd = f.s === FS_TALL || f.t === "car" || f.t === "firetruck" || f.t === "carlift" ? (f.t === "car" || f.t === "firetruck" ? K_CAR : K_FURN_HARD) : K_FURN;
        const xa2 = Math.max(x0, Math.floor(fx)), ya2 = Math.max(y0, Math.floor(fy)), xb2 = Math.min(x0 + CH, Math.ceil(fx + f.w)), yb2 = Math.min(y0 + CH, Math.ceil(fy + f.h));
        for (let yy = ya2; yy < yb2; yy++) for (let xx = xa2; xx < xb2; xx++) { const i = ((yy - y0) << 7) | (xx - x0); if ((C.flags[i] & (F_MOVE | F_DOOR)) === 0) { C.flags[i] |= fl; C.kind[i] = kd; } }
      }
      // doors: one runtime record per door (state survives chunk rebuilds)
      G.doors.forEach((d, k) => {
        const id = b.uid + ":" + k;
        let D = cityRT.doors.get(id);
        if (!D) {
          const open0 = d.ext ? 0 : (cF(cH(b.seed, k, 3, 1)) < 0.62 ? 1 : 0);
          D = { id, x: b.x + d.x, y: b.y + d.y, len: d.len, axis: d.axis, ext: d.ext, open: open0, target: open0, hold: 0, req: 0, bid: b.uid, auto: d.ext, mat: b.mat };
          cityRT.doors.set(id, D);
        }
        for (let q = 0; q < D.len; q++) {
          const xx = D.axis === "x" ? D.x + q : D.x, yy = D.axis === "x" ? D.y : D.y + q;
          if (xx < x0 || yy < y0 || xx >= x0 + CH || yy >= y0 + CH) continue;
          const i = ((yy - y0) << 7) | (xx - x0);
          C.doors.set(i, D);
          if (D.open < 0.5) C.flags[i] |= F_SIGHT; else C.flags[i] &= ~F_SIGHT;
        }
      });
      // supply caches (looted ones are remembered)
      if (b.cache === undefined) b.cache = cF(cH(b.seed, 7, 7, 7)) < (b.type === "house" || b.type === "farmhouse" ? 0.32 : b.type === "shed" ? 0.25 : 0.6);
      if (b.cache && !cityRT.used.has("cache|" + b.uid) && G.spawnRooms.length) {
        const rm = G.rooms[G.spawnRooms[Math.floor(cF(cH(b.seed, 9, 1, 2)) * G.spawnRooms.length)]];
        if (rm) {
          const cxT = b.x + rm.x + Math.floor(rm.w / 2), cyT = b.y + rm.y + Math.floor(rm.h / 2);
          if (cxT >= x0 && cyT >= y0 && cxT < x0 + CH && cyT < y0 + CH && !C.caches.some(c => c.uid === b.uid)) C.caches.push({ uid: b.uid, x: cxT, y: cyT, b });
        }
      }
    }
    for (const s of B.spawns) {
      let ax, ay;
      if (s.bkey) { const b = B.blds.find(q => q.key === s.bkey); if (!b) continue; ax = b.x + b.w / 2; ay = b.y + b.h / 2; }
      else if (s.pts) { ax = s.pts[0][0]; ay = s.pts[0][1]; } else { ax = s.x; ay = s.y; }
      if (ax >= x0 && ay >= y0 && ax < x0 + CH && ay < y0 + CH) C.spawns.push(Object.assign({ ax, ay, B }, s));
    }
  }
  // woods: scattered trees, deterministic per chunk
  const woods = C.surf.filter(s => s.t === "woods");
  if (woods.length) {
    const r = cRng(cH(CITY.seed, cx, cy, 515));
    for (let k = 0; k < 140; k++) {
      const x = x0 + r() * CH, y = y0 + r() * CH;
      if (!woods.some(s => x >= s.x0 && x < s.x1 && y >= s.y0 && y < s.y1)) continue;
      const i = ((Math.floor(y) - y0) << 7) | (Math.floor(x) - x0);
      if (C.flags[i] & (F_MOVE | F_IN)) continue;
      const t = { t: "tree", x, y, w: 1, h: 1, s: FS_COVER, v: Math.floor(r() * 4), sz: 0.9 + r() * 0.8, wild: 1 };
      C.trees.push(t); C.props.push(t);
      C.flags[i] |= F_MOVE | F_SHOT; C.kind[i] = K_TREE;
    }
  }
  // dynamic props (vehicles left behind)
  for (const d of cityRT.dyn) if (inC(d.x, d.y, d.w, d.h)) { C.props.push(d); stamp(d.x, d.y, d.w, d.h, F_MOVE | F_SHOT, K_CAR, true); }
  cityRT.built++;
  if (t0) cityRT.buildMs = performance.now() - t0;
  return C;
}
// re-rasterise a chunk in place (after a prop was removed / added)
function cityRebuildAt(wtx, wty) {
  const cx = wtx >> 7, cy = wty >> 7, key = cx * 4096 + cy;
  cityRT.chunks.delete(key); if (cityRT.lastKey === key) { cityRT.last = null; cityRT.lastKey = -1; }
  if (typeof cityRenderInvalidate === "function") cityRenderInvalidate(wtx * 16 - CITY.orx - 600, wty * 16 - CITY.ory - 600, 1200, 1200);
}

/* --- 2. TILE QUERIES -------------------------------------------------------- */
function cityFlagsT(x, y) {
  if (x < 0 || y < 0 || x >= CITY.WORLD_T || y >= CITY.WORLD_T) return F_MOVE | F_SIGHT | F_SHOT;
  const C = cityChunk(x >> 7, y >> 7);
  return C.flags[((y & CH_MASK) << 7) | (x & CH_MASK)];
}
function cityKindT(x, y) {
  if (x < 0 || y < 0 || x >= CITY.WORLD_T || y >= CITY.WORLD_T) return K_EXT_MASON;
  const C = cityChunk(x >> 7, y >> 7);
  return C.kind[((y & CH_MASK) << 7) | (x & CH_MASK)];
}
function cityBldT(x, y) {   // building object at a world tile, or null
  if (x < 0 || y < 0 || x >= CITY.WORLD_T || y >= CITY.WORLD_T) return null;
  const C = cityChunk(x >> 7, y >> 7), bi = C.bid[((y & CH_MASK) << 7) | (x & CH_MASK)];
  return bi >= 0 ? C.blds[bi] : null;
}
function cityDoorT(x, y) {
  if (x < 0 || y < 0) return null;
  const C = cityChunk(x >> 7, y >> 7);
  return C.doors.get(((y & CH_MASK) << 7) | (x & CH_MASK)) || null;
}
// local px -> world tile
function cityTX(lx) { return Math.floor((lx + CITY.orx) / 16); }
function cityTY(ly) { return Math.floor((ly + CITY.ory) / 16); }
function cityFlagsAt(lx, ly) { return cityFlagsT(cityTX(lx), cityTY(ly)); }
function cityBuildingAt(lx, ly) {
  const b = cityBldT(cityTX(lx), cityTY(ly));
  if (!b) return null;
  // only count tiles that are floor / door (standing in a wall does not count as inside)
  const f = cityFlagsAt(lx, ly);
  return (f & F_IN) ? b : null;
}
// metres -> local px
function cityLX(m) { return m * 32 - CITY.orx; }
function cityLY(m) { return m * 32 - CITY.ory; }
function cityWorldM(lx, ly) { return [(lx + CITY.orx) / 32, (ly + CITY.ory) / 32]; }

/* --- 3. COLLISION ----------------------------------------------------------- */
// true if a circle of radius r at local (x, y) overlaps a blocking tile
function cityCircleBlocked(x, y, r, ignoreLow) {
  const wx = x + CITY.orx, wy = y + CITY.ory;
  const tx0 = Math.floor((wx - r) / 16), tx1 = Math.floor((wx + r) / 16), ty0 = Math.floor((wy - r) / 16), ty1 = Math.floor((wy + r) / 16);
  for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) {
    const f = cityFlagsT(tx, ty);
    if (!(f & F_MOVE) || (ignoreLow && (f & F_LOW))) continue;
    const nx = Math.max(tx * 16, Math.min(wx, tx * 16 + 16)), ny = Math.max(ty * 16, Math.min(wy, ty * 16 + 16));
    const dx = wx - nx, dy = wy - ny;
    if (dx * dx + dy * dy < r * r) return true;
  }
  return false;
}
// push a circle out of blocking tiles; returns [x, y]
const _cityOut = [0, 0];
function cityResolve(x, y, r, ignoreLow) {
  let wx = x + CITY.orx, wy = y + CITY.ory;
  for (let pass = 0; pass < 3; pass++) {
    let moved = false;
    const tx0 = Math.floor((wx - r) / 16), tx1 = Math.floor((wx + r) / 16), ty0 = Math.floor((wy - r) / 16), ty1 = Math.floor((wy + r) / 16);
    for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) {
      const f = cityFlagsT(tx, ty);
      if (!(f & F_MOVE) || (ignoreLow && (f & F_LOW))) continue;
      const nx = Math.max(tx * 16, Math.min(wx, tx * 16 + 16)), ny = Math.max(ty * 16, Math.min(wy, ty * 16 + 16));
      let dx = wx - nx, dy = wy - ny; const d2 = dx * dx + dy * dy;
      if (d2 >= r * r) continue;
      if (d2 < 1e-6) {   // centre inside the tile: push out along the shortest axis
        const l = wx - tx * 16, rr = tx * 16 + 16 - wx, t = wy - ty * 16, b = ty * 16 + 16 - wy, m = Math.min(l, rr, t, b);
        if (m === l) wx -= l + r; else if (m === rr) wx += rr + r; else if (m === t) wy -= t + r; else wy += b + r;
      } else { const d = Math.sqrt(d2), push = r - d; wx += dx / d * push; wy += dy / d * push; }
      moved = true;
    }
    if (!moved) break;
  }
  _cityOut[0] = wx - CITY.orx; _cityOut[1] = wy - CITY.ory;
  return _cityOut;
}

/* --- 4. RAY CASTS (Amanatides & Woo grid traversal) ---------------------------- */
const cityHit = { hit: false, t: 1, tx: 0, ty: 0, nx: 0, ny: 0, f: 0, k: 0, x: 0, y: 0 };
// mask: tile flags that stop the ray. Returns cityHit (shared object).
function cityRay(x0, y0, x1, y1, mask, maxSteps = 600) {
  const ax = x0 + CITY.orx, ay = y0 + CITY.ory, bx = x1 + CITY.orx, by = y1 + CITY.ory;
  const dx = bx - ax, dy = by - ay;
  let tx = Math.floor(ax / 16), ty = Math.floor(ay / 16);
  const ex = Math.floor(bx / 16), ey = Math.floor(by / 16);
  const sx = dx > 0 ? 1 : -1, sy = dy > 0 ? 1 : -1;
  const tdx = dx !== 0 ? Math.abs(16 / dx) : 1e9, tdy = dy !== 0 ? Math.abs(16 / dy) : 1e9;
  let tmx = dx !== 0 ? ((sx > 0 ? (tx + 1) * 16 - ax : ax - tx * 16) / Math.abs(dx)) : 1e9;
  let tmy = dy !== 0 ? ((sy > 0 ? (ty + 1) * 16 - ay : ay - ty * 16) / Math.abs(dy)) : 1e9;
  let nx = 0, ny = 0, t = 0;
  cityHit.hit = false; cityHit.t = 1;
  for (let s = 0; s < maxSteps; s++) {
    if (s > 0) {
      const f = cityFlagsT(tx, ty);
      if (f & mask) {
        cityHit.hit = true; cityHit.t = t; cityHit.tx = tx; cityHit.ty = ty; cityHit.nx = nx; cityHit.ny = ny; cityHit.f = f; cityHit.k = cityKindT(tx, ty);
        cityHit.x = x0 + dx * t; cityHit.y = y0 + dy * t;
        return cityHit;
      }
    }
    if (tx === ex && ty === ey) break;
    if (tmx < tmy) { t = tmx; tmx += tdx; tx += sx; nx = -sx; ny = 0; }
    else { t = tmy; tmy += tdy; ty += sy; nx = 0; ny = -sy; }
    if (t > 1) break;
  }
  return cityHit;
}
function cityLOS(x0, y0, x1, y1) { return !cityRay(x0, y0, x1, y1, F_SIGHT, 900).hit; }

/* --- 5. DOORS & WINDOWS ------------------------------------------------------ */
function cityDoorRequest(lx, ly) {   // an entity is about to pass: open the door it is touching / facing
  const tx = cityTX(lx), ty = cityTY(ly);
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
    const D = cityDoorT(tx + dx, ty + dy);
    if (D) { D.req = runTime; if (D.target < 1) D.target = 1; }
  }
}
function cityDoorSetFlags(D, closed) {
  for (let q = 0; q < D.len; q++) {
    const xx = D.axis === "x" ? D.x + q : D.x, yy = D.axis === "x" ? D.y : D.y + q;
    const key = (xx >> 7) * 4096 + (yy >> 7), C = cityRT.chunks.get(key);
    if (!C) continue;
    const i = ((yy & CH_MASK) << 7) | (xx & CH_MASK);
    if (closed) C.flags[i] |= F_SIGHT; else C.flags[i] &= ~F_SIGHT;
  }
  cityRT.visGen++;
}
function cityDoorsStep(dt) {
  if (!player) return;
  const ptx = cityTX(player.x), pty = cityTY(player.y);
  const near = cityRT.nearDoors || (cityRT.nearDoors = []);
  // the full door list is only scanned every 20 frames; in between we step the near set
  if (!near.length || (cityRT.doorScan = (cityRT.doorScan || 0) + 1) % 20 === 0) {
    near.length = 0;
    for (const D of cityRT.doors.values()) { const cx = D.x + (D.axis === "x" ? D.len / 2 : 0.5), cy = D.y + (D.axis === "x" ? 0.5 : D.len / 2); if (Math.abs(cx - ptx) < 110 && Math.abs(cy - pty) < 110) near.push(D); }
  }
  for (const D of near) {
    const cx = D.x + (D.axis === "x" ? D.len / 2 : 0.5), cy = D.y + (D.axis === "x" ? 0.5 : D.len / 2);
    if (Math.abs(cx - ptx) > 100 || Math.abs(cy - pty) > 100) continue;
    const near = Math.abs(cx - (player.x + CITY.orx) / 16) < 2.6 && Math.abs(cy - (player.y + CITY.ory) / 16) < 2.6;
    if (near) { D.req = runTime; D.target = 1; }
    if (D.auto && D.target > 0 && runTime - D.req > 2.2) D.target = 0;
    const was = D.open >= 0.5;
    if (D.open !== D.target) D.open = D.target > D.open ? Math.min(D.target, D.open + dt * 4.5) : Math.max(D.target, D.open - dt * 2.6);
    const now = D.open >= 0.5;
    if (was !== now) {
      cityDoorSetFlags(D, !now);
      if (typeof noiseEmit === "function" && Math.abs(cx - ptx) < 40) noiseEmit((cx * 16) - CITY.orx, (cy * 16) - CITY.ory, 52, "door", 2);
    }
  }
}
// a bullet / blast broke a window
function cityBreakWindow(tx, ty, byPlayer) {
  const key = cityKeyT(tx, ty);
  if (cityRT.broken.has(key)) return false;
  // break the whole pane run (adjacent window tiles)
  const run = [[tx, ty]];
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    let x = tx + dx, y = ty + dy, n = 0;
    while (n++ < 8 && (cityFlagsT(x, y) & F_WIN)) { run.push([x, y]); x += dx; y += dy; }
  }
  for (const [x, y] of run) {
    cityRT.broken.add(cityKeyT(x, y));
    const C = cityRT.chunks.get((x >> 7) * 4096 + (y >> 7));
    if (C) { const i = ((y & CH_MASK) << 7) | (x & CH_MASK); C.flags[i] = (C.flags[i] & ~(F_WIN | F_MOVE)) | F_LOW; }
  }
  cityRT.visGen++;
  const lx = tx * 16 + 8 - CITY.orx, ly = ty * 16 + 8 - CITY.ory;
  if (typeof noiseEmit === "function") noiseEmit(lx, ly, 105, "glass", byPlayer ? 0 : 1);
  if (typeof cityDecal === "function") cityDecal(lx, ly, "glass", 0);
  for (let k = 0; k < 7; k++) spawnPt(lx, ly, (Math.random() - 0.5) * 160, (Math.random() - 0.5) * 160, 0.45, 1.6, 7, 3);
  if (typeof sfx === "function" && player && Math.hypot(lx - player.x, ly - player.y) < 700) { if (typeof playNoise === "function") playNoise(0.16, "highpass", 5200, 2600, 1.2, 0.2); sfx(2600, 1400, 0.09, "triangle", 0.08); }
  return true;
}
function cityWindowBroken(tx, ty) { return cityRT.broken.has(cityKeyT(tx, ty)); }

/* --- 6. LINE-OF-SIGHT GRID (recursive shadow casting) ------------------------- */
const cityVis = { r: 0, n: 0, ox: 0, oy: 0, grid: null, roof: new Set(), pBid: null, gen: -1, px: 1e9, py: 1e9, t: 0 };
function cityComputeVis(radiusTiles) {
  if (!player) return cityVis;
  const R = Math.max(8, Math.min(90, radiusTiles | 0)), N = R * 2 + 1;
  if (!cityVis.grid || cityVis.n !== N) { cityVis.grid = new Uint8Array(N * N); cityVis.n = N; }
  const ptx = cityTX(player.x), pty = cityTY(player.y);
  cityVis.r = R; cityVis.ox = ptx - R; cityVis.oy = pty - R;
  const G = cityVis.grid; G.fill(0);
  const ox = cityVis.ox, oy = cityVis.oy;
  // local opacity cache for speed
  if (!cityVis.op || cityVis.op.length !== N * N) cityVis.op = new Uint8Array(N * N);
  const OP = cityVis.op;
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) OP[j * N + i] = (cityFlagsT(ox + i, oy + j) & F_SIGHT) ? 1 : 0;
  G[R * N + R] = 255;
  const R2 = R * R;
  const cast = (row, start, end, xx, xy, yx, yy) => {
    if (start < end) return;
    let newStart = 0;
    for (let i = row; i <= R; i++) {
      let blocked = false;
      for (let dx = -i, dy = -i; dx <= 0; dx++) {
        const lSlope = (dx - 0.5) / (dy + 0.5), rSlope = (dx + 0.5) / (dy - 0.5);
        if (start < rSlope) continue; if (end > lSlope) break;
        const X = R + dx * xx + dy * xy, Y = R + dx * yx + dy * yy;
        if (X < 0 || Y < 0 || X >= N || Y >= N) continue;
        const d2 = dx * dx + dy * dy;
        if (d2 <= R2) G[Y * N + X] = 255;
        const op = OP[Y * N + X];
        if (blocked) {
          if (op) { newStart = rSlope; continue; }
          blocked = false; start = newStart;
        } else if (op && i < R) {
          blocked = true; cast(i + 1, start, lSlope, xx, xy, yx, yy); newStart = rSlope;
        }
      }
      if (blocked) break;
    }
  };
  const M = [[1, 0, 0, 1], [0, 1, 1, 0], [0, -1, 1, 0], [-1, 0, 0, 1], [-1, 0, 0, -1], [0, -1, -1, 0], [0, 1, -1, 0], [1, 0, 0, -1]];
  for (const m of M) cast(1, 1.0, 0.0, m[0], m[1], m[2], m[3]);
  // roofs seen from outside: any visible wall tile of a building makes its whole roof visible
  cityVis.roof.clear();
  const pb = cityBuildingAt(player.x, player.y);
  cityVis.pBid = pb ? pb.uid : null;
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    if (!G[j * N + i] || !OP[j * N + i]) continue;
    const b = cityBldT(ox + i, oy + j);
    if (b && b.uid !== cityVis.pBid) cityVis.roof.add(b.uid);
  }
  cityVis.gen = cityRT.visGen; cityVis.px = player.x; cityVis.py = player.y; cityVis.stamp = (cityVis.stamp || 0) + 1;
  return cityVis;
}
// can the hero see this local point right now? (LOS + roofs hide other buildings' interiors)
function cityVisibleAt(lx, ly) {
  if (!cityVis.grid) return true;
  const tx = cityTX(lx) - cityVis.ox, ty = cityTY(ly) - cityVis.oy, N = cityVis.n;
  if (tx < 0 || ty < 0 || tx >= N || ty >= N) return false;
  if (!cityVis.grid[ty * N + tx]) return false;
  const b = cityBuildingAt(lx, ly);
  if (b && b.uid !== cityVis.pBid) return false;
  return true;
}

/* --- 7. WALKABLE SPOT SEARCH ------------------------------------------------- */
function cityFindWalkable(lx, ly, maxR = 400, outdoor = true) {
  const tx0 = cityTX(lx), ty0 = cityTY(ly);
  for (let r = 0; r <= maxR / 16; r++) {
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
      const tx = tx0 + dx, ty = ty0 + dy;
      let ok = true;
      for (let yy = -1; yy <= 1 && ok; yy++) for (let xx = -1; xx <= 1 && ok; xx++) { const f = cityFlagsT(tx + xx, ty + yy); if ((f & F_MOVE) || (outdoor && (f & F_IN))) ok = false; }
      if (ok) return [tx * 16 + 8 - CITY.orx, ty * 16 + 8 - CITY.ory];
    }
  }
  return [lx, ly];
}
// EOF part 1 (continued in citydirector section below)
