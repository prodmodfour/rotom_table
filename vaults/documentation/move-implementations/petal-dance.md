Petal Dance is stored in [[movedata-reference-table]] with `damageClass: "Special"`, `type: "Grass"`, `damageBase: 12`, `energyCost: 4`, `ac: 3`, `range: "Melee, All Adjacent Foes, Smite"`.

## Energy

Energy cost 4 is deducted from the user's Energy pool per [[move-energy-system]].

## Resolution

Petal Dance flows through the standard [[damage-flow-pipeline]] with DB 12 as the base. The [[nine-step-damage-formula]] applies STAB for Grass-type users and type effectiveness. An accuracy roll against AC 3 is required via the [[evasion-and-accuracy-system]].

## Secondary Effect

After damage is dealt, the user becomes Enraged and Confused. Confusion follows the [[confused-three-outcome-save]] resolution. The Enraged condition is tracked via the [[condition-source-rules]].

## Trait Interactions

Flagged for Tough Claws in the [[moves-csv-source-file]].

## See also

- [[status-capture-bonus-hierarchy]] — status conditions modify capture rate
