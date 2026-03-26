Initiative determines combatant ordering within an encounter. Calculated when a combatant is added or the encounter starts.

## Calculation

Initiative = base Speed stat + initiative bonus. Two equipment effects modify this:

- **Heavy Armor** — applies a default Speed combat stage of -1, reducing the effective Speed used for initiative.

The `buildCombatantFromEntity` service function computes initiative during combatant construction using [[equipment-bonus-aggregation]] to derive equipment effects.

## Sorting

When the encounter starts (`POST /api/encounters/:id/start`), combatants are sorted by initiative **high to low**. Ties are resolved by a random roll-off.

## League Battle Ordering

In [[battle-modes]] League mode, initiative produces two separate orderings:

- **Trainer phase** — trainers sorted **low to high** (slowest declares first, fastest resolves first).
- **Pokemon phase** — Pokemon sorted **high to low** (standard initiative order).

Phase transitions are handled by the next-turn endpoint.

## Mid-Encounter Additions

Combatants added after the encounter starts are inserted into the turn order at the appropriate position based on their initiative value.

## See also

- [[combat-stage-system]] — Speed CS affects initiative
- [[equipment-bonus-aggregation]] — Heavy Armor modifies Speed
- [[turn-lifecycle]] — the turn flow that uses this ordering
- [[battle-modes]] — League mode uses separate trainer/pokemon orderings
