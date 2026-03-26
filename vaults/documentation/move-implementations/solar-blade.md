Solar Blade is stored in [[movedata-reference-table]] with `damageClass: "Physical"`, `type: "Grass"`, `damageBase: 12`, `energyCost: 4`, `ac: 2`, `range: "Melee, 1 Target, Set-Up"`.

## Energy

Energy cost 4 is deducted from the user's Energy pool per [[move-energy-system]].

## Resolution

Solar Blade flows through the standard [[damage-flow-pipeline]] with DB 12 as the base. The [[nine-step-damage-formula]] applies STAB for Grass-type users and type effectiveness. An accuracy roll against AC 2 is required via the [[evasion-and-accuracy-system]].

## Effect

Set-Up Effect: If the weather is not Sunny, the user's turn ends. If the weather is Sunny, immediately proceed to the Resolution Effect instead and this Move loses the Set-Up keyword. Resolution Effect: The user attacks with Solar Blade. If the weather is Rainy, Sandstorming, or Hailing, Solar Blade's Damage Base is lowered to 6.

## Trait Interactions

Flagged for Tough Claws in the [[moves-csv-source-file]].
