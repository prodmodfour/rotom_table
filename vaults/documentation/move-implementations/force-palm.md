Force Palm is stored in [[movedata-reference-table]] with `damageClass: "Physical"`, `type: "Fighting"`, `damageBase: 6`, `energyCost: 2`, `ac: 2`, `range: "Melee, 1 Target, Aura"`.

## Energy

Energy cost 2 is deducted from the user's Energy pool per [[move-energy-system]].

## Resolution

Force Palm flows through the standard [[damage-flow-pipeline]] with DB 6 as the base. The [[nine-step-damage-formula]] applies STAB for Fighting-type users and type effectiveness. An accuracy roll against AC 2 is required via the [[evasion-and-accuracy-system]].

## Secondary Effect

Force Palm Paralyzes the target on 18+. The [[type-status-immunity-utility]] prevents Paralysis application on Electric-types. Once applied, Paralysis halves initiative per [[paralysis-condition]].

## Trait Interactions

Flagged for Sheer Force, Tough Claws, Technician in the [[moves-csv-source-file]].

## See also

- [[status-capture-bonus-hierarchy]] — status conditions modify capture rate
