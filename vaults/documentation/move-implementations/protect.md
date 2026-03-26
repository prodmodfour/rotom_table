Protect is stored in [[movedata-reference-table]] with `damageClass: "Status"`, `type: "Normal"`, `damageBase: null`, `energyCost: 3`, `ac: null`, `range: "Self, Interrupt, Shield, Trigger"`.

## Energy

Energy cost 3 is deducted from the user's Energy pool per [[move-energy-system]].

## Resolution

As a Status move, Protect skips the [[damage-flow-pipeline]]. No accuracy roll is needed (AC is null).

## Timing

Protect uses the [[hold-priority-interrupt-system|Interrupt system]], resolving outside normal turn order in response to a trigger.

## Effect

If the user is hit by a Move, the user may use Protect. The user is instead not hit by the Move. The user does not take any damage nor is affected by any of the Move's effects.

## Trait Interactions

No trait-interaction flags are set in the [[moves-csv-source-file]].
