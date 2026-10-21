<!-- FILE: flowchart.md -->
<!-- PART: 1 of 14 -->
<!-- DETAIL: Master project file list, load sequence, Acode overwrite safeguard, and function header registry (Version 4.1 active; all files <= 300 lines). -->

# OMNI-SHIFT: NEXUS SURVIVORS — FILE & FUNCTION REGISTRY (v4.1)

## 0. Acode Editor Copy-Paste Safeguard (IMPORTANT)
* **Trailing Code Bug Warning:** When pasting updated code into Acode over an existing file, if the new file is shorter than the old file, the editor may leave old lines at the bottom of the file, causing `SyntaxError` crashes.
* **Required Workflow:** Always press **Select All -> Delete** to completely empty the file in Acode before pasting the new copyable block.

---

## 1. Modular File List (14 Parts Total, <= 300 Lines Each)
1. **`flowchart.md` (Part 01/14):** File list, script load order, and function header registry.
2. **`info.md` (Part 02/14):** Completed v1.0–v3.4 record and v4.1–v4.4 Realism Update specification.
3. **`index.html` (Part 03/14):** DOM shell, HUD, `#rangeBox` Firing Range Telemetry panel, and script tags.
4. **`css/style.css` (Part 04/14):** Responsive mobile UI, radial clock-sweep, and card animations.
5. **`js/chaos.js` (Part 05/14):** `ChaosMath` RNG, limb/polygon mutator, steering, and audio synth.
6. **`js/data-factions.js` (Part 06/14):** 5 Difficulties, 4 Distance Biomes, 10 Factions, 20 Passives, 50 Stages.
7. **`js/data-heroes.js` (Part 07/14):** 55 Heroes (`#00-#54`), Utilities, 3-line Quotes, Alignments, and Callouts.
8. **`js/data-relics.js` (Part 08/14):** 50 Relics DB (`Goa'uld Repulsor`, etc.) and `makeSVG()` icon builder.
9. **`js/state.js` (Part 09/14):** Meta-Save, Zero-GC SoA pools, Limb/Drip pools, and 100-Shot Ring Buffer (`shNX, shNY, shAtk, shTgt`).
10. **`js/world.js` (Part 10/14):** Distance Biomes, Huts, Relic Chests, Barricades, Hovercrafts, and Forts.
11. **`js/combat.js` (Part 11/14):** Run init, Innate Force Vacuum, Weapons, Lv.10 Supercharges, Utilities, and Rivals.
12. **`js/sim.js` (Part 12/14):** Physics loop, XY Quadrant Hit & Miss Telemetry, Limb `%` routing, and Deflection.
13. **`js/render.js` (Part 13/14):** Articulated Multi-Limb Enemy Renderer (`drawEnemyAnatomy`), Deflectors, and Drips.
14. **`js/ui.js` (Part 14/14):** Guaranteed Lv.10 modal, 5-Archetype Gun-Store Paper Target Renderer (`drawRangeTarget`), and HUD.

---

## 2. Script Load Order & Data Flow
1. **HTML & CSS Setup:** `index.html` loads `css/style.css` and registers `window.onerror` boot diagnostics.
2. **Core Math & Audio (`js/chaos.js`):** Initializes `ChaosMath` deterministic RNG, obstacle steering, and `sfx()`.
3. **Static Databases (`js/data-factions.js`, `js/data-heroes.js`, `js/data-relics.js`):** Loads factions, stages, 55 heroes, alignment callouts, and 50 relics.
4. **Memory Pools (`js/state.js`):** Allocates Structure-of-Arrays (SoA) TypedArrays, self-clearing limb damage arrays, `MAX_DRIP` black pixel drip buffer, and the `MAX_SH = 100` rolling shot accuracy ring buffer.
5. **World & Combat (`js/world.js`, `js/combat.js`):** Generates chunk props, forts, vehicles, weapons, and rival invasions.
6. **Simulation & Rendering (`js/sim.js`, `js/render.js`):** Steps frame physics (`updateSim`), logs normalized `(nx, ny)` impact coordinates on enemy anatomy quadrants (`recordShotImpact`), processes Elite projectile deflections, and renders the scene.
7. **UI & Paper Target Telemetry (`js/ui.js`):** Binds menus, touch joystick, level-up cards, and renders the 5-archetype Gun-Store Paper Target with numbered shots `1..100` on Pause and Level-Up.

