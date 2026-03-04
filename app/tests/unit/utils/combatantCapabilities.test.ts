import { describe, it, expect } from 'vitest'
import type { Combatant, Pokemon, HumanCharacter, PokemonCapabilities, TerrainType, TerrainCell, StatusCondition } from '~/types'
import type { EquipmentSlots, SkillRank } from '~/types/character'
import {
  getCombatantNaturewalks,
  naturewalkBypassesTerrain,
  findNaturewalkImmuneStatuses,
  getOverlandSpeed,
  getSwimSpeed,
  combatantCanSwim,
  getLivingWeaponConfig,
} from '~/utils/combatantCapabilities'
import type { Pokemon as FullPokemon } from '~/types/character'

/**
 * Build a minimal Pokemon combatant stub for testing Naturewalk functions.
 */
function makePokemonCombatant(capabilities?: Partial<PokemonCapabilities>): Combatant {
  const defaultCaps: PokemonCapabilities = {
    overland: 5,
    swim: 0,
    sky: 0,
    burrow: 0,
    levitate: 0,
    jump: { high: 1, long: 1 },
    power: 1,
    weightClass: 1,
    size: 'Small',
    ...capabilities,
  }

  return {
    id: 'pkmn-1',
    type: 'pokemon',
    entityId: 'entity-1',
    side: 'players',
    initiative: 0,
    initiativeBonus: 0,
    turnState: {
      hasActed: false,
      standardActionUsed: false,
      shiftActionUsed: false,
      swiftActionUsed: false,
      canBeCommanded: true,
      isHolding: false,
    },
    hasActed: false,
    actionsRemaining: 1,
    shiftActionsRemaining: 1,
    tempConditions: [],
    injuries: { count: 0, sources: [] },
    physicalEvasion: 0,
    specialEvasion: 0,
    speedEvasion: 0,
    tokenSize: 1,
    entity: {
      id: 'entity-1',
      types: ['Grass'],
      statusConditions: [],
      stageModifiers: {
        attack: 0, defense: 0, specialAttack: 0,
        specialDefense: 0, speed: 0, accuracy: 0, evasion: 0,
      },
      capabilities: defaultCaps,
    } as unknown as Pokemon,
  }
}

function makeHumanCombatant(overrides?: {
  capabilities?: string[]
  position?: { x: number; y: number }
  equipment?: EquipmentSlots
  skills?: Record<string, SkillRank>
}): Combatant {
  return {
    id: 'human-1',
    type: 'human',
    entityId: 'entity-2',
    side: 'players',
    initiative: 0,
    initiativeBonus: 0,
    turnState: {
      hasActed: false,
      standardActionUsed: false,
      shiftActionUsed: false,
      swiftActionUsed: false,
      canBeCommanded: true,
      isHolding: false,
    },
    hasActed: false,
    actionsRemaining: 1,
    shiftActionsRemaining: 1,
    tempConditions: [],
    injuries: { count: 0, sources: [] },
    physicalEvasion: 0,
    specialEvasion: 0,
    speedEvasion: 0,
    tokenSize: 1,
    ...(overrides?.position ? { position: overrides.position } : {}),
    entity: {
      id: 'entity-2',
      statusConditions: [],
      stageModifiers: {
        attack: 0, defense: 0, specialAttack: 0,
        specialDefense: 0, speed: 0, accuracy: 0, evasion: 0,
      },
      skills: overrides?.skills ?? {},
      ...(overrides?.capabilities ? { capabilities: overrides.capabilities } : {}),
      ...(overrides?.equipment ? { equipment: overrides.equipment } : {}),
    } as Combatant['entity'],
  }
}

