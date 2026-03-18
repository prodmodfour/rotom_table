Swagger [SM] is stored in [[movedata-reference-table]] with `damageClass: "Status"`, `type: "Normal"`, `damageBase: null`, `frequency: "EOT"`, `ac: 5`, `range: "6, 1 Target, Social"`.

## Frequency

EOT frequency is enforced by the [[move-frequency-system]]. `checkMoveFrequency` compares `lastTurnUsed` against the current turn index to prevent consecutive-turn use.

## Resolution

As a Status move, Swagger [SM] skips the [[damage-flow-pipeline]]. An accuracy roll against AC 5 is required via the [[evasion-and-accuracy-system]].

## Effect

Confusion follows the [[confused-three-outcome-save]] resolution. Combat stage changes are applied through the [[combat-stage-system]].

## Ability Interactions

No ability-interaction flags are set in the [[moves-csv-source-file]].

## See also

- [[status-capture-bonus-hierarchy]] — status conditions modify capture rate
