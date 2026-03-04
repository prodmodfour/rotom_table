---
review_id: rules-review-201
review_type: rules
reviewer: game-logic-reviewer
trigger: design-implementation
target_report: feature-012
domain: combat
commits_reviewed:
  - 2b6876b
  - 6b341f3
  - 3572de6
  - 158e050
  - 0ef8300
  - c9fc1b6
  - 1d5d0f5
  - a2950ce
  - 1128210
  - e61f1ce
mechanics_verified:
  - heavily-injured-threshold
  - heavily-injured-hp-penalty-on-damage
  - heavily-injured-hp-penalty-on-standard-action
  - death-by-injuries
  - death-by-hp-threshold
  - death-hp-threshold-formula
  - league-battle-death-exemption
  - death-check-ordering
ptu_refs:
  - core/07-combat.md#page-250-heavily-injured
  - core/07-combat.md#page-251-death
  - core/07-combat.md#page-227-league-battles
verdict: CHANGES_REQUIRED
issues_found:
  critical: 0
  high: 1
  medium: 1
ptu_refs:
  - core/07-combat.md#page-250-heavily-injured
  - core/07-combat.md#page-251-death
reviewed_at: 2026-02-28T22:30:00Z
follows_up: null
---

## Mechanics Verified

### Heavily Injured Threshold (5+ Injuries)

- **Rule:** "Whenever a Trainer or Pokemon has 5 or more injuries, they are considered Heavily Injured." (`core/07-combat.md#page-250`, line 1899)
- **Implementation:** `checkHeavilyInjured()` in `app/utils/injuryMechanics.ts:69-75` uses `injuries >= HEAVILY_INJURED_THRESHOLD` where `HEAVILY_INJURED_THRESHOLD = 5`.
- **Status:** CORRECT

### Heavily Injured HP Penalty on Taking Damage

- **Rule:** "Whenever a Heavily Injured Trainer or Pokemon ... takes Damage from an attack, they lose Hit Points equal to the number of Injuries they currently have." (`core/07-combat.md#page-250`, lines 1900-1904)
- **Implementation:**
  - `damage.post.ts:58-76`: After `applyDamageToEntity()`, checks heavily injured using `damageResult.newInjuries` (the post-damage injury count, which includes newly gained injuries from this hit). This correctly reflects "the number of Injuries they currently have" at the time the penalty triggers. The penalty is applied as additional HP loss via `applyHeavilyInjuredPenalty()`.
  - `move.post.ts:98-115`: Same pattern applied per-target in the move execution pipeline.
  - Both paths correctly skip the penalty if `entity.currentHp <= 0` (already fainted), and correctly add Fainted status if the penalty drops HP to 0.
- **Status:** CORRECT

### Heavily Injured HP Penalty on Standard Action

- **Rule:** "Whenever a Heavily Injured Trainer or Pokemon takes a Standard Action during combat ... they lose Hit Points equal to the number of Injuries they currently have." (`core/07-combat.md#page-250`, lines 1900-1904)
- **Implementation:** `next-turn.post.ts:82-133` applies the penalty at turn end for any combatant that is not in the `trainer_declaration` phase. However, the penalty is applied unconditionally at turn end regardless of whether a Standard Action was actually used during the turn.
- **Status:** NEEDS REVIEW -- See issue HIGH-001 below.

### Death by Injuries (10+)

- **Rule:** "If a Pokemon or Trainer has 10 injuries ... they die." (`core/07-combat.md#page-251`, lines 1928-1929)
- **Implementation:** `checkDeath()` in `app/utils/injuryMechanics.ts:127-134` checks `injuries >= LETHAL_INJURY_COUNT` where `LETHAL_INJURY_COUNT = 10`. Returns `cause: 'injuries'`.
- **Status:** CORRECT

### Death by HP Threshold

