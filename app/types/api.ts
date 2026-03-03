// API and WebSocket types

import type { GridPosition } from './spatial';
import type { StatusCondition } from './combat';
import type { Pokemon, HumanCharacter } from './character';
import type { Encounter, Combatant, MoveLogEntry, MovementPreview } from './encounter';
import type { Scene, ScenePosition, SceneCharacter, ScenePokemon, SceneGroup } from './scene';
import type { ServedMap } from '~/stores/groupView';
import type {
  PlayerActionRequest as PlayerActionRequestSync,
  PlayerActionAck,
  PlayerTurnNotification,
  PlayerMoveRequest,
  PlayerMoveResponse,
  GroupViewRequest,
  GroupViewResponse,
  SceneSyncPayload
} from './player-sync';

// Re-export PlayerActionRequest so existing imports from '~/types/api' still work
export type PlayerActionRequest = PlayerActionRequestSync;

// API response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Websocket events
export type WebSocketEvent =
  // Connection & identity
  | { type: 'connected'; data: { peerId: string } }
  | { type: 'identify'; data: { role: 'gm' | 'group' | 'player'; encounterId?: string; characterId?: string } }
  | { type: 'join_encounter'; data: { encounterId: string } }
  | { type: 'leave_encounter'; data: null }
  | { type: 'sync_request'; data: null }
  | { type: 'tab_sync_request'; data: null }
  // Encounter events
  | { type: 'encounter_update'; data: Encounter }
  | { type: 'serve_encounter'; data: { encounterId: string; encounter?: Encounter } }
  | { type: 'encounter_served'; data: { encounterId: string; encounter: Encounter } }
  | { type: 'encounter_unserved'; data: { encounterId?: string } }
  // Combat events
  | { type: 'turn_change'; data: { combatantId: string; round: number } }
  | { type: 'move_executed'; data: MoveLogEntry }
  | { type: 'damage_applied'; data: { combatantId: string; damage: number; newHp: number; injuries: number } }
  | { type: 'heal_applied'; data: { combatantId: string; amount: number; newHp: number } }
  | { type: 'status_change'; data: { combatantId: string; added?: StatusCondition[]; removed?: StatusCondition[] } }
  | { type: 'combatant_added'; data: Combatant }
  | { type: 'combatant_removed'; data: { combatantId: string } }
  // Switching events
  | { type: 'pokemon_switched'; data: { encounterId: string; trainerId: string; trainerName: string; recalledName: string; releasedName: string; releasedCombatantId: string; actionCost: 'standard' | 'shift' | 'none'; canActThisRound: boolean; canActImmediately: boolean; encounter: Encounter } }
  | { type: 'pokemon_recalled'; data: { encounterId: string; trainerId: string; trainerName: string; recalledNames: string[]; actionCost: 'standard' | 'shift'; encounter: Encounter } }
  | { type: 'pokemon_released'; data: { encounterId: string; trainerId: string; trainerName: string; releasedNames: string[]; releasedCombatantIds: string[]; actionCost: 'standard' | 'shift'; countsAsSwitch: boolean; encounter: Encounter } }
  // Capture events
  | { type: 'capture_attempt'; data: { pokemonId: string; trainerId: string; trainerName: string; pokemonSpecies: string; ballType: string; captured: boolean; roll: number; modifiedRoll: number; captureRate: number; ballModifier: number; postCaptureEffect?: string } }
  // Entity events
  | { type: 'character_update'; data: Pokemon | HumanCharacter }
  | { type: 'player_action'; data: PlayerActionRequest }
  // Tab events
  | { type: 'tab_change'; data: { tab: string; sceneId?: string | null } }
  | { type: 'tab_state'; data: { tab: string; sceneId?: string | null } }
  // Scene events
  | { type: 'scene_activated'; data: { scene: Scene } }
  | { type: 'scene_deactivated'; data: { sceneId: string } }
  | { type: 'scene_update'; data: { sceneId: string; scene: Scene } }
  | { type: 'scene_positions_updated'; data: { positions: { pokemon?: Array<{ id: string; position: ScenePosition }>; characters?: Array<{ id: string; position: ScenePosition }>; groups?: Array<{ id: string; position: ScenePosition }> } } }
  | { type: 'scene_character_added'; data: { sceneId: string; character: SceneCharacter } }
  | { type: 'scene_character_removed'; data: { sceneId: string; characterId: string } }
  | { type: 'scene_pokemon_added'; data: { sceneId: string; pokemon: ScenePokemon } }
  | { type: 'scene_pokemon_removed'; data: { sceneId: string; pokemonId: string } }
  | { type: 'scene_group_created'; data: { sceneId: string; group: SceneGroup } }
  | { type: 'scene_group_updated'; data: { sceneId: string; group: SceneGroup } }
  | { type: 'scene_group_deleted'; data: { sceneId: string; groupId: string } }
  // VTT events
  | { type: 'movement_preview'; data: MovementPreview | null }
  // Map & spawn events
  | { type: 'serve_map'; data: ServedMap }
  | { type: 'clear_map'; data: null }
  | { type: 'clear_wild_spawn'; data: null }
  // Keepalive (prevents Cloudflare Tunnel 100s idle timeout)
  | { type: 'keepalive'; data: { timestamp: number } }
  | { type: 'keepalive_ack'; data: { timestamp: number } }
  // Player action protocol (Track C)
  | { type: 'player_action_ack'; data: PlayerActionAck }
  | { type: 'player_turn_notify'; data: PlayerTurnNotification }
  | { type: 'player_move_request'; data: PlayerMoveRequest }
  | { type: 'player_move_response'; data: PlayerMoveResponse }
  // Group view control (Track C)
  | { type: 'group_view_request'; data: GroupViewRequest }
  | { type: 'group_view_response'; data: GroupViewResponse }
  // Scene sync (Track C)
  | { type: 'scene_sync'; data: SceneSyncPayload }
  | { type: 'scene_request'; data: { sceneId?: string } };
