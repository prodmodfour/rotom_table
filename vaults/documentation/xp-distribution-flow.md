# XP Distribution Flow

Post-combat XP calculation and distribution to Pokemon and trainers.

## Flow

1. **Preview** — read-only XP breakdown showing participating Pokemon and calculated XP per participant.
2. **Pokemon distribution** — apply XP to Pokemon: updates experience, triggers level-up if thresholds are crossed, awards stat points per [[pokemon-stat-allocation]].
3. **Trainer distribution** — batch-award trainer XP to multiple trainers. Auto-levels at 10 XP. WebSocket broadcast on level change.

The GM view provides a post-combat XP allocation modal per player/Pokemon, including a trainer XP section with significance-based suggestion and level-up preview.

## See also

- [[faint-and-revival-effects]] — defeated enemies recorded for XP on faint
- [[pokemon-experience-chart]] — underlying XP thresholds and level-up detection
- [[pokemon-hp-formula]] — HP recalculated on level-up during distribution
