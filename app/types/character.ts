// Character types (Pokemon and Human)

import type { StatusCondition, StageModifiers, ActionType, MoveFrequency } from './combat';

// Pokemon Types
export type PokemonType =
  | 'Normal' | 'Fire' | 'Water' | 'Electric' | 'Grass' | 'Ice'
  | 'Fighting' | 'Poison' | 'Ground' | 'Flying' | 'Psychic' | 'Bug'
  | 'Rock' | 'Ghost' | 'Dragon' | 'Dark' | 'Steel' | 'Fairy';

// Character type
export type CharacterType = 'player' | 'npc' | 'trainer';

// Pokemon origin - how the Pokemon was created
export type PokemonOrigin = 'manual' | 'wild' | 'template' | 'import' | 'captured';

// Skill rank (PTU)
export type SkillRank = 'Pathetic' | 'Untrained' | 'Novice' | 'Adept' | 'Expert' | 'Master';

// Base stats structure
export interface Stats {
  hp: number;
  attack: number;
  defense: number;
  specialAttack: number;
  specialDefense: number;
  speed: number;
}

// Pokemon capabilities (PTU)
export interface PokemonCapabilities {
  overland: number;
  swim: number;
  sky: number;
  burrow: number;
  levitate: number;
  teleport?: number;
  jump: { high: number; long: number };
  power: number;
  weightClass: number;
  size: 'Small' | 'Medium' | 'Large' | 'Huge' | 'Gigantic';
  naturewalk?: string[];
  otherCapabilities?: string[];
}

// Move data (PTU 1.05)
export interface Move {
  id: string;
  name: string;
  type: PokemonType;
  damageClass: 'Physical' | 'Special' | 'Status';
  frequency: MoveFrequency;
  ac: number | null; // Accuracy Check target (null for auto-hit)
  damageBase: number | null; // DB 1-28 (null for non-damaging moves)
  range: string; // e.g., "Melee", "6", "Burst 2", "Cone 2", etc.
  effect: string;

  // PTU-specific properties
  keywords?: string[]; // e.g., "Five Strike", "Double Strike", "Push", "Powder"
  actionType?: ActionType; // Default is 'standard' for most moves
  critRange?: number; // Default is 20 (nat 20 only)

  // Usage tracking (for frequency limits)
  usedThisScene?: number;
  usedToday?: number;
  lastUsedAt?: string; // ISO timestamp of last use (for daily move rolling window)
  lastTurnUsed?: number; // Round number when last used (for EOT tracking)

  // Contest info
  contestType?: string;
  contestEffect?: string;
}

// Ability data
export interface Ability {
  id: string;
  name: string;
  effect: string;
  trigger?: string;
}

// Nature data
export interface Nature {
  name: string;
  raisedStat: keyof Stats | null;
  loweredStat: keyof Stats | null;
}

// Inventory item
export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  effect?: string;
}

// PTU Equipment Slots (09-gear-and-items.md p.286)
export type EquipmentSlot = 'head' | 'body' | 'mainHand' | 'offHand' | 'feet' | 'accessory';

// A single equipped item
export interface EquippedItem {
  name: string;
  slot: EquipmentSlot;
  // Passive combat bonuses
  damageReduction?: number;        // Flat DR (e.g., Light Armor = 5, Heavy Armor = 10)
  evasionBonus?: number;           // Flat evasion bonus (e.g., Light Shield = +2)
  statBonus?: {                    // Focus-style stat bonus (applied after combat stages)
    stat: keyof Stats | 'accuracy' | 'evasion';
    value: number;
  };
  // Conditional bonuses (not auto-applied; tracked for GM reference)
  conditionalDR?: {                // e.g., Helmet: 15 DR vs critical hits only
    amount: number;
    condition: string;             // Human-readable: "Critical Hits only"
  };
  // Speed penalty (Heavy Armor sets default Speed CS to -1)
  speedDefaultCS?: number;         // -1 for Heavy Armor, undefined for others
  // Readied state (shields can be readied for enhanced bonuses)
  canReady?: boolean;              // True for shields
  readiedBonuses?: {               // Bonuses when readied (replaces base bonuses)
    evasionBonus: number;
    damageReduction: number;
    appliesSlowed: boolean;
  };
  // Granted capabilities (e.g., Snow Boots → Naturewalk (Tundra), PTU p.293)
  grantedCapabilities?: string[];  // ["Naturewalk (Tundra)"], ["Naturewalk (Forest)"]
  // General
  description?: string;
  cost?: number;
  twoHanded?: boolean;             // Takes up both Main Hand and Off-Hand
}

