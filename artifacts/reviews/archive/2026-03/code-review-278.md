---
review_id: code-review-278
review_type: code
reviewer: senior-reviewer
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
  - fc9a8108
  - 3f2a833f
files_reviewed:
  - app/constants/healingItems.ts
  - app/server/services/healing-item.service.ts
  - app/server/api/encounters/[id]/use-item.post.ts
  - app/composables/useHealingItems.ts
  - app/components/encounter/UseItemModal.vue
  - app/tests/unit/services/healing-item.service.test.ts
  - .claude/skills/references/app-surface.md
verdict: CHANGES_REQUIRED
issues_found:
  critical: 0
  high: 1
  medium: 2
reviewed_at: 2026-03-02T15:30:00Z
follows_up: code-review-271
---

## Review Scope

P1 implementation of the Healing Item System (feature-020). This review covers 8 commits by slave-4 adding: status cure items (Antidote, Paralyze Heal, Burn Heal, Ice Heal, Awakening, Full Heal, Heal Powder), revive items (Revive, Revival Herb), combined item (Full Restore), `resolveConditionsToCure` utility moved to constants for client/server sharing, UseItemModal grouped UI with category sections and repulsive badges, and 748 lines of unit tests.

P0 was APPROVED in code-review-271 (0 issues) and rules-review-247 (0 issues).

Decree check: decree-005 (status CS auto-apply with source tracking) -- correctly integrated via `updateStatusConditions()` delegation. decree-017 (effective max HP cap) -- correctly applied in Revive HP capping and validation. decree-029 (rest healing minimum 1 HP) -- applies to rest healing, not items; correctly NOT applied to items (items heal fixed amounts). No decree violations found.

## Issues

### HIGH

**H1: `app-surface.md` not updated for P1 functions**

File: `.claude/skills/references/app-surface.md`, line 162

The healing item system description at line 162 does not mention `resolveConditionsToCure` as a function of `constants/healingItems.ts` (where it was moved by commit 3f2a833f). The item count says "14 items" but there are now 15 items in the catalog (Awakening was added). The endpoint description at line 160 says "P0: restorative HP items only" which is now outdated -- P1 is implemented.

The `app-surface.md` is the project's canonical surface area reference. Other skills and reviewers rely on it for accurate function signatures and capabilities. Inaccurate documentation leads to integration failures.

Required fix:
1. Add `resolveConditionsToCure` to the `constants/healingItems.ts` function list
2. Update item count from 14 to 15 (or 14 if Awakening is removed per M2)
3. Update service entry to reflect re-export of `resolveConditionsToCure`
4. Remove "P0: restorative HP items only" qualifier from the use-item endpoint description (or update to reflect P1 status)

### MEDIUM

**M1: Revive item missing minimum 1 HP guard**

File: `app/server/services/healing-item.service.ts`, lines 243-246

```typescript
if (item.hpAmount) {
    entity.currentHp = Math.min(item.hpAmount, effectiveMax)
    effects.hpHealed = entity.currentHp
}
```

The Revival Herb path (line 249) correctly uses `Math.max(1, ...)` to guarantee at least 1 HP. The Revive path does not. If a Pokemon has extremely high injuries (e.g., 9 injuries on a maxHp=5 Pokemon, giving effectiveMax=0), `Math.min(20, 0)` would set HP to 0, "reviving" the Pokemon to 0 HP with Fainted removed. The Pokemon would need to immediately faint again.

While this is an extreme edge case (9 injuries on a 5-maxHP Pokemon), the inconsistency with Revival Herb's `Math.max(1, ...)` pattern and the logical absurdity of reviving to 0 HP make this worth fixing now.

Required fix: Add `Math.max(1, ...)` guard to the Revive path:
```typescript
entity.currentHp = Math.max(1, Math.min(item.hpAmount, effectiveMax))
```

**M2: Awakening item not in PTU 1.05 rulebook or design spec catalog**

File: `app/constants/healingItems.ts`, lines 107-113

