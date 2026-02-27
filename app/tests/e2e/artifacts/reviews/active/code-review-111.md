---
review_id: code-review-111
ticket: ptu-rule-051
commits_reviewed: [6cba802, 0a94bb9]
verdict: CHANGES_REQUIRED
reviewer: senior-reviewer
date: 2026-02-20
---

# Code Review: ptu-rule-051 — Breather Shift Banner

## Scope

Take a Breather now prompts the GM to shift the combatant away from enemies on the VTT grid. A visible banner appears, auto-switches to grid view, and auto-dismisses when the token is moved.

**Files reviewed:**
- `app/components/encounter/BreatherShiftBanner.vue` (NEW, 114 lines)
- `app/composables/useEncounterActions.ts` (254 lines)
- `app/pages/gm/index.vue` (555 lines)
- `app/server/api/encounters/[id]/breather.post.ts` (147 lines)
- `app/constants/combatManeuvers.ts` (108 lines)

## Checklist

| Check | Status |
|---|---|
| File sizes under 800 lines | PASS (largest: gm/index.vue at 555) |
| SCSS uses project variables | PASS (all variables verified in _variables.scss) |
| No emojis in UI | PASS (uses Phosphor SVG icon) |
| Phosphor icon file exists | PASS (arrows-out-cardinal.svg verified) |
| Component props/emits clean | PASS (typed defineProps/defineEmits) |
| Icon approach matches domain pattern | PASS (SVG file approach used by 17 encounter/gm components) |
| WebSocket chain intact | PASS (broadcastUpdate called after breather, no new WS event needed) |
| No new event listeners needing cleanup | PASS (banner is declarative, no manual listeners) |
| Immutability in new code | PASS (all new code uses value assignment to refs, no object mutation) |
| Type safety | PASS (BreatherShiftResult interface, return type annotation) |

## Issues

### HIGH: Banner persists across turn changes

**Location:** `app/pages/gm/index.vue`, lines 403-414

`nextTurn()` does not clear `pendingBreatherShift`. If the GM advances the turn without moving the token (e.g., they decide to handle it later, or they forget), the banner persists into the next combatant's turn with stale information. The banner then says "X must Shift away" when it is no longer X's turn.

**Fix required:** Clear `pendingBreatherShift.value = null` inside `nextTurn()` before or after `encounterStore.nextTurn()`.

Also clear it in `endEncounter()` for completeness, even though the `v-if="!encounter"` / `v-else` structure would hide the parent container. Explicit cleanup is more robust than relying on template conditional rendering, especially if the page layout ever changes.

```typescript
const nextTurn = async () => {
  pendingBreatherShift.value = null  // <-- add this
  await encounterStore.nextTurn()
  // ... rest unchanged
}

const endEncounter = async () => {
  if (confirm('Are you sure you want to end this encounter?')) {
    pendingBreatherShift.value = null  // <-- add this
    await encounterStore.endEncounter()
  }
}
```

### MEDIUM: "Move on Grid" button and "Dismiss" have identical behavior

**Location:** `app/pages/gm/index.vue`, lines 353-358

`focusBreatherToken` sets `activeView = 'grid'` (which `handleExecuteActionWithBreatherShift` already did on line 348) and then immediately sets `pendingBreatherShift.value = null`, dismissing the banner. The "Move on Grid" button and "Dismiss" button produce the same user-visible outcome: the banner disappears. The only difference is that "Move on Grid" redundantly sets `activeView = 'grid'` (already grid).

The expected UX for "Move on Grid" should keep the banner visible so the GM sees the reminder while they move the token. The auto-dismiss on `token-move` (line 365) handles the actual clearing. Right now, clicking "Move on Grid" dismisses the banner immediately, defeating the purpose of the auto-dismiss-on-move feature.

**Fix required:** Remove the `pendingBreatherShift.value = null` line from `focusBreatherToken`. The banner should persist until the token is actually moved (handled by `handleTokenMoveWithBreatherClear`) or the GM explicitly clicks "Dismiss".

```typescript
const focusBreatherToken = () => {
  if (!pendingBreatherShift.value) return
  activeView.value = 'grid'
  // Do NOT dismiss here -- let handleTokenMoveWithBreatherClear auto-clear
  // when the GM actually moves the token
}
```

## Approved Items (no issues)

1. **`BreatherShiftBanner.vue`** -- Clean, well-structured component. BEM naming, scoped SCSS, all project variables used correctly. Animation is tasteful. 114 lines is appropriate for a presentational banner.

2. **`useEncounterActions.ts` changes** -- Minimal surface area. Return type annotation is explicit. `BreatherShiftResult` interface is well-placed as a named export. Early return changed from bare `return` to `return undefined` for type consistency.

3. **`breather.post.ts` log entry** -- Adding "SHIFT REQUIRED" to the move log is a good defensive measure. Even if the banner is missed, the combat log preserves the rule reminder.

4. **`combatManeuvers.ts` description update** -- Short description now mentions the shift requirement. Accurate per PTU p.245.

5. **Auto-dismiss on token move** -- The `handleTokenMoveWithBreatherClear` wrapper correctly checks `combatantId` match before clearing. Moving a different token does not dismiss the banner. This is well thought out.

6. **Ticket fix log correction** -- The developer correctly noted that the ticket summary said "2-square shift" but PTU p.245 actually requires full movement. Good attention to rule accuracy.

## Summary

Two issues found. The HIGH issue (stale banner on turn advance) is a real UX bug that would confuse the GM in normal gameplay. The MEDIUM issue (Move on Grid immediately dismissing) defeats the purpose of the auto-dismiss-on-move feature. Both are small fixes (3-4 lines total).
