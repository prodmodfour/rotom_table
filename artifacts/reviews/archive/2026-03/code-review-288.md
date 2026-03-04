---
review_id: code-review-288
review_type: code
reviewer: senior-reviewer
trigger: design-implementation
target_report: feature-023
domain: player-view
commits_reviewed:
  - 346b325d
  - 7e3d03ad
  - f4c5d437
files_reviewed:
  - app/components/player/PlayerHealingPanel.vue
  - app/components/player/PlayerCombatActions.vue
  - app/composables/usePlayerCombat.ts
  - app/assets/scss/components/_player-combat-actions.scss
  - app/types/player-sync.ts
  - app/constants/healingItems.ts
  - artifacts/designs/design-player-capture-healing-001/_index.md
  - artifacts/tickets/in-progress/feature/feature-023.md
verdict: CHANGES_REQUIRED
issues_found:
  critical: 0
  high: 2
  medium: 2
reviewed_at: 2026-03-02T19:30:00Z
follows_up: null
---

## Review Scope

Feature-023 P2: Player Healing UI. Two feature commits add `PlayerHealingPanel.vue` (414 lines) with Take a Breather and Use Healing Item tabs, and wire the Heal button + panel into `PlayerCombatActions.vue`. One docs commit updates the design `_index.md` status and ticket resolution log.

P0 and P1 are fully approved. This is the first review of P2.

**Decrees checked:**
- decree-013 (1d100 capture system): Not applicable to healing P2.
- decree-032 (Cursed tick on actual Standard Action use): Relevant if a breather request triggers a Cursed tick. The player side does not execute the breather; it sends a request for GM approval. GM-side execution handles tick logic. No violation here.

**Design spec verified:** `artifacts/designs/design-player-capture-healing-001/spec-p2.md`, Sections I through L.

## Issues

### HIGH-1: `app-surface.md` not updated with PlayerHealingPanel

**File:** `.claude/skills/references/app-surface.md`

The P1 fix cycle (code-review-280 HIGH-1) required `app-surface.md` to be updated with `PlayerCapturePanel` and `usePlayerCapture`. P2 adds a new component (`PlayerHealingPanel.vue`) but did not update `app-surface.md`. The feature-023 entry at line 164 references `PlayerCapturePanel` but not `PlayerHealingPanel`. This is the same class of issue that was caught and required in the P1 review cycle.

**Fix:** Add `PlayerHealingPanel.vue` (breather + healing item request tabs, feature-020 HEALING_ITEM_CATALOG integration, assisted breather option) to the feature-023 entry in `app-surface.md`.

### HIGH-2: No mutual exclusion between request panels

**File:** `app/components/player/PlayerCombatActions.vue`

All five request panels (`showItemPanel`, `showSwitchPanel`, `showManeuverPanel`, `showCapturePanel`, `showHealingPanel`) are independent `ref(false)` values. Clicking "Heal" while the "Capture" panel is open results in both panels being visible simultaneously. The existing Item, Switch, and Maneuver panels have the same pattern -- this predates P2 -- but P2 adds a sixth panel and makes the issue worse. The healing panel contains a "Request Breather" button that sends a WebSocket message; having it visible alongside other panels increases the risk of accidental double-requests.

Each panel toggle handler (e.g., line 216: `@click="showHealingPanel = !showHealingPanel"`) should close all other panels before opening the new one. For example:

```typescript
const closeAllPanels = () => {
  showItemPanel.value = false
  showSwitchPanel.value = false
  showManeuverPanel.value = false
  showCapturePanel.value = false
  showHealingPanel.value = false
}

const togglePanel = (panel: Ref<boolean>) => {
  const wasOpen = panel.value
  closeAllPanels()
  panel.value = !wasOpen
}
```

Then each button uses `@click="togglePanel(showHealingPanel)"`.

**Note:** This pattern predates P2, but the developer is already in `PlayerCombatActions.vue` and the fix is straightforward. Fix it now.

### MED-1: `cancel` emit declared but never emitted from PlayerHealingPanel

**File:** `app/components/player/PlayerHealingPanel.vue`, line 129

The component declares `cancel: []` in `defineEmits` and the parent (`PlayerCombatActions.vue`, line 298) listens for `@cancel="showHealingPanel = false"`. However, unlike `PlayerCapturePanel` which emits `cancel` from its `cancelCapture()` function, `PlayerHealingPanel` never emits `cancel` anywhere in its script. This means the `@cancel` listener on line 298 is dead code, and there is no way for the player to close the healing panel from within it (they must click the "Heal" button again to toggle it closed).

The design spec (Section I) shows no explicit cancel/close button in the breather tab, but `PlayerCapturePanel` provides this affordance and consistency requires `PlayerHealingPanel` to do the same -- either via a close button that emits `cancel`, or by removing the dead emit declaration and `@cancel` listener. Since the items tab already has a "Back to items" button, adding a similar close/cancel mechanism to the panel level would be the consistent approach.

