Hurricane is stored in [[movedata-reference-table]] with `damageClass: "Special"`, `type: "Normal"`, `damageBase: 11`, `energyCost: 5`, `ac: 7`, `range: "Burst 1, Smite"`.

## Energy

Energy cost 5 is deducted from the user's Energy pool per [[move-energy-system]].

## Resolution

Hurricane flows through the standard [[damage-flow-pipeline]] with DB 11 as the base. The [[nine-step-damage-formula]] applies STAB for Normal-type users and type effectiveness. An accuracy roll against AC 7 is required via the [[evasion-and-accuracy-system]]. In Sunny Weather, AC becomes 11. In Rainy Weather, Hurricane cannot miss. If the target is airborne from Fly or Sky Drop, Hurricane cannot miss.

## Secondary Effect

Hurricane Confuses the target on 15+. Confusion follows the [[confused-three-outcome-save]] resolution.

## Range and Targeting

The area of effect is visualized by the [[measurement-aoe-modes]] system.

## Trait Interactions

Flagged for Sheer Force in the [[moves-csv-source-file]].

## See also

- [[status-capture-bonus-hierarchy]] — status conditions modify capture rate
