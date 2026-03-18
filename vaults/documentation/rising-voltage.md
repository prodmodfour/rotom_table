Rising Voltage is stored in [[movedata-reference-table]] with `damageClass: "Special"`, `type: "Electric"`, `damageBase: 7`, `frequency: "Scene x2"`, `ac: 2`, `range: "Burst 2, Groundsource, Spirit Surge"`.

## Frequency

Scene x2 frequency is enforced by the [[move-frequency-system]]. `checkMoveFrequency` checks the `usedThisScene` counter against a limit of 2, with [[scene-frequency-eot-restriction|EOT pacing]] between uses. The counter resets via [[scene-activation-resets-move-counters]].

## Resolution

Rising Voltage flows through the standard [[damage-flow-pipeline]] with DB 7 as the base. The [[nine-step-damage-formula]] applies STAB for Electric-type users and type effectiveness. An accuracy roll against AC 2 is required via the [[evasion-and-accuracy-system]].

## Range and Targeting

The area of effect is visualized by the [[measurement-aoe-modes]] system. The Groundsource keyword means the move originates from the ground — it can hit underground targets but not those with Levitate or Sky movement.

## Ability Interactions

No ability-interaction flags are set in the [[moves-csv-source-file]].
