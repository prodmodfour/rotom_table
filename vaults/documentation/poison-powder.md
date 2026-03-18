Poison Powder is stored in [[movedata-reference-table]] with `damageClass: "Status"`, `type: "Poison"`, `damageBase: null`, `frequency: "EOT"`, `ac: 6`, `range: "4, 1 Target, Powder"`.

## Frequency

EOT frequency is enforced by the [[move-frequency-system]]. `checkMoveFrequency` compares `lastTurnUsed` against the current turn index to prevent consecutive-turn use.

## Resolution

As a Status move, Poison Powder skips the [[damage-flow-pipeline]]. An accuracy roll against AC 6 is required via the [[evasion-and-accuracy-system]].

## Effect

The [[type-status-immunity-utility]] prevents Poison application on Poison-type and Steel-type targets. Once applied, [[status-tick-automation]] handles tick damage.

## Ability Interactions

No ability-interaction flags are set in the [[moves-csv-source-file]].

## See also

- [[faint-and-revival-effects]] — Faint clears Persistent conditions
- [[status-capture-bonus-hierarchy]] — status conditions modify capture rate
