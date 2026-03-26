Phantom Force is stored in [[movedata-reference-table]] with `damageClass: "Physical"`, `type: "Ghost"`, `damageBase: 9`, `energyCost: 3`, `ac: 2`, `range: "Melee, 1 Target, Set-Up"`.

## Energy

Energy cost 3 is deducted from the user's Energy pool per [[move-energy-system]].

## Resolution

Phantom Force flows through the standard [[damage-flow-pipeline]] with DB 9 as the base. The [[nine-step-damage-formula]] applies STAB for Ghost-type users and type effectiveness. An accuracy roll against AC 2 is required via the [[evasion-and-accuracy-system]].

## Effect

Set-Up Effect: The user is removed from the field, and their turn ends. Resolution Effect: The user appears adjacent to any legal target on the field, ignoring [[movement-trait-types|movement traits]], and then uses Phantom Force's attack. Phantom Force cannot be avoided by Moves with the Shield Keyword, the Dodge trait, or similar effects, and Intercepts may not be attempted in response.

## Trait Interactions

Flagged for Tough Claws in the [[moves-csv-source-file]].
