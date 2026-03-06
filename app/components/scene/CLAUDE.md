# Scene Components CLAUDE.md

8 components for the narrative scene system (GM-side scene editor + group view display).

## Component Inventory

| Component | Lines | Purpose |
|-----------|-------|---------|
| `SceneCanvas.vue` | 481 | Main drag-and-drop canvas — positions character avatars and Pokemon sprites via percentage-based layout |
| `SceneAddPanel.vue` | 333 | Right sidebar to add characters and Pokemon to a scene (tabs: Characters, Pokemon) |
| `ScenePropertiesPanel.vue` | 175 | Right sidebar for location name, background URL, description, weather |
| `SceneGroupsPanel.vue` | 188 | Left sidebar for creating/managing named entity groups with resize handles |
| `SceneHabitatPanel.vue` | 316 | Right sidebar linking scene to encounter table for random Pokemon generation |
| `ScenePokemonList.vue` | 214 | Sub-component of SceneAddPanel: expandable per-character Pokemon lists |
| `StartEncounterModal.vue` | 238 | Modal for scene-to-encounter conversion (battle type + significance tier selection) |
| `QuestXpDialog.vue` | 212 | Inline dialog for awarding trainer XP to all characters in a scene |

## Scene-to-Encounter Conversion Flow

1. User clicks "Start Encounter" on the scene editor page
2. `StartEncounterModal.vue` opens -- shows entity counts, encounter budget difficulty, lets GM choose battle type (Full Contact / Trainer League) and significance tier (scales XP per PTU Core p.460)
3. Modal emits `confirm` with `{ battleType, significanceMultiplier, significanceTier }`
4. Client calls `POST /api/encounters/from-scene` with `sceneId` + modal options
5. Server creates Encounter: scene Pokemon become wild enemy combatants via `generateAndCreatePokemon()` + `buildPokemonCombatant()`, scene characters become player combatants, auto-placed on grid

## Deferred Features (Feb 2026)

Two features were removed from the scene UI -- DB columns and types still exist:

- **Terrain** -- Scene-level terrain conditions (grassy, electric, psychic, misty). DB column `Scene.terrains` intact. Type `terrains: string[]` in `types/scene.ts`. Distinct from VTT grid terrain painter.
- **Modifiers** -- Custom scene-wide modifiers. DB column `Scene.modifiers` intact. Type `SceneModifier` in `types/scene.ts`.

Reference: `docs/SCENE_FUTURE_FEATURES.md`

## GroupViewState Interaction

- Scene is one of 4 group view tabs: `lobby | scene | encounter | map`
- GM activates scene via `POST /api/scenes/[id]/activate` -- BroadcastChannel notifies Group tab
- WebSocket events: `scene_activated`, `scene_deactivated`, `scene_update`, `scene_positions_updated`, `scene_sync`, `scene_request`, plus granular entity add/remove events
- `SceneSyncPayload` (in `types/player-sync.ts`): stripped-down scene data pushed to players (excludes terrains/modifiers)
- Store: `groupViewTabs` manages tab state + scene data
