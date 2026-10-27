// FILE: js/campaign.js
// PART: v10 module 7 of 8
// DETAIL: v10 Galactic Expedition Campaign Map — a seeded, branching Slay-the-Spire-style route of 12 sectors (2 warlord
//         citadels) replacing the linear stage select. Sectors ahead stay UNCHARTED until you clear a connected district:
//         the district you clear decides the next sector's hostile faction, environmental modifier, biome and warlord.
//         12 modifiers (Ion Storm, Low Gravity, Acid Fog, Thermal Vents, Warp Rifts, Blackout, Bounty Hunt, Swarm,
//         Fortified, Supply Drop, Blood Moon, Clear Skies) + 4 warlord traits. The classic 50-stage list stays available.

"use strict";

const CAMP_COLS = 12, CAMP_BOSS_COLS = [5, 11];
const CAMPAIGN_MODS = {
  calm:      { name: "Clear Skies", icon: "☀", desc: "No environmental modifier." },
  ionstorm:  { name: "Ion Storm", icon: "⚡", desc: "Lightning strikes near you every few seconds and fries enemies too. -10% move speed." },
  lowgrav:   { name: "Low Gravity", icon: "🪐", desc: "+25% projectile speed & knockback. Enemies drift 15% slower." },
  acidfog:   { name: "Acid Fog", icon: "☁", desc: "Standing still burns 2 HP/s. +25% XP." },
  vents:     { name: "Thermal Vents", icon: "♨", desc: "Hazards grow 40% larger and cook enemies twice as hard." },
  rifts:     { name: "Warp Rifts", icon: "🌀", desc: "Warp rifts tear open and drag nearby enemies together." },
  blackout:  { name: "Blackout", icon: "🌑", desc: "Vision shrinks to a pool of light around you. +35% Dark Matter." },
  bounty:    { name: "Bounty Hunt", icon: "🎯", desc: "A Rival hunts you every 35 s. +50% Dark Matter." },
  swarm:     { name: "Swarm", icon: "🐜", desc: "+45% spawn rate, enemies have -30% HP." },
  fortified: { name: "Fortified", icon: "🛡", desc: "Enemies +40% HP. The warlord drops an extra relic." },
  supply:    { name: "Supply Drop", icon: "📦", desc: "Start the sector with a random relic." },
  bloodmoon: { name: "Blood Moon", icon: "🩸", desc: "Enemies +20% speed. Every kill heals 0.5 HP." }
};
const CAMP_MOD_NEXT = {
  calm: ["swarm", "lowgrav", "supply", "ionstorm"], ionstorm: ["blackout", "lowgrav", "rifts"], lowgrav: ["rifts", "ionstorm", "swarm"],
  acidfog: ["vents", "swarm", "bloodmoon"], vents: ["acidfog", "fortified", "rifts"], rifts: ["blackout", "bloodmoon", "lowgrav"],
  blackout: ["bounty", "bloodmoon", "acidfog"], bounty: ["fortified", "blackout", "swarm"], swarm: ["bloodmoon", "acidfog", "fortified"],
  fortified: ["bounty", "vents", "supply"], supply: ["calm", "fortified", "swarm"], bloodmoon: ["blackout", "bounty", "rifts"]
};
const CAMP_NODE_TYPES = {
  combat: { name: "Combat Sector", icon: "⚔", dm: 1.0, desc: "Standard engagement." },
  elite:  { name: "Elite Garrison", icon: "☠", dm: 1.5, desc: "+25% enemy HP, heavies everywhere (glory-kill heaven). Extra relic." },
  hazard: { name: "Hazard Zone", icon: "☢", dm: 1.3, desc: "Hazards 25% larger. Lure enemies into them." },
  cache:  { name: "Supply Cache", icon: "📦", dm: 1.0, desc: "Start with a relic and bonus XP." },
  rival:  { name: "Rival Hunt", icon: "🎯", dm: 1.4, desc: "Rivals arrive at 0:20 and every 45 s." },
  boss:   { name: "Warlord Citadel", icon: "👑", dm: 2.0, desc: "The warlord arrives at 1:30 with 2.2x HP." }
};
const CAMP_BOSS_TITLES = ["Juggernaut", "Warlord", "Behemoth", "Dreadnought", "Archon", "Overlord", "Executioner", "Colossus"];
const CAMP_TRAITS = {
  enrage:   "Enrages below 50% HP (+60% speed)",
  summoner: "Calls an escort every 9 s",
  nova:     "Fires 12-bolt novas every 5 s",
  regen:    "Regenerates 1.5% HP per second"
};
const campState = { lastUid: 0, stormT: 2.6, riftT: 5, rifts: [], strikes: [], traitT: 0, enraged: false, bossUid: 0, blackG: null, blackKey: "" };

