Outrage is stored in [[movedata-reference-table]] with `damageClass: "Physical"`, `type: "Dragon"`, `damageBase: 12`, `frequency: "Scene x2"`, `ac: 3`, `range: "Melee, All Adjacent Foes, Smite"`.

## Frequency

Scene x2 frequency is enforced by the [[move-frequency-system]]. `checkMoveFrequency` checks the `usedThisScene` counter against a limit of 2, with [[scene-frequency-eot-restriction|EOT pacing]] between uses. The counter resets via [[scene-activation-resets-move-counters]].

## Resolution

Outrage flows through the standard [[damage-flow-pipeline]] with DB 12 as the base. The [[nine-step-damage-formula]] applies STAB for Dragon-type users and type effectiveness. An accuracy roll against AC 3 is required via the [[evasion-and-accuracy-system]].

## Secondary Effect

Confusion follows the [[confused-three-outcome-save]] resolution. The Enraged condition is tracked via the [[condition-source-rules]].

## Ability Interactions

Flagged for Tough Claws in the [[moves-csv-source-file]].

## See also

- [[status-capture-bonus-hierarchy]] — status conditions modify capture rate