describe('getCombatantNaturewalks', () => {
  it('should return empty array for human combatant', () => {
    const human = makeHumanCombatant()
    expect(getCombatantNaturewalks(human)).toEqual([])
  })

  it('should return empty array for Pokemon without capabilities', () => {
    const pokemon = makePokemonCombatant()
    // Remove capabilities entirely
    ;(pokemon.entity as any).capabilities = undefined
    expect(getCombatantNaturewalks(pokemon)).toEqual([])
  })

  it('should return empty array for Pokemon without naturewalk or otherCapabilities', () => {
    const pokemon = makePokemonCombatant()
    expect(getCombatantNaturewalks(pokemon)).toEqual([])
  })

  it('should return terrain names from capabilities.naturewalk field', () => {
    const pokemon = makePokemonCombatant({
      naturewalk: ['Forest', 'Grassland'],
    })
    const result = getCombatantNaturewalks(pokemon)
    expect(result).toContain('Forest')
    expect(result).toContain('Grassland')
    expect(result).toHaveLength(2)
  })

  it('should parse Naturewalk from otherCapabilities string with comma separator', () => {
    const pokemon = makePokemonCombatant({
      otherCapabilities: ['Naturewalk (Forest, Grassland)'],
    })
    const result = getCombatantNaturewalks(pokemon)
    expect(result).toContain('Forest')
    expect(result).toContain('Grassland')
    expect(result).toHaveLength(2)
  })

  it('should parse Naturewalk from otherCapabilities string with "and" separator', () => {
    const pokemon = makePokemonCombatant({
      otherCapabilities: ['Naturewalk (Forest and Grassland)'],
    })
    const result = getCombatantNaturewalks(pokemon)
    expect(result).toContain('Forest')
    expect(result).toContain('Grassland')
    expect(result).toHaveLength(2)
  })

  it('should parse single terrain from otherCapabilities', () => {
    const pokemon = makePokemonCombatant({
      otherCapabilities: ['Naturewalk (Ocean)'],
    })
    const result = getCombatantNaturewalks(pokemon)
    expect(result).toEqual(['Ocean'])
  })

  it('should ignore non-Naturewalk entries in otherCapabilities', () => {
    const pokemon = makePokemonCombatant({
      otherCapabilities: ['Glow', 'Naturewalk (Cave)', 'Firestarter'],
    })
    const result = getCombatantNaturewalks(pokemon)
    expect(result).toEqual(['Cave'])
  })

  it('should deduplicate when same terrain appears in both sources', () => {
    const pokemon = makePokemonCombatant({
      naturewalk: ['Forest', 'Grassland'],
      otherCapabilities: ['Naturewalk (Forest, Mountain)'],
    })
    const result = getCombatantNaturewalks(pokemon)
    // Forest appears in both, should be deduplicated
    expect(result).toContain('Forest')
    expect(result).toContain('Grassland')
    expect(result).toContain('Mountain')
    expect(result).toHaveLength(3)
  })

  it('should return direct field when otherCapabilities is empty', () => {
    const pokemon = makePokemonCombatant({
      naturewalk: ['Tundra'],
      otherCapabilities: [],
    })
    expect(getCombatantNaturewalks(pokemon)).toEqual(['Tundra'])
  })

  it('should return parsed field when naturewalk is empty', () => {
    const pokemon = makePokemonCombatant({
      naturewalk: [],
      otherCapabilities: ['Naturewalk (Desert)'],
    })
    expect(getCombatantNaturewalks(pokemon)).toEqual(['Desert'])
  })
})

describe('naturewalkBypassesTerrain', () => {
  it('should return false for human combatant', () => {
    const human = makeHumanCombatant()
    expect(naturewalkBypassesTerrain(human, 'normal')).toBe(false)
  })

  it('should return false for Pokemon without Naturewalk', () => {
    const pokemon = makePokemonCombatant()
    expect(naturewalkBypassesTerrain(pokemon, 'normal')).toBe(false)
  })

  it('should return true when Naturewalk (Forest) matches normal base type', () => {
    // Forest maps to ['normal'] in NATUREWALK_TERRAIN_MAP
    const pokemon = makePokemonCombatant({
      naturewalk: ['Forest'],
    })
    expect(naturewalkBypassesTerrain(pokemon, 'normal')).toBe(true)
  })

  it('should return false when Naturewalk (Ocean) does not match normal base type', () => {
    // Ocean maps to ['water'] — does not include 'normal'
    const pokemon = makePokemonCombatant({
      naturewalk: ['Ocean'],
    })
    expect(naturewalkBypassesTerrain(pokemon, 'normal')).toBe(false)
  })

  it('should return true when Naturewalk (Ocean) matches water base type', () => {
    const pokemon = makePokemonCombatant({
      naturewalk: ['Ocean'],
    })
    expect(naturewalkBypassesTerrain(pokemon, 'water')).toBe(true)
  })

  it('should return true when Naturewalk (Wetlands) matches water base type', () => {
    // Wetlands maps to ['water', 'normal']
    const pokemon = makePokemonCombatant({
      naturewalk: ['Wetlands'],
    })
    expect(naturewalkBypassesTerrain(pokemon, 'water')).toBe(true)
  })

  it('should return true when Naturewalk (Wetlands) matches normal base type', () => {
    const pokemon = makePokemonCombatant({
      naturewalk: ['Wetlands'],
    })
    expect(naturewalkBypassesTerrain(pokemon, 'normal')).toBe(true)
  })

  it('should return true when Naturewalk (Mountain) matches elevated base type', () => {
    // Mountain maps to ['elevated', 'normal']
    const pokemon = makePokemonCombatant({
      naturewalk: ['Mountain'],
    })
    expect(naturewalkBypassesTerrain(pokemon, 'elevated')).toBe(true)
  })

  it('should return true when Naturewalk (Cave) matches earth base type', () => {
    // Cave maps to ['earth', 'normal']
    const pokemon = makePokemonCombatant({
      naturewalk: ['Cave'],
    })
    expect(naturewalkBypassesTerrain(pokemon, 'earth')).toBe(true)
  })

  it('should handle multiple Naturewalk terrains — any match returns true', () => {
    const pokemon = makePokemonCombatant({
      naturewalk: ['Forest', 'Ocean'],
    })
    // Forest maps to ['normal'], Ocean maps to ['water']
    expect(naturewalkBypassesTerrain(pokemon, 'normal')).toBe(true)
    expect(naturewalkBypassesTerrain(pokemon, 'water')).toBe(true)
  })

  it('should return false for blocking terrain even with Naturewalk', () => {
    const pokemon = makePokemonCombatant({
      naturewalk: ['Forest', 'Mountain', 'Cave', 'Ocean'],
    })
    // Blocking terrain is never bypassed — no Naturewalk maps to 'blocking'
    expect(naturewalkBypassesTerrain(pokemon, 'blocking')).toBe(false)
  })

  it('should handle Naturewalk from otherCapabilities parsed source', () => {
    const pokemon = makePokemonCombatant({
      otherCapabilities: ['Naturewalk (Forest, Grassland)'],
    })
    // Both Forest and Grassland map to ['normal']
    expect(naturewalkBypassesTerrain(pokemon, 'normal')).toBe(true)
  })

  it('should return false for unrecognized Naturewalk terrain name', () => {
    // An invalid terrain name that is not in NATUREWALK_TERRAIN_MAP
    const pokemon = makePokemonCombatant({
      naturewalk: ['Swamp'],
    })
    expect(naturewalkBypassesTerrain(pokemon, 'normal')).toBe(false)
    expect(naturewalkBypassesTerrain(pokemon, 'water')).toBe(false)
  })
})

