Beat Up is stored in [[movedata-reference-table]] with `damageClass: "Physical"`, `type: "Dark"`, `damageBase: null`, `energyCost: 2`, `ac: null`, `range: "Melee, 1 Target"`.

## Energy

Energy cost 2 is deducted from the user's Energy pool per [[move-energy-system]].

## Resolution

Beat Up does not flow through the standard [[damage-flow-pipeline]] with a fixed DB. Instead, the user and up to two allies adjacent to the target each make a Struggle Attack against the target. These Struggle Attacks hit for Dark-Type damage instead of their usual Type.

## Effect

Beat Up may trigger Pack Hunt only once, no matter the number of attacks.

## Trait Interactions

Flagged for Tough Claws in the [[moves-csv-source-file]].
