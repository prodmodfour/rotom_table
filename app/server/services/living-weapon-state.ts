/**
 * Living Weapon State Reconstruction
 *
 * Reconstructs wieldRelationships from combatant flags on encounter load.
 * Since wieldRelationships is encounter-scoped and not stored in its own
 * DB column, it is derived from the persisted combatant flags
 * (wieldingWeaponId, wieldedByTrainerId) and the Pokemon entity data.
 */

import type { Combatant } from '~/types/encounter'
import type { WieldRelationship } from '~/types/combat'
import type { Pokemon } from '~/types/character'
import { LIVING_WEAPON_CONFIG } from '~/constants/livingWeapon'

/**
 * Reconstruct wieldRelationships from combatant flags.
 * Called when loading encounter state from the database.
 *
 * Scans combatants for wieldingWeaponId flags, then builds the
 * relationship array with species and fainted state from the entity.
 */
export function reconstructWieldRelationships(combatants: Combatant[]): WieldRelationship[] {
  const relationships: WieldRelationship[] = []

  for (const c of combatants) {
    if (c.type !== 'human' || !c.wieldingWeaponId) continue

    const weapon = combatants.find(w => w.id === c.wieldingWeaponId)
    if (!weapon || weapon.type !== 'pokemon') continue

    const pokemon = weapon.entity as Pokemon
    const species = pokemon.species

    // Determine weapon species (use known config or default)
    const knownSpecies = LIVING_WEAPON_CONFIG[species]
      ? species as WieldRelationship['weaponSpecies']
      : 'Honedge' as WieldRelationship['weaponSpecies']

    const isFainted = pokemon.currentHp <= 0 ||
      pokemon.statusConditions?.includes('Fainted') === true

    relationships.push({
      wielderId: c.id,
      weaponId: weapon.id,
      weaponSpecies: knownSpecies,
      isFainted,
    })
  }

  return relationships
}
