Snatch is stored in [[movedata-reference-table]] with `damageClass: "Status"`, `type: "Dark"`, `damageBase: null`, `energyCost: 2`, `ac: null`, `range: "6, 1 Target, Interrupt"`.

## Energy

Energy cost 2 is deducted from the user's Energy pool per [[move-energy-system]].

## Resolution

As a Status move, Snatch skips the [[damage-flow-pipeline]]. No accuracy roll is needed (AC is null).

## Timing

Snatch uses the [[hold-priority-interrupt-system|Interrupt system]], resolving outside normal turn order in response to a trigger.

## Effect

If the target uses a Self-Targeting Move, you may use Snatch. You gain the benefits of the Self-Targeting Move instead of the target.

## Trait Interactions

No trait-interaction flags are set in the [[moves-csv-source-file]].
