Bug Buzz is stored in [[movedata-reference-table]] with `damageClass: "Special"`, `type: "Bug"`, `damageBase: 9`, `frequency: "Scene x2"`, `ac: 2`, `range: "Cone 2 or Close Blast 2; Sonic, Smite"`.

## Frequency

Scene x2 frequency is enforced by the [[move-frequency-system]]. `checkMoveFrequency` checks the `usedThisScene` counter against a limit of 2, with [[scene-frequency-eot-restriction|EOT pacing]] between uses. The counter resets via [[scene-activation-resets-move-counters]].

## Resolution

Bug Buzz flows through the standard [[damage-flow-pipeline]] with DB 9 as the base. The [[nine-step-damage-formula]] applies STAB for Bug-type users and type effectiveness. An accuracy roll against AC 2 is required via the [[evasion-and-accuracy-system]].

## Effect

Combat stage changes are applied through the [[combat-stage-system]].

## Range and Targeting

The area of effect is visualized by the [[measurement-aoe-modes]] system.

## Ability Interactions

Flagged for Sheer Force, Punk Rock in the [[moves-csv-source-file]].
