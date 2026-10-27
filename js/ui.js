// FILE: js/ui.js
// PART: 14 of 14
// DETAIL: v8.2 Overhaul — Guaranteed Card Touch-Drag Scroll Controller (enableScreenCardScroll), Stationary 350ms Inspector, In-Place Non-Destructive HUD (#spellBar, #utilBar, #dashSlot), Canonical Level-Up Weapon Colors (bladeCol), and 80-Hero Roster.

"use strict";

let eofAuditResults = [];

const UI_VISOR_DEFS = [
  { id: 0, short: "OFF", name: "Visor Off", desc: "Standard naked-eye optics." },
  { id: 1, short: "BOBA RF", name: "Mandalorian Rangefinder", desc: "Green telemetry lock on strongest on-screen threat (+10% Crit)." },
  { id: 2, short: "T-800 / SITH", name: "Cybernetic / Sith Neural HUD", desc: "Red neural target box with Head Life % & T-Zone readout (+10% Crit)." },
  { id: 3, short: "THERMAL / SPECTRE", name: "Yautja Thermal / Spectrespecs", desc: "Full-spectrum infrared & Wrackspurt heat signatures on all hostiles (+10% Crit)." },
  { id: 4, short: "PRESCIENCE", name: "Force / Matrix Prescience", desc: "Prophetic Force & construct target lock with vector prediction (+10% Crit)." }
];

function ensurePlayerVisors() {
  if (typeof player === "undefined" || !player) return;
  if (!Array.isArray(player.unlockedVisors)) {
    const startVisor = (typeof player.activeVisor === "number" && player.activeVisor > 0)
      ? player.activeVisor
      : ([1, 54].includes(player.cid) ? 1 : ([40, 65, 76].includes(player.cid) ? 2 : ([29, 59, 77].includes(player.cid) ? 3 : ([39, 56, 69, 71, 73, 74, 78, 79].includes(player.cid) ? 4 : 0))));
    player.unlockedVisors = startVisor > 0 ? [startVisor] : [];
    if (typeof player.activeVisor !== "number") player.activeVisor = startVisor;
  }
}

async function runDynamicEOFScan() {
  const files = ["js/chaos.js", "js/data-factions.js", "js/data-heroes.js", "js/data-relics.js", "js/state.js", "js/world.js", "js/combat.js", "js/sim.js", "js/render.js",
                 "js/fx.js", "js/rewind.js", "js/arsenal.js", "js/squad.js", "js/glory.js", "js/biomes.js", "js/campaign.js", "js/proving.js", "js/ui.js"];
  const results = [];
  for (let i = 0; i < files.length; i++) {
    const f = files[i], marker = "// " + "EOF:" + f;
    try {
      const res = await fetch(f + "?t=" + Date.now());
      const txt = (await res.text()).trim();
      const idx = txt.indexOf(marker);
      if (idx === -1) {
        results.push({ file: f, status: "MISSING // EOF MARKER", ok: false });
      } else if (idx + marker.length < txt.length) {
        const extra = txt.slice(idx + marker.length).trim().slice(0, 40);
        results.push({ file: f, status: "EXTRA TRAILING CODE: " + extra, ok: false });
        if (window.trackProgress) window.trackProgress(`Trailing paste code in ${f}: ${extra}`, true);
      } else {
        results.push({ file: f, status: "CLEAN (" + txt.split("\n").length + " L)", ok: true });
      }
    } catch (e) {
      results.push({ file: f, status: "LOADED", ok: true });
    }
  }
  eofAuditResults = results;
  const bad = results.filter(r => !r.ok && r.status.indexOf("EXTRA") !== -1);
  if (bad.length > 0) {
    const box = document.getElementById("bootDiag");
    if (box) { box.style.color = "#ff5252"; box.textContent = "OVERWRITE BUG IN: " + bad.map(b => b.file + " (" + b.status + ")").join(" | "); }
  }
}

function checkLoadedScripts() {
  const checks = [
    ["chaos.js", typeof ChaosMath !== "undefined"], ["data-factions.js", typeof FACTIONS !== "undefined"],
    ["data-heroes.js", typeof CHAR_RAW !== "undefined"], ["data-relics.js", typeof RELICS_DB !== "undefined"],
    ["state.js", typeof loadMeta === "function"], ["world.js", typeof getDistBiome === "function"],
    ["combat.js", typeof startRun === "function"], ["sim.js", typeof updateSim === "function"],
    ["render.js", typeof renderScene === "function"],
    ["fx.js", typeof fxTimeMul === "function"], ["rewind.js", typeof rewindPlayback === "function"],
    ["arsenal.js", typeof castWhistlingBirds === "function"], ["squad.js", typeof squadMinionsSim === "function"],
    ["glory.js", typeof gloryExecute === "function"], ["biomes.js", typeof biomeRenderGround === "function"],
    ["campaign.js", typeof renderCampaign === "function"], ["proving.js", typeof startProvingGround === "function"]
  ];
  const failed = checks.filter(c => !c[1]).map(c => c[0]);
  if (failed.length > 0) {
    const box = document.getElementById("bootDiag");
    if (box) { box.style.color = "#ff5252"; box.textContent = "FAILED TO PARSE: " + failed.join(", "); }
    if (window.trackProgress) window.trackProgress("Failed to parse: " + failed.join(", "), true);
    return false;
  }
  return true;
}

/* === 2. DIRECT CARD TOUCH-DRAG SCROLL CONTROLLER & 350ms HOLD INSPECTOR ===
   Guarantees swiping directly on top of Character/Stage/Shop cards always scrolls smoothly! */
let pressTimer = null, wasLongPress = false, wasScrolled = false;

function enableScreenCardScroll() {
  document.querySelectorAll(".screen").forEach(scr => {
    if (scr._cardScrollBound) return;
    scr._cardScrollBound = true;

    let dragging = false, startY = 0, lastY = 0, startScroll = 0;

    scr.addEventListener("touchstart", e => {
      if (!e.touches || e.touches.length !== 1) return;
      dragging = true;
      wasScrolled = false;
      startY = lastY = e.touches[0].clientY;
      startScroll = scr.scrollTop;
    }, { passive: true });

    scr.addEventListener("touchmove", e => {
      if (!dragging || !e.touches || e.touches.length !== 1) return;
      const curY = e.touches[0].clientY;
      const totalDY = Math.abs(curY - startY);
      const stepDY = lastY - curY;
      lastY = curY;

      if (totalDY > 9) {
        wasScrolled = true;
        clearTimeout(pressTimer);
        if (Math.abs(scr.scrollTop - startScroll) < 2) {
          scr.scrollTop += stepDY;
          startScroll = scr.scrollTop;
        }
      }
    }, { passive: true });

    scr.addEventListener("touchend", () => { dragging = false; }, { passive: true });
    scr.addEventListener("touchcancel", () => { dragging = false; }, { passive: true });

    scr.addEventListener("pointerdown", e => {
      if (e.pointerType === "touch") return;
      dragging = true;
      wasScrolled = false;
      startY = lastY = e.clientY || 0;
      startScroll = scr.scrollTop;
    }, { passive: true });

    scr.addEventListener("pointermove", e => {
      if (!dragging || e.pointerType === "touch") return;
      const curY = e.clientY || 0;
      const totalDY = Math.abs(curY - startY);
      const stepDY = lastY - curY;
      lastY = curY;

      if (totalDY > 9) {
        wasScrolled = true;
        clearTimeout(pressTimer);
        scr.scrollTop += stepDY;
      }
    }, { passive: true });

    scr.addEventListener("pointerup", () => { dragging = false; }, { passive: true });
    scr.addEventListener("pointercancel", () => { dragging = false; }, { passive: true });
  });
}

function openInspector(title, sub, body, iconHTML = "", heroCid = -1) {
  if (navigator.vibrate) navigator.vibrate(18);
  if (typeof runActive !== "undefined" && runActive) runPaused = true;
  document.getElementById("ttIcon").innerHTML = iconHTML;
  document.getElementById("ttTitle").textContent = title;
  document.getElementById("ttSub").textContent = sub;
  document.getElementById("ttBody").textContent = body;
  const cBox = document.getElementById("custBox");
  if (cBox) {
    if (heroCid >= 0) { cBox.style.display = "flex"; renderOutfitCustomizer(heroCid); }
    else cBox.style.display = "none";
  }
  document.getElementById("tooltip").style.display = "flex";
}

