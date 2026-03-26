Magic Coat is stored in [[movedata-reference-table]] with `damageClass: "Status"`, `type: "Psychic"`, `damageBase: null`, `energyCost: 4`, `ac: null`, `range: "4, Interrupt, Trigger"`.

## Energy

Energy cost 4 is deducted from the user's Energy pool per [[move-energy-system]].

## Resolution

As a Status move, Magic Coat skips the [[damage-flow-pipeline]]. No accuracy roll is needed (AC is null).

## Timing

Magic Coat uses the [[hold-priority-interrupt-system|Interrupt system]], resolving outside normal turn order in response to a trigger.

## Effect

If the user is about to get hit by a Move that does not have a Damage Dice Roll, they may use Magic Coat as an Interrupt. The Interrupted Move's user is treated as if they were the target of their own Move, with the user of Magic Coat as the user.

## Trait Interactions

No trait-interaction flags are set in the [[moves-csv-source-file]].
