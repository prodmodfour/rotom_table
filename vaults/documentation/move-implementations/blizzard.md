Blizzard is stored in [[movedata-reference-table]] with `damageClass: "Special"`, `type: "Ice"`, `damageBase: 11`, `energyCost: 4`, `ac: 7`, `range: "4, Ranged Blast 2, Smite"`.

## Energy

Energy cost 4 is deducted from the user's Energy pool per [[move-energy-system]].

## Resolution

Blizzard flows through the standard [[damage-flow-pipeline]] with DB 11 as the base. The [[nine-step-damage-formula]] applies STAB for Ice-type users and type effectiveness. An accuracy roll against AC 7 is required via the [[evasion-and-accuracy-system]]. If the target is in Hailing Weather, Blizzard cannot miss.

## Secondary Effect

Blizzard Freezes all legal targets on 15+. The [[type-status-immunity-utility]] prevents Freeze application on Ice-types.

## Trait Interactions

Flagged for Sheer Force in the [[moves-csv-source-file]].

## See also

- [[status-capture-bonus-hierarchy]] — status conditions modify capture rate
