/**
 * Combatant Service
 * Handles combat mechanics: damage calculation, healing, status conditions, stage modifiers,
 * and entity transformation (Prisma record → typed entity for combatant embedding).
 */

import { prisma } from '~/server/utils/prisma'
import { ALL_STATUS_CONDITIONS, PERSISTENT_CONDITIONS, VOLATILE_CONDITIONS, getStatusCsEffect } from '~/constants/statusConditions'
import { getEffectiveMaxHp } from '~/utils/restHealing'
import { v4 as uuidv4 } from 'uuid'
import { computeEquipmentBonuses } from '~/utils/equipmentBonuses'
import { applyStageModifier, calculateEvasion } from '~/utils/damageCalculation'
import type {
  StatusCondition, StageModifiers, StageSource, Combatant,
  Pokemon, HumanCharacter, CombatSide, GridPosition
} from '~/types'

// ============================================
// DAMAGE CALCULATION
// ============================================

export interface DamageResult {
  finalDamage: number
  tempHpAbsorbed: number
  hpDamage: number
  newHp: number
  newTempHp: number
  /** True if any injuries were gained from this hit (massive damage OR marker crossings) */
  injuryGained: boolean
  /** True if massive damage rule triggered (single hit >= 50% maxHp) */
  massiveDamageInjury: boolean
  /** Number of HP marker injuries (from crossing 50%, 0%, -50%, -100%, etc.) */
  markerInjuries: number
  /** Which HP thresholds were crossed (e.g., [25, 0] for a 50hp Pokemon crossing 50% and 0%) */
  markersCrossed: number[]
  /** Total new injuries from this hit: massive damage + marker crossings */
  totalNewInjuries: number
  newInjuries: number
  fainted: boolean
}

/**
 * Count HP markers crossed between previousHp and newHp.
 * PTU 07-combat.md:1849-1852 — Markers at 50%, 0%, -50%, -100%, and every -50% below.
 * Uses REAL maxHp (not injury-reduced) per PTU rules (07-combat.md:1872-1876).
 *
 * HP can go negative internally for marker counting, even though the stored
 * value is clamped to 0.
 */
export function countMarkersCrossed(
  previousHp: number,
  newHp: number,
  realMaxHp: number
): { count: number; markers: number[] } {
  const markers: number[] = []
  const fiftyPercent = Math.floor(realMaxHp * 0.5)

  // Safety: don't loop if maxHp is too small to produce meaningful markers
  if (fiftyPercent <= 0) {
    return { count: 0, markers }
  }

  // Generate marker thresholds: 50%, 0%, -50%, -100%, ...
  // Start at 50% of maxHp, descend by 50% steps into negative territory
  let threshold = fiftyPercent
  while (threshold >= newHp) {
    if (previousHp > threshold && newHp <= threshold) {
      markers.push(threshold)
    }
    threshold -= fiftyPercent
    // Safety cap — in extreme cases, don't loop forever
    if (markers.length > 20) break
  }

  return { count: markers.length, markers }
}

/**
 * Calculate damage with PTU mechanics
 * - Temporary HP absorbs damage first
 * - Massive Damage rule: 50%+ of max HP = injury (07-combat.md:1843-1848)
 * - HP Marker crossings: 50%, 0%, -50%, -100%, etc. = 1 injury each (07-combat.md:1849-1856)
 * - newHp is clamped to 0 for storage; unclamped value is used for marker detection
 */
