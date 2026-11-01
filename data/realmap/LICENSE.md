# Offline map data — licence & attribution

These files (`index.json`, `overview.bin`, `cNN.bin`, `pNN.bin`) are the built-in real maps of Omni-Shift: Indianapolis, Carmel, Fishers, Noblesville, Gary, Greenwood, Kokomo, Westfield, Lebanon, Beech Grove, Brazil, Sheridan, Thorntown, Clay City — 48 km across each.
Each `.bin` is a gzip pack of OpenMapTiles-schema vector tiles (`overview.bin`: zoom 10; `cNN`: the middle of each place, zoom 14; `pNN`: the rest, zoom 14), filtered to what the game draws.

**OpenFreeMap © OpenMapTiles · Data from OpenStreetMap (© OpenStreetMap contributors, ODbL)**

- Map data © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright), available under the [Open Database License (ODbL) 1.0](https://opendatacommons.org/licenses/odbl/1-0/).
  These packs are a derived database of OpenStreetMap and are offered under the same licence: you may copy, share and adapt them as long as you credit OpenStreetMap and keep any adapted version open under the ODbL.
- Vector tile schema © [OpenMapTiles](https://openmaptiles.org/) (CC-BY 4.0); tiles served by [OpenFreeMap](https://openfreemap.org/).
- Where OpenStreetMap has no buildings yet (most small towns), the houses are [Microsoft US Building Footprints](https://github.com/microsoft/USBuildingFootprints) © Microsoft, also under the ODbL 1.0 — computer-traced from aerial imagery, so a few may be missing, out of date or slightly off. Those features carry `src=ms`.
- City list and coordinates: [GeoNames](https://www.geonames.org/) (CC-BY 4.0), populations from the 2020 US census (GeoNames estimates for the smallest towns).

Tiles version `20261025_080012_pt` · packed 2026-11-01 · 26 packs.
Rebuild or refresh with `node tools/realmap-build.js download <cache>`, `footprints <cache>`, then `pack <cache> <out>` (see the tool's header).

Real places, streets and businesses appear in the game only because they are on the map; none of them is affiliated with or endorses the game.
