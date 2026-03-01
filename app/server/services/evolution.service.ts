/**
 * Pokemon Evolution Service
 *
 * Core business logic for performing Pokemon evolution:
 * - Stat point extraction from current Pokemon state
 * - Stat recalculation with new species base stats + existing nature
 * - Base Relations Rule validation (decree-035: uses nature-adjusted base stats)
 * - Full evolution execution (species, types, stats, HP)
 *
 * PTU Core Chapter 5, p.202:
 * "Take the new form's Base Stats, apply the Pokemon's Nature again,
 * reapply any Vitamins that were used, and then re-Stat the Pokemon,
 * spreading the Stats as you wish."
 *
 * HP formula: Level + (HP stat * 3) + 10
 * Stat points total: Level + 10
 */

import { prisma } from '~/server/utils/prisma'
import { applyNatureToBaseStats } from '~/constants/natures'
import { validateBaseRelations } from '~/utils/evolutionCheck'
import type { EvolutionTrigger } from '~/types/species'
import type { EvolutionStats } from '~/utils/evolutionCheck'

// Re-export for backward compatibility
export { validateBaseRelations }
export type Stats = EvolutionStats

export interface StatRecalculationResult {
  valid: boolean
  error?: string
  natureAdjustedBase: Stats
  calculatedStats: Stats
  maxHp: number
  violations: string[]
}

export interface EvolutionChanges {
  previousSpecies: string
  newSpecies: string
  previousTypes: string[]
  newTypes: string[]
  previousBaseStats: Stats
  newBaseStats: Stats
  previousMaxHp: number
  newMaxHp: number
  previousAbilities: Array<{ name: string; effect: string }>
  newAbilities: Array<{ name: string; effect: string }>
  previousCapabilities: Record<string, unknown>
  newCapabilities: Record<string, unknown>
  previousSkills: Record<string, string>
  newSkills: Record<string, string>
  previousSize: string
  newSize: string
}

/** Complete pre-evolution snapshot for undo support */
export interface PokemonSnapshot {
  species: string
  type1: string
  type2: string | null
  baseHp: number
  baseAttack: number
  baseDefense: number
  baseSpAtk: number
  baseSpDef: number
  baseSpeed: number
  currentAttack: number
  currentDefense: number
  currentSpAtk: number
  currentSpDef: number
  currentSpeed: number
  maxHp: number
  currentHp: number
  spriteUrl: string | null
  abilities: string
  moves: string
  capabilities: string
  skills: string
  heldItem: string | null
  notes: string | null
  /** P2 fix: Track consumed stone details for undo restoration */
  consumedStone?: {
    ownerId: string
    itemName: string
  } | null
}

export interface EvolutionResult {
  success: boolean
  pokemon: Record<string, unknown>
  changes: EvolutionChanges
  /** P2: Pre-evolution snapshot for undo support */
  undoSnapshot: PokemonSnapshot
}

export interface ConsumeItemInput {
  /** Trainer whose inventory to consume from */
  ownerId: string
  /** Item name to consume (e.g., "Water Stone") */
  itemName: string
  /** GM override: skip inventory check, allow evolution without the item */
  skipInventoryCheck?: boolean
}

export interface PerformEvolutionInput {
  pokemonId: string
  targetSpecies: string
  statPoints: Stats
  skipBaseRelations?: boolean
  /** P1: GM-resolved abilities override (if not provided, auto-remap positionally) */
  abilities?: Array<{ name: string; effect: string }>
  /** P1: Final move list after learning/replacing (if not provided, keep current moves) */
  moves?: Array<Record<string, unknown>>
  /** P2: Stone consumption from trainer inventory */
  consumeItem?: ConsumeItemInput
  /** P2: Whether to consume the held item after evolution (default true for held-item triggers) */
  consumeHeldItem?: boolean
}

// ============================================
// STAT FUNCTIONS
// ============================================

/**
 * Extract the stat point allocation from a Pokemon's current state.
 *
 * Pokemon.baseHp etc. stores NATURE-ADJUSTED base stats (not raw species base).
 * Pokemon.currentAttack etc. are calculated stats (base + added points).
 * Stat points allocated = calculated stat - nature-adjusted base stat.
 *
 * For HP: maxHp = level + (hpStat * 3) + 10
 * So: hpStat = (maxHp - level - 10) / 3
 * And: hpStatPoints = hpStat - baseHp
 */
