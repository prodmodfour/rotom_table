---
review_id: rules-review-050
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: bug-008, bug-009, bug-010, bug-012
domain: combat, pokemon-lifecycle, character-lifecycle, vtt-grid
commits_reviewed:
  - f1ba7c3 (fix: use max(old, new) for temporary HP per PTU rules)
  - 7a3e8dc (fix: apply nature stat adjustments during Pokemon generation)
  - 566f1a1 (fix: compute trainer HP formula on manual character creation)
  - 49a7fb2 (fix: make click-to-move use terrain-aware pathfinding instead of geometric distance)
mechanics_verified:
  - Temporary Hit Points stacking
  - Nature stat adjustments
  - Trainer HP formula
  - Terrain movement costs
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
ptu_refs:
  - core/07-combat.md#Temporary-Hit-Points (p.247-248)
  - core/05-pokemon.md#Nature-Chart (p.199)
  - core/02-character-creation.md#Trainer-Hit-Points (p.16)
  - core/07-combat.md#Terrain (p.231)
reviewed_at: 2026-02-19
---

## Review Scope

PTU rules verification of four P1 HIGH bug fixes, all previously code-reviewed and APPROVED in code-review-056. Each fix addresses a game mechanics correctness issue identified through the Feature Matrix audit pipeline. This review verifies that the implemented fixes match PTU 1.05 rules exactly.

---

## Mechanics Verified

### 1. Temporary Hit Points Stacking (bug-008)

**Commit:** `f1ba7c3`
**File:** `app/server/services/combatant.service.ts` (lines 221-228)

**Rule:** "Temporary Hit Points do not stack with other Temporary Hit Points -- only the highest value applies." (`core/07-combat.md`, p.247-248)

**Rulebook example:** "if you have 10 Temporary Hit Points, and then gain 8 Temporary Hit Points - nothing happens. If the next turn you were then to gain 15 Temporary Hit Points, your Temporary Hit Points would go up to 15 since that is the highest value."

**Implementation:**
```typescript
const previousTempHp = entity.temporaryHp || 0
const newTempHp = Math.max(previousTempHp, options.tempHp)
entity.temporaryHp = newTempHp
result.tempHpGained = newTempHp - previousTempHp
```

**Verification with worked examples:**

1. **Have 10 Temp HP, gain 8:** `Math.max(10, 8) = 10`, `tempHpGained = 0`. Matches PTU: "nothing happens."
2. **Have 10 Temp HP, gain 15:** `Math.max(10, 15) = 15`, `tempHpGained = 5`. Matches PTU: "would go up to 15."
3. **Have 0 Temp HP, gain 12:** `Math.max(0, 12) = 12`, `tempHpGained = 12`. First grant, correct.
4. **Have 20 Temp HP, gain 20:** `Math.max(20, 20) = 20`, `tempHpGained = 0`. Equal values, no change, correct.

**Delta reporting:** `tempHpGained = newTempHp - previousTempHp` correctly reports the actual increase (0 when nothing changes, positive when the new value is higher). This is important for logging/UI feedback.

**Errata check:** No errata entries modify the Temporary Hit Points stacking rule.

**Status:** CORRECT

---

### 2. Nature Stat Adjustments (bug-009)

**Commit:** `7a3e8dc`
**Files:** `app/constants/natures.ts` (new, 106 lines), `app/server/services/pokemon-generator.service.ts`

**Rule:** "Next, apply your Pokemon's Nature. This will simply raise one stat, and lower another; HP is only ever raised or lowered by 1, but all other stats are raised or lowered by 2, respectively, to a minimum of 1." (`core/05-pokemon.md`, p.199)

**Rule (ordering):** The rulebook sequence is: (1) Check base stats, (2) Apply nature, (3) Add stat points. The code now follows this order: `applyNatureToBaseStats(baseStats)` then `distributeStatPoints(adjustedBaseStats)`.

**Nature table verification (all 36 natures cross-referenced against PTU p.199 chart):**