// =========================================================
// Trainer Naturewalk (PTU p.149 — Survivalist class feature)
// =========================================================

describe('getCombatantNaturewalks — trainer with capabilities', () => {
  it('should return terrain names from trainer capabilities', () => {
    const human = makeHumanCombatant({ capabilities: ['Naturewalk (Forest)'] })
    const result = getCombatantNaturewalks(human)
    expect(result).toEqual(['Forest'])
  })

  it('should return multiple terrains from trainer capabilities', () => {
    const human = makeHumanCombatant({
      capabilities: ['Naturewalk (Forest)', 'Naturewalk (Mountain)'],
    })
    const result = getCombatantNaturewalks(human)
    expect(result).toContain('Forest')
    expect(result).toContain('Mountain')
    expect(result).toHaveLength(2)
  })

  it('should parse multi-terrain Naturewalk from trainer capabilities', () => {
    const human = makeHumanCombatant({
      capabilities: ['Naturewalk (Forest, Grassland)'],
    })
    const result = getCombatantNaturewalks(human)
    expect(result).toContain('Forest')
    expect(result).toContain('Grassland')
    expect(result).toHaveLength(2)
  })

  it('should return empty array for trainer with non-Naturewalk capabilities', () => {
    const human = makeHumanCombatant({ capabilities: ['Glow', 'Firestarter'] })
    expect(getCombatantNaturewalks(human)).toEqual([])
  })

  it('should return empty array for trainer with empty capabilities', () => {
    const human = makeHumanCombatant({ capabilities: [] })
    expect(getCombatantNaturewalks(human)).toEqual([])
  })
})

describe('naturewalkBypassesTerrain — trainer with capabilities', () => {
  it('should return true when trainer Naturewalk (Forest) matches normal terrain', () => {
    const human = makeHumanCombatant({ capabilities: ['Naturewalk (Forest)'] })
    expect(naturewalkBypassesTerrain(human, 'normal')).toBe(true)
  })

  it('should return true when trainer Naturewalk (Ocean) matches water terrain', () => {
    const human = makeHumanCombatant({ capabilities: ['Naturewalk (Ocean)'] })
    expect(naturewalkBypassesTerrain(human, 'water')).toBe(true)
  })

  it('should return false when trainer Naturewalk (Forest) does not match water terrain', () => {
    const human = makeHumanCombatant({ capabilities: ['Naturewalk (Forest)'] })
    expect(naturewalkBypassesTerrain(human, 'water')).toBe(false)
  })

  it('should return false for trainer without Naturewalk on any terrain', () => {
    const human = makeHumanCombatant({ capabilities: ['Glow'] })
    expect(naturewalkBypassesTerrain(human, 'normal')).toBe(false)
  })
})

