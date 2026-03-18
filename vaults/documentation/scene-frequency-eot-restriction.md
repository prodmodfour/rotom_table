Scene-frequency moves must still respect the Every Other Turn gap between consecutive uses. A Scene x2 move cannot be used on turns 1 and 2 — the earliest second use is turn 3. The [[move-frequency-system]]'s `checkMoveFrequency` enforces both the scene count limit and the EOT gap simultaneously.

This means the effective minimum spacing between uses of any limited-frequency move is always at least one turn, regardless of how many per-scene uses remain.

## See also

- [[move-frequency-system]] — enforces the combined scene-count + EOT constraint
- [[daily-moves-once-per-scene]] — daily moves follow the same EOT restriction
