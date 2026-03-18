Clanging Scales is stored in [[movedata-reference-table]] with `damageClass: "Special"`, `type: "Dragon"`, `damageBase: 11`, `frequency: "Scene x2"`, `ac: 2`, `range: "6, 1 Target or Burst 1, Sonic"`.

## Frequency

Scene x2 frequency is enforced by the [[move-frequency-system]]. `checkMoveFrequency` checks the `usedThisScene` counter against a limit of 2, with [[scene-frequency-eot-restriction|EOT pacing]] between uses. The counter resets via [[scene-activation-resets-move-counters]].

## Resolution

Clanging Scales flows through the standard [[damage-flow-pipeline]] with DB 11 as the base. The [[nine-step-damage-formula]] applies STAB for Dragon-type users and type effectiveness. An accuracy roll against AC 2 is required via the [[evasion-and-accuracy-system]].

## Range and Targeting

The area of effect is visualized by the [[measurement-aoe-modes]] system.

## Ability Interactions

Flagged for Punk Rock in the [[moves-csv-source-file]].
