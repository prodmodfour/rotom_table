# Saga-Orchestrated Turn Lifecycle

A destructive restructuring to annihilate every transaction script in the server — replacing `next-turn.post.ts` (847 lines), `action.post.ts`, `damage.post.ts`, and similar procedural mega-handlers with a saga orchestrator where each game system registers independent step handlers for lifecycle events, sequenced by declared dependencies — addressing the [[transaction-script-turn-lifecycle|transaction script pattern]] and the [[monolithic-mechanic-integration|monolithic integration of game mechanics]].

## The idea

The turn lifecycle is currently a waterfall of inlined game system logic. Tick damage, weather effects, ability triggers, mount checks, action economy, XP tracking — all executed in sequence inside a single function. The ordering is implicit (code position). The dependencies are invisible (weather damage must happen before ability-based healing). Adding a new turn-end effect means inserting code into a fragile 847-line handler.

Replace this with a saga orchestrator. Each game system declares lifecycle step handlers with explicit dependency edges. The orchestrator topologically sorts them and executes them in order. No single file knows about more than one game system. The orchestrator knows about none of them — it just sequences steps.

```typescript
// Each game system registers its own lifecycle steps — one file per system
// weather-turn-steps.ts
export const weatherTurnSteps: LifecycleStep[] = [
  {
    id: 'weather:tick-damage',
    phase: 'turn-end',
    after: ['combat:check-faint'],  // explicit dependency
    before: ['weather:ability-healing'],
    handler: async (ctx) => {
      const weather = ctx.getContainer('weather')
      if (!weather.current) return

      for (const combatant of ctx.getCombatants()) {
        const damage = computeWeatherDamage(combatant, weather.current)
        if (damage > 0) {
          ctx.applyDamage(combatant.id, damage, `${weather.current} damage`)
        }
      }
    }
  },
  {
    id: 'weather:ability-healing',
    phase: 'turn-end',
    after: ['weather:tick-damage'],
    handler: async (ctx) => {
      // Ice Body, Rain Dish, Dry Skin healing
      for (const combatant of ctx.getCombatants()) {
        const healing = computeWeatherHealing(combatant, ctx.getWeather())
        if (healing > 0) ctx.applyHealing(combatant.id, healing)
      }
    }
  },
  {
    id: 'weather:status-cure',
    phase: 'turn-end',
    after: ['weather:ability-healing'],
    handler: async (ctx) => {
      // Hydration, Leaf Guard
      for (const combatant of ctx.getCombatants()) {
        const cured = checkWeatherStatusCure(combatant, ctx.getWeather())
        if (cured) ctx.removeStatus(combatant.id, cured)
      }
    }
  }
]

// status-turn-steps.ts
export const statusTurnSteps: LifecycleStep[] = [
  {
    id: 'status:tick-damage',
    phase: 'turn-end',
    after: [],  // runs early
    before: ['combat:check-faint'],
    handler: async (ctx) => {
      for (const combatant of ctx.getCombatants()) {
        for (const status of combatant.statusConditions) {
          const tickDamage = computeStatusTickDamage(combatant, status)
          if (tickDamage > 0) ctx.applyDamage(combatant.id, tickDamage, `${status.name} damage`)
        }
      }
    }
  }
]

// mounting-turn-steps.ts
export const mountingTurnSteps: LifecycleStep[] = [
  {
    id: 'mounting:dismount-on-faint',
    phase: 'turn-end',
    after: ['combat:check-faint'],  // must check faint first
    handler: async (ctx) => {
      for (const pair of ctx.getMountedPairs()) {
        if (ctx.isFainted(pair.mountId)) {
          ctx.dismount(pair.riderId, pair.mountId)
        }
      }
    }
  }
]

// The saga orchestrator — knows nothing about game systems
class TurnLifecycleSaga {
  private steps = new Map<string, LifecycleStep>()

  register(...stepSets: LifecycleStep[][]) {
    for (const set of stepSets) {
      for (const step of set) {
        this.steps.set(step.id, step)
      }
    }
  }

  async execute(phase: LifecyclePhase, ctx: SagaContext): Promise<SagaResult> {
    const phaseSteps = [...this.steps.values()].filter(s => s.phase === phase)
    const sorted = topologicalSort(phaseSteps)  // respects after/before edges
    const results: StepResult[] = []

    for (const step of sorted) {
      const result = await step.handler(ctx)
      results.push({ stepId: step.id, result })

      // If a step caused a faint, re-evaluate downstream steps
      if (ctx.hasPendingFaints()) {
        ctx.processFaints()
      }
    }

    return { phase, steps: results, stateChanges: ctx.getChanges() }
  }
}

// Registration — the only place that knows all systems exist
const saga = new TurnLifecycleSaga()
saga.register(
  weatherTurnSteps,
  statusTurnSteps,
  mountingTurnSteps,
  combatTurnSteps,
  actionEconomyTurnSteps,
  leagueBattleTurnSteps,
  xpTrackingTurnSteps,
)

// next-turn.post.ts — becomes 10 lines
export default defineEventHandler(async (event) => {
  const { id } = getRouterParams(event)
  const encounter = await loadEncounter(id)
  const ctx = new SagaContext(encounter)
  const result = await saga.execute('turn-end', ctx)
  await persistChanges(ctx)
  broadcast(id, result)
  return result
})
```

