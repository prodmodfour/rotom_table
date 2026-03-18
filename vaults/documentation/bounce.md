Bounce is stored in [[movedata-reference-table]] with `damageClass: "Physical"`, `type: "Flying"`, `damageBase: 9`, `frequency: "Scene x2"`, `ac: 4`, `range: "Melee, 1 Target, Dash, Full Action"`.

## Frequency

Scene x2 frequency is enforced by the [[move-frequency-system]]. `checkMoveFrequency` checks the `usedThisScene` counter against a limit of 2, with [[scene-frequency-eot-restriction|EOT pacing]] between uses. The counter resets via [[scene-activation-resets-move-counters]].

## Resolution

Bounce flows through the standard [[damage-flow-pipeline]] with DB 9 as the base. The [[nine-step-damage-formula]] applies STAB for Flying-type users and type effectiveness. An accuracy roll against AC 4 is required via the [[evasion-and-accuracy-system]].

## Secondary Effect

The [[type-status-immunity-utility]] prevents Paralysis application on Electric-types. Once applied, [[status-cs-auto-apply-with-tracking]] handles the -4 Speed CS.

## Ability Interactions

Flagged for Sheer Force, Tough Claws in the [[moves-csv-source-file]].

## See also

- [[status-capture-bonus-hierarchy]] — status conditions modify capture rate
