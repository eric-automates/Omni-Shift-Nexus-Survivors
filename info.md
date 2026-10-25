<!-- FILE: info.md -->
<!-- DETAIL: Master System Specification (v7.0) & Version 8.0 Implementation Roadmap -->

# OMNI-SHIFT: NEXUS SURVIVORS — MASTER SYSTEM SPECIFICATION (v7.0 & v8.0 ROADMAP)

## 1. Modular Architecture (14-File Structure)
* **`index.html`**: DOM shell, HUD (`#bodyHud`, `#spellBar`, `#dashSlot`), Outfit Customizer (`#custBox`), Firing Range (`#rangeBox`), Interactive Visual HUD Controls Guide (`#scrHelp`), and Pre-Boot Live Debugger.
* **`css/style.css`**: Responsive mobile-first styling with `touch-action: pan-y` card scrolling and HUD layout rules.
* **`js/chaos.js`**: ChaosMath RNG, polygon mutator, obstacle steering, Web Audio synthesizer (weapons, spells, disintegrations, deflections), 80 16-note character themes, and the 500-track auto-discovering MP3 music player.
* **`js/data-factions.js`**: 11 Multiverse Factions (`0–10`, including `Arcane-Sanctum`), House/Order Crest registry (`HOUSE_CRESTS`), 11 Free Genre Starters (`0 DM`), 50 Stages, and 20 Passives.
* **`js/data-heroes.js`**: All 80 Multiverse Heroes (`#00–#79`), bespoke Early-to-Prime Saber & Combat Stance progressions, Canon Outfit palettes, 2-button utility kits, signature dash specs, and 3-line quotes.
* **`js/data-relics.js`**: 50 Relics and 80 bespoke side-profile weapon silhouette SVGs (`WPN_SVG_56`).
* **`js/state.js`**: Persistent `localStorage` metadata, zero-GC SoA TypedArray pools (enemies, projectiles, orbs, blood drips, corpses, severed limbs, bisected torso halves, allied minions), and target locking.
* **`js/world.js`**: Procedural 256px chunk generator, spires, crates, hazards, loot pods, hovercrafts, combat mechs, and Last-Stand forts.
* **`js/combat.js`**: Run initialization, cumulative top-bar Spellbook (`player.spellbook`), corpse-only Necromancer summoning, directional-to-360° Force Push, and Character-Specific Double-Tap Dash execution.
* **`js/sim.js`**: 60 FPS kinematics, biographical Early-to-Prime combat stances, active blaster-deflection stances, 1-person-width blade slicing, torso bisection, 4-stage thrown-saber impale/kneel/wiggle/recall, and Allied Minion AI.
* **`js/render.js`**: Biome/chunk renderer, front-facing sprites with combat-aware blinking, feminine eyes, Clint squint, Prequel wrist-pivot flourishes, Yoda aerial acrobatics, Maul double-bladed staff, and Visor HUD overlays.
* **`js/ui.js`**: Dynamic EOF Scanner, scroll-safe 350ms Inspector, Genre-Sorted Roster with House Crests, `#spellBar` & `#dashSlot` HUD sync, and Interactive Visual HUD Controls Diagram.

---

## 2. Completed Systems Through Version 7.0 (100% Active)
* **v1.0–v5.0 Core & Realism Overhauls:** Kenshi 6-zone limb HUD & hold-to-guard mitigation, firing range paper targets (`#rangeBox`), arterial bleeding, Brotato ball hands, holstered arsenal, John Wick 3-stage weapon swap/slide-rack, Tactical Visors (`+10% Crit`), and 500-track MP3 player.
* **v6.0 Physics & Prequel Lightsaber Overhaul:** Camera-stable melee reach, physical blade-segment intersection slicing (~32px), guaranteed limb severing & exact-angle torso bisection into falling halves with glowing-to-dark smoldering seams, 4-stage thrown blade impale/kneel/wiggle/recall, parabolic returning smart-discs, and level-scaling directional-to-360° Force Kinetic Push.
* **v7.0 Arcane Sanctum & Spellcaster Overhaul (`#56–#75`):** 20 iconic spellcasters (Harry, Hermione, Ron, Luna, Cedric, Hagrid, Draco, Lupin, Sirius, Moody, McGonagall, Snape, Bellatrix, Dumbledore, Voldemort, Gandalf, Saruman, Doctor Strange, Scarlet Witch, and the Book of the Dead Necromancer), House/Order Crest badges, Genre-Sorted Roster with 1 free `0 DM` starter per genre, cumulative `#spellBar`, corpse-only undead raising, *Avada Kedavra*, *Wingardium Leviosa* float-off-screen-to-XP, *"You Shall Not Pass!"* rune barriers, combat-aware blinking, feminine eyes, Clint squint, and Boba Fett knee-darts + Thermal Disintegrator.

---

## 3. Version 8.0 Roadmap — Bespoke Saber/Combat Stance Progression, Star Wars Legends, Double-Tap Dash & Interactive HUD Guide

