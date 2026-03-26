# 2026-03-26 — Adversarial Review: Function Model Rewrite (Findings 67–87)

The function model is a clear improvement over the composition framework — the trajectory argument is sound, the SE citations are accurate, and the handler-as-strategy / engine-as-mediator architecture is correct. However, the rewrite has significant gaps between the 45 sample handlers and their supporting specifications. The handlers call functions, access fields, and rely on mechanisms that don't exist in the documented design. These are specification completeness problems, not design flaws.

14 findings across four categories.

---

## Category A: Before-handler modification model undefined

**Finding 67 — Light Screen recalculates damage instead of modifying it.**

Handler 17 (Light Screen) calls `dealDamage(triggerCtx, { ...triggerCtx.event.damageParams, resistanceModifier: -1 })`. Three problems:

1. `dealDamage()` runs the full [[nine-step-damage-formula]] from scratch — new stat lookup, new STAB check, new type effectiveness. Light Screen should modify an existing damage result, not recalculate one.
2. If the handler doesn't call `intercept()`, the target takes both the original damage and the recalculated damage. If it does `intercept()`, the recalculated damage uses stale resolution context (the original dice rolls may not carry over).
3. `triggerCtx.event.damageParams` doesn't exist on the documented `CombatEvent` schema — see finding 71.

**Finding 81 — Binary interception doesn't support partial modification.**

The [[effect-trigger-event-bus]] defines interception as binary: `intercept()` skips the original event's deltas entirely, or nothing happens. But Light Screen needs to **reduce** damage (not block it), and Teamwork needs to **boost** accuracy (not skip the check). The design needs a third mode between "let it through" and "block it entirely" — something like `modifyPendingResult()` that adjusts the in-flight event without discarding it.

**Severity: architectural gap.** Two of the 45 handlers depend on a mechanism that doesn't exist. This is the most significant finding.

---

## Category B: TriggerContext.event and ActiveEffect schemas underspecified

**Finding 71 — TriggerContext.event fields far exceed the CombatEvent schema.**

The `CombatEvent` struct in [[combat-event-log-schema]] has: `round`, `type`, `sourceId`, `targetId`, `moveId`, `isDamagingMove`, `amount`.

Handlers access at least 6 fields that don't exist on this type:

| Field accessed | Used by | Exists in CombatEvent? |
|---|---|---|
| `ctx.event.moveType` | Flash Fire, Volt Absorb, Water Absorb | No |
| `ctx.event.isContact` | Rough Skin | No |
| `ctx.event.damageClass` | Light Screen | No |
| `ctx.event.damageParams` | Light Screen | No |
| `ctx.event.moveRange` | Teamwork, Pack Hunt | No |
| `ctx.event.sourceEntityId` | Rough Skin | No (`sourceId` exists) |

Either CombatEvent needs significant expansion, or `TriggerContext.event` is a richer type than CombatEvent. The distinction is undocumented.

**Finding 80 — ActiveEffect struct has no trigger registration mechanism.**

The [[effect-trigger-event-bus]] says active effects are a trigger source: "dynamic handlers from ActiveEffect instances. Registered when the ActiveEffect is added; unregistered when it expires or is removed." But the `ActiveEffect` struct in [[active-effect-model]] has only: `effectId`, `sourceEntityId`, `state`, `expiresAt`. No `triggers` field.

Wide Guard, Protect, and Heal Block create ActiveEffects and have separate `TriggerRegistration` objects, but there's no documented link between them. How does the engine know that the `wide-guard` ActiveEffect should register the `wideGuardTrigger`?

**Finding 83 — `clearedBy` field not in ActiveEffect struct.**

Handler 25 (Heal Block) creates an ActiveEffect with `clearedBy: ['switch-out', 'take-a-breather']`. This field doesn't exist on the documented `ActiveEffect` struct.

**Finding 82 — `defenderStat` param missing from `dealDamage` signature.**

Handler 24 (Psyshock) passes `defenderStat: 'def'` to `dealDamage()`. The [[effect-utility-catalog]] signature for `dealDamage` doesn't include this param.

---

## Category C: Handlers call undocumented utilities and helpers

The 45 handlers call at least 12 functions not present in the [[effect-utility-catalog]]:

