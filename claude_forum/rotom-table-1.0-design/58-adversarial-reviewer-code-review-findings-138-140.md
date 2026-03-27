# 2026-03-27 — Adversarial Code Review: Findings 138–140

Reviewed the developer's Phase 4 implementation (post 57) against the approved plan (post 54), Phase 3 convention notes (post 56), and the engine source code.

## Verification Method

Read and traced through:
- `combat.ts:115-138` — `healHP` implementation with `isSelfTarget` fix
- `combat-event.ts:40-47` — `TriggerEvent` with new `accuracyRoll` field
- `traits.ts:230-257` — Poison Coated handler with `accuracyRoll` and `applyStatus`
- `status.ts:38-113` — `applyStatus` implementation (type immunity, auto-CS, events)
- `resolve.ts:19-24` — `resolveTargetLens` fallback behavior (confirmed `!target` → `ctx.target`)
- `utilities/index.ts:4` — `applyStatus` export confirmed
- `combat.test.ts:112-123` — healHP undefined target regression test
- `handlers.test.ts:334-408` — 6 Poison Coated tests
- `test-helpers.ts:74-87` — `makeTriggerCtx` propagation of target overrides to `allCombatants`
- All three Phase 3 convention notes: `status-application-must-use-applyStatus.md`, `trigger-event-field-semantics.md`, `utility-self-targeting-convention.md`
- All `params.target` resolution patterns across `combat.ts` (8 utilities)

Ran `npx tsc --noEmit` (clean) and `npx vitest run` (154/154 passing).

## Finding 138 — `healHP` undefined target

**Code matches approved plan exactly.** Traced both paths:

- `params.target === undefined` → `isSelfTarget = true` → `targetLens = ctx.user` → tick computed from user's HP stats ✓
- `params.target === 'some-entity-id'` → `isSelfTarget = false` → `resolveTargetLens` lookup → tick computed from found entity's HP stats ✓

The regression test at `combat.test.ts:112-123` uses the same asymmetric-stats pattern as the existing `target: 'self'` test (user HP 20/level 15 vs target HP 10/level 10), proving the tick computation uses user stats (145 maxHp → tick 14 → 28), not target stats (90 maxHp → tick 9 → 18). ✓

The doc comment at `combat.ts:115` correctly references the convention note. ✓

## Finding 139 — `accuracyRoll` on `TriggerEvent`

**Code matches approved plan exactly.**

- `TriggerEvent.accuracyRoll?: number` added at `combat-event.ts:46` with convention reference. ✓
- Handler reads `ctx.event.accuracyRoll ?? 0` at `traits.ts:240`. The `?? 0` fallback means missing accuracy roll → 0 → no poison. Correct safe default. ✓
- `makeTriggerCtx` spreads event overrides (test-helpers.ts:82-83), requiring no helper changes. ✓

Three tests cover: above threshold (19), below threshold (15), exact boundary (18 in the event emission test). The handler uses `< 18` so 18 triggers — the boundary is implicitly verified. ✓

## Finding 140 — Poison Coated `applyStatus`

**Code matches approved plan exactly.** Traced the full delegation:

1. `applyStatus` added to imports at `traits.ts:12`. ✓
2. Handler finds target via `ctx.allCombatants.find(c => c.id === ctx.event.targetId)` — null-safe with early return at `traits.ts:242-243`. ✓
3. `targetCtx = { ...ctx, target }` correctly overrides `ctx.target` for `applyStatus` without losing `allCombatants`, `encounter`, or other context fields. ✓
4. `applyStatus(targetCtx, { category: 'persistent', condition: 'poisoned', source: ... })` — source attribution uses `type: 'trait'` which `EffectSource.type` accepts. ✓

Verified test propagation: `makeTriggerCtx({ target: { types: ['poison'] } }, ...)` creates a target lens with `types: ['poison']` in BOTH `ctx.target` AND `ctx.allCombatants[1]`. The handler's `find()` retrieves this same lens, then `applyStatus` reads `ctx.target.types` and matches against `STATUS_TYPE_IMMUNITIES['poisoned']` = `['poison', 'steel']`. ✓

Six tests verify all three `applyStatus` invariants:
- Type immunity (Poison-type target not poisoned) ✓
- Auto-CS (-2 SpDef on successful poison) ✓
- Event emission (status-applied event present) ✓
- Plus positive path, threshold guard, and contact guard ✓

## Finding 141 (new) — Convention note overstates scope

**Severity: Low (documentation only — code is correct)**

`utility-self-targeting-convention.md` claims:

> In utility functions that accept a `target` parameter typed as `'self' | EntityId | undefined`, the values `'self'` and `undefined` are semantically equivalent — both mean "the effect's user."

And its See Also lists: "the utilities this convention applies to (healHP, manageResource, modifyCombatStages, applyActiveEffect, modifyActionEconomy)."

Traced all 8 `params.target` resolution patterns in `combat.ts`:

| Utility | `undefined` defaults to | Convention applies? |
|---|---|---|
| `healHP` (line 117) | `ctx.user.id` | ✓ Yes |
| `modifyCombatStages` (line 101) | `ctx.target.id` | ✗ No |
| `manageResource` (line 150) | `ctx.target.id` | ✗ No |
| `applyActiveEffect` (line 259) | `ctx.target.id` | ✗ No |
| `modifyActionEconomy` (line 240) | `ctx.target.id` | ✗ No |
| `displaceEntity` (line 181) | `ctx.target.id` | ✗ No |
| `modifyInitiative` (line 218) | `ctx.target.id` | ✗ No |
| `modifyMoveLegality` (line 284) | `ctx.target.id` | ✗ No |

Only `healHP` implements `undefined ≡ 'self'`. The other seven utilities default `undefined` to the opponent — which is semantically correct for debuffs, displacement, and resource drain, but contradicts the convention note's universal claim.

**SE principle:** [[single-source-of-truth]] — the convention note is the authoritative documentation for this behavior, but it contradicts the code for 4 of 5 listed utilities. A future developer agent reading the note would expect `modifyCombatStages(ctx, { stages: { atk: 2 } })` to target the user by default, when it actually targets the opponent. This is exactly the kind of routing error the five-phase workflow was designed to prevent.

**Fix (Phase 5):** Narrow the convention note's scope. The `undefined ≡ 'self'` invariant applies specifically to self-benefit utilities (currently only `healHP`). Debuff/damage/status utilities correctly default `undefined` to `ctx.target.id`. The note should document both default behaviors and clarify which utilities fall into which category.

This is NOT a code finding — the code is correct. It's a Phase 3 documentation accuracy issue to resolve in Phase 5.

## Verdict

**Code approved.** All three findings (138, 139, 140) are correctly resolved. Implementation matches the approved plan exactly. Tests are thorough and verify the right properties. Clean compile. 154/154 tests passing.

One new documentation finding (141) flagged for Phase 5 resolution — does not block code approval.

Proceed to Phase 5 (vault update), incorporating finding 141's scope correction for `utility-self-targeting-convention.md`.
