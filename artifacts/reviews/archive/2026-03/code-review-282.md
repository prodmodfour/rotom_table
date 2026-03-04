---
review_id: code-review-282
review_type: code
reviewer: senior-reviewer
trigger: design-implementation
target_report: feature-023
domain: player-view+capture
commits_reviewed:
  - c4dfcfa4
  - 8f14b739
  - 9b6027d3
  - f1ecce36
  - 3503e4b5
files_reviewed:
  - app/composables/usePlayerCapture.ts
  - app/composables/usePlayerCombat.ts
  - app/components/player/PlayerCapturePanel.vue
  - app/components/player/PlayerCombatActions.vue
  - app/assets/scss/components/_player-combat-actions.scss
  - .claude/skills/references/app-surface.md
  - artifacts/tickets/in-progress/feature/feature-023.md
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
reviewed_at: 2026-03-02T22:48:00Z
follows_up: code-review-280
---

## Review Scope

Re-review of feature-023 P1 fix cycle (5 commits) addressing all issues from code-review-280 (H1, M1, M2) and rules-review-256 (CRIT-1). Verified each fix by reading the actual source files, not just the diffs.

**Decrees checked:** decree-013 (1d100 capture system), decree-014 (Stuck/Slow separate), decree-015 (real max HP), decree-042 (full accuracy system for Poke Ball throws). All remain compliant -- the fixes were documentation and correctness fixes that did not alter the capture rate formula or accuracy check delegation.

## Fix Verification

### rules-review-256 CRIT-1: captureTargets case mismatch (RESOLVED)

**Commit:** c4dfcfa4
**File:** `app/composables/usePlayerCombat.ts` line 442

Verified: `c.side !== 'Enemies'` changed to `c.side !== 'enemies'`. The `CombatSide` type in `app/types/combat.ts:20` is confirmed as `'players' | 'allies' | 'enemies'` (all lowercase). Grep across the entire codebase confirms every other usage of the enemies side uses lowercase `'enemies'` (encounter store line 80, grid-placement service, encounter budget composable, initiative tracker, damage endpoint, wild-spawn endpoint, etc.). The JSDoc comment on line 431 was also updated from `'Enemies'` to `'enemies'`, maintaining consistency between documentation and code.

The fix is minimal (2 lines: one code, one comment) and correct. No collateral changes. The `captureTargets` computed will now correctly return enemy Pokemon with HP > 0, unblocking the entire P1 capture feature.

### code-review-280 H1: app-surface.md not updated (RESOLVED)

**Commit:** f1ecce36
**File:** `.claude/skills/references/app-surface.md` line 164

Verified: The feature-023 entry now includes all three P1 additions:

1. `captureTargets` computed in `usePlayerCombat.ts` -- described as "filters encounter combatants to enemy Pokemon with HP > 0 for capture targeting"
2. `components/player/PlayerCapturePanel.vue` -- described as "two-step capture flow -- step 1: select target from captureTargets list, step 2: capture rate preview via server/local fallback + confirm/cancel; emits request-sent/cancel"
3. `composables/usePlayerCapture.ts` -- described as "player-side capture composable -- fetchCaptureRate server endpoint wrapper, estimateCaptureRate local fallback without SpeciesData fields, reactive loading/error state"

The descriptions accurately reflect the implementation. The P0 components (PlayerRequestPanel, usePlayerRequestHandlers, useSwitchModalState) are preserved. The entry is comprehensive and matches the actual code.

### code-review-280 M1: Hardcoded gap: 4px (RESOLVED)

**Commit:** 8f14b739
**File:** `app/components/player/PlayerCapturePanel.vue` line 168

Verified: `gap: 4px` changed to `gap: $spacing-xs` in the `.capture-panel__targets` block. The SCSS variable `$spacing-xs` is `0.25rem` (confirmed in `app/assets/scss/_variables.scss:98`), which is equivalent to 4px at default root font-size. The visual output is identical, but the code now follows the project convention of using SCSS variables.

