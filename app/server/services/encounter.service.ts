/**
 * Encounter Service
 * Handles common encounter operations: loading, validation, saving, and response building
 */

import { prisma } from '~/server/utils/prisma'
import { rollDie } from '~/utils/diceRoller'
import { calculateCurrentInitiative } from '~/server/services/combatant.service'
import type { Combatant, Encounter, GridConfig } from '~/types'
import type { SignificanceTier } from '~/utils/encounterBudget'

// Prisma encounter record type (matches Prisma schema)
interface EncounterRecord {
  id: string
  name: string
  battleType: string
  weather: string | null
  weatherDuration: number
  weatherSource: string | null
  combatants: string
  currentRound: number
  currentTurnIndex: number
  turnOrder: string
  currentPhase: string
  trainerTurnOrder: string
  pokemonTurnOrder: string
  isActive: boolean
  isPaused: boolean
  isServed: boolean
  moveLog: string
  defeatedEnemies: string
  xpDistributed: boolean
  significanceMultiplier: number
  significanceTier: string
  gridEnabled: boolean
  gridWidth: number
  gridHeight: number
  gridCellSize: number
  gridBackground: string | null
  fogOfWarEnabled: boolean
  fogOfWarState: string
  terrainEnabled: boolean
  terrainState: string
  gridIsometric: boolean
  gridCameraAngle: number
  gridMaxElevation: number
  createdAt: Date
  updatedAt: Date
}

// Parsed encounter with combatants as objects
export interface ParsedEncounter {
  id: string
  name: string
  battleType: string
  weather?: string | null
  weatherDuration: number
  weatherSource?: string | null
  combatants: Combatant[]
  currentRound: number
  currentTurnIndex: number
  turnOrder: string[]
  isActive: boolean
  isPaused: boolean
  isServed: boolean
  moveLog: unknown[]
  defeatedEnemies: { species: string; level: number; type?: 'pokemon' | 'human' }[]
  xpDistributed: boolean
  significanceMultiplier: number
  significanceTier: SignificanceTier
  sceneNumber: number // Derived from currentRound for now
  gridConfig: GridConfig | null
  trainerTurnOrder: string[]
  pokemonTurnOrder: string[]
  currentPhase: 'trainer_declaration' | 'trainer_resolution' | 'pokemon'
  createdAt: Date
  updatedAt: Date
}

/**
 * Load an encounter by ID with validation
 * @throws H3Error if encounter not found
 */
export async function loadEncounter(id: string): Promise<{
  record: EncounterRecord
  combatants: Combatant[]
}> {
  const encounter = await prisma.encounter.findUnique({
    where: { id }
  })

  if (!encounter) {
    throw createError({
      statusCode: 404,
      message: 'Encounter not found'
    })
  }

  const combatants = JSON.parse(encounter.combatants) as Combatant[]

  return { record: encounter, combatants }
}

/**
 * Find a combatant in the combatants array
 * @throws H3Error if combatant not found
 */
export function findCombatant(combatants: Combatant[], combatantId: string): Combatant {
  const combatant = combatants.find(c => c.id === combatantId)

  if (!combatant) {
    throw createError({
      statusCode: 404,
      message: 'Combatant not found'
    })
  }

  return combatant
}

/**
 * Sort combatants by initiative with d20 roll-off for ties.
 * Mutates initiativeRollOff on tied combatants, then returns a new sorted array.
 */
export function sortByInitiativeWithRollOff(combatants: Combatant[], descending: boolean = true): Combatant[] {
  // Group combatants by initiative value
  const initiativeGroups = new Map<number, Combatant[]>()

  for (const c of combatants) {
    const init = c.initiative
    if (!initiativeGroups.has(init)) {
      initiativeGroups.set(init, [])
    }
    initiativeGroups.get(init)!.push(c)
  }

  // For each group with ties, assign roll-off values
  for (const [, group] of initiativeGroups) {
    if (group.length > 1) {
      // Roll d20 for each combatant in the tie
      for (const c of group) {
        c.initiativeRollOff = rollDie(20)
      }
      // Re-roll any remaining ties within the group
      let hasTies = true
      while (hasTies) {
        const rollOffValues = group.map(c => c.initiativeRollOff)
        const uniqueValues = new Set(rollOffValues)
        if (uniqueValues.size === group.length) {
          hasTies = false
        } else {
          // Find tied roll-offs and re-roll them
          const rollCounts = new Map<number, Combatant[]>()
          for (const c of group) {
            const roll = c.initiativeRollOff!
            if (!rollCounts.has(roll)) rollCounts.set(roll, [])
            rollCounts.get(roll)!.push(c)
          }
          for (const [, tied] of rollCounts) {
            if (tied.length > 1) {
              for (const c of tied) {
                c.initiativeRollOff = rollDie(20)
              }
            }
          }
        }
      }
    }
  }

  // Sort by initiative (primary) and roll-off (secondary)
  return [...combatants].sort((a, b) => {
    const initDiff = b.initiative - a.initiative
    if (initDiff !== 0) return descending ? initDiff : -initDiff
    // Tie-breaker: higher roll-off wins
    const rollDiff = (b.initiativeRollOff || 0) - (a.initiativeRollOff || 0)
    return descending ? rollDiff : -rollDiff
  })
}

