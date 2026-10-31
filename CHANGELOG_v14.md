# OMNI-SHIFT: NEXUS SURVIVORS — v14 "NEXUS CITY" (2026-10-31)

Base: v13 (`65c212e`, identical to GitHub `main` — verified file by file before starting).
18 files changed · 6,491 lines added · 57 changed · 9 new modules (6,238 lines) · old code touched surgically (sim/render/ui/creator/biomes: 39 lines).

---

## 0. Repo evaluation (start of v14)
- GitHub `main` (latest upload `18f151d`) matches v13 exactly: all 31 tracked text files hash-identical, 17 soundtrack MP3s present.
- v13 suites re-run green before work began. Two timing-sensitive checks are intermittent in this test environment **on the untouched v13 build too**: `verify_fixes` T08 and `verify_v10` V09 (Proving Ground "squad did not regroup" / "crowd too close") — reproduced 1-in-4 on v13 itself, so not v14 regressions.
- Engine facts that shaped v14: positions in Float32 typed arrays (kept; the city uses a local frame around the drop zone so precision stays sub-pixel), a survivors-style auto-fire loop (needed a "weapons-free only with a target" rule for stealth), arena obstacles via `getChunk`, enemy art as simple rectangles.

## 1. Nexus City — a self-generating 64 × 64 km region (`citygen.js`, `cityworld.js`)
- **Macro map (1 km cells):** capital *Nexus City* + 6 cities, 22 towns, 26 villages; land use Downtown / Urban / Suburbs / Rural / Farmland / Industrial / Woods / Lakes; 3–4 interstates each way with names (I-65, I-69, I-70, I-74…). Generated in ~25 ms from `meta.citySeed` (default 1979, shared by everyone so markers stay valid; **NEW REGION** in the drop-zone map rolls a fresh one).
- **Street lattice:** ranks every 1 km / 500 m / 250 m / 125 m with jitter, widths & sidewalks by rank and district, T-junctions between districts, real street names (Meridian Ave, 66th St, County Rd 300 E).
- **Blocks & lots:** suburbs full of single-storey **ranch houses** (driveways, garages, fences, pools, sheds, playsets, grills), strip malls, **gas stations** (pumps, canopy, price sign, ice chest, air pump), diners, cafés, bars, banks, pharmacies, laundromats, auto repair, dealerships, post offices, hardware, motels, apartments, downtown shop rows & cinemas, warehouses with loading docks, farms with barns, silos and hay; **civic centres** in every city and town: **city hall (council chamber, mayor's office)**, police (cells, armory, interrogation), fire station (bays with fire trucks), school (classrooms, gym, cafeteria, sports field, bus), clinic, library, church (pews, altar, churchyard). Evacuation flavour: barricades, sandbags, evac-route signs, abandoned army trucks.
- **Interiors for every building:** 20 templates, rooms by purpose, interior & exterior doors, windows, ~75 furniture types placed so walkways and archways stay clear (validator: < 2 % unreachable floor on average, every building has an exterior door). Rotated / mirrored per lot.
- **Runtime:** 64 m chunks of 0.5 m tiles with movement / sight / bullet / window / door / indoor / low-cover / water flags and material kinds; circle collision with wall sliding; DDA ray casts; recursive shadow-cast line of sight; doors that swing (or slide) open for anyone and close behind exterior doors; windows that shatter (glass noise, decals) and can then be climbed through; supply caches inside buildings.

## 2. Dressed for your hero (`citythemes.js`, `cityrender.js`)
- **14 universe looks** chosen by hero (80 heroes mapped; your own hero picks one in the Creator): Modern Earth · Neon Megacity · Outer Rim (Tatooine adobe) · Core-World ecumenopolis · Federation colony · Frontier colony base (Aliens/Halo/Doom) · Firefly rim world · Old West · Arrakeen · Goa'uld world · Imperial hive · Wasteland · Medieval kingdom · Wizarding village.
- Each universe re-skins **ground, roads (asphalt, wet neon, packed sand, durasteel plates, hazard plates, dirt, cobbles, flagstones), sidewalks (slabs, boardwalks, sandstone), floors per room type, walls & windows, roofs, furniture style** (a chair or a gas pump is earthly, sleek sci-fi with glow strips, used-tech, industrial, rustic, gothic with candles, Egyptian gold, wizarding brass…), **vehicles** (sedans, spinners, landspeeders, hovercars, APCs, mules, horse wagons, ornithopters, death gliders, Rhinos, rusted wrecks, hay carts, the flying Ford Anglia, the Knight Bus), trees (oaks, palms, cacti, moisture vaporators, holo-trees, dead trees), street lamps (holo, torches, braziers, lanterns, floating candles), **signage** ("TIBANNA FUEL", "PROMETHIUM DEPOT", "FLOO POWDER CO.", "LAMP OIL & FEED", "DEX'S DINER", "NCPD", "MINISTRY OF MAGIC"…), city names (Mos Espa, Night City, Hogsmeade…), weather and **litter** (papers, cans, bottles, flyers, neon wrappers, droid scrap, parchment & purity seals, tumbleweeds, owl letters…).
- **Renderer:** 512 px tiles baked nearest-first within a 6 ms budget and cached (LRU); procedural textures per universe; live layer for doors, decals (bullet holes, scorch, glass, blood, cooling saber cuts), caches and parked cars you left; **roofs** (gable / hip / flat / domes / false fronts with chimneys, AC units, solar panels, windtraps, obelisks, spires, landing pads, neon trims) that **fade away for the building you are in** — from outside you can't see in; building signs on the roofs; neon light pools under signs.

## 3. Line of sight & per-hero vision (`cityworld.js`, `cityrender.js`, `vision.js`)
- **Vision sphere:** shadow-cast every time you move a tile; everything behind walls / closed doors is **greyed (desaturated + darkened)** with soft edges; moving reveals it. Looking out of windows works. Roofs of buildings you can see are drawn on top; unseen ones are greyed. On GPU-less devices the desaturation automatically switches to a cheaper grey wash (keeps ~60 fps).
- **Unique sense per hero — most can't see through walls:** Jedi feel faint presences (blue; Sith red; droids invisible to the Force; Mace sees shatterpoints) · the **Predator sees green, see-through, particle-ized apparitions** · Mandalorians / Boba / the Baron read heat · T-800, Cylon, Grievous, Kiroshi optics box targets with range · Colonial Marines, Chief, R2, Starbuck (DRADIS), Space Marines (auspex) get a **motion tracker** that only sees movement and pings · Samus, Moody, Dumbledore, Strange see through walls up close · Neo reads the code · Harry, Lupin, Sirius follow the **Marauder's Map** (footprints + names) · Paul, River, Han get prescient flashes · Geralt follows scent trails · telepaths see minds pulse · the Borg / Xeno Queen see hive links · Orks see red rage · John Wick, Rambo, Chewie, Worf… hear footsteps as ripples · Jayne and the Man with No Name simply see further. 16 kinds, 80 profiles, label shown on the HUD.

## 4. Enemies: rosters per hero, detailed art (`enemylook.js`) — city **and** classic arena
- **48 rosters × 4 archetypes (grunt · fast · critter · heavy) = 192 enemy types**, chosen by hero, e.g.: Luke/Han/Chewie → Stormtroopers, Scout Troopers, probe droids, Death Troopers · Yoda/Mace → B1, BX commandos, buzz droids, B2 · **O'Neill/Teal'c → Serpent Guard Jaffa, Horus Guards, Replicators, Kull Warriors** · Thor → Replicator swarm · **John Wick → the Bratva: tracksuit gunmen, Tarasov enforcers, attack dogs, High Table heavies** (with outfit variations) · Chief → Grunts, Elites, Flood, Hunters · Doom → Imps, Pinkies, Lost Souls, Barons · Harry & co. → Death Eaters, Snatchers, Inferi, werewolves · Gandalf → orcs, goblins, wargs, Uruk-hai · and 40 more.
- **Detailed renderer:** walk cycles, outfits (armor plates, vests, robes, coats, suits & ties, tracksuits, rags, chainmail, tubes…), ~70 headgear types (stormtrooper buckets, serpent helms, falcon helms, clone T-visors, Cyberman heads, Space Marine helms, fedoras, sombreros, Death Eater masks…), weapons that track the aim (blasters, rifles, staff weapons glow when firing, lightsabers & energy swords swing), plus droids, quadrupeds, bugs, drones, Daleks and Xenomorphs. Ranged / kinetic flags drive the AI and ricochets.

## 5. Stealth, hearing & the director (`stealth.js`)
- **Spread out, not swarms:** enemies come from the generator's records — **occupants of rooms, guard posts, street patrols** — spawned within ~130 m (never in plain view), despawned when far, and **kills persist** when you come back. Hunter squads sweep toward you every minute or so (faster downtown); rivals and Titans still arrive and track you.
- **Sound model:** `L = L0 − 20·log10(d) − 0.012·d − walls`, with transmission loss per wall / door / window / fence on the straight path (wood 24, brick 32, masonry 35, metal 30, interior 20, closed door 15 / exterior 24, window 20, broken 0; buildings the sound only passes over cost 10 dB +3 each). Thresholds: notice 50 · investigate 66 · urgent 88 · combat 115 (< 25 m).
  - Unsuppressed inside a house → investigated well over 150 m outside (+ distant responders converge).
  - Suppressed inside a house → only noticed right outside, gone by ~40 m.
  - Suppressed inside a sealed multi-room building → investigated in the next room, not outside.
  - Blades / lightsabers → about 1.5 m.
  - **Every new shot re-targets listeners**; ricochets and breaking glass make their own noise (shoot a wall to pull a guard away).
- **Per-hero weapon sound** (firearm 160–176, blaster 140, staff weapons 136, phasers/lasguns ~122, wands ~104, blades 72…). **V = suppressor** on real firearms only (P90, Kimber, Neo's arsenal, Vera…) — revolvers, bolters, shotguns, the Deffgun, smartguns can't be suppressed and the game tells you why.
- **AI:** idle · patrol · investigate · search · alert · return; view cones (wider while searching, 360° up close), suspicion that grows with closeness, movement, light and your muzzle flash; contact call-outs that bring allies; A* paths on a walkability snapshot, doors, unsticking; ranged enemies hold position and shoot with line of sight. **? / !** icons, faint view-cone hints, edge arrows for anyone hunting you, and a **HIDDEN / SUSPICIOUS / HUNTED** status pill.
- **Weapons-free rule:** guns fire automatically only when a hostile is in sight and range; **hold Shift to sneak** (55 % speed, quieter steps, hold fire until spotted). **Blades on an unaware foe = silent takedown.** Explosions, engines and footsteps all make noise.

## 6. Ballistics vs. the city (`cityplay.js`)
- Walls, cars, trees and cover stop bullets; **kinetic rounds ricochet** off brick, stone, metal and cars at grazing angles (< ~22°, up to twice, losing damage); square hits leave bullet holes and dust; energy bolts scorch; **glass shatters** and the round continues; **rockets detonate** on walls. Enemy fire obeys the same rules — take cover.

## 7. Map, minimap, markers & notes (`minimap.js`)
- **Minimap** bottom-right in the universe's map style (paper road map / holo-map / parchment), 5 zoom levels (**[ ]**, wheel, ± buttons); shows enemies you can see (red when hunting), sensed blips, markers.
- **M = full map** of the whole region: drag / wheel / pinch, street names when close, interstate shields, themed city names, scale bar, cursor read-out; pauses the game.
- **Markers:** click to drop one — **6 colours × 8 symbols** (pin, star, skull, flag, home, medical, target, ?) and a note; edit / delete; notes list with distances; saved per region.
- **Marker visibility:** on the **minimap edge** while far → **on the minimap** when in range → **beacon on the main screen in its colour** within ~160 m (edge arrow with distance when off-screen).
- **Drop zone:** main menu → *CITY MAP · DROP ZONE* → click where you want to land (or RANDOM DROP / NEW REGION).

## 8. Also new
- **Drivable cars (F):** the universe's vehicle, ~4× speed, too wide for doorways, rams enemies, loud engine; parks where you leave it.
- **Supply caches** inside buildings (heal + XP); city kills worth +30 % XP.
- **Districts drive danger:** Threat Sense / HUD use the district (Suburbs ×1.15 … Downtown ×1.85); the arena's biome hazards and banner are replaced by the city banner and the universe's weather.
- **Hero Creator:** new **UNIVERSE** row (20 choices or Auto from the loadout) → city look, enemy roster, sense and weapon sound.
- **Main menu:** WORLD toggle (Nexus City ⇄ Classic Arena), CITY MAP · DROP ZONE; URL override `?world=classic|city`.
- **Onboarding:** four short tips on the first three city deploys (the last explains your hero's sense); NEW IN v14 box in the HUD guide; touch buttons for minimap zoom, map, sneak and suppressor.
- **Performance:** ~2 ms of script per frame downtown with ~40 enemies; tile / roof / map caches capped; adaptive fog; 58–59 fps in a GPU-less headless browser.

## 9. Changes to existing files
- `js/sim.js`: director replaces ring spawns in the city; city enemies moved by `stealthEnemyStep`; projectiles checked against walls; `cityHoldFire` before firing; sneak speed; car speed.
- `js/render.js`: city ground instead of the arena ground; detailed roster enemies (tracker visors keep a heat halo); roster names on the visor target label.
- `js/ui.js`: city name in the stage pill; game render skipped while the full map covers the screen; new modules in the boot health check.
- `js/creator.js`: `universe` field + chips; `js/biomes.js`: no arena biome banner in the city; `index.html`: 9 new scripts, city HUD, v14 guide box, cache tag `v14-2026-10-31`; `css/style.css`: city HUD, map, minimap controls, tips.
- `info.md` (v14 sections 2.10–2.15, history, roadmap, technical notes) and `flowchart.md` (+4 diagrams: city pipeline, AI states, sound decision, marker visibility; all 11 validated with Mermaid 10.9.1).

## 10. Tests
- **New `verify_v14.py`: 18/18** — generator, universe dressing, collision & doors & windows, line of sight & roofs, the sound table, hearing AI & responders, ballistics, stealth AI & takedowns, director spread & persistence, rosters (city & arena, 192/192 drawn), vision (80/80 profiles), map & markers & drop zone, cars, creator universe, districts, classic arena, real-time performance, all 80 heroes in the city.
- Old suites in classic mode (`?world=classic`): v13 13/13 · v12 11/11 · v11 10/10 · v10 14/14 (V09 intermittent, also on untouched v13) · fixes 20/20 · music PASS · Mermaid 11/11 · city soak (6 heroes, random play) 0 errors.
