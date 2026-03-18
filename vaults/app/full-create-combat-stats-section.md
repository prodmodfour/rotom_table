# Full Create Combat Stats Section

The fifth section of [[full-create-mode]]. Headed "Combat Stats" with a "Points Remaining: **10** / 10" counter.

Six stats are displayed in a row: HP, Attack, Defense, Sp. Attack, Sp. Defense, Speed. Each stat shows its base value, a "+" sign, minus/plus buttons, the allocated points (default "0"), an "=" sign, and the resulting total.

Default base values are HP 10, and 5 for all other stats. The minus button starts disabled (since allocation is 0). The plus button allows incrementing.

Below the stat allocators is a [[derived-stats-display]].

A validation message reads: "Level 1 trainers should allocate exactly 10 stat points (currently 0)".

The same layout is reused during level-up in the [[trainer-level-up-stat-allocation-step]], with a smaller per-level budget of 1 point.
