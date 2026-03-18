Flare Blitz is stored in [[movedata-reference-table]] with `damageClass: "Physical"`, `type: "Fire"`, `damageBase: 12`, `frequency: "Scene x2"`, `ac: 2`, `range: "Melee, 1 Target, Dash, Recoil 1/3"`.

## Frequency

Scene x2 frequency is enforced by the [[move-frequency-system]]. `checkMoveFrequency` checks the `usedThisScene` counter against a limit of 2, with [[scene-frequency-eot-restriction|EOT pacing]] between uses. The counter resets via [[scene-activation-resets-move-counters]].

## Resolution

Flare Blitz flows through the standard [[damage-flow-pipeline]] with DB 12 as the base. The [[nine-step-damage-formula]] applies STAB for Fire-type users and type effectiveness. An accuracy roll against AC 2 is required via the [[evasion-and-accuracy-system]].

## Secondary Effect

The [[type-status-immunity-utility]] prevents Burn application on Fire-types. Once applied, [[status-tick-automation]] handles tick damage and [[status-cs-auto-apply-with-tracking]] applies the -2 Defense CS.

## Ability Interactions

Flagged for Sheer Force, Tough Claws, Reckless in the [[moves-csv-source-file]].

## See also

- [[weather-rules-utility]] — +5 damage in Sunny, -5 in Rain
- [[faint-and-revival-effects]] — Faint clears Persistent conditions
- [[status-capture-bonus-hierarchy]] — status conditions modify capture rate
