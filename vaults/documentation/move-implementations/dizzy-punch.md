Dizzy Punch is stored in [[movedata-reference-table]] with `damageClass: "Physical"`, `type: "Normal"`, `damageBase: 7`, `energyCost: 2`, `ac: 2`, `range: "Melee, 1 Target"`.

## Energy

Energy cost 2 is deducted from the user's Energy pool per [[move-energy-system]].

## Resolution

Dizzy Punch flows through the standard [[damage-flow-pipeline]] with DB 7 as the base. The [[nine-step-damage-formula]] applies STAB for Normal-type users and type effectiveness. An accuracy roll against AC 2 is required via the [[evasion-and-accuracy-system]].

## Secondary Effect

Dizzy Punch Confuses the target on 17+. Confusion follows the [[confused-three-outcome-save]] resolution.

## Trait Interactions

Flagged for Sheer Force, Tough Claws, Iron Fist in the [[moves-csv-source-file]].

## See also

- [[status-capture-bonus-hierarchy]] — status conditions modify capture rate
