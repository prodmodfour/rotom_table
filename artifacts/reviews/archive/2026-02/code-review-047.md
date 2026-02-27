---
review_id: code-review-047
review_type: code
reviewer: senior-reviewer
trigger: refactoring
target_report: refactoring-029
domain: types
commits_reviewed:
  - 29dbefd
files_reviewed:
  - app/types/scene.ts
  - app/types/index.ts
  - app/stores/groupViewTabs.ts
  - app/components/scene/SceneCanvas.vue
  - app/components/scene/SceneGroupsPanel.vue
  - app/components/scene/ScenePropertiesPanel.vue
  - app/layouts/gm.vue
  - app/pages/gm/scenes/[id].vue
  - app/pages/gm/scenes/index.vue
  - app/pages/group/_components/SceneView.vue
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
scenarios_to_rerun: []
reviewed_at: 2026-02-19T23:00:00
---

## Review Scope

Single-commit type extraction: move 7 Scene-related interfaces (60 lines) from `stores/groupViewTabs.ts` to a new `types/scene.ts`, update all consumers, re-export from barrel file. Pure structural refactoring — no logic changes.

## Status Table

| Task | Status |
|------|--------|
| Create `types/scene.ts` with all 7 types | Verified |
| Remove type definitions from store | Verified |
| Store imports from new location | Verified |
| All 7 consumers updated | Verified |
| Barrel re-export added | Verified |
| No remaining store imports for types | Verified |

## Verification Performed

1. **Type fidelity:** Diffed the 60 lines in `types/scene.ts` against the removed block in `groupViewTabs.ts` — byte-for-byte identical. All 7 types: `GroupViewTab`, `ScenePosition`, `ScenePokemon`, `SceneCharacter`, `SceneGroup`, `SceneModifier`, `Scene`.

2. **Consumer completeness:** Grepped for `from '~/stores/groupViewTabs'` and `from '.*groupViewTabs'` across all `.ts`/`.vue` files — zero matches. Every consumer now imports from `~/types/scene`.

3. **Store correctness:** `groupViewTabs.ts` imports all 7 types from `~/types/scene` via `import type { ... }`. Store still uses the types in its state, actions, and handler signatures — no type errors.

4. **Barrel file:** `types/index.ts` re-exports `./scene` in the correct position (after `species`, before `guards`). Comment is appropriate.

5. **No circular dependencies:** `types/scene.ts` has zero imports — pure type definitions with no dependency on any module.

6. **Server-side isolation:** Server code defines its own local interfaces (e.g., `ScenePokemonEntry` in `from-scene.post.ts`) or uses `unknown` for WebSocket payloads. No server file imported from the store. No impact.

7. **No behavioral changes:** The diff is exclusively import path changes and type relocation. No logic, no state, no rendering changes.

## Issues

None.

## What Looks Good

- Textbook ISP fix — types decoupled from store infrastructure. Consumers no longer pull in Pinia just for type definitions.
- Commit message is clear and explains the "why" (decouple type definitions from store).
- Resolution log in the ticket is thorough — lists all changed files, commit hash, and test results (508/508 Vitest).
- Single commit for a single logical change — correct granularity.

## Verdict

APPROVED — Clean type extraction with complete consumer migration. No scenarios need re-running (pure type-level change, no runtime behavior affected).
