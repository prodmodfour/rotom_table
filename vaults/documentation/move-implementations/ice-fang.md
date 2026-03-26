Ice Fang is stored in [[movedata-reference-table]] with `damageClass: "Physical"`, `type: "Ice"`, `damageBase: 7`, `energyCost: 1`, `ac: 3`, `range: "Melee, 1 Target"`.

## Energy

Energy cost 1 is deducted from the user's Energy pool per [[move-energy-system]].

## Resolution

Ice Fang flows through the standard [[damage-flow-pipeline]] with DB 7 as the base. The [[nine-step-damage-formula]] applies STAB for Ice-type users and type effectiveness. An accuracy roll against AC 3 is required via the [[evasion-and-accuracy-system]].

## Secondary Effect

Ice Fang Freezes or Flinches on 18+ during Accuracy Check; flip a coin to determine whether the foe gets Frozen or Flinches. On 20 during Accuracy Check, the foe is Frozen and Flinches. The [[type-status-immunity-utility]] prevents Freeze application on Ice-types.

## Trait Interactions

Flagged for Sheer Force, Tough Claws, Strong Jaw in the [[moves-csv-source-file]].

## See also

- [[status-capture-bonus-hierarchy]] — status conditions modify capture rate
