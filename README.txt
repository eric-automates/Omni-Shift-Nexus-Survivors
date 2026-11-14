OMNI-SHIFT NEXUS SURVIVORS — 16.0 WIP GAME SNAPSHOT
Package: 16.0 WIP / GAME FILES ONLY

This is the staged 16.0 work-in-progress snapshot prepared after the locked 15.6.6 baseline. It is a local game package, NOT an approved or accepted release. Browser/device, whole-game and release gates remain open.

RUN LOCALLY
1. Keep this folder structure intact, with index.html at the package root.
2. From this folder, start a static HTTP server:
       python3 -m http.server 8000
3. Open http://localhost:8000/ in a modern browser.

WHAT IS INCLUDED
- index.html, the game's linked stylesheet, and all JavaScript files referenced by the game shell.
- CREDITS.md for attribution information.

WHAT IS EXCLUDED BY REQUEST
- Music/audio files.
- Map data/payload files, including offline real-map packs.

The game code includes map and audio-related systems, but this archive has no music payload and no offline map payload. Features that require those missing payloads will be unavailable or use whatever fallback the game supports. Online map fallback requires an internet connection and may be unavailable. This package was not validated as a merged/deployed site or on physical devices.

No QA history, development tools, revision archive, source-checksum manifest, release records, or prior-version packages are included. Do not treat this WIP archive as a signed, source-matched, or publish-approved release.
