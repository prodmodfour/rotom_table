Astonish is stored in [[movedata-reference-table]] with `damageClass: "Physical"`, `type: "Ghost"`, `damageBase: 3`, `energyCost: 1`, `ac: 2`, `range: "Melee, 1 Target"`.

## Energy

Energy cost 1 is deducted from the user's Energy pool per [[move-energy-system]].

## Resolution

Astonish flows through the standard [[damage-flow-pipeline]] with DB 3 as the base. The [[nine-step-damage-formula]] applies STAB for Ghost-type users and type effectiveness. An accuracy roll against AC 2 is required via the [[evasion-and-accuracy-system]].

## Secondary Effect

Astonish Flinches the target on 15+. If the target is unaware of the user's presence, Astonish automatically Flinches the target. Flinch prevents the target from taking actions for the remainder of the turn, tracked as a volatile condition.

## Trait Interactions

Flagged for Sheer Force, Tough Claws, Technician in the [[moves-csv-source-file]].

## See also

- [[status-capture-bonus-hierarchy]] — status conditions modify capture rate
