# State Delta Model

How effects write to [[game-state-interface|game state]]. Effects produce `StateDelta` objects containing only lens-writable fields. The engine applies deltas to the lens. Entity fields are excluded from the delta type at compile time.

## The contract

An effect function receives the sub-interfaces it needs (per [[combat-lens-sub-interfaces]]) and returns a `StateDelta`:

```
type EffectFunction = (context: ResolvedContext) => StateDelta

StateDelta {
  // Additive fields
  hpDelta?: number
  injuries?: number
  energyCurrent?: number
  mettlePoints?: number
  fatigueLevel?: number

  // Additive-with-clamp fields (clamped to -6..+6)
  combatStages?: Partial<CombatStages>

  // Replacement fields
  tempHp?: number
  position?: GridPosition | null
  initiativeOverride?: number | null
  actedThisRound?: boolean
  stealthRockHitThisEncounter?: boolean
  actionBudget?: Partial<ActionBudget>
  outOfTurnUsage?: Partial<OutOfTurnUsage>

  // Mutation fields (add/remove operations)
  statusConditions?: StatusMutation[]
  volatileConditions?: VolatileMutation[]
  activeEffects?: ActiveEffectMutation[]
}
```

Every field in `StateDelta` corresponds to a lens-writable field from the lens-sourced [[combat-lens-sub-interfaces]]. Entity-sourced fields (`types`, `stats`, `moves`, `traits`, `heldItem`, `movementTypes`, `weightClass`) are absent from this type. An effect that tries to write `stats.atk = 5` gets a compile-time error — the field does not exist on `StateDelta`.

## Engine application

The engine receives a `StateDelta` and applies it to the target's lens. Four application modes:

1. **Additive** — numeric deltas are summed: `lens.hpDelta += delta.hpDelta`. Applies to `hpDelta`, `injuries`, `energyCurrent`, `mettlePoints`, `fatigueLevel`.
2. **Additive-with-clamp** — numeric deltas are summed then clamped: `lens.combatStages.atk = clamp(lens.combatStages.atk + delta.combatStages.atk, -6, 6)`. Applies to `combatStages`.
3. **Replacement** — the delta value overwrites the lens value: `lens.position = delta.position`. Applies to `tempHp` (take higher, don't stack — temp HP sources don't stack per PTR), `position`, `initiativeOverride`, `actedThisRound`, `stealthRockHitThisEncounter`, `actionBudget`, `outOfTurnUsage`.
4. **Mutation** — add/remove operations on collections: `{ op: 'add', condition }` or `{ op: 'remove', condition }`. Applies to `statusConditions`, `volatileConditions`, `activeEffects`.

**Reset** is a composite operation, not a fifth mode. Take a Breather produces a delta that sets `combatStages` to all zeros (additive deltas that negate current values), `tempHp` to 0 (replacement), and `fatigueLevel` to -1 (additive, recovering one level). The engine doesn't need a special reset path — the effect computes the delta needed to reach the reset state.

The engine is the only code that writes to the lens. Effects never mutate the lens directly — they describe what should change, and the engine executes it. This is [[command-pattern]] applied to state mutation.

## Entity-write exceptions

A small number of effects must write entity state — Thief steals a held item, which is entity-owned. These effects are [[entity-write-exception|tagged with `entityWrite: true`]] in the effect definition. The engine checks this tag before permitting entity mutation. The delta for entity writes uses a separate type:

```
EntityWriteDelta {
  heldItem?: ItemRef | null
  accessorySlotItem?: ItemRef | null
}
```

This type is deliberately narrow — only inventory fields, not stats or moves. If future effects need broader entity writes, each new field requires explicit addition to `EntityWriteDelta`, making scope creep visible.

## Why deltas, not mutations

Three alternatives were considered:

1. **Effects mutate the lens directly.** Violates [[single-responsibility-principle]] — effects would own both "decide what changes" and "apply the change." Also makes effects non-deterministic (mutation order matters) and untestable (must inspect the lens after running the effect).
2. **Effects return a new lens.** Functional purity, but forces every effect to know the full lens shape. Violates [[interface-segregation-principle]] — an effect that changes one field must construct an entire lens.
3. **Effects return a delta.** The effect declares what should change. The engine decides how to apply it. Effects are pure functions of `(context) → delta`. The engine is the single writer. This is the accepted model.

## SE principles applied

- [[command-pattern]] — deltas are commands describing state changes, executed by the engine
- [[single-responsibility-principle]] — effects decide; engine applies
- [[interface-segregation-principle]] — effects don't receive or return fields they don't use
- [[open-closed-principle]] — new delta fields extend `StateDelta` without modifying the engine's apply logic (additive by default)

## See also

- [[game-state-interface]] — the parent design
- [[combat-lens-sub-interfaces]] — the interfaces that delta fields correspond to
- [[entity-write-exception]] — the tagged exception for entity mutation
- [[active-effect-model]] — active effect mutations within the delta
- [[data-driven-rule-engine]] — the engine that evaluates effects and applies deltas
- [[effect-handler-contract]] — handlers produce StateDelta in their EffectResult
- [[encounter-delta-model]] — the companion delta type for encounter-level changes
- [[effect-utility-catalog]] — the utilities that produce StateDelta values