/* === 1. SEEDED GENERATION === */
function campRng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function campHash(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

function campaignNew(seed = (Date.now() & 0x7fffffff)) {
  const rng = campRng(seed), cols = [];
  const pickType = () => { const r = rng(); return r < 0.45 ? "combat" : r < 0.6 ? "elite" : r < 0.75 ? "hazard" : r < 0.85 ? "cache" : "rival"; };
  for (let c = 0; c < CAMP_COLS; c++) {
    const boss = CAMP_BOSS_COLS.includes(c), n = boss ? 1 : (c === 0 ? 3 : 2 + Math.floor(rng() * 3));
    const rows = [];
    for (let r = 0; r < n; r++) {
      rows.push({ id: `c${c}r${r}`, col: c, row: r, n, type: boss ? "boss" : (c === 0 ? "combat" : pickType()), next: [], revealed: false, props: null,
                  stage: Math.min(50, 1 + c * 4 + (boss ? 2 : Math.min(3, r))) });
    }
    cols.push(rows);
  }
  for (let c = 0; c < CAMP_COLS - 1; c++) {
    const A = cols[c], B = cols[c + 1], lane = (x, L) => (x.row + 0.5) / L.length;
    A.forEach(a => {
      const s = B.map(b => ({ b, d: Math.abs(lane(b, B) - lane(a, A)) })).sort((x, y) => x.d - y.d);
      a.next.push(s[0].b.id);
      if (s[1] && rng() < 0.55) a.next.push(s[1].b.id);
    });
    B.forEach(b => {
      if (A.some(a => a.next.includes(b.id))) return;
      const a = A.slice().sort((x, y) => Math.abs(lane(x, A) - lane(b, B)) - Math.abs(lane(y, A) - lane(b, B)))[0];
      a.next.push(b.id);
    });
  }
  const nodes = {};
  cols.forEach(col => col.forEach(n => { nodes[n.id] = n; }));
  const camp = { v: 1, seed, nodes, cleared: [], available: cols[0].map(n => n.id), selNode: null, complete: false };
  cols[0].forEach(n => campaignRoll(camp, n, null));
  return camp;
}

// The cleared district (parent) shapes the sector it unlocks.
function campaignRoll(camp, node, parent) {
  const rng = campRng(campHash(camp.seed + "|" + node.id + "|" + (parent ? parent.id : "root")));
  const homeF = (CHAR_RAW[meta.selChar] || CHAR_RAW[0])[1];
  let fac;
  if (parent && parent.props && rng() < 0.55) fac = parent.props.fac;   // the faction you fought regroups here
  else {
    fac = Math.floor(rng() * FACTIONS.length);
    if (fac === homeF && rng() < 0.5) fac = (fac + 1 + Math.floor(rng() * (FACTIONS.length - 1))) % FACTIONS.length;
  }
  let mod;
  if (node.type === "cache") mod = "supply";
  else if (node.type === "rival") mod = "bounty";
  else if (parent && parent.props) { const o = CAMP_MOD_NEXT[parent.props.mod] || Object.keys(CAMPAIGN_MODS); mod = o[Math.floor(rng() * o.length)]; }
  else mod = ["calm", "swarm", "lowgrav"][Math.floor(rng() * 3)];
  const traits = Object.keys(CAMP_TRAITS);
  node.props = {
    fac, mod, biome: rng() < 0.5 ? "home" : (typeof FACTION_BIOME !== "undefined" ? FACTION_BIOME[fac] : "home"),
    boss: FACTIONS[fac].name + " " + CAMP_BOSS_TITLES[Math.floor(rng() * CAMP_BOSS_TITLES.length)],
    trait: traits[Math.floor(rng() * traits.length)], from: parent ? parent.id : null
  };
  node.revealed = true;
}

function campaignGet() {
  if (!meta.campaign || !meta.campaign.nodes || meta.campaign.v !== 1) { meta.campaign = campaignNew(); saveMeta(); }
  return meta.campaign;
}
function campaignSelectedNode() {
  const camp = meta.campaign;
  if (!camp || !camp.selNode || !camp.nodes[camp.selNode]) return null;
  return camp.available.includes(camp.selNode) ? camp.nodes[camp.selNode] : null;
}
function campaignBiomeFor(p) {
  if (window.PROVING_ACTIVE) return null;
  const n = campaignSelectedNode();
  if (!n || !n.props || n.props.biome === "home") return null;
  return n.props.biome;
}
function campaignNodeLabel(n) { return `Sector ${n.col + 1}-${String.fromCharCode(65 + n.row)} · ${CAMP_NODE_TYPES[n.type].name}`; }
function campaignBiomeName(n) {
  if (!n.props) return "?";
  const key = n.props.biome === "home" ? (typeof biomeKeyForHero === "function" ? biomeKeyForHero(meta.selChar) : "tatooine") : n.props.biome;
  return (typeof BIOME_THEMES !== "undefined" && BIOME_THEMES[key]) ? BIOME_THEMES[key].name : key;
}

/* === 2. APPLY A SECTOR TO A RUN === */
V10.onRunStart.push(function campaignRunStart(p) {
  hostileFac = null;
  campState.lastUid = enemyUidCounter; campState.rifts.length = 0; campState.strikes.length = 0; campState.stormT = 2.6; campState.riftT = 5;
  campState.traitT = 0; campState.enraged = false; campState.bossUid = 0;
  if (window.PROVING_ACTIVE) return;
  const n = campaignSelectedNode();
  if (!n || !n.props) return;
  const pr = n.props, type = CAMP_NODE_TYPES[n.type];
  p.campaignNode = n.id;
  p.stg = STAGES[n.stage - 1] || p.stg;
  hostileFac = FACTIONS[pr.fac] || null;
  p.bossName = pr.boss; p.bossTrait = CAMP_TRAITS[pr.trait]; p.bossTraitKey = pr.trait;
  p.dmNodeMul = type.dm * (pr.mod === "blackout" ? 1.35 : 1) * (pr.mod === "bounty" ? 1.5 : 1);
  p.campMod = pr.mod; p.enemyHpMul = 1; p.enemySpdMul = 1;
  switch (pr.mod) {
    case "ionstorm": p.spd *= 0.9; break;
    case "lowgrav": p.projSpd += 0.25; p.kb += 0.25; p.enemySpdMul = 0.85; break;
    case "acidfog": p.greed *= 1.25; break;
    case "vents": p.hazardRadMul = 1.4; p.hazardEnemyMul = 2; break;
    case "bounty": p.rivalEvery = 35; break;
    case "swarm": p.spawnMul = 1.45; p.enemyHpMul = 0.7; break;
    case "fortified": p.enemyHpMul = 1.4; p.extraBossRelic = 1; break;
    case "supply": setTimeout(() => { if (player === p && typeof grantRelic === "function") grantRelic(); }, 600); break;
    case "bloodmoon": p.enemySpdMul = 1.2; break;
  }
  if (n.type === "elite") { p.enemyHpMul *= 1.25; p.elitePromote = 0.22; p.extraBossRelic = 1; }
  if (n.type === "hazard") p.hazardRadMul = Math.max(p.hazardRadMul || 1, 1.25);
  if (n.type === "cache") { p.xp += 40; setTimeout(() => { if (player === p && typeof grantRelic === "function") grantRelic(); }, 900); }
  if (n.type === "rival") { p.rivalEvery = Math.min(p.rivalEvery || 75, 45); rivalTimer = 25; }
  if (n.type === "boss") { p.bossAt = 90; p.bossHpMul = 2.2; }
  const m = CAMPAIGN_MODS[pr.mod];
  setTimeout(() => {
    if (player === p && typeof fxBanner === "function") fxBanner(campaignNodeLabel(n).toUpperCase(), `${m.icon} ${m.name} · Hostiles: ${FACTIONS[pr.fac].name}`, "#ffd166", 3.0);
  }, 1500);
});

V10.onRunReset.push(function campaignRunReset() { hostileFac = null; campState.rifts.length = 0; campState.strikes.length = 0; });

function campaignStep(simDt) {
  const p = player;
  if (!p.campaignNode) return;
  // newly spawned enemies: sector HP / speed modifiers, elite promotion, warlord HP
  for (let i = 0; i < MAX_E; i++) {
    if (!eAct[i] || eUid[i] < campState.lastUid) continue;
    if (eType[i] === 99) { const mul = (p.bossHpMul || 1) * (p.enemyHpMul || 1); eHP[i] *= mul; eMax[i] *= mul; campState.bossUid = eUid[i]; }
    else {
      if (p.elitePromote && eType[i] < 3 && eFormType[i] === 0 && Math.random() < p.elitePromote) { eType[i] = 3; eHP[i] *= 1.5; eMax[i] *= 1.5; }
      eHP[i] *= (p.enemyHpMul || 1); eMax[i] *= (p.enemyHpMul || 1);
    }
    eSpd[i] *= (p.enemySpdMul || 1);
  }
  campState.lastUid = enemyUidCounter;
  const mod = p.campMod;
  if (mod === "acidfog" && Math.hypot(p.vx || 0, p.vy || 0) < 10 && p.inVehicle === 0) p.hp = Math.max(1, p.hp - 2 * simDt);
  if (mod === "ionstorm") {
    campState.stormT -= simDt;
    if (campState.stormT <= 0) {
      campState.stormT = 2.2 + Math.random() * 1.2;
      const a = Math.random() * Math.PI * 2, d = 40 + Math.random() * 140, sx = p.x + Math.cos(a) * d, sy = p.y + Math.sin(a) * d;
      campState.strikes.push({ x: sx, y: sy, t: 0.35 });
      spawnBlastWave(sx, sy, 46, "#82b1ff");
      for (let j = 0; j < MAX_E; j++) if (eAct[j] && Math.hypot(eX[j] - sx, eY[j] - sy) < 46) { const dmg = 90 + waveNum * 18; eHP[j] -= dmg; eStun[j] = Math.max(eStun[j], 0.6); spawnDmg(eX[j], eY[j], dmg, true); if (eHP[j] <= 0) killEnemy(j, false); }
      if (Math.hypot(p.x - sx, p.y - sy) < 30 && !(p.invulnT > 0)) p.hp = Math.max(1, p.hp - 8);
      if (typeof fxShake === "function") fxShake(3, 0.2);
      sfx(2400, 120, 0.18, "sawtooth", 0.12);
    }
  }
  if (mod === "rifts") {
    campState.riftT -= simDt;
    if (campState.riftT <= 0) {
      campState.riftT = 6;
      const a = Math.random() * Math.PI * 2;
      campState.rifts.push({ x: p.x + Math.cos(a) * 130, y: p.y + Math.sin(a) * 130, t: 2.6 });
      sfx(90, 300, 0.4, "sine", 0.12);
    }
    for (let r = campState.rifts.length - 1; r >= 0; r--) {
      const R = campState.rifts[r];
      R.t -= simDt;
      if (R.t <= 0) { campState.rifts.splice(r, 1); continue; }
      for (let j = 0; j < MAX_E; j++) {
        if (!eAct[j] || eType[j] === 99) continue;
        const dx = R.x - eX[j], dy = R.y - eY[j], d = Math.hypot(dx, dy);
        if (d < 140 && d > 3) { eX[j] += dx / d * 120 * simDt; eY[j] += dy / d * 120 * simDt; eHP[j] -= 12 * simDt; if (eHP[j] <= 0) killEnemy(j, false); }
      }
    }
  }
  for (let s = campState.strikes.length - 1; s >= 0; s--) { campState.strikes[s].t -= simDt; if (campState.strikes[s].t <= 0) campState.strikes.splice(s, 1); }
  // warlord traits
  if (campState.bossUid) {
    let b = -1;
    for (let i = 0; i < MAX_E; i++) if (eAct[i] && eUid[i] === campState.bossUid) { b = i; break; }
    if (b >= 0 && !(eStagger[b] > 0)) {
      campState.traitT += simDt;
      const t = p.bossTraitKey;
      if (t === "enrage" && !campState.enraged && eHP[b] < eMax[b] * 0.5) {
        campState.enraged = true; eSpd[b] *= 1.6;
        if (typeof fxBanner === "function") fxBanner((p.bossName || "WARLORD").toUpperCase() + " ENRAGED!", "+60% speed", "#ff1744", 1.8);
      } else if (t === "regen") eHP[b] = Math.min(eMax[b], eHP[b] + eMax[b] * 0.015 * simDt);
      else if (t === "summoner" && campState.traitT >= 9) {
        campState.traitT = 0;
        for (let k = 0; k < 2; k++) allocEnemySlot(eX[b] + (k ? 26 : -26), eY[b] + 10, 1, 1.0, 0, -1);
        spawnSpeech(eX[b], eY[b] - 30, "ESCORT, TO ME!", "#ff5252", 1.4);
      } else if (t === "nova" && campState.traitT >= 5) {
        campState.traitT = 0;
        for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; spawnProj(eX[b], eY[b], Math.cos(a) * 190, Math.sin(a) * 190, 10, 2.0, 5, 0, 4, 0, 1, 2); }
        sfx(160, 520, 0.2, "square", 0.12);
      }
    }
  }
}

