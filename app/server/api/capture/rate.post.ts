import { prisma } from '~/server/utils/prisma'
import { calculateCaptureRate, getCaptureDescription } from '~/utils/captureRate'
import { isLegendarySpecies } from '~/constants/legendarySpecies'
import { POKE_BALL_CATALOG, DEFAULT_BALL_TYPE, calculateBallModifier } from '~/constants/pokeBalls'
import type { BallConditionContext } from '~/constants/pokeBalls'
import type { StatusCondition } from '~/types'

interface CaptureRateRequest {
  pokemonId?: string
  // Or provide data directly
  level?: number
  currentHp?: number
  maxHp?: number
  species?: string
  statusConditions?: StatusCondition[]
  injuries?: number
  isShiny?: boolean
  isLegendary?: boolean  // GM override for legendary status
  ballType?: string      // Key in POKE_BALL_CATALOG (default: 'Basic Ball')
  /** Ball condition context for conditional modifier preview */
  conditionContext?: Partial<BallConditionContext>
}

export default defineEventHandler(async (event) => {
  const body = await readBody<CaptureRateRequest>(event)

  let level: number
  let currentHp: number
  let maxHp: number
  let evolutionStage: number = 1
  let maxEvolutionStage: number = 1
  let statusConditions: StatusCondition[] = []
  let injuries: number = 0
  let isShiny: boolean = false
  let species: string = ''
  let speciesDataRecord: any = null

  if (body.pokemonId) {
    // Look up Pokemon from database
    const pokemon = await prisma.pokemon.findUnique({
      where: { id: body.pokemonId }
    })

    if (!pokemon) {
      throw createError({
        statusCode: 404,
        message: 'Pokemon not found'
      })
    }

    level = pokemon.level
    currentHp = pokemon.currentHp
    maxHp = pokemon.maxHp
    statusConditions = JSON.parse(pokemon.statusConditions || '[]')
    injuries = pokemon.injuries || 0
    isShiny = pokemon.shiny || false
    species = pokemon.species

    // Look up species data for evolution info and ball condition context
    speciesDataRecord = await prisma.speciesData.findUnique({
      where: { name: pokemon.species }
    })

    if (speciesDataRecord) {
      evolutionStage = speciesDataRecord.evolutionStage
      maxEvolutionStage = speciesDataRecord.maxEvolutionStage
    }
  } else {
    // Use provided data
    if (body.level === undefined || body.currentHp === undefined || body.maxHp === undefined) {
      throw createError({
        statusCode: 400,
        message: 'Must provide pokemonId or (level, currentHp, maxHp)'
      })
    }

    level = body.level
    currentHp = body.currentHp
    maxHp = body.maxHp
    statusConditions = body.statusConditions || []
    injuries = body.injuries || 0
    isShiny = body.isShiny || false
    species = body.species || 'Unknown'

    // Look up species for evolution info if provided
    if (body.species) {
      speciesDataRecord = await prisma.speciesData.findUnique({
        where: { name: body.species }
      })

      if (speciesDataRecord) {
        evolutionStage = speciesDataRecord.evolutionStage
        maxEvolutionStage = speciesDataRecord.maxEvolutionStage
      }
    }
  }

  // Legendary detection: GM override takes priority, otherwise auto-detect from species name
  const isLegendary = body.isLegendary ?? isLegendarySpecies(species)

  const result = calculateCaptureRate({
    level,
    currentHp,
    maxHp,
    evolutionStage,
    maxEvolutionStage,
    statusConditions,
    injuries,
    isShiny,
    isLegendary
  })

  // Ball type resolution and validation
  const ballType = body.ballType || DEFAULT_BALL_TYPE
  const ballDef = POKE_BALL_CATALOG[ballType]

  if (body.ballType && !ballDef) {
    throw createError({
      statusCode: 400,
      message: `Unknown ball type: ${body.ballType}`
    })
  }

  // Build condition context: auto-populate from species data, merge with GM overrides
  const autoContext: Partial<BallConditionContext> = {
    targetLevel: level,
    targetTypes: speciesDataRecord
      ? [speciesDataRecord.type1, ...(speciesDataRecord.type2 ? [speciesDataRecord.type2] : [])]
      : [],
    targetWeightClass: speciesDataRecord?.weightClass ?? 1,
    targetMovementSpeed: speciesDataRecord
      ? Math.max(speciesDataRecord.overland ?? 0, speciesDataRecord.swim ?? 0, speciesDataRecord.sky ?? 0)
      : 5,
    targetSpecies: species,
  }

  const conditionContext: Partial<BallConditionContext> = {
    ...autoContext,
    ...body.conditionContext,
  }

  const ballResult = calculateBallModifier(ballType, conditionContext)

  return {
    success: true,
    data: {
      species,
      level,
      currentHp,
      maxHp,
      captureRate: result.captureRate,
      difficulty: getCaptureDescription(result.captureRate),
      canBeCaptured: result.canBeCaptured,
      hpPercentage: Math.round(result.hpPercentage),
      breakdown: result.breakdown,
      ballType,
      ballModifier: ballResult.total,
      ballBreakdown: {
        baseModifier: ballResult.base,
        conditionalModifier: ballResult.conditional,
        conditionMet: ballResult.conditionMet,
        conditionDescription: ballResult.description ?? ballDef?.conditionDescription,
      }
    }
  }
})
