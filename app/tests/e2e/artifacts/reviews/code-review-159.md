---
review_id: code-review-159
review_type: code
reviewer: senior-reviewer
trigger: design-implementation
target_report: feature-003-track-c-p1
domain: player-view
commits_reviewed:
  - fda245d
  - 7419874
  - 2f09939
  - 1630177
  - 5a01c60
  - 3d0b92b
  - d3eeb8e
  - 51029cb
  - 6661d43
files_reviewed:
  - app/server/routes/ws.ts
  - app/server/utils/websocket.ts
  - app/types/player-sync.ts
  - app/components/player/PlayerGroupControl.vue
  - app/composables/usePlayerGridView.ts
  - app/components/vtt/GridCanvas.vue
  - app/components/vtt/VTTToken.vue
  - app/components/player/PlayerGridView.vue
  - app/components/player/PlayerMoveRequest.vue
  - app/composables/usePlayerWebSocket.ts
  - app/composables/useStateSync.ts
  - app/components/player/PlayerEncounterView.vue
  - app/components/player/PlayerNavBar.vue
  - app/pages/player/index.vue
verdict: CHANGES_REQUIRED
issues_found:
  critical: 1
  high: 3
  medium: 3
reviewed_at: 2026-02-25T15:30:00Z
follows_up: code-review-156
---

## Review Scope

9 commits (fda245d..6661d43) implementing P1 Track C: Group View control, player VTT grid mode, action acknowledgment toast, turn notification flash, reconnect recovery, and player page wiring. 14 files, +1,355 lines.

## Issues

### CRITICAL

**C1: Distance calculation uses Chebyshev instead of PTU diagonal rules**

File: `app/components/player/PlayerGridView.vue`, lines 125-130

```typescript
const dx = Math.abs(position.x - combatant.position.x)
const dy = Math.abs(position.y - combatant.position.y)
// PTU diagonal: alternating 1m/2m, simplified as Chebyshev
const distance = Math.max(dx, dy)
```

The comment says "simplified as Chebyshev" but this produces incorrect distances. PTU diagonal movement costs alternate 1m/2m, which is `diagonals + floor(diagonals / 2) + straights` -- the formula already implemented correctly in `useGridMovement.calculateMoveDistance()`. The Chebyshev approximation understates diagonal distance. Example: a move 3 diagonal cells should cost 4m (1+2+1), but `Math.max(3,3)` returns 3.

This is the distance displayed to the player in the confirmation sheet AND sent to the GM in the `player_move_request` payload. The GM sees an incorrect distance value and makes an approval decision based on wrong information. The same correct formula is 20 lines away in `useGridMovement` -- just import and use it.

**Fix:** Import `useGridMovement` or extract the formula into a shared utility, and call `calculateMoveDistance(combatant.position, position)` instead of `Math.max(dx, dy)`.

### HIGH

**H1: Player never receives Group View tab state -- `groupViewTab` stuck at 'lobby'**

Files: `app/pages/player/index.vue` (lines 171, 199-206), `app/server/routes/ws.ts` (lines 274-279), `app/server/api/group/tab.put.ts` (line 32)

The player page initializes `groupViewTab = ref('lobby')` and listens for `tab_state` / `tab_change` WebSocket events. However:

1. `tab_sync_request` handler (ws.ts line 276) only responds to `group`-role peers. Player peers are ignored.
2. `tab_change` from `PUT /api/group/tab` is broadcast via `broadcastToGroup()`, which only sends to group-role clients.
3. The `identify` handler for player role sends `sendActiveScene(peer)` but NOT `sendTabState(peer)`.

Result: `PlayerGroupControl` always displays "Current Tab: Lobby" regardless of the actual group view state. The "Request Scene" and "Request Lobby" buttons show/hide based on stale data. A player requesting a tab change they're already on wastes a 30s cooldown for nothing.

**Fix:** Either:
- (a) Extend `sendTabState` to also work for player-role peers. Add `sendTabState(peer)` in the `identify` handler when `role === 'player'`. Also allow `tab_sync_request` for players. Also broadcast `tab_change` to players via `broadcastToGroupAndPlayers`.
- (b) Or query tab state via REST on player mount (`GET /api/group/tab`).

