Fire Spin is stored in [[movedata-reference-table]] with `damageClass: "Special"`, `type: "Fire"`, `damageBase: 4`, `energyCost: 1`, `ac: 1`, `range: "3, 1 Target"`.

## Energy

Energy cost 1 is deducted from the user's Energy pool per [[move-energy-system]].

## Resolution

Fire Spin flows through the standard [[damage-flow-pipeline]] with DB 4 as the base. The [[nine-step-damage-formula]] applies STAB for Fire-type users and type effectiveness. An accuracy roll against AC 1 is required via the [[evasion-and-accuracy-system]].

## Effect

Swift Action. The target is put in a Vortex.

## Trait Interactions

Flagged for Technician in the [[moves-csv-source-file]].

## See also

- [[weather-rules-utility]] — +5 damage in Sunny, -5 in Rain
- [[status-capture-bonus-hierarchy]] — status conditions modify capture rate
