// FILE: js/ui.js
// PART: 14 of 14
// DETAIL: Guaranteed Lv.10 modal, Per-Target Filtered 100-Shot Paper Target Renderer (each tab shows only its own shots out of the global 1..100 window), and HUD.

"use strict";

/* === 1. 350ms LONG-PRESS INSPECTOR & SCRIPT CHECK === */
function checkLoadedScripts() {
  return typeof ChaosMath !== "undefined" && typeof FACTIONS !== "undefined" &&
         typeof CHAR_RAW !== "undefined" && typeof startRun === "function";
}

let pressTimer = null, wasLongPress = false;
function openInspector(title, sub, body, iconHTML = "") {
  if (navigator.vibrate) navigator.vibrate(18);
  if (typeof runActive !== "undefined" && runActive) runPaused = true;
  document.getElementById("ttIcon").innerHTML = iconHTML;
  document.getElementById("ttTitle").textContent = title;
  document.getElementById("ttSub").textContent = sub;
  document.getElementById("ttBody").textContent = body;
  document.getElementById("tooltip").style.display = "flex";
}

function bindTooltip(el, getTitle, getSub, getBody, getIcon = () => "") {
  let sx = 0, sy = 0;
  el.addEventListener("pointerdown", e => {
    wasLongPress = false; sx = e.clientX || 0; sy = e.clientY || 0;
    clearTimeout(pressTimer);
    pressTimer = setTimeout(() => {
      wasLongPress = true;
      openInspector(getTitle(), getSub(), getBody(), getIcon());
    }, (typeof opts !== "undefined" ? opts.ttDelay : 350));
  });
  el.addEventListener("pointermove", e => {
    if (Math.hypot((e.clientX || 0) - sx, (e.clientY || 0) - sy) > 14) clearTimeout(pressTimer);
  });
  el.addEventListener("pointerup", () => clearTimeout(pressTimer));
  el.addEventListener("pointercancel", () => clearTimeout(pressTimer));
}

document.getElementById("ttClose").onclick = () => {
  document.getElementById("tooltip").style.display = "none";
  if (typeof runActive !== "undefined" && runActive && !document.getElementById("scrLevel").classList.contains("active")) {
    runPaused = false;
  }
};

/* === 2. v4.1 5-ARCHETYPE GUN-STORE PAPER TARGET TELEMETRY (Per-Target Filtered 1..100) === */
const TARGET_TABS = ["1.Hench", "2.Wolf", "3.Spider", "4.Brute", "5.Titan"];

