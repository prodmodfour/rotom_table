Esper Wing is stored in [[movedata-reference-table]] with `damageClass: "Special"`, `type: "Psychic"`, `damageBase: 8`, `frequency: "Scene x2"`, `ac: 4`, `range: "Melee, Pass, Priority"`.

## Frequency

Scene x2 frequency is enforced by the [[move-frequency-system]]. `checkMoveFrequency` checks the `usedThisScene` counter against a limit of 2, with [[scene-frequency-eot-restriction|EOT pacing]] between uses. The counter resets via [[scene-activation-resets-move-counters]].

## Resolution

Esper Wing flows through the standard [[damage-flow-pipeline]] with DB 8 as the base. The [[nine-step-damage-formula]] applies STAB for Psychic-type users and type effectiveness. An accuracy roll against AC 4 is required via the [[evasion-and-accuracy-system]].

## Timing

Esper Wing has the Priority keyword, placing it in the [[hold-priority-interrupt-system|Priority Window]] before normal actions.

## Ability Interactions

No ability-interaction flags are set in the [[moves-csv-source-file]].
