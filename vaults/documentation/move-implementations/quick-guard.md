Quick Guard is stored in [[movedata-reference-table]] with `damageClass: "Status"`, `type: "Fighting"`, `damageBase: null`, `energyCost: 3`, `ac: null`, `range: "Melee, Interrupt, Shield, Trigger"`.

## Energy

Energy cost 3 is deducted from the user's Energy pool per [[move-energy-system]].

## Resolution

As a Status move, Quick Guard skips the [[damage-flow-pipeline]]. No accuracy roll is needed (AC is null).

## Timing

Quick Guard uses the [[hold-priority-interrupt-system|Interrupt system]], resolving outside normal turn order in response to a trigger.

## Effect

If the user or an adjacent ally is targeted by a Priority or Interrupt Attack, Quick Guard may be declared as an Interrupt, causing the triggering attack to have no effect.

## Trait Interactions

Flagged for Tough Claws in the [[moves-csv-source-file]].
