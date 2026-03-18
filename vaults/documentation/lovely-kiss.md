Lovely Kiss is stored in [[movedata-reference-table]] with `damageClass: "Status"`, `type: "Normal"`, `damageBase: null`, `frequency: "Scene x2"`, `ac: 6`, `range: "6, 1 Target, Social"`.

## Frequency

Scene x2 frequency is enforced by the [[move-frequency-system]]. `checkMoveFrequency` checks the `usedThisScene` counter against a limit of 2, with [[scene-frequency-eot-restriction|EOT pacing]] between uses. The counter resets via [[scene-activation-resets-move-counters]].

## Resolution

As a Status move, Lovely Kiss skips the [[damage-flow-pipeline]]. An accuracy roll against AC 6 is required via the [[evasion-and-accuracy-system]].

## Effect

Sleep is tracked as a volatile condition that [[sleep-volatile-but-persists|persists through recall and encounter end]].

## Ability Interactions

No ability-interaction flags are set in the [[moves-csv-source-file]].

## See also

- [[status-capture-bonus-hierarchy]] — status conditions modify capture rate
