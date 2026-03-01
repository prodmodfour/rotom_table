// Combat-related types for PTU 1.05

// Status conditions (PTU 1.05)
export type StatusCondition =
  | 'Burned' | 'Frozen' | 'Paralyzed' | 'Poisoned' | 'Badly Poisoned'
  | 'Asleep' | 'Bad Sleep' | 'Confused' | 'Flinched' | 'Infatuated' | 'Cursed'
  | 'Disabled' | 'Enraged' | 'Suppressed'
  | 'Stuck' | 'Slowed' | 'Trapped' | 'Fainted' | 'Dead'
  | 'Tripped' | 'Vulnerable';

// PTU Action Types
export type ActionType = 'standard' | 'shift' | 'swift' | 'free' | 'extended' | 'full' | 'priority' | 'interrupt';

// PTU Move Frequency
export type MoveFrequency =
  | 'At-Will' | 'EOT' | 'Scene' | 'Scene x2' | 'Scene x3'
  | 'Daily' | 'Daily x2' | 'Daily x3' | 'Static';

// Combat side
export type CombatSide = 'players' | 'allies' | 'enemies';

// Battle type
export type BattleType = 'trainer' | 'full_contact';

// PTU Turn Phase (for League battles)
// trainer_declaration: trainers declare actions, lowest speed first
// trainer_resolution: trainers resolve actions, highest speed first
// pokemon: pokemon act, highest speed first
export type TurnPhase = 'trainer_declaration' | 'trainer_resolution' | 'pokemon';

// Stage modifiers (-6 to +6). Three distinct PTU mechanics sharing the same range:
// - Combat Stages (atk/def/spA/spD/spe): apply multiplier table to stats (+20%/-10% per stage)
// - Accuracy: additive modifier applied directly to accuracy rolls (PTU p.234)
// - Evasion: additive bonus from moves/effects, stacks on top of stat-derived evasion (PTU p.234)
export interface StageModifiers {
  /** Combat Stage — multiplier applied to Attack stat */
  attack: number;
  /** Combat Stage — multiplier applied to Defense stat (also affects Physical Evasion) */
  defense: number;
  /** Combat Stage — multiplier applied to Special Attack stat */
  specialAttack: number;
  /** Combat Stage — multiplier applied to Special Defense stat (also affects Special Evasion) */
  specialDefense: number;
  /** Combat Stage — multiplier applied to Speed stat (also affects Speed Evasion + movement) */
  speed: number;
  /** Additive modifier applied directly to accuracy rolls (NOT a multiplier) */
  accuracy: number;
  /** Additive evasion bonus from moves/effects — stacks on top of stat-derived evasion (NOT a multiplier) */
  evasion: number;
}

// PTU Turn State (tracks actions available)
export interface TurnState {
  hasActed: boolean;
  standardActionUsed: boolean;
  shiftActionUsed: boolean;
  swiftActionUsed: boolean;

  // For League battles: can't command newly switched Pokemon
  canBeCommanded: boolean;

  // Held/Delayed action
  isHolding: boolean;
  heldUntilInitiative?: number;
}

// Source-tracked combat stage modification (decree-005)
// Tracks who/what caused a CS change so it can be cleanly reversed.
// Used for status conditions (Burn → -2 Def, Paralysis → -4 Speed, Poison → -2 SpDef).
export interface StageSource {
  /** Which stat is affected (uses StageModifiers key names) */
  stat: keyof StageModifiers;
  /** The delta applied (e.g., -2 for Burn's defense penalty) */
  value: number;
  /** Identifier for the source (e.g., 'Burned', 'Paralyzed', 'Poisoned') */
  source: string;
}

/**
 * A trainer's declared action during League Battle declaration phase.
 * Recorded during trainer_declaration, executed during trainer_resolution.
 * Per decree-021: trainers declare low-to-high speed, resolve high-to-low speed.
 */
export interface TrainerDeclaration {
  /** Combatant ID of the declaring trainer */
  combatantId: string;
  /** Display name of the trainer (for UI) */
  trainerName: string;
  /** Type of declared action */
  actionType: 'command_pokemon' | 'switch_pokemon' | 'use_item' | 'use_feature' | 'orders' | 'pass';
  /** Free-text description of the declared action */
  description: string;
  /** Target combatant IDs if applicable */
  targetIds?: string[];
  /** The round number this declaration was made in */
  round: number;
}

/**
 * Tracks a switching action performed during a combat round.
 * Used to enforce action economy and League restrictions.
 * Cleared at the start of each new round.
 */
