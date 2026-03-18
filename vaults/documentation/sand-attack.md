Sand Attack is stored in [[movedata-reference-table]] with `damageClass: "Status"`, `type: "Ground"`, `damageBase: null`, `frequency: "EOT"`, `ac: 2`, `range: "2, 1 Target"`.

## Frequency

EOT frequency is enforced by the [[move-frequency-system]]. `checkMoveFrequency` compares `lastTurnUsed` against the current turn index to prevent consecutive-turn use.

## Resolution

As a Status move, Sand Attack skips the [[damage-flow-pipeline]]. An accuracy roll against AC 2 is required via the [[evasion-and-accuracy-system]].

## Ability Interactions

No ability-interaction flags are set in the [[moves-csv-source-file]].
