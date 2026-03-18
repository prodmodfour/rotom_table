Beat Up is stored in [[movedata-reference-table]] with `damageClass: "Physical"`, `type: "Dark"`, `damageBase: "See Effect"`, `frequency: "EOT"`, `ac: null`, `range: "Melee, 1 Target"`.

## Frequency

EOT frequency is enforced by the [[move-frequency-system]]. `checkMoveFrequency` compares `lastTurnUsed` against the current turn index to prevent consecutive-turn use.

## Resolution

Beat Up flows through the standard [[damage-flow-pipeline]] with a variable Damage Base as the base. The [[nine-step-damage-formula]] applies STAB for Dark-type users and type effectiveness.

## Ability Interactions

Flagged for Tough Claws in the [[moves-csv-source-file]].
