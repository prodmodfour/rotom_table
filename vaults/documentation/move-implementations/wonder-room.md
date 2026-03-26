Wonder Room is stored in [[movedata-reference-table]] with `damageClass: "Status"`, `type: "Psychic"`, `damageBase: null`, `energyCost: 3`, `ac: null`, `range: "Field"`.

## Energy

Energy cost 3 is deducted from the user's Energy pool per [[move-energy-system]].

## Resolution

As a Status move, Wonder Room skips the [[damage-flow-pipeline]]. No accuracy roll is needed (AC is null).

## Effect

For 5 rounds, the area is considered Wondered. While Wondered, each individual Pokemon's Defense and Special Defense Stats are switched.

## Trait Interactions

No trait-interaction flags are set in the [[moves-csv-source-file]].

## See also

- [[scene-activation-resets-move-counters]] — resets `usedThisScene` but preserves `usedToday`
- [[new-day-reset]] — resets all daily move usage counters