export function calculateDamage(
  damage: number,
  currentHp: number,
  maxHp: number,
  temporaryHp: number,
  currentInjuries: number
): DamageResult {
  let remainingDamage = damage
  let tempHpAbsorbed = 0

  // Temporary HP absorbs damage first
  if (temporaryHp > 0) {
    tempHpAbsorbed = Math.min(temporaryHp, remainingDamage)
    remainingDamage -= tempHpAbsorbed
  }

  const newTempHp = temporaryHp - tempHpAbsorbed
  const hpDamage = remainingDamage

  // Unclamped HP for marker detection — PTU allows negative HP for injury tracking
  const unclampedHp = currentHp - hpDamage

  // Clamped HP for storage and display
  const newHp = Math.max(0, unclampedHp)

  // PTU Massive Damage rule: 50%+ of max HP in one hit = 1 injury
  // Only HP damage counts, not temp HP damage
  const massiveDamageInjury = hpDamage >= maxHp / 2

  // HP Marker crossings: each marker crossed = 1 injury
  const { count: markerInjuries, markers: markersCrossed } = countMarkersCrossed(
    currentHp,
    unclampedHp,
    maxHp
  )

  const totalNewInjuries = (massiveDamageInjury ? 1 : 0) + markerInjuries
  const injuryGained = totalNewInjuries > 0
  const newInjuries = currentInjuries + totalNewInjuries
  const fainted = newHp === 0

  return {
    finalDamage: damage,
    tempHpAbsorbed,
    hpDamage,
    newHp,
    newTempHp,
    injuryGained,
    massiveDamageInjury,
    markerInjuries,
    markersCrossed,
    totalNewInjuries,
    newInjuries,
    fainted
  }
}

/**
 * Apply damage to a combatant's entity, updating HP, temp HP, injuries, and status
 */
export function applyDamageToEntity(
  combatant: Combatant,
  damageResult: DamageResult
): void {
  const entity = combatant.entity

  entity.currentHp = damageResult.newHp
  entity.temporaryHp = damageResult.newTempHp
  entity.injuries = damageResult.newInjuries

  // PTU p248: "When a Pokemon becomes Fainted, they are automatically
  // cured of all Persistent and Volatile Status Conditions."
  // "Other" conditions (Stuck, Slowed, Trapped, Tripped, Vulnerable) are NOT cleared.
  if (damageResult.fainted) {
    const conditionsToClear = [...PERSISTENT_CONDITIONS, ...VOLATILE_CONDITIONS] as StatusCondition[]

    // Reverse CS effects from conditions being cleared (decree-005)
    const conditionsBeingCleared = (entity.statusConditions || []).filter(
      (s: StatusCondition) => conditionsToClear.includes(s)
    )
    for (const condition of conditionsBeingCleared) {
      reverseStatusCsEffects(combatant, condition)
    }

    const survivingConditions = (entity.statusConditions || []).filter(
      (s: StatusCondition) => !conditionsToClear.includes(s) && s !== 'Fainted'
    )
    entity.statusConditions = ['Fainted', ...survivingConditions]
  }
}

// ============================================
// HEALING
// ============================================

export interface HealResult {
  hpHealed?: number
  tempHpGained?: number
  injuriesHealed?: number
  newHp: number
  newTempHp: number
  newInjuries: number
  faintedRemoved: boolean
}

export interface HealOptions {
  amount?: number      // HP to heal
  tempHp?: number      // Temp HP to grant
  healInjuries?: number // Injuries to heal
}

/**
 * Apply healing to a combatant's entity
 */
export function applyHealingToEntity(
  combatant: Combatant,
  options: HealOptions
): HealResult {
  const entity = combatant.entity
  const result: HealResult = {
    newHp: entity.currentHp,
    newTempHp: entity.temporaryHp || 0,
    newInjuries: entity.injuries || 0,
    faintedRemoved: false
  }

  // Heal injuries first so effective max HP reflects post-heal injury count
  if (options.healInjuries !== undefined && options.healInjuries > 0) {
    const previousInjuries = entity.injuries || 0
    const newInjuries = Math.max(0, previousInjuries - options.healInjuries)
    entity.injuries = newInjuries
    result.injuriesHealed = previousInjuries - newInjuries
    result.newInjuries = newInjuries
  }

  // Heal HP (capped at injury-reduced effective max HP, using post-injury-heal count)
  if (options.amount !== undefined && options.amount > 0) {
    const effectiveMax = getEffectiveMaxHp(entity.maxHp, entity.injuries || 0)
    const previousHp = entity.currentHp
    const newHp = Math.min(effectiveMax, previousHp + options.amount)
    entity.currentHp = newHp
    result.hpHealed = newHp - previousHp
    result.newHp = newHp

    // Remove Fainted status if healed from 0 HP
    if (previousHp === 0 && newHp > 0) {
      entity.statusConditions = (entity.statusConditions || []).filter(
        (s: StatusCondition) => s !== 'Fainted'
      )
      result.faintedRemoved = true
    }
  }

  // Grant Temporary HP — PTU: keep whichever is higher (old or new), do NOT stack
  if (options.tempHp !== undefined && options.tempHp > 0) {
    const previousTempHp = entity.temporaryHp || 0
    const newTempHp = Math.max(previousTempHp, options.tempHp)
    entity.temporaryHp = newTempHp
    result.tempHpGained = newTempHp - previousTempHp
    result.newTempHp = newTempHp
  }

  return result
}

