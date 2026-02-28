---
review_id: rules-review-199
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: ptu-rule-124
domain: encounter
commits_reviewed:
  - 41ace5d
  - bebf6b0
  - f0aaf45
mechanics_verified:
  - encounter-budget-guideline
  - xp-calculation-citation
  - significance-multiplier-ranges
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
ptu_refs:
  - core/11-running-the-game.md#Page 473 — Basic Encounter Creation Guidelines
  - core/11-running-the-game.md#Significance Multiplier (p.460 area)
decrees_checked:
  - decree-031 (replace bogus formula with PTU-sourced guidance)
  - decree-030 (cap significance presets at x5)
reviewed_at: 2026-02-28T14:30:00Z
follows_up: null
---

## Mechanics Verified

### Encounter Budget Guideline (avgPokemonLevel x 2 x playerCount)

- **Rule:** "One good guideline here for an everyday encounter is to multiply the average Pokemon Level of your PCs by 2 [...] and use that as a projected baseline Experience drop per player for the encounter." followed by "From there, simply multiply the Experience drop by your number of Trainers. This is the number of Levels you have to work with to build your encounter." (`core/11-running-the-game.md#Page 473`)
- **Implementation:** `calculateEncounterBudget()` in `app/utils/encounterBudget.ts` computes `avgLevel * 2` as `baselinePerPlayer`, then `baselinePerPlayer * players` as `totalBudget`. Formula is unchanged from before.
- **Status:** CORRECT

The formula `avgPokemonLevel * 2 * playerCount` is a faithful implementation of the PTU guideline. Critically, the implementation now correctly frames this as a GM guideline rather than a hard formula, matching the rulebook's advisory tone ("One good guideline here...").

### Citation Accuracy

- **Rule:** The encounter budget guideline is found on Page 473 of PTU Core, within Chapter 11 "Running the Game", under the heading "Basic Encounter Creation Guidelines."
- **Implementation:** Previous citations read "Core p.473" which was technically the correct page number but was flagged as bogus by decree-031. The new citations read "PTU Encounter Creation Guide, Chapter 11" which is accurate — this section is indeed in Chapter 11.
- **Status:** CORRECT

The old "Core p.473" citation was actually pointing to the right page, but decree-031 ordered its replacement because it was presented as a hard formula citation rather than a guideline reference. The new framing as "PTU guideline" with "Encounter Creation Guide, Chapter 11" attribution is more accurate to the advisory nature of the source text. Per decree-031, this approach is correct.

### Significance Multiplier Ranges

- **Rule:** "Insignificant encounters should trend towards the bottom of the spectrum at x1 to x1.5. 'Average' everyday encounters should be about x2 or x3. More significant encounters may range anywhere from x4 to x5 depending on their significance" (`core/11-running-the-game.md#Significance Multiplier`)
- **Implementation:** `SIGNIFICANCE_PRESETS` in `encounterBudget.ts` defines: insignificant (x1-x1.5, default x1), everyday (x2-x3, default x2), significant (x4-x5, default x5). Capped at x5 per decree-030.
- **Status:** CORRECT (verified unchanged, no modifications in these commits)

### XP Calculation Reference

- **Rule:** XP formula lives on page 460, not page 473. The code correctly cites "PTU Core p.460" for the XP calculation steps (total enemy levels, multiply by significance, divide by player count).
- **Implementation:** File header and `calculateEncounterXp()` JSDoc both reference "PTU Core p.460" for XP mechanics.
- **Status:** CORRECT

### Advisory Nature of Budget Formula

- **Rule:** PTU explicitly frames this as advisory: "One good guideline here..." and notes "For very low Level parties with few Pokemon, you'll want to decrease baseline Experience when using this method."
- **Implementation:** The file header now states "This is a GM guideline, not a hard formula. PTU notes it should be decreased for very low-level parties and increased for significant encounters." The UI displays "(PTU guideline)" next to the formula. Difficulty thresholds are explicitly labeled as "app-specific heuristics."
- **Status:** CORRECT

## Summary

The three commits cleanly address decree-031's requirements:

1. **41ace5d** — Replaced all "Core p.473" citations in `encounterBudget.ts` with accurate "PTU Encounter Creation Guide, Chapter 11" references and reframed the formula as advisory guidance. No formula logic changed.

2. **bebf6b0** — Updated two comments in `app/pages/gm/scenes/[id].vue` from "PTU p.473" to "PTU Encounter Creation Guide, Chapter 11". No code logic changed.

3. **f0aaf45** — Added "(PTU guideline)" label to the BudgetGuide formula display in `app/components/habitat/BudgetGuide.vue` with appropriate muted/italic styling. This is a UI-only addition.

All three commits are documentation/citation changes only. The actual encounter budget formula (`avgPokemonLevel * 2 * playerCount`) remains unchanged and is verified correct against the PTU rulebook text on Page 473 of Chapter 11.

## Rulings

1. The formula `avgPokemonLevel * 2 * playerCount` matches PTU RAW from "Basic Encounter Creation Guidelines" (Chapter 11, p.473). No PTU rule violation.

2. The framing as "PTU guideline" rather than a hard formula is accurate to the source text's advisory language.

3. The difficulty thresholds (trivial/easy/balanced/hard/deadly) are correctly identified as app-specific heuristics with no PTU RAW claim. This is appropriate since PTU does not define discrete difficulty tiers.

4. Per decree-031, the bogus "Core p.473" citation format has been fully removed from source code. Zero remaining instances found in `.ts` and `.vue` files.

## Verdict

**APPROVED** — All citations are now accurate, the formula matches PTU RAW, the advisory framing is correct, and decree-031 requirements are fully satisfied.

## Required Changes

None.
