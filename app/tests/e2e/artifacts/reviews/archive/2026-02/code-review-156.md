---
review_id: code-review-156
review_type: code
reviewer: senior-reviewer
trigger: bug-fix
target_report: feature-003-track-c-fix-rereview
domain: player-view
commits_reviewed:
  - 351044d
  - f7fe05e
  - a60801e
  - f790503
  - 42ddbce
  - 4abfcea
  - f3e93b2
  - a183103
  - f11acfd
files_reviewed:
  - app/composables/usePlayerWebSocket.ts
  - app/composables/usePlayerCombat.ts
  - app/composables/usePlayerScene.ts
  - app/composables/useWebSocket.ts
  - app/pages/player/index.vue
  - app/server/routes/ws.ts
  - app/server/api/player/action-request.post.ts
  - app/server/api/scenes/active.get.ts
  - app/server/utils/pendingRequests.ts
  - .claude/skills/references/app-surface.md
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
reviewed_at: 2026-02-24T23:45:00Z
follows_up: code-review-153
---

## Review Scope

Re-review of 9 fix commits addressing all 7 issues raised in code-review-153 (1 critical, 3 high, 3 medium). The original code was rules-approved in rules-review-143. This review verifies each fix is complete and checks for regressions.

---

## Issue Resolution Verification

### C1: Multiple WebSocket connections per player client -- RESOLVED

**Commits:** 351044d, f11acfd

The fix correctly eliminates all redundant `useWebSocket()` calls:

1. **`player/index.vue`** no longer calls `useWebSocket()` directly. Line 106 now gets `isConnected`, `identify`, `joinEncounter`, `send`, and `activeScene` from `usePlayerWebSocket()`, which is the sole owner of the WebSocket connection for the player page.

2. **`usePlayerCombat.ts`** no longer calls `useWebSocket()` directly. Lines 10-11 define a `PLAYER_WS_SEND_KEY` injection key, and lines 27-34 use `inject(PLAYER_WS_SEND_KEY)` to receive the `send` function from the parent. If the injection is missing, it logs an error instead of silently failing -- good defensive pattern.

3. **`player/index.vue`** line 109 calls `provide(PLAYER_WS_SEND_KEY, send)` to make the shared send function available to all child components.

4. **Verified no other player components call `useWebSocket()` directly.** `PlayerEncounterView.vue` and `PlayerCombatActions.vue` both call `usePlayerCombat()` which uses the injected send.

5. **`usePlayerWebSocket()` is called exactly once** (in `player/index.vue` line 106). No child components or composables create additional instances.

**Result:** Exactly 1 WebSocket connection per player client. Call chain: `player/index.vue` -> `usePlayerWebSocket()` -> `useWebSocket()` -> single WebSocket. GM and Group views are unaffected (they still call `useWebSocket()` directly on their own pages).

### H1: REST fallback ack dropped -- RESOLVED

**Commit:** f7fe05e

The fix extracts the `pendingRequests` map into a shared server utility (`app/server/utils/pendingRequests.ts`) with three exported functions: `registerPendingRequest`, `consumePendingRequest`, and `getPendingRequest`.

1. **`ws.ts`** imports `registerPendingRequest` and `consumePendingRequest` from the shared utility. `forwardToGm` (line 28) calls `registerPendingRequest`. `routeToPlayer` (line 45) calls `consumePendingRequest`.

2. **`action-request.post.ts`** imports `registerPendingRequest` from the same utility (line 2). Lines 27-29 register the requestId before forwarding to GM peers, using the same shared map.

3. **Cleanup logic** is preserved: 60s TTL, 30s cleanup interval, `process.on('beforeExit')` teardown. Module-level `setInterval` runs once when first imported. Map mutation during `for...of` iteration is safe in JS.

4. **`consumePendingRequest`** is single-use (deletes entry after read), preventing duplicate ack routing.

**Result:** When a player submits an action via REST, the requestId is registered in the shared map. When the GM later sends `player_action_ack` via WebSocket, `routeToPlayer` finds the entry and routes the ack back to the originating player. Both WS and REST paths now share the same pendingRequests instance.

