Growl is stored in [[movedata-reference-table]] with `damageClass: "Status"`, `type: "Normal"`, `damageBase: null`, `frequency: "At-Will"`, `ac: 2`, `range: "Burst 1, Friendly, Sonic, Social"`.

## Frequency

At-Will frequency requires no usage tracking. `checkMoveFrequency` always permits use.

## Resolution

As a Status move, Growl skips the [[damage-flow-pipeline]]. An accuracy roll against AC 2 is required via the [[evasion-and-accuracy-system]].

## Effect

Combat stage changes are applied through the [[combat-stage-system]].

## Range and Targeting

The area of effect is visualized by the [[measurement-aoe-modes]] system.

## Ability Interactions

Flagged for Punk Rock in the [[moves-csv-source-file]].
