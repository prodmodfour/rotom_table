Freeze Shock is stored in [[movedata-reference-table]] with `damageClass: "Physical"`, `type: "Ice"`, `damageBase: 14`, `frequency: "Scene"`, `ac: 4`, `range: "10, 1 Target, Set-Up, Full Action"`.

## Frequency

Scene frequency is enforced by the [[move-frequency-system]]. `checkMoveFrequency` checks the `usedThisScene` counter against a limit of 1. The counter resets via [[scene-activation-resets-move-counters]].

## Resolution

Freeze Shock flows through the standard [[damage-flow-pipeline]] with DB 14 as the base. The [[nine-step-damage-formula]] applies STAB for Ice-type users and type effectiveness. An accuracy roll against AC 4 is required via the [[evasion-and-accuracy-system]].

## Secondary Effect

The [[type-status-immunity-utility]] prevents Paralysis application on Electric-types. Once applied, [[status-cs-auto-apply-with-tracking]] handles the -4 Speed CS. The [[type-status-immunity-utility]] prevents Freeze application on Ice-types.

## Ability Interactions

Flagged for Sheer Force in the [[moves-csv-source-file]].

## See also

- [[status-capture-bonus-hierarchy]] — status conditions modify capture rate
