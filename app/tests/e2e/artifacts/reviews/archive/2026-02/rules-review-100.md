---
review_id: rules-review-100
ticket: ptu-rule-054
commits_reviewed: ["c466c99", "0986e61"]
verdict: PASS
reviewer: game-logic-reviewer
date: 2026-02-20
---

# Rules Review: Base Relations Rule Enforcement (ptu-rule-054)

## PTU Rule Reference

**PTU Core Chapter 5, p.198-199 -- Base Relations Rule:**

> "The Base Relations Rule puts a Pokemon's Base Stats in order from highest to lowest. This order must be maintained when adding Stat Points."

> "Stats that are equal need not be kept equal, however. Charmander's HP and Defense do not need to be kept the same; they must merely both follow the rules of base relation, each staying under Attack and Special Defense."

**Application order (p.198):**
1. Start with species Base Stats
2. Apply Nature (raises one stat, lowers another)
3. Add stat points (level + 10), respecting Base Relations on the nature-adjusted base stats

**Also referenced at:**
- p.199: Two legal Charmander stat distributions (both neutral nature, both follow Base Relations)
- p.202: Level-up stat points must also adhere to Base Relations
- p.202: Evolution re-statting must follow Base Relations
- p.204: Poke Edges (Attack Conflict) can exempt specific stats from Base Relations
- p.207: Sweeper Venusaur example -- "Base" column shows nature-adjusted values, confirming Base Relations apply to nature-adjusted stats

**Errata:** No errata entries found for Base Relations.

## Code Under Review

**File:** `app/server/services/pokemon-generator.service.ts`
**Functions:** `distributeStatPoints()` (modified), `enforceBaseRelations()` (new)

## Verification

### 1. Does the tier-based approach correctly implement "equal base values need not remain equal"?

**YES.** Stats with equal base values are grouped into the same tier (lines 434-438). Within a tier, the assigned added-point values are shuffled via Fisher-Yates (lines 446-451), so any permutation of those values is equally likely. This means two stats with the same base value can receive different added points, exactly matching the PTU rule that "stats that are equal need not be kept equal."

### 2. Does the descending sort + tier assignment guarantee higher base stats always get >= points?

**YES.** The proof:

- All added-point values are sorted descending into a pool: `[v1 >= v2 >= ... >= v6]`.
- Tiers are processed top-down (highest base first). Each tier takes the next N values from the pool.
- For two adjacent tiers with base values B1 > B2 (strictly, since equal bases share a tier):
  - Tier 1's minimum assigned value (`a_min_1`) >= Tier 2's maximum assigned value (`a_max_2`), because tier 1's slice precedes tier 2's slice in the descending pool.
  - Therefore: `B1 + a_min_1 >= (B2 + 1) + a_max_2 > B2 + a_max_2`
  - Every final stat in the higher tier is strictly greater than every final stat in the lower tier.

This is a correct and complete guarantee of the Base Relations ordering.

### 3. Is the Fisher-Yates shuffle within tiers correct?

**YES.** The implementation:

```javascript
for (let j = tierValues.length - 1; j > 0; j--) {
  const k = Math.floor(Math.random() * (j + 1))
  const temp = tierValues[j]
  tierValues[j] = tierValues[k]
  tierValues[k] = temp
}
```

This is the standard Knuth/Fisher-Yates shuffle, iterating from the last element down to index 1, picking a uniformly random index in `[0, j]`, and swapping. It produces a uniform random permutation of the tier's values.

### 4. Are there edge cases the PTU rules describe that this doesn't handle?

**Checked edge cases:**

| Edge Case | Handled? | Notes |
|---|---|---|
| All base stats equal | Yes | One tier, all values shuffled -- no ordering constraint imposed |
| All base stats unique | Yes | Six tiers of size 1, values assigned in strict descending order |
| Two-way ties (e.g., ATK=SPDEF) | Yes | Grouped into same tier, shuffled independently |
| Nature-adjusted ordering | Yes | `distributeStatPoints` receives `adjustedBaseStats` (line 147), so tiers reflect post-nature ordering |
| Stat point total preserved | Yes | Algorithm reassigns the same multiset of values to different keys -- total is invariant |
| Attack Conflict / Poke Edges | N/A | These are player-controlled Poke Edges not applicable to automated NPC generation |
| Level 1 (11 stat points) | Yes | Algorithm is level-agnostic |
| High level (110 stat points) | Yes | Same algorithm, more points distributed |

### 5. Nature-adjusted vs. original base stats

The PTU text says "Base Stats" but the example on p.207-208 (Sweeper Venusaur) shows the "Base" column with nature-adjusted values (SPDEF 8 = 10-2 from Naive, SPEED 10 = 8+2 from Naive). The code correctly uses `adjustedBaseStats` (post-nature) for the Base Relations check, matching the PTU examples.

### 6. Single code path verification

The ticket's resolution log confirms only one automated stat distribution code path exists (`pokemon-generator.service.ts`). Manual level-up allocation (in `levelUpCheck.ts` and `PokemonLevelUpPanel.vue`) displays a reminder but does not auto-allocate. No fix needed for manual paths.

## Verdict: PASS

The `enforceBaseRelations()` implementation correctly enforces the PTU Base Relations Rule. The tier-based algorithm provides a mathematical guarantee that higher base stats always result in strictly higher final stats, while equal base stats are free to vary. The Fisher-Yates shuffle is correctly implemented. Total stat points are preserved. Nature-adjusted base stats are correctly used as the ordering reference. No PTU edge cases are missed for automated generation.