| # | Nature | Code Raise | Code Lower | PTU Raise | PTU Lower | Match |
|---|--------|-----------|-----------|-----------|-----------|-------|
| 1 | Cuddly | hp | attack | HP | Attack | YES |
| 2 | Distracted | hp | defense | HP | Defense | YES |
| 3 | Proud | hp | specialAttack | HP | Special Atk. | YES |
| 4 | Decisive | hp | specialDefense | HP | Special Def. | YES |
| 5 | Patient | hp | speed | HP | Speed | YES |
| 6 | Desperate | attack | hp | Attack | HP | YES |
| 7 | Lonely | attack | defense | Attack | Defense | YES |
| 8 | Adamant | attack | specialAttack | Attack | Special Atk. | YES |
| 9 | Naughty | attack | specialDefense | Attack | Special Def. | YES |
| 10 | Brave | attack | speed | Attack | Speed | YES |
| 11 | Stark | defense | hp | Defense | HP | YES |
| 12 | Bold | defense | attack | Defense | Attack | YES |
| 13 | Impish | defense | specialAttack | Defense | Special Atk. | YES |
| 14 | Lax | defense | specialDefense | Defense | Special Def. | YES |
| 15 | Relaxed | defense | speed | Defense | Speed | YES |
| 16 | Curious | specialAttack | hp | Special Atk. | HP | YES |
| 17 | Modest | specialAttack | attack | Special Atk. | Attack | YES |
| 18 | Mild | specialAttack | defense | Special Atk. | Defense | YES |
| 19 | Rash | specialAttack | specialDefense | Special Atk. | Special Def. | YES |
| 20 | Quiet | specialAttack | speed | Special Atk. | Speed | YES |
| 21 | Dreamy | specialDefense | hp | Special Def. | HP | YES |
| 22 | Calm | specialDefense | attack | Special Def. | Attack | YES |
| 23 | Gentle | specialDefense | defense | Special Def. | Defense | YES |
| 24 | Careful | specialDefense | specialAttack | Special Def. | Special Atk. | YES |
| 25 | Sassy | specialDefense | speed | Special Def. | Speed | YES |
| 26 | Skittish | speed | hp | Speed | HP | YES |
| 27 | Timid | speed | attack | Speed | Attack | YES |
| 28 | Hasty | speed | defense | Speed | Defense | YES |
| 29 | Jolly | speed | specialAttack | Speed | Special Atk. | YES |
| 30 | Naive | speed | specialDefense | Speed | Special Def. | YES |
| 31 | Composed* | hp | hp | HP | HP | YES |
| 32 | Hardy* | attack | attack | Attack | Attack | YES |
| 33 | Docile* | defense | defense | Defense | Defense | YES |
| 34 | Bashful* | specialAttack | specialAttack | Special Atk. | Special Atk. | YES |
| 35 | Quirky* | specialDefense | specialDefense | Special Def. | Special Def. | YES |
| 36 | Serious* | speed | speed | Speed | Speed | YES |

All 36/36 natures match the PTU chart exactly.

**Modifier amounts verified:**
- `modifierAmount('hp')` returns 1 -- matches PTU "HP is only ever raised or lowered by 1"
- `modifierAmount('attack')` (and all other non-HP stats) returns 2 -- matches PTU "all other stats are raised or lowered by 2"

**Minimum stat floor verified:**
- `Math.max(1, modified[nature.lower] - modifierAmount(nature.lower))` -- matches PTU "to a minimum of 1"

**Neutral nature handling verified:**
- When `raise === lower`, function returns `{ ...baseStats }` unchanged -- matches PTU footnote "*These Natures are neutral; they simply do not affect Base Stats, since they cancel themselves out."

**Verification with worked example (Adamant nature on a Charmander):**
- Charmander base stats: HP 4, ATK 5, DEF 4, SpATK 6, SpDEF 5, SPD 7
- Adamant raises Attack (+2), lowers Special Attack (-2)
- Expected: HP 4, ATK 7, DEF 4, SpATK 4, SpDEF 5, SPD 7
- Code: `modified.attack = max(1, 5 + 2) = 7`, `modified.specialAttack = max(1, 6 - 2) = 4`
- Result matches.

**Edge case (HP-raising nature on low-stat Pokemon):**
- Cuddly on a Pokemon with ATK 1: `max(1, 1 - 2) = max(1, -1) = 1` -- correctly floors at 1.

**Application order in generatePokemonData:**
1. Fetch base stats from species data
2. Apply nature to base stats (`applyNatureToBaseStats`)
3. Distribute stat points on adjusted base stats (`distributeStatPoints(adjustedBaseStats)`)
4. Compute HP from calculated stats

This order matches PTU: "apply your Pokemon's Nature" then "add +X Stat Points."

**Nature stored in returned data:** The `natureData` object includes `name`, `raisedStat`, and `loweredStat` (null for neutral natures). The `createdPokemonToEntity` function now uses `data.nature` instead of always defaulting to Hardy.

**baseStats field stores adjusted values:** The returned `baseStats` field is set to `adjustedBaseStats` (nature-modified), not the raw species base stats. This is consistent with PTU's concept -- after nature is applied, those ARE the Pokemon's base stats for all subsequent calculations.

**Errata check:** No errata entries modify nature mechanics.

**Status:** CORRECT

---

### 3. Trainer HP Formula (bug-010)

**Commit:** `566f1a1`
**File:** `app/server/api/characters/index.post.ts`

**Rule:** "Trainer Hit Points = Trainer's Level x 2 + (HP x 3) + 10" (`core/02-character-creation.md`, p.16)

