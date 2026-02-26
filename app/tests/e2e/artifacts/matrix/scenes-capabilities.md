---
domain: scenes
mapped_at: 2026-02-26T12:00:00Z
mapped_by: app-capability-mapper
total_capabilities: 42
files_read: 22
---

# App Capabilities: Scenes

> Re-mapped capability catalog for the scenes domain. No major changes since last mapping. Refresh for accuracy.

## Prisma Model

### scenes-C001
- **name:** Scene Prisma Model
- **type:** prisma-model
- **location:** `app/prisma/schema.prisma` — model Scene
- **game_concept:** Narrative scene with characters, Pokemon, and environment
- **description:** Scene with name, description, location (name + image URL), JSON-stored pokemon/characters/groups arrays with positions, weather, terrains (JSON array — UI deferred), modifiers (JSON array — UI deferred), habitat link (habitatId), active state flag. Timestamps.
- **inputs:** name, description, locationName, locationImage, pokemon[], characters[], groups[], weather, terrains[], modifiers[], habitatId, isActive
- **outputs:** Persisted scene record
- **accessible_from:** gm, group (display), player (read-only via WebSocket)

### scenes-C002
- **name:** GroupViewState Prisma Model
- **type:** prisma-model
- **location:** `app/prisma/schema.prisma` — model GroupViewState
- **game_concept:** Group View tab routing singleton
- **description:** Singleton tracking which tab is shown on Group View (lobby/scene/encounter/map) and the active scene ID. Updated via /api/group/tab endpoints.
- **inputs:** activeTab, activeSceneId
- **outputs:** Persisted singleton state
- **accessible_from:** gm, group

## API Endpoints

### scenes-C010
- **name:** List Scenes API
- **type:** api-endpoint
- **location:** `app/server/api/scenes/index.get.ts`
- **game_concept:** Scene library browsing
- **description:** Returns all scenes ordered by updatedAt desc.
- **inputs:** None
- **outputs:** `{ success, data: Scene[] }`
- **accessible_from:** gm

### scenes-C011
- **name:** Create Scene API
- **type:** api-endpoint
- **location:** `app/server/api/scenes/index.post.ts`
- **game_concept:** Scene creation
- **description:** Creates a new scene with name, description, location, weather, terrains, modifiers, and habitat link. JSON-stringifies array fields.
- **inputs:** Body: { name, description?, locationName?, locationImage?, weather?, terrains?, modifiers?, habitatId? }
- **outputs:** `{ success, data: Scene }`
- **accessible_from:** gm

### scenes-C012
- **name:** Get/Update/Delete Scene APIs
- **type:** api-endpoint
- **location:** `app/server/api/scenes/[id].get.ts`, `[id].put.ts`, `[id].delete.ts`
- **game_concept:** Scene CRUD
- **description:** Get returns full scene with parsed JSON fields. Update accepts partial scene data. Delete removes scene. Update broadcasts scene_update WebSocket event.
- **inputs:** URL param: id. Body (put): partial scene fields
- **outputs:** `{ success, data: Scene }` or `{ success: true }`
- **accessible_from:** gm

### scenes-C013
- **name:** Get Active Scene API
- **type:** api-endpoint
- **location:** `app/server/api/scenes/active.get.ts`
- **game_concept:** Currently served scene
- **description:** Returns the scene where isActive=true, or null if no scene is active.
- **inputs:** None
- **outputs:** `{ success, data: Scene | null }`
- **accessible_from:** gm, group, player

### scenes-C014
- **name:** Activate/Deactivate Scene APIs
- **type:** api-endpoint
- **location:** `app/server/api/scenes/[id]/activate.post.ts`, `[id]/deactivate.post.ts`
- **game_concept:** Scene serving to Group View
- **description:** Activate sets isActive=true on target scene (deactivates any other active scene), updates GroupViewState to scene tab, broadcasts scene_activated. Deactivate sets isActive=false, updates GroupViewState to lobby, broadcasts scene_deactivated.
- **inputs:** URL param: id
- **outputs:** `{ success, data: Scene }`
- **accessible_from:** gm

### scenes-C015
- **name:** Add/Remove Character from Scene APIs
- **type:** api-endpoint
- **location:** `app/server/api/scenes/[id]/characters.post.ts`, `[id]/characters/[charId].delete.ts`
- **game_concept:** Scene character management
- **description:** Add character to scene (with position, optional group assignment). Remove character from scene. Both update the JSON characters array and broadcast WebSocket events (scene_character_added, scene_character_removed).
- **inputs:** URL params: id, charId. Body (add): { characterId, position?, groupId? }
- **outputs:** `{ success, data: SceneCharacter }` or `{ success: true }`
- **accessible_from:** gm