/**
 * Build a standardized encounter response object
 */
export function buildEncounterResponse(
  record: EncounterRecord,
  combatants: Combatant[],
  options?: {
    moveLog?: unknown[]
    defeatedEnemies?: { species: string; level: number; type?: 'pokemon' | 'human' }[]
    // Override fields for endpoints that modify state before responding
    isActive?: boolean
    isPaused?: boolean
    currentRound?: number
    currentTurnIndex?: number
    turnOrder?: string[]
    // Combat phase fields
    trainerTurnOrder?: string[]
    pokemonTurnOrder?: string[]
    currentPhase?: 'trainer_declaration' | 'trainer_resolution' | 'pokemon'
  }
): ParsedEncounter {
  const turnOrder = options?.turnOrder ?? JSON.parse(record.turnOrder) as string[]
  const moveLog = options?.moveLog ?? JSON.parse(record.moveLog)
  const defeatedEnemies = options?.defeatedEnemies ?? JSON.parse(record.defeatedEnemies)

  const gridConfig: GridConfig | null = record.gridEnabled ? {
    enabled: record.gridEnabled,
    width: record.gridWidth,
    height: record.gridHeight,
    cellSize: record.gridCellSize,
    background: record.gridBackground ?? undefined,
    isometric: record.gridIsometric ?? false,
    cameraAngle: (record.gridCameraAngle ?? 0) as 0 | 1 | 2 | 3,
    maxElevation: record.gridMaxElevation ?? 5
  } : null

  return {
    id: record.id,
    name: record.name,
    battleType: record.battleType,
    weather: record.weather ?? null,
    weatherDuration: record.weatherDuration ?? 0,
    weatherSource: record.weatherSource ?? null,
    combatants,
    currentRound: options?.currentRound ?? record.currentRound,
    currentTurnIndex: options?.currentTurnIndex ?? record.currentTurnIndex,
    turnOrder,
    isActive: options?.isActive ?? record.isActive,
    isPaused: options?.isPaused ?? record.isPaused,
    isServed: record.isServed,
    moveLog,
    defeatedEnemies,
    xpDistributed: record.xpDistributed ?? false,
    significanceMultiplier: record.significanceMultiplier ?? 1.0,
    significanceTier: (record.significanceTier ?? 'insignificant') as SignificanceTier,
    sceneNumber: 1, // Scene number not stored in DB, default to 1
    gridConfig,
    trainerTurnOrder: options?.trainerTurnOrder ?? JSON.parse(record.trainerTurnOrder || '[]'),
    pokemonTurnOrder: options?.pokemonTurnOrder ?? JSON.parse(record.pokemonTurnOrder || '[]'),
    currentPhase: (options?.currentPhase ?? record.currentPhase ?? 'pokemon') as 'trainer_declaration' | 'trainer_resolution' | 'pokemon',
    createdAt: record.createdAt,
    updatedAt: record.updatedAt
  }
}

/**
 * Save encounter combatants to database
 */
export async function saveEncounterCombatants(
  id: string,
  combatants: Combatant[],
  additionalData?: {
    defeatedEnemies?: { species: string; level: number; type?: 'pokemon' | 'human' }[]
    moveLog?: unknown[]
  }
): Promise<void> {
  const data: Record<string, unknown> = {
    combatants: JSON.stringify(combatants)
  }

  if (additionalData?.defeatedEnemies) {
    data.defeatedEnemies = JSON.stringify(additionalData.defeatedEnemies)
  }

  if (additionalData?.moveLog) {
    data.moveLog = JSON.stringify(additionalData.moveLog)
  }

  await prisma.encounter.update({
    where: { id },
    data
  })
}

/**
 * Get entity display name (Pokemon species/nickname or Human name)
 */
export function getEntityName(combatant: Combatant): string {
  if (combatant.type === 'pokemon') {
    const entity = combatant.entity as { nickname?: string; species: string }
    return entity.nickname || entity.species
  }
  const entity = combatant.entity as { name: string }
  return entity.name
}

// ============================================
// INITIATIVE REORDER (decree-006)
// ============================================

export interface InitiativeReorderResult {
  /** Whether the turn order actually changed */
  changed: boolean
  /** Updated turn order (full contact) or phase-specific orders (league) */
  turnOrder: string[]
  trainerTurnOrder: string[]
  pokemonTurnOrder: string[]
  /** Updated currentTurnIndex (may shift if unacted combatants reorder around current) */
  currentTurnIndex: number
}

/**
 * Recalculate initiative for all combatants and re-sort the turn order.
 * Per decree-006: combatants who have already acted retain their position.
 * Only unacted combatants are re-sorted among the remaining slots.
 *
 * This function:
 * 1. Recalculates initiative for every combatant (updating combatant.initiative)
 * 2. Splits turn order into acted (frozen) + unacted (re-sortable)
 * 3. Re-sorts unacted combatants by new initiative (high→low, with rolloff for ties)
 * 4. Reconstructs the turn order: [...acted, ...re-sorted-unacted]
 * 5. Returns new turn orders + adjusted currentTurnIndex
 */
