Eerie Impulse is stored in [[movedata-reference-table]] with `damageClass: "Status"`, `type: "Electric"`, `damageBase: null`, `frequency: "EOT"`, `ac: 2`, `range: "6, 1 Target"`.

## Frequency

EOT frequency is enforced by the [[move-frequency-system]]. `checkMoveFrequency` compares `lastTurnUsed` against the current turn index to prevent consecutive-turn use.

## Resolution

As a Status move, Eerie Impulse skips the [[damage-flow-pipeline]]. An accuracy roll against AC 2 is required via the [[evasion-and-accuracy-system]].

## Effect

Combat stage changes are applied through the [[combat-stage-system]]. The Glow. capability grant is tracked through the [[combatant-capabilities-utility]].

## Ability Interactions

No ability-interaction flags are set in the [[moves-csv-source-file]].
