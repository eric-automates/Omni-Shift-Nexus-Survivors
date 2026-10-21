<!-- FILE: info.md -->
<!-- PART: 2 of 14 -->
<!-- DETAIL: Master game architecture, verification fixes, Orb Vacuum QoL, and the completed 3-Chunk Enemy Anatomy, Limb Damage & Deflection Specification. -->

# OMNI-SHIFT: NEXUS SURVIVORS — DESIGN & ROADMAP SPEC (v3.4)

## 0. Editor & Maintenance Protocol
* **Acode Overwrite Rule:** Always **Select All + Delete** before pasting replacement code into any file in Acode. Pasting a shorter file directly over a longer file without clearing it first can leave duplicate trailing lines at the end of the file.
* **No Tree Diagrams:** All documentation uses standard Markdown lists instead of ASCII box-drawing trees for clean mobile rendering.

## 1. Core Engine & Zero-GC Memory Lifecycle
* **14-Part Modular Architecture:** 14 files (`<= 300` lines each) using vanilla HTML5 Canvas, CSS3, ES6 JS, Web Audio API synth, and SVG icons.
* **Zero-GC TypedArray Pools:** Pre-allocated Structure-of-Arrays (SoA) ring buffers for Enemies (`MAX_E=360`), Projectiles (`MAX_P=520`), Orbs (`MAX_O=500`), Floating Text (`MAX_D=140`), Particles (`MAX_PT=240`), and Black Pixel Drips (`MAX_DRIP=220`).
* **Orb Vacuum & 10-Min Warp Chest QoL:**
  * **Zero-Starvation Orb Recycler:** If all `500` orb slots fill up, `spawnOrb()` merges the furthest off-screen orb's XP into the new orb so drops never stop spawning.
  * **Innate 100% Vacuum:** Force, Telekinetic, Psychic, and Grav-Gun heroes (`#0, #3, #7, #10, #12, #14, #18, #20, #27, #38, #39, #45, #49`) automatically pull 100% of distant orbs on kill and never see redundant magnet/vacuum upgrade cards.
  * **Level-Up Vacuum Cards:** Non-telekinetic heroes can roll *Subspace Orb Siphon (+35%)* or rare flashing *Omega Singularity Vacuum (100%)*.
  * **10-Minute XP Warp Chest:** Every 600s (or if `>=380` orbs pile up off-screen), all off-screen orbs compress into a high-yield **XP Warp Orb + Relic Chest** beside the player.

