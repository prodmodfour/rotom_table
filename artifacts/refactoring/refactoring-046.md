---
ticket_id: refactoring-046
priority: P3
status: resolved
category: EXT-DUPLICATE
source: code-review-075
created_at: 2026-02-20
created_by: orchestrator
---

## Summary

Trainer capabilities display (markup + SCSS) is duplicated between `gm/characters/[id].vue` and `HumanStatsTab.vue`. AP restore loop is duplicated between `scenes/[id]/activate.post.ts` and `scenes/[id]/deactivate.post.ts`.

## Affected Files

- `app/pages/gm/characters/[id].vue` — capabilities section
- `app/components/character/tabs/HumanStatsTab.vue` — capabilities section (duplicate)
- `app/server/api/scenes/[id]/activate.post.ts` — AP restore loop
- `app/server/api/scenes/[id]/deactivate.post.ts` — AP restore loop (duplicate)

## Suggested Refactoring

1. Extract `CapabilitiesDisplay.vue` component used by both character views
2. Extract `restoreSceneAp()` helper used by both scene endpoints

## Resolution Log

### Commit 1: `aa015c9` — Extract CapabilitiesDisplay.vue
- **New file:** `app/components/character/CapabilitiesDisplay.vue` — accepts `derivedStats: TrainerDerivedStats` prop, renders the 7-capability grid with self-contained SCSS
- **Changed:** `app/pages/gm/characters/[id].vue` — replaced 33-line capabilities markup + 40-line SCSS block with `<CapabilitiesDisplay :derived-stats="derivedStats" />`
- **Changed:** `app/components/character/tabs/HumanStatsTab.vue` — replaced 33-line capabilities markup + 40-line SCSS block with `<CapabilitiesDisplay :derived-stats="derivedStats" />`

### Commit 2: `c45c246` — Extract restoreSceneAp()
- **New file:** `app/server/services/scene.service.ts` — `restoreSceneAp(charactersJson)` parses scene characters, fetches DB records, groups by (level, drainedAp) for batched `updateMany`, runs in a transaction, returns count of restored characters
- **Changed:** `app/server/api/scenes/[id]/activate.post.ts` — replaced 45-line inline AP restore loop with `await restoreSceneAp(activeScene.characters)`
- **Changed:** `app/server/api/scenes/[id]/deactivate.post.ts` — replaced 28-line inline AP restore loop (which used individual updates) with `await restoreSceneAp(sceneData.characters)` (now uses batched transaction)

### Test status
- No existing tests broken — refactoring preserves identical behavior
- Deactivate endpoint now uses batched transaction instead of N individual updates (performance improvement)
