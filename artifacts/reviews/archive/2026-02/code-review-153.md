---
review_id: code-review-153
review_type: code
reviewer: senior-reviewer
trigger: design-implementation
target_report: feature-003-track-c-p0
domain: player-view
commits_reviewed:
  - bdb7375
  - 9fff54d
  - 36cfe0a
  - 9cef926
  - 9faf826
  - 9baaede
  - 5ecf99c
  - 2c04785
  - 7a09ef0
  - 7d9956b
  - 2c7b2af
  - df3d331
files_reviewed:
  - app/types/player-sync.ts
  - app/types/api.ts
  - app/types/player.ts
  - app/types/index.ts
  - app/server/routes/ws.ts
  - app/server/utils/websocket.ts
  - app/composables/useWebSocket.ts
  - app/composables/usePlayerScene.ts
  - app/composables/usePlayerWebSocket.ts
  - app/composables/usePlayerCombat.ts
  - app/components/player/PlayerSceneView.vue
  - app/components/player/PlayerNavBar.vue
  - app/server/api/player/action-request.post.ts
  - app/server/api/scenes/[id]/activate.post.ts
  - app/server/api/scenes/[id]/deactivate.post.ts
  - app/pages/player/index.vue
verdict: CHANGES_REQUIRED
issues_found:
  critical: 1
  high: 3
  medium: 3
reviewed_at: 2026-02-24T22:30:00Z
follows_up: (none -- first review)
---

## Review Scope

Track C P0 implementation for feature-003 (Full Player View). This track expands the WebSocket protocol for player-GM communication, adds scene synchronization, and provides a REST fallback endpoint. 12 commits, 16 files changed (+1,139 / -52 lines).

Reviewed against design spec: `design-player-view-integration-001.md`, sections 1 (WebSocket Protocol), 4 (Scene View), 5 (State Sync), 6 (Cross-Track Integration), and Phase Plan P0.

---

## Issues

### CRITICAL

#### C1: Multiple WebSocket connections per player client

**Files:** `app/pages/player/index.vue` (line 104), `app/composables/usePlayerWebSocket.ts` (line 14), `app/composables/usePlayerCombat.ts` (line 16)

`useWebSocket()` is NOT a singleton -- every call creates a new `WebSocket` object, a new `onMounted(() => connect())`, a new keepalive timer, and a new reconnect loop. The player page creates multiple simultaneous connections:

1. `player/index.vue` line 104: `const { isConnected, identify, joinEncounter, onMessage } = useWebSocket()` -- connection A
2. `player/index.vue` line 107: `usePlayerWebSocket()` internally calls `useWebSocket()` at line 14 -- connection B
3. When encounter tab is active, `PlayerEncounterView` calls `usePlayerCombat()` which calls `useWebSocket()` -- connection C
4. When encounter tab is active, `PlayerCombatActions` calls `usePlayerCombat()` which calls `useWebSocket()` -- connection D

Each connection registers as a separate peer on the server, each sends keepalives every 45s, each auto-re-identifies on reconnect. The server sees 2-4 distinct peers for a single player. Messages sent on connection A are invisible to connection B's `onMessage` listeners. The `identify()` call in `usePlayerWebSocket`'s watch (line 176) identifies connection B, but the `identify()` in `player/index.vue`'s watch (line 250) identifies connection A. The `onMessage` listener in `player/index.vue` (line 222) only hears messages arriving on connection A, while the `handlePlayerMessage` in `usePlayerWebSocket` only hears messages on connection B. If the server sends `scene_sync` to the peer registered as connection A, the player scene handler on connection B never receives it.

This is a newly introduced problem. Before this PR, `player/index.vue` called `useWebSocket()` once. This PR added `usePlayerWebSocket()` which calls it again.

**Fix:** `player/index.vue` should NOT call `useWebSocket()` directly. It should get `isConnected`, `identify`, `joinEncounter`, and `onMessage` from `usePlayerWebSocket()`, which should be the single owner of the WebSocket composable for the player page. `usePlayerWebSocket` should expose the underlying WebSocket utilities that the page needs. Alternatively, restructure `useWebSocket` as a singleton (provide/inject pattern), but that's a larger refactor beyond this PR's scope. The minimum fix is: remove the direct `useWebSocket()` call from `player/index.vue` and have `usePlayerWebSocket` return the `isConnected`, `identify`, `joinEncounter`, `onMessage` values the page needs.

Similarly, `usePlayerCombat` should NOT call `useWebSocket()` directly -- it should accept `send` as a parameter or get it from the parent via provide/inject. This pre-dates this PR but is aggravated by it.

---

### HIGH

#### H1: REST fallback does not register in pendingRequests -- GM ack is silently dropped

**Files:** `app/server/api/player/action-request.post.ts`, `app/server/routes/ws.ts`

The REST fallback endpoint iterates `peers` directly and sends to GMs (lines 31-35), bypassing the `forwardToGm()` helper that registers `requestId -> characterId` in the `pendingRequests` map (ws.ts lines 53-68). When the GM later sends `player_action_ack`, the `routeToPlayer()` function (ws.ts line 75) looks up `pendingRequests` and finds nothing, so the ack is silently dropped. The player never receives acknowledgment of their REST-submitted action.