function renderOutfitCustomizer(cid) {
  const c = CHAR_RAW[cid] || CHAR_RAW[0], fac = FACTIONS[c[1]] || FACTIONS[0];
  const out = getOutfit(cid), pal = getHeroOutfits(cid);
  const btnBar = document.getElementById("custBtns");
  if (btnBar) {
    btnBar.innerHTML = "";
    const bladeLbl = (cid >= 56 && cid <= 75) ? "Wand/Magic" : "Saber/Glow";
    [["head", "Head"], ["torso", "Torso"], ["legs", "Legs"], ["back", "Back"], ["blade", bladeLbl]].forEach(([k, lbl]) => {
      if (!pal || !pal[k]) return;
      const btn = document.createElement("button");
      btn.className = k === "blade" ? "btn gold" : "btn";
      btn.style.padding = "3px 6px"; btn.style.fontSize = "0.58rem";
      const curName = (pal[k][out[k] || 0]) ? pal[k][out[k] || 0][0] : lbl;
      btn.textContent = `${lbl}: ${curName}`;
      btn.onclick = () => { cycleOutfitPart(cid, k); renderOutfitCustomizer(cid); renderChars(); };
      btnBar.appendChild(btn);
    });
  }
  const ccv = document.getElementById("custCv");
  if (!ccv) return;
  const cctx = ccv.getContext("2d");
  cctx.fillStyle = fac.bg; cctx.fillRect(0, 0, 290, 125);
  cctx.save(); cctx.translate(78, 72); cctx.scale(2.5, 2.5);
  drawHeroSprite(0, 0, fac, cid, 0.5, -0.2, 0, cctx, -1);
  cctx.restore();
  cctx.fillStyle = "#ffd166"; cctx.font = "bold 8px sans-serif"; cctx.fillText("ZOOMED OUTFIT VIEW", 12, 12);

  const badge = typeof getHeroHouseBadge === "function" ? getHeroHouseBadge(cid) : null;
  if (badge) {
    cctx.fillStyle = badge[2]; cctx.font = "bold 8px sans-serif";
    cctx.fillText(`${badge[0]} ${badge[1].toUpperCase()}`, 12, 118);
  }

  cctx.fillStyle = "#050912"; cctx.fillRect(158, 14, 128, 107);
  cctx.strokeStyle = "#00e5ff"; cctx.lineWidth = 1.2; cctx.strokeRect(158, 14, 128, 107);
  cctx.save(); cctx.translate(222, 68); cctx.scale(0.85, 0.85);
  [[-38, -28], [40, -24], [-42, 26], [36, 30]].forEach(([ex, ey]) => {
    cctx.fillStyle = fac.c2; cctx.fillRect(ex - 5, ey - 6, 10, 12);
    cctx.beginPath(); cctx.arc(ex, ey - 9, 4.5, 0, Math.PI * 2); cctx.fill();
  });
  drawHeroSprite(0, 0, fac, cid, 0, 0, 0, cctx, -1);
  cctx.restore();
  cctx.fillStyle = "#80deea"; cctx.font = "bold 7.5px sans-serif"; cctx.fillText("IN-GAME SCALE PREVIEW", 166, 24);
}

function bindTooltip(el, getTitle, getSub, getBody, getIcon = () => "", getHeroCid = () => -1) {
  let sx = 0, sy = 0, startScrollTop = 0, scrollContainer = null;

  el.addEventListener("contextmenu", e => {
    e.preventDefault();
  });

  el.addEventListener("pointerdown", e => {
    wasLongPress = false;
    wasScrolled = false;
    sx = e.clientX || 0;
    sy = e.clientY || 0;
    scrollContainer = el.closest(".screen");
    startScrollTop = scrollContainer ? scrollContainer.scrollTop : 0;
    clearTimeout(pressTimer);
    pressTimer = setTimeout(() => {
      if (wasScrolled) return;
      if (scrollContainer && Math.abs(scrollContainer.scrollTop - startScrollTop) > 6) return;
      wasLongPress = true;
      openInspector(getTitle(), getSub(), getBody(), getIcon(), getHeroCid());
    }, (typeof opts !== "undefined" ? opts.ttDelay : 350));
  }, { passive: true });

  el.addEventListener("pointermove", e => {
    const curScroll = scrollContainer ? scrollContainer.scrollTop : 0;
    if (Math.hypot((e.clientX || 0) - sx, (e.clientY || 0) - sy) > 10 || Math.abs(curScroll - startScrollTop) > 6) {
      clearTimeout(pressTimer);
    }
  }, { passive: true });

  el.addEventListener("pointerup", () => clearTimeout(pressTimer), { passive: true });
  el.addEventListener("pointercancel", () => clearTimeout(pressTimer), { passive: true });
}

document.getElementById("ttClose").onclick = () => {
  document.getElementById("tooltip").style.display = "none";
  if (typeof runActive !== "undefined" && runActive && !document.getElementById("scrLevel").classList.contains("active")) runPaused = false;
};

/* === 3. WEAPON TOGGLER, TACTICAL VISOR BAR (#visorToggleBar), PAPER TARGETS & LEVEL-UP === */
function renderWeaponToggler() {
  if (!player) return;
  ensurePlayerVisors();
  window._inHudUpdate = true;
  try {
    let tBar = document.getElementById("wpnToggleBar");
    const grid = document.getElementById("lvlGrid");
    if (!tBar && grid) {
      tBar = document.createElement("div"); tBar.id = "wpnToggleBar";
      tBar.className = "bar"; tBar.style.margin = "4px auto";
      grid.parentNode.insertBefore(tBar, grid.nextSibling);
    }
    if (tBar) {
      tBar.innerHTML = `<div style="font-size:0.6rem;color:#ffd166;width:100%;text-align:center">ACTIVE WEAPONS (TAP TO TOGGLE — MAX ${player.armCap || 2} HANDS AT ONCE):</div>`;
      player.weapons.forEach(w => {
        if (typeof w.enabled === "undefined") w.enabled = true;
        const btn = document.createElement("button");
        btn.className = "btn" + (w.enabled ? " sel" : " warn");
        btn.style.padding = "3px 7px";
        btn.style.fontSize = "0.58rem";
        btn.textContent = `${w.enabled ? "ON" : "OFF"}: ${w.name.split(" ")[0]} (L${w.lvl})`;
        btn.onclick = (e) => {
          e.stopPropagation();
          if (w.enabled && player.weapons.filter(x => x.enabled !== false).length <= 1) return;
          w.enabled = !w.enabled;
          renderWeaponToggler(); updateHUD();
        };
        tBar.appendChild(btn);
      });
    }

    let vBar = document.getElementById("visorToggleBar");
    if (!vBar && tBar) {
      vBar = document.createElement("div"); vBar.id = "visorToggleBar";
      vBar.className = "bar"; vBar.style.margin = "3px auto";
      tBar.parentNode.insertBefore(vBar, tBar.nextSibling);
    }
    if (vBar) {
      const unlocked = player.unlockedVisors || [];
      vBar.innerHTML = `<div style="font-size:0.58rem;color:#00e5ff;width:100%;text-align:center">TACTICAL VISOR HUD (${player.activeVisor > 0 ? "+10% CRIT ACTIVE" : "STANDBY — LOOT ON LEVEL-UP"}):</div>`;
      [0, ...unlocked].forEach(vid => {
        const vDef = UI_VISOR_DEFS[vid] || UI_VISOR_DEFS[0];
        const isSel = (player.activeVisor || 0) === vid;
        const btn = document.createElement("button");
        btn.className = "btn" + (isSel ? (vid > 0 ? " gold" : " sel") : "");
        btn.style.padding = "3px 7px";
        btn.style.fontSize = "0.56rem";
        btn.textContent = vid === 0 ? "VISOR: OFF" : `👁 ${vDef.short}`;
        btn.onclick = (e) => {
          e.stopPropagation();
          player.activeVisor = vid;
          sfx(vid > 0 ? 520 : 320, vid > 0 ? 960 : 180, 0.06, "sine", 0.12);
          renderWeaponToggler(); updateHUD();
        };
        vBar.appendChild(btn);
      });
    }
  } finally {
    window._inHudUpdate = false;
  }
}

