---
review_id: code-review-150
review_type: code
reviewer: senior-reviewer
trigger: bug-fix
target_report: feature-003
domain: player-view
commits_reviewed:
  - af5ee4f
  - 867e189
  - 58673d8
  - 7a512e7
  - f8931ab
  - b7b81c5
  - fdcdc55
files_reviewed:
  - app/composables/usePlayerCombat.ts
  - app/components/player/PlayerCombatActions.vue
  - app/components/player/PlayerEncounterView.vue
  - app/assets/scss/components/_player-combat-actions.scss
  - app/nuxt.config.ts
  - .claude/skills/references/app-surface.md
  - app/tests/e2e/artifacts/tickets/feature/feature-003.md
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
reviewed_at: 2026-02-24T16:30:00Z
follows_up: code-review-147
---

## Review Scope

Re-review of feature-003 P1 Track A fix cycle. The previous code-review-147 returned CHANGES_REQUIRED with 7 issues (1 CRITICAL, 2 HIGH, 3 MEDIUM). The previous rules-review-137 returned APPROVED with 1 MEDIUM (misleading Struggle comment). The developer applied fixes across 7 commits. This review verifies all issues are fully resolved and no regressions were introduced.

**Diff scope:** 8 files changed, 664 insertions, 780 deletions.

## Verification of Previous Issues

### C1: `canBeCommanded` not checked in league battles — RESOLVED

**Commit:** af5ee4f

Verified in `app/composables/usePlayerCombat.ts` lines 109-116:
```typescript
const canBeCommanded = computed((): boolean =>
  turnState.value.canBeCommanded ?? true
)
```

The `?? true` default is correct because `canBeCommanded` is defined as a required `boolean` in `TurnState` (types/combat.ts line 60), and is initialized to `true` in all combatant creation paths (combatant.service.ts:618, encounters start.post.ts:46, template load.post.ts:118). The nullish coalesce is a defensive guard, not masking a missing field.

Verified in `PlayerCombatActions.vue`:
- Move buttons disabled condition: `:disabled="isMoveExhausted(move).exhausted || !canUseStandardAction || !canBeCommanded"` (line 90)
- Struggle button disabled: `:disabled="!canUseStandardAction || !canBeCommanded"` (line 129)
- Handler guards match template: `handleMoveSelect` (line 350) and `handleStruggleSelect` (line 360) both check `!canBeCommanded.value`
- Warning banner shown: `v-if="!canBeCommanded"` (line 33) with PhWarning icon
- Shift and Pass remain enabled (no canBeCommanded gate) -- correct per PTU rules

**Verdict:** Fully resolved. Defensive, correct, and consistent across template and script.

### H1: PlayerCombatActions.vue over 800 lines — RESOLVED

**Commit:** 867e189

File line counts after extraction:
- `PlayerCombatActions.vue`: 476 lines (down from ~1028)
- `_player-combat-actions.scss`: 578 lines (extracted styles)

The SCSS file is registered in `nuxt.config.ts` css array (line 18). Uses BEM naming convention (`.combat-actions__*`, `.move-btn__*`, `.target-selector__*`) for scoping without the `scoped` attribute -- consistent with the existing `_player-view.scss` pattern.

The component now has a comment at the bottom (line 475-476) documenting where styles live. All SCSS variables used (`$z-index-toast`, `$z-index-modal`, `$spacing-*`, `$color-*`, etc.) are verified to exist in `_variables.scss`.

**Verdict:** Fully resolved. Component well under the 800-line limit.

### H2: `app-surface.md` not updated — RESOLVED

**Commit:** b7b81c5

Verified the Player View section in `app-surface.md` now includes:
- Route description updated from generic to comprehensive
- Key player components listed (7 components with descriptions)
- Key player composables listed (usePlayerIdentity, usePlayerCombat with feature descriptions including canBeCommanded)
- Player stores documented (playerIdentity)
- Player types documented (PlayerTab, PlayerActionRequest)

**Verdict:** Fully resolved. Thorough documentation.

### M1: Duplicated `isMyTurn` logic — RESOLVED

**Commit:** 7a512e7

`PlayerEncounterView.vue` now uses the composable:
```typescript
const { isMyTurn, currentCombatant } = usePlayerCombat()
```

