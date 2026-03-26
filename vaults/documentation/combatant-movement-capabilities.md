# Combatant Movement Traits

Shared utility for querying Pokemon [[movement-trait-types|movement traits]]:

- `combatantCanFly(combatant)` — Returns true if Flier speed > 0.
- `getFlySpeed(combatant)` — Returns Flier speed value.
- `combatantCanSwim(combatant)` — Returns true if Swimmer speed > 0.
- `combatantCanBurrow(combatant)` — Returns true if Burrower speed > 0.

Human combatants (trainers) default to 0 for all movement traits.

Used by [[elevation-system]] for flying defaults and by [[pathfinding-algorithm]] to bypass elevation costs for flying Pokemon.

## See also

- [[size-category-footprint-map]] — another combatant-derived utility for grid placement