**Fix:** The REST endpoint must also register the requestId in the pendingRequests map. Either: (a) export `pendingRequests` and `forwardToGm` from ws.ts and use them in the REST handler, or (b) extract the pendingRequests map into a shared server utility (e.g., `server/utils/pendingRequests.ts`) that both ws.ts and the REST handler can import.

#### H2: Player scene view goes stale after granular scene changes

**Files:** `app/composables/usePlayerWebSocket.ts`

The `handlePlayerMessage` switch (lines 106-152) only handles `scene_sync`, `scene_deactivated`, `scene_activated`, and `player_action_ack`. It does NOT handle any of the 9 granular scene events that are now broadcast to players via `broadcastToGroupAndPlayers`:

- `scene_update` (ws.ts line 447-449)
- `scene_character_added` / `scene_character_removed`
- `scene_pokemon_added` / `scene_pokemon_removed`
- `scene_group_created` / `scene_group_updated` / `scene_group_deleted`
- `scene_positions_updated`

All of these are broadcast to player clients (websocket.ts `broadcastToGroupAndPlayers`), but the player client ignores them. If the GM adds a character to the scene, changes weather, or removes a Pokemon, the player's scene view remains frozen at the state from initial `scene_sync`.

**Fix:** Add a handler for `scene_update` that re-fetches or re-maps the scene data. The simplest approach: on any of these granular scene events, call `fetchActiveScene()` to refresh from REST. This avoids complex incremental patching while keeping the player view consistent.

#### H3: Duplicate identification logic across three locations

**Files:** `app/pages/player/index.vue` (lines 195, 237, 249-256), `app/composables/usePlayerWebSocket.ts` (lines 170-185), `app/composables/useWebSocket.ts` (lines 66-78)

Three separate locations attempt player identification:

1. `useWebSocket.ts` auto-re-identifies on reconnect (line 67) using stored identity.
2. `usePlayerWebSocket.ts` watches `isConnected + characterId` and calls `identify()` (line 176-177).
3. `player/index.vue` watches `isConnected` and calls `identify()` (line 250-251).
4. `player/index.vue` calls `identify()` in `handleSelectCharacter` (line 195) and in `onMounted` (line 237).

Even after C1 is fixed (single WebSocket instance), if identification logic remains in both `usePlayerWebSocket` AND `player/index.vue`, the same connection sends duplicate `identify` messages on every reconnect. The server handles this without error (it just overwrites ClientInfo), but it's fragile and violates SRP. The identification responsibility should live in exactly one place.

**Fix:** Consolidate all identification logic into `usePlayerWebSocket`. The page should only call `usePlayerWebSocket`'s exposed API. The `watch(isConnected, ...)` in `player/index.vue` (lines 249-256) should be removed; `usePlayerWebSocket` already handles this.

---

### MEDIUM

#### M1: `isPlayerCharacter` hardcoded to `true` in scene_activated and REST fallback handlers

**Files:** `app/composables/usePlayerWebSocket.ts` (line 135), `app/composables/usePlayerScene.ts` (line 92)

Two code paths assume all characters in a scene are player characters:

1. `usePlayerWebSocket.ts` line 135: `isPlayerCharacter: true` when mapping `scene_activated` event data.
2. `usePlayerScene.ts` line 92: comment says "Cannot determine from REST; assume visible characters are PCs."

This directly affects the UI -- `PlayerSceneView.vue` (lines 55-56) displays "PC" or "NPC" tags based on this field. With the hardcoded value, all NPCs show as "PC" in the player scene view.

The server-side `sendActiveScene()` in ws.ts (lines 174-182) correctly queries the DB to determine PC status, so `scene_sync` payloads are accurate. But `scene_activated` events from `activate.post.ts` send the raw scene data without enrichment.

**Fix:** Either (a) have `activate.post.ts` enrich the `scene_activated` payload with `isPlayerCharacter` from the DB (same query pattern as `sendActiveScene`), or (b) have the `scene_activated` handler in `usePlayerWebSocket` call `fetchActiveScene()` to get the correct data via REST (since the REST handler queries fresh from DB), or (c) have the server send a `scene_sync` event to player clients alongside the `scene_activated` event (which already happens for initial connect via `sendActiveScene`).

#### M2: Dead code in usePlayerWebSocket -- `handleCharacterUpdate` defined but never called

**File:** `app/composables/usePlayerWebSocket.ts` (lines 92-100)

The function `handleCharacterUpdate` is defined with a comment saying "the parent handles this", but: (a) it's never invoked from `handlePlayerMessage` (no `character_update` case in the switch), and (b) even if it were called, the function body is empty -- it just does an ID comparison and then nothing. The design spec says `usePlayerWebSocket` should handle `character_update`, but the implementation defers entirely to the parent's listener.

**Fix:** Either (a) remove the dead function and add a comment explaining that `player/index.vue` handles `character_update` via its own listener, or (b) implement the actual refresh logic here and remove the duplicate listener from `player/index.vue` (preferred for SRP).

