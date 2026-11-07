/* ============================================================================================================
   js/jobpatrol.js — v15 15.3.2 PLAYER-LED TRAFFIC ENFORCEMENT (`J01` patrol officer, on top of `T18` radar)
   • The cruiser radar (js/police.js) is an observation tool. This file adds the enforcement half the plan
     describes: a bounded patrol shift started at the station, an alarm that offers FOLLOW or a lights-and-
     siren PULL OVER on a *legal-basis* reading only, a traffic driver who acknowledges (or plausibly
     branches to the next junction before stopping, or refuses once — refusal carries no penalty you can
     invent from a radar blip), and a stop log that survives reload.
   • A stopped car is an ordinary traffic car asked to move right and halt. Nothing here damages, rams,
     boxes in or arrests anyone: walk-up citation, search and arrest are later parts; until then a stop is
     recorded as "stopped, awaiting the window".
   • Once per car per shift: no unlimited tickets to the same plate. Traffic itself is a runtime sim — the
     CAR is not saved; the shift log (attempts, refusals, stops) is, through jobcore's single-transaction
     checkpoint like every other contract.
   ============================================================================================================ */
const JOB_PATROL = "patrol_traffic";
jobRegister({ id: JOB_PATROL, role: "officer", start: "patrol",
  edges: { patrol: [] },
  endings: { debriefed: { from: ["patrol"], pay: 15 } } });
// Per-stop resolution pay joins the debrief in ONE transaction (same hook pattern as the 15.2.x careers):
// the shift base is the stipend; recorded resolutions add, capped. Unresolved stops add nothing.
JOB_CORE.defs[JOB_PATROL].historyHook = "j01pd";   // the stop log rides into HISTORY as facts, not just the live shift
JOB_CORE.historyHooks.j01pd = function (a) {
  const pd = a.data && a.data.pd; if (!pd || !Array.isArray(pd.stops)) return null;
  return { stops: pd.stops.map(s => ({ cid: s.cid, mph: s.mph, lim: s.lim, state: s.state, resolved: s.resolved || null, custody: s.custody || null, towed: s.towed || 0 })) };
};
JOB_CORE.finishHooks[JOB_PATROL] = function (s, a, outcome, pay) {
  const pd = a.data && a.data.pd; let bonus = 0;
  if (pd && Array.isArray(pd.stops)) for (const st of pd.stops) {
    if (st.resolved === "warn") bonus += 5; else if (st.resolved === "ticket") bonus += 25; else if (st.resolved === "booked") bonus += 60;
  }
  return { pay: pay + Math.min(bonus, 240) };
};
const PDP = { car: null, id: null, st: "idle", sigT: 0, over: 0, lim: 0 };
function pdpSay(t) { if (typeof vehToast === "function") vehToast(t); }
function pdpAvailable() { return !!(typeof TF !== "undefined" && TF.on && typeof TRF !== "undefined" && TRF.on && TRF.net && typeof pdEnabled === "function" && pdEnabled() && SCN.mode === "economy"); }
function pdpShift() { const r = jobReadState(); return r.ok && r.state.active && r.state.active.contract === JOB_PATROL ? r.state.active : null; }
// A stable branch per (world, car): no rerolls on retry, like the 15.2.3 confrontation.
function pdpBranch(cid) {
  const x = ((CITY.seed >>> 0) ^ 0x51ee7 ^ Math.imul(((cid | 0) % 10000), 2654435761)) >>> 0;
  const hc = Math.imul(x, 2654435761) >>> 0;
  return (hc >>> 15) % 3;   // 0 pull over now · 1 branch to the junction · 2 refuse and drive on
}
function pdpScan() {   // fresh reading every time — buttons never act on a stale blip
  if (typeof pdRadarScan !== "function") return { ok: false, why: "The cruiser radar is unavailable." };
  const s = pdRadarScan(PD_RADAR.mode);
  if (!s.ok) return s;
  if (!s.target) return { ok: false, why: "No vehicle is reading in the beam. A blank is not an all-clear." };
  const over = s.target.mph - s.target.limit;
  if (!(over > Math.max(10, s.target.limit * 0.2))) return { ok: false, why: s.target.id + " is at or under the posted limit — no legal basis for a stop." };
  return { ok: true, target: s.target, over: Math.round(over), lim: Math.round(s.target.limit) };
}
function pdpCarFor(id) {
  const m = /^traffic:(\d+)$/.exec(String(id || "")); if (!m) return null;
  return (TRF.cars || []).find(c => c && c.id === (+m[1]) && c.L) || null;   // m[1]: the capture, not the whole match
}
function pdpStationDoor(x, y, maxD) {   // a real police-station door within reach, or null
  const scan = (b) => {
    try {
      for (const e of accEntrances(b)) {
        if (e.kind !== "door") continue;
        const cx = e.x + (e.axis === "x" ? e.len / 2 : 0.5), cy = e.y + (e.axis === "y" ? e.len / 2 : 0.5);
        for (let o = 2; o <= 5; o++) {
          const px = (cx + e.o[0] * o) * 16 - CITY.orx, py = (cy + e.o[1] * o) * 16 - CITY.ory;
          if (Math.hypot(px - x, py - y) <= maxD) return true;
        }
      }
    } catch (e) { /* building not streamable right now */ }
    return false;
  };
  try { const here = typeof cityBuildingAt === "function" ? cityBuildingAt(x, y) : null; if (here && tfKind(here) === "police") return true; } catch (e) { }
  for (const R of TF.bld.values()) if (R.kind === "police" && scan(R.b)) return true;
  if (typeof tfNearBuildings === "function") for (const b of tfNearBuildings(420)) if (tfKind(b) === "police" && scan(b)) return true;
  return false;
}
function pdpStartShift() {
  if (!v15ContractEnabled(JOB_PATROL)) return { ok: false, why: "Patrol shifts are unavailable in this revision." };
  if (!pdpAvailable()) return { ok: false, why: "Patrol needs live traffic on a modern town map in the economy scenario." };
  if (!runActive || !player) return { ok: false, why: "No active run." };
  const read = jobReadState(); if (!read.ok) return read;
  if (read.state.active) return { ok: false, why: "Another incident is already active." };
  const me = typeof VEH !== "undefined" ? VEH.me : null;
  if (!me || player.inVehicle !== 3 || me.kind !== "police" || me.dead) return { ok: false, why: "Sit in a working police cruiser to sign on." };
  if (!pdpStationDoor(player.x, player.y, 200)) return { ok: false, why: "Start the shift at the police station doors — the cruiser bay is where the log opens." };
  const off = jobOffer(JOB_PATROL, { pd: { attempts: {}, refused: {}, stops: [] } });
  if (!off.ok) return off;
  const acc = jobAccept(off.incident); if (!acc.ok) return acc;
  pdpSay("PATROL SHIFT OPEN · Radar in the cruiser; enforce only what the beam reads.");
  return { ok: true, incident: off.incident };
}
function pdpEndShift() {
  const read = jobReadState();
  const a = read.ok && read.state.active && read.state.active.contract === JOB_PATROL ? read.state.active : null;
  if (!a) return { ok: false, why: "No patrol shift is open." };
  {   // going off duty releases people, not evidence: unresolved stops stay on the log, prisoners go back to the street
    let swept = false;
    for (const s of a.data.pd.stops) if (s.drv === "active" || s.custody === "escort") {
      if (s.custody === "escort" || s.custody === "transport") s.custody = "abandoned";
      const q = typeof TF !== "undefined" && TF.npc ? TF.npc.get("j01-driver|" + a.world + "|t" + s.cid) : null;
      if (q) { if (!q.w) tfSpawnWalker(q, s.wx, s.wy, false, null); pdpReleaseStop(q, false); swept = true; }
    }
    if (PDPD.unit || PDPD.goal || PDPD.tow) { for (const s of a.data.pd.stops) if (s.dsp && /enroute|at-scene|transport|tow-/.test(s.dsp.state)) { s.dsp.state = "abandoned"; swept = true; }
      if (PDPD.tow && !PDPD.tow.dead) { PDPD.tow.j01tow = null; }
      if (PDPD.unit) { const p = PDPD.actor; pdpReleaseUnit(PDPD.unit); PDPD.unit = null; PDPD.goal = null; PDPD.tow = null; } }
    for (const s of a.data.pd.stops) if (!s.towDone) { const tw = pdpCarFor("traffic:" + s.cid);
      if (tw && !tw.dead && tw.towDue !== undefined) { tw.j01tow = null; tw.pdp = null; tw.keep = false; trfDrop(tw); s.towDone = 2; swept = true; } }
    if (swept) jobCommit(read.state, 0);   // the SAME copy that carries the sweep — fresh reads would drop it
  }
  pdpRelease();
  const r = jobFinish(a.id, "debriefed");
  if (r.ok) pdpSay("SHIFT DEBRIEFED · " + r.pay + " · Stops stay in the incident log.");
  return r;
}
function pdpFollow() {
  const s = pdpScan(); if (!s.ok) return s;
  if (!pdpShift()) return { ok: false, why: "Open a patrol shift before following." };
  PDP.car = pdpCarFor(s.target.id); PDP.id = s.target.id; PDP.st = "follow";
  return { ok: true, why: "Following " + s.target.id + " · " + s.over + " mph over · keep the blip in sight." };
}
// The core action: check the log, roll the ONE stable branch, then ask traffic.js to move right and halt.
function pdpSignal() {
  const read = jobReadState();
  const a = read.ok && read.state.active && read.state.active.contract === JOB_PATROL ? read.state.active : null;
  if (!a) return { ok: false, why: "Open a patrol shift at the station before signalling anyone." };
  if (PDP.car && PDP.st === "stopped") return { ok: false, why: "A car is already over and awaiting you — resolve it before pulling another." };
  const s = pdpScan(); if (!s.ok) return s;
  const c = pdpCarFor(s.target.id);
  if (!c) return { ok: false, why: "That reading no longer belongs to a car in the flow of traffic." };
  const pd = a.data.pd;
  const ck = "t" + c.id;   // string keys: numeric object keys do not survive the JSON round trip and would erase once-per-car
  if (pd.attempts[ck]) return { ok: false, why: "You have already dealt with this car this shift — stops are not renewable." };
  if (pd.stops.length >= 12) return { ok: false, why: "Shift log is full — debrief at the station before more stops." };
  return pdpSend(read, a, c, pdpBranch(c.id), s);
}
function pdpSend(read, a, c, branch, s) {
  a.data.pd.attempts["t" + c.id] = branch;
  if (branch === 2) {
    a.data.pd.refused["t" + c.id] = 1;
    const saved = jobCommit(read.state, 0);
    const why = "They checked your lights and drove on. Beyond that reading you have no grounds to force the issue.";
    if (!saved.ok) return saved;
    pdpSay(why); return { ok: true, branch, why };
  }
  c.keep = true;
  c.pdp = branch === 0 ? { pull: true, fromL: c.L } : { pull: false, fromL: c.L };
  PDP.car = c; PDP.id = "traffic:" + c.id; PDP.st = "signal"; PDP.sigT = 0; PDP.over = s.over; PDP.lim = s.lim;
  if (VEH.me) VEH.me.siren = true;
  const saved = jobCommit(read.state, 0);
  if (!saved.ok) { pdpRelease(); return saved; }
  pdpSay(branch === 0 ? "LIGHTS ON · The car is easing right to stop ahead." : "LIGHTS ON · They waited for the junction — still taking the call.");
  return { ok: true, branch };
}
function pdpRelease(keepSiren) {
  if (PDP.car) { PDP.car.pdp = null; if (!keepSiren) PDP.car.keep = false; }
  PDP.car = null; PDP.id = null; PDP.st = "idle"; PDP.sigT = 0;
  if (!keepSiren && VEH && VEH.me) VEH.me.siren = false;
}
function pdpStep(dt) {
  if (!pdpAvailable()) {   // settings, map or scenario went out from under the shift
    for (const c of TRF.cars || []) if (c && c.pdp) { c.pdp = null; c.keep = false; }
    if (PDP.st !== "idle") pdpRelease();
    if (PDPD.unit) { pdpReleaseUnit(PDPD.unit); PDPD.unit = null; PDPD.goal = null; }
    for (const c of TRF.cars || []) if (c && c.j01tow) { c.j01tow = null; c.pdp = null; c.keep = false; }
    PDPD.tow = null;
    pdpPrisonerSweep();
    return;
  }
  const read = jobReadState();
  if (!read.ok || !read.state.active || read.state.active.contract !== JOB_PATROL) {
    if (PDP.st !== "idle") pdpRelease();
    if (PDPD.unit) { pdpReleaseUnit(PDPD.unit); PDPD.unit = null; PDPD.goal = null; }   // a vanishing shift never leaves a ghost cruiser with a prisoner
    for (const c of TRF.cars || []) if (c && (c.j01tow || c.towDue !== undefined)) { c.j01tow = null; c.pdp = null; c.keep = false; }
    PDPD.tow = null;
    pdpPrisonerSweep(); return; }
  const a = read.state.active, k = pdK();
  if (PDP.car) {
    const c = PDP.car;
    if (!c.pdp || c.dead || !c.L) { pdpRelease(); PDP.st = "idle"; if (c && c.pdp) { c.pdp = null; c.keep = false; } return; }
    if (!c.pdp.pull && c.L !== c.pdp.fromL) c.pdp.pull = true;   // the junction branch: they stop on the next link
    if (c.pdp.pull) {
      if (PDP.st !== "stopped" && c.v < 0.06 * k && Math.abs((c.sh || 0) - (c.shT || 0)) < 0.2) {
        const wx = c.x * 32 - CITY.orx, wy = c.y * 32 - CITY.ory;
        a.data.pd.stops.push({ cid: c.id, wx: Math.round(wx), wy: Math.round(wy), mph: Math.round(PDP.lim + PDP.over), lim: Math.round(PDP.lim), state: "stopped" });   // the READING, not the crawl at the halt — a ticket is issued on what the radar saw
        const saved = jobCommit(read.state, 0);
        PDP.st = "stopped"; if (VEH.me) VEH.me.siren = false;
        pdpSay(saved.ok ? "THEY ARE OVER · Park near them and walk up. The stop is in your log." : "Stop recorded in this run; checkpoint not saved — check storage.");

      } else if (PDP.st !== "stopped") { PDP.sigT += dt; if (PDP.sigT > 40) { pdpRelease(); pdpSay("They are out of reach and still moving — the stop is off."); }
    }
  }
  }
  {   // the walk-up: proximity starts (or RESUMES, even days and one reload later) the encounter.
      // It keys off the durable log, not the live car — after a reload the car is gone but the stop,
      // its position and the driver's last recorded injury are not.
    const stx = pdpOpenStop(a.data.pd);
    if (stx) {
      if (stx.dsp && (stx.dsp.state === "enroute" || stx.dsp.state === "at-scene" || stx.dsp.state === "transport") && !PDPD.unit) {
        stx.dsp.state = "lost";                       // the live unit did not survive the reload; the log says so
        if (stx.custody === "transport") stx.custody = "escort";
        jobCommit(read.state, 0);
      }
      if (stx.dsp && (stx.dsp.state === "enroute" || stx.dsp.state === "at-scene" || stx.dsp.state === "transport")) pdpDispatchTick(dt, read.state, a, stx);
      const near = player && !player.inVehicle && !player.roof && (player.flyAlt || 0) <= 2 && Math.hypot(player.x - stx.wx, player.y - stx.wy) < 90;
      if (stx.custody === "escort") { pdpEscortStep(read.state, a, stx); if (near && PDPD.actor) pdpCustodyPanel(stx); else if (!near && PD.panel) pdClosePanel(); }
      else if (stx.custody === "transport") { /* the window is closed; the unit has them */ }
      else if (near) { if (pdpDriverSync()) pdpStopPanel(); }
      else if (PD.panel && PDPD.actor) pdClosePanel();
    }
    pdpTowSweep(dt, read.state, a);   // 15.3.3: wrecker legs and the collection clock run whether or not a stop is open — a BOOKED stop's car is the common case
  }
}
/* --- 15.3.2 part2: the window. A stopped driver is a real person: deterministic id (same name and face
   as any citizen), pinned to the durable 15.3.1 record (they survive you walking away), damageable,
   fleeable, killable. Actions answer from evidence: documents are asked, a warning or ticket is issued,
   and a search needs grounds the law would recognise — a radar blip and steady hands are not a search.
   Someone who bolts is recorded as evaded; nobody is compelled on the spot for want of a feeling. */