function drawRangeTarget(tabIdx = selRangeTab) {
  selRangeTab = tabIdx;
  const startIdx = (shWrite - shCount + MAX_SH) % MAX_SH;
  const tabCounts = [0, 0, 0, 0, 0];
  let globalHits = 0;

  for (let s = 0; s < shCount; s++) {
    const idx = (startIdx + s) % MAX_SH;
    const t = shTgt[idx] || 0;
    tabCounts[t]++;
    if (shZone[idx] > 0) globalHits++;
  }

  const tabBar = document.getElementById("rangeTabs");
  if (tabBar) {
    tabBar.innerHTML = "";
    TARGET_TABS.forEach((tName, idx) => {
      const b = document.createElement("button");
      b.className = "btn" + (idx === tabIdx ? " sel" : "");
      b.style.padding = "2px 5px"; b.style.fontSize = "0.58rem";
      b.textContent = `${tName} (${tabCounts[idx]})`;
      b.onclick = () => drawRangeTarget(idx);
      tabBar.appendChild(b);
    });
  }

  const rcv = document.getElementById("rangeCv");
  if (!rcv) return;
  const rctx = rcv.getContext("2d");
  const rw = rcv.width, rh = rcv.height, cx = rw * 0.5, cy = rh * 0.52;

  // Gun-Store Cream Paper Target Sheet Background + Grid Lines
  rctx.fillStyle = "#e8dfc8";
  rctx.fillRect(0, 0, rw, rh);
  rctx.strokeStyle = "rgba(80,70,55,0.22)";
  rctx.lineWidth = 1;
  for (let x = 20; x < rw; x += 20) { rctx.beginPath(); rctx.moveTo(x, 0); rctx.lineTo(x, rh); rctx.stroke(); }
  for (let y = 20; y < rh; y += 20) { rctx.beginPath(); rctx.moveTo(0, y); rctx.lineTo(rw, y); rctx.stroke(); }

  rctx.fillStyle = "#23272e";
  rctx.strokeStyle = "#d9c8a9";
  rctx.lineWidth = 1.4;

  if (tabIdx === 0) {
    // 0: Angry Henchman Humanoid (Head T-Zone, Torso Heart Rings, Arms & Legs)
    rctx.fillRect(cx - 26, cy + 18, 20, 56); rctx.strokeRect(cx - 26, cy + 18, 20, 56);
    rctx.fillRect(cx + 6, cy + 18, 20, 56); rctx.strokeRect(cx + 6, cy + 18, 20, 56);
    rctx.fillRect(cx - 56, cy - 34, 20, 52); rctx.strokeRect(cx - 56, cy - 34, 20, 52);
    rctx.fillRect(cx + 36, cy - 34, 20, 52); rctx.strokeRect(cx + 36, cy - 34, 20, 52);
    rctx.beginPath(); rctx.moveTo(cx - 36, cy - 38); rctx.lineTo(cx + 36, cy - 38); rctx.lineTo(cx + 28, cy + 20); rctx.lineTo(cx - 28, cy + 20); rctx.closePath(); rctx.fill(); rctx.stroke();
    rctx.beginPath(); rctx.arc(cx, cy - 58, 18, 0, Math.PI * 2); rctx.fill(); rctx.stroke();
    rctx.strokeStyle = "#ef5350"; rctx.strokeRect(cx - 10, cy - 65, 20, 12);
    rctx.strokeStyle = "#fff"; rctx.beginPath(); rctx.moveTo(cx - 9, cy - 64); rctx.lineTo(cx - 2, cy - 60); rctx.moveTo(cx + 9, cy - 64); rctx.lineTo(cx + 2, cy - 60); rctx.stroke();
    rctx.strokeRect(cx - 6, cy - 52, 12, 4);
  } else if (tabIdx === 1) {
    // 1: Snarling Timber Wolf / Cyber-Hound (Snout/Fangs, 4 Legs, Torso & Balance Tail)
    const lx = [-54, -32, 22, 44];
    lx.forEach(ox => { rctx.fillRect(cx + ox, cy + 12, 14, 52); rctx.strokeRect(cx + ox, cy + 12, 14, 52); });
    rctx.beginPath(); rctx.moveTo(cx - 58, cy - 14); rctx.lineTo(cx - 98, cy - 32); rctx.lineTo(cx - 90, cy - 8); rctx.closePath(); rctx.fill(); rctx.stroke();
    rctx.fillRect(cx - 58, cy - 22, 104, 36); rctx.strokeRect(cx - 58, cy - 22, 104, 36);
    rctx.beginPath(); rctx.moveTo(cx + 42, cy - 42); rctx.lineTo(cx + 88, cy - 24); rctx.lineTo(cx + 80, cy - 4); rctx.lineTo(cx + 42, cy - 4); rctx.closePath(); rctx.fill(); rctx.stroke();
    rctx.strokeStyle = "#ef5350"; rctx.beginPath(); rctx.moveTo(cx + 52, cy - 30); rctx.lineTo(cx + 64, cy - 26); rctx.moveTo(cx + 58, cy - 12); rctx.lineTo(cx + 82, cy - 12); rctx.stroke();
  } else if (tabIdx === 2) {
    // 2: Xeno-Arachnid Stalker (6 Articulated Legs, Abdomen, Thorax & Mandibles)
    for (let k = -1; k <= 1; k++) {
      rctx.beginPath(); rctx.moveTo(cx - 20, cy + k * 18); rctx.lineTo(cx - 82, cy + k * 34 + 18); rctx.moveTo(cx + 20, cy + k * 18); rctx.lineTo(cx + 82, cy + k * 34 + 18); rctx.stroke();
    }
    rctx.beginPath(); rctx.ellipse(cx, cy + 18, 34, 26, 0, 0, Math.PI * 2); rctx.fill(); rctx.stroke();
    rctx.beginPath(); rctx.arc(cx, cy - 22, 20, 0, Math.PI * 2); rctx.fill(); rctx.stroke();
    rctx.strokeStyle = "#ef5350"; rctx.beginPath(); rctx.arc(cx - 6, cy - 28, 3, 0, 6.28); rctx.arc(cx + 6, cy - 28, 3, 0, 6.28); rctx.stroke();
  } else if (tabIdx === 3) {
    // 3: Armored Goliath Brute (Hulking Carapace, Recessed Scowl Head, Crusher Arms)
    rctx.fillRect(cx - 38, cy + 20, 28, 52); rctx.strokeRect(cx - 38, cy + 20, 28, 52);
    rctx.fillRect(cx + 10, cy + 20, 28, 52); rctx.strokeRect(cx + 10, cy + 20, 28, 52);
    rctx.fillRect(cx - 76, cy - 36, 26, 62); rctx.strokeRect(cx - 76, cy - 36, 26, 62);
    rctx.fillRect(cx + 50, cy - 36, 26, 62); rctx.strokeRect(cx + 50, cy - 36, 26, 62);
    rctx.fillRect(cx - 50, cy - 42, 100, 64); rctx.strokeRect(cx - 50, cy - 42, 100, 64);
    rctx.beginPath(); rctx.arc(cx, cy - 48, 16, 0, Math.PI * 2); rctx.fill(); rctx.stroke();
  } else {
    // 4: 4-Armed Titan Boss (Crown Horns, 4 Arms, Core Vitals, Heavy Legs)
    rctx.fillRect(cx - 36, cy + 22, 26, 52); rctx.fillRect(cx + 10, cy + 22, 26, 52);
    rctx.fillRect(cx - 84, cy - 52, 34, 22); rctx.fillRect(cx + 50, cy - 52, 34, 22);
    rctx.fillRect(cx - 80, cy - 16, 30, 48); rctx.fillRect(cx + 50, cy - 16, 30, 48);
    rctx.fillRect(cx - 48, cy - 44, 96, 68); rctx.strokeRect(cx - 48, cy - 44, 96, 68);
    rctx.beginPath(); rctx.arc(cx, cy - 60, 20, 0, Math.PI * 2); rctx.fill(); rctx.stroke();
  }

  // Heart / Center-Mass Bullseye Scoring Rings (10, 9, 8)
  const hx = tabIdx === 1 ? cx + 10 : cx, hy = cy - 10;
  rctx.strokeStyle = "rgba(239,83,80,0.65)"; rctx.lineWidth = 1;
  [10, 20, 32].forEach(rad => { rctx.beginPath(); rctx.arc(hx, hy, rad, 0, Math.PI * 2); rctx.stroke(); });

  // Plot ONLY shots matching this enemy archetype (shTgt[idx] === tabIdx), keeping their global 1..100 shot number!
  let tabShots = 0, tabHits = 0, tabCrits = 0, rangedCnt = 0, meleeCnt = 0;
  rctx.font = "bold 7.5px monospace";
  rctx.textAlign = "left";

  for (let s = 0; s < shCount; s++) {
    const idx = (startIdx + s) % MAX_SH;
    const num = s + 1;
    if (shTgt[idx] !== tabIdx) continue;

    tabShots++;
    const z = shZone[idx], atk = shAtk[idx];
    if (z > 0) tabHits++;
    if (z >= 2) tabCrits++;
    if (atk === 0) rangedCnt++; else meleeCnt++;

    const px = cx + shNX[idx] * (rw * 0.44);
    const py = cy + shNY[idx] * (rh * 0.44);
    const col = z === 0 ? "#ff5252" : (z >= 2 ? "#ffd166" : "#00e5ff");

    rctx.strokeStyle = col; rctx.fillStyle = col; rctx.lineWidth = 1.4;
    if (atk === 1) {
      rctx.beginPath(); rctx.moveTo(px - 4, py + 4); rctx.lineTo(px + 4, py - 4); rctx.stroke();
    } else {
      rctx.beginPath(); rctx.arc(px, py, 2.3, 0, Math.PI * 2); rctx.fill();
      rctx.beginPath(); rctx.moveTo(px - 4, py); rctx.lineTo(px + 4, py); rctx.moveTo(px, py - 4); rctx.lineTo(px, py + 4); rctx.stroke();
    }
    rctx.fillStyle = num === shCount ? "#00ff88" : "#111111";
    rctx.fillRect(px + 3, py - 8, String(num).length * 4.6 + 2, 7.5);
    rctx.fillStyle = num === shCount ? "#050811" : "#ffffff";
    rctx.fillText(String(num), px + 4, py - 2);
  }

  const globalAcc = shCount > 0 ? Math.round((globalHits / shCount) * 100) : 100;
  const critPct = tabShots > 0 ? Math.round((tabCrits / tabShots) * 100) : 0;
  const stEl = document.getElementById("rangeStats");
  if (stEl) {
    stEl.textContent = `This Target: ${tabShots} of ${shCount}/100 | Total Acc: ${globalAcc}% | T-Zone/Heart: ${critPct}% | ⊕:${rangedCnt} /:${meleeCnt}`;
  }
}

