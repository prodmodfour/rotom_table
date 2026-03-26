# 2026-03-26 — Foundational Reassessment: Composition Framework vs Plain Functions

Before resolving findings 55–66, we step back and ask: is the composition framework the right foundation? The findings are individually fixable, but the trajectory across five adversarial reviews raises a deeper question.

---

## The trajectory problem

Each adversarial review added complexity to the composition framework:

| Review | What grew |
|---|---|
| Findings 1–9 | 6 tracks → rings, effect engine becomes root, ~15 atoms + 2 compositions |
| Findings 10–20 | ~20 atoms, 7 compositions, 3 composition categories, 4 delta modes, resolution modifiers |
| Findings 21–32 | Source tracking, deployment model, generic ActiveEffect, entity-write exceptions |
| Findings 33–42 | Evasion derivation, initiative derivation, fatigue state, 4 delta application modes formalized |
| Findings 43–54 | EffectResult gains success + embeddedActions, InterceptEvent/PassThrough atoms, OCP relabeling across 5 notes, trigger-specific predicates, Heal Block centralization |
| Findings 55–66 | CrossEntityFilter needs context switching, triggers need field state registration, accuracy needs resolution context modification, DealDamage needs bonusDamage + resistance |

The framework grows monotonically. Good abstractions simplify as they mature. This one complexifies. Each review reveals the framework can't express some PTR behavior, and the fix is always "expand the framework." After 66 findings, the composition model has: 18 atom types, 7 composition types across 3 categories, 2 trigger timings with dispatch ordering, resolution modifiers, 6 EffectResult fields, 4 delta application modes, and an engine that mediates assembly, evaluation, delta application, trigger dispatch, interception, recursion, embedded actions, and field-state trigger registration.

The framework was designed to avoid writing 579 bespoke functions. But the "data" definitions it produces ARE programs:

```typescript
// Safeguard: 30 lines of nested control flow, event handling, and conditional logic
effect: modifyFieldState({
  field: 'blessing', op: 'add',
  instance: {
    type: 'safeguard',
    activationsRemaining: 3,
    activationEffect: {
      trigger: {
        eventType: 'status-applied',
        timing: 'before',
        scope: 'ally',
        condition: null,
        effect: choicePoint('activate-safeguard', {
          'yes': sequence([
            interceptEvent(),
            modifyFieldState({ field: 'blessing', op: 'consume', blessingId: 'safeguard' }),
          ]),
          'no': passThrough(),
        }),
      },
    },
  },
})
```

This has control flow (choicePoint), side effects (modifyFieldState), event handling (trigger), and conditional logic (condition). The helper functions (sequence, choicePoint, interceptEvent) are a DSL embedded in TypeScript. Calling it "data" doesn't change what it is.

---

## The alternative: plain TypeScript functions with shared utilities

Instead of the composition framework, each move and trait is a typed function: `(ctx: EffectContext) => EffectResult`. Shared utilities (`dealDamage`, `applyStatus`, `rollAccuracy`, etc.) provide the building blocks. TypeScript itself provides the composition language.

**Thunderbolt** — was: `Sequence([ResolveAccuracy, DealDamage, Conditional(roll >= 19, ApplyStatus)])`

```typescript
export const thunderbolt: MoveHandler = (ctx) => {
  const acc = rollAccuracy(ctx, { ac: 2 })
  if (!acc.hit) return acc.result

  const dmg = dealDamage(ctx, { db: 8, type: 'electric', class: 'special' })
  const status = acc.roll >= 19
    ? applyStatus(ctx, { condition: 'paralyzed' })
    : noEffect()

  return merge(acc.result, dmg, status)
}
```

**Beat Up** — finding 58's CrossEntityFilter context switching gap becomes a one-line utility:

```typescript
export const beatUp: MoveHandler = (ctx) => {
  const userAtk = dealDamage(ctx, { source: 'struggle', typeOverride: 'dark' })
  const allyAtks = getAdjacentAllies(ctx, { max: 2 }).map(ally =>
    withUser(ctx, ally, (c) =>
      dealDamage(c, { source: 'struggle', typeOverride: 'dark' })
    )
  )
  return merge(userAtk, ...allyAtks)
}
```

**Safeguard** — finding 59's embedded trigger problem becomes handler registration:

