Hurricane is stored in [[movedata-reference-table]] with `damageClass: "Special"`, `type: "Flying"`, `damageBase: 11`, `frequency: "Scene x2"`, `ac: 7`, `range: "Burst 1, Smite"`.

## Frequency

Scene x2 frequency is enforced by the [[move-frequency-system]]. `checkMoveFrequency` checks the `usedThisScene` counter against a limit of 2, with [[scene-frequency-eot-restriction|EOT pacing]] between uses. The counter resets via [[scene-activation-resets-move-counters]].

## Resolution

Hurricane flows through the standard [[damage-flow-pipeline]] with DB 11 as the base. The [[nine-step-damage-formula]] applies STAB for Flying-type users and type effectiveness. An accuracy roll against AC 7 is required via the [[evasion-and-accuracy-system]].

## Secondary Effect

Confusion follows the [[confused-three-outcome-save]] resolution.

## Range and Targeting

The area of effect is visualized by the [[measurement-aoe-modes]] system.

## Ability Interactions

Flagged for Sheer Force in the [[moves-csv-source-file]].

## See also

- [[status-capture-bonus-hierarchy]] — status conditions modify capture rate
