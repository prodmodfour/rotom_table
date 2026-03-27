The HP and injury system tracks combatant health using HP markers at 50% intervals of max HP, plus a massive damage rule.

## HP Markers

Markers exist at **50%**, **0%**, **-50%**, and **-100%** of max HP. Each time damage causes HP to cross a marker, the combatant gains one injury.

HP is tracked unclamped during marker detection — a combatant at 60 HP taking 150 damage passes through all markers between 60 and -90 — but is clamped for storage afterward.

## Massive Damage Rule

If a single hit deals **50% or more of max HP** in damage, the combatant gains one additional injury regardless of markers crossed.

## Injuries

Injuries permanently reduce effective max HP per the [[effective-max-hp-formula]]. Each injury lowers the ceiling that [[healing-mechanics]] can restore HP to. Injuries can only be healed explicitly via [[natural-injury-healing]], ap drain injury healing, or [[pokemon-center-healing]].

## Faint

When HP reaches 0, the combatant faints. See [[faint-and-revival-effects]] for what happens at that threshold.

## See also

- [[nine-step-damage-formula]] — produces the raw damage value that feeds into this system
- [[temp-hp-mechanics]] — temp HP absorbs damage before real HP
- [[faint-and-revival-effects]] — triggered when HP reaches 0
- [[healing-mechanics]] — restoring HP respects injury-reduced max