The previous inline computed (which duplicated the character/pokemon ID matching logic) was removed entirely. Confirmed by diff: 13 lines removed, 2 lines added.

The props `myCharacterId` and `myPokemonIds` remain on the component because they are passed to `PlayerCombatantInfo` children for display purposes (highlighting the player's own combatants in the list). These are NOT dead props.

**Verdict:** Fully resolved. Single source of truth for turn detection.

### M2: `alert()` calls — RESOLVED

**Commit:** 58673d8

All three `alert()` calls replaced with `showToast()`:
- `confirmTargetSelection` catch: `showToast('Action failed: ...', 'error')`
- `handleShift` catch: `showToast('Shift failed: ...', 'error')`
- `confirmPassTurn` catch: `showToast('Pass turn failed: ...', 'error')`

The toast system was enhanced with severity support:
- `toastSeverity` ref tracks `'success' | 'error'`
- Error toasts display for 4000ms (vs 2500ms for success)
- Error toasts use `PhWarningCircle` icon, success uses `PhCheckCircle`
- CSS classes `combat-actions__toast--success` and `combat-actions__toast--error` with appropriate colors

Timer cleanup on `onUnmounted` (line 470-472) prevents memory leaks.

**Verdict:** Fully resolved. Clean UX upgrade.

### M3: Dead `PlayerActionPanel.vue` — RESOLVED

**Commit:** f8931ab

Verified `app/components/encounter/PlayerActionPanel.vue` no longer exists on disk. Grep for `PlayerActionPanel` in all `.vue` and `.ts` files returns zero source code results (only artifact/documentation references remain, which is correct).

**Verdict:** Fully resolved.

### MEDIUM-001 (rules-review-137): Misleading Struggle comment — RESOLVED

**Commit:** af5ee4f

In `usePlayerCombat.ts`, the `useStruggle` JSDoc was changed from:
```
Available when no usable moves remain.
```
to:
```
Available as a Standard Action alternative to using a Move.
```

This is correct per PTU rules -- Struggle is always available as a Standard Action, not gated behind move exhaustion.

**Verdict:** Fully resolved.

## Regression Check

1. **No orphan imports:** `PlayerActionPanel` has zero source code references. `canBeCommanded` is wired through type -> service -> composable -> component.
2. **SCSS variable resolution:** All SCSS variables used in `_player-combat-actions.scss` exist in `_variables.scss` (verified `$z-index-toast`, `$z-index-modal`, `$color-warning`, `$color-danger`, `$color-success`, etc.).
3. **Composable dual-instantiation is safe:** Both `PlayerEncounterView` and `PlayerCombatActions` call `usePlayerCombat()` independently. Since all computed properties derive from Pinia store singletons, both instances read identical reactive state with no duplication risk.
4. **Immutability:** `toggleTarget` uses `filter()` and spread to create new arrays (lines 370-376). Toast state uses direct ref assignment. No mutation patterns found.
5. **Cleanup:** `toastTimer` cleared on `onUnmounted` (line 470-472). Panel state reset on turn end via watcher (line 460-468).

## Observations (Pre-existing, Not From This Fix Cycle)

- `hasUsableMoves` is destructured from `usePlayerCombat()` in `PlayerCombatActions.vue` (line 309) but never used in the template or script. This is a pre-existing unused import, not introduced by this fix cycle. It may be used by P2 features (e.g., auto-showing Struggle prompt when no moves remain). Not blocking.

## What Looks Good

1. **Fix quality is high.** Each commit addresses exactly one issue with surgical precision. No scope creep, no unnecessary changes bundled together.
2. **Commit granularity is excellent.** 7 issues, 7 commits, each with clear conventional commit messages referencing the review issue they fix.
3. **The canBeCommanded implementation is defensive.** The `?? true` fallback, consistent template + handler guards, and clear warning banner create a robust user experience.
4. **SCSS extraction follows established patterns.** The BEM naming, nuxt.config registration, and component comment match the existing `_player-view.scss` precedent.
5. **Toast system is a genuine UX improvement** over raw `alert()` calls, with proper severity differentiation, auto-dismiss timing, and animation transitions.

## Verdict

**APPROVED**

All 7 issues from code-review-147 and the 1 MEDIUM from rules-review-137 are fully resolved. No regressions introduced. Code quality is good, patterns are consistent, and commit hygiene is clean.