#### M3: `app-surface.md` not updated with new files

**File:** `.claude/skills/references/app-surface.md`

The following new artifacts were not registered in the app surface manifest:
- `app/types/player-sync.ts` (new type file)
- `app/composables/usePlayerScene.ts` (new composable)
- `app/composables/usePlayerWebSocket.ts` (new composable)
- `app/components/player/PlayerSceneView.vue` (new component)
- `app/server/api/player/action-request.post.ts` (new endpoint)
- New WebSocket events: `keepalive`, `keepalive_ack`, `player_action_ack`, `scene_sync`, `scene_request`

**Fix:** Update `app-surface.md` with the new files and event types.

---

## What Looks Good

1. **Type definitions are thorough and well-documented.** `player-sync.ts` defines all Track C protocol types with clear JSDoc comments. P1 types (`PlayerMoveRequest`, `GroupViewRequest`, etc.) are included for protocol completeness even though only P0 is implemented -- this prevents breaking changes later.

2. **WebSocketEvent union is comprehensive.** All new event types are properly added to the discriminated union in `api.ts`, maintaining type safety across the protocol.

3. **Server-side request routing is well-designed.** The `pendingRequests` map with 60s TTL and periodic cleanup (30s interval) is a sound pattern for routing GM acks back to the originating player. The `forwardToGm` / `routeToPlayer` helper pair is clean and focused.

4. **Scene data stripping for players is correctly implemented.** The `sendActiveScene()` function in ws.ts (lines 156-228) properly queries the DB to determine PC status and Pokemon ownership, building a player-safe payload that excludes terrains and modifiers. The `SceneSyncPayload` type enforces the shape.

5. **Keepalive implementation is correct.** 45s interval well under the 100s Cloudflare idle timeout. Clean start/stop lifecycle. Server responds with `keepalive_ack` immediately. Timer cleanup on disconnect/unmount.

6. **Reconnect identity storage pattern is sound.** `useWebSocket.identify()` stores the role/encounterId/characterId and auto-re-sends on reconnect (lines 66-78). This ensures players don't need to re-select their character after a connection drop.

7. **PlayerSceneView component is clean and well-structured.** Pure presentational component receiving props. BEM SCSS naming. Phosphor Icons used correctly. Proper empty state. Responsive layout with reasonable constraints (max-height 240px for images).

8. **Immutability patterns followed throughout.** `usePlayerScene.mapSceneToPlayerView` creates new objects. `usePlayerWebSocket.sendAction` creates new Map instances instead of mutating. Refs returned as `readonly()`.

9. **Scene activate/deactivate endpoints correctly broadcastToGroupAndPlayers.** Both `activate.post.ts` and `deactivate.post.ts` were updated from the previous `broadcastToGroup` to `broadcastToGroupAndPlayers`, ensuring player clients receive scene lifecycle events.

10. **Commit granularity is excellent.** 12 focused commits, each with a clear single purpose. Types first, then server, then client composables, then components, then integration. Logical build-up order.

---

## Verdict

**CHANGES_REQUIRED**

The critical issue (C1) creates multiple simultaneous WebSocket connections per player, causing messages to be routed to the wrong connection, scene syncs to be lost, and keepalive timers to multiply. This must be fixed before merge.

H1 (REST fallback ack routing) silently drops GM acknowledgments for REST-submitted actions. H2 (stale scene view) means any scene modification after initial load is invisible to players. H3 (duplicate identification) is fragile and will cause subtle bugs even after C1 is fixed.

M1 (hardcoded isPlayerCharacter) produces incorrect UI. M2 (dead code) is misleading. M3 (app-surface) is a process gap.

---

## Required Changes

1. **[C1] Remove direct `useWebSocket()` call from `player/index.vue`.** Have `usePlayerWebSocket` expose `isConnected`, `identify`, `joinEncounter`, and `onMessage` so the page uses a single WebSocket instance. Remove the separate `useWebSocket()` call from the page.

2. **[H1] Register REST action requests in pendingRequests.** Extract the pendingRequests map to a shared utility, or export `forwardToGm` from ws.ts, so the REST fallback endpoint can register the requestId for response routing.

3. **[H2] Handle granular scene events in `usePlayerWebSocket`.** At minimum, add a `scene_update` case that calls `fetchActiveScene()`. This ensures the player scene view stays current when the GM modifies the active scene.

4. **[H3] Consolidate identification logic.** Remove the `watch(isConnected, ...)` from `player/index.vue` (lines 249-256). Let `usePlayerWebSocket` own all identification/reconnection behavior. The page should delegate to the composable.

5. **[M1] Fix `isPlayerCharacter` for `scene_activated` events.** Either enrich the payload server-side or re-fetch via REST when `scene_activated` is received.

6. **[M2] Remove dead `handleCharacterUpdate` function** from `usePlayerWebSocket`, or implement it and remove the duplicate listener from `player/index.vue`.

7. **[M3] Update `app-surface.md`** with the 5 new files and new WebSocket event types.
