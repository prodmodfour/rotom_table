---
review_id: code-review-177
review_type: code
reviewer: senior-reviewer
trigger: design-implementation
target_report: feature-003-track-a-p2
domain: player-view
commits_reviewed:
  - 1e8da77
  - f4a5564
  - 202a193
  - d55d876
  - 0ac933d
  - bd43261
  - 406fc90
  - 68b3baa
  - 3df70e2
files_reviewed:
  - app/composables/useHapticFeedback.ts
  - app/composables/usePlayerWebSocket.ts
  - app/components/player/PlayerSkeleton.vue
  - app/components/player/PlayerCombatActions.vue
  - app/components/player/PlayerCharacterSheet.vue
  - app/components/player/PlayerEncounterView.vue
  - app/components/player/PlayerCombatantInfo.vue
  - app/components/player/PlayerPokemonCard.vue
  - app/components/player/PlayerPokemonTeam.vue
  - app/components/player/PlayerNavBar.vue
  - app/components/player/PlayerIdentityPicker.vue
  - app/components/player/ConnectionStatus.vue
  - app/pages/player/index.vue
  - app/layouts/player.vue
  - app/assets/scss/components/_player-combat-actions.scss
  - app/assets/scss/components/_player-view.scss
verdict: CHANGES_REQUIRED
issues_found:
  critical: 0
  high: 1
  medium: 3
reviewed_at: 2026-02-26T09:15:00Z
follows_up: null
---

## Review Scope

Track A P2 (polish/UX/accessibility) for feature-003 (Full Player View). 9 implementation commits covering:

1. `useHapticFeedback` composable with vibration patterns for turn start, move execute, damage taken, UI tap
2. `PlayerSkeleton.vue` shimmer loading screen replacing spinner
3. Animated tab transitions with directional slide (tab index comparison)
4. Move detail overlay via long-press (500ms) and right-click (contextmenu)
5. Auto-scroll to current combatant on turn change (data attribute + scrollIntoView)
6. Aria-labels, semantic HTML, role attributes across all player view components
7. 4K scaling media queries for larger viewports
8. Enhanced action feedback toasts with move names and target counts
9. 44x44px minimum touch targets on all interactive elements (WCAG)

Total: 2 new files, 14 files modified, ~708 lines added, ~94 removed. All files under 800-line limit.

## Issues

### HIGH

#### H1: Long-press on move buttons also fires click handler on mobile (PlayerCombatActions.vue)

**File:** `app/components/player/PlayerCombatActions.vue`, lines 82-98

The move buttons bind `@click="handleMoveSelect(move)"`, `@touchstart.passive="startLongPress(move)"`, `@touchend="cancelLongPress"`, and `@contextmenu.prevent="showMoveDetails(move)"`.

On mobile, the touch event sequence is: `touchstart` -> (500ms) timer fires, sets `detailMove` -> `touchend` -> browser synthesizes `click` event -> `handleMoveSelect` fires, opening the target selector.

This means every successful long-press that opens the move detail overlay will ALSO trigger `handleMoveSelect`, which opens the target selector and hides the detail overlay. The long-press feature is functionally broken on mobile touch devices.

**Fix:** Track whether the long-press timer fired (e.g., `let longPressTriggered = false`). Set it to `true` when the timer fires. In `handleMoveSelect`, check if `longPressTriggered` is true and if so, reset the flag and return early. Reset the flag in `cancelLongPress` as well. Alternatively, call `event.preventDefault()` from `touchend` when the long press fired (but `@touchstart.passive` means you cannot call `preventDefault` from `touchstart`).

### MEDIUM

#### M1: Toast and turn notification overlap at same position (index.vue)

**File:** `app/pages/player/index.vue`, lines 476-524

Both `.player-toast` and `.player-turn-flash` are positioned at `position: fixed; top: 56px; left: 50%; z-index: $z-index-toast`. When a turn notification (5s duration) and an action ack toast (4s duration) are both active, they render on top of each other at the exact same coordinates.

Scenario: Player's turn starts (turn flash appears). Player immediately uses a move (action ack toast appears). Both occupy the same spot for up to 4 seconds.

**Fix:** Offset `.player-turn-flash` to a different vertical position (e.g., `top: 56px` for turn flash, `top: 100px` for action ack toast), or use a stacked toast container that positions toasts sequentially.

#### M2: 4K scaling incomplete across player view components

**Files:** `PlayerCharacterSheet.vue`, `PlayerPokemonCard.vue`, `PlayerEncounterView.vue`, `PlayerCombatantInfo.vue`

The 4K scaling (commit 406fc90) was applied to the page layout (`player.vue`), top bar, nav bar, shared styles (`_player-view.scss`), and combat actions (`_player-combat-actions.scss`). However, several component-scoped styles that use explicit `font-size` values do NOT have 4K overrides:

- `PlayerCharacterSheet.vue`: `.skill-row__name` (`$font-size-sm`), `.equipment-slot__label` (`$font-size-xs`), `.inventory-row` (`$font-size-sm`), `.combat-item__label` (`10px`), `.tag` (`$font-size-xs`), `.list-subheader` (`$font-size-xs`)
- `PlayerPokemonCard.vue`: `.detail-label` (`10px`), `.ability-row__name/effect` (`$font-size-sm`/`$font-size-xs`), `.cap-item__label` (`9px`), `.pokemon-card__active-badge` (`9px`), `.pokemon-card__type` (`9px`)
- `PlayerEncounterView.vue`: `.encounter-header__name` (`$font-size-md`), `.encounter-side__title` (`$font-size-sm`)
- `PlayerCombatantInfo.vue`: `.player-combatant__name` (`$font-size-sm`), `.player-combatant__type` (`8px`), `.player-combatant__injuries` (`10px`)

