---
review_id: rules-review-245
review_type: rules
reviewer: game-logic-reviewer
trigger: design-implementation
target_report: feature-017
domain: capture
commits_reviewed:
  - 25d2f471
  - e8a289dd
  - 6554a7fe
  - de33c852
  - c1392c80
files_reviewed:
  - app/constants/pokeBalls.ts
  - app/utils/captureRate.ts
  - app/server/api/capture/rate.post.ts
  - app/server/api/capture/attempt.post.ts
  - app/composables/useCapture.ts
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 1
reviewed_at: 2026-03-02T14:30:00Z
follows_up: null
---

## Review Scope

PTU 1.05 rules verification for P0 of feature-017 (Poke Ball Type System). Verified all 25 ball types against Chapter 9 (p.271-273), capture roll formula against Chapter 5 (p.1710-1716) and Chapter 9 (p.27-30), and decree compliance for decrees 013, 014, and 015.

## PTU Source Material

Primary source: PTU 1.05, Chapter 9: Gear and Items, p.271-273 (Poke Ball Chart).
Secondary source: PTU 1.05, Chapter 5: Pokemon, p.1710-1716 (Capture mechanics).
Secondary source: PTU 1.05, Chapter 7: Combat, p.2115-2125 (Capture example).
Secondary source: PTU 1.05, Chapter 9, p.27-30 (Poke Ball description).

## Ball-by-Ball Verification

All 25 ball types verified against the PTU book. Each row shows: Ball # | Name | Book Modifier | Code Modifier | Match.

| # | Ball Name | PTU Modifier | Code Modifier | Match |
|---|-----------|-------------|---------------|-------|
| 01 | Basic Ball | +0 | 0 | YES |
| 02 | Great Ball | -10 | -10 | YES |
| 03 | Ultra Ball | -15 | -15 | YES |
| 04 | Master Ball | -100 | -100 | YES |
| 05 | Safari Ball | +0 | 0 | YES |
| 06 | Level Ball | +0 | 0 | YES |
| 07 | Lure Ball | +0 | 0 | YES |
| 08 | Moon Ball | +0 | 0 | YES |
| 09 | Friend Ball | -5 | -5 | YES |
| 10 | Love Ball | +0 | 0 | YES |
| 11 | Heavy Ball | +0 | 0 | YES |
| 12 | Fast Ball | +0 | 0 | YES |
| 13 | Sport Ball | +0 | 0 | YES |
| 14 | Premier Ball | +0 | 0 | YES |
| 15 | Repeat Ball | +0 | 0 | YES |
| 16 | Timer Ball | +5 | 5 | YES |
| 17 | Nest Ball | +0 | 0 | YES |
| 18 | Net Ball | +0 | 0 | YES |
| 19 | Dive Ball | +0 | 0 | YES |
| 20 | Luxury Ball | -5 | -5 | YES |
| 21 | Heal Ball | -5 | -5 | YES |
| 22 | Quick Ball | -20 | -20 | YES |
| 23 | Dusk Ball | +0 | 0 | YES |
| 24 | Cherish Ball | -5 | -5 | YES |
| 25 | Park Ball | -15 | -15 | YES |

**Result: 25/25 ball types match PTU 1.05 exactly.**

## Conditional Effect Descriptions Verification

For balls with conditional effects (deferred to P1), the `conditionDescription` text was verified against the PTU book:

| Ball | PTU Text | Code conditionDescription | Match |
|------|----------|--------------------------|-------|
| Level Ball | "-20 Modifier if the target is under half the level your active Pokemon is" | "-20 if target is under half the level of your active Pokemon." | YES |
| Lure Ball | "-20 Modifier if the target was baited into the encounter with food" | "-20 if the target was baited into the encounter with food." | YES |
| Moon Ball | "-20 Modifier if the target evolves with an Evolution Stone" | "-20 if the target evolves with an Evolution Stone." | YES |
| Love Ball | "-30 Modifier if the user has an active Pokemon of the same evolutionary line and opposite gender. Does not work with genderless." | "-30 if user has active Pokemon of same evo line and opposite gender. Does not work with genderless." | YES |
| Heavy Ball | "-5 Modifier for each Weight Class the target is above 1" | "-5 for each Weight Class the target is above 1." | YES |
| Fast Ball | "-20 Modifier if the target has a Movement Capability above 7" | "-20 if the target has a Movement Capability above 7." | YES |
| Repeat Ball | "-20 Modifier if you already own a Pokemon of the target's species" | "-20 if you already own a Pokemon of the target's species." | YES |
| Timer Ball | "-5 to the Modifier after every round since encounter start, until -20" | "-5 to Modifier per round since encounter start (until total is -20)." | YES |
| Nest Ball | "-20 Modifier if the target is under level 10" | "-20 if the target is under level 10." | YES |
| Net Ball | "-20 Modifier if the target is Water or Bug type" | "-20 if the target is Water or Bug type." | YES |
| Dive Ball | "-20 Modifier if the target was found underwater or underground" | "-20 if the target was found underwater or underground." | YES |
| Quick Ball | "+5 to Modifier after 1 round, +10 after round 2, +20 after round 3" | "+5 after round 1, +10 after round 2, +20 after round 3 (degrades over time)." | YES |
| Dusk Ball | "-20 Modifier if it is dark, or if there is very little light out" | "-20 if it is dark or very little light out." | YES |

**Result: All 13 conditional descriptions accurately represent the PTU rules.**

## Post-Capture Effect Verification

| Ball | PTU Text | Code Effect | Match |
|------|----------|------------|-------|
| Friend Ball | "A caught Pokemon will start with +1 Loyalty" | `loyalty_plus_one` | YES |
| Luxury Ball | "A caught Pokemon is easily pleased and starts with a raised happiness" | `raised_happiness` | YES |
| Heal Ball | "A caught Pokemon will heal to Max HP immediately upon capture" | `heal_full` | YES |

**Result: 3/3 post-capture effects correctly identified (processing deferred to P2).**

## Cost Verification

| Category | PTU Price | Code Cost | Match |
|----------|-----------|-----------|-------|
| Basic Ball | $250 | 250 | YES |
| Great Ball | $400 | 400 | YES |
| Ultra Ball | $800 | 800 | YES |
| Master Ball | "Worth at least $300,000. Sold nowhere." | 300000 | YES |
| Safari/Sport/Park Balls | Not sold (event-only) | 0 | YES |
| All Special Balls | "usually sold for $800" | 800 | YES |
| Premier Ball | Given during sales (free) | 0 | YES |
| Cherish Ball | Given during events (free) | 0 | YES |

**Result: All costs match PTU 1.05.**

## Capture Roll Formula Verification

PTU Chapter 5 (p.1712-1713): "Roll 1d100, and subtract the Trainer's Level, and any modifiers from equipment or Features."
PTU Chapter 9 (p.28-29): "The Type of Ball will also modify the Capture Roll."

Code implementation in `attemptCapture()`:
```typescript
const modifiedRoll = roll - trainerLevel + modifiers + ballModifier
```

**Analysis:**
- `roll` = 1d100 (correct: `Math.floor(Math.random() * 100) + 1`)
- `-trainerLevel` = "subtract the Trainer's Level" (correct)
- `+modifiers` = "any modifiers from equipment or Features" (correct)
- `+ballModifier` = "The Type of Ball will also modify the Capture Roll" (correct)

Ball modifiers are negative for better balls (Great Ball = -10), so adding them to the roll effectively reduces it, making capture easier. This matches PTU intent where a lower roll is better (roll <= captureRate = success).

Per decree-013: uses 1d100 system, not the errata d20 playtest. **Compliant.**

PTU Chapter 5 (p.1710-1711): "If you roll a Natural 20 on this Accuracy Check, subtract -10 from the Capture Roll."

