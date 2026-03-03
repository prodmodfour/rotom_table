/**
 * Pokemon Generator Service
 * Shared logic for generating wild/template/scene Pokemon with full character sheets.
 * Consolidates duplicated generation code from wild-spawn.post.ts, from-scene.post.ts, and load.post.ts.
 */

import { prisma } from '~/server/utils/prisma'
import { resolveNickname } from '~/server/utils/pokemon-nickname'
import type { PokemonOrigin } from '~/types/character'
import type { Combatant, Pokemon, CombatSide } from '~/types'
import { sizeToTokenSize } from '~/server/services/grid-placement.service'
import { buildCombatantFromEntity } from '~/server/services/combatant.service'
import { NATURE_TABLE, applyNatureToBaseStats } from '~/constants/natures'

// --- Input / Output types ---

export interface GeneratePokemonInput {
  speciesName: string
  level: number
  nickname?: string | null
  origin: PokemonOrigin
  originLabel?: string          // stored in notes field
  overrideMoves?: MoveDetail[]  // template preservation: skip auto-selection
  overrideAbilities?: Array<{ name: string; effect: string }> // template preservation: skip random pick
}

export interface MoveDetail {
  name: string
  type: string
  damageClass: string
  frequency: string
  ac: number | null
  damageBase: number | null
  range: string
  effect: string
}

export interface GeneratedPokemonData {
  species: string
  level: number
  nickname: string | null
  types: string[]
  baseStats: {
    hp: number; attack: number; defense: number
    specialAttack: number; specialDefense: number; speed: number
  }
  calculatedStats: {
    hp: number; attack: number; defense: number
    specialAttack: number; specialDefense: number; speed: number
  }
  maxHp: number
  moves: MoveDetail[]
  abilities: Array<{ name: string; effect: string }>
  gender: string
  movementCaps: { overland: number; swim: number; sky: number; burrow: number; levitate: number; teleport: number }
  power: number
  jump: { high: number; long: number }
  weightClass: number
  otherCapabilities: string[]
  skills: Record<string, string>
  eggGroups: string[]
  size: string
  tutorPoints: number
  // Optional overrides for import-specific data (CSV imports preserve these from the sheet)
  nature?: { name: string; raisedStat: string | null; loweredStat: string | null }
  shiny?: boolean
  heldItem?: string | null
}

export interface CreatedPokemon {
  id: string
  species: string
  level: number
  nickname: string | null
  origin: PokemonOrigin
  data: GeneratedPokemonData
}

// --- Core functions ---

/**
 * Generate full Pokemon data from species + level.
 * Pure data generation — no DB writes.
 */
export async function generatePokemonData(input: GeneratePokemonInput): Promise<GeneratedPokemonData> {
  // Look up species reference data
  const speciesData = await prisma.speciesData.findUnique({
    where: { name: input.speciesName }
  })

  // Defaults if species not found
  let baseStats = { hp: 5, attack: 5, defense: 5, specialAttack: 5, specialDefense: 5, speed: 5 }
  let types: string[] = ['Normal']
  let abilityNames: string[] = []
  let numBasicAbilities = 2
  let learnset: Array<{ level: number; move: string }> = []
  let skills: Record<string, string> = {}
  let otherCapabilities: string[] = []
  let movementCaps = { overland: 5, swim: 0, sky: 0, burrow: 0, levitate: 0, teleport: 0 }
  let eggGroups: string[] = []
  let size = 'Medium'
  let power = 1
  let jump = { high: 1, long: 1 }
  let weightClass = 1

  if (speciesData) {
    baseStats = {
      hp: speciesData.baseHp,
      attack: speciesData.baseAttack,
      defense: speciesData.baseDefense,
      specialAttack: speciesData.baseSpAtk,
      specialDefense: speciesData.baseSpDef,
      speed: speciesData.baseSpeed
    }
    types = speciesData.type2 ? [speciesData.type1, speciesData.type2] : [speciesData.type1]
    abilityNames = JSON.parse(speciesData.abilities)
    numBasicAbilities = speciesData.numBasicAbilities
    learnset = JSON.parse(speciesData.learnset || '[]')
    skills = JSON.parse(speciesData.skills || '{}')
    otherCapabilities = JSON.parse(speciesData.capabilities || '[]')
    movementCaps = {
      overland: speciesData.overland,
      swim: speciesData.swim,
      sky: speciesData.sky,
      burrow: speciesData.burrow,
      levitate: speciesData.levitate,
      teleport: speciesData.teleport
    }
    eggGroups = JSON.parse(speciesData.eggGroups || '[]')
    size = speciesData.size || 'Medium'
    power = speciesData.power
    jump = { high: speciesData.jumpHigh, long: speciesData.jumpLong }
    weightClass = speciesData.weightClass
  }

  // Select random nature and apply modifiers to base stats (PTU Chapter 5)
  // Nature modifiers: +2/-2 for non-HP stats, +1/-1 for HP, minimum 1
  const natureNames = Object.keys(NATURE_TABLE)
  const selectedNature = natureNames[Math.floor(Math.random() * natureNames.length)]
  const natureEntry = NATURE_TABLE[selectedNature]
  const natureData = {
    name: selectedNature,
    raisedStat: natureEntry.raise === natureEntry.lower ? null : natureEntry.raise,
    loweredStat: natureEntry.raise === natureEntry.lower ? null : natureEntry.lower
  }
  const adjustedBaseStats = applyNatureToBaseStats(baseStats, selectedNature)

  // Distribute stat points weighted by nature-adjusted base stats (PTU: level + 10 points)
  const calculatedStats = distributeStatPoints(adjustedBaseStats, input.level)

  // HP formula: Level + (HP stat * 3) + 10
  const maxHp = input.level + (calculatedStats.hp * 3) + 10

  // Moves: use overrides if provided, otherwise auto-select from learnset
  const moves = input.overrideMoves
    ? input.overrideMoves
    : await selectMovesFromLearnset(learnset, input.level)

  // Abilities: use overrides if provided, otherwise pick random from species
  const abilities = input.overrideAbilities
    ? input.overrideAbilities
    : pickRandomAbility(abilityNames, numBasicAbilities)

  // Random gender
  const gender = ['Male', 'Female'][Math.floor(Math.random() * 2)]

  // Tutor points: 1 base + 1 per 5 levels (PTU: "starts with a single Tutor Point" + more every 5 levels)
  const tutorPoints = 1 + Math.floor(input.level / 5)

  return {
    species: input.speciesName,
    level: input.level,
    nickname: input.nickname ?? null,
    types,
    baseStats: adjustedBaseStats,
    calculatedStats,
    maxHp,
    moves,
    abilities,
    gender,
    movementCaps,
    power,
    jump,
    weightClass,
    otherCapabilities,
    skills,
    eggGroups,
    size,
    tutorPoints,
    nature: natureData
  }
}

