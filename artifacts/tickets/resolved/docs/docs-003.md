---
id: docs-003
title: "Add CLAUDE.md for app/stores/"
priority: P0
severity: HIGH
status: resolved
domain: state-management
source: plan-descendant-claude-md-rollout
created_by: user
created_at: 2026-03-02
phase: 1
affected_files:
  - app/stores/CLAUDE.md (new)
---

# docs-003: Add CLAUDE.md for app/stores/

## Summary

Create a descendant CLAUDE.md in `app/stores/` to document the 16 Pinia stores, their scope classification, the undo/redo system, and WebSocket sync patterns. Agents frequently misunderstand which stores are encounter-scoped vs global, and the surgical WebSocket update pattern in `encounter.ts` is a common source of bugs when modified incorrectly.

## Target File

`app/stores/CLAUDE.md` (~70 lines)

## Required Content

### Store Classification Table
| Scope | Stores | Notes |
|-------|--------|-------|
| Encounter-scoped (stateful) | encounter, fogOfWar, terrain | Reset/cleared when encounter changes. fogOfWar and terrain use `Map` objects. |
| Encounter-scoped (transient) | measurement, selection, isometricCamera | Transient UI state, cleared on mode/encounter change |
| Encounter-scoped (stateless) | encounterCombat, encounterGrid, encounterXp | No state at all — pure `$fetch` wrappers (ISP pattern) |
| Global | library, settings, playerIdentity, groupView, groupViewTabs | Persist across encounters |
| Specialized | encounterLibrary, encounterTables | Domain-specific, independent of active encounter |

### Undo/Redo System
- Implemented in `useEncounterHistory` composable (NOT a store)
- Singleton pattern: lazy-initialized via `getHistory()` in encounter store
- Uses **module-level `ref` arrays** — survives store resets but NOT page reloads
- 50-snapshot max (`MAX_HISTORY_SIZE`), linear history with branch truncation
- Snapshots are full `Encounter` objects deep-cloned via `JSON.parse(JSON.stringify())`
- On undo/redo: PUTs the restored state to server, rolls back index on PUT failure
- Exposed: `canUndo`, `canRedo`, `lastActionName`, `nextActionName`

### WebSocket Sync Integration
- `encounter.updateFromWebSocket(data)`: **surgical property-by-property update** (NOT full object replacement). Iterates combatants by ID, uses `Object.assign()` for in-place entity mutation. This is deliberate — prevents full reactivity cascade.
- `groupViewTabs`: Uses `BroadcastChannel('ptu-scene-sync')` for cross-tab sync within same browser. WebSocket handles cross-device sync. Handlers: `handleTabChange`, `handleSceneUpdate`, `handleSceneActivated/Deactivated`, `handleScenePositionsUpdated`, granular entity add/remove events.
- `groupView`: Direct setters (`setWildSpawnPreview`, `setServedMap`) called from WebSocket handlers.
- Pattern: Server broadcasts → WebSocket composable receives → calls store's `handleXxx()` method → reactive state updates

### Cross-Store Dependencies
Stores do NOT import each other. Cross-store coordination happens at the component/composable level:
- `useGridInteraction` uses `selection`, `measurement`, `fogOfWar`, `terrain`
- `useGridMovement` uses `terrain`
- `VTTContainer.vue` uses `selection`, `measurement`, `fogOfWar`, `terrain`

### Gotchas
- **Map reactivity**: `fogOfWar.cellStates` and `terrain` stores use `Map<string, T>`. Vue 3 reactive wraps Maps but only tracks `.get/.set/.delete`. Do NOT spread or replace the Map.
- **`betweenTurns` is local-only**: Not persisted to server, not in undo snapshots. Tracks Priority declaration window in League battles.
- **`encounterCombat` has zero state**: Purely a namespace for combat API actions (`$fetch` calls). Designed per ISP.
- **`encounter.ts` is the largest store** (~900 lines) — main encounter state + all combat actions.
- **`settings` store is localStorage-only** — per-browser, not per-user.
- **`terrain` legacy migration**: Old `difficult`/`rough` types auto-converted to `normal` + flags on import.
- **`measurement` store auto-selects distance mode**: Cell-to-cell vs edge-to-edge based on whether `startTokenOrigin`/`endTokenOrigin` are set.

## Verification

- File is 30-80 lines
- Classification matches actual store state/action analysis
- Undo/redo description matches useEncounterHistory implementation
- WebSocket handlers verified against actual store method signatures

## Resolution Log

- **9d90a397** — Gap fix: added undo/redo API names, groupView WS setters, groupViewTabs handler names, cross-store coordination examples (58 lines)
