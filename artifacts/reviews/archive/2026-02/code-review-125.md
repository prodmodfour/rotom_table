---
review_id: code-review-125
review_type: code
reviewer: senior-reviewer
trigger: bug-fix
target_report: ptu-rule-077
domain: combat
commits_reviewed:
  - e4340a2
  - 6dd4c35
  - 5979fae
  - 2594ec9
  - 02033ef
  - c1f7ce9
files_reviewed:
  - app/utils/damageCalculation.ts
  - app/server/services/combatant.service.ts
  - app/composables/useCombat.ts
  - app/composables/useMoveCalculation.ts
  - app/server/api/encounters/[id]/calculate-damage.post.ts
  - app/tests/unit/composables/useCombat.test.ts
  - app/utils/equipmentBonuses.ts
  - app/types/combat.ts
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 2
reviewed_at: 2026-02-21T15:30:00Z
follows_up: null
---

## Review Scope

Reviewing the fix for ptu-rule-077: Focus equipment stat bonuses (+5 to a chosen stat, PTU p.295) were not being applied to initiative or evasion calculations. The fix adds a `statBonus` parameter to `calculateEvasion()` and threads Focus bonuses through all 5 code paths where evasion or initiative is computed.

### PTU Rule Verification

Confirmed against PTU p.295 (09-gear-and-items.md, lines 1796-1801): "A Focus grants +5 Bonus to a Stat, chosen when crafted. This Bonus is applied AFTER Combat Stages." The fix correctly places the bonus after the combat stage multiplier but before the /5 evasion derivation, matching the rule semantics: the Focus modifies the *stat*, not the evasion directly.

## Issues

### MEDIUM-1: Duplicated Focus bonus extraction in useMoveCalculation

**File:** `app/composables/useMoveCalculation.ts`, lines 201-212 and 248-259

The same 12-line block extracting Focus bonuses from equipment is duplicated verbatim between `getTargetEvasion()` and `getTargetEvasionLabel()`. These two functions share identical setup logic for target lookup, stage extraction, evasion bonus computation, and Focus bonus extraction. They differ only in their return type (number vs string label).

This duplication was pre-existing (the equipment evasion bonus extraction was already duplicated before this PR), but the Focus bonus additions expanded it from a 4-line duplication to a 12-line one. With 6 new local variables (`focusDefBonus`, `focusSpDefBonus`, `focusSpeedBonus` x2 functions), any future change to Focus handling must be synchronized across both functions.

**Fix:** Extract a shared helper that returns the three evasion values (physical, special, speed), then have `getTargetEvasion` return the max and `getTargetEvasionLabel` return the label. This is a non-blocking refactoring improvement -- file a ticket.

### MEDIUM-2: Semantic mismatch in combatant builder initial evasion

**File:** `app/server/services/combatant.service.ts`, line 622-624

The initial evasion calculation adds Focus bonus to the base stat *before* passing to `initialEvasion()`:
```typescript
physicalEvasion: initialEvasion((stats.defense || 0) + (equipmentStatBonuses.defense ?? 0)) + equipmentEvasionBonus
```

While `calculateEvasion()` adds it *after* the combat stage multiplier:
```typescript
const statEvasion = Math.min(6, Math.floor((applyStageModifier(baseStat, combatStage) + statBonus) / 5))
```

At combat stage 0 (the only value at combatant creation), these are mathematically equivalent since `applyStageModifier(x, 0) = x`. So there is no numeric bug. However, the semantic treatment differs: `initialEvasion` treats Focus as a base stat modifier, while `calculateEvasion` treats it as a post-stage bonus. If someone later changes `buildCombatantFromEntity` to support non-zero initial combat stages, the discrepancy would produce different results.

**Risk assessment:** Low. The combatant builder always initializes at CS=0 (with one exception: Heavy Armor sets speed CS to -1). For the Heavy Armor + Focus (Speed) case, the *initiative* calculation correctly applies Focus after the stage modifier (line 587-588), but the *initial speed evasion* does not go through `applyStageModifier` -- it uses `initialEvasion(stat + bonus)`. However, since `initialEvasion` has no stage parameter at all, it only ever sees the raw stat. The initial evasion values are also just starting snapshots; the real evasion is recomputed dynamically during combat via `calculateEvasion()`, `getTargetEvasion()`, and the damage endpoint.

**Fix:** Non-blocking. The stored evasion values on combatant objects are display/snapshot values only. The runtime calculation paths all use the correct `calculateEvasion()` function. This can be addressed in a future cleanup.

## What Looks Good

1. **Correct formula placement.** The `statBonus` is added after `applyStageModifier()` but before the `/5` division and `Math.min(6, ...)` cap, exactly matching PTU p.295: the bonus modifies the stat (not the evasion), and combat stages multiply the base stat first.

2. **All code paths covered.** Focus bonuses are applied in all 5 evasion/initiative calculation sites:
   - `calculateEvasion()` core function (damageCalculation.ts)
   - `buildCombatantFromEntity()` initial values (combatant.service.ts)
   - `getTargetEvasion()` and `getTargetEvasionLabel()` client-side (useMoveCalculation.ts)
   - Server-side damage endpoint (calculate-damage.post.ts)

3. **Backward compatibility preserved.** The `statBonus` parameter defaults to 0, so all existing callers continue to work without modification. No breaking changes.

4. **Human-only guard.** Focus bonuses are correctly gated behind `target.type === 'human'` / `entityType === 'human'` checks in all locations. Pokemon do not use equipment, so this is correct.

5. **Initiative includes Focus.** The initiative calculation in `buildCombatantFromEntity()` adds `focusSpeedBonus` to the effective speed, correctly accounting for both Heavy Armor CS penalty and Focus bonus in the right order (stage modifier first, then +5).

6. **Client-server consistency.** The evasion calculation in `useMoveCalculation.ts` (client) and `calculate-damage.post.ts` (server) apply Focus bonuses identically. Both extract `focusDefBonus`, `focusSpDefBonus`, `focusSpeedBonus` from `computeEquipmentBonuses()` and pass them as the 4th argument to `calculateEvasion()`.

7. **Tests verify ordering.** Unit tests explicitly verify that `statBonus` is applied after combat stage multiplication but before the /5 division, with concrete numeric examples (stat 20, stage -1: `floor(20*0.9)=18, +5=23, 23/5=4.6, floor=4`).

8. **Commit granularity.** Six commits, each touching one logical file or concern. Clean layered progression from core utility to service to composable to endpoint to tests.

## Verdict

**APPROVED**

The fix correctly implements Focus stat bonuses for initiative and evasion per PTU p.295. All code paths are covered, client-server parity is maintained, and the unit tests verify the critical ordering behavior. The two MEDIUM issues (code duplication and semantic mismatch in initial evasion) are non-blocking -- neither produces incorrect runtime behavior. They should be tracked for future cleanup.

## Required Changes

None. The two MEDIUM issues should be filed as refactoring tickets:

1. **Refactoring ticket:** Extract shared evasion computation helper in `useMoveCalculation.ts` to eliminate the duplicated Focus bonus extraction between `getTargetEvasion()` and `getTargetEvasionLabel()`.
2. **Refactoring ticket (low priority):** Consider having `buildCombatantFromEntity()` use `calculateEvasion()` for initial evasion values instead of `initialEvasion()` with manually added stat bonuses, to ensure semantic consistency with the runtime calculation path.
