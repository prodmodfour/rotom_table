# Effect Atom Catalog

The concrete atom types that implement the [[effect-node-contract]]. Each atom is a [[strategy-pattern|strategy]] — a distinct algorithm for producing state changes from a given context. Atoms are leaf nodes; they do not contain child effect nodes. Part of the [[game-state-interface]].

## Atom registration

Each atom type is registered in a type-safe catalog. The engine dispatches evaluation to the correct atom strategy based on the `type` discriminant. Adding a new atom type means adding to the catalog and one evaluation function — the engine's dispatch logic does not change. Each atom is a [[single-responsibility-principle|single-responsibility]] [[strategy-pattern|strategy]].

```
AtomDefinition {
  type: AtomType                    // discriminant
  requires: SubInterfaceKey[]       // ISP declaration
  evaluate: (context: EffectContext, params: AtomParams) → EffectResult
}
```

`params` carries atom-specific configuration (damage base, status type, displacement distance, etc.). The definition is data; the `evaluate` function is the strategy.

## State-producing atoms

These atoms produce [[state-delta-model|StateDelta]] and/or [[encounter-delta-model|EncounterDelta]] values. They are the verbs of the effect system.

### DealDamage

Runs the [[nine-step-damage-formula]]. Produces `hpDelta` and potentially `injuries` on the target. The pipeline is a [[chain-of-responsibility-pattern|chain of responsibility]] — each step processes its concern and passes forward.

**Requires:** `HasStats, HasCombatStages, HasHealth, HasTypes` (target); `HasStats, HasCombatStages` (user)
**Params:** `damageBase`, `type`, `damageClass`, `dbModifiers[]`, `critBehavior`
**Produces:** `combatantDeltas` (target hpDelta, injuries), `events` (damage event)

Modifiers (STAB, weather, type effectiveness, critical) are computed within the pipeline from context + params. The atom receives pre-rolled damage dice via [[resolution-context-inputs]].

### ApplyStatus

Adds a `StatusInstance` or `VolatileInstance` to the target. Handles immunity checks (Poison-type immune to Poisoned, Limber immune to Paralysis) by reading target's `HasTypes` and `HasActiveEffects`.

**Requires:** `HasStatus, HasTypes, HasActiveEffects` (target)
**Params:** `category: 'persistent' | 'volatile'`, `condition`, `source`
**Produces:** `combatantDeltas` (statusConditions or volatileConditions mutation), `events` (status-applied event)

Status CS auto-application (Burn: -2 Def, Poison: -2 SpDef per [[status-cs-auto-apply-with-tracking]]) is bundled — applying Burned also produces a combat stage delta.

### RemoveStatus

Removes a condition. Handles cure CS reversal — if the status applied combat stage changes on infliction, removing it reverses those changes per [[condition-source-tracking]].

**Requires:** `HasStatus, HasCombatStages` (target)
**Params:** `category`, `condition`
**Produces:** `combatantDeltas` (condition removal + CS reversal)

### ModifyCombatStages

Adds or subtracts from one or more combat stages. Stages are clamped to -6..+6 by the engine's application rules per [[state-delta-model]].

**Requires:** `HasCombatStages` (target)
**Params:** `stages: Partial<CombatStages>`
**Produces:** `combatantDeltas` (combatStages delta)

### HealHP

Restores HP. Distinct from DealDamage because healing suppression (Heal Block) is handled centrally by the [[effect-trigger-system]] — the engine emits a `healing-attempted` event before any healing atom runs, and Heal Block subscribes as a before-trigger with interception. The atom itself does not check for Heal Block.

**Requires:** `HasHealth` (target)
**Params:** `amount` or `ticks` (1 tick = 1/10 max HP)
**Produces:** `combatantDeltas` (hpDelta), `events` (heal event)

### ManageResource

Modifies energy, fatigue, mettle, or temp HP. Covers energy costs (move use), energy recovery (Volt Absorb), fatigue changes (zero energy, Take a Breather), and mettle point changes.

**Requires:** `HasEnergy` or `HasHealth` or `HasStatus` (depending on resource)
**Params:** `resource: 'energy' | 'fatigue' | 'mettle' | 'tempHp'`, `amount`
**Produces:** `combatantDeltas` (the relevant additive or replacement field)

