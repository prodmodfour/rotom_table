/**
 * Field State Interfaces
 *
 * Per field-state-interfaces.md — per-encounter state shared across all
 * combatants: weather, terrain, and four field effect systems.
 */

import type { EntityId, GridPosition, Side } from './base'

// ─── Weather ───

export type WeatherType = 'sunny' | 'rain' | 'sandstorm' | 'hail' | 'snow'

export interface HasWeather {
  weather: { type: WeatherType; roundsRemaining: number } | null
}

// ─── Terrain ───

export type TerrainType = 'grassy' | 'electric' | 'psychic' | 'misty'

export interface HasTerrain {
  terrain: { type: TerrainType; roundsRemaining: number } | null
}

// ─── Hazards ───

export interface HazardInstance {
  type: string
  positions: GridPosition[]
  layers: number
  ownerSide: Side
}

export interface HasHazards {
  hazards: HazardInstance[]
}

// ─── Blessings ───

export interface BlessingInstance {
  blessingType: string
  teamSide: Side
  activationsRemaining: number
}

export interface HasBlessings {
  blessings: BlessingInstance[]
}

// ─── Coats ───

export interface CoatInstance {
  type: string
  entityId: EntityId
  triggerTiming: 'turn-start' | 'turn-end'
}

export interface HasCoats {
  coats: CoatInstance[]
}

// ─── Vortexes ───

export interface VortexInstance {
  targetId: EntityId
  casterId: EntityId
  appliesTrapped: boolean
  appliesSlowed: boolean
  turnsElapsed: number
}

export interface HasVortexes {
  vortexes: VortexInstance[]
}

// ─── Composite field state ───

export type FieldState =
  & HasWeather
  & HasTerrain
  & HasHazards
  & HasBlessings
  & HasCoats
  & HasVortexes
