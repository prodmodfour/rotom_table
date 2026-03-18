When a combatant's HP reaches 0, the faint process triggers specific mechanical effects.

## On Faint

1. **Clear persistent conditions** — all [[status-condition-categories]] persistent conditions (Burned, Frozen, Paralyzed, Poisoned, Badly Poisoned) are removed.
2. **Clear volatile conditions** — all volatile conditions are removed.
3. **Other conditions persist** — conditions in the Other category are NOT cleared.
4. **Add Fainted status** — the Fainted condition is applied.
5. **Record for XP** — the defeated enemy's species, level, and type are recorded in the encounter's defeated enemies list for [[xp-distribution-flow]].

Implemented in the `applyDamageToEntity` service function.

## Revival

When a fainted combatant is healed from 0 HP (via the heal endpoint or a Revive item from [[healing-item-system]]), the Fainted status is automatically removed. HP restoration is capped at the injury-reduced effective max (see [[healing-mechanics]]).

## See also

- [[hp-injury-system]] — the damage system that triggers faint at 0 HP
- [[status-condition-categories]] — which condition categories are cleared
- [[healing-mechanics]] — how healing interacts with the fainted state
- [[switching-system]] — recalling a fainted Pokemon
