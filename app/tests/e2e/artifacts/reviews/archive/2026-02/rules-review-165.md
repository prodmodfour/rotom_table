---
review_id: rules-review-165
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: ptu-rule-105+106
domain: rest-healing
commits_reviewed:
  - 904f848
  - 3e0dfd9
  - 81c2b02
  - 46be3bf
  - 1835cf6
  - b2bce27
  - 5534e2b
mechanics_verified:
  - extended-rest-ap-recovery
  - extended-rest-duration
  - bound-ap-preservation
  - daily-move-refresh
  - rest-hp-healing
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
ptu_refs:
  - core/07-combat.md#resting
  - core/06-playing-the-game.md#action-points
  - errata-2.md#nurse
reviewed_at: 2026-02-26T19:30:00Z
follows_up: rules-review-159
---

## Design Decrees Checked

- **decree-016** (Extended rest clears only Drained AP, not Bound AP): Applicable. Verified in ptu-rule-105 implementation.
- **decree-018** (Extended rest accepts a duration parameter, 4-8h, default 4, with 8h daily cap): Applicable. Verified in ptu-rule-106 implementation.

No decree violations found.

## Mechanics Verified

### 1. Bound AP Preservation During Extended Rest (ptu-rule-105)

- **Rule:** "Extended rests completely remove Persistent Status Conditions, and restore a Trainer's Drained AP." (`core/07-combat.md` lines 2009-2011). The rules mention restoring Drained AP only. Bound AP is governed separately: "Bound Action Points remain off-limits until the effect that Bound them ends" (`core/06-playing-the-game.md` lines 226-228).
- **Decree:** decree-016 rules that extended rest clears only Drained AP, not Bound AP. "When PTU enumerates specific effects of a rest type, only those effects apply. Silence on a mechanic means it is unaffected."
- **Implementation (commit 3e0dfd9):** In `app/server/api/characters/[id]/extended-rest.post.ts`:
  - Line 94: `drainedAp: 0` -- correctly clears all drained AP.
  - Line 95: `currentAp: maxAp - character.boundAp` -- correctly sets available AP to max minus bound (bound remains off-limits).
  - No write to `boundAp` field -- the value is preserved as-is in the database.
  - The previous code (`boundAp: 0, currentAp: maxAp`) incorrectly cleared bound AP and gave full AP pool. This is now fixed.
- **Response data:** Line 109 returns `boundAp: updated.boundAp` instead of the old `boundApCleared`, allowing the client to display remaining bound AP to the GM.
- **Status:** CORRECT. Per decree-016, this is the authoritative behavior.

### 2. Extended Rest Duration Parameter (ptu-rule-106)

- **Rule:** "Extended Rests are rests that are at least 4 continuous hours long." (`core/07-combat.md` line 2009). "For the first 8 hours of rest each day, Pokemon and Trainers that spend a continuous half hour resting heal 1/16th of their Maximum Hit Points." (`core/07-combat.md` lines 1995-1997).
- **Decree:** decree-018 rules that extended rest accepts a duration parameter (4-8 hours, default 4), with healing calculated as `floor(duration / 0.5)` rest periods, respecting the 8h daily cap via `restMinutesToday`.
- **Implementation:**

  **Character endpoint (commits 81c2b02, 3e0dfd9):** `app/server/api/characters/[id]/extended-rest.post.ts`
  - Lines 28-30: Parses optional `duration` from body, defaults to 4, clamps to [4, 8] range. Uses `Number(rawDuration) || 4` for NaN safety.
  - Line 53: `requestedPeriods = Math.floor(duration * 60 / 30)` -- correctly converts hours to 30-minute rest periods. For 4h = 8 periods, 8h = 16 periods. Matches decree-018 formula.
  - Lines 60-75: Loop iterates up to `requestedPeriods`, calling `calculateRestHealing()` each iteration. The utility function (in `utils/restHealing.ts`) checks `restMinutesToday >= 480` and breaks if the daily cap is reached. Also breaks on 5+ injuries or full HP.
  - Line 71: `currentRestMinutes += 30` -- correctly tracks cumulative rest time.
  - Line 90: Writes `restMinutesToday: currentRestMinutes` to DB -- daily cap persists across rest calls.

  **Pokemon endpoint (commit 46be3bf):** `app/server/api/pokemon/[id]/extended-rest.post.ts`
  - Identical duration parsing (lines 28-30), period calculation (line 53), and healing loop (lines 60-75).
  - Pokemon endpoint does not touch AP fields (Pokemon do not have AP in PTU) -- correct.
  - Daily move refresh logic (lines 85-111) is unchanged and correctly applies the rolling window rule per `core/07-combat.md` line 2012-2014.

  **Composable (commit 1835cf6):** `app/composables/useRestHealing.ts`
  - Line 38: `extendedRest()` now accepts `duration: number = 4` parameter.
  - Lines 47-50: Passes `body: { duration }` to the endpoint via `$fetch`.

  **UI (commit b2bce27):** `app/components/common/HealingTab.vue`
  - Line 155: `extendedRestDuration = ref(4)` -- defaults to 4 hours per decree-018.
  - Lines 69-78: Number input with `min="4"` `max="8"` `step="1"` -- HTML validation constrains to valid range.
  - Line 211: Client-side clamp `Math.min(8, Math.max(4, extendedRestDuration.value || 4))` before calling composable -- defense in depth matching server validation.
  - Line 85: Button label dynamically shows chosen duration: `Extended Rest (${extendedRestDuration}h)`.