### Key Features of Version 8.0
1. **4 New Iconic Star Wars Legends (`#76–#79` in `Star-Sector`):**
   * **`#76` Darth Vader (Dark Lord of the Sith):** Starts with aggressive one-handed Form V *Shien* -> evolves to Prime two-handed cybernetic *Djem So* crushing cleaves + *casual one-handed backhand blaster deflection*. Dash: **Relentless Force Lunge & Horizontal Crimson Bisection**.
   * **`#77` Darth Maul (Dathomir Zabrak Assassin):** Wields his iconic **Double-Bladed Saberstaff**! Starts with single-blade *Niman* -> ignites the second blade at Lv.3+ for Prime **Form VII *Juyo* figure-8 staff spins** + *spinning staff blaster barrier*. Dash: **Aerial Butterfly-Twist Staff Cyclone**.
   * **`#78` Mace Windu (Korun Vaapad Master):** Wields his **Amethyst Purple Lightsaber**! Starts with measured Form V -> evolves into Prime **Form VII *Vaapad* superconducting purple blur** that reflects dark energy + *shatterpoint deflection*. Dash: **Vaapad Shatterpoint Blitz**.
   * **`#79` Grandmaster Yoda (900-Year Ataru Grandmaster):** Compact stature with his **Emerald Shoto Saber**! Starts with grounded Form III/IV -> evolves into Prime **Prequel Acrobatic *Ataru***, continuously hopping, flipping, and somersaulting around close targets while slicing mid-air! Dash: **Multi-Flip Sonic Tornado Leap**.
2. **Biographical Early-Life to Prime Stance Progression + Active Deflection Stances (All 80 Heroes):**
   * Every lightsaber wielder, melee duelist, marksman, and spellcaster progresses through **3 distinct biographical combat stances** (`Lv.1–3 Early Career` -> `Lv.4–6 Seasoned` -> `Lv.7–10 Prime Master`) with unique hand geometry, cadence, and flourish patterns.
   * Incoming enemy projectiles trigger a **Hero-Specific Deflection Stance** (`player.deflectStanceTimer`) with authentic hand/blade positioning.
3. **Double-Tap Distant Ground = Bespoke Signature Dash + Dedicated `#dashSlot` HUD Button:**
   * Double-tapping anywhere at a distance on the battlefield (or tapping the new `#dashSlot` HUD button) executes a **Hero-Specific Dash Attack** along that path (Vader Force Lunge + Swipe, Yoda Multi-Flip Cleave, Maul Butterfly Spin, Boba/Jetpack Rocket-Jump + Landing Blast, Spellcaster Apparition/Smoke Teleport + Spell Callout, Gunslinger Dive-Roll + Execution Volley). Includes an Options toggle (`Double-Tap Dash: ON/OFF`).
4. **Scroll-Safe Card Touch & 350ms Inspector Fix + Dead Code Cleanup:**
   * Fixes `NotFoundError: removeChild`, enables smooth vertical finger-scrolling directly over cards in `#scrChars`, fixes 350ms hold detection, and reconnects all dead code (`cqcCD`, `equipAnimTimer`, `eTurnTimer`, `pBounce`).
5. **Interactive Visual HUD Controls Diagram (`#scrHelp`):**
   * Renders a full annotated visual mock-up of the In-Run HUD with **Gold Quick-Tap Arrows** (explaining clickable skills, spells, weapon toggles, limb guards, visors, and Dash) and **Cyan 350ms Hold Arrows** (explaining the Long-Press Inspector & Outfit Customizer).

### Version 8.0 Batch Schedule (Single-File Batches for All >300-Line Files)
* **v8.0 Batch 1 (`index.html` + `css/style.css`):** Fixes the `removeChild` error guard, adds `touch-action: pan-y` so cards scroll smoothly under your finger, adds `#dashSlot` to the HUD, and mounts the annotated **Visual HUD Controls Diagram** in `#scrHelp`.
* **v8.0 Batch 2 (`js/data-heroes.js` — 1 large file):** Adds `#76` Darth Vader, `#77` Darth Maul, `#78` Mace Windu, and `#79` Grandmaster Yoda, plus the `HERO_STANCE_PROGRESSION` & `HERO_DASH_SPECS` tables for all 80 heroes.
* **v8.0 Batch 3 (`js/data-relics.js` + `js/state.js`):** Adds custom weapon SVGs for `#76–#79` (including Maul's double-bladed saberstaff & Yoda's shoto) and dash/acrobatic/deflection state variables.
* **v8.0 Batch 4 (`js/chaos.js` — 1 large file):** Adds 8-bit themes for Vader (*Imperial March* motif), Maul (*Duel of the Fates* motif), Windu, and Yoda, plus dash/deflect sound synthesis and removes dead variables.
* **v8.0 Batch 5 (`js/combat.js` — 1 large file):** Implements the 80-hero `executeHeroDash()` engine, reconnects `cqcCD` Gun-Fu takedowns, and wires `#76–#79` signature hardware.
* **v8.0 Batch 6 (`js/sim.js` — 1 large file):** Implements Early-to-Prime stance progression, Yoda's mid-air acrobatic hops/flips, Maul's dual-ended staff slicing, and active blaster-deflection stances.
* **v8.0 Batch 7 (`js/render.js` — 1 large file):** Renders Vader, Maul's double-bladed staff, Windu's purple Vaapad trails, Yoda's flipping sprite, character-specific deflection poses, and dash visuals.
* **v8.0 Batch 8 (`js/ui.js` — 1 large file):** Fixes scroll-safe 350ms long-press on cards, wires double-tap battlefield dash detection + `#dashSlot` HUD button, and adds the Double-Tap Dash toggle in Options.