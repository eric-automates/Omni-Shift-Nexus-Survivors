<!-- FILE: info.md -->
<!-- PART: 2 of 14 -->
<!-- DETAIL: Master architecture spec confirming all v1.0-v3.4 systems implemented and detailing the Version 4.1-4.4 Realism Update Roadmap. -->

# OMNI-SHIFT: NEXUS SURVIVORS — DESIGN & REALISM SPEC (v4.1)

## 0. Editor & Maintenance Protocol
* **Acode Overwrite Rule:** Always **Select All + Delete** before pasting replacement code into any file in Acode so shorter files never leave duplicate trailing lines at the end of the file.
* **Implementation Status:** **All systems prior to Version 4 (v1.0 through v3.4)**—including the 14-part modular architecture, 55 Heroes (`#00–#54`), Guaranteed Lv.10 Supercharges, 50 Relics, Distance Sub-Biomes, Hovercrafts/Forts, Orb Vacuum & 10-Min XP Warp Chests, Alignment Rival Invasions, Articulated Multi-Limb Enemy Anatomies, `%` Limb Popups, Black Drip Trails, and Elite Deflectors—are **100% implemented and verified**.

---

## 1. Version 4.1 (v4.0 + v4.1 Combined): Firing Range Paper Target & 100-Shot Telemetry (ACTIVE)
* **Non-Intrusive Pause & Level-Up Integration (`#rangeBox`):** Renders inside the unused dark lower space of `#scrLevel` during both **Level-Up** and **Pause**, without moving or shrinking upgrade cards.
* **Rolling 100-Attack Ring Buffer (`MAX_SH = 100` in `js/state.js`):**
  * Tracks the most recent **100 attacks** (`1` = oldest in window, `100` = most recent attack).
  * If a player fires 50 more shots after unpausing, the previous 50 shift to `1..50` and the new 50 become `51..100`.
  * Logs both **Ranged Projectiles** (drawn as a crosshair + bullet hole icon) and **Melee / Saber / Nova Strikes** (drawn as a diagonal blade slash `/` icon), plus outer-margin misses when ranged shots expire or hit walls.
* **XY Anatomy Quadrant Mapping & Accuracy Convergence (`computeHitQuadrant` in `js/sim.js`):**
  * Maps every impact onto normalized `(nx, ny)` coordinates relative to the target's anatomy: **Head / T-Zone**, **Torso / Heart Ring**, **Left/Right Arms**, **Front/Rear Legs**, or **Wolf Tail**.
  * As player Crit Chance and Level increase, aim grouping naturally tightens toward the **T-Zone (Head)** and **Heart Center-Mass**.
* **5 Semi-Realistic Gun-Store Paper Targets (`drawRangeTarget` in `js/ui.js`):**
  1. **Humanoid Henchman (`Tab 0`):** Scowling bad-guy henchman paper target with T-Zone cranial box, chest heart scoring rings (`10, 9, 8, 7`), shoulders, arms, and legs.
  2. **Snarling Wolf / Quadruped (`Tab 1`):** Angry wolf paper target showing fangs/snout, chest vitals ring, 4 leg zones, and rear balance tail zone.
  3. **Xeno-Arachnid Stalker (`Tab 2`):** Multi-eyed arachnid paper target with mandibles, thorax ring, abdomen, and 6 leg zones.
  4. **Armored Goliath Brute (`Tab 3`):** Hulking scowling brute paper target with recessed head, broad chest rings, crusher forearms, and piston legs.
  5. **4-Armed Titan Boss (`Tab 4`):** Horned 4-armed warlord target with crown T-Zone, core vitals, 4 arms, and heavy legs.

---

## 2. Version 4.2: Proportional Realism Pacing, Kenshi Body Status HUD, Outfit Customizer & Saber Rally (NEXT CHUNK)
* **Proportional Tactical Pacing:** Reduces enemy spawn flood by ~50% and slows firing cadence to a grounded, tactical pace while **doubling XP per orb (`2x`)** so level-up frequency stays fast.
* **Kenshi-Style Toughness XP & Player Limb Status HUD:**
  * Taking damage grants Toughness XP toward the next level.
  * Compact HUD Body Status Silhouette displays **Head/Eyes, Torso, Left/Right Arms, and Left/Right Legs**:
    * **Asymmetric Leg Drift:** Heavy right-leg damage pulls movement slightly rightward (requiring counter-steering down-left to walk straight down) until healed.
    * **Eye / Head Trauma:** Reduces weapon accuracy/grouping until regenerated.
    * **Hold-to-Guard Limb Protection:** Holding a finger on the Head or Torso status icon raises the hero's arm to shield that zone while firing. **Hidden Easter Eggs:** `#51 Baba Yaga`'s bulletproof Kevlar suit sleeve and `#40 T-800`'s hyperalloy titanium arm negate head/eye trauma while guarding!