// ============================================
// STATUS CONDITIONS
// ============================================

export const VALID_STATUS_CONDITIONS = ALL_STATUS_CONDITIONS

export interface StatusChangeResult {
  added: StatusCondition[]
  removed: StatusCondition[]
  current: StatusCondition[]
}

/**
 * Update status conditions on a combatant's entity.
 * Per decree-005: auto-applies/reverses CS effects for Burn, Paralysis, Poison.
 */
export function updateStatusConditions(
  combatant: Combatant,
  addStatuses: StatusCondition[],
  removeStatuses: StatusCondition[]
): StatusChangeResult & { stageChanges?: StageChangeResult } {
  const entity = combatant.entity
  let currentStatuses: StatusCondition[] = entity.statusConditions || []

  // Remove statuses first
  const actuallyRemoved = removeStatuses.filter(s => currentStatuses.includes(s))
  currentStatuses = currentStatuses.filter(s => !removeStatuses.includes(s))

  // Add new statuses (avoid duplicates)
  const actuallyAdded: StatusCondition[] = []
  for (const status of addStatuses) {
    if (!currentStatuses.includes(status)) {
      currentStatuses.push(status)
      actuallyAdded.push(status)
    }
  }

  entity.statusConditions = currentStatuses

  // Auto-apply/reverse CS effects from status conditions (decree-005)
  let stageChanges: StageChangeResult | undefined
  const hasSourcedChanges = actuallyAdded.some(s => getStatusCsEffect(s)) ||
                            actuallyRemoved.some(s => getStatusCsEffect(s))

  if (hasSourcedChanges) {
    // Reverse CS effects for removed conditions
    for (const status of actuallyRemoved) {
      reverseStatusCsEffects(combatant, status)
    }

    // Apply CS effects for added conditions
    for (const status of actuallyAdded) {
      applyStatusCsEffects(combatant, status)
    }

    // Return the current stage state after all changes
    stageChanges = {
      changes: {},
      currentStages: { ...(entity.stageModifiers || createDefaultStageModifiers()) }
    }
  }

  return {
    added: actuallyAdded,
    removed: actuallyRemoved,
    current: currentStatuses,
    stageChanges
  }
}

/**
 * Validate status conditions array
 * @throws H3Error if any status is invalid
 */
export function validateStatusConditions(statuses: StatusCondition[]): void {
  for (const status of statuses) {
    if (!VALID_STATUS_CONDITIONS.includes(status)) {
      throw createError({
        statusCode: 400,
        message: `Invalid status condition: ${status}`
      })
    }
  }
}

// ============================================
// STATUS CONDITION → COMBAT STAGE AUTO-APPLICATION (decree-005)
// ============================================

/**
 * Apply the inherent CS effect for a status condition (e.g., Burn → -2 Def).
 * Records the change in combatant.stageSources for clean reversal on cure.
 * Respects -6/+6 stage bounds.
 */
