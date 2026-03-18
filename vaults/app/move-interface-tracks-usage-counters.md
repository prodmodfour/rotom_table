The `Move` interface (`app/types/character.ts`, line 47) defines the shape of a move as stored on a Pokemon. Beyond the reference fields (name, type, damageClass, frequency, ac, damageBase, range, effect), it includes:

- `usedThisScene` (number) — how many times this move has been used in the current scene
- `usedToday` (number) — how many times used today
- `lastUsedAt` (ISO string) — timestamp of last daily use
- `lastTurnUsed` (number) — round number of last use, for EOT cooldown tracking

These fields are read and written by the [[move-frequency-utility]] and reset by the [[scene-activation-resets-move-counters]].

The interface also has optional fields for `keywords`, `actionType`, `critRange`, `contestType`, and `contestEffect`.

## See also

- [[move-frequency-type]] — the `MoveFrequency` union used by the `frequency` field
