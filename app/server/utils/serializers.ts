import type { HumanCharacter, Pokemon } from '@prisma/client'

/**
 * Shared response serializers for API endpoints.
 * Guarantees consistent response shapes across GET, PUT, POST, and LIST.
 */

type CharacterWithPokemon = HumanCharacter & { pokemon: Pokemon[] }
type PokemonSummary = { id: string; species: string; nickname: string | null }
type CharacterWithPokemonSummary = HumanCharacter & { pokemon: PokemonSummary[] }

/**
 * Serialize a linked Pokemon (nested in a character response).
 * Returns a summary shape suitable for character detail views.
 */
function serializeLinkedPokemon(p: Pokemon) {
  return {
    id: p.id,
    species: p.species,
    nickname: p.nickname,
    level: p.level,
    experience: p.experience,
    nature: JSON.parse(p.nature),
    types: p.type2 ? [p.type1, p.type2] : [p.type1],
    baseStats: {
      hp: p.baseHp,
      attack: p.baseAttack,
      defense: p.baseDefense,
      specialAttack: p.baseSpAtk,
      specialDefense: p.baseSpDef,
      speed: p.baseSpeed
    },
    currentStats: {
      hp: p.currentHp,
      attack: p.currentAttack,
      defense: p.currentDefense,
      specialAttack: p.currentSpAtk,
      specialDefense: p.currentSpDef,
      speed: p.currentSpeed
    },
    currentHp: p.currentHp,
    maxHp: p.maxHp,
    abilities: JSON.parse(p.abilities),
    moves: JSON.parse(p.moves),
    heldItem: p.heldItem,
    capabilities: JSON.parse(p.capabilities),
    skills: JSON.parse(p.skills),
    tutorPoints: p.tutorPoints,
    trainingExp: p.trainingExp,
    eggGroups: JSON.parse(p.eggGroups),
    shiny: p.shiny,
    gender: p.gender,
    spriteUrl: p.spriteUrl
  }
}

/**
 * Serialize a full character with linked Pokemon.
 * Used by GET /api/characters/:id, PUT /api/characters/:id, POST /api/characters.
 */
export function serializeCharacter(character: CharacterWithPokemon) {
  const parsedPokemon = character.pokemon.map(serializeLinkedPokemon)

  return {
    id: character.id,
    name: character.name,
    characterType: character.characterType,
    // Player info
    playedBy: character.playedBy,
    age: character.age,
    gender: character.gender,
    height: character.height,
    weight: character.weight,
    // Stats
    level: character.level,
    stats: {
      hp: character.hp,
      attack: character.attack,
      defense: character.defense,
      specialAttack: character.specialAttack,
      specialDefense: character.specialDefense,
      speed: character.speed
    },
    currentHp: character.currentHp,
    maxHp: character.maxHp,
    // Classes, skills, features, edges
    trainerClasses: JSON.parse(character.trainerClasses),
    skills: JSON.parse(character.skills),
    features: JSON.parse(character.features),
    edges: JSON.parse(character.edges),
    // Equipment
    equipment: JSON.parse(character.equipment || '{}'),
    // Inventory
    inventory: JSON.parse(character.inventory),
    money: character.money,
    // Status
    statusConditions: JSON.parse(character.statusConditions),
    stageModifiers: JSON.parse(character.stageModifiers),
    injuries: character.injuries,
    temporaryHp: character.temporaryHp,
    // Rest/Healing tracking
    lastInjuryTime: character.lastInjuryTime,
    restMinutesToday: character.restMinutesToday,
    injuriesHealedToday: character.injuriesHealedToday,
    lastRestReset: character.lastRestReset,
    drainedAp: character.drainedAp,
    boundAp: character.boundAp,
    currentAp: character.currentAp,
    // Display
    avatarUrl: character.avatarUrl,
    // Background
    background: character.background,
    personality: character.personality,
    goals: character.goals,
    location: character.location,
    // Library
    isInLibrary: character.isInLibrary,
    notes: character.notes,
    // Linked Pokemon
    pokemonIds: character.pokemon.map(p => p.id),
    pokemon: parsedPokemon
  }
}

/**
 * Serialize a character for list views.
 * Includes linked Pokemon summaries (id, species, nickname only).
 */
