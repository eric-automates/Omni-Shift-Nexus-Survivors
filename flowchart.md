<!-- FILE: flowchart.md -->
<!-- PART: 1 of 14 -->
<!-- DETAIL: Master project file list, load sequence, Dynamic EOF Audit protocol, and function header registry (Version 4.4 Complete; all files <= 300 lines). -->

# OMNI-SHIFT: NEXUS SURVIVORS — FILE & FUNCTION REGISTRY (v4.4 COMPLETE)

## 0. Acode Editor Copy-Paste & Dynamic EOF Audit Protocol
* **Required Workflow:** Always press **Select All -> Delete** to completely empty a file in Acode before pasting the new copyable block.
* **Dynamic `fetch()` EOF Audit (`runDynamicEOFScan`):** Every `.js` file ends with `// EOF:js/<filename>.js`. On boot and inside **Health of Game Diagnostics**, the engine inspects the raw text of each script on disk and flags any leftover trailing characters after the `// EOF:` marker.

---

## 1. Modular File List (14 Parts Total, <= 300 Lines Each)
1. **`flowchart.md` (Part 01/14):** File list, script load order, and function header registry.
2. **`info.md` (Part 02/14):** Master game architecture and completed v1.0–v4.4 realism specification.
3. **`index.html` (Part 03/14):** DOM shell, HUD with `#bodyHud`, `#custBox` Outfit Customizer, and `#rangeBox`.
4. **`css/style.css` (Part 04/14):** Responsive mobile UI, radial clock-sweep, and card animations.
5. **`js/chaos.js` (Part 05/14):** `ChaosMath` RNG, RNG-varied weapon/saber/ricochet/snap synth, and 8-bit theme motifs.
6. **`js/data-factions.js` (Part 06/14):** 5 Difficulties, 4 Distance Biomes, 10 Factions, 20 Passives, 50 Stages.
7. **`js/data-heroes.js` (Part 07/14):** 56 Heroes (`#00-#55`), 56 Bespoke Canon Outfit Palettes (`CANON_56`), Quotes & Callouts.
8. **`js/data-relics.js` (Part 08/14):** 50 Relics DB and 56 Bespoke Side-Profile Weapon Silhouette SVGs (`makeSVG`).
9. **`js/state.js` (Part 09/14):** Meta-Save, Zero-GC SoA Pools, 400 Severed Limbs, 220 Corpses, Drips, and Muzzle-Tip Spawner.
10. **`js/world.js` (Part 10/14):** Distance Biomes, Organic City Blocks, Combat Mechs, Hovercrafts, Chests, and Forts.
11. **`js/combat.js` (Part 11/14):** 56 Lv.5 Primary Transitions & Secondary Hardware (`HERO_SIG_GEAR`), Formations, and Sword Lunge.
12. **`js/sim.js` (Part 12/14):** Continuous Moving Aim, Arm-Cap Rotation, Dismemberment, Arterial Bleed, and Saber Rally.
13. **`js/render.js` (Part 13/14):** 56 Bespoke Voxel Hero Anatomies (`HERO_VOXEL_STYLE`), Holstered Arsenal, and Gore/ms Telemetry.
14. **`js/ui.js` (Part 14/14):** Dynamic EOF Scanner, 56-Hero 8-Bit Theme Override, Dual-View Customizer, Weapon Toggler, and Paper Targets.

---

## 2. Function Header Registry by File

### Part 05: `js/chaos.js`
* **Headers:** `ChaosMath.hash()`, `ChaosMath.range()`, `ChaosMath.polyPoints()`, `ChaosMath.movePattern()`, `ChaosMath.moveSpeedMul()`, `ChaosMath.steerAround()`, `hashChunk(cx, cy)`, `sfx()`, `sfxWeapon(style, wpnId, isSaber)`, `sfxRicochet()`, `sfxSnap()`, `updateThemeMusic(rawDt)`.

### Part 06: `js/data-factions.js`
* **Globals:** `DIFFICULTIES[0..4]`, `BIOME_RINGS[0..3]`, `FACTIONS[0..9]`, `PASSIVES[0..19]`, `META_UPG[0..9]`, `STAGES[0..49]`.