export function extractStatPoints(pokemon: {
  baseHp: number
  baseAttack: number
  baseDefense: number
  baseSpAtk: number
  baseSpDef: number
  baseSpeed: number
  currentAttack: number
  currentDefense: number
  currentSpAtk: number
  currentSpDef: number
  currentSpeed: number
  maxHp: number
  level: number
}): Stats {
  const hpStat = Math.round((pokemon.maxHp - pokemon.level - 10) / 3)
  return {
    hp: hpStat - pokemon.baseHp,
    attack: pokemon.currentAttack - pokemon.baseAttack,
    defense: pokemon.currentDefense - pokemon.baseDefense,
    specialAttack: pokemon.currentSpAtk - pokemon.baseSpAtk,
    specialDefense: pokemon.currentSpDef - pokemon.baseSpDef,
    speed: pokemon.currentSpeed - pokemon.baseSpeed
  }
}

/**
 * Recalculate stats for a new species after evolution.
 *
 * 1. Apply nature to new species' raw base stats
 * 2. Validate stat points total = level + 10
 * 3. Validate Base Relations Rule (decree-035)
 * 4. Calculate final stats and max HP
 */
export function recalculateStats(input: {
  newSpeciesBaseStats: Stats
  natureName: string
  level: number
  statPoints: Stats
}): StatRecalculationResult {
  const { newSpeciesBaseStats, natureName, level, statPoints } = input

  // 1. Apply nature to new base stats
  const natureAdjusted = applyNatureToBaseStats(newSpeciesBaseStats, natureName)

  // 2. Validate stat points total = level + 10
  const statKeys = ['hp', 'attack', 'defense', 'specialAttack', 'specialDefense', 'speed'] as const
  const total = statKeys.reduce((sum, key) => sum + statPoints[key], 0)
  const expectedTotal = level + 10
  if (total !== expectedTotal) {
    return {
      valid: false,
      error: `Stat points must total ${expectedTotal}, got ${total}`,
      natureAdjustedBase: natureAdjusted,
      calculatedStats: { hp: 0, attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0 },
      maxHp: 0,
      violations: []
    }
  }

  // 3. Validate no negative stat points
  for (const key of statKeys) {
    if (statPoints[key] < 0) {
      return {
        valid: false,
        error: `Stat points for ${key} cannot be negative (got ${statPoints[key]})`,
        natureAdjustedBase: natureAdjusted,
        calculatedStats: { hp: 0, attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0 },
        maxHp: 0,
        violations: []
      }
    }
  }

  // 4. Validate Base Relations Rule
  const violations = validateBaseRelations(natureAdjusted, statPoints)

  // 5. Calculate final stats
  const calculatedStats: Stats = {
    hp: natureAdjusted.hp + statPoints.hp,
    attack: natureAdjusted.attack + statPoints.attack,
    defense: natureAdjusted.defense + statPoints.defense,
    specialAttack: natureAdjusted.specialAttack + statPoints.specialAttack,
    specialDefense: natureAdjusted.specialDefense + statPoints.specialDefense,
    speed: natureAdjusted.speed + statPoints.speed
  }

  // 6. Calculate max HP: level + (hpStat * 3) + 10
  const maxHp = level + (calculatedStats.hp * 3) + 10

  return {
    valid: true,
    natureAdjustedBase: natureAdjusted,
    calculatedStats,
    maxHp,
    violations
  }
}

// ============================================
// ABILITY REMAPPING (R032)
// ============================================

export interface AbilityRemapResult {
  /** Automatically remapped abilities (positional match found) */
  remappedAbilities: Array<{ name: string; effect: string; oldName: string }>
  /** Abilities that need GM decision (index mismatch or missing in new list) */
  needsResolution: Array<{
    oldAbility: string
    reason: string
    options: Array<{ name: string; effect: string }>
  }>
  /** Non-species abilities preserved as-is (not found in old species list) */
  preservedAbilities: Array<{ name: string; effect: string }>
}

/**
 * Remap a Pokemon's abilities from the old species' ability list to the new species'.
 *
 * PTU p.202: "Abilities change to match the Ability in the same spot
 * in the Evolution's Ability List."
 *
 * Algorithm:
 * 1. For each current ability, find its index in the old species' ability list
 * 2. If found and a corresponding index exists in the new list, remap positionally
 * 3. If found but index >= new list length, flag for GM resolution
 * 4. If not found in old list, preserve as-is (non-species ability, e.g. from Features)
 *
 * Pure function — no DB access.
 */
