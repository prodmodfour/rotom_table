---
review_id: rules-review-222
review_type: rules
reviewer: game-logic-reviewer
trigger: design-implementation
target_report: feature-009
domain: character-lifecycle
commits_reviewed:
  - 4b2a0ac9
  - 4ad71c74
  - 0c8194a0
  - ddb17b85
mechanics_verified:
  - trainer-xp-bank
  - auto-level-trigger
  - new-species-xp-detection
  - xp-deduction-floor
  - max-level-cap
  - multi-level-jump
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 1
ptu_refs:
  - core/11-running-the-game.md#Trainer Levels and Milestones (p.461)
  - core/11-running-the-game.md#Calculating Trainer Experience (p.461-462)
  - core/07-combat.md#Experience example (p.259)
  - errata-2.md#Capture Mechanic Changes (p.8)
reviewed_at: 2026-03-01T14:30:00Z
follows_up: null
---

## Mechanics Verified

### 1. Trainer XP Bank Accumulation

- **Rule:** "Whenever a Trainer reaches 10 Experience or higher, they immediately subtract 10 Experience from their Experience Bank and gain 1 Level." (`core/11-running-the-game.md#p.461`)
- **Implementation:** `applyTrainerXp()` in `app/utils/trainerExperience.ts` calculates `levelsFromXp = Math.floor(rawTotal / TRAINER_XP_PER_LEVEL)` and `remainingXp = rawTotal - (levelsFromXp * TRAINER_XP_PER_LEVEL)`. This correctly implements the "subtract 10 and gain 1 level" rule, including handling the "immediately" aspect by resolving all level-ups in a single pass.
- **Status:** CORRECT

### 2. XP Per Level Threshold (10)

- **Rule:** "Whenever a Trainer reaches 10 Experience or higher, they immediately subtract 10 Experience" (`core/11-running-the-game.md#p.461`)
- **Implementation:** `TRAINER_XP_PER_LEVEL = 10` constant used throughout. Tested explicitly with bank at 9 + 1 = 10 triggering level-up with bank 0 remainder.
- **Status:** CORRECT

### 3. Multi-Level Jumps

- **Rule:** The "immediately subtract 10" language implies repeated application: bank 23 means subtract 10 twice, gain 2 levels, bank 3.
- **Implementation:** `Math.floor(rawTotal / 10)` correctly computes the number of full 10-XP chunks. Test T1.2 validates: bank 8 + 15 = 23 yields 2 levels with remainder 3. Triple level-up and exact multiples of 10 are also tested.
- **Status:** CORRECT

### 4. Milestone Independence

- **Rule:** "Leveling Up through a Milestone does not affect your Experience Bank." (`core/11-running-the-game.md#p.461`)
- **Implementation:** The XP system operates independently from any milestone/manual level change mechanism. The XP endpoint only modifies `trainerXp` and `level` based on the XP bank calculation. Manual level changes (via character PUT) do not touch the XP bank. This separation is architecturally correct.
- **Status:** CORRECT

### 5. XP Bank Floor (Cannot Go Negative)

- **Rule:** Implied by "subtract 10 Experience from their Experience Bank" -- the bank is a non-negative accumulator.
- **Implementation:** `Math.max(0, currentXp + xpToAdd)` clamps the bank floor at 0. Test T1.4 validates: bank 3 with -10 deduction yields bank 0, not -7.
- **Status:** CORRECT

### 6. Deduction Does Not Reduce Level

- **Rule:** No PTU rule supports level loss through XP deduction. Levels are only gained, never lost.
- **Implementation:** `applyTrainerXp` never produces negative `levelsGained`. Level deduction is architecturally impossible -- the function only adds levels when `levelsFromXp > 0`, which requires `rawTotal >= 10`. Since `rawTotal = Math.max(0, ...)`, negative XP awards cannot trigger level gains or losses.
- **Status:** CORRECT

### 7. Max Level Cap (50)

- **Rule:** PTU does not define an explicit max trainer level, but level 50 is the practical limit used in the system (per CLAUDE.md and design spec).
- **Implementation:** `TRAINER_MAX_LEVEL = 50`. When `currentLevel >= 50`, the function returns `levelsGained: 0` and the bank continues to accumulate. When a multi-level jump would exceed 50, `maxLevelsGainable = 50 - currentLevel` caps the actual levels gained, and excess XP is returned to the bank. Test T1.3 validates both scenarios.
- **Status:** CORRECT

