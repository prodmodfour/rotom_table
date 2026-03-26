Discharge is stored in [[movedata-reference-table]] with `damageClass: "Special"`, `type: "Electric"`, `damageBase: 8`, `energyCost: 3`, `ac: 2`, `range: "All Cardinally Adjacent Targets"`.

## Energy

Energy cost 3 is deducted from the user's Energy pool per [[move-energy-system]].

## Resolution

Discharge flows through the standard [[damage-flow-pipeline]] with DB 8 as the base. The [[nine-step-damage-formula]] applies STAB for Electric-type users and type effectiveness. An accuracy roll against AC 2 is required via the [[evasion-and-accuracy-system]].

## Secondary Effect

Discharge Paralyzes all legal targets on 15+. The [[type-status-immunity-utility]] prevents Paralysis application on Electric-types. Once applied, Paralysis halves initiative per [[paralysis-condition]].

## Trait Interactions

Flagged for Sheer Force in the [[moves-csv-source-file]].

## See also

- [[status-capture-bonus-hierarchy]] — status conditions modify capture rate
