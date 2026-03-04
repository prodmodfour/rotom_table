---
review_id: code-review-181
review_type: code
reviewer: senior-reviewer
trigger: bug-fix
target_report: feature-003-track-a-p2
domain: player-view
commits_reviewed:
  - f29a346
  - 71e6de1
  - 348f9ca
  - f271938
files_reviewed:
  - app/components/player/PlayerCombatActions.vue
  - app/pages/player/index.vue
  - app/components/player/PlayerCharacterSheet.vue
  - app/components/player/PlayerPokemonCard.vue
  - app/components/player/PlayerEncounterView.vue
  - app/components/player/PlayerCombatantInfo.vue
  - .claude/skills/references/app-surface.md
verdict: CHANGES_REQUIRED
issues_found:
  critical: 0
  high: 0
  medium: 2
reviewed_at: 2026-02-26T14:25:00Z
follows_up: code-review-177
---

## Review Scope

Re-review of 4 fix commits addressing code-review-177 (H1 + M1 + M2 + M3) for feature-003 Track A P2 (player view polish/UX/accessibility). 7 files changed, 279 insertions, 3 deletions.

## Issue Resolution Status

### H1: Long-press + click double-fire (RESOLVED)

**Commit:** f29a346 — `PlayerCombatActions.vue` (+8 lines)

The fix introduces a `longPressTriggered` boolean flag:

1. `startLongPress` resets the flag to `false`, then the 500ms timer sets it to `true` when it fires.
2. `handleMoveSelect` checks the flag at the top: if `true`, resets to `false` and returns early, suppressing the synthesized click.
3. `cancelLongPress` does not reset the flag, which is correct — if the timer never fired, `longPressTriggered` is still `false` from `startLongPress`, so a normal tap flows through to `handleMoveSelect` without interference.
4. The flag is a plain `let` (not reactive), which is correct since it never drives rendering.
5. The cleanup in `onUnmounted` correctly clears `longPressTimer`.

Edge cases verified:
- Quick tap (< 500ms): flag stays `false`, click proceeds normally.
- Long press (>= 500ms): flag becomes `true`, detail overlay opens, synthesized click is suppressed.
- Long press then quick tap on different button: `startLongPress` resets flag to `false` — no stale state.

**Verdict: Correctly resolved.**

### M1: Toast/turn-flash overlap (RESOLVED)

**Commit:** 71e6de1 — `player/index.vue` (+1/-1)

Toast moved from `top: 56px` to `top: 100px`. Turn-flash remains at `top: 56px`. On standard mobile viewports (top bar 48px): turn-flash bottom edge at ~86px, toast at 100px gives ~14px gap. Sufficient clearance for both to be visible simultaneously during the turn-start + action-ack overlap scenario.

**Verdict: Correctly resolved.**

### M2: 4K scaling incomplete (MOSTLY RESOLVED — see M1 below)

**Commit:** 348f9ca — 4 files changed (+268 lines)

All four components called out in code-review-177 now have `@media (min-width: $breakpoint-4k)` blocks. Verification against the specific selectors listed in M2:

- **PlayerCharacterSheet.vue:** `.combat-item__label`, `.combat-item__value`, `.skill-row__name`, `.skill-row__rank`, `.tag`, `.equipment-slot__label`, `.equipment-slot__value`, `.inventory-row__name`, `.inventory-row__qty`, `.empty-text` — all covered. **Missing: `.list-subheader`** (font-size: $font-size-xs, explicitly called out in code-review-177 line 94).
- **PlayerPokemonCard.vue:** `.detail-label`, `.ability-row__name`, `.ability-row__effect`, `.cap-item__label`, `.cap-item__value`, `.pokemon-card__active-badge`, `.pokemon-card__type`, `.pokemon-card__level`, `.pokemon-card__held-item` — all covered. Complete.
- **PlayerEncounterView.vue:** `.encounter-header__name`, `.encounter-header__round`, `.encounter-header__turn`, `.encounter-side__title`, `.encounter-waiting` — all covered. Complete.
- **PlayerCombatantInfo.vue:** `.player-combatant__name`, `.player-combatant__turn-badge`, `.player-combatant__type`, `.player-combatant__injuries`, plus deep selectors for HP bar label and status badge — all covered. Complete.

