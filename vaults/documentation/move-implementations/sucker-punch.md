Sucker Punch is stored in [[movedata-reference-table]] with `damageClass: "Physical"`, `type: "Dark"`, `damageBase: 8`, `energyCost: 2`, `ac: 2`, `range: "Melee, 1 Target, Interrupt, Trigger"`.

## Energy

Energy cost 2 is deducted from the user's Energy pool per [[move-energy-system]].

## Resolution

Sucker Punch flows through the standard [[damage-flow-pipeline]] with DB 8 as the base. The [[nine-step-damage-formula]] applies STAB for Dark-type users and type effectiveness. An accuracy roll against AC 2 is required via the [[evasion-and-accuracy-system]].

## Timing

Sucker Punch uses the [[hold-priority-interrupt-system|Interrupt system]], resolving outside normal turn order in response to a trigger.

## Effect

If an adjacent foe targets the user with a Damaging Attack, Sucker Punch may be used as an Interrupt Move against the triggering foe.

## Trait Interactions

Flagged for Tough Claws in the [[moves-csv-source-file]].
