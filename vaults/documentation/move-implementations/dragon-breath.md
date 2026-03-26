Dragon Breath is stored in [[movedata-reference-table]] with `damageClass: "Special"`, `type: "Dragon"`, `damageBase: 6`, `energyCost: 3`, `ac: 2`, `range: "6, 1 Target"`.

## Energy

Energy cost 3 is deducted from the user's Energy pool per [[move-energy-system]].

## Resolution

Dragon Breath flows through the standard [[damage-flow-pipeline]] with DB 6 as the base. The [[nine-step-damage-formula]] applies STAB for Dragon-type users and type effectiveness. An accuracy roll against AC 2 is required via the [[evasion-and-accuracy-system]].

## Secondary Effect

Dragon Breath Paralyzes the target on 15+. The [[type-status-immunity-utility]] prevents Paralysis application on Electric-types. Once applied, Paralysis halves initiative per [[paralysis-condition]].

## Trait Interactions

Flagged for Sheer Force, Technician in the [[moves-csv-source-file]].

## See also

- [[status-capture-bonus-hierarchy]] — status conditions modify capture rate