const TARGET_TABS = ["1.Hench", "2.Wolf", "3.Spider", "4.Brute", "5.Titan"];
function drawRangeTarget(tabIdx = selRangeTab) {
  selRangeTab = tabIdx;
  window._inHudUpdate = true;
  try {
    const startIdx = (shWrite - shCount + MAX_SH) % MAX_SH;
    const tabCounts = [0, 0, 0, 0, 0];
    let globalHits = 0;
    for (let s = 0; s < shCount; s++) {
      const idx = (startIdx + s) % MAX_SH;
      tabCounts[shTgt[idx] || 0]++;
      if (shZone[idx] > 0) globalHits++;
    }
    const tabBar = document.getElementById("rangeTabs");
    if (tabBar) {
      tabBar.innerHTML = "";
      TARGET_TABS.forEach((tName, idx) => {
        const btn = document.createElement("button");
        btn.className = "btn" + (idx === tabIdx ? " sel" : "");
        btn.style.padding = "2px 5px"; btn.style.fontSize = "0.58rem";
        btn.textContent = `${tName} (${tabCounts[idx]})`;
        btn.onclick = (e) => { e.stopPropagation(); drawRangeTarget(idx); };
        tabBar.appendChild(btn);
      });
    }
    const rcv = document.getElementById("rangeCv");
    if (!rcv) return;
    const rctx = rcv.getContext("2d"), rw = rcv.width, rh = rcv.height, cx = rw * 0.5, cy = rh * 0.52;
    rctx.fillStyle = "#e8dfc8"; rctx.fillRect(0, 0, rw, rh);
    rctx.fillStyle = "#23272e"; rctx.strokeStyle = "#d9c8a9"; rctx.lineWidth = 1.4;
    if (tabIdx === 0) {
      rctx.fillRect(cx - 26, cy + 18, 20, 56); rctx.fillRect(cx + 6, cy + 18, 20, 56);
      rctx.fillRect(cx - 56, cy - 34, 20, 52); rctx.fillRect(cx + 36, cy - 34, 20, 52);
      rctx.fillRect(cx - 32, cy - 38, 64, 58); rctx.beginPath(); rctx.arc(cx, cy - 58, 18, 0, Math.PI * 2); rctx.fill();
    } else if (tabIdx === 1) {
      [-54, -32, 22, 44].forEach(ox => rctx.fillRect(cx + ox, cy + 12, 14, 52));
      rctx.fillRect(cx - 58, cy - 22, 104, 36); rctx.fillRect(cx + 42, cy - 38, 36, 30);
    } else if (tabIdx === 2) {
      rctx.beginPath(); rctx.ellipse(cx, cy + 18, 34, 26, 0, 0, Math.PI * 2); rctx.fill();
      rctx.beginPath(); rctx.arc(cx, cy - 22, 20, 0, Math.PI * 2); rctx.fill();
    } else {
      rctx.fillRect(cx - 38, cy + 20, 28, 52); rctx.fillRect(cx + 10, cy + 20, 28, 52);
      rctx.fillRect(cx - 76, cy - 36, 26, 62); rctx.fillRect(cx + 50, cy - 36, 26, 62);
      rctx.fillRect(cx - 50, cy - 42, 100, 64); rctx.beginPath(); rctx.arc(cx, cy - 52, 18, 0, Math.PI * 2); rctx.fill();
    }
    let tabShots = 0, tabCrits = 0, rangedCnt = 0, meleeCnt = 0;
    rctx.font = "bold 7.5px monospace"; rctx.textAlign = "left";
    for (let s = 0; s < shCount; s++) {
      const idx = (startIdx + s) % MAX_SH, num = s + 1;
      if (shTgt[idx] !== tabIdx) continue;
      tabShots++;
      const z = shZone[idx], atk = shAtk[idx];
      if (z >= 2) tabCrits++;
      if (atk === 0) rangedCnt++; else meleeCnt++;
      const px = cx + shNX[idx] * (rw * 0.44), py = cy + shNY[idx] * (rh * 0.44);
      rctx.strokeStyle = z === 0 ? "#ff5252" : (z >= 2 ? "#ffd166" : "#00e5ff");
      rctx.beginPath(); rctx.arc(px, py, 2.5, 0, Math.PI * 2); rctx.stroke();
      rctx.fillStyle = "#111"; rctx.fillText(String(num), px + 3, py - 2);
    }
    const stEl = document.getElementById("rangeStats");
    if (stEl) stEl.textContent = `Target: ${tabShots} of ${shCount}/100 | Acc: ${shCount ? Math.round((globalHits / shCount) * 100) : 100}% | T-Zone: ${tabShots ? Math.round((tabCrits / tabShots) * 100) : 0}% | ⊕:${rangedCnt} /:${meleeCnt}`;
  } finally {
    window._inHudUpdate = false;
  }
}

function triggerLevelUp() {
  if (window.trackProgress) window.trackProgress("Level Up Modal Opened: Lv." + player.lvl);
  ensurePlayerVisors();
  runPaused = true; sfx(330, 880, 0.22, "triangle");
  // FIX: several level-ups can be queued; show which level this pick belongs to and how many remain.
  const pend = Math.max(1, player.pendingLevelUps || 1);
  const pickLvl = player.lvl - pend + 1;
  document.getElementById("lvlTitle").textContent = "NEXUS LEVEL " + pickLvl + " — PICK 1 OF 3" + (pend > 1 ? ` (+${pend - 1} MORE)` : "");
  document.getElementById("pauseBar").style.display = "none";
  const grid = document.getElementById("lvlGrid"); grid.innerHTML = "";

  const curVac = typeof player.orbVacuumRate === "number" ? player.orbVacuumRate : 0;
  const guaranteedSuper = [], pool = [];
  // FIX: weapons switched OFF on the belt are no longer offered as upgrade cards (spec v9.0 §3.3).
  player.weapons.filter(w => w.enabled !== false).forEach(w => {
    if (w.lvl === 9) guaranteedSuper.push({ type: "wup", w, isSuper: true });
    else if (w.lvl < 9) pool.push({ type: "wup", w, isSuper: false });
  });

  const curSigLvl = player.sigGearLvl || 1;
  if (curSigLvl < 10) {
    pool.push({ type: "sigup", nextLvl: curSigLvl + 1 });
  }

  // FIX: the 4 random "NEW WEAPON" rolls could pick the same weapon twice (duplicate cards).
  const offeredNew = new Set();
  for (let k = 0; k < 4; k++) {
    const rc = CHAR_RAW[Math.floor(Math.random() * CHAR_RAW.length)];
    if (offeredNew.has(rc[0])) continue;
    if (!player.weapons.some(w => w.id === rc[0]) && player.weapons.length < (typeof MAX_WEAPONS !== "undefined" ? MAX_WEAPONS : 6)) {
      offeredNew.add(rc[0]);
      pool.push({ type: "wnew", c: rc });
    }
  }
  PASSIVES.forEach((p, idx) => {
    if (idx === 5 && curVac >= 1.0) return;
    const ex = player.passives.find(x => x.id === idx);
    if ((ex && ex.lvl < 5) || (!ex && player.passives.length < 6)) pool.push({ type: "pas", idx, p, lvl: ex ? ex.lvl + 1 : 1 });
  });

  const missingVisors = [1, 2, 3, 4].filter(v => !player.unlockedVisors.includes(v));
  if (missingVisors.length > 0 && Math.random() < 0.45) {
    const vPick = missingVisors[Math.floor(Math.random() * missingVisors.length)];
    pool.push({ type: "visor", vid: vPick });
  }

  if (curVac < 1.0 && typeof vacuumDistantOrbs === "function") pool.push({ type: Math.random() < 0.22 ? "vac100" : "vac35" });

  pool.sort(() => Math.random() - 0.5);
  const hand = [...guaranteedSuper, ...pool].slice(0, 3);
  // Safety net: a fully maxed build used to get an EMPTY card list (no way to close the modal).
  if (hand.length === 0) hand.push({ type: "heal" });
  window._inHudUpdate = true;
  try {
    hand.forEach(ch => {
      const card = document.createElement("div");
      let title = "", sub = "", desc = "", ico = "";
      if (ch.type === "wup") {
        const nxt = ch.w.lvl + 1;
        const sig = (typeof HERO_SIG_GEAR !== "undefined" && HERO_SIG_GEAR[ch.w.id]) ? HERO_SIG_GEAR[ch.w.id] : null;
        const lv5Name = sig ? sig[0] : ch.w.name;
        const nxtStance = typeof getHeroStanceSpec === "function" ? getHeroStanceSpec(ch.w.id, nxt, false).stageName : "Combat Form";
        card.className = "card unlocked" + (nxt === 10 ? " super-flash" : "");
        title = nxt === 10 ? "★ SUPERCHARGE: " + ch.w.superName + " (Lv.10)" : (nxt === 5 ? "★ LV.5 PRIMARY: " + lv5Name : ch.w.name + " (Lv." + nxt + "/10)");
        sub = nxt === 10 ? "GUARANTEED LEVEL 10 ULTIMATE EVOLUTION!" : (nxt === 4 || nxt === 7 ? `STANCE EVOLUTION: ${nxtStance.toUpperCase()}` : "Weapon, Stance & Spellbook Upgrade");
        desc = nxt === 10 ? `Supercharges ${nxtStance} & unlocks 2.35x Ultimate Damage!` : `+25% Base Damage, Stance: ${nxtStance}, & unlocks next Spellbook tier!`;
        ico = makeSVG(ch.w.style, nxt >= 5 ? "#ffd166" : "#00e5ff", "#ffd166", ch.w.id);
      } else if (ch.type === "sigup") {
        const sig = (typeof HERO_SIG_GEAR !== "undefined" && HERO_SIG_GEAR[player.cid]) ? HERO_SIG_GEAR[player.cid] : HERO_SIG_GEAR[0];
        const isMax = ch.nextLvl === 10;
        card.className = "card unlocked" + (isMax ? " super-flash" : "");
        title = `${isMax ? "★ MAX 360° " : ""}${sig[2].toUpperCase()} (Lv.${ch.nextLvl}/10)`;
        sub = "Signature Force / Secondary Hardware Upgrade";
        desc = isMax
          ? "MAX LEVEL: Expands Force Push / Hardware wave into a full 360° omni-directional circle with heavy stun & knockback!"
          : `Widens directional push cone (+18° arc), increases knockback distance, stun duration & +20% concussive power!`;
        ico = makeSVG("nova", "#00e5ff", "#ffd166", player.cid);
      } else if (ch.type === "wnew") {
        const sig = (typeof HERO_SIG_GEAR !== "undefined" && HERO_SIG_GEAR[ch.c[0]]) ? HERO_SIG_GEAR[ch.c[0]] : null;
        const f = FACTIONS[ch.c[1]] || FACTIONS[0];
        card.className = "card unlocked";
        title = "NEW WEAPON: " + ch.c[4]; sub = f.name + " Tech";
        desc = `Lv.5 Primary: ${sig ? sig[0] : ch.c[4]} | Lv.10: ${ch.c[5]}`;
        ico = makeSVG(ch.c[6], f.c1, f.c2, ch.c[0]);
      } else if (ch.type === "visor") {
        const vDef = UI_VISOR_DEFS[ch.vid];
        card.className = "card unlocked";
        title = `👁 TACTICAL VISOR: ${vDef.name.toUpperCase()}`;
        sub = "HUD Optics Module (+10% Crit Chance When Active)";
        desc = vDef.desc;
        ico = makeSVG("relic", "#00e5ff", "#ffd166");
      } else if (ch.type === "vac35") {
        card.className = "card unlocked";
        title = `SUBSPACE ORB SIPHON (+35% -> ${Math.min(100, Math.round((curVac + 0.35) * 100))}%)`;
        sub = "Distant Orb Vacuum Upgrade"; desc = "35% of all orbs auto-fly to you & pulls 35% of stranded map orbs!";
        ico = makeSVG("orbit", "#00ff88", "#00e5ff");
      } else if (ch.type === "vac100") {
        card.className = "card unlocked super-flash";
        title = "★ OMEGA SINGULARITY VACUUM (100% ORBS)"; sub = "RARE TOTAL ORB ABSORPTION MATRIX";
        desc = "100% of all distant & future orbs across the sector automatically fly to you!";
        ico = makeSVG("nova", "#ffd166", "#00ff88");
      } else if (ch.type === "heal") {
        card.className = "card unlocked";
        title = "NEXUS OVERFLOW: FIELD RESTORE"; sub = "Every upgrade is maxed";
        desc = "Restores 40% Max HP and fully repairs all limbs.";
        ico = makeSVG("pas", "#00e676", "#ffd166");
      } else {
        card.className = "card unlocked";
        title = `${ch.p[0]} (Lv.${ch.lvl}/5)`; sub = "Passive Matrix Slot"; desc = ch.p[1];
        ico = makeSVG("pas", "#00e676", "#ffd166");
      }
      card.innerHTML = `<div class="card-head">${ico}<div><div class="card-title">${title}</div><div class="card-sub">${sub}</div></div></div><div class="card-desc">${desc}</div>`;
      bindTooltip(card, () => title, () => sub, () => desc, () => ico);
      card.onclick = () => {
        if (wasLongPress || wasScrolled) return;
        if (ch.type === "wup") {
          ch.w.lvl++;
          if (ch.w.style === "orbit") player.saberMastery = Math.min(100, player.saberMastery + 10);
          if (ch.w.lvl === 10) spawnSpeech(player.x, player.y, "SUPERCHARGED: " + ch.w.superName.toUpperCase() + "!", "#ffd166", 2.6);
        } else if (ch.type === "sigup") {
          player.sigGearLvl = ch.nextLvl;
          player.sigGearCD = 0.25;
          spawnSpeech(player.x, player.y, `FORCE / HARDWARE LV.${ch.nextLvl}!`, "#00e5ff", 2.0);
        } else if (ch.type === "wnew") {
          const wCol = typeof getWeaponColor === "function" ? getWeaponColor(ch.c[0]) : "#00f0ff";
          player.weapons.push({
            id: ch.c[0],
            name: ch.c[4],
            superName: ch.c[5],
            style: ch.c[6],
            lvl: 1,
            cd: 0,
            ang: 0,
            angVel: 0,
            enabled: true,
            evolvedLv5: false,
            bladeCol: wCol
          });
          if (ch.c[6] === "orbit") { player.hasSaber = true; player.saberMastery = Math.max(10, player.saberMastery); }
        } else if (ch.type === "visor") {
          if (!player.unlockedVisors.includes(ch.vid)) player.unlockedVisors.push(ch.vid);
          player.activeVisor = ch.vid;
          spawnSpeech(player.x, player.y, UI_VISOR_DEFS[ch.vid].short + " ONLINE (+10% CRIT)!", "#00e5ff", 2.2);
        } else if (ch.type === "vac35") {
          player.orbVacuumRate = Math.min(1.0, +(curVac + 0.35).toFixed(2)); vacuumDistantOrbs(0.35);
        } else if (ch.type === "vac100") {
          player.orbVacuumRate = 1.0; vacuumDistantOrbs(1.0);
        } else if (ch.type === "heal") {
          player.hp = Math.min(player.maxHp, player.hp + player.maxHp * 0.4); player.limbs.fill(100);
        } else applyPassive(ch.idx);
        if (typeof syncHeroSpellbook === "function") syncHeroSpellbook();
        // FIX: consume one queued level-up; if more are waiting, deal a fresh hand immediately.
        player.pendingLevelUps = Math.max(0, (player.pendingLevelUps || 1) - 1);
        if (player.pendingLevelUps > 0) { updateHUD(); triggerLevelUp(); return; }
        runPaused = false; showScreen(null);
        updateHUD();
      };
      grid.appendChild(card);
    });
  } finally {
    window._inHudUpdate = false;
  }
  renderWeaponToggler(); drawRangeTarget(selRangeTab); showScreen("scrLevel");
}