**H2: `isOnCooldown` computed is non-reactive after initial evaluation**

File: `app/components/player/PlayerGroupControl.vue`, line 85

```typescript
const isOnCooldown = computed(() => Date.now() < cooldownUntil.value)
```

`Date.now()` is not a reactive dependency. This computed recomputes only when `cooldownUntil` changes (once, at cooldown start). After the cooldown period expires, `isOnCooldown` remains `true` because nothing triggers re-evaluation. The UI stays stuck showing "Wait 0s" and the request buttons never reappear until the component remounts.

The `cooldownRemaining` ref IS updated every second by the interval timer, but `isOnCooldown` does not depend on it.

**Fix:** Change to `computed(() => cooldownRemaining.value > 0)`. This makes the computed depend on the interval-driven reactive ref. Alternatively, reset `cooldownUntil.value = 0` inside the interval callback when remaining reaches 0.

**H3: Multi-cell token click detection ignores token size in player mode**

File: `app/components/vtt/GridCanvas.vue`, lines 273-274

```typescript
const clickedToken = props.tokens.find(t =>
  t.position.x === gridX && t.position.y === gridY
)
```

This only checks the top-left cell of a token. A 2x2 token at (5,5) occupies cells (5,5), (6,5), (5,6), (6,6), but clicking cells (6,5), (5,6), or (6,6) will NOT match the token. Instead of selecting the token, the click falls through and emits `playerCellClick`, potentially setting a move destination overlapping the player's own token.

**Fix:**
```typescript
const clickedToken = props.tokens.find(t =>
  gridX >= t.position.x && gridX < t.position.x + t.size &&
  gridY >= t.position.y && gridY < t.position.y + t.size
)
```

### MEDIUM

**M1: `refreshCharacterDataSafe` in useStateSync fetches data but discards it**

File: `app/composables/useStateSync.ts`, lines 75-90

```typescript
const response = await $fetch<{ success: boolean; data: unknown }>(
  `/api/characters/${playerStore.characterId}?include=pokemon`
)
if (response.success && response.data) {
  // Data will be updated via the character_update WS handler or
  // the existing usePlayerIdentity composable's refreshCharacterData()
  // This is just a trigger to ensure data freshness
}
```

The HTTP GET does not trigger any side effects. It fetches the character data and throws it away. The comment claims it "triggers" freshness, but a GET request to a Nitro endpoint doesn't push data anywhere. This is a wasted network call. The `usePlayerIdentity().refreshCharacterData()` does the same fetch and actually processes the response.