- **Daily cap interaction verified:** If a character has already rested 4 hours today (`restMinutesToday = 240`) and requests an 8-hour extended rest, the loop will execute up to 16 periods but `calculateRestHealing()` will return `canHeal: false` after 8 more periods (reaching 480 minutes), breaking the loop. The actual healing is capped correctly.

- **Status:** CORRECT. All aspects match decree-018 and PTU rules.

### 3. Rest HP Healing Formula

- **Rule:** "For the first 8 hours of rest each day, Pokemon and Trainers that spend a continuous half hour resting heal 1/16th of their Maximum Hit Points." (`core/07-combat.md` lines 1995-1997).
- **Implementation:** `app/utils/restHealing.ts` `calculateRestHealing()`:
  - Line 65: `healAmount = Math.max(1, Math.floor(maxHp / 16))` -- 1/16th of max HP, minimum 1.
  - Line 57: Uses `getEffectiveMaxHp()` for injury-reduced cap (each injury reduces max HP by 1/10th per PTU Core Ch.9).
  - Line 67: Actual heal capped at effective max HP.
  - Line 52: Daily cap at 480 minutes (8 hours).
  - Line 47: 5+ injuries prevents rest healing entirely.
- **Status:** CORRECT. Unchanged by these commits but verified as the foundation for the duration feature.

### 4. Daily-Frequency Move Refresh (Pokemon Extended Rest)

- **Rule:** "Daily-Frequency Moves are also regained during an Extended Rest, if the Move hasn't been used since the previous day." (`core/07-combat.md` lines 2012-2014).
- **Implementation:** `app/server/api/pokemon/[id]/extended-rest.post.ts` lines 85-111:
  - `isDailyMoveRefreshable()` in `utils/restHealing.ts` (lines 207-212) checks if `lastUsedAt` date differs from today's date. Moves used today are not refreshed.
  - Non-daily moves have their usage counters reset (lines 101-104).
  - Scene usage also reset for refreshed daily moves (lines 108-110).
- **Status:** CORRECT. Unchanged by these commits, verified for completeness since it runs during the modified extended rest flow.

### 5. Persistent Status Condition Clearing

- **Rule:** "Extended rests completely remove Persistent Status Conditions" (`core/07-combat.md` line 2010).
- **Implementation:** Both character and Pokemon endpoints call `clearPersistentStatusConditions()` which filters out conditions in the `PERSISTENT_CONDITIONS` array.
- **Status:** CORRECT. Unchanged by these commits, verified for completeness.

### 6. Max AP Calculation

- **Rule:** "Trainers have a maximum Action Point pool equal to 5, plus 1 more for every 5 Trainer Levels they have achieved; a Level 15 Trainer would have a maximum of 8 Action Points, for example." (`core/06-playing-the-game.md` lines 220-223).
- **Implementation:** `app/utils/restHealing.ts` `calculateMaxAp()` (line 219-221): `5 + Math.floor(level / 5)`. Level 15 yields `5 + 3 = 8`. Matches the rulebook example exactly.
- **Cross-verification:** Level 1 = 5 AP, Level 5 = 6 AP, Level 10 = 7 AP, Level 15 = 8 AP, Level 20 = 9 AP. All correct.
- **Status:** CORRECT.

