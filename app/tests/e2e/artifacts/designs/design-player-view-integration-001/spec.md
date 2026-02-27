# Specification

## 1. WebSocket Protocol

### 1.1 Current Gaps

1. `ClientInfo` only supports `'gm' | 'group'` -- no `'player'` role on server.
2. `player_action` only accepted from `'group'` role clients.
3. No `characterId` tracking -- server cannot identify which player is which.
4. No per-player message routing -- no way to send a response to a specific player.
5. No keepalive -- Cloudflare Tunnel's 100s idle timeout drops connections.
6. No action acknowledgment -- players get no feedback on whether GM received their request.

### 1.2 Updated `ClientInfo`

```typescript
interface ClientInfo {
  role: 'gm' | 'group' | 'player'
  encounterId?: string
  characterId?: string   // Which character this player connection represents
}
```

### 1.3 New Message Types

**Connection & Identity** -- `identify` updated to include `characterId`. New `keepalive`/`keepalive_ack` pair (45s interval, prevents tunnel timeout).

**Player Actions** (all `[NEW]` except `player_action` which is `[UPDATED]`):

| Message | Direction | Purpose |
|---------|-----------|---------|
| `player_action` | Player -> GM | Structured action request with `requestId` tracking |
| `player_action_ack` | GM -> Player | GM accepts/rejects action |
| `player_turn_notify` | Server -> Player | Targeted turn notification with available actions |
| `player_move_request` | Player -> GM | Token movement request with from/to positions |
| `player_move_response` | GM -> Player | Approve/reject/modify movement |

**Group View Control** (`[NEW]`):

| Message | Direction | Purpose |
|---------|-----------|---------|
| `group_view_request` | Player -> GM | Request tab change (scene/lobby) |
| `group_view_response` | GM -> Player | Approve/reject tab change |

**Scene Sync** (`[NEW]`):

| Message | Direction | Purpose |
|---------|-----------|---------|
| `scene_sync` | Server -> Player | Push active scene data on connect/activation |
| `scene_request` | Player -> Server | Request current active scene |

**Existing events unchanged:** All encounter events (`encounter_update`, `turn_change`, `damage_applied`, etc.) already broadcast to all clients in an encounter room. `character_update` now also triggers player identity refresh. `movement_preview` now also sent to player-role clients. Scene events now routed to player clients via `broadcastToGroupAndPlayers`.

### 1.4 TypeScript Interfaces

```typescript
// types/player-sync.ts

export type PlayerActionType =
  | 'use_move' | 'shift' | 'struggle' | 'pass'
  | 'use_item' | 'switch_pokemon' | 'maneuver' | 'move_token'

export interface PlayerActionRequest {
  requestId: string
  playerId: string
  playerName: string
  action: PlayerActionType
  moveId?: string
  moveName?: string
  targetIds?: string[]
  targetNames?: string[]
  itemId?: string
  itemName?: string
  pokemonId?: string
  pokemonName?: string
  maneuverId?: string
  maneuverName?: string
  fromPosition?: GridPosition
  toPosition?: GridPosition
}

export interface PlayerActionAck {
  requestId: string
  status: 'accepted' | 'rejected' | 'pending'
  reason?: string
  result?: unknown
}

export interface PlayerTurnNotification {
  combatantId: string
  combatantName: string
  combatantType: 'trainer' | 'pokemon'
  round: number
  availableActions: {
    canUseMove: boolean
    canShift: boolean
    canStruggle: boolean
    canPass: boolean
    canUseItem: boolean
    canSwitchPokemon: boolean
    canManeuver: boolean
  }
}

export interface PlayerMoveRequest {
  requestId: string
  playerId: string
  combatantId: string
  fromPosition: GridPosition
  toPosition: GridPosition
  path?: GridPosition[]
  distance: number
}

export interface PlayerMoveResponse {
  requestId: string
  status: 'approved' | 'rejected' | 'modified'
  position?: GridPosition
  reason?: string
}

export interface GroupViewRequest {
  requestId: string
  playerId: string
  playerName: string
  requestType: 'tab_change'
  tab?: string
  sceneId?: string
}

export interface GroupViewResponse {
  requestId: string
  status: 'approved' | 'rejected'
  reason?: string
}

export interface SceneSyncPayload {
  scene: {
    id: string
    name: string
    description: string | null
    locationName: string | null
    locationImage: string | null
    weather: string | null
    isActive: boolean
    characters: Array<{ id: string; name: string; isPlayerCharacter: boolean }>
    pokemon: Array<{ id: string; nickname: string | null; species: string; ownerId: string | null }>
    groups: Array<{ id: string; name: string }>
  }
}
```

