// FILE: js/proving.js
// PART: v10 module 8 of 8
// DETAIL: v10 "Debug All" Proving Ground — an automated in-game test runner launched from the main menu. It deploys the
//         selected hero into a training arena (no natural spawns, invulnerable), places training dummies and plays 14
//         live gameplay actions in real time (boot/HUD, firing, close-quarters blade strikes, skills, dash, looting, level-up,
//         driving, squad orders, glory kill, v12 execute chain, v12 rival showdown, time rewind, memory purge), ticking each
//         one PASS/FAIL on a live checklist
//         with a copyable report at the end. Doubles as a regression smoke test for the v9.01 fixes.

"use strict";

const provingState = { active: false, idx: -1, t: 0, D: null, results: [], startedAt: 0, done: false, hero: 0 };

/* === 1. ARENA HELPERS === */
function pgDummy(x, y, type = 0, hp = 60000) {
  const i = allocEnemySlot(x, y, type, 1.0, 0, -1);
  if (i < 0) return -1;
  eDummy[i] = 1; eHP[i] = eMax[i] = hp; eSpd[i] = 0; eFireCD[i] = 999;
  return i;
}
function pgClearArena() {
  for (let i = 0; i < MAX_E; i++) { eAct[i] = 0; eDummy[i] = 0; eStagger[i] = 0; }
  pAct.fill(0);
}
function pgCount(arr, n) { let c = 0; for (let i = 0; i < n; i++) if (arr[i]) c++; return c; }
function pgChunkObj(type, dx, dy) {
  const cx = Math.floor(player.x / CHUNK_SIZE), cy = Math.floor(player.y / CHUNK_SIZE);
  const o = { id: "pg_" + type + "_" + Date.now(), x: player.x + dx, y: player.y + dy, rad: type === 4 ? 15 : 18, type, tall: false, used: false, seed: 7, poly: null };
  getChunk(cx, cy).push(o);
  return o;
}

