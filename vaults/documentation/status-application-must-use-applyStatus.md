# Status Application Must Use applyStatus

All status condition application in effect handlers must go through the [[effect-utility-catalog|applyStatus]] utility. Constructing raw `statusConditions` or `volatileConditions` mutations directly in handler code is prohibited.

## Why

`applyStatus` centralizes three invariants that every status application requires:

1. **Type immunity checks** — Electric immune to Paralysis, Fire immune to Burn, Poison/Steel immune to Poison, etc. (per [[type-grants-status-immunity]]). The utility checks `target.types` against the immunity table before producing any delta.
2. **Auto-CS application** — Burn applies -2 Def CS, Poison/Badly Poisoned applies -2 SpDef CS (per [[status-cs-auto-apply-with-tracking]]). The utility bundles the combat stage delta alongside the status mutation.
3. **Event emission** — every status application emits a `status-applied` [[combat-event-log-schema|CombatEvent]], enabling the [[effect-trigger-event-bus]] to dispatch reactive traits (e.g. Synchronize, Guts activation).

Bypassing the utility means reimplementing some or all of these invariants — a [[duplicate-code-smell]] that violates [[single-responsibility-principle]]. Finding 140 demonstrated the consequence: Poison Coated constructed a raw mutation, skipping type immunity (Poison-type targets could be poisoned), auto-CS (-2 SpDef never applied), and event emission (no `status-applied` event for reactive traits).

## The convention

```
// Correct — uses centralized utility
return applyStatus(ctx, {
  category: 'persistent',
  condition: 'poisoned',
  source: { type: 'trait', id: 'poison-coated', entityId: ctx.user.id },
})

// Wrong — constructs raw mutation, missing immunity/CS/events
result.combatantDeltas.set(targetId, {
  statusConditions: [{ op: 'add', condition: 'poisoned', source }],
})
```

When applying status from a trigger handler where `ctx.target` is the user (not the damage recipient), construct a new context with the correct target before calling:

```
const target = ctx.allCombatants.find(c => c.id === ctx.event.targetId)
if (!target) return noEffect()
return applyStatus({ ...ctx, target }, { category: 'persistent', condition: 'poisoned' })
```

## See also

- [[effect-utility-catalog]] — `applyStatus` is one of the 30 shared utilities
- [[effect-handler-contract]] — handlers produce EffectResult via utilities, not raw deltas
- [[type-grants-status-immunity]] — the immunity table `applyStatus` enforces
- [[shotgun-surgery-smell]] — bypassing the utility scatters immunity/CS/event logic across handlers