### Part 07: `js/data-heroes.js`
* **Globals:** `CHAR_RAW[0..55]`, `CANON_56[0..55]`, `BLADE_COLORS[0..6]`, `SWORD_HEROES`, `FORCE_VACUUM_HEROES`.
* **Headers:** `hasInnateVacuum(cid)`, `isSwordWeapon(wpnId)`, `getHeroArmCap(cid)`, `getHeroOutfits(cid)`, `getHeroUtils(cid)`, `getBossQuote(cid, facId)`, `getHeroAlign(cid)`, `getRivalCallout(rivalCid, playerCid)`.

### Part 08: `js/data-relics.js`
* **Globals & Headers:** `RELICS_DB[0..49]`, `makeSVG(type, c1, c2, wpnId)` (all 56 bespoke side-profile weapon silhouettes).

### Part 09: `js/state.js`
* **Pools:** Enemies (`MAX_E=360`), Severed Limbs (`MAX_LIMB=400`), Corpses (`MAX_CORPSE=220`), Drips (`MAX_DRIP=320`), 100-Shot Buffer (`MAX_SH=100`), Projectiles (`MAX_P=520`), Orbs (`MAX_O=500`).
* **Headers:** `loadMeta()`, `saveMeta()`, `getOutfit(cid)`, `cycleOutfitPart(cid, partKey)`, `recordShotImpact()`, `clearEnemyLimbState()`, `spawnDrip()`, `spawnGroundLimb()`, `spawnCorpse()`, `purgeRunMemory()`, `spawnDmg()`, `spawnSpeech()`, `spawnParticles()`, `spawnOrb()`, `vacuumDistantOrbs()`, `compressOffscreenOrbsToChest()`, `spawnProj()`.

### Part 10: `js/world.js`
* **Headers:** `getDistBiome(x, y)`, `isUrbanBiome(facId, biomeId)`, `getChunkProps(cx, cy)` (generates City Blocks `type 5` & Combat Mechs `type 9`), `getNearbySolidObstacles()`, `isPointBlockedByObstacle()`, `findInteractTarget()`, `triggerWorldInteract()`, `deployLastStandFort(cx, cy)`.

### Part 11: `js/combat.js`
* **Globals:** `HERO_SIG_GEAR[0..55]` (Lv.5 Primary Weapon Name, Start-of-Run Equip Callout, and Autonomous Secondary Hardware spec for all 56 heroes).
* **Headers:** `startRun()`, `grantRelic(forcedId)`, `applyPassive(idx)`, `allocEnemySlot()`, `spawnEnemy(isBoss, isRival)`, `fireWeapon(w)`, `triggerUtility(uIdx)`, `updateHeroSpecials(simDt)`.

### Part 12: `js/sim.js`
* **Headers:** `updateSim(rawDt)`, `updateGorePersistence(simDt)`, `damagePlayerLimb(rawDmg, forcedZone)`, `findNearestEnemyType()`, `applyEnemyHitAndLimbs()`, `canEnemyDeflect()`, `updateProjectiles(simDt)`, `handleEnemyDeath(j)`, `updateEnemies(simDt)`.

### Part 13: `js/render.js`
* **Globals:** `HERO_VOXEL_STYLE[0..55]`.
* **Headers:** `drawHolsteredWeapons(c, cid, aim, bladeCol)`, `drawHeroSprite(x, y, fac, cid, walk, aim, inVehicle, c, guardZone)`, `drawDeflectorGear()`, `drawEnemyAnatomy(i, fac)`, `drawWorldProp(pr, fac)`, `getBounceBoltColor(i, fac)`, `renderScene()`.

### Part 14: `js/ui.js`
* **Headers:** `runDynamicEOFScan()`, `checkLoadedScripts()`, `window.updateThemeMusic(rawDt)`, `openInspector()`, `renderOutfitCustomizer(cid)`, `bindTooltip()`, `renderWeaponToggler()`, `drawRangeTarget(tabIdx)`, `triggerLevelUp()`, `updateHUD()`, `renderChars()`, `renderStages()`, `renderMeta()`, `renderCodex()`, `renderOpts()`, `renderHealth()`, `loop(ts)`.
