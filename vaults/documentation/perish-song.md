Perish Song is stored in [[movedata-reference-table]] with `damageClass: "Status"`, `type: "Normal"`, `damageBase: null`, `frequency: "Daily"`, `ac: null`, `range: "Burst 15, Sonic"`.

## Frequency

Daily frequency is enforced by the [[move-frequency-system]]. `checkMoveFrequency` checks both the `usedToday` counter (limit of 1) and the per-scene cap — daily moves can only be used [[daily-moves-once-per-scene|once per scene]] regardless of remaining daily uses. Daily uses refresh on [[extended-rest|extended rest]].

## Resolution

As a Status move, Perish Song skips the [[damage-flow-pipeline]]. No accuracy roll is needed (AC is null).

## Effect



## Range and Targeting

The area of effect is visualized by the [[measurement-aoe-modes]] system.

## Ability Interactions

Flagged for Punk Rock in the [[moves-csv-source-file]].

## See also

- [[scene-activation-resets-move-counters]] — resets `usedThisScene` but preserves `usedToday`
- [[new-day-reset]] — resets all daily move usage counters
