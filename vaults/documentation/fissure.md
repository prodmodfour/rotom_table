Fissure is stored in [[movedata-reference-table]] with `damageClass: "Status"`, `type: "Ground"`, `damageBase: null`, `frequency: "Daily"`, `ac: null`, `range: "5, 1 Target, Execute, Groundsource"`.

## Frequency

Daily frequency is enforced by the [[move-frequency-system]]. `checkMoveFrequency` checks both the `usedToday` counter (limit of 1) and the per-scene cap — daily moves can only be used [[daily-moves-once-per-scene|once per scene]] regardless of remaining daily uses. Daily uses refresh on [[extended-rest|extended rest]].

## Resolution

As a Status move, Fissure skips the [[damage-flow-pipeline]]. No accuracy roll is needed (AC is null).

## Range and Targeting

The Groundsource keyword means the move originates from the ground — it can hit underground targets but not those with Levitate or Sky movement.

## Ability Interactions

No ability-interaction flags are set in the [[moves-csv-source-file]].

## See also

- [[scene-activation-resets-move-counters]] — resets `usedThisScene` but preserves `usedToday`
- [[new-day-reset]] — resets all daily move usage counters
