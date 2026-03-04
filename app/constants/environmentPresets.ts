/**
 * Built-in PTU Environment Presets (P2: ptu-rule-058)
 *
 * These are constant definitions — not DB rows. The GM selects
 * a preset during encounter setup and it is stored as JSON on
 * the Encounter record. Custom presets can be created ad-hoc.
 *
 * PTU rule sources:
 *   - Dim Cave: 07-combat.md Blindness (p.1699-1700) — -6 accuracy, negated by Darkvision
 *   - Dark Cave: 07-combat.md Total Blindness (p.1716-1717) — -10 accuracy, negated by Blindsense
 *   - Frozen Lake: 07-combat.md Slow/Rough Terrain (p.475-481), weight/ice rules
 *   - Hazard Factory: GM-defined interactive machinery and hazard zones
 */

import type { EnvironmentPreset } from '~/types/encounter'

/**
 * Dim Cave — Blindness (PTU 07-combat.md:1699-1700)
 * -6 flat accuracy penalty, negated by Darkvision.
 * decree-048: RAW Blindness penalty with split cave presets.
 */
export const DIM_CAVE_PRESET: EnvironmentPreset = {
  id: 'dim-cave',
  name: 'Dim Cave',
  description:
    'Blindness: -6 accuracy penalty (PTU p.1699). ' +
    'Negated by Darkvision. Pokemon with the Illuminate ability can serve as light sources.',
  effects: [
    {
      type: 'accuracy_penalty',
      accuracyPenalty: 6,
      description: 'Blindness: -6 accuracy (negated by Darkvision)'
    },
    {
      type: 'custom',
      customRule:
        'Darkvision negates Blindness penalties. ' +
        'Light sources illuminate Burst 2 (small), Burst 3 (medium), or Burst 4 (large). ' +
        'Illuminate ability: +1 Burst radius to any light source the Pokemon is near.'
    }
  ]
}

/**
 * Dark Cave — Total Blindness (PTU 07-combat.md:1716-1717)
 * -10 flat accuracy penalty, negated by Blindsense.
 * No map awareness, cannot use Priority or Interrupt moves.
 * decree-048: RAW Total Blindness penalty with split cave presets.
 */
export const DARK_CAVE_PRESET: EnvironmentPreset = {
  id: 'dark-cave',
  name: 'Dark Cave',
  description:
    'Total Blindness: -10 accuracy penalty (PTU p.1716). ' +
    'Negated by Blindsense. No map awareness, cannot use Priority or Interrupt moves.',
  effects: [
    {
      type: 'accuracy_penalty',
      accuracyPenalty: 10,
      description: 'Total Blindness: -10 accuracy (negated by Blindsense), no map awareness, no Priority/Interrupt moves'
    },
    {
      type: 'custom',
      customRule:
        'Blindsense negates Total Blindness penalties. ' +
        'Totally Blind combatants have no map awareness and cannot use Priority or Interrupt moves. ' +
        'Light sources illuminate Burst 2 (small), Burst 3 (medium), or Burst 4 (large).'
    }
  ]
}

/**
 * Frozen Lake — Ice/arctic environment with weight-class breakage,
 * slow terrain, and hazardous water entry.
 * PTU 07-combat.md Slow Terrain (p.475-476), weight class rules.
 */
export const FROZEN_LAKE_PRESET: EnvironmentPreset = {
  id: 'frozen-lake',
  name: 'Frozen Lake',
  description:
    'Weight class 5+ breaks ice. All ice squares are Slow Terrain. ' +
    'Acrobatics check (DC 10) on injury or become Tripped. ' +
    'Falling into water: take hail-equivalent damage per turn, Speed -1 CS.',
  effects: [
    {
      type: 'terrain_override',
      terrainRules: {
        weightClassBreak: 5,
        slowTerrain: true,
        acrobaticsOnInjury: true
      }
    },
    {
      type: 'status_trigger',
      statusOnEntry: {
        terrain: 'water',
        effect: 'hail_damage_per_turn',
        stagePenalty: { stat: 'speed', stages: -1 }
      }
    }
  ]
}

/**
 * Hazard Factory — Industrial/mechanical environment with
 * GM-defined interactive elements and electric/fire hazards.
 * Entirely freeform; the preset provides structure for the GM
 * to define custom hazard zones.
 */
export const HAZARD_FACTORY_PRESET: EnvironmentPreset = {
  id: 'hazard-factory',
  name: 'Hazard Factory',
  description:
    'Interactive machinery and hazard zones. GM defines specific ' +
    'machinery damage zones, electric hazards, and interactive elements. ' +
    'Use terrain painting to mark hazard areas on the VTT grid.',
  effects: [
    {
      type: 'custom',
      customRule:
        'Machinery Damage Zones: GM marks areas on the grid that deal ' +
        'damage (suggested: DB 5-10) to any combatant ending their turn in them.'
    },
    {
      type: 'custom',
      customRule:
        'Electric Hazards: Conductive surfaces or exposed wiring. ' +
        'Water-type and Steel-type Pokemon take +5 DB damage from electric hazard zones.'
    },
    {
      type: 'custom',
      customRule:
        'Interactive Elements: Levers, conveyor belts, pressure plates. ' +
        'GM determines specific interactions as a Standard Action.'
    }
  ]
}

/**
 * All built-in presets, indexed by ID for quick lookup.
 */
export const BUILT_IN_PRESETS: Record<string, EnvironmentPreset> = {
  'dim-cave': DIM_CAVE_PRESET,
  'dark-cave': DARK_CAVE_PRESET,
  'frozen-lake': FROZEN_LAKE_PRESET,
  'hazard-factory': HAZARD_FACTORY_PRESET
}

/**
 * Built-in preset IDs in display order.
 */
export const BUILT_IN_PRESET_IDS = ['dim-cave', 'dark-cave', 'frozen-lake', 'hazard-factory'] as const

/**
 * Labels for the preset selector dropdown.
 */
export const PRESET_LABELS: Record<string, string> = {
  'dim-cave': 'Dim Cave (Blindness)',
  'dark-cave': 'Dark Cave (Total Blindness)',
  'frozen-lake': 'Frozen Lake',
  'hazard-factory': 'Hazard Factory'
}
