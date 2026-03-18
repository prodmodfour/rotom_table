Earth Power is stored in [[movedata-reference-table]] with `damageClass: "Special"`, `type: "Ground"`, `damageBase: 9`, `frequency: "EOT"`, `ac: 2`, `range: "6, 1 Target, Groundsource"`.

## Frequency

EOT frequency is enforced by the [[move-frequency-system]]. `checkMoveFrequency` compares `lastTurnUsed` against the current turn index to prevent consecutive-turn use.

## Resolution

Earth Power flows through the standard [[damage-flow-pipeline]] with DB 9 as the base. The [[nine-step-damage-formula]] applies STAB for Ground-type users and type effectiveness. An accuracy roll against AC 2 is required via the [[evasion-and-accuracy-system]].

## Effect

Combat stage changes are applied through the [[combat-stage-system]].

## Range and Targeting

The Groundsource keyword means the move originates from the ground — it can hit underground targets but not those with Levitate or Sky movement.

## Ability Interactions

Flagged for Sheer Force in the [[moves-csv-source-file]].
