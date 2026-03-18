# Utility API Endpoints

Standalone REST endpoints for species data, reference lookups, daily resets, and damage calculation.

**Species:** GET `/api/species` (species list for search/autocomplete). GET `/api/species/:name` (single species lookup — abilities, numBasicAbilities, learnset, base stats, evolution info).

**Batch lookups:** POST `/api/abilities/batch` (batch ability detail lookup from AbilityData, up to 50 names). POST `/api/moves/batch` (batch move detail lookup from MoveData, up to 50 names).

**Daily reset:** POST `/api/game/new-day` — global daily reset.

**Damage calculation:** POST `/api/encounters/:id/calculate-damage` — full PTU 9-step damage formula (STAB, type effectiveness, stages, crit) with detailed breakdown and dynamic evasion computation. Read-only; does not modify state. See [[damage-flow-pipeline]].

## See also

- [[api-endpoint-layout]]