**Fix:** Either add a cancel/close button that emits `cancel`, or remove the unused emit declaration and the dead `@cancel` listener from the parent.

### MED-2: `healTargets` filter logic has redundant condition

**File:** `app/components/player/PlayerHealingPanel.vue`, line 247

```typescript
return hp < maxHp || hp <= 0
```

If `hp <= 0` and `maxHp > 0` (which should always be true), then `hp < maxHp` already covers the `hp <= 0` case. The `|| hp <= 0` clause is logically redundant. The design spec (Section K) had this same redundancy.

More importantly, the spec notes that the filter should distinguish between restoratives (not at full HP, not fainted), revives (must be fainted), and cures (must have target condition). The current implementation collapses all these into a single "damaged or fainted" filter. While the comment says "GM validates the specifics," showing a Potion as valid for a fainted Pokemon (0 HP) is misleading UX -- the GM will reject it, wasting a request cycle.

**Fix:** Remove the redundant `|| hp <= 0` clause. Consider (but not required for this review) filtering revive-only items to fainted targets in a future iteration. The current simplified filter is acceptable given the "GM validates" model, but clean up the redundant logic.

## What Looks Good

1. **Breather action cost modeling is correct.** The `canRequestBreather` computed checks both `canUseStandardAction` and `canUseShiftAction`, correctly reflecting the Full Action (Standard + Shift) cost per PTU p.245. The button is disabled when either action is unavailable. The UI clearly labels "Full Action (Standard + Shift)" in the action cost display.

2. **Assisted breather implementation is well-designed.** The `hasAdjacentAlly` computed does a simplified client-side check (alive player-side combatant exists), with full adjacency validation deferred to the GM side. The checkbox is disabled with a helpful "(requires adjacent ally)" hint. The assisted breather description accurately conveys the mechanical difference (Tripped + 0 Evasion instead of Tripped + Vulnerable).

3. **Request-only model is preserved.** Neither breather nor healing item actions are executed client-side. Both go through `requestBreather` / `requestHealingItem` in `usePlayerCombat.ts`, which send `player_action` WebSocket messages. GM approval is required before any game state changes.

4. **Feature-020 integration is clean.** The `healingItemsAvailable` computed checks if `HEALING_ITEM_CATALOG` is populated, and the "Use Item" tab only appears when it is. Since `HEALING_ITEM_CATALOG` in `constants/healingItems.ts` has 15 entries, the tab will render. The item list correctly filters against the trainer's inventory. If feature-020 were ever removed, the tab would gracefully disappear.

5. **Consistent patterns with P1 (PlayerCapturePanel).** The component follows the same structure: emits `request-sent` and `cancel`, uses `requestPending` with 2s timeout, calls the composable request function, closes via the parent `handleHealingRequestSent` handler. Tab-based UI within a panel is a clean extension.

6. **Turn-end cleanup is correct.** The `watch(isMyTurn)` watcher in `PlayerCombatActions.vue` (line 623-631) includes `showHealingPanel.value = false`, preventing stale panels from persisting across turns.

7. **Side string casing is correct.** The `hasAdjacentAlly` and `healTargets` computeds use lowercase `'players'` and `'allies'` for side checks, matching the fix applied in the P1 fix cycle (CRIT-1, `captureTargets` `'Enemies'` -> `'enemies'`).

8. **File sizes are within limits.** `PlayerHealingPanel.vue` at 414 lines and `PlayerCombatActions.vue` at 641 lines are both under the 800-line cap.

9. **SCSS follows project patterns.** The `--heal` variant uses `$color-accent-pink` consistent with the BEM naming convention. The `healing-panel` styles use SCSS variables (`$spacing-xs`, `$font-size-xs`, etc.) rather than hardcoded values, matching the P1 fix cycle MED-1 fix.

10. **Type safety is solid.** `PlayerActionRequest` in `player-sync.ts` includes the `combatantId`, `assisted`, `healingItemName`, `healingTargetId`, `healingTargetName` fields needed by the two request types. The `HealingItemDef` type from `constants/healingItems.ts` is used correctly for `selectedHealingItem` and `availableHealingItems`.

## Verdict

**CHANGES_REQUIRED** -- 0 critical, 2 high, 2 medium issues.

## Required Changes

| ID | Severity | Summary | File(s) |
|----|----------|---------|---------|
| HIGH-1 | HIGH | Update `app-surface.md` with PlayerHealingPanel | `.claude/skills/references/app-surface.md` |
| HIGH-2 | HIGH | Add mutual exclusion between request panels (close others when opening one) | `app/components/player/PlayerCombatActions.vue` |
| MED-1 | MEDIUM | Fix dead `cancel` emit -- either add a close button that emits it, or remove the dead code | `app/components/player/PlayerHealingPanel.vue`, `app/components/player/PlayerCombatActions.vue` |
| MED-2 | MEDIUM | Remove redundant `|| hp <= 0` in `healTargets` filter | `app/components/player/PlayerHealingPanel.vue` |
