// FILE: js/rivalchase.js
// PART: v14.2 — rival evasion & the bounty
// DETAIL: Rivals you out-run (drive, fly, Instant-Transmit or just keep running) give up — "RIVAL EVADED · BOUNTY UP" —
//         and come back later with one more partner from their own universe for every time you've slipped them.
//
//   • In the open world (Nexus City, region worlds, real maps) a rival hero or bounty hunter that is more than
//     RVC_EVADE_M metres away and stays that far for RVC_LOST_S seconds loses your trail. Its whole team leaves
//     with it; any duel ring around it closes.
//   • Your bounty — the price on your head — goes up one star (🎯 pill on the HUD).
//   • 60-100 s later the same rival returns, finds you (the usual rival arrival + Showdown) and brings
//     +1 partner per evasion (max 4), picked from the rival's own universe.
//   • Finish a returning rival and you collect what they staked on you: cash in your wallet (in the world's
//     currency) and an XP burst; that rival's count resets and the bounty drops by what they had on you.
//   • The arena never triggers it (you can't out-run anyone in a closed fight).

"use strict";

const RVC_EVADE_M = 350, RVC_LOST_S = 6, RVC_MAX_TEAM = 4;
const RVC = { ev: {}, back: [], bounty: 0, chk: 0, lost: null, team: null, uid: null, claimed: 0, evaded: 0, force: -1 };

function rvcArrays() {
  if (!RVC.lost || RVC.lost.length !== MAX_E) { RVC.lost = new Float32Array(MAX_E); RVC.team = new Int16Array(MAX_E).fill(-1); RVC.uid = new Int32Array(MAX_E); }
}
function rvcOpenWorld() { return typeof CITY !== "undefined" && CITY.on && runActive; }
function rvcName(cid) { return String(typeof heroDisplayName === "function" ? heroDisplayName(cid) : (CHAR_RAW[cid] ? CHAR_RAW[cid][3] : "RIVAL")).toUpperCase(); }
function rvcIsRival(j) { return eAct[j] && eType[j] === 98 && typeof eRivalCid !== "undefined" && eRivalCid[j] >= 0; }
// which team a rival belongs to (the leader's hero id); untracked rivals lead their own team
function rvcTeamOf(j) { rvcArrays(); return RVC.uid[j] === eUid[j] && RVC.team[j] >= 0 ? RVC.team[j] : eRivalCid[j]; }

/* --- losing them -------------------------------------------------------------------------- */
function rvcStep(dt) {
  if (!rvcOpenWorld() || !player) return;
  rvcArrays();
  RVC.chk -= dt;
  if (RVC.chk <= 0) {
    const step = 0.25 - RVC.chk; RVC.chk = 0.25;
    const far = RVC_EVADE_M * 32, gone = new Set();
    for (let j = 0; j < MAX_E; j++) {
      if (!rvcIsRival(j)) { RVC.lost[j] = 0; continue; }
      if (RVC.uid[j] !== eUid[j]) { RVC.uid[j] = eUid[j]; RVC.team[j] = -1; RVC.lost[j] = 0; }
      const d = Math.hypot(eX[j] - player.x, eY[j] - player.y);
      RVC.lost[j] = d > far ? RVC.lost[j] + step : 0;
      if (RVC.lost[j] >= RVC_LOST_S) gone.add(rvcTeamOf(j));
    }
    for (const t of gone) rvcEvaded(t);
  }
  // returns that are due (never in the middle of a duel)
  if (RVC.back.length && !(typeof showdownBusy === "function" && showdownBusy())) {
    const i = RVC.back.findIndex(b => runTime >= b.t);
    if (i >= 0) { const b = RVC.back.splice(i, 1)[0]; rvcReturn(b.cid, b.n); }
  }
  if (((typeof TF !== "undefined" && TF.frame) || Math.floor(runTime * 60)) % 20 === 0) rvcHud();
}
function rvcEvaded(teamCid) {
  let left = 0;
  for (let j = 0; j < MAX_E; j++) if (rvcIsRival(j) && rvcTeamOf(j) === teamCid) {
    if (typeof showdown !== "undefined" && showdown.ri === j && typeof showdownEnd === "function") showdownEnd("evaded");
    eAct[j] = 0; RVC.lost[j] = 0; RVC.team[j] = -1; left++;
  }
  if (!left) return;
  const k = RVC.ev[teamCid] = (RVC.ev[teamCid] || 0) + 1;
  RVC.bounty++; RVC.evaded++;
  const n = Math.min(RVC_MAX_TEAM, k);
  RVC.back.push({ cid: teamCid, n, t: runTime + 60 + Math.random() * 40 });
  if (typeof fxBanner === "function") fxBanner("RIVAL EVADED · BOUNTY UP", rvcName(teamCid) + " lost your trail — back soon with " + n + " more", "#ffab40", 2.8, true, "rival");
  if (typeof spawnSpeech === "function") spawnSpeech(player.x, player.y - 30, "🎯 BOUNTY ★" + RVC.bounty, "#ffab40", 2.2);
  if (typeof sfx === "function") { sfx(300, 600, 0.2, "triangle", 0.12); setTimeout(() => sfx(600, 900, 0.2, "triangle", 0.1), 160); }
  rvcHud();
}

