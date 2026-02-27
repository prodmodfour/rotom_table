---
cap_id: scenes-C040
name: scenes-C040
type: —
domain: scenes
---

### scenes-C040
- **name:** scene_update / scene_activated / scene_deactivated events
- **type:** websocket-event
- **location:** `app/server/routes/ws.ts` + `app/server/utils/websocket.ts`
- **game_concept:** Scene real-time sync
- **description:** Server broadcasts scene changes to all connected clients. scene_update for content changes, scene_activated/deactivated for serving state. Also individual entity events: scene_character_added, scene_character_removed, scene_pokemon_added, scene_pokemon_removed, scene_group_created, scene_group_updated, scene_group_deleted.
- **inputs:** Scene change from API endpoint
- **outputs:** WebSocket message to gm/group/player clients
- **accessible_from:** gm, group, player

## Capability Chains

### Chain 1: Scene CRUD (GM)
`GM Scenes Page` → `ScenePropertiesPanel (C033)` → `GroupViewTabs Store (C020)` → `Scene CRUD APIs (C010-C012)` → `Prisma Scene (C001)`
- **Accessibility:** gm only (create/edit/delete)

### Chain 2: Scene Entity Management (GM)
`SceneAddPanel (C031)` / `ScenePokemonList (C035)` → `Add/Remove APIs (C015-C016)` → `Prisma Scene JSON fields` → `WebSocket (C040)` → `Store handlers (C023)`
- **Accessibility:** gm (modify), group+player (receive updates via WebSocket)

### Chain 3: Scene Group Management (GM)
`SceneGroupsPanel (C032)` → `Group CRUD APIs (C017)` → `Prisma Scene.groups JSON` → `WebSocket (C040)` → `Store handlers (C023)`
- **Accessibility:** gm (modify), group (receive updates)

### Chain 4: Scene Activation/Serving
`GM Scenes Page` → `activateScene/deactivateScene (C021)` → `Activate/Deactivate APIs (C014)` → `GroupViewState (C002)` → `WebSocket (C040)` + `BroadcastChannel (C025)`
- **Accessibility:** gm (activate/deactivate), group (display), player (receive via WebSocket)

### Chain 5: Scene Position Updates (GM)
`SceneCanvas (C030)` drag → `Store updatePositions (C024)` → `Batch Positions API (C018)` → `WebSocket` → `Store handleScenePositionsUpdated (C023)`
- **Accessibility:** gm (modify), group (receive updates)

### Chain 6: Scene-to-Encounter Conversion (GM)
`StartEncounterModal (C036)` → `/api/encounters/from-scene` → creates encounter with combatants from scene
- **Accessibility:** gm only

### Chain 7: Active Scene Display (Group View)
`Group View /group page` → `SceneView tab` → `Store fetchActiveScene (C020)` → `Active Scene API (C013)` + `WebSocket (C040)`
- **Accessibility:** group (display)

## Accessibility Summary

| Access Level | Capability IDs |
|---|---|
| **gm-only** | C010, C011, C012, C014, C015, C016, C017, C018, C024, C030, C031, C032, C033, C034, C035, C036 |
| **gm+group** | C002, C020 (read), C021, C022, C025, C026 |
| **gm+group+player** | C001 (read), C013, C023, C040 |

## Missing Subsystems

### MS-1: No player-facing scene interaction
- **subsystem:** Players can view the active scene via WebSocket sync but cannot interact with it (no drag, no add, no modify)
- **actor:** player
- **ptu_basis:** PTU scenes are GM-managed narrative tools. Players observe but don't manipulate the scene layout.
- **impact:** Low — this is working as intended for the current design. Players observe scenes through the player view.

### MS-2: Terrain and modifier UI deferred
- **subsystem:** Scene terrains and modifiers have DB storage (JSON fields) and API serialization but no UI for viewing or editing
- **actor:** gm
- **ptu_basis:** PTU terrains affect movement costs and battle mechanics. Scene-level terrain could provide context before encounter conversion.
- **impact:** Medium — terrain data is present in the model but not exposed through UI. See docs/SCENE_FUTURE_FEATURES.md for re-implementation notes.

### MS-3: No scene template/preset system
- **subsystem:** No ability to save/load scene templates for recurring locations
- **actor:** gm
- **ptu_basis:** PTU campaigns often revisit locations (towns, gyms, routes). A template system would speed up scene setup.
- **impact:** Low-medium — GM must manually recreate scenes for recurring locations.
