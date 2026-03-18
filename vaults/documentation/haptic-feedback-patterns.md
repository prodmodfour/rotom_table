# Haptic Feedback Patterns

`useHapticFeedback` wraps the Vibration API for player mobile devices. Safely no-ops on browsers or devices without vibration support.

## Patterns

| Function | Duration | Pattern | Trigger |
|---|---|---|---|
| `vibrateOnTurnStart` | ~500ms | 200-100-200ms double-pulse | [[player-websocket-composable|player_turn_notify]] received |
| `vibrateOnMoveExecute` | 100ms | single pulse | Player's own entity executes a move |
| `vibrateOnDamageTaken` | ~360ms | 80-60-80-60-80ms triple | Player's own entity takes damage |
| `vibrateOnTap` | 30ms | light tap | UI tap feedback |

## See also

- [[player-websocket-composable]] — triggers haptic feedback from WebSocket events
- [[player-view-architecture]]
