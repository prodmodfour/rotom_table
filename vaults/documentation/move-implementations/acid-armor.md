Acid Armor is stored in [[movedata-reference-table]] with `damageClass: "Status"`, `type: "Poison"`, `damageBase: null`, `energyCost: 3`, `ac: null`, `range: "Self, Set-Up"`.

## Energy

Energy cost 3 is deducted from the user's Energy pool per [[move-energy-system]].

## Resolution

As a Status move, Acid Armor skips the [[damage-flow-pipeline]]. No accuracy roll is needed (AC is null).

## Effect

Set-Up Effect: The user becomes Liquefied. While Liquefied, the user is Slowed and cannot take Standard Actions except to Resolve the effect of Acid Armor. The user's movement is never obstructed by rough or slow terrain, and they can shift through the smallest openings. While Liquefied, the user is completely immune to all Physical damage, and becomes invisible if fully submerged in any liquid.

Resolution Effect: The user gains +1 Defense Combat Stage (applied through the [[combat-stage-system]]) and stops being Liquefied.

## Trait Interactions

No trait-interaction flags are set in the [[moves-csv-source-file]].
