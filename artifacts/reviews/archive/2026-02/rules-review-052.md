---
review_id: rules-review-052
type: rules-review
scope: bug-013, bug-025
commits:
  - b2f6c80
  - aa4861c
tickets:
  - bug-013
  - bug-025
reviewed_by: game-logic-reviewer
date: 2026-02-19
verdict: APPROVED
---

# Rules Review 052 — bug-013 (Trapped capture bonus) & bug-025 (players.get maxHp)

## Fix 1: bug-013 — Remove Trapped from capture rate +10 bonus

### PTU Reference

PTU 1.05 Chapter 5, page ~1733 (05-pokemon.md line 1732-1733):

> And last, consider any Status Afflictions and Injuries. Persistent Conditions add +10 to the Pokemon's Capture Rate; Injuries and Volatile Conditions add +5. Additionally, **Stuck adds +10 to Capture Rate, and Slow adds +5.**

The capture modifier table lists exactly two special condition bonuses:
- **Stuck** +10
- **Slow** +5

**Trapped is not mentioned anywhere in the capture rate section.** The word "Trapped" does not appear at all in Chapter 5 (05-pokemon.md). The errata (errata-2.md) also contains no mention of Trapped in any capture-related context.

### Trapped vs Stuck — Distinct PTU Conditions

PTU 07-combat.md lines 1724-1730 defines them as separate conditions with different effects:
- **Stuck** (line 1724-1727): Cannot use any Move with a Range measured in meters. Can be freed by taking a Standard Action to make a Combat check, switching, or at end of Scene.
- **Trapped** (line 1728-1730): Cannot be recalled. Ghost Types are immune.

They are often inflicted together (e.g., Spider Web, Bind, Glue Cannon crit) but are mechanically distinct. Stuck restricts movement/ranged attacks; Trapped restricts recall. Only Stuck has a capture rate bonus.

### Code Verification

**captureRate.ts** (server-side path):
- Before: `const STUCK_CONDITIONS: StatusCondition[] = ['Stuck', 'Trapped']`
- After: `const STUCK_CONDITIONS: StatusCondition[] = ['Stuck']`
- The STUCK_CONDITIONS array feeds into `stuckModifier += 10` per condition match. Removing Trapped means only Stuck triggers the +10 bonus. CORRECT.

**useCapture.ts** (client-side path, line 160):
- Before: `if (condition === 'Stuck' || condition === 'Trapped')`
- After: `if (condition === 'Stuck')`
- Same fix applied to the inline calculation in the composable. CORRECT.

**Condition taxonomy** (`statusConditions.ts` line 16-17):
- Stuck, Trapped, and Slowed are all in `OTHER_CONDITIONS`, not in `PERSISTENT_CONDITIONS` or `VOLATILE_CONDITIONS`. This means they do NOT receive the persistent +10 or volatile +5 capture bonuses. The Stuck +10 is applied solely via the separate `stuckModifier` check. CORRECT.

### Verdict: CORRECT

The fix accurately implements PTU 1.05. Trapped has no capture rate interaction per the rulebook. Only Stuck grants +10.

---

## Fix 2: bug-025 — Return computed maxHp instead of raw HP stat in players endpoint

### PTU Reference

PTU 1.05 Chapter 2 (02-character-creation.md line 309):

> Trainer Hit Points = Trainer's Level x 2 + (HP x 3) + 10

Reiterated at line 480-481:

> Trainers have Hit Points equal to (Trainer Level x2) + (HP x3) + 10.

The formula is: `maxHp = (level * 2) + (hpStat * 3) + 10`

### Code Verification

**Prisma schema** (`schema.prisma` line 32):
```
maxHp Int @default(10) // Derived max HP (different from hp stat)
```
The `maxHp` column explicitly stores the derived/computed max HP value, separate from the `hp` column (which stores the raw HP stat).

**Character creation endpoint** (`characters/index.post.ts` line 13):
```typescript
const computedMaxHp = level * 2 + hpStat * 3 + 10
```
This confirms that `maxHp` is computed from the formula at creation time and stored in the DB.

**Trainer HP calculations** (`useCombat.ts` lines 42-44):
```typescript
const calculateTrainerMaxHP = (level: number, hpStat: number): number => {
    return (level * 2) + (hpStat * 3) + 10
}
```
Formula is consistent everywhere.

**The fix** (`players.get.ts` line 36):
- Before: `maxHp: char.hp,` (raw HP stat, e.g., 10 for a starting trainer)
- After: `maxHp: char.maxHp,` (computed max HP, e.g., 42 for a level 1 trainer with 10 HP stat)

The misleading comment `// Use hp stat as max HP (PTU convention)` was also removed.

### Duplicate Code Path Check

The ticket's resolution log notes that shared serializers (`serializeCharacter`, `serializeCharacterSummary` in `server/utils/serializers.ts`) already correctly use `character.maxHp`. The `players.get.ts` endpoint was the only code path with this bug because it uses inline serialization rather than the shared serializer. No additional instances found.

### Verdict: CORRECT

The fix correctly returns the computed Trainer HP formula result (`char.maxHp`) instead of the raw HP base stat (`char.hp`). The formula `(Level x 2) + (HP x 3) + 10` is correctly implemented throughout the codebase.

---

## Summary

| Fix | Ticket | Commit | Verdict | Notes |
|-----|--------|--------|---------|-------|
| Trapped capture bonus removed | bug-013 | b2f6c80 | CORRECT | Trapped has no capture interaction per PTU 1.05 Ch.5 |
| players.get maxHp | bug-025 | aa4861c | CORRECT | Returns computed formula result, not raw stat |

**Overall verdict: APPROVED** — Both fixes correctly align the implementation with PTU 1.05 rules.

## Pre-Existing Issues

None identified. The touched code paths are now PTU-correct.
