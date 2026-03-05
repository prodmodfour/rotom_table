import { z } from 'zod'
import { prisma } from '~/server/utils/prisma'
import { computeEquipmentBonuses, getEquipmentGrantedCapabilities } from '~/utils/equipmentBonuses'
import { EQUIPMENT_SLOTS } from '~/constants/equipment'
import type { EquipmentSlots, EquipmentSlot } from '~/types/character'

// Valid stat keys for Focus-style stat bonuses
const VALID_STAT_BONUS_KEYS = [
  'hp', 'attack', 'defense', 'specialAttack', 'specialDefense', 'speed',
  'accuracy', 'evasion'
] as const

// Zod schema for a single equipped item
const equippedItemSchema = z.object({
  name: z.string().min(1, 'Item name must be a non-empty string'),
  slot: z.enum(['head', 'body', 'mainHand', 'offHand', 'feet', 'accessory']),
  damageReduction: z.number().int().min(0).max(100).optional(),
  evasionBonus: z.number().int().min(0).max(100).optional(),
  statBonus: z.object({
    stat: z.enum(VALID_STAT_BONUS_KEYS),
    value: z.number().int().min(1).max(100)
  }).optional(),
  conditionalDR: z.object({
    amount: z.number().int().min(0).max(100),
    condition: z.string().min(1)
  }).optional(),
  speedDefaultCS: z.number().int().min(-6).max(0).optional(),
  canReady: z.boolean().optional(),
  readiedBonuses: z.object({
    evasionBonus: z.number().int().min(0).max(100),
    damageReduction: z.number().int().min(0).max(100),
    appliesSlowed: z.boolean()
  }).optional(),
  conditionalSpeedPenalty: z.object({
    amount: z.number().int().min(-10).max(0),
    condition: z.string().min(1)
  }).optional(),
  grantedCapabilities: z.array(z.string().min(1)).optional(),
  description: z.string().optional(),
  cost: z.number().int().min(0).optional(),
  twoHanded: z.boolean().optional()
}).strict()

/**
 * PUT /api/characters/:id/equipment
 * Equips or unequips items. Accepts a partial EquipmentSlots object.
 * Setting a slot to null unequips it.
 *
 * Request body: { slots: { [slotName]: EquippedItem | null } }
 *
 * Validation:
 * - Each item is validated against the EquippedItem Zod schema
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

  // Validate each slot and build a sanitized update map
  const rawSlots = body.slots as Record<string, unknown>
  const validatedSlots: Record<string, z.infer<typeof equippedItemSchema> | null> = {}

  for (const [slotKey, item] of Object.entries(rawSlots)) {
    // Validate slot name is a known equipment slot
    if (!EQUIPMENT_SLOTS.includes(slotKey as EquipmentSlot)) {
      throw createError({
        statusCode: 400,
        message: `Invalid equipment slot: "${slotKey}". Valid slots: ${EQUIPMENT_SLOTS.join(', ')}`
      })
    }

    // null means unequip — skip further validation
    if (item === null) {
      validatedSlots[slotKey] = null
      continue
    }

    // Validate item shape against Zod schema
    const parseResult = equippedItemSchema.safeParse(item)
    if (!parseResult.success) {
      const issues = parseResult.error.issues
        .map(i => `${i.path.join('.')}: ${i.message}`)
        .join('; ')
      throw createError({
        statusCode: 400,
        message: `Invalid item in slot "${slotKey}": ${issues}`
      })
    }

    // Validate item's slot field matches the key it is assigned to
    if (parseResult.data.slot !== slotKey) {
      throw createError({
        statusCode: 400,
        message: `Item "${parseResult.data.name}" has slot "${parseResult.data.slot}" but was assigned to "${slotKey}"`
      })
    }

    validatedSlots[slotKey] = parseResult.data
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

    for (const [slotKey, item] of Object.entries(validatedSlots)) {
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
    const grantedCapabilities = getEquipmentGrantedCapabilities(updatedEquipment)

    return {
      success: true,
      data: {
        slots: updatedEquipment,
        aggregateBonuses,
        grantedCapabilities
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
