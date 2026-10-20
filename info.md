<!-- FILE: info.md -->
<!-- PART: 2 of 14 -->
<!-- DETAIL: Master architecture, audit fixes, and design specification for the 14-part modular build of OMNI-SHIFT: NEXUS SURVIVORS (v3.0). -->

# OMNI-SHIFT: NEXUS SURVIVORS — ARCHITECTURE & DESIGN SPEC (v3.0)

## 1. Modular Engine & Zero-GC Memory Lifecycle
* **14-Part Modular Architecture:** Refactored from a single-file bundle into 14 focused files (`<= 300` lines each) across `index.html`, `css/style.css`, and 10 vanilla ES6 scripts (`js/*.js`). Zero external image or audio assets.
* **Zero-GC TypedArray Pools:** Pre-allocated Structure-of-Arrays (SoA) ring buffers for Enemies (`MAX_E=360`), Player/Enemy Projectiles (`MAX_P=520`), XP Orbs (`MAX_O=500`), Floating Damage/Speech (`MAX_D=140`), and Particles (`MAX_PT=240`).
* **Procedural Chunk Delta Memory:** World is split into `512x512` chunks keyed by `"cx,cy"`. `runChunkDeltas` (`Map`) stores bitmasks of broken crates, opened chests, moved barricades, and player-built forts for the active run. `purgeRunMemory()` wipes 100% of run state on exit/death.
* **Persistent Meta-Save (`OMNISHIFT_META_V1`):** Stores `dmEarned`, `dmSpent`, unlocked `chars`, unlocked `stages`, `ranks` (10 meta-stats), and `diff` (Difficulty 0-4). Full Respec refunds 100% of Dark Matter anytime.