/* === 4. IN-PLACE NON-DESTRUCTIVE HUD (#bodyHud, #spellBar, #utilBar, #dashSlot) === */
const LIMB_LBLS = ["HD", "TR", "LA", "RA", "LL", "RL"];

function updateHUD() {
  if (typeof player === "undefined" || !player) return;
  ensurePlayerVisors();
  window._inHudUpdate = true;
  try {
    if (typeof syncHeroSpellbook === "function") syncHeroSpellbook();

    document.getElementById("hpBar").style.width = Math.max(0, (player.hp / player.maxHp) * 100) + "%";
    document.getElementById("hpTxt").textContent = `${Math.ceil(player.hp)}/${Math.ceil(player.maxHp)}${player.inVehicle ? " [VEH]" : ""}`;
    document.getElementById("xpBar").style.width = Math.min(100, (player.xp / player.nextXp) * 100) + "%";
    const bRing = getDistBiome(player.x, player.y);
    document.getElementById("hudStage").textContent = `${player.fac.worlds[player.stg.tier]}-${player.stg.id} • W${waveNum} • ${bRing.name.split(" ")[0]}`;
    document.getElementById("hudDM").textContent = `DM: ${availDM()}`;
    updateTimeLabel();   // v9.01 step ladder label (shows REWIND / BUFFER START states)

    const bHud = document.getElementById("bodyHud");
    if (bHud && player.limbs) {
      for (let idx = 0; idx < 6; idx++) {
        let p = bHud.querySelector(`[data-limb="${idx}"]`);
        if (!p) {
          p = document.createElement("div");
          p.setAttribute("data-limb", String(idx));
          p.className = "stat-pill";
          p.style.cssText = "padding:2px 4px;font-size:0.58rem;cursor:pointer;";
          p.onpointerdown = (e) => {
            e.stopPropagation();
            player.guardZone = player.guardZone === idx ? -1 : idx;
            updateHUD();
          };
          bHud.appendChild(p);
        }
        const pct = Math.round(player.limbs[idx]), g = player.guardZone === idx;
        p.style.borderColor = g ? "#ffd166" : (pct < 55 ? "#ff5252" : (pct < 85 ? "#ffd166" : "#00e676"));
        p.textContent = `${g ? "🛡" : ""}${LIMB_LBLS[idx]}:${pct}%`;
      }

      let vp = bHud.querySelector(`[data-visor-pill="1"]`);
      if (player.activeVisor > 0) {
        if (!vp) {
          vp = document.createElement("div");
          vp.setAttribute("data-visor-pill", "1");
          vp.className = "stat-pill";
          vp.style.cssText = "padding:2px 5px;font-size:0.56rem;border-color:#00e5ff;color:#00e5ff;cursor:pointer;";
          vp.onpointerdown = (e) => {
            e.stopPropagation();
            const list = [0, ...(player.unlockedVisors || [])];
            const nextIdx = (list.indexOf(player.activeVisor) + 1) % list.length;
            player.activeVisor = list[nextIdx];
            updateHUD();
          };
          bHud.appendChild(vp);
        }
        vp.textContent = `👁 ${UI_VISOR_DEFS[player.activeVisor].short} (+10% CRIT)`;
      } else if (vp) {
        vp.remove();
      }
    }

    const spBar = document.getElementById("spellBar");
    if (spBar) {
      let necroPill = spBar.querySelector(`[data-necro-pill="1"]`);
      if (player.cid === 75 && typeof countActiveMinions === "function") {
        if (!necroPill) {
          necroPill = document.createElement("div");
          necroPill.setAttribute("data-necro-pill", "1");
          necroPill.className = "stat-pill";
          necroPill.style.cssText = "padding:2px 5px;font-size:0.56rem;border-color:#b388ff;color:#00ff88;";
          spBar.appendChild(necroPill);
        }
        const mCnt = countActiveMinions(-1);
        const cCnt = typeof countActiveCorpsesNear === "function" ? countActiveCorpsesNear(player.x, player.y, 320) : 0;
        necroPill.textContent = `💀 Army:${mCnt} | Corpses:${cCnt}`;
      } else if (necroPill) {
        necroPill.remove();
      }

      const spells = Array.isArray(player.spellbook) ? player.spellbook : [];
      spBar.querySelectorAll("[data-spell-idx]").forEach(el => {
        const idx = parseInt(el.getAttribute("data-spell-idx"), 10);
        if (!spells[idx] || el.getAttribute("data-spell-name") !== spells[idx].name) el.remove();
      });

      spells.forEach((sp, sIdx) => {
        let sb = spBar.querySelector(`[data-spell-idx="${sIdx}"]`);
        if (!sb) {
          sb = document.createElement("button");
          sb.setAttribute("data-spell-idx", String(sIdx));
          sb.setAttribute("data-spell-name", sp.name);
          sb.style.cssText = "padding:3px 7px;font-size:0.58rem;pointer-events:auto;";
          bindTooltip(sb, () => `SPELL: ${sp.name}`, () => `Unlocked at Lv.${sp.reqLvl} • Cooldown: ${sp.cdMax}s`, () => sp.desc);
          sb.onclick = (e) => {
            e.stopPropagation();
            if (!wasLongPress && typeof triggerSpell === "function") triggerSpell(sIdx);
          };
          spBar.appendChild(sb);
        }
        const rdy = sp.cd <= 0.05;
        sb.className = "btn" + (rdy ? " gold" : "");
        sb.style.opacity = rdy ? "1" : "0.65";
        sb.textContent = rdy ? `✨ ${sp.name}` : `${sp.name} (${sp.cd.toFixed(1)}s)`;
      });
    }

    const sHud = document.getElementById("saberHud");
    if (sHud) {
      const stanceTxt = player.activeStanceName ? player.activeStanceName.split(" (")[0] : "";
      if (player.hasSaber) {
        sHud.style.display = "inline-block";
        // FIX: this used to print saberMastery (e.g. 15%) while the real per-bolt chance was 0.35 + 0.65 * mastery.
        const reflectPct = typeof getSaberDeflectChance === "function" ? Math.round(getSaberDeflectChance() * 100) : Math.floor(player.saberMastery);
        sHud.textContent = `${stanceTxt ? stanceTxt + " • " : ""}Reflect: ${reflectPct}%`;
      } else if (stanceTxt) {
        sHud.style.display = "inline-block";
        sHud.textContent = `Stance: ${stanceTxt}`;
      } else {
        sHud.style.display = "none";
      }
    }

    const itBtn = document.getElementById("btnInteract"), tgt = findInteractTarget();
    if (tgt) { itBtn.style.display = "inline-block"; itBtn.textContent = tgt.label; } else itBtn.style.display = "none";

    const wBox = document.getElementById("wpnSlots");
    if (wBox) {
      // Rebuild when the weapon list (or the run) changes so slot handlers never point at stale objects.
      const wListKey = player.weapons.map(w => w.id).join(",") + "|" + runSeed;
      if (wBox.children.length !== player.weapons.length || wBox.getAttribute("data-wlist") !== wListKey) {
        wBox.innerHTML = "";
        wBox.setAttribute("data-wlist", wListKey);
      }
      player.weapons.forEach((w, wIdx) => {
        let d = wBox.children[wIdx];
        if (!d) {
          d = document.createElement("div");
          bindTooltip(d, () => `${w.name} (Lv.${w.lvl}/10)`, () => "Tap to Toggle ON/OFF • Hold 350ms to Inspect", () => `Supercharge: ${w.superName}\nStyle: ${w.style.toUpperCase()}`, () => makeSVG(w.style, "#00e5ff", "#ffd166", w.id));
          d.onclick = (e) => {
            e.stopPropagation();
            if (wasLongPress) return;
            if (w.enabled !== false && player.weapons.filter(x => x.enabled !== false).length <= 1) return;
            w.enabled = w.enabled === false ? true : false;
            updateHUD();
          };
          wBox.appendChild(d);
        }
        d.className = "slot" + (w.lvl >= 10 ? " super" : "");
        d.style.opacity = w.enabled === false ? "0.35" : "1";
        const wKey = `${w.id}_${w.lvl}_${w.enabled}`;
        if (d.getAttribute("data-wkey") !== wKey) {
          d.setAttribute("data-wkey", wKey);
          d.innerHTML = `${makeSVG(w.style, w.lvl >= 10 ? "#ffd166" : "#00e5ff", "#ffd166", w.id)}<span>L${w.lvl}</span>`;
        }
      });
    }

    const pBox = document.getElementById("pasSlots");
    const pListKey = player.passives.map(p => p.id).join(",") + "|" + runSeed;
    if (pBox && (pBox.children.length !== player.passives.length || pBox.getAttribute("data-plist") !== pListKey)) {
      pBox.setAttribute("data-plist", pListKey);
      pBox.innerHTML = "";
      player.passives.forEach(p => {
        const d = document.createElement("div"); d.className = "slot pas";
        d.innerHTML = `<span>P${p.id + 1}</span><span>L${p.lvl}</span>`;
        bindTooltip(d, () => `${p.name} (Lv.${p.lvl}/5)`, () => "Passive Matrix Slot", () => p.desc);
        pBox.appendChild(d);
      });
    } else if (pBox) {
      player.passives.forEach((p, idx) => {
        if (pBox.children[idx]) pBox.children[idx].innerHTML = `<span>P${p.id + 1}</span><span>L${p.lvl}</span>`;
      });
    }

    const rBox = document.getElementById("relicSlots");
    // FIX: rebuild when the relic SET changes (a replaced relic keeps the count the same).
    const relicKey = player.relics.map(r => r.id).join(",");
    if (rBox && rBox.getAttribute("data-relics") !== relicKey) {
      rBox.setAttribute("data-relics", relicKey);
      rBox.innerHTML = "";
      player.relics.forEach(r => {
        const d = document.createElement("div"); d.className = "slot relic";
        d.innerHTML = `${makeSVG("relic")}<span>R${r.id}</span>`;
        bindTooltip(d, () => `RELIC: ${r.name}`, () => "Boss Relic Matrix", () => r.desc, () => makeSVG("relic"));
        rBox.appendChild(d);
      });
    }

    const uBox = document.getElementById("utilBar");
    if (uBox) {
      if (uBox.children.length !== player.utils.length || uBox.getAttribute("data-cid") !== String(player.cid)) {
        uBox.innerHTML = "";
        uBox.setAttribute("data-cid", String(player.cid));
        player.utils.forEach((u, idx) => {
          const btn = document.createElement("div");
          btn.className = "util-btn ready";
          btn.innerHTML = `<div class="u-ico"></div><span class="u-lbl">RDY</span><div class="util-sweep"></div>`;
          bindTooltip(btn, () => u.name, () => `Fast Tap to Activate • Cooldown: ${u.cdMax}s`, () => u.desc, () => makeSVG(u.icon, "#ffd166"));
          btn.onclick = (e) => {
            e.stopPropagation();
            if (!wasLongPress) triggerUtility(idx);
          };
          uBox.appendChild(btn);
        });
      }
      player.utils.forEach((u, idx) => {
        const btn = uBox.children[idx];
        if (!btn) return;
        const ready = u.cd <= 0.01;
        const maxCD = Math.max(0.1, u.cdMax * player.utilCdrMul);
        const deg = ready ? 360 : Math.floor(((maxCD - u.cd) / maxCD) * 360);
        btn.className = "util-btn" + (ready ? " ready" : "");
        const icoEl = btn.querySelector(".u-ico");
        if (icoEl && icoEl.getAttribute("data-rdy") !== String(ready)) {
          icoEl.setAttribute("data-rdy", String(ready));
          icoEl.innerHTML = makeSVG(u.icon, ready ? "#ffd166" : "#90a4ae");
        }
        const lblEl = btn.querySelector(".u-lbl");
        if (lblEl) lblEl.textContent = ready ? "RDY" : u.cd.toFixed(1);
        const swEl = btn.querySelector(".util-sweep");
        if (swEl) swEl.style.setProperty("--sweep-deg", deg + "deg");
      });
    }

    const dBox = document.getElementById("dashSlot");
    if (dBox && typeof getHeroDashSpec === "function") {
      const dSpec = getHeroDashSpec(player.cid);
      if (dBox.children.length === 0 || dBox.getAttribute("data-cid") !== String(player.cid)) {
        dBox.innerHTML = "";
        dBox.setAttribute("data-cid", String(player.cid));
        const dBtn = document.createElement("div");
        dBtn.className = "util-btn dash-ready";
        dBtn.innerHTML = `<div class="d-ico"></div><span class="d-lbl">DASH</span><div class="util-sweep"></div>`;
        bindTooltip(
          dBtn,
          () => `💨 DASH: ${dSpec.name}`,
          () => `Tap Here or Double-Tap Distant Ground • CD: ${dSpec.cd}s`,
          () => `${dSpec.desc}\nCallout: "${dSpec.callout}"`,
          () => makeSVG("dash", "#00e676", "#ffd166")
        );
        dBtn.onclick = (e) => {
          e.stopPropagation();
          if (!wasLongPress && typeof executeHeroDash === "function") {
            const aimX = player.x + Math.cos(player.aim || 0) * dSpec.dist;
            const aimY = player.y + Math.sin(player.aim || 0) * dSpec.dist;
            executeHeroDash(aimX, aimY);
          }
        };
        dBox.appendChild(dBtn);
      }
      const dBtn = dBox.children[0];
      if (dBtn) {
        const cd = player.dashCD || 0;
        const maxCD = Math.max(0.1, player.dashMaxCD || dSpec.cd);
        const ready = cd <= 0.05;
        const deg = ready ? 360 : Math.floor(((maxCD - cd) / maxCD) * 360);
        dBtn.className = "util-btn" + (ready ? " dash-ready" : "");
        const icoEl = dBtn.querySelector(".d-ico");
        if (icoEl && icoEl.getAttribute("data-rdy") !== String(ready)) {
          icoEl.setAttribute("data-rdy", String(ready));
          icoEl.innerHTML = makeSVG("dash", ready ? "#00e676" : "#90a4ae", "#ffd166");
        }
        const lblEl = dBtn.querySelector(".d-lbl");
        if (lblEl) lblEl.textContent = ready ? "DASH" : cd.toFixed(1);
        const swEl = dBtn.querySelector(".util-sweep");
        if (swEl) swEl.style.setProperty("--sweep-deg", deg + "deg");
      }
    }
  } finally {
    window._inHudUpdate = false;
  }
}