const PDPD = { actor: null, cid: null, sig: "" };
function pdpDisposition(cid) {   // 0 calm · 1 nervous · 2 belligerent · 3 bolts — stable per (world, car)
  const x = ((CITY.seed >>> 0) ^ 0x7ac3 ^ Math.imul(((cid | 0) % 10000), 2654435761)) >>> 0;
  const hc = Math.imul(x, 2654435761) >>> 0;
  return (hc >>> 14) % 4;
}
function pdpEvidence(cid) {     // 0,1 nothing · 2 contraband · 3 warrant
  const x = ((CITY.seed >>> 0) ^ 0xe71d ^ Math.imul(((cid | 0) % 10000), 2654435761)) >>> 0;
  const hc = Math.imul(x, 2654435761) >>> 0;
  const pick = (hc >>> 16) % 4;
  return pick < 2 ? "none" : pick === 2 ? "contraband" : "warrant";
}
function pdpOpenStop(pd) { const arr = pd && pd.stops || []; for (let i = arr.length - 1; i >= 0; i--) if (arr[i].state === "stopped") return arr[i]; return null; }
function pdpDriverDrop() { PDPD.actor = null; PDPD.cid = null; PDPD.sig = ""; }
function pdpDriverSync() {
  if (typeof TF === "undefined" || !TF.on) return null;
  const read = jobReadState();
  const a = read.ok && read.state.active && read.state.active.contract === JOB_PATROL ? read.state.active : null;
  if (!a) { pdpDriverDrop(); return null; }
  const st = pdpOpenStop(a.data.pd);
  if (!st || st.drv === "released" || st.drv === "dead") { if (PDPD.actor) pdpDriverDrop(); return null; }
  const id = "j01-driver|" + a.world + "|t" + st.cid;
  if (PDPD.actor && PDPD.cid === st.cid) return PDPD.actor;   // alive-or-dead, hydrated or streaming — the person is the record
  if (tfMem().dead[id]) { st.drv = "dead"; st.resolved = st.resolved || "scene"; st.state = "resolved"; jobCommit(read.state, 0); pdpRelease(); pdpDriverDrop(); return null; }
  const onFoot = player && !player.inVehicle && !player.roof && (player.flyAlt || 0) <= 2;
  if (st.drv !== "active") {
    if (!onFoot || Math.hypot(player.x - st.wx, player.y - st.wy) > 120) return null;   // approach on foot starts it; nothing happens off-screen
    st.drv = "active"; if (!jobCommit(read.state, 0).ok) { st.drv = null; return null; }
  }
  const p = tfPerson(id, tfRng(tfHash(id)), { occ: "unemployed" });
  p.j01Driver = { cid: st.cid, world: a.world, shift: a.id };
  if (!p.w && !p.jrec) {
    const q = cityFindWalkable(st.wx, st.wy, 26, true);
    const W = tfSpawnWalker(p, q ? q[0] : st.wx, q ? q[1] : st.wy, false, null);
    W.idle = 1e6; if (Number.isFinite(st.dhp)) W.hp = st.dhp;
  } else if (p.w && Number.isFinite(st.dhp)) W_hpAtMost(p, st.dhp);
  if (st.custody === "escort" && p.w) { p.w.jobEscort = true; p.w.jobContact = true; }   // the escort rides through a reload on the log
  tfJobClaim(p, "j01-driver");
  PDPD.actor = p; PDPD.cid = st.cid;
  return p;
}
function W_hpAtMost(p, hp) { const v = Math.min(p.w.hp, hp); p.w.hp = v; if (p.jrec) p.jrec.hp = v; }
function pdpReleaseStop(p, keepFlee) {
  if (p) {
    if (p.w) { if (!keepFlee) { p.w.flee = 0; p.w.stun = 0; } }
    if (p.jrec && !keepFlee) { p.jrec.flee = 0; p.jrec.stun = 0; }
    tfJobRelease(p); p.j01Driver = null;
    if (p.w && p.alive) { p.w.jobContact = false; p.w.jobEscort = false; try { tfPickGoal(p, "out"); } catch (e) { } }
  }
  pdpDriverDrop(); pdpRelease(); try { pdClosePanel(); } catch (e) { }
}
function pdpTalk(action) {
  const read = jobReadState();
  const a = read.ok && read.state.active && read.state.active.contract === JOB_PATROL ? read.state.active : null;
  if (!a) return { ok: false, why: "No patrol shift is open." };
  const st = pdpOpenStop(a.data.pd);
  if (!st) return { ok: false, why: "No stop is awaiting resolution." };
  if (st.custody === "escort") return { ok: false, why: "They are in your custody — booking happens at the station doors, and nothing at the curb changes that." };
  const p = pdpDriverSync();
  if (action === "leave") { pdpReleaseStop(p, false); return { ok: true, why: "You step back. The stop stays open — walk up again to continue it." }; }
  if (!p || !p.alive) return { ok: false, why: "The driver is not here." };
  const disp = pdpDisposition(st.cid);
  if (action === "docs") {
    if (disp === 3) {
      st.resolved = "evaded"; st.state = "resolved";
      if (p.w) { p.w.flee = 6; p.w.fleeX = player.x; p.w.fleeY = player.y; }
      const saved = jobCommit(read.state, 0);
      pdpReleaseStop(p, true);
      return { ok: saved.ok !== false, why: "They bolted. The stop is logged as evaded — pursuit is your call, never the log's.", branch: "evaded" };
    }
    st.docs = true;
    if (disp >= 1) st.grounds = true;
    const saved = jobCommit(read.state, 0);
    const line = disp === 0 ? "The papers are ordinary and valid." : disp === 1 ? "Nervous hands, a late registration — that is on the record." : "They refuse the request outright. Refusal is recorded, not punished.";
    return { ok: saved.ok, why: line };
  }
  if (action === "warn") {
    st.resolved = "warn"; st.state = "resolved";
    const saved = jobCommit(read.state, 0); pdpReleaseStop(p, false);
    if (saved.ok) pdpSay("WARNING GIVEN · Noted on the log; the driver goes on their way.");
    return saved;
  }
  if (action === "ticket") {
    const over = Math.max(0, (st.mph || 0) - (st.lim || 0));
    st.resolved = "ticket"; st.fine = Math.min(260, 60 + over * 4);
    st.paid = Math.max(0, Math.min(Math.round(p.cash || 0), st.fine));
    p.cash = Math.max(0, Math.round(p.cash || 0) - st.paid);
    st.state = "resolved";
    const saved = jobCommit(read.state, 0); pdpReleaseStop(p, false);
    if (saved.ok) pdpSay("TICKET ISSUED · $" + st.fine + " to the county clerk · $" + st.paid + " settled from their wallet on the spot.");
    return saved;
  }
  if (action === "search") {
    const severe = (st.mph || 0) - (st.lim || 0) > 25;
    if (!st.grounds && !severe) return { ok: false, why: "No grounds to search. A radar reading and steady hands are not a search." };
    st.evidence = pdpEvidence(st.cid);
    if (st.evidence !== "none") st.arrest = 1;
    const saved = jobCommit(read.state, 0);
    const line = st.evidence === "none" ? "Nothing to find — and the search itself stays on the record." :
      st.evidence === "contraband" ? "Contraband, in plain view once opened. Recorded." : "The plate returns an outstanding warrant. Recorded.";
    return { ok: saved.ok, why: line, evidence: st.evidence };
  }
  if (action === "arrest") {
    if (st.custody === "escort") return { ok: false, why: "Already in custody — walk them to the station doors." };
    if (st.custody === "booked") return { ok: false, why: "Booked and closed." };
    if (st.arrest !== 1) return { ok: false, why: "No warrant, no evidence found — that is not an arrest." };
    st.custody = "escort";
    const c = pdpCarFor("traffic:" + st.cid);
    if (c && !c.dead) {
      if ((st.mph || 0) - (st.lim || 0) > 25) { st.towed = 1; c.keep = true; c.towDue = 8; }   // severe: the DECISION books at once; the car stays pinned at the curb for a wrecker — the unit's, if you call one, else dispatch's own seconds later
      else { c.pdp = null; c.keep = false; }
    }
    if (p.w) { p.w.jobEscort = true; p.w.jobContact = true; p.w.idle = 1e6; p.w.flee = 0; }
    const saved = jobCommit(read.state, 0);
    pdpRelease();
    if (st.towed === 1 && c && !c.dead) { c.pdp = { pull: true, fromL: c.L }; c.keep = true; }   // the release just untied the car — tie the curb hold back on: it waits for its wrecker, it does not drive off empty
    try { pdClosePanel(); } catch (e) { }
    pdpSay("IN CUSTODY · Walk them to the station doors — booking is at the counter." + (st.towed === 1 ? " The car goes on the wrecker." : ""));
    return saved;
  }
  return { ok: false, why: "Unknown at the window." };
}
// injury and death at the window go into the log immediately, same discipline as the witness checkpoints
const pdpOriginalTfHurt = window.tfHurt;
window.tfHurt = function (p) {
  const result = pdpOriginalTfHurt.apply(this, arguments);
  if (p && p.j01Driver && p.alive && p.w) {
    const read = jobReadState(), a = read.ok && read.state.active;
    const st = a && a.id === p.j01Driver.shift && a.contract === JOB_PATROL ? pdpOpenStop(a.data.pd) : null;
    if (st && Number.isFinite(p.w.hp) && p.w.hp > 0) {
      st.wx = Math.round(p.w.x); st.wy = Math.round(p.w.y); st.dhp = p.w.hp;
      jobCommit(read.state, 0);
    }
  }
  return result;
};
const pdpOriginalTfDie = window.tfDie;
window.tfDie = function (p) {
  const wasAlive = !!(p && p.alive), result = pdpOriginalTfDie.apply(this, arguments);
  if (wasAlive && p && p.j01Driver) {
    const read = jobReadState(), a = read.ok && read.state.active;
    const st = a && a.id === p.j01Driver.shift && a.contract === JOB_PATROL ? pdpOpenStop(a.data.pd) : null;
    if (st) {
      st.drv = "dead"; st.resolved = st.resolved || "scene"; st.state = "resolved";
      const saved = jobCommit(read.state, 0);
      pdpRelease(); pdpDriverDrop(); try { pdClosePanel(); } catch (e) { }
      pdpSay(saved.ok ? "The driver died at the stop — logged as a scene, nothing more." : "Scene logged this run; checkpoint not saved.");
    }
  }
  return result;
};
function pdpPrisonerSweep() {   // nobody stays claimed to a vanished shift
  if (typeof TF === "undefined" || !TF.pinned) return;
  for (const q of (TF.pinned.slice ? TF.pinned.slice() : TF.pinned)) if (q && q.j01Driver) {
    try { if (!q.w && q.jrec) tfSpawnWalker(q, q.jrec.x, q.jrec.y, false, null); } catch (e) { }   // aboard when the shift died: back on the pavement
    try { pdpReleaseStop(q, false); } catch (e) { } }
}
function pdpBookPerson(state, a, st, p, atx, aty) {   // the whole point of custody: booked, released, recorded — whoever drives them here
  st.resolved = "booked"; st.custody = "booked"; st.state = "resolved";
  let inside = false;
  try {
    let R = null; for (const bb of TF.bld.values()) if (bb.kind === "police") { R = bb; break; }
    const s2 = R && tfIndoorSpot(R.b, tfRng(tfHash(p.id + "|bk")), ["desk", "deskpod"]);
    if (s2) {
      if (!p.w) tfSpawnWalker(p, s2[0], s2[1], true, { uid: R.uid });
      else { const W = p.w; W.inside = R.uid; W.x = s2[0]; W.y = s2[1]; W.tx = s2[0]; W.ty = s2[1]; W.path = null; }
      const W = p.w;
      W.post = true; W.jobEscort = false; W.jobContact = false; W.idle = 2 + 3 * Math.random();
      inside = true;
    }
  } catch (e) { }
  if (!p.w && !inside) tfSpawnWalker(p, atx, aty, false, null);
  if (p.w) { p.w.jobEscort = false; p.w.jobContact = false; }
  tfJobRelease(p); p.j01Driver = null;
  if (!inside) { try { tfPickGoal(p, "out"); } catch (e) { } }
  let towNext = false;
  if (PDPD.unit && !PDPD.unit.dead && st.dsp && st.dsp.tow === 1 && (st.dsp.state === "transport" || st.dsp.state === "at-scene")) {
    const tw = pdpCarFor("traffic:" + st.cid);
    if (tw && !tw.dead && tw.towDue !== undefined) { towNext = true; st.dsp.state = "tow-to"; st.dsp.hops = 0;
      PDPD.tow = tw; tw.towDue = 1e9;
      const u2 = PDPD.unit; u2.pdp = null; u2.siren = true; u2.j01dsp = { hops: 0, lastL: u2.L, wait: 0, tT: 0, hook: 0 };
      PDPD.goal = null; }
  }
  jobCommit(state, 0);   // the step's own copy — a fresh read would not carry these mutations
  pdpDriverDrop(); pdpRelease(); try { pdClosePanel(); } catch (e) { }
  if (PDPD.unit && !towNext) { pdpReleaseUnit(PDPD.unit); PDPD.unit = null; }
  if (!towNext) PDPD.goal = null;
  pdpSay((inside ? "BOOKED · processed inside the station; the log says who did it." : "BOOKED · recorded at the doors; the building is not open to me for more.") + (towNext ? " The unit swings back for the car." : ""));
  return { ok: true, inside: inside };
}
function pdpEscortStep(state, a, st) {
  if (st.custody !== "escort") return;
  const p = pdpDriverSync();
  if (!p || !p.alive) return;
  const at = p.w || p.jrec; if (!at) return;
  const atDoor = player && !player.inVehicle && pdpStationDoor(player.x, player.y, 140);
  if (!atDoor || Math.hypot(at.x - player.x, at.y - player.y) >= 150) return;
  pdpBookPerson(state, a, st, p, player.x, player.y);
}
function pdpStopPanel() {
  const a = pdpShift(); const st = a && pdpOpenStop(a.data.pd);
  if (!st || !PDPD.actor || !PDPD.actor.alive) { try { pdClosePanel(); } catch (e) { } return; }
  const sig = [st.docs ? 1 : 0, st.grounds ? 1 : 0, st.evidence || "", st.arrest || 0, st.custody || ""].join("|");
  if (PD.panel && sig === PDPD.sig) return;
  PDPD.sig = sig;
  const btn = [["Ask for licence and registration", () => { pdpTalk("docs"); pdpStopPanel(); }]];
  btn.push(["Issue a warning", () => pdpTalk("warn")]);
  btn.push(["Issue a ticket for the recorded speed", () => pdpTalk("ticket")]);
  btn.push(["Search the vehicle" + (st.grounds || (st.mph - st.lim) > 25 ? "" : " (no grounds yet)"), () => { pdpTalk("search"); pdpStopPanel(); }]);
  if (st.arrest === 1) btn.push(["Take them into custody", () => { pdpTalk("arrest"); }]);
  btn.push(["Step back", () => { pdpTalk("leave"); }]);
  pdPanel("Traffic stop", "Vehicle t" + st.cid + " · recorded " + st.mph + " mph against a " + st.lim + " limit" + (st.docs ? " · papers seen" : "") + (st.evidence ? " · evidence: " + st.evidence : "") + ". This is a stop, not a verdict.", btn);
}

