Stun Spore is stored in [[movedata-reference-table]] with `damageClass: "Status"`, `type: "Grass"`, `damageBase: null`, `energyCost: 2`, `ac: 6`, `range: "6, 1 Target, Powder"`.

## Energy

Energy cost 2 is deducted from the user's Energy pool per [[move-energy-system]].

## Resolution

As a Status move, Stun Spore skips the [[damage-flow-pipeline]]. An accuracy roll against AC 6 is required via the [[evasion-and-accuracy-system]].

## Effect

The target is Paralyzed. The [[type-status-immunity-utility]] prevents Paralysis application on Electric-types. Paralysis halves initiative per [[paralysis-condition]].

## Trait Interactions

No trait-interaction flags are set in the [[moves-csv-source-file]].

## See also

- [[status-capture-bonus-hierarchy]] — status conditions modify capture rate