export function serializeCharacterSummary(character: CharacterWithPokemonSummary) {
  return {
    id: character.id,
    name: character.name,
    characterType: character.characterType,
    // Player info
    playedBy: character.playedBy,
    age: character.age,
    gender: character.gender,
    height: character.height,
    weight: character.weight,
    // Stats
    level: character.level,
    stats: {
      hp: character.hp,
      attack: character.attack,
      defense: character.defense,
      specialAttack: character.specialAttack,
      specialDefense: character.specialDefense,
      speed: character.speed
    },
    currentHp: character.currentHp,
    maxHp: character.maxHp,
    // Classes, skills, features, edges
    trainerClasses: JSON.parse(character.trainerClasses),
    skills: JSON.parse(character.skills),
    features: JSON.parse(character.features),
    edges: JSON.parse(character.edges),
    // Equipment
    equipment: JSON.parse(character.equipment || '{}'),
    // Inventory
    inventory: JSON.parse(character.inventory),
    money: character.money,
    // Status
    statusConditions: JSON.parse(character.statusConditions),
    stageModifiers: JSON.parse(character.stageModifiers),
    injuries: character.injuries,
    temporaryHp: character.temporaryHp,
    // Rest/Healing tracking
    lastInjuryTime: character.lastInjuryTime,
    restMinutesToday: character.restMinutesToday,
    injuriesHealedToday: character.injuriesHealedToday,
    lastRestReset: character.lastRestReset,
    drainedAp: character.drainedAp,
    boundAp: character.boundAp,
    currentAp: character.currentAp,
    // Display
    avatarUrl: character.avatarUrl,
    // Background
    background: character.background,
    personality: character.personality,
    goals: character.goals,
    location: character.location,
    // Library
    isInLibrary: character.isInLibrary,
    notes: character.notes,
    // Linked Pokemon (summary only for list view)
    pokemonIds: character.pokemon.map(p => p.id),
    pokemon: character.pokemon
  }
}

/**
 * Serialize a full Pokemon record.
 * Used by GET /api/pokemon/:id, PUT /api/pokemon/:id, POST /api/pokemon, GET /api/pokemon.
 */
export function serializePokemon(pokemon: Pokemon) {
  return {
    id: pokemon.id,
    species: pokemon.species,
    nickname: pokemon.nickname,
    level: pokemon.level,
    experience: pokemon.experience,
    nature: JSON.parse(pokemon.nature),
    types: pokemon.type2 ? [pokemon.type1, pokemon.type2] : [pokemon.type1],
    baseStats: {
      hp: pokemon.baseHp,
      attack: pokemon.baseAttack,
      defense: pokemon.baseDefense,
      specialAttack: pokemon.baseSpAtk,
      specialDefense: pokemon.baseSpDef,
      speed: pokemon.baseSpeed
    },
    currentStats: {
      hp: pokemon.currentHp,
      attack: pokemon.currentAttack,
      defense: pokemon.currentDefense,
      specialAttack: pokemon.currentSpAtk,
      specialDefense: pokemon.currentSpDef,
      speed: pokemon.currentSpeed
    },
    currentHp: pokemon.currentHp,
    maxHp: pokemon.maxHp,
    stageModifiers: JSON.parse(pokemon.stageModifiers),
    abilities: JSON.parse(pokemon.abilities),
    moves: JSON.parse(pokemon.moves),
    heldItem: pokemon.heldItem,
    capabilities: JSON.parse(pokemon.capabilities),
    skills: JSON.parse(pokemon.skills),
    tutorPoints: pokemon.tutorPoints,
    trainingExp: pokemon.trainingExp,
    eggGroups: JSON.parse(pokemon.eggGroups),
    statusConditions: JSON.parse(pokemon.statusConditions),
    injuries: pokemon.injuries,
    temporaryHp: pokemon.temporaryHp,
    ownerId: pokemon.ownerId,
    spriteUrl: pokemon.spriteUrl,
    shiny: pokemon.shiny,
    gender: pokemon.gender,
    isInLibrary: pokemon.isInLibrary,
    origin: pokemon.origin,
    location: pokemon.location,
    notes: pokemon.notes,
    // Rest/Healing tracking
    lastInjuryTime: pokemon.lastInjuryTime,
    restMinutesToday: pokemon.restMinutesToday,
    injuriesHealedToday: pokemon.injuriesHealedToday,
    lastRestReset: pokemon.lastRestReset
  }
}
