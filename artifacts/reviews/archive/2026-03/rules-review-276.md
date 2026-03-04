---
review_id: rules-review-276
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: feature-021
domain: character-lifecycle
commits_reviewed:
  - e670e023
  - 7229ec97
  - 80b31073
  - 6d54d85e
  - 3912f8da
files_reviewed:
  - app/utils/combatantCapabilities.ts
  - app/utils/trainerDerivedStats.ts
  - app/tests/unit/utils/combatantCapabilities.test.ts
  - app/composables/useGridMovement.ts
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
reviewed_at: 2026-03-03T17:15:00Z
follows_up: rules-review-271
---

## Review Scope

Game logic re-review of feature-021 fix cycle. Focus on PTU formula correctness in the refactored code and new unit test assertions. Previous rules-review-271 approved all mechanics; this review verifies the fix cycle preserved correctness and that test assertions match PTU rulebook values.

## PTU Formula Verification

### Overland Speed (PTU Core p.16, line 349)

**Book text:** "Overland = 3 + [(Athl + Acro)/2]"

**Implementation** (`trainerDerivedStats.ts` line 103):
```typescript
const overland = 3 + Math.floor((athleticsRank + acrobaticsRank) / 2)
```

**Verification against book example (PTU Core p.16, line 367):**
Lisa has Fitness Training background (Adept Athletics = rank 4, Novice Acrobatics = rank 3).
- Book states: Overland 6
- Formula: 3 + floor((4+3)/2) = 3 + 3 = 6. Correct.

**Test assertion verification:**
| Test Case | Skills | Expected | Formula | Correct |
|-----------|--------|----------|---------|---------|
| Adept Athl + Novice Acro | 4+3 | 6 | 3+floor(7/2)=6 | Yes |
| Expert + Expert | 5+5 | 8 | 3+floor(10/2)=8 | Yes |
| Master + Master | 6+6 | 9 | 3+floor(12/2)=9 | Yes |
| Empty (Untrained defaults) | 2+2 | 5 | 3+floor(4/2)=5 | Yes |
| Pathetic + Pathetic | 1+1 | 4 | 3+floor(2/2)=4 | Yes |

All 5 Overland test assertions match the PTU formula exactly.

### Swimming Speed (PTU Core p.16, lines 350-351)

**Book text:** "Swimming Speed for a Trainer is equal to half of their Overland Speed."

**Implementation** (`trainerDerivedStats.ts` line 106):
```typescript
const swimming = Math.floor(overland / 2)
```

**Verification against book example:** Lisa: Overland 6 -> Swim = floor(6/2) = 3. Book states "Swim 3". Correct.

**Test assertion verification:**
| Test Case | Overland | Expected Swim | Formula | Correct |
|-----------|----------|---------------|---------|---------|
| Adept/Novice | 6 | 3 | floor(6/2)=3 | Yes |
| Untrained defaults | 5 | 2 | floor(5/2)=2 | Yes |
| Novice Athl/Adept Acro | 6 | 3 | floor(6/2)=3 | Yes |

All 3 Swimming test assertions are correct.

### combatantCanSwim for Humans (PTU Core p.16)

**Claim:** All trainers can swim because minimum Overland is 4, giving minimum Swimming of 2.

**Verification:** The minimum possible skill ranks are Pathetic (rank 1) for both Athletics and Acrobatics. Overland = 3 + floor((1+1)/2) = 3 + 1 = 4. Swimming = floor(4/2) = 2. Since Swimming >= 2 > 0, all trainers have a swimming speed. The `return true` simplification is correct per PTU rules.

**Test coverage:** Two test cases confirm this -- default human and Pathetic-in-both-skills human both return `true` for `combatantCanSwim`.

### Pokemon Speed Derivation (Unchanged)

**Verification:** Pokemon speeds remain capabilities-based:
- `getOverlandSpeed` returns `pokemon.capabilities?.overland ?? 5` (line 95)
- `getSwimSpeed` returns `pokemon.capabilities?.swim ?? 0` (line 109)
- `combatantCanSwim` checks `pokemon.capabilities?.swim ?? 0 > 0` (line 44)

Four regression tests confirm Pokemon path is unaffected by the refactoring. Default fallbacks (overland=5, swim=0) are correct -- a Pokemon without capabilities data gets a reasonable Overland default and no Swimming.

### Skill Rank Mapping (PTU Core p.34)

**Implementation** (`trainerDerivedStats.ts` lines 37-44):
```typescript
Pathetic: 1, Untrained: 2, Novice: 3, Adept: 4, Expert: 5, Master: 6
```

These match the PTU 1.05 skill rank progression. The default of Untrained (rank 2) for missing skills is correct -- PTU Core p.12 states all skills start at Untrained.

### getHumanDerivedSpeeds Consolidation

The consolidated function (`combatantCapabilities.ts` lines 28-34) calls `computeTrainerDerivedStats` with the same `{ skills, weightKg }` input as the previous separate helpers. The output extraction (`derived.overland`, `derived.swimming`) is identical. No formula change occurred during the refactoring -- only the call pattern was optimized. Correctness is preserved.

## Decree Compliance

- **decree-011** (speed averaging): `calculateAveragedSpeed` correctly averages distinct movement capabilities per the decree ruling. The refactoring did not alter this function's averaging logic.
- **decree-037** (skill ranks from Edge slots only): The implementation reads `human.skills` as stored data and does not grant or modify skill ranks. No violation.

## Issues

None.

## What Looks Good

1. All test assertions are mathematically verified against PTU Core p.16 formulas and the worked example (Lisa's character).
2. The `combatantCanSwim` simplification for humans is provably correct via minimum-bound analysis.
3. Pokemon speed derivation paths are completely unaffected by the refactoring, confirmed by 4 dedicated regression tests.
4. Skill rank numeric mapping matches the PTU rulebook exactly.
5. No formulas were altered during the consolidation refactoring -- only the call pattern changed.

## Verdict

**APPROVED**

All PTU formulas are correct. Test assertions match rulebook values. The refactoring preserved all game logic without introducing any rules regression. No new ambiguities discovered.
