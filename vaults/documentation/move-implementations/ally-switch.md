Ally Switch is stored in [[movedata-reference-table]] with `damageClass: "Status"`, `type: "Psychic"`, `damageBase: null`, `energyCost: 3`, `ac: null`, `range: "6, 1 Target, Interrupt"`.

## Energy

Energy cost 3 is deducted from the user's Energy pool per [[move-energy-system]].

## Resolution

As a Status move, Ally Switch skips the [[damage-flow-pipeline]]. No accuracy roll is needed (AC is null).

## Effect

Ally Switch may be declared during a foe's turn as an Interrupt. The user chooses one willing ally within 6 meters; the target and the user switch places. If the ally was a target of a Move, the user is now the target; if the user was a target of a Move, the ally is now the target.

## Timing

Ally Switch uses the [[hold-priority-interrupt-system|Interrupt system]], resolving outside normal turn order in response to a trigger.

## Trait Interactions

No trait-interaction flags are set in the [[moves-csv-source-file]].
