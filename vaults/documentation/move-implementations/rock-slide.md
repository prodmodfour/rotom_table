Rock Slide is stored in [[movedata-reference-table]] with `damageClass: "Physical"`, `type: "Rock"`, `damageBase: 8`, `energyCost: 6`, `ac: 4`, `range: "6, Ranged Blast 3"`.

## Energy

Energy cost 6 is deducted from the user's Energy pool per [[move-energy-system]].

## Resolution

Rock Slide flows through the standard [[damage-flow-pipeline]] with DB 8 as the base. The [[nine-step-damage-formula]] applies STAB for Rock-type users and type effectiveness. An accuracy roll against AC 4 is required via the [[evasion-and-accuracy-system]].

## Secondary Effect

Rock Slide Flinches all legal targets on 17+. Flinch prevents the target from taking actions for the remainder of the turn, tracked as a volatile condition.

## Trait Interactions

Flagged for Sheer Force in the [[moves-csv-source-file]].

## See also

- [[status-capture-bonus-hierarchy]] — status conditions modify capture rate
