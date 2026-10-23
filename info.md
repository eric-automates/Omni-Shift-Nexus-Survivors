<!-- FILE: info.md -->
<!-- PART: 2 of 14 -->
<!-- DETAIL: Complete v1.0-v4.4 Implemented Record and Version 5.0 (Realism Part 2) 4-Batch Roadmap. -->

# OMNI-SHIFT: NEXUS SURVIVORS — MASTER DESIGN & ROADMAP (v5.0)

## 1. Completed Systems (v1.0 through v4.4 — 100% Active)
* **Core & World Engine:** 14-file modular architecture, 56 Multiverse Heroes (`#00–#55`), 50 Stages, 50 Relics, Distance Sub-Biomes, Organic City Blocks, Rideable Hovercrafts & Combat Mechs, Last-Stand Forts, Orb Vacuum & 10-Min XP Warp Chests.
* **v4.1 Firing Range Telemetry (`#rangeBox`):** Rolling 100-attack tracker (`1..100`) across 5 Gun-Store Paper Targets (`1.Hench`, `2.Wolf`, `3.Spider`, `4.Brute`, `5.Titan`) with ranged (`⊕`) and melee (`/`) quadrant markers.
* **v4.2 Kenshi Body HUD, Outfits & Saber Rally:** Proportional spawn/XP pacing, Toughness XP when hurt, 6-zone limb HUD with debuff readout (`SPD`, `DRIFT`, `AIM`), Hold-to-Guard (`#51` Kevlar sleeve & `#40` Titanium arm 95% head block), 56 Canon Outfits + 7 Saber Colors with Dual-View Preview, and 100-level Saber deflection rally with white-hot strobe bolts.
* **v4.3 Gore, Formations & Muzzle Realism:** Multi-hit enemy HP, arterial bleed-out, mid-walk arm/leg dismemberment, nub-crawling, configurable `opts.persistCount` (`50` to `9999`), live `ms` frame-time indicator beside `FPS`, Roman Testudo & Wolf-Pack formations, and muzzle-tip projectile spawning.
* **v4.4 Holstered Arsenal, Arm-Count Cap & Debug Suite:** Arm-count simultaneous firing caps (`2` standard, `3` Force Masters, `4` for `#55` Cyborg General), Active Weapon Toggler, 56 Lv.5 Primary Weapon Transitions, 56 Start-of-Run Equip Callouts, 56 Autonomous Secondary Hardware attacks, Dynamic `fetch()` EOF Paste Scanner, and Pre-Boot Live Debug Console.

---

## 2. Version 5.0 (Realism Part 2) — 4-Batch Implementation Roadmap

### Batch 1 (Active): Movie-Accurate Acoustic Engine, 16-Note Alignment Themes & Run MP3 (`info.md`, `js/chaos.js`)
* **Filtered Noise + Multi-Oscillator Acoustic Synth (`js/chaos.js`):**
  * Synthesizes weapon-authentic audio across all 56 heroes, utilities, and impacts using a zero-GC procedural noise buffer + Biquad filters + FM oscillators:
    * **#54 Boba Fett EE-3 Carbine:** Signature metallic 3-chirp FM resonance + low chamber thump.
    * **#03 Sith Force Lightning & Tesla Arcs:** High-voltage snapping crackle bursts + 120Hz electrical hum.
    * **#54 / #33 Wrist Flamethrower & Igni:** Pressurized gas hiss + roaring bandpass-filtered fire wash.
    * **#54 Z-6 Jetpack Rocket & Missiles:** Ignition pop + sustained rocket exhaust whoosh + deep concussive detonation boom.
    * **#00 / #55 Plasma Sabers & Swords:** Ben Burtt-style dual-detuned tube hum + Doppler air whoosh + clash crackle on hit.
    * **#52 / #13 / #51 / #15 / #53 Firearms:** Distinct gunpowder cracks, mechanical bolt clacks, shotgun pump thumps, flesh/armor impacts, metallic ricochets, and supersonic pass-by snaps.
* **56 Extended 16-Note Alignment-Styled Character Themes (`CHARACTER_THEMES`):**
  * **Heroes (`good`):** Upbeat, heroic major/mixolydian brass & lead fanfares.
  * **Bounty Hunters (`bounty`):** Gritty, badass syncopated bass & octave enforcer grooves.
  * **Villains (`bad`):** Dark, imposing harmonic-minor & Phrygian imperial marches.
* **External Active-Run Soundtrack (`music/roguelike_active_run_music.mp3`):**
  * Streams and loops `music/roguelike_active_run_music.mp3` during active runs; automatically pauses during Main Menu and Pause Menu while character themes play.

### Batch 2 (Next): On-Screen Boss Targeting, Tactical Visors (+10% Crit) & FX Pools (`js/state.js`, `js/combat.js`)
* **Strict On-Screen Priority Target Lock (`isEnemyOnScreen`):** Single-target utilities and secondary hardware (like Boba's Z-6 Jetpack Rocket and Grapple) lock strictly onto the most powerful enemy currently visible on screen.
* **Passive & Lootable Tactical Visors (`VISOR_MODES`):**
  * Innate character visors (`#54` Boba Green Rangefinder, `#40` T-800 Red HUD with Enemy Name & `HEAD LIFE: XX%`, `#29` Predator Thermal Heat-Map for all enemies + Boss lock, `#39` Matrix Code Rain, etc.) grant **+10% Critical Chance** when active and can be found by any hero on Level-Up.
* **Physical Jetpack Rocket & John Wick Swap State:** Tracks physical rocket presence on Boba's jetpack, slow-accelerating smoke-trail rockets, explosion shockwaves, and reach-back/draw/rack-slide weapon swap stages.

### Batch 3: Brotato Ball Hands, John Wick Swap/Rack & Movie Visual FX (`js/render.js`, `js/sim.js`)
* **Brotato-Style Floating Ball Hands & Protruding Weapons:** Replaces double-bar arm blocks with expressive ball hands holding weapons by the grip (while telekinetic Force weapons float weightlessly without hands), plus John Wick reach-back holster, draw, and slide-rack micro-animations and 100% visible holstered weapons.
* **ROTJ Force Lightning, Wrist-Tracked Flamethrower, Jetpack Rocket & Visor Overlays:** Renders jagged branching blue-violet lightning from the hands, wrist-anchored flame cones, Boba's top jetpack rocket detaching with fire/smoke trail and large blast wave, and live Predator Thermal / T-800 / Boba / Matrix HUD overlays.

### Batch 4: Pause/Level-Up Tactical Visor Switcher UI & Registry Sync (`js/ui.js`, `flowchart.md`)
* **Tactical Visor Selector Bar (`#visorToggleBar`):** Adds interactive buttons on Pause and Level-Up to toggle or switch between collected Visors (`+10% Crit` when ON), plus `flowchart.md` sync.