**Fix:** Call `usePlayerIdentity().refreshCharacterData()` instead (it's already imported in `usePlayerWebSocket`), or remove the function entirely and rely on the WS-triggered character data refresh.

**M2: `encounter_unserved` not broadcast to player-role peers**

File: `app/server/routes/ws.ts`, lines 433-449

When the GM unserves an encounter, the event is only broadcast to `group`-role clients:

```typescript
for (const [otherPeer, otherInfo] of peers) {
  if (otherPeer !== peer && otherInfo.role === 'group') {
    safeSend(otherPeer, JSON.stringify({ type: 'encounter_unserved', data: event.data }))
  }
}
```

Players in the encounter room will not be notified. The player will still see the encounter grid and can still attempt to send move requests after the encounter has been unserved. The asymmetry with `encounter_served` (which DOES reach encounter room members including players) means the player can enter encounter view but never leave it.

**Fix:** Also broadcast `encounter_unserved` to player-role peers in the same encounter, or use `broadcastToEncounter` to notify all participants.

**M3: Player mode prevents ALL left-click panning on the grid**

File: `app/components/vtt/GridCanvas.vue`, lines 257-281

```typescript
if (props.playerMode && event.button === 0) {
  // ... always emits playerCellClick or does nothing
  return
}
interaction.handleMouseDown(event)
```

In player mode, every left-click is intercepted and treated as either a token click or a cell click. The existing panning (click-drag) behavior that `interaction.handleMouseDown` provides is completely blocked for left-click. The comment says "panning and zooming still work via middle-click/wheel" but mobile devices have neither middle-click nor scroll wheel (touch events aren't handled at all). On desktop, requiring middle-click to pan is a poor UX since many mice don't have one.

The design spec says "Pinch-to-zoom works" in the P1 acceptance criteria, but there are zero touch event handlers in GridCanvas.vue or useGridInteraction.ts. This means on mobile, the grid is not pannable or zoomable at all. Players on phones (the primary target audience for the player view) will see only whatever portion of the grid is initially visible.

**Fix:** Left-click panning should work when no token is selected (or use click-vs-drag detection to distinguish pans from taps). Touch event handling for pan and pinch-to-zoom is needed for mobile.

## What Looks Good

1. **WebSocket protocol structure.** The `forwardToGm` / `routeToPlayer` pattern with `pendingRequests` is clean and correctly decouples the player-to-GM communication. The request-response routing via `requestId` -> `characterId` is sound.

2. **Fog of war visibility filtering in usePlayerGridView.** The `visibleTokens` computed correctly filters combatants by fog state, and the three-tier information asymmetry (own/allied/enemy) is a thoughtful design for player view.

3. **Clean separation of concerns.** Each new file has a focused responsibility: `usePlayerGridView` handles grid state, `PlayerGroupControl` handles tab requests, `PlayerMoveRequest` is a pure presentation component, `useStateSync` handles reconnect recovery. The composable pattern is consistent with the codebase.

4. **Immutable state management.** `pendingActions` in usePlayerWebSocket creates new Map instances rather than mutating. `readonly()` wrappers on exposed refs prevent external mutation. Object spreads for cloning.

5. **Cleanup patterns.** All `onMounted` listeners have matching `onUnmounted` cleanups. Timers are tracked and cleared. No leaked intervals.

6. **Turn notification UX.** Haptic feedback with vibration API, visual flash, auto-switch to encounter tab. The `TURN_NOTIFY_DURATION_MS` auto-clear prevents stale notifications. The `PhLightning` icon fix commit shows attention to detail.

7. **Cooldown + timeout patterns.** The 30s cooldown on group view requests and 30s auto-timeout on pending requests are good rate-limiting mechanisms.

8. **Commit granularity.** 9 commits for this feature is appropriate. Each commit adds a coherent unit: WS handlers, then component, then composable, then integration.

## Verdict

**CHANGES_REQUIRED**

The Chebyshev distance calculation (C1) is a correctness bug that produces wrong values shown to both player and GM. The tab state blindness (H1) renders the Group View control widget effectively non-functional. The frozen cooldown (H2) locks the user out of requesting after the first request. These three issues must be fixed before approval.

## Required Changes

1. **C1 (CRITICAL):** Replace `Math.max(dx, dy)` in `PlayerGridView.vue:handleCellClick` with the PTU diagonal formula from `useGridMovement.calculateMoveDistance()`. Either import the composable, extract the formula into a shared utility, or inline the correct formula (`diagonals + floor(diagonals / 2) + straights`).

2. **H1 (HIGH):** Ensure player peers receive tab state. Extend the `identify` handler in ws.ts to call `sendTabState(peer)` for player-role clients. Allow `tab_sync_request` for player-role peers. Broadcast `tab_change` events to players (change `broadcastToGroup` to `broadcastToGroupAndPlayers` in `tab.put.ts`).

3. **H2 (HIGH):** Fix `isOnCooldown` computed to use `cooldownRemaining.value > 0` instead of `Date.now() < cooldownUntil.value`.

4. **H3 (HIGH):** Fix multi-cell token click detection to check the full bounding box `(x, y, x+size, y+size)` instead of only the origin cell.

5. **M1 (MEDIUM):** Replace the dead `refreshCharacterDataSafe` fetch with a call to `usePlayerIdentity().refreshCharacterData()` or remove it.

6. **M2 (MEDIUM):** Broadcast `encounter_unserved` to player peers in the encounter, not just group-role clients.

7. **M3 (MEDIUM):** Implement click-vs-drag detection for left-click in player mode so panning still works. Add a ticket for touch event support (pinch-to-zoom, touch panning) if not fixing in this cycle -- but note this is part of the P1 acceptance criteria ("Pinch-to-zoom works").
