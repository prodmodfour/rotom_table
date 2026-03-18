Metal Sound is stored in [[movedata-reference-table]] with `damageClass: "Status"`, `type: "Steel"`, `damageBase: null`, `frequency: "EOT"`, `ac: 4`, `range: "Burst 2, Friendly, Sonic"`.

## Frequency

EOT frequency is enforced by the [[move-frequency-system]]. `checkMoveFrequency` compares `lastTurnUsed` against the current turn index to prevent consecutive-turn use.

## Resolution

As a Status move, Metal Sound skips the [[damage-flow-pipeline]]. An accuracy roll against AC 4 is required via the [[evasion-and-accuracy-system]].

## Effect

Combat stage changes are applied through the [[combat-stage-system]].

## Range and Targeting

The area of effect is visualized by the [[measurement-aoe-modes]] system.

## Ability Interactions

Flagged for Punk Rock in the [[moves-csv-source-file]].
