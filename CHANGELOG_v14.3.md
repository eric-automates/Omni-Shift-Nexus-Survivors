# OMNI-SHIFT: NEXUS SURVIVORS — v14.3 (2026-11-01)

Base: v14.2 (GitHub `main`). A corrections patch, as you asked: the real maps at the right size, buildings that are what
they really are, traffic that drives, police like the old *Driver* games, a touch-first ACTION button, guns that look
and sound like guns, a weapon light, and two-gun heroes whose hands finally aim on their own. Everything stays a static
GitHub Pages site — same folders, no installs. Six new modules: `js/traffic.js`, `js/police.js`, `js/actionui.js`,
`js/gunart.js`, `js/gunaudio.js`, `js/dualaim.js`.

> **Upload note:** the live site still has no `data/realmap/` folder. That is why the game said it couldn't find the
> Indiana maps (and quietly streamed the map from the internet instead). `UPLOAD_v14.3.md` shows how to get that
> folder onto GitHub with the web uploader.

---

## ★ Dual wield — each hand picks its own target (`js/dualaim.js`)
- With a separate weapon in each hand (twin pistols, two different guns, a four-armed hero), the hands are no longer
  locked to one aim line. **Each hand swings to its own target and fires at it.** Hand one takes the nearest threat,
  hand two the next one nobody is covering, and so on.
- Both hands only **team up on one target when it's close** (inside about 3.5 m) or when it's the only one around.
  With no target, the guns go back to the normal aim and low ready.
- The hands turn at slightly different speeds, so you can see them split apart and come back together. There is no
  front-arc limit; a hand can cover your back. Swords and sabers still follow the saber Form engine.

