Strength Sap is stored in [[movedata-reference-table]] with `damageClass: "Status"`, `type: "Grass"`, `damageBase: null`, `energyCost: 3`, `ac: 2`, `range: "6, 1 Target"`.

## Energy

Energy cost 3 is deducted from the user's Energy pool per [[move-energy-system]].

## Resolution

As a Status move, Strength Sap skips the [[damage-flow-pipeline]]. An accuracy roll against AC 2 is required via the [[evasion-and-accuracy-system]].

## Effect

The user restores HP equal to the target's Attack stat. Then the target's Attack is lowered by 1 Combat Stage per the [[combat-stage-system]].

## Trait Interactions

No trait-interaction flags are set in the [[moves-csv-source-file]].
