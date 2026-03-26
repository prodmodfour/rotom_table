Dynamic Punch is stored in [[movedata-reference-table]] with `damageClass: "Physical"`, `type: "Fighting"`, `damageBase: 10`, `energyCost: 2`, `ac: 9`, `range: "Melee, 1 Target"`.

## Energy

Energy cost 2 is deducted from the user's Energy pool per [[move-energy-system]].

## Resolution

Dynamic Punch flows through the standard [[damage-flow-pipeline]] with DB 10 as the base. The [[nine-step-damage-formula]] applies STAB for Fighting-type users and type effectiveness. An accuracy roll against AC 9 is required via the [[evasion-and-accuracy-system]].

## Secondary Effect

Dynamic Punch Confuses the target on hit. Confusion follows the [[confused-three-outcome-save]] resolution. Dynamic Punch ignores the target's Evasion if they are Flanked.

## Trait Interactions

Flagged for Tough Claws, Iron Fist in the [[moves-csv-source-file]].

## See also

- [[status-capture-bonus-hierarchy]] — status conditions modify capture rate
