---
review_id: code-review-199
review_type: code
reviewer: senior-reviewer
trigger: bug-fix
target_report: ptu-rule-086+087+088
domain: capture, pokemon-lifecycle, encounter-tables
commits_reviewed:
  - 6fee2cb
  - 9f8c717
  - 569d030
  - 00b2f1f
  - 9f0ff20
files_reviewed:
  - app/utils/captureRate.ts
  - app/server/services/pokemon-generator.service.ts
  - app/server/services/csv-import.service.ts
  - app/utils/encounterBudget.ts
  - app/utils/experienceCalculation.ts
  - app/composables/useCapture.ts
  - app/server/api/capture/attempt.post.ts
  - app/server/utils/significance-validation.ts
  - app/components/encounter/CaptureRateDisplay.vue
  - app/prisma/schema.prisma
  - decrees/decree-013.md
  - decrees/decree-014.md
  - decrees/decree-015.md
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
reviewed_at: 2026-02-27T18:30:00+00:00
follows_up: code-review-194
---

## Review Scope

Re-review of the fix cycle for three P3 PTU rule fixes, following up on code-review-194 which found CRITICAL-1: missing `tutorPoints` in `csv-import.service.ts`. The fix was applied in commit `6fee2cb` and documented in `9f8c717`.

This is a CODE re-review only. rules-review-171 already APPROVED all game logic.

### Commits Under Review

| Commit | Description | Files |
|--------|-------------|-------|
| `569d030` | Capture modifier sign convention fix | `captureRate.ts` |
| `00b2f1f` | Tutor point calculation in pokemon generator | `pokemon-generator.service.ts` |
| `9f0ff20` | Significance tier preset realignment | `encounterBudget.ts`, `experienceCalculation.ts` |
| `6fee2cb` | **CRITICAL-1 fix:** Add tutorPoints to CSV import | `csv-import.service.ts` |
| `9f8c717` | Ticket documentation update | `ptu-rule-087.md` |

### Decree Compliance

- **decree-013** (capture-system-version): The capture fix operates within the 1d100 system. Compliant.
- **decree-014** (stuck-slow-capture-bonus): The sign convention fix does not touch status/stuck/slow logic. Not affected. Verified `captureRate.ts` lines 130-136: Stuck (+10) and Slow (+5) remain separate from volatile, per decree-014.
- **decree-015** (capture-hp-percentage-base): The fix does not touch HP percentage logic. Not affected. Verified `captureRate.ts` line 70: uses `maxHp` (real max HP), per decree-015.

## Issues

None found. The CRITICAL-1 from code-review-194 has been properly resolved.

## CRITICAL-1 Resolution Verification

### The Fix (6fee2cb)

Line 388 of `csv-import.service.ts` now includes:
```typescript
tutorPoints: 1 + Math.floor(pokemon.level / 5),
```

This was added to the `generatedData: GeneratedPokemonData` object literal at line 362.

### Completeness Check: All GeneratedPokemonData Construction Sites

Exhaustive grep for `GeneratedPokemonData` across the codebase confirms exactly **two** code paths that construct this interface:

1. **`generatePokemonData()`** in `pokemon-generator.service.ts` (line 84) -- the standard generation path. Computes `tutorPoints` at line 167, includes it in the return object at line 188.

2. **`createPokemonFromCSV()`** in `csv-import.service.ts` (line 362) -- the manual CSV import path. Now includes `tutorPoints` at line 388 using the same formula.

Both paths use the identical formula: `1 + Math.floor(level / 5)`. The formula is correct per PTU Core p.199.

### Data Flow Verification

The `tutorPoints` value propagates through three downstream paths, all verified:

1. **`createPokemonRecord()`** (line 243): `tutorPoints: data.tutorPoints` -- writes to Prisma DB.
2. **`createdPokemonToEntity()`** (line 318): `tutorPoints: data.tutorPoints` -- maps to combat entity.
3. **Prisma schema** (line 144): `tutorPoints Int @default(0)` -- DB column exists with correct type.

No orphaned `tutorPoints: 0` hardcodings remain in production code. The only instance is in a test fixture (`combatant.service.test.ts:58`), which is a mock and not a production code path.

## What Looks Good

### ptu-rule-086: Capture modifier sign convention (569d030)

The fix from `roll - trainerLevel - modifiers` to `roll - trainerLevel + modifiers` is correct. PTU ball modifiers are stored as negative values (Great Ball = -10, Ultra Ball = -15), so `+modifiers` correctly reduces the roll when modifiers are negative. The comment at lines 198-200 clearly documents the rationale.

The `attempt.post.ts` endpoint (line 91) passes `body.modifiers || 0` unchanged. The `useCapture` composable passes the modifiers through transparently. The UI (`CaptureRateDisplay.vue`) only displays capture rate breakdown -- it does not reference or display the roll modifier, so no UI changes were needed. End-to-end sign convention is now consistent.

### ptu-rule-087: Tutor point calculation (00b2f1f + 6fee2cb)

The formula `1 + Math.floor(level / 5)` correctly implements PTU Core p.199. Adding it as a required field on `GeneratedPokemonData` was the right call -- it ensures no future code path can silently omit it. The CRITICAL-1 fix in `csv-import.service.ts` completes the coverage.

### ptu-rule-088: Significance tier presets (9f0ff20)

The realigned values are correct:
- Significant: x4.0-x5.0 (default 4.0) -- matches PTU "x4 to x5"
- Climactic: x5.0-x7.0 (default 6.0) -- extended homebrew
- Legendary: x7.0-x10.0 (default 8.0) -- extended homebrew

The `experienceCalculation.ts` derives its presets from `encounterBudget.ts` via `Object.fromEntries(BUDGET_PRESETS.map(...))`, so the values propagate automatically. The inline comment at line 62 was correctly updated.

All UI consumers (`SignificancePanel.vue`, `StartEncounterModal.vue`, `GenerateEncounterModal.vue`, `XpDistributionModal.vue`) reference `.defaultMultiplier` dynamically. The server-side `significance-validation.ts` validates tier names (not multiplier values), so it requires no changes.

### Commit Quality

Five focused commits, each touching only the relevant files. Granularity is appropriate -- each fix is atomic and independently reviewable. Commit messages are descriptive.

### Minor Observation (Non-Blocking)

The ticket doc update (commit `9f8c717`) references commit hash `7a1e409` for the CSV import fix, but the actual fix commit is `6fee2cb`. This appears to be a hash from before the commit was rebased/recreated. This is purely a documentation artifact and does not affect any code or pipeline flow.

## Verdict

**APPROVED**

The CRITICAL-1 from code-review-194 has been resolved correctly. All code paths that construct `GeneratedPokemonData` now include the required `tutorPoints` field. The three PTU rule fixes (capture sign convention, tutor points, significance tiers) are correct, well-scoped, and properly documented. No new issues found.

## Required Changes

None. All fixes pass review.