export function applyStatusCsEffects(combatant: Combatant, condition: StatusCondition): void {
  const csEffect = getStatusCsEffect(condition)
  if (!csEffect) return

  const entity = combatant.entity
  if (!entity.stageModifiers) {
    entity.stageModifiers = createDefaultStageModifiers()
  }

  // Initialize stageSources if needed
  if (!combatant.stageSources) {
    combatant.stageSources = []
  }

  const { stat, value } = csEffect
  const currentValue = entity.stageModifiers[stat] || 0
  const newValue = Math.max(-6, Math.min(6, currentValue + value))
  const actualDelta = newValue - currentValue

  entity.stageModifiers = {
    ...entity.stageModifiers,
    [stat]: newValue
  }

  // Record the source entry with the actual delta applied (may differ from
  // the nominal value if the stage was already near a bound)
  combatant.stageSources = [
    ...combatant.stageSources,
    { stat, value: actualDelta, source: condition }
  ]
}

/**
 * Reverse the CS effect for a cured status condition.
 * Only reverses the delta that was actually applied (tracked in stageSources).
 * Removes matching stageSources entries.
 */
export function reverseStatusCsEffects(combatant: Combatant, condition: StatusCondition): void {
  if (!combatant.stageSources || combatant.stageSources.length === 0) return

  const entity = combatant.entity
  if (!entity.stageModifiers) return

  // Find all source entries for this condition
  const matchingEntries = combatant.stageSources.filter(s => s.source === condition)
  if (matchingEntries.length === 0) return

  // Reverse each entry's delta
  let updatedModifiers = { ...entity.stageModifiers }
  for (const entry of matchingEntries) {
    const currentValue = updatedModifiers[entry.stat] || 0
    const newValue = Math.max(-6, Math.min(6, currentValue - entry.value))
    updatedModifiers = { ...updatedModifiers, [entry.stat]: newValue }
  }

  entity.stageModifiers = updatedModifiers

  // Remove matching source entries
  combatant.stageSources = combatant.stageSources.filter(s => s.source !== condition)
}

/**
 * Re-apply CS effects from all active status conditions.
 * Used after Take a Breather resets stages to 0 — the persistent conditions
 * (Burn, Paralysis, Poison) survive the breather and their CS effects must persist.
 *
 * Clears all existing stageSources and re-applies fresh entries.
 */
export function reapplyActiveStatusCsEffects(combatant: Combatant): void {
  const entity = combatant.entity
  const activeStatuses: StatusCondition[] = entity.statusConditions || []

  // Clear existing source tracking (stages were just reset)
  combatant.stageSources = []

  // Re-apply CS effects for each active condition that has one
  for (const condition of activeStatuses) {
    applyStatusCsEffects(combatant, condition)
  }
}

// ============================================
// STAGE MODIFIERS
// ============================================

export type StageStat = keyof StageModifiers

// PTU has three modifier categories, all sharing the -6/+6 range:
// 1. Combat Stages (atk, def, spA, spD, spe): use the multiplier table (+20%/-10% per stage)
// 2. Accuracy modifier: applied directly to accuracy rolls (PTU p.234)
// 3. Evasion bonus: additive bonus from moves/effects, stacks on stat-derived evasion (PTU p.234)
export const VALID_STATS: StageStat[] = [
  'attack', 'defense', 'specialAttack', 'specialDefense', 'speed', 'accuracy', 'evasion'
]

// All three categories are clamped to -6 to +6
const MIN_STAGE = -6
const MAX_STAGE = 6

export interface StageChangeResult {
  changes: Record<string, { previous: number; change: number; current: number }>
  currentStages: StageModifiers
}

/**
 * Clamp a stage value to valid range
 */
function clampStage(value: number): number {
  return Math.max(MIN_STAGE, Math.min(MAX_STAGE, value))
}

/**
 * Create default stage modifiers object
 */
export function createDefaultStageModifiers(): StageModifiers {
  return {
    attack: 0,
    defense: 0,
    specialAttack: 0,
    specialDefense: 0,
    speed: 0,
    accuracy: 0,
    evasion: 0
  }
}

/**
 * Update stage modifiers on a combatant's entity
 * @param changes - Object with stat names and delta values (or absolute values if isAbsolute=true)
 * @param isAbsolute - If true, set values directly instead of adding
 */
