---
ticket_id: refactoring-029
priority: P1
categories:
  - LLM-TYPES
  - EXT-COUPLING
affected_files:
  - app/stores/groupViewTabs.ts
  - app/types/index.ts
estimated_scope: small
status: resolved
created_at: 2026-02-18T12:00:00
---

## Summary

`groupViewTabs.ts` defines 7 Scene-related interfaces (60 lines) directly in the store file instead of in `app/types/`. Other files that need Scene types must import from the store, creating unnecessary coupling. This violates ISP — callers depend on the entire store module to access type definitions.

## Findings

### Finding 1: LLM-TYPES — Types in wrong location
- **Metric:** 7 interfaces defined in store file (ScenePosition, ScenePokemon, SceneCharacter, SceneGroup, SceneModifier, Scene, GroupViewTab)
- **Threshold:** Types should live in `app/types/` per project conventions
- **Impact:** LLM agents looking for Scene types won't find them in the types directory. Imports from the store trigger store initialization code just to access type definitions.
- **Evidence:** groupViewTabs.ts lines 1-65 — 7 exported interfaces/types

### Finding 2: EXT-COUPLING (ISP violation)
- **Metric:** Store exports types that other parts of the app depend on for Scene operations
- **Threshold:** Callers forced to depend on modules they don't fully use
- **Impact:** Any file that needs `Scene` type must import from a Pinia store, creating a transitive dependency on Pinia infrastructure
- **Evidence:** The `Scene` interface (lines 43-59) is used by scene components, scene API endpoints, and other stores

## Suggested Refactoring

1. Move all 7 interfaces to `app/types/scene.ts` (or add to existing `app/types/index.ts`)
2. Update `groupViewTabs.ts` to import from `~/types`
3. Update all consumers to import from `~/types` instead of the store
4. Verify no circular dependencies introduced

Estimated commits: 1-2

## Related Lessons
- none

## Resolution Log
- Commits: `29dbefd` — refactor: move Scene types from groupViewTabs store to types/scene.ts
- Files changed: `app/stores/groupViewTabs.ts`, `app/types/index.ts`, `app/layouts/gm.vue`, `app/pages/gm/scenes/[id].vue`, `app/pages/gm/scenes/index.vue`, `app/pages/group/_components/SceneView.vue`, `app/components/scene/SceneCanvas.vue`, `app/components/scene/SceneGroupsPanel.vue`, `app/components/scene/ScenePropertiesPanel.vue`
- New files created: `app/types/scene.ts`
- Tests passing: 508/508 unit tests pass (Vitest). Typecheck shows only pre-existing errors unrelated to this change.
