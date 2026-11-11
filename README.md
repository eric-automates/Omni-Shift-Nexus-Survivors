# Omni-Shift Nexus Survivors — current game snapshot

**Game revision:** 15.6.6-LOCKED  
**Series lock:** 15.6-SERIES-LOCKED at 92%  
**Source commit:** `aa5f7ee29c4eb71afe58be400be680f7a4ee9d9a`

This is a static HTML5/JavaScript game. There is no compilation step and no QA folder is needed to run it.

## Run the game

Keep `index.html` at the project root with the `css/` and `js/` folders beside it. For a local test, start any static web server in this directory, for example:

```sh
python3 -m http.server 8000
```

Then open `http://localhost:8000/`. GitHub Pages can serve the same files as a static site.

## Project folders

- `index.html` — game shell, styles/scripts, feature help, and cache-busted script loader.
- `css/` — game styling.
- `js/` — game engine, generated-world/map code, optional careers, dispatch, save and UI systems. Keep the entire folder together.
- `tools/` — optional offline real-map pack builder; it is not needed during ordinary gameplay when your map packs already exist.
- `data/realmap/` — **not included in this snapshot**; preserve your existing map packs if present.
- `music/` — **not included in this snapshot**; preserve your existing music folder and its license/credit files.

The real-map decoder/generator code in `js/` is included. Only map data payloads are left out. If you do not already have `data/realmap/`, the built-in offline Indiana map may be unavailable; use the game's other available map modes or restore the pack separately.

## EMT file check

The current game requires `js/jobemt.js`; `index.html` loads it with the `15.6.6-locked` cache key, and the J05 EMT offer is enabled in this revision. If the interface says EMT is missing, confirm that `js/jobemt.js` was copied to that exact path, `index.html` is at the site root, the host path/case matches, and then hard-reload or clear the site's cached files. The previous *delta* update package did not include this unchanged J05 file; this full snapshot does.

See `CURRENT_REVISION.md` for the lock and acceptance summary, and `flowchart.md` for a current architecture overview. `CREDITS.md` contains third-party attribution notes; keep it with the project.
