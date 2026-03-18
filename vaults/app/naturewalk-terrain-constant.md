The file `app/constants/naturewalk.ts` defines the Naturewalk capability (PTU p.322). Pokemon with Naturewalk treat listed terrain types as Basic Terrain, bypassing slow/rough penalties.

`NATUREWALK_TERRAINS` lists 9 terrain categories: Grassland, Forest, Wetlands, Ocean, Tundra, Mountain, Cave, Urban, Desert.

`NATUREWALK_TERRAIN_MAP` maps each PTU terrain name to the app's base terrain painter types (`normal`, `water`, `elevated`, `earth`). Multiple PTU terrains collapse to the same base types due to the terrain painter's limited palette — the mapping acknowledges this as a known limitation.

Equipment items reference Naturewalk terrains: Snow Boots grant Naturewalk (Tundra), Jungle Boots grant Naturewalk (Forest) — see [[equipment-constants-catalog]].

Per decree-003, enemy-occupied rough terrain is a game mechanic and is never bypassed by Naturewalk.
