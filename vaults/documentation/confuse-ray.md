Confuse Ray is stored in [[movedata-reference-table]] with `damageClass: "Status"`, `type: "Ghost"`, `damageBase: null`, `frequency: "Scene x2"`, `ac: 2`, `range: "6, 1 Target"`.

## Frequency

Scene x2 frequency is enforced by the [[move-frequency-system]]. `checkMoveFrequency` checks the `usedThisScene` counter against a limit of 2, with [[scene-frequency-eot-restriction|EOT pacing]] between uses. The counter resets via [[scene-activation-resets-move-counters]].

## Resolution

As a Status move, Confuse Ray skips the [[damage-flow-pipeline]]. An accuracy roll against AC 2 is required via the [[evasion-and-accuracy-system]].

## Effect

Confusion follows the [[confused-three-outcome-save]] resolution.

## Ability Interactions

No ability-interaction flags are set in the [[moves-csv-source-file]].

## See also

- [[status-capture-bonus-hierarchy]] — status conditions modify capture rate
