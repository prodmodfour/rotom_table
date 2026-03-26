Toxic Spikes is stored in [[movedata-reference-table]] with `damageClass: "Status"`, `type: "Poison"`, `damageBase: null`, `energyCost: 1`, `ac: null`, `range: "6, Hazard"`.

## Energy

Energy cost 1 is deducted from the user's Energy pool per [[move-energy-system]].

## Resolution

As a Status move, Toxic Spikes skips the [[damage-flow-pipeline]]. No accuracy roll is needed (AC is null).

## Effect

Set 8 square meters of Toxic Spikes, all 8 meters must be adjacent with at least one other space of Toxic Spikes next to each other. Toxic Spikes cause Terrain to become Slow Terrain, and a grounded foe that runs into the hazard becomes Poisoned and Slowed until the end of their next turn. If there are 2 layers of Toxic Spikes on the same space, it Badly Poisons the foes instead. Poison-Type Pokemon may move over Toxic Spikes harmlessly, destroying the Hazards as they do so.

## Trait Interactions

No trait-interaction flags are set in the [[moves-csv-source-file]].

## See also

- [[faint-and-revival-effects]] — Faint clears Persistent conditions
- [[status-capture-bonus-hierarchy]] — status conditions modify capture rate
