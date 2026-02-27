import type { Combatant, Pokemon, TerrainType } from '~/types'
import { NATUREWALK_TERRAIN_MAP } from '~/constants/naturewalk'
import type { NaturewalkTerrain } from '~/constants/naturewalk'

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

// =====================================
// Naturewalk Capability (PTU p.322)
// =====================================

/**
 * Extract Naturewalk terrain names from a combatant's capabilities.
 *
 * PTU p.322: "Naturewalk is always listed with Terrain types in parentheses,
 * such as Naturewalk (Forest and Grassland)."
 *
 * Data sources (both are checked):
 * - capabilities.naturewalk: string[] like ['Forest', 'Grassland'] (direct field)
 * - capabilities.otherCapabilities: string[] containing "Naturewalk (Forest, Grassland)"
 *   (parsed from species data by the seeder)
 *
 * Returns an empty array for human characters or Pokemon without Naturewalk.
 */
export function getCombatantNaturewalks(combatant: Combatant): ReadonlyArray<string> {
  if (combatant.type !== 'pokemon') return []

  const pokemon = combatant.entity as Pokemon
  const caps = pokemon.capabilities
  if (!caps) return []

  // Source 1: direct naturewalk field (e.g., from manual seeds)
  const directNaturewalks = caps.naturewalk ?? []

  // Source 2: parse from otherCapabilities strings
  const parsedNaturewalks = parseNaturewalksFromOtherCaps(caps.otherCapabilities ?? [])

  // Merge and deduplicate
  if (parsedNaturewalks.length === 0) return directNaturewalks
  if (directNaturewalks.length === 0) return parsedNaturewalks

  const combined = new Set([...directNaturewalks, ...parsedNaturewalks])
  return Array.from(combined)
}

/**
 * Parse Naturewalk terrain names from otherCapabilities strings.
 *
 * Handles formats like:
 * - "Naturewalk (Forest, Grassland)"
 * - "Naturewalk (Forest and Grassland)"
 * - "Naturewalk (Ocean)"
 *
 * @param otherCaps - Array of capability strings from otherCapabilities
 * @returns Array of terrain names extracted from Naturewalk entries
 */
function parseNaturewalksFromOtherCaps(otherCaps: string[]): string[] {
  const terrains: string[] = []

  for (const cap of otherCaps) {
    const match = cap.match(/^Naturewalk\s*\(([^)]+)\)$/i)
    if (!match) continue

    // Split by comma or "and", trim whitespace
    const parts = match[1]
      .split(/[,]|\band\b/i)
      .map(s => s.trim())
      .filter(s => s.length > 0)

    terrains.push(...parts)
  }

  return terrains
}

/**
 * Check whether a combatant's Naturewalk bypasses terrain modifiers
 * (rough/slow flags) on a cell with the given base terrain type.
 *
 * PTU p.322: "Pokemon with Naturewalk treat all listed terrains as Basic
 * Terrain." Basic Terrain = no movement cost modifier, no accuracy penalty.
 *
 * Per decree-003: enemy-occupied rough terrain is a game mechanic, NOT
 * painted terrain. Naturewalk does NOT bypass enemy-occupied rough.
 * This function only checks terrain-based flags.
 *
 * @param combatant - The combatant to check
 * @param baseTerrainType - The base terrain type of the cell
 * @returns true if the combatant's Naturewalk applies to this terrain type
 */
export function naturewalkBypassesTerrain(
  combatant: Combatant,
  baseTerrainType: TerrainType
): boolean {
  const naturewalks = getCombatantNaturewalks(combatant)
  if (naturewalks.length === 0) return false

  // Check if any of the combatant's Naturewalk terrains map to this base type
  for (const nw of naturewalks) {
    const mappedTypes = NATUREWALK_TERRAIN_MAP[nw as NaturewalkTerrain]
    if (mappedTypes && mappedTypes.includes(baseTerrainType)) {
      return true
    }
  }

  return false
}
