Leech Seed is stored in [[movedata-reference-table]] with `damageClass: "Status"`, `type: "Grass"`, `damageBase: null`, `frequency: "Daily x2"`, `ac: 4`, `range: "6, 1 Target"`.

## Frequency

Daily x2 frequency is enforced by the [[move-frequency-system]]. `checkMoveFrequency` checks both the `usedToday` counter (limit of 2) and the per-scene cap — daily moves can only be used [[daily-moves-once-per-scene|once per scene]] regardless of remaining daily uses. Daily uses refresh on [[extended-rest|extended rest]].

## Resolution

As a Status move, Leech Seed skips the [[damage-flow-pipeline]]. An accuracy roll against AC 4 is required via the [[evasion-and-accuracy-system]].

## Effect

The HP recovery is described in the `effect` text field.

## Ability Interactions

No ability-interaction flags are set in the [[moves-csv-source-file]].

## See also

- [[scene-activation-resets-move-counters]] — resets `usedThisScene` but preserves `usedToday`
- [[new-day-reset]] — resets all daily move usage counters