export function updateStageModifiers(
  combatant: Combatant,
  changes: Record<string, number>,
  isAbsolute: boolean = false
): StageChangeResult {
  const entity = combatant.entity

  // Initialize stage modifiers if not present
  if (!entity.stageModifiers) {
    entity.stageModifiers = createDefaultStageModifiers()
  }

  const appliedChanges: Record<string, { previous: number; change: number; current: number }> = {}

  for (const [stat, value] of Object.entries(changes)) {
    const previousValue = entity.stageModifiers[stat as StageStat] || 0
    let newValue: number

    if (isAbsolute) {
      newValue = clampStage(value)
    } else {
      newValue = clampStage(previousValue + value)
    }

    entity.stageModifiers[stat as StageStat] = newValue
    appliedChanges[stat] = {
      previous: previousValue,
      change: newValue - previousValue,
      current: newValue
    }
  }

  return {
    changes: appliedChanges,
    currentStages: { ...entity.stageModifiers }
  }
}

/**
 * Validate stat names
 * @throws H3Error if any stat is invalid
 */
export function validateStageStats(stats: string[]): void {
  for (const stat of stats) {
    if (!VALID_STATS.includes(stat as StageStat)) {
      throw createError({
        statusCode: 400,
        message: `Invalid stat: ${stat}. Valid stats are: ${VALID_STATS.join(', ')}`
      })
    }
  }
}

// ============================================
// ENTITY BUILDERS (Prisma Record → Typed Entity)
// ============================================

// Derive Prisma record types from the client queries
type PrismaPokemonRecord = NonNullable<Awaited<ReturnType<typeof prisma.pokemon.findUnique>>>
type PrismaHumanRecord = NonNullable<Awaited<ReturnType<typeof prisma.humanCharacter.findUnique>>>

/**
 * Transform a Prisma Pokemon record into a typed Pokemon entity.
 * Parses JSON fields and maps DB column names (e.g. currentSpAtk → specialAttack).
 */
export function buildPokemonEntityFromRecord(record: PrismaPokemonRecord): Pokemon {
  const capabilities = record.capabilities ? JSON.parse(record.capabilities) : {}

  return {
    id: record.id,
    species: record.species,
    nickname: record.nickname,
    level: record.level,
    experience: record.experience,
    nature: JSON.parse(record.nature),
    types: record.type2
      ? [record.type1, record.type2] as Pokemon['types']
      : [record.type1] as Pokemon['types'],
    baseStats: {
      hp: record.baseHp,
      attack: record.baseAttack,
      defense: record.baseDefense,
      specialAttack: record.baseSpAtk,
      specialDefense: record.baseSpDef,
      speed: record.baseSpeed
    },
    currentStats: {
      hp: record.currentHp,
      attack: record.currentAttack,
      defense: record.currentDefense,
      specialAttack: record.currentSpAtk,
      specialDefense: record.currentSpDef,
      speed: record.currentSpeed
    },
    currentHp: record.currentHp,
    maxHp: record.maxHp,
    stageModifiers: JSON.parse(record.stageModifiers),
    abilities: JSON.parse(record.abilities),
    moves: JSON.parse(record.moves),
    heldItem: record.heldItem ?? undefined,
    capabilities,
    skills: JSON.parse(record.skills),
    statusConditions: JSON.parse(record.statusConditions),
    injuries: record.injuries,
    temporaryHp: record.temporaryHp,
    restMinutesToday: record.restMinutesToday,
    lastInjuryTime: record.lastInjuryTime?.toISOString() ?? null,
    injuriesHealedToday: record.injuriesHealedToday,
    tutorPoints: record.tutorPoints,
    trainingExp: record.trainingExp,
    eggGroups: JSON.parse(record.eggGroups),
    ownerId: record.ownerId ?? undefined,
    spriteUrl: record.spriteUrl ?? undefined,
    shiny: record.shiny,
    gender: record.gender as Pokemon['gender'],
    isInLibrary: record.isInLibrary,
    origin: record.origin as Pokemon['origin'],
    location: record.location ?? undefined,
    notes: record.notes ?? undefined
  }
}

