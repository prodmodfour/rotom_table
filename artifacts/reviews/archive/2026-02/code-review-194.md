---
review_id: code-review-194
review_type: code
reviewer: senior-reviewer
trigger: bug-fix
target_report: ptu-rule-086+087+088
domain: capture, pokemon-lifecycle, encounter-tables
commits_reviewed:
  - 569d030
  - 00b2f1f
  - 9f0ff20
  - 372b9b1
files_reviewed:
  - app/utils/captureRate.ts
  - app/server/api/capture/attempt.post.ts
  - app/composables/useCapture.ts
  - app/server/services/pokemon-generator.service.ts
  - app/server/services/csv-import.service.ts
  - app/utils/encounterBudget.ts
  - app/utils/experienceCalculation.ts
  - app/composables/useEncounterBudget.ts
  - app/server/utils/significance-validation.ts
  - app/prisma/schema.prisma
  - books/markdown/core/05-pokemon.md (tutor points rule)
  - books/markdown/core/07-combat.md (capture example)
  - books/markdown/core/09-gear-and-items.md (Poke Ball chart)
  - books/markdown/core/11-running-the-game.md (significance tiers)
  - decrees/decree-013.md
  - decrees/decree-014.md
  - decrees/decree-015.md
  - artifacts/tickets/open/ptu-rule/ptu-rule-086.md
  - artifacts/tickets/open/ptu-rule/ptu-rule-087.md
  - artifacts/tickets/open/ptu-rule/ptu-rule-088.md
verdict: CHANGES_REQUIRED
issues_found:
  critical: 1
  high: 0
  medium: 0
reviewed_at: 2026-02-27T09:00:00+00:00
follows_up: (none -- first review)
---

## Review Scope

First review of three P3 PTU rule fixes implemented in session 45 slave-3:

1. **ptu-rule-086** -- Capture modifier sign convention inversion (1 file, 1 commit)
2. **ptu-rule-087** -- Pokemon tutor point calculation missing at generation (1 file, 1 commit)
3. **ptu-rule-088** -- Significance tier preset misalignment (2 files, 1 commit)
4. **Ticket updates** (3 files, 1 commit)

Total: 7 files changed, 36 insertions, 16 deletions across 4 commits.

### Decree Compliance

- **decree-013** (capture-system-version): The fix operates within the 1d100 capture system. Compliant.
- **decree-014** (stuck-slow-capture-bonus): The fix does not touch status/stuck/slow logic. Not affected.
- **decree-015** (capture-hp-percentage-base): The fix does not touch HP percentage logic. Not affected.

## Issues

### CRITICAL

#### C1: csv-import.service.ts fails to compile after tutorPoints becomes required (ptu-rule-087)

**File:** `app/server/services/csv-import.service.ts`, lines 362-391

The `GeneratedPokemonData` interface now has a required `tutorPoints: number` field (added in commit 00b2f1f). However, `csv-import.service.ts` builds a `GeneratedPokemonData` object manually at line 362 without including `tutorPoints`. This is a TypeScript compilation error -- the object literal does not satisfy the interface.

The CSV import path constructs its own `GeneratedPokemonData` instead of calling `generatePokemonData()`, so it was not automatically fixed by the tutor point calculation added to the generator. The fix is straightforward: add `tutorPoints: 1 + Math.floor(pokemon.level / 5)` to the object literal at line 390 (or import and call the formula).

This is CRITICAL because it breaks the build for any code path that imports or type-checks against `csv-import.service.ts`.

## What Looks Good

### ptu-rule-086: Capture modifier sign fix

The fix is correct and well-targeted. PTU Core p.271 states: "rolling 1d100 and subtracting the Trainer's Level. The Type of Ball will also modify the Capture Roll." The Poke Ball chart lists Great Ball as -10, Ultra Ball as -15 -- these are modifiers that "modify the Capture Roll" (i.e., are added to the roll). The worked example in Chapter 7 (p.255) confirms: "Sylvana rolls a 68... and subtracts her Trainer Level, 4, for a total of 64" with a basic ball (+0 modifier).

