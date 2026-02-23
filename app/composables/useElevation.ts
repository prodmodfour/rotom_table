import type { GridPosition, Combatant, Pokemon } from '~/types'
import { useTerrainStore } from '~/stores/terrain'

/**
 * Elevation state for a single token.
 */
export interface TokenElevation {
  combatantId: string
  elevation: number
}

/**
 * Options for the elevation composable.
 */
interface UseElevationOptions {
  maxElevation: Ref<number>
  getCombatant?: (combatantId: string) => Combatant | undefined
}

/**
 * Check if a combatant has Sky capability (sky speed > 0).
 * Only Pokemon have capabilities.sky; humans default to 0.
 */
function combatantCanFly(combatant: Combatant): boolean {
  if (combatant.type === 'pokemon') {
    const pokemon = combatant.entity as Pokemon
    return (pokemon.capabilities?.sky ?? 0) > 0
  }
  return false
}

/**
 * Get a combatant's Sky speed for default elevation calculation.
 * Returns 0 for non-flying combatants.
 */
function getSkySpeed(combatant: Combatant): number {
  if (combatant.type === 'pokemon') {
    const pokemon = combatant.entity as Pokemon
    return pokemon.capabilities?.sky ?? 0
  }
  return 0
}

/**
 * Composable for managing token and terrain elevation in the isometric VTT.
 *
 * Responsibilities:
 * - Track per-token elevation (reactive map)
 * - Compute default elevation for flying Pokemon (Sky speed > 0)
 * - Provide elevation change helpers (raise/lower token)
 * - Provide terrain elevation brush (raise/lower ground cells)
 * - Validate elevation bounds (0 to maxElevation)
 */
export function useElevation(options: UseElevationOptions) {
  const terrainStore = useTerrainStore()

  // Per-token elevation map: combatantId -> elevation level
  const tokenElevations = ref<Map<string, number>>(new Map())

  // Elevation brush level (for painting terrain elevation)
  const brushElevation = ref(1)

  /**
   * Get a token's current elevation.
   * Returns 0 (ground level) if not explicitly set.
   */
  const getTokenElevation = (combatantId: string): number => {
    return tokenElevations.value.get(combatantId) ?? 0
  }

  /**
   * Set a token's elevation, clamped to [0, maxElevation].
   */
  const setTokenElevation = (combatantId: string, elevation: number): void => {
    const clamped = Math.max(0, Math.min(options.maxElevation.value, Math.round(elevation)))
    const newMap = new Map(tokenElevations.value)
    if (clamped === 0) {
      newMap.delete(combatantId)
    } else {
      newMap.set(combatantId, clamped)
    }
    tokenElevations.value = newMap
  }

  /**
   * Raise a token's elevation by 1 level.
   */
  const raiseToken = (combatantId: string): void => {
    const current = getTokenElevation(combatantId)
    setTokenElevation(combatantId, current + 1)
  }

  /**
   * Lower a token's elevation by 1 level.
   */
  const lowerToken = (combatantId: string): void => {
    const current = getTokenElevation(combatantId)
    setTokenElevation(combatantId, current - 1)
  }

  /**
   * Calculate default elevation for a combatant based on Sky capability.
   * Flying Pokemon default to elevation = min(sky speed, maxElevation).
   * Non-flying combatants default to 0.
   */
  const getDefaultElevation = (combatantId: string): number => {
    if (!options.getCombatant) return 0
    const combatant = options.getCombatant(combatantId)
    if (!combatant) return 0

    if (combatantCanFly(combatant)) {
      const sky = getSkySpeed(combatant)
      return Math.min(sky, options.maxElevation.value)
    }
    return 0
  }

  /**
   * Apply default elevation for a combatant if not already set.
   * Called when a token is first placed or an encounter starts.
   */
  const applyDefaultElevation = (combatantId: string): void => {
    if (!tokenElevations.value.has(combatantId)) {
      const defaultElev = getDefaultElevation(combatantId)
      if (defaultElev > 0) {
        setTokenElevation(combatantId, defaultElev)
      }
    }
  }

  /**
   * Get terrain cell elevation at a grid position.
   * Uses the terrain store's cell data. Returns 0 if no terrain cell exists.
   */
  const getTerrainElevation = (x: number, y: number): number => {
    const cell = terrainStore.getCellAt(x, y)
    return cell?.elevation ?? 0
  }

  /**
   * Set terrain elevation at a grid position.
   * Preserves the existing terrain type; only changes the elevation.
   */
  const setTerrainElevation = (x: number, y: number, elevation: number): void => {
    const clamped = Math.max(0, Math.min(options.maxElevation.value, Math.round(elevation)))
    const cell = terrainStore.getCellAt(x, y)
    const terrainType = cell?.type ?? 'normal'
    const note = cell?.note
    terrainStore.setTerrain(x, y, terrainType, clamped, note)
  }

  /**
   * Raise terrain elevation at a position by the brush amount.
   */
  const raiseTerrainAt = (x: number, y: number): void => {
    const current = getTerrainElevation(x, y)
    setTerrainElevation(x, y, current + brushElevation.value)
  }

  /**
   * Lower terrain elevation at a position by the brush amount.
   */
  const lowerTerrainAt = (x: number, y: number): void => {
    const current = getTerrainElevation(x, y)
    setTerrainElevation(x, y, current - brushElevation.value)
  }

  /**
   * Set brush elevation level (clamped to 1..maxElevation).
   */
  const setBrushElevation = (level: number): void => {
    brushElevation.value = Math.max(1, Math.min(options.maxElevation.value, Math.round(level)))
  }

  /**
   * Clear all token elevations (e.g., when encounter resets).
   */
  const clearAllElevations = (): void => {
    tokenElevations.value = new Map()
  }

  /**
   * Import token elevations from serialized data.
   */
  const importElevations = (data: TokenElevation[]): void => {
    const newMap = new Map<string, number>()
    for (const entry of data) {
      if (entry.elevation > 0) {
        newMap.set(entry.combatantId, entry.elevation)
      }
    }
    tokenElevations.value = newMap
  }

  /**
   * Export token elevations for serialization.
   */
  const exportElevations = (): TokenElevation[] => {
    return Array.from(tokenElevations.value.entries()).map(([combatantId, elevation]) => ({
      combatantId,
      elevation,
    }))
  }

  return {
    // State
    tokenElevations,
    brushElevation,
    // Token elevation
    getTokenElevation,
    setTokenElevation,
    raiseToken,
    lowerToken,
    getDefaultElevation,
    applyDefaultElevation,
    // Terrain elevation
    getTerrainElevation,
    setTerrainElevation,
    raiseTerrainAt,
    lowerTerrainAt,
    setBrushElevation,
    // Utility
    clearAllElevations,
    importElevations,
    exportElevations,
    // Capability checks
    combatantCanFly,
    getSkySpeed,
  }
}
