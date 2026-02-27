---
review_id: rules-review-123
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: ptu-rule-056
domain: character-lifecycle
commits_reviewed:
  - 3374668
  - d8c63eb
  - 8c0279f
  - c8d4edd
  - a34c2f4
  - 06dca93
  - 95e7248
mechanics_verified:
  - trainer-weight-class
  - starting-money
  - trainer-hp-formula
  - unit-conversion-display
  - background-section-completion
  - input-validation
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
ptu_refs:
  - core/02-character-creation.md#Page 16 (Weight Class)
  - core/02-character-creation.md#Page 17 (Starting Money)
  - core/02-character-creation.md#Page 18 (Quick-Start Steps)
reviewed_at: 2026-02-22T22:30:00Z
follows_up: rules-review-119
---

## Mechanics Verified

### Trainer Weight Class (H2 — d8c63eb)

- **Rule:** "A Trainer between 55 and 110 pounds is Weight Class 3. Between 111 and 220 is WC 4. Higher than that is WC 5." (`core/02-character-creation.md#Page 16`)
- **Confirmed on Quick-Start (Page 18):** "Weight Class is 3 if you are between 55 and 110 pounds, 4 if you are between 111 and 220 pounds, and 5 if higher than that."
- **Implementation:** `computeWeightClass()` in `BiographySection.vue` converts kg to lbs (`kg * 2.20462`), then applies: `lbs <= 110 -> WC 3`, `lbs <= 220 -> WC 4`, `else -> WC 5`.
- **Boundary verification:**
  - 110 lbs: `lbs <= 110` is true -> WC 3. Correct (upper bound of "55 and 110").
  - 111 lbs: `lbs > 110 && lbs <= 220` -> WC 4. Correct (lower bound of "111 and 220").
  - 220 lbs: `lbs <= 220` is true -> WC 4. Correct (upper bound of "111 and 220").
  - 221 lbs: `lbs > 220` -> WC 5. Correct ("Higher than that").
- **Sub-55 lbs edge case:** PTU does not define a Trainer WC below 55 lbs. The implementation defaults sub-55 to WC 3, which is a reasonable design decision (the comment documents this explicitly). No PTU rule is violated.
- **Previous issue (rules-review-119 H1):** The old implementation used Pokemon weight class scale (WC 1-6, kg-based). This is now fully replaced with the correct Trainer scale.
- **Status:** CORRECT

### Starting Money (M3 — a34c2f4)

- **Rule:** "we recommend all starting Trainers begin with a Pokedex and $5000 to split between spending on supplies and keeping as cash." (`core/02-character-creation.md#Page 17, Step 9`)
- **Confirmed on Quick-Start (Page 18):** "Most campaigns starting at Level 1 should start Trainers with $5000 to split between starting equipment and reserve cash."
- **Implementation:** `DEFAULT_STARTING_MONEY = 5000` is defined in `useCharacterCreation.ts` and now exported. `QuickCreateForm.vue` imports it and assigns it to PC payloads: `characterType === 'player' ? DEFAULT_STARTING_MONEY : 0`. NPCs get 0, which is a reasonable GM tool decision (NPCs don't track inventory spending).
- **Server-side pass-through:** `server/api/characters/index.post.ts` line 43 uses `body.money || 0`, which correctly accepts the 5000 value from the client for PCs and defaults to 0 when omitted.
- **Status:** CORRECT

### Trainer HP Formula (QuickCreateForm.vue)

- **Rule:** "Trainer Hit Points = Trainer's Level x 2 + (HP x 3) + 10" (`core/02-character-creation.md#Page 16`)
- **Implementation:** `QuickCreateForm.vue` line 109: `const maxHp = level * 2 + hpStat * 3 + 10`. Server-side `index.post.ts` line 13 mirrors this: `const computedMaxHp = level * 2 + hpStat * 3 + 10`.
- **Status:** CORRECT

### Unit Conversion Display (H1 — 3374668)

- **Rule:** No PTU rule governs imperial display format; this is a UI correctness fix. The fix ensures `cmToFeetInches()` handles the rounding edge case where `Math.round(totalInches % 12)` yields 12 (e.g., 182 cm -> 71.65 inches -> feet=5, inches=Math.round(11.65)=12). The guard increments feet and sets inches to 0, producing `6'0"` instead of the incorrect `5'12"`.
- **Spot-check:** 182 cm -> 71.65 total inches -> 5 feet remainder 11.65 -> rounds to 12 -> guard triggers -> `6'0"`. Correct.
- **Status:** CORRECT (not a PTU mechanic, but the display now accurately represents the height)

### Background Section Completion (M2 — c8d4edd)

- **Rule:** PTU background creation (Page 13) requires choosing 1 Adept skill, 1 Novice skill, and 3 Pathetic skills. The section completion indicator previously required `hasBackground && skillsWithRanks >= 5`, where the magic number 5 loosely corresponded to the 5 skills modified by a background.
- **Implementation:** Now simplified to just `hasBackground`. The detail string still shows `${skillsWithRanks} skills set` for informational purposes, and validation warnings (already implemented in P1) still flag incorrect skill distributions. The completion indicator is a UX hint, not a hard gate -- the create button is always enabled regardless of completion state.
- **Status:** CORRECT (the magic number removal does not affect rule enforcement; validation warnings remain intact)

### Input Validation — parseOptionalInt (M1 — 8c0279f)

- **Rule:** No PTU rule governs negative age/height/weight input. This is a data integrity fix. Age, height (cm), and weight (kg) are all physical measurements that cannot be negative or zero.
- **Implementation:** `parseOptionalInt()` now returns `null` for `parsed < 1` (zero or negative). This means entering 0 or -5 for age/height/weight is treated as "not provided" rather than stored as an invalid value.
- **Status:** CORRECT (sensible input sanitization)

## Summary

All 7 commits have been reviewed against PTU Core Chapter 2. The primary game logic fixes (H2: weight class, M3: starting money) now match the PTU 1.05 rulebook exactly:

1. **Trainer weight classes** use the correct WC 3/4/5 scale with pound-based boundaries (55-110, 111-220, 221+), replacing the incorrect Pokemon WC 1-6 kg-based scale flagged in rules-review-119.
2. **Starting money** of $5000 for PCs matches PTU Step 9 (Page 17).
3. **Trainer HP formula** (`level * 2 + hp * 3 + 10`) is correct in both QuickCreateForm and the server endpoint.
4. The remaining fixes (cmToFeetInches rounding, parseOptionalInt guard, section completion simplification, QuickCreateForm extraction) are non-PTU-mechanical changes that do not introduce any rule violations.

No errata entries affect any of these mechanics (`errata-2.md` contains no weight class, starting money, or character creation corrections).

## Rulings

- **R1:** Defaulting sub-55-lb trainers to WC 3 is acceptable. PTU does not define a WC for trainers below 55 lbs (the rule states "between 55 and 110 pounds is Weight Class 3"). Since no real human trainer character would weigh under 55 lbs in normal gameplay, WC 3 as a floor is a sound default.
- **R2:** NPCs receiving 0 starting money is a GM tool decision, not a PTU violation. The $5000 recommendation applies to player characters beginning a campaign.

## Verdict

**APPROVED** -- All PTU mechanics are correctly implemented. The weight class fix resolves the sole issue from rules-review-119. No new game logic issues introduced.

## Required Changes

None.