The `player.vue` layout's `font-size: $font-size-4k-md` at the 4K breakpoint provides a cascade base, but all these explicit `font-size` declarations override it. On a 4K display, shared elements (stat cells, HP bars, status badges, buttons) scale up while these component-specific elements remain at phone sizes, creating a visually jarring mismatch.

**Fix:** Add `@media (min-width: $breakpoint-4k)` blocks to each component's scoped styles, or extract the most commonly used sizes into SCSS mixins that include 4K overrides.

#### M3: app-surface.md not updated with new files

**File:** `.claude/skills/references/app-surface.md`

Two new files were created in this implementation:
- `app/composables/useHapticFeedback.ts`
- `app/components/player/PlayerSkeleton.vue`

Neither is listed in `app-surface.md`. Per the review checklist, new composables and components should be reflected in the surface reference.

**Fix:** Add entries for both files in the appropriate sections of `app-surface.md`.

## What Looks Good

1. **useHapticFeedback composable** is clean, well-documented, and properly defensive. The `try/catch` around `navigator.vibrate` handles edge cases, and the `isSupported` check avoids errors on desktop browsers. The vibration patterns are well-tuned (200/100/200 double-pulse for turn start is noticeable without being annoying).

2. **usePlayerWebSocket integration** of haptic, damage, and move events is well-structured. The `handleDamageApplied` and `handleMoveExecuted` handlers correctly check both `characterId` and `pokemonIds` to cover all player-owned entities. Immutability is maintained with `new Map()` copies for pending actions.

3. **PlayerSkeleton.vue** accurately mirrors the real layout structure (header with avatar + name, HP bar, stats grid, combat info), providing a quality perceived-performance improvement. The shimmer animation at `background-size: 200%` with `1.8s` timing is smooth.

4. **Tab transitions** use a clever `TAB_ORDER` record to determine slide direction. The `watch` on `activeTab` dynamically sets `tabTransitionName` before the transition fires. The 0.2s duration is appropriately snappy for a mobile interface.

5. **Auto-scroll implementation** is minimal and correct: `data-combatant-id` attribute on `PlayerCombatantInfo`, `querySelector` with `scrollIntoView({ behavior: 'smooth', block: 'nearest' })`. Using `nextTick()` ensures the DOM is updated before querying. Clean.

6. **Accessibility audit** is thorough. Every collapsible section has `aria-expanded` + `aria-controls` with matching IDs. Toasts use `role="status" aria-live="polite"`, turn notification uses `role="alert" aria-live="assertive"` (correct urgency levels). The pass-turn confirmation dialog has `role="dialog" aria-modal="true"`. Connection status dot has `role="button"`, `tabindex="0"`, and keyboard handlers for Enter/Space. Pokemon cards expose expand/collapse state in their aria-label.

7. **Touch targets** at 44x44px minimum on all buttons (move buttons, action buttons, panel rows, target selector targets, cancel buttons, dismiss buttons) meet WCAG 2.5.8. The import result dismiss button upgrade from 24x24 to 44x44 and the switch character button from 36x36 to 44x44 were both necessary fixes.

8. **Commit granularity** is excellent. Each of the 9 commits addresses exactly one concern, changes 1-8 files, and produces a working state. The logical ordering (foundation composable first, then UI features, then cross-cutting accessibility, then 4K scaling, then toasts, then touch targets) allows easy bisection and review.

9. **File sizes** are all well within limits. The largest file is `_player-combat-actions.scss` at 734 lines (SCSS, not component logic). The actual component files range from 50 to 709 lines.

10. **Error handling** in toasts differentiates success (2.5s auto-dismiss) from error (4s auto-dismiss), giving users more time to read error messages.

## Verdict

**CHANGES_REQUIRED**

One HIGH issue (H1: long-press + click double-firing on mobile) must be fixed before approval. The move detail overlay feature is effectively unusable on mobile in its current state, and mobile is the primary target platform for the player view.

Three MEDIUM issues should also be addressed:
- M1 (toast/turn-flash overlap) is a visible UI glitch during the most critical moment -- turn start
- M2 (incomplete 4K scaling) makes the 4K feature inconsistent
- M3 (app-surface.md) is a documentation gap

## Required Changes

1. **H1 (blocking):** Add long-press-triggered flag to prevent `handleMoveSelect` from firing after a successful long press. Test on touch device or with Chrome DevTools touch emulation.

2. **M1:** Offset `.player-toast` and `.player-turn-flash` vertically so they cannot overlap. Simplest: move toast to `top: 100px` or use a container.

3. **M2:** Add 4K `@media` blocks to `PlayerCharacterSheet.vue`, `PlayerPokemonCard.vue`, `PlayerEncounterView.vue`, and `PlayerCombatantInfo.vue` for their component-specific font sizes and spacing.

4. **M3:** Update `app-surface.md` with `useHapticFeedback.ts` and `PlayerSkeleton.vue`.