/**
 * Create a Pokemon DB record from generated data.
 * Always sets isInLibrary: true (visible in sheets).
 */
/**
 * Map Pokemon origin to starting loyalty value (PTU Chapter 10).
 * Captured wild: 2 (Wary), Traded: 1 (Resistant), Bred/Egg: 4 (Friendly),
 * Default (GM-created): 3 (Neutral).
 */
function getStartingLoyalty(origin: PokemonOrigin): number {
  switch (origin) {
    case 'captured': return 2  // Wary — freshly captured wild Pokemon
    case 'wild':     return 2  // Wary — wild spawns treated as captured if assigned to trainer
    default:         return 3  // Neutral — manual, template, import
  }
}

export async function createPokemonRecord(
  input: GeneratePokemonInput,
  data: GeneratedPokemonData
): Promise<CreatedPokemon> {
  const pokemon = await prisma.pokemon.create({
    data: {
      species: data.species,
      nickname: await resolveNickname(data.species, data.nickname),
      level: data.level,
      experience: 0,
      nature: JSON.stringify(data.nature ?? { name: 'Hardy', raisedStat: null, loweredStat: null }),
      type1: data.types[0],
      type2: data.types[1] || null,
      baseHp: data.baseStats.hp,
      baseAttack: data.baseStats.attack,
      baseDefense: data.baseStats.defense,
      baseSpAtk: data.baseStats.specialAttack,
      baseSpDef: data.baseStats.specialDefense,
      baseSpeed: data.baseStats.speed,
      currentHp: data.maxHp,
      maxHp: data.maxHp,
      currentAttack: data.calculatedStats.attack,
      currentDefense: data.calculatedStats.defense,
      currentSpAtk: data.calculatedStats.specialAttack,
      currentSpDef: data.calculatedStats.specialDefense,
      currentSpeed: data.calculatedStats.speed,
      stageModifiers: JSON.stringify({
        attack: 0, defense: 0, specialAttack: 0,
        specialDefense: 0, speed: 0, accuracy: 0, evasion: 0
      }),
      abilities: JSON.stringify(data.abilities),
      moves: JSON.stringify(data.moves),
      heldItem: data.heldItem ?? null,
      capabilities: JSON.stringify({
        ...data.movementCaps,
        power: data.power,
        jump: data.jump,
        weightClass: data.weightClass,
        size: data.size,
        otherCapabilities: data.otherCapabilities
      }),
      skills: JSON.stringify(data.skills),
      eggGroups: JSON.stringify(data.eggGroups),
      statusConditions: JSON.stringify([]),
      gender: data.gender,
      shiny: data.shiny ?? false,
      tutorPoints: data.tutorPoints,
      isInLibrary: true,
      origin: input.origin,
      loyalty: getStartingLoyalty(input.origin),
      notes: input.originLabel || null
    }
  })

  return {
    id: pokemon.id,
    species: pokemon.species,
    level: pokemon.level,
    nickname: pokemon.nickname,
    origin: input.origin,
    data
  }
}

