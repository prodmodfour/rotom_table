Dark Void [SM] is stored in [[movedata-reference-table]] with `damageClass: "Status"`, `type: "Dark"`, `damageBase: null`, `frequency: "EOT"`, `ac: 10`, `range: "Melee, 1 Target"`.

## Frequency

EOT frequency is enforced by the [[move-frequency-system]]. `checkMoveFrequency` compares `lastTurnUsed` against the current turn index to prevent consecutive-turn use.

## Resolution

As a Status move, Dark Void [SM] skips the [[damage-flow-pipeline]]. An accuracy roll against AC 10 is required via the [[evasion-and-accuracy-system]].

## Effect

Sleep is tracked as a volatile condition that [[sleep-volatile-but-persists|persists through recall and encounter end]].

## Ability Interactions

Flagged for Tough Claws in the [[moves-csv-source-file]].

## See also

- [[status-capture-bonus-hierarchy]] — status conditions modify capture rate
