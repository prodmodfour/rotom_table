import { prisma } from '~/server/utils/prisma'
import { serializePokemon } from '~/server/utils/serializers'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Pokemon ID is required'
    })
  }

  try {
    const updateData: any = {}

    if (body.species !== undefined) updateData.species = body.species
    if (body.nickname !== undefined) {
      const existing = await prisma.pokemon.findUnique({ where: { id }, select: { species: true } })
      if (!existing) throw createError({ statusCode: 404, message: 'Pokemon not found' })
      updateData.nickname = await resolveNickname(existing.species, body.nickname)
    }
    if (body.level !== undefined) updateData.level = body.level
    if (body.experience !== undefined) updateData.experience = body.experience
    if (body.currentHp !== undefined) updateData.currentHp = body.currentHp
    if (body.maxHp !== undefined) updateData.maxHp = body.maxHp
    if (body.heldItem !== undefined) updateData.heldItem = body.heldItem
    if (body.ownerId !== undefined) updateData.ownerId = body.ownerId
    if (body.spriteUrl !== undefined) updateData.spriteUrl = body.spriteUrl
    if (body.shiny !== undefined) updateData.shiny = body.shiny
    if (body.gender !== undefined) updateData.gender = body.gender
    if (body.isInLibrary !== undefined) updateData.isInLibrary = body.isInLibrary
    if (body.origin !== undefined) updateData.origin = body.origin
    if (body.notes !== undefined) updateData.notes = body.notes
    if (body.location !== undefined) updateData.location = body.location

    if (body.types) {
      updateData.type1 = body.types[0]
      updateData.type2 = body.types[1] || null
    }

    if (body.nature !== undefined) updateData.nature = JSON.stringify(body.nature)
    if (body.stageModifiers !== undefined) updateData.stageModifiers = JSON.stringify(body.stageModifiers)
    if (body.abilities !== undefined) updateData.abilities = JSON.stringify(body.abilities)
    if (body.moves !== undefined) updateData.moves = JSON.stringify(body.moves)
    if (body.statusConditions !== undefined) updateData.statusConditions = JSON.stringify(body.statusConditions)

    // Loyalty (PTU Chapter 10: 0-6 scale)
    if (body.loyalty !== undefined) updateData.loyalty = body.loyalty

    // Healing-related fields
    if (body.injuries !== undefined) updateData.injuries = body.injuries
    if (body.restMinutesToday !== undefined) updateData.restMinutesToday = body.restMinutesToday
    if (body.injuriesHealedToday !== undefined) updateData.injuriesHealedToday = body.injuriesHealedToday
    if (body.lastInjuryTime !== undefined) updateData.lastInjuryTime = body.lastInjuryTime ? new Date(body.lastInjuryTime) : null
    if (body.lastRestReset !== undefined) updateData.lastRestReset = body.lastRestReset ? new Date(body.lastRestReset) : null

    if (body.baseStats) {
      if (body.baseStats.hp !== undefined) updateData.baseHp = body.baseStats.hp
      if (body.baseStats.attack !== undefined) updateData.baseAttack = body.baseStats.attack
      if (body.baseStats.defense !== undefined) updateData.baseDefense = body.baseStats.defense
      if (body.baseStats.specialAttack !== undefined) updateData.baseSpAtk = body.baseStats.specialAttack
      if (body.baseStats.specialDefense !== undefined) updateData.baseSpDef = body.baseStats.specialDefense
      if (body.baseStats.speed !== undefined) updateData.baseSpeed = body.baseStats.speed
    }

    if (body.currentStats) {
      if (body.currentStats.attack !== undefined) updateData.currentAttack = body.currentStats.attack
      if (body.currentStats.defense !== undefined) updateData.currentDefense = body.currentStats.defense
      if (body.currentStats.specialAttack !== undefined) updateData.currentSpAtk = body.currentStats.specialAttack
      if (body.currentStats.specialDefense !== undefined) updateData.currentSpDef = body.currentStats.specialDefense
      if (body.currentStats.speed !== undefined) updateData.currentSpeed = body.currentStats.speed
    }

    const pokemon = await prisma.pokemon.update({
      where: { id },
      data: updateData
    })

    return { success: true, data: serializePokemon(pokemon) }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to update pokemon'
    })
  }
})