### 1.5 `WebSocketEvent` Union Additions (`api.ts`)

```typescript
// Add to existing WebSocketEvent union
| { type: 'keepalive'; data: { timestamp: number } }
| { type: 'keepalive_ack'; data: { timestamp: number } }
| { type: 'player_action'; data: PlayerActionRequest }      // UPDATED payload type
| { type: 'player_action_ack'; data: PlayerActionAck }
| { type: 'player_turn_notify'; data: PlayerTurnNotification }
| { type: 'player_move_request'; data: PlayerMoveRequest }
| { type: 'player_move_response'; data: PlayerMoveResponse }
| { type: 'group_view_request'; data: GroupViewRequest }
| { type: 'group_view_response'; data: GroupViewResponse }
| { type: 'scene_sync'; data: SceneSyncPayload }
| { type: 'scene_request'; data: { sceneId?: string } }
```

Update existing `identify` entry: `{ type: 'identify'; data: { role: 'gm' | 'group' | 'player'; encounterId?: string; characterId?: string } }`

### 1.5 Server Handler Changes (`ws.ts`)

**Updated `identify`:** Accept `characterId` for player role. Send active scene to player on identify.

**Updated `player_action`:** Accept from both `'player'` and `'group'` role clients. Track `requestId -> characterId` in a `pendingRequests` map for response routing.

**New handlers:** `player_action_ack`, `player_move_request`, `player_move_response`, `group_view_request`, `group_view_response` -- all use `forwardToGm()` or `routeToPlayer()` helpers. `scene_request` calls `sendActiveScene()`. `keepalive` responds with `keepalive_ack`.

**New server helpers:**

- `routeToPlayer(requestId, event)` -- Looks up `pendingRequests` map, sends to the player connection matching the stored `characterId`. Deletes entry after routing.
- `forwardToGm(encounterId, event, excludePeer)` -- Registers `requestId -> playerId` in `pendingRequests`, then forwards to all GM peers in the encounter.
- `sendActiveScene(peer)` -- Queries active scene from DB, sends `scene_sync` message.
- `pendingRequests: Map<string, string>` -- Maps requestId to characterId. TTL of 60s to prevent unbounded growth.

### 1.6 New `websocket.ts` Utility Functions

- `broadcastToPlayers(encounterId, event)` -- Send to all player-role clients in an encounter.
- `sendToPlayer(characterId, event)` -- Send to a specific player by characterId.
- `broadcastToGroupAndPlayers(eventType, data)` -- Send to both group and player clients (for scene events).

### 1.7 Server Request Routing Pattern

The `pendingRequests` map is the core routing mechanism. When a player sends a request (action, movement, group view change), the server stores `requestId -> characterId`. When the GM responds, the server looks up the `characterId` and routes the response to the correct player connection.

```typescript
// In ws.ts
const pendingRequests = new Map<string, string>() // requestId -> characterId

function forwardToGm(encounterId: string | null, event: WebSocketEvent, excludePeer: Peer) {
  const data = event.data as { requestId?: string; playerId?: string }
  if (data.requestId && data.playerId) {
    pendingRequests.set(data.requestId, data.playerId)
  }
  for (const [otherPeer, otherInfo] of peers) {
    if (otherPeer === excludePeer || otherInfo.role !== 'gm') continue
    if (encounterId && otherInfo.encounterId !== encounterId) continue
    safeSend(otherPeer, JSON.stringify(event))
  }
}

function routeToPlayer(requestId: string, event: WebSocketEvent) {
  const targetCharacterId = pendingRequests.get(requestId)
  if (!targetCharacterId) return
  for (const [otherPeer, otherInfo] of peers) {
    if (otherInfo.role === 'player' && otherInfo.characterId === targetCharacterId) {
      safeSend(otherPeer, JSON.stringify(event))
    }
  }
  pendingRequests.delete(requestId)
}
```

