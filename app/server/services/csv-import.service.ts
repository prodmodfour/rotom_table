/**
 * CSV Import Service
 * Parses PTU character sheet CSVs (trainer and Pokemon) and creates DB records.
 * Pokemon creation routes through pokemon-generator.service.ts for consistent defaults.
 */

import { prisma } from '~/server/utils/prisma'
import { getCell, parseNumber } from '~/server/utils/csv-parser'
import { createPokemonRecord } from '~/server/services/pokemon-generator.service'
import type { GeneratedPokemonData, MoveDetail } from '~/server/services/pokemon-generator.service'
import { validateTrainerLevel } from '~/utils/trainerExperience'

// --- Parsed data types ---

export interface ParsedTrainer {
  name: string
  playedBy: string | null
  age: number | null
  gender: string | null
  level: number
  stats: {
    hp: number
    attack: number
    defense: number
    specialAttack: number
    specialDefense: number
    speed: number
  }
  maxHp: number
  skills: Record<string, { rank: string; modifier: number }>
  features: string[]
  edges: string[]
  background: string | null
  money: number
}

export interface ParsedPokemon {
  nickname: string | null
  species: string
  level: number
  nature: { name: string; raisedStat: string | null; loweredStat: string | null }
  gender: string | null
  shiny: boolean
  types: string[]
  stats: {
    hp: number
    attack: number
    defense: number
    specialAttack: number
    specialDefense: number
    speed: number
  }
  baseStats: {
    hp: number
    attack: number
    defense: number
    specialAttack: number
    specialDefense: number
    speed: number
  }
  maxHp: number
  moves: Array<{
    name: string
    type: string
    category: string
    db: number | null
    frequency: string
    ac: number | null
    range: string
    effect: string
  }>
  abilities: Array<{ name: string; frequency: string; effect: string }>
  capabilities: {
    overland: number
    swim: number
    sky: number
    burrow: number
    levitate: number
    teleport?: number
    power: number
    jump: { high: number; long: number }
  }
  skills: Record<string, string>
  heldItem: string | null
}

// --- Sheet detection ---

export function detectSheetType(rows: string[][]): 'trainer' | 'pokemon' | 'unknown' {
  const firstCell = getCell(rows, 0, 0).toLowerCase()
  if (firstCell === 'name' || firstCell === 'nickname') {
    for (let r = 0; r < Math.min(5, rows.length); r++) {
      for (let c = 0; c < Math.min(10, rows[r]?.length || 0); c++) {
        if (getCell(rows, r, c).toLowerCase() === 'species') {
          return 'pokemon'
        }
      }
    }
    return 'trainer'
  }
  return 'unknown'
}

// --- Trainer parsing ---

