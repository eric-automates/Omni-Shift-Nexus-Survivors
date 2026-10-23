<!-- FILE: flowchart.md -->
<!-- DETAIL: Master Game Execution Flowchart & Subsystem Pipelines (v5.0 Realism Part 2) -->
# OMNI-SHIFT: NEXUS SURVIVORS — EXECUTION FLOWCHART (v5.0)
## 1. System Boot & Initialization Pipeline
```text
[ BOOTSTRAP / HTML SHELL (`index.html`) ]
         │
         ├──> checkLoadedScripts() & runDynamicEOFScan() (Strict EOF verification across 14 files)
         ├──> loadMeta() & updateMenuUI() (Restores persistent metadata & unlocks)
         └──> mountNexusMusicPlayer() 
                ├──> Pre-discovers music/ folder files & ID3 tags (up to 500 tracks)
                ├──> Mounts 🎵 Music toggle button, Now-Playing toast & Genre Filter UI
                └──> Registers HTML5 Audio touch-unlock handlers for Android/Webview
         │
         ▼
[ MAIN MENU SCREEN (`scrMain`) ]
         │
         ├──> Tap [▶ PLAY]: startRun() -> purgeRunMemory() -> Init SoA Pools & Player
         ├──> Tap [👤 HEROES]: renderChars() & Canon Outfit Customizer Preview
         ├──> Tap [🗺️ STAGES]: renderStages()
         ├──> Tap [⚙️ OPTIONS]: renderOpts() (Difficulty, Volume, Persist Count, Zoom, HUD Layout)
         ├──> Tap [📊 HEALTH]: runDynamicEOFScan() & live debug diagnostics
         └──> Tap [🎵 Music]: Open interactive Music Player, Seek Bar, Repeat, & Genre Drawer

```
## 2. Active Run Loop (60 FPS Simulation & Render)
```text
[ ACTIVE RUN LOOP (`loop` at 60fps) ]
         │
         ├──> updateThemeMusic(rawDt)
         │      ├──> Evaluates runActive state and pauseBar display
         │      ├──> Streams active-run music via queue shuffle, custom manifest, smooth fades & toast
         │      └──> Falls back to 8-bit CHARACTER_THEMES[cid] when on Main Menu
         │
         ├──> updateSim(rawDt * timeScale)
         │      ├──> Player kinematic movement, CQC center-axis relock & touch joystick
         │      ├──> AI steering, formation grouping (Testudo/Wolf-Pack), and obstacle avoidance
         │      ├──> Projectile updates, strict on-screen boss targeting (`isEnemyOnScreen`)
         │      ├──> Gore dismemberment, arterial bleeding, nub-crawling, and corpse recycling
         │      └──> Autonomous secondary hardware & wrist-tracked flamethrower triggers
         │
         └──> renderScene()
                ├──> Distance sub-biomes, organic city blocks, terrain grids & rideable mechs
                ├──> Voxel sprites, Proportional limbs, Brotato ball hands & holstered weapons
                ├──> John Wick weapon swap/slide-rack micro-animations & detaching ordnance trails
                ├──> Bullet trails, explosions, blood drips, particle FX, and blade clashes
                └──> Tactical Visor HUD overlays (T-800 Red HUD, Predator Thermal, Boba Rangefinder, Matrix)

```
## 3. Event Triggers & Modals
```text
[ EVENT TRIGGERS ]
         │
         ├──> XP Orb Collected -> Level Up Modal -> triggerLevelUp() (Pick 1 of 3 Cards / Relics)
         ├──> Pause Button Tapped -> pauseBar displayed -> Active Run Music continues, Menu paused
         └──> Player HP <= 0 -> Revive check or Game Over / DM Earnings Screen

```