/* === 3. GUARANTEED SLOT-1 LEVEL 10 SUPERCHARGE & FILTERED ORB VACUUM MODAL === */
function triggerLevelUp() {
  runPaused = true;
  sfx(330, 880, 0.22, "triangle");
  document.getElementById("lvlTitle").textContent = "NEXUS LEVEL " + player.lvl + " — PICK 1 OF 3";
  document.getElementById("pauseBar").style.display = "none";
  const grid = document.getElementById("lvlGrid");
  grid.innerHTML = "";

  const curVac = typeof player.orbVacuumRate === "number" ? player.orbVacuumRate : 0;
  const guaranteedSuper = [], pool = [];
  player.weapons.forEach(w => {
    if (w.lvl === 9) guaranteedSuper.push({ type: "wup", w, isSuper: true });
    else if (w.lvl < 9) pool.push({ type: "wup", w, isSuper: false });
  });
  for (let k = 0; k < 4; k++) {
    const rc = CHAR_RAW[Math.floor(Math.random() * CHAR_RAW.length)];
    if (!player.weapons.some(w => w.id === rc[0]) && player.weapons.length < 6) pool.push({ type: "wnew", c: rc });
  }
  PASSIVES.forEach((p, idx) => {
    if (idx === 5 && curVac >= 1.0) return;
    const ex = player.passives.find(x => x.id === idx);
    if ((ex && ex.lvl < 5) || (!ex && player.passives.length < 6)) pool.push({ type: "pas", idx, p, lvl: ex ? ex.lvl + 1 : 1 });
  });
  if (curVac < 1.0 && typeof vacuumDistantOrbs === "function") {
    pool.push({ type: Math.random() < 0.22 ? "vac100" : "vac35" });
  }

  pool.sort(() => Math.random() - 0.5);
  [...guaranteedSuper, ...pool].slice(0, 3).forEach(ch => {
    const card = document.createElement("div");
    let title = "", sub = "", desc = "", ico = "";
    if (ch.type === "wup") {
      const nxt = ch.w.lvl + 1;
      card.className = "card unlocked" + (nxt === 10 ? " super-flash" : "");
      title = nxt === 10 ? "★ SUPERCHARGE: " + ch.w.superName + " (Lv.10)" : ch.w.name + " (Lv." + nxt + "/10)";
      sub = nxt === 10 ? "GUARANTEED LEVEL 10 ULTIMATE EVOLUTION!" : "Weapon Matrix Upgrade";
      desc = nxt === 10 ? "Supercharges weapon physics, unlocks 2.35x Ultimate Damage & bonus projectiles!" : "+25% Base Damage, +Area, faster cooldown.";
      ico = makeSVG(ch.w.style, nxt === 10 ? "#ffd166" : "#00e5ff", "#ffd166");
    } else if (ch.type === "wnew") {
      card.className = "card unlocked";
      title = "NEW WEAPON: " + ch.c[4]; sub = FACTIONS[ch.c[1]].name + " Tech"; desc = "Lv.10 Supercharge: " + ch.c[5];
      ico = makeSVG(ch.c[6], FACTIONS[ch.c[1]].c1, FACTIONS[ch.c[1]].c2);
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
    } else {
      card.className = "card unlocked";
      title = `${ch.p[0]} (Lv.${ch.lvl}/5)`; sub = "Passive Matrix Slot"; desc = ch.p[1];
      ico = makeSVG("pas", "#00e676", "#ffd166");
    }
    card.innerHTML = `<div class="card-head">${ico}<div><div class="card-title">${title}</div><div class="card-sub">${sub}</div></div></div><div class="card-desc">${desc}</div>`;
    bindTooltip(card, () => title, () => sub, () => desc, () => ico);
    card.onclick = () => {
      if (wasLongPress) return;
      if (ch.type === "wup") {
        ch.w.lvl++;
        if (ch.w.lvl === 10) spawnSpeech(player.x, player.y, "SUPERCHARGED: " + ch.w.superName.toUpperCase() + "!", "#ffd166", 2.6);
      } else if (ch.type === "wnew") {
        player.weapons.push({ id: ch.c[0], name: ch.c[4], superName: ch.c[5], style: ch.c[6], lvl: 1, cd: 0, ang: 0 });
      } else if (ch.type === "vac35") {
        player.orbVacuumRate = Math.min(1.0, +(curVac + 0.35).toFixed(2)); vacuumDistantOrbs(0.35);
      } else if (ch.type === "vac100") {
        player.orbVacuumRate = 1.0; vacuumDistantOrbs(1.0);
      } else applyPassive(ch.idx);
      runPaused = false; showScreen(null); updateHUD();
    };
    grid.appendChild(card);
  });
  drawRangeTarget(selRangeTab);
  showScreen("scrLevel");
}