The old formula `roll - trainerLevel - modifiers` with a -10 modifier yielded `roll - trainerLevel - (-10) = roll - trainerLevel + 10`, making capture harder. The new formula `roll - trainerLevel + modifiers` with a -10 modifier correctly yields `roll - trainerLevel + (-10) = roll - trainerLevel - 10`, making capture easier. This aligns with the PTU sign convention.

The `attempt.post.ts` endpoint passes `body.modifiers || 0` which is a pre-calculated value from the GM. The `useCapture` composable passes it through transparently. The sign convention change is now consistent end-to-end.

### ptu-rule-087: Tutor point calculation

The formula `1 + Math.floor(level / 5)` correctly implements PTU Core p.199: "Each Pokemon, upon hatching, starts with a single precious Tutor Point. Upon gaining Level 5, and every other level evenly divisible by 5 (10, 15, 20, etc.), Pokemon gain another Tutor Point."

Verification:
- Level 1: 1 + 0 = 1 (correct -- 1 starting tutor point)
- Level 5: 1 + 1 = 2 (correct -- gains one at level 5)
- Level 10: 1 + 2 = 3 (correct)
- Level 20: 1 + 4 = 5 (correct)
- Level 100: 1 + 20 = 21 (correct)

The value flows through three paths correctly:
1. `generatePokemonData()` computes it (line 167)
2. `createPokemonRecord()` persists it to Prisma (line 243)
3. `createdPokemonToEntity()` maps it to the combatant entity (line 318)

### ptu-rule-088: Significance tier realignment

The new values correctly match PTU Core Chapter 11 (p.460):
- Insignificant: x1-x1.5 (unchanged, matches PTU "x1 to x1.5")
- Everyday: x2-x3 (unchanged, matches PTU "x2 or x3")
- Significant: x4-x5 (was x3-x4, now matches PTU "x4 to x5")

The extended homebrew tiers (Climactic x5-x7, Legendary x7-x10) were shifted upward to avoid overlap with the corrected Significant tier. This is a reasonable design choice.

The `experienceCalculation.ts` derives its `SIGNIFICANCE_PRESETS` from the canonical `encounterBudget.ts` via `Object.fromEntries(BUDGET_PRESETS.map(...))`, so the values propagate automatically. The comment was correctly updated to reflect the new defaults: `{ insignificant: 1.0, everyday: 2.0, significant: 4.0, climactic: 6.0, legendary: 8.0 }`.

All UI components (`SignificancePanel.vue`, `StartEncounterModal.vue`, `GenerateEncounterModal.vue`, `BudgetGuide.vue`, `XpDistributionModal.vue`) reference `preset.defaultMultiplier` dynamically, so they inherit the new values without code changes.

Existing encounter records in the DB store the actual `significanceMultiplier` float value, not the tier name, so previously created encounters retain their original multiplier. Only new encounters pick up the corrected defaults. This is correct behavior.

### Commit quality

Each fix is a single focused commit touching only the relevant files. Commit messages are descriptive with clear rationale. Ticket updates are batched into a single housekeeping commit. Granularity is appropriate.

## Verdict

**CHANGES_REQUIRED**

One critical issue must be resolved before approval: the `csv-import.service.ts` compilation break caused by the new required `tutorPoints` field on `GeneratedPokemonData`.

## Required Changes

1. **[CRITICAL] Add `tutorPoints` to csv-import GeneratedPokemonData construction** -- In `app/server/services/csv-import.service.ts` around line 390, add `tutorPoints: 1 + Math.floor(pokemon.level / 5)` to the `generatedData` object literal. This fixes the TypeScript compilation error introduced by making `tutorPoints` a required field on the interface. Note: CSV imports represent existing Pokemon sheets, so the calculated value is the correct default (the sheet may have spent some tutor points, but we cannot know that from the CSV -- the base calculation is the right fallback).