**Rule (example from p.16):** "As a level 1 Trainer, Lisa's character has 57 Hit Points" -- Lisa had 15 HP stat: `1 * 2 + 15 * 3 + 10 = 57`. Confirmed.

**Implementation:**
```typescript
const level = body.level || 1
const hpStat = body.stats?.hp || body.hp || 10
const computedMaxHp = level * 2 + hpStat * 3 + 10
const maxHp = body.maxHp || computedMaxHp
```

**Formula verification:** `level * 2 + hpStat * 3 + 10` matches the PTU formula `Level x 2 + (HP x 3) + 10` exactly.

**Verification with worked examples:**

1. **Level 1, HP stat 10:** `1*2 + 10*3 + 10 = 2 + 30 + 10 = 42`. Matches ticket's expected value.
2. **Level 1, HP stat 15 (Lisa example):** `1*2 + 15*3 + 10 = 2 + 45 + 10 = 57`. Matches PTU's Lisa example.
3. **Level 5, HP stat 12:** `5*2 + 12*3 + 10 = 10 + 36 + 10 = 56`.
4. **Level 10, HP stat 20:** `10*2 + 20*3 + 10 = 20 + 60 + 10 = 90`.

**Override behavior:** `body.maxHp || computedMaxHp` allows explicit maxHp from the request body to take precedence. This is correct for cases where the client pre-computes or the GM manually sets a value.

**currentHp defaulting:** `body.currentHp || maxHp` -- new characters start at full HP. Correct.

**Previous behavior:** Was `body.maxHp || body.currentHp || 10`, which fell back to the raw number 10 rather than computing the formula. A level 1 trainer with HP stat 10 would get maxHp of 10 instead of 42 -- a 4x error. Fixed.

**Note from ticket:** The resolution log mentions `encounter-templates/[id]/load.post.ts` line 85 uses `10 + level * 2` for inline human combatants (missing the `HP * 3` factor). This is acknowledged as separate ticket scope and does not affect this review's verdict.

**Errata check:** No errata entries modify the Trainer HP formula.

**Status:** CORRECT

---

### 4. Terrain-Aware Movement (bug-012)

**Commit:** `49a7fb2`
**Files:** `app/composables/useGridMovement.ts`, `app/composables/useGridInteraction.ts`, `app/composables/useGridRendering.ts`, `app/components/vtt/GridCanvas.vue`

**Rules verified:**

**Slow Terrain:** "When Shifting through Slow Terrain, Trainers and their Pokemon treat every square meter as two square meters instead." (`core/07-combat.md`, p.231)

**Blocking Terrain:** "Straightforwardly, this is Terrain that cannot be Shifted or Targeted through, such as walls and other large obstructions." (`core/07-combat.md`, p.231)

**Underwater Terrain:** "You may not move through Underwater Terrain during battle if you do not have a Swim Capability." (`core/07-combat.md`, p.231)

**Rough Terrain:** "When targeting through Rough Terrain, you take a -2 penalty to Accuracy Rolls." (`core/07-combat.md`, p.231) -- note: Rough Terrain is mostly an accuracy penalty, and "Most Rough Terrain is also Slow Terrain, but not always."

**Implementation analysis:**

The terrain cost mapping in `stores/terrain.ts`:
```typescript
export const TERRAIN_COSTS: Record<TerrainType, number> = {
  normal: 1,
  difficult: 2,      // Slow terrain = 2x cost
  blocking: Infinity, // Impassable
  water: 2,          // Requires swim, else blocking
  hazard: 1,         // Normal cost but deals damage
  elevated: 1,       // Normal cost but affects LoS
}
```

**Terrain cost verification against PTU:**

| App Type | App Cost | PTU Equivalent | PTU Rule | Match |
|----------|----------|---------------|----------|-------|
| normal | 1 | Regular Terrain | "Shift as normal" | YES |
| difficult | 2 | Slow Terrain | "treat every square meter as two square meters" | YES |
| blocking | Infinity | Blocking Terrain | "cannot be Shifted through" | YES |
| water (can swim) | 2 | Underwater | "You may only Shift through Underwater Terrain if you have a Swim Capability" | YES (2x cost is reasonable) |
| water (no swim) | Infinity | Underwater | "You may not move through Underwater Terrain during battle if you do not have a Swim Capability" | YES |
| hazard | 1 | N/A (app-specific) | Not in PTU terrain rules as a distinct movement cost type | ACCEPTABLE |
| elevated | 1 | N/A (app-specific) | Not in PTU terrain rules as a distinct movement cost type | ACCEPTABLE |

