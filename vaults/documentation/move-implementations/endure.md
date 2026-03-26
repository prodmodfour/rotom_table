Endure is stored in [[movedata-reference-table]] with `damageClass: "Status"`, `type: "Normal"`, `damageBase: null`, `energyCost: 4`, `ac: null`, `range: "Self, Reaction, Trigger"`.

## Energy

Energy cost 4 is deducted from the user's Energy pool per [[move-energy-system]].

## Resolution

As a Status move, Endure skips the [[damage-flow-pipeline]]. No accuracy roll is needed (AC is null).

## Effect

If the user is hit by a damaging Move, the user may use Endure as a Free Action. If the Move would bring the user to 0 HP or less, the user is instead set to 1 HP.

## Trait Interactions

No trait-interaction flags are set in the [[moves-csv-source-file]].