// =========================================================
// findNaturewalkImmuneStatuses — trainer + terrain
// =========================================================

describe('findNaturewalkImmuneStatuses', () => {
  const forestCell: TerrainCell = {
    position: { x: 3, y: 5 },
    type: 'normal',
    rough: true,
    slow: false,
    elevation: 0,
  }

  const waterCell: TerrainCell = {
    position: { x: 1, y: 1 },
    type: 'water',
    rough: false,
    slow: true,
    elevation: 0,
  }

  it('should return Slowed and Stuck for trainer on matching terrain', () => {
    const human = makeHumanCombatant({
      capabilities: ['Naturewalk (Forest)'],
      position: { x: 3, y: 5 },
    })
    const result = findNaturewalkImmuneStatuses(
      human,
      ['Slowed', 'Stuck'],
      [forestCell],
      true
    )
    expect(result).toContain('Slowed')
    expect(result).toContain('Stuck')
    expect(result).toHaveLength(2)
  })

  it('should return only Slowed when only Slowed is applied on matching terrain', () => {
    const human = makeHumanCombatant({
      capabilities: ['Naturewalk (Forest)'],
      position: { x: 3, y: 5 },
    })
    const result = findNaturewalkImmuneStatuses(
      human,
      ['Slowed'],
      [forestCell],
      true
    )
    expect(result).toEqual(['Slowed'])
  })

  it('should return empty array for trainer on non-matching terrain', () => {
    const human = makeHumanCombatant({
      capabilities: ['Naturewalk (Ocean)'],
      position: { x: 3, y: 5 },
    })
    const result = findNaturewalkImmuneStatuses(
      human,
      ['Slowed', 'Stuck'],
      [forestCell],
      true
    )
    expect(result).toEqual([])
  })

  it('should return empty array when terrain is disabled', () => {
    const human = makeHumanCombatant({
      capabilities: ['Naturewalk (Forest)'],
      position: { x: 3, y: 5 },
    })
    const result = findNaturewalkImmuneStatuses(
      human,
      ['Slowed', 'Stuck'],
      [forestCell],
      false
    )
    expect(result).toEqual([])
  })

  it('should return empty array when combatant has no position', () => {
    const human = makeHumanCombatant({
      capabilities: ['Naturewalk (Forest)'],
    })
    const result = findNaturewalkImmuneStatuses(
      human,
      ['Slowed', 'Stuck'],
      [forestCell],
      true
    )
    expect(result).toEqual([])
  })

  it('should return empty array for non-Naturewalk-immune statuses', () => {
    const human = makeHumanCombatant({
      capabilities: ['Naturewalk (Forest)'],
      position: { x: 3, y: 5 },
    })
    const result = findNaturewalkImmuneStatuses(
      human,
      ['Paralysis', 'Burned'] as StatusCondition[],
      [forestCell],
      true
    )
    expect(result).toEqual([])
  })

  it('should work for Pokemon on matching terrain', () => {
    const pokemon = makePokemonCombatant({ naturewalk: ['Ocean'] })
    // Add position to the pokemon combatant
    const positionedPokemon = { ...pokemon, position: { x: 1, y: 1 } }
    const result = findNaturewalkImmuneStatuses(
      positionedPokemon,
      ['Slowed', 'Stuck'],
      [waterCell],
      true
    )
    expect(result).toContain('Slowed')
    expect(result).toContain('Stuck')
  })

  it('should default to normal terrain when combatant is not on a terrain cell', () => {
    const human = makeHumanCombatant({
      capabilities: ['Naturewalk (Forest)'],
      position: { x: 99, y: 99 },
    })
    // Forest maps to ['normal'], and default terrain is 'normal'
    const result = findNaturewalkImmuneStatuses(
      human,
      ['Slowed'],
      [forestCell], // cell at (3,5), not (99,99)
      true
    )
    // Position (99,99) has no cell -> defaults to 'normal' -> Forest matches 'normal'
    expect(result).toEqual(['Slowed'])
  })
})

// =========================================================
// Equipment-derived Naturewalk (PTU p.293 — Snow Boots, Jungle Boots)
// =========================================================