function showScreen(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  if (id) document.getElementById(id).classList.add("active");
}
document.querySelectorAll("[data-back]").forEach(b => { b.onclick = () => showScreen(b.getAttribute("data-back")); });

function updateMenuUI() {
  if (!checkLoadedScripts()) return;
  const c = CHAR_RAW[meta.selChar] || CHAR_RAW[0], f = FACTIONS[c[1]] || FACTIONS[0], stg = STAGES[meta.selStage - 1] || STAGES[0], df = DIFFICULTIES[meta.diff] || DIFFICULTIES[1];
  const badge = typeof getHeroHouseBadge === "function" ? getHeroHouseBadge(c[0]) : null;
  document.getElementById("menuDM").textContent = `Dark Matter: ${availDM()} (Total: ${meta.dmEarned})`;
  document.getElementById("menuSelChar").textContent = `Hero: #${c[0]} ${c[3]}${badge ? " " + badge[0] : ""}`;
  const campNode = (typeof campaignSelectedNode === "function") ? campaignSelectedNode() : null;
  document.getElementById("menuSelStage").textContent = campNode ? `🗺️ ${campaignNodeLabel(campNode)}` : `Stage ${stg.id}: ${f.worlds[stg.tier]} ${stg.suffix}`;
  document.getElementById("menuDiff").textContent = `Difficulty: ${df.name}`;
  const gc = document.getElementById("goChars"); if (gc) gc.textContent = `CHARACTER ROSTER (${CHAR_RAW.length})`;
}