- **Rule:** "goes down to either -50 Hit Points or -200% Hit Points, whichever is lower (in that -80 Hit Points is lower than -50 Hit Points)" (`core/07-combat.md#page-251`, lines 1929-1932)
- **Implementation:** `calculateDeathHpThreshold()` in `app/utils/injuryMechanics.ts:90-95` computes `Math.min(-50, Math.floor(maxHp * -2.0))`. The `Math.min` correctly selects the more negative value (per the PTU example). The `checkDeath()` function uses `hpForCheck <= deathHpThreshold`, treating "goes down to" as reaching the threshold value.
- **Verification examples:**
  - 100 HP max: threshold = `Math.min(-50, -200) = -200` (CORRECT)
  - 20 HP max: threshold = `Math.min(-50, -40) = -50` (CORRECT)
  - 25 HP max: threshold = `Math.min(-50, -50) = -50` (CORRECT)
- **Status:** CORRECT

### Death HP Check Uses Unclamped HP

- **Rule:** HP is clamped to 0 for storage, but death threshold must check actual (unclamped) HP to detect when a combatant goes below -50 or -200%.
- **Implementation:** All three code paths correctly track unclamped HP:
  - `damage.post.ts:56,80`: `unclampedAfterDamage = hpBeforeDamage - damageResult.hpDamage`, then `finalUnclampedHp = unclampedAfterDamage - heavilyInjuredHpLoss`. Passed as `unclampedHp` to `checkDeath()`.
  - `move.post.ts:96,118`: Same pattern per-target.
  - `next-turn.post.ts:108`: Uses `penalty.unclampedHp` from `applyHeavilyInjuredPenalty()`.
- **Status:** CORRECT

### League Battle Death Exemption

- **Rule:** "in situations like this, simply pay no heed to the -50/-200% damage rule" (`core/07-combat.md#page-251`, lines 1934-1937). Per decree-021, death rules are suppressed in League mode.
- **Implementation:** `checkDeath()` at `injuryMechanics.ts:138-146`: When `isLeagueBattle` is true and HP-based death would trigger, returns `isDead: false, leagueSuppressed: true`. Injury-based death (10+) is NOT suppressed in League Battles, per the PTU text: "Injuries are a different issue -- the 10 Injuries Rule always applies" (line 1938).
- **Decree compliance:** Correctly implements decree-021 (League Battle exemption for HP-based death, not injury-based).
- **Status:** CORRECT

### Death Check Ordering (After Heavily Injured Penalty)

- **Rule:** Death check should evaluate AFTER all HP loss is applied, including the heavily injured penalty. The heavily injured penalty can push HP below the death threshold.
- **Implementation:** All three code paths apply heavily injured penalty first, then run death check with the final unclamped HP. This is the correct ordering.
  - `damage.post.ts`: Lines 58-76 (penalty) then 78-96 (death check)
  - `move.post.ts`: Lines 98-115 (penalty) then 117-132 (death check)
  - `next-turn.post.ts`: Lines 85-100 (penalty) then 102-116 (death check)
- **Status:** CORRECT

### Decree Compliance

- **decree-001 (minimum damage):** Not directly relevant to injury mechanics. The heavily injured HP penalty is a "lose Hit Points" effect, not an "attack dealing damage" effect, so the minimum-1-damage floor does NOT apply to it. Implementation correctly treats it as direct HP loss. CORRECT.
- **decree-004 (massive damage temp HP):** The heavily injured penalty triggers after `calculateDamage()` which already handles temp HP absorption per decree-004. The penalty uses `damageResult.newInjuries` which correctly reflects injuries calculated after temp HP. CORRECT.
- **decree-005 (status CS auto-apply):** `damage.post.ts` and `move.post.ts` correctly call `syncStagesToDatabase()` when faint occurs to persist reversed CS effects. Dead status does not trigger CS reversal (Dead combatants keep their stages). Not a decree-005 issue. CORRECT.
- **decree-021 (League Battle):** HP-based death suppressed, injury-based death not suppressed, faint at 0 HP. Verified in `checkDeath()`. CORRECT.

## Summary

The core utility functions (`checkHeavilyInjured`, `calculateDeathHpThreshold`, `checkDeath`, `applyHeavilyInjuredPenalty`) are all mathematically correct and faithful to PTU 1.05 rules. The damage and move endpoints correctly integrate these functions with proper unclamped HP tracking, death check ordering, and League Battle exemption.

