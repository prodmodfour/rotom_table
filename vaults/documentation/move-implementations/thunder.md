Thunder is stored in [[movedata-reference-table]] with `damageClass: "Special"`, `type: "Electric"`, `damageBase: 11`, `energyCost: 4`, `ac: 7`, `range: "12, 1 Target, Smite"`.

## Energy

Energy cost 4 is deducted from the user's Energy pool per [[move-energy-system]].

## Resolution

Thunder flows through the standard [[damage-flow-pipeline]] with DB 11 as the base. The [[nine-step-damage-formula]] applies STAB for Electric-type users and type effectiveness. An accuracy roll against AC 7 is required via the [[evasion-and-accuracy-system]].

## Secondary Effect

Thunder Paralyzes its target on 15+. If the target is in Sunny Weather, Thunder's Accuracy Check is 11. If the target is in Rainy Weather, Thunder cannot miss. If the target is airborne as a result of Fly or Sky Drop, Thunder cannot miss.

## Trait Interactions

Flagged for Sheer Force in the [[moves-csv-source-file]].

## See also

- [[status-capture-bonus-hierarchy]] — status conditions modify capture rate