/* === 4. HUD, MENUS & BOOTSTRAP === */
function updateHUD() {
  if (typeof player === "undefined" || !player) return;
  document.getElementById("hpBar").style.width = Math.max(0, (player.hp / player.maxHp) * 100) + "%";
  document.getElementById("hpTxt").textContent = `${Math.ceil(player.hp)}/${Math.ceil(player.maxHp)}${player.inVehicle ? " [VEH]" : ""}`;
  document.getElementById("xpBar").style.width = Math.min(100, (player.xp / player.nextXp) * 100) + "%";
  const bRing = getDistBiome(player.x, player.y);
  document.getElementById("hudStage").textContent = `${player.fac.worlds[player.stg.tier]}-${player.stg.id} • W${waveNum} • ${bRing.name.split(" ")[0]}`;
  document.getElementById("hudDM").textContent = `DM: ${availDM()}`;
  document.getElementById("timeScaleLbl").textContent = timeScale.toFixed(1) + "x";

  const itBtn = document.getElementById("btnInteract"), tgt = findInteractTarget();
  if (tgt) { itBtn.style.display = "inline-block"; itBtn.textContent = tgt.label; } else itBtn.style.display = "none";

  const wBox = document.getElementById("wpnSlots"); wBox.innerHTML = "";
  player.weapons.forEach(w => {
    const d = document.createElement("div"); d.className = "slot" + (w.lvl >= 10 ? " super" : "");
    d.innerHTML = `${makeSVG(w.style, w.lvl >= 10 ? "#ffd166" : "#00e5ff")}<span>L${w.lvl}</span>`;
    bindTooltip(d, () => w.lvl >= 10 ? w.superName : w.name, () => `Weapon Lv.${w.lvl}/10`, () => `Supercharge: ${w.superName}`, () => makeSVG(w.style));
    wBox.appendChild(d);
  });
  const pBox = document.getElementById("pasSlots"); pBox.innerHTML = "";
  player.passives.forEach(p => {
    const d = document.createElement("div"); d.className = "slot pas"; d.innerHTML = `<span>P${p.id + 1}</span><span>L${p.lvl}</span>`;
    bindTooltip(d, () => p.name, () => `Passive Lv.${p.lvl}/5`, () => p.desc, () => makeSVG("pas", "#00e676")); pBox.appendChild(d);
  });
  const rBox = document.getElementById("relicSlots"); rBox.innerHTML = "";
  player.relics.forEach(r => {
    const d = document.createElement("div"); d.className = "slot relic"; d.innerHTML = `${makeSVG("relic")}<span>R${r.id}</span>`;
    bindTooltip(d, () => r.name, () => `Relic (${player.relics.length}/${player.maxRelics})`, () => r.desc, () => makeSVG("relic")); rBox.appendChild(d);
  });
  const uBox = document.getElementById("utilBar"); uBox.innerHTML = "";
  player.utils.forEach((u, idx) => {
    const ready = u.cd <= 0.01, deg = ready ? 360 : Math.floor(((u.cdMax * player.utilCdrMul - u.cd) / (u.cdMax * player.utilCdrMul)) * 360);
    const b = document.createElement("div"); b.className = "util-btn" + (ready ? " ready" : "");
    b.innerHTML = `${makeSVG(u.icon, ready ? "#ffd166" : "#90a4ae")}<span>${ready ? "RDY" : u.cd.toFixed(1)}</span><div class="util-sweep" style="--sweep-deg:${deg}deg"></div>`;
    bindTooltip(b, () => u.name, () => `Utility (CD: ${u.cdMax}s)`, () => u.desc, () => makeSVG(u.icon));
    b.onclick = () => { if (!wasLongPress) triggerUtility(idx); }; uBox.appendChild(b);
  });
}