function campaignOnKill(idx, x, y, et, isEcho) {
  if (!isEcho && player && player.campMod === "bloodmoon") player.hp = Math.min(player.maxHp, player.hp + 0.5);
}

function campaignRenderWorld(c) {
  if (!player || !player.campaignNode) return;
  for (const s of campState.strikes) {
    c.save(); c.strokeStyle = `rgba(180,210,255,${Math.min(1, s.t * 3)})`; c.lineWidth = 3;
    c.beginPath(); c.moveTo(s.x + 30, s.y - 260); let x = s.x + 30, y = s.y - 260;
    for (let k = 0; k < 6; k++) { x += (s.x - x) / (6 - k) + (Math.random() - 0.5) * 22; y += (s.y - y) / (6 - k); c.lineTo(x, y); }
    c.stroke(); c.restore();
  }
  for (const R of campState.rifts) {
    c.save(); c.translate(R.x, R.y); c.rotate(runTime * 3);
    c.strokeStyle = "#d500f9"; c.globalAlpha = Math.min(1, R.t); c.lineWidth = 3;
    for (let k = 0; k < 3; k++) { c.beginPath(); c.arc(0, 0, 18 + k * 12, k, k + 4); c.stroke(); }
    c.restore();
  }
}

function campaignRenderScreen(c) {
  if (!player || player.campMod !== "blackout") return;
  const key = W + "x" + H;
  if (campState.blackKey !== key) {
    const g = c.createRadialGradient(W / 2, H / 2, 70 * opts.zoom, W / 2, H / 2, 240 * opts.zoom);
    g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, "rgba(0,0,0,0.9)");
    campState.blackG = g; campState.blackKey = key;
  }
  c.fillStyle = campState.blackG; c.fillRect(0, 0, W, H);
}

