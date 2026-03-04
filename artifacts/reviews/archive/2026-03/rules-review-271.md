---
review_id: rules-review-271
review_type: rules
reviewer: game-logic-reviewer
trigger: design-implementation
target_report: feature-021
domain: character-lifecycle
commits_reviewed:
  - 3912f8da
  - 6d54d85e
  - af9aa9fa
mechanics_verified:
  - trainer-overland-speed
  - trainer-swimming-speed
  - trainer-speed-vtt-integration
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
ptu_refs:
  - core/02-character-creation.md#page-16-step-6-derived-stats
  - core/02-character-creation.md#page-17-quick-start
reviewed_at: 2026-03-03T08:02:00Z
follows_up: null
---

## Mechanics Verified

### Trainer Overland Speed

- **Rule:** "Overland Movement Speed is how quickly a Trainer or Pokemon can move over flat land. For Trainers, this value is equal to three plus half the sum of their Athletics and Acrobatics Ranks. By default, this value is 5. Overland = 3 + [(Athl + Acro)/2]" (`core/02-character-creation.md#page-16`)
- **Implementation:** `computeTrainerDerivedStats` in `app/utils/trainerDerivedStats.ts` line 103: `const overland = 3 + Math.floor((athleticsRank + acrobaticsRank) / 2)`. Skill ranks are mapped via `SKILL_RANK_VALUES`: Pathetic=1, Untrained=2, Novice=3, Adept=4, Expert=5, Master=6. `combatantCapabilities.ts` calls `computeTrainerDerivedStats` from `getHumanOverlandSpeed` (line 23-28) and exposes it via `getOverlandSpeed` (line 97-103).
- **Status:** CORRECT

**Validation against rulebook example:** Lisa has Fitness Training background (Athletics = Adept = rank 4, Acrobatics = Novice = rank 3). Overland = 3 + floor((4 + 3) / 2) = 3 + 3 = 6. The rulebook states "Overland 6" for Lisa (`core/02-character-creation.md#page-16`, line 367). Formula produces correct output.

**Default value validation:** Untrained Athletics (2) + Untrained Acrobatics (2) = 3 + floor(4/2) = 3 + 2 = 5. Matches the rulebook statement "By default, this value is 5."

**Edge case validation (maximum):** Master Athletics (6) + Master Acrobatics (6) = 3 + floor(12/2) = 3 + 6 = 9. Reasonable upper bound.

**Edge case validation (minimum):** Pathetic Athletics (1) + Pathetic Acrobatics (1) = 3 + floor(2/2) = 3 + 1 = 4. Reasonable lower bound.

### Trainer Swimming Speed

- **Rule:** "Swimming Speed for a Trainer is equal to half of their Overland Speed." (`core/02-character-creation.md#page-16`)
- **Implementation:** `computeTrainerDerivedStats` in `app/utils/trainerDerivedStats.ts` line 106: `const swimming = Math.floor(overland / 2)`. The Swimming speed is derived from the already-computed Overland value, exactly as the rule specifies.
- **Status:** CORRECT

**Validation against rulebook example:** Lisa's Overland = 6. Swimming = floor(6 / 2) = 3. The rulebook states "Swim 3" for Lisa (`core/02-character-creation.md#page-16`, line 367). Formula produces correct output.

**Default value validation:** Default Overland = 5. Swimming = floor(5/2) = 2. A default trainer can swim at speed 2, which is reasonable.

**Note on `combatantCanSwim`:** The implementation (`combatantCapabilities.ts` line 48-55) now returns `true` for trainers when `getHumanSwimSpeed > 0`. Since the minimum possible Overland is 4 (Pathetic in both skills), minimum Swimming = floor(4/2) = 2, which is always > 0. This means all trainers can always swim per PTU rules. This is correct -- PTU does not distinguish between trainers who can/cannot swim; all trainers have a Swimming speed derived from Overland.

### Trainer Speed VTT Integration

- **Rule:** Movement on the VTT grid should use a combatant's actual movement capabilities, not hardcoded defaults. PTU p.231 (referenced via decree-011): "When using multiple different Movement Capabilities in one turn, such as using Overland on a beach and then Swim in the water, average the Capabilities and use that value."
- **Implementation:** `useGridMovement.ts` was updated in two places:
  1. `getTerrainAwareSpeed` (line 71-91): For human combatants, delegates to `getSwimSpeed(combatant)` on water terrain and `getOverlandSpeed(combatant)` on all other terrain, replacing the previous hardcoded `DEFAULT_MOVEMENT_SPEED` return.
  2. `getSpeed` fallback (line 274-277): When no terrain data exists, uses `getOverlandSpeed(combatant)` instead of `DEFAULT_MOVEMENT_SPEED`, ensuring skill-derived speed is used even outside terrain-enabled encounters.
- **Status:** CORRECT

**Speed averaging integration:** The `calculateAveragedSpeed` function (line 163-209) already calls `getOverlandSpeed` and `getSwimSpeed`, which now return skill-derived values for trainers. This means path-based speed averaging (per decree-011) automatically uses the correct trainer speeds without any additional changes needed. A trainer with Overland 7 crossing into water with Swimming 3 would get averaged speed = floor((7+3)/2) = 5. Correct per PTU p.231.

## Decree Compliance

Scanned all 42 active decrees. The following are relevant to this domain:

- **decree-011** (speed averaging on terrain boundaries): Implementation correctly integrates with existing averaging. Trainer-derived speeds flow through `getOverlandSpeed`/`getSwimSpeed` into `calculateAveragedSpeed`. No violation.
- **decree-022, decree-026, decree-027, decree-037** (character-lifecycle domain decrees): These address branching classes, Martial Artist classification, Pathetic skill edge blocking, and skill rank sources. None are affected by the speed derivation change, which only reads skill ranks without modifying them. No violation.

No decree violations found. No new ambiguities discovered.

## Errata Check

Searched `books/markdown/errata-2.md` for terms: "overland", "swimming", "trainer speed", "movement capabilities". No errata entries found that modify the trainer Overland or Swimming speed formulas. The core text formulas stand as authoritative.

## Summary

The implementation correctly derives trainer Overland and Swimming speeds from Athletics and Acrobatics skill ranks per PTU Core p.16. The formula `Overland = 3 + floor((Athletics rank + Acrobatics rank) / 2)` and `Swimming = floor(Overland / 2)` are both correctly implemented in `trainerDerivedStats.ts` (pre-existing utility) and correctly wired into the VTT movement system via `combatantCapabilities.ts` and `useGridMovement.ts`.

The implementation was validated against the rulebook's Lisa example (Athletics Adept, Acrobatics Novice -> Overland 6, Swim 3) and produces identical results. Edge cases (Pathetic skills, Master skills, default Untrained) all produce mathematically correct values. No errata contradicts the formulas. No decree violations.

**Note on task description discrepancy:** The task description stated the formula as "Overland = 2 + max(Athletics, Acrobatics) / 2" which does not match PTU rules. The implementation correctly uses the actual PTU formula "Overland = 3 + floor((Athletics + Acrobatics) / 2)" which sums both skills rather than taking the max, and uses base 3 not base 2. The code is correct; the task description contained an incorrect formula.

## Rulings

No new rulings required. All mechanics are unambiguous and correctly implemented per PTU RAW.

## Verdict

**APPROVED** -- All PTU trainer movement speed mechanics are correctly implemented. Zero issues found across all severity levels.

## Required Changes

None.
