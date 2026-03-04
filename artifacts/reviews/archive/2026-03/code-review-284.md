---
review_id: code-review-284
review_type: code
reviewer: senior-reviewer
trigger: design-implementation
target_report: feature-020
domain: healing
commits_reviewed:
  - f6303ee0
  - 4950bbe1
  - 23cef0e8
  - 5c87d511
files_reviewed:
  - app/constants/healingItems.ts
  - app/server/services/healing-item.service.ts
  - app/composables/useHealingItems.ts
  - app/components/encounter/UseItemModal.vue
  - app/server/api/encounters/[id]/use-item.post.ts
  - app/tests/unit/services/healing-item.service.test.ts
  - .claude/skills/references/app-surface.md
  - artifacts/tickets/open/feature/feature-020.md
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
reviewed_at: 2026-03-03T00:45:00Z
follows_up: code-review-278
---

## Review Scope

Re-review of feature-020 P1 fix cycle (4 commits). Verifying all issues from code-review-278 (1H + 2M) and rules-review-254 (1H) are resolved. The fix cycle addressed:

- **code-review-278 H1**: app-surface.md not updated for P1 functions
- **code-review-278 M1**: Revive missing Math.max(1,...) HP guard
- **code-review-278 M2**: Awakening item not in PTU 1.05 rulebook
- **rules-review-254 H1**: Awakening cheapest Sleep cure concern

## Issue Verification

### H1 (code-review-278): app-surface.md not updated -- RESOLVED

Commit `23cef0e8` updates the healing item system block in `app-surface.md` with the following corrections:

1. Item count changed from 14 to 15 (Awakening was added in P1 implementation but surface doc was not updated)
2. `resolveConditionsToCure` added to the exported function list from `constants/healingItems.ts`
3. Endpoint description updated to include "repulsive" in the P1 scope note
4. Service description updated from "HP restoration with internal validation" to "HP restoration/status cure/revive with internal validation"
5. UseItemModal description updated to mention "grouped by category" and "repulsive badge"
6. Awakening explicitly called out with "per decree-041" reference

All changes are accurate and match the actual code. Verified by reading both the diff and the final `app-surface.md` content.

### M1 (code-review-278): Revive Math.max(1,...) HP guard -- RESOLVED

Commit `f6303ee0` changes line 245 of `healing-item.service.ts` from:
```typescript
entity.currentHp = Math.min(item.hpAmount, effectiveMax)
```
to:
```typescript
entity.currentHp = Math.max(1, Math.min(item.hpAmount, effectiveMax))
```

This prevents the edge case where a Pokemon with 10 injuries has `effectiveMax = 0` (via `getEffectiveMaxHp` formula: `Math.floor(maxHp * (10 - 10) / 10) = 0`), which would revive the Pokemon to 0 HP -- functionally still fainted. The `Math.max(1, ...)` ensures at minimum 1 HP after revive.

The `healToPercent` branch (Revival Herb, line 249) already had the `Math.max(1, ...)` guard before this fix. Both revive paths now have consistent minimum-1 HP behavior.

The existing test suite covers the Revive-with-injuries case ("Revive caps HP at effective max if below 20" at line 541, testing 3 injuries with effectiveMax = 15) and the Revival Herb minimum ("always restores at least 1 HP" at line 602). While there is no explicit test for the exact `effectiveMax = 0` edge case (10 injuries on Revive), the code fix is correct and the guard is straightforward. This is an acceptable test gap for a boundary that would require extreme injury counts rarely seen in play.

### M2 (code-review-278) + H1 (rules-review-254): Awakening not in PTU 1.05 -- RESOLVED via decree-041

Commit `4950bbe1` adds the comment:
```typescript
// per decree-041: Awakening confirmed as standard cure item despite ch9 table omission
```

directly above the Awakening entry in `healingItems.ts` (line 107).

Verified decree-041 content: The ruling explicitly states "keep Awakening at $200 as a standard single-condition cure item, treating the ch9 gear table omission as an editing oversight." The evidence cites PTU 1.05 ch11 (Pharmacy stock list) and ch4 (Apothecary Restorative Science recipe) as two independent confirmations of the item's existence. The decree was ruled 2026-03-02 with status: active.

Per decree-041, this approach is correct. The comment accurately references the decree and the Awakening entry remains at $200 with `curesConditions: ['Asleep', 'Bad Sleep']`.

### Resolution log (commit 5c87d511) -- verified

The resolution log in `feature-020.md` correctly documents the fix cycle with commit references and issue mapping. Note: the commit hashes in the resolution log (`b052616f`, `85480c5b`, `4e8fbcb1`) differ from the hashes in this worktree (`f6303ee0`, `4950bbe1`, `23cef0e8`) due to cherry-pick/rebase into the review branch. This is expected and the commit content is identical.

## Additional Verification

### File size compliance
All files within the 800-line limit: `healingItems.ts` (249), `healing-item.service.ts` (317), `useHealingItems.ts` (115), `UseItemModal.vue` (649), `use-item.post.ts` (121).

### Code quality
- No immutability violations in the fix commits
- `Math.max(1, Math.min(...))` is a clean, standard clamping pattern
- Comment references decree by ID (not just prose), enabling grep-based discovery
- app-surface.md updates are factually accurate against the source code

### Decree compliance
- decree-041 (Awakening inclusion): Compliant. Comment references decree correctly.
- decree-017 (effective max HP): Compliant. `getEffectiveMaxHp` used in validation, revive HP capping, and UI display.
- decree-029 (rest healing minimum 1 HP): Not directly applicable to item healing, but the Math.max(1,...) guard aligns with the same design intent of "never heal to 0."
- decree-005 (CS reversal on status cure): Compliant. `updateStatusConditions` handles CS reversal via `stageSources`, tested in unit tests (Burn Heal reverses defense CS, Paralyze Heal reverses speed CS).

## What Looks Good

1. **Focused fix commits**: Each commit addresses exactly one issue from the review, with clear commit messages. Good granularity.
2. **Math.max(1,...) guard placement**: Applied to the `hpAmount` branch to match the existing pattern in the `healToPercent` branch. Both revive paths are now consistent.
3. **Decree citation in code**: The `// per decree-041:` comment is exactly the right format -- discoverable by grep, cites the decree ID, and summarizes the ruling in one line.
4. **app-surface.md accuracy**: Every claim in the updated surface doc was verified against the source code. Item count (15), function list, endpoint description, and component features all match.
5. **Test coverage**: 51 unit tests covering all P1 item categories (cure resolution, validation, application for restoratives, cures, revives, combined). CS reversal tested for Burn and Paralyze. badlyPoisonedRound reset tested. Repulsive flag tested.

## Verdict

**APPROVED**

All 4 issues from code-review-278 and rules-review-254 are resolved. The fixes are correct, minimal, and well-targeted. No new issues introduced. Feature-020 P1 (Healing Item System -- status cures, revives, Full Restore) passes code review.
