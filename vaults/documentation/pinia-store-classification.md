# Pinia Store Classification

16 Pinia stores in `app/stores/`, organized by scope:

| Scope | Store | Purpose |
|---|---|---|
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
| | `encounterTables` | Weighted spawn tables, modifications, generation, JSON import/export. See [[encounter-table-store]] |

The `encounterCombat` store is zero-state [[interface-segregation-principle|ISP]]: actions only, no state/getters. Each method takes `encounterId` and returns updated `Encounter`. Callers must update the encounter store themselves.

The `settings` store uses `import.meta.client` guard for SSR safety and has no server persistence.

Stores follow the [[cross-store-coordination-rule]]. The encounter store uses [[encounter-store-decomposition]] to manage its complexity.

## See also

- [[triple-view-system]]
- [[singleton-models]]