/* === 3. SECTOR CLEARED -> chart the next routes === */
function campaignOnSectorCleared(stg) {
  if (!player || !player.campaignNode || !meta.campaign) return;
  const camp = meta.campaign, n = camp.nodes[player.campaignNode];
  if (!n || camp.cleared.includes(n.id)) return;
  camp.cleared.push(n.id);
  camp.available = n.next.slice();
  n.next.forEach(id => campaignRoll(camp, camp.nodes[id], n));
  camp.selNode = camp.available.length === 1 ? camp.available[0] : null;
  if (player.extraBossRelic && typeof grantRelic === "function") grantRelic();
  if (n.col === CAMP_COLS - 1) {
    camp.complete = true;
    meta.dmEarned += 25;
    if (typeof fxBanner === "function") fxBanner("EXPEDITION COMPLETE", "+25 DM · start a New Expedition from the map", "#e040fb", 4, true);
  } else if (typeof fxBanner === "function") {
    fxBanner("DISTRICT SECURED", `${n.next.length} new route${n.next.length > 1 ? "s" : ""} charted on the Expedition Map`, "#00e676", 3.2);
  }
  saveMeta();
}

/* === 4. MAP SCREEN === */
let campSelected = null;
function renderCampaign(scrollToActive = false) {
  const camp = campaignGet(), wrap = document.getElementById("campMap"), info = document.getElementById("campInfo");
  if (!wrap) return;
  const width = Math.min(440, Math.max(300, window.innerWidth - 24)), rowH = 84, height = CAMP_COLS * rowH + 30;
  const pos = n => ({ x: 34 + (width - 68) * ((n.row + 0.5) / n.n), y: height - 30 - n.col * rowH });
  let svg = `<svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" style="display:block;margin:0 auto">`;
  for (let c = 0; c < CAMP_COLS; c++) {
    const y = height - 30 - c * rowH;
    svg += `<text x="6" y="${y + 4}" class="camp-col">${c + 1}</text>`;
  }
  Object.values(camp.nodes).forEach(n => {
    const a = pos(n);
    n.next.forEach(id => {
      const m = camp.nodes[id], b = pos(m);
      const path = camp.cleared.includes(n.id) && (camp.cleared.includes(id) || camp.available.includes(id));
      svg += `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" class="camp-edge${path ? " on" : ""}"/>`;
    });
  });
  Object.values(camp.nodes).forEach(n => {
    const a = pos(n), cleared = camp.cleared.includes(n.id), avail = camp.available.includes(n.id), sel = campSelected === n.id;
    const facCol = n.props ? FACTIONS[n.props.fac].c2 : "#37474f";
    const cls = cleared ? "cleared" : (avail ? "avail" : (n.revealed ? "known" : "fog"));
    const icon = n.revealed ? CAMP_NODE_TYPES[n.type].icon : "?";
    svg += `<g class="camp-node ${cls}${sel ? " sel" : ""}" data-id="${n.id}">` +
           `<circle cx="${a.x}" cy="${a.y}" r="${n.type === "boss" ? 22 : 17}" style="stroke:${n.revealed ? facCol : "#455a64"}"/>` +
           `<text x="${a.x}" y="${a.y + 5}" class="camp-ico">${cleared ? "✓" : icon}</text>` +
           (n.revealed && n.props ? `<text x="${a.x}" y="${a.y + (n.type === "boss" ? 34 : 29)}" class="camp-lbl">${CAMPAIGN_MODS[n.props.mod].icon} ${CAMP_NODE_TYPES[n.type].name.split(" ")[0]}</text>` : "") +
           `</g>`;
  });
  svg += `</svg>`;
  wrap.innerHTML = svg;
  wrap.querySelectorAll(".camp-node").forEach(g => {
    g.addEventListener("click", () => { if (typeof wasScrolled !== "undefined" && wasScrolled) return; campSelected = g.dataset.id; renderCampaign(); });
  });
  if (!campSelected || !camp.nodes[campSelected]) campSelected = camp.selNode || camp.available[0] || null;
  renderCampaignInfo(camp, info);
  if (scrollToActive && campSelected) {   // the route is drawn bottom-up: jump to the sector you are on
    const scr = document.getElementById("scrCampaign"), y = pos(camp.nodes[campSelected]).y;
    if (scr) requestAnimationFrame(() => { scr.scrollTop = Math.max(0, wrap.offsetTop + y - scr.clientHeight * 0.62); });
  }
  const sub = document.getElementById("campSub");
  if (sub) sub.textContent = camp.complete ? "Expedition complete! Start a New Expedition for a fresh galaxy."
    : `Cleared ${camp.cleared.length}/${CAMP_COLS} sectors. The district you clear decides the faction, modifier, biome and warlord of the next sector.`;
}

