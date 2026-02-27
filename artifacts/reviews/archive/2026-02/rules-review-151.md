---
review_id: rules-review-151
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: ptu-rule-082, ptu-rule-083
domain: pokemon-lifecycle, vtt-grid
commits_reviewed:
  - eb4d6b2
  - 1151a18
files_reviewed:
  - app/server/api/encounters/[id]/xp-distribute.post.ts
  - app/server/api/pokemon/[id]/add-experience.post.ts
  - app/stores/measurement.ts
  - app/components/player/PlayerGridView.vue
  - app/components/vtt/VTTContainer.vue
  - app/composables/useGridMovement.ts
  - app/composables/usePathfinding.ts
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
rulings: 0
reviewed_at: 2026-02-25T18:30:00Z
follows_up: rules-review-144, rules-review-118
---

## Review Scope

PTU rules correctness verification for two fixes:

1. **ptu-rule-082**: Pokemon HP formula application on level-up
2. **ptu-rule-083**: Distance measurement formula for diagonal movement

## Rule Verification: ptu-rule-082 (Pokemon HP on Level-Up)

### Rule Reference

PTU Core p.198 (Chapter 7 - Combat, Derived Stats):

> "Pokemon Hit Points = Pokemon's Level + (HP stat x3) + 10"

PTU Core p.202 (Chapter 5 - Pokemon, Leveling Up):

> "Whenever your Pokemon Levels up, follow this list:
> First, it gains +1 Stat Point. As always, added Stat points must adhere to the Base Relations Rule."

### Analysis

The HP formula has three components:
1. **Level component**: `Level` (increases by 1 per level gained)
2. **HP stat component**: `HP_stat x 3` (changes only when stat points are allocated)
3. **Constant**: `+10` (never changes)

When a Pokemon gains N levels:
- The Level component increases by exactly N
- The HP stat component does NOT automatically change (stat point allocation is manual per PTU p.202)
- Therefore, `maxHp` should increase by exactly N

### Verification

**Code (`xp-distribute.post.ts` line 191):**
```typescript
const maxHpIncrease = levelResult.levelsGained
```

**Code (`add-experience.post.ts` line 102):**
```typescript
const maxHpIncrease = levelResult.levelsGained
```

Both correctly increment `maxHp` by `levelsGained` (the Level component only). The `levelsGained` value is computed as `newLevel - currentLevel` in `experienceCalculation.ts:325`, which is correct.

The fix intentionally does NOT auto-allocate stat points or recalculate the HP stat component. This matches PTU rules: stat allocation is a player/GM decision that requires following the Base Relations Rule (p.202). The system correctly defers this to the manual Pokemon sheet editing flow.

### Cross-check: HP formula consistency

Verified the HP formula is consistently applied across the codebase:
- `pokemon-generator.service.ts:150`: `level + (calculatedStats.hp * 3) + 10` -- correct Pokemon formula
- `pages/gm/create.vue:493`: `level + (baseHp * 3) + 10` -- correct Pokemon formula
- `QuickCreateForm.vue:152`: `level * 2 + hpStat * 3 + 10` -- correct **Trainer** formula (note: `level * 2` for trainers, `level` for Pokemon)
- `server/api/pokemon/index.post.ts:15`: `level + (baseHp * 3) + 10` -- correct Pokemon formula

All consistent. The Trainer formula (`Level x2`) in QuickCreateForm is correctly different from the Pokemon formula (`Level x1`).

### Verdict for ptu-rule-082

**CORRECT.** The fix accurately implements the level component of the PTU Pokemon HP formula. The incremental approach (`maxHp += levelsGained`) is mathematically equivalent to recalculating the full formula when only the level changes.

## Rule Verification: ptu-rule-083 (Diagonal Movement Distance)

### Rule Reference

PTU Core p.425-428 (Chapter 7 - Combat, Movement):

> "Diagonal movement is simple. The first square you move diagonally in a turn counts as 1 meter. The second counts as 2 meters. The third counts as 1 meter again. And so on and so forth."

### Analysis

The alternating diagonal rule means:
- 1 diagonal = 1m (total: 1m)
- 2 diagonals = 1m + 2m (total: 3m)
- 3 diagonals = 1m + 2m + 1m (total: 4m)
- 4 diagonals = 1m + 2m + 1m + 2m (total: 6m)
- N diagonals = N + floor(N/2) meters

