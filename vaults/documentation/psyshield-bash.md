Psyshield Bash is stored in [[movedata-reference-table]] with `damageClass: "Physical"`, `type: "Psychic"`, `damageBase: 7`, `frequency: "EOT"`, `ac: 4`, `range: "Melee, 1 Target"`.

## Frequency

EOT frequency is enforced by the [[move-frequency-system]]. `checkMoveFrequency` compares `lastTurnUsed` against the current turn index to prevent consecutive-turn use.

## Resolution

Psyshield Bash flows through the standard [[damage-flow-pipeline]] with DB 7 as the base. The [[nine-step-damage-formula]] applies STAB for Psychic-type users and type effectiveness. An accuracy roll against AC 4 is required via the [[evasion-and-accuracy-system]].

## Ability Interactions

Flagged for Sheer Force, Tough Claws in the [[moves-csv-source-file]].