### scenes-C016
- **name:** Add/Remove Pokemon from Scene APIs
- **type:** api-endpoint
- **location:** `app/server/api/scenes/[id]/pokemon.post.ts`, `[id]/pokemon/[pokemonId].delete.ts`
- **game_concept:** Scene Pokemon management
- **description:** Add Pokemon to scene (with position, optional group). Remove Pokemon from scene. Both update JSON pokemon array and broadcast WebSocket events (scene_pokemon_added, scene_pokemon_removed).
- **inputs:** URL params: id, pokemonId. Body (add): { pokemonId, position?, groupId? }
- **outputs:** `{ success, data: ScenePokemon }` or `{ success: true }`
- **accessible_from:** gm

### scenes-C017
- **name:** Scene Group CRUD APIs
- **type:** api-endpoint
- **location:** `app/server/api/scenes/[id]/groups.post.ts`, `[id]/groups/[groupId].put.ts`, `[id]/groups/[groupId].delete.ts`
- **game_concept:** Scene group management (entity grouping)
- **description:** Create, update, delete groups within a scene. Groups have name, position, width, height. Operations update JSON groups array and broadcast WebSocket events (scene_group_created, scene_group_updated, scene_group_deleted).
- **inputs:** URL params: id, groupId. Body: { name, position?, width?, height? }
- **outputs:** `{ success, data: SceneGroup }` or `{ success: true }`
- **accessible_from:** gm

### scenes-C018
- **name:** Batch Update Positions API
- **type:** api-endpoint
- **location:** `app/server/api/scenes/[id]/positions.put.ts`
- **game_concept:** Drag-and-drop position updates
- **description:** Batch updates positions of pokemon, characters, and groups in a single request. Lightweight alternative to full scene PUT for drag-and-drop operations.
- **inputs:** URL param: id. Body: { pokemon?: [{id, position, groupId?}], characters?: [{id, position, groupId?}], groups?: [{id, position}] }
- **outputs:** `{ success: true }`
- **accessible_from:** gm

## Store

### scenes-C020
- **name:** GroupViewTabs Store — scene CRUD actions
- **type:** store-action
- **location:** `app/stores/groupViewTabs.ts` — fetchScenes(), createScene(), updateScene(), deleteScene(), fetchScene(), fetchActiveScene()
- **game_concept:** Scene state management
- **description:** Manages scenes list and active scene in local state. All actions call corresponding API endpoints and update local arrays immutably.
- **inputs:** Scene CRUD data
- **outputs:** Updated scenes/activeScene state
- **accessible_from:** gm, group (read-only via fetchActiveScene)

### scenes-C021
- **name:** GroupViewTabs Store — activate/deactivate scene actions
- **type:** store-action
- **location:** `app/stores/groupViewTabs.ts` — activateScene(), deactivateScene()
- **game_concept:** Scene serving control
- **description:** Activates/deactivates a scene, updates local state (marks active, sets activeScene/activeSceneId), and posts BroadcastChannel messages for cross-tab sync.
- **inputs:** sceneId
- **outputs:** Updated activeScene state, BroadcastChannel notification
- **accessible_from:** gm

### scenes-C022
- **name:** GroupViewTabs Store — tab state management
- **type:** store-action
- **location:** `app/stores/groupViewTabs.ts` — fetchTabState(), setActiveTab(), handleTabChange()
- **game_concept:** Group View tab routing
- **description:** Fetches/sets active tab via /api/group/tab. handleTabChange processes WebSocket tab change events.
- **inputs:** tab: GroupViewTab, sceneId?
- **outputs:** Updated activeTab, activeSceneId state
- **accessible_from:** gm (set), group (read)

### scenes-C023
- **name:** GroupViewTabs Store — WebSocket event handlers
- **type:** store-action
- **location:** `app/stores/groupViewTabs.ts` — handleSceneUpdate(), handleSceneActivated(), handleSceneDeactivated(), handleScenePositionsUpdated(), handleSceneCharacterAdded/Removed(), handleScenePokemonAdded/Removed(), handleSceneGroupCreated/Updated/Deleted()
- **game_concept:** Real-time scene synchronization
- **description:** 10 WebSocket event handlers for scene changes. Each updates local state immutably: full scene updates, activate/deactivate, position updates (selective merge), character/pokemon add/remove, group create/update/delete. All check activeScene ID before applying.
- **inputs:** WebSocket event payloads
- **outputs:** Updated activeScene state
- **accessible_from:** gm, group, player

