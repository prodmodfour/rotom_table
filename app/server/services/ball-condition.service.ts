/**
 * Ball Condition Context Service
 *
 * Builds the BallConditionContext from DB data for conditional ball modifier
 * evaluation. Shared by both capture/attempt.post.ts (actual capture) and
 * capture/rate.post.ts (preview).
 *
 * Auto-populates fields derivable from Pokemon, SpeciesData, trainer, and
 * encounter state. GM overrides take priority over auto-populated values.
 */

import { prisma } from '~/server/utils/prisma'
import type { BallConditionContext } from '~/constants/pokeBalls'

interface PokemonFields {
  species: string
  level: number
  gender: string
}

interface SpeciesDataFields {
  name: string
  type1: string
  type2?: string | null
  weightClass?: number
  overland?: number
  swim?: number
  sky?: number
  evolutionTriggers?: string
}

/**
 * Build the ball condition context from DB data.
 * Auto-populates fields that can be derived from the Pokemon, species data,
 * trainer, and encounter state. GM overrides take priority.
 */
export async function buildConditionContext(
  pokemon: PokemonFields,
  speciesData: SpeciesDataFields | null,
  trainer: { id: string },
  encounterId?: string,
  gmOverrides?: Partial<BallConditionContext>
): Promise<Partial<BallConditionContext>> {
  // Get encounter round and active Pokemon if in an encounter
  let encounterRound = 1
  let activePokemonLevel: number | undefined
  let activePokemonGender: string | undefined
  let activePokemonEvoLine: string[] | undefined

  if (encounterId) {
    const encounter = await prisma.encounter.findUnique({
      where: { id: encounterId }
    })

    if (encounter) {
      encounterRound = encounter.currentRound ?? 1

      // Find the trainer's first non-fainted Pokemon in the encounter
      const combatants = JSON.parse(encounter.combatants || '[]')
      const trainerPokemon = combatants.find(
        (c: any) => c.type === 'pokemon'
          && c.entity?.ownerId === trainer.id
          && !(JSON.parse(c.entity?.statusConditions || '[]') as string[]).includes('Fainted')
      )

      if (trainerPokemon?.entity) {
        activePokemonLevel = trainerPokemon.entity.level
        activePokemonGender = trainerPokemon.entity.gender || 'N'

        // Look up active Pokemon's species data for evo line
        const activeSpeciesData = await prisma.speciesData.findUnique({
          where: { name: trainerPokemon.entity.species }
        })
        if (activeSpeciesData) {
          activePokemonEvoLine = deriveEvoLine(activeSpeciesData.name, activeSpeciesData.evolutionTriggers)
        }
      }
    }
  }

  // Check if trainer already owns this species (for Repeat Ball)
  const existingOwned = await prisma.pokemon.count({
    where: {
      ownerId: trainer.id,
      species: pokemon.species,
    }
  })

  // Derive target types from speciesData
  const targetTypes: string[] = speciesData
    ? [speciesData.type1, ...(speciesData.type2 ? [speciesData.type2] : [])]
    : []

  // Derive highest movement capability
  const targetMovementSpeed = speciesData
    ? Math.max(
        speciesData.overland ?? 0,
        speciesData.swim ?? 0,
        speciesData.sky ?? 0,
      )
    : 5

  // Derive whether target evolves with a stone
  const targetEvolvesWithStone = speciesData
    ? checkEvolvesWithStone(speciesData.evolutionTriggers)
    : false

  // Derive target evo line
  const targetEvoLine = speciesData
    ? deriveEvoLine(speciesData.name, speciesData.evolutionTriggers)
    : [pokemon.species]

  const autoContext: Partial<BallConditionContext> = {
    encounterRound,
    targetLevel: pokemon.level,
    targetTypes,
    targetGender: pokemon.gender || 'N',
    targetSpecies: pokemon.species,
    targetWeightClass: speciesData?.weightClass ?? 1,
    targetMovementSpeed,
    targetEvolvesWithStone,
    targetEvoLine,
    activePokemonLevel,
    activePokemonGender,
    activePokemonEvoLine,
    trainerOwnsSpecies: existingOwned > 0,
  }

  // GM overrides take priority
  return {
    ...autoContext,
    ...gmOverrides,
  }
}

/**
 * Check if any evolution trigger for this species requires an Evolution Stone.
 * Examines the evolutionTriggers JSON field for requiredItem containing stone keywords.
 */
export function checkEvolvesWithStone(evolutionTriggersJson?: string): boolean {
  if (!evolutionTriggersJson) return false

  try {
    const triggers = JSON.parse(evolutionTriggersJson)
    if (!Array.isArray(triggers)) return false

    const stoneKeywords = ['stone', 'fire stone', 'water stone', 'thunder stone',
      'leaf stone', 'moon stone', 'sun stone', 'shiny stone', 'dusk stone',
      'dawn stone', 'ice stone', 'oval stone']

    return triggers.some((t: any) => {
      const item = (t.requiredItem || '').toLowerCase()
      return stoneKeywords.some(keyword => item.includes(keyword))
    })
  } catch {
    return false
  }
}

/**
 * Derive a basic evolution line from the species name and evolution triggers.
 * Returns an array containing at minimum the species itself.
 * Full evo line traversal would require recursive DB lookups (deferred to P2).
 * For now, includes the species name and any toSpecies from its triggers.
 */
export function deriveEvoLine(speciesName: string, evolutionTriggersJson?: string): string[] {
  const line = [speciesName]

  if (!evolutionTriggersJson) return line

  try {
    const triggers = JSON.parse(evolutionTriggersJson)
    if (!Array.isArray(triggers)) return line

    for (const t of triggers) {
      if (t.toSpecies && !line.includes(t.toSpecies)) {
        line.push(t.toSpecies)
      }
    }
  } catch {
    // Ignore parse errors, return at least the species name
  }

  return line
}