// All equipment slots for a character
export interface EquipmentSlots {
  head?: EquippedItem;
  body?: EquippedItem;
  mainHand?: EquippedItem;
  offHand?: EquippedItem;
  feet?: EquippedItem;
  accessory?: EquippedItem;
}

// Pokemon data
export interface Pokemon {
  id: string;
  species: string;
  nickname: string | null;
  level: number;
  experience: number;
  nature: Nature;
  types: [PokemonType] | [PokemonType, PokemonType];

  // Stats
  baseStats: Stats;
  currentStats: Stats;
  currentHp: number;
  maxHp: number;
  stageModifiers: StageModifiers;

  // Combat
  abilities: Ability[];
  moves: Move[];
  heldItem?: string;

  // Capabilities (movement, size, etc.)
  capabilities: PokemonCapabilities;

  // Skills (Pokemon can have skills)
  skills: Record<string, string>; // { skillName: diceFormula like "2d6+2" }

  // Status
  statusConditions: StatusCondition[];
  injuries: number;
  temporaryHp: number;

  // Rest & Healing Tracking
  restMinutesToday: number;
  lastInjuryTime: string | null;
  injuriesHealedToday: number;

  // Training
  tutorPoints: number;
  trainingExp: number;
  eggGroups: string[];

  // Loyalty (PTU p.242: required for Intercept maneuvers)
  // 0-6 scale. 3+ can intercept for Trainer, 6 can intercept for any ally.
  loyalty?: number;

  // Ownership
  ownerId?: string;

  // Display
  spriteUrl?: string;
  shiny: boolean;
  gender: 'Male' | 'Female' | 'Genderless';

  // Library & categorization
  isInLibrary: boolean;
  origin: PokemonOrigin;
  location?: string;
  notes?: string;
}

// Quick Create payload — the subset of fields emitted by QuickCreateForm.vue
export interface QuickCreatePayload {
  name: string
  characterType: CharacterType
  level: number
  location?: string
  avatarUrl?: string
  stats: Stats
  maxHp: number
  currentHp: number
  money: number
  notes?: string
}

// Human character (trainer/NPC)
export interface HumanCharacter {
  id: string;
  name: string;
  characterType: CharacterType;

  // Player info (for player characters)
  playedBy?: string;  // Player's real name
  age?: number;
  gender?: string;    // 'Male', 'Female', 'Other'
  height?: number;    // in cm
  weight?: number;    // in kg

  // Stats
  level: number;
  stats: Stats;
  currentHp: number;
  maxHp: number;

  // Classes, Skills, Features, Edges
  trainerClasses: string[];  // Class names
  skills: Record<string, SkillRank>;  // { skillName: rank }
  features: string[];  // Feature names
  edges: string[];     // Edge names

  // Trainer capabilities (e.g. Naturewalk from Survivalist class, PTU p.149)
  capabilities: string[];  // ["Naturewalk (Forest)", "Naturewalk (Mountain)"]

  // Pokemon team
  pokemonIds: string[];
  pokemon?: Pokemon[];  // Linked Pokemon (when fetched with relation)
  activePokemonId?: string;

  // Combat
  statusConditions: StatusCondition[];
  stageModifiers: StageModifiers;
  injuries: number;
  temporaryHp: number;

  // Rest & Healing Tracking
  restMinutesToday: number;
  lastInjuryTime: string | null;
  injuriesHealedToday: number;
  drainedAp: number;
  boundAp: number;
  currentAp: number;

  // Equipment (PTU armor, shields, accessories)
  equipment: EquipmentSlots;

  // Inventory
  inventory: InventoryItem[];
  money: number;

  // Display
  avatarUrl?: string;

  // Background info
  background?: string;
  personality?: string;
  goals?: string;
  location?: string;

  // Trainer Experience (PTU Core p.461)
  trainerXp: number;            // Experience bank (0-9 normally)
  capturedSpecies: string[];     // Species captured by this trainer (lowercase)

  // Library
  isInLibrary: boolean;
  notes?: string;
}