/* --- they come back, with friends ------------------------------------------------------- */
function rvcPartners(cid, n) {
  const fac = CHAR_RAW[cid] ? CHAR_RAW[cid][1] : -1, ids = (typeof heroRosterIds === "function" ? heroRosterIds() : []).filter(i => i !== cid && i !== player.cid && i !== CUSTOM_CID && CHAR_RAW[i]);
  const same = ids.filter(i => CHAR_RAW[i][1] === fac), pool = same.length >= n ? same : ids, out = [];
  while (out.length < n && pool.length) out.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  return out;
}
function rvcReturn(cid, n) {
  if (!rvcOpenWorld() || !player) return;
  rvcArrays();
  RVC.force = cid;
  let lead = -1;
  try { const before = new Set(); for (let j = 0; j < MAX_E; j++) if (rvcIsRival(j)) before.add(eUid[j]); spawnEnemy(false, true); for (let j = 0; j < MAX_E; j++) if (rvcIsRival(j) && !before.has(eUid[j]) && eRivalCid[j] === cid) { lead = j; break; } }
  finally { RVC.force = -1; }
  if (lead < 0) return;
  RVC.team[lead] = cid; RVC.uid[lead] = eUid[lead];
  const mates = rvcPartners(cid, n);
  mates.forEach((pc, k) => {
    const a = k / Math.max(1, mates.length) * 6.283, q = typeof cityFindWalkable === "function" ? cityFindWalkable(eX[lead] + Math.cos(a) * 70, eY[lead] + Math.sin(a) * 70, 200, false) : [eX[lead] + Math.cos(a) * 70, eY[lead] + Math.sin(a) * 70];
    const j = allocEnemySlot(q[0], q[1], 98, 1.0, 0, -1);
    if (j < 0) return;
    eRivalCid[j] = pc; RVC.team[j] = cid; RVC.uid[j] = eUid[j];
    if (typeof ST !== "undefined" && ST.city) ST.city[j] = 0;
  });
  const k = RVC.ev[cid] || n;
  if (typeof spawnSpeech === "function") spawnSpeech(player.x, player.y - 46, rvcName(cid) + ": \"Thought you could run? I brought " + (mates.length === 1 ? "a friend" : mates.length + " friends") + ".\"", "#ff5252", 3.6);
  if (typeof fxBanner === "function") fxBanner("THE RIVAL IS BACK", rvcName(cid) + " + " + mates.length + " · you slipped them " + k + "×", "#ff5252", 2.6, true, "rival");
}

/* --- finishing a returning rival pays out ---------------------------------------------- */
function rvcOnKill(idx, ex, ey, et, isEcho) {
  if (isEcho || !player || eType[idx] !== 98 || typeof eRivalCid === "undefined" || eRivalCid[idx] < 0) return;
  rvcArrays();
  const cid = eRivalCid[idx], k = RVC.ev[cid] || 0;
  if (!k || RVC.uid[idx] !== eUid[idx] || RVC.team[idx] !== cid) return;   // only the leader of a returning team carries the stake
  RVC.ev[cid] = 0; RVC.bounty = Math.max(0, RVC.bounty - k); RVC.claimed++;
  const cash = 150 * k + 50 * k * k;
  if (typeof itPay === "function") itPay(cash, rvcName(cid) + "'s stake on you");
  if (typeof spawnOrb === "function") for (let q = 0; q < 3 + k; q++) spawnOrb(eX[idx] + (Math.random() - 0.5) * 40, eY[idx] + (Math.random() - 0.5) * 40, 8 + waveNum * 2 * k);
  if (typeof fxBanner === "function") fxBanner("STAKE CLAIMED", rvcName(cid) + " is done chasing you · bounty ★" + RVC.bounty, "#69f0ae", 2.4, true, "rival");
  rvcHud();
}

/* --- HUD: the price on your head ------------------------------------------------------------ */
function rvcHud() {
  let el = document.getElementById("hudBounty");
  if (!el) { const dm = document.getElementById("hudDM"); if (!dm) return; el = document.createElement("div"); el.className = "stat-pill"; el.id = "hudBounty"; el.title = "The price on your head — rivals you evade come back with friends"; dm.insertAdjacentElement("beforebegin", el); }
  const on = RVC.bounty > 0 && runActive;
  el.style.display = on ? "" : "none";
  if (on) { el.textContent = "🎯 BOUNTY " + "★".repeat(Math.min(5, RVC.bounty)) + (RVC.bounty > 5 ? "+" + (RVC.bounty - 5) : ""); el.style.color = "#ffab40"; }
}

/* --- wiring ------------------------------------------------------------------------------- */
(function rvcWire() {
  // a returning rival is the same hero: the rival picker hands back the one that's coming for you
  if (typeof randomRosterHero === "function") {
    const o = randomRosterHero;
    window.randomRosterHero = randomRosterHero = function () { return RVC.force >= 0 ? RVC.force : o.apply(this, arguments); };
  }
  if (typeof V10 !== "undefined") {
    V10.onRunStart.push(() => { RVC.ev = {}; RVC.back = []; RVC.bounty = 0; RVC.chk = 0; RVC.claimed = 0; RVC.evaded = 0; RVC.force = -1; RVC.lost = null; rvcArrays(); rvcHud(); });
    V10.onStep.push(rvcStep);
    V10.onKill.push(rvcOnKill);
    V10.onRunReset.push(() => { const el = document.getElementById("hudBounty"); if (el) el.style.display = "none"; });
  }
})();
// EOF:js/rivalchase.js