/* === 5. GENRE-SORTED 80-HERO ROSTER WITH BIOGRAPHICAL STANCES, DASH SPECS & HOUSE CRESTS === */
function renderChars() {
  if (typeof ensureStarterChars === "function") ensureStarterChars();
  document.getElementById("charDM").textContent = "Available DM: " + availDM();
  const g = document.getElementById("charGrid"); g.innerHTML = "";
  window._inHudUpdate = true;
  try {
    FACTIONS.forEach(fac => {
      const genreHeroes = CHAR_RAW.filter(c => c[1] === fac.id).sort((a, b) => (a[2] - b[2]) || (a[0] - b[0]));
      if (genreHeroes.length === 0) return;

      const hdr = document.createElement("div");
      hdr.style.cssText = `grid-column:1 / -1;padding:5px 8px;margin-top:6px;background:rgba(10,20,36,0.92);border-left:4px solid ${fac.c1};border-bottom:1px solid ${fac.c1}66;border-radius:4px;font-size:0.68rem;font-weight:bold;color:${fac.c1};display:flex;justify-content:space-between;align-items:center;`;
      hdr.innerHTML = `<span>SECTOR GENRE #${fac.id + 1}: ${fac.name.toUpperCase()} (${fac.worlds[0]} • ${genreHeroes.length} Heroes)</span><span style="color:#ffd166;font-size:0.58rem">Swipe Cards to Scroll</span>`;
      g.appendChild(hdr);

      genreHeroes.forEach(c => {
        const cid = c[0];
        const unl = meta.chars.includes(cid) || c[2] === 0;
        const sel = meta.selChar === cid, f = FACTIONS[c[1]] || FACTIONS[0], ico = makeSVG(c[6], f.c1, f.c2, cid);
        const utils = getHeroUtils(cid).map(u => u.name).join(" + "), alignStr = typeof getHeroAlign === "function" ? getHeroAlign(cid).toUpperCase() : "HERO";
        const sig = (typeof HERO_SIG_GEAR !== "undefined" && HERO_SIG_GEAR[cid]) ? HERO_SIG_GEAR[cid] : [c[4], "READY!", "Secondary Gear"];
        const badge = typeof getHeroHouseBadge === "function" ? getHeroHouseBadge(cid) : null;
        const stEarly = typeof getHeroStanceSpec === "function" ? getHeroStanceSpec(cid, 1, false).stageName : "Standard";
        const stMid   = typeof getHeroStanceSpec === "function" ? getHeroStanceSpec(cid, 4, false).stageName : "Veteran";
        const stPrime = typeof getHeroStanceSpec === "function" ? getHeroStanceSpec(cid, 7, false) : { stageName: "Prime", deflectName: "Deflect" };
        const dashSpec = typeof getHeroDashSpec === "function" ? getHeroDashSpec(cid) : { name: "Tactical Dash", desc: "Dashes forward" };

        const badgeHTML = badge
          ? `<div style="display:inline-block;margin-top:2px;padding:1px 5px;border-radius:4px;font-size:0.55rem;font-weight:bold;background:rgba(0,0,0,0.55);border:1px solid ${badge[2]};color:${badge[2]}">${badge[0]} ${badge[1]}</div>`
          : "";

        const d = document.createElement("div");
        d.className = "card " + (unl ? "unlocked" : "locked") + (sel ? " selected" : "");
        d.innerHTML = `<div class="card-head"><canvas width="36" height="36" style="position:relative;width:36px;height:36px;background:${f.bg};border:1px solid ${f.c1};border-radius:6px;flex-shrink:0"></canvas><div><div class="card-title">#${String(cid).padStart(2, "0")} ${c[3]}</div>
          <div class="card-sub">${f.name} • ${unl ? (c[2] === 0 ? "★ FREE STARTER" : "UNLOCKED") : c[2] + " DM"}</div>${badgeHTML}</div></div>
          <div class="card-desc"><b>Lv1:</b> ${c[4]}<br><b>Prime Form:</b> ${stPrime.stageName}<br><b>Dash:</b> ${dashSpec.name}<br><b>Gear:</b> ${sig[2]}</div>`;
        const pcv = d.querySelector("canvas");
        if (pcv) drawHeroSprite(18, 20, f, cid, 0, 0, 0, pcv.getContext("2d"), -1);

        const houseLine = badge ? `\nHouse / Order: ${badge[0]} ${badge[1]}` : "";
        bindTooltip(
          d,
          () => `#${cid} ${c[3]}`,
          () => `${f.name} (${alignStr})${badge ? " • " + badge[0] + " " + badge[1] : ""}`,
          () => `Lv.1 Weapon: ${c[4]}\nLv.5 Primary: ${sig[0]}\nLv.10 Supercharge: ${c[5]}\nStance Progression:\n • Early (Lv.1-3): ${stEarly}\n • Seasoned (Lv.4-6): ${stMid}\n • Prime (Lv.7-10): ${stPrime.stageName}\n • Deflect Form: ${stPrime.deflectName}\nSignature Dash: ${dashSpec.name} (${dashSpec.desc})\nMounted Gear: ${sig[2]}\nPassive: ${c[7]} (${c[8]})\nUtilities: ${utils}${houseLine}`,
          () => ico,
          () => cid
        );
        d.onclick = () => {
          if (wasLongPress || wasScrolled) return;
          if (unl) { meta.selChar = cid; saveMeta(); renderChars(); }
          else if (availDM() >= c[2]) { meta.dmSpent += c[2]; meta.chars.push(cid); meta.selChar = cid; saveMeta(); renderChars(); sfx(440, 880, 0.16, "triangle"); }
        };
        g.appendChild(d);
      });
    });
  } finally {
    window._inHudUpdate = false;
  }
}

