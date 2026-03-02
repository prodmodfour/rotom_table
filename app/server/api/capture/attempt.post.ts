import { prisma } from '~/server/utils/prisma'
import { calculateCaptureRate, attemptCapture, getCaptureDescription } from '~/utils/captureRate'
import { isLegendarySpecies } from '~/constants/legendarySpecies'
import { POKE_BALL_CATALOG, DEFAULT_BALL_TYPE, calculateBallModifier } from '~/constants/pokeBalls'
import type { BallConditionContext } from '~/constants/pokeBalls'
import { applyTrainerXp, isNewSpecies } from '~/utils/trainerExperience'
import type { TrainerXpResult } from '~/utils/trainerExperience'
import { broadcast } from '~/server/utils/websocket'
import type { StatusCondition } from '~/types'

interface CaptureAttemptRequest {
  pokemonId: string
  trainerId: string
  accuracyRoll?: number  // The accuracy check roll (to detect nat 20)
  ballType?: string      // Key in POKE_BALL_CATALOG (default: 'Basic Ball')
  modifiers?: number     // Additional non-ball modifiers (features, equipment)
  encounterId?: string   // Active encounter ID (for round tracking, active Pokemon lookup)
  /** GM overrides for ball condition context (e.g., isDarkOrLowLight, targetWasBaited) */
  conditionContext?: Partial<BallConditionContext>
}

