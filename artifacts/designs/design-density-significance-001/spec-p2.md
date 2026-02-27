# P2 Specification

## C. Environmental Modifier Framework (P2)

**Dependency:** ptu-rule-060 (level-budget system provides encounter difficulty context for when environmental modifiers matter most).

### Scope Clarification

The existing VTT terrain system is a valid, useful tactical tool. This tier does **not** replace it. Instead, it adds an optional **environmental preset** layer that connects PTU-specific environmental rules to the existing terrain and combat systems.

### Conceptual Model

An **Environment Preset** is a named collection of mechanical effects that the GM can attach to an encounter. Each preset maps to a PTU environmental modifier example.

```typescript
export interface EnvironmentPreset {
  id: string
  name: string                    // "Dark Cave", "Frozen Lake", "Hazard Factory"
  description: string             // PTU rule text summary
  effects: EnvironmentEffect[]
}

export interface EnvironmentEffect {
  type: 'accuracy_penalty' | 'terrain_override' | 'status_trigger' | 'movement_modifier' | 'custom'
  // Accuracy penalty (Dark Cave)
  accuracyPenaltyPerMeter?: number  // -2 per unilluminated meter
  // Terrain override (Arctic)
  terrainRules?: {
    weightClassBreak?: number       // weight class 5+ breaks ice
    slowTerrain?: boolean           // all squares are slow terrain
    acrobaticsOnInjury?: boolean    // acrobatics check when taking injury
  }
  // Status trigger (Frozen Lake water)
  statusOnEntry?: {
    terrain: string                 // 'water'
    effect: string                  // 'hail_damage_per_turn'
    stagePenalty?: { stat: string; stages: number }  // speed -1
  }
  // Custom text rule
  customRule?: string               // freeform rule text for GM reference
}
```

### PTU Environment Presets (Built-in)

1. **Dark Cave** -- accuracy -2 per unilluminated meter; requires Darkvision/Blindsense or light source (Burst 2/3/4 depending on source size); Illuminate ability +1 burst radius
2. **Frozen Lake** -- weight class 5+ breaks ice; slow terrain; acrobatics check on injury; falling in water = hail damage + speed debuff
3. **Hazard Factory** -- interactive machinery elements (GM-defined); machinery damage zones; electric hazards

### Data Flow

1. GM creates encounter and optionally selects an environment preset (or creates a custom one)
2. Preset effects are stored on the Encounter record (new `environmentPreset` JSON field)
3. During combat, applicable effects are surfaced in the UI:
   - Accuracy penalty calculator shows darkness penalty when applicable
   - Weight class warnings appear when spawning/moving large Pokemon on ice
   - Hazard zones are highlighted on the VTT grid using existing terrain types
4. The GM can override or dismiss individual effects

### Implementation Notes

- Environment presets are stored as JSON on the Encounter model (similar to combatants)
- The preset selector is a new section in the encounter creation flow
- Built-in presets are defined as constants (like `RARITY_WEIGHTS`), not in the DB
- Custom presets can be saved to local storage or a new PresetLibrary model (stretch goal)
- Accuracy penalty integration requires hooking into the move execution flow (connect to `damageCalculation.ts` via a new `environmentModifiers` parameter)

### Relationship to Existing Terrain Store

The terrain store continues to handle spatial grid painting (movement costs, passability). Environment presets add a **rule layer on top** -- the dark cave preset does not change the terrain type of any grid cell, but it adds a global accuracy penalty rule that references the fog-of-war state. The frozen lake preset sets all terrain to `difficult` (slow) and adds weight-class checking, but the terrain painting itself remains under GM control.

---

