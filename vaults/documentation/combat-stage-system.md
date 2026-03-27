Combat stages modify a combatant's effective stats during an encounter. Five combat stats — Attack, Defense, Sp.Attack, Sp.Defense, and Speed — each have an independent stage value clamped to **-6 to +6**, resolved via the multiplier table below.

Accuracy combat stages also use the -6 to +6 range but work differently: instead of a multiplier, each stage adds or subtracts directly from accuracy rolls (per [[accuracy-cs-is-direct-modifier]]).

Evasion is not a combat stage — it is derived from defensive stats (Def/5, SpDef/5, Spd/5), capped at +6 (per [[evasion-from-defensive-stats]]).

## Stage Multiplier Table

Each stage maps to a multiplier applied to the base stat value:

| Stage | Multiplier |
|-------|-----------|
| -6 | 0.4 |
| -5 | 0.5 |
| -4 | 0.57 |
| -3 | 0.67 |
| -2 | 0.8 |
| -1 | 0.9 |
| 0 | 1.0 |
| +1 | 1.1 |
| +2 | 1.2 |
| +3 | 1.33 |
| +4 | 1.5 |
| +5 | 1.67 |
| +6 | 2.0 |

## Modification

Stages are modified either as a delta (+2, -1) or an absolute value. The system enforces the -6/+6 clamp.

[[take-a-breather-mechanics]] resets all combat stages (respecting Heavy Armor's default Speed CS of -1).

## See also

- [[nine-step-damage-formula]] — stages feed into attack and defense steps
- [[evasion-and-accuracy-system]] — accuracy checks and evasion derivation
- [[equipment-bonus-aggregation]] — Heavy Armor applies a default Speed CS of -1