export default defineEventHandler(async (event) => {
  const body = await readBody<CaptureAttemptRequest>(event)

  if (!body.pokemonId || !body.trainerId) {
    throw createError({
      statusCode: 400,
      message: 'pokemonId and trainerId are required'
    })
  }

  // PTU p.214: Server-side AC 6 validation.
  // If the client provides an accuracy roll, enforce the AC 6 gate.
  // Natural 1 always misses, natural 20 always hits, otherwise must roll >= 6.
  if (body.accuracyRoll !== undefined) {
    const roll = body.accuracyRoll
    const isNat1 = roll === 1
    const isNat20 = roll === 20
    const hits = isNat1 ? false : (isNat20 ? true : roll >= 6)

    if (!hits) {
      throw createError({
        statusCode: 400,
        message: isNat1
          ? 'Natural 1 — ball missed! (auto-miss)'
          : `Accuracy roll ${roll} does not meet AC 6 — ball missed`
      })
    }
  }

  // Look up Pokemon
  const pokemon = await prisma.pokemon.findUnique({
    where: { id: body.pokemonId }
  })

  if (!pokemon) {
    throw createError({
      statusCode: 404,
      message: 'Pokemon not found'
    })
  }

  // PTU capture rules target wild Pokemon only — owned Pokemon cannot be captured
  if (pokemon.ownerId) {
    throw createError({
      statusCode: 400,
      message: 'Cannot capture an owned Pokemon'
    })
  }

  // Look up Trainer
  const trainer = await prisma.humanCharacter.findUnique({
    where: { id: body.trainerId }
  })

  if (!trainer) {
    throw createError({
      statusCode: 404,
      message: 'Trainer not found'
    })
  }

  // Get species data for evolution info and ball condition context
  const speciesData = await prisma.speciesData.findUnique({
    where: { name: pokemon.species }
  })

  const evolutionStage = speciesData?.evolutionStage || 1
  const maxEvolutionStage = speciesData?.maxEvolutionStage || evolutionStage

  // Legendary detection: auto-detect from species name
  const isLegendary = isLegendarySpecies(pokemon.species)

  // Calculate capture rate
  const rateResult = calculateCaptureRate({
    level: pokemon.level,
    currentHp: pokemon.currentHp,
    maxHp: pokemon.maxHp,
    evolutionStage,
    maxEvolutionStage,
    statusConditions: JSON.parse(pokemon.statusConditions || '[]') as StatusCondition[],
    injuries: pokemon.injuries || 0,
    isShiny: pokemon.shiny || false,
    isLegendary
  })

  // Check if capture is possible
  if (!rateResult.canBeCaptured) {
    return {
      success: false,
      data: {
        captured: false,
        reason: 'Pokemon is at 0 HP and cannot be captured',
        captureRate: rateResult.captureRate,
        difficulty: getCaptureDescription(rateResult.captureRate)
      }
    }
  }

  // Was the accuracy check a critical hit (natural 20)?
  const criticalHit = body.accuracyRoll === 20

  // Ball type resolution and validation
  const ballType = body.ballType || DEFAULT_BALL_TYPE
  const ballDef = POKE_BALL_CATALOG[ballType]

  if (body.ballType && !ballDef) {
    throw createError({
      statusCode: 400,
      message: `Unknown ball type: ${body.ballType}`
    })
  }

  // Build ball condition context from DB data
  const conditionContext = await buildConditionContext(
    pokemon, speciesData, trainer, body.encounterId, body.conditionContext
  )

  const ballResult = calculateBallModifier(ballType, conditionContext)

  // Attempt capture with ball modifier separated from other modifiers
  const captureResult = attemptCapture(
    rateResult.captureRate,
    trainer.level,
    body.modifiers || 0,
    criticalHit,
    ballResult.total
  )

  // Track species XP data for the response
  let speciesXpAwarded = false
  let speciesXpResult: TrainerXpResult | null = null

  // If captured, auto-link Pokemon to trainer and update origin
  if (captureResult.success) {
    await prisma.pokemon.update({
      where: { id: body.pokemonId },
      data: {
        ownerId: body.trainerId,
        origin: 'captured'
      }
    })

    // Check for new species -> +1 trainer XP (PTU Core p.461)
    const trainerRecord = await prisma.humanCharacter.findUnique({
      where: { id: body.trainerId },
      select: { capturedSpecies: true, trainerXp: true, level: true, name: true }
    })

    if (trainerRecord) {
      const existingSpecies: string[] = JSON.parse(trainerRecord.capturedSpecies || '[]')
      const normalizedSpecies = pokemon.species.toLowerCase().trim()

      if (isNewSpecies(pokemon.species, existingSpecies)) {
        const updatedSpecies = [...existingSpecies, normalizedSpecies]

        const xpCalc = applyTrainerXp({
          currentXp: trainerRecord.trainerXp,
          currentLevel: trainerRecord.level,
          xpToAdd: 1
        })

        await prisma.humanCharacter.update({
          where: { id: body.trainerId },
          data: {
            capturedSpecies: JSON.stringify(updatedSpecies),
            trainerXp: xpCalc.newXp,
            level: xpCalc.newLevel
          }
        })

        speciesXpAwarded = true
        speciesXpResult = xpCalc

        if (xpCalc.levelsGained > 0) {
          broadcast({ type: 'character_update', data: { characterId: body.trainerId } })
        }
      }
    }
  }

  return {
    success: true,
    data: {
      captured: captureResult.success,
      roll: captureResult.roll,
      modifiedRoll: captureResult.modifiedRoll,
      captureRate: rateResult.captureRate,
      effectiveCaptureRate: captureResult.effectiveCaptureRate,
      naturalHundred: captureResult.naturalHundred,
      criticalHit,
      trainerLevel: trainer.level,
      modifiers: body.modifiers || 0,
      ballModifier: ballResult.total,
      ballType,
      difficulty: getCaptureDescription(rateResult.captureRate),
      breakdown: rateResult.breakdown,
      ballBreakdown: {
        baseModifier: ballResult.base,
        conditionalModifier: ballResult.conditional,
        conditionMet: ballResult.conditionMet,
        conditionDescription: ballResult.description ?? ballDef?.conditionDescription,
      },
      pokemon: {
        id: pokemon.id,
        species: pokemon.species,
        level: pokemon.level,
        currentHp: pokemon.currentHp,
        maxHp: pokemon.maxHp,
        hpPercentage: Math.round(rateResult.hpPercentage),
        ownerId: captureResult.success ? body.trainerId : pokemon.ownerId,
        origin: captureResult.success ? 'captured' : pokemon.origin
      },
      trainer: {
        id: trainer.id,
        name: trainer.name,
        level: trainer.level
      },
      speciesXp: captureResult.success ? {
        awarded: speciesXpAwarded,
        species: pokemon.species,
        xpResult: speciesXpResult
      } : undefined
    }
  }
})

/**
 * Build the ball condition context from DB data.
 * Auto-populates fields that can be derived from the Pokemon, species data,
 * trainer, and encounter state. GM overrides take priority.
 */
async function buildConditionContext(
  pokemon: { species: string; level: number; gender: string },
  speciesData: { types?: string; type1: string; type2?: string | null; weightClass?: number; overland?: number; swim?: number; sky?: number; evolutionTriggers?: string } | null,
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
function checkEvolvesWithStone(evolutionTriggersJson?: string): boolean {
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
function deriveEvoLine(speciesName: string, evolutionTriggersJson?: string): string[] {
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
