Every PTU move has a frequency that limits how often it can be used. The system is implemented across four utility functions in `utils/moveFrequency.ts`, all following immutable patterns.

## Frequency Types

- **At-Will** — always available, no restrictions.
- **EOT (Every Other Turn)** — cannot be used on consecutive turns. `checkMoveFrequency` compares `lastTurnUsed` against the current turn index.
- **Scene** — usable once (or x2, x3) per scene. Each use must still respect the EOT gap between consecutive uses. Tracked by `usedThisScene` counter.
- **Daily** — usable a set number of times per day, with a per-scene cap. Tracked by `usedToday` counter.
- **Static** — permanently blocked from use in combat (passive effects only).

## Utilities

- `checkMoveFrequency` — validates whether a move can be used right now based on its frequency rules. Returns a boolean and a reason string on failure.
- `incrementMoveUsage` — returns a new move object with incremented usage counters (never mutates the original).
- `resetSceneUsage` — resets `usedThisScene` and `lastTurnUsed` on all moves when a new scene begins. Used by the Next Scene API endpoint.
- `resetDailyUsage` — resets `usedToday` and `lastUsedAt` on all moves for a new day.

The execute-move API endpoint calls `checkMoveFrequency` before allowing a move, then `incrementMoveUsage` after successful execution.

## See also

- [[nine-step-damage-formula]] — damage calculation that follows a successful frequency check
- [[turn-lifecycle]] — turn boundaries where EOT tracking advances
- [[extended-rest]] — daily moves follow a rolling window refresh rule during extended rest
- [[new-day-reset]] — resets all daily move usage counters
