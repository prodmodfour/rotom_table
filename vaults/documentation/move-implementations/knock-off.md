Knock Off is stored in [[movedata-reference-table]] with `damageClass: "Physical"`, `type: "Dark"`, `damageBase: 7`, `energyCost: 5`, `ac: 2`, `range: "Melee, 1 Target"`.

## Energy

Energy cost 5 is deducted from the user's Energy pool per [[move-energy-system]].

## Resolution

Knock Off flows through the standard [[damage-flow-pipeline]] with DB 7 as the base. The [[nine-step-damage-formula]] applies STAB for Dark-type users and type effectiveness. An accuracy roll against AC 2 is required via the [[evasion-and-accuracy-system]].

## Effect

Choose one of the target's Held Items or Accessory Slot Items. It is knocked to the ground.

## Trait Interactions

Flagged for Tough Claws in the [[moves-csv-source-file]].
