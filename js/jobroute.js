// FILE: js/jobroute.js
// PART: v15 optional jobs — validated on-foot site selection
// DETAIL: Selects local outdoor sites with a complete, body-clear route.
// A failed search is a normal result; never offer an unreachable placeholder.
"use strict";

const JOB_ROUTE = { radius: 7, minDistance: 180, maxDistance: 720, attempts: 24 };
function jobRouteValid(sx, sy, tx, ty) {
  if (![sx, sy, tx, ty].every(Number.isFinite) || !CITY.on) return false;
  const d = Math.hypot(tx - sx, ty - sy);
  if (d < 16 || d > JOB_ROUTE.maxDistance || cityCircleBlocked(tx, ty, JOB_ROUTE.radius, false)) return false;
  if (cityFlagsAt(tx, ty) & (F_MOVE | F_IN | F_WATER)) return false;
  const path = stFindPath(sx, sy, tx, ty);
  if (!path || path.found !== true || !Array.isArray(path.pts) || !path.pts.length) return false;
  const last = path.pts[path.pts.length - 1];
  // stFindPath can silently snap an obstructed destination to a neighbor.
  if (!last || Math.hypot(last[0] - tx, last[1] - ty) > 12) return false;
  let x = sx, y = sy;
  for (const p of path.pts) {
    if (!p || !Number.isFinite(p[0]) || !Number.isFinite(p[1]) || cityCircleBlocked(p[0], p[1], JOB_ROUTE.radius, false) || !stClearLine(x, y, p[0], p[1], JOB_ROUTE.radius)) return false;
    x = p[0]; y = p[1];
  }
  return stClearLine(x, y, tx, ty, JOB_ROUTE.radius);
}
// 15.2.2-part2 (road closures): a closure is a circle of blocked street. It is
// applied ONLY while a planner runs synchronously inside withClosed — the walk
// grid the pathfinder snapshots sees the closure, so returned paths must walk
// around it; physics, render and traffic never observe the patch. `crosses`
// asks whether the natural (unclosed) route actually touches the closure, so a
// closure is only announced to the courier when it truly reroutes something.
JOB_ROUTE.withClosed = function (closed, fn) {
  if (!Array.isArray(closed) || !closed.length) return fn();
  const valid = closed.filter((c) => c && [c.x, c.y, c.r].every(Number.isFinite) && c.r > 0);
  if (!valid.length) return fn();
  const prev = window.cityFlagsT, orx = CITY.orx, ory = CITY.ory;
  window.cityFlagsT = function (wx, wy) {
    const f = prev(wx, wy), lx = wx * 16 - orx, ly = wy * 16 - ory;
    for (let i = 0; i < valid.length; i++) { const c = valid[i]; if (Math.hypot(lx - c.x, ly - c.y) <= c.r) return f | F_MOVE; } // F_MOVE = no-footway band: the pedestrian grid treats it as impassable
    return f;
  };
  try { return fn(); } finally { window.cityFlagsT = prev; }
};
JOB_ROUTE.crosses = function (pts, sx, sy, c) {
  if (!c || ![c.x, c.y, c.r].every(Number.isFinite) || c.r <= 0) return false;
  const r = c.r + JOB_ROUTE.radius;
  let x = sx, y = sy;
  for (const p of (pts || [])) {
    if (!p || !Number.isFinite(p[0]) || !Number.isFinite(p[1])) return true;
    const dx = p[0] - x, dy = p[1] - y, L2 = dx * dx + dy * dy;
    let t = L2 > 0 ? ((c.x - x) * dx + (c.y - y) * dy) / L2 : 0; t = Math.max(0, Math.min(1, t));
    const px = x + dx * t - c.x, py = y + dy * t - c.y;
    if (px * px + py * py <= r * r) return true;
    x = p[0]; y = p[1];
  }
  return false;
};
function jobFindSite(sx, sy, salt, ring) {
  if (![sx, sy, salt].every(Number.isFinite) || !CITY.on) return null;
  // Sample in a deterministic order, avoiding a new offer becoming a reroll
  // every frame. cityFindWalkable's fallback is explicitly revalidated.
  // A positive `ring` widens the sampling distance for careers that want a
  // longer flagship arc; omitting it keeps every older caller byte-identical.
  const spread = Number.isFinite(ring) && ring > 0 ? Math.min(ring, 240) : 0;
  const turn = (Math.abs(Math.floor(salt)) % 360) * Math.PI / 180;
  for (let i = 0; i < JOB_ROUTE.attempts; i++) {
    const angle = turn + i * 2.399963229728653;
    const dist = JOB_ROUTE.minDistance + 80 + spread + (i % 4) * (100 + (spread >> 1));
    const p = cityFindWalkable(sx + Math.cos(angle) * dist, sy + Math.sin(angle) * dist, 64, true);
    if (!p || Math.hypot(p[0] - sx, p[1] - sy) < JOB_ROUTE.minDistance) continue;
    if (jobRouteValid(sx, sy, p[0], p[1])) return { wx: p[0] + CITY.orx, wy: p[1] + CITY.ory };
  }
  return null;
}
function jobSiteLocal(site) {
  return site && Number.isFinite(site.wx) && Number.isFinite(site.wy) ? { x: site.wx - CITY.orx, y: site.wy - CITY.ory } : null;
}
// EOF:js/jobroute.js
