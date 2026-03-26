# Field State Interfaces

Per-encounter state shared across all combatants — weather, terrain, and four distinct field effect systems (hazards, blessings, coats, vortexes). Each has a different lifecycle, scope, stacking model, and removal mechanism. Part of the [[game-state-interface]].

## Weather

```
HasWeather {
  weather: { type: WeatherType, roundsRemaining: number } | null
}
```

Read by Ice Body (is Hail?), weather damage modifiers (+5 Water/-5 Fire in Rain), Solar Beam (Sunny skips charge). Written by weather-setting moves, Defog (clears to null). Only one weather active at a time — setting a new weather replaces the old one.

## Terrain

```
HasTerrain {
  terrain: { type: TerrainType, roundsRemaining: number } | null
}
```

Read by Seed Sower/Grassy Terrain (grounded heal + Grass damage bonus), movement costs. Written by terrain-setting effects. Defog does NOT clear terrain — only weather, blessings, coats, and hazards.

## Hazards

```
HasHazards {
  hazards: HazardInstance[]
}

HazardInstance {
  type: 'toxic-spikes' | 'stealth-rock' | ...
  positions: GridPosition[]
  layers: number
  ownerSide: Side
}
```

Hazards are spatial — placed at grid positions, triggered by proximity or entry. Toxic Spikes stack to 2 layers (1 layer = Poisoned, 2 layers = Badly Poisoned). Poison-type Pokemon entering the zone remove Toxic Spikes entirely. Stealth Rock deals 1 tick damage with type effectiveness on entry, once per encounter entry. Defog destroys all hazards.

## Blessings

```
HasBlessings {
  blessings: BlessingInstance[]
}

BlessingInstance {
  blessingType: string
  teamSide: Side
  activationsRemaining: number
}
```

Blessings are team-wide with limited activations. Safeguard (3 activations) blocks status affliction when voluntarily activated. Light Screen (2 activations) resists Special damage via [[before-handler-response-modes|damage modification]]. The `blessingType` keys to a trigger handler function registered with the [[effect-trigger-event-bus]] when the blessing is created via [[effect-utility-catalog|addBlessing()]]. See [[active-effect-model]] for the rationale behind handler registration. Defog destroys all blessings.

**PTR blessings have no time duration.** Unlike standard Pokemon games where screens last a set number of turns, PTR blessings expire only when their activations are consumed or when cleared by Defog. This is confirmed across all blessing moves in the PTR vault — Light Screen, Reflect, Safeguard, Mist, and Lucky Chant all specify "may be activated X times, and then disappears" with no round limit. The `BlessingInstance` intentionally omits a `roundsRemaining` field.

## Coats

```
HasCoats {
  coats: CoatInstance[]
}

CoatInstance {
  type: 'aqua-ring' | ...
  entityId: string
  triggerTiming: 'turn-start' | 'turn-end'
}
```

Coats are per-entity (not team-wide). Aqua Ring heals 1 tick HP at turn start. Attached to a specific entity, destroyed when that entity leaves combat. Defog destroys all coats.

## Vortexes

```
HasVortexes {
  vortexes: VortexInstance[]
}

VortexInstance {
  targetId: string
  casterId: string
  appliesTrapped: boolean
  appliesSlowed: boolean
  turnsElapsed: number
}
```

Per [[vortex-keyword]], the target is Slowed, Trapped, and loses 1 tick of HP at end of each turn. The target may roll to escape: DC is `max(2, 20 - (turnsElapsed * 6))`, automatically dispelling on turn 5 (DC sequence: 20, 14, 8, 2, auto-dispel).

Vortex damage is a flat 1 tick (1/10 max HP) — not based on the source move's DB, type, or damage class. The `sourceMoveId` field is unnecessary for damage purposes. `casterId` tracks the caster for destruction on caster switch/faint.

Tick timing is end-of-turn, consistent with [[persistent-tick-timing-end-of-turn]] (Burning, Poisoned, Badly Poisoned all tick at end of turn in PTR).

## Shared clearing

Defog is the cross-cutting clear operation. It clears weather (to null), destroys all blessings, all coats, and all hazards. It does NOT clear terrain or vortexes. Vortexes end via escape roll, caster switch/faint, or duration expiry.

## Source tracking rationale

Field state instance types vary in source tracking granularity. This is deliberate:

| Instance type | Source tracking | Rationale |
|---|---|---|
| VortexInstance | `casterId: string` | Destroyed on caster switch/faint — needs individual source |
| CoatInstance | `entityId: string` | Tracks which entity the coat is attached to. Self-cast effects (Aqua Ring) are the common case. If ally-cast coats are added, a `sourceEntityId` field should be added alongside `entityId` |
| HazardInstance | `ownerSide: Side` only | Hazards persist regardless of caster state — individual source is unnecessary for lifecycle. Side tracking suffices for display and Defog targeting |
| BlessingInstance | `teamSide: Side` only | Same reasoning as hazards — blessings are team-scoped and persist independently of the caster |
| WeatherInstance | None | One global weather, replaced wholesale. No lifecycle tied to any entity |
| TerrainInstance | None | Same as weather |

The principle: source tracking is added when the field state's lifecycle depends on a specific entity (VortexInstance destroyed on caster faint) or when the state is physically bound to an entity (CoatInstance). Team-scoped and global field states track side or nothing.

## Instance structs are pure data

All instance structs (HazardInstance, BlessingInstance, CoatInstance, VortexInstance) are pure state containers. The effect engine owns lifecycle behavior through [[state-delta-model|delta production]] — instances do not have methods. This is consistent with the delta model where the engine reads state, produces a delta, and the delta is applied.

## See also

- [[game-state-interface]] — the parent design
- [[state-delta-model]] — how field state changes are described and applied
- [[active-effect-model]] — BlessingInstance's `activationEffect` references the same effect definition system
- [[vortex-keyword]] — PTR vault rules for Vortex mechanics
- [[status-condition-categories]] — related: Trapped and Slowed applied by Vortex
- [[condition-source-tracking]] — Vortex-applied Trapped/Slowed tracked back to the vortex source
- [[encounter-delta-model]] — how effects write mutations to field state types
- [[effect-utility-catalog]] — `modifyFieldState`, `addBlessing`, `addHazard`, `addCoat` utilities operate on these
