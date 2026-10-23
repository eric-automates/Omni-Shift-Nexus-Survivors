<!-- FILE: info.md -->
<!-- DETAIL: Master System Specification & Version 5.0 Implementation Roadmap -->

# OMNI-SHIFT: NEXUS SURVIVORS — MASTER SYSTEM SPECIFICATION (v5.0)

## 1. Modular Architecture (14-File Structure)
* **`index.html`**: Master HTML shell, canvas viewport, and UI screen containers (`scrMain`, `scrChars`, `scrStages`, `scrMeta`, `scrCodex`, `scrOpts`, `scrHealth`, `scrLevel`).
* **`js/chaos.js`**: ChaosMath RNG, polygon/limb mutator, obstacle steering, Zero-GC noise-buffer + FM acoustic synthesizer (all 56 weapon sounds, Force lightning, flamethrowers, jetpack rockets, and explosions), 56 16-note alignment themes, and the auto-discovering 500-track music engine (`🎵 Music` player, queue shuffle, genre filter, smooth fades, ID3 tag reader, and Now-Playing toast).
* **`js/data-factions.js`**: Faction definitions, biome color palettes, world tiers, and faction descriptors.
* **`js/data-heroes.js`**: All 56 Multiverse Heroes (`#00–#55`), canon outfit palettes, 2-button utility kits, token-matrix dialogue lines, and alignment classifications.
* **`js/data-relics.js`**: 50 Relics, 20 Passive Matrix upgrades, and permanent Meta-Upgrades.
* **`js/state.js`**: Persistent metadata (`localStorage`), zero-GC SoA TypedArray pools, target locking (`isEnemyOnScreen`), Tactical Visor states, and drop/corpse/particle managers.
* **`js/world.js`**: Procedural distance sub-biomes, organic city blocks, rideable hovercrafts, combat mechs, and world interaction triggers.
* **`js/combat.js`**: Run initialization, active-run stats, relic/passive appliers, on-screen boss targeting, hero signature gear (`HERO_SIG_GEAR`), and secondary hardware attacks.
* **`js/sim.js`**: Real-time kinematic physics, steering behaviors, projectile collisions, gore dismemberment, arterial bleeding, and formation AI (Testudo & Wolf-Pack).
* **`js/render.js`**: Low-poly canvas renderer, voxel sprites, Canon outfit palettes, 56 hero blade colors, dismembered nub-crawling, weapon recycling, and Tactical Visor HUD overlays.
* **`js/ui.js`**: Strict EOF Paste Scanner, script parser verification, 350ms inspector modal, outfit customizer preview, active weapon toggler, range telemetry box (`#rangeBox`), and music player UI mount.

---

## 2. Completed Systems (v1.0 through v5.0 Batch 1 — 100% Active)
* **Multiverse Roster (`#00–#55`):** 56 fully composed heroes with zero shared fallback stats, custom 2-button utility kits, and Lv.5 primary weapon evolutions.
* **v4.1 Firing Range Telemetry (`#rangeBox`):** Rolling 100-attack tracker across 5 Gun-Store Paper Targets (`Hench`, `Wolf`, `Spider`, `Brute`, `Titan`) with ranged (`⊕`) and melee (`/`) quadrant markers.
* **v4.2 Kenshi Body HUD & Guard Stances:** 6-zone proportional limb health, debuff readouts (`SPD`, `DRIFT`, `AIM`), hold-to-guard damage mitigation (95% head/torso block on `#51` and `#40`), 56 Canon Outfits, and 7 Saber Colors with Dual-View Preview.
* **v4.3 Gore, Formations & Muzzle Realism:** Multi-hit enemy HP, arterial bleed-out, mid-walk limb dismemberment, configurable corpse/limb persistence counts (`opts.persistCount`), and muzzle-tip projectile spawning.
* **v4.4 Holstered Arsenal & Arm Caps:** Arm-count simultaneous firing caps (`2` standard, `3` Force Masters, `4` for `#55` Cyborg General), Active Weapon Toggler, and pre-boot live EOF Debug Console.
* **v5.0 Acoustic & Music Engine (`js/chaos.js`):** Movie-accurate procedural sound synthesis for all 56 weapons, 56 extended 16-note alignment character themes (upbeat heroic fanfares, bounty bass grooves, dark villain marches), and an auto-discovering 500-track music engine supporting sequential `track_#_Genre_Song-Name.mp3` files, ID3 tag extraction, queue-based infinite shuffle, smooth volume fades, Now-Playing toast badges, and interactive genre filter drawers.

---

## 3. Version 5.0 (Realism Part 2) — Remaining Implementation Roadmap

### v5.0 Batch 2 (`js/state.js` & `js/combat.js` — Completed)
* **Strict On-Screen Priority Target Lock (`isEnemyOnScreen`):** Single-target utilities and secondary hardware (like Boba's Z-6 Jetpack Rocket and Grapple) lock strictly onto the strongest enemy currently visible on screen.
* **Passive & Lootable Tactical Visors (`VISOR_MODES`):** Innate character visors (`#54` Boba Green Rangefinder, `#40` T-800 Red HUD with Enemy Name & `HEAD LIFE: XX%`, `#29` Predator Thermal Heat-Map for all enemies + Boss lock, `#39` Matrix Code Rain, etc.) grant **+10% Critical Chance** when active and can be found on Level-Up.
* **Physical Jetpack Rocket & John Wick Swap State:** Tracks physical rocket presence on Boba's jetpack, slow-accelerating smoke-trail rockets, explosion shockwaves, and reach-back/draw/rack-slide weapon swap stages.

### v5.0 Batch 3 (`js/render.js` & `js/sim.js` — Next)
* **Brotato-Style Floating Ball Hands & Protruding Weapons:** Replaces double-bar arm blocks with expressive circular ball hands holding weapons by the grip (while telekinetic Force weapons float weightlessly without hands).
* **John Wick Weapon-Swap & Slide-Rack Micro-Animations:** Physical holster push, reach-and-draw, and slide-rack/charging-handle actions across all 56 heroes when switching active weapons.
* **Movie-Accurate Visual FX & Visor HUD Overlays:** Jagged *Return of the Jedi* Force lightning arcs from fingertips, wrist-anchored flame cones, Boba's top jetpack rocket launching with smoke trail and blast wave, and live Predator Thermal / T-800 / Boba / Matrix HUD overlays.

### v5.0 Batch 4 (`js/ui.js` & `flowchart.md`)
* **Tactical Visor Selector Bar (`#visorToggleBar`):** Adds interactive buttons on Pause and Level-Up to toggle or switch between collected Visors (`+10% Crit` when ON), plus master `flowchart.md` sync.