All 4K variables used (`$font-size-4k-sm`, `$font-size-4k-md`, `$font-size-4k-lg`, `$spacing-4k-sm`, `$spacing-4k-md`, `$spacing-4k-xl`, `$breakpoint-4k`) verified to exist in `_variables.scss`.

### M3: app-surface.md missing files (RESOLVED)

**Commit:** f271938 — `app-surface.md` (+2/-2)

Both `PlayerSkeleton.vue` and `useHapticFeedback.ts` are now present in the appropriate sections of `app-surface.md` with accurate descriptions. Files verified to exist on disk.

**Verdict: Correctly resolved.**

## Issues

### MEDIUM

#### M1: PlayerCharacterSheet.vue exceeds 800-line limit (820 lines)

**File:** `app/components/player/PlayerCharacterSheet.vue` (820 lines)

The 4K scaling block added 111 lines of SCSS, pushing the file from 709 to 820 lines. The project rule is 800 lines max. The overshoot is 20 lines and is entirely SCSS (template: 243 lines, script: 141 lines, style: 436 lines).

Additionally, `.list-subheader` — which was explicitly listed in code-review-177 M2 as having `font-size: $font-size-xs` without a 4K override — was not included in the 4K block. Adding it will increase the file to ~824 lines.

**Fix:** Extract the 4K media query block (or the entire scoped SCSS) into a separate file (e.g., `app/assets/scss/components/_player-character-sheet.scss`) registered globally via `nuxt.config.ts`, following the same pattern already used by `PlayerCombatActions.vue` (line 563: "Styles extracted to assets/scss/components/_player-combat-actions.scss"). This reduces the component file well under 800 lines and provides room for the missing `.list-subheader` 4K override.

#### M2: `.list-subheader` missing from PlayerCharacterSheet 4K block

**File:** `app/components/player/PlayerCharacterSheet.vue`, line 625

The `.list-subheader` class has `font-size: $font-size-xs` and was specifically called out in code-review-177 M2 (line 94: "`.list-subheader` (`$font-size-xs`)"). It is not present in the 4K `@media` block added by commit 348f9ca. On 4K displays, the Features/Edges subheaders will remain at phone-sized font while surrounding elements scale up.

**Fix:** Add `.list-subheader { font-size: $font-size-4k-sm; }` to the 4K block (ideally in the extracted SCSS file from M1 above).

## What Looks Good

1. **H1 fix is clean and minimal.** 8 lines added, no reactive overhead, no side effects. The flag lifecycle is easy to trace: set false on touch start, set true on timer fire, checked and cleared on click. No way for it to go stale across interactions.

2. **M1 fix is simple and effective.** A single `top` value change creates sufficient visual separation. Both elements remain centered horizontally with matching z-index, but vertically offset so they cannot overlap.

3. **M2 coverage is thorough.** The 4K blocks in PlayerPokemonCard, PlayerEncounterView, and PlayerCombatantInfo are complete — every hardcoded pixel value and variable-based font-size in these components now has a 4K override. The blocks also scale spacing and element dimensions (sprite sizes, avatar sizes, min-heights), not just font sizes. The approach of using `$font-size-4k-sm` consistently is correct since these are all small/compact UI elements.

4. **M3 descriptions are accurate.** PlayerSkeleton description ("skeleton loading screen shown while character data loads") and useHapticFeedback description ("haptic feedback for touch interactions — vibration API wrapper for mobile devices") correctly capture each file's purpose.

5. **Commit granularity is correct.** Each of the 4 commits addresses exactly one issue from code-review-177. Logical separation makes it easy to review and bisect.

## Verdict

**CHANGES_REQUIRED**

Two MEDIUM issues remain:

- M1: PlayerCharacterSheet.vue at 820 lines exceeds the 800-line project limit. Extract SCSS to a separate file (matching the existing pattern from PlayerCombatActions.vue).
- M2: `.list-subheader` 4K override was missed despite being explicitly called out in the original review.

Both can be addressed in a single commit: extract the SCSS, add the missing selector in the extracted file.

## Required Changes

1. **M1 + M2 (combined fix):** Extract `PlayerCharacterSheet.vue` scoped styles into `app/assets/scss/components/_player-character-sheet.scss` (following the `_player-combat-actions.scss` pattern). Add the missing `.list-subheader { font-size: $font-size-4k-sm; }` to the 4K block in the extracted file. Register in `nuxt.config.ts` CSS array. Replace `<style>` block in the component with a comment referencing the extracted file.