## 2. Heroes (#00–#54), Alignments & Rival Invasions
* **Guaranteed Lv.10 Supercharge:** Any Lv.9 weapon guarantees its flashing gold `★ SUPERCHARGE` card in Slot 1 on the next level-up.
* **Iconic Heroes (#51–#54):**
  * **#51 Baba Yaga Suit-Assassin:** CQC Grapple-Flip-Execute on contact + Backup Sidearm -> *Continental Tactical Arsenal*.
  * **#52 The Man With No Name:** Poncho + single right-arm *Fan-Hammer Six-Shooter* with `0.55s` quick-reload -> *Deadeye Eight-Shooter*.
  * **#53 Green-Beret Last-Stand Vet:** *M60 & Explosive Bow* + 120s stationary **Last-Stand Fort & Claymore Mines**.
  * **#54 Slav-1 Bounty Tracker:** *EE-3 Carbine* + Auto-Flamethrower (`>=4` foes) + **Fibercord Grappling Hook**.
* **3-Line Quotes & Alignment Invasions:** Every hero has 3 randomized boss-kill quotes and an alignment (`good`, `bad`, `bounty`). Every 75s, any hero can invade with alignment-specific or matchup-specific dialogue.

## 3. Completed 3-Chunk Enemy Anatomy, Limb Damage & Deflection Spec

### Chunk 1: Articulated Multi-Limb Enemy Anatomy (ACTIVE)
* **Visual Differentiation:** Main characters and Rival Heroes use multi-layered, multi-colored outfits (`drawHeroSprite`), while regular wave enemies and bosses use solid faction-colored (`fac.c2`) articulated limb silhouettes (`drawEnemyAnatomy` in `js/render.js`).
* **5 Procedural Enemy Body Types (`eType` + `eSeed` via `ChaosMath`):**
  1. **Humanoid / Skeleton Troopers (`eType 0`):** Skull/helmet head, ribcage/armor torso, 2 swinging arms, 2 striding legs + Elite Deflector Gear.
  2. **Quadruped Hounds / Cyber-Dogs (`eType 1`):** Snout head, horizontal torso, **4 independent galloping legs**, and an articulated rear **Tail**.
  3. **Xeno-Stalkers / Arachnids (`eType 2`):** Segmented thorax/abdomen, mandibles, and **6 scuttling legs**.
  4. **Heavy Armored Brutes (`eType 3`):** Broad hunched carapace, recessed head, piston legs, and crusher forearms.
  5. **Sector Bosses (`eType 99`):** Giant 4-armed, multi-limbed Titan silhouette.

### Chunk 2: Zero-GC Limb Damage, `%` Hit Popups, Black Drip Trails & Cripple AI (ACTIVE)
* **Self-Clearing Limb Tracker (`clearEnemyLimbState`):** Pre-allocated TypedArrays in `js/state.js` (`eLegDmg`, `eTailDmg`, `eLegsLost`, `eBleed`, `eTurnAng`, `eTurnTimer`) automatically reset on enemy death and spawn.
* **Hit Location & Percentage (`%`) Popups:**
  * **Critical Hits (Head / Center Mass):** Display a **gold number (`1!` to `100!`)** showing the percentage of core integrity removed.
  * **Regular Hits (Legs / Arms / Hound Tail):** Strike an extremity and display a **gray number (`5` to `100`)** showing the cumulative percentage of that limb's integrity removed.
* **Black Pixel Drip & 2x Ground Pool Trail (`MAX_DRIP=220`):** Wounded limbs leak `1.5px` black pixel drips that fall to the ground and pool out to `2x` size (`3.2px`), fading out rapidly when the enemy dies.
* **Anatomy-Specific Cripple & Balance Physics:**
  * **Humanoids / Brutes / Arachnids:** Leg damage slows movement speed (up to `-65%`) and visibly shortens/blackens crippled legs.
  * **Quadruped Hounds (4 Legs + Tail):** Losing 1 of 4 legs barely slows the hound (`-15%`); losing 2+ legs severely cripples it (`-65%` to `-82%`). If its **Tail** takes `>=45%` damage, the tail visibly severs and the hound loses directional balance—veering off-angle and periodically re-orienting toward the player.

### Chunk 3: Faction-Specific Elite Projectile Deflection (ACTIVE IN v3.4)
* **Who Can Deflect (`canEnemyDeflect`):** Wave 2+ Elites (`eSeed % 5 === 0` on Humanoids and Brutes) have a **32% chance** to deflect incoming projectile bolts/missiles/lasers (`pStyle` 2, 3, 4, 5), while Sector Bosses and Rival Champions have a **16% chance**.
* **Faction-Authentic Deflector Visuals (`drawDeflectorGear` in `js/render.js`):**
  * **Laser-Opera (`fac 0`):** Glowing **Plasma Saber** with a white-hot inner core and colored outer blade.
  * **Astral-Gate, Spice-Empire, Star-Citadel, Lab-Vortex (`fac 1, 3, 4, 8`):** Shimmering semi-circular **Personal Energy Overshield / Holtzman Bubble** arc in front of the unit.
  * **Rim-Outlaw, Xeno-Drop, Grimdark-40K, Cyber-Waste, Eldritch-Ronin (`fac 2, 5, 6, 7, 9`):** Heavy **Ballistic Riot / Storm Shield** or **Runic Parry Blade** mounted on the lead arm.
* **Universal Ricochet Physics (`pEnemy = 2`):**
  * Deflected projectiles turn blazing **orange-white**, play a metallic ricochet synth ping, and bounce off at a random angle.
  * `pEnemy = 2` projectiles are **Universal Hazards**: they deal full limb/crit damage to **any other enemy** they strike *and* can damage the **player** (especially dangerous when firing rapid bursts at point-blank range).
  * **Player Defenses Against Ricochets:** Mitigated by `#00 Goa'uld Personal Repulsor` (vaporizes deflected bolts), Player Dodge (`#14 Miranda`, `#18 Muad'Dib`, `#39 Zion One`), `#10 Othala Beaming Phase`, Flat Armor / Beskar Plating, Hovercraft hull armor, or Last-Stand Fort cover.
  