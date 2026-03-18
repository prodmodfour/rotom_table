Mystical Power is stored in [[movedata-reference-table]] with `damageClass: "Special"`, `type: "Psychic"`, `damageBase: 7`, `frequency: "Scene x2"`, `ac: 4`, `range: "6, 2 Targets, Spirit Surge"`.

## Frequency

Scene x2 frequency is enforced by the [[move-frequency-system]]. `checkMoveFrequency` checks the `usedThisScene` counter against a limit of 2, with [[scene-frequency-eot-restriction|EOT pacing]] between uses. The counter resets via [[scene-activation-resets-move-counters]].

## Resolution

Mystical Power flows through the standard [[damage-flow-pipeline]] with DB 7 as the base. The [[nine-step-damage-formula]] applies STAB for Psychic-type users and type effectiveness. An accuracy roll against AC 4 is required via the [[evasion-and-accuracy-system]].

## Effect

Combat stage changes are applied through the [[combat-stage-system]].

## Ability Interactions

Flagged for Sheer Force in the [[moves-csv-source-file]].
