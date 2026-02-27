---
review_id: rules-review-114
review_type: rules
reviewer: game-logic-reviewer
trigger: design-implementation
target_report: ptu-rule-060
domain: scenes
commits_reviewed:
  - 902b518
  - 6a4f6a1
  - ca5243f
  - 171f9f5
  - 97bff99
mechanics_verified:
  - encounter-budget-formula
  - trainer-double-xp
  - significance-multiplier
  - xp-calculation
  - difficulty-assessment
verdict: APPROVED
issues_found:
  critical: 0
  high: 1
  medium: 1
ptu_refs:
  - core/11-running-the-game.md#Page 473
  - core/11-running-the-game.md#Page 460
reviewed_at: 2026-02-21T22:30:00Z
follows_up: null
---

## Mechanics Verified

### Encounter Budget Formula (Core p.473)

- **Rule:** "One good guideline here for an everyday encounter is to multiply the average Pokemon Level of your PCs by 2 [...] and use that as a projected baseline Experience drop per player for the encounter. [...] From there, simply multiply the Experience drop by your number of Trainers. This is the number of Levels you have to work with to build your encounter." (`core/11-running-the-game.md#Page 473`)
- **Implementation:** `calculateEncounterBudget()` in `app/utils/encounterBudget.ts:130-146` computes `baselinePerPlayer = avgLevel * 2` then `totalBudget = baselinePerPlayer * playerCount`.
- **Verification:** PTU example -- three Level 10 Trainers, Pokemon around Level 20. Budget = 20 * 2 * 3 = 120. Code produces identical result: `calculateEncounterBudget({ averagePokemonLevel: 20, playerCount: 3 })` yields `totalBudget: 120`, `baselineXpPerPlayer: 40`.
- **Status:** CORRECT

### Trainer Double XP Rule (Core p.460)

- **Rule:** "Total the Level of the enemy combatants which were defeated. For encounters where Trainers were directly involved in the combat, treat their Level as doubled for the sake of this calculation." (`core/11-running-the-game.md#Page 460`)
- **Implementation:** `calculateEffectiveEnemyLevels()` in `app/utils/encounterBudget.ts:152-162` applies `enemy.isTrainer ? enemy.level * 2 : enemy.level`.
- **Verification:** PTU example -- Level 10 Trainer with Level 20 Pokemon. Code: `calculateEffectiveEnemyLevels([{ level: 10, isTrainer: true }, { level: 20, isTrainer: false }])` yields `{ totalLevels: 30, effectiveLevels: 40 }`. Matches PTU's "Base Experience Value for this encounter is 40."
- **Status:** CORRECT

### Significance Multiplier (Core p.460)

- **Rule:** "The Significance Multiplier should range from x1 to about x5 [...] Insignificant encounters should trend towards the bottom of the spectrum at x1 to x1.5. 'Average' everyday encounters should be about x2 or x3. More significant encounters may range anywhere from x4 to x5." (`core/11-running-the-game.md#Page 460`)
- **Implementation:** `SIGNIFICANCE_PRESETS` in `app/utils/encounterBudget.ts:72-108` defines five tiers: insignificant (1.0-1.5), everyday (2.0-3.0), significant (3.0-4.0), climactic (4.0-5.0), legendary (5.0).
- **Assessment:** PTU defines three loose tiers; the code expands to five. The insignificant (1.0-1.5) and everyday (2.0-3.0) ranges match PTU exactly. The PTU "significant" range (x4-x5) is split into three sub-tiers (significant 3.0-4.0, climactic 4.0-5.0, legendary 5.0). The "significant" tier's lower bound of 3.0 extends below PTU's stated x4 floor. However, the PTU text also mentions "Lower or raise the significance a little, by x0.5 to x1.5, based on the difficulty of the challenge" -- making x3 reachable for encounters between everyday and significant. This is a reasonable GM-facing expansion of the guideline, not a formula violation.
- **Status:** CORRECT (with MEDIUM note -- see issues)

### XP Calculation (Core p.460)

- **Rule:** "First off, total the Level of the enemy combatants which were defeated [trainers doubled]. Second, consider the significance of the encounter [...] multiply the Base Experience Value. Third, divide the Experience by the number of players gaining Experience. Divide by the number of Players -- not the number of Pokemon." (`core/11-running-the-game.md#Page 460`)
- **Implementation:** `calculateEncounterXp()` in `app/utils/encounterBudget.ts:200-210` computes `baseXp = effectiveLevels`, `totalXp = floor(baseXp * significanceMultiplier)`, `xpPerPlayer = floor(totalXp / playerCount)`.
- **Verification:** Using PTU p.473 example -- six Level 20 Pokemon defeated, significance x2, 3 players. `effectiveLevels = 120`, `totalXp = 240`, `xpPerPlayer = 80`. PTU says "each player gets 80 Experience" -- exact match.
- **Status:** CORRECT

### Difficulty Assessment (Custom Heuristic)

- **Rule:** No PTU rule defines difficulty categories. This is an app-specific convenience feature.
- **Implementation:** `assessDifficulty()` in `app/utils/encounterBudget.ts:167-173` maps budget ratio (enemyLevels / totalBudget) to five labels: trivial (<0.4), easy (0.4-0.7), balanced (0.7-1.3), hard (1.3-1.8), deadly (>1.8).
- **Assessment:** The thresholds are reasonable heuristics. A ratio of 1.0 (exactly matching budget) falls in "balanced" which is intuitive. No PTU rule governs this, so no correctness concern.
- **Status:** CORRECT (custom feature, not PTU-governed)

