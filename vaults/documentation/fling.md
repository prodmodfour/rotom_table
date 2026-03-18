Fling is stored in [[movedata-reference-table]] with `damageClass: "Physical"`, `type: "Dark"`, `damageBase: "See Effect"`, `frequency: "Scene x2"`, `ac: 2`, `range: "6, 1 Target, Fling"`.

## Frequency

Scene x2 frequency is enforced by the [[move-frequency-system]]. `checkMoveFrequency` checks the `usedThisScene` counter against a limit of 2, with [[scene-frequency-eot-restriction|EOT pacing]] between uses. The counter resets via [[scene-activation-resets-move-counters]].

## Resolution

Fling flows through the standard [[damage-flow-pipeline]] with a variable Damage Base as the base. The [[nine-step-damage-formula]] applies STAB for Dark-type users and type effectiveness. An accuracy roll against AC 2 is required via the [[evasion-and-accuracy-system]].

## Ability Interactions

No ability-interaction flags are set in the [[moves-csv-source-file]].
