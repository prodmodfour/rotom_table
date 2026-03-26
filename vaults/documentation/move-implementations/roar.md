Roar is stored in [[movedata-reference-table]] with `damageClass: "Status"`, `type: "Normal"`, `damageBase: null`, `energyCost: 3`, `ac: 2`, `range: "Burst 1, Sonic, Social"`.

## Energy

Energy cost 3 is deducted from the user's Energy pool per [[move-energy-system]].

## Resolution

As a Status move, Roar skips the [[damage-flow-pipeline]]. An accuracy roll against AC 2 is required via the [[evasion-and-accuracy-system]].

## Effect

When declaring Roar, the user does nothing and may not Shift. At the end of the round, the user Shifts and uses Roar. Targets hit by Roar immediately Shift away from the user using their highest usable [[movement-traits|movement trait]], and towards their Trainer if possible. If the target is an owned Pokemon and ends this shift within 6 meters of their Poke Ball, they are immediately recalled to their Poke Ball. If that Trainer sends out a replacement, they do not lose their Pokemon turn.

## Range and Targeting

The area of effect is visualized by the [[measurement-aoe-modes]] system.

## Trait Interactions

Flagged for Punk Rock in the [[moves-csv-source-file]].
