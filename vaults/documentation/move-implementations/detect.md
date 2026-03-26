Detect is stored in [[movedata-reference-table]] with `damageClass: "Status"`, `type: "Fighting"`, `damageBase: null`, `energyCost: 3`, `ac: null`, `range: "Self, Interrupt, Shield, Trigger"`.

## Energy

Energy cost 3 is deducted from the user's Energy pool per [[move-energy-system]].

## Resolution

As a Status move, Detect skips the [[damage-flow-pipeline]]. No accuracy roll is needed (AC is null).

## Effect

If the user is hit by a Move, the user may use Detect as an Interrupt. The user is instead not hit by the Move — takes no damage and is not affected by any of the Move's effects.

## Timing

Detect uses the [[hold-priority-interrupt-system|Interrupt system]], resolving outside normal turn order in response to a trigger.

## Trait Interactions

No trait-interaction flags are set in the [[moves-csv-source-file]].