describe('getCombatantNaturewalks — equipment-derived capabilities', () => {
  it('should return Naturewalk terrain from equipped Snow Boots', () => {
    const human = makeHumanCombatant({
      equipment: {
        feet: {
          name: 'Snow Boots',
          slot: 'feet',
          grantedCapabilities: ['Naturewalk (Tundra)'],
        },
      },
    })
    const result = getCombatantNaturewalks(human)
    expect(result).toEqual(['Tundra'])
  })

  it('should return Naturewalk terrain from equipped Jungle Boots', () => {
    const human = makeHumanCombatant({
      equipment: {
        feet: {
          name: 'Jungle Boots',
          slot: 'feet',
          grantedCapabilities: ['Naturewalk (Forest)'],
        },
      },
    })
    const result = getCombatantNaturewalks(human)
    expect(result).toEqual(['Forest'])
  })

  it('should return empty array when equipment has no grantedCapabilities', () => {
    const human = makeHumanCombatant({
      equipment: {
        body: {
          name: 'Light Armor',
          slot: 'body',
          damageReduction: 5,
        },
      },
    })
    expect(getCombatantNaturewalks(human)).toEqual([])
  })

  it('should return empty array when equipment has non-Naturewalk capabilities', () => {
    const human = makeHumanCombatant({
      equipment: {
        head: {
          name: 'Night Goggles',
          slot: 'head',
          grantedCapabilities: ['Darkvision'],
        },
      },
    })
    expect(getCombatantNaturewalks(human)).toEqual([])
  })

  it('should merge manual and equipment-derived Naturewalk terrains', () => {
    const human = makeHumanCombatant({
      capabilities: ['Naturewalk (Forest)'],
      equipment: {
        feet: {
          name: 'Snow Boots',
          slot: 'feet',
          grantedCapabilities: ['Naturewalk (Tundra)'],
        },
      },
    })
    const result = getCombatantNaturewalks(human)
    expect(result).toContain('Forest')
    expect(result).toContain('Tundra')
    expect(result).toHaveLength(2)
  })

  it('should deduplicate when manual and equipment grant the same Naturewalk terrain', () => {
    const human = makeHumanCombatant({
      capabilities: ['Naturewalk (Forest)'],
      equipment: {
        feet: {
          name: 'Jungle Boots',
          slot: 'feet',
          grantedCapabilities: ['Naturewalk (Forest)'],
        },
      },
    })
    const result = getCombatantNaturewalks(human)
    expect(result).toEqual(['Forest'])
  })

  it('should merge capabilities from multiple equipment slots', () => {
    const human = makeHumanCombatant({
      equipment: {
        feet: {
          name: 'Snow Boots',
          slot: 'feet',
          grantedCapabilities: ['Naturewalk (Tundra)'],
        },
        accessory: {
          name: 'Forest Charm',
          slot: 'accessory',
          grantedCapabilities: ['Naturewalk (Forest)'],
        },
      },
    })
    const result = getCombatantNaturewalks(human)
    expect(result).toContain('Tundra')
    expect(result).toContain('Forest')
    expect(result).toHaveLength(2)
  })

  it('should handle equipment item with multiple Naturewalk capabilities', () => {
    const human = makeHumanCombatant({
      equipment: {
        feet: {
          name: 'All-Terrain Boots',
          slot: 'feet',
          grantedCapabilities: ['Naturewalk (Tundra)', 'Naturewalk (Forest)'],
        },
      },
    })
    const result = getCombatantNaturewalks(human)
    expect(result).toContain('Tundra')
    expect(result).toContain('Forest')
    expect(result).toHaveLength(2)
  })
})

describe('naturewalkBypassesTerrain — equipment-derived capabilities', () => {
  it('should return true when Snow Boots Naturewalk (Tundra) matches normal terrain', () => {
    // Tundra maps to ['normal'] in NATUREWALK_TERRAIN_MAP
    const human = makeHumanCombatant({
      equipment: {
        feet: {
          name: 'Snow Boots',
          slot: 'feet',
          grantedCapabilities: ['Naturewalk (Tundra)'],
        },
      },
    })
    expect(naturewalkBypassesTerrain(human, 'normal')).toBe(true)
  })

  it('should return true when Jungle Boots Naturewalk (Forest) matches normal terrain', () => {
    // Forest maps to ['normal'] in NATUREWALK_TERRAIN_MAP
    const human = makeHumanCombatant({
      equipment: {
        feet: {
          name: 'Jungle Boots',
          slot: 'feet',
          grantedCapabilities: ['Naturewalk (Forest)'],
        },
      },
    })
    expect(naturewalkBypassesTerrain(human, 'normal')).toBe(true)
  })

  it('should return false when equipment Naturewalk does not match terrain type', () => {
    const human = makeHumanCombatant({
      equipment: {
        feet: {
          name: 'Snow Boots',
          slot: 'feet',
          grantedCapabilities: ['Naturewalk (Tundra)'],
        },
      },
    })
    // Tundra maps to ['normal'], not 'water'
    expect(naturewalkBypassesTerrain(human, 'water')).toBe(false)
  })

  it('should return true when either manual or equipment Naturewalk matches', () => {
    const human = makeHumanCombatant({
      capabilities: ['Naturewalk (Ocean)'],
      equipment: {
        feet: {
          name: 'Snow Boots',
          slot: 'feet',
          grantedCapabilities: ['Naturewalk (Tundra)'],
        },
      },
    })
    // Manual Ocean maps to ['water'], equipment Tundra maps to ['normal']
    expect(naturewalkBypassesTerrain(human, 'water')).toBe(true)
    expect(naturewalkBypassesTerrain(human, 'normal')).toBe(true)
  })

  it('should return false for blocking terrain even with equipment Naturewalk', () => {
    const human = makeHumanCombatant({
      equipment: {
        feet: {
          name: 'Snow Boots',
          slot: 'feet',
          grantedCapabilities: ['Naturewalk (Tundra)'],
        },
      },
    })
    expect(naturewalkBypassesTerrain(human, 'blocking')).toBe(false)
  })
})