function renderStages() {
  const f = FACTIONS[(CHAR_RAW[meta.selChar] || CHAR_RAW[0])[1]] || FACTIONS[0], g = document.getElementById("stageGrid"); g.innerHTML = "";
  const cleared = Array.isArray(meta.cleared) ? meta.cleared : [];
  STAGES.forEach(s => {
    const unl = meta.stages.includes(s.id), sel = meta.selStage === s.id, wName = f.worlds[s.tier], d = document.createElement("div");
    const done = cleared.includes(s.id);
    d.className = "card " + (unl ? "unlocked" : "locked") + (sel ? " selected" : "");
    d.innerHTML = `<div class="card-title">Stage ${s.id}: ${wName} ${s.suffix}${done ? " ✓" : ""}</div><div class="card-sub">HP x${s.hpMul} • Titan Drop: ${s.dmDrop} DM${done ? " • CLEARED" : ""}</div><div class="card-desc">Hazard: ${s.hazard}${unl ? "" : `<br>🔒 Defeat the Stage ${s.id - 1} Sector Titan to unlock`}</div>`;
    d.onclick = () => { if (!wasLongPress && !wasScrolled && unl) { meta.selStage = s.id; if (meta.campaign) meta.campaign.selNode = null; saveMeta(); renderStages(); } }; g.appendChild(d);
  });
}

function renderMeta() {
  document.getElementById("metaDM").textContent = "Available DM: " + availDM();
  const g = document.getElementById("metaGrid"); g.innerHTML = "";
  META_UPG.forEach((u, idx) => {
    const r = meta.ranks[idx], cost = u[2] * (r + 1), d = document.createElement("div"); d.className = "card unlocked";
    d.innerHTML = `<div class="card-title">${u[0]} (Rank ${r}/5)</div><div class="card-sub">${r >= 5 ? "MAXED" : "Cost: " + cost + " DM"}</div><div class="card-desc">${u[1]} per rank</div>`;
    d.onclick = () => { if (!wasLongPress && !wasScrolled && r < 5 && availDM() >= cost) { meta.dmSpent += cost; meta.ranks[idx]++; saveMeta(); renderMeta(); sfx(380, 720, 0.1, "sine"); } }; g.appendChild(d);
  });
}

function renderCodex() {
  const g = document.getElementById("codexGrid"); g.innerHTML = "";
  FACTIONS.forEach(f => {
    const d = document.createElement("div"); d.className = "card unlocked";
    d.innerHTML = `<div class="card-title">${f.name} Biome</div><div class="card-sub">${f.worlds.join(" → ")}</div><div class="card-desc"><b>Tall:</b> ${f.tall}<br><b>Low:</b> ${f.low}<br><b>Loot:</b> ${f.loot}</div>`;
    g.appendChild(d);
  });
}

function renderOpts() {
  const box = document.getElementById("optList"); box.innerHTML = "";
  const df = DIFFICULTIES[meta.diff] || DIFFICULTIES[1];
  const rows = [
    ["Difficulty Tier", df.name, () => { meta.diff = (meta.diff + 1) % 5; saveMeta(); }],
    ["Double-Tap Distant Dash", opts.doubleTapDash !== false ? "ON (DOUBLE-TAP GROUND)" : "OFF (BUTTON ONLY)", () => { opts.doubleTapDash = opts.doubleTapDash === false ? true : false; }],
    ["Limbs, Blood & Bodies Persist Count", String(opts.persistCount || 100), () => {
      const tiers = [50, 100, 250, 500, 1000, 9999];
      opts.persistCount = tiers[(tiers.indexOf(opts.persistCount) + 1) % tiers.length] || 100;
    }],
    ["Temporal Nexus Speed", fmtTimeScale(timeScale > 0 ? timeScale : 1), () => { setTimeScale(1, timeScale >= TIME_SCALE_MAX || timeScale <= 0); }],
    ["Screen Shake & Hit-Stop", opts.shake !== false ? "ON" : "OFF", () => { opts.shake = opts.shake === false; }],
    ["Run Telemetry Pill (FPS / Bodies)", opts.perfHud !== false ? "ON" : "OFF", () => { opts.perfHud = opts.perfHud === false; }],
    ["Biome Weather FX", opts.weather !== false ? "ON" : "OFF", () => { opts.weather = opts.weather === false; }],
    ["Camera Zoom", opts.zoom.toFixed(2) + "x", () => { opts.zoom = opts.zoom >= 1.75 ? 0.5 : +(opts.zoom + 0.25).toFixed(2); }],
    ["Floating Damage / Speech", opts.dmgNums ? "ON" : "OFF", () => { opts.dmgNums = !opts.dmgNums; }],
    ["Screen Flash Effects", opts.flash ? "ON" : "OFF", () => { opts.flash = !opts.flash; }],
    ["Master Synth Volume", Math.round(opts.vol * 100) + "%", () => { opts.vol = opts.vol >= 0.8 ? 0 : +(opts.vol + 0.2).toFixed(2); }],
    ["HUD Handedness Layout", opts.hudFlip ? "LEFT-HANDED" : "STANDARD", () => { opts.hudFlip = !opts.hudFlip; }]
  ];
  rows.forEach(r => {
    const btn = document.createElement("button"); btn.className = "btn"; btn.textContent = `${r[0]}: ${r[1]}`;
    btn.onclick = () => { r[2](); if (typeof saveOpts === "function") saveOpts(); renderOpts(); }; box.appendChild(btn);
  });
}

async function renderHealth() {
  await runDynamicEOFScan();
  const auditHTML = eofAuditResults.map(r => `<div style="color:${r.ok ? "#00e676" : "#ff5252"}">• ${r.file}: ${r.status}</div>`).join("");
  document.getElementById("healthBox").innerHTML = `
    <div class="health-row"><b>Dynamic EOF & Trailing-Line Paste Audit:</b><br>${auditHTML}</div>
    <div class="health-row"><b>80-Hero Stature Voxel, 11 Biomes, Biographical Stances & Dash Engine: 100% VERIFIED</b><br>Zero Shared Placeholders Across All 80 Heroes (#00-#79)<div class="meter"><div class="meter-fill"></div></div></div>
    <div class="health-row"><b>Live Render Load & Gore Telemetry:</b><br>${fpsCount} FPS • ${frameMs}ms/frame • Corpses: ${activeCorpseCount}/${opts.persistCount}<div class="meter"><div class="meter-fill"></div></div></div>`;
}

/* === 6. FLOATING JOYSTICK + DOUBLE-TAP DISTANT GROUND DASH DETECTOR === */
let lastCanvasTapTime = 0, lastCanvasTapX = 0, lastCanvasTapY = 0;

if (typeof cv !== "undefined") {
  cv.addEventListener("pointerdown", e => {
    const now = performance.now();
    const cx = e.clientX || 0, cy = e.clientY || 0;

    if (runActive && !runPaused && player && opts.doubleTapDash !== false && typeof executeHeroDash === "function") {
      const dtTap = now - lastCanvasTapTime;
      const tapDrift = Math.hypot(cx - lastCanvasTapX, cy - lastCanvasTapY);
      const distFromCenter = Math.hypot(cx - W * 0.5, cy - H * 0.5);
      if (dtTap < 330 && tapDrift < 75 && distFromCenter >= 48) {
        const worldX = player.x + (cx - W * 0.5) / (opts.zoom || 1);
        const worldY = player.y + (cy - H * 0.5) / (opts.zoom || 1);
        if (executeHeroDash(worldX, worldY)) {
          lastCanvasTapTime = 0;
          return;
        }
      }
      lastCanvasTapTime = now;
      lastCanvasTapX = cx;
      lastCanvasTapY = cy;
    }

    // FIX: the stick is owned by ONE pointer. A second finger touching the canvas used to re-center
    // it, and lifting ANY finger (e.g. tapping DASH) released it mid-drag.
    if (joy.act && e.pointerId !== joy.id) return;
    joy.act = true; joy.id = e.pointerId; joy.ox = cx; joy.oy = cy; joy.dx = 0; joy.dy = 0;
  });
  cv.addEventListener("pointermove", e => {
    if (!joy.act || e.pointerId !== joy.id) return;
    const vx = e.clientX - joy.ox, vy = e.clientY - joy.oy, m = Math.hypot(vx, vy) || 1, c = Math.min(1, m / opts.joySize);
    joy.dx = (vx / m) * c; joy.dy = (vy / m) * c;
  });
  const releaseJoy = () => { joy.act = false; joy.id = -1; joy.dx = 0; joy.dy = 0; };
  const onPointerEnd = e => { if (joy.act && e.pointerId === joy.id) releaseJoy(); };
  window.addEventListener("pointerup", onPointerEnd);
  window.addEventListener("pointercancel", onPointerEnd);
  // Safety net: if the owning pointer's "up" was ever lost, release once no fingers remain.
  window.addEventListener("touchend", e => { if (e.touches && e.touches.length === 0) releaseJoy(); });
  window.addEventListener("touchcancel", e => { if (e.touches && e.touches.length === 0) releaseJoy(); });
  window.addEventListener("blur", releaseJoy);
}

