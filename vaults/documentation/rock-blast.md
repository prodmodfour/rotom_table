Rock Blast is stored in [[movedata-reference-table]] with `damageClass: "Physical"`, `type: "Rock"`, `damageBase: 3`, `frequency: "EOT"`, `ac: 5`, `range: "6, 1 Target, Five Strike"`.

## Frequency

EOT frequency is enforced by the [[move-frequency-system]]. `checkMoveFrequency` compares `lastTurnUsed` against the current turn index to prevent consecutive-turn use.

## Resolution

Rock Blast flows through the standard [[damage-flow-pipeline]] with DB 3 as the base. The [[nine-step-damage-formula]] applies STAB for Rock-type users and type effectiveness. The Five Strike keyword modifies damage at step 2 of the formula. An accuracy roll against AC 5 is required via the [[evasion-and-accuracy-system]].

## Effect

The Materializer capability grant is tracked through the [[combatant-capabilities-utility]].

## Ability Interactions

Flagged for Technician in the [[moves-csv-source-file]].
