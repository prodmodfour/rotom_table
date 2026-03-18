Heal Block is stored in [[movedata-reference-table]] with `damageClass: "Status"`, `type: "Psychic"`, `damageBase: null`, `frequency: "EOT"`, `ac: 2`, `range: "6, 1 Target"`.

## Frequency

EOT frequency is enforced by the [[move-frequency-system]]. `checkMoveFrequency` compares `lastTurnUsed` against the current turn index to prevent consecutive-turn use.

## Resolution

As a Status move, Heal Block skips the [[damage-flow-pipeline]]. An accuracy roll against AC 2 is required via the [[evasion-and-accuracy-system]].

## Effect

The HP recovery is described in the `effect` text field.

## Ability Interactions

No ability-interaction flags are set in the [[moves-csv-source-file]].