### DisplaceEntity

Modifies position. Covers push (Circle Throw: 6 - WC), pull, reposition (Surf: user into AoE), and forced shift (Roar). Weight class and size interactions are computed from `HasMovement`.

**Requires:** `HasPosition, HasMovement` (target)
**Params:** `direction`, `distance`, `sizeInteraction: boolean`
**Produces:** `combatantDeltas` (position replacement)

### MutateInventory

Steals, drops, or swaps held items. This is an [[entity-write-exception]] — it writes entity state, not lens state. The atom produces an `EntityWriteDelta` alongside the `StateDelta`.

**Requires:** `HasInventory` (user and target)
**Params:** `op: 'steal' | 'drop' | 'swap'`
**Produces:** `combatantDeltas` (EntityWriteDelta on user and/or target), `events` (item event)

### ModifyActionEconomy

Grants or consumes actions. Covers Whirlpool (embeds swift action), Opportunist (extra AoO), action budget resets.

**Requires:** `HasActions` (target)
**Params:** `budgetChanges: Partial<ActionBudget>`, `outOfTurnChanges: Partial<OutOfTurnUsage>`
**Produces:** `combatantDeltas` (actionBudget/outOfTurnUsage replacement)

### ApplyActiveEffect

Adds or removes an [[active-effect-model|ActiveEffect]] to/from the target's lens. Covers Flash Fire boost, Heal Block, Destiny Bond, and any persistent buff/debuff that doesn't fit the status/volatile system.

**Requires:** `HasActiveEffects` (target)
**Params:** `op: 'add' | 'remove'`, `effect: ActiveEffect` (for add) or `effectId: string` (for remove)
**Produces:** `combatantDeltas` (activeEffects mutation)

### ModifyMoveLegality

Applies restrictions on what moves the target can use. Taunt/Enraged restricts to damaging moves only. Disable prevents a specific move. Implemented as a volatile condition or active effect that the action presentation system reads.

**Requires:** `HasStatus` or `HasActiveEffects` (target)
**Params:** `restriction`, `duration`
**Produces:** `combatantDeltas` (volatileConditions or activeEffects mutation)

### ModifyInitiative

Manipulates a combatant's turn order within the current round. Covers two distinct operations: setting initiative to an absolute value (Quash: set to 0), and reordering relative to another combatant (After You: target goes next after user). Initiative is a lens field per [[game-state-interface]] — transient, per-round, destroyed at round end.

**Requires:** (reads initiative from encounter turn order)
**Params:** `op: 'set' | 'set-next-after'`, `value: number` (for `set`), `relativeTo: EntityId` (for `set-next-after`)
**Produces:** `combatantDeltas` (initiative replacement or reorder directive), `events` (initiative-changed event)

The `set-next-after` operation is not a numeric delta — it's a turn-order insertion directive. The engine reads this and reorders the round's remaining turns. This is analogous to how `embeddedActions` on [[effect-node-contract|EffectResult]] declares intent that the engine acts on.

## Encounter-producing atoms

These atoms produce [[encounter-delta-model|EncounterDelta]] values. They modify shared encounter state. Defog is not a dedicated atom — it is a [[effect-composition-model|Sequence]] of ModifyFieldState atoms (weather clear + hazard remove-all + blessing remove-all + coat remove-all), consistent with the principle that atoms are finite and novelty is in composition.

### ModifyFieldState

Sets or clears weather, terrain. Adds or removes hazards, blessings, coats, vortexes. Each field state type has its own mutation vocabulary per [[encounter-delta-model]].

