# Encounter Delta Model

How effects write to encounter-level state. The companion to [[state-delta-model]] (per-combatant lens changes). Where `StateDelta` describes changes to a single combatant's lens, `EncounterDelta` describes changes to the shared encounter state — field state, deployment, and combat log. Part of the [[game-state-interface]].

## The type

```
EncounterDelta {
  weather?: WeatherMutation
  terrain?: TerrainMutation
  hazards?: HazardMutation[]
  blessings?: BlessingMutation[]
  coats?: CoatMutation[]
  vortexes?: VortexMutation[]
  deploymentChanges?: DeploymentMutation[]
}
```

Every field is optional. An effect that doesn't touch encounter state returns `null` for `encounterDelta` in its [[effect-handler-contract|EffectResult]].

## Mutation types

Each field state type from [[field-state-interfaces]] has its own mutation vocabulary, reflecting the distinct lifecycle rules of each type.

### Weather

```
WeatherMutation =
  | { op: 'set', type: WeatherType, roundsRemaining: number }
  | { op: 'clear' }
```

Only one weather active at a time. Setting replaces the current weather. Defog clears to null. No stacking, no layering.

### Terrain

```
TerrainMutation =
  | { op: 'set', type: TerrainType, roundsRemaining: number }
  | { op: 'clear' }
```

Same semantics as weather — one active at a time, set replaces.

### Hazards

```
HazardMutation =
  | { op: 'add', instance: HazardInstance }
  | { op: 'add-layer', type: HazardType, positions: GridPosition[] }
  | { op: 'remove-all' }
  | { op: 'remove-by-type', type: HazardType, side: Side }
```

Hazards stack in layers (Toxic Spikes: 1 layer = Poisoned, 2 = Badly Poisoned). `add-layer` increments an existing hazard's layer count. `remove-all` is Defog. `remove-by-type` is Poison-type entry clearing Toxic Spikes.

### Blessings

```
BlessingMutation =
  | { op: 'add', instance: BlessingInstance }
  | { op: 'consume', blessingType: string }
  | { op: 'remove-all' }
```

Blessings are activation-counted with no time duration (confirmed per [[field-state-interfaces]]). `consume` decrements `activationsRemaining`; if it reaches 0, the engine removes the blessing. `remove-all` is Defog.

### Coats

```
CoatMutation =
  | { op: 'add', instance: CoatInstance }
  | { op: 'remove', entityId: string }
  | { op: 'remove-all' }
```

Coats are per-entity. `remove` targets a specific entity's coat (on switch/faint). `remove-all` is Defog.

### Vortexes

```
VortexMutation =
  | { op: 'add', instance: VortexInstance }
  | { op: 'remove', targetId: string }
  | { op: 'tick', targetId: string }
```

Vortexes are per-target with escape mechanics. `tick` increments `turnsElapsed`, which feeds the escape DC formula (`max(2, 20 - (turnsElapsed * 6))`). `remove` handles escape, caster switch/faint, or auto-dispel at turn 5. Defog does NOT clear vortexes (per [[field-state-interfaces]]).

### Deployment

```
DeploymentMutation =
  | { op: 'switch-out', trainerId: string, entityId: string }
  | { op: 'switch-in', trainerId: string, entityId: string }
  | { op: 'faint', trainerId: string, entityId: string }
```

Per-trainer deployment state from [[deployment-state-model]]. `switch-out` moves an entity from active to reserve. `switch-in` moves from reserve to active. `faint` moves to fainted. The engine manages lens lifecycle (archiving the outgoing lens, creating a new lens for the incoming entity).

## Engine application

The engine receives an `EncounterDelta` and applies it to the encounter state:

1. **Weather/Terrain** — replacement semantics. Set overwrites, clear nullifies.
2. **Field collections** (hazards, blessings, coats, vortexes) — mutation operations applied in order. Add appends to the collection. Remove filters. Consume decrements.
3. **Deployment** — the engine manages lens lifecycle alongside the mutation.

The engine is the only code that writes encounter state. Effects produce deltas, the engine applies them. Same [[command-pattern]] as [[state-delta-model]], extended to encounter scope.

## Why separate from StateDelta

[[state-delta-model|StateDelta]] is per-combatant — keyed by entity ID, applied to one lens. `EncounterDelta` is per-encounter — applied to shared state that all combatants interact with. Mixing them would violate [[single-responsibility-principle]] — a single delta type would serve two masters (combatant state and encounter state) with different application rules and lifecycles.

The [[effect-handler-contract|EffectResult]] contains both: `combatantDeltas: Map<EntityId, StateDelta>` for per-combatant changes and `encounterDelta: EncounterDelta | null` for encounter changes. A move like Toxic Spikes produces both — it costs the user energy (StateDelta on user) and places a hazard (EncounterDelta).

## SE principles applied

- [[command-pattern]] — encounter deltas are commands describing state changes, executed by the engine
- [[single-responsibility-principle]] — encounter deltas own encounter-level changes; StateDelta owns per-combatant changes
- [[open-closed-principle]] — new field state types extend `EncounterDelta` without modifying the engine's core apply logic
- [[separation-of-concerns]] — field state lifecycle rules (stacking, clearing, layer counting) are expressed in the mutation vocabulary, not in the engine's apply function

## See also

- [[game-state-interface]] — the parent design
- [[state-delta-model]] — the per-combatant companion
- [[effect-handler-contract]] — handlers produce `EncounterDelta` in their result
- [[field-state-interfaces]] — the field state types these mutations operate on
- [[deployment-state-model]] — deployment mutations manage per-trainer roster state
- [[data-driven-rule-engine]] — the engine applies both delta types as part of rule evaluation
