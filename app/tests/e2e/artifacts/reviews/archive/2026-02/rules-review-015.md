---
review_id: rules-review-015
target: refactoring-017
reviewer: game-logic-reviewer
verdict: APPROVED
date: 2026-02-17
commits_reviewed:
  - db8b0b6
  - 91e2e0d
  - 6d0860c
trigger: bug-fix-review
mechanics_verified:
  - critical-hit-damage-formula
  - critical-hit-detection
  - damage-base-table-lookup
ptu_references:
  - "07-combat.md:799-804 (Critical Hits rule)"
  - "07-combat.md:885-886 (DB table: DB6 = 2d6+8)"
  - "07-combat.md:2173-2174 (Gameplay example: DB6 crit = 4d6+16)"
  - "07-combat.md:837-841 (Damage Formula steps — step 4: modify for Critical Hit)"
  - "errata-2.md (no critical hit corrections)"
---

## PTU Rules Review: refactoring-017 — Critical Hit Damage Bugs

### Scope

Two client-side bugs made critical hit damage completely non-functional in the GM UI move workflow:

1. `rollCritical` doubled the dice (2d6 → 4d6) but not the flat modifier (+8 stayed +8 instead of +16)
2. `rollDamage()` hardcoded `false` for the critical parameter, so nat 20 accuracy rolls never triggered crit damage

### Lessons Checked

Reviewed `game-logic-reviewer.lessons.md` (2 active lessons). Neither lesson applies directly to this review:
- Lesson 1 (condition taxonomy audit): No status conditions involved.
- Lesson 2 (always file tickets): Noted — will file if any pre-existing PTU issue is found.

### Mechanics Verified

#### 1. Critical Hit Damage Formula

- **Rule (07-combat.md:800-804):** "A Critical Hit adds the Damage Dice Roll a second time to the total damage dealt, but does not add Stats a second time; for example, a DB6 Move Crit would be 4d6+16+Stat, or 30+Stat going by set damage."
- **Gameplay example (07-combat.md:2173-2174):** "DB 6, which has a damage roll of 2d6+8. This is doubled by the Critical Hit, making it 4d6+16"
- **DB table (07-combat.md:885-886):** DB6 = `2d6+8`
- **Errata:** No critical hit corrections in errata-2.md.
- **Implementation (diceRoller.ts:109-110):**
  ```typescript
  const doubledModifier = parsed.modifier * 2
  const total = diceSum + doubledModifier
  ```
- **Verification:** For DB6 (2d6+8): dice doubled to 4d6, modifier doubled to +16. This matches both the rule text ("adds the Damage Dice Roll a second time") and the worked example (4d6+16). The stat is added separately by the damage calculation layer (`useDamageCalculation.ts`), not by `rollCritical` — this correctly implements "does not add Stats a second time."
- **Status:** CORRECT

#### 2. Critical Hit Detection (Nat 20)

- **Rule (07-combat.md:800):** "On an Accuracy Roll of 20, a damaging attack is a Critical Hit."
- **Implementation (useMoveCalculation.ts:139):**
  ```typescript
  const isNat20 = naturalRoll === 20
  ```
- **Verification:** Checks the d20 natural roll against exactly 20. Correct per core rule.
- **Status:** CORRECT

#### 3. Critical Hit Flag Threading

- **Before fix (useMoveCalculation.ts:322, old):** `rollDamageBase(effectiveDB.value, false)` — hardcoded `false`, critical damage never applied.
- **After fix (useMoveCalculation.ts:320-326):**
  ```typescript
  const isCriticalHit = computed((): boolean => {
    return hitTargets.value.some(id => accuracyResults.value[id]?.isNat20)
  })
  // ...
  damageRollResult.value = rollDamageBase(effectiveDB.value, isCriticalHit.value)
  ```
- **Call chain verified:** `isCriticalHit` → `rollDamageBase(db, true)` → `rollCritical(notation)` (useDamageCalculation.ts:62-64). The full path from accuracy detection to doubled damage is now connected.
- **Status:** CORRECT

#### 4. Unit Test Expectations

- **Test (diceRoller.test.ts:147-154):** `Math.random() = 0.5` → `Math.floor(0.5 * 6) + 1 = 4` per die. Four d6 = 16. Doubled modifier = 16. Total = 32.
- **PTU cross-check:** DB6 crit with four 4s: `4+4+4+4+16 = 32`. This matches the rule's worked example structure (4d6+16, where stats are added later).
- **`result.modifier` = 8:** Stores the original notation modifier. This is acceptable — `modifier` is a property of the notation, not the crit-adjusted value. Nothing downstream reconstructs total from `dice + modifier`.
- **Status:** CORRECT

### Damage Formula Step Ordering

Verified against PTU Damage Formula (07-combat.md:837-841):

1. Find initial Damage Base
2. Apply Five/Double-Strike
3. Add DB modifiers (STAB) for final Damage Base
4. **Modify damage roll for Critical Hit if applicable** ← this is what the fix addresses
5. Roll damage or use set damage
6. Add relevant attack stat
7. Subtract relevant defense stat

The fix correctly operates at step 4. The `rollCritical` function handles the dice/modifier doubling, then the damage calculation layer (step 6-7) adds/subtracts stats separately. Stats are not doubled — correct per rule.

### Pre-Existing Observations

**Stale JSDoc comment (diceRoller.ts:87):** The function docstring reads "Roll dice for critical hit (roll dice twice, keep modifier once)" — the parenthetical is now inaccurate after the fix. The modifier is doubled, not kept once. This is a LOW severity code-quality nit, not a PTU correctness issue. Falls under Senior Reviewer scope.

**Multi-target accuracy rolls (PTU-INCORRECT, pre-existing):** PTU specifies one d20 roll per move use (07-combat.md:735-738), compared against each target's individual threshold. The app rolls one d20 per target (`useMoveCalculation.ts:133-134`), which causes (1) crit probability that scales with target count instead of flat 5%, and (2) asymmetric hit/miss for same-evasion targets. The `.some()` crit sharing introduced in 91e2e0d is a reasonable workaround (correct direction: all-or-nothing crit) but inherits the wrong probability. **Filed as refactoring-018** (PTU-INCORRECT, P2).

### Summary

| Mechanic | Rule Source | Status | Severity |
|----------|-----------|--------|----------|
| Crit damage formula (doubled dice + modifier) | 07-combat.md:800-804, 2173-2174 | CORRECT | — |
| Crit detection (nat 20) | 07-combat.md:800 | CORRECT | — |
| Crit flag threading (accuracy → damage) | 07-combat.md:837-841 (step 4) | CORRECT | — |
| Unit test math | DB table + crit rule | CORRECT | — |

- Mechanics checked: 4
- Correct: 4
- Incorrect: 0
- Needs review: 0

### Verdict

**APPROVED** — All four mechanics match PTU 1.05 rules exactly. The critical hit damage formula correctly doubles both dice and flat modifier per the worked example (DB6: 2d6+8 → 4d6+16). The detection-to-damage call chain is now properly connected. No errata corrections apply. No pre-existing PTU issues found in the touched code.
