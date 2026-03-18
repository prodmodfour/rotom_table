Oblivion Wing is stored in [[movedata-reference-table]] with `damageClass: "Special"`, `type: "Flying"`, `damageBase: 8`, `frequency: "Daily"`, `ac: 2`, `range: "Melee, 1 Target"`.

## Frequency

Daily frequency is enforced by the [[move-frequency-system]]. `checkMoveFrequency` checks both the `usedToday` counter (limit of 1) and the per-scene cap — daily moves can only be used [[daily-moves-once-per-scene|once per scene]] regardless of remaining daily uses. Daily uses refresh on [[extended-rest|extended rest]].

## Resolution

Oblivion Wing flows through the standard [[damage-flow-pipeline]] with DB 8 as the base. The [[nine-step-damage-formula]] applies STAB for Flying-type users and type effectiveness. An accuracy roll against AC 2 is required via the [[evasion-and-accuracy-system]].

## Effect

The HP recovery is described in the `effect` text field.

## Ability Interactions

Flagged for Tough Claws in the [[moves-csv-source-file]].

## See also

- [[scene-activation-resets-move-counters]] — resets `usedThisScene` but preserves `usedToday`
- [[new-day-reset]] — resets all daily move usage counters