Entries auto-expire after 60 seconds to prevent unbounded growth.

### 1.8 Keepalive + Reconnect Identity Storage

Client sends `keepalive` every 45s (well under 100s timeout). `identify()` updated to accept `characterId` and store `role`/`encounterId`/`characterId` for auto re-identification on reconnect.

---


## 2. Group View Control

### 2.1 Permission Model

| Action | Player Can Request? | GM Approval Required? |
|--------|--------------------|-----------------------|
| Switch to Encounter tab | Yes | No (auto on `serve_encounter`) |
| Switch to Scene tab | Yes | Yes |
| Switch to Lobby tab | Yes | Yes |
| Switch to Map tab | No | N/A (GM-only) |
| Change active scene | No | N/A (GM-only) |

Auto-switching already works: `encounter_served` switches to encounter tab, `scene_activated` switches to scene tab.

### 2.2 Request Flow

Player sends `group_view_request` -> Server forwards to GM via `forwardToGm()` -> GM sees toast notification ("[PlayerName] requests: Switch to Scene [Approve] [Dismiss]") -> GM approves (triggers `setActiveTab`, sends `group_view_response` with `status: 'approved'`) or dismisses (auto-reject after 30s timeout).

### 2.3 `PlayerGroupControl.vue` (~150 lines)

Shows current Group View tab, "Request Scene" and "Request Lobby" buttons. After sending request, shows "Waiting for GM..." spinner. 30-second cooldown between requests to prevent spam.

---


## 3. VTT Grid for Players

### 3.1 Design

Players need a simplified, mobile-friendly VTT grid that reuses `GridCanvas.vue` with restricted capabilities. No token dragging -- all movements are requests that the GM approves.

### 3.2 Architecture

`GridCanvas.vue` gets two new props: `playerMode: boolean` and `playerCharacterId: string`. In player mode:
- Drag-to-move is disabled.
- Own tokens get a colored highlight border.
- Tap own token to select. Tap destination to request move.
- Movement range overlay shows reachable cells during player's turn.

### 3.3 Interaction Model

**Not player's turn:** Read-only. Pan/zoom only. Own tokens highlighted. Movement preview visible.

**Player's turn:**
1. Tap own combatant token -> selection indicator.
2. Valid movement cells illuminate (reuses `useGridMovement` range calculation).
3. Tap destination cell within range.
4. Bottom-sheet confirmation: "Move to (X, Y)? Distance: N meters" [Confirm] [Cancel].
5. On confirm -> `player_move_request` sent. Token shows pulsing "pending" state.
6. GM sees movement preview on their grid. Approves (token moves, `encounter_update` broadcast) or rejects (token resets, player sees toast with reason).

### 3.4 `usePlayerGridView` Composable (~200 lines)

Manages player-specific grid state: `isOwnCombatant(combatant)` check, `visibleTokens` computed (fog-filtered), `requestMove(combatantId, from, to, distance)` function, pending move tracking.

### 3.5 Information Asymmetry

| Element | Player Visibility |
|---------|-------------------|
| Own tokens | Full (name, HP, status, sprite) |
| Allied tokens | Name, HP bar (exact), types |
| Enemy tokens (not in fog) | Name, HP bar (percentage), types |
| Fog: hidden cells | Dark/blank |
| Fog: explored cells | Dimmed, terrain visible, no tokens |
| Fog: revealed cells | Full visibility |
| Terrain overlay | Visible (type + movement cost) |
| Measurement tools | Not available (GM-only) |

Fog state is already server-side and pushed via encounter state. `GridCanvas` with `isGm: false` already handles fog rendering.

### 3.6 Mobile Optimization

- Auto-fit grid to screen width, center on player's token.
- Pinch-to-zoom + single-finger pan (already supported).
- Double-tap destination to prevent accidental moves.
- Bottom-sheet confirmation pattern (native mobile).
- 44x44px minimum touch targets.

### 3.7 `PlayerGridView.vue` (~250 lines)

