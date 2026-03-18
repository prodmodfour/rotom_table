The `useHapticFeedback` composable in `app/composables/useHapticFeedback.ts` triggers device vibration via the Vibration API on three combat events in the player view:

- **Turn start**: double pulse pattern [200, 100, 200]ms
- **Move execution**: single 100ms pulse
- **Damage taken**: triple pulse pattern [80, 60, 80, 60, 80]ms

The composable checks for Vibration API support before calling `navigator.vibrate()`. It is consumed by the player page, which calls `vibrateOnTurnStart()` when a [[player-websocket-wraps-actions-as-promises|turn notification]] arrives, `vibrateOnMoveExecute()` after a move action, and `vibrateOnDamageTaken()` when the player's entity receives damage via WebSocket.

## See also

- [[player-view-auto-connects-websocket-on-load]] -- the player connection that delivers the events triggering vibration
