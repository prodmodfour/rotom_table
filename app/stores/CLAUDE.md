# Stores CLAUDE.md

Context for working with the 16 Pinia stores in `app/stores/`.

## Store Classification

| Scope | Store | Purpose |
|-------|-------|---------|
| **Encounter — stateful** | `encounter` | Core encounter state, combatant CRUD, turn management, undo/redo |
| | `fogOfWar` | 3-state fog (hidden/revealed/explored) via `Map<string, FogState>` |
| | `terrain` | Terrain cells with base type + flags via `Map<string, TerrainCell>` |
| **Encounter — transient** | `measurement` | Distance/burst/cone/line/blast AoE measurement, no persistence |
| | `selection` | Multi-select tokens via `Set<string>`, marquee selection |
| | `isometricCamera` | Camera angle (0-3), zoom, rotation animation state |
| **Encounter — stateless (ISP)** | `encounterCombat` | API-only: status conditions, stages, injuries, breather/sprint/pass |
| | `encounterGrid` | API-only: position, grid config, background upload, fog load/save |
| | `encounterXp` | API-only: XP calculation, Pokemon XP distribution, trainer XP distribution |
| **Global** | `library` | Characters + Pokemon CRUD, filtering, sorting |
| | `settings` | Damage mode, grid defaults — localStorage only, no server |
| | `playerIdentity` | Player view identity (characterId, character data, owned Pokemon) |
| | `groupView` | Wild spawn preview, served map state |
| | `groupViewTabs` | Group tab state, scene CRUD, BroadcastChannel cross-tab sync |
| **Specialized** | `encounterLibrary` | Encounter template CRUD, filtering, categories/tags |
| | `encounterTables` | Weighted spawn tables, modifications, generation, JSON import/export |

## Undo/Redo System

- Implemented via `useEncounterHistory` composable (`composables/useEncounterHistory.ts`)
- **Singleton pattern**: module-level `ref` arrays (`history`, `currentIndex`) shared across all callers
- Max 50 snapshots (`MAX_HISTORY_SIZE`), deep-cloned via `JSON.parse(JSON.stringify())`
- Encounter store accesses history via `getHistory()` exported from `useEncounterUndoRedo`
- Restore flow: undo/redo retrieves a snapshot, PUTs the full encounter to server, updates local state
- On PUT failure: rollback by calling `history.redo()` (for failed undo) or `history.undo()` (for failed redo)
- Exposed API: `canUndo`, `canRedo`, `lastActionName`, `nextActionName`

## WebSocket Sync

- **Encounter store** `updateFromWebSocket()`: surgical property-by-property update to avoid full reactivity cascade. Updates top-level fields individually, then iterates combatants by ID to patch in-place.
- **GroupViewTabs store**: BroadcastChannel (`ptu-scene-sync`) for cross-tab sync. Handlers: `handleTabChange`, `handleSceneUpdate`, `handleSceneActivated/Deactivated`, `handleScenePositionsUpdated`, granular entity add/remove events.
- **GroupView store**: Direct setters `setWildSpawnPreview()`, `setServedMap()` called from WebSocket handlers.
- **Flow**: Server broadcasts WS event -> WS composable receives -> calls store handler method

## Cross-Store Rules

Stores never import each other. All coordination happens at the component or composable level:
- `useGridInteraction` uses `selection`, `measurement`, `fogOfWar`, `terrain` stores
- `useGridMovement` uses `terrain` store for movement cost lookups
- `VTTContainer.vue` uses `selection`, `measurement`, `fogOfWar`, `terrain` stores directly

## Gotchas

- **Map reactivity**: `fogOfWar` and `terrain` use `Map<string, T>` for cell state. Vue tracks the Map reference but not individual entries — mutations via `.set()/.delete()` work because Pinia's reactive proxy intercepts them, but replacing the entire Map (e.g., `importState`) triggers full re-render.
- **`betweenTurns` is local-only**: Declared on encounter state but not persisted to server or synced via WebSocket. Resets on page reload.
- **`encounterCombat` is zero-state ISP**: Actions only, no state/getters. Each method takes `encounterId` and returns updated `Encounter`. Callers must update the encounter store themselves.
- **`encounter.ts` decomposition**: The encounter store delegates to 5 composables via `_buildContext()` pattern: `useEncounterCombatActions` (turn/damage/heal/items), `useEncounterUndoRedo` (snapshot/undo/redo), `useEncounterSwitching` (switch/recall/release), `useEncounterOutOfTurn` (AoO/hold/priority/interrupt/intercept/disengage), `useEncounterMounts` (mount/dismount/rider features). CRUD, serve/unserve, websocket, weather, wild spawn, significance, vision, and environment preset remain inline.
- **`settings` is localStorage-only**: No server persistence. Uses `import.meta.client` guard for SSR safety.
- **Terrain legacy migration**: `migrateLegacyCell()` converts old `difficult`/`rough` terrain types to `normal` + flags (`slow`/`rough`). Import always runs migration. Runtime `setTerrain()` also converts legacy types.
- **Measurement AoE modes**: Measurement store provides distance/burst/cone/line/close-blast modes. Components wire move range types to the appropriate mode. The store itself has no auto-select — the caller (VTT interaction composable) sets the mode.
