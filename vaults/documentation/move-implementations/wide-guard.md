Wide Guard is stored in [[movedata-reference-table]] with `damageClass: "Status"`, `type: "Rock"`, `damageBase: null`, `energyCost: 3`, `ac: null`, `range: "Burst 1, Interrupt, Shield, Trigger"`.

## Energy

Energy cost 3 is deducted from the user's Energy pool per [[move-energy-system]].

## Resolution

As a Status move, Wide Guard skips the [[damage-flow-pipeline]]. No accuracy roll is needed (AC is null).

## Timing

Wide Guard uses the [[hold-priority-interrupt-system|Interrupt system]], resolving outside normal turn order in response to a trigger.

## Effect

If an ally adjacent to Wide Guard's user is hit by a Move, you may use Wide Guard as an Interrupt. All targets adjacent to Wide Guard's user, including the user, are instead not hit by the triggering Move and do not suffer any of its effects.

## Range and Targeting

The area of effect is visualized by the [[measurement-aoe-modes]] system.

## Trait Interactions

No trait-interaction flags are set in the [[moves-csv-source-file]].
