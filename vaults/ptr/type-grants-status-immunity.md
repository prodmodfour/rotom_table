Certain Pokemon types grant absolute immunity to specific status conditions:

- Electric: immune to Paralysis
- Fire: immune to Burn
- Ghost: immune to Stuck and Trapped
- Grass: immune to Powder keyword moves
- Ice: immune to Frozen
- Poison and Steel: immune to Poison

These immunities are checked before applying any condition, regardless of the source. The app must gate condition application behind a type-immunity check, which is separate from [[type-effectiveness-excludes-status-moves]] (that system handles damage, this handles conditions).

## See also

- [[condition-source-tracking]]
- [[trapped-is-only-recall-blocker]]
