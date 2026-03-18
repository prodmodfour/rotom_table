Anchor Shot is stored in [[movedata-reference-table]] with `damageClass: "Physical"`, `type: "Steel"`, `damageBase: 8`, `frequency: "EOT"`, `ac: 2`, `range: "Melee, 1 Target"`.

## Frequency

EOT frequency is enforced by the [[move-frequency-system]]. `checkMoveFrequency` compares `lastTurnUsed` against the current turn index to prevent consecutive-turn use.

## Resolution

Anchor Shot flows through the standard [[damage-flow-pipeline]] with DB 8 as the base. The [[nine-step-damage-formula]] applies STAB for Steel-type users and type effectiveness. An accuracy roll against AC 2 is required via the [[evasion-and-accuracy-system]].

## Secondary Effect

The Trapped condition blocks recall, tracked via the [[condition-source-rules]].

## Ability Interactions

Flagged for Tough Claws in the [[moves-csv-source-file]].

## See also

- [[status-capture-bonus-hierarchy]] — status conditions modify capture rate