The unit tests are comprehensive and cover edge cases well (boundary values for thresholds, League suppression, unclamped HP, fainted-early-return). One test name is misleading (see MEDIUM-001) but the assertion itself is correct.

The primary rules concern is in the Standard Action trigger path: the turn-end hook applies the heavily injured penalty unconditionally rather than verifying that a Standard Action was actually consumed during the turn.

## Issues

### HIGH-001: Standard Action penalty applied unconditionally at turn end

**Severity:** HIGH
**Mechanic:** Heavily Injured HP penalty on Standard Action
**PTU Reference:** `core/07-combat.md#page-250`, lines 1900-1902: "Whenever a Heavily Injured Trainer or Pokemon takes a Standard Action during combat ... they lose Hit Points equal to the number of Injuries they currently have."

**Problem:** `next-turn.post.ts` lines 82-133 apply the heavily injured penalty at every turn end (excluding declaration phase), regardless of whether the combatant actually used a Standard Action. If a heavily injured combatant only uses a Shift Action, or passes their turn without using a Standard Action, the penalty should NOT trigger for the "Standard Action" path.

**Current behavior:** A heavily injured combatant that only shifts and then clicks "Next Turn" still loses HP equal to their injury count.

**Expected behavior:** The penalty should only apply if the combatant's `turnState.standardActionUsed` is `true` (or an equivalent check that a Standard Action was consumed this turn).

**Suggested fix:** Add a guard condition checking `currentCombatant.turnState?.standardActionUsed === true` before applying the penalty in `next-turn.post.ts`. For example:

```typescript
// Only apply if a Standard Action was actually used (PTU p.250)
const usedStandardAction = currentCombatant.turnState?.standardActionUsed === true
if (currentPhase !== 'trainer_declaration' && usedStandardAction) {
  // ... existing heavily injured penalty logic
}
```

Note: The "pass" action via `encounterCombat.pass()` sets `standardActionUsed: true`. If passing is considered using a Standard Action, the penalty correctly applies. The GM should verify whether a "pass" in their game constitutes using a Standard Action. In PTU, passing your Standard Action is still "taking" it (you chose to do nothing), so this may be intentionally correct. If so, document this design choice and consider whether a pure shift-only turn (no standard action consumed at all) should be exempt. The `pass` endpoint likely marks `standardActionUsed: true`, which would make the guard still fire for passes. The actual scenario that would change is: a combatant whose standard action was NOT consumed (e.g., they only shifted).

### MEDIUM-001: Misleading test name in death check tests

**Severity:** MEDIUM (test quality, not rules correctness)
**File:** `app/tests/unit/utils/injuryMechanics.test.ts:144-149`

**Problem:** Test is named `'does NOT declare death at exactly the threshold (100 HP Pokemon at -200)'` but the assertion expects `isDead: true` and `cause: 'hp_threshold'`. The test name contradicts its assertions. The assertion is correct (at exactly -200, which is <= -200, death occurs), but the name is confusing and could mislead future developers.

**Suggested fix:** Rename to `'declares death at exactly the threshold (100 HP Pokemon at -200)'`.

## Verdict

**CHANGES_REQUIRED**

One HIGH-severity issue must be addressed: the Standard Action guard for the heavily injured penalty at turn end. The core death and heavily injured utility functions are correct. The damage and move endpoint integrations are correct. The League Battle exemption is correctly implemented per decree-021.

## Required Changes

1. **HIGH-001:** Add a `turnState.standardActionUsed` guard to the heavily injured penalty in `next-turn.post.ts` so the penalty only triggers when a Standard Action was actually consumed during the turn. Alternatively, if the design intent is that ending a turn ALWAYS triggers the penalty (a deliberate simplification), document this as a decree-need for the human to rule on.

2. **MEDIUM-001:** Fix the misleading test name in `injuryMechanics.test.ts` line 144 to match its actual assertion.
