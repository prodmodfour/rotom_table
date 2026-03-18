Poison Gas is stored in [[movedata-reference-table]] with `damageClass: "Status"`, `type: "Poison"`, `damageBase: null`, `frequency: "Scene"`, `ac: 6`, `range: "Burst 1 or Cone 2"`.

## Frequency

Scene frequency is enforced by the [[move-frequency-system]]. `checkMoveFrequency` checks the `usedThisScene` counter against a limit of 1. The counter resets via [[scene-activation-resets-move-counters]].

## Resolution

As a Status move, Poison Gas skips the [[damage-flow-pipeline]]. An accuracy roll against AC 6 is required via the [[evasion-and-accuracy-system]].

## Effect

The [[type-status-immunity-utility]] prevents Poison application on Poison-type and Steel-type targets. Once applied, [[status-tick-automation]] handles tick damage.

## Range and Targeting

The area of effect is visualized by the [[measurement-aoe-modes]] system.

## Ability Interactions

No ability-interaction flags are set in the [[moves-csv-source-file]].

## See also

- [[faint-and-revival-effects]] — Faint clears Persistent conditions
- [[status-capture-bonus-hierarchy]] — status conditions modify capture rate
