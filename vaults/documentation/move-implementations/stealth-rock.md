Stealth Rock is stored in [[movedata-reference-table]] with `damageClass: "Status"`, `type: "Rock"`, `damageBase: null`, `energyCost: 3`, `ac: null`, `range: "Field, Hazard"`.

## Energy

Energy cost 3 is deducted from the user's Energy pool per [[move-energy-system]].

## Resolution

As a Status move, Stealth Rock skips the [[damage-flow-pipeline]]. No accuracy roll is needed (AC is null).

## Effect

Set 4 square meters of Stealth Rock hazards within 6 meters. If a foe moves within 2 meters of a space occupied by Rocks, move at most one Rock to the offender, then destroy the Rock. When that happens, the Stealth Rock causes the foe to lose a Tick of Hit Points. Stealth Rock is considered to be dealing damage; apply Weakness and Resistance. Do not apply stats. A Pokemon who has been hit by a Stealth Rock Hazard cannot get hit by another in the same encounter until it is returned to a Poke Ball and then sent back out.

## Trait Interactions

No trait-interaction flags are set in the [[moves-csv-source-file]].
