---
review_id: code-review-055
review_type: code
reviewer: senior-reviewer
trigger: re-review
follows_up: code-review-054
target_tickets:
  - bug-006
domain: healing
commits_reviewed:
  - 8cb6057
  - b728351
  - bf44494
  - 2b9c66d
files_reviewed:
  - app/components/group/InitiativeTracker.vue
  - app/components/group/CombatantDetailsPanel.vue
  - app/server/services/combatant.service.ts
  - app/utils/restHealing.ts
  - app/tests/unit/utils/restHealing.test.ts
verdict: CHANGES_REQUIRED
issues_found:
  critical: 0
  high: 0
  medium: 1
reviewed_at: 2026-02-19T23:30:00
---

## Review Scope

Re-review of 4 fix commits addressing the 2 HIGH + 1 MEDIUM issues from code-review-054.

## Finding Verification

### HIGH-1: Duplicate `getEffectiveMaxHp` in UI components -- RESOLVED

Commit `8cb6057` properly addresses this.

**InitiativeTracker.vue** (line 45): imports `getEffectiveMaxHp` from `~/utils/restHealing`. The old inline function body (`injuryReduction = injuries * 0.1; Math.floor(maxHp * (1 - injuryReduction))`) is replaced by a thin wrapper `getCombatantEffectiveMax` (line 60-63) that extracts `maxHp` and `injuries` from the combatant entity and delegates to the canonical utility. The function is correctly renamed from the old `getEffectiveMaxHp` (which would shadow the import) to `getCombatantEffectiveMax`, and the call site in `getHpPercentage` (line 67) is updated to match.

**CombatantDetailsPanel.vue** (line 178): imports `getEffectiveMaxHp` from `~/utils/restHealing`. The computed `effectiveMaxHp` (line 207-211) retains its computed wrapper but now delegates to the utility instead of inlining the formula. The `if (!maxHp || maxHp <= 0) return 0` guard is removed, which is correct -- the utility handles zero maxHp internally (returns `Math.floor(0 * ...)` = 0).

A codebase-wide search for `injuryReduction`, `injuries * 0.1`, and inline injury reduction formulas confirms no copies remain. All 6 call sites of `getEffectiveMaxHp` across the codebase import from the single canonical source.

### HIGH-2: Order-of-operations in `applyHealingToEntity` -- RESOLVED

Commit `b728351` properly addresses this.

In `combatant.service.ts` lines 194-201, the injury healing block is now positioned BEFORE the HP healing block (lines 203-219). The old injury healing block (which was after HP + tempHP) has been removed entirely. The `getEffectiveMaxHp` call on line 205 now reads `entity.injuries` AFTER the injury mutation on line 198 (`entity.injuries = newInjuries`), so the effective max HP cap correctly reflects the post-injury-heal count.

Walkthrough of the reviewed example from code-review-054:
- Entity: 50 maxHp, 3 injuries, currentHp = 30, call `{ amount: 50, healInjuries: 2 }`
- Step 1 (lines 195-201): injuries 3 -> 1, result.injuriesHealed = 2
- Step 2 (lines 204-219): `entity.injuries` is now 1, so `effectiveMax = getEffectiveMaxHp(50, 1) = 45`. HP = min(45, 30+50) = 45.
- Result: currentHp = 45 with effective max of 45. This matches the expected behavior.

The mutation of `entity.injuries` on line 198 before reading it on line 205 is the key correctness property. Verified.

### MEDIUM-1 (original): Unit tests for `getEffectiveMaxHp` -- RESOLVED

Commit `2b9c66d` adds `app/tests/unit/utils/restHealing.test.ts` with 14 tests across two describe blocks:

**`getEffectiveMaxHp` (8 tests):** Covers all edge cases from the original review request:
- `injuries = 0` returns raw maxHp
- `injuries = 3, maxHp = 50` returns 35 (PTU example)
- `injuries = 10` returns 0
- `injuries > 10` (11, 12, 100) clamped to 0
- `injuries < 0` (defensive) returns raw maxHp
- `maxHp = 0` returns 0 regardless
- Non-round values floor correctly (33*9/10=29.7->29, 7*7/10=4.9->4)

**`calculateRestHealing` (6 tests):** Validates the 1/16th formula fix from `bf44494`:
- Uses real maxHp for 1/16th amount (80 maxHp, 4 injuries: heals 5 not 3)
- Caps at effective max (not raw max)
- "Already at full HP" at effective max (not raw)
- Blocks with 5+ injuries
- Blocks after 480 minutes
- Minimum 1 HP heal for low maxHp

All 14 tests pass when run with `npx vitest run` from the `app/` directory.

### MEDIUM (new from bf44494): 1/16th formula fix -- PARTIALLY RESOLVED

Commit `bf44494` correctly changes both `calculateRestHealing` (line 65) and `getRestHealingInfo` (line 174) to use `maxHp` instead of `effectiveMax` for the 1/16th healing amount, while keeping `effectiveMax` as the cap. The PTU p.250 comments are accurate.

However, the fix left a dead variable in `getRestHealingInfo`. Line 171 computes `const effectiveMax = getEffectiveMaxHp(maxHp, injuries)` which is no longer referenced by anything in the function. Before this fix, `effectiveMax` was used in the `hpPerRest` calculation on line 174; now that line reads `maxHp / 16` instead. The variable serves no purpose and should be removed.

## Issues

### MEDIUM-1: Dead `effectiveMax` variable in `getRestHealingInfo`

**File:** `app/utils/restHealing.ts:171`

```typescript
const effectiveMax = getEffectiveMaxHp(maxHp, injuries)  // unused
```

This variable was previously consumed by the `hpPerRest` formula. After commit `bf44494` changed the formula to use `maxHp` directly, `effectiveMax` is no longer referenced anywhere in `getRestHealingInfo`. It should be removed to avoid confusion about whether the effective max is factored into the display info.

**Required fix:** Delete line 171.

## What Looks Good

1. **Clean deduplication in HIGH-1.** The rename from `getEffectiveMaxHp` to `getCombatantEffectiveMax` in InitiativeTracker avoids shadowing the import. Both components correctly extract `maxHp` and `injuries` from their respective data shapes and pass them to the utility.

2. **Correct mutation ordering in HIGH-2.** The entity is mutated in the right sequence: injuries first, then HP reads the post-mutation injury count. The result object fields (`injuriesHealed`, `newInjuries`, `hpHealed`, `newHp`) are all populated correctly in both branches.

3. **Thorough test coverage in MEDIUM-1.** The test file covers the exact edge cases requested in code-review-054, plus adds integration tests for `calculateRestHealing` that validate the 1/16th formula fix. The test for "uses real maxHp for 1/16th healing amount" (line 54-65) is the key regression test for the bf44494 fix.

4. **Correct formula semantics in bf44494.** The distinction between "1/16th of REAL max" for heal amount and "effective max" for the cap is exactly right per PTU p.250. Both `calculateRestHealing` and `getRestHealingInfo` are consistent.
