---
review_id: code-review-147
review_type: code
reviewer: senior-reviewer
trigger: design-implementation
target_report: feature-003
domain: player-view
commits_reviewed:
  - c8113d1
  - c46b974
  - ba8d298
  - e5fb03b
files_reviewed:
  - app/composables/usePlayerCombat.ts
  - app/components/player/PlayerCombatActions.vue
  - app/components/player/PlayerEncounterView.vue
verdict: CHANGES_REQUIRED
issues_found:
  critical: 1
  high: 2
  medium: 3
reviewed_at: 2026-02-23T14:00:00Z
follows_up: code-review-144
---

## Review Scope

P1 Track A implementation for feature-003: Full Player View. 4 commits adding player combat actions. Scope: new `usePlayerCombat` composable (384 lines), new `PlayerCombatActions` component (1002 lines), modified `PlayerEncounterView` integration (+3/-20 lines), and a cleanup commit removing unused imports. Total: 1389 insertions, 20 deletions across 3 files.

Verified against:
- Design spec: `design-player-view-core-001.md` P1 section (acceptance criteria lines 665-679)
- Type definitions: `PlayerActionRequest` in `types/api.ts`, `TurnState` in `types/combat.ts`, `Move` / `MoveFrequency` in `types/character.ts`
- Store API: `encounter.ts` actions (`executeMove`, `useAction`, `nextTurn`)
- WebSocket: `useWebSocket.ts` send(), `ws.ts` player_action handler
- Constants: `COMBAT_MANEUVERS` in `constants/combatManeuvers.ts`

## Issues

### CRITICAL

#### C1: `canBeCommanded` not checked — league battle correctness bug

**File:** `app/composables/usePlayerCombat.ts` (lines 96-107) + `app/components/player/PlayerCombatActions.vue` (lines 73, 107-138)

The composable exposes `turnState` which includes the `canBeCommanded` boolean from `TurnState` (types/combat.ts line 60). In league battles, a newly switched-in Pokemon cannot be commanded on the turn it enters. However, neither the composable nor the component checks this field.

**Impact:** A player could command a Pokemon that was just switched in during a league battle, violating PTU rules. This is a correctness bug in a core game mechanic.

**Fix:** Add a computed `canBeCommanded` property to the composable. The component should disable all move buttons, the struggle button, and display a "Cannot command this Pokemon this turn" message when `canBeCommanded` is false. The shift and pass buttons can remain enabled (the combatant can still shift and end their turn). Acceptance criterion line 678: "League battle phases (trainer declaration vs pokemon action) are handled correctly."

```ts
// In usePlayerCombat.ts
const canBeCommanded = computed((): boolean =>
  turnState.value.canBeCommanded ?? true
)
```

```html
<!-- In PlayerCombatActions.vue, add disable condition to moves -->
:disabled="isMoveExhausted(move).exhausted || !canUseStandardAction || !canBeCommanded"

<!-- Add notice when not commandable -->
<div v-if="!canBeCommanded" class="combat-actions__not-commandable">
  This Pokemon cannot be commanded this turn.
</div>
```

### HIGH

#### H1: `PlayerCombatActions.vue` exceeds 800-line project limit (1002 lines)

**File:** `app/components/player/PlayerCombatActions.vue` (1002 lines)

The project CLAUDE.md enforces a maximum of 800 lines per file. The breakdown is:
- Template: ~265 lines
- Script: ~189 lines
- Style: ~543 lines

The template and script are well-structured and reasonable in size. The style section at 543 lines is the primary contributor to the overage. The styles are all component-specific (not duplicated elsewhere), but the sheer volume pushes the file over the limit.

**Fix:** Extract the SCSS into a dedicated file `app/assets/scss/components/_player-combat-actions.scss` and import it via `nuxt.config.ts` (same pattern as `_player-view.scss` and `_create-form.scss`). Remove the scoped style block and use BEM class naming (already in place) for scoping. This brings the component file to ~457 lines. Alternatively, keep a minimal scoped `<style>` block with just the animation keyframe and transition, and move the bulk to the extracted file.

#### H2: `app-surface.md` not updated with new composable and component

**File:** `.claude/skills/references/app-surface.md`

The project checklist requires updating `app-surface.md` when new endpoints, components, routes, stores, or composables are created. Two new surface entries are missing:
- `app/composables/usePlayerCombat.ts` — player combat action composable
- `app/components/player/PlayerCombatActions.vue` — player combat action UI

**Fix:** Add both entries to the appropriate sections of `app-surface.md`.

### MEDIUM

#### M1: Duplicated `isMyTurn` logic between composable and `PlayerEncounterView`

**File:** `app/components/player/PlayerEncounterView.vue` (lines 97-106) and `app/composables/usePlayerCombat.ts` (lines 31-38)

`PlayerEncounterView.vue` computes `isMyTurn` using `props.myCharacterId` and `props.myPokemonIds`. The `usePlayerCombat` composable also computes `isMyTurn` internally using `playerStore.character.id` and `playerStore.pokemon`. Both do the same thing with different data sources.

