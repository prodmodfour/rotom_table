Dragon Rage is stored in [[movedata-reference-table]] with `damageClass: "Special"`, `type: "Dragon"`, `damageBase: null`, `energyCost: 5`, `ac: 2`, `range: "4, 1 Target"`.

## Energy

Energy cost 5 is deducted from the user's Energy pool per [[move-energy-system]].

## Resolution

Dragon Rage does not flow through the standard [[damage-flow-pipeline]] with a normal DB. If it hits, Dragon Rage causes the target to lose 15 Hit Points. Dragon Rage is Special and interacts with other moves and effects as such (Special Evasion may be applied to avoid it, Mirror Coat can reflect it, etc.). An accuracy roll against AC 2 is required via the [[evasion-and-accuracy-system]].

## Trait Interactions

No trait-interaction flags are set in the [[moves-csv-source-file]].
