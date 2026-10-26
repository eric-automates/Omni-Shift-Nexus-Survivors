# FILE: flowchart.md
# PART: 2 of 14
# DETAIL: Version 8.0 / 8.2 Current State Architecture & Execution Flowchart (Pre-v9.0 Baseline)

```mermaid
flowchart TD
  %% === 1. BOOT & DIAGNOSTIC SHELL (index.html + js/ui.js) ===
  subgraph BOOT["1. PRE-BOOT & DOM SHELL (index.html + js/ui.js)"]
    A["index.html: Safe Node.removeChild Wrapper & Live Debugger"] --> B["Ordered Script Loader (10 Modular JS Files)"]
    B --> C["checkLoadedScripts() & runDynamicEOFScan()"]
    C --> D["enableScreenCardScroll() (Touch-Drag pan-y Controller)"]
    D --> E["loadMeta() -> localStorage (OMNISHIFT_META_V1)"]
    E --> F["updateMenuUI() -> Main Menu (#scrMain)"]
  end

  %% === 2. MENU & ROSTER NAVIGATION (js/ui.js + js/state.js) ===
  subgraph MENUS["2. MENU SCREENS & 350ms INSPECTOR (js/ui.js)"]
    F -->|Tap Deploy| G["startRun() (js/combat.js)"]
    F -->|Tap Roster| H["renderChars() (80 Heroes Sorted by 11 Genres)"]
    F -->|Tap Sectors| I["renderStages() (50 Procedural Sectors)"]
    F -->|Tap Shop| J["renderMeta() (Dark Matter Upgrades & 100% Respec)"]
    F -->|Tap Diagnostics| K["renderHealth() (EOF Scanner + FPS/Corpse Telemetry)"]
    H -->|Hold Card 350ms| L["openInspector() + renderOutfitCustomizer() (#custBox)"]
    L -->|Cycle Head/Torso/Legs/Back/Blade| M["cycleOutfitPart() -> getOutfit() -> getDefaultBladeIdx()"]
  end

  %% === 3. RUN INITIALIZATION (js/combat.js + js/state.js) ===
  subgraph INIT["3. RUN INITIALIZATION (js/combat.js)"]
    G --> N["purgeRunMemory() (Clears SoA TypedArray Pools & Map Deltas)"]
    N --> O["Initialize player Object (Stats, Limbs[6], Innate Visor, Dash Spec)"]
    O --> P["Assign Starting Weapon with getWeaponColor(cid) -> bladeCol"]
    P --> Q["syncHeroSpellbook() (Unlocks Cumulative Spells onto #spellBar)"]
    Q --> R["Activate #hud & Enter 60 FPS requestAnimationFrame(loop)"]
  end

  %% === 4. 60 FPS SIMULATION ENGINE (js/sim.js + js/world.js) ===
  subgraph SIM["4. 60 FPS ZERO-GC SIMULATION LOOP (js/sim.js)"]
    R --> S["updateSim(rawDt) -> simDt = rawDt * timeScale"]
    S --> T["Weapon Drop Pickup Check (activeWeaponDrops)"]
    T --> U["Player Kinematics, Acrobat Z-Hop & Obstacle Collision (js/world.js)"]
    U --> V["Biographical Stance Engine: getHeroStanceSpec(cid, lvl, isDeflecting)"]
    V --> W["Active Hand Slot Loop (armCap) & Holster Swap Timer"]
    W -->|Melee / Orbit Saber| X["checkBladeSegmentSlice() (Limb Sever + Bisected Halves)"]
    W -->|Ranged / Wand / Staff| Y["fireWeapon() -> spawnProj() / castArcaneSpell()"]
    S --> Z["updateHeroSpecials() (CQC Gun-Fu, Sandevistan, V.A.T.S., Auto-Hardware)"]
    S --> AA["updateMinionsSim() (MAX_MINION=36 Allied Undead / Knights / Hounds)"]
    S --> AB["Enemy AI Loop (MAX_E=360): Formations, ChaosMath Steering, Bleed & Levitate"]
    AB -->|Enemy Killed| AC["killEnemy() -> spawnCorpse() / spawnBisectedBodyHalves() + spawnOrb()"]
    AC -->|If Rival (98) or Boss (99)| AD["spawnWeaponDrop() + grantRelic() + Protected Veteran Corpse"]
    S --> AE["Projectile Loop (MAX_P=520): Saber Deflection, Ricochet & Hit Zones"]
    S --> AF["XP Orb Loop (MAX_O=500): Magnet Pull -> triggerLevelUp() (#scrLevel)"]
  end

  %% === 5. VOXEL & SCENE RENDERER (js/render.js + js/ui.js) ===
  subgraph RENDER["5. SCENE RENDERER & IN-PLACE HUD (js/render.js + js/ui.js)"]
    R --> AG["renderScene() (Camera Transform & Zoom)"]
    AG --> AH["renderBiomeAndWorld() (256px Procedural Chunks, Forts, Mines, Weapon Drops)"]
    AG --> AI["Render Gore Pools: Blood Drips, Severed Limbs, Intact Corpses & Bisected Halves"]
    AG --> AJ["Render Enemies, Rivals (drawHeroSprite) & Active Tactical Visor Overlay"]
    AG --> AK["drawHeroSprite(player): Stature Scale (getHeroBodySpec) + Per-Weapon bladeCol"]
    AG --> AL["updateHUD() (In-Place DOM Sync for #wpnSlots, #utilBar, #dashSlot, #spellBar, #bodyHud)"]
  end
