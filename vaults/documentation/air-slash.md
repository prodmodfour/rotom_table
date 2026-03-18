Air Slash is stored in [[movedata-reference-table]] with `damageClass: "Special"`, `type: "Flying"`, `damageBase: 8`, `frequency: "EOT"`, `ac: 3`, `range: "6, 1 Target"`.

## Frequency

EOT frequency is enforced by the [[move-frequency-system]]. `checkMoveFrequency` compares `lastTurnUsed` against the current turn index to prevent consecutive-turn use.

## Resolution

Air Slash flows through the standard [[damage-flow-pipeline]] with DB 8 as the base. The [[nine-step-damage-formula]] applies STAB for Flying-type users and type effectiveness. An accuracy roll against AC 3 is required via the [[evasion-and-accuracy-system]].

## Secondary Effect

Flinch prevents the target from taking actions for the remainder of the turn, tracked as a volatile condition.

## Ability Interactions

Flagged for Sheer Force in the [[moves-csv-source-file]].

## See also

- [[status-capture-bonus-hierarchy]] — status conditions modify capture rate
