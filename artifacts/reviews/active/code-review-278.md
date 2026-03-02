---
review_id: code-review-278
review_type: code
reviewer: game-logic-reviewer
trigger: design-implementation
target_report: feature-020
domain: healing
commits_reviewed:
  - e918bcee
  - b2cbeeb5
  - 9999122a
  - 64ba1d60
  - 1ff9d7ea
  - 7d2f48f9
  - 3f2a833f
  - fc9a8108
files_reviewed:
  - app/constants/healingItems.ts
  - app/server/services/healing-item.service.ts
  - app/server/api/encounters/[id]/use-item.post.ts
  - app/composables/useHealingItems.ts
  - app/components/encounter/UseItemModal.vue
  - app/tests/unit/services/healing-item.service.test.ts
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
reviewed_at: 2026-03-02T14:35:00Z
follows_up: code-review-271
---

## Files Reviewed

### app/constants/healingItems.ts (249 lines)
- Clean read-only catalog with `as const` correctness
- All 16 PTU items defined with correct types and values
- `resolveConditionsToCure()` pure function moved here from service for client/server sharing -- good architectural decision
- Hardcoded `PERSISTENT` array in `resolveConditionsToCure()` avoids circular dependency with `statusConditions.ts` -- verified it matches the canonical list exactly (Burned, Frozen, Paralyzed, Poisoned, Badly Poisoned)
- Category labels and helper functions (`getRestorativeItems`, `getCureItems`) well-structured
- Type definitions (`HealingItemCategory`, `HealingItemDef`) comprehensive with `readonly` modifiers

### app/server/services/healing-item.service.ts (318 lines)
- Clean separation: `validateItemApplication()`, `applyHealingItem()`, and internal helpers (`applyCureEffects`, `applyReviveItem`, `applyCombinedItem`)
- Validation covers all categories: revive (must be fainted), cure (must have matching condition), combined (HP or conditions), restorative (not at full HP)
- `applyReviveItem()` correctly bypasses `applyHealingToEntity()` to avoid double Fainted-removal logic
- `applyCombinedItem()` enforces correct order: cure first, then heal HP
- `applyCureEffects()` properly delegates to `updateStatusConditions()` and resets `badlyPoisonedRound`
- Re-export of `resolveConditionsToCure` from constants maintains backward compatibility
- Display helper `getEntityDisplayName()` properly handles both Pokemon (nickname/species) and HumanCharacter

### app/server/api/encounters/[id]/use-item.post.ts (122 lines)
- P1 update: `allowedCategories` expanded from `['restorative']` to all four categories
- Proper validation chain: item exists, required fields present, category allowed, target accepts
- Target refusal handled before loading encounter (efficient early return)
- Entity sync includes `stageModifiers` for CS reversal persistence
- WebSocket broadcast of `item_used` event with full effect details
- Error handling distinguishes HTTP errors (rethrow) from unexpected errors (500)

### app/composables/useHealingItems.ts (116 lines)
- `getApplicableItems()` correctly filters by target state: fainted sees only revives, active sees restoratives/cures/combined
- Category-aware filtering prevents showing inapplicable items (e.g., Burn Heal when not Burned)
- `getItemsByCategory()` provides grouped view for UI
- Uses `readonly()` wrappers on refs -- good reactivity practice
- Clean delegation to encounter store for actual API call

### app/components/encounter/UseItemModal.vue (649 lines)
- Four grouped sections (Restoratives, Status Cures, Combined, Revives) with appropriate Phosphor icons
- Repulsive badge with warning icon and tooltip on applicable items
- Dynamic filtering: categories with no applicable items are hidden
- Target selector shows current HP, effective max HP, and [Fainted] indicator
- Result display handles all effect types (revived, healed HP, cured conditions, repulsive)
- Refusal handling correctly passes `targetAccepts: false`
- Item selection resets when target changes (prevents stale selection)
- BEM-compliant SCSS with design system variables

### app/tests/unit/services/healing-item.service.test.ts (748 lines)
- Comprehensive coverage of all item categories
- `resolveConditionsToCure`: 12 tests covering specific conditions, all-persistent, all-status, edge cases
- `validateItemApplication`: 12 tests covering all categories, fainted rejection, injury-reduced effective max
- `applyHealingItem` restoratives: 3 tests (heal amount, cap at max, repulsive flag)
- `applyHealingItem` cures: 8 tests (each cure item, CS reversal, badlyPoisonedRound reset, no HP heal)
- `applyHealingItem` revives: 7 tests (Revive 20HP, cap at effective max, Revival Herb 50%, rounding, injury cap, min-1 guard, rejection)
- `applyHealingItem` combined: 7 tests (cure+heal, order, Full Restore rejection on fainted, all-status cure, no-effect rejection, full-HP-with-conditions, badlyPoisonedRound reset)
- `getEntityDisplayName`: 2 tests (species vs nickname)
- Helper functions well-structured with `makeCombatant` factory

## Architecture Notes

The P1 implementation follows the same patterns established in P0 (approved in code-review-271):
- Catalog-driven design: all item data in a single constant, logic reads from catalog
- Service layer handles validation and application, endpoint is thin
- Composable provides client-side filtering, delegating execution to store
- Component is purely presentational with event emission
- `resolveConditionsToCure()` shared between client (composable) and server (service) via constants -- avoids code duplication

## Summary

Clean P1 implementation extending the healing item system with 4 new item categories (cure, revive, combined, repulsive). Code structure is consistent with P0 patterns. No game logic issues found -- all PTU mechanics correctly implemented. Test coverage is thorough at 748 lines covering all paths, edge cases, and decree compliance.

## Verdict

**APPROVED** -- 0 issues. All P1 features implemented correctly with comprehensive test coverage. Ready for P2 (action economy, inventory).

## Required Changes

None.
