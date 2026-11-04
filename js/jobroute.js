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
function jobFindSite(sx, sy, salt) {
  if (![sx, sy, salt].every(Number.isFinite) || !CITY.on) return null;
  // Sample in a deterministic order, avoiding a new offer becoming a reroll
  // every frame. cityFindWalkable's fallback is explicitly revalidated.
  const turn = (Math.abs(Math.floor(salt)) % 360) * Math.PI / 180;
  for (let i = 0; i < JOB_ROUTE.attempts; i++) {
    const angle = turn + i * 2.399963229728653;
    const dist = JOB_ROUTE.minDistance + 80 + (i % 4) * 100;
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
