Curse is stored in [[movedata-reference-table]] with `damageClass: "Status"`, `type: "Ghost"`, `damageBase: null`, `frequency: "See Text"`, `ac: null`, `range: "Self"`.

## Frequency



## Resolution

As a Status move, Curse skips the [[damage-flow-pipeline]]. No accuracy roll is needed (AC is null).

## Effect

The Cursed condition triggers tick damage, handled by [[status-tick-automation]]. Combat stage changes are applied through the [[combat-stage-system]].

## Ability Interactions

No ability-interaction flags are set in the [[moves-csv-source-file]].

## See also

- [[status-capture-bonus-hierarchy]] — status conditions modify capture rate
