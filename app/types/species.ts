// Species data types (from database)

/** Describes one possible evolution path from a species */
export interface EvolutionTrigger {
  /** Species name this species can evolve INTO */
  toSpecies: string
  /** Stage number of the target species (2 or 3) */
  targetStage: number
  /** Minimum level required (null if no level requirement, e.g. stone-only) */
  minimumLevel: number | null
  /** Required item: stone name or held item name (null if level-only) */
  requiredItem: string | null
  /** Whether the item must be held (vs consumed like a stone) */
  itemMustBeHeld: boolean
  /** P2: Gender requirement for this evolution ('Male', 'Female', or null for any) */
  requiredGender?: 'Male' | 'Female' | null
  /** P2: Move name the Pokemon must know to evolve (null if none required) */
  requiredMove?: string | null
}

export interface SpeciesData {
  id: string;
  name: string;
  type1: string;
  type2?: string | null;
  baseHp: number;
  baseAttack: number;
  baseDefense: number;
  baseSpAtk: number;
  baseSpDef: number;
  baseSpeed: number;
  abilities: string; // JSON array of ability names
  eggGroups: string; // JSON array
  evolutionStage: number;
  maxEvolutionStage: number;
  evolutionTriggers: string; // JSON array of EvolutionTrigger
  // Movement capabilities (for VTT)
  overland: number;
  swim: number;
  sky: number;
  burrow: number;
  levitate: number;
  teleport: number;
}