The formula `diagonals + floor(diagonals / 2) + straights` is correct because:
- `diagonals = min(dx, dy)` counts the number of diagonal steps
- `straights = abs(dx - dy)` counts remaining cardinal steps
- `diagonals + floor(diagonals / 2)` computes the alternating cost (1+2+1+2... = N + floor(N/2))

### Formula Proof

For N diagonal steps, the cost sequence is: 1, 2, 1, 2, ...

- Odd-indexed diagonals (1st, 3rd, 5th, ...): cost 1 each, count = ceil(N/2)
- Even-indexed diagonals (2nd, 4th, 6th, ...): cost 2 each, count = floor(N/2)
- Total = ceil(N/2) * 1 + floor(N/2) * 2 = ceil(N/2) + 2 * floor(N/2)
- Since ceil(N/2) = N - floor(N/2): total = N - floor(N/2) + 2 * floor(N/2) = N + floor(N/2)

This matches the implemented formula exactly.

### Verification by Example

| Diagonal squares | Chebyshev (old) | PTU formula (new) | Expected (rulebook) |
|---|---|---|---|
| 1 | 1m | 1 + 0 = 1m | 1m |
| 2 | 2m | 2 + 1 = 3m | 1+2 = 3m |
| 3 | 3m | 3 + 1 = 4m | 1+2+1 = 4m |
| 4 | 4m | 4 + 2 = 6m | 1+2+1+2 = 6m |
| 5 | 5m | 5 + 2 = 7m | 1+2+1+2+1 = 7m |

All correct. The old Chebyshev formula under-counted every diagonal measurement by `floor(N/2)` meters.

### Mixed movement verification

For a move of dx=3, dy=5 (3 diagonals + 2 straights):
- Diagonals: min(3,5) = 3, cost = 3 + 1 = 4m
- Straights: abs(3-5) = 2, cost = 2m
- Total: 6m (correct)

### Chebyshev uses that correctly remain

The remaining `Math.max(Math.abs(dx), Math.abs(dy))` uses in the codebase are for AoE shape containment:
- `measurement.ts:getBurstCells` (line 196): "is this cell within a burst radius of N?"
- `fogOfWar.ts` (lines 121, 132, 143): brush radius checks
- `terrain.ts` (lines 157, 170): terrain brush radius
- `useRangeParser.ts` (line 380): range shape containment

These are correct. PTU Burst N is defined as "all cells within N squares of the origin" using Chebyshev distance (the burst is a square, not a diamond). The alternating diagonal rule applies to movement costs, not to AoE containment checks. A burst-2 covers a 5x5 square, which is exactly what Chebyshev gives.

### Consistency with pathfinding

The A* pathfinding in `usePathfinding.ts` (lines 100-109) implements diagonal cost via parity tracking:
```typescript
if (isDiagonal) {
  baseCost = currentParity === 0 ? 1 : 2
  newParity = 1 - currentParity
}
```

This is the step-by-step version of the same rule: odd diagonals cost 1, even diagonals cost 2, alternating. It produces identical results to the closed-form formula `N + floor(N/2)` for any path. Verified: the flood-fill in `getMovementRangeCells` (same file, line 103) uses the same parity tracking.

The heuristic function in `calculatePathCost` (line 264) also uses the correct formula:
```typescript
const xyCost = diagonals + Math.floor(diagonals / 2) + straights
```

All three approaches (closed-form, parity-tracking step cost, heuristic) are consistent.

### Verdict for ptu-rule-083

**CORRECT.** The formula accurately implements PTU's alternating diagonal rule. All point-to-point distance measurements now use the correct formula. AoE containment checks correctly remain Chebyshev. Pathfinding is consistent.

## Overall Verdict

**APPROVED**

Both fixes correctly implement their respective PTU rules:
- ptu-rule-082: Pokemon HP increases by the level component on level-up, matching the formula `Level + (HP x3) + 10`
- ptu-rule-083: Diagonal distance uses `N + floor(N/2)` matching the alternating 1m/2m rule from p.425-428

No rules violations found. No new rulings needed.