/**
 * Transform a Prisma HumanCharacter record into a typed HumanCharacter entity.
 * Parses JSON fields and maps DB columns to typed interface fields.
 */
export function buildHumanEntityFromRecord(record: PrismaHumanRecord): HumanCharacter {
  return {
    id: record.id,
    name: record.name,
    characterType: record.characterType as HumanCharacter['characterType'],
    playedBy: record.playedBy ?? undefined,
    age: record.age ?? undefined,
    gender: record.gender ?? undefined,
    height: record.height ?? undefined,
    weight: record.weight ?? undefined,
    level: record.level,
    stats: {
      hp: record.hp,
      attack: record.attack,
      defense: record.defense,
      specialAttack: record.specialAttack,
      specialDefense: record.specialDefense,
      speed: record.speed
    },
    currentHp: record.currentHp,
    maxHp: record.maxHp,
    trainerClasses: JSON.parse(record.trainerClasses),
    skills: JSON.parse(record.skills),
    features: JSON.parse(record.features),
    edges: JSON.parse(record.edges),
    capabilities: JSON.parse(record.capabilities || '[]'),
    pokemonIds: [],
    statusConditions: JSON.parse(record.statusConditions),
    stageModifiers: JSON.parse(record.stageModifiers),
    injuries: record.injuries,
    temporaryHp: record.temporaryHp,
    restMinutesToday: record.restMinutesToday,
    lastInjuryTime: record.lastInjuryTime?.toISOString() ?? null,
    injuriesHealedToday: record.injuriesHealedToday,
    drainedAp: record.drainedAp,
    boundAp: record.boundAp,
    currentAp: record.currentAp,
    equipment: record.equipment ? JSON.parse(record.equipment) : {},
    inventory: JSON.parse(record.inventory),
    money: record.money,
    avatarUrl: record.avatarUrl ?? undefined,
    background: record.background ?? undefined,
    personality: record.personality ?? undefined,
    goals: record.goals ?? undefined,
    location: record.location ?? undefined,
    isInLibrary: record.isInLibrary,
    notes: record.notes ?? undefined
  }
}

// ============================================
// EVASION HELPERS
// ============================================

/** PTU max evasion from stats: +6 at 30+ in a stat (PTU p.310-314) */
const MAX_EVASION = 6

/**
 * Compute initial evasion for a stat: floor(stat / 5), capped at +6.
 * PTU p.310-314: "You may never have more than +6 in a [given evasion]."
 */
export function initialEvasion(stat: number): number {
  return Math.min(MAX_EVASION, Math.floor(stat / 5))
}

// ============================================
// COMBATANT BUILDER
// ============================================

export interface BuildCombatantOptions {
  entityType: 'pokemon' | 'human'
  entityId: string
  entity: Pokemon | HumanCharacter
  side: CombatSide
  initiativeBonus?: number
  position?: GridPosition
  tokenSize?: number
}

/**
 * Build a full Combatant wrapper from a typed entity.
 * Calculates initiative and evasions (PTU: floor(stat / 5)) from entity stats.
 * For human combatants:
 * - Equipment evasion bonus (shields) added to initial evasion values (PTU p.294)
 * - Heavy Armor speed default CS applied to initiative (PTU p.293)
 */