describe('findNaturewalkImmuneStatuses — equipment-derived capabilities', () => {
  const normalCell: TerrainCell = {
    position: { x: 5, y: 5 },
    type: 'normal',
    rough: true,
    slow: false,
    elevation: 0,
  }

  const waterCell: TerrainCell = {
    position: { x: 2, y: 2 },
    type: 'water',
    rough: false,
    slow: true,
    elevation: 0,
  }

  it('should grant Slowed/Stuck immunity from equipment-derived Naturewalk on matching terrain', () => {
    const human = makeHumanCombatant({
      equipment: {
        feet: {
          name: 'Snow Boots',
          slot: 'feet',
          grantedCapabilities: ['Naturewalk (Tundra)'],
        },
      },
      position: { x: 5, y: 5 },
    })
    // Tundra maps to ['normal'], cell at (5,5) is 'normal'
    const result = findNaturewalkImmuneStatuses(
      human,
      ['Slowed', 'Stuck'],
      [normalCell],
      true
    )
    expect(result).toContain('Slowed')
    expect(result).toContain('Stuck')
    expect(result).toHaveLength(2)
  })

  it('should not grant immunity from equipment Naturewalk on non-matching terrain', () => {
    const human = makeHumanCombatant({
      equipment: {
        feet: {
          name: 'Snow Boots',
          slot: 'feet',
          grantedCapabilities: ['Naturewalk (Tundra)'],
        },
      },
      position: { x: 2, y: 2 },
    })
    // Tundra maps to ['normal'], but cell at (2,2) is 'water'
    const result = findNaturewalkImmuneStatuses(
      human,
      ['Slowed', 'Stuck'],
      [waterCell],
      true
    )
    expect(result).toEqual([])
  })

  it('should grant immunity when manual OR equipment Naturewalk matches terrain', () => {
    // Manual has Ocean (water), equipment has Tundra (normal)
    // Standing on water cell -> Ocean matches
    const human = makeHumanCombatant({
      capabilities: ['Naturewalk (Ocean)'],
      equipment: {
        feet: {
          name: 'Snow Boots',
          slot: 'feet',
          grantedCapabilities: ['Naturewalk (Tundra)'],
        },
      },
      position: { x: 2, y: 2 },
    })
    const result = findNaturewalkImmuneStatuses(
      human,
      ['Slowed'],
      [waterCell],
      true
    )
    expect(result).toEqual(['Slowed'])
  })

  it('should not grant immunity for non-Naturewalk-immune statuses from equipment', () => {
    const human = makeHumanCombatant({
      equipment: {
        feet: {
          name: 'Snow Boots',
          slot: 'feet',
          grantedCapabilities: ['Naturewalk (Tundra)'],
        },
      },
      position: { x: 5, y: 5 },
    })
    const result = findNaturewalkImmuneStatuses(
      human,
      ['Paralysis', 'Burned'] as StatusCondition[],
      [normalCell],
      true
    )
    expect(result).toEqual([])
  })

  it('should not grant immunity when terrain is disabled even with equipment Naturewalk', () => {
    const human = makeHumanCombatant({
      equipment: {
        feet: {
          name: 'Snow Boots',
          slot: 'feet',
          grantedCapabilities: ['Naturewalk (Tundra)'],
        },
      },
      position: { x: 5, y: 5 },
    })
    const result = findNaturewalkImmuneStatuses(
      human,
      ['Slowed', 'Stuck'],
      [normalCell],
      false
    )
    expect(result).toEqual([])
  })

  it('should not grant immunity when equipment-equipped combatant has no position', () => {
    const human = makeHumanCombatant({
      equipment: {
        feet: {
          name: 'Snow Boots',
          slot: 'feet',
          grantedCapabilities: ['Naturewalk (Tundra)'],
        },
      },
    })
    const result = findNaturewalkImmuneStatuses(
      human,
      ['Slowed', 'Stuck'],
      [normalCell],
      true
    )
    expect(result).toEqual([])
  })
})

