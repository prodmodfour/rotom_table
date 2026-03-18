Nightmare is stored in [[movedata-reference-table]] with `damageClass: "Status"`, `type: "Ghost"`, `damageBase: null`, `frequency: "Scene x2"`, `ac: 2`, `range: "Melee, 1 Target"`.

## Frequency

Scene x2 frequency is enforced by the [[move-frequency-system]]. `checkMoveFrequency` checks the `usedThisScene` counter against a limit of 2, with [[scene-frequency-eot-restriction|EOT pacing]] between uses. The counter resets via [[scene-activation-resets-move-counters]].

## Resolution

As a Status move, Nightmare skips the [[damage-flow-pipeline]]. An accuracy roll against AC 2 is required via the [[evasion-and-accuracy-system]].

## Effect

Sleep is tracked as a volatile condition that [[sleep-volatile-but-persists|persists through recall and encounter end]].

## Ability Interactions

Flagged for Tough Claws in the [[moves-csv-source-file]].

## See also

- [[status-capture-bonus-hierarchy]] — status conditions modify capture rate
