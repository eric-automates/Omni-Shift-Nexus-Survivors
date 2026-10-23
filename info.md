<!-- FILE: info.md -->
<!-- PART: 2 of 14 -->
<!-- DETAIL: Complete Master Design & Realism Specification (v4.4 Complete: All 56 Heroes' Bespoke Voxel Sprites, Lv.5 Primary Transitions, Secondary Hardware & EOF Audit). -->

# OMNI-SHIFT: NEXUS SURVIVORS — MASTER DESIGN SPEC (v4.4 COMPLETE)

## 1. Dynamic EOF Sentinel & Acode Overwrite Protection
* **Dynamic `fetch()` EOF Scanner (`runDynamicEOFScan` in `js/ui.js`):** Every `.js` file ends with `// EOF:js/<filename>.js`. On boot and inside **Health of Game Diagnostics**, the engine fetches the raw source of all 10 scripts and flags any missing EOF marker (chopped paste) or leftover characters after the marker (Acode trailing-line overwrite bug).

## 2. All 56 Heroes (#00–#55): 100% Bespoke Voxel, Audio & Arsenal Parity
* **56 Bespoke Voxel Anatomies (`HERO_VOXEL_STYLE` in `js/render.js`):** Every hero renders their authentic headgear, armor, and silhouette with zero hair-clipping and physics-driven capes only on characters who canonically wear them.
* **56 Canon Outfit & Saber Blade Customizers (`CANON_56` in `js/data-heroes.js`):** Long-pressing any hero card opens the dual-view customizer (Zoomed-In View + Bottom-Right Battlefield Preview) with 3 canon Head/Hair, Torso, Legs, and Back options plus 7 Lightsaber/Blade colors.
* **56 Lv.5 Primary Weapon Transitions (`HERO_SIG_GEAR` in `js/combat.js`):** Every hero's starter weapon transitions at **Lv.5** into their upgraded primary weapon (with +25% damage, extended barrel/blade geometry, and on-screen callout) before reaching their **Lv.10 Supercharge** (guaranteed in Slot 1 when at Lv.9).
* **56 Start-of-Run Equip Animations & Autonomous Secondary Hardware:** Every hero performs a signature equip animation/callout on deployment and periodically fires their mounted secondary hardware (e.g., `#54` Z-6 Jetpack Missile, `#29` Shoulder Plasma Caster, `#33` Shoulder Flame-Belcher, `#35` Mechadendrite Arc-Claw, `#48` Igni Sign, `#01` Whistling Birds).
* **56 Side-Profile Weapon SVGs (`makeSVG` in `js/data-relics.js`) & 56 8-Bit Character Themes (`updateThemeMusic`):** Every weapon slot displays a recognizable side-profile silhouette, and each hero plays a distinct 8-bit theme on the Main Menu and Pause Menu (silent during active runs and Level-Up).

## 3. Realism Systems (v4.1–v4.4)
* **v4.1 Per-Archetype 100-Shot Paper Target Telemetry (`#rangeBox`):** Tracks the last 100 attacks (`1..100`) split across 5 gun-store paper targets (`1.Hench`, `2.Wolf`, `3.Spider`, `4.Brute`, `5.Titan`).
* **v4.2 Kenshi Body Status HUD, Limb Guard & Saber Rally:** 6-zone player limb health with explicit debuff pill (`SPD`, `DRIFT`, `AIM`), hold-to-guard (`#51` Kevlar sleeve & `#40` Titanium arm 95% head block), Toughness XP when hit, and 100-level Saber ping-pong deflection rally with white-hot strobe bolts.
* **v4.3 Gore, Persistent Corpses/Limbs & Muzzle Realism:** Multi-hit enemy HP with arterial bleed-out, mid-walk arm/leg dismemberment, nub-crawling, configurable `opts.persistCount` (`100` to `9999`), live `ms` render telemetry beside FPS, and muzzle-tip projectile spawning with supersonic pass-by snaps and ricochet pings.
* **v4.4 Visible Holstered Arsenal & Arm-Count Firing Cap:** All unlocked weapons render holstered on the hero's back, hips, or belt; standard heroes fire 2 weapons at a time (`4` for `#55 General Kaleesh Cyborg`, `3` for Force Masters) with an Active Weapon Enable/Disable toggler on Pause and Level-Up.
