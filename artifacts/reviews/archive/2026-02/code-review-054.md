---
review_id: code-review-054
review_type: code
reviewer: senior-reviewer
trigger: bug-fix
target_tickets:
  - bug-006
  - bug-007
domain: healing, pokemon-lifecycle
commits_reviewed:
  - 73074a1
  - 85af350
files_reviewed:
  - app/server/services/pokemon-generator.service.ts
  - app/utils/restHealing.ts
  - app/server/api/pokemon/[id]/pokemon-center.post.ts
  - app/server/api/characters/[id]/pokemon-center.post.ts
  - app/server/services/combatant.service.ts
  - app/server/api/pokemon/[id]/rest.post.ts
  - app/server/api/characters/[id]/rest.post.ts
  - app/server/api/pokemon/[id]/extended-rest.post.ts
  - app/server/api/characters/[id]/extended-rest.post.ts
  - app/server/api/encounters/[id]/heal.post.ts
  - app/server/api/pokemon/[id]/heal-injury.post.ts
  - app/server/api/characters/[id]/heal-injury.post.ts
  - app/components/group/InitiativeTracker.vue
  - app/components/group/CombatantDetailsPanel.vue
verdict: CHANGES_REQUIRED
issues_found:
  critical: 0
  high: 2
  medium: 1
scenarios_to_rerun:
  - healing-rest-hp-calculation-001
  - healing-workflow-pokemon-center-full-heal-001
  - healing-workflow-mid-combat-breather-001
  - pokemon-lifecycle-stat-distribution-001
reviewed_at: 2026-02-19T23:30:00
---

## Review Scope

Two CRITICAL bug fixes:
- **bug-007** (commit `73074a1`): Stat point allocation changed from `level - 1` to `level + 10`
- **bug-006** (commit `85af350`): Injury-reduced max HP enforcement across healing paths

## Status Table

| Task | Expected | Actual | Status |
|------|----------|--------|--------|
| bug-007: Fix stat point formula | `level + 10` | `level + 10` | DONE |
| bug-007: Update comments | Correct docstrings | Updated | DONE |
| bug-006: Add getEffectiveMaxHp utility | Pure function, handles edge cases | Added, handles 0 and >10 | DONE |
| bug-006: Update calculateRestHealing | Use effective max for heal cap | Updated | DONE |
| bug-006: Update getRestHealingInfo | Use effective max for display | Updated | DONE |
| bug-006: Update Pokemon Center (pokemon) | Heal to effective max after injury healing | Updated | DONE |
| bug-006: Update Pokemon Center (character) | Heal to effective max after injury healing | Updated | DONE |
| bug-006: Update in-combat healing | Cap at effective max | Updated | DONE |
| bug-006: Verify damage uses raw maxHp | No change to damage calc | Confirmed correct | DONE |
| bug-006: Deduplicate UI effective max | Single source of truth | **NOT DONE** | MISSING |

## Issues

### HIGH-1: Duplicate `getEffectiveMaxHp` implementations in two UI components

Two Group View components have their own inline implementations of the effective max HP calculation instead of importing the canonical `getEffectiveMaxHp` from `~/utils/restHealing`:

**File:** `app/components/group/InitiativeTracker.vue:59-64`
```typescript
const getEffectiveMaxHp = (combatant: Combatant): number => {
  const { maxHp, injuries } = combatant.entity
  if (!maxHp || maxHp <= 0) return 0
  const injuryReduction = (injuries || 0) * 0.1
  return Math.floor(maxHp * (1 - injuryReduction))
}
```

**File:** `app/components/group/CombatantDetailsPanel.vue:206-212`
```typescript
const effectiveMaxHp = computed(() => {
  if (!props.combatant) return 0
  const { maxHp, injuries } = props.combatant.entity
  if (!maxHp || maxHp <= 0) return 0
  const injuryReduction = (injuries || 0) * 0.1
  return Math.floor(maxHp * (1 - injuryReduction))
})
```

These happen to produce the same result as the utility today (`maxHp * (1 - injuries * 0.1)` is mathematically equivalent to `maxHp * (10 - injuries) / 10` for integer injuries). However:

1. They do NOT clamp injuries to 10 like the utility does. If `injuries > 10` (theoretically possible with extreme damage), the UI would compute a **negative** effective max while the server computes 0. This is a correctness divergence.
2. Having three copies of the same formula is a DRY violation and a maintenance trap. If the formula ever needs adjustment, someone will fix the utility and miss these two files.

**Required fix:** Both components should import and use `getEffectiveMaxHp` from `~/utils/restHealing`. The components can wrap the call (e.g., in a computed or local function that extracts `maxHp`/`injuries` from the combatant), but the core formula must come from the single canonical utility.

### HIGH-2: `applyHealingToEntity` order-of-operations bug when HP heal + injury heal happen in one call

In `app/server/services/combatant.service.ts:194-228`, HP healing is applied BEFORE injury healing. This means the effective max HP used to cap healing is based on the **pre-heal** injury count (more injuries = lower cap), even when injuries are being healed in the same operation.

