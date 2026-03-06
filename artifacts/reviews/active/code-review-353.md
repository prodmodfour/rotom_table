---
review_id: code-review-353
review_type: code
reviewer: senior-reviewer
trigger: bug-fix
target_report: bug-057
domain: character-lifecycle
commits_reviewed:
  - 247f3c52
  - c5dbe8c4
  - 5c1faf53
  - 3aab314a
  - 5b15f2dc
files_reviewed:
  - app/utils/trainerExperience.ts
  - app/server/api/characters/index.post.ts
  - app/server/api/characters/[id].put.ts
  - app/server/services/csv-import.service.ts
  - app/server/api/characters/[id]/xp-history.get.ts
verdict: CHANGES_REQUIRED
issues_found:
  critical: 1
  high: 1
  medium: 1
reviewed_at: 2026-03-06T11:15:00Z
follows_up: null
---

## Review Scope

Bug-057 adds server-side validation for trainer level bounds (1-50) on character creation, update, and CSV import endpoints. A new `validateTrainerLevel()` utility and `TRAINER_MIN_LEVEL` constant were added to `app/utils/trainerExperience.ts`. The XP-based leveling path (`applyTrainerXp`) was already safe.

Duplicate code path audit confirmed: all 7 code paths that set or modify trainer level are now covered (3 direct-set paths newly validated, 4 XP-based paths already safe via `applyTrainerXp`).

Decree check: no active decrees in the character-lifecycle domain conflict with this fix. The change is pure server-side validation, not a PTU rule interpretation.

## Issues

### CRITICAL

**C1: Validation error swallowed as 500 in `index.post.ts`**

File: `app/server/api/characters/index.post.ts`, lines 14-16 and 73-78

The `validateTrainerLevel` check throws `createError({ statusCode: 400 })` inside the `try` block. The `catch` block unconditionally wraps all errors in a 500:

```typescript
} catch (error: any) {
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to create character'
    })
}
```

This means the 400 validation error is caught and re-thrown as a 500. The client receives the correct message but the wrong status code.

**Fix:** Either move the validation before the `try` block (matching the pattern in `[id].put.ts`), or add `if (error.statusCode) throw error` at the top of the catch block (matching the pattern in `[id].put.ts` lines 102-103). Both patterns are already established in this codebase; the `[id].put.ts` handler in this same PR does it correctly.

### HIGH

**H1: No unit tests for `validateTrainerLevel`**

File: `app/tests/unit/utils/trainerExperience.test.ts`

The existing test file imports and tests `applyTrainerXp`, `isNewSpecies`, and the constants, but does not test the newly added `validateTrainerLevel` function. This is a new public utility with three distinct branches (non-integer, below min, above max, and valid). Per Lesson 1 from the reviewer lessons: when behavioral scope expands, test coverage must cover the delta.

At minimum, add tests for:
- Valid level (1, 25, 50) returns `null`
- Level 0 returns error
- Level 51 returns error
- Level -1 returns error
- Non-integer (1.5) returns error
- Non-number ("abc") returns error

### MEDIUM

**M1: `app-surface.md` not updated with new exports**

File: `.claude/skills/references/app-surface.md`, line 90

The Trainer XP entry lists `TRAINER_MAX_LEVEL`, `applyTrainerXp`, etc. but does not mention the new `TRAINER_MIN_LEVEL` constant or `validateTrainerLevel` function. These are public exports used across 3 server files.

## What Looks Good

1. **`validateTrainerLevel` utility is well-designed.** It correctly handles all three rejection cases (non-integer, below min, above max) with descriptive error messages. The return-string-or-null pattern avoids coupling to H3's `createError`, making it usable from both API routes (which use `createError`) and services (which throw plain `Error`). This flexibility is demonstrated by its use in `csv-import.service.ts`.

2. **`[id].put.ts` validation is correctly placed** outside the `try` block, and the `body.level !== undefined` guard correctly skips validation when level is not being updated. This is the right pattern.

3. **CSV import validation error message is informative.** Including the trainer name (`CSV import failed for "${trainer.name}"`) aids debugging when importing multiple sheets.

4. **XP-based path (`applyTrainerXp`) is correctly identified as already safe.** The function caps at `TRAINER_MAX_LEVEL` (line 77, line 94-95) and the early-return at max level prevents further leveling. This was verified by reading the function and its 17 existing unit tests.

5. **Commit granularity is appropriate.** One commit per concern: utility, create endpoint, update endpoint, CSV import. Each commit is focused and independently reviewable.

6. **`xp-history.get.ts` max-level fix (247f3c52) is correct.** Returning `null` for `xpToNextLevel` at max level instead of a negative number is the right behavior.

## Verdict

**CHANGES_REQUIRED** -- the CRITICAL issue (C1) means validation errors on character creation return 500 instead of 400, which is a correctness bug introduced by this fix. The HIGH issue (H1) requires test coverage for the new utility function.

## Required Changes

1. **[CRITICAL] Fix error propagation in `index.post.ts`**: Move validation before the `try` block, or add `if (error.statusCode) throw error` to the catch block. Match the pattern already used in `[id].put.ts`.
2. **[HIGH] Add unit tests for `validateTrainerLevel`**: At minimum 6 test cases covering valid and invalid inputs (see H1 above).
3. **[MEDIUM] Update `app-surface.md`**: Add `TRAINER_MIN_LEVEL` and `validateTrainerLevel` to the Trainer XP entry.
