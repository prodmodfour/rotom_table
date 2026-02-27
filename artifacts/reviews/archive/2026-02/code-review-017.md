---
review_id: code-review-017
target: refactoring-017
reviewer: senior-reviewer
verdict: APPROVED
date: 2026-02-17
commits_reviewed:
  - db8b0b6
  - 91e2e0d
  - 6d0860c
files_reviewed:
  - app/utils/diceRoller.ts
  - app/composables/useMoveCalculation.ts
  - app/composables/useDamageCalculation.ts
  - app/tests/unit/utils/diceRoller.test.ts
scenarios_to_rerun: []
---

## Review: refactoring-017 — Critical Hit Damage Bugs

### Scope

Two independent bugs that made critical hit damage completely non-functional in the GM UI move workflow:

1. `rollCritical` doubled dice (2d6 → 4d6) but not the flat modifier (+8 stays +8 instead of +16)
2. `rollDamage()` hardcoded `false` for the critical parameter, so nat 20 accuracy rolls never triggered crit damage

### Status Table

| Task | Status |
|------|--------|
| Finding 1: Double flat modifier in `rollCritical` | DONE (db8b0b6) |
| Finding 2: Thread `isCriticalHit` flag to `rollDamageBase` | DONE (91e2e0d) |
| Unit test update | DONE (6d0860c) |

### Verification

**PTU rules confirmed:** 07-combat.md:801-804 states "A Critical Hit adds the Damage Dice Roll a second time" with worked example: DB6 (2d6+8) crit = 4d6+16+Stat. The book's gameplay example (line 2173-2174) independently confirms: "This is doubled by the Critical Hit, making it 4d6+16."

**Finding 1 — `rollCritical` (diceRoller.ts:109-110):**
- `doubledModifier = parsed.modifier * 2` — correct
- `total = diceSum + doubledModifier` — correct
- Breakdown string shows doubled modifier — correct
- `DiceRollResult.modifier` still stores original `parsed.modifier` — acceptable; this field represents the notation's modifier, and nothing downstream reconstructs the total from `dice + modifier`

**Finding 2 — `isCriticalHit` (useMoveCalculation.ts:320-322):**
- `hitTargets.value.some(id => accuracyResults.value[id]?.isNat20)` — correct for the existing single-roll architecture
- Call chain verified: `rollDamage()` → `rollDamageBase(effectiveDB, isCriticalHit.value)` → `rollCritical(notation)` when critical, `roll(notation)` otherwise
- The `isCriticalHit` computed is exposed in the composable return — clean for future UI consumption (the "CRIT:" prefix in the breakdown string already provides visual feedback)

**Multi-target crit note:** The `.some()` approach means if ANY hit target scored nat 20, ALL targets get the critical damage roll from the single shared roll. The ticket explicitly acknowledged this limitation ("This requires the `rollDamage()` function to know which target's accuracy result to check (currently it applies to all targets)"). Per-target crit would require per-target damage rolls — a separate architectural change, not in scope here. The current behavior (crit for all if any critted) is better than the previous behavior (crit for none, ever).

**Test (diceRoller.test.ts:147-155):**
- Math verified: `Math.random() = 0.5` → `Math.floor(0.5 * 6) + 1 = 4` per die. Four dice = 16. Doubled modifier = 16. Total = 32. Correct.
- `result.modifier` correctly asserted as 8 (original notation modifier)
- All 25 diceRoller tests pass

### What Looks Good

- Minimal, focused changes — one file per finding, no scope creep
- Commit granularity is exactly right (fix, fix, test — three separate commits)
- The `doubledModifier` variable name makes the intent clear
- Resolution log in the ticket is thorough with per-commit descriptions

### Issues

None.

### Verdict

**APPROVED** — Both findings correctly fixed per PTU rules. Test updated with correct expectations. No regressions (25/25 unit tests pass). Proceed to Game Logic Reviewer.
