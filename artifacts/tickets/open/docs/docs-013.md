---
id: docs-013
title: "Add CLAUDE.md for app/components/scene/"
priority: P0
severity: MEDIUM
status: open
domain: scenes
source: plan-descendant-claude-md-rollout
created_by: user
created_at: 2026-03-02
phase: 3
affected_files:
  - app/components/scene/CLAUDE.md (new)
---

# docs-013: Add CLAUDE.md for app/components/scene/

## Summary

Create a descendant CLAUDE.md in `app/components/scene/` to document the 8 scene components, the scene-to-encounter conversion flow, deferred features, and GroupViewState interaction. The conversion flow involves 5 steps across client and server, and the deferred terrain/modifier features are a common source of confusion (DB columns exist but UI was removed).

## Target File

`app/components/scene/CLAUDE.md` (~40 lines)

## Required Content

### Component Inventory (8 files)
| Component | Purpose |
|-----------|---------|
| `SceneCanvas.vue` (482 lines) | Main drag-and-drop canvas for positioning character avatars and Pokemon sprites |
| `SceneAddPanel.vue` (334 lines) | Right sidebar to add characters and Pokemon to a scene (tabs: Characters, Pokemon) |
| `ScenePropertiesPanel.vue` (166 lines) | Right sidebar for location name, background URL, description, weather |
| `SceneGroupsPanel.vue` (189 lines) | Left sidebar for creating/managing named entity groups |
| `SceneHabitatPanel.vue` (317 lines) | Right sidebar linking scene to encounter table for random Pokemon generation |
| `ScenePokemonList.vue` (215 lines) | Sub-component of SceneAddPanel: expandable per-character Pokemon lists |
| `StartEncounterModal.vue` (239 lines) | Modal for scene-to-encounter conversion (battle type, significance tier) |
| `QuestXpDialog.vue` (213 lines) | Inline dialog for awarding trainer XP to all characters in a scene |

### Scene-to-Encounter Conversion Flow
1. **User clicks "Start Encounter"** on the scene editor page
2. **`StartEncounterModal.vue` opens** — shows entity counts, encounter budget, lets GM choose:
   - Battle type: "Full Contact" (all in speed order) or "Trainer (League)" (declaration phases)
   - Significance tier: scales XP per PTU Core p.460 (uses `SIGNIFICANCE_PRESETS`)
3. **Modal emits `confirm`** with `{ battleType, significanceMultiplier, significanceTier }`
4. **Client calls `POST /api/encounters/from-scene`** with `sceneId` + modal options
5. **Server-side processing:**
   - Fetches Scene from DB
   - Creates Encounter record with scene weather + chosen battle type
   - Scene Pokemon → wild enemies: `generateAndCreatePokemon()` + `buildPokemonCombatant()` (origin: 'wild')
   - Scene characters → player combatants: `buildHumanEntityFromRecord()` + `buildCombatantFromEntity()` (side: 'players')
   - Auto-places all combatants via `findPlacementPosition()` (enemies one side, players the other)
   - Returns full encounter response → client navigates to encounter view

### Deferred Features (Feb 2026)
Two features were removed from the scene UI for future re-implementation:

1. **Terrain** — Scene-level terrain conditions (grassy, electric, psychic, misty). DB column `Scene.terrains` (JSON string) still exists. Type `terrains: string[]` in `types/scene.ts` still defined. **Distinct from VTT grid terrain painter.**

2. **Modifiers** — Custom scene-wide modifiers (name, description, effect). DB column `Scene.modifiers` (JSON string) still exists. Type `SceneModifier` interface in `types/scene.ts` still defined.

Reference doc: `docs/SCENE_FUTURE_FEATURES.md` has data shapes, previous UI locations, and re-implementation notes.

### GroupViewState Interaction
- Scene is one of 4 group view tabs: `'lobby' | 'scene' | 'encounter' | 'map'`
- GM sets active scene → `POST /api/scenes/[id]/activate` → BroadcastChannel notifies Group tab
- WebSocket events: `scene_activated`, `scene_deactivated`, `scene_update`, `scene_positions_updated`, `scene_sync`, `scene_request`, granular entity add/remove events
- `SceneSyncPayload` (in `types/player-sync.ts`): stripped-down scene data pushed to players, excluding terrains and modifiers
- Store: `groupViewTabs` manages tab state + scene data

## Verification

- File is 30-80 lines
- Component count matches actual directory listing (8 .vue files)
- Conversion flow verified against StartEncounterModal.vue and from-scene.post.ts endpoint
- Deferred features documented in docs/SCENE_FUTURE_FEATURES.md