---

## 3. Function Header Registry by File

### Part 03: `index.html`
* **DOM Elements:** `#cv`, `#hud`, `#bootDiag`, `#scrLevel` (with `#rangeBox`, `#rangeTabs`, `#rangeStats`, `#rangeCv`), and menu modals.

### Part 04: `css/style.css`
* **Key Selectors:** `.card.super-flash`, `.util-btn`, `.util-sweep`, `.slot.relic`, `.time-pill`.

### Part 05: `js/chaos.js`
* **Headers:** `ChaosMath.hash(seed)`, `ChaosMath.range(seed, min, max)`, `ChaosMath.polyPoints()`, `ChaosMath.movePattern()`, `ChaosMath.moveSpeedMul()`, `ChaosMath.steerAround()`, `hashChunk(cx, cy)`, `sfx()`.

### Part 06: `js/data-factions.js`
* **Globals:** `DIFFICULTIES[0..4]`, `BIOME_RINGS[0..3]`, `FACTIONS[0..9]`, `PASSIVES[0..19]`, `META_UPG[0..9]`, `STAGES[0..49]`.

### Part 07: `js/data-heroes.js`
* **Headers:** `hasInnateVacuum(cid)`, `getHeroUtils(cid)`, `getBossQuote(cid, facId)`, `getHeroAlign(cid)`, `getRivalCallout(rivalCid, playerCid)`.

### Part 08: `js/data-relics.js`
* **Globals & Headers:** `RELICS_DB[0..49]`, `makeSVG(type, c1, c2)`.

### Part 09: `js/state.js`
* **Pools:** Enemies (`MAX_E=360`), Limb Arrays (`eLegDmg, eTailDmg, eLegsLost, eBleed`), Drips (`MAX_DRIP=220`), 100-Shot Telemetry Ring Buffer (`MAX_SH=100`: `shNX, shNY, shAtk, shTgt, shHit, shTotal, shIdx, selRangeTab`), Projectiles (`MAX_P=520`), Orbs (`MAX_O=500`).
* **Headers:** `loadMeta()`, `saveMeta()`, `availDM()`, `respecAll()`, `setTimeScale()`, `recordShotImpact(nx, ny, atkType, tgtType, isHit)`, `clearEnemyLimbState(idx)`, `spawnDrip()`, `purgeRunMemory()`, `spawnDmg()`, `spawnSpeech()`, `spawnParticles()`, `spawnOrb()`, `vacuumDistantOrbs()`, `compressOffscreenOrbsToChest()`, `spawnProj()`.

### Part 10: `js/world.js`
* **Headers:** `getDistBiome(x, y)`, `getChunkProps(cx, cy)`, `getNearbySolidObstacles()`, `isPointBlockedByObstacle()`, `findInteractTarget()`, `triggerWorldInteract()`, `deployLastStandFort(cx, cy)`.

### Part 11: `js/combat.js`
* **Headers:** `startRun()`, `grantRelic(forcedId)`, `applyPassive(idx)`, `spawnEnemy(isBoss, isRival)`, `fireWeapon(w)`, `triggerUtility(uIdx)`, `updateHeroSpecials(simDt)`.

### Part 12: `js/sim.js`
* **Headers:** `updateSim(rawDt)`, `computeHitQuadrant(j, hitX, hitY, isCrit, atkType)`, `applyEnemyHitAndLimbs(j, finalDmg, isCrit, hitX, hitY, atkType)`, `canEnemyDeflect(j, projStyle)`, `updateProjectiles(simDt)`, `handleEnemyDeath(j)`, `updateEnemies(simDt)`.

### Part 13: `js/render.js`
* **Headers:** `drawHeroSprite()`, `drawDeflectorGear()`, `drawEnemyAnatomy(i, fac)`, `drawWorldProp(pr, fac)`, `renderScene()`.

### Part 14: `js/ui.js`
* **Headers:** `checkLoadedScripts()`, `openInspector()`, `bindTooltip()`, `drawRangeTarget(filterTgt)` (renders 5 paper target silhouettes + numbered `1..100` bullet/slash markers), `triggerLevelUp()`, `updateHUD()`, `showScreen()`, `updateMenuUI()`, `renderChars()`, `renderStages()`, `renderMeta()`, `renderCodex()`, `renderOpts()`, `renderHealth()`, `loop(ts)`.