export function remapAbilities(
  currentAbilities: Array<{ name: string; effect: string }>,
  oldSpeciesAbilities: string[],
  newSpeciesAbilities: string[]
): AbilityRemapResult {
  const remappedAbilities: AbilityRemapResult['remappedAbilities'] = []
  const needsResolution: AbilityRemapResult['needsResolution'] = []
  const preservedAbilities: AbilityRemapResult['preservedAbilities'] = []

  for (const ability of currentAbilities) {
    const oldIndex = oldSpeciesAbilities.findIndex(
      name => name.toLowerCase() === ability.name.toLowerCase()
    )

    if (oldIndex === -1) {
      // Not in old species list — preserve as-is (Feature-granted or custom)
      preservedAbilities.push({ ...ability })
    } else if (oldIndex < newSpeciesAbilities.length) {
      // Positional match exists in new species
      remappedAbilities.push({
        name: newSpeciesAbilities[oldIndex],
        effect: '', // Effect will be looked up from AbilityData
        oldName: ability.name
      })
    } else {
      // Old index out of bounds for new species list — GM must choose
      needsResolution.push({
        oldAbility: ability.name,
        reason: `Ability slot ${oldIndex + 1} does not exist in the new species' ability list`,
        options: newSpeciesAbilities.map(name => ({ name, effect: '' }))
      })
    }
  }

  return { remappedAbilities, needsResolution, preservedAbilities }
}

/**
 * Look up effect text for an ability from the AbilityData table.
 */
export async function lookupAbilityEffect(abilityName: string): Promise<string> {
  const ability = await prisma.abilityData.findUnique({ where: { name: abilityName } })
  return ability?.effect ?? ''
}

/**
 * Enrich ability entries with their effect text from AbilityData.
 * Uses a single batch query instead of N sequential lookups.
 * Returns new array (does not mutate input).
 */
export async function enrichAbilityEffects(
  abilities: Array<{ name: string; effect: string }>
): Promise<Array<{ name: string; effect: string }>> {
  if (abilities.length === 0) return []

  const names = abilities.map(a => a.name)
  const abilityRecords = await prisma.abilityData.findMany({
    where: { name: { in: names } },
    select: { name: true, effect: true }
  })

  const effectMap = new Map(
    abilityRecords.map(r => [r.name.toLowerCase(), r.effect])
  )

  return abilities.map(ability => ({
    name: ability.name,
    effect: effectMap.get(ability.name.toLowerCase()) || ability.effect
  }))
}

// ============================================
// ITEM CONSUMPTION (P2)
// ============================================

interface InventoryItem {
  name: string
  quantity: number
  [key: string]: unknown
}

/**
 * Consume a stone (or other item) from a trainer's inventory.
 * Decrements quantity by 1, removes entry if quantity reaches 0.
 * Throws if the item is not found in inventory.
 */
export async function consumeStoneFromInventory(ownerId: string, itemName: string): Promise<void> {
  const trainer = await prisma.humanCharacter.findUnique({
    where: { id: ownerId },
    select: { inventory: true }
  })
  if (!trainer) {
    throw new Error(`Trainer not found: ${ownerId}`)
  }

  const inventory: InventoryItem[] = JSON.parse(trainer.inventory || '[]')
  const itemIndex = inventory.findIndex(
    item => item.name.toLowerCase() === itemName.toLowerCase()
  )
  if (itemIndex === -1) {
    throw new Error(`${itemName} not found in trainer's inventory`)
  }

  const newInventory = inventory.map((item, idx) => {
    if (idx !== itemIndex) return item
    return { ...item, quantity: item.quantity - 1 }
  }).filter(item => item.quantity > 0)

  await prisma.humanCharacter.update({
    where: { id: ownerId },
    data: { inventory: JSON.stringify(newInventory) }
  })
}

/**
 * Restore a stone (or other item) to a trainer's inventory.
 * Increments quantity by 1, or adds a new entry if the item is not in inventory.
 * Used during evolution undo to reverse stone consumption.
 */
