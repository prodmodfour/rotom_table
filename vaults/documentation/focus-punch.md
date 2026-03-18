Focus Punch is stored in [[movedata-reference-table]] with `damageClass: "Physical"`, `type: "Fighting"`, `damageBase: 15`, `frequency: "Scene x2"`, `ac: 2`, `range: "Melee, 1 Target, Priority (Limited), Aura"`.

## Frequency

Scene x2 frequency is enforced by the [[move-frequency-system]]. `checkMoveFrequency` checks the `usedThisScene` counter against a limit of 2, with [[scene-frequency-eot-restriction|EOT pacing]] between uses. The counter resets via [[scene-activation-resets-move-counters]].

## Resolution

Focus Punch flows through the standard [[damage-flow-pipeline]] with DB 15 as the base. The [[nine-step-damage-formula]] applies STAB for Fighting-type users and type effectiveness. An accuracy roll against AC 2 is required via the [[evasion-and-accuracy-system]].

## Timing

Focus Punch has the Priority keyword, placing it in the [[hold-priority-interrupt-system|Priority Window]] before normal actions.

## Ability Interactions

Flagged for Tough Claws, Iron Fist in the [[moves-csv-source-file]].
