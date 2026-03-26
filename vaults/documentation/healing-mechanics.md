The heal endpoint (`POST /api/encounters/:id/heal`) restores HP, temp HP, and injuries on a combatant. Implemented in the `applyHealingToEntity` service function.

## HP Restoration

HP is restored up to the **injury-reduced effective max**. Each injury from the [[hp-injury-system]] permanently lowers the ceiling that healing can reach. Healing cannot exceed this reduced maximum.

## Injury Healing

Injuries are healed first when the heal request includes injury restoration. This raises the effective max HP ceiling before HP itself is restored.

## Temp HP

Temp HP follows the [[temp-hp-mechanics]] no-stacking rule — the system keeps the higher of the existing and new temp HP values.

## Fainted Revival

If a combatant is healed from 0 HP, the Fainted status is automatically removed (see [[faint-and-revival-effects]]).

## See also

- [[hp-injury-system]] — injuries that reduce effective max HP
- [[temp-hp-mechanics]] — temp HP no-stacking rule
- [[faint-and-revival-effects]] — auto-removal of Fainted on heal
- [[healing-item-system]] — healing items that invoke this system
- [[rest-healing-system]] — out-of-combat rest and recovery mechanics
- [[effective-max-hp-formula]] — the injury-based ceiling calculation
