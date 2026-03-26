Wish is stored in [[movedata-reference-table]] with `damageClass: "Status"`, `type: "Normal"`, `damageBase: null`, `energyCost: 3`, `ac: null`, `range: "15, 1 Target"`.

## Energy

Energy cost 3 is deducted from the user's Energy pool per [[move-energy-system]].

## Resolution

As a Status move, Wish skips the [[damage-flow-pipeline]]. No accuracy roll is needed (AC is null).

## Effect

At the end of the user's next turn, the target regains Hit Points equal to half of its full Hit Point value. If the user targets themselves and are replaced in battle, the replacement is healed.

## Trait Interactions

No trait-interaction flags are set in the [[moves-csv-source-file]].

## See also

- [[scene-activation-resets-move-counters]] — resets `usedThisScene` but preserves `usedToday`
- [[new-day-reset]] — resets all daily move usage counters
