Helping Hand is stored in [[movedata-reference-table]] with `damageClass: "Status"`, `type: "Normal"`, `damageBase: null`, `energyCost: 1`, `ac: null`, `range: "4, 1 Target, Priority"`.

## Energy

Energy cost 1 is deducted from the user's Energy pool per [[move-energy-system]].

## Resolution

As a Status move, Helping Hand skips the [[damage-flow-pipeline]]. No accuracy roll is needed (AC is null).

## Effect

Helping Hand grants the target +2 on their next Accuracy Roll this round, and +10 to the next Damage Roll this round.

## Timing

Helping Hand has the Priority keyword, placing it in the [[hold-priority-interrupt-system|Priority Window]] before normal actions.

## Trait Interactions

No trait-interaction flags are set in the [[moves-csv-source-file]].
