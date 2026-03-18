Barb Barrage is stored in [[movedata-reference-table]] with `damageClass: "Physical"`, `type: "Poison"`, `damageBase: 2`, `frequency: "EOT"`, `ac: 2`, `range: "6, 1 Target, Five Strike"`.

## Frequency

EOT frequency is enforced by the [[move-frequency-system]]. `checkMoveFrequency` compares `lastTurnUsed` against the current turn index to prevent consecutive-turn use.

## Resolution

Barb Barrage flows through the standard [[damage-flow-pipeline]] with DB 2 as the base. The [[nine-step-damage-formula]] applies STAB for Poison-type users and type effectiveness. The Five Strike keyword modifies damage at step 2 of the formula. An accuracy roll against AC 2 is required via the [[evasion-and-accuracy-system]].

## Secondary Effect

The [[type-status-immunity-utility]] prevents Poison application on Poison-type and Steel-type targets. Once applied, [[status-tick-automation]] handles tick damage.

## Ability Interactions

Flagged for Sheer Force, Technician in the [[moves-csv-source-file]].

## See also

- [[faint-and-revival-effects]] — Faint clears Persistent conditions
- [[status-capture-bonus-hierarchy]] — status conditions modify capture rate
