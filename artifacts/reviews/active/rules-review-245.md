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
mechanics_verified:
  - poke-ball-catalog
  - ball-modifier-capture-roll-integration
  - capture-rate-formula-unmodified
  - natural-100-natural-20-handling
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
ptu_refs:
  - core/09-gear-and-items.md#Page 272-273 (Poke Ball Chart)
  - core/05-pokemon.md#Page 214 (Capturing Pokemon / Capture Roll)
reviewed_at: 2026-03-02T12:00:00Z
follows_up: null
---

## Mechanics Verified

### 1. Poke Ball Catalog (25 Ball Types)

- **Rule:** PTU p.272-273 lists 25 Poke Ball types in a chart with columns: Ball #, Ball Name, Modifier, Special. Pricing: "Basic Balls are sold for $250, Great Balls for $400 and Ultra Balls for $800. All Special balls are usually sold for $800 as well." (`core/09-gear-and-items.md#Page 272`)
- **Implementation:** `app/constants/pokeBalls.ts` defines `POKE_BALL_CATALOG` with 25 entries keyed by name. Each entry has `id`, `name`, `category`, `modifier`, `description`, `cost`, and optional `conditionDescription`, `postCaptureEffect`, `postCaptureDescription`.
- **Status:** CORRECT

Full ball-by-ball audit against PTU p.272-273:

| # | Ball Name | PTU Modifier | Code Modifier | PTU Cost | Code Cost | Verdict |
|---|-----------|-------------|---------------|----------|-----------|---------|
| 01 | Basic Ball | +0 | 0 | $250 | 250 | MATCH |
| 02 | Great Ball | -10 | -10 | $400 | 400 | MATCH |
| 03 | Ultra Ball | -15 | -15 | $800 | 800 | MATCH |
| 04 | Master Ball | -100 | -100 | $300,000 (not sold) | 300000 | MATCH |
| 05 | Safari Ball | +0 | 0 | not sold | 0 | MATCH |
| 06 | Level Ball | +0 | 0 | $800 | 800 | MATCH |
| 07 | Lure Ball | +0 | 0 | $800 | 800 | MATCH |
| 08 | Moon Ball | +0 | 0 | $800 | 800 | MATCH |
| 09 | Friend Ball | -5 | -5 | $800 | 800 | MATCH |
| 10 | Love Ball | +0 | 0 | $800 | 800 | MATCH |
| 11 | Heavy Ball | +0 | 0 | $800 | 800 | MATCH |
| 12 | Fast Ball | +0 | 0 | $800 | 800 | MATCH |
| 13 | Sport Ball | +0 | 0 | not sold | 0 | MATCH |
| 14 | Premier Ball | +0 | 0 | promotional (free) | 0 | MATCH |
| 15 | Repeat Ball | +0 | 0 | $800 | 800 | MATCH |
| 16 | Timer Ball | +5 | 5 | $800 | 800 | MATCH |
| 17 | Nest Ball | +0 | 0 | $800 | 800 | MATCH |
| 18 | Net Ball | +0 | 0 | $800 | 800 | MATCH |
| 19 | Dive Ball | +0 | 0 | $800 | 800 | MATCH |
| 20 | Luxury Ball | -5 | -5 | $800 | 800 | MATCH |
| 21 | Heal Ball | -5 | -5 | $800 | 800 | MATCH |
| 22 | Quick Ball | -20 | -20 | $800 | 800 | MATCH |
| 23 | Dusk Ball | +0 | 0 | $800 | 800 | MATCH |
| 24 | Cherish Ball | -5 | -5 | promotional (free) | 0 | MATCH |
| 25 | Park Ball | -15 | -15 | not sold | 0 | MATCH |

All 25 ball types verified. IDs, names, base modifiers, and costs are accurate to PTU 1.05. Conditional modifier descriptions match the PTU "Special" column text for each ball. Post-capture effects (Friend Ball +1 Loyalty, Luxury Ball raised happiness, Heal Ball full HP) correctly map to the PTU descriptions.

### 2. Ball Modifier Integration into Capture Roll

- **Rule:** "Roll 1d100, and subtract the Trainer's Level, and any modifiers from equipment or Features." (`core/05-pokemon.md#Page 214`). Ball modifiers from the Poke Ball Chart apply to the capture roll, not the capture rate. Per decree-013, this uses the core 1d100 system exclusively.
- **Implementation:** `app/utils/captureRate.ts` `attemptCapture()` applies ball modifier to the roll: `modifiedRoll = roll - trainerLevel + modifiers + ballModifier`. Ball modifier values are negative (e.g., Great Ball = -10), so adding a negative value reduces the modified roll, making it easier to fall at or below the capture rate. This is mathematically equivalent to the PTU description of "subtracting" the modifier from the roll.
- **Status:** CORRECT

The sign convention is internally consistent:
- PTU lists Great Ball as "-10" modifier
- Code stores `-10` in `modifier` field
- Formula adds `ballModifier` to roll: `roll + (-10)` = `roll - 10`
- Lower roll = easier to be under capture rate = easier capture
- This is the correct direction per PTU rules

