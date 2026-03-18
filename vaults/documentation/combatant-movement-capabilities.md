# Combatant Movement Capabilities

Shared utility (`utils/combatantCapabilities.ts`) for querying Pokemon movement capabilities:

- `combatantCanFly(combatant)` — Returns true if Sky speed > 0.
- `getSkySpeed(combatant)` — Returns Sky speed value.
- `combatantCanSwim(combatant)` — Returns true if Swim speed > 0.
- `combatantCanBurrow(combatant)` — Returns true if Burrow speed > 0.

Human combatants (trainers) default to 0 for all movement capabilities.

Used by [[elevation-system]] for flying defaults and by [[pathfinding-algorithm]] to bypass elevation costs for flying Pokemon.

## See also

- [[size-category-footprint-map]] — another combatant-derived utility for grid placement
