Poison Fang is stored in [[movedata-reference-table]] with `damageClass: "Physical"`, `type: "Poison"`, `damageBase: 5`, `energyCost: 2`, `ac: 2`, `range: "Melee, 1 Target"`.

## Energy

Energy cost 2 is deducted from the user's Energy pool per [[move-energy-system]].

## Resolution

Poison Fang flows through the standard [[damage-flow-pipeline]] with DB 5 as the base. The [[nine-step-damage-formula]] applies STAB for Poison-type users and type effectiveness. An accuracy roll against AC 2 is required via the [[evasion-and-accuracy-system]].

## Secondary Effect

Poison Fang Badly Poisons the target on 17+. The [[type-status-immunity-utility]] prevents application on Poison-type and Steel-type targets. Once applied, [[status-tick-automation]] handles the escalating tick damage at turn boundaries, and the [[condition-source-rules]] track what inflicted the condition.

## Trait Interactions

Flagged for Sheer Force, Tough Claws, Technician, Strong Jaw in the [[moves-csv-source-file]].

## See also

- [[faint-and-revival-effects]] — Faint clears Persistent conditions
- [[status-capture-bonus-hierarchy]] — status conditions modify capture rate