export async function restoreStoneToInventory(ownerId: string, itemName: string): Promise<void> {
  const trainer = await prisma.humanCharacter.findUnique({
    where: { id: ownerId },
    select: { inventory: true }
  })
  if (!trainer) {
    throw new Error(`Trainer not found: ${ownerId}`)
  }

  const inventory: InventoryItem[] = JSON.parse(trainer.inventory || '[]')
  const itemIndex = inventory.findIndex(
    item => item.name.toLowerCase() === itemName.toLowerCase()
  )

  let newInventory: InventoryItem[]
  if (itemIndex >= 0) {
    // Item exists — increment quantity
    newInventory = inventory.map((item, idx) => {
      if (idx !== itemIndex) return item
      return { ...item, quantity: item.quantity + 1 }
    })
  } else {
    // Item not in inventory — add new entry
    newInventory = [...inventory, { name: itemName, quantity: 1 }]
  }

  await prisma.humanCharacter.update({
    where: { id: ownerId },
    data: { inventory: JSON.stringify(newInventory) }
  })
}

// ============================================
// EVOLUTION EXECUTION
// ============================================

/**
 * Perform a Pokemon evolution. Orchestrates all changes.
 *
 * 1. Fetch the Pokemon and validate it exists
 * 2. Fetch current species and validate evolution trigger
 * 3. Fetch target species data
 * 4. Recalculate stats with new species base stats + existing nature
 * 5. Calculate current HP proportionally
 * 6. Write the update to DB
 */