/* --- 15.3.3: the unit that ACTUALLY ARRIVES. One contextual call commits a real traffic-network
   cruiser (goal-steered at every junction, bounded at twelve hops, never promised), the officer walks
   the prisoner to it, the unit takes them, drives to a station door, and the booking lands through the
   same pdpBookPerson path — or the call ends in an honest word. No phantom trucks, no guaranteed ETA. */
function pdpStationDoorPoint(nearX, nearY) {   // the station door nearest a point, city px, or null
  let best = null, bd = 1e18;
  const test = (b) => { try {
    for (const e of accEntrances(b)) { if (e.kind !== "door") continue;
      const cx = e.x + (e.axis === "x" ? e.len / 2 : 0.5), cy = e.y + (e.axis === "y" ? e.len / 2 : 0.5);
      for (let o = 2; o <= 5; o++) { const px = (cx + e.o[0] * o) * 16 - CITY.orx, py = (cy + e.o[1] * o) * 16 - CITY.ory;
        const d = Math.hypot(px - nearX, py - nearY); if (d < bd) { bd = d; best = [px, py]; } } } } catch (e) { } };
  for (const R of TF.bld.values()) if (R.kind === "police") test(R.b);
  if (typeof tfNearBuildings === "function") for (const b of tfNearBuildings(3400)) if (tfKind(b) === "police") test(b);
  return best;
}
// 15.3.3: real routing, not greedy distance — greedy circles the same block forever.
// One reverse Dijkstra from the goal node (cached per network build) answers every junction.
let PDPROUTE = { t: -1, gid: -1, via: null };
function pdpRouteVia(N, goalNode, jam) {
  const bk = jam && jam.size ? Array.from(jam).sort().join('.') : '';
  if (PDPROUTE.t === TRF.buildT && PDPROUTE.gid === goalNode.id && (PDPROUTE.bk || '') === bk) return PDPROUTE.via;
  const dist = new Map(); dist.set(goalNode.id, 0);
  const via = new Map(); const pq = [{ id: goalNode.id, d: 0, node: goalNode }];
  while (pq.length) {
    let bi = 0; for (let i2 = 1; i2 < pq.length; i2++) if (pq[i2].d < pq[bi].d) bi = i2;
    const cur = pq.splice(bi, 1)[0];
    if (cur.d > (dist.get(cur.id) || 0)) continue;
    for (const L of cur.node.links) {
      if (bk && L && jam && jam.has(L.id)) continue;   // a road the last unit choked on is closed to the route until it cools
      const oth = L.a === cur.node ? L.b : L.a; if (!oth) continue;
      const fwd = L.a === oth ? 1 : -1;                 // lawful traversal is oth -> cur (toward the goal)
      if (L.ow && L.ow !== fwd) continue;
      const nd = cur.d + L.L;
      if (nd < (dist.has(oth.id) ? dist.get(oth.id) : 1e18)) { dist.set(oth.id, nd); via.set(oth.id, { L: L.id, dir: fwd }); pq.push({ id: oth.id, d: nd, node: oth }); }
    }
  }
  PDPROUTE = { t: TRF.buildT, gid: goalNode.id, bk, via };
  return via;
}
function pdpGoalNext(c, gx, gy) {
  const n = trfEndNode(c.L, c.d); if (!n) return null;
  const N = TRF.net; if (!N || !N.nodes) return null;
  const gmx = (gx + CITY.orx) / 32, gmy = (gy + CITY.ory) / 32;
  let tnode = null, td = 1e18;
  for (const nd of N.nodes.values()) { const q = Math.hypot(nd.x - gmx, nd.y - gmy); if (q < td) { td = q; tnode = nd; } }
  if (!tnode) return null;
  let best = null, atGoal = (tnode === n);
  if (atGoal) {                                    // at the goal node: take the link that runs past the goal point
    let bs = 1e18;
    for (const L of n.links) {
      if (L === c.L) continue;
      const d = L.a === n ? 1 : -1;
      if (L.ow && L.ow !== d) continue;
      const np2 = L.pts.length, lx = L.pts[0] - L.pts[np2 - 2], ly = L.pts[1] - L.pts[np2 - 1];
      const l2 = lx * lx + ly * ly || 1, t = Math.max(0, Math.min(1, -((L.pts[0] - gmx) * lx + (L.pts[1] - gmy) * ly) / l2));
      const dd = Math.hypot(L.pts[0] + lx * t - gmx, L.pts[1] + ly * t - gmy);
      if (dd < bs) { bs = dd; best = { L, d, q: Math.min(c.q, L.lanes - 1) }; }
    }
    if (!best) { c.pdp = { pull: true, j01goal: true }; c.siren = false; return null; }   // nowhere onward: hold at the goal node itself
    const hin2 = trfAt(c.L, c.d, c.L.L - 0.01, c.q, null), h2 = trfEndHead(best.L, n);
    const dot2 = hin2[2] * h2[0] + hin2[3] * h2[1], cr2 = hin2[2] * h2[1] - hin2[3] * h2[0];
    best.turn = dot2 > 0.85 ? 0 : cr2 > 0 ? 1 : -1;
    return best;
  }
  const jam = c.j01dsp && c.j01dsp.blk && c.j01dsp.blk.size ? new Set(c.j01dsp.blk.keys()) : null;
  const via = pdpRouteVia(N, tnode, jam), step = via && via.get(n.id);
  if (!step) return { unroutable: true };                       // disconnected from the goal: say it once, don't wander
  if (step) for (const L of n.links) { if (L.id !== step.L) continue;
    const d = step.dir; if (L.ow && L.ow !== d) continue;
    best = { L, d, q: Math.min(c.q, L.lanes - 1) }; break; }
  if (!best) {                                          // unroutable pocket: greedy hop anyway, bounded elsewhere
    let bs = 1e18;
    for (const L of n.links) {
      if (L === c.L) continue;
      const d = L.a === n ? 1 : -1;
      if (L.ow && L.ow !== d) continue;
      const far = d > 0 ? L.b : L.a;
      if (far && far.links && far.links.length < 2 && far !== n) continue;
      const dd = Math.hypot(far.x - gmx, far.y - gmy);
      if (dd < bs) { bs = dd; best = { L, d, q: Math.min(c.q, L.lanes - 1) }; }
    }
  }
  if (!best) return null;
  const hin = trfAt(c.L, c.d, c.L.L - 0.01, c.q, null), h = trfEndHead(best.L, n);
  const dot = hin[2] * h[0] + hin[3] * h[1], cr = hin[2] * h[1] - hin[3] * h[0];
  best.turn = dot > 0.85 ? 0 : cr > 0 ? 1 : -1;
  return best;
}