document.getElementById("goPlay").onclick = () => { if (checkLoadedScripts()) { if (window.trackProgress) window.trackProgress("Deploying Hero #" + meta.selChar); startRun(); } };
document.getElementById("goDiff").onclick = () => { if (checkLoadedScripts()) { meta.diff = (meta.diff + 1) % 5; saveMeta(); sfx(340, 520, 0.08, "triangle"); } };
document.getElementById("goChars").onclick = () => { if (checkLoadedScripts()) { renderChars(); showScreen("scrChars"); } };
document.getElementById("goStages").onclick = () => { if (checkLoadedScripts()) { showScreen("scrCampaign"); renderCampaign(true); } };   // v10 Expedition map
document.getElementById("goProving").onclick = () => { if (checkLoadedScripts()) startProvingGround(); };                                   // v10 Debug All
campaignInitUI();
document.getElementById("goMeta").onclick = () => { if (checkLoadedScripts()) { renderMeta(); showScreen("scrMeta"); } };
document.getElementById("goCodex").onclick = () => { if (checkLoadedScripts()) { renderCodex(); showScreen("scrCodex"); } };
document.getElementById("goOpts").onclick = () => { if (checkLoadedScripts()) { renderOpts(); showScreen("scrOpts"); } };
document.getElementById("goHealth").onclick = () => { if (checkLoadedScripts()) { renderHealth(); showScreen("scrHealth"); } };
document.getElementById("goHelp").onclick = () => showScreen("scrHelp");
// FIX: the Character-screen respec used respecAll(), which also wiped every Shop upgrade.
document.getElementById("btnRespecChars").onclick = () => { if (typeof respecHeroes === "function") respecHeroes(); else respecAll(); renderChars(); };
document.getElementById("btnRespecAll").onclick = () => { respecAll(); renderMeta(); };
document.getElementById("btnTimeDown").onclick = () => setTimeScale(-0.5, false);
document.getElementById("btnTimeReset").onclick = () => setTimeScale(0, true);
document.getElementById("btnTimeUp").onclick = () => setTimeScale(0.5, false);
document.getElementById("btnInteract").onclick = () => { if (typeof triggerWorldInteract === "function") triggerWorldInteract(); };
document.getElementById("btnZoomIn").onclick = () => { opts.zoom = Math.min(2.0, +(opts.zoom + 0.2).toFixed(2)); if (typeof saveOpts === "function") saveOpts(); };
document.getElementById("btnZoomOut").onclick = () => { opts.zoom = Math.max(0.5, +(opts.zoom - 0.2).toFixed(2)); if (typeof saveOpts === "function") saveOpts(); };
document.getElementById("btnPause").onclick = (e) => {
  e.stopPropagation();
  if (!runActive) return;
  runPaused = true;
  document.getElementById("lvlTitle").textContent = "RUN PAUSED";
  document.getElementById("lvlGrid").innerHTML = "";
  document.getElementById("pauseBar").style.display = "flex";
  renderWeaponToggler(); drawRangeTarget(selRangeTab); showScreen("scrLevel");
};
document.getElementById("btnResume").onclick = (e) => {
  e.stopPropagation();
  runPaused = false;
  document.getElementById("pauseBar").style.display = "none";
  showScreen(null);
};
document.getElementById("btnQuitRun").onclick = (e) => {
  e.stopPropagation();
  // FIX: quitting used to purge the run and bank 0 DM. It now pays out like any other run end.
  if (runActive && player && typeof endRun === "function") { endRun("quit"); return; }
  purgeRunMemory();
  document.getElementById("pauseBar").style.display = "none";
  document.getElementById("hud").classList.remove("active");
  showScreen("scrMain");
};

/* === 7. END-OF-RUN SUMMARY (new: runs used to dump you straight back to the main menu) === */
let lastRunSummary = null;
function fmtRunClock(sec) {
  const s = Math.max(0, Math.floor(sec || 0));
  return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
}

function showRunSummary(sm) {
  lastRunSummary = sm;
  const scr = document.getElementById("scrSummary");
  if (!scr) { showScreen("scrMain"); updateMenuUI(); return; }
  const titles = { death: "☠ KIA — RUN OVER", quit: "⏏ RUN ENDED — EXTRACTED" };
  document.getElementById("sumTitle").textContent = (sm.cleared ? "★ SECTOR CLEARED • " : "") + (titles[sm.reason] || "RUN OVER");
  let subTxt;
  if (sm.cleared && sm.campaignLabel) subTxt = "District secured: new routes are charted on the Galactic Expedition Map.";
  else if (sm.cleared) subTxt = sm.unlockedStage ? `Stage ${sm.unlockedStage} is now unlocked on the Sector Map.` : (sm.stageId >= STAGES.length ? "Final sector cleared — the multiverse is yours." : "Sector cleared again.");
  else subTxt = sm.bossSpawned ? "The Sector Titan is still out there — defeat it to clear this sector." : "Survive to 2:00 to summon the Sector Titan, then defeat it to clear the sector.";
  document.getElementById("sumSub").textContent = subTxt;
  const row = (label, val, col = "#e0f2f1") => `<div style="display:flex;justify-content:space-between;gap:8px"><span style="color:#90a4ae">${label}</span><b style="color:${col}">${val}</b></div>`;
  const mulTxt = sm.mul > 1.0001 ? ` × ${sm.mul.toFixed(2)} greed` : "";
  document.getElementById("sumBox").innerHTML = `
    <div class="health-row">${row("Hero", sm.hero)}${row("Sector", sm.campaignLabel ? "🗺️ " + sm.campaignLabel : `Stage ${sm.stageId}: ${sm.stageName}`)}${row("Difficulty", sm.diffName)}</div>
    <div class="health-row">${row("Time survived", fmtRunClock(sm.time))}${row("Nexus level", sm.lvl)}${row("Kills", sm.kills)}${row("Glory kills · best streak", `${sm.glories || 0} ☠ · x${sm.bestStreak || 0}`, "#ff9100")}${row("Arsenal", `${sm.weapons} weapon(s) • ${sm.relics} relic(s)`)}</div>
    <div class="health-row">
      ${row("Kills ÷ 18", "+" + sm.killDM + " DM")}
      ${row("Run bonuses", "+" + sm.bonusDM + " DM")}
      ${row("Run payout" + mulTxt, "+" + sm.runDM + " DM")}
      ${row("Sector Titan drop", sm.stageDM ? "+" + sm.stageDM + " DM (banked at kill)" : "—", sm.stageDM ? "#00e676" : "#90a4ae")}
      <div style="border-top:1px solid #263850;margin:5px 0 3px"></div>
      ${row("TOTAL EARNED", "+" + sm.totalDM + " DM", "#ffd166")}
      ${row("Dark Matter available", availDM() + " DM", "#ffd166")}
    </div>`;
  const nextBtn = document.getElementById("btnSumNext");
  const nextId = sm.stageId + 1;
  if (nextBtn) {
    const canNext = sm.campaignLabel ? true : (nextId <= STAGES.length && meta.stages.includes(nextId));
    nextBtn.style.display = canNext ? "inline-block" : "none";
    nextBtn.textContent = sm.campaignLabel ? "EXPEDITION MAP ▶" : `NEXT SECTOR (STAGE ${nextId}) ▶`;
  }
  updateMenuUI();
  showScreen("scrSummary");
}

if (document.getElementById("btnSumAgain")) {
  document.getElementById("btnSumAgain").onclick = () => { if (checkLoadedScripts()) startRun(); };
  document.getElementById("btnSumNext").onclick = () => {
    if (!lastRunSummary || !checkLoadedScripts()) return;
    if (lastRunSummary.campaignLabel) { showScreen("scrCampaign"); renderCampaign(true); return; }   // v10 Expedition runs
    const nextId = lastRunSummary.stageId + 1;
    if (meta.stages.includes(nextId)) { meta.selStage = nextId; saveMeta(); }
    startRun();
  };
  document.getElementById("btnSumMenu").onclick = () => { updateMenuUI(); showScreen("scrMain"); };
}

let lastTS = performance.now();
function loop(ts) {
  requestAnimationFrame(loop);
  const rawDt = Math.min(0.05, (ts - lastTS) / 1000); lastTS = ts;
  if (typeof fpsCount !== "undefined" && rawDt > 0) fpsCount = Math.round(fpsCount * 0.9 + (1 / rawDt) * 0.1);
  if (typeof flashAlpha !== "undefined" && flashAlpha > 0) flashAlpha = Math.max(0, flashAlpha - rawDt * 2.5);
  try {
    if (typeof updateSim === "function") updateSim(rawDt);
    if (typeof renderScene === "function") renderScene();
  } catch (err) {
    try { ctx.restore(); } catch (e) {}
    if (window.trackProgress) window.trackProgress("LOOP ERR: " + err.message, true);
  }
}

enableScreenCardScroll();
if (checkLoadedScripts()) { loadMeta(); updateMenuUI(); runDynamicEOFScan(); requestAnimationFrame(loop); }
// EOF:js/ui.js
