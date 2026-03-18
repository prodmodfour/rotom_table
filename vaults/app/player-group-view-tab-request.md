# Player Group View Tab Request

`PlayerGroupControl.vue` in the player view allows players to request a group view tab change. It shows the current tab name, and offers "Request Scene" and "Request Lobby" buttons (hiding the button for the already-active tab).

The request flow:
1. Player clicks a request button, which sends a `group_view_request` WebSocket event containing a request ID, player ID, player name, and the desired tab.
2. The server forwards the request to the GM.
3. The GM approves or dismisses the request.
4. The server routes the `group_view_response` back to the requesting player.

After any request (approved, rejected, or timed out after 30 seconds), a 30-second cooldown prevents further requests. During cooldown, a countdown timer is shown. During pending state, a spinner with "Waiting for GM..." appears.

Feedback appears briefly (3 seconds) showing "Request approved" or "Request dismissed".

## See also

- [[group-view-tab-state]] — the tab state that changes if the GM approves
- [[group-view-websocket-sync]] — the WebSocket channel that carries these requests