## 2. Verification Audit Fixes & Mathematical Systems
* **Guaranteed Lv.10 Supercharge Fix:** Previously, when a weapon reached Lv.9 (e.g., Browncoat Captain's *Brass Frontier Six-Gun*), the upgrade pool shuffled all candidate upgrades and only sliced 3, allowing passive and new-weapon cards to crowd out the Lv.10 upgrade. Now, `triggerLevelUp()` extracts any Lv.9 weapon first and locks its flashing gold `★ SUPERCHARGE` card into **Slot 1** (`100%` guaranteed appearance).
* **Solid Obstacle Projectile Blocking:** Projectiles now collide with and terminate against solid world obstacles (`PROP_TALL`, `PROP_LOW`, Huts, and Barricades). Player-built Last-Stand Forts allow player projectiles to fire over the sandbags while blocking enemy movement.
* **Temporal Nexus Control (`timeScale`):** HUD controls `[-0.5x]`, `[1.0x]`, `[+0.5x]` scale `simDt = rawDt * timeScale` in `0.5x` steps from `0.1x` up to unbounded speeds (`10.0x+`), routing all movement, weapon cooldowns, wave timers, and fortification timers through `simDt`.
* **5 Difficulty Tiers (`DIFFICULTIES`):**
  0. Cadet (Easy): Monster HP/Dmg `0.65x`, Player HP `1.35x`, XP/Drops `0.75x`, Enemy Spd `0.85x`
  1. Operative (Normal): `1.0x` baseline across all stats
  2. Veteran (Hard): Monster HP/Dmg `1.5x`, Player HP `0.85x`, XP/Drops `1.5x`, Enemy Spd `1.12x`
  3. Nightmare: Monster HP/Dmg `2.2x`, Player HP `0.75x`, XP/Drops `2.3x`, Enemy Spd `1.25x`
  4. Omega Nexus: Monster HP/Dmg `3.5x`, Player HP `0.65x`, XP/Drops `3.8x`, Enemy Spd `1.40x`
* **`ChaosMath` Procedural Jitter, Mutation & Wave AI:**
  * Generates deterministic per-entity vertex jitter, scale variance, and polygon vertex counts (`3 to 8 sides` + mutation spikes as waves progress).
  * **Low-Wave Obstacle Stun (`wave <= 2`):** Low-wave enemies that collide with obstacles bounce backward, fall/pause in a stunned state (`eStun > 0`) with overhead stun stars, and slowly get back up before resuming movement.
  * **High-Wave Tangent Steering (`wave >= 3`):** Higher-wave mutated enemies use `ChaosMath.steerAround()` tangent vectors to maneuver smoothly around obstacles and vary movement styles (Direct, Serpentine Sine, Flank Spiral, Tactical Lunge).

## 3. Roster (55 Playable Heroes), Supercharges & Utility Skills
* **Heroes #00–#50:** Full 10-Faction Sci-Fi/Fantasy Roster with unique passives and Lv.10 Supercharges.
* **New Iconic Heroes (#51–#54):**
  * **#51 Baba Yaga Suit-Assassin (Cyber-Waste):** Dark tailored suit & black hair silhouette. Starts with *Baba Yaga Backup Sidearm* -> transitions to primary *Continental Tactical Arsenal* at Lv.10. **CQC Grapple-Flip-Execute:** Touching any enemy or Boss grabs them, flips/throws them to the ground in a random direction (stunning them), and fires an instant point-blank execution shot.
  * **#52 The Man With No Name (Rim-Outlaw):** Iconic poncho silhouette with single right-arm revolver extended. Fires *Blazing Fan-Hammer Six-Shooter* in lightning-fast 6-shot bursts with lethal crit/kill power, followed by a snappy `0.55s` quick-reload -> Lv.10 *Deadeye Eight-Shooter*.
  * **#53 Green-Beret Last-Stand Vet (Xeno-Drop):** Red headband commando. *Belt-Fed M60 & Explosive Bow* -> Lv.10 *First Blood Firestorm*. Staying within a `180px` radius for 120 game-seconds (scales with `timeScale`, or triggered via Utility) deploys a **Last-Stand Fort** (shoot-over barricades + 6 claymore mines).
  * **#54 Slav-1 Bounty Tracker (Laser-Opera):** Weathered green ESB armor & T-visor helmet. *Sawed-Stock EE-3 Carbine* -> Lv.10 *Disintegrations Authorized*. Automatically triggers **Wrist Flamethrower** cone when surrounded by `>=4` enemies + active **Fibercord Grappling Hook** utility to lock down distant enemies/bosses until eliminated or tether breaks.
* **HUD Utility Skill Icon (Radial Clock Sweep):** Square HUD button(s) with a grayed-out overlay that un-grays clockwise via a `conic-gradient` clock hand until ready, glowing gold when charged.
* **Boss Kill One-Liners:** Defeating bosses or rival hunters triggers character-authentic speech banners above the player.

## 4. 50-Relic System, Distance Sub-Biomes & World Interaction
* **50 Unique Relics (`RELICS_DB`):** Found in Relic Chests and dropped by Bosses/Rivals. Standard heroes equip up to `3` Relics (`4` for Collector/Sage heroes `#7`, `#10`, `#35`). Includes **#00 Goa'uld Personal Repulsor** (vaporizes incoming enemy projectiles/missiles), **#01 Beskar Ricochet Core**, and 48 more balanced relics.
* **Distance-Based Sub-Biomes (Measured from Start `256, 256`):**
  * `0–800px`: Outpost Perimeter (Standard Faction Props)
  * `800–1800px`: Settlement Huts Sector (Geometric Huts + Relic Chests)
  * `1800–3000px`: Vehicle Yard Sector (Rideable Hovercrafts + Movable Barricades)
  * `3000px+`: Deep Vault Sector (High-density Relic Chests & Elite Shrines)
* **Interactive World Objects (`[INTERACT]` HUD Button):**
  * **Relic Chests:** Open to claim a random Relic + XP orbs.
  * **Movable Barricades:** Pick up, carry, and place anywhere to build custom cover.
  * **Hovercraft Vehicles:** Board for `+110% Move Speed`, hull armor absorption, and contact ramming damage.
* **Rival Bounty Hunter Invasions:** Every 75s, a rival hero from the roster spawns with a `"BOUNTY ON YOUR HEAD — I'VE COME TO COLLECT!"` alert, rendering their custom character sprite and firing enemy projectiles (`pEnemy = 1`) at the player.