### 8. New Species XP Detection

- **Rule:** "Whenever a Trainer catches, hatches, or evolves a Pokemon species they did not previously own, they gain +1 Experience." (`core/11-running-the-game.md#p.461`)
- **Implementation:** `isNewSpecies()` provides case-insensitive, whitespace-trimmed comparison against the `capturedSpecies` array. The `capturedSpecies` field is stored as a JSON array on `HumanCharacter`. The function is correctly implemented as a pure utility. Note: the function is not yet wired into any capture/hatch/evolve flow -- this is explicitly deferred to P1 per the design spec. P0 provides the data model and utility function only; the GM manually awards XP.
- **Status:** CORRECT (P0 scope)

### 9. Significance-Based XP Suggestions

- **Rule:** "A scuffle with weak or average wild Pokemon shouldn't be worth any Trainer experience most of the time. An average encounter with other Trainers or with stronger wild Pokemon usually merits 1 or 2 Experience at most. Significant battles that do not quite merit a Milestone award by themselves should award 3, 4, or even 5 Experience." (`core/11-running-the-game.md#p.462`)
- **Implementation:** `TRAINER_XP_SUGGESTIONS` maps tiers: none=0, low=1, moderate=2, significant=3, major=4, critical=5. The maximum suggestion is 5, which aligns with both PTU's stated range and decree-030 (significance cap at x5). These are UI suggestions only, not enforcement -- the custom input allows -100 to +100.
- **Status:** CORRECT. Per decree-030, presets correctly cap at 5.

### 10. API Input Validation

- **Rule:** (Implementation quality, not PTU rule, but affects correctness)
- **Implementation:** The XP endpoint validates: integer-only amounts, non-zero, range -100 to +100, character existence. The zero-amount rejection prevents no-op API calls. The range limit prevents accidental extreme XP awards.
- **Status:** CORRECT

## Summary

The P0 implementation of the trainer XP bank system is **fully correct** against PTU 1.05 rules. All core mechanics are properly implemented:

1. The 10-XP-per-level threshold matches PTU Core p.461 exactly.
2. Multi-level jumps are handled correctly via integer division.
3. The XP bank floor at 0 prevents negative balances.
4. Milestone independence is maintained through architectural separation.
5. Max level capping at 50 correctly handles excess XP redistribution to the bank.
6. The `isNewSpecies` utility is correctly prepared for P1 capture integration.
7. Per decree-030, XP suggestion presets correctly cap at 5.

The 47 unit tests (24 pure utility + 13 API endpoint + 10 composable) provide comprehensive coverage of the PTU mechanics, including edge cases like multi-level jumps at max level boundary, deduction clamping, and exact-threshold level-ups.

## Rulings

### MEDIUM-01: `capturedSpecies` naming slightly undersells PTU scope

PTU Core p.461 states that +1 XP is earned for any **new species** from catches, hatches, **or** evolves. The field name `capturedSpecies` and the `isNewSpecies` function's JSDoc ("Check if a species is new for a trainer (not in their capturedSpecies list)") suggest only captures are tracked. The underlying implementation is species-agnostic (it's just a string array), so the data model is technically correct, but the naming may lead P1 implementers to miss the hatch/evolve triggers.

**Recommendation:** When P1 wires the automatic +1 XP, ensure evolve and hatch events also add to the species list and trigger the XP award. Consider renaming `capturedSpecies` to `ownedSpecies` or `knownSpecies` in P1 to avoid confusion. This is not a P0 blocker since P0 is manual GM awards only.

**Severity:** MEDIUM (naming concern, not a rule violation in P0)

## Verdict

**APPROVED**

The implementation correctly implements all PTU 1.05 trainer XP mechanics within the P0 scope. The core formula (10 XP = 1 level), bank floor (>= 0), multi-level jumps, max level cap, milestone independence, and significance suggestion caps are all verified correct. No decree violations found. The MEDIUM-01 naming concern should be addressed in P1 but does not block P0.

## Required Changes

None. APPROVED with one MEDIUM advisory for P1 consideration.