// Straw training dummy on a post (drawn instead of the soldier sprite for eDummy enemies).
function drawTrainingDummy(ex, ey, baseR, i) {
  ctx.save(); ctx.translate(ex, ey);
  ctx.fillStyle = "#6d4c41"; ctx.fillRect(-1.5, -2, 3, 14);
  ctx.fillStyle = eScarHitCD[i] > 0.1 ? "#fff3e0" : "#d7b98a";
  ctx.beginPath(); ctx.arc(0, -2, baseR * 0.8, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "#b71c1c"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(0, -2, baseR * 0.5, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = "#b71c1c"; ctx.beginPath(); ctx.arc(0, -2, baseR * 0.18, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#cfa86b"; ctx.beginPath(); ctx.arc(0, -baseR * 1.05, baseR * 0.38, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

/* === 2. THE 14 LIVE ACTIONS === */
const PROVING_TESTS = [
  { name: "Boot & HUD", desc: "Run boots, hero armed, HUD + skills mounted",
    setup() {}, tick(D) { return D.t > 0.4 ? (player && player.weapons.length > 0 && player.utils.length === 2 && document.getElementById("hud").classList.contains("active") ? true : "HUD/loadout missing") : null; } },

  { name: "Firing", desc: "Primary weapon auto-fires and damages a dummy",
    setup(D) { pgClearArena(); D.d = pgDummy(player.x + (player.hasSaber ? 40 : 110), player.y); D.hp0 = eHP[D.d]; },
    tick(D) { return eHP[D.d] < D.hp0 - 1 ? true : (D.t > 4 ? "dummy never took damage" : null); } },

  { name: "Close-Quarters Blade", desc: "v11: dummies behind & beside you at 26px are all cut down by targeted Form strikes",
    setup(D) {
      pgClearArena();
      const prim = player.weapons[0];
      D.tempBlade = !(player.hasSaber && prim && (prim.style === "orbit" || (typeof isSwordWeapon === "function" && isSwordWeapon(prim.id))));
      D.oldSaber = player.hasSaber;
      if (D.tempBlade) {
        player.weapons.unshift({ id: 0, name: "Proving Saber", superName: "", style: "orbit", lvl: 3, cd: 0, ang: 0, angVel: 0, enabled: true, evolvedLv5: false, bladeCol: "#00e5ff" });
        player.hasSaber = true;
      }
      const a = player.aim || 0;
      D.ds = [a + Math.PI, a + Math.PI / 2, a - Math.PI / 2].map(t => pgDummy(player.x + Math.cos(t) * 26, player.y + Math.sin(t) * 26));
      D.hp0 = D.ds.map(i => eHP[i]);
    },
    tick(D) {
      const hit = D.ds.filter((i, k) => eHP[i] < D.hp0[k] - 1).length;
      D.note = hit + "/3 hit";
      if (hit === 3) return true;
      return D.t > 3 ? `only ${hit}/3 close-range dummies were hit` : null;
    },
    cleanup(D) { if (D.tempBlade) { player.weapons.shift(); player.hasSaber = D.oldSaber; } pgClearArena(); } },

  { name: "Skills", desc: "Both utility skills fire and start their cooldowns",
    setup(D) { pgDummy(player.x + 120, player.y - 30); player.utils.forEach(u => { u.cd = 0; }); triggerUtility(0); triggerUtility(1); },
    tick(D) { return D.t > 0.3 ? (player.utils[0].cd > 0 && player.utils[1].cd > 0 ? true : "a skill did not trigger") : null; },
    cleanup() { pgClearArena(); } },

  { name: "Dash", desc: "Hero dash relocates the hero",
    setup(D) { player.dashCD = 0; D.x0 = player.x; D.y0 = player.y; D.ok = executeHeroDash(player.x + 160, player.y + 20); },
    tick(D) { const d = Math.hypot(player.x - D.x0, player.y - D.y0); D.note = Math.round(d) + "px"; return d > 40 ? true : (D.t > 1.6 ? "dash moved only " + Math.round(d) + "px" : null); } },

  { name: "Looting", desc: "XP orbs are vacuumed & a supply pod opens",
    setup(D) {
      D.xp0 = player.xp; D.lvl0 = player.lvl;
      for (let k = 0; k < 3; k++) spawnOrb(player.x + 10 + k * 6, player.y - 8, 4);
      D.pod = pgChunkObj(4, 22, 0);
      triggerWorldInteract();
    },
    tick(D) {
      const xpOk = player.xp > D.xp0 || player.lvl > D.lvl0 || player.pendingLevelUps > 0;
      if (xpOk && D.pod.used) return true;
      return D.t > 2.5 ? (D.pod.used ? "orbs not collected" : "supply pod did not open") : null;
    } },

  { name: "Level-Up", desc: "A level-up opens the card picker and a pick applies",
    setup(D) { D.lvl0 = player.lvl; player.xp = player.nextXp + 0.5; D.clicked = false; },
    tick(D) {
      const scr = document.getElementById("scrLevel");
      if (scr.classList.contains("active")) {
        const c = document.querySelector("#lvlGrid .card");
        if (c) { c.click(); D.clicked = true; }
      }
      if (D.clicked && !scr.classList.contains("active") && player.lvl > D.lvl0) return true;
      return D.t > 3 ? "no level-up / card pick" : null;
    },
    cleanup() { if (player) { player.pendingLevelUps = 0; player.nextXp = 1e12; } } },

  { name: "Driving", desc: "Board a hovercraft, drive it, dismount",
    setup(D) { D.veh = pgChunkObj(5, 10, 0); triggerWorldInteract(); D.stage = 0; D.x0 = player.x; D.y0 = player.y; D.key = "KeyD"; },
    tick(D) {
      if (D.stage === 0) {
        if (player.inVehicle !== 1) { if (D.t > 0.3 && D.t < 0.35) triggerWorldInteract(); return D.t > 1 ? "could not board" : null; }
        // v12: drive toward whichever direction is clear of rocks / props (procedural worlds differ every run)
        const dirs = [["KeyD", 1, 0], ["KeyA", -1, 0], ["KeyS", 0, 1], ["KeyW", 0, -1]];
        let bestK = "KeyD", bestFree = -1;
        for (const [k, dx, dy] of dirs) {
          let free = 0;
          for (let s = 1; s <= 8; s++) { if (typeof isPointBlockedByObstacle === "function" && isPointBlockedByObstacle(player.x + dx * s * 12, player.y + dy * s * 12, true)) break; free++; }
          if (free > bestFree) { bestFree = free; bestK = k; }
        }
        D.key = bestK; D.stage = 1; D.x0 = player.x; D.y0 = player.y; keys[D.key] = true; D.t1 = D.t;
      }
      if (D.stage === 1 && D.t - D.t1 > 0.6) { keys[D.key] = false; D.dx = Math.hypot(player.x - D.x0, player.y - D.y0); triggerWorldInteract(); D.stage = 2; }
      if (D.stage === 2) { D.note = Math.round(D.dx) + "px driven"; return (player.inVehicle === 0 && D.dx > 20) ? true : (D.t > 2.5 ? "drive/dismount failed" : null); }
      return D.t > 3 ? "timeout" : null;
    },
    cleanup(D) { keys.KeyD = keys.KeyA = keys.KeyS = keys.KeyW = false; if (player) player.inVehicle = 0; } },

  { name: "Squad Orders", desc: "Fireteam holds, focuses a marked dummy, regroups",
    setup(D) {
      pgClearArena();
      squadCallFireteam(player.x, player.y, "proving", 4, 60);
      D.stage = 0; D.ax = player.x; D.ay = player.y;
      squadIssueOrder(1);
      player.x += 170;
    },
    tick(D) {
      const ms = []; for (let m = 0; m < MAX_MINION; m++) if (mAct[m] && mKind[m] >= 5) ms.push(m);
      if (!ms.length) return "no soldiers spawned";
      if (D.stage === 0 && D.t > 1.2) {
        const far = ms.filter(m => Math.hypot(mX[m] - D.ax, mY[m] - D.ay) > 95).length;
        if (far) return far + " soldier(s) left the HOLD anchor";
        D.tgt = pgDummy(player.x + 60, player.y - 150); D.hp0 = eHP[D.tgt];
        squadIssueOrder(2); D.stage = 1; D.t1 = D.t;
      }
      if (D.stage === 1) {
        if (eHP[D.tgt] < D.hp0 - 1 && squadState.focusIdx === D.tgt) { D.stage = 2; D.t2 = D.t; D.d0 = ms.reduce((a, m) => a + Math.hypot(mX[m] - player.x, mY[m] - player.y), 0) / ms.length; squadIssueOrder(0); }
        else if (D.t - D.t1 > 3.5) return "focus target not engaged";
      }
      if (D.stage === 2 && D.t - D.t2 > 0.6) {   // v14.1: poll up to 2.5 s (one sample at 1.2 s was a coin flip while they finished the volley)
        const d1 = ms.reduce((a, m) => a + Math.hypot(mX[m] - player.x, mY[m] - player.y), 0) / ms.length;
        D.note = `regroup ${Math.round(D.d0)}→${Math.round(d1)}px`;
        if (d1 < D.d0 - 10 || d1 < 70) return true;
        if (D.t - D.t2 > 2.5) return "squad did not regroup";
      }
      return D.t > 8 ? "timeout" : null;
    },
    cleanup() { for (let m = 0; m < MAX_MINION; m++) if (mAct[m] && mKind[m] >= 5) mAct[m] = 0; if (typeof squadIssueOrder === "function" && player) squadState.order = 0; pgClearArena(); } },

  { name: "Glory Kill", desc: "A wounded elite staggers and is executed",
    setup(D) {
      pgClearArena();
      D.e = allocEnemySlot(player.x + 85, player.y, 3, 1.0, 0, -1);
      eMax[D.e] = 5000; eHP[D.e] = 750; eStun[D.e] = 99; eSpd[D.e] = 0; eFireCD[D.e] = 999;
      D.uid = eUid[D.e]; D.g0 = gloryState.count; D.fired = false;
    },
    tick(D) {
      if (!D.fired && eStagger[D.e] > 0 && eUid[D.e] === D.uid) { gloryExecute(D.e); D.fired = true; }
      if (D.fired && !(eAct[D.e] && eUid[D.e] === D.uid) && gloryState.count > D.g0) return true;
      return D.t > 4 ? (D.fired ? "execution did not finish" : "elite never staggered") : null;
    },
    cleanup() { pgClearArena(); } },

  { name: "Execute Chain", desc: "v12: EXECUTE takes the highest-ranked staggered elite first; a second tap chains the next",
    setup(D) {
      pgClearArena();
      D.L = allocEnemySlot(player.x - 60, player.y + 10, 0, 1.0, 1, -1);          // shield-wall leader (rank 2), closer
      D.H = allocEnemySlot(player.x + 140, player.y, 3, 1.0, 0, -1);               // heavy (rank 3), farther
      // (high HP so stray shots can't finish them before the finisher - an execution kills at any HP)
      [D.L, D.H].forEach(i => { eMax[i] = 5000; eHP[i] = 4500; eStun[i] = 99; eSpd[i] = 0; eFireCD[i] = 999; gloryStagger(i); });
      D.uL = eUid[D.L]; D.uH = eUid[D.H]; D.g0 = gloryState.count; D.stage = 0;
      D.wOn = player.weapons.map(w => w.enabled); player.weapons.forEach(w => { w.enabled = false; }); D.sig = player.sigGearCD; player.sigGearCD = 1e9;
    },
    tick(D) {
      if (D.stage === 0 && D.t > 0.25 && !gloryState.exec) {          // (the previous test's finisher may still be playing)
        if (gloryState.best !== D.H) return "best target is not the highest-ranked elite";
        if (!gloryRequest() || !gloryState.exec || gloryState.exec.i !== D.H) return "EXECUTE did not fire on the heavy";
        gloryRequest();
        if (!gloryState.queued) return "second tap did not queue the chain";
        D.stage = 1;
      }
      if (D.stage === 1) {
        const hGone = !(eAct[D.H] && eUid[D.H] === D.uH), lGone = !(eAct[D.L] && eUid[D.L] === D.uL);
        if (hGone && lGone && gloryState.count >= D.g0 + 2) { D.note = `heavy → leader · chain ×${gloryState.chain}`; return true; }
      }
      return D.t > 4.5 ? "chain did not finish" : null;
    },
    cleanup(D) { if (player && D && D.wOn) { player.weapons.forEach((w, k) => { if (k < D.wOn.length) w.enabled = D.wOn[k]; }); player.sigGearCD = D.sig || 0; } pgClearArena(); } },

  { name: "Rival Showdown", desc: "v12: the crowd backs into a ring, the rival executes a challenger, then duels you",
    setup(D) {
      pgClearArena();
      for (let k = 0; k < 10; k++) {
        const a = k / 10 * Math.PI * 2, d = 50 + (k % 3) * 28;
        const i = allocEnemySlot(player.x + Math.cos(a) * d, player.y + Math.sin(a) * d, k % 3, 1.0, 0, -1);
        if (i >= 0) { eHP[i] = eMax[i] = 1e5; eFireCD[i] = 999; }
      }
      spawnEnemy(false, true);
      D.ri = -1; for (let i = 0; i < MAX_E; i++) if (eAct[i] && eType[i] === 98) D.ri = i;
      if (D.ri >= 0) { eFireCD[D.ri] = 999; D.rUid = eUid[D.ri]; }
      D.stage = 0;
    },
    tick(D) {
      if (D.ri < 0) return "no rival spawned";
      if (D.stage === 0 && D.t > 0.2 && showdown.phase === SD_IDLE) return "showdown did not start";
      if (D.stage === 0 && showdown.phase === SD_DUEL) {
        let minD = 1e9, n = 0;
        for (let j = 0; j < MAX_E; j++) if (sdSpect(j)) { n++; minD = Math.min(minD, Math.hypot(eX[j] - player.x, eY[j] - player.y)); }
        if (showdown.finishers < 1) return "rival never executed a challenger";
        if (n < 5) return "crowd did not form";
        if (minD < 80) return `crowd too close (${Math.round(minD)}px)`;
        D.note = `${n} spectators ≥${Math.round(minD)}px, challenger executed`;
        killEnemy(D.ri, false); D.stage = 1; D.t1 = D.t;
      }
      if (D.stage === 1 && D.t - D.t1 > 0.2) {
        let left = 0; for (let j = 0; j < MAX_E; j++) if (sdSpect(j)) left++;
        return showdown.phase === SD_IDLE && left === 0 ? true : "crowd was not released after the duel";
      }
      return D.t > 7 ? "showdown timeout (" + SD_PHASE_NAMES[showdown.phase] + ")" : null;
    },
    cleanup() { if (typeof showdownEnd === "function" && showdown.phase !== SD_IDLE) showdownEnd("test"); pgClearArena(); } },

  { name: "Time Rewind", desc: "Kill a dummy, rewind -1.0x: it returns as an echo",
    setup(D) { pgClearArena(); D.d = pgDummy(player.x + 90, player.y + 40); D.uid = eUid[D.d]; D.stage = 0; },
    tick(D) {
      if (D.stage === 0 && D.t > 1.6) { D.tKill = runTime; killEnemy(D.d, false); D.stage = 1; D.t1 = D.t; }
      if (D.stage === 1 && D.t - D.t1 > 0.4) { setTimeScaleExact(-1.0); D.stage = 2; D.t2 = D.t; }
      if (D.stage === 2 && D.t - D.t2 > 0.5) {   // v14.1: keep rewinding until the kill is undone (≤ 2.2 s) — a slow frame no longer fails it
        let back = -1; for (let i = 0; i < MAX_E; i++) if (eAct[i] && eUid[i] === D.uid) back = i;
        if ((back < 0 || !(runTime < D.tKill)) && D.t - D.t2 < 2.2) return null;
        D.rt = runTime; setTimeScaleExact(1.0); D.stage = 3; D.t3 = D.t;
        if (back < 0) return "killed dummy did not come back";
        if (!eEcho[back]) return "resurrected dummy is not flagged as an echo";
        if (!(D.rt < D.tKill)) return "run clock did not go backwards";
      }
      if (D.stage === 3 && D.t - D.t3 > 0.35) { D.note = `clock ${D.tKill.toFixed(1)}s → ${D.rt.toFixed(1)}s`; return runTime > D.rt ? true : "sim did not resume forward"; }
      return D.t > 6 ? "timeout" : null;
    },
    cleanup() { if (timeScale < 0) setTimeScaleExact(1.0); pgClearArena(); } },

  { name: "Memory Purge", desc: "End-of-run purge empties every pool",
    setup(D) {
      spawnParticles(player.x, player.y, 12);
      spawnCorpse(player.x + 30, player.y, 12345, 0, 0, 0, null, null, -1);
      D.before = pgCount(corpAct, MAX_CORPSE) + pgCount(ptAct, MAX_PT) + pgCount(lmbAct, MAX_LIMB) + pgCount(slAct, MAX_SLICE) + pgCount(pAct, MAX_P) + pgCount(oAct, MAX_O);
      purgeRunMemory();
      document.getElementById("hud").classList.remove("active");
    },
    tick(D) {
      const left = pgCount(eAct, MAX_E) + pgCount(corpAct, MAX_CORPSE) + pgCount(ptAct, MAX_PT) + pgCount(lmbAct, MAX_LIMB) + pgCount(slAct, MAX_SLICE) +
                   pgCount(pAct, MAX_P) + pgCount(oAct, MAX_O) + pgCount(mAct, MAX_MINION) + pgCount(dAct, MAX_D) + pgCount(drAct, MAX_DRIP);
      D.note = `${D.before} → ${left}`;
      return (left === 0 && player === null && !runActive) ? true : `${left} pooled objects survived the purge`;
    } }
];

/* === 3. RUNNER === */
function startProvingGround() {
  if (!checkLoadedScripts()) return;
  window.PROVING_ACTIVE = true;
  const P = provingState;
  P.active = true; P.idx = -1; P.results = []; P.done = false; P.startedAt = performance.now(); P.hero = meta.selChar;
  if (meta.campaign) meta.campaign._pgSel = meta.campaign.selNode;
  startRun();
  provingPanel(true);
  provingNext();
  if (window.trackProgress) window.trackProgress("Proving Ground started with hero #" + meta.selChar);
}

function provingNext() {
  const P = provingState;
  if (P.idx >= 0 && PROVING_TESTS[P.idx].cleanup && player) { try { PROVING_TESTS[P.idx].cleanup(P.D); } catch (e) {} }
  P.idx++;
  if (P.idx >= PROVING_TESTS.length) { provingFinish(); return; }
  P.D = { t: 0, note: "" };
  try { PROVING_TESTS[P.idx].setup(P.D); }
  catch (e) { provingRecord(false, "setup error: " + e.message); provingNext(); return; }
  provingPanel();
}

function provingRecord(ok, reason) {
  const P = provingState, T = PROVING_TESTS[P.idx];
  P.results.push({ name: T.name, ok, reason: ok ? (P.D.note || "") : reason, secs: +P.D.t.toFixed(2) });
  if (window.trackProgress) window.trackProgress(`Proving ${ok ? "PASS" : "FAIL"}: ${T.name}${ok ? "" : " (" + reason + ")"}`, !ok);
  sfx(ok ? 880 : 180, ok ? 1320 : 120, 0.08, ok ? "triangle" : "square", 0.1);
}

function provingFrame(rawDt) {
  const P = provingState;
  if (!P.active || P.done) return;
  const T = PROVING_TESTS[P.idx];
  if (!T) return;
  // the player quit / died mid-run (the final purge step ends the run on purpose): abort cleanly
  if (!runActive && T.name !== "Memory Purge") {
    P.active = false; window.PROVING_ACTIVE = false; keys.KeyD = false;
    if (meta.campaign) delete meta.campaign._pgSel;
    const el = document.getElementById("provingPanel"); if (el) el.style.display = "none";
    if (window.trackProgress) window.trackProgress("Proving Ground aborted (run ended at step " + (P.idx + 1) + ")");
    return;
  }
  P.D.t += rawDt;
  if (player) { player.invulnT = 1e9; player.hp = player.maxHp; }
  // a stray level-up (orbs from the looting step, kill XP) must never freeze the arena mid-test
  if (T.name !== "Level-Up" && runActive && document.getElementById("scrLevel").classList.contains("active")) {
    const c = document.querySelector("#lvlGrid .card");
    if (c) c.click();
  }
  let r;
  try { r = T.tick(P.D, rawDt); } catch (e) { r = "error: " + e.message; }
  if (r === true) { provingRecord(true); provingNext(); }
  else if (typeof r === "string") { provingRecord(false, r); provingNext(); }
  else provingPanel();
}

function provingFinish() {
  const P = provingState;
  P.done = true; P.active = false; window.PROVING_ACTIVE = false;
  if (meta.campaign && "_pgSel" in meta.campaign) { meta.campaign.selNode = meta.campaign._pgSel; delete meta.campaign._pgSel; }
  if (runActive) purgeRunMemory();
  document.getElementById("hud").classList.remove("active");
  if (typeof updateMenuUI === "function") updateMenuUI();
  showScreen("scrMain");
  provingPanel();
}

function provingReportText() {
  const P = provingState, pass = P.results.filter(r => r.ok).length;
  const hero = CHAR_RAW[P.hero] ? `#${P.hero} ${CHAR_RAW[P.hero][3]}` : "#" + P.hero;
  return [`OMNI-SHIFT DEBUG ALL · PROVING GROUND — ${pass}/${P.results.length} PASSED — hero ${hero} — ${new Date().toISOString()}`]
    .concat(P.results.map((r, k) => `${r.ok ? "PASS" : "FAIL"}  ${String(k + 1).padStart(2, "0")} ${r.name} (${r.secs}s)${r.reason ? " — " + r.reason : ""}`)).join("\n");
}

/* === 4. LIVE CHECKLIST PANEL === */
function provingPanel(create) {
  let el = document.getElementById("provingPanel");
  if (!el) {
    el = document.createElement("div");
    el.id = "provingPanel";
    document.body.appendChild(el);
  }
  const P = provingState;
  if (!P.active && !P.done) { el.style.display = "none"; return; }
  el.style.display = "block";
  const pass = P.results.filter(r => r.ok).length;
  let html = `<div class="pg-head">🧪 DEBUG ALL · PROVING GROUND <span>${P.done ? `${pass}/${PROVING_TESTS.length} PASSED` : `${P.idx + 1}/${PROVING_TESTS.length}`}</span></div>`;
  html += `<div class="pg-bar"><i style="width:${Math.round(100 * P.results.length / PROVING_TESTS.length)}%"></i></div>`;
  PROVING_TESTS.forEach((T, k) => {
    const r = P.results[k], cur = !P.done && k === P.idx;
    const ico = r ? (r.ok ? "✅" : "❌") : (cur ? "▶" : "·");
    const note = r ? (r.reason || "") : (cur ? (P.D.note || T.desc) : T.desc);
    html += `<div class="pg-row${cur ? " cur" : ""}${r && !r.ok ? " bad" : ""}"><b>${ico}</b> ${String(k + 1).padStart(2, "0")} ${T.name}<small>${note}</small></div>`;
  });
  if (P.done) html += `<div class="pg-btns"><button class="btn" id="pgCopy">COPY REPORT</button><button class="btn gold" id="pgAgain">RUN AGAIN</button><button class="btn" id="pgClose">CLOSE</button></div>`;
  el.innerHTML = html;
  if (P.done) {
    document.getElementById("pgCopy").onclick = () => { const t = provingReportText(); if (navigator.clipboard) navigator.clipboard.writeText(t).catch(() => {}); if (window.trackProgress) window.trackProgress(t); };
    document.getElementById("pgAgain").onclick = () => startProvingGround();
    document.getElementById("pgClose").onclick = () => { P.done = false; el.style.display = "none"; };
  }
}

V10.onRunStart.unshift(function provingRunStart(p) {   // runs first so other modules see the arena flags
  if (!window.PROVING_ACTIVE) return;
  p.noSpawns = true; p.invulnT = 1e9;
});
V10.onFrame.push(provingFrame);
// EOF:js/proving.js