### 7. Errata Check: Nurse Feature Interaction

- **Errata rule:** The Nurse feature (`errata-2.md` lines 356-372) modifies Extended Rest behavior: heals 1/8th instead of 1/16th, and after 6+ hours can remove 1 injury. The AP Drain cost is applied "after the Extended Rest is completed and AP Drain has otherwise been restored."
- **Implementation impact:** The Nurse feature is not currently implemented in the codebase. The errata establishes that Features can modify Extended Rest behavior, but the base implementation does not need to account for Nurse specifically until that Feature is implemented. The duration parameter (4-8h) does correctly enable the Nurse's "at least 6 hours" condition to be meaningful in the future.
- **Status:** NOT APPLICABLE (feature not implemented). No action required. The duration parameter provides the necessary foundation.

## Feature-003 Fix Cycle 3 Re-Review (commit 904f848)

This is a re-review following code-review-182 CHANGES_REQUIRED. The previous review (rules-review-159) APPROVED the PTU mechanics (trainer HP formula tooltip). The current fix addresses the code-review-182 C1 finding: `:deep()` pseudo-selectors in a global SCSS file.

### SCSS Fix Verification

- **Commit 904f848** modifies `app/assets/scss/components/_player-character-sheet.scss` at 3 locations:
  1. Line 81: `:deep(.player-hp-bar-label)` changed to `.player-hp-bar-label`
  2. Line 111: `:deep(svg)` changed to `svg`
  3. Line 132: `:deep(.player-stat-cell__value)` changed to `.player-stat-cell__value`

- **PTU mechanics impact:** None. This is a pure CSS fix. The selectors target visual presentation (text alignment, icon transitions, font sizes) with no game logic. The underlying stat values, HP calculations, and combat data are unaffected.

- **Completeness:** Verified via grep that zero `:deep()` selectors remain in any SCSS file under `app/assets/scss/`. The sibling files `_player-combat-actions.scss` and `_player-view.scss` were already clean (no `:deep()` found).

- **Status:** CORRECT (no PTU mechanics involved). The fix resolves code-review-182 C1 completely.

## Summary

Seven commits reviewed across three work items:

1. **ptu-rule-105 (1 commit):** Extended rest now correctly preserves Bound AP and only clears Drained AP, per decree-016 and PTU RAW. The `currentAp` calculation accounts for bound AP that remains off-limits.

2. **ptu-rule-106 (4 commits):** Extended rest now accepts a configurable duration (4-8 hours, default 4), per decree-018. Server endpoints validate and clamp the duration, calculate proportional rest periods, and respect the daily 8-hour cap. The composable passes the duration to the API, and the UI provides a number input with appropriate constraints.

3. **feature-003 fix3 (1 commit):** Removed `:deep()` pseudo-selectors from global SCSS. No PTU mechanics affected.

4. **docs update (1 commit):** Ticket resolution logs only.

All implementations correctly follow PTU 1.05 rules and active decrees. No errata conflicts found. The Nurse feature interaction is a future concern (not yet implemented) but the duration parameter provides the necessary foundation.

## Rulings

1. **Extended rest AP restoration is CORRECT.** Per decree-016 and PTU p.252, only Drained AP is restored. Bound AP remains off-limits until the binding effect explicitly ends. The implementation at `extended-rest.post.ts:94-95` correctly sets `drainedAp: 0` and `currentAp: maxAp - character.boundAp`.

2. **Extended rest duration parameter is CORRECT.** Per decree-018 and PTU p.252 ("at least 4 continuous hours"), the 4-8 hour range with proportional healing periods (each 30 min = 1/16th max HP) and 8h daily cap is faithfully implemented. Server-side validation, client-side clamping, and the `calculateRestHealing()` loop all enforce the cap correctly.

3. **Pokemon extended rest does not touch AP fields.** This is correct -- Pokemon do not have Action Points in PTU. Only trainers have AP.

4. **No new PTU ambiguities discovered.** All mechanics in this review are covered by existing decrees and clear rulebook text.

## Verdict

**APPROVED** -- All PTU mechanics are correctly implemented. Decree-016 and decree-018 are respected. No rule violations, no edge case gaps, no formula errors.

## Required Changes

None.
