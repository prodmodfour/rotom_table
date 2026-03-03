---
review_id: code-review-304
review_type: code
reviewer: senior-reviewer
trigger: design-implementation
target_report: feature-018
domain: scenes
commits_reviewed:
  - d0dc47fb
  - 74930b05
  - d84459e4
  - e3ea37ee
files_reviewed:
  - app/utils/weatherRules.ts
  - app/server/utils/turn-helpers.ts
  - app/server/api/encounters/[id]/next-turn.post.ts
  - app/server/services/weather-automation.service.ts
  - .claude/skills/references/app-surface.md
  - artifacts/tickets/in-progress/feature/feature-018.md
  - artifacts/tickets/open/ptu-rule/ptu-rule-133.md
  - CLAUDE.md
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
reviewed_at: 2026-03-03T18:00:00Z
follows_up: code-review-302
---

## Review Scope

Re-review of feature-018 P0 fix cycle (Weather Effect Automation). The previous code-review-302 found 1 CRITICAL, 2 HIGH, and 2 MEDIUM issues. The developer applied a 4-commit fix cycle. This review verifies all 5 issues are resolved.

Decrees checked: decree-001 (minimum 1 damage), decree-004 (massive damage + temp HP). No violations. Weather tick flows through the canonical `calculateDamage` pipeline which enforces both decrees.

## Issue Resolution Verification

### CRIT-001: `next-turn.post.ts` exceeded 800 lines (was 857) -- RESOLVED

**Commit:** 74930b05

The developer extracted 7 helper functions (`resetResolvingTrainerTurnState`, `resetAllTrainersForResolution`, `resetCombatantsForNewRound`, `skipFaintedTrainers`, `skipUndeclaredTrainers`, `skipUncommandablePokemon`, `decrementWeather`) into a new `app/server/utils/turn-helpers.ts` file (222 lines).

Verified:
- `next-turn.post.ts` is now 655 lines -- well under the 800-line limit.
- `turn-helpers.ts` is 222 lines -- well within limits.
- All 7 functions are properly exported from `turn-helpers.ts` and imported into `next-turn.post.ts` (lines 31-39).
- The imports that moved with the extracted functions (`getOverlandSpeed`, `applyMovementModifiers`) are in `turn-helpers.ts` and correctly removed from `next-turn.post.ts`.
- The `TrainerDeclaration` type import is in both files (needed by `skipUndeclaredTrainers` in turn-helpers and by other code in next-turn.post.ts).
- Function signatures, parameters, and logic are preserved identically. Mutation comments ("Acceptable mutation here because combatants are freshly parsed from JSON") are retained.
- The mount movement recalculation in `resetCombatantsForNewRound` (lines 112-126 of turn-helpers.ts) correctly uses the extracted `applyMovementModifiers` and `getOverlandSpeed` imports.

**Status:** FIXED. Clean extraction with no behavioral changes.

### HIGH-001: Missing fainted ally skip in adjacent ally checks -- RESOLVED

**Commit:** d0dc47fb

Verified in `weatherRules.ts`:
- Line 190 (`isImmuneToHail`): `if (ally.entity.currentHp <= 0) continue` -- added after the side check, before adjacency calculation. Comment: "Fainted allies cannot protect (PTU p.248: fainted abilities inactive)".
- Line 253 (`isImmuneToSandstorm`): Identical check at the same position in the loop. Same comment.

Both immunity functions now correctly skip fainted allies when checking adjacent ally protection (Snow Cloak / Sand Veil). A fainted ally with Snow Cloak at 0 HP will no longer confer weather immunity.

**Status:** FIXED.

### HIGH-002: Missing Magic Guard from immunity arrays -- RESOLVED

**Commit:** d0dc47fb

Verified in `weatherRules.ts`:
- Line 75: `HAIL_IMMUNE_ABILITIES` now includes `'Magic Guard'` at the end of the array.
- Line 89: `SANDSTORM_IMMUNE_ABILITIES` now includes `'Magic Guard'` (and `'Sand Stream'`).
- Doc comments updated: both arrays have a new bullet for Magic Guard with the PTU page reference (p.1770-1775).

