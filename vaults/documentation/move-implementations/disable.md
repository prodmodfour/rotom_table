Disable is stored in [[movedata-reference-table]] with `damageClass: "Status"`, `type: "Normal"`, `damageBase: null`, `energyCost: 3`, `ac: null`, `range: "1 Target, Trigger"`.

## Energy

Energy cost 3 is deducted from the user's Energy pool per [[move-energy-system]].

## Resolution

As a Status move, Disable skips the [[damage-flow-pipeline]]. No accuracy roll is needed (AC is null).

## Effect

Disable may be used as a Free Action that does not take up a Command whenever the user is hit by a Move. That Move becomes Disabled for the attacker. The Disabled condition is tracked via the [[condition-source-rules]].

## Trait Interactions

No trait-interaction flags are set in the [[moves-csv-source-file]].

## See also

- [[status-capture-bonus-hierarchy]] — status conditions modify capture rate