The Awakening item was added in commit e918bcee claiming it was "referenced in spec section F item list." However:
1. PTU 1.05 p.276 Basic Restoratives table does NOT list "Awakening" -- the game cures sleep via Full Heal (all persistent) or Full Restore (all status), plus save checks and damage
2. The design spec shared-specs.md canonical item table (lines 204-219) lists exactly 14 items and does NOT include Awakening
3. The P1 spec `spec-p1.md` does not mention Awakening anywhere
4. Sleep (Asleep) is a volatile condition in PTU, so Full Heal (`curesAllPersistent`) intentionally does NOT cure it -- this is by design

The Awakening is a Pokemon video game item but not a PTU 1.05 item. Its inclusion creates a rules discrepancy: it provides a cheap ($200) targeted sleep cure that PTU intentionally omits (the cheapest PTU way to cure Asleep is Full Restore at $1450, or waiting for the save check).

Required fix: Either remove the Awakening from the catalog (aligning with PTU 1.05 and the design spec), or create a `decree-need` ticket in `artifacts/tickets/open/decree/` for human ruling on whether to include this as a house-rule extension. The implementation log's deviation note is not sufficient authority to add non-PTU items.

## What Looks Good

1. **Clean architecture**: The `resolveConditionsToCure` function is well-designed with clear priority order (curesAllStatus > curesAllPersistent > curesConditions). Moving it to constants for client/server sharing was the right call -- the re-export pattern preserves backward compatibility cleanly.

2. **Correct integration with existing systems**: Status cures correctly delegate to `updateStatusConditions()` which handles CS reversal per decree-005. The `badlyPoisonedRound` reset is a good detail. The DB sync in the endpoint correctly includes `stageModifiers` to persist CS reversal state.

3. **Revive logic isolation**: The `applyReviveItem` helper correctly avoids `applyHealingToEntity` since that function has Fainted-removal logic at the 0-to-positive HP transition. The explicit Fainted removal + direct HP set prevents double-processing. This is well-documented in the code comment.

4. **Comprehensive validation**: The `validateItemApplication` function correctly handles all category-specific rules: revive items require Fainted, non-revive items reject Fainted, cures require matching conditions, combined items check for either HP need or condition need, restoratives respect effective max HP.

5. **UI structure**: The UseItemModal's grouped sections with category-specific Phosphor icons (PhFirstAidKit, PhPill, PhStar, PhHeartBreak) and the repulsive badge are well-designed. Dynamic filtering based on target state (fainted targets only see revives) provides good UX. The `[Fainted]` indicator in the target dropdown is a helpful touch.

6. **Excellent test coverage**: 748 lines of unit tests covering `resolveConditionsToCure`, `validateItemApplication`, and `applyHealingItem` across all categories. Tests verify CS reversal (decree-005), injury-reduced effective max HP capping, badlyPoisonedRound reset, Revival Herb floor rounding, and edge cases. The test suite is thorough and well-organized by category.

7. **Immutability patterns**: The composable's `groupedItems` computed property uses immutable spread patterns (`[...grouped[item.category], item]`). The `resolveConditionsToCure` function returns new filtered arrays rather than mutating inputs.

8. **Commit granularity**: 8 commits with clear scope: Awakening catalog entry, service implementation, endpoint update, composable update, UI update, tests, spec update, refactor. Each commit is focused and produces a working state.

## Verdict

**CHANGES_REQUIRED**

Three issues require fixes before approval:
- **H1**: `app-surface.md` must be updated to reflect P1 functions, item count, and endpoint status
- **M1**: Revive item needs `Math.max(1, ...)` guard for consistency with Revival Herb and correctness at extreme injury levels
- **M2**: Awakening item needs either removal or a decree-need ticket -- it is not in PTU 1.05 or the design spec

## Required Changes

1. Update `app-surface.md` line 162 to include `resolveConditionsToCure` in constants functions, correct item count, and update endpoint description for P1 status
2. Add `Math.max(1, ...)` guard to `applyReviveItem` Revive path in `healing-item.service.ts` line 245
3. Either remove Awakening from `healingItems.ts` catalog OR file a `decree-need` ticket in `artifacts/tickets/open/decree/` for human ruling on house-rule sleep cure item inclusion
