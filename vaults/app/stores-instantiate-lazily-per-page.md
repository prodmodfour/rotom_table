Pinia stores are not all instantiated at app startup. Each store is created the first time a component calls `useXxxStore()`, so different pages have different active stores.

Observed at runtime:

- **GM encounter** (`/gm`): groupViewTabs, encounter, library, settings, encounterGrid, encounterCombat
- **GM sheets** (`/gm/sheets`): groupViewTabs, library
- **GM encounter tables** (`/gm/encounter-tables`): groupViewTabs, encounterTables, encounter
- **GM encounters list** (`/gm/encounters`): groupViewTabs, encounterLibrary
- **GM map** (`/gm/map`): groupViewTabs, groupView, encounter
- **Group view** (`/group`): groupViewTabs, groupView, encounter, fogOfWar, terrain
- **Player view** (`/player`): playerIdentity, encounter

The [[group-view-tabs-store-is-present-on-every-gm-page|groupViewTabs store appears on every GM page]], acting as a shared backbone for tab state. The player view is the only route that does not instantiate it, using [[player-identity-store-is-populated-externally|playerIdentity]] instead.
- [[encounter-store-is-largest-hub-store]] — the most widely instantiated stateful store