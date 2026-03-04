---
review_id: rules-review-205
review_type: rules
reviewer: game-logic-reviewer
trigger: design-implementation
target_report: feature-007
domain: pokemon-lifecycle
commits_reviewed:
  - 06f21f5
  - ae5dbeb
  - 9c0f826
  - da32fa1
  - ff62e08
  - 1dc50f0
  - bd4eade
  - 9e5e90f
mechanics_verified:
  - base-relations-rule
  - stat-point-budget
  - pokemon-hp-formula
  - stat-allocation-validation
  - nature-adjusted-ordering
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 2
ptu_refs:
  - core/05-pokemon.md#Base-Relations-Rule
  - core/05-pokemon.md#Stat-Points
  - core/05-pokemon.md#Pokemon-Hit-Points
  - core/05-pokemon.md#Level-Up
reviewed_at: 2026-02-28T22:30:00Z
follows_up: null
---

## Mechanics Verified

### 1. Base Relations Rule (PTU Core p.198)

- **Rule:** "The Base Relations Rule puts a Pokemon's Base Stats in order from highest to lowest. This order must be maintained when adding Stat Points." and "Stats that are equal need not be kept equal, however. Charmander's HP and Defense do not need to be kept the same; they must merely both follow the rules of base relation, each staying under Attack and Special Defense." (`core/05-pokemon.md#Base-Relations-Rule`)
- **Implementation:** `app/utils/baseRelations.ts` lines 76-120. `validateBaseRelations()` iterates all pairs of stat keys. For any pair where `natureAdjustedBase[a] > natureAdjustedBase[b]`, it checks that `(base[a] + statPoints[a]) >= (base[b] + statPoints[b])`. Pairs with equal base stats are skipped (`if (baseA === baseB) continue`), correctly allowing them to diverge.
- **Status:** CORRECT

The core invariant is properly implemented: higher base stats must remain higher (or equal) after stat point allocation, and equal base stats are unconstrained relative to each other. The algorithm checks all (i, j) pairs with `j > i` (avoiding duplicate checks), which is efficient and correct.

### 2. Nature-Adjusted Base Stats for Ordering (decree-035)