### scenes-C024
- **name:** GroupViewTabs Store — position updates
- **type:** store-action
- **location:** `app/stores/groupViewTabs.ts` — updatePositions()
- **game_concept:** Batch position update via store
- **description:** PUTs to /api/scenes/:id/positions with position arrays for pokemon, characters, groups.
- **inputs:** sceneId, positions object
- **outputs:** API call (no local state update — relies on WebSocket echo)
- **accessible_from:** gm

### scenes-C025
- **name:** GroupViewTabs Store — cross-tab sync
- **type:** store-action
- **location:** `app/stores/groupViewTabs.ts` — setupCrossTabSync()
- **game_concept:** Multi-tab Group View synchronization
- **description:** Sets up BroadcastChannel ('ptu-scene-sync') for cross-tab scene state synchronization. Handles scene_activated and scene_deactivated messages.
- **inputs:** None
- **outputs:** BroadcastChannel listener
- **accessible_from:** gm, group

### scenes-C026
- **name:** GroupViewTabs Store — tab getters
- **type:** store-getter
- **location:** `app/stores/groupViewTabs.ts` — isSceneTab, isEncounterTab, isMapTab, isLobbyTab, hasActiveScene
- **game_concept:** Tab state queries
- **description:** Boolean getters for current tab state and active scene presence.
- **inputs:** state
- **outputs:** boolean
- **accessible_from:** gm, group

## Components

### scenes-C030
- **name:** SceneCanvas component
- **type:** component
- **location:** `app/components/scene/SceneCanvas.vue`
- **game_concept:** Scene visual layout
- **description:** Drag-and-drop canvas for positioning characters, Pokemon, and groups within a scene. Supports background image display.
- **inputs:** Scene data with positions
- **outputs:** Position change events
- **accessible_from:** gm

### scenes-C031
- **name:** SceneAddPanel component
- **type:** component
- **location:** `app/components/scene/SceneAddPanel.vue`
- **game_concept:** Add entities to scene
- **description:** Panel for adding characters and Pokemon to the scene. Lists available entities from the library.
- **inputs:** Available characters/pokemon from library
- **outputs:** Add character/pokemon events
- **accessible_from:** gm

### scenes-C032
- **name:** SceneGroupsPanel component
- **type:** component
- **location:** `app/components/scene/SceneGroupsPanel.vue`
- **game_concept:** Scene group management
- **description:** Panel for creating, editing, and deleting groups within a scene. Groups visually contain characters/Pokemon.
- **inputs:** Scene groups data
- **outputs:** Group CRUD events
- **accessible_from:** gm

### scenes-C033
- **name:** ScenePropertiesPanel component
- **type:** component
- **location:** `app/components/scene/ScenePropertiesPanel.vue`
- **game_concept:** Scene metadata editing
- **description:** Panel for editing scene name, description, location name/image, weather condition.
- **inputs:** Scene properties
- **outputs:** Property change events
- **accessible_from:** gm

### scenes-C034
- **name:** SceneHabitatPanel component
- **type:** component
- **location:** `app/components/scene/SceneHabitatPanel.vue`
- **game_concept:** Scene habitat link for wild spawns
- **description:** Panel for linking a scene to an encounter table (habitat). Enables wild Pokemon generation within the scene context.
- **inputs:** Current habitatId, available encounter tables
- **outputs:** Habitat link change events
- **accessible_from:** gm

### scenes-C035
- **name:** ScenePokemonList component
- **type:** component
- **location:** `app/components/scene/ScenePokemonList.vue`
- **game_concept:** Pokemon in scene list
- **description:** List display of Pokemon currently in the scene.
- **inputs:** Scene pokemon data
- **outputs:** Remove/edit events
- **accessible_from:** gm

### scenes-C036
- **name:** StartEncounterModal component
- **type:** component
- **location:** `app/components/scene/StartEncounterModal.vue`
- **game_concept:** Scene-to-encounter conversion
- **description:** Modal for creating an encounter from the current scene. Converts scene characters/Pokemon into encounter combatants on appropriate sides.
- **inputs:** Scene data
- **outputs:** Creates encounter via API
- **accessible_from:** gm

## WebSocket Events

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
