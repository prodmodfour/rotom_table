Trick Room is stored in [[movedata-reference-table]] with `damageClass: "Status"`, `type: "Psychic"`, `damageBase: null`, `energyCost: 3`, `ac: null`, `range: "Field"`.

## Energy

Energy cost 3 is deducted from the user's Energy pool per [[move-energy-system]].

## Resolution

As a Status move, Trick Room skips the [[damage-flow-pipeline]]. No accuracy roll is needed (AC is null).

## Effect

Starting at the beginning of the next round, for 5 rounds, the area is considered Rewinding. While Rewinding, Initiative is reversed, and participants instead go from lowest Initiative to highest.

## Trait Interactions

No trait-interaction flags are set in the [[moves-csv-source-file]].

## See also

- [[scene-activation-resets-move-counters]] — resets `usedThisScene` but preserves `usedToday`
- [[new-day-reset]] — resets all daily move usage counters