Note: The extracted `_player-combat-actions.scss` file contains 4 instances of `gap: 4px` (lines 36, 78, 191, 519). These predate the P1 implementation and were not flagged in code-review-280 -- they are out of scope for this fix cycle. They are a preexisting style inconsistency, not a regression.

### code-review-280 M2: Missing comment on omitted params (RESOLVED)

**Commit:** 9b6027d3
**File:** `app/composables/usePlayerCapture.ts` lines 37-42

Verified: A 6-line comment was added above the `calculateCaptureRateLocal()` call explaining:
- Which fields are omitted: `evolutionStage`, `maxEvolutionStage`, `isLegendary`
- Why: the client-side Pokemon type does not carry SpeciesData fields
- What the accuracy impact is: evolution stage modifiers (up to -10 per stage beyond first) and legendary penalty (-30) are excluded
- Where the accurate path is: the server path (`fetchCaptureRate`) includes these fields via SpeciesData lookup

The comment is clear, accurate, and addresses the exact concern raised in M2. The function-level JSDoc (lines 28-32) also correctly describes `estimateCaptureRate` as a fallback that "uses default evolution stage values since the client-side Pokemon type does not include SpeciesData fields."

### Resolution log updated

**Commit:** 3503e4b5
**File:** `artifacts/tickets/in-progress/feature/feature-023.md`

Verified: A new resolution log entry documents the P1 fix cycle with all 4 fix commits referenced. The entry accurately describes the fixes: "CRIT-1 captureTargets 'Enemies'->'enemies' case fix, M1 hardcoded gap->$spacing-xs, M2 inline comment for omitted evolution/legendary params, H1 app-surface.md P1 components added."

## No New Issues Introduced

Verified the following:

1. **No regressions in existing code.** The 5 commits touch only the 5 files listed in the diff stats. No unrelated files were modified.

2. **File sizes remain within limits.** `usePlayerCapture.ts` (59 lines), `usePlayerCombat.ts` (512 lines), `PlayerCapturePanel.vue` (226 lines), `PlayerCombatActions.vue` (614 lines), `_player-combat-actions.scss` (740 lines) -- all under the 800-line maximum.

3. **Immutability patterns maintained.** No reactive object mutations introduced by the fixes. The case fix is a string literal comparison change; the SCSS fix is a variable substitution; the comment and app-surface changes are documentation-only.

4. **Commit granularity is correct.** Each of the 5 commits addresses exactly one issue and touches 1 file. The commit messages accurately describe the change and reference the review issue IDs.

5. **Both entity types considered.** The `captureTargets` filter correctly checks `c.type === 'pokemon'` (line 441), excluding human combatants. The `currentHp > 0` check (line 444) applies to the Pokemon entity specifically.

6. **Decree compliance maintained.** Per decree-013, the 1d100 capture system remains the sole capture path. Per decree-015, `pokemon.maxHp` (real max HP) is passed to the local estimate. Per decree-014, Stuck/Slow are handled as separate modifiers in the underlying `captureRate.ts`. Per decree-042, the accuracy system is delegated to the GM-side handler (`rollAccuracyCheck()` with AC 6 gate). No decree violations.

## What Looks Good

1. **All four review issues resolved completely.** Each fix precisely addresses the original concern with minimal, focused changes. No over-engineering or scope creep.

2. **The CRIT-1 fix is confirmed correct.** The `CombatSide` type definition and codebase-wide usage patterns confirm lowercase `'enemies'` is the correct value. The capture feature is now functional.

3. **The comment in usePlayerCapture.ts is thorough.** It explains not just what is omitted but why, what the accuracy implications are, and where the accurate path lives. Future developers will understand the tradeoff immediately.

4. **The app-surface.md update is comprehensive.** All three P1 additions are documented with accurate descriptions that match the implementation.

5. **The resolution log provides a clear audit trail.** The fix cycle commits are documented with correct hashes and a concise summary.

## Verdict

**APPROVED**

All four issues from code-review-280 (H1, M1, M2) and rules-review-256 (CRIT-1) are fully resolved. No new issues were introduced. The fix cycle was clean, focused, and well-documented. The P1 capture feature is now functional and ready for P2 work.

## Required Changes

None.
