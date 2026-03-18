Nuzzle is stored in [[movedata-reference-table]] with `damageClass: "Physical"`, `type: "Electric"`, `damageBase: 2`, `frequency: "Scene"`, `ac: 2`, `range: "Melee, 1 Target"`.

## Frequency

Scene frequency is enforced by the [[move-frequency-system]]. `checkMoveFrequency` checks the `usedThisScene` counter against a limit of 1. The counter resets via [[scene-activation-resets-move-counters]].

## Resolution

Nuzzle flows through the standard [[damage-flow-pipeline]] with DB 2 as the base. The [[nine-step-damage-formula]] applies STAB for Electric-type users and type effectiveness. An accuracy roll against AC 2 is required via the [[evasion-and-accuracy-system]].

## Secondary Effect

The [[type-status-immunity-utility]] prevents Paralysis application on Electric-types. Once applied, [[status-cs-auto-apply-with-tracking]] handles the -4 Speed CS.

## Ability Interactions

Flagged for Tough Claws, Technician in the [[moves-csv-source-file]].

## See also

- [[status-capture-bonus-hierarchy]] — status conditions modify capture rate
