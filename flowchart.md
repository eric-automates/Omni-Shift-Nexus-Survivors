<!-- FILE: flowchart.md -->
<!-- DETAIL: Master Game Execution Flowchart & Subsystem Pipelines (v7.0 Arcane Sanctum) -->

# OMNI-SHIFT: NEXUS SURVIVORS — EXECUTION FLOWCHART (v7.0)

## 1. System Boot, Script Validation & Music Mount
```text
[ BOOTSTRAP / HTML SHELL (`index.html`) ]
         │
         ├──> checkLoadedScripts() & runDynamicEOFScan() (Strict EOF verification across 14 files)
         ├──> loadMeta() -> ensureStarterChars() (Unlocks 1 Free 0-DM Starter Hero in all 11 Genres)
         ├──> updateMenuUI() (Restores persistent Dark Matter, selected Hero, House Crest & Stage)
         └──> mountNexusMusicPlayer() (js/chaos.js)
                ├──> Auto-discovers music/ playlist (up to 500 tracks) + ID3v2 Title/Genre tags
                ├──> Mounts 🎵 Music toggle, Now-Playing toast, Seek Bar & Genre Filter Drawer
                └──> Auto-mutes 8-bit Main Menu theme whenever custom MP3 playback is active
         │
         ▼
[ MAIN MENU SCREEN (`scrMain`) ]
         │
         ├──> Tap [▶ DEPLOY]: startRun() -> purgeRunMemory() -> Init SoA Pools, Player & Spellbook
         ├──> Tap [👤 ROSTER (76)]: renderChars() (Grouped by 11 Genres, Sorted 0 DM -> High DM + House Crests)
         ├──> Tap [🗺️ STAGES (50)]: renderStages() (Morphed by Hero Faction 0–10)
         ├──> Tap [⚙️ OPTIONS]: renderOpts() (Difficulty, Persist Cap, Temporal Speed, Zoom, Audio, Layout)
         └──> Tap [📊 HEALTH]: renderHealth() (Live FPS, Corpse Telemetry & Dynamic EOF Audit)
         │
         ▼
[ ACTIVE RUN LOOP (`loop` at 60fps) ]
         │
         ├──> updateThemeMusic(rawDt) (js/chaos.js)
         │      ├──> Streams active-run MP3 queue shuffle with smooth volume fades & toast
         │      └──> Plays 76 bespoke 16-note alignment CHARACTER_THEMES[cid] on Main Menu
         │
         ├──> updateSim(rawDt * timeScale) (js/sim.js & js/combat.js)
         │      ├──> Player kinematic movement, banking jetpacks, & combat-aware blink timers
         │      ├──> Level-scaling Star Wars Prequel lightsaber flourishes & 1-person-width blade slicing
         │      ├──> Guaranteed limb severing & exact-angle torso bisection (`spawnBisectedBodyHalves`)
         │      ├──> 4-Stage Thrown Blade Impale -> Enemy Kneel -> Force-Pull Wiggle -> Rip-Back & Collapse
         │      ├──> Allied Minion AI (`updateMinionsSim`: Swordsmen, Critters, Bowmen, Knights, Bone Golems)
         │      ├──> Arcane Spell Physics: Avada Kedavra, Wingardium Leviosa float-to-XP, & Rune Barriers
         │      └──> Boba Fett Knee Rocket-Darts, Wrist Flamethrower & Baradium Disintegrator Wave
         │
         └──> renderScene() (js/render.js)
                ├──> 11 Faction Biomes, distance sub-biome tints, 3D spires, crates, pods, mechs & forts
                ├──> Bisected falling torso halves with glowing-to-dark smoldering cauterized cut seams
                ├──> Allied Minions, levitating enemies (`eLevitate`), & impassable Rune Barriers
                ├──> Front-facing 76-Hero Voxel sprites (Combat blinking, feminine eyes, Clint squint)
                ├──> Wrist-pivoted Prequel saber flourishes, motion blur trails, & Brotato ball hands
                └──> Live Tactical Visor HUD Overlays (+10% Crit): Boba RF, T-800/Auror, Thermal/Spectre, Prescience
         │
         ▼
[ IN-RUN HUD & EVENT TRIGGERS ]
         │
         ├──> Top-Bar Spellbook (`#spellBar`): Unlocks cumulative spells as Primary Weapon levels up
         │      └──> Tap any unlocked spell/minion button to cast or resurrect undead from corpses
         │
         ├──> XP Orb Collected -> triggerLevelUp() (Pick 1 of 3 Cards)
         │      └──> Weapon Upgrades,Lv.5 Primary Evolutions, Lv.10 Supercharges, Force Push 360° Upgrades,
         │           New Weapons, Passives, Lootable Visors, & Subspace Orb Siphons
         │
         └──> Hold Any Card / HUD Button 350ms -> openInspector() + Dual-View Canon Outfit Customizer
