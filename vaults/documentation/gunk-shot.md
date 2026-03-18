Gunk Shot is stored in [[movedata-reference-table]] with `damageClass: "Physical"`, `type: "Poison"`, `damageBase: 12`, `frequency: "Daily x2"`, `ac: 5`, `range: "6, 1 Target, Smite"`.

## Frequency

Daily x2 frequency is enforced by the [[move-frequency-system]]. `checkMoveFrequency` checks both the `usedToday` counter (limit of 2) and the per-scene cap — daily moves can only be used [[daily-moves-once-per-scene|once per scene]] regardless of remaining daily uses. Daily uses refresh on [[extended-rest|extended rest]].

## Resolution

Gunk Shot flows through the standard [[damage-flow-pipeline]] with DB 12 as the base. The [[nine-step-damage-formula]] applies STAB for Poison-type users and type effectiveness. An accuracy roll against AC 5 is required via the [[evasion-and-accuracy-system]].

## Secondary Effect

The [[type-status-immunity-utility]] prevents Poison application on Poison-type and Steel-type targets. Once applied, [[status-tick-automation]] handles tick damage.

## Ability Interactions

Flagged for Sheer Force in the [[moves-csv-source-file]].

## See also

- [[scene-activation-resets-move-counters]] — resets `usedThisScene` but preserves `usedToday`
- [[new-day-reset]] — resets all daily move usage counters
- [[faint-and-revival-effects]] — Faint clears Persistent conditions
- [[status-capture-bonus-hierarchy]] — status conditions modify capture rate
