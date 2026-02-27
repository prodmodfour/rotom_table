---
review_id: code-review-175
review_type: code
reviewer: senior-reviewer
trigger: refactoring
target_report: refactoring-080
domain: vtt
commits_reviewed:
  - 7778958
  - 5b6ea5c
  - cd7d3e9
  - 666b17b
files_reviewed:
  - app/utils/gridDistance.ts (new)
  - app/composables/useGridMovement.ts
  - app/composables/usePathfinding.ts
  - app/stores/measurement.ts
  - app/components/player/PlayerGridView.vue
  - app/components/vtt/VTTContainer.vue
  - app/composables/useCanvasRendering.ts
  - app/constants/equipment.ts
  - app/components/character/tabs/HumanEquipmentTab.vue
  - app/components/character/EquipmentCatalogBrowser.vue
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 1
reviewed_at: 2026-02-26T08:40:00Z
follows_up: null
---

## Review Scope

Two refactoring tickets addressed in this batch:

**refactoring-080 (P4 EXT-DUPLICATE):** The PTU alternating diagonal distance formula (`diagonals + floor(diagonals / 2) + straights`) was inlined in 7 locations. Fix: created `utils/gridDistance.ts` with a shared `ptuDiagonalDistance(dx, dy)` pure function, all 7 inline implementations now delegate to it.

**refactoring-069 (P4 EXT-DUPLICATE):** `SLOT_ICONS` (equipment slot to Phosphor icon component mapping) was duplicated in `HumanEquipmentTab.vue` and `EquipmentCatalogBrowser.vue`. Fix: extracted to `constants/equipment.ts` alongside existing `SLOT_LABELS` and `STAT_LABELS`.

4 commits (1 utility creation, 2 formula replacement passes, 1 SLOT_ICONS extraction). Net: +37 / -62 = -25 lines.

## Issues

### MEDIUM

**M1: `app-surface.md` not updated with new `utils/gridDistance.ts` utility.**

Line 141 lists "VTT Grid utilities: `utils/combatantCapabilities.ts`..." but does not include `gridDistance.ts`. The new file is a shared utility consumed by 6 files across composables, stores, and components. It should be documented in the surface.

## What Looks Good

1. **Formula correctness verified.** The `ptuDiagonalDistance` function implements the standard PTU alternating diagonal rule: `diagonals + floor(diagonals / 2) + straights`. This is the same closed-form formula that was inlined in all 7 locations. Spot-checked: for (3, 4), diagonals=3, straights=1, cost = 3 + 1 + 1 = 5 -- correct per PTU.

2. **Complete deduplication.** Grep confirms zero remaining inline implementations of the diagonal formula. All 7 callsites (useGridMovement, usePathfinding x2, measurement store, PlayerGridView, VTTContainer, useCanvasRendering) now import from the shared utility.

3. **Pure function, no dependencies.** `ptuDiagonalDistance` takes two numbers, returns a number. No refs, no side effects, trivially testable. Handles negative inputs via `Math.abs()` -- defensive and correct.

4. **SLOT_ICONS extraction is clean.** Both consumers (`HumanEquipmentTab.vue`, `EquipmentCatalogBrowser.vue`) now import from `constants/equipment.ts`. No local duplicates remain. The constant lives alongside `SLOT_LABELS` and `STAT_LABELS` which is the natural home for it.

5. **Phosphor icon imports centralized.** The 6 slot icon imports (`PhBaseballCap`, `PhTShirt`, etc.) are now in one location instead of two. Both consumers previously had identical import lists for these icons.

6. **Good commit granularity.** Utility creation in commit 1, first consumer replacement in commit 2, remaining 5 consumers in commit 3, SLOT_ICONS in commit 4. The split between commits 2 and 3 (1 file vs 5 files) could have been more even, but the logical grouping (useGridMovement first as the primary consumer, then the rest) is reasonable.

7. **Good JSDoc on the utility.** Both the module-level doc comment and the function-level doc explain the formula, the parameter semantics, and the return value.

## Verdict

**APPROVED** -- Both extractions are correct, complete, and well-structured. The formula deduplication eliminates a real maintenance risk (7 copies drifting out of sync). The SLOT_ICONS extraction is a clean win. M1 (surface doc) is documentation-only and does not block.

## Required Changes

None blocking. M1 (surface doc update) should be addressed in the next docs commit touching VTT utilities.