## Why this is destructive

- **`next-turn.post.ts` (847 lines) is demolished.** It becomes a 10-line route that delegates to the saga. All 13 inlined concerns are ripped out into independent step handler files.
- **`action.post.ts` is demolished.** Action resolution becomes a saga phase (`'action-resolve'`) with steps for damage, status application, stage changes, ability triggers, and secondary effects.
- **`damage.post.ts` is demolished.** Damage application becomes a saga phase (`'damage-apply'`) with steps for temp HP absorption, faint checking, heavily-injured penalty, and mount dismount.
- **`next-round.post.ts` is demolished.** Round transitions become a saga phase (`'round-end'`) with steps for frequency resets, duration ticks, and weather duration.
- **Every API route that currently orchestrates multiple game systems is gutted.** Routes become thin dispatchers: parse request, create context, execute saga phase, persist, broadcast.
- **The implicit ordering of game system interactions is replaced by a dependency graph.** Currently, burn damage happens before weather damage because of code position. After this change, `status:tick-damage` declares `before: ['combat:check-faint']` and `weather:tick-damage` declares `after: ['combat:check-faint']`. The ordering is explicit, auditable, and verifiable.
- **New game systems are added by registering steps.** Adding trap damage requires creating `trap-turn-steps.ts` with steps that declare their position in the dependency graph. No existing step handlers change.

## Principles improved

- [[single-responsibility-principle]] — each step handler knows about exactly one game system. The orchestrator knows about sequencing. Routes know about HTTP. No one knows everything.
- [[open-closed-principle]] — the saga is closed for modification, open for extension. New steps are registered without changing the orchestrator or existing steps. This is the most significant OCP improvement in any proposal — currently adding a turn-end effect requires modifying the monolithic handler.
- [[dependency-inversion-principle]] — step handlers depend on the `SagaContext` abstraction, not on concrete encounter state or Prisma. The context provides typed operations (`applyDamage`, `removeStatus`, `dismount`) without exposing implementation.
- [[liskov-substitution-principle]] — all step handlers conform to the `LifecycleStep` interface. The orchestrator treats them uniformly regardless of their domain.
- Eliminates [[transaction-script-turn-lifecycle]] — the procedural mega-handlers are replaced by composed, independent steps.
- Eliminates [[monolithic-mechanic-integration]] — mechanics are decoupled from each other and from the orchestration layer.
- Eliminates [[hardcoded-game-rule-proliferation]] — each game rule lives in its own step handler, not inlined in a shared function.

## Patterns and techniques

