Pyro Ball is stored in [[movedata-reference-table]] with `damageClass: "Physical"`, `type: "Fire"`, `damageBase: 12`, `frequency: "Scene x2"`, `ac: 4`, `range: "6, 1 Target, Smite"`.

## Frequency

Scene x2 frequency is enforced by the [[move-frequency-system]]. `checkMoveFrequency` checks the `usedThisScene` counter against a limit of 2, with [[scene-frequency-eot-restriction|EOT pacing]] between uses. The counter resets via [[scene-activation-resets-move-counters]].

## Resolution

Pyro Ball flows through the standard [[damage-flow-pipeline]] with DB 12 as the base. The [[nine-step-damage-formula]] applies STAB for Fire-type users and type effectiveness. An accuracy roll against AC 4 is required via the [[evasion-and-accuracy-system]].

## Ability Interactions

Flagged for Sheer Force in the [[moves-csv-source-file]].

## See also

- [[weather-rules-utility]] — +5 damage in Sunny, -5 in Rain
