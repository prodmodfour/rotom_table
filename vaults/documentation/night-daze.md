Night Daze is stored in [[movedata-reference-table]] with `damageClass: "Special"`, `type: "Dark"`, `damageBase: 9`, `frequency: "EOT"`, `ac: 3`, `range: "4, 1 Target"`.

## Frequency

EOT frequency is enforced by the [[move-frequency-system]]. `checkMoveFrequency` compares `lastTurnUsed` against the current turn index to prevent consecutive-turn use.

## Resolution

Night Daze flows through the standard [[damage-flow-pipeline]] with DB 9 as the base. The [[nine-step-damage-formula]] applies STAB for Dark-type users and type effectiveness. An accuracy roll against AC 3 is required via the [[evasion-and-accuracy-system]].

## Ability Interactions

Flagged for Sheer Force in the [[moves-csv-source-file]].
