A "tick" of Hit Points equals 1/10th of max HP, rounded down per [[always-round-down]]. This is an atomic unit referenced by burn damage, poison damage, cursed damage, bad sleep damage, [[vortex-keyword|Vortex]] damage, and rest healing.

The app should compute tick value once from [[real-max-hp-for-all-percentages]] (the real maximum, not injury-reduced) and expose it as a derived property, since many mechanics reference it.

## See also

- [[pokemon-hp-formula]]
- [[trainer-hp-formula]]
- [[natural-healing-rate]]
- [[persistent-tick-timing-end-of-turn]]
