Will-O-Wisp is stored in [[movedata-reference-table]] with `damageClass: "Status"`, `type: "Fire"`, `damageBase: null`, `frequency: "EOT"`, `ac: 5`, `range: "6, 1 Target"`.

## Frequency

EOT frequency is enforced by the [[move-frequency-system]]. `checkMoveFrequency` compares `lastTurnUsed` against the current turn index to prevent consecutive-turn use.

## Resolution

As a Status move, Will-O-Wisp skips the [[damage-flow-pipeline]]. An accuracy roll against AC 5 is required via the [[evasion-and-accuracy-system]].

## Ability Interactions

No ability-interaction flags are set in the [[moves-csv-source-file]].