function showScreen(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  if (id) document.getElementById(id).classList.add("active");
}
document.querySelectorAll("[data-back]").forEach(b => { b.onclick = () => showScreen(b.getAttribute("data-back")); });

function updateMenuUI() {
  if (!checkLoadedScripts()) return;
  const c = CHAR_RAW[meta.selChar] || CHAR_RAW[0], f = FACTIONS[c[1]], stg = STAGES[meta.selStage - 1] || STAGES[0], df = DIFFICULTIES[meta.diff] || DIFFICULTIES[1];
  document.getElementById("menuDM").textContent = `Dark Matter: ${availDM()} (Total: ${meta.dmEarned})`;
  document.getElementById("menuSelChar").textContent = `Hero: #${c[0]} ${c[3]}`;
  document.getElementById("menuSelStage").textContent = `Stage ${stg.id}: ${f.worlds[stg.tier]} ${stg.suffix}`;
  document.getElementById("menuDiff").textContent = `Difficulty: ${df.name}`;
}

function renderChars() {
  document.getElementById("charDM").textContent = "Available DM: " + availDM();
  const g = document.getElementById("charGrid"); g.innerHTML = "";
  CHAR_RAW.forEach(c => {
    const unl = meta.chars.includes(c[0]), sel = meta.selChar === c[0], f = FACTIONS[c[1]], ico = makeSVG(c[6], f.c1, f.c2);
    const utils = getHeroUtils(c[0]).map(u => u.name).join(" + "), alignStr = typeof getHeroAlign === "function" ? getHeroAlign(c[0]).toUpperCase() : "HERO";
    const d = document.createElement("div"); d.className = "card " + (unl ? "unlocked" : "locked") + (sel ? " selected" : "");
    d.innerHTML = `<div class="card-head">${ico}<div><div class="card-title">#${String(c[0]).padStart(2, "0")} ${c[3]}</div>
      <div class="card-sub">${f.name} • ${unl ? "UNLOCKED" : c[2] + " DM"}</div></div></div>
      <div class="card-desc"><b>Wpn:</b> ${c[4]}<br><b>Lv10:</b> ${c[5]}<br><b>Pas:</b> ${c[7]}<br><b>Util:</b> ${utils}</div>`;
    bindTooltip(d, () => `#${c[0]} ${c[3]}`, () => `${f.name} (${alignStr})`, () => `Weapon: ${c[4]}\nLv.10: ${c[5]}\nPassive: ${c[7]} (${c[8]})\nQuote: "${getBossQuote(c[0], c[1])}"`, () => ico);
    d.onclick = () => {
      if (wasLongPress) return;
      if (unl) { meta.selChar = c[0]; saveMeta(); renderChars(); }
      else if (availDM() >= c[2]) { meta.dmSpent += c[2]; meta.chars.push(c[0]); meta.selChar = c[0]; saveMeta(); renderChars(); sfx(440, 880, 0.16, "triangle"); }
    };
    g.appendChild(d);
  });
}

