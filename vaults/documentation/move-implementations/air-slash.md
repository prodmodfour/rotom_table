Air Slash is stored in [[movedata-reference-table]] with `damageClass: "Special"`, `type: "Normal"`, `damageBase: 8`, `energyCost: 3`, `ac: 3`, `range: "6, 1 Target"`.

## Energy

Energy cost 3 is deducted from the user's Energy pool per [[move-energy-system]].

## Resolution

Air Slash flows through the standard [[damage-flow-pipeline]] with DB 8 as the base. The [[nine-step-damage-formula]] applies STAB for Normal-type users and type effectiveness. An accuracy roll against AC 3 is required via the [[evasion-and-accuracy-system]].

## Secondary Effect

Air Slash Flinches the target on 15+. Flinch prevents the target from taking actions for the remainder of the turn, tracked as a volatile condition.

## Trait Interactions

Flagged for Sheer Force in the [[moves-csv-source-file]].

## See also

- [[status-capture-bonus-hierarchy]] — status conditions modify capture rate
