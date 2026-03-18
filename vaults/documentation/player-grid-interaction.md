# Player Grid Interaction

`PlayerGridView.vue` renders the tactical battle grid from the player's perspective, using the shared `GridCanvas` component in player mode.

## Fog-Filtered Tokens

`visibleTokens` in `usePlayerGridView` filters combatants based on [[vision-capability-system|fog of war]] state:
- Own tokens (trainer + all Pokemon) are always visible regardless of fog.
- Other tokens are only visible on revealed cells. Hidden and explored cells hide tokens.
- When fog is disabled, all tokens with positions are visible.

## Move Request Flow

1. Player selects their own token (other tokens are non-selectable).
2. Player taps a destination cell.
3. `PlayerMoveRequest` bottom sheet shows coordinates and PTU diagonal distance.
4. On confirm, `confirmMove()` sends a `player_move_request` WebSocket event to the GM with `requestId`, `playerId`, `combatantId`, from/to positions, and distance.
5. Pending move state tracks the request with a 30-second timeout.
6. GM responds via `player_move_response` with approved/rejected/modified status.

## Information Asymmetry

`getInfoLevel()` determines data visibility per combatant:
- **full** — own combatants, all data.
- **allied** — same side, name + exact HP.
- **enemy** — opponents, name + percentage HP.

Auto-centers on the player's primary token on initial load.

## See also

- [[vtt-grid-components]] — the shared grid infrastructure
- [[ptu-movement-rules-in-vtt]] — movement rules enforced on the grid
- [[player-websocket-events]] — player_move_request/response events
- [[player-encounter-display]] — integrates PlayerGridView when grid is enabled