/**
 * Generate a Pokemon and create its DB record in one call.
 * Primary entry point for most callers.
 */
export async function generateAndCreatePokemon(input: GeneratePokemonInput): Promise<CreatedPokemon> {
  const data = await generatePokemonData(input)
  return createPokemonRecord(input, data)
}

// --- Combatant builder ---

/**
 * Map a freshly created Pokemon into a full Pokemon entity.
 * Uses defaults for fields not present in CreatedPokemon (experience, nature, etc.).
 * The DB record (Pokemon table) holds canonical values; this entity is embedded in
 * the encounter's combatants JSON for combat use.
 */
function createdPokemonToEntity(pokemon: CreatedPokemon): Pokemon {
  const { data } = pokemon
  return {
    id: pokemon.id,
    species: data.species,
    nickname: data.nickname,
    level: data.level,
    experience: 0,
    nature: data.nature ?? { name: 'Hardy', raisedStat: null, loweredStat: null },
    types: data.types as Pokemon['types'],
    baseStats: data.baseStats,
    currentStats: {
      hp: data.maxHp,
      attack: data.calculatedStats.attack,
      defense: data.calculatedStats.defense,
      specialAttack: data.calculatedStats.specialAttack,
      specialDefense: data.calculatedStats.specialDefense,
      speed: data.calculatedStats.speed
    },
    currentHp: data.maxHp,
    maxHp: data.maxHp,
    stageModifiers: {
      attack: 0, defense: 0, specialAttack: 0,
      specialDefense: 0, speed: 0, accuracy: 0, evasion: 0
    },
    abilities: data.abilities as Pokemon['abilities'],
    moves: data.moves as unknown as Pokemon['moves'],
    capabilities: {
      ...data.movementCaps,
      power: data.power,
      jump: data.jump,
      weightClass: data.weightClass,
      size: data.size,
      otherCapabilities: data.otherCapabilities
    } as Pokemon['capabilities'],
    skills: data.skills,
    statusConditions: [],
    injuries: 0,
    temporaryHp: 0,
    restMinutesToday: 0,
    lastInjuryTime: null,
    injuriesHealedToday: 0,
    tutorPoints: data.tutorPoints,
    trainingExp: 0,
    eggGroups: data.eggGroups,
    loyalty: getStartingLoyalty(pokemon.origin),
    shiny: data.shiny ?? false,
    gender: data.gender as Pokemon['gender'],
    isInLibrary: true,
    origin: pokemon.origin
  }
}

/**
 * Build a combatant wrapper from a created Pokemon.
 * Delegates to buildCombatantFromEntity() — the single canonical combatant builder.
 */
export function buildPokemonCombatant(
  pokemon: CreatedPokemon,
  side: string,
  position?: { x: number; y: number }
): Combatant {
  const entity = createdPokemonToEntity(pokemon)
  const tokenSize = sizeToTokenSize(pokemon.data.size)

  return buildCombatantFromEntity({
    entityType: 'pokemon',
    entityId: pokemon.id,
    entity,
    side: side as CombatSide,
    position,
    tokenSize
  })
}

// --- Internal helpers ---

/**
 * Distribute (level + 10) stat points weighted by base stats,
 * then enforce the Base Relations Rule (PTU Core Chapter 5).
 *
 * Base Relations: the ordering of a Pokemon's base stats from highest to lowest
 * must be maintained after adding stat points.  Stats with equal base values
 * form a "tier" and may end up in any order relative to each other.
 */
function distributeStatPoints(
  baseStats: { hp: number; attack: number; defense: number; specialAttack: number; specialDefense: number; speed: number },
  level: number
): { hp: number; attack: number; defense: number; specialAttack: number; specialDefense: number; speed: number } {
  const statKeys = ['hp', 'attack', 'defense', 'specialAttack', 'specialDefense', 'speed'] as const
  const totalBaseStats = statKeys.reduce((sum, key) => sum + baseStats[key], 0)
  const distributedPoints: Record<string, number> = {
    hp: 0, attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0
  }

  let remainingPoints = Math.max(0, level + 10)
  while (remainingPoints > 0) {
    const roll = Math.random() * totalBaseStats
    let cumulative = 0
    for (const key of statKeys) {
      cumulative += baseStats[key]
      if (roll < cumulative) {
        distributedPoints[key]++
        remainingPoints--
        break
      }
    }
  }

  // Enforce Base Relations: sort added points so higher base stats get >= added points
  // than lower base stats.  Equal base stats may receive any distribution.
  const enforced = enforceBaseRelations(baseStats, distributedPoints, statKeys)

  return {
    hp: baseStats.hp + enforced.hp,
    attack: baseStats.attack + enforced.attack,
    defense: baseStats.defense + enforced.defense,
    specialAttack: baseStats.specialAttack + enforced.specialAttack,
    specialDefense: baseStats.specialDefense + enforced.specialDefense,
    speed: baseStats.speed + enforced.speed
  }
}

