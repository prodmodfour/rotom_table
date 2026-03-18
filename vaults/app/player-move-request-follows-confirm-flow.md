# Player Move Request Follows Confirm Flow

In the [[player-view-encounter-vtt-map]], players move tokens through a multi-step flow managed by `usePlayerGridView`: select an owned token, tap a destination cell, confirm the move in the UI, then the token enters a "pending move" visual state (`vtt-token--pending-move` class) until the GM processes the request.

This confirm-before-send pattern prevents accidental moves. The pending state is tracked locally and shown visually on the token via [[vtt-token-displays-combat-state-badges]].

## See also

- [[player-grid-filters-by-ownership-and-fog]] — only owned tokens can enter this flow
- [[player-websocket-wraps-actions-as-promises]] — the composable that sends the move request over WebSocket