export async function performEvolution(input: PerformEvolutionInput): Promise<EvolutionResult> {
  const { pokemonId, targetSpecies, statPoints, skipBaseRelations } = input

  // 1. Fetch the Pokemon
  const pokemon = await prisma.pokemon.findUnique({ where: { id: pokemonId } })
  if (!pokemon) {
    throw new Error('Pokemon not found')
  }

  // 2. Fetch current species data (for evolution trigger validation)
  const currentSpecies = await prisma.speciesData.findUnique({ where: { name: pokemon.species } })
  if (!currentSpecies) {
    throw new Error('Current species data not found')
  }

  // 3. Validate evolution is possible (trigger check)
  const triggers: EvolutionTrigger[] = JSON.parse(currentSpecies.evolutionTriggers || '[]')
  const trigger = triggers.find(t => t.toSpecies === targetSpecies)
  if (!trigger) {
    throw new Error(`${pokemon.species} cannot evolve into ${targetSpecies}`)
  }

  // Validate level requirement
  if (trigger.minimumLevel !== null && pokemon.level < trigger.minimumLevel) {
    throw new Error(`Pokemon must be at least level ${trigger.minimumLevel} to evolve (current: ${pokemon.level})`)
  }

  // Validate held item requirement
  if (trigger.requiredItem !== null && trigger.itemMustBeHeld) {
    if (!pokemon.heldItem || pokemon.heldItem.toLowerCase() !== trigger.requiredItem.toLowerCase()) {
      throw new Error(`Pokemon must be holding ${trigger.requiredItem} to evolve`)
    }
  }

  // P2: Validate gender requirement
  if (trigger.requiredGender) {
    if (!pokemon.gender || pokemon.gender.toLowerCase() !== trigger.requiredGender.toLowerCase()) {
      throw new Error(`This evolution requires ${trigger.requiredGender} gender (Pokemon is ${pokemon.gender || 'Genderless'})`)
    }
  }

  // P2: Validate move requirement
  if (trigger.requiredMove) {
    const currentMoves: Array<{ name: string }> = JSON.parse(pokemon.moves || '[]')
    const knownMoveNames = currentMoves.map(m => m.name.toLowerCase())
    if (!knownMoveNames.includes(trigger.requiredMove.toLowerCase())) {
      throw new Error(`Pokemon must know ${trigger.requiredMove} to evolve`)
    }
  }

  // 3b. Capture pre-evolution snapshot for undo (P2)
  const undoSnapshot: PokemonSnapshot = {
    species: pokemon.species,
    type1: pokemon.type1,
    type2: pokemon.type2,
    baseHp: pokemon.baseHp,
    baseAttack: pokemon.baseAttack,
    baseDefense: pokemon.baseDefense,
    baseSpAtk: pokemon.baseSpAtk,
    baseSpDef: pokemon.baseSpDef,
    baseSpeed: pokemon.baseSpeed,
    currentAttack: pokemon.currentAttack,
    currentDefense: pokemon.currentDefense,
    currentSpAtk: pokemon.currentSpAtk,
    currentSpDef: pokemon.currentSpDef,
    currentSpeed: pokemon.currentSpeed,
    maxHp: pokemon.maxHp,
    currentHp: pokemon.currentHp,
    spriteUrl: pokemon.spriteUrl,
    abilities: pokemon.abilities,
    moves: pokemon.moves,
    capabilities: pokemon.capabilities,
    skills: pokemon.skills,
    heldItem: pokemon.heldItem,
    notes: pokemon.notes,
    consumedStone: null
  }

  // 4. Fetch the target species data
  const targetSpeciesData = await prisma.speciesData.findUnique({ where: { name: targetSpecies } })
  if (!targetSpeciesData) {
    throw new Error(`Target species data not found: ${targetSpecies}`)
  }

  // 5. Recalculate stats
  const nature: { name: string } = JSON.parse(pokemon.nature)
  const newBaseStats: Stats = {
    hp: targetSpeciesData.baseHp,
    attack: targetSpeciesData.baseAttack,
    defense: targetSpeciesData.baseDefense,
    specialAttack: targetSpeciesData.baseSpAtk,
    specialDefense: targetSpeciesData.baseSpDef,
    speed: targetSpeciesData.baseSpeed
  }

  const recalc = recalculateStats({
    newSpeciesBaseStats: newBaseStats,
    natureName: nature.name,
    level: pokemon.level,
    statPoints
  })

  if (!recalc.valid) {
    throw new Error(recalc.error)
  }

  if (recalc.violations.length > 0 && !skipBaseRelations) {
    throw new Error(`Base Relations violated: ${recalc.violations.join('; ')}`)
  }

  // 6. Calculate current HP proportionally
  const oldMaxHp = pokemon.maxHp
  const oldCurrentHp = pokemon.currentHp
  const hpRatio = oldMaxHp > 0 ? oldCurrentHp / oldMaxHp : 1
  const newCurrentHp = Math.max(1, Math.round(hpRatio * recalc.maxHp))

  // Build previous state for changes diff
  const previousBaseStats: Stats = {
    hp: pokemon.baseHp,
    attack: pokemon.baseAttack,
    defense: pokemon.baseDefense,
    specialAttack: pokemon.baseSpAtk,
    specialDefense: pokemon.baseSpDef,
    speed: pokemon.baseSpeed
  }
  const previousTypes = [pokemon.type1, pokemon.type2].filter(Boolean) as string[]
  const newTypes = [targetSpeciesData.type1, targetSpeciesData.type2].filter(Boolean) as string[]

  // 7. Ability remapping (R032)
  const previousAbilities: Array<{ name: string; effect: string }> = JSON.parse(pokemon.abilities || '[]')
  let finalAbilities: Array<{ name: string; effect: string }>

  if (input.abilities) {
    // GM provided explicit ability selection
    finalAbilities = input.abilities
  } else {
    // Auto-remap positionally
    const oldSpeciesAbilities: string[] = JSON.parse(currentSpecies.abilities || '[]')
    const newSpeciesAbilities: string[] = JSON.parse(targetSpeciesData.abilities || '[]')
    const abilityResult = remapAbilities(previousAbilities, oldSpeciesAbilities, newSpeciesAbilities)
    finalAbilities = [...abilityResult.remappedAbilities, ...abilityResult.preservedAbilities]
  }

  // Enrich ability effects from AbilityData
  finalAbilities = await enrichAbilityEffects(finalAbilities)

  // 8. Move updates (R033)
  const previousMoves = pokemon.moves
  const finalMoves = input.moves
    ? JSON.stringify(input.moves)
    : previousMoves // Keep current moves if not overridden

  // 9. Capability and skill updates (R034)
  const previousCapabilities: Record<string, unknown> = JSON.parse(pokemon.capabilities || '{}')
  const previousSkills: Record<string, string> = JSON.parse(pokemon.skills || '{}')
  const previousSize = (previousCapabilities.size as string) || 'Medium'

  const newCapabilities: Record<string, unknown> = {
    overland: targetSpeciesData.overland,
    swim: targetSpeciesData.swim,
    sky: targetSpeciesData.sky,
    burrow: targetSpeciesData.burrow,
    levitate: targetSpeciesData.levitate,
    teleport: targetSpeciesData.teleport,
    power: targetSpeciesData.power,
    jump: { high: targetSpeciesData.jumpHigh, long: targetSpeciesData.jumpLong },
    weightClass: targetSpeciesData.weightClass,
    size: targetSpeciesData.size || 'Medium',
    otherCapabilities: JSON.parse(targetSpeciesData.capabilities || '[]')
  }

  const newSkills: Record<string, string> = JSON.parse(targetSpeciesData.skills || '{}')
  const newSize = targetSpeciesData.size || 'Medium'

  // 10. Determine whether to consume held item
  // Default: consume held item for held-item triggers unless explicitly overridden
  const shouldConsumeHeldItem = trigger.itemMustBeHeld && trigger.requiredItem !== null
    && (input.consumeHeldItem !== false)

  // 11. Build evolution history note (prepend to existing notes)
  const dateStr = new Date().toISOString().split('T')[0]
  const evolutionNote = `[Evolved from ${pokemon.species} at Level ${pokemon.level} on ${dateStr}]`
  const existingNotes = pokemon.notes || ''
  const updatedNotes = existingNotes
    ? `${evolutionNote}\n${existingNotes}`
    : evolutionNote

  // 12. Write Pokemon update + consume stone in a single transaction
  //     Ensures atomicity: if stone consumption fails, the evolution is rolled back.
  const shouldConsumeStone = input.consumeItem && !input.consumeItem.skipInventoryCheck
  const updated = await prisma.$transaction(async (tx) => {
    const pokemonResult = await tx.pokemon.update({
      where: { id: pokemonId },
      data: {
        species: targetSpecies,
        type1: targetSpeciesData.type1,
        type2: targetSpeciesData.type2 || null,
        baseHp: recalc.natureAdjustedBase.hp,
        baseAttack: recalc.natureAdjustedBase.attack,
        baseDefense: recalc.natureAdjustedBase.defense,
        baseSpAtk: recalc.natureAdjustedBase.specialAttack,
        baseSpDef: recalc.natureAdjustedBase.specialDefense,
        baseSpeed: recalc.natureAdjustedBase.speed,
        currentAttack: recalc.calculatedStats.attack,
        currentDefense: recalc.calculatedStats.defense,
        currentSpAtk: recalc.calculatedStats.specialAttack,
        currentSpDef: recalc.calculatedStats.specialDefense,
        currentSpeed: recalc.calculatedStats.speed,
        maxHp: recalc.maxHp,
        currentHp: newCurrentHp,
        spriteUrl: null,
        abilities: JSON.stringify(finalAbilities),
        moves: finalMoves,
        capabilities: JSON.stringify(newCapabilities),
        skills: JSON.stringify(newSkills),
        notes: updatedNotes,
        // P2: Clear held item if consumed for held-item evolution
        ...(shouldConsumeHeldItem ? { heldItem: null } : {})
      }
    })

    // Consume stone from trainer inventory within the same transaction
    if (shouldConsumeStone) {
      const trainer = await tx.humanCharacter.findUnique({
        where: { id: input.consumeItem!.ownerId },
        select: { inventory: true }
      })
      if (!trainer) {
        throw new Error(`Trainer not found: ${input.consumeItem!.ownerId}`)
      }

      const inventory: Array<{ name: string; quantity: number; [key: string]: unknown }> = JSON.parse(trainer.inventory || '[]')
      const itemIndex = inventory.findIndex(
        item => item.name.toLowerCase() === input.consumeItem!.itemName.toLowerCase()
      )
      if (itemIndex === -1) {
        throw new Error(`${input.consumeItem!.itemName} not found in trainer's inventory`)
      }

      const newInventory = inventory.map((item, idx) => {
        if (idx !== itemIndex) return item
        return { ...item, quantity: item.quantity - 1 }
      }).filter(item => item.quantity > 0)

      await tx.humanCharacter.update({
        where: { id: input.consumeItem!.ownerId },
        data: { inventory: JSON.stringify(newInventory) }
      })

      // Track consumed stone in undo snapshot for restoration during undo
      undoSnapshot.consumedStone = {
        ownerId: input.consumeItem!.ownerId,
        itemName: input.consumeItem!.itemName
      }
    }

    return pokemonResult
  })

  const changes: EvolutionChanges = {
    previousSpecies: pokemon.species,
    newSpecies: targetSpecies,
    previousTypes,
    newTypes,
    previousBaseStats,
    newBaseStats: recalc.natureAdjustedBase,
    previousMaxHp: oldMaxHp,
    newMaxHp: recalc.maxHp,
    previousAbilities,
    newAbilities: finalAbilities,
    previousCapabilities,
    newCapabilities,
    previousSkills,
    newSkills,
    previousSize,
    newSize
  }

  return {
    success: true,
    pokemon: updated as unknown as Record<string, unknown>,
    changes,
    undoSnapshot
  }
}