**Requires:** (reads encounter state for validation — e.g., can't add a second weather)
**Params:** the mutation (e.g., `{ field: 'weather', op: 'set', type: 'rain', rounds: 5 }`)
**Produces:** `encounterDelta` (the field state mutation)

### ModifyDeployment

Handles switching. Moves entities between active/reserve/fainted per [[deployment-state-model]]. The engine manages lens lifecycle (archive outgoing, create incoming).

**Requires:** (reads deployment state)
**Params:** `op: 'switch-out' | 'switch-in' | 'faint'`, `trainerId`, `entityId`
**Produces:** `encounterDelta` (deployment mutation)

## Resolution atoms

These atoms don't produce deltas directly — they resolve a check and set `success: boolean` on the [[effect-node-contract|EffectResult]]. Parent compositions read `success` for flow control: [[effect-composition-model|Sequence]] halts on `success: false` when `haltOnFailure` is set; [[effect-composition-model|Conditional]] branches on it.

### ResolveAccuracyCheck

Compares the accuracy roll (from [[resolution-context-inputs]]) against the target's evasion (derived per [[combat-lens-sub-interfaces]] HasCombatStages). Hit or miss determines whether downstream atoms (damage, status) fire.

**Requires:** `HasCombatStages` (user, for accuracy CS); evasion is pre-derived in context
**Params:** `moveAC`
**Produces:** `events` (accuracy event), `success: false` on miss

### ResolveSkillCheck

1d20 + modifier vs DC. The roll is injected via resolution context. Modifier computed from entity stats + trait modifiers. Used by combat maneuvers (Push, Trip, Grapple), training checks, social skill checks.

**Requires:** `HasStats` (for modifier derivation)
**Params:** `skill`, `dc`, `modifiers[]`
**Produces:** `events` (skill check event), `success: false` on failure

## Engine primitives

These atoms are not state-producing, encounter-producing, or resolution atoms. They are engine-level primitives used by the [[effect-trigger-system]] and [[effect-composition-model]] for control flow.

### InterceptEvent

Sets the interception flag in a before-trigger's result. When a before-trigger produces `{ intercepted: true }`, the engine skips applying the original event's deltas. This is the mechanism for damage prevention (Protect, Wide Guard) and type absorption (Flash Fire, Volt Absorb, Water Absorb, Lightning Rod, Storm Drain, Motor Drive, Sap Sipper).

**Requires:** (none — reads nothing from the context)
**Params:** none
**Produces:** `{ intercepted: true }` flag on the result. Typically sequenced with other atoms — e.g., `sequence([interceptEvent(), manageResource({ resource: 'energy', amount: 5 })])` in Volt Absorb.

### PassThrough

Explicit no-op. Returns an empty `EffectResult` with no deltas, events, or triggers. Used in else-branches of [[effect-composition-model|ChoicePoint]] and [[effect-composition-model|Conditional]] where one branch requires no action.

**Requires:** (none)
**Params:** none
**Produces:** empty `EffectResult`

## Atom count

18 atoms total: 12 state-producing, 2 encounter-producing, 2 resolution, 2 engine primitives. This covers the full vocabulary discovered in the state inventory (45 sample definitions) and consolidated ring plan.

## SE principles applied

- [[strategy-pattern]] — each atom type is a strategy implementing the shared [[effect-node-contract]]. New atoms extend the catalog with one strategy addition and one evaluation function.
- [[single-responsibility-principle]] — each atom has one job (deal damage, apply status, heal, etc.)
- [[interface-segregation-principle]] — each atom declares narrow `requires` (only the sub-interfaces it reads)
- [[chain-of-responsibility-pattern]] — the damage pipeline within DealDamage is a chain of processing steps
- [[tell-dont-ask]] — atoms receive assembled context, produce results; they don't reach into state to query and compute

## See also

- [[effect-node-contract]] — the shared interface all atoms implement
- [[effect-composition-model]] — how atoms combine into trees
- [[state-delta-model]] — per-combatant deltas that state-producing atoms generate
- [[encounter-delta-model]] — encounter-level deltas that encounter-producing atoms generate
- [[combat-lens-sub-interfaces]] — the sub-interfaces atoms declare in `requires`
- [[nine-step-damage-formula]] — the pipeline DealDamage implements
- [[entity-write-exception]] — MutateInventory is the primary entity-write atom
- [[active-effect-model]] — ApplyActiveEffect manages the ActiveEffect collection
- [[field-state-interfaces]] — ModifyFieldState operates on these
- [[resolution-context-inputs]] — rolls and decisions that resolution atoms consume
- [[r0a-sample-effect-definitions]] — the 45 validation definitions exercising all atom types
