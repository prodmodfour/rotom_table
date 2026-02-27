import { prisma } from '~/server/utils/prisma'
import { serializeCharacter } from '~/server/utils/serializers'
import { calculateMaxAp } from '~/utils/restHealing'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Character ID is required'
    })
  }

  try {
    const updateData: any = {}

    if (body.name !== undefined) updateData.name = body.name
    if (body.characterType !== undefined) updateData.characterType = body.characterType
    if (body.level !== undefined) updateData.level = body.level
    if (body.currentHp !== undefined) updateData.currentHp = body.currentHp
    if (body.money !== undefined) updateData.money = body.money
    if (body.avatarUrl !== undefined) updateData.avatarUrl = body.avatarUrl
    if (body.isInLibrary !== undefined) updateData.isInLibrary = body.isInLibrary
    if (body.notes !== undefined) updateData.notes = body.notes
    if (body.location !== undefined) updateData.location = body.location

    if (body.stats) {
      if (body.stats.hp !== undefined) updateData.hp = body.stats.hp
      if (body.stats.attack !== undefined) updateData.attack = body.stats.attack
      if (body.stats.defense !== undefined) updateData.defense = body.stats.defense
      if (body.stats.specialAttack !== undefined) updateData.specialAttack = body.stats.specialAttack
      if (body.stats.specialDefense !== undefined) updateData.specialDefense = body.stats.specialDefense
      if (body.stats.speed !== undefined) updateData.speed = body.stats.speed
    }

    if (body.trainerClasses !== undefined) updateData.trainerClasses = JSON.stringify(body.trainerClasses)
    if (body.skills !== undefined) updateData.skills = JSON.stringify(body.skills)
    if (body.features !== undefined) updateData.features = JSON.stringify(body.features)
    if (body.edges !== undefined) updateData.edges = JSON.stringify(body.edges)
    if (body.capabilities !== undefined) updateData.capabilities = JSON.stringify(body.capabilities)
    if (body.equipment !== undefined) updateData.equipment = JSON.stringify(body.equipment)
    if (body.inventory !== undefined) updateData.inventory = JSON.stringify(body.inventory)
    if (body.statusConditions !== undefined) updateData.statusConditions = JSON.stringify(body.statusConditions)
    if (body.stageModifiers !== undefined) updateData.stageModifiers = JSON.stringify(body.stageModifiers)

    // Healing-related fields
    if (body.maxHp !== undefined) updateData.maxHp = body.maxHp
    if (body.injuries !== undefined) updateData.injuries = body.injuries

    // AP fields: clamp to non-negative integers, bounded by maxAp
    const hasApUpdate = body.drainedAp !== undefined || body.boundAp !== undefined || body.currentAp !== undefined
    if (hasApUpdate) {
      const character = await prisma.humanCharacter.findUnique({
        where: { id },
        select: { level: true }
      })
      if (!character) {
        throw createError({ statusCode: 404, message: 'Character not found' })
      }
      const level = body.level !== undefined ? body.level : character.level
      const maxAp = calculateMaxAp(level)

      if (body.drainedAp !== undefined) {
        updateData.drainedAp = Math.min(maxAp, Math.max(0, Math.floor(body.drainedAp)))
      }
      if (body.boundAp !== undefined) {
        updateData.boundAp = Math.min(maxAp, Math.max(0, Math.floor(body.boundAp)))
      }
      if (body.currentAp !== undefined) {
        updateData.currentAp = Math.min(maxAp, Math.max(0, Math.floor(body.currentAp)))
      }
    }

    if (body.restMinutesToday !== undefined) updateData.restMinutesToday = body.restMinutesToday
    if (body.injuriesHealedToday !== undefined) updateData.injuriesHealedToday = body.injuriesHealedToday
    if (body.lastInjuryTime !== undefined) updateData.lastInjuryTime = body.lastInjuryTime ? new Date(body.lastInjuryTime) : null
    if (body.lastRestReset !== undefined) updateData.lastRestReset = body.lastRestReset ? new Date(body.lastRestReset) : null

    const character = await prisma.humanCharacter.update({
      where: { id },
      data: updateData,
      include: { pokemon: true }
    })

    return { success: true, data: serializeCharacter(character) }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to update character'
    })
  }
})
