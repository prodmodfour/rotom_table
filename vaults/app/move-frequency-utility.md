The move frequency utility (`app/utils/moveFrequency.ts`) provides pure functions for PTU move frequency enforcement.

`checkMoveFrequency(move, currentRound)` validates whether a move can be used based on its [[move-frequency-type]]:
- At-Will: always usable
- EOT: blocked if `lastTurnUsed` was the current or previous round
- Scene/Scene x2/Scene x3: blocked when `usedThisScene` reaches the limit; Scene x2/x3 also enforce EOT between uses
- Daily/Daily x2/Daily x3: blocked when `usedToday` reaches the limit; Daily x2/x3 also enforce a one-use-per-scene cap
- Static: always blocked (passive moves)

`incrementMoveUsage(move, currentRound)` returns a new move object with updated counters after use. `resetSceneUsage(moves)` zeroes `usedThisScene` and `lastTurnUsed` for all moves. `resetDailyUsage(moves)` zeroes `usedToday` and clears `lastUsedAt`.

All functions are immutable — they return new objects rather than mutating inputs.

## See also

- [[move-interface-tracks-usage-counters]] — the usage fields these functions read and write
- [[scene-activation-resets-move-counters]] — calls `resetSceneUsage` at scene boundaries