### H2: Player scene view goes stale after granular changes -- RESOLVED

**Commit:** a60801e

The fix adds handlers for all 9 granular scene events in `usePlayerWebSocket.ts` lines 131-143:

- `scene_update`
- `scene_character_added` / `scene_character_removed`
- `scene_pokemon_added` / `scene_pokemon_removed`
- `scene_group_created` / `scene_group_updated` / `scene_group_deleted`
- `scene_positions_updated`

All fall through to the same action: `fetchActiveScene()`. This is the correct approach -- it avoids complex incremental patching while ensuring the player view stays consistent with the GM's scene state. The REST endpoint (`/api/scenes/active`) returns the fully enriched scene with correct `isPlayerCharacter` and `ownerId` values from the DB.

The `scene_activated` event (line 125) also calls `fetchActiveScene()` instead of the previous approach of mapping the raw broadcast data with hardcoded values. This resolves the M1 issue simultaneously.

**Result:** Any scene modification by the GM (add/remove characters, pokemon, groups, update weather, update positions) triggers a fresh REST fetch, keeping the player scene view current.

### H3: Duplicate identification logic -- RESOLVED

**Commit:** f790503

The fix removes three duplicate identification paths from `player/index.vue`:

1. **Removed:** `watch(isConnected, ...)` reconnection handler that called `identify()` on reconnect.
2. **Removed:** `identify()` call inside `handleSelectCharacter` (redundant with the watch in `usePlayerWebSocket`).
3. **Removed:** `identify()` call inside `onMounted` after `restoreIdentity` (redundant with the watch).

Identification is now owned by `usePlayerWebSocket` via its watch (lines 163-178), which fires when `isConnected` or `characterId` changes and calls `identify('player', encounterStore.encounter?.id, characterId)`.

**One remaining `identify()` call in the page:** Line 170 inside `checkForActiveEncounter`, which provides the freshly discovered `encounterId`. This is correct and necessary -- when a new encounter is discovered, the watch in `usePlayerWebSocket` does not fire (neither `isConnected` nor `characterId` changed), so the page must explicitly re-identify with the new encounter context. On reconnect, both the `useWebSocket` auto-re-identify (which stores role + encounterId) and the `usePlayerWebSocket` watch will fire, sending two identify messages. The server handles this gracefully (overwrites ClientInfo), so this is benign.

**Result:** Identification logic is consolidated into `usePlayerWebSocket` for connection lifecycle events, with one justified exception for encounter discovery.

### M1: Hardcoded isPlayerCharacter -- RESOLVED

**Commits:** a60801e, 42ddbce

Two complementary fixes:

1. **`scene_activated` handler** (usePlayerWebSocket.ts line 125-128): Instead of mapping the broadcast data with `isPlayerCharacter: true`, it now calls `fetchActiveScene()` to get enriched data from the REST endpoint.

2. **REST endpoint enrichment** (active.get.ts lines 27-44): The `/api/scenes/active` endpoint now queries `HumanCharacter.isPlayerCharacter` from the DB and enriches each character. Same for `Pokemon.ownerId`.

3. **`usePlayerScene.ts`** line 94: `isPlayerCharacter: c.isPlayerCharacter ?? false` -- correctly uses the enriched DB value, defaulting to `false` (not `true`) when absent.

**Result:** The player scene view correctly displays "PC" or "NPC" tags. NPCs no longer show as PCs. All three data paths (scene_sync, scene_activated, REST fallback) now produce correct `isPlayerCharacter` values.

### M2: Dead handleCharacterUpdate -- RESOLVED

**Commit:** 4abfcea

The fix implements the actual refresh logic in `handleCharacterUpdate` (usePlayerWebSocket.ts lines 95-102):

```ts
const handleCharacterUpdate = (data: { id?: string }): void => {
  if (!playerStore.characterId) return
  const entityId = data?.id
  if (entityId === playerStore.characterId || playerStore.pokemonIds.includes(entityId ?? '')) {
    refreshCharacterData()
  }
}
```

The `character_update` case is added to the switch statement (line 121-122). The duplicate listener in `player/index.vue` is removed -- the page now has only a comment (line 216) noting that handling lives in `usePlayerWebSocket`.