Wraps `GridCanvas` with player-specific props. Includes status bar showing pending movement requests. Integrates `usePlayerGridView` composable.

---


## 4. Scene View for Players

### 4.1 Design

Read-only display of the active scene on the player's device. Shows: name, description, location (name + image), weather, characters present (names), Pokemon present (species, nickname, owner), groups (names).

### 4.2 Data Flow

On player connect: `identify` handler calls `sendActiveScene()`. On scene activation: `scene_activated` broadcast goes to both group and player clients. Mid-scene connect handled via `sendActiveScene()`. REST fallback via `GET /api/scenes/active`.

### 4.3 `usePlayerScene` Composable (~100 lines)

Manages `activeScene` ref. Exposes `handleSceneSync(payload)` and `handleSceneDeactivated()` for WebSocket events. `fetchActiveScene()` REST fallback. `mapSceneToPlayerView(scene)` strips data to player-visible fields.

### 4.4 `PlayerSceneView.vue` (~200 lines)

Mobile card layout: scene name header, location image, weather badge, character list, Pokemon list, group list. Scrollable. "No active scene" placeholder when empty.

### 4.5 Navigation Update

Player bottom nav gains a fourth tab: **Scene** (map-pin icon). Badge dot when scene is active. Encounter tab takes priority when both scene and encounter are active (combat is time-sensitive).

---


## 5. State Synchronization

### 5.1 Ownership Model

| State | Mutators | Consumers |
|-------|----------|-----------|
| Encounter/combatant state | GM + Player (direct actions) | All views |
| Token positions | GM (drag), Player (approved requests) | All views |
| Group View tab | GM (direct), Player (approved requests) | All views |
| Scene state | GM only | All views |
| Character data | GM only (read-only for players) | All views |
| Fog of war / Grid config | GM only | GM (full), Group/Player (filtered) |
| Player identity | Player (localStorage) | Player only |

### 5.2 Consistency Model

**Server-authoritative eventual consistency.** All writes go through the Nitro API. Server broadcasts changes to all connected clients. No vector clocks or CRDTs needed -- turn-based combat is inherently sequential.

**Conflict resolution:** Sequential processing via Node.js event loop + SQLite single-writer. First request wins. Failed requests return validation errors; client state refreshes via subsequent `encounter_update` broadcast. Player movement requests require GM approval, eliminating races.

### 5.3 Reconnection Recovery

1. Existing exponential backoff (5 attempts, max 30s).
2. On reconnect: auto re-identify with stored `role`/`characterId`/`encounterId`.
3. Server responds with: `encounter_update` (full state), `scene_sync` (active scene), `tab_state` (Group View tab).
4. Player identity composable re-fetches character data via REST.

### 5.4 Turn Notification

When turn advances to a player-owned combatant, server sends targeted `player_turn_notify` via `sendToPlayer(characterId, ...)`. Enables: `navigator.vibrate()`, visual flash, auto-switch to Encounter tab.

### 5.5 Fan-Out

State updates broadcast to all clients in the encounter room (O(N), N = 5-8 for typical PTU group). No performance concerns.

---


## 6. Cross-Track Integration

### 6.1 Track A Integration

| Component | Integration |
|-----------|-------------|
| `usePlayerIdentity` | Provides `characterId` for WS `identify()`. `usePlayerWebSocket` orchestrates on connect. |
| `PlayerCombatActions` | Sends `player_action` with `requestId`. Receives `player_action_ack`. |
| Direct actions (executeMove, shift, pass) | No change -- already server-mediated with `encounter_update` broadcast. |
| `PlayerEncounterView` | Embeds `PlayerGridView` below combatant list. |
| `PlayerNavBar` | Gains fourth Scene tab. |

### 6.2 Track B Integration

| Component | Integration |
|-----------|-------------|
| Cloudflare Tunnel | 45s keepalive prevents 100s idle timeout. |
| WSS URL construction | Already works (`window.location` -> `wss://` through Cloudflare). |
| PWA service worker (P2) | Cannot intercept WebSocket connections. No conflict. |
| PWA offline (P2) | Composables support offline data source fallback. WS unavailable -> "Offline" indicator. Online transition -> reconnect + REST sync before WS re-establish. |

