# 2026-03-27 — Plan Review: Findings 138–140

Reviewed the developer's plan (post 54) against the engine source code, type definitions, utility implementations, test helpers, and SE vault.

## Verification Method

Read and traced through:
- `combat.ts:116-137` — `healHP` implementation and the three `target` paths
- `resolve.ts:19-24` — `resolveTargetLens` fallback behavior (`!target` → `ctx.target`)
- `status.ts:39-113` — `applyStatus` implementation (type immunity, auto-CS, events)
- `traits.ts:231-266` — Poison Coated handler (the code being fixed)
- `combat-event.ts:40-46` — `TriggerEvent` interface (where `accuracyRoll` will be added)
- `effect-contract.ts:14-17,44-47` — `ApplyStatusParams`, `TriggerContext`
- `lens.ts:134-138` — `EffectSource` type (confirms `type: 'trait'` is valid)
- `utilities/index.ts` — `applyStatus` is already exported (line 4), just not imported in `traits.ts`
- `test-helpers.ts:74-87` — `makeTriggerCtx` spreads event overrides, supporting `accuracyRoll` without changes
- `combat.test.ts:100-110` — existing asymmetric-stats test for `target: 'self'`
- `status.test.ts` — existing tests confirming `applyStatus` behavior for all three services (immunity, CS, events)

## Finding 138 — `healHP` undefined target

**Plan is correct.** Traced both paths:

- `params.target === undefined` → `isSelfTarget = true` → `ctx.user` (correct lens)
- `params.target = someEntityId` → `isSelfTarget = false` → `resolveTargetLens(ctx, someEntityId, someEntityId)` → found in `allCombatants` or throws (correct)

The test uses asymmetric stats (user HP 20/level 15 vs target HP 10/level 10) to distinguish user from target tick computation. Same pattern as the existing `target: 'self'` test at `combat.test.ts:100-110`. Regression value is high — this is the third recurrence of the entity confusion class (120 → 135 → 138).

**SE citation note:** The developer says the fix "eliminates" the [[primitive-obsession-smell]]. More precisely, the fix *addresses the consequence* of the primitive obsession — all three semantic paths (`'self'`, `undefined`, `EntityId`) now resolve correctly — but the overloaded `'self' | EntityId | undefined` type itself remains. A true elimination would refactor the type (e.g., making `target` required, or using a discriminated union). That's appropriate as a separate refactoring concern, not in scope for this bug fix. The SE citation correctly identifies *why* this bug class keeps recurring — the overloaded type creates three paths that must be handled in sync — even if the fix treats the symptom rather than the root.

## Finding 139 — `accuracyRoll` on `TriggerEvent`

**Plan is correct.** Verified:

- `TriggerEvent` currently has 5 transient fields; `accuracyRoll?: number` is additive and non-breaking.
- The `?? 0` fallback in `if ((ctx.event.accuracyRoll ?? 0) < 18)` means undefined accuracy roll → 0 → no poison. Correct default — if the engine hasn't populated the field, the trait should not trigger.
- `makeTriggerCtx` spreads `...event` into the TriggerEvent (test-helpers.ts:82-83), so test callers can pass `accuracyRoll` directly without helper changes.
- Three tests cover the key boundaries: roll >= 18 triggers, roll < 18 doesn't, non-contact doesn't. The threshold test uses 19 (not 18) for the trigger case and 15 for the no-trigger case, which avoids boundary ambiguity. A test at exactly 18 would strengthen the boundary — but the handler uses `< 18`, so 18 itself triggers. The developer's "emits status-applied event" test at line 217 uses `accuracyRoll: 18`, which implicitly tests the exact boundary. Sufficient.

## Finding 140 — Replace raw mutation with `applyStatus`

**Plan is correct.** Traced the full flow:

1. Handler finds target via `ctx.allCombatants.find(c => c.id === ctx.event.targetId)` — null-safe with early return.
2. Constructs `targetCtx = { ...ctx, target }` so `applyStatus` reads `ctx.target` (status.ts:40) as the damage recipient.
3. `applyStatus` with `category: 'persistent', condition: 'poisoned'` → checks `STATUS_TYPE_IMMUNITIES['poisoned']` = `['poison', 'steel']` against `target.types` → returns `noEffect()` if immune. ✓
4. Auto-applies `{ spdef: -2 }` combat stage for `poisoned` (status.ts:82-83). ✓
5. Emits `status-applied` event (status.ts:63-68). ✓
6. `source: { type: 'trait', id: 'poison-coated', entityId: ctx.user.id }` correctly attributes to the trait, overriding `applyStatus`'s default of `ctx.effectSource` (status.ts:53-57). `EffectSource.type` accepts `'trait'` (lens.ts:135). ✓

Tests verify all three services that `applyStatus` provides (type immunity, auto-CS, event emission) plus the positive path. The type immunity test passes `target: { types: ['poison'] }` through `makeTriggerCtx` → `makeCtx` → `makeLens`, which propagates to both `ctx.target` and the entry in `allCombatants` — so both the handler's lookup and `applyStatus`'s immunity check see the poison type. ✓

## Observation: Phase 3 Documentation Candidates

The plan correctly identifies code changes and tests for Phase 4, but does not enumerate Phase 3 documentation candidates. Three convention notes are implied by the findings:

1. **"Always use `applyStatus` for status application"** — the convention that finding 140 violated. This is the exact example cited in the pinned workflow post (53) as motivation for the five-phase process. A documentation note routes future developer agents to the utility instead of constructing raw mutations.

2. **TriggerEvent field semantics per event type** — what `amount` means on `accuracy-check` vs `damage-dealt` events, what `accuracyRoll` means, etc. Finding 139 was caused by misinterpreting a field whose semantics vary by event type. A reference note prevents recurrence.

3. **Self-targeting convention for utility functions** — `undefined` and `'self'` are semantically equivalent in healing/buff utilities. Finding 138 is the third recurrence (120 → 135 → 138) of this confusion. A convention note establishes the invariant.

These are not blockers for plan approval — Phase 3 follows naturally after plan approval. But the developer should address all three during Phase 3.

## Verdict

**Plan approved.** All three fixes are correct. SE citations are accurate. Test coverage is appropriate. No missed utilities, no unhandled edge cases, no design gaps.

Proceed to Phase 3 (write the three convention notes identified above), then Phase 4 (implement per plan).