**Status:** FIXED. Both immunity arrays now include Magic Guard.

### MED-001: `app-surface.md` not updated with new files -- RESOLVED

**Commit:** d84459e4

Verified in `.claude/skills/references/app-surface.md`:
- Line 208: `weatherRules.ts` added to the utils section with a comprehensive description of exported types, functions, and constants.
- Line 310: `weather-automation.service.ts` added to the services table with description of its pure functions and integration point.
- Line 324: `turn-helpers.ts` added to the server utils section listing all 7 extracted functions.

All three new files introduced by feature-018 (including the file created during the fix cycle) are registered.

**Status:** FIXED.

### MED-002: Missing token-size limitation comment -- RESOLVED

**Commit:** d0dc47fb

Verified in `weatherRules.ts`:
- Line 192 (`isImmuneToHail`): Comment added: `// Note: uses anchor position only; does not account for large token sizes (pre-existing limitation)`
- Line 256 (`isImmuneToSandstorm`): Identical comment at the corresponding adjacency check.

**Status:** FIXED.

## Cross-Check: rules-review-275 Issues

While this is the code review, I verified that the rules review issues were also addressed by the same fix commits:

- **rules-review-275 HIGH-001** (Sand Stream missing): `'Sand Stream'` added to `SANDSTORM_IMMUNE_ABILITIES` at line 89. Doc comment at line 86 documents the PTU reference.
- **rules-review-275 HIGH-002** (Magic Guard missing): Covered above in code-review-302 HIGH-002 -- same fix.
- **rules-review-275 MED-001** (Permafrost tracking): Comment at line 212 (`isImmuneToHail`): "Permafrost damage reduction not handled (tracked in ptu-rule-133)". Tracking ticket `ptu-rule-133` exists at `artifacts/tickets/open/ptu-rule/ptu-rule-133.md` with correct metadata (P4/LOW severity, scenes domain, source: rules-review-275 MED-001). Appropriately deferred.
- **rules-review-275 MED-002** (ticket text 1/16 vs 1/10): Ticket `feature-018.md` line 33 now reads "1/10 max HP damage (1 Tick) at turn start" instead of the previous "1/16 max HP damage at end of turn". Both the fraction and the timing were corrected.

## What Looks Good

1. **Clean extraction in turn-helpers.ts.** The 7 extracted functions are self-contained, well-documented, and maintain all existing behavior. The file has a clear header comment explaining its purpose. The extraction reduced next-turn.post.ts from 857 to 655 lines -- a 24% reduction -- giving comfortable headroom for future additions.

2. **Correct function placement.** `turn-helpers.ts` is placed in `server/utils/` which is the right location for server-side utility functions that are not business logic services. The functions are stateless helpers that operate on parsed JSON data.

3. **Comprehensive fix commit (d0dc47fb).** All non-extraction code fixes (Magic Guard, Sand Stream, fainted ally check, token-size comment, Permafrost tracking comment) were batched into a single logical commit. This is appropriate because they all modify the same file (`weatherRules.ts`) and address the same category of issues (immunity completeness).

4. **Documentation hygiene.** The doc comments on both immunity arrays were updated to include the new abilities with PTU page references. The ticket resolution log (feature-018.md) documents all fix cycle commits with file changes and review references. The app-surface.md entries are thorough and descriptive.

5. **Good commit granularity.** Four commits in the fix cycle: (1) code fixes, (2) extraction refactor, (3) docs updates, (4) ticket/design log updates. Each is focused and independently reviewable.

6. **No regressions in turn-helpers.ts.** The extracted `resetCombatantsForNewRound` function correctly preserves mount movement recalculation, out-of-turn usage reset, hold action state reset, forfeit flag preservation, and skip-next-round handling. All edge cases from the original code are intact.

## Verdict

**APPROVED**

All 5 issues from code-review-302 (1 CRITICAL, 2 HIGH, 2 MEDIUM) are resolved. The fix cycle is clean, well-documented, and introduces no new issues. The extraction of turn-helpers.ts is a net positive for maintainability. The file is ready to proceed to P1 implementation.

## Required Changes

None.
