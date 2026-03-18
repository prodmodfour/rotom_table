# Player Group View Control

`PlayerGroupControl.vue` lets a player request tab changes on the shared [[triple-view-system|Group View]] (TV/projector).

## Flow

1. Player sees the current Group View tab and available request buttons (Request Scene / Request Lobby).
2. Tapping a button sends a `group_view_request` WebSocket event to the GM.
3. While waiting, the component shows a pending state.
4. The GM responds with approved or rejected via `group_view_response`.
5. Feedback auto-dismisses after 3 seconds.

## Constraints

- 30-second cooldown between requests.
- 30-second timeout if the GM doesn't respond.

## See also

- [[group-view-tabs]] — the Group View tabs this controls
- [[player-websocket-events]] — group_view_request/response events
