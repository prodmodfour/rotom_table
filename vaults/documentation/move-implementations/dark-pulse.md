Dark Pulse is stored in [[movedata-reference-table]] with `damageClass: "Special"`, `type: "Dark"`, `damageBase: 8`, `energyCost: 3`, `ac: 2`, `range: "8, 1 Target, Aura"`.

## Energy

Energy cost 3 is deducted from the user's Energy pool per [[move-energy-system]].

## Resolution

Dark Pulse flows through the standard [[damage-flow-pipeline]] with DB 8 as the base. The [[nine-step-damage-formula]] applies STAB for Dark-type users and type effectiveness. An accuracy roll against AC 2 is required via the [[evasion-and-accuracy-system]].

## Secondary Effect

Dark Pulse Flinches the target on 17+. Flinch prevents the target from taking actions for the remainder of the turn, tracked as a volatile condition.

## Trait Interactions

Flagged for Sheer Force, Mega Launcher in the [[moves-csv-source-file]].

## See also

- [[status-capture-bonus-hierarchy]] — status conditions modify capture rate