**Result:** `character_update` events for the player's own character or pokemon trigger `refreshCharacterData()`. No dead code remains. SRP is maintained -- all WS event handling lives in the composable.

### M3: app-surface not updated -- RESOLVED

**Commit:** f3e93b2

Verified `app-surface.md` now includes:

- **Player composables section** lists `usePlayerWebSocket.ts` and `usePlayerScene.ts` with descriptions.
- **Player types section** lists `types/player-sync.ts`.
- **Player components section** lists `PlayerSceneView.vue`.
- **Player API endpoints section** lists `POST /api/player/action-request` with description of shared pendingRequests map.
- **Player WebSocket events section** lists `keepalive`, `keepalive_ack`, `scene_sync`, `scene_request`, `player_action`, `player_action_ack`, and P1 events.
- **Server utilities section** lists `server/utils/pendingRequests.ts`.

**Result:** All new files and event types are registered in the app surface manifest.

---

## Rules Regression Check

Rules-review-143 was APPROVED on the original code. The 9 fix commits modify:

1. **WebSocket connection management** (no game logic changes)
2. **PendingRequests extraction** (moved code to shared utility, no logic change)
3. **Scene event handlers** (call fetchActiveScene, no game logic)
4. **Identification consolidation** (removed duplicates, no game logic)
5. **REST endpoint enrichment** (added DB queries for isPlayerCharacter/ownerId)
6. **handleCharacterUpdate implementation** (data refresh, no game logic)

None of the fix commits modify:
- Struggle attack specification
- Move frequency exhaustion logic
- League battle command restriction
- Action economy / turn state tracking
- Combat maneuver request protocol
- Keepalive game state isolation
- Scene data stripping for players (sendActiveScene in ws.ts is unchanged)

**No rules regressions detected.**

---

## What Looks Good

1. **Provide/inject pattern for WebSocket sharing.** The `PLAYER_WS_SEND_KEY` symbol with `InjectionKey` typing is clean and type-safe. The error logging in `usePlayerCombat` when injection is missing (line 32) is a good defensive measure for development debugging.

2. **Shared server utility extraction.** `pendingRequests.ts` is a focused, well-documented module with clear JSDoc, typed interfaces, and proper lifecycle management. The `consumePendingRequest` (single-use read) vs `getPendingRequest` (non-destructive read) API is a thoughtful separation.

3. **Fetch-on-event strategy for granular scene events.** Using a single `fetchActiveScene()` call for all 9+1 granular events avoids the complexity of incremental patching while guaranteeing data consistency. The REST endpoint enrichment ensures every fetch returns correct `isPlayerCharacter` and `ownerId` values.

4. **Clean commit history.** 9 focused commits, each addressing one specific issue with a descriptive message referencing the original issue ID (C1, H1, H2, etc.). Easy to review, easy to bisect, easy to revert individually.

5. **Immutability preserved.** `usePlayerScene.mapSceneToPlayerView` creates new objects. `usePlayerCombat` uses injected function rather than storing mutable state. `pendingRequests.ts` uses Map's built-in methods without external mutation.

6. **Minimal diff.** 231 additions, 127 deletions across 10 files. The fixes are surgical rather than sweeping. No unrelated changes mixed in.

---

## Verdict

**APPROVED**

All 7 issues from code-review-153 are fully resolved:
- C1 (multiple WS connections): eliminated via provide/inject + single composable owner
- H1 (REST ack dropped): shared pendingRequests utility used by both WS and REST paths
- H2 (stale scene view): all 9 granular scene events trigger fetchActiveScene
- H3 (duplicate identification): consolidated into usePlayerWebSocket with one justified exception
- M1 (hardcoded isPlayerCharacter): REST endpoint enriched + scene_activated uses fetchActiveScene
- M2 (dead handleCharacterUpdate): implemented with character_update case in switch
- M3 (app-surface not updated): all new files and events registered

No regressions introduced. No rules regressions from the original APPROVED rules-review-143. Code quality, immutability patterns, and SRP are maintained.

---

## Required Changes

None.
