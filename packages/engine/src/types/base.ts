/** Pokemon types — standard 18-type system (Gen VI+, including Fairy) */
export type PokemonType =
  | 'normal' | 'fire' | 'water' | 'electric' | 'grass' | 'ice'
  | 'fighting' | 'poison' | 'ground' | 'flying' | 'psychic' | 'bug'
  | 'rock' | 'ghost' | 'dragon' | 'dark' | 'steel' | 'fairy'

export type DamageClass = 'physical' | 'special'

export type Side = 'allies' | 'enemies' | 'neutral'

export type StatKey = 'hp' | 'atk' | 'def' | 'spatk' | 'spdef' | 'spd' | 'stamina'

/** The 6 stats that have combat stages (not HP, not Stamina) */
export type CombatStatKey = 'atk' | 'def' | 'spatk' | 'spdef' | 'spd'

export type StatBlock = Record<StatKey, number>

export type CombatStages = Record<CombatStatKey | 'accuracy', number>

export type EntityId = string

export interface GridPosition {
  x: number
  y: number
}

export type MovementType = 'land' | 'fly' | 'swim' | 'phase' | 'burrow' | 'teleport'

export interface MoveRef {
  id: string
  name: string
}

export interface TraitRef {
  id: string
  name: string
  category: 'innate' | 'learned' | 'emergent'
  scalingParams?: Record<string, number>
}

export interface ItemRef {
  id: string
  name: string
}

export interface MovementProfile {
  type: MovementType
  speed: number
}
