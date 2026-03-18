Clear Smog is stored in [[movedata-reference-table]] with `damageClass: "Special"`, `type: "Poison"`, `damageBase: 5`, `frequency: "Scene x2"`, `ac: null`, `range: "6, 1 Target"`.

## Frequency

Scene x2 frequency is enforced by the [[move-frequency-system]]. `checkMoveFrequency` checks the `usedThisScene` counter against a limit of 2, with [[scene-frequency-eot-restriction|EOT pacing]] between uses. The counter resets via [[scene-activation-resets-move-counters]].

## Resolution

Clear Smog flows through the standard [[damage-flow-pipeline]] with DB 5 as the base. The [[nine-step-damage-formula]] applies STAB for Poison-type users and type effectiveness.

## Effect

Combat stage changes are applied through the [[combat-stage-system]].

## Ability Interactions

Flagged for Technician in the [[moves-csv-source-file]].
