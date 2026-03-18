# Player Reconnection Sync

Two mechanisms ensure the player view recovers after disconnection.

## useStateSync

Automatically performs a full state sync when the WebSocket reconnects. Five-step sequence:
1. Re-identify as player (with characterId).
2. Rejoin encounter room.
3. Request full encounter state via `sync_request`.
4. Request active scene via `scene_request`.
5. Request tab state via `tab_sync_request`.
6. Re-fetch character data via REST (`refreshCharacterData`).

Includes a 5-second cooldown between syncs to avoid spamming. Distinguishes initial connect from reconnect.

## Encounter Polling

The player page polls `GET /api/encounters` every 3 seconds to detect when a served encounter appears. On detection, loads it into the encounter store and joins the encounter room via WebSocket.

Implements exponential backoff on failure: doubles the interval after 5 consecutive failures, capped at 30 seconds. Resets to the base 3-second interval on success after backoff.

## See also

- [[player-websocket-composable]] — the WebSocket layer this syncs through
- [[encounter-serving-mechanics]] — how an encounter becomes served
- [[websocket-real-time-sync]] — the base WebSocket connection
