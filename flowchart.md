<!-- FILE: flowchart.md -->
<!-- PART: 1 of 14 -->
<!-- DETAIL: Master project directory layout, script load order, and function header registry for tracking and updating all 14 modular files (each <= 300 lines). -->

# OMNI-SHIFT: NEXUS SURVIVORS — FLOWCHART & FUNCTION REGISTRY (v3.0)

## 1. Modular Directory Layout (14 Files Total, <= 300 Lines Each)
  omni-shift/
  |-- flowchart.md          (Part 01/14) Architecture map & function header registry
  |-- info.md               (Part 02/14) Master game design & verification spec
  |-- index.html            (Part 03/14) DOM shell, HUD, modals & ordered script tags
  |-- css/
  |   +-- style.css         (Part 04/14) Responsive UI, radial clock-sweep & card styles
  +-- js/
      |-- chaos.js          (Part 05/14) ChaosMath RNG, polygon mutation, steering & synth
      |-- data-factions.js  (Part 06/14) 5 Difficulties, 10 Factions, 20 Passives, 50 Stages
      |-- data-heroes.js    (Part 07/14) 55 Heroes (#00-#54), Utility skills & One-Liners
      |-- data-relics.js    (Part 08/14) 50 Relics DB (Goa'uld Repulsor, etc.) & SVG icons
      |-- state.js          (Part 09/14) Meta-Save, timeScale, SoA TypedArray pools
      |-- world.js          (Part 10/14) Distance Biomes, Chests, Barricades, Vehicles, Forts
      |-- combat.js         (Part 11/14) Weapons, Lv.10 Supercharges, Hero Utilities, Rivals
      |-- sim.js            (Part 12/14) Physics loop, wall-blocking, wave stun/steering AI
      |-- render.js         (Part 13/14) 2D Vector sprites (#51-#54), morphed props & HUD
      +-- ui.js             (Part 14/14) Guaranteed Lv.10 modal, Temporal/Diff UI, Touch

---

## 2. Script Execution & Dependency Flow
  [index.html] + [css/style.css]
        |
        v
  [js/chaos.js] ----------> Provides ChaosMath, polygon jitter, obstacle steering & sfx()
        |
        v
  [js/data-factions.js] --> Loads DIFFICULTIES, FACTIONS, PASSIVES, META_UPG, STAGES
  [js/data-heroes.js]   --> Loads CHAR_RAW (55 Heroes), HERO_UTILS, BOSS_QUOTES
  [js/data-relics.js]   --> Loads RELICS_DB (50 Relics) & makeSVG()
        |
        v
  [js/state.js] ----------> Allocates Zero-GC TypedArrays, Meta localStorage & timeScale
        |
        v
  [js/world.js] ----------> Generates Distance Biomes, Huts, Chests, Vehicles & Forts
        |
        v
  [js/combat.js] ---------> Fires weapons, Lv.10 Supercharges, Utilities & Rival Bosses
        |
        v
  [js/sim.js] ------------> Runs updateSim(simDt): Wall collisions, Repulsor, Wave AI
        |
        v
  [js/render.js] ---------> Renders morphed polygons, custom Hero silhouettes & effects
        |
        v
  [js/ui.js] -------------> Binds HUD, Temporal Nexus, Guaranteed Lv.10 cards & Touch

---

## 3. File-by-File Function Header Registry

### Part 01: flowchart.md
* Tracks file paths, dependency order, and function signatures across all 14 parts.

### Part 02: info.md
* Documents core rules, verification audit fixes, 55 heroes, 50 relics, and biome rules.

### Part 03: index.html
* DOM Elements:
  * `#cv` — Fullscreen 2D Canvas viewport.
  * `#hud` — Top bar (HP, Stage, DM, Pause), Temporal Nexus bar (`#btnTimeDown`, `#btnTimeReset`, `#btnTimeUp`), XP bar, Weapon/Passive/Relic slots, Utility skill buttons (`#utilBar`), Contextual Interact button (`#btnInteract`).
  * `.screen` modals — `#scrMain` (with Difficulty cycler), `#scrChars`, `#scrStages`, `#scrMeta`, `#scrCodex`, `#scrOpts`, `#scrHealth`, `#scrHelp`, `#scrLevel`, `#tooltip`.

### Part 04: css/style.css
* Key Classes:
  * `.card.super-flash` — Pulsing gold border & glow for guaranteed Lv.10 Supercharge cards.
  * `.util-btn` & `.util-sweep` — Square utility icon with clockwise `conic-gradient` radial un-graying cooldown sweep.
  * `#btnInteract` — Highlighted contextual world interaction button.

### Part 05: js/chaos.js
* `ChaosMath.hash(seed)` — Deterministic 32-bit float generator `[0, 1)`.
* `ChaosMath.range(seed, min, max)` — Deterministic float in `[min, max]`.
* `ChaosMath.polyPoints(seed, baseR, sides, jitter, waveMut)` — Returns morphed vertex array `{x, y}[]` for trees, rocks, huts, and mutating wave enemies.
* `ChaosMath.steerAround(ex, ey, tx, ty, obsList, steerStrength)` — Computes tangent steering vector `(vx, vy)` around solid props for high-wave enemies.
* `ChaosMath.movePattern(styleId, baseAngle, runTime, seed)` — Returns movement angle with Direct (`0`), Serpentine (`1`), Spiral (`2`), or Lunge (`3`) variance.
* `sfx(f1, f2, dur, type, gainMul)` — Procedural Web Audio API synthesizer.

### Part 06: js/data-factions.js
* `DIFFICULTIES` — 5 tiers: `0: Cadet`, `1: Operative`, `2: Veteran`, `3: Nightmare`, `4: Omega Nexus`.
* `FACTIONS` — 10 Scifi/Fantasy biome palettes (`id, name, worlds[5], bg, grid, tall, low, decor, haz, loot, c1, c2`).
* `PASSIVES` — 20 Passive Matrix upgrades (`name, desc, statKey, val`).
* `META_UPG` — 10 Dark Matter permanent upgrades.
* `STAGES` — 50 Procedural sectors with hazard types and DM bounties.
* `BIOME_RINGS` — 4 Distance sub-biome definitions (`Outpost`, `Settlement Huts`, `Vehicle Yard`, `Deep Vault`).

### Part 07: js/data-heroes.js
* `CHAR_RAW` — 55 Playable Heroes (`#00` to `#54`), including:
  * `#51 Baba Yaga Suit-Assassin` (CQC Grapple-Flip-Execute + Sidearm transition)
  * `#52 The Man With No Name` (Poncho right-arm Fan-Hammer Six-Shooter + 0.55s Quick-Reload)
  * `#53 Green-Beret Last-Stand Vet` (M60/Explosive Bow + 120s Stationary Last-Stand Fort & Mines)
  * `#54 Slav-1 Bounty Tracker` (EE-3 Carbine + Auto-Flamethrower >=4 foes + Grapple Hook)
* `getHeroUtils(cid)` — Returns array of active utility skill objects (`name, cdMax, desc, type`) for the hero.
* `getBossQuote(cid, facId)` — Returns character-specific one-liner string when a Boss or Rival falls.

### Part 08: js/data-relics.js
* `RELICS_DB` — 50 unique world/boss relics (`#00 Goa'uld Personal Repulsor` to `#49 Nexus Singularity Core`).
* `makeSVG(type, c1, c2)` — Procedural SVG string builder for UI/HUD icons.

### Part 09: js/state.js
* State Globals: `meta`, `opts`, `timeScale`, `runActive`, `runPaused`, `runSeed`, `runTime`, `waveNum`, `player`, `joy`.
* SoA Pools: Enemies (`MAX_E=360`), Projectiles (`MAX_P=520`), Orbs (`MAX_O=500`), Floating Text (`MAX_D=140`), Particles (`MAX_PT=240`).
* World Arrays: `runChunkDeltas`, `activeForts`, `activeMines`, `movedBarricades`.
* Functions:
  * `loadMeta()`, `saveMeta()`, `availDM()`, `respecAll()`
  * `purgeRunMemory()`
  * `setTimeScale(delta, reset)`
  * `spawnSpeech(x, y, text, color, dur)`
  * `spawnDmg(x, y, val, isCrit)`
  * `spawnParticles(x, y, cnt)`
  * `spawnOrb(x, y, val)`
  * `spawnProj(x, y, vx, vy, dmg, life, rad, prc, style, sup, isEnemy)`

### Part 10: js/world.js
* `getDistBiome(x, y)` — Computes distance from `(256, 256)` start and returns sub-biome index `0..3`.
* `getChunkProps(cx, cy)` — Generates deterministic props per `512x512` chunk, including Huts (`5`), Relic Chests (`6`), Barricades (`7`), and Hovercrafts (`8`).
* `getNearbySolidObstacles(x, y, rad)` — Returns solid props, huts, barricades, and forts near `(x, y)`.
* `findInteractTarget()` — Finds closest interactive chest, barricade, or hovercraft within `46px`.
* `triggerWorldInteract()` — Opens chest (grants Relic), picks up/places barricade, or mounts/dismounts hovercraft.
* `deployLastStandFort(x, y)` — Spawns protective shoot-over fortification ring and 6 claymore mines.

### Part 11: js/combat.js
* `startRun()` — Initializes `player` stats, difficulty scaling, hero passives, weapon, and utility cooldowns.
* `spawnEnemy(isBoss, isRival)` — Spawns wave-mutated enemy, sector boss, or Rival Bounty Hunter hero.
* `fireWeapon(w)` — Fires player weapons, handles #52 6-shot burst + `0.55s` reload, and Lv.10 Supercharges.
* `triggerUtility(uIdx)` — Executes active utility skill (`grapple`, `flamethrower`, `fort`, `executeDash`, `fanHammer`, `factionPulse`).
* `updateHeroSpecials(simDt)` — Runs #51 CQC Grapple-Flip-Execute, #53 120s stationary fort builder, and #54 Auto-Flamethrower.
* `grantRelic(relicId)` — Adds relic to `player.relics` (up to `maxRelics`) and applies its passive effect.
* `applyPassive(idx)` — Applies Passive Matrix upgrade `0..19`.

### Part 12: js/sim.js
* `isPointBlockedByObstacle(x, y, ignoreForts)` — Returns true if projectile or unit hits a solid prop/hut/barricade.
* `updateSim(rawDt)` — Main simulation tick (`simDt = rawDt * timeScale`).
* `updateProjectiles(simDt)` — Moves projectiles, stops them on obstacles, and runs `#00 Goa'uld Personal Repulsor`.
* `updateEnemies(simDt)` — Updates stunned enemies (`eStun`), grapple-locked enemies (`eGrapple`), low-wave obstacle bounce/stun, high-wave tangent steering, and Rival blaster firing.

### Part 13: js/render.js
* `drawHeroSprite(x, y, fac, cid, walk, aim, inVehicle)` — Renders hero vector layers (#51 suit, #52 poncho/right-arm gun, #53 headband, #54 T-visor) and hovercraft chassis.
* `drawWorldProp(pr, fac)` — Renders `ChaosMath` morphed trees, rocks, huts, chests, barricades, and hovercrafts.
* `renderScene()` — Renders grid, distance biome tint, forts/mines, props, orbs, mutated enemies, stun stars, grapple lines, projectiles, speech banners, and joystick.

### Part 14: js/ui.js
* `openInspector(title, sub, body, iconHTML)` & `bindTooltip(el, ...)` — 350ms hold inspector.
* `triggerLevelUp()` — Guarantees flashing gold `★ SUPERCHARGE` card in Slot 1 when any weapon is Lv.9.
* `updateHUD()` — Syncs HP/XP, Temporal Nexus label, Relic icons, Interact button, and radial clock-sweep utility buttons.
* `renderChars()`, `renderStages()`, `renderMeta()`, `renderCodex()`, `renderOpts()`, `renderHealth()` — Menu builders.
* `initApp()` — Binds DOM events, touch joystick, pinch-to-zoom, and starts `requestAnimationFrame` loop.