// =========================================================
// Trainer Derived Speed Functions (PTU Core p.16)
// =========================================================

describe('getOverlandSpeed — human trainer', () => {
  it('should return correct derived Overland for human with Adept Athletics and Novice Acrobatics', () => {
    // Athletics=Adept(4), Acrobatics=Novice(3) -> 3 + floor((4+3)/2) = 3 + 3 = 6
    const human = makeHumanCombatant({
      skills: { Athletics: 'Adept', Acrobatics: 'Novice' },
    })
    expect(getOverlandSpeed(human)).toBe(6)
  })

  it('should return correct derived Overland for human with Expert Athletics and Expert Acrobatics', () => {
    // Athletics=Expert(5), Acrobatics=Expert(5) -> 3 + floor((5+5)/2) = 3 + 5 = 8
    const human = makeHumanCombatant({
      skills: { Athletics: 'Expert', Acrobatics: 'Expert' },
    })
    expect(getOverlandSpeed(human)).toBe(8)
  })

  it('should return correct derived Overland for human with Master Athletics and Master Acrobatics', () => {
    // Athletics=Master(6), Acrobatics=Master(6) -> 3 + floor((6+6)/2) = 3 + 6 = 9
    const human = makeHumanCombatant({
      skills: { Athletics: 'Master', Acrobatics: 'Master' },
    })
    expect(getOverlandSpeed(human)).toBe(9)
  })

  it('should default to 5 when human.skills is empty (Untrained defaults)', () => {
    // No skills -> Athletics=Untrained(2), Acrobatics=Untrained(2) -> 3 + floor((2+2)/2) = 3 + 2 = 5
    const human = makeHumanCombatant({ skills: {} })
    expect(getOverlandSpeed(human)).toBe(5)
  })

  it('should return 4 for Pathetic in both skills', () => {
    // Athletics=Pathetic(1), Acrobatics=Pathetic(1) -> 3 + floor((1+1)/2) = 3 + 1 = 4
    const human = makeHumanCombatant({
      skills: { Athletics: 'Pathetic', Acrobatics: 'Pathetic' },
    })
    expect(getOverlandSpeed(human)).toBe(4)
  })
})

describe('getSwimSpeed — human trainer', () => {
  it('should return floor(overland/2) for human with Adept Athletics and Novice Acrobatics', () => {
    // Overland = 6, Swimming = floor(6/2) = 3
    const human = makeHumanCombatant({
      skills: { Athletics: 'Adept', Acrobatics: 'Novice' },
    })
    expect(getSwimSpeed(human)).toBe(3)
  })

  it('should return floor(overland/2) for human with default skills', () => {
    // Overland = 5, Swimming = floor(5/2) = 2
    const human = makeHumanCombatant({ skills: {} })
    expect(getSwimSpeed(human)).toBe(2)
  })

  it('should return floor(overland/2) for odd Overland value', () => {
    // Athletics=Novice(3), Acrobatics=Adept(4) -> Overland = 3 + floor(7/2) = 3 + 3 = 6
    // Swimming = floor(6/2) = 3
    const human = makeHumanCombatant({
      skills: { Athletics: 'Novice', Acrobatics: 'Adept' },
    })
    expect(getSwimSpeed(human)).toBe(3)
  })
})

describe('combatantCanSwim', () => {
  it('should return true for any human combatant', () => {
    // All trainers have Swimming >= 2 (minimum Overland is 4, floor(4/2) = 2)
    const human = makeHumanCombatant()
    expect(combatantCanSwim(human)).toBe(true)
  })

  it('should return true for human with Pathetic skills', () => {
    const human = makeHumanCombatant({
      skills: { Athletics: 'Pathetic', Acrobatics: 'Pathetic' },
    })
    expect(combatantCanSwim(human)).toBe(true)
  })

  it('should return true for Pokemon with swim > 0', () => {
    const pokemon = makePokemonCombatant({ swim: 3 })
    expect(combatantCanSwim(pokemon)).toBe(true)
  })

  it('should return false for Pokemon with swim = 0', () => {
    const pokemon = makePokemonCombatant({ swim: 0 })
    expect(combatantCanSwim(pokemon)).toBe(false)
  })
})

