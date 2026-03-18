Fake Tears is stored in [[movedata-reference-table]] with `damageClass: "Status"`, `type: "Dark"`, `damageBase: null`, `frequency: "EOT"`, `ac: 2`, `range: "8, 1 Target, Social"`.

## Frequency

EOT frequency is enforced by the [[move-frequency-system]]. `checkMoveFrequency` compares `lastTurnUsed` against the current turn index to prevent consecutive-turn use.

## Resolution

As a Status move, Fake Tears skips the [[damage-flow-pipeline]]. An accuracy roll against AC 2 is required via the [[evasion-and-accuracy-system]].

## Effect

Combat stage changes are applied through the [[combat-stage-system]].

## Ability Interactions

No ability-interaction flags are set in the [[moves-csv-source-file]].