This creates a subtle risk: if the player store and the props diverge (e.g., stale props after a character switch), the two `isMyTurn` values could disagree. The `PlayerEncounterView` uses its `isMyTurn` to show/hide `PlayerCombatActions`, while inside `PlayerCombatActions`, the composable's `isMyTurn` gates action execution.

**Fix:** `PlayerEncounterView` should use the composable's `isMyTurn` instead of computing its own. Import `usePlayerCombat` in `PlayerEncounterView` or pass the composable's `isMyTurn` as a prop. This ensures a single source of truth.

#### M2: `alert()` calls for error handling in PlayerCombatActions

**File:** `app/components/player/PlayerCombatActions.vue` (lines 373, 396, 409)

Three places use `alert()` for error feedback: target confirmation failure (line 373), shift failure (line 396), and pass turn failure (line 409). The P0 fix cycle (code-review-139, M3) already replaced an `alert()` in `PlayerIdentityPicker` with inline error display. Using `alert()` is inconsistent with that fix and blocks the UI thread on mobile.

**Fix:** Replace `alert()` calls with the existing `showToast()` pattern already in the component (lines 417-423), using a distinct error style. For example:

```ts
showToast(`Move failed: ${err.message || 'Unknown error'}`, 'error')
```

This requires extending `showToast` to accept a severity parameter and adding an error variant CSS class to the toast.

#### M3: Design-specified file modification not addressed: `PlayerActionPanel.vue`

**File:** `app/components/encounter/PlayerActionPanel.vue`

The P1 design spec (design-player-view-core-001.md line 660) says: "`app/components/encounter/PlayerActionPanel.vue` | Either replace with PlayerCombatActions or update to use PTU turn state instead of legacy action tracking."

This file still exists with legacy `actionsRemaining` tracking. It is not imported anywhere (verified via grep), so it is dead code. While not causing a runtime bug, leaving dead code that overlaps with the new implementation creates confusion.

**Fix:** Delete `PlayerActionPanel.vue` or add a deprecation comment referencing `PlayerCombatActions.vue`. Prefer deletion since it is unused.

## What Looks Good

1. **Composable/component separation is clean.** `usePlayerCombat` handles all logic (turn detection, store integration, WS messaging) while `PlayerCombatActions.vue` is pure UI. This follows the project's SRP pattern.

2. **Move frequency exhaustion is complete.** All 9 `MoveFrequency` values are handled in the switch statement with correct thresholds. EOT logic correctly compares `lastTurnUsed` against `currentRound - 1`.

3. **Immutability is respected.** The `toggleTarget` handler (line 356-361) creates new arrays via spread/filter rather than mutating `selectedTargetIds`. All refs use `.value` assignment rather than in-place mutation.

4. **WebSocket message format is correct.** The `player_action` messages match the `PlayerActionRequest` interface in `types/api.ts`. The `send()` call format `{ type: 'player_action', data: request }` matches the `WebSocketEvent` union type. The server `ws.ts` handler (line 196) already forwards from player role clients to GM peers.

5. **Target selector UX is well-designed.** Multi-select with visual feedback, cancel button with proper cleanup via `resetTargetSelector()`, overlay that hides main action panels during selection. Touch targets meet the 44x44px minimum.

6. **Cleanup on turn change and unmount.** The `watch(isMyTurn)` handler (lines 444-452) resets all panels and the target selector when the turn ends. `onUnmounted` clears the toast timer. No dangling event listeners or intervals.

7. **Error handling pattern is consistent in the composable.** All async action methods throw on failure (after the store itself throws), enabling the component to catch and display errors.

8. **Store API usage is correct.** `executeMove(combatant.id, moveId, targetIds)` matches the store's `executeMove(actorId, moveId, targetIds)` signature. `useAction(combatant.id, 'shift')` matches `useAction(combatantId, actionType)`. `nextTurn()` matches.

9. **Mobile-first styling is thorough.** Touch targets meet minimums, `-webkit-tap-highlight-color: transparent` on interactive elements, animations are subtle (no motion sickness concerns), fixed toast at bottom avoids keyboard overlap.

## Verdict

**CHANGES_REQUIRED**

One CRITICAL issue (C1: `canBeCommanded` not checked in league battles) must be fixed before approval. Two HIGH issues (H1: file over 800-line limit, H2: `app-surface.md` not updated) must also be addressed. Three MEDIUM issues should be fixed in this cycle since the developer is already in the code and the fixes are straightforward.

## Required Changes

| ID | Severity | Summary | Effort |
|----|----------|---------|--------|
| C1 | CRITICAL | Check `canBeCommanded` in composable and disable moves/struggle when false | Small — add computed + disable condition |
| H1 | HIGH | Extract SCSS to `_player-combat-actions.scss` to bring file under 800 lines | Medium — move 543 lines of SCSS to external file |
| H2 | HIGH | Add `usePlayerCombat` and `PlayerCombatActions` to `app-surface.md` | Trivial |
| M1 | MEDIUM | Deduplicate `isMyTurn` — use composable's version in `PlayerEncounterView` | Small — replace 8 lines |
| M2 | MEDIUM | Replace `alert()` with toast-based error display | Small — 3 call sites |
| M3 | MEDIUM | Delete unused `PlayerActionPanel.vue` (dead code) | Trivial |