export function parseTrainerSheet(rows: string[][]): ParsedTrainer {
  const name = getCell(rows, 1, 0) || 'Unknown Trainer'
  const playedBy = getCell(rows, 1, 1) || null
  const age = parseNumber(getCell(rows, 1, 2)) || null
  const gender = getCell(rows, 1, 3) || null
  const level = parseNumber(getCell(rows, 1, 6)) || 1
  const maxHp = parseNumber(getCell(rows, 1, 7)) || 10

  const stats = {
    hp: parseNumber(getCell(rows, 3, 6)) || 10,
    attack: parseNumber(getCell(rows, 4, 6)) || 5,
    defense: parseNumber(getCell(rows, 5, 6)) || 5,
    specialAttack: parseNumber(getCell(rows, 6, 6)) || 5,
    specialDefense: parseNumber(getCell(rows, 7, 6)) || 5,
    speed: parseNumber(getCell(rows, 8, 6)) || 5
  }

  const skills: Record<string, { rank: string; modifier: number }> = {}
  const skillRows = [
    { row: 12, name: 'Acrobatics' },
    { row: 13, name: 'Athletics' },
    { row: 14, name: 'Charm' },
    { row: 15, name: 'Combat' },
    { row: 16, name: 'Command' },
    { row: 17, name: 'General Ed' },
    { row: 18, name: 'Medicine Ed' },
    { row: 19, name: 'Occult Ed' },
    { row: 20, name: 'Pokemon Ed' },
    { row: 21, name: 'Technology Ed' },
    { row: 22, name: 'Focus' },
    { row: 23, name: 'Guile' },
    { row: 24, name: 'Intimidate' },
    { row: 25, name: 'Intuition' },
    { row: 26, name: 'Perception' },
    { row: 27, name: 'Stealth' },
    { row: 28, name: 'Survival' }
  ]

  for (const { row, name: skillName } of skillRows) {
    const modifier = parseNumber(getCell(rows, row, 1))
    const rank = getCell(rows, row, 2) || 'Untrained'
    skills[skillName] = { rank, modifier }
  }

  const features: string[] = []
  for (let r = 13; r < 20; r++) {
    const feature = getCell(rows, r, 6)
    if (feature && feature !== '--' && !feature.startsWith('#')) {
      features.push(feature)
    }
  }

  const edges: string[] = []
  for (let r = 13; r < 20; r++) {
    const edge = getCell(rows, r, 7)
    if (edge && edge !== '--') {
      edges.push(edge)
    }
    const edge2 = getCell(rows, r, 8)
    if (edge2 && edge2 !== '--') {
      edges.push(edge2)
    }
  }
  for (let c = 6; c < 12; c++) {
    const edge = getCell(rows, 33, c)
    if (edge && edge !== '--' && !edge.startsWith('#')) {
      edges.push(edge)
    }
  }

  const background = getCell(rows, 38, 7) || null
  const moneyStr = getCell(rows, 1, 9) || '0'
  const money = parseNumber(moneyStr.replace(/[$,]/g, ''))

  return {
    name, playedBy, age, gender, level, stats, maxHp,
    skills, features, edges, background, money
  }
}

// --- Pokemon parsing ---

