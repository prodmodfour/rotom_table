import { prisma } from '~/server/utils/prisma'
import { computeEquipmentBonuses } from '~/utils/equipmentBonuses'
import { EQUIPMENT_SLOTS } from '~/constants/equipment'
import type { EquipmentSlots, EquipmentSlot, EquippedItem } from '~/types/character'

/**
 * PUT /api/characters/:id/equipment
 * Equips or unequips items. Accepts a partial EquipmentSlots object.
 * Setting a slot to null unequips it.
 *
 * Request body: { slots: { [slotName]: EquippedItem | null } }
 *
 * Validation:
 * - Each item's slot field must match the key it is assigned to
 * - Two-handed items auto-clear the offHand slot
 * - Returns updated equipment slots and aggregate bonuses
 */
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Character ID is required'
    })
  }

  if (!body.slots || typeof body.slots !== 'object') {
    throw createError({
      statusCode: 400,
      message: 'Request body must include a "slots" object'
    })
  }

  // Validate each slot in the request
  const slotsUpdate = body.slots as Record<string, EquippedItem | null>
  for (const [slotKey, item] of Object.entries(slotsUpdate)) {
    // Validate slot name is a known equipment slot
    if (!EQUIPMENT_SLOTS.includes(slotKey as EquipmentSlot)) {
      throw createError({
        statusCode: 400,
        message: `Invalid equipment slot: "${slotKey}". Valid slots: ${EQUIPMENT_SLOTS.join(', ')}`
      })
    }

    // null means unequip — skip further validation
    if (item === null) continue

    // Validate item has required fields
    if (!item.name || !item.slot) {
      throw createError({
        statusCode: 400,
        message: `Item in slot "${slotKey}" must have "name" and "slot" fields`
      })
    }

    // Validate item's slot field matches the key it is assigned to
    if (item.slot !== slotKey) {
      throw createError({
        statusCode: 400,
        message: `Item "${item.name}" has slot "${item.slot}" but was assigned to "${slotKey}"`
      })
    }
  }

  try {
    const character = await prisma.humanCharacter.findUnique({
      where: { id },
      select: { equipment: true }
    })

    if (!character) {
      throw createError({
        statusCode: 404,
        message: 'Character not found'
      })
    }

    // Parse existing equipment
    const currentEquipment: EquipmentSlots = JSON.parse(character.equipment || '{}')

    // Apply updates immutably
    let updatedEquipment: EquipmentSlots = { ...currentEquipment }

    for (const [slotKey, item] of Object.entries(slotsUpdate)) {
      const slot = slotKey as EquipmentSlot
      if (item === null) {
        // Unequip: remove the slot
        const { [slot]: _removed, ...rest } = updatedEquipment
        updatedEquipment = rest as EquipmentSlots
      } else {
        updatedEquipment = { ...updatedEquipment, [slot]: item }

        // Two-handed items auto-clear the offHand slot
        if (item.twoHanded && slot === 'mainHand') {
          const { offHand: _removed, ...rest } = updatedEquipment
          updatedEquipment = rest as EquipmentSlots
        }
        // If equipping offHand, check if mainHand is two-handed and clear it
        if (slot === 'offHand' && updatedEquipment.mainHand?.twoHanded) {
          const { mainHand: _removed, ...rest } = updatedEquipment
          updatedEquipment = rest as EquipmentSlots
        }
      }
    }

    // Persist
    await prisma.humanCharacter.update({
      where: { id },
      data: { equipment: JSON.stringify(updatedEquipment) }
    })

    const aggregateBonuses = computeEquipmentBonuses(updatedEquipment)

    return {
      success: true,
      data: {
        slots: updatedEquipment,
        aggregateBonuses
      }
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to update equipment'
    })
  }
})
