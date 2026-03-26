Mean Look is stored in [[movedata-reference-table]] with `damageClass: "Status"`, `type: "Normal"`, `damageBase: null`, `energyCost: 3`, `ac: null`, `range: "6, 1 Target, Social"`.

## Energy

Energy cost 3 is deducted from the user's Energy pool per [[move-energy-system]].

## Resolution

As a Status move, Mean Look skips the [[damage-flow-pipeline]]. No accuracy roll is needed (AC is null).

## Effect

The target becomes Trapped and Slowed for the remainder of the encounter. The Trapped condition blocks recall, tracked via the [[condition-source-rules]]. The Slowed condition halves movement, tracked via the [[condition-source-rules]].

## Trait Interactions

No trait-interaction flags are set in the [[moves-csv-source-file]].

## See also

- [[status-capture-bonus-hierarchy]] — status conditions modify capture rate
