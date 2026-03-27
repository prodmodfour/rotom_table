# 2026-03-26 — Adversarial Review: R0.C Engine Scaffold (Findings 98–108)

Reviewed the R0.C scaffold (post 35) against the documentation vault, consolidated ring plan, and R0 exit criteria. Found 11 issues — 1 correctness bug, 3 vault-code divergences violating principle 7, 2 type-safety gaps, 2 test coverage gaps, 2 design debt items, and 1 vault documentation error.

## Verification summary

Archive branch `archive/ptu-app` exists. Old `app/`, `scripts/`, `docs/`, `archive/` directories confirmed deleted from master. Package structure, tsconfig, vitest config all sound. 36 tests pass. TypeScript compiles clean (`tsc --noEmit` zero errors). The scaffold is real and functional.

## Findings

| # | Finding | Severity | Category |
|---|---|---|---|
| 98 | `maxHp()` uses unsafe type assertion to access `level` — Pokemon HP always computes as level 1 | **Correctness** | Bug |
| 99 | `TraitTriggerHandlerFn` typed as `(ctx: any) => any` — circular-import workaround defeats type safety | Type safety | Design debt |
| 100 | `PassiveEffectSpec` adds 5 undocumented fields and changes 2 — vault not updated | **Principle 7** | Vault divergence |
| 101 | `EffectResult` adds `entityWriteDeltas` and `intercepted` fields not in vault spec | **Principle 7** | Vault divergence |
| 102 | `HasMovement.movementTypes` is `MovementProfile[]` in code, `MovementType[]` in vault | **Principle 7** | Vault divergence |
| 103 | HP formula in `combat-lens-sub-interfaces.md` is wrong — says `HP + (Level x 3) + 10`, should be `(Level x 5) + (HP x 3) + 10` | Documentation | Vault error |
| 104 | Zero tests for `stat.ts` utilities (effectiveStat, maxHp, currentHp, maxEnergy, tickValue) | Test gap | Coverage |
| 105 | Zero tests for type file compilation — no structural assertions on lens/delta/field-state types | Test gap | Coverage |
| 106 | `BlessingMutation.consume` uses `blessingType` in code, `blessingId` in vault | Consistency | Vault divergence |
| 107 | Empty `src/definitions/` and `src/handlers/` directories — scaffold structure implies content that doesn't exist | Clarity | Scaffold |
| 108 | `CombatantLens` composite type has inline trailing member with `entityId`, `entityType`, `types?` — not a named sub-interface | Design | ISP consistency |

## Detail

### Finding 98 — `maxHp()` broken for Pokemon (Correctness)

`stat.ts:27`:
```typescript
const level = (lens as CombatantLens & { level?: number }).level ?? 1
```

`CombatantLens` has no `level` field. The code casts to `CombatantLens & { level?: number }` and defaults to 1. This means every Pokemon's max HP is computed as `(1 * 5) + (hpStat * 3) + 10 = hpStat * 3 + 15` — identical to a trainer plus 5. A level 20 Pokemon with 50 HP stat should have 260 HP; this returns 165.

This isn't a "for now" acceptable shortcut — it's a correctness bug that poisons `currentHp()`, `tickValue()`, and every downstream damage/healing computation. The vault explicitly says level comes from the entity, not the lens (`combat-lens-sub-interfaces.md`: "Max HP is derived from entity stats"). The lens intentionally excludes entity fields — the design is correct; the implementation bypassed it with an unsafe cast.

**Fix options:** (a) Add `level` to the lens as entity-passthrough (simplest, but expands the lens beyond combat-transient state), (b) Accept `level` as a parameter to `maxHp()` so the caller provides it, (c) Add an entity-sourced `HasLevel` sub-interface for Pokemon-only state.

### Finding 99 — `any => any` handler type (Type Safety)

`lens.ts:174`:
```typescript
type TraitTriggerHandlerFn = (ctx: any) => any
```

This exists to break a circular dependency between `lens.ts` (defines `TriggerRegistration`) and `effect-contract.ts` (defines `TriggerContext` and `EffectResult`). The result: `TriggerRegistration.handler` is completely untyped. A handler could return a string, throw synchronously, or accept zero arguments — the compiler won't catch it.

The old app had "144 unsafe type casts" (header, line 19). A `any => any` in a foundational type that every trait definition flows through is the same category of problem.

**Fix:** Move `TriggerRegistration` to `effect-contract.ts` (which already imports from `lens.ts`). Or extract a shared `trigger-registration.ts` that imports from both. The circular dependency is structural, not fundamental.

### Finding 100 — `PassiveEffectSpec` diverges from vault (Principle 7)

Code adds fields not in `effect-handler-format.md`:
- `movementTypeGrant?: string` — not documented
- `critBonusDamage?: number` — not documented
- `dbBoostThreshold?: number` — not documented
- `dbBoostAmount?: number` — not documented
- `dbBoostKeywords?: string[]` — not documented

Code changes documented fields:
- Vault: `weatherImmunity?: boolean` → Code: `weatherDamageImmunity?: string` (different name AND type)
- Vault: `statMultiplier.stat: StatKey` → Code: `statMultiplier.stat: string` (loosened from union to string)

