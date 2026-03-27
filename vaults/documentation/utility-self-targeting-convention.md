# Utility Self-Targeting Convention

[[effect-utility-catalog|Utility functions]] that accept a `target` parameter typed as `'self' | EntityId | undefined` have two distinct default behaviors depending on whether the utility is a self-benefit or opponent-targeting operation.

## Two default categories

**Self-benefit utilities** — `undefined` defaults to `ctx.user` (the effect's user):

| Utility | Default target | Rationale |
|---|---|---|
| `healHP` | `ctx.user` | Healing yourself is the common case |

In these utilities, `'self'` and `undefined` are semantically equivalent — both resolve to `ctx.user`.

**Opponent-targeting utilities** — `undefined` defaults to `ctx.target` (the opponent):

| Utility | Default target | Rationale |
|---|---|---|
| `modifyCombatStages` | `ctx.target` | Debuffs target the opponent |
| `manageResource` | `ctx.target` | Resource drain targets the opponent |
| `displaceEntity` | `ctx.target` | Push/pull targets the opponent |
| `modifyInitiative` | `ctx.target` | Quash targets the opponent |
| `modifyActionEconomy` | `ctx.target` | Action denial targets the opponent |
| `applyActiveEffect` | `ctx.target` | Debuff effects target the opponent |
| `modifyMoveLegality` | `ctx.target` | Move restriction targets the opponent |

In these utilities, `'self'` explicitly overrides the default to target the user. `undefined` means "use the standard target" — the opponent.

## The critical invariant

For self-benefit utilities where `undefined ≡ 'self'`: **both ID resolution and lens resolution must agree.** When computing the target ID for delta keying, `undefined` resolves to `ctx.user.id`. The lens used for derived calculations (tick value, max HP, stat lookups) must also be `ctx.user` — not `ctx.target`, which is the opponent.

## The bug pattern

Finding 138 (the third recurrence of entity confusion: 120, 135, 138) showed what happens when only the ID path handles `undefined` but the lens path does not:

```
// Bug — ID and lens disagree when target is undefined
const targetId = params.target === 'self' ? ctx.user.id : (params.target ?? ctx.user.id)
// targetId correctly resolves to ctx.user.id ✓
const targetLens = params.target === 'self'
  ? ctx.user
  : resolveTargetLens(ctx, targetId, params.target)
// targetLens calls resolveTargetLens(ctx, userId, undefined)
// resolveTargetLens returns ctx.target when !target — the OPPONENT's lens ✗
```

The delta is keyed to the user's ID (correct) but tick computation uses the opponent's HP stats (wrong). The user receives the wrong heal amount.

## The fix pattern

Extract a single boolean that covers both self-targeting paths:

```
const targetId = params.target === 'self' ? ctx.user.id : (params.target ?? ctx.user.id)
const isSelfTarget = params.target === 'self' || params.target === undefined
const targetLens = isSelfTarget
  ? ctx.user
  : resolveTargetLens(ctx, targetId, params.target)
```

This pattern ensures ID and lens always agree. Apply it to every self-benefit utility where `undefined` should mean "the user."

## Scope note

The overloaded `'self' | EntityId | undefined` type is itself a [[primitive-obsession-smell]] — three semantic paths encoded as one parameter. A future refactoring could make `target` required or use a discriminated union. This convention documents the invariant within the current type shape; it does not block that future cleanup.

## See also

- [[effect-utility-catalog]] — the 30 shared utilities; `healHP` is the self-benefit utility where this invariant is critical
- [[primitive-obsession-smell]] — the overloaded type that creates this three-path hazard
- [[combat-lens-sub-interfaces]] — the lens that tick/stat calculations must read from the correct source