* **Character Roster Sprites & Long-Press Canon Outfit/Limb Customizer:**
  * Displays each hero's vector sprite directly on their Character Select card.
  * Holding 350ms opens an interactive **Zoomed-In Limb/Torso/Head/Hair/Back Customizer** limited to authentic canon palettes from their movie/show (e.g., `#00 Initiate` switching from Tatooine gray/tan cloak to Return of the Jedi black tunic & removing back cloak), paired with a live **Zoomed-Out Battlefield Preview Window** in the bottom-right corner surrounded by static enemies.
* **Saber-to-Saber Ping-Pong Deflection Rally (Levels 1–100):**
  * Acquiring a Plasma Saber starts a 100-level reflection mastery tracker (`1%` reflection chance at Lv.1 up to `100%` guaranteed reflection back at the shooter at Lv.100).
  * Low-level enemy/player deflectors scatter bolts at wide grazing angles; high-level saber wielders bounce bolts directly back at the source, creating high-speed ping-pong rallies.
  * Each bounce increases bolt brightness up to **Pure White (`#ffffff`)**, after which subsequent bounces flash rapidly between pure white and RNG-selected red/orange/yellow hex codes.

---

## 3. Version 4.3: Persistent Bodies/Limbs, Blood Pools, Frame-Time Telemetry & Muzzle Realism (UPCOMING CHUNK)
* **Persistent Corpses, Severed Limbs & Expanding Blood Pools:**
  * The last **100 dead bodies** (configurable up to `9999+` in Options via *Limbs, Blood & Bodies Persist Count*) and up to **400+ severed limbs** remain on the battlefield with pooling black blood tied to each enemy's ID.
  * When enemy `#101` dies, enemy `#1`'s corpse, severed limbs, and blood pools fade out imperceptibly slowly.
  * Enemies (including Rival Bounty Hunters) can have arms and legs blown off mid-advance—walking past their own severed arm on the ground, or creepy-crawling/rolling forward on nubs if all limbs are lost.
* **Live Frame-Time (`ms`) & Render Load Telemetry:** Displays real-time frame time (`ms/frame`) and active corpse/limb draw load beside the FPS counter to alert players before mobile hardware throttles.
* **Muzzle-Tip Spawn & Weapon-Authentic Bolt Geometry:**
  * Projectiles spawn strictly at the **front muzzle tip** of the weapon (never visible behind the gun or character) with a brief muzzle flash.
  * Realistic projectile dimensions: `1px` high-velocity lead slug + muzzle flash for `#52 Six-Shooter`, compact plasma bolts for blasters, and elongated beams for lasers.

---

## 4. Version 4.4: Realistic Weapon Holstering, Arm-Count Firing Cap, 4-Arm Cyborg & Loadout Toggler (UPCOMING CHUNK)
* **Visible Holstered Arsenal:** Every unlocked weapon and utility (`#54 Wrist Flamethrower`, rifles on back, pistols in hip/cross-stomach holsters, sabers on belt) renders visibly on the character model and rotates with them.
* **Arm-Count Simultaneous Firing Cap & Swap Micro-Animation:**
  * Standard 2-armed heroes fire at most **2 weapons simultaneously**; owning 3+ weapons cycles through them with a realistic holster/draw swap micro-animation.
  * Adds a **4-Armed Cyborg General (Grievous-style)** hero capable of firing **4 weapons simultaneously**, while high-tier Force wielders telekinetically levitate extra weapons.
* **Active Weapon Loadout Selector (Pause & Level-Up):** Lets players toggle individual owned weapons ON/OFF mid-run so they can dedicate 50%–100% of their hand rotation to their favorite weapons.
