Curse is stored in [[movedata-reference-table]] with `damageClass: "Status"`, `type: "Ghost"`, `damageBase: null`, `energyCost: 1`, `ac: null`, `range: "Self"`.

## Energy

Energy cost 1 is deducted from the user's Energy pool per [[move-energy-system]].

## Resolution

As a Status move, Curse skips the [[damage-flow-pipeline]]. No accuracy roll is needed (AC is null).

## Effect

The user loses 1/3rd of their Max Hit Points (this loss cannot be prevented in any way) and a target within 8 meters becomes Cursed. The Cursed condition triggers tick damage, handled by [[status-tick-automation]].

## Trait Interactions

No trait-interaction flags are set in the [[moves-csv-source-file]].

## See also

- [[status-capture-bonus-hierarchy]] — status conditions modify capture rate