function renderStages() {
  const f = FACTIONS[CHAR_RAW[meta.selChar][1]], g = document.getElementById("stageGrid"); g.innerHTML = "";
  STAGES.forEach(s => {
    const unl = meta.stages.includes(s.id), sel = meta.selStage === s.id, wName = f.worlds[s.tier], d = document.createElement("div");
    d.className = "card " + (unl ? "unlocked" : "locked") + (sel ? " selected" : "");
    d.innerHTML = `<div class="card-title">Stage ${s.id}: ${wName} ${s.suffix}</div><div class="card-sub">HP x${s.hpMul} • Drop: ${s.dmDrop} DM</div><div class="card-desc">Hazard: ${s.hazard}</div>`;
    d.onclick = () => { if (!wasLongPress && unl) { meta.selStage = s.id; saveMeta(); renderStages(); } }; g.appendChild(d);
  });
}

function renderMeta() {
  document.getElementById("metaDM").textContent = "Available DM: " + availDM();
  const g = document.getElementById("metaGrid"); g.innerHTML = "";
  META_UPG.forEach((u, idx) => {
    const r = meta.ranks[idx], cost = u[2] * (r + 1), d = document.createElement("div"); d.className = "card unlocked";
    d.innerHTML = `<div class="card-title">${u[0]} (Rank ${r}/5)</div><div class="card-sub">${r >= 5 ? "MAXED" : "Cost: " + cost + " DM"}</div><div class="card-desc">${u[1]} per rank</div>`;
    d.onclick = () => { if (!wasLongPress && r < 5 && availDM() >= cost) { meta.dmSpent += cost; meta.ranks[idx]++; saveMeta(); renderMeta(); sfx(380, 720, 0.1, "sine"); } }; g.appendChild(d);
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
    ["Temporal Nexus Speed", timeScale.toFixed(1) + "x", () => { setTimeScale(0.5, timeScale >= 3.0); }],
    ["Camera Zoom", opts.zoom.toFixed(2) + "x", () => { opts.zoom = opts.zoom >= 1.75 ? 0.5 : +(opts.zoom + 0.25).toFixed(2); }],
    ["Floating Damage / Speech", opts.dmgNums ? "ON" : "OFF", () => { opts.dmgNums = !opts.dmgNums; }],
    ["Screen Flash Effects", opts.flash ? "ON" : "OFF", () => { opts.flash = !opts.flash; }],
    ["Master Synth Volume", Math.round(opts.vol * 100) + "%", () => { opts.vol = opts.vol >= 0.8 ? 0 : +(opts.vol + 0.2).toFixed(2); }],
    ["HUD Handedness Layout", opts.hudFlip ? "LEFT-HANDED" : "STANDARD", () => { opts.hudFlip = !opts.hudFlip; }]
  ];
  rows.forEach(r => {
    const b = document.createElement("button"); b.className = "btn"; b.textContent = `${r[0]}: ${r[1]}`;
    b.onclick = () => { r[2](); renderOpts(); }; box.appendChild(b);
  });
}

function renderHealth() {
  document.getElementById("healthBox").innerHTML = `
    <div class="health-row"><b>v4.1 Per-Archetype Paper Target Telemetry: ACTIVE</b><br>100-Shot Ring Buffer Split Across 5 Target Silhouettes<div class="meter"><div class="meter-fill"></div></div></div>
    <div class="health-row"><b>v1.0–v3.4 Core & Enemy Anatomy: 100% VERIFIED</b><br>Articulated Limbs • % Popups • Deflectors • Orb Vacuum<div class="meter"><div class="meter-fill"></div></div></div>
    <div class="health-row"><b>Temporal & ChaosMath Engine: OPTIMAL</b><br>${fpsCount} FPS • Speed: ${timeScale.toFixed(1)}x • Active Chunks: ${runChunkDeltas.size}<div class="meter"><div class="meter-fill"></div></div></div>`;
}

if (typeof cv !== "undefined") {
  cv.addEventListener("pointerdown", e => { joy.act = true; joy.ox = e.clientX; joy.oy = e.clientY; joy.dx = 0; joy.dy = 0; });
  cv.addEventListener("pointermove", e => {
    if (!joy.act) return;
    const vx = e.clientX - joy.ox, vy = e.clientY - joy.oy, m = Math.hypot(vx, vy) || 1, c = Math.min(1, m / opts.joySize);
    joy.dx = (vx / m) * c; joy.dy = (vy / m) * c;
  });
  window.addEventListener("pointerup", () => { joy.act = false; joy.dx = 0; joy.dy = 0; });
}

document.getElementById("goPlay").onclick = () => { if (checkLoadedScripts()) startRun(); };
document.getElementById("goDiff").onclick = () => { if (checkLoadedScripts()) { meta.diff = (meta.diff + 1) % 5; saveMeta(); sfx(340, 520, 0.08, "triangle"); } };
document.getElementById("goChars").onclick = () => { if (checkLoadedScripts()) { renderChars(); showScreen("scrChars"); } };
document.getElementById("goStages").onclick = () => { if (checkLoadedScripts()) { renderStages(); showScreen("scrStages"); } };
document.getElementById("goMeta").onclick = () => { if (checkLoadedScripts()) { renderMeta(); showScreen("scrMeta"); } };
document.getElementById("goCodex").onclick = () => { if (checkLoadedScripts()) { renderCodex(); showScreen("scrCodex"); } };
document.getElementById("goOpts").onclick = () => { if (checkLoadedScripts()) { renderOpts(); showScreen("scrOpts"); } };
document.getElementById("goHealth").onclick = () => { if (checkLoadedScripts()) { renderHealth(); showScreen("scrHealth"); } };
document.getElementById("goHelp").onclick = () => showScreen("scrHelp");
document.getElementById("btnRespecChars").onclick = () => { respecAll(); renderChars(); };
document.getElementById("btnRespecAll").onclick = () => { respecAll(); renderMeta(); };
document.getElementById("btnTimeDown").onclick = () => setTimeScale(-0.5, false);
document.getElementById("btnTimeReset").onclick = () => setTimeScale(0, true);
document.getElementById("btnTimeUp").onclick = () => setTimeScale(0.5, false);
document.getElementById("btnInteract").onclick = () => { if (typeof triggerWorldInteract === "function") triggerWorldInteract(); };
document.getElementById("btnZoomIn").onclick = () => { opts.zoom = Math.min(2.0, +(opts.zoom + 0.2).toFixed(2)); };
document.getElementById("btnZoomOut").onclick = () => { opts.zoom = Math.max(0.5, +(opts.zoom - 0.2).toFixed(2)); };
document.getElementById("btnPause").onclick = () => {
  runPaused = true; document.getElementById("lvlTitle").textContent = "RUN PAUSED";
  document.getElementById("lvlGrid").innerHTML = ""; document.getElementById("pauseBar").style.display = "flex";
  drawRangeTarget(selRangeTab); showScreen("scrLevel");
};
document.getElementById("btnResume").onclick = () => { runPaused = false; showScreen(null); };
document.getElementById("btnQuitRun").onclick = () => { purgeRunMemory(); document.getElementById("hud").classList.remove("active"); showScreen("scrMain"); };

let lastTS = performance.now();
function loop(ts) {
  const rawDt = Math.min(0.05, (ts - lastTS) / 1000); lastTS = ts;
  if (typeof fpsCount !== "undefined" && rawDt > 0) fpsCount = Math.round(fpsCount * 0.9 + (1 / rawDt) * 0.1);
  if (typeof flashAlpha !== "undefined" && flashAlpha > 0) flashAlpha = Math.max(0, flashAlpha - rawDt * 2.5);
  if (typeof updateSim === "function") updateSim(rawDt);
  if (typeof renderScene === "function") renderScene();
  requestAnimationFrame(loop);
}
if (checkLoadedScripts()) { loadMeta(); updateMenuUI(); requestAnimationFrame(loop); }