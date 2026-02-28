import { describe, it, expect } from 'vitest'
import type { Combatant, Pokemon, HumanCharacter, PokemonCapabilities, TerrainType, TerrainCell, StatusCondition } from '~/types'
import {
  getCombatantNaturewalks,
  naturewalkBypassesTerrain,
  findNaturewalkImmuneStatuses,
} from '~/utils/combatantCapabilities'

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

function makeHumanCombatant(overrides?: { capabilities?: string[]; position?: { x: number; y: number } }): Combatant {
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
      ...(overrides?.capabilities ? { capabilities: overrides.capabilities } : {}),
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