Code: `if (criticalHit) { effectiveCaptureRate += 10 }` -- mathematically equivalent (adding 10 to the rate vs subtracting 10 from the roll). **Correct.**

PTU Chapter 5 (p.1716): "A natural roll of 100 always catches."

Code: `const naturalHundred = roll === 100` and `const success = naturalHundred || modifiedRoll <= effectiveCaptureRate`. **Correct.**

## Issues

### MEDIUM

**M1. Category assignment for Safari Ball, Sport Ball, and Park Ball lacks nuance for Sport Ball's origin.**

In PTU, the Sport Ball is listed alongside Safari Ball and Park Ball, and all three are described as "Used during Safari hunts." However, in the video games (and arguably in PTU flavor), the Sport Ball is specifically associated with Bug Catching Contests, not Safari Zones. The Park Ball is from Pal Park. This is a flavor/categorization issue only -- it does not affect game mechanics since all three have the same safari-restricted behavior in the code (filtered out by `getAvailableBalls` when `includeSafari` is false).

**Impact:** Cosmetic only. The PTU book groups them together and gives them identical "Used during Safari hunts" descriptions, so the code accurately reflects the source material. The category grouping does not affect capture mechanics. No action required for P0, but worth noting for P2 UI if detailed ball descriptions are shown.

## Decree Compliance

- **decree-013 (1d100 system):** Ball modifiers integrate with the core 1d100 capture system. No d20 playtest elements introduced. The `attemptCapture()` function rolls 1d100 and applies ball modifier to the roll. **Fully compliant.**

- **decree-014 (Stuck/Slow separate):** Ball modifiers are applied to the roll side of the equation, not to the capture rate calculation. The `calculateCaptureRate()` function was not modified. Stuck (+10) and Slow (+5) bonuses remain separate from volatile status, unaffected by ball modifiers. Ball modifiers do not interact with Stuck/Slow bonuses at all (different sides of the comparison). **Fully compliant.**

- **decree-015 (real max HP):** Ball modifiers do not affect HP percentage calculations. The `calculateCaptureRate()` function was not modified and continues to use real max HP. **Fully compliant.**

## What Looks Good

1. **Every base modifier value matches PTU 1.05 exactly.** No transcription errors across all 25 balls.

2. **Sign convention is consistent and correct.** Negative modifiers = easier capture (reduce the roll). This matches the PTU book where Great Ball is listed as "-10" meaning it subtracts 10 from the capture roll.

3. **Ball modifier applies to the roll, not the capture rate.** This is the correct interpretation of PTU mechanics. The capture rate is calculated from Pokemon stats; the ball modifier adjusts the roll. These are separate phases in the PTU formula.

4. **P0 correctly limits scope to base modifiers only.** Conditional balls (Level, Lure, Moon, Love, Heavy, Fast, Timer, Quick, Nest, Net, Dive, Dusk, Repeat) have their conditional descriptions recorded but their condition functions are undefined. The base modifier field correctly holds the "always-on" portion of the modifier. For most conditional balls this is +0, for Timer Ball it is +5 (the starting modifier before round-based reduction), and for Quick Ball it is -20 (the round-1 modifier before degradation). These P0 base values are correct.

5. **The `BallConditionContext` interface is comprehensive.** It includes all fields needed for P1 conditional evaluation: round number, levels (target + active), types, genders, species, evo lines, stone evolution, weight class, movement speed, bait status, species ownership, lighting, and environment. This future-proofs the P1 implementation.

## Verdict

**APPROVED.** All 25 ball types, their base modifiers, conditional descriptions, post-capture effects, and costs match PTU 1.05 Chapter 9 (p.271-273) exactly. The capture roll formula correctly integrates ball modifiers per decree-013 (1d100 system). No interaction issues with decree-014 (Stuck/Slow) or decree-015 (real max HP). The M1 issue is cosmetic and does not require action.
