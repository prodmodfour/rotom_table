Psyshock is stored in [[movedata-reference-table]] with `damageClass: "Special"`, `type: "Psychic"`, `damageBase: 8`, `energyCost: 2`, `ac: 2`, `range: "4, 1 Target"`.

## Energy

Energy cost 2 is deducted from the user's Energy pool per [[move-energy-system]].

## Resolution

Psyshock flows through the standard [[damage-flow-pipeline]] with DB 8 as the base. The [[nine-step-damage-formula]] applies STAB for Psychic-type users and type effectiveness. An accuracy roll against AC 2 is required via the [[evasion-and-accuracy-system]].

## Effect

When calculating damage, the target subtracts their Defense from Psyshock's damage instead of their Special Defense. Psyshock is still otherwise Special (Special Evasion is used to avoid it, Mirror Coat can reflect it, etc.).

## Trait Interactions

No trait-interaction flags are set in the [[moves-csv-source-file]].