```typescript
export const safeguard: MoveHandler = (ctx) => {
  return addBlessing(ctx, 'safeguard', {
    activations: 3,
    onStatusApplied: (triggerCtx) =>
      choicePoint(triggerCtx, 'activate-safeguard', {
        yes: () => merge(
          intercept(triggerCtx),
          consumeBlessing(triggerCtx, 'safeguard')
        ),
        no: () => noEffect(),
      }),
  })
}
```

**Gyro Ball** — finding 56's bonusDamage gap becomes inline arithmetic:

```typescript
export const gyroBall: MoveHandler = (ctx) => {
  const acc = rollAccuracy(ctx, { ac: 2 })
  if (!acc.hit) return acc.result

  const userSpd = effectiveStat(ctx.user, 'spd')
  const targetSpd = effectiveStat(ctx.target, 'spd')
  const bonus = targetSpd > userSpd ? targetSpd - userSpd : 0

  return merge(acc.result,
    dealDamage(ctx, { db: 6, type: 'steel', class: 'physical', bonusDamage: bonus })
  )
}
```

---

## What this eliminates

| Framework concept | Replaced by |
|---|---|
| Atom catalog (18 types) | Utility functions (`dealDamage()`, `applyStatus()`, etc.) — same logic, no type registry |
| Composition model (7 types) | TypeScript `if`/`for`/`map`/ternary — the language IS the composition |
| EffectNode interface | `MoveHandler` / `TraitTriggerHandler` function types |
| Engine mediation | Simpler engine: calls handlers, applies results, dispatches triggers |
| Definition format with helper factories | Functions ARE the definitions |
| Atom `requires` ISP declarations | Utility function params are already typed |

---

## What stays the same

The GameState interface design (10 vault notes) is **fully reusable**. The composition framework and the function approach both need:

- Sub-interfaces (HasStats, HasHealth, HasCombatStages, etc.) — utility function params
- StateDelta / EncounterDelta — the write model
- Combat event log — historical queries (Retaliate, Destiny Bond)
- Field state types (Coat, Blessing, Hazard, Vortex) — lifecycle rules
- Deployment state — switching, bench/reserve/fainted
- Resolution context inputs — roll results, player decisions
- Trigger system — traits subscribe to events, engine dispatches (simpler: an event bus)

The effect engine's 6 vault notes shift from "composition framework specification" to "utility function design + trigger event bus." The architectural principles (DIP, ISP, SRP, Mediator for engine, Observer for triggers, Strategy for utilities) still apply — they describe the utilities and event bus, not the composition tree.

---

## Findings 55–66 under the function model

| Finding | Under composition framework | Under function model |
|---|---|---|
| **F55** (missing predicates) | Add to ConditionPredicate union | Write inline conditions: `if (effectiveStat(ctx.target, 'spd') > effectiveStat(ctx.user, 'spd'))` |
| **F56** (bonusDamage) | Extend DealDamage atom params | Compute bonus inline, pass to `dealDamage()` utility |
| **F57** (resistance step) | New atom or pipeline step | Add `resistanceModifier` param to `dealDamage()` utility |
| **F58** (CrossEntityFilter context switching) | New contract on composition type | `withUser(ctx, ally, fn)` — one utility function |
| **F59** (blessing triggers in atom params) | Restructure trigger registration + atom params | Pass handler function to `addBlessing()` |
| **F60** (Thunder Wave immunity centralization) | Move check into ApplyStatus atom | Move check into `applyStatus()` utility — same fix, simpler location |
| **F62** (Flash Fire consumption) | Expand ActiveEffect expiry model | Write an after-trigger handler that checks and removes |
| **F65** (Teamwork accuracy modification) | Needs resolution context modification by before-triggers | Before-trigger handler returns `{ accuracyBonus: 2 }`, engine applies before resolving |

Every finding becomes either trivial (inline code) or a utility function enhancement. No framework expansions. No contract changes.

---

## SE vault argument

Three principles from `vaults/documentation/software-engineering/` argue for the function approach:

**`rule-of-three.md`** — "When doing something for the first time, just get it done. When doing something for the second time, cringe. When doing something for the third time, start refactoring." The composition framework was designed before writing three definitions. Functions follow the rule: write implementations first, extract patterns when they emerge.

