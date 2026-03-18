Pollen Puff is stored in [[movedata-reference-table]] with `damageClass: "Special"`, `type: "Bug"`, `damageBase: 9`, `frequency: "EOT"`, `ac: 2`, `range: "6, 1 Target"`.

## Frequency

EOT frequency is enforced by the [[move-frequency-system]]. `checkMoveFrequency` compares `lastTurnUsed` against the current turn index to prevent consecutive-turn use.

## Resolution

Pollen Puff flows through the standard [[damage-flow-pipeline]] with DB 9 as the base. The [[nine-step-damage-formula]] applies STAB for Bug-type users and type effectiveness. An accuracy roll against AC 2 is required via the [[evasion-and-accuracy-system]].

## Effect

The HP recovery is described in the `effect` text field.

## Ability Interactions

No ability-interaction flags are set in the [[moves-csv-source-file]].