- Saga pattern — the orchestrator sequences steps across multiple domain aggregates with explicit coordination
- [[chain-of-responsibility-pattern]] — steps form a chain processed in dependency order
- [[strategy-pattern]] — each step handler is a strategy for processing one concern during a lifecycle phase
- [[template-method-pattern]] — the saga's `execute` method defines the skeleton (sort → iterate → run → check faint → persist); steps fill in the details
- [[observer-pattern]] — the `SagaContext` can emit events (e.g., `combatant-fainted`) that downstream steps react to
- Topological sort — the dependency DAG is resolved at registration time, catching circular dependencies early
- [[command-pattern]] — each step's side effects are recorded as state changes on the context, enabling undo and audit logging

## Trade-offs

- **Indirection cost.** Currently, reading `next-turn.post.ts` top-to-bottom tells you exactly what happens on turn end. With the saga, you must read 7+ step files and mentally reconstruct the topological order. The linear script is easier to read; the saga is easier to extend.
- **Dependency graph debugging.** When step ordering produces unexpected results (e.g., a combatant faints before its weather healing triggers), debugging requires understanding the topological sort and the declared edges — not just reading sequential code.
- **Context API design is critical.** The `SagaContext` must provide operations general enough for all game systems but specific enough to be useful. Getting this wrong creates either an anemic context (steps reach past it to raw state) or a bloated one (the context becomes its own god object).
- **Cross-step state sharing.** Some steps need to know what previous steps did (e.g., "did any combatant faint this turn?"). The saga context must track intermediate results and make them available to downstream steps — adding state management complexity.
- **Circular dependency detection at registration time vs. runtime.** Topological sort catches circular `after`/`before` edges at startup. But implicit dependencies (step A reads a value that step B writes, without a declared edge) are only caught at runtime.
- **Performance overhead.** Creating a saga context, sorting steps, iterating handlers, and recording changes adds overhead compared to a direct procedural script. For a tabletop app with one action per second, this is negligible — but it's not free.
- **Testing trade-off.** Individual steps are trivially testable (create context, run handler, assert changes). But testing the full lifecycle requires registering all steps, executing the saga, and verifying cross-step interactions — which is harder than testing one big function.

## Open questions

- What are the lifecycle phases? `turn-start`, `turn-end`, `round-start`, `round-end`, `action-resolve`, `damage-apply`, `faint-process`? More? Fewer?
- Should the saga context be immutable (steps return changes, orchestrator applies them) or mutable (steps modify context directly)?
- How do conditional steps work? E.g., weather steps should only run if weather is active. Does each step check internally, or does the orchestrator support conditional registration?
- How does this interact with [[encounter-dissolution]]? If the encounter is dissolved into containers, do steps operate on container-specific contexts?
- How does this interact with [[data-driven-rule-engine]]? If game rules are data-driven, are step handlers generated from rule definitions rather than hand-written?
- How does this interact with [[event-sourced-encounter-state]]? Each step's state changes could be recorded as events in an append-only log, making the saga a natural event producer.
- Should the saga support rollback? If step 7 of 10 fails, should steps 1–6 be undone? Or is partial execution acceptable?

## See also

- [[transaction-script-turn-lifecycle]] — the problem this addresses
- [[monolithic-mechanic-integration]] — the broader problem of mechanics woven together
- [[hardcoded-game-rule-proliferation]] — eliminated by isolating rules into step handlers
- [[damage-pipeline-as-chain-of-responsibility]] — the damage pipeline becomes a saga phase
- [[encounter-lifecycle-state-machine]] — compatible: the state machine defines which phases are valid; the saga executes the steps within each phase
- [[plugin-mechanic-architecture]] — compatible: each plugin registers its own lifecycle steps
- [[encounter-dissolution]] — compatible: steps operate on independent state containers
- [[event-sourced-encounter-state]] — compatible: step results are events
- [[game-engine-extraction]] — compatible: step handlers can call engine functions