**Note on water cost for swimmers:** PTU says swimming Pokemon "use Swim" capability for underwater terrain but does not explicitly state a 2x cost for swimmers. The 2x cost is a reasonable game-balance interpretation, though the strict PTU reading is that you use your Swim capability speed, not Overland. This is an approximation, not incorrect -- the VTT uses a single "movement speed" value and doesn't yet distinguish between Overland and Swim capabilities per combatant. This is a pre-existing design limitation, not introduced by this fix.

**Note on Earth Terrain:** PTU defines "Earth Terrain" (underground, requires Burrow). The app does not have this terrain type. This is a missing feature (not relevant to this fix).

**Pathfinding integration verified:**

The `isValidMove()` function now follows this logic:
1. If target is blocked (occupied by another token) or out of bounds: return invalid immediately.
2. If terrain exists on grid: use A* pathfinding via `calculatePathCost()` which respects terrain costs.
3. If no terrain: fall back to fast geometric diagonal calculation.

This ensures the click-to-move validation uses the same terrain data as the Dijkstra range overlay, eliminating the disconnect that was the root cause of bug-012.

**A* pathfinding cost calculation (in useRangeParser.ts):**
```typescript
const terrainMultiplier = getTerrainCost ? getTerrainCost(nx, ny) : 1
// ...
const g = current.node.g + baseCost * terrainMultiplier
```

The terrain cost is multiplied by the base movement cost (1 for straight, alternating 1/2 for diagonal). This means:
- Moving through a difficult terrain cell straight costs `1 * 2 = 2` meters.
- Moving through a difficult terrain cell diagonally on parity 0 costs `1 * 2 = 2` meters.
- Moving through a difficult terrain cell diagonally on parity 1 costs `2 * 2 = 4` meters.

PTU says "treat every square meter as two square meters" -- this multiplicative approach is correct. Each cell costs 2x its base movement cost, whether approached straight or diagonally.

**Consistency fix:** `useGridInteraction.ts` and `useGridRendering.ts` both now use `options.isValidMove()` instead of manually computing distance and blocked checks. This eliminates the code duplication that caused the original disconnect between range display and movement execution.

**Errata check:** No errata entries modify terrain movement rules.

**Status:** CORRECT

---

## Pre-Existing Issues

### Issue 1: Water terrain swim check uses hardcoded `false`

**File:** `app/composables/useGridMovement.ts`, line 73
```typescript
const getTerrainCostAt = (x: number, y: number): number => {
  return terrainStore.getMovementCost(x, y, false) // TODO: Pass canSwim based on combatant
}
```

The `canSwim` parameter is hardcoded to `false`, meaning all combatants are treated as non-swimmers. This is pre-existing (not introduced by commit `49a7fb2` -- it existed before the fix) and is flagged with a TODO comment. No swim-capable combatant can move through water terrain, even if they have a Swim capability.

PTU Reference: "You may not move through Underwater Terrain during battle if you do not have a Swim Capability." -- the current code incorrectly blocks ALL combatants from water, not just those without Swim.

This is a pre-existing approximation and not caused by any of the four reviewed commits. However, per Lesson 2 (always file a ticket for pre-existing issues), this warrants a ticket.

**Ticket filed:** See `tickets/ptu-rule/ptu-rule-063.md`.

---

## Summary Table

| # | Mechanic | Bug | Commit | File(s) | Verdict |
|---|----------|-----|--------|---------|---------|
| 1 | Temp HP stacking | bug-008 | f1ba7c3 | combatant.service.ts | CORRECT |
| 2 | Nature stat adjustments | bug-009 | 7a3e8dc | natures.ts, pokemon-generator.service.ts | CORRECT |
| 3 | Trainer HP formula | bug-010 | 566f1a1 | characters/index.post.ts | CORRECT |
| 4 | Terrain movement costs | bug-012 | 49a7fb2 | useGridMovement.ts, useGridInteraction.ts, useGridRendering.ts, GridCanvas.vue | CORRECT |

## Summary

- Mechanics checked: 4
- Correct: 4
- Incorrect: 0
- Needs review: 0

## Rulings

None required. All four fixes implement unambiguous PTU rules with clear rulebook text.

## Verdict

**APPROVED** -- All four bug fixes correctly implement PTU 1.05 rules. The Temporary HP stacking now uses `Math.max(old, new)` per the rulebook's explicit "only the highest value applies" language. All 36 nature entries match the PTU nature chart exactly, with correct modifier amounts (+1/-1 for HP, +2/-2 for others) and minimum-1 floor. The Trainer HP formula `Level * 2 + HP * 3 + 10` matches the canonical formula from Chapter 2. Terrain movement costs correctly implement Slow Terrain's 2x multiplier, Blocking Terrain's impassability, and water's swim requirement through A* pathfinding that is now consistent with the Dijkstra range overlay.

One pre-existing MEDIUM issue was identified (hardcoded `canSwim = false`) and ticketed as ptu-rule-063.
