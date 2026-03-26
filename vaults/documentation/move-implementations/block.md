Block is stored in [[movedata-reference-table]] with `damageClass: "Status"`, `type: "Normal"`, `damageBase: null`, `energyCost: 0`, `ac: 2`, `range: "Melee, 1 Target"`.

## Energy

Energy cost 0 — no Energy is deducted per [[move-energy-system]].

## Resolution

As a Status move, Block skips the [[damage-flow-pipeline]]. An accuracy roll against AC 2 is required via the [[evasion-and-accuracy-system]].

## Effect

The target is Stuck and Trapped until the beginning of the user's next turn. The Stuck condition is tracked via the [[condition-source-rules]].

## Trait Interactions

Flagged for Tough Claws in the [[moves-csv-source-file]].

## See also

- [[status-capture-bonus-hierarchy]] — status conditions modify capture rate
