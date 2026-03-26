String Shot is stored in [[movedata-reference-table]] with `damageClass: "Status"`, `type: "Bug"`, `damageBase: null`, `energyCost: 0`, `ac: 3`, `range: "Cone 2"`.

## Energy

Energy cost 0 — String Shot is free to use per [[move-energy-system]].

## Resolution

As a Status move, String Shot skips the [[damage-flow-pipeline]]. An accuracy roll against AC 3 is required via the [[evasion-and-accuracy-system]].

## Effect

Targets have their Speed CS lowered by -1 per the [[combat-stage-system]]. If this lowers their Speed CS to -6, or if their Speed CS was already at -6, the target is instead Stuck. The Stuck condition is tracked via the [[condition-source-rules]].

## Range and Targeting

The area of effect is visualized by the [[measurement-aoe-modes]] system.

## Trait Interactions

No trait-interaction flags are set in the [[moves-csv-source-file]].

## See also

- [[status-capture-bonus-hierarchy]] — status conditions modify capture rate