function renderCampaignInfo(camp, info) {
  if (!info) return;
  const n = campSelected ? camp.nodes[campSelected] : null;
  if (!n) { info.innerHTML = `<div class="card-title">No route available</div>`; return; }
  const type = CAMP_NODE_TYPES[n.type], cleared = camp.cleared.includes(n.id), avail = camp.available.includes(n.id);
  const stg = STAGES[n.stage - 1] || STAGES[0];
  let html = `<div class="card-title">${type.icon} ${campaignNodeLabel(n)}${cleared ? " ✓ SECURED" : ""}</div>`;
  if (!n.revealed || !n.props) {
    html += `<div class="card-desc">UNCHARTED. Clear a connected district to reveal who and what is waiting here.</div>`;
  } else {
    const f = FACTIONS[n.props.fac], m = CAMPAIGN_MODS[n.props.mod];
    html += `<div class="card-sub">Hostiles: <span style="color:${f.c2}">■</span> ${f.name} · Biome: ${campaignBiomeName(n)}</div>` +
            `<div class="card-desc">${m.icon} <b>${m.name}</b>: ${m.desc}<br>${type.desc}<br>` +
            `👑 Warlord: <b>${n.props.boss}</b> (${CAMP_TRAITS[n.props.trait]}) arrives at ${n.type === "boss" ? "1:30" : "2:00"}<br>` +
            `Threat: Stage ${stg.id} (HP x${stg.hpMul}) · Reward: ${stg.dmDrop} DM x${type.dm}${n.props.mod === "blackout" ? " x1.35" : ""}${n.props.mod === "bounty" ? " x1.5" : ""}</div>`;
  }
  if (avail && n.props) {
    const isSel = camp.selNode === n.id;
    html += `<div style="display:flex;gap:6px;margin-top:6px"><button class="btn${isSel ? " sel" : ""}" id="btnCampSet">${isSel ? "COURSE SET ✓" : "SET COURSE"}</button>` +
            `<button class="btn gold" id="btnCampGo">DEPLOY NOW</button></div>`;
  } else if (!cleared && n.revealed) {
    html += `<div class="card-desc" style="margin-top:4px;color:#ff8a80">Not reachable from your current route.</div>`;
  }
  info.innerHTML = html;
  const setBtn = document.getElementById("btnCampSet"), goBtn = document.getElementById("btnCampGo");
  const choose = () => { camp.selNode = n.id; meta.selStage = meta.stages.includes(n.stage) ? n.stage : meta.selStage; saveMeta(); };
  if (setBtn) setBtn.onclick = () => { choose(); renderCampaign(); };
  if (goBtn) goBtn.onclick = () => { choose(); if (checkLoadedScripts()) startRun(); };
}

function campaignInitUI() {
  const nb = document.getElementById("btnCampNew"), cb = document.getElementById("btnCampClassic");
  if (nb) nb.onclick = () => {
    if (!confirm("Abandon the current expedition and chart a new galaxy?")) return;
    meta.campaign = campaignNew(); campSelected = null; saveMeta(); renderCampaign(true);
  };
  if (cb) cb.onclick = () => { if (meta.campaign) meta.campaign.selNode = null; saveMeta(); renderStages(); showScreen("scrStages"); };
}

V10.onStep.push(campaignStep);
V10.onKill.push(campaignOnKill);
V10.onRenderWorld.push(campaignRenderWorld);
V10.onRenderScreen.push(campaignRenderScreen);
// EOF:js/campaign.js