**`speculative-generality-smell.md`** — "Unused classes, methods, fields, or parameters created 'just in case' for anticipated future needs that never materialized." The framework anticipated all 579 definitions before one was implemented. Each review proved the anticipation incomplete. Functions solve today's definitions; abstractions emerge from actual repetition.

**`refactoring-in-small-changes.md`** — "Refactoring should be done as a series of small changes, each making the code slightly better while still leaving the program in working order." Functions are immediately working code. The framework requires the entire composition model to be designed and validated before anything runs.

---

## The trade-off

**Lost:**
- Static analyzability — "which moves use DealDamage?" becomes a grep, not a type query. No tooling for this exists or is planned.
- Structural enforcement — a handler CAN do anything, not just compose atoms. Convention and code review replace type-level constraints.
- "Definitions are data" claim — definitions are code. But the composition trees were already programs expressed as data structures.

**Gained:**
- Every gap is trivially solvable — need context switching? Write a utility. Need a new damage mode? Add a param. No framework changes.
- Content authoring is writing TypeScript with helpers — the same skill as writing the app itself.
- Immediately testable — unit test each handler function.
- The framework's monotonic complexity growth stops — complexity lives in individual handlers where it belongs, not in a shared abstraction layer.
- Rule of three is respected — abstractions emerge from repetition in actual implementations, not from anticipating 579 definitions.

---

## What changes

**Vault notes that survive unchanged (10):**
- `game-state-interface.md` — root note, three layers
- `combat-lens-sub-interfaces.md` — 15 Has* interfaces
- `state-delta-model.md` — how effects write
- `encounter-delta-model.md` — encounter-level changes
- `active-effect-model.md` — generic buff/debuff tracking
- `field-state-interfaces.md` — 6 field state types
- `deployment-state-model.md` — bench/reserve/fainted
- `entity-write-exception.md` — Thief exception
- `combat-event-log-schema.md` — historical queries
- `resolution-context-inputs.md` — expanded pure-function inputs

**Vault notes that get rewritten (6):**
- `effect-node-contract.md` → `effect-handler-contract.md` — MoveHandler/TraitTriggerHandler function types, EffectResult (unchanged), EffectContext (unchanged), engine role (simplified)
- `effect-atom-catalog.md` → `effect-utility-catalog.md` — same ~18 operations as typed utility functions instead of atom types
- `effect-composition-model.md` → deleted or reduced to a "common patterns" reference — TypeScript IS the composition language
- `effect-trigger-system.md` → `effect-trigger-event-bus.md` — simplified: traits register handlers for event types, engine dispatches, before/after timing preserved
- `effect-definition-format.md` → `effect-handler-format.md` — function signature, utility imports, worked examples rewritten as functions
- `r0a-sample-effect-definitions.md` → rewritten with function-based definitions

**Vault notes updated with backlinks (same 8):**
- Same notes that were updated when the effect engine was created — links change from old note names to new.

**Consolidated ring plan update:**
- R0.A description changes from "composable effect system" to "typed effect handlers with shared utilities"
- Effect engine architecture section rewrites
- Exit criterion unchanged: 30 moves + 15 traits, all expressible, unit-tested

**Findings 55–66:** Most become moot (no framework to fix). F60 (Thunder Wave centralization) and F62 (Flash Fire consumption) still apply — they're correctness issues in the definitions, not framework issues. The remaining findings dissolve.

---

## R0.A exit criterion under function model

Unchanged in substance:

> The effect engine can express and correctly evaluate 30 representative moves and 15 representative traits, hand-selected to cover all identified mechanical patterns. The entity model can represent a Pokemon and Trainer with all fields needed for Ring 1 combat. All effect handler functions have unit tests. The handlers, entity model, and lens are co-designed and documented in the documentation vault.

The 45 definitions get rewritten as functions. The coverage matrix still applies — same mechanical patterns, different expression format.

---

**Status:** Foundational reassessment complete. The composition framework is correct but over-engineered — it solves a theoretical problem (representing effects as composable data) at the cost of monotonic complexity growth across 5 reviews. Plain TypeScript functions with shared utilities solve the practical problem (implementing 579 effects) with the language itself, respect the rule of three, and make every adversarial finding trivially resolvable. 10 of 16 vault notes survive unchanged. 6 get rewritten. ~~Awaiting decision: proceed with function model, or stay with composition framework.~~ Decision posted below.