export function buildCombatantFromEntity(options: BuildCombatantOptions): Combatant {
  const { entityType, entityId, entity, side, position, tokenSize = 1 } = options
  const initiativeBonus = options.initiativeBonus ?? 0

  const stats = entityType === 'pokemon'
    ? (entity as Pokemon).currentStats
    : (entity as HumanCharacter).stats

  // Equipment bonuses for human combatants (shields for evasion, heavy armor for speed, focus for stats)
  let equipmentEvasionBonus = 0
  let equipmentSpeedDefaultCS = 0
  let equipmentStatBonuses: Record<string, number> = {}
  if (entityType === 'human') {
    const equipBonuses = computeEquipmentBonuses((entity as HumanCharacter).equipment ?? {})
    equipmentEvasionBonus = equipBonuses.evasionBonus
    equipmentSpeedDefaultCS = equipBonuses.speedDefaultCS
    equipmentStatBonuses = equipBonuses.statBonuses
  }

  // Focus stat bonus for speed (PTU p.295): +5 applied after combat stages
  const focusSpeedBonus = equipmentStatBonuses.speed ?? 0

  // Heavy Armor sets speed default CS to -1 (PTU p.293), affecting initiative
  // Focus (Speed) adds +5 after combat stages (PTU p.295), also affecting initiative
  const effectiveSpeed = equipmentSpeedDefaultCS !== 0
    ? applyStageModifier(stats.speed, equipmentSpeedDefaultCS) + focusSpeedBonus
    : stats.speed + focusSpeedBonus
  const initiative = effectiveSpeed + initiativeBonus

  // Reset stageModifiers to defaults for combat entry (PTU p.235: stages are combat-scoped).
  // This prevents double-application of status CS effects if the entity's DB record
  // still has stale CS values from a previous encounter.
  // Equipment speed default CS (Heavy Armor, PTU p.293) is applied on top.
  const combatStages = {
    ...createDefaultStageModifiers(),
    ...(equipmentSpeedDefaultCS !== 0 ? { speed: equipmentSpeedDefaultCS } : {})
  }
  const combatantEntity = {
    ...entity,
    stageModifiers: combatStages
  }

  const combatant: Combatant = {
    id: uuidv4(),
    type: entityType,
    entityId,
    side,
    initiative,
    initiativeBonus,
    hasActed: false,
    actionsRemaining: 2,
    shiftActionsRemaining: 1,
    turnState: {
      hasActed: false,
      standardActionUsed: false,
      shiftActionUsed: false,
      swiftActionUsed: false,
      canBeCommanded: true,
      isHolding: false
    },
    stageSources: [],
    badlyPoisonedRound: 0,
    injuries: { count: 0, sources: [] },
    physicalEvasion: calculateEvasion(stats.defense || 0, 0, equipmentEvasionBonus, equipmentStatBonuses.defense ?? 0),
    specialEvasion: calculateEvasion(stats.specialDefense || 0, 0, equipmentEvasionBonus, equipmentStatBonuses.specialDefense ?? 0),
    speedEvasion: calculateEvasion(stats.speed || 0, 0, equipmentEvasionBonus, focusSpeedBonus),
    position,
    tokenSize,
    entity: combatantEntity
  }

  // Auto-apply CS effects for pre-existing status conditions (decree-005)
  // e.g., a Burned Pokemon entering combat should start with -2 Def CS
  reapplyActiveStatusCsEffects(combatant)

  return combatant
}

// ============================================
// INITIATIVE RECALCULATION (decree-006)
// ============================================

/**
 * Recalculate a combatant's initiative based on their current CS-modified Speed stat.
 * PTU p.227: "Initiative is simply their Speed Stat."
 * Per decree-006: dynamically reorder initiative when Speed CS changes.
 *
 * Mirrors the logic in buildCombatantFromEntity but uses the combatant's
 * current speed CS instead of the initial equipment default.
 *
 * Returns the new initiative value (does NOT mutate the combatant).
 */
export function calculateCurrentInitiative(combatant: Combatant): number {
  const entity = combatant.entity
  const speedCS = entity.stageModifiers?.speed ?? 0

  const baseSpeed = combatant.type === 'pokemon'
    ? (entity as Pokemon).currentStats.speed
    : (entity as HumanCharacter).stats.speed

  // For humans, check for focus speed bonus (PTU p.295: +5 applied after CS)
  let focusSpeedBonus = 0
  if (combatant.type === 'human') {
    const equipBonuses = computeEquipmentBonuses((entity as HumanCharacter).equipment ?? {})
    focusSpeedBonus = equipBonuses.statBonuses.speed ?? 0
  }

  const effectiveSpeed = applyStageModifier(baseSpeed, speedCS) + focusSpeedBonus

  return effectiveSpeed + combatant.initiativeBonus
}