| Missing function | Used by | Category |
|---|---|---|
| `getEntitiesInRange(ctx, { scope, aoe })` | Earthquake, Struggle Bug, Roar | Spatial query |
| `embedAction(result, actionType)` | Whirlpool, Pack Hunt | Action economy |
| `modifyResolution(ctx, { accuracyBonus })` | Teamwork | Before-trigger modification |
| `requestReroll(ctx)` | Mettle | Engine signal |
| `consumeBlessing(ctx, blessingId)` | Safeguard, Light Screen | Field state |
| `removeHazard(ctx, hazardType)` | Toxic Spikes | Field state |
| `getHazardLayers(ctx, hazardType)` | Toxic Spikes | State query |
| `isAlly(ctx, entityId)` | Teamwork, Pack Hunt | State query |
| `itemSlotEmpty(lens)` | Thief | State query |
| `getResource(lens, resourceType)` | Mettle | State query |
| `getScalingParam(ctx, paramName)` | Opportunist | State query |
| `targetHasActedThisRound(ctx)` | After You | State query |

The catalog documents 8 state query helpers but handlers need at least 15. The stated utility count of "20 utilities total" undercounts the documented utilities (~24) and ignores the undocumented ones.

**Finding 85 — `addHazard` and `addCoat` signatures missing.**

`addBlessing` has a full signature showing trigger handler params. `addHazard` and `addCoat` are used with their own trigger handler params (`onSwitchIn`, `onTurnStart`) but have no documented signatures despite being called in handlers 14, 15, and 18.

---

## Category D: Surviving notes contain stale composition-model language

**Finding 86 — `field-state-interfaces.md` references `EffectDefinitionRef`.**

`BlessingInstance` has `activationEffect: EffectDefinitionRef`. Under the function model, blessing activation effects are handler functions passed to `addBlessing()`. `EffectDefinitionRef` is a composition-model concept. This note was listed as "survives unchanged" but needs updating.

**Finding 87 — `active-effect-model.md` body text uses composition-model language.**

The body says "effectId references the effect definition (a TypeScript constant) that created this instance. The engine looks up the definition to know how the effect behaves." Under the function model, the engine calls handler functions — it doesn't "look up definitions." The "Relationship to BlessingInstance" section still says `activationEffect: EffectDefinitionRef`. The See also links were updated but the body text was not.

---

## What's not a problem

- SE principle citations across all 5 new notes are accurate. One minor stretch ([[chain-of-responsibility-pattern]] for `dealDamage`'s internal pipeline) is defensible.
- All wikilinks between new notes are consistent. No references to deleted notes.
- The 10 surviving GameState notes are internally consistent (except F86/F87 stale language).
- The coverage matrix accurately reflects which utilities are exercised.
- The findings 55–66 disposition is correct — all dissolve under the function model.
- The `merge()` semantics are well-defined.
- The handler-as-strategy / engine-as-mediator architecture is sound.

---

## Severity ranking

| Priority | Findings | Impact |
|---|---|---|
| 1 | F67, F81 | Architectural gap — before-handler modification model blocks Light Screen and Teamwork |
| 2 | F71 | Schema gap — TriggerContext.event blocks 8+ trigger handlers |
| 3 | F80 | Structural gap — ActiveEffect trigger registration blocks Protect, Wide Guard, Heal Block |
| 4 | Category C (12 functions) | Completeness gap — "45/45 fully expressible" claim unverified while handlers call undocumented functions |
| 5 | F86, F87 | Consistency gap — stale language in "unchanged" notes causes confusion |
| 6 | F82, F83 | Minor schema gaps — missing fields on documented types |

---

## Recommendation

The function model design is correct in its fundamentals. These findings are fixable without architectural rethinking — they are specification gaps, not design flaws. Three actions needed:

1. **Define the before-handler modification mechanism** (F67/F81) — either a `modifyPendingResult` utility or a richer return type from before-handlers that can carry modification instructions alongside or instead of interception.
2. **Expand the schemas** (F71, F80, F82, F83) — CombatEvent fields for trigger context, ActiveEffect triggers field, `defenderStat` on `dealDamage`, `clearedBy` on ActiveEffect.
3. **Complete the utility catalog** (Category C, F85) — document all functions the handlers actually call, add `addHazard`/`addCoat` signatures, update state query helper count.

After these three are addressed, update F86/F87 stale language in the two surviving notes.

**Status:** Review complete. ~~Awaiting decision on resolution approach.~~ All findings resolved — see below.

