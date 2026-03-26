Sky Attack is stored in [[movedata-reference-table]] with `damageClass: "Physical"`, `type: "Flying"`, `damageBase: 14`, `energyCost: 5`, `ac: 4`, `range: "Melee, Pass, Set-Up, Full Action"`.

## Energy

Energy cost 5 is deducted from the user's Energy pool per [[move-energy-system]].

## Resolution

Sky Attack flows through the standard [[damage-flow-pipeline]] with DB 14 as the base. The [[nine-step-damage-formula]] applies STAB for Flying-type users and type effectiveness. An accuracy roll against AC 4 is required via the [[evasion-and-accuracy-system]].

## Effect

Set-Up Effect: The user is moved up 25 meters into the air. Resolution Effect: The user may shift until they are next to a legal target in the encounter. They may then shift again, and pass through legal targets to attack with Sky Attack. Sky Attack Flinches a target on 17-20 during Accuracy Check.

## Trait Interactions

Flagged for Sheer Force, Tough Claws in the [[moves-csv-source-file]].

## See also

- [[status-capture-bonus-hierarchy]] — status conditions modify capture rate
