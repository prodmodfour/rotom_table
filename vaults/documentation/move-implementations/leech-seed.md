Leech Seed is stored in [[movedata-reference-table]] with `damageClass: "Status"`, `type: "Grass"`, `damageBase: null`, `energyCost: 5`, `ac: 4`, `range: "6, 1 Target"`.

## Energy

Energy cost 5 is deducted from the user's Energy pool per [[move-energy-system]].

## Resolution

As a Status move, Leech Seed skips the [[damage-flow-pipeline]]. An accuracy roll against AC 4 is required via the [[evasion-and-accuracy-system]].

## Effect

At the beginning of each of the target's turns, the target loses a Tick of Hit Points. The user then gains Hit Points equal to the amount the target lost. Leech Seed lasts until the target faints or is returned to a Poke Ball. Grass Types and targets immune to Grass Attacks are immune to Leech Seed.

## Trait Interactions

No trait-interaction flags are set in the [[moves-csv-source-file]].

## See also

- [[status-capture-bonus-hierarchy]] — status conditions modify capture rate