Per principle 7: "Designs live in the documentation vault. If it's not in the vault, it's not decided." These 5 fields were not designed — they appeared during implementation without a vault update.

### Finding 101 — `EffectResult` has undocumented fields (Principle 7)

The vault spec in `effect-handler-contract.md` shows:
```
EffectResult {
  combatantDeltas, encounterDelta, events, triggers, success, embeddedActions, pendingModifications?
}
```

The code adds:
- `entityWriteDeltas: Map<EntityId, EntityWriteDelta>` — implied by `state-delta-model.md` entity-write exceptions but not in the EffectResult spec
- `intercepted: boolean` — used by `intercept()` utility but not a named field in the vault spec

Both additions are reasonable. The vault should document them.

### Finding 102 — `HasMovement` type mismatch (Principle 7)

Vault `combat-lens-sub-interfaces.md`:
```
movementTypes: MovementType[]
```

Code `lens.ts`:
```typescript
movementTypes: MovementProfile[]  // { type: MovementType, speed: number }
```

The code is richer (includes per-movement-type speed), which is needed for movement calculations. But the vault hasn't been updated. Either the vault spec was intentionally simple and the code over-specified, or the vault is stale.

### Finding 103 — HP formula error in vault (Documentation)

`combat-lens-sub-interfaces.md` line 95:
> different formula for Pokemon (`HP + (Level x 3) + 10`)

The PTR vault source (`pokemon-hp-formula.md`) says: `(Level x 5) + (HP stat x 3) + 10`. The code correctly implements the PTR vault formula. The documentation vault note has the coefficients swapped — `Level x 3` should be `Level x 5`.

### Finding 104 — No stat utility tests (Test Gap)

`stat.ts` exports 5 functions used by every handler: `effectiveStat`, `maxHp`, `currentHp`, `maxEnergy`, `tickValue`. Zero tests exist for any of them. Finding 98's `maxHp()` bug would have been caught by a test asserting `maxHp(level20Pokemon) === 260`.

### Finding 105 — No type structure tests (Test Gap)

The type files are the vault-to-code bridge — if they drift from the vault, handlers built on them will be wrong. No tests assert structural properties (e.g., "CombatantLens satisfies all 15 sub-interfaces," "StateDelta has exactly the documented fields"). TypeScript compilation catches missing fields but not extra fields or type widening (finding 100's `string` instead of `StatKey`).

### Finding 106 — BlessingMutation key name (Consistency)

Vault `encounter-delta-model.md`: `{ op: 'consume', blessingId: string }`
Code `delta.ts`: `{ op: 'consume', blessingType: string }`

The code is internally consistent (`BlessingInstance.blessingType` matches). The vault doc should say `blessingType`.

### Finding 107 — Empty scaffold directories (Clarity)

`src/definitions/` and `src/handlers/` are empty directories. Post 35 lists them in the structure diagram without noting they're empty. The remaining work (items 3–5 in post 35's "What's next") is the majority of R0.C's functional content: ~25 effect utilities, 45 sample handlers, and their tests. The scaffold is structurally ready but functionally ~15% complete (8 utilities implemented out of ~46 total, 0 of 45 handlers).

### Finding 108 — Inline trailing member on CombatantLens (ISP Consistency)

`lens.ts:169`:
```typescript
export type CombatantLens =
  & HasIdentity & HasStats & HasMoves & HasTraits & HasInventory & HasMovement
  & HasCombatStages & HasHealth & HasEnergy & HasStatus & HasPosition
  & HasInitiative & HasActions & HasActiveEffects & HasPersistentResources
  & { entityId: EntityId; entityType: 'pokemon' | 'trainer'; types?: PokemonType[] }
```

The trailing `{ entityId, entityType, types? }` member is not a named sub-interface. `entityId` and `entityType` are entity-classification fields that the vault assigns to `HasIdentity` (for `entityType`) or treats as entity-sourced passthroughs. `types?` is `HasTypes` made optional. This inline member breaks the "every field lives in a named sub-interface" pattern that the rest of the lens follows, and it's where `HasTypes` optionality is handled — but without the name.

## Summary

| Severity | Count | Findings |
|---|---|---|
| Correctness bug | 1 | 98 |
| Principle 7 violation (vault divergence) | 4 | 100, 101, 102, 106 |
| Type safety | 1 | 99 |
| Test gap | 2 | 104, 105 |
| Vault documentation error | 1 | 103 |
| Design/clarity | 2 | 107, 108 |

**Finding 98 is the only blocker.** It causes incorrect HP for every Pokemon. Findings 100–102 and 106 require vault updates to restore alignment (principle 7). Finding 99 should be fixed before handlers are built on top of it. Finding 104 should be fixed before implementing the remaining utilities. The rest are low-severity.

**Status:** Eighth adversarial review complete (findings 98–108). The scaffold structure is sound, tests pass, types compile. Core issues: one correctness bug (maxHp), one type-safety hole (any => any handler), and four vault-code divergences needing reconciliation before the remaining ~25 utilities and 45 handlers are built on this foundation.
