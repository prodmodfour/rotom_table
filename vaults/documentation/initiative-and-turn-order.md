Initiative determines combatant ordering within an encounter. Calculated when a combatant enters combat.

## Calculation

Initiative = base Speed stat + initiative bonus. Equipment effects modify this:

- **Heavy Armor** — applies a default Speed combat stage of -1, reducing the effective Speed used for initiative.

Initiative is computed during combatant construction using [[equipment-bonus-aggregation]] to derive equipment effects.

## Sorting

When the encounter starts, combatants are sorted by initiative **high to low**. Ties are resolved by a random roll-off.

## League Battle Ordering

In [[battle-modes|League]] mode, initiative produces two separate orderings:

- **Trainer phase** — trainers sorted **low to high** (slowest declares first, fastest resolves first).
- **Pokemon phase** — Pokemon sorted **high to low** (standard initiative order).

## Mid-Encounter Additions

Combatants added after the encounter starts are inserted into the turn order at the appropriate position based on their initiative value.

## See also

- [[combat-stage-system]] — Speed CS affects initiative
- [[equipment-bonus-aggregation]] — Heavy Armor modifies Speed
- [[turn-lifecycle]] — the turn flow that uses this ordering
- [[battle-modes]] — League mode uses separate trainer/pokemon orderings