/**
 * Enforce the PTU Base Relations Rule on distributed stat points.
 *
 * Groups stats into tiers by base value (equal base = same tier).
 * Within each tier, keeps original random distribution.
 * Across tiers, redistributes added points so that every stat in a higher
 * tier has a final value >= every stat in a lower tier.
 *
 * Algorithm:
 * 1. Group stat keys by base value (descending).
 * 2. Sort the added-point values in descending order.
 * 3. Assign the sorted values to tiers top-down, preserving randomness
 *    within each tier by only sorting the slice assigned to that tier.
 */
function enforceBaseRelations(
  baseStats: Record<string, number>,
  distributedPoints: Record<string, number>,
  statKeys: readonly string[]
): Record<string, number> {
  // Build array of { key, base, added } and sort by base descending
  const entries = statKeys.map(key => ({
    key,
    base: baseStats[key],
    added: distributedPoints[key]
  }))

  // Sort entries by base stat descending (stable: preserves original order for ties)
  const sorted = [...entries].sort((a, b) => b.base - a.base)

  // Collect all added-point values sorted descending
  const addedValues = sorted.map(e => e.added).sort((a, b) => b - a)

  // Assign sorted added values to tiers.
  // A "tier" = consecutive entries with the same base stat.
  // Within a tier, we take the next N values from the sorted pool
  // but shuffle them so the within-tier assignment stays random.
  const result: Record<string, number> = {}
  let poolIndex = 0

  let i = 0
  while (i < sorted.length) {
    // Find the extent of this tier (all entries with the same base value)
    let tierEnd = i + 1
    while (tierEnd < sorted.length && sorted[tierEnd].base === sorted[i].base) {
      tierEnd++
    }
    const tierSize = tierEnd - i

    // Take the next tierSize values from the descending pool
    const tierValues = addedValues.slice(poolIndex, poolIndex + tierSize)
    poolIndex += tierSize

    // Shuffle within tier to preserve randomness for equal base stats
    for (let j = tierValues.length - 1; j > 0; j--) {
      const k = Math.floor(Math.random() * (j + 1))
      const temp = tierValues[j]
      tierValues[j] = tierValues[k]
      tierValues[k] = temp
    }

    // Assign to stat keys
    for (let j = 0; j < tierSize; j++) {
      result[sorted[i + j].key] = tierValues[j]
    }

    i = tierEnd
  }

  return result
}

/**
 * Select up to 6 most recent moves from learnset at or below the given level.
 * Fetches full MoveData for each; falls back to a stub if not found.
 */
async function selectMovesFromLearnset(
  learnset: Array<{ level: number; move: string }>,
  level: number
): Promise<MoveDetail[]> {
  const knownMoves = learnset
    .filter(entry => entry.level <= level)
    .slice(-6)

  const moveDetails: MoveDetail[] = []
  for (const moveEntry of knownMoves) {
    const moveData = await prisma.moveData.findUnique({
      where: { name: moveEntry.move }
    })
    if (moveData) {
      moveDetails.push({
        name: moveData.name,
        type: moveData.type,
        damageClass: moveData.damageClass,
        frequency: moveData.frequency,
        ac: moveData.ac,
        damageBase: moveData.damageBase,
        range: moveData.range,
        effect: moveData.effect
      })
    } else {
      moveDetails.push({
        name: moveEntry.move,
        type: 'Normal',
        damageClass: 'Status',
        frequency: 'At-Will',
        ac: null,
        damageBase: null,
        range: 'Melee',
        effect: ''
      })
    }
  }
  return moveDetails
}

/**
 * Pick a random Basic Ability for a newly generated Pokemon.
 * PTU rules: new Pokemon get one ability chosen from their Basic Abilities only.
 * Advanced Abilities are only available at Level 20+.
 */
function pickRandomAbility(abilityNames: string[], numBasicAbilities: number): Array<{ name: string; effect: string }> {
  if (abilityNames.length === 0) return []
  const basicCount = Math.min(numBasicAbilities, abilityNames.length)
  const pool = basicCount > 0 ? basicCount : abilityNames.length
  const selected = abilityNames[Math.floor(Math.random() * pool)]
  return [{ name: selected, effect: '' }]
}