function pdpReleaseUnit(u) { if (u && !u.dead) { u.pdp = null; u.keep = false; u.siren = false; u.j01dsp = null; } }
function pdpDispatchEnd(st, u, state, line, live) {   // `live` = the read-state copy this step is mutating — a fresh read drops the change
  if (st.dsp) st.dsp.state = state;
  { const tw = pdpCarFor("traffic:" + st.cid); if (tw && !tw.dead && tw.towDue === 1e9) tw.towDue = 8; }   // the call died before the wrecker leg: dispatch takes the car itself
  pdpReleaseUnit(u); PDPD.unit = null; PDPD.tow = null; PDPD.goal = null;
  if (live) jobCommit(live, 0);
  if (line) pdpSay(line);
}
function pdpCallTransport() {
  const read = jobReadState();
  const a = read.ok && read.state.active && read.state.active.contract === JOB_PATROL ? read.state.active : null;
  if (!a) return { ok: false, why: "No patrol shift is open." };
  const st = pdpOpenStop(a.data.pd);
  if (!st) return { ok: false, why: "No stop is open." };
  if (st.custody !== "escort") return { ok: false, why: "They must be in your custody before anyone can take them." };
  if (st.dsp && st.dsp.state !== "unanswered") return { ok: false, why: st.dsp.state === "done" ? "That stop already handed off." : "This stop already has its one call." };
  for (const q of a.data.pd.stops) if (q !== st && q.dsp && /enroute|at-scene|transport|tow-/.test(q.dsp.state))
    return { ok: false, why: "Your one unit is already committed to another stop — walk this one in or wait it out." };
  const gmx0 = (st.wx + CITY.orx) / 32, gmy0 = (st.wy + CITY.ory) / 32;
  let L = null, sPick = 12;   // come from SOMEWHERE real: a link whose middle sits 18–44 graph units out, else the scene link itself
  { const links = TRF.net.links, stride = Math.max(1, Math.floor(links.length / 260));
    const cands = [];
    for (let i = 0; i < links.length; i += stride) { const Lk = links[i], np = Lk.pts.length;
      const mx2 = (Lk.pts[0] + Lk.pts[np - 2]) / 2, my2 = (Lk.pts[1] + Lk.pts[np - 1]) / 2;
      const dd = Math.hypot(mx2 - gmx0, my2 - gmy0);
      if (dd > 18 && dd < 44 && Lk.a && Lk.b && Lk.a.links.length >= 2 && Lk.b.links.length >= 2) { cands.push(Lk); if (cands.length >= 6) break; } }
    for (const Lk of cands) {           // pick the link that has room to put a car without sitting on one
      const np = Lk.pts.length, ax = Lk.pts[0], ay = Lk.pts[1], bx = Lk.pts[np - 2], by = Lk.pts[np - 1];
      const sd = ((bx - ax) * (gmx0 - (ax + bx) / 2) + (by - ay) * (gmy0 - (ay + by) / 2)) >= 0 ? 1 : -1;
      let okS = 0;
      for (let t = 0; t < 6 && !okS; t++) {
        const sT = 8 + t * Math.max(4, (Lk.L - 16) / 6);
        if (sT > Lk.L - 8) break;
        if (!TRF.cars.some(o => o !== Lk && !o.dead && o.L === Lk && o.st === 0 && Math.abs(o.s - sT) < 15)) okS = sT; }
      if (okS) { L = Lk; sPick = okS; break; } }
    if (!L && cands.length) { L = cands[0]; sPick = Math.min(12, L.L - 8); } }
  if (!L) { const road = trfRoadAt(gmx0, gmy0); L = road && road.link;
    if (L && ((L.a && L.a.links.length < 2) || (L.b && L.b.links.length < 2))) {   // scene is on a stub: hop to any link with two real ends
      const links = TRF.net.links; L = null;
      for (let i = 0; i < links.length; i++) { const Lk = links[i]; if (Lk.a && Lk.b && Lk.a.links.length >= 2 && Lk.b.links.length >= 2) { L = Lk; break; } } } }
  if (!L) { st.dsp = { state: "unanswered", hops: 0 }; jobCommit(read.state, 0); return { ok: false, why: "No road reaches this scene — the unit cannot come up. The call stays on the record." }; }
  let s0 = Math.max(2, Math.min(L.L - 2, sPick - 26));
  { const pts = L.pts; let bd = 1e18, bi = 0;
    const gmx = gmx0, gmy = gmy0;
    for (let i = 0; i + 3 < pts.length; i += 2) { const ax = pts[i], ay = pts[i + 1], dx = pts[i + 2] - ax, dy = pts[i + 3] - ay;
      const l2 = dx * dx + dy * dy || 1, t = Math.max(0, Math.min(1, ((gmx - ax) * dx + (gmy - ay) * dy) / l2));
      const d = Math.hypot(ax + dx * t - gmx, ay + dy * t - gmy); if (d < bd) { bd = d; bi = i; } }
    const nseg = (pts.length - 2) / 2; const fr = nseg > 1 ? (bi / 2) / (nseg - 1) : 0.5;   // a two-point stub has no interior junction to index
    if (!L) return;
    const sAlt = Math.max(2, Math.min(L.L - 2, (isFinite(fr) ? fr : 0.5) * L.L - 26)); if (isFinite(sAlt) && sAlt > 2) s0 = sAlt; }
  let sdir = 1;
  { const np = L.pts, ax = L.pts[0], ay = L.pts[1], bx = L.pts[np - 2], by = L.pts[np - 1];
    sdir = ((bx - ax) * (gmx0 - (ax + bx) / 2) + (by - ay) * (gmy0 - (ay + by) / 2)) >= 0 ? 1 : -1; }
  if (L.ow) sdir = L.ow;
  { const nE = trfEndNode(L, sdir); if (nE && nE.links.length < 2) { const nW = trfEndNode(L, -sdir); if (nW && nW.links.length >= 2) sdir = -sdir; } }
  const u = trfNewCar(L, sdir, Math.max(2, Math.min(L.L - 2, s0)), Math.min(1, L.lanes - 1), true);   // a real lane: walkers have no lane to copy
  u.siren = true; u.keep = true; u.j01dsp = { hops: 0, lastL: L };
  TRF.cars.push(u); if (TRF.stats) TRF.stats.spawned++;
  PDPD.unit = u;
  st.dsp = { state: "enroute", hops: 0, tow: st.towed === 1 ? 1 : 0 };
  if (st.dsp.tow === 1) { const tw = pdpCarFor("traffic:" + st.cid); if (tw && !tw.dead) tw.towDue = 1e9; }   // the unit owes this car a tow: hold the curb against dispatch
  jobCommit(read.state, 0);
  pdpSay("DISPATCHED · A unit is coming up the road — walk them to it when it reaches the curb.");
  return { ok: true };
}
// The sim's road net follows the PLAYER (it rebuilds beyond ~60·k of centre and quietly drops its own
// traffic). A dispatch unit carries a prisoner: it must survive that churn, so on every rebuild we stitch
// it onto the nearest live street — else the world loses a car with a person inside it.
function pdpStitchUnit(u, st) {
  const N = TRF.net; if (!N) return false;
  if (N.links.includes(u.L)) return true;
  const g0 = PDPD.goal || [st.wx, st.wy];
  const proj = (L, x, y) => { const q2 = L.pts; let bd2 = 1e18, bs = 0, acc = 0;
    for (let i = 0; i + 3 < q2.length; i += 2) { const ax = q2[i], ay = q2[i + 1], dx = q2[i + 2] - ax, dy = q2[i + 3] - ay, sl = Math.hypot(dx, dy) || 1;
      const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (sl * sl)));
      const dd2 = Math.hypot(ax + dx * t - x, ay + dy * t - y);
      if (dd2 < bd2) { bd2 = dd2; bs = acc + t * sl; } acc += sl; }
    return { d: bd2, s: Math.max(3, Math.min(L.L - 3, bs)) }; };
  let bl = null, bp = null;
  for (const L of N.links) { const r = proj(L, u.x, u.y); if (r.d < 40 && (!bl || r.d < bp.d)) { bl = L; bp = r; } }
  if (!bl) { const rx = (g0[0] + CITY.orx) / 32, ry = (g0[1] + CITY.ory) / 32;
    for (const L of N.links) { const r = proj(L, rx, ry); if (!bl || r.d < bp.d) { bl = L; bp = r; } } }
  if (!bl) return false;
  u.L = bl; u.s = bp.s; u.q = Math.min(u.q, bl.lanes - 1); if (bl.ow) u.d = bl.ow;
  u.next = null; u.j01dsp.lastL = bl; u.j01dsp.stuck = 0; u.j01dsp.flips = 0; u.hint = { i: 0 }; trfPlace(u);
  return true;
}
function pdpBlkTick(u, dt) { const b = u && u.j01dsp && u.j01dsp.blk; if (!b) return;
  for (const [k2, v2] of b) { if (v2 - dt <= 0) b.delete(k2); else b.set(k2, v2 - dt); } }