- **Rule:** Per decree-035: "Base Relations ordering uses nature-adjusted base stats, not raw species base stats." PTU p.198 qualifies its example "with a neutral nature" implying non-neutral natures change the ordering.
- **Implementation:** The server endpoint (`allocate-stats.post.ts` lines 56-63) builds `natureAdjustedBase` from `pokemon.baseHp`, `pokemon.baseAttack`, etc. The pokemon-generator service confirms these DB fields store nature-adjusted base stats (line 145: `applyNatureToBaseStats(baseStats, selectedNature)` is applied, then line 174: `baseStats: adjustedBaseStats` is what gets written to the DB's `base*` fields). The composable (`useLevelUpAllocation.ts` line 43) reads `pokemonRef.value.baseStats` which the serializer maps from the same DB fields.
- **Status:** CORRECT -- fully compliant with decree-035.

### 3. Stat Point Budget (PTU Core p.198)

- **Rule:** "add +X Stat Points, where X is the Pokemon's Level plus 10" (`core/05-pokemon.md#Stat-Points`)
- **Implementation:** Server budget check at `allocate-stats.post.ts` line 136: `const budget = pokemon.level + 10`. Client budget at `useLevelUpAllocation.ts` line 55: `pokemonRef.value.level + 10`. Both correctly implement the PTU formula.
- **Status:** CORRECT

### 4. Pokemon HP Formula (PTU Core p.198)

- **Rule:** "Pokemon Hit Points = Pokemon Level + (HP x3) + 10" (`core/05-pokemon.md#Pokemon-Hit-Points`)
- **Implementation:** Server HP calculation at `allocate-stats.post.ts` line 163: `const newMaxHp = pokemon.level + (newHpStat * 3) + 10` where `newHpStat = natureAdjustedBase.hp + proposedStatPoints.hp`. Reverse extraction at `baseRelations.ts` line 167: `const hpStat = Math.round((pokemon.maxHp - pokemon.level - 10) / 3)`.
- **Status:** CORRECT

The HP formula is applied correctly in both directions (forward calculation and reverse extraction). The `Math.round()` in extraction handles potential floating-point issues from integer arithmetic.

### 5. Stat Point Extraction (PTU derived)

- **Rule:** For non-HP stats, the calculated stat = nature-adjusted base + allocated stat points. Therefore, allocated stat points = calculated stat - nature-adjusted base. For HP, the reverse formula from the HP calculation applies.
- **Implementation:** `baseRelations.ts` lines 155-188. Non-HP stats: `pokemon.currentStats[stat] - pokemon.baseStats[stat]`. HP: reverse-engineers from `maxHp` using `(maxHp - level - 10) / 3 - baseHp`. All values are `Math.max(0, ...)` to avoid negative results from data inconsistency.
- **Status:** CORRECT

### 6. Level-Up Stat Point Gain (PTU Core p.203)

- **Rule:** "Whenever your Pokemon Levels up, follow this list: First, it gains +1 Stat Point. As always, added Stat points must adhere to the Base Relations Rule." (`core/05-pokemon.md#Level-Up`)
- **Implementation:** The system calculates remaining unallocated points as `budget - totalAllocated`, where budget is `level + 10`. This correctly accounts for all stat points cumulatively across all levels. The UI does not restrict allocation to exactly 1 point per level -- it allows the GM to allocate all pending points at once. This is a reasonable UX decision since the net effect is the same: the total allocation must equal `level + 10`.
- **Status:** CORRECT

### 7. Tier Construction / Stat Grouping

- **Rule:** PTU p.198 example: "Charmander has Speed > Special Attack > Attack and Special Defense > HP and Defense." Stats with equal base values form groups that only need to stay below the tiers above them.
- **Implementation:** `buildStatTiers()` in `baseRelations.ts` lines 38-62 sorts stats by base value descending and groups consecutive entries with equal values into the same tier. This correctly produces the tier structure described in PTU.
- **Status:** CORRECT

### 8. Skip Base Relations (Features that break ordering)

- **Rule:** PTU p.198: "there are several Features that allow trainers to break Stat Relations; when adding stats, you don't need to 'correct' Stats due to the 'violations' made due to these features." Specific examples: Enduring Soul, Attack Conflict.
- **Implementation:** The server endpoint supports `skipBaseRelations: true` in the request body (line 148). When set, Base Relations violations are permitted. This correctly enables Features like Attack Conflict and Enduring Soul.
- **Status:** CORRECT

### 9. Valid Allocation Targets (Proactive Validation)

- **Rule:** Derived from Base Relations -- before the user allocates a point, the UI should know which stats can legally receive the next point.
- **Implementation:** `getValidAllocationTargets()` in `baseRelations.ts` lines 129-142 tests each stat by creating a copy of the allocation with `+1` to that stat, then running full validation. This brute-force approach is O(6*6^2) = O(216) per call, which is negligible and guaranteed correct since it uses the same validation logic.
- **Status:** CORRECT

## Summary

The P0 implementation of Pokemon Level-Up Allocation correctly implements all PTU 1.05 mechanics for stat point allocation. The Base Relations Rule is properly enforced, nature-adjusted base stats are correctly used per decree-035, the stat point budget formula (`level + 10`) is correct, and the HP formula (`level + (hpStat * 3) + 10`) is applied correctly in both forward and reverse directions.

The code architecture cleanly separates concerns: pure validation functions in `baseRelations.ts`, server-side enforcement in the API endpoint, reactive client-side state in the composable, and a focused UI component. The refactoring of `evolutionCheck.ts` to delegate to the shared `baseRelations.ts` is a good move for DRY compliance.

## Rulings

### Ruling 1: The "Final Stat" Ordering Interpretation is Correct

The implementation checks: if `base[A] > base[B]`, then `(base[A] + points[A]) >= (base[B] + points[B])`. This uses the TOTAL calculated stat (base + allocated points) for the comparison, which matches PTU's intent. The Base Relations Rule says "this order must be maintained when adding Stat Points" -- the order of the TOTAL stats must match the order of the BASE stats.

### Ruling 2: Allocation Does Not Enforce Per-Level +1 Granularity

The system allows the GM to allocate multiple stat points at once (e.g., if a Pokemon leveled up 3 times, allocate all 3 points in one session). PTU says "each level, a Pokemon gains +1 Stat Point" but the net allocation is identical whether you allocate one-by-one or in bulk. The system validates the final state, not the per-level history. This is acceptable for a GM tool.

### Ruling 3: HP Preservation Behavior is Game-Friendly

When stat points are allocated to HP, the system preserves the HP ratio: if the Pokemon was at full HP, it stays at full HP with the new maximum. If it was damaged, `currentHp` is capped at the new `maxHp` but otherwise preserved. This matches the behavior already established in `add-experience.post.ts` and is reasonable game logic.

## Medium Issues

### MEDIUM-1: `extractStatPoints()` May Produce Incorrect Results for Vitamin-Modified Pokemon

**Location:** `app/utils/baseRelations.ts` lines 155-188

**Issue:** The extraction logic assumes `calculatedStat = natureAdjustedBase + levelUpPoints` for all non-HP stats. However, PTU Vitamins (HP Up, Protein, Iron, etc.) add directly to base stats. If Vitamins were applied and reflected in the `base*` DB fields, the extraction would be correct. But if Vitamins are tracked separately or if the `current*` fields include Vitamin bonuses that are not in `base*`, the extraction would produce incorrect stat points.

**Impact:** The current codebase does not appear to implement Vitamins yet, so this is not an active bug. However, when Vitamins are added in the future, `extractStatPoints()` will need to account for them. The extraction formula would need: `levelUpPoints = currentStat - baseStatWithNature - vitaminBonus`.

**Recommendation:** Add a code comment noting this future consideration. No code change needed now.

### MEDIUM-2: `Apply Allocation` Button Requires All Points Allocated

**Location:** `app/components/pokemon/StatAllocationPanel.vue` line 89

**Issue:** The "Apply Allocation" button is disabled when `unallocatedPoints > 0`. This means the GM must allocate ALL remaining points in one session -- they cannot save a partial allocation and return later. PTU does not require all points to be allocated immediately; a player may leave points unallocated.

**Impact:** Minor UX friction. A GM who wants to allocate only some points (e.g., during combat when time is limited) cannot do so. The server endpoint correctly allows partial allocation (`proposedTotal > budget` rejects over-budget, but does not reject under-budget). Only the UI enforces full allocation.

**Recommendation:** Consider allowing the "Apply Allocation" button when `validation.valid === true`, even if `unallocatedPoints > 0`. This would let the GM save partial allocations. Low priority -- the current behavior is stricter than PTU requires but not incorrect.

## Decree Compliance

- **decree-035 (base-relations-nature-adjusted):** COMPLIANT. The DB `base*` fields store nature-adjusted base stats. Both server and client use these for Base Relations ordering. Verified through the pokemon-generator service chain: `applyNatureToBaseStats()` -> `adjustedBaseStats` -> `baseStats` field -> DB `base*` columns.
- **decree-036 (stone-evolution-move-learning):** NOT APPLICABLE to P0 (stat allocation). Noted for future P1 review.

## Verdict

**APPROVED** -- All PTU mechanics are correctly implemented. The Base Relations Rule, stat point budget, HP formula, and nature-adjusted ordering all match PTU 1.05 rules and decree-035. The two MEDIUM issues are UX/future-proofing concerns, not correctness bugs. No blocking issues.
