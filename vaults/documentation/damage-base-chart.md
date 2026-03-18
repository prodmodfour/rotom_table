The Damage Base (DB) chart maps DB values 1 through 28 to damage ranges. Each entry provides `min`, `avg`, and `max` values. The constant `DAMAGE_BASE_CHART` in `constants/combat.ts` stores this lookup table.

The [[nine-step-damage-formula]] uses the DB value from a move's data to look up the base damage at step 1. The `useMoveCalculation` composable references this chart when computing per-target damage in the UI.

## See also

- [[nine-step-damage-formula]] — consumes this chart as the first calculation step
