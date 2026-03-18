Dragon Pulse is stored in [[movedata-reference-table]] with `damageClass: "Special"`, `type: "Dragon"`, `damageBase: 9`, `frequency: "EOT"`, `ac: 2`, `range: "8, 1 Target, Aura"`.

## Frequency

EOT frequency is enforced by the [[move-frequency-system]]. `checkMoveFrequency` compares `lastTurnUsed` against the current turn index to prevent consecutive-turn use.

## Resolution

Dragon Pulse flows through the standard [[damage-flow-pipeline]] with DB 9 as the base. The [[nine-step-damage-formula]] applies STAB for Dragon-type users and type effectiveness. An accuracy roll against AC 2 is required via the [[evasion-and-accuracy-system]].

## Ability Interactions

Flagged for Mega Launcher in the [[moves-csv-source-file]].