Critically, `calculateCaptureRate()` is NOT modified. Ball modifiers affect only the roll side, not the capture rate target number. This is correct -- the PTU capture rate formula on p.214 does not include ball modifiers; they are applied to the d100 roll.

### 3. Capture Rate Formula Unchanged

- **Rule:** PTU p.214: "A Pokemon's Capture Rate depends on its Level, Hit Points, Status Afflictions, Evolutionary Stage, and Rarity." The formula: base 100, subtract Level x 2, HP modifier (-30 to +30), evolution modifier (-10 to +10), rarity modifiers (Shiny -10, Legendary -30), status conditions (Persistent +10, Volatile +5), Stuck +10, Slow +5, injuries +5 each.
- **Implementation:** `calculateCaptureRate()` in `app/utils/captureRate.ts` is unchanged by this feature. Ball modifiers are computed separately and applied only via `attemptCapture()`.
- **Status:** CORRECT

This separation is architecturally sound. The capture rate is a property of the Pokemon's state. The ball modifier is a property of the tool used to capture. Keeping them separate matches PTU's structure.

### 4. Natural 20 / Natural 100 Handling

- **Rule:** PTU p.214: "If you roll a Natural 20 on this Accuracy Check, subtract -10 from the Capture Roll." and "A natural roll of 100 always captures the target without fail."
- **Implementation:** Natural 20 on accuracy: `if (criticalHit) { effectiveCaptureRate += 10 }` -- mathematically equivalent to subtracting 10 from the roll. Natural 100 on d100: `naturalHundred = roll === 100; success = naturalHundred || modifiedRoll <= effectiveCaptureRate` -- always succeeds on natural 100.
- **Status:** CORRECT

Ball modifier does not interfere with these special roll behaviors. Natural 100 bypasses all modifiers. Natural 20 crit bonus is applied to the capture rate side (equivalent), separate from the ball modifier applied to the roll side. Both paths produce correct results.

### 5. Backward Compatibility

- **Rule:** PTU Core -- Basic Ball has +0 modifier, meaning no change to existing capture behavior when no ball type is specified.
- **Implementation:** `DEFAULT_BALL_TYPE = 'Basic Ball'` with modifier 0. All existing call sites that omit `ballType` default to Basic Ball (+0). The `attemptCapture()` new `ballModifier` parameter defaults to 0. No existing behavior changes.
- **Status:** CORRECT

## Decree Compliance

### decree-013: Use core 1d100 capture system
The implementation uses the 1d100 system. Ball modifiers are applied as additive adjustments to the d100 roll, consistent with the core system. The errata d20 playtest system is not used. **COMPLIANT.**

### decree-014: Stuck/Slow capture bonuses are separate
Ball modifier integration does not touch the Stuck/Slow logic in `calculateCaptureRate()`. The ball modifier operates on the roll side, while Stuck (+10) and Slow (+5) remain in the capture rate calculation. No incorrect interaction between ball modifiers and Stuck/Slow bonuses. **COMPLIANT.**

### decree-015: Use real max HP for capture rate HP percentage
Ball modifier integration does not modify HP calculations. The capture rate HP percentage logic is untouched. **COMPLIANT.**

## Summary

This is a clean, well-structured P0 implementation that correctly catalogs all 25 PTU Poke Ball types and integrates ball modifiers into the capture system. Every ball name, ID, base modifier, cost, and conditional description was verified against PTU 1.05 p.272-273. The capture roll integration correctly applies ball modifiers to the d100 roll (not the capture rate), matching the PTU rules on p.214. Sign convention is consistent -- negative modifiers reduce the roll, making capture easier. The separation between capture rate (Pokemon state) and capture roll modifiers (ball + equipment + trainer level) is architecturally correct.

P0 correctly defers conditional ball logic (P1) and post-capture effects (P2) while still defining the data structures and placeholder fields for them. The `condition` functions are undefined, and `calculateBallModifier()` returns only the base modifier, which is the correct P0 behavior.

No issues found. All 25 ball types verified against enumerated rulebook list per lesson L1.

## Rulings

1. **Ball modifiers apply to the capture roll, not the capture rate.** PTU p.214 lists the Capture Rate calculation separately from the Capture Roll procedure. The Capture Roll instruction says "Roll 1d100, and subtract the Trainer's Level, and any modifiers." Ball modifiers are "modifiers" in this context. The implementation correctly keeps them on the roll side.

2. **Negative ball modifier = easier capture.** PTU convention: the Modifier column lists values like "-10" for Great Ball. Adding a negative modifier to the roll reduces it, making it more likely to fall at or below the capture rate threshold. The code's sign convention is correct.

3. **Master Ball modifier of -100 effectively guarantees capture.** With a base capture rate starting at 100 and a ball modifier of -100, the modified roll would be (1d100 - trainerLevel - 100 + otherMods), which will almost always be far below any capture rate. Combined with the natural 100 auto-capture, this effectively guarantees capture, matching the PTU description "Incredibly Rare. Guaranteed capture."

## Verdict

**APPROVED** -- All 25 ball types match PTU 1.05 p.272-273 exactly. Ball modifier integration into the capture formula is correct per p.214 and decree-013. No issues found at any severity level.

## Required Changes

None.