### 6.3 `usePlayerWebSocket` Composable (~180 lines)

Orchestrates all player WS behavior. Watches `isConnected` + `characterId` to auto-identify. Handles `player_action_ack`, `player_turn_notify`, `player_move_response`, `group_view_response`, `scene_sync`, `scene_deactivated`, `character_update`. Exposes `sendAction()` (with requestId tracking) and `requestGroupViewChange()`.

### 6.4 REST Fallback Endpoint

`POST /api/player/action-request` (~50 lines). Validates `playerId`, forwards action to GM via server-side WebSocket broadcast. Ensures action requests reach GM even during momentary WS disconnection.

---


## 7. Phase Plan

### P0: Core Protocol + Scene View

**Goal:** Player identifies with `characterId`, receives encounter + scene state, sends tracked action requests.

| New Files | Lines | Purpose |
|-----------|-------|---------|
| `app/types/player-sync.ts` | ~120 | All new TS interfaces |
| `app/composables/usePlayerWebSocket.ts` | ~180 | Player WS orchestration |
| `app/composables/usePlayerScene.ts` | ~100 | Scene composable |
| `app/components/player/PlayerSceneView.vue` | ~200 | Scene display |
| `app/server/api/player/action-request.post.ts` | ~50 | REST fallback |

| Modified Files | Change |
|----------------|--------|
| `app/server/utils/websocket.ts` | Add player role, characterId, new broadcast helpers |
| `app/server/routes/ws.ts` | Player identify, keepalive, scene_request, updated player_action, pendingRequests |
| `app/composables/useWebSocket.ts` | Updated identify(), keepalive, reconnect identity storage |
| `app/types/api.ts` | Extend WebSocketEvent union |
| `app/pages/player/index.vue` | Scene tab, usePlayerWebSocket integration |

**Acceptance:** Player WS identifies with characterId. Server tracks characterId. Keepalive at 45s. Reconnect auto-re-identifies. Scene pushed on connect/activation. Scene tab in nav. REST fallback works.

### P1: Group View Control + VTT Grid + Action Ack

**Goal:** GM-approved Group View tab changes, mobile grid with tap-to-request-move, action acknowledgment.

| New Files | Lines | Purpose |
|-----------|-------|---------|
| `app/composables/usePlayerGridView.ts` | ~200 | Player grid interaction |
| `app/composables/useStateSync.ts` | ~120 | Reconnect recovery, state validation |
| `app/components/player/PlayerGridView.vue` | ~250 | Simplified mobile VTT |
| `app/components/player/PlayerGroupControl.vue` | ~150 | Group View request UI |
| `app/components/player/PlayerMoveRequest.vue` | ~120 | Movement confirmation sheet |

| Modified Files | Change |
|----------------|--------|
| `app/server/routes/ws.ts` | P1 handlers, routeToPlayer, forwardToGm |
| `app/server/utils/websocket.ts` | broadcastToGm utility |
| `app/components/vtt/GridCanvas.vue` | playerMode + playerCharacterId props |
| `app/components/player/PlayerEncounterView.vue` | Embed PlayerGridView |

**Acceptance:** Group View request buttons work. GM toast notifications for requests. Grid shows on mobile with own token highlight. Tap-select + tap-destination + confirmation sheet. Movement requests reach GM as grid preview. Approve/reject flows complete. 44x44px touch targets. Pinch-to-zoom works.

### P2: Polish + Latency + Offline

**Goal:** Smooth experience across LAN/tunnel/reconnecting. Graceful offline degradation.

| Area | Change |
|------|--------|
| Optimistic updates | Local feedback for direct actions, rollback on error |
| Latency indicator | Keepalive RTT -> color-coded ping (green/yellow/red) |
| Stale state detection | Version comparison, force re-sync if delta > 2 |
| Scene batching | 200ms debounce for rapid scene entity changes |
| Movement preview sharing | Other players see pending move requests as dimmed path |
| Offline grid | Last-known positions with "stale" indicator |
| Visibility change | `document.visibilitychange` triggers reconnect check |
| Connection monitor | 3+ failed keepalives -> "Connection unstable" warning |

---

