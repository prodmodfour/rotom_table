The player API at `/api/player/` serves three purposes: a REST fallback for player-to-GM communication, and character data export/import.

`action-request.post` lets player clients submit action requests to the GM without a WebSocket connection. It uses the [[pending-requests-map-routes-gm-responses-to-players]] to track requests and forwards them to the GM via [[websocket-peer-map-tracks-connected-clients]]. This is the REST equivalent of the `player_action` WebSocket message type.

`export/[characterId].get` builds a portable JSON representation of a player's character and all their owned Pokemon for backup or transfer.

`import/[characterId].post` restores a previously exported character, overwriting the target character's data with the imported payload.

## See also

- [[websocket-handler-routes-messages-by-type]] — the WebSocket path for the same player-to-GM communication
- [[server-has-no-auth-or-middleware]] — export/import is unprotected, relying on the LAN trust model