export function reorderInitiativeAfterSpeedChange(
  combatants: Combatant[],
  currentTurnOrder: string[],
  currentTurnIndex: number,
  battleType: string,
  trainerTurnOrder: string[],
  pokemonTurnOrder: string[]
): InitiativeReorderResult {
  // Step 1: Recalculate initiative for all combatants (mutates combatant.initiative)
  for (const c of combatants) {
    c.initiative = calculateCurrentInitiative(c)
  }

  // Helper to build a lookup map
  const combatantMap = new Map(combatants.map(c => [c.id, c]))

  // Step 2-4: Reorder a single turn order array, preserving acted positions
  const reorderSingleList = (
    order: string[],
    turnIndex: number,
    descending: boolean
  ): { newOrder: string[]; newIndex: number } => {
    if (order.length === 0) return { newOrder: [], newIndex: 0 }

    // Acted = slots 0..turnIndex-1 (already had their turn this round)
    // Current = slot at turnIndex (currently acting, treated as acted — don't reorder them)
    // Unacted = slots turnIndex+1..end (haven't acted yet, can be re-sorted)
    const actedSlots = order.slice(0, turnIndex + 1)
    const unactedIds = order.slice(turnIndex + 1)

    if (unactedIds.length <= 1) {
      // Nothing to re-sort
      return { newOrder: order, newIndex: turnIndex }
    }

    // Resolve combatants for unacted slots
    const unactedCombatants = unactedIds
      .map(id => combatantMap.get(id))
      .filter((c): c is Combatant => c !== undefined)

    // Sort unacted by initiative (re-use rolloff for ties)
    const sorted = sortByInitiativeWithRollOff(unactedCombatants, descending)

    const newOrder = [...actedSlots, ...sorted.map(c => c.id)]
    return { newOrder, newIndex: turnIndex }
  }

  if (battleType === 'trainer') {
    // League battle: reorder trainer and pokemon orders separately
    // For trainer declaration: low→high speed (ascending)
    // For pokemon: high→low speed (descending)
    //
    // We use index -1 for the sub-lists that are not currently active
    // so all combatants in inactive phases get fully re-sorted
    const isTrainerPhase = currentTurnOrder.length > 0 &&
      trainerTurnOrder.length > 0 &&
      currentTurnOrder[0] === trainerTurnOrder[0]

    let newTurnOrder: string[]
    let newTurnIndex: number

    // Reorder trainer list
    const trainerIndex = isTrainerPhase ? currentTurnIndex : -1
    const { newOrder: newTrainerOrder } = reorderSingleList(
      trainerTurnOrder, trainerIndex, false
    )

    // Reorder pokemon list
    const pokemonIndex = !isTrainerPhase ? currentTurnIndex : -1
    const { newOrder: newPokemonOrder } = reorderSingleList(
      pokemonTurnOrder, pokemonIndex, true
    )

    // Determine active turn order and index
    if (isTrainerPhase) {
      const result = reorderSingleList(currentTurnOrder, currentTurnIndex, false)
      newTurnOrder = result.newOrder
      newTurnIndex = result.newIndex
    } else {
      const result = reorderSingleList(currentTurnOrder, currentTurnIndex, true)
      newTurnOrder = result.newOrder
      newTurnIndex = result.newIndex
    }

    const changed = JSON.stringify(newTurnOrder) !== JSON.stringify(currentTurnOrder) ||
      JSON.stringify(newTrainerOrder) !== JSON.stringify(trainerTurnOrder) ||
      JSON.stringify(newPokemonOrder) !== JSON.stringify(pokemonTurnOrder)

    return {
      changed,
      turnOrder: newTurnOrder,
      trainerTurnOrder: newTrainerOrder,
      pokemonTurnOrder: newPokemonOrder,
      currentTurnIndex: newTurnIndex
    }
  }

  // Full contact: single turn order, high→low
  const { newOrder, newIndex } = reorderSingleList(
    currentTurnOrder, currentTurnIndex, true
  )

  return {
    changed: JSON.stringify(newOrder) !== JSON.stringify(currentTurnOrder),
    turnOrder: newOrder,
    trainerTurnOrder,
    pokemonTurnOrder,
    currentTurnIndex: newIndex
  }
}

/**
 * Persist reordered initiative data to the database.
 * Saves updated combatants (with new initiative values) and turn orders.
 */
export async function saveInitiativeReorder(
  encounterId: string,
  combatants: Combatant[],
  reorder: InitiativeReorderResult
): Promise<void> {
  await prisma.encounter.update({
    where: { id: encounterId },
    data: {
      combatants: JSON.stringify(combatants),
      turnOrder: JSON.stringify(reorder.turnOrder),
      trainerTurnOrder: JSON.stringify(reorder.trainerTurnOrder),
      pokemonTurnOrder: JSON.stringify(reorder.pokemonTurnOrder),
      currentTurnIndex: reorder.currentTurnIndex
    }
  })
}
