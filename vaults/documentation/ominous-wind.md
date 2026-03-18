Ominous Wind is stored in [[movedata-reference-table]] with `damageClass: "Special"`, `type: "Ghost"`, `damageBase: 6`, `frequency: "EOT"`, `ac: 2`, `range: "6, 1 Target, Spirit Surge"`.

## Frequency

EOT frequency is enforced by the [[move-frequency-system]]. `checkMoveFrequency` compares `lastTurnUsed` against the current turn index to prevent consecutive-turn use.

## Resolution

Ominous Wind flows through the standard [[damage-flow-pipeline]] with DB 6 as the base. The [[nine-step-damage-formula]] applies STAB for Ghost-type users and type effectiveness. An accuracy roll against AC 2 is required via the [[evasion-and-accuracy-system]].

## Effect

Combat stage changes are applied through the [[combat-stage-system]].

## Ability Interactions

Flagged for Sheer Force, Technician in the [[moves-csv-source-file]].
