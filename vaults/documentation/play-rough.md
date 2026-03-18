Play Rough is stored in [[movedata-reference-table]] with `damageClass: "Physical"`, `type: "Fairy"`, `damageBase: 9`, `frequency: "EOT"`, `ac: 4`, `range: "Melee, 1 Target"`.

## Frequency

EOT frequency is enforced by the [[move-frequency-system]]. `checkMoveFrequency` compares `lastTurnUsed` against the current turn index to prevent consecutive-turn use.

## Resolution

Play Rough flows through the standard [[damage-flow-pipeline]] with DB 9 as the base. The [[nine-step-damage-formula]] applies STAB for Fairy-type users and type effectiveness. An accuracy roll against AC 4 is required via the [[evasion-and-accuracy-system]].

## Effect

Combat stage changes are applied through the [[combat-stage-system]].

## Ability Interactions

Flagged for Sheer Force, Tough Claws in the [[moves-csv-source-file]].
