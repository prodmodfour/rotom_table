The healing utility (`app/utils/restHealing.ts`) provides pure functions for Pokemon and human healing calculations used by the [[gm-pokemon-detail-healing-tab]].

Key functions:
- `calculateRestHealing()` — 1/16 max HP per 30-minute rest period. Blocked if the entity has 5+ injuries or has reached the daily 8-hour rest cap (480 minutes)
- `getEffectiveMaxHp()` — injury-reduced max HP (injuries reduce effective max)
- `clearPersistentStatusConditions()` — removes Burned, Frozen, Paralyzed, Poisoned during extended rest
- `calculatePokemonCenterTime()` — 1 hour base + 30 minutes per injury
- `calculatePokemonCenterInjuryHealing()` — up to 3 injuries healed per day
- `canHealInjuryNaturally()` — requires 24 hours since the last injury healing
- `shouldResetDailyCounters()` — checks if the day has rolled over for New Day logic
