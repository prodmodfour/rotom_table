Taunt is stored in [[movedata-reference-table]] with `damageClass: "Status"`, `type: "Dark"`, `damageBase: null`, `frequency: "EOT"`, `ac: 3`, `range: "6, 1 Target, Social"`.

## Frequency

EOT frequency is enforced by the [[move-frequency-system]]. `checkMoveFrequency` compares `lastTurnUsed` against the current turn index to prevent consecutive-turn use.

## Resolution

As a Status move, Taunt skips the [[damage-flow-pipeline]]. An accuracy roll against AC 3 is required via the [[evasion-and-accuracy-system]].

## Effect

The Enraged condition is tracked via the [[condition-source-rules]].

## Ability Interactions

No ability-interaction flags are set in the [[moves-csv-source-file]].

## See also

- [[status-capture-bonus-hierarchy]] — status conditions modify capture rate
