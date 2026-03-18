Spark is stored in [[movedata-reference-table]] with `damageClass: "Physical"`, `type: "Electric"`, `damageBase: 6`, `frequency: "EOT"`, `ac: 2`, `range: "Melee, 1 Target, Dash"`.

## Frequency

EOT frequency is enforced by the [[move-frequency-system]]. `checkMoveFrequency` compares `lastTurnUsed` against the current turn index to prevent consecutive-turn use.

## Resolution

Spark flows through the standard [[damage-flow-pipeline]] with DB 6 as the base. The [[nine-step-damage-formula]] applies STAB for Electric-type users and type effectiveness. An accuracy roll against AC 2 is required via the [[evasion-and-accuracy-system]].

## Secondary Effect

The [[type-status-immunity-utility]] prevents Paralysis application on Electric-types. Once applied, [[status-cs-auto-apply-with-tracking]] handles the -4 Speed CS.

## Ability Interactions

Flagged for Sheer Force, Tough Claws, Technician in the [[moves-csv-source-file]].

## See also

- [[status-capture-bonus-hierarchy]] — status conditions modify capture rate