## Summary

The P0 implementation correctly encodes the PTU encounter budget formula and XP calculation from Core p.460 and p.473. The core formula `averagePokemonLevel * 2 * playerCount` is implemented exactly as specified, verified against both PTU examples. The trainer double-XP rule, significance multiplier ranges, and XP division are all faithful to the rulebook text.

One HIGH issue exists in the composable's `analyzeCurrent` method which counts all player-side combatants (including Pokemon) as "players" for budget calculation, violating PTU's explicit instruction to count Trainers only. This method is not yet called by any P0 component (both modals receive their counts via props), so the bug is latent but will surface in P1/P2 work.

## Rulings

1. **Budget formula `avgLevel * 2 * players` is PTU-correct.** The pure utility implements the formula exactly as stated on p.473. No errata modifies this guideline. RULING: Implementation matches rule.

2. **Trainer levels count double for XP is PTU-correct.** The `isTrainer` flag properly gates the 2x multiplier. RULING: Implementation matches rule.

3. **Significance multiplier five-tier expansion is acceptable.** PTU defines three loose tiers (insignificant, everyday, significant). The five-tier system (insignificant, everyday, significant, climactic, legendary) provides finer GM control without contradicting PTU. The "significant" tier's lower bound (x3) is slightly below PTU's stated x4 floor, but PTU explicitly allows +/- 0.5 to 1.5 adjustment based on difficulty, making x3 reachable. RULING: Acceptable expansion of guidelines, not a violation.

4. **Player count in `analyzeCurrent` must filter by `type === 'human'`.** PTU p.460 explicitly says "Divide by the number of Players -- not the number of Pokemon." The composable's `analyzeCurrent` uses `side === 'players'` which includes both humans and Pokemon on the player side. RULING: Must be fixed before `analyzeCurrent` is used.

## Issues

### HIGH-1: `analyzeCurrent` counts all player-side combatants instead of trainers only

**File:** `app/composables/useEncounterBudget.ts:25`
**Rule:** "Divide by the number of Players -- not the number of Pokemon." (Core p.460)
**Code:**
```typescript
const playerCombatants = encounter.combatants.filter(c => c.side === 'players')
```
**Problem:** This counts all combatants (humans AND Pokemon) on the 'players' side. A party of 3 trainers with 6 Pokemon would yield `playerCount = 9`, inflating the budget to 3x its correct value.
**Fix:** Filter by both side and type:
```typescript
const playerCombatants = encounter.combatants.filter(c => c.side === 'players' && c.type === 'human')
```
**Impact:** Currently latent -- `analyzeCurrent` is not called by any P0 component. Both modals receive `partyContext`/`budgetInfo` via props from parent components. This will become active in P1/P2 when `analyzeCurrent` is wired to live encounter views.
**Severity:** HIGH (wrong formula when activated, but latent in P0)

### MEDIUM-1: Significance "significant" tier lower bound (x3) below PTU floor (x4)

**File:** `app/utils/encounterBudget.ts:87-91`
**Rule:** "More significant encounters may range anywhere from x4 to x5" (Core p.460)
**Code:**
```typescript
{
  tier: 'significant',
  label: 'Significant',
  multiplierRange: { min: 3.0, max: 4.0 },
  defaultMultiplier: 3.5,
  description: 'Gym leaders, rival encounters, mini-bosses'
}
```
**Problem:** The "significant" preset starts at x3, but PTU says significant encounters range x4-x5. The x3 value falls in the "everyday" range per PTU. This creates a gap where an encounter labeled "Significant" in the app actually awards "Everyday" XP by PTU standards.
**Nuance:** PTU allows +/- 0.5 to 1.5 adjustment for difficulty, and the tiers are guidelines not hard rules. The five-tier system is an expansion. However, labeling x3.5 as the *default* for "Significant" when PTU says x4 is the floor for significant could mislead GMs.
**Suggested fix:** Shift significant to `{ min: 3.5, max: 4.5 }` with default 4.0, and climactic to `{ min: 4.5, max: 5.0 }`. Or rename the tier to avoid confusion with PTU's own "significant" label.
**Severity:** MEDIUM (labeling mismatch, not a formula error)

## Verdict

**APPROVED** -- The core budget formula, XP calculation, and trainer-double rule are all PTU-correct. The HIGH issue is latent in P0 (the buggy `analyzeCurrent` method is not called by any component yet) and the MEDIUM issue is a labeling choice rather than a calculation error. Both should be addressed before P1/P2 delivery but do not block P0 approval.

## Required Changes

**Before P1/P2 (not blocking P0):**

1. **Fix `analyzeCurrent` player count filter** -- add `&& c.type === 'human'` to the player combatant filter in `useEncounterBudget.ts:25`. This must be done before `analyzeCurrent` is wired to any component.

2. **Consider adjusting "significant" tier bounds** -- either shift the range to match PTU's x4 floor for significant encounters, or rename the tier to avoid confusion with PTU terminology.
