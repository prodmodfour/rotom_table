Curse is stored in the [[movedata-reference-table]] with frequency `See Text`. This value does not match any member of the [[move-frequency-type]] union (`'At-Will' | 'EOT' | 'Scene' | ... | 'Static'`).

Curse's effect text explains the dual behavior: EOT frequency for non-Ghost users (stat trade: -1 Speed, +1 Attack, +1 Defense), Scene frequency for Ghost users (lose 1/3 HP to Curse a target). The `See Text` string is stored literally from the CSV.

The [[move-frequency-utility]]'s `checkMoveFrequency` function does not have a case for `See Text`, so Curse would fall through any switch/if-else chain without matching a frequency rule.