function pdpDispatchTick(dt, state, a, st) {
  const d = st.dsp, u = PDPD.unit;
  pdpBlkTick(u, dt);
  if (!d || !u || u.dead) {
    const cp = PDPD.actor || (TF.npc && TF.npc.get("j01-driver|" + a.world + "|t" + st.cid));
    if (st.custody === "transport" && cp && !cp.w) tfSpawnWalker(cp, st.wx, st.wy, false, null);
    pdpDispatchEnd(st, u, "declined", u && u.dead ? "The unit was taken out of the fight — the prisoner is still yours." : "The unit is gone — the prisoner steps back out at the scene.", state);
    return;
  }
  if (!pdpStitchUnit(u, st)) {
    const cp2 = PDPD.actor || (TF.npc && TF.npc.get("j01-driver|" + a.world + "|t" + st.cid));
    if (st.custody === "transport" && cp2 && !cp2.w) tfSpawnWalker(cp2, cp2.jrec ? cp2.jrec.x : st.wx, cp2.jrec ? cp2.jrec.y : st.wy, false, null);
    if (st.custody === "transport") st.custody = "escort";
    pdpDispatchEnd(st, u, "unrouted", "The street under the unit no longer exists out here — they step back out, still in custody.", state);
    return; }
  if (d.state === "enroute") {
    const ux = u.x * 32 - CITY.orx, uy = u.y * 32 - CITY.ory, udd = Math.hypot(ux - st.wx, uy - st.wy);
    if (u.L !== u.j01dsp.lastL) { u.j01dsp.lastL = u.L; u.j01dsp.hops = (u.j01dsp.hops || 0) + 1; u.j01dsp.stuck = 0; u.j01dsp.flips = 0; }
    else if (u.v < 0.6 * u.k && u.st === 0) {
      u.j01dsp.stuck = (u.j01dsp.stuck || 0) + dt;
      if (u.j01dsp.stuck > 12 && u.j01dsp.laneTry !== 1) { u.j01dsp.laneTry = 1; u.q = u.q > 0 ? 0 : Math.min(1, u.L.lanes - 1); u.next = null; }
      if (u.j01dsp.stuck > 60) { pdpDispatchEnd(st, u, "unrouted", "The unit got stuck in the mess short of you — the call is closed; the doors are yours.", state); return; }
    } else u.j01dsp.stuck = Math.max(0, (u.j01dsp.stuck || 0) - dt * 2);
    if ((u.j01dsp.stuck || 0) > 6 && udd < 2400)
      { const nn0 = trfEndNode(u.L, u.d); const ceil0 = u.L.L - (trfR(nn0, u.L) || 0.6) + 0.15 * u.k;   // to the turn trigger itself: a unit queued at a busy mouth creeps to the line, not short of it
        u.s = Math.max(u.s, Math.min(ceil0, u.s + 6 * u.k * dt)); trfPlace(u); }   // crawl the blockage — a forward nudge, never a rewind
    if ((u.j01dsp.hops || 0) > 12) { pdpDispatchEnd(st, u, "unrouted", "No way through to your scene in twelve turns — the call ends unrouted, honestly.", state); return; }
    if (u.s > u.L.L - 20 * u.k || !u.next) { const g = pdpGoalNext(u, st.wx, st.wy);
      if (g && g.unroutable) { pdpDispatchEnd(st, u, "unrouted", "No road leads to your scene from where the unit stands — the call is closed, honestly.", state); return; }
      if (g) u.next = g;
      else if (u.s > u.L.L - 12 * u.k) {          // nowhere lawful to go: turn around on the spot, keep the call alive
        u.j01dsp.flips = (u.j01dsp.flips || 0) + 1;
        if (u.j01dsp.flips > 3) { pdpDispatchEnd(st, u, "unrouted", "The unit came into a pocket of streets it could not work out of — the call ends here.", state); return; }
        u.d = -u.d; u.s = Math.max(2, u.L.L - u.s); u.q = Math.min(u.q, u.L.lanes - 1); u.next = pdpGoalNext(u, st.wx, st.wy); trfPlace(u); } }
    if (udd < 160 || (u.pdp && u.pdp.j01goal && udd < 900)) { u.pdp = { pull: true, fromL: u.L }; u.siren = false; u.v = Math.min(u.v, 3 * u.k); d.state = "at-scene"; d.hops = u.j01dsp.hops || 0; u.j01dsp.wait = 0;
      jobCommit(state, 0); pdpSay("UNIT AT THE CURB · Walk them over."); return; }
  } else if (d.state === "at-scene") {
    u.v = Math.min(u.v, 2.2 * u.k); u.siren = false;   // hold station, do not roll away (or roll THROUGH)
    u.j01dsp.wait = (u.j01dsp.wait || 0) + dt;
    const p = PDPD.actor;
    if (p && p.alive && p.w && player && !player.inVehicle) {
      const ux = u.x * 32 - CITY.orx, uy = u.y * 32 - CITY.ory;
      if (Math.hypot(p.w.x - ux, p.w.y - uy) < 52 && Math.hypot(player.x - ux, player.y - uy) < 90) {
        const door = pdpStationDoorPoint(ux, uy);
        if (!door) { pdpBookPerson(state, a, st, p, ux, uy); return; }   // no reachable doors at all: booked at the unit, said plainly
        PDPD.goal = door;
        const i = TF.walk.indexOf(p); if (i >= 0) tfDespawn(i);           // aboard: the walker goes into the record
        st.custody = "transport"; d.state = "transport"; d.hops = u.j01dsp.hops || 0;
        u.pdp = null; u.j01dsp = { hops: 0, lastL: u.L, wait: 0, tT: 0 };
        jobCommit(state, 0); pdpSay("HANDED OFF · The unit is taking them in."); PDPD.actor = null; PDPD.cid = null;
        if (PD.panel) { try { pdClosePanel(); } catch (e) { } }   // the story left the sidewalk; the panel goes with it
        return;
      }
    }
    if ((u.j01dsp.wait || 0) > 70) { pdpDispatchEnd(st, u, "declined", "You never reached the unit — it is back on patrol, and the prisoner is still yours to walk.", state); }
  } else if (d.state === "transport") {
    const g = PDPD.goal || pdpStationDoorPoint(st.wx, st.wy) || [st.wx, st.wy];
    if (!PDPD.goal) PDPD.goal = g;
    u.j01dsp.tT = (u.j01dsp.tT || 0) + dt;
    const ddoor = Math.hypot(u.x * 32 - CITY.orx - g[0], u.y * 32 - CITY.ory - g[1]);
    if (u.j01dsp.tT > 60 && ddoor < 1500) {   // patience ran out in plain sight of the doors: book at the corner
      const pw = TF.npc && TF.npc.get("j01-driver|" + a.world + "|t" + st.cid);
      if (pw && pw.alive) { pdpBookPerson(state, a, st, pw, u.x * 32 - CITY.orx, u.y * 32 - CITY.ory); return; } }
    if (u.j01dsp.tT > 240) {
      const p0 = TF.npc && TF.npc.get("j01-driver|" + a.world + "|t" + st.cid);
      st.custody = "escort"; if (p0 && !p0.w) tfSpawnWalker(p0, p0.jrec ? p0.jrec.x : st.wx, p0.jrec ? p0.jrec.y : st.wy, false, null);
      pdpDispatchEnd(st, u, "unrouted", "The unit lost the road out here — they step back out where it stopped, still in custody.", state);
      return; }
    if (u.L !== u.j01dsp.lastL) { u.j01dsp.lastL = u.L; u.j01dsp.hops = (u.j01dsp.hops || 0) + 1;
      u.j01dsp.stuck = 0; u.j01dsp.flips = 0;
      if (u.j01dsp.hops > 14) {   // stranded: put them back on the ground and say so
        const p = TF.npc && TF.npc.get("j01-driver|" + a.world + "|t" + st.cid);
        st.custody = "escort"; if (p && !p.w) tfSpawnWalker(p, u.x * 32 - CITY.orx, u.y * 32 - CITY.ory, false, null);
        pdpDispatchEnd(st, u, "unrouted", "The unit could not route to the station — they step back out at the corner, still in custody.", state);
        return; } }
    if (u.v < 0.6 * u.k && u.st === 0) {
      u.j01dsp.stuck = (u.j01dsp.stuck || 0) + dt;
      if (u.j01dsp.stuck > 6) { u.s = Math.max(u.s, Math.min(u.L.L - (trfR(trfEndNode(u.L, u.d), u.L) || 0.6) + 0.15 * u.k, u.s + 6 * u.k * dt)); trfPlace(u); }   // to the turn trigger itself: a queued unit creeps to the line, everywhere it waits
      if (u.j01dsp.stuck > 12 && u.j01dsp.laneTry !== 1 && u.L.lanes > 1) { u.j01dsp.laneTry = 1; u.q = u.q > 0 ? 0 : Math.min(u.L.lanes - 1, Math.max(1, u.L.lanes - 1)); u.next = null; }   // the other lane may simply be open — try it before backing out of the block
      if (u.j01dsp.stuck > 24 && ddoor > 700) {   // the dammed junction is not the light: back onto the cross street and let the route re-decide around it
        u.j01dsp.detours = (u.j01dsp.detours || 0) + 1;
        if (u.j01dsp.detours <= 3) {
          if (u.next && u.next.L) { (u.j01dsp.blk = u.j01dsp.blk || new Map()).set(u.next.L.id, 70); }
          u.d = -u.d; u.s = Math.max(2, u.L.L - u.s); u.q = Math.min(u.q, u.L.lanes - 1); u.next = null; trfPlace(u);
          u.j01dsp.stuck = 0; u.j01dsp.flips = 0; } }
      if (u.j01dsp.stuck > 200) {
        const pz = TF.npc && TF.npc.get("j01-driver|" + a.world + "|t" + st.cid);
        st.custody = "escort"; if (pz && !pz.w) tfSpawnWalker(pz, u.x * 32 - CITY.orx, u.y * 32 - CITY.ory, false, null);
        pdpDispatchEnd(st, u, "unrouted", "The unit could not move with them aboard — they step out at the corner, still in custody.", state);
        return; } }
    else u.j01dsp.stuck = Math.max(0, (u.j01dsp.stuck || 0) - dt * 2);
    if (u.s > u.L.L - 20 * u.k || !u.next) { const nn = trfEndNode(u.L, u.d);
      if (nn && nn.links.length < 2 && u.s > u.L.L - 14 * u.k) {   // dead-end mouth: turn around before the engine can drop us
        u.j01dsp.flips = (u.j01dsp.flips || 0) + 1;
        if (u.j01dsp.flips > 3) {
          const pz = TF.npc && TF.npc.get("j01-driver|" + a.world + "|t" + st.cid);
          st.custody = "escort"; if (pz && !pz.w) tfSpawnWalker(pz, u.x * 32 - CITY.orx, u.y * 32 - CITY.ory, false, null);
          pdpDispatchEnd(st, u, "unrouted", "The unit could not work out of the streets around the doors — they step out at the corner, still in custody.", state);
          return; }
        u.d = -u.d; u.s = Math.max(2, u.L.L - u.s); u.q = Math.min(u.q, u.L.lanes - 1); u.next = null; trfPlace(u); }
      else { const gg = pdpGoalNext(u, g[0], g[1]);
        if (gg && gg.unroutable) {
          const pz = TF.npc && TF.npc.get("j01-driver|" + a.world + "|t" + st.cid);
          st.custody = "escort"; if (pz && !pz.w) tfSpawnWalker(pz, u.x * 32 - CITY.orx, u.y * 32 - CITY.ory, false, null);
          pdpDispatchEnd(st, u, "unrouted", "No road reaches the doors from here — they step out at the corner, still in custody.", state);
          return; }
        u.next = gg || trfPickNext(u) || null; } }
    if (u.s > u.L.L - 3 && !u.next) u.v = Math.min(u.v, 2 * u.k);
    const ux = u.x * 32 - CITY.orx, uy = u.y * 32 - CITY.ory;
    const holdHere = u.j01dsp.pdpHold || (u.pdp && u.pdp.j01goal);
    if (holdHere) u.j01dsp.pdpHold = true;
    const dbk = Math.hypot(ux - g[0], uy - g[1]);
    if (dbk < 260 || (u.j01dsp.pdpHold && dbk < 900)) {   // a cruiser stops at the block, not on the doormat
      const p = TF.npc && TF.npc.get("j01-driver|" + a.world + "|t" + st.cid);
      if (p && p.alive) pdpBookPerson(state, a, st, p, dbk < 400 ? g[0] : ux, dbk < 400 ? g[1] : uy);
      else pdpDispatchEnd(st, u, "declined", "The unit reached the doors to find nobody aboard — the record stays open.", state);
      return;
    }
  }
}
// 15.3.3 part2: the wrecker leg. The same unit that took the person goes back for a car the arrest
// condemned, hooks it, and hauls it to the station doors — and no exit ever strands a car: every
// failure hands it to dispatch's own clock, because the log already promised it would not stay.
function pdpTowDone(st, state, line) {
  const u = PDPD.unit;
  if (PDPD.tow && !PDPD.tow.dead) { PDPD.tow.j01tow = null; PDPD.tow.pdp = null; PDPD.tow.keep = false; trfDrop(PDPD.tow); }
  st.dsp.state = "done"; st.towDone = 1;
  PDPD.tow = null;
  if (u) pdpReleaseUnit(u);
  PDPD.unit = null; PDPD.goal = null;
  if (state) jobCommit(state, 0);
  if (line) pdpSay(line);
}
function pdpTowFail(st, state, line) {   // the unit could not finish it: the car keeps its curb hold, dispatch's clock re-arms
  if (PDPD.tow && !PDPD.tow.dead && PDPD.tow.j01tow) { PDPD.tow.j01tow = null; if (PDPD.tow.L) trfPlace(PDPD.tow); }
  const tw = PDPD.tow || pdpCarFor("traffic:" + st.cid);
  if (tw && !tw.dead && tw.towDue === 1e9) tw.towDue = 8;
  PDPD.tow = null;
  st.dsp.state = "unrouted";
  const u = PDPD.unit; if (u) pdpReleaseUnit(u);
  PDPD.unit = null; PDPD.goal = null;
  if (state) jobCommit(state, 0);
  if (line) pdpSay(line);
}
function pdpTowTick(dt, state, a, st) {
  const d = st.dsp, u = PDPD.unit, tc = PDPD.tow;
  pdpBlkTick(u, dt);
  if (!d || !u || u.dead) { pdpTowFail(st, state, "The wrecker unit fell back — dispatch will collect the car."); return; }
  if (!tc || tc.dead || !tc.L) { pdpTowDone(st, state, "WRECKER · The car is off that street — the tow on the stop's record stands."); return; }
  if (!pdpStitchUnit(u, st)) { pdpTowFail(st, state, "The road under the wrecker dissolved out here — dispatch collects the car."); return; }
  if (d.state === "tow-to") {
    const ux = u.x * 32 - CITY.orx, uy = u.y * 32 - CITY.ory;
    const cx = tc.x * 32 - CITY.orx, cy = tc.y * 32 - CITY.ory;
    const udd = Math.hypot(ux - cx, uy - cy);
    if (u.L !== u.j01dsp.lastL) { u.j01dsp.lastL = u.L; u.j01dsp.hops = (u.j01dsp.hops || 0) + 1; u.j01dsp.stuck = 0; u.j01dsp.flips = 0; }
    else if (u.v < 0.6 * u.k && u.st === 0) {
      u.j01dsp.stuck = (u.j01dsp.stuck || 0) + dt;
      if (u.j01dsp.stuck > 6) { u.s = Math.max(u.s, Math.min(u.L.L - (trfR(trfEndNode(u.L, u.d), u.L) || 0.6) + 0.15 * u.k, u.s + 6 * u.k * dt)); trfPlace(u); }   // the wrecker's way back follows the same mouth rule
      if (u.j01dsp.stuck > 60) { pdpTowFail(st, state, "The wrecker could not get back to the car — dispatch collects it."); return; } }
    else u.j01dsp.stuck = Math.max(0, (u.j01dsp.stuck || 0) - dt * 2);
    if ((u.j01dsp.hops || 0) > 10) { pdpTowFail(st, state, "No way back to the car in ten turns — dispatch collects it."); return; }
    if (u.s > u.L.L - 20 * u.k || !u.next) { const g = pdpGoalNext(u, cx, cy);
      if (g && g.unroutable) { pdpTowFail(st, state, "No road reaches the car from where the wrecker stands — dispatch collects it."); return; }
      if (g) u.next = g;
      else if (u.s > u.L.L - 12 * u.k) {
        u.j01dsp.flips = (u.j01dsp.flips || 0) + 1;
        if (u.j01dsp.flips > 3) { pdpTowFail(st, state, "The wrecker came into a pocket it could not work out of — dispatch collects the car."); return; }
        u.d = -u.d; u.s = Math.max(2, u.L.L - u.s); u.q = Math.min(u.q, u.L.lanes - 1); u.next = pdpGoalNext(u, cx, cy); trfPlace(u); } }
    if (udd < 170 || (u.pdp && u.pdp.j01goal && udd < 900)) {
      u.pdp = { pull: true, fromL: u.L }; u.siren = false; u.v = Math.min(u.v, 2 * u.k);
      d.state = "tow-hook"; u.j01dsp.hook = 0; u.j01dsp.tT = 0;
      jobCommit(state, 0); pdpSay("AT THE CAR · The unit is hooking it up."); return; }
  } else if (d.state === "tow-hook") {
    u.v = Math.min(u.v, 1.2 * u.k);
    u.j01dsp.hook = (u.j01dsp.hook || 0) + dt;
    if (u.j01dsp.hook > 1.2) {
      const dp = pdpStationDoorPoint(u.x * 32 - CITY.orx, u.y * 32 - CITY.ory);
      if (!dp) { pdpTowDone(st, state, "WRECKER · The car is out of the street, booked against the stop — there are no doors to bring it to."); return; }
      d.state = "tow-haul"; u.pdp = null; tc.j01tow = 1;
      PDPD.goal = dp; u.j01dsp.tT = 0; u.j01dsp.hops = 0; u.j01dsp.lastL = u.L;
      jobCommit(state, 0); pdpSay("HOOKED · The wrecker is taking it in behind the unit."); }
    return;
  } else if (d.state === "tow-haul") {
    u.j01dsp.tT = (u.j01dsp.tT || 0) + dt;
    tc.L = u.L;
    tc.s = Math.max(0.6, u.s - 3); tc.q = Math.min(u.q, (u.L.lanes || 1) - 1); tc.d = u.d; tc.v = u.v; tc.sh = u.sh || 0; trfPlace(tc);
    if (u.j01dsp.tT > 300) { pdpTowDone(st, state, "WRECKER · The unit could not reach the doors with it — the car is collected where it stands."); return; }
    const g = PDPD.goal || pdpStationDoorPoint(u.x * 32 - CITY.orx, u.y * 32 - CITY.ory) || [st.wx, st.wy];
    if (!PDPD.goal) PDPD.goal = g;
    const ddoor = Math.hypot(u.x * 32 - CITY.orx - g[0], u.y * 32 - CITY.ory - g[1]);
    if (u.L !== u.j01dsp.lastL) { u.j01dsp.lastL = u.L; u.j01dsp.hops = (u.j01dsp.hops || 0) + 1; u.j01dsp.stuck = 0; u.j01dsp.flips = 0;
      if (u.j01dsp.hops > 16) { pdpTowDone(st, state, "WRECKER · No road reached the doors — the unit left it at the corner it had to stop at, and the tow stands."); return; } }
    if (u.v < 0.6 * u.k && u.st === 0) {
      u.j01dsp.stuck = (u.j01dsp.stuck || 0) + dt;
      if (u.j01dsp.stuck > 6) { u.s = Math.max(u.s, Math.min(u.L.L - (trfR(trfEndNode(u.L, u.d), u.L) || 0.6) + 0.15 * u.k, u.s + 6 * u.k * dt)); trfPlace(u); }   // to the turn trigger itself: a queued unit creeps to the line, everywhere it waits
      if (u.j01dsp.stuck > 12 && u.j01dsp.laneTry !== 1 && u.L.lanes > 1) { u.j01dsp.laneTry = 1; u.q = u.q > 0 ? 0 : Math.min(u.L.lanes - 1, Math.max(1, u.L.lanes - 1)); u.next = null; }
      if (u.j01dsp.stuck > 220) { pdpTowDone(st, state, "WRECKER · The unit could not move with the car hooked — dispatch collects it here, off the street, on the record."); return; } }
    else u.j01dsp.stuck = Math.max(0, (u.j01dsp.stuck || 0) - dt * 2);
    if (u.s > u.L.L - 20 * u.k || !u.next) { const nn = trfEndNode(u.L, u.d);
      if (nn && nn.links.length < 2 && u.s > u.L.L - 14 * u.k) {
        u.j01dsp.flips = (u.j01dsp.flips || 0) + 1;
        if (u.j01dsp.flips > 3) { pdpTowDone(st, state, "WRECKER · Out of road near the doors — the car goes down here, towed and recorded."); return; }
        u.d = -u.d; u.s = Math.max(2, u.L.L - u.s); u.q = Math.min(u.q, u.L.lanes - 1); u.next = null; trfPlace(u); }
      else { const gg = pdpGoalNext(u, g[0], g[1]);
        if (gg && gg.unroutable) { pdpTowDone(st, state, "WRECKER · No road reaches the doors from here — the car is collected where the unit stands."); return; }
        u.next = gg || trfPickNext(u) || null; } }
    if (u.s > u.L.L - 3 && !u.next) u.v = Math.min(u.v, 2 * u.k);
    const ux = u.x * 32 - CITY.orx, uy = u.y * 32 - CITY.ory;
    if (u.pdp && u.pdp.j01goal) u.j01dsp.pdpHold = true;
    const dbk = Math.hypot(ux - g[0], uy - g[1]);
    if (dbk < 300 || (u.j01dsp.pdpHold && dbk < 900)) { pdpTowDone(st, state, "WRECKER IN · The car stands at the station now — off the street, on the stop's record."); return; }
  }
}
function pdpTowSweep(dt, state, a) {   // once per tick, open stop or not: the wrecker legs and dispatch's own clock
  const stops = (a.data.pd && a.data.pd.stops) || [];
  for (const s of stops) if (s.dsp && (s.dsp.state === "tow-to" || s.dsp.state === "tow-hook" || s.dsp.state === "tow-haul")) {
    if (!PDPD.unit) { s.dsp.state = "lost";
      const tw = pdpCarFor("traffic:" + s.cid); if (tw && !tw.dead) tw.towDue = 8;
      PDPD.tow = null; jobCommit(state, 0);
      pdpSay("The tow unit did not survive the reload — dispatch collects the car."); return; }
    pdpTowTick(dt, state, a, s);
    return;
  }
  for (const c of TRF.cars.slice()) {
    if (!c || c.dead || c.towDue === undefined || c.towDue >= 1e8 || c === PDPD.tow) continue;
    c.towDue -= dt;
    if (c.towDue <= 0) { c.pdp = null; c.keep = false; c.j01tow = null; trfDrop(c);
      for (const s of stops) if (s.cid === c.id && !s.towDone) { s.towDone = 2; break; }
      jobCommit(state, 0);
      pdpSay("CAR COLLECTED · The wrecker dispatch called for it came itself — the car is off the curb, the tow is on the record."); }
  }
}
function pdpCustodyPanel(st) {
  const s = st.dsp ? st.dsp.state : "";
  const txt = !st.dsp ? "In your custody. Walk them to the station doors — or spend the one call this stop gets."
    : s === "enroute" ? "Unit en route along the road network. No promises on seconds."
    : s === "at-scene" ? "Unit holding at the curb · walk them to it."
    : s === "transport" ? "The unit has them. The booking rides with the cruiser."
    : s === "tow-to" ? "Booked. The unit is swinging back for the car."
    : (s === "tow-hook" || s === "tow-haul") ? "The wrecker leg is running — the car goes in behind them."
    : "The call is spent (" + s + "). The station doors are still yours.";
  if (PD.panel && PDPD.sigC === txt) return; PDPD.sigC = txt;
  const btn = [];
  if (!st.dsp || s === "unanswered") btn.push(["Call a unit to take them", () => { pdpCallTransport(); PDPD.sigC = ""; pdpCustodyPanel(pdpOpenStop((pdpShift() || { data: { pd: {} } }).data.pd) || st); }]);
  pdPanel("In custody", txt, btn);
}
// The radar panel grows its enforcement row here; the functions live with the shift, so a stale button
// always re-scans instead of acting on an old blip.
function pdpPanelRow(panel) {
  const mk = (label, fn) => {
    const b = document.createElement("button");
    b.type = "button"; b.className = "btn"; b.textContent = label;
    b.style.cssText = "min-width:60px;min-height:44px;margin:2px;text-align:left";
    b.onclick = () => { const r = fn(); if (!r.ok && typeof vehToast === "function") vehToast(r.why || "Not available."); pdRadarRefresh(); };
    panel.appendChild(b);
  };
  mk("FOLLOW", pdpFollow);
  mk("LIGHTS — PULL OVER", pdpSignal);
  mk(pdpShift() ? "END SHIFT — DEBRIEF" : "START SHIFT (station cruiser)", pdpShift() ? pdpEndShift : pdpStartShift);
}
if (typeof V10 !== "undefined") V10.onStep.push(dt => { try { pdpStep(dt); } catch (e) { window.__pdpErr = String((e && e.stack) || e).slice(0, 400); pdpRelease(); } });
// EOF:js/jobpatrol.js
