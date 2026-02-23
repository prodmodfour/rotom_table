/**
 * Encounter Service
 * Handles common encounter operations: loading, validation, saving, and response building
 */

import { prisma } from '~/server/utils/prisma'
import { rollDie } from '~/utils/diceRoller'
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
    background: record.gridBackground ?? undefined
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