**Example:** Entity has 50 maxHp, 3 injuries (effective max = 35), currentHp = 30.
- Combined call: `{ amount: 50, healInjuries: 2 }`
- Current behavior: HP capped at 35 (3 injuries), then injuries reduced to 1 (effective max would be 45). Result: currentHp = 35 with effective max of 45.
- Expected behavior: Injuries healed first to 1, effective max becomes 45, then HP capped at 45. Result: currentHp = 45.

The Pokemon Center endpoints handle this correctly by computing `effectiveMax` AFTER calculating `newInjuries`. The in-combat healer should follow the same pattern.

**Required fix:** In `applyHealingToEntity`, move the injury healing block BEFORE the HP healing block. Then compute `effectiveMax` using the post-injury-healing injury count. This matches the Pokemon Center order of operations and gives the entity the full benefit of simultaneous injury + HP healing.

```typescript
// Fix: heal injuries FIRST, then HP
// 1. Heal injuries
if (options.healInjuries !== undefined && options.healInjuries > 0) {
  const previousInjuries = entity.injuries || 0
  const newInjuries = Math.max(0, previousInjuries - options.healInjuries)
  entity.injuries = newInjuries
  result.injuriesHealed = previousInjuries - newInjuries
  result.newInjuries = newInjuries
}

// 2. Heal HP (capped at injury-reduced effective max HP, using POST-injury-heal count)
if (options.amount !== undefined && options.amount > 0) {
  const effectiveMax = getEffectiveMaxHp(entity.maxHp, entity.injuries || 0)
  // ... rest unchanged
}
```

### MEDIUM-1: No unit tests for `getEffectiveMaxHp`

The new `getEffectiveMaxHp` utility in `app/utils/restHealing.ts` has no unit test coverage. This is a core game-mechanics function that gates every healing path in the app. Edge cases that should be tested:

- `injuries = 0` returns raw maxHp
- `injuries = 3, maxHp = 50` returns 35
- `injuries = 10` returns 0
- `injuries > 10` (e.g., 12) is clamped to 10, returns 0
- `injuries < 0` (defensive) returns raw maxHp
- `maxHp = 0` returns 0 regardless of injuries

There is no existing test file for `restHealing.ts`. A new file `app/tests/unit/utils/restHealing.test.ts` should be created covering `getEffectiveMaxHp` and ideally the `calculateRestHealing` function as well (to verify the integration of effective max into the healing pipeline).

## What Looks Good

1. **bug-007 fix is clean and correct.** Single-line change from `level - 1` to `level + 10`, verified against PTU Core Chapter 5 line 102-103: "add +X Stat Points, where X is the Pokemon's Level plus 10." Comments and docstrings updated. The `Math.max(0, ...)` guard is retained, which is good defensive coding even though `level + 10` should never be negative.

2. **bug-006 `getEffectiveMaxHp` utility is well-designed.** The function correctly handles `injuries <= 0` (early return), clamps to 10 injuries (preventing negative or zero divisor issues), uses `Math.floor` for integer HP, and the formula `maxHp * (10 - effectiveInjuries) / 10` matches PTU Core Chapter 7 line 1867-1868 exactly.

3. **Pokemon Center endpoints correctly compute effective max AFTER injury healing.** Both `pokemon-center.post.ts` files were restructured so that `newInjuries` is calculated first, then `effectiveMax = getEffectiveMaxHp(maxHp, newInjuries)`. This means a Pokemon Center visit that heals 2 injuries will correctly compute the higher effective max for the HP restoration. Smart ordering.

4. **`calculateRestHealing` correctly uses effective max for both the "already full" check and the heal amount.** The "Already at full HP" check now compares against effective max (not raw max), which is correct -- an entity at 35/35 effective HP (with 3 injuries on a 50 maxHp Pokemon) should correctly be told they're at full HP.

5. **Damage calculation is untouched.** Confirmed that `calculateDamage` and `countMarkersCrossed` in `combatant.service.ts` still use `realMaxHp` / `maxHp` directly, matching PTU Core Chapter 7 lines 1872-1876: "The artificial Max Hit Point number is not considered when potentially acquiring new injuries."

6. **Response shapes include `effectiveMaxHp`.** Both Pokemon Center endpoints now return `effectiveMaxHp` in the response alongside `maxHp`, which is good for client-side display.

## Recommended Next Steps

1. **Fix HIGH-1:** Import `getEffectiveMaxHp` from `~/utils/restHealing` in both `InitiativeTracker.vue` and `CombatantDetailsPanel.vue`. Remove the inline implementations. Wrap the call in a local helper if needed to extract combatant fields.
2. **Fix HIGH-2:** Reorder `applyHealingToEntity` to heal injuries before HP, then compute effective max using the post-injury count.
3. **Fix MEDIUM-1:** Add unit tests for `getEffectiveMaxHp` covering the edge cases listed above.
4. Commit each fix separately (3 commits).
