import type { Combatant, Pokemon } from '~/types'

/**
 * Shared utility functions for querying combatant movement capabilities.
 * Used by useGridMovement, useElevation, and other composables that need
 * to check whether a combatant can fly, swim, or burrow.
 */

/**
 * Check whether a combatant has Swim capability (swim speed > 0).
 * Pokemon have capabilities.swim; humans default to 0 (no swim).
 */
export function combatantCanSwim(combatant: Combatant): boolean {
  if (combatant.type === 'pokemon') {
    const pokemon = combatant.entity as Pokemon
    return (pokemon.capabilities?.swim ?? 0) > 0
  }
  return false
}

/**
 * Check whether a combatant has Burrow capability (burrow speed > 0).
 * Pokemon have capabilities.burrow; humans default to 0 (no burrow).
 */
export function combatantCanBurrow(combatant: Combatant): boolean {
  if (combatant.type === 'pokemon') {
    const pokemon = combatant.entity as Pokemon
    return (pokemon.capabilities?.burrow ?? 0) > 0
  }
  return false
}

/**
 * Check whether a combatant has Sky capability (sky speed > 0).
 * Flying Pokemon ignore elevation cost within their Sky speed range.
 */
export function combatantCanFly(combatant: Combatant): boolean {
  if (combatant.type === 'pokemon') {
    const pokemon = combatant.entity as Pokemon
    return (pokemon.capabilities?.sky ?? 0) > 0
  }
  return false
}

/**
 * Get a combatant's Sky speed. Returns 0 for non-flying combatants.
 */
export function getSkySpeed(combatant: Combatant): number {
  if (combatant.type === 'pokemon') {
    const pokemon = combatant.entity as Pokemon
    return pokemon.capabilities?.sky ?? 0
  }
  return 0
}

/**
 * Get a combatant's Overland speed.
 * Pokemon use capabilities.overland; humans default to DEFAULT_MOVEMENT_SPEED (5).
 */
export function getOverlandSpeed(combatant: Combatant): number {
  if (combatant.type === 'pokemon') {
    const pokemon = combatant.entity as Pokemon
    return pokemon.capabilities?.overland ?? 5
  }
  return 5
}

/**
 * Get a combatant's Swim speed. Returns 0 for non-swimming combatants.
 */
export function getSwimSpeed(combatant: Combatant): number {
  if (combatant.type === 'pokemon') {
    const pokemon = combatant.entity as Pokemon
    return pokemon.capabilities?.swim ?? 0
  }
  return 0
}

/**
 * Get a combatant's Burrow speed. Returns 0 for non-burrowing combatants.
 */
export function getBurrowSpeed(combatant: Combatant): number {
  if (combatant.type === 'pokemon') {
    const pokemon = combatant.entity as Pokemon
    return pokemon.capabilities?.burrow ?? 0
  }
  return 0
}

/**
 * Get the movement speed applicable for a given terrain type.
 * Returns the specific capability speed for the terrain, or 0 if the combatant
 * lacks the required capability for that terrain.
 *
 * - Water terrain → Swim speed (0 if can't swim — movement blocked separately)
 * - Earth terrain → Burrow speed (0 if can't burrow — movement blocked separately)
 * - All other terrain → Overland speed
 *
 * Per PTU p.231: different terrain types require different Movement Capabilities.
 */
export function getSpeedForTerrain(combatant: Combatant, terrainType: string): number {
  if (terrainType === 'water') {
    return getSwimSpeed(combatant)
  }
  if (terrainType === 'earth') {
    return getBurrowSpeed(combatant)
  }
  return getOverlandSpeed(combatant)
}

/**
 * Calculate the averaged movement speed when a path crosses multiple terrain types.
 *
 * Per PTU p.231: "When using multiple different Movement Capabilities in one turn,
 * such as using Overland on a beach and then Swim in the water, average the
 * Capabilities and use that value."
 *
 * Per decree-011: Average movement speeds when path crosses terrain boundaries.
 *
 * @param combatant - The combatant moving
 * @param terrainTypes - Set of distinct terrain types along the path
 * @returns The averaged speed (floored), or the single applicable speed if no mixing
 */
export function calculateAveragedSpeed(combatant: Combatant, terrainTypes: Set<string>): number {
  if (terrainTypes.size === 0) {
    return getOverlandSpeed(combatant)
  }

  // Collect the distinct movement capabilities used.
  // We only average distinct capabilities — if multiple terrain types
  // use the same capability (e.g., normal + hazard both use Overland),
  // they don't count twice in the average.
  // capabilitySpeeds is an array (not a Set) to preserve duplicate speed
  // values from distinct capabilities (e.g., Overland 6 + Swim 6 + Burrow 3
  // must average as (6+6+3)/3=5, not (6+3)/2=4).
  const capabilitySpeeds: number[] = []
  const seenCapabilities = new Set<string>()

  for (const terrain of terrainTypes) {
    // Determine which capability this terrain requires
    let capabilityKey: string
    let speed: number

    if (terrain === 'water') {
      capabilityKey = 'swim'
      speed = getSwimSpeed(combatant)
    } else if (terrain === 'earth') {
      capabilityKey = 'burrow'
      speed = getBurrowSpeed(combatant)
    } else {
      capabilityKey = 'overland'
      speed = getOverlandSpeed(combatant)
    }

    // Only count each distinct capability once in the average
    if (!seenCapabilities.has(capabilityKey)) {
      seenCapabilities.add(capabilityKey)
      capabilitySpeeds.push(speed)
    }
  }

  // Single capability — no averaging needed
  if (capabilitySpeeds.length <= 1) {
    return capabilitySpeeds.length > 0 ? capabilitySpeeds[0] : getOverlandSpeed(combatant)
  }

  // Average and floor (PTU convention: round down)
  const sum = capabilitySpeeds.reduce((a, b) => a + b, 0)
  return Math.floor(sum / capabilitySpeeds.length)
}
