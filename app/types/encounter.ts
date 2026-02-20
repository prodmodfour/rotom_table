// Encounter and combatant types

import type { GridPosition, GridConfig } from './spatial';
import type { PokemonOrigin } from './character';
import type {
  StatusCondition,
  ActionType,
  CombatSide,
  BattleType,
  TurnPhase,
  TurnState,
  InjuryState
} from './combat';
import type { Pokemon, HumanCharacter, PokemonType } from './character';

// Combatant in encounter (wrapper for Pokemon or Human)
export interface Combatant {
  id: string;
  type: 'pokemon' | 'human';
  entityId: string;
  side: CombatSide;

  // Initiative
  initiative: number;
  initiativeBonus: number;
  initiativeRollOff?: number; // For breaking ties

  // Turn state (PTU action system)
  turnState: TurnState;

  // Legacy support
  hasActed: boolean;
  actionsRemaining: number;
  shiftActionsRemaining: number;

  // Ready/Held action
  readyAction?: string;

  // Temporary conditions (cleared on next turn)
  tempConditions?: string[];

  // PTU-specific tracking
  injuries: InjuryState;

  // Evasion values (derived from stats)
  physicalEvasion: number;
  specialEvasion: number;
  speedEvasion: number;

  // VTT Position (grid coordinates)
  position?: GridPosition;
  tokenSize: number; // 1 = 1x1, 2 = 2x2 (for large Pokemon)

  // Reference to actual data
  entity: Pokemon | HumanCharacter;
}

// Move log entry (PTU combat)
export interface MoveLogEntry {
  id: string;
  timestamp: Date;
  round: number;

  // Actor
  actorId: string;
  actorName: string;

  // Action
  moveName: string;
  moveType?: PokemonType;
  damageClass?: 'Physical' | 'Special' | 'Status';
  actionType?: ActionType;

  // Accuracy roll info
  accuracyRoll?: number; // d20 result
  accuracyTarget?: number; // What was needed to hit

  // Targets
  targets: {
    id: string;
    name: string;
    hit: boolean;
    damage?: number;
    effectiveness?: number; // 0, 0.25, 0.5, 1, 1.5, 2
    effectivenessText?: string;
    criticalHit?: boolean;
    effect?: string;
    injury?: boolean;
  }[];

  // Result
  notes?: string;
}

// Encounter state (PTU 1.05)
export interface Encounter {
  id: string;
  name: string;
  battleType: BattleType;
  weather?: string | null;
  weatherDuration: number; // Rounds remaining (0 = indefinite/manual)
  weatherSource?: string | null; // 'move', 'ability', or 'manual'

  // Combatants
  combatants: Combatant[];

  // Turn tracking
  currentRound: number;
  currentTurnIndex: number;
  turnOrder: string[]; // Combatant IDs in initiative order

  // PTU League Battle phase tracking
  // In League battles: trainers declare/act first, then Pokemon
  currentPhase: TurnPhase;
  trainerTurnOrder: string[]; // Trainer combatant IDs (low to high speed for declaration)
  pokemonTurnOrder: string[]; // Pokemon combatant IDs (high to low speed)

  // State
  isActive: boolean;
  isPaused: boolean;
  isServed: boolean;

  // VTT Grid configuration
  gridConfig: GridConfig;

  // Scene tracking (for Scene-frequency moves)
  sceneNumber: number;

  // History
  moveLog: MoveLogEntry[];

  // XP tracking (type field added for trainer 2x XP rule; older entries may lack it)
  defeatedEnemies: { species: string; level: number; type?: 'pokemon' | 'human' }[];

  // Safety flag: true after XP has been distributed for this encounter
  xpDistributed?: boolean;
}

// Movement preview for broadcasting to group view
export interface MovementPreview {
  combatantId: string;
  fromPosition: GridPosition;
  toPosition: GridPosition;
  distance: number;
  isValid: boolean;
}

// Encounter history snapshot for undo/redo
export interface EncounterSnapshot {
  id: string;
  timestamp: Date;
  actionName: string;
  state: Encounter;
}

// Library filters
export interface LibraryFilters {
  search: string;
  type: 'all' | 'human' | 'pokemon';
  characterType: 'all' | 'player' | 'npc';
  pokemonType: PokemonType | 'all';
  pokemonOrigin: PokemonOrigin | 'all';
  sortBy: 'name' | 'level' | 'dateAdded';
  sortOrder: 'asc' | 'desc';
}
