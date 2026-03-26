Spite is stored in [[movedata-reference-table]] with `damageClass: "Status"`, `type: "Ghost"`, `damageBase: null`, `energyCost: 5`, `ac: null`, `range: "1 Target, Trigger"`.

## Energy

Energy cost 5 is deducted from the user's Energy pool per [[move-energy-system]].

## Resolution

As a Status move, Spite skips the [[damage-flow-pipeline]]. No accuracy roll is needed (AC is null).

## Effect

When the user is hit by a move, that Move becomes Disabled for the attacker. The Disabled condition is tracked via the [[condition-source-rules]].

## Trait Interactions

No trait-interaction flags are set in the [[moves-csv-source-file]].

## See also

- [[status-capture-bonus-hierarchy]] — status conditions modify capture rate