## A. Map loading
- **"Couldn't find the Indiana maps":** the built-in packs (`data/realmap/`, 28 files) were never uploaded to GitHub,
  so every request got a 404. With internet, the game falls back to the same OpenFreeMap tiles, which is why you still
  got a real map. The menu and banner now explain this in plain words ("the Indiana map files aren't installed next to
  the game"). Once the folder is uploaded, the maps load offline.
- **The Beech Grove map you didn't pick:** on phones the city chips are rebuilt as soon as you tap, and the browser's
  delayed "ghost" click then landed on whatever chip had moved under your finger. Every choice in the Location menu now
  reacts to a real tap only (a drag or a ghost click does nothing). The choice is confirmed on screen
  ("📍 Beech Grove selected"), and the selected chip is clearly marked.

## B. Map scale — real maps are now 1:3, and it's adjustable
- Roads were about 3× too big for a person. Real maps now default to **1:3**: roads, buildings, blocks, parking lots and
  cars all shrink together, so a street is street-sized next to your hero. **Location → 📏 Map scale** offers 1:3 (the
  default), 1:2 and 1:1, so it can be made bigger later without touching code.
- The whole game follows the scale:
  - Vehicles: size, handling, crashes and damage are scaled, and the speedometer shows **real-equivalent speed** (a
    sedan tops out around 110 mph).
  - Also scaled: flight, capsules, airfields, headlights, NPC traffic and the police.
  - The minimap scale bar, markers, the map readout and the fuel finder show **real distances** (300 m on a 1:3 map is
    300 real metres).
  - Small homes get real floor plans at the smaller size: a studio; living room + bedroom; or living room + kitchen +
    bedroom. Furniture is half-size and walls are one cell thick. Garages and sheds too small to enter become solid
    outbuildings.
- Streaming was reworked for the denser map: road look-ups use a spatial grid and the worst frame hitch dropped from
  ≈ 300 ms to under 90 ms.
- Your old saved drops and caches stay valid at 1:1; the other scales keep their own.

## C. Buildings are what they are
- A building only becomes a restaurant, shop, school and so on when the map data actually says so: a named place, or
  a tagged building. Everything else in a residential area is a house (or an apartment block or garage when its size
  and shape say so). In the Beech Grove check, 6,710 of 7,762 buildings are houses, and McDonald's is a diner.

## D. NPC traffic (`js/traffic.js`)
- Cars drive the real roads (or the Nexus street grid) on the right-hand side. They keep a safe gap, stop and go, take
  smooth turns with their indicators, and show brake lights and headlights at night.
- **Traffic signals** at real junctions run a realistic **56-second cycle**:
  - Main road: 26 s green, 3.5 s amber.
  - Side road: 20 s green, 3.5 s amber.
  - An all-red gap before each change.
  - The lights are offset along the main road at 35 mph (a **green wave**), so traffic at the limit meets green after
    green.
- **Stop signs** mean a full stop, then go when the junction is clear (an all-way stop when the roads are equal). At
  unmarked corners side roads give way, and nobody blocks the box.
- Drivers brake for you, the townsfolk and anyone else in the road. They honk, and after a moment they ease around
  someone standing in the road.
- Hit, shoot or blow up a traffic car and it becomes a full physics vehicle (it crumples, burns and can be driven).
- About 6 % of the traffic is police cruisers. There is no traffic in the post-apocalypse. You can switch traffic off
  in Options (🚗 City Traffic).

## E. Police (`js/police.js`)
- **What gets attention:** speeding on a road (10+ mph over the limit, or 20 % over on fast roads), running a red
  light, or hitting something — but only if a cop sees it. That means a cruiser in traffic with a line of sight, or an
  officer on foot. Careful driving off the road draws nobody.
- A **speed-limit sign** sits next to the speedometer and turns red when you're well over.
- **The stop:**
  1. The cruiser lights up and follows your path.
  2. Stop the car and it pulls in behind you.
  3. The officer walks up to your window and you talk, using big touch buttons: "Sorry, officer" / "Hand over your
     license" / "I'm in a hurry" / "Floor it". Politeness can earn a warning for a small offense.
  4. The ticket is **paid automatically**, and a bank-style **watch notification** slides in, for example
     "🏦 BANK · Marion County Clerk · −$275 · Speeding 60 in a 30". It vibrates on phones.
- **Can't pay:** "You couldn't afford the $275 ticket. You spent the night in jail." The screen fades, and you walk out
  of the nearest police station at **7:00 the next morning**. The car is impounded and the heat is cleared.
- **Drive off** and it's a chase ("EVADING POLICE"). In the economy scenario this raises your wanted level. Lose them
  and they give up.
- You can switch the police off in Options (🚔 Traffic Police).

## F. The ACTION button (`js/actionui.js`)
- One **big button on the right**, at the thumb that isn't steering (on the left with the left-handed HUD). It is
  never wider than about half the screen and shows an icon with plain words: 🪜 CLIMB DOWN, 🚗 DRIVE CAR, 🔍 SEARCH, 🛒 SHOP, 🚪 EXIT VEHICLE…
- It works **while you move** (tap with your second thumb), and it is **sticky**: when a prompt would vanish because
  you stopped or stepped past, it stays for a few seconds and still works.
- **Roofs:** there is always **⬇ GET DOWN** while you're on one. It takes the nearest ladder, or you climb down the
  nearest edge, so nobody gets stuck up there again. Double-tapping to jump off still works.
- Getting out of a **moving** car is a short hold (the button says HOLD), so a slipping thumb never bails you out at
  60 mph.
- **Fixed:** on a roof, a shop counter, terminal or drawer in the rooms *below* could take over the button. That is what
  made CLIMB DOWN vanish when you stood still. On a roof the button now only offers ways down.
- Heroes who can fly on their own get a **🚀** button. It used to be the G key only (except for the Ki-Surge class).

## G. Touch-first
- On touch screens the key hints are gone: "[F]", "press F", "<b>Shift</b> to sneak", "<b>M</b> map", "Space
  handbrake", "[V]"… now say what to tap (✋, 🥷, 🗺, − +, HB, 📯, 🔇). This covers tips, toasts, the help screen,
  the status line and the world marker over a target.
- Every action has a touch control: ACTION, GET DOWN, 🚀 fly, 🔦 light, 🥷 sneak, 🔇 suppressor, 🗺 map, − + zoom,
  🎒 bag, HB, 📯 and the flight buttons.

## H. Suppressors & gunshots (`js/gunart.js`, `js/gunaudio.js`)
- **The suppressor is visible:** a can lengthens the front of the gun. Each gun has its own (long and slim on the P90,
  fat on Vera, short on the pistols, a pair on the Uzis), and it screws on and off with a small animation and clicks.
- **Suppressed:** a dull but clearly audible "thup" plus the action cycling (and a faint supersonic snap from rifles).
  It is quieter, but not silent and not the movie "pfft".
- **Unsuppressed:** a real crack, thump and mechanism for each class (pistol, SMG, rifle, magnum/revolver, shotgun,
  machine gun), plus a **small echo** off the surroundings:
  - a quick slap between buildings,
  - a longer, softer one in the open,
  - a short ring in a room.

  Rifles and big guns echo more than pistols. When many shots overlap, the echoes thin out and are capped, so a
  firefight never turns into a wash of reverb.
- Fixed: the Lucifer super shotgun played the Force-lightning sound, and the P90 played a laser "pew".

## I. Guns look like guns
- All 27 firearm, blaster and gun-device models were redrawn as real silhouettes (P90 bullpup, 1911, Navy revolver,
  MA5B, Morita, Vera, M60, Smartgun, Uzi, shotguns, E-11, DL-44, EE-3, IB-94, phaser, plasma and laser rifles, gravity
  gun, arm cannon…) in matte metal, polymer and wood. **No glowing emitters or orbs**, including the tiny orb on Jack
  O'Neill's P90. A level-10 weapon gets a quiet brass line instead of a bright gold bar.

## J. Weapon light
- **At night** a **🔦** button (or the L key) turns on a flashlight under the barrel. It throws a cone of light where you
  aim and walls stop it, so you see further that way. It also makes you easier to spot (×1.5).

## Also fixed / added
- The HUD crashed in places with no district name (it now reads "Open Country"). This bug is also in v14.2.
- The jail time-skip advances the day counter and the darkness.
- A quick double tap on the ACTION button could be ignored after starting a new run; the tap guard now uses a real clock.
- Traffic: a car turning at a junction now waits for a person standing on the corner, honks, then creeps past at walking
  pace. Before, it could sit in the middle of the junction for good and lock every other car out.
- Police: a cruiser that can't line up neatly behind you (a tight spot or a curve) stops where it is after a few
  seconds, and the officer walks up from there. If the cruiser was lost in a crash, the officer walks up on foot.
- New QA pack `qa/packs/v143.py` (21 tests, including two for dual wield). The regression suite, static checks and the
  phone-size perf probe all pass. See `V14_3_SUMMARY.md`.