export interface SwitchAction {
  /** Combatant ID of the trainer who performed the switch */
  trainerId: string;
  /** Combatant ID of the recalled Pokemon (null if release-only) */
  recalledCombatantId: string | null;
  /** Entity ID of the recalled Pokemon */
  recalledEntityId: string | null;
  /** Combatant ID of the released Pokemon (null if recall-only) */
  releasedCombatantId: string | null;
  /** Entity ID of the released Pokemon */
  releasedEntityId: string | null;
  /** Type of switch action */
  actionType: 'full_switch' | 'fainted_switch' | 'recall_only' | 'release_only' | 'forced_switch';
  /** Action cost */
  actionCost: 'standard' | 'shift';
  /** Round number */
  round: number;
  /** Whether forced by a move with recall mechanics (Roar, etc.) -- per decree-034, only moves with explicit recall text qualify */
  forced: boolean;
}

// PTU Injury tracking
export interface InjuryState {
  count: number;
  sources: string[]; // Description of what caused each injury
}

// ============================================================
// Out-of-Turn Action System Types (feature-016)
// ============================================================

/** Categories of out-of-turn actions in PTU */
export type OutOfTurnCategory = 'aoo' | 'priority' | 'priority_limited' | 'priority_advanced' | 'interrupt';

/** Specific trigger events that can provoke an AoO (PTU p.241) */
export type AoOTrigger =
  | 'shift_away'        // Adjacent foe shifts out of adjacent square
  | 'ranged_attack'     // Adjacent foe uses ranged attack not targeting adjacent combatant
  | 'stand_up'          // Adjacent foe stands up (clears Tripped)
  | 'maneuver_other'    // Adjacent foe uses Push/Grapple/Disarm/Trip/Dirty Trick not targeting you
  | 'retrieve_item';    // Adjacent foe uses Standard Action to pick up/retrieve item

/** Trigger events for Interrupt actions (extensible, P1 scope) */
export type InterruptTrigger =
  | 'ally_hit_melee'    // Ally within movement range hit by adjacent melee foe (Intercept Melee)
  | 'ranged_in_range'   // Ranged X-target attack passes within movement range (Intercept Ranged)
  | 'custom';           // Feature-defined Interrupt trigger

/**
 * Conditions that prevent AoO usage (PTU p.241).
 * "Attacks of Opportunity cannot be made by Sleeping, Flinched, or Paralyzed targets."
 */
export const AOO_BLOCKING_CONDITIONS: readonly string[] = [
  'Asleep', 'Bad Sleep', 'Flinched', 'Paralyzed'
] as const;

/**
 * Hold Action state for a combatant (P1 scope).
 * PTU p.227: "Combatants can choose to hold their action until a
 * specified lower Initiative value once per round."
 */
export interface HoldActionState {
  /** Whether this combatant is currently holding their action */
  isHolding: boolean;
  /** The initiative value they are holding until (null = holding indefinitely until triggered) */
  holdUntilInitiative: number | null;
  /** Whether the hold has been consumed this round (can only hold once per round) */
  holdUsedThisRound: boolean;
}

/**
 * Represents a pending out-of-turn action that has been detected/offered
 * but not yet resolved. The GM sees these as prompts and decides whether
 * to execute them.
 */
export interface OutOfTurnAction {
  /** Unique ID for this pending action */
  id: string;
  /** Category of out-of-turn action */
  category: OutOfTurnCategory;
  /** Combatant ID who CAN take this action (the reactor) */
  actorId: string;
  /** Combatant ID who triggered this action */
  triggerId: string;
  /** Specific trigger type */
  triggerType: AoOTrigger | InterruptTrigger;
  /** Human-readable description of what triggered this */
  triggerDescription: string;
  /** Round in which this was triggered */
  round: number;
  /** Whether this action has been resolved (accepted, declined, or expired) */
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  /** For Intercept: the attack that triggered it */
  triggerContext?: {
    /** The move/attack being used */
    moveName?: string;
    /** The original target of the attack */
    originalTargetId?: string;
    /** The attacker ID */
    attackerId?: string;
  };
}

/**
 * Tracks per-round usage of once-per-round out-of-turn actions.
 * Stored on each Combatant to enforce the 1/round limit.
 */
export interface OutOfTurnUsage {
  /** Whether this combatant has used their AoO this round */
  aooUsed: boolean;
  /** Whether this combatant has used a Priority action this round */
  priorityUsed: boolean;
  /** Whether this combatant has used an Interrupt action this round */
  interruptUsed: boolean;
}

// ============================================================
// Flanking Detection Types (feature-014)
// ============================================================

/**
 * Result of flanking detection for a single combatant.
 */
export interface FlankingStatus {
  /** Whether this combatant is currently flanked */
  isFlanked: boolean
  /** IDs of the combatants that are flanking this target */
  flankerIds: string[]
  /** Number of effective flanking foes (includes multi-tile counting in P1) */
  effectiveFoeCount: number
  /** Number required to flank (based on target size) */
  requiredFoes: number
}

/**
 * Map of combatant ID -> flanking status for the entire encounter.
 * Recomputed whenever token positions change.
 */
export type FlankingMap = Record<string, FlankingStatus>