export function parsePokemonSheet(rows: string[][]): ParsedPokemon {
  const nickname = getCell(rows, 0, 1) || null
  const species = getCell(rows, 0, 9) || 'Unknown'
  const level = parseNumber(getCell(rows, 1, 1)) || 1

  const natureName = getCell(rows, 2, 1) || 'Hardy'
  const raisedStat = getCell(rows, 2, 4) || null
  const loweredStat = getCell(rows, 2, 7) || null

  const shinyStr = getCell(rows, 2, 9)
  const shiny = shinyStr?.toLowerCase() === 'shiny'
  const gender = getCell(rows, 1, 9) || null

  const baseStats = {
    hp: parseNumber(getCell(rows, 5, 1)) || 5,
    attack: parseNumber(getCell(rows, 6, 1)) || 5,
    defense: parseNumber(getCell(rows, 7, 1)) || 5,
    specialAttack: parseNumber(getCell(rows, 8, 1)) || 5,
    specialDefense: parseNumber(getCell(rows, 9, 1)) || 5,
    speed: parseNumber(getCell(rows, 10, 1)) || 5
  }

  const stats = {
    hp: parseNumber(getCell(rows, 5, 6)) || baseStats.hp,
    attack: parseNumber(getCell(rows, 6, 6)) || baseStats.attack,
    defense: parseNumber(getCell(rows, 7, 6)) || baseStats.defense,
    specialAttack: parseNumber(getCell(rows, 8, 6)) || baseStats.specialAttack,
    specialDefense: parseNumber(getCell(rows, 9, 6)) || baseStats.specialDefense,
    speed: parseNumber(getCell(rows, 10, 6)) || baseStats.speed
  }

  const maxHp = parseNumber(getCell(rows, 5, 9)) || (level + stats.hp * 3 + 10)

  const type1 = getCell(rows, 32, 0) || 'Normal'
  const type2 = getCell(rows, 32, 1)
  const types = type2 && type2 !== 'None' ? [type1, type2] : [type1]

  const moves: ParsedPokemon['moves'] = []
  for (let r = 19; r < 30; r++) {
    const moveName = getCell(rows, r, 0)
    if (moveName && moveName !== '--' && moveName !== 'Struggle') {
      const moveType = getCell(rows, r, 1) || 'Normal'
      const category = getCell(rows, r, 2) || 'Status'
      const dbStr = getCell(rows, r, 3)
      const db = dbStr === '--' ? null : parseNumber(dbStr)
      const frequency = getCell(rows, r, 7) || 'At-Will'
      const acStr = getCell(rows, r, 8)
      const ac = acStr === '--' ? null : parseNumber(acStr)
      const range = getCell(rows, r, 9) || 'Melee'
      const effect = getCell(rows, r, 11) || ''
      moves.push({ name: moveName, type: moveType, category, db, frequency, ac, range, effect })
    }
  }

  const abilities: ParsedPokemon['abilities'] = []
  for (let r = 41; r < 49; r++) {
    const abilityName = getCell(rows, r, 0)
    if (abilityName && abilityName !== '--') {
      const frequency = getCell(rows, r, 1) || ''
      const effect = getCell(rows, r, 3) || ''
      abilities.push({ name: abilityName, frequency, effect })
    }
  }

  // PTU sheet capability layout (cols 12-17, labels in even cols, values in odd):
  //   Row 31: Overland | val | Levitate | val | Power | val
  //   Row 32: Sky      | val | Burrow   | val | Weight| val
  //   Row 33: Swim     | val | Jump H/L | val | Size  | val
  const capabilities = {
    overland: parseNumber(getCell(rows, 31, 13)) || 5,
    swim: parseNumber(getCell(rows, 33, 13)) || 0,
    sky: parseNumber(getCell(rows, 32, 13)) || 0,
    burrow: parseNumber(getCell(rows, 32, 15)) || 0,
    levitate: parseNumber(getCell(rows, 31, 15)) || 0,
    power: parseNumber(getCell(rows, 31, 17)) || 1,
    jump: {
      high: parseNumber(getCell(rows, 33, 15)?.split('/')[0] || '1'),
      long: parseNumber(getCell(rows, 33, 15)?.split('/')[1] || '1')
    }
  }

  const skills: Record<string, string> = {}
  const skillMapping = [
    { row: 58, skills: [{ col: 10, name: 'Acrobatics' }, { col: 12, name: 'General Ed' }, { col: 14, name: 'Tech Ed' }, { col: 16, name: 'Intuition' }] },
    { row: 59, skills: [{ col: 10, name: 'Athletics' }, { col: 12, name: 'Medicine Ed' }, { col: 14, name: 'Focus' }, { col: 16, name: 'Perception' }] },
    { row: 60, skills: [{ col: 10, name: 'Charm' }, { col: 12, name: 'Occult Ed' }, { col: 14, name: 'Guile' }, { col: 16, name: 'Stealth' }] },
    { row: 61, skills: [{ col: 10, name: 'Combat' }, { col: 12, name: 'Poke Ed' }, { col: 14, name: 'Intimidate' }, { col: 16, name: 'Survival' }] },
    { row: 62, skills: [{ col: 10, name: 'Command' }] }
  ]

  for (const { row, skills: rowSkills } of skillMapping) {
    for (const { col, name } of rowSkills) {
      const dice = getCell(rows, row, col + 1)
      if (dice && dice !== '--') {
        skills[name] = dice
      }
    }
  }

  const heldItem = getCell(rows, 11, 2) || null

  return {
    nickname, species, level,
    nature: { name: natureName, raisedStat, loweredStat },
    gender, shiny, types, stats, baseStats, maxHp,
    moves, abilities, capabilities, skills, heldItem
  }
}

// --- DB creation ---

