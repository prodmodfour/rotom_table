---
review_id: rules-review-053
ticket: bug-024
commit: 98287f5
reviewed_by: game-logic-reviewer
date: 2026-02-19
verdict: APPROVED
issues_found: 1
tickets_filed: 1
---

# Rules Review 053: bug-024 — Encounter Template Trainer HP Formula

## Scope

Commit `98287f5` fixes the trainer HP formula used when loading inline human combatants from encounter templates, and persists the `stats` object during template save so the HP stat is available at load time.

**Files reviewed:**
- `app/server/api/encounter-templates/[id]/load.post.ts` (load endpoint, HP formula change)
- `app/server/api/encounter-templates/from-encounter.post.ts` (save endpoint, stats persistence)

## PTU Reference

**Trainer Hit Points** — confirmed in two independent locations:

1. `core/02-character-creation.md` line 309:
   > Trainer Hit Points = Trainer's Level x 2 + (HP x 3) +10

2. `core/02-character-creation.md` lines 480-481 (Quick-Start Steps):
   > Trainers have Hit Points equal to (Trainer Level x2) + (HP x3) + 10.

3. `core/07-combat.md` line 623:
   > Trainer Hit Points = Trainer's Level x2 + (HP stat x3) + 10

All three state the same formula: **(Level x 2) + (HP stat x 3) + 10**.

The errata (`errata-2.md`) contains no corrections to the trainer HP formula.

**Starting trainer stats** — `core/02-character-creation.md` line 473:
> Level 1 Trainers begin with 10 HP and 5 in each of their other Stats.

## Findings

### Finding 1: HP Formula — CORRECT

**Old code (line 85):**
```javascript
const maxHp = 10 + level * 2
```
This computed `10 + (Level x 2)`, completely omitting the HP stat factor. For a Level 5 trainer with HP stat 15: old result = 20, correct result = 55.

**New code (lines 85-86):**
```javascript
const hpStat = tc.entityData?.stats?.hp ?? 0
const maxHp = (level * 2) + (hpStat * 3) + 10
```
This matches the PTU formula exactly: `(Level x 2) + (HP stat x 3) + 10`.

**Cross-reference with other codebase HP locations:**
| Location | Formula | Correct? |
|----------|---------|----------|
| `useCombat.ts:43` | `(level * 2) + (hpStat * 3) + 10` | Yes |
| `characters/index.post.ts:13` | `level * 2 + hpStat * 3 + 10` | Yes |
| `encounter-templates/[id]/load.post.ts:86` (this fix) | `(level * 2) + (hpStat * 3) + 10` | Yes |

All three trainer HP computation sites now use the identical correct formula.

### Finding 2: Stats Persistence in Save Endpoint — CORRECT

The save endpoint now persists the full `stats` object for human combatants (line 68):
```javascript
stats: c.entity.stats ?? { hp: 0, attack: 0, defense: 5, specialAttack: 0, specialDefense: 5, speed: 5 }
```

This ensures that the load endpoint has access to the HP stat (and all other stats used for evasion and initiative calculation). Previously, the stats object was not saved, so load had no HP stat to use, forcing the formula to silently fall back.

### Finding 3: Graceful Degradation for Legacy Templates — CORRECT

When loading templates saved before this fix (which lack a `stats` object), the fallback chain works:
- `tc.entityData?.stats?.hp` returns `undefined` (no stats saved)
- Fallback: `?? 0` gives `hpStat = 0`
- Formula: `(level * 2) + (0 * 3) + 10 = level * 2 + 10`

This is mathematically identical to the old broken formula `10 + level * 2`. So legacy templates produce the same (wrong) HP as before — no regression. Users would need to re-save templates to pick up the correct HP values. This is acceptable graceful degradation.

### Finding 4 (Pre-existing): Default HP Stat Should Be 10, Not 0 — MEDIUM

**Location:** Both files.

The fallback default for HP stat is `0` in both places:
- **Save endpoint** (line 68): `hp: 0` in the fallback stats object
- **Load endpoint** (line 85): `tc.entityData?.stats?.hp ?? 0`

Per PTU, starting trainers begin with HP stat = 10 (not 0). The character creation endpoint (`characters/index.post.ts` line 10) correctly defaults to `hp || 10`.

When `hp: 0` is used as the fallback:
- A Level 5 trainer with missing stats gets `maxHp = 10 + 10 = 20` instead of `maxHp = 10 + 30 + 10 = 50`

In practice, this fallback only triggers when saving a human combatant that has no `stats` property at all on its entity object, which would be an unusual data corruption case. For newly saved templates after this fix, the real stats will always be persisted. However, the fallback should match PTU starting values for defensive correctness.

**Ticket filed:** ptu-rule-064

**Recommended fix:**
```javascript
// Save endpoint fallback:
stats: c.entity.stats ?? { hp: 10, attack: 5, defense: 5, specialAttack: 5, specialDefense: 5, speed: 5 }

// Load endpoint fallback:
const hpStat = tc.entityData?.stats?.hp ?? 10
```

## Verdict

**APPROVED**. The fix correctly implements the PTU trainer HP formula `(Level x 2) + (HP stat x 3) + 10`. The formula matches all three canonical rulebook citations and is consistent with the other two trainer HP computation sites in the codebase. Stats persistence in the save endpoint ensures the data flows through correctly for new templates. Graceful degradation for legacy templates is sound (no regression). One pre-existing MEDIUM issue identified with fallback defaults — ticket filed.
