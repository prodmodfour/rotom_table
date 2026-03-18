Ice Hammer is stored in [[movedata-reference-table]] with `damageClass: "Physical"`, `type: "Ice"`, `damageBase: 10`, `frequency: "EOT"`, `ac: 4`, `range: "Melee, 1 Target"`.

## Frequency

EOT frequency is enforced by the [[move-frequency-system]]. `checkMoveFrequency` compares `lastTurnUsed` against the current turn index to prevent consecutive-turn use.

## Resolution

Ice Hammer flows through the standard [[damage-flow-pipeline]] with DB 10 as the base. The [[nine-step-damage-formula]] applies STAB for Ice-type users and type effectiveness. An accuracy roll against AC 4 is required via the [[evasion-and-accuracy-system]].

## Effect

Combat stage changes are applied through the [[combat-stage-system]].

## Ability Interactions

Flagged for Tough Claws in the [[moves-csv-source-file]].
