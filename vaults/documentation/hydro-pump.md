Hydro Pump is stored in [[movedata-reference-table]] with `damageClass: "Special"`, `type: "Water"`, `damageBase: 11`, `frequency: "Scene x2"`, `ac: 4`, `range: "6, 1 Target, Push"`.

## Frequency

Scene x2 frequency is enforced by the [[move-frequency-system]]. `checkMoveFrequency` checks the `usedThisScene` counter against a limit of 2, with [[scene-frequency-eot-restriction|EOT pacing]] between uses. The counter resets via [[scene-activation-resets-move-counters]].

## Resolution

Hydro Pump flows through the standard [[damage-flow-pipeline]] with DB 11 as the base. The [[nine-step-damage-formula]] applies STAB for Water-type users and type effectiveness. An accuracy roll against AC 4 is required via the [[evasion-and-accuracy-system]].

## Ability Interactions

No ability-interaction flags are set in the [[moves-csv-source-file]].

## See also

- [[weather-rules-utility]] — +5 damage in Rain, -5 in Sunny
