Rollout is stored in [[movedata-reference-table]] with `damageClass: "Physical"`, `type: "Rock"`, `damageBase: 3`, `energyCost: 1`, `ac: 4`, `range: "Melee, 1 Target, Pass"`.

## Energy

Energy cost 1 is deducted from the user's Energy pool per [[move-energy-system]].

## Resolution

Rollout flows through the standard [[damage-flow-pipeline]] with DB 3 as the base. The [[nine-step-damage-formula]] applies STAB for Rock-type users and type effectiveness. An accuracy roll against AC 4 is required via the [[evasion-and-accuracy-system]].

## Effect

The user continues to use Rollout on each of its turns until they miss any target with Rollout, or are not able to hit any target with Rollout during their turn. Each successive use of Rollout increases Rollout's Damage Base by +4 to a maximum of DB 15.

## Trait Interactions

Flagged for Tough Claws, Technician in the [[moves-csv-source-file]].
