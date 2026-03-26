Telekinesis is stored in [[movedata-reference-table]] with `damageClass: "Status"`, `type: "Psychic"`, `damageBase: null`, `energyCost: 2`, `ac: null`, `range: "4, 1 Target"`.

## Energy

Energy cost 2 is deducted from the user's Energy pool per [[move-energy-system]].

## Resolution

As a Status move, Telekinesis skips the [[damage-flow-pipeline]]. No accuracy roll is needed (AC is null).

## Effect

The target becomes Lifted. While Lifted, they gain the [[movement-traits|Flier]] [[trait-definition|trait]], are Slowed, and lose all movement traits except for the Sky 4 granted by Flier (reduced to 2 by the Slow condition). While Lifted, the target may not apply any Evasion bonuses to determine whether they are hit by Moves or not. The Lifted target may use a Shift Action to roll 1d20; on a result of 16+, they stop being Lifted.

## Trait Interactions

No trait-interaction flags are set in the [[moves-csv-source-file]].

## See also

- [[status-capture-bonus-hierarchy]] — status conditions modify capture rate
