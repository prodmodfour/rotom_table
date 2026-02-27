# Code Review 059 — bug-024: Encounter template loading uses wrong HP formula

**Reviewer:** Senior Reviewer
**Date:** 2026-02-19
**Scope:** Commits `98287f5`, `624285c`
**Ticket:** `app/tests/e2e/artifacts/tickets/bug/bug-024.md`
**Files changed:**
- `app/server/api/encounter-templates/[id]/load.post.ts` (187 lines)
- `app/server/api/encounter-templates/from-encounter.post.ts` (113 lines)

---

## Verdict: APPROVED

The fix is correct, minimal, and well-scoped. Both the save-side and load-side changes are sound. Two pre-existing issues were observed in the surrounding code and filed as tickets below.

---

## Fix Analysis

### Load endpoint — HP formula correction

**Before:**
```typescript
const maxHp = 10 + level * 2
```

**After:**
```typescript
const hpStat = tc.entityData?.stats?.hp ?? 0
const maxHp = (level * 2) + (hpStat * 3) + 10
```

**Correct.** The formula now matches the PTU trainer HP formula (`Level * 2 + HP Stat * 3 + 10`), consistent with `useCombat.ts:43` and `characters/index.post.ts:13`.

### Save endpoint — stats persistence

**Added:**
```typescript
stats: c.entity.stats ?? { hp: 0, attack: 0, defense: 5, specialAttack: 0, specialDefense: 5, speed: 5 },
```

**Correct.** Previously, the save endpoint only persisted `name`, `characterType`, `level`, and `trainerClasses` for human combatants. The `stats` object is now persisted, ensuring the HP stat (and other stats used for evasions and initiative) survives the save/load round-trip.

The default fallback `{ hp: 0, attack: 0, defense: 5, specialAttack: 0, specialDefense: 5, speed: 5 }` matches the same defaults used in the load endpoint (`?? 5` for defense/spDef/speed, `?? 0` for hp/attack/spAtk). This is consistent.

### Backward compatibility — templates saved WITHOUT stats

For templates created before this fix, `tc.entityData.stats` will be `undefined`. The load endpoint handles this gracefully:

```typescript
const hpStat = tc.entityData?.stats?.hp ?? 0
```

With `hpStat = 0`, the formula becomes `(level * 2) + (0 * 3) + 10 = level * 2 + 10`. For a level 5 trainer, this yields `20` — the same as the old incorrect formula. This means old templates produce identical results to before; no regression. Trainers loaded from old templates will still have incorrect HP (because the HP stat was never saved), but they will not be *worse* than before.

This is an acceptable degradation. The only way to get correct HP for old templates is to re-save them from an encounter that has the full entity data. No migration is needed.

### Duplicate code path verification

The ticket's resolution log confirms all three trainer HP formula locations now use the correct formula:
- `useCombat.ts:43` — client-side `calculateTrainerMaxHP`
- `characters/index.post.ts:13` — manual character creation
- `encounter-templates/[id]/load.post.ts:86` — template loading (this fix)

Confirmed via grep. No remaining instances of `10 + level * 2` in production code.

---

## File Size Check

| File | Lines |
|------|-------|
| `load.post.ts` | 187 |
| `from-encounter.post.ts` | 113 |

Both well within the 800-line limit.

---

## Pre-existing Issues (Not introduced by this PR)

These were observed during review of the surrounding code. They predate this fix (confirmed via `git show 98287f5^`).

### 1. MEDIUM — `injuries` shape mismatch (load.post.ts:100, 116)

The load endpoint uses `injuries: { count: 0, max: 5 }` on both the entity (line 100) and the combatant wrapper (line 116). The `Combatant` type interface (`types/encounter.ts:43`) defines `injuries: InjuryState` which is `{ count: number; sources: string[] }`. The `max` field does not exist in the type, and `sources` is missing.

Similarly, the entity-level `injuries` at line 100 uses `{ count: 0, max: 5 }` while `HumanCharacter.injuries` (line 186 of `types/character.ts`) is a plain `number`.

This mismatch does not crash at runtime because the JSON is stored as a blob in SQLite and JavaScript does not enforce TypeScript interfaces. But it means any code that reads `combatant.injuries.sources` will get `undefined`, and `entity.injuries` is an object where a number is expected.

**Action:** File as a new bug ticket.

### 2. MEDIUM — `combatStages` vs `stageModifiers` field name (load.post.ts:111)

The load endpoint builds the combatant with `combatStages` (line 111), but `buildCombatantFromEntity` in `combatant.service.ts` does not set this field at all — the `Combatant` type has no `combatStages` field. Stage modifiers live on `entity.stageModifiers`. The template load endpoint is setting an unused field while not setting the correct one on the entity.

**Action:** File as a new bug ticket.

### 3. LOW — `tempHp` vs `temporaryHp` field name (load.post.ts:99)

The entity is built with `tempHp: 0` (line 99), but the `HumanCharacter` interface uses `temporaryHp`. The `...tc.entityData` spread may or may not include a `temporaryHp` field depending on what was saved. Since the template save does not persist `temporaryHp`, the entity will have `tempHp: 0` but not `temporaryHp`, causing any code that reads `entity.temporaryHp` to get `undefined`.

**Action:** Include in the same bug ticket as issue 2 (template load combatant shape mismatches).

---

## Summary

| # | Severity | Issue | Disposition |
|---|----------|-------|-------------|
| 1 | MEDIUM | `injuries` shape mismatch (pre-existing) | New ticket |
| 2 | MEDIUM | `combatStages` vs `stageModifiers` (pre-existing) | New ticket |
| 3 | LOW | `tempHp` vs `temporaryHp` (pre-existing) | Combine with #2 |

**No issues found in the committed fix itself.** The HP formula correction and stats persistence are correct, minimal, and backward-compatible.