describe('getOverlandSpeed / getSwimSpeed — Pokemon paths unchanged', () => {
  it('should return Pokemon overland from capabilities', () => {
    const pokemon = makePokemonCombatant({ overland: 7 })
    expect(getOverlandSpeed(pokemon)).toBe(7)
  })

  it('should return Pokemon swim from capabilities', () => {
    const pokemon = makePokemonCombatant({ swim: 4 })
    expect(getSwimSpeed(pokemon)).toBe(4)
  })

  it('should default Pokemon overland to 5 when capabilities missing', () => {
    const pokemon = makePokemonCombatant()
    ;(pokemon.entity as any).capabilities = undefined
    expect(getOverlandSpeed(pokemon)).toBe(5)
  })

  it('should default Pokemon swim to 0 when capabilities missing', () => {
    const pokemon = makePokemonCombatant()
    ;(pokemon.entity as any).capabilities = undefined
    expect(getSwimSpeed(pokemon)).toBe(0)
  })
})

// =========================================================
// getLivingWeaponConfig (PTU pp.305-306)
// =========================================================

describe('getLivingWeaponConfig', () => {
  function makeLWPokemon(species: string, otherCapabilities?: string[]): FullPokemon {
    return {
      id: 'pkmn-lw-1',
      species,
      capabilities: {
        overland: 3, swim: 0, sky: 0, burrow: 0, levitate: 0,
        jump: { high: 1, long: 1 }, power: 2, weightClass: 1, size: 'Small',
        ...(otherCapabilities ? { otherCapabilities } : {}),
      },
    } as unknown as FullPokemon
  }

  it('should return Honedge config for Honedge species', () => {
    const config = getLivingWeaponConfig(makeLWPokemon('Honedge'))
    expect(config).not.toBeNull()
    expect(config!.species).toBe('Honedge')
    expect(config!.weaponType).toBe('Simple')
    expect(config!.occupiedSlots).toEqual(['mainHand'])
    expect(config!.grantsShield).toBe(false)
    expect(config!.grantedMoves).toHaveLength(1)
    expect(config!.grantedMoves[0].name).toBe('Wounding Strike')
  })

  it('should return Doublade config for Doublade species', () => {
    const config = getLivingWeaponConfig(makeLWPokemon('Doublade'))
    expect(config).not.toBeNull()
    expect(config!.species).toBe('Doublade')
    expect(config!.weaponType).toBe('Simple')
    expect(config!.occupiedSlots).toEqual(['mainHand', 'offHand'])
    expect(config!.dualWieldEvasionBonus).toBe(2)
    expect(config!.grantedMoves).toHaveLength(1)
    expect(config!.grantedMoves[0].name).toBe('Double Swipe')
  })

  it('should return Aegislash config for Aegislash species', () => {
    const config = getLivingWeaponConfig(makeLWPokemon('Aegislash'))
    expect(config).not.toBeNull()
    expect(config!.species).toBe('Aegislash')
    expect(config!.weaponType).toBe('Fine')
    expect(config!.grantsShield).toBe(true)
    expect(config!.grantedMoves).toHaveLength(2)
    expect(config!.grantedMoves.map(m => m.name)).toContain('Wounding Strike')
    expect(config!.grantedMoves.map(m => m.name)).toContain('Bleed!')
  })

  it('should return null for non-Living Weapon species without otherCapabilities', () => {
    const config = getLivingWeaponConfig(makeLWPokemon('Pikachu'))
    expect(config).toBeNull()
  })

  it('should return null for species without capabilities at all', () => {
    const pokemon = { id: 'p', species: 'Pikachu' } as unknown as FullPokemon
    expect(getLivingWeaponConfig(pokemon)).toBeNull()
  })

  it('should return Honedge-based config for homebrew species with Living Weapon otherCapability', () => {
    const config = getLivingWeaponConfig(makeLWPokemon('HomebrewBlade', ['Living Weapon']))
    expect(config).not.toBeNull()
    expect(config!.species).toBe('HomebrewBlade')
    expect(config!.weaponType).toBe('Simple')
    expect(config!.grantedMoves).toHaveLength(1)
    expect(config!.grantedMoves[0].name).toBe('Wounding Strike')
    expect(config!.equipmentDescription).toBe('Living Weapon (HomebrewBlade)')
  })

  it('should handle case-insensitive Living Weapon capability check', () => {
    const config = getLivingWeaponConfig(makeLWPokemon('CustomMon', ['living weapon']))
    expect(config).not.toBeNull()
    expect(config!.species).toBe('CustomMon')
  })

  it('should handle Living Weapon with whitespace', () => {
    const config = getLivingWeaponConfig(makeLWPokemon('CustomMon', [' Living Weapon ']))
    expect(config).not.toBeNull()
  })

  it('should return null for otherCapabilities that do not match Living Weapon', () => {
    const config = getLivingWeaponConfig(makeLWPokemon('Pikachu', ['Glow', 'Firestarter']))
    expect(config).toBeNull()
  })
})
