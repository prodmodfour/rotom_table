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
  InjuryState,
  StageSource,
  TrainerDeclaration,
  SwitchAction,
  OutOfTurnAction,
  OutOfTurnUsage
} from './combat';
import type { Pokemon, HumanCharacter, PokemonType } from './character';
import type { SignificanceTier } from '~/utils/encounterBudget';

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

  // Source-tracked combat stage modifications (decree-005)
  // Tracks CS changes from status conditions for clean reversal on cure
  stageSources?: StageSource[];

  // Badly Poisoned escalation round counter (combat-scoped)
  // 0 = not badly poisoned, 1+ = current escalation round
  // Incremented at each turn end while Badly Poisoned
  badlyPoisonedRound: number;

  // Evasion values (derived from stats)
  physicalEvasion: number;
  specialEvasion: number;
  speedEvasion: number;

  // VTT Position (grid coordinates)
  position?: GridPosition;
  tokenSize: number; // 1 = 1x1, 2 = 2x2 (for large Pokemon)

  // Out-of-turn action tracking (feature-016)
  /** Per-round usage of once-per-round out-of-turn actions */
  outOfTurnUsage?: OutOfTurnUsage;
  /** Whether this combatant used Disengage this turn (prevents AoO on their shift) */
  disengaged?: boolean;

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

  // League Battle declaration tracking (decree-021)
  // Populated during trainer_declaration phase, consumed during trainer_resolution phase
  // Cleared at the start of each new round
  declarations: TrainerDeclaration[];

  /** Per-round switch action log. Cleared at round start. */
  switchActions: SwitchAction[];

  // State
  isActive: boolean;
  isPaused: boolean;
  isServed: boolean;

  // VTT Grid configuration
  gridConfig: GridConfig;

  // Scene tracking (for Scene-frequency moves)
  sceneNumber: number;

  // Out-of-turn action system (feature-016)
  /** Pending out-of-turn actions awaiting GM resolution */
  pendingOutOfTurnActions: OutOfTurnAction[];

  /** Hold action queue -- combatants who held and their target initiative (P1 scope) */
  holdQueue: Array<{ combatantId: string; holdUntilInitiative: number | null }>;

  // History
  moveLog: MoveLogEntry[];

  // XP tracking (type field added for trainer 2x XP rule; older entries may lack it)
  defeatedEnemies: { species: string; level: number; type?: 'pokemon' | 'human' }[];

  // Safety flag: true after XP has been distributed for this encounter
  xpDistributed?: boolean;

  // PTU significance multiplier for XP calculation (Core p.460)
  significanceMultiplier: number;
  significanceTier: SignificanceTier;
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
