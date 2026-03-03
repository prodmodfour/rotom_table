/**
 * Entity Builder Service
 * Transforms Prisma database records into typed entity objects (Pokemon, HumanCharacter).
 * Pure data mapping with JSON parsing — no combat logic dependency.
 */

import { prisma } from '~/server/utils/prisma'
import type { Pokemon, HumanCharacter } from '~/types'

// Derive Prisma record types from the client queries
export type PrismaPokemonRecord = NonNullable<Awaited<ReturnType<typeof prisma.pokemon.findUnique>>>
export type PrismaHumanRecord = NonNullable<Awaited<ReturnType<typeof prisma.humanCharacter.findUnique>>>

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
    loyalty: (record as any).loyalty ?? 3,
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
