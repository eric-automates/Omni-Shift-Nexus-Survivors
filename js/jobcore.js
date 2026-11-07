// FILE: js/jobcore.js
// PART: v15 optional career infrastructure
// DETAIL: Bounded, durable incident checkpoints. Actual job scenarios and UI
// register separately; this module deliberately exposes no placeholder jobs.
"use strict";

const JOB_CORE = { defs: Object.create(null), guards: Object.create(null), historyHooks: Object.create(null), version: 1, historyMax: 24, dataMax: 4096 };
function jobValidName(s) { return typeof s === "string" && /^[a-z][a-z0-9_-]{0,39}$/.test(s); }
function jobRegister(def) {
  // An authored scenario controls its own stage graph and fixed, bounded pay.
  // Never trust a saved incident to define its own transitions or reward.
  if (!def || !jobValidName(def.id) || !jobValidName(def.role) || !jobValidName(def.start) || JOB_CORE.defs[def.id]) return false;
  if (!def.edges || typeof def.edges !== "object" || Array.isArray(def.edges) || !def.endings || typeof def.endings !== "object" || Array.isArray(def.endings)) return false;
  if (def.finishGuard !== undefined && !jobValidName(def.finishGuard)) return false;
  if (def.historyHook !== undefined && !jobValidName(def.historyHook)) return false;
  const names = Object.keys(def.edges);
  if (!names.includes(def.start) || names.length > 24 || names.some(n => !jobValidName(n))) return false;
  for (const stage of names) {
    const next = def.edges[stage];
    if (!Array.isArray(next) || next.length > 8 || next.some(n => !names.includes(n) || n === stage)) return false;
  }
  const end = Object.keys(def.endings);
  if (!end.length || end.length > 8 || end.some(n => !jobValidName(n))) return false;
  for (const outcome of end) {
    const e = def.endings[outcome];
    if (!e || !Array.isArray(e.from) || !e.from.length || e.from.some(n => !names.includes(n)) || !Number.isSafeInteger(e.pay) || e.pay < 0 || e.pay > 100000) return false;
  }
  // A contract can require possession of its case for specific endings.
  // Validate the definition once; older contracts omit this field entirely.
  if (def.carriedCaseEndings !== undefined && (!Array.isArray(def.carriedCaseEndings) ||
      def.carriedCaseEndings.some(n => !end.includes(n)))) return false;
  // Every stage must have a route to an authored ending; otherwise a
  // checkpoint could strand a player after a reload or a wrong choice.
  const endingStages = new Set(end.flatMap(k => def.endings[k].from));
  for (const stage of names) {
    const todo = [stage], visited = new Set(); let reachesEnd = false;
    while (todo.length) { const n = todo.pop(); if (visited.has(n)) continue; visited.add(n); if (endingStages.has(n)) { reachesEnd = true; break; } todo.push(...def.edges[n]); }
    if (!reachesEnd) return false;
  }
  // Copy the schema so later scenario mutation cannot alter a live reward.
  JOB_CORE.defs[def.id] = JSON.parse(JSON.stringify(def));
  return true;
}
function jobFreshState() { return { v: JOB_CORE.version, next: 1, active: null, history: [] }; }
function jobReadState() {
  const s = meta && meta.jobState;
  if (s == null) return { ok: true, state: jobFreshState() };
  if (!s || s.v !== JOB_CORE.version || !Number.isSafeInteger(s.next) || s.next < 1 || !Array.isArray(s.history) || s.history.length > JOB_CORE.historyMax || (s.active !== null && (typeof s.active !== "object" || Array.isArray(s.active)))) return { ok: false, why: "unsupported or damaged job state" };
  try { return { ok: true, state: JSON.parse(JSON.stringify(s)) }; }
  catch (e) { return { ok: false, why: "job state cannot be read" }; }
}
function jobWorldKey() {
  if (typeof CITY === "undefined" || !CITY.on || !player) return null;
  // Origin changes with the chosen drop point, so use persistent world identity,
  // not local x/y. Real maps additionally include the selected scale/place.
  if (typeof RG !== "undefined" && RG.real && typeof rmPlaceKey === "function") return "real|" + rmPlaceKey();
  return (typeof RG !== "undefined" && RG.key && RG.key !== "nexus" ? String(RG.key) : "nexus") + "|" + String(CITY.seed >>> 0);
}
function jobCommit(state, walletDelta) {
  // One localStorage write contains both incident transition and wallet. If
  // that write fails, revert in-memory changes and let the existing visible
  // storage warning explain why this checkpoint could not be recorded.
  // Disabled careers are held intact, including through other direct call paths.
  // The current and proposed record are both checked before money or saves change.
  const current = meta && meta.jobState && meta.jobState.active;
  const proposed = state && state.active;
  if ((current && !v15JobEnabled(current)) || (proposed && !v15JobEnabled(proposed)))
    return {ok:false, why:"This job is paused for a future revision; saved progress is unchanged."};
  const old = meta.jobState, hadJob = Object.prototype.hasOwnProperty.call(meta, "jobState");
  const oldWallet = meta.wallet, hadWallet = Object.prototype.hasOwnProperty.call(meta, "wallet");
  meta.jobState = state;
  if (walletDelta) meta.wallet = Math.max(0, Math.round((Number.isFinite(+oldWallet) ? +oldWallet : 0) + walletDelta));
  let ok = false;
  try { ok = typeof saveMeta === "function" && saveMeta() === true; } catch (err) { ok = false; }
  if (!ok) {
    if (hadJob) meta.jobState = old; else delete meta.jobState;
    if (hadWallet) meta.wallet = oldWallet; else delete meta.wallet;
    return { ok: false, why: "checkpoint was not saved" };
  }
  // The transaction is already durable; a broken HUD refresh must not make
  // the caller treat a successful save as a failure and roll back side effects.
  if (walletDelta && typeof itHudCash === "function") { try { itHudCash(); } catch (err) {} }
  return { ok: true };
}
function jobPayload(data) {
  try {
    if (!data || typeof data !== "object" || Array.isArray(data)) return null;
    const text = JSON.stringify(data);
    if (text.length > JOB_CORE.dataMax) return null;
    return JSON.parse(text);
  } catch (err) { return null; }
}
function jobOffer(defId, payload) {
  if (!v15JobEnabled({contract:defId,data:payload})) return {ok:false,why:"This job is unavailable in this revision."};
  const def = JOB_CORE.defs[defId], read = jobReadState(), world = jobWorldKey(), data = jobPayload(payload);
  if (!def || !read.ok || !world || !data) return { ok: false, why: !read.ok ? read.why : "invalid offer or world" };
  const s = read.state;
  if (s.active) return { ok: false, why: "an incident is already active" };
  if (s.next >= Number.MAX_SAFE_INTEGER) return { ok: false, why: "incident counter exhausted" };
  s.active = { id: s.next++, contract: def.id, role: def.role, world, phase: "offer", data };
  const result = jobCommit(s, 0); if (result.ok) result.incident = s.active.id;
  return result;
}
function jobActive() {
  const read = jobReadState(); if (!read.ok) return read;
  const a = read.state.active;
  return { ok: true, active: a, inWorld: !!a && a.world === jobWorldKey(), supported: !!a && !!JOB_CORE.defs[a.contract] };
}
function jobAccept(id) {
  const read = jobReadState(); if (!read.ok) return read;
  const a = read.state.active, def = a && JOB_CORE.defs[a.contract];
  if (!a || a.id !== id || !def || a.phase !== "offer" || a.world !== jobWorldKey()) return { ok: false, why: "offer is unavailable" };
  a.phase = def.start; return jobCommit(read.state, 0);
}
function jobAdvance(id, expected, next, patch) {
  const read = jobReadState(); if (!read.ok) return read;
  const a = read.state.active, def = a && JOB_CORE.defs[a.contract];
  if (!a || a.id !== id || !def || a.world !== jobWorldKey() || a.phase !== expected || !Array.isArray(def.edges[expected]) || !def.edges[expected].includes(next)) return { ok: false, why: "invalid or stale incident transition" };
  const update = patch == null ? {} : jobPayload(patch);
  if (!update) return { ok: false, why: "invalid checkpoint data" };
  const data = jobPayload(Object.assign({}, a.data, update));
  if (!data) return { ok: false, why: "checkpoint data is too large" };
  a.phase = next; a.data = data; return jobCommit(read.state, 0);
}
function jobFinish(id, outcome) {
  const read = jobReadState(); if (!read.ok) return read;
  const s = read.state, a = s.active, def = a && JOB_CORE.defs[a.contract], end = def && Object.prototype.hasOwnProperty.call(def.endings, outcome) ? def.endings[outcome] : null;
  if (!a || a.id !== id || !end || a.world !== jobWorldKey() || !end.from.includes(a.phase)) return { ok: false, why: "invalid or stale incident outcome" };
  if (def.finishGuard && (typeof JOB_CORE.guards[def.finishGuard] !== "function" || !JOB_CORE.guards[def.finishGuard](a, outcome))) return { ok: false, why: "This outcome is not available at the current checkpoint" };
  if (Array.isArray(def.carriedCaseEndings) && def.carriedCaseEndings.includes(outcome) &&
      (!a.data || typeof a.data !== "object" || Array.isArray(a.data) || a.data.caseDrop != null))
    return { ok: false, why: "Recover your case before requesting a handoff" };
  let pay = end.pay;
  const fh = JOB_CORE.finishHooks && JOB_CORE.finishHooks[a.contract];
  if (typeof fh === "function") {
    let adj = null;
    try { adj = fh(s, a, outcome, pay); } catch (e) { return { ok: false, why: "Outcome details are unavailable" }; }
    if (adj && Number.isFinite(adj.pay) && adj.pay >= 0) pay = adj.pay;
  }
  const entry = { id: a.id, contract: a.contract, role: a.role, world: a.world, outcome, pay };
  if (def.historyHook) {
    const hook = JOB_CORE.historyHooks[def.historyHook];
    if (typeof hook !== "function") return { ok: false, why: "Outcome details are unavailable" };
    let facts = null;
    try { facts = jobPayload(hook(a, outcome)); } catch (e) { /* fail closed */ }
    if (!facts) return { ok: false, why: "Outcome details are unavailable" };
    entry.facts = facts;
  }
  s.history.push(entry);
  if (s.history.length > JOB_CORE.historyMax) s.history.splice(0, s.history.length - JOB_CORE.historyMax);
  s.active = null;
  const result = jobCommit(s, pay); if (result.ok) result.pay = pay;
  return result;
}
function jobWithdraw(id) {
  // This remains available even when an old contract is no longer installed
  // or the player changed worlds. It never invents a payout.
  const read = jobReadState(); if (!read.ok) return read;
  const s = read.state, a = s.active;
  if (!a || a.id !== id) return { ok: false, why: "incident is no longer active" };
  s.history.push({ id: a.id, contract: a.contract, role: a.role, world: a.world, outcome: a.phase === "offer" ? "declined" : "withdrawn", pay: 0 });
  if (s.history.length > JOB_CORE.historyMax) s.history.splice(0, s.history.length - JOB_CORE.historyMax);
  s.active = null; return jobCommit(s, 0);
}
// EOF:js/jobcore.js