export async function createTrainerFromCSV(
  trainer: ParsedTrainer
): Promise<{ id: string; name: string; level: number; playedBy: string | null }> {
  // Validate trainer level bounds
  const levelError = validateTrainerLevel(trainer.level)
  if (levelError) {
    throw new Error(`CSV import failed for "${trainer.name}": ${levelError}`)
  }

  const skillsJson: Record<string, string> = {}
  for (const [skillName, data] of Object.entries(trainer.skills)) {
    skillsJson[skillName] = data.rank
  }

  const character = await prisma.humanCharacter.create({
    data: {
      name: trainer.name,
      characterType: 'player',
      playedBy: trainer.playedBy,
      age: trainer.age,
      gender: trainer.gender,
      level: trainer.level,
      hp: trainer.stats.hp,
      attack: trainer.stats.attack,
      defense: trainer.stats.defense,
      specialAttack: trainer.stats.specialAttack,
      specialDefense: trainer.stats.specialDefense,
      speed: trainer.stats.speed,
      currentHp: trainer.maxHp,
      maxHp: trainer.maxHp,
      skills: JSON.stringify(skillsJson),
      features: JSON.stringify(trainer.features),
      edges: JSON.stringify(trainer.edges),
      background: trainer.background,
      money: trainer.money
    }
  })

  return {
    id: character.id,
    name: character.name,
    level: character.level,
    playedBy: character.playedBy
  }
}

export async function createPokemonFromCSV(
  pokemon: ParsedPokemon
): Promise<{ id: string; species: string; nickname: string | null; level: number }> {
  // Look up species data for authoritative types
  const speciesData = await prisma.speciesData.findUnique({
    where: { name: pokemon.species }
  })

  const type1 = speciesData?.type1 ?? pokemon.types[0]
  const type2 = speciesData?.type2 ?? pokemon.types[1] ?? null

  // Map CSV move format to MoveDetail format used by the generator service
  const moves: MoveDetail[] = pokemon.moves.map(m => ({
    name: m.name,
    type: m.type,
    damageClass: m.category,
    frequency: m.frequency,
    ac: m.ac,
    damageBase: m.db,
    range: m.range,
    effect: m.effect
  }))

  // Build GeneratedPokemonData to pass through createPokemonRecord
  const generatedData: GeneratedPokemonData = {
    species: pokemon.species,
    level: pokemon.level,
    nickname: pokemon.nickname,
    types: type2 ? [type1, type2] : [type1],
    baseStats: pokemon.baseStats,
    calculatedStats: pokemon.stats,
    maxHp: pokemon.maxHp,
    moves,
    abilities: pokemon.abilities.map(a => ({ name: a.name, effect: a.effect })),
    gender: pokemon.gender ?? 'Male',
    movementCaps: {
      overland: pokemon.capabilities.overland,
      swim: pokemon.capabilities.swim,
      sky: pokemon.capabilities.sky,
      burrow: pokemon.capabilities.burrow,
      levitate: pokemon.capabilities.levitate,
      teleport: pokemon.capabilities.teleport ?? 0
    },
    power: pokemon.capabilities.power,
    jump: pokemon.capabilities.jump,
    weightClass: speciesData?.weightClass ?? 1,
    otherCapabilities: [],
    skills: pokemon.skills,
    eggGroups: [],
    size: speciesData?.size ?? 'Medium',
    tutorPoints: 1 + Math.floor(pokemon.level / 5),
    nature: pokemon.nature,
    shiny: pokemon.shiny,
    heldItem: pokemon.heldItem
  }

  const created = await createPokemonRecord(
    { speciesName: pokemon.species, level: pokemon.level, nickname: pokemon.nickname, origin: 'import', originLabel: 'Imported from PTU sheet' },
    generatedData
  )

  return {
    id: created.id,
    species: created.species,
    nickname: created.nickname,
    level: created.level
  }
}
