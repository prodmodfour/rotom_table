# 2026-03-26 — Decisions on Adversarial Review (Findings 67–87)

All 14 findings accepted. The review is correct — these are specification completeness gaps, not design flaws. The architecture is sound. The fix is straightforward: define the missing mechanism, expand the schemas, complete the catalog, and fix stale language.

One additional observation beyond the review's scope: the before-handler modification model interacts with recursive triggers. This interaction is now documented as part of the resolution.

---

## Category A resolution: before-handler modification model (F67, F81)

**The binary interception model is replaced by a three-mode before-handler response model.** Before-handlers can now: intercept (block entirely), modify (adjust the pending event's delta), or pass through.

Modification uses a `PendingModification` discriminated union with typed adjustment instructions:

```
PendingModification =
  | { type: 'scale-damage', factor: number }
  | { type: 'flat-damage-reduction', amount: number }
  | { type: 'accuracy-bonus', amount: number }
```

The `PendingModification` union starts narrow per [[rule-of-three]]. New modification types are added when a PTR mechanic requires them.

The engine collects all `pendingModifications` from all before-handlers, applies them in defined order (accuracy adjustments → damage scaling → flat damage reduction), then applies the modified delta. Interception overrides all modifications.

**Light Screen fixed:** the before-handler now calls `scaleDamage(0.5)` instead of recalculating damage via `dealDamage()`. No stale resolution context, no double-damage bug, no nonexistent `damageParams` field.

**Teamwork fixed:** the before-handler calls `accuracyBonus(2)` — a PendingModification that adjusts the accuracy check without persistent CS side effects.

**Recursive trigger interaction documented:** modifications are scoped to the event they modify. Inner trigger cycles don't inherit outer modifications.

**Vault notes amended:**
- `effect-trigger-event-bus.md` — "Before-handler interception" section replaced with "Before-handler response modes" covering all three modes, engine application order, and recursive trigger interaction
- `effect-handler-contract.md` — `EffectResult` gains `pendingModifications?: PendingModification[]` field
- `effect-utility-catalog.md` — three new modification utilities: `scaleDamage`, `flatDamageReduction`, `accuracyBonus`
- `r0a-sample-effect-handlers.md` — Light Screen handler rewritten to use `scaleDamage(0.5)`; Teamwork description updated

**New vault note created:**
- `before-handler-response-modes.md` — atomic note for the three-mode concept, linked from all relevant notes

---

## Category B resolution: schema expansions (F71, F80, F82, F83)

**F71 — TriggerContext.event expanded to TriggerEvent type.** `TriggerEvent extends CombatEvent` with transient metadata that handlers need during resolution: `moveType`, `isContact`, `damageClass`, `moveRange`, `sourceEntityId`. The combat log stores lean `CombatEvent`; the trigger context provides rich `TriggerEvent`. This is consistent with ISP — the log interface is narrow, the trigger context is wider.

**F80 — ActiveEffect gains `triggers?: TriggerRegistration[]` field.** When an ActiveEffect is added to the lens, the engine registers these handlers with the event bus. When it expires or is removed, the engine unregisters them. This is the missing link between ActiveEffect instances and their reactive behavior.

**F82 — `dealDamage` gains `defenderStat?: 'def' | 'spdef'` param.** Psyshock uses `defenderStat: 'def'` to target physical defense with a special move.

**F83 — ActiveEffect gains `clearedBy?: ClearCondition[]` field.** `ClearCondition = 'switch-out' | 'take-a-breather' | 'end-of-action' | 'caster-faint'`. Heal Block uses `clearedBy: ['switch-out', 'take-a-breather']`. Protect uses `clearedBy: ['end-of-action']`. The engine evaluates clear conditions at the appropriate lifecycle points.

**Vault notes amended:**
- `effect-handler-contract.md` — `TriggerContext.event` type changed from `CombatEvent` to `TriggerEvent`; `TriggerEvent` struct documented with all 5 additional fields
- `active-effect-model.md` — `ActiveEffect` struct gains `triggers` and `clearedBy` fields; field descriptions added; Heal Block example updated
- `effect-utility-catalog.md` — `defenderStat` param added to `dealDamage` signature and described
- `combat-event-log-schema.md` — new "CombatEvent vs TriggerEvent" section clarifying the distinction

---

## Category C resolution: utility catalog completion (12 functions, F85)

**All 12 missing functions documented.** The catalog now includes:

| Added | Category | Used by |
|---|---|---|
| `addHazard(ctx, type, params)` | Encounter | Toxic Spikes, Stealth Rock |
| `addCoat(ctx, type, params)` | Encounter | Aqua Ring |
| `consumeBlessing(ctx, type)` | Encounter | Safeguard, Light Screen |
| `removeHazard(ctx, type, params?)` | Encounter | Toxic Spikes (Poison entry) |
| `embedAction(result, actionType)` | Control flow | Whirlpool, Pack Hunt |
| `requestReroll(ctx)` | Control flow | Mettle |
| `getEntitiesInRange(ctx, params)` | State query | Earthquake, Struggle Bug, Roar |
| `isAlly(ctx, entityId)` | State query | Teamwork, Pack Hunt |
| `itemSlotEmpty(lens)` | State query | Thief |
| `getResource(lens, resourceType)` | State query | Mettle |
| `getScalingParam(ctx, paramName)` | State query | Opportunist |
| `targetHasActedThisRound(ctx)` | State query | After You |
| `getHazardLayers(ctx, type)` | State query | Toxic Spikes |
| `modifyResolution(ctx, adjustments)` | State query / modification | Teamwork |

Plus 3 before-handler modification utilities (`scaleDamage`, `flatDamageReduction`, `accuracyBonus`).

**Utility count updated:** 30 utilities + ~16 state query helpers (was "20 utilities + ~8 helpers").

**`addHazard` and `addCoat` signatures documented** (F85) — both take trigger handler function params, same pattern as `addBlessing`.

**Vault notes amended:**
- `effect-utility-catalog.md` — all missing functions added with signatures; utility count corrected
- `r0a-sample-effect-handlers.md` — coverage matrix updated with all new utilities and helpers

---

## Category D resolution: stale language (F86, F87)

**F86 — `field-state-interfaces.md` fixed.** `BlessingInstance.activationEffect: EffectDefinitionRef` replaced with `BlessingInstance.blessingType: string`. Description updated: blessing activation is handled by trigger handler functions registered with the event bus via `addBlessing()`.

**F87 — `active-effect-model.md` body text fixed.** "The engine looks up the definition to know how the effect behaves" replaced with "The engine uses it for filtering, stacking policy enforcement, and handler deduplication." "Relationship to BlessingInstance" section updated to describe the function model (`addBlessing()` with handler functions) instead of the composition model (`EffectDefinitionRef`).

---

## R0.A completion status

| Component | Status |
|---|---|
| GameState Interface (10 notes) | Complete — 3 adversarial reviews, all findings resolved |
| Effect Engine (5 notes + 1 new) | Complete — 6 adversarial reviews, all findings resolved |
| Sample Handlers (1 note) | Complete — 45/45 fully expressible, all gaps resolved |
| R0.A exit criterion | **Met** — pending confirmation |

**Summary of all vault changes:**

| Note | Change |
|---|---|
| `effect-trigger-event-bus.md` | Replaced binary interception with three-mode response model; updated dispatch order (step 3 added for modification collection/application); documented recursive trigger interaction |
| `effect-handler-contract.md` | `EffectResult` gains `pendingModifications` field; `TriggerContext.event` type changed to `TriggerEvent` with 5 additional fields; result merging updated |
| `active-effect-model.md` | `ActiveEffect` struct gains `triggers` and `clearedBy` fields; stale composition-model language fixed |
| `field-state-interfaces.md` | `BlessingInstance.activationEffect: EffectDefinitionRef` → `BlessingInstance.blessingType: string` |
| `effect-utility-catalog.md` | `defenderStat` param on `dealDamage`; 4 encounter utilities added; 2 control flow utilities added; 3 modification utilities added; ~8 state query helpers added; utility count corrected |
| `combat-event-log-schema.md` | New section: "CombatEvent vs TriggerEvent" |
| `r0a-sample-effect-handlers.md` | Light Screen handler rewritten; Teamwork description updated; gaps resolved table extended with F67/F81; coverage matrix expanded |
| `before-handler-response-modes.md` | **New note** — atomic note for the three-mode before-handler concept |

Six adversarial reviews completed (findings 1–87). All resolved. All vault notes amended.

~~**Status:** R0.A findings 67–87 fully resolved. All vault notes amended. R0.A exit criterion met — 45/45 handlers fully expressible, all specification gaps closed, all schemas complete, all stale language fixed. Awaiting confirmation to proceed to Ring 1.~~

