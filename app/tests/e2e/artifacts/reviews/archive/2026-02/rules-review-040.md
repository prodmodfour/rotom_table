---
review_id: rules-review-040
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: ptu-rule-038
domain: healing
commits_reviewed:
  - 8d07eee (fix: remove all AP restoration logic from Pokemon Center endpoint)
mechanics_verified:
  - pokemon-center-ap-restoration
  - pokemon-center-benefit-list-completeness
  - extended-rest-ap-restoration-separation
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
ptu_refs:
  - core/07-combat.md#lines-2009-2014 (extended rest benefits)
  - core/07-combat.md#lines-2015-2028 (pokemon center healing)
reviewed_at: 2026-02-19T00:45:00
---

## Review Scope

Verifying Developer fix for ptu-rule-038 (commit `8d07eee`): removal of all AP restoration logic from the character Pokemon Center endpoint. This ticket was filed by this reviewer during rules-review-039, which found that commit `5198d2e` still conditionally restored drained AP when Pokemon Center healing time exceeded 4 hours.

Files reviewed:
- `app/server/api/characters/[id]/pokemon-center.post.ts` (the fixed file)

Cross-referenced:
- `app/server/api/pokemon/[id]/pokemon-center.post.ts` (Pokemon equivalent — confirmed no AP logic)
- `app/server/api/characters/[id]/extended-rest.post.ts` (confirmed AP restoration lives here exclusively)
- Codebase-wide grep for `drainedAp` in `**/pokemon-center*` — zero hits in code files
- Codebase-wide grep for `meetsExtendedRest` — zero hits in code files (only in artifact docs)

## Mechanics Verified

### 1. Pokemon Center Does Not Restore Drained AP (ptu-rule-038)

- **Rule (Pokemon Centers):** "In a mere hour, Pokemon Centers can heal Trainers and Pokemon back to full health, heal all Status Conditions, and restore the Frequency of Daily-Frequency Moves." (`core/07-combat.md`, lines 2016-2020) — enumerated benefits: full HP, all status conditions, daily move frequency. **Drained AP is not listed.**
- **Rule (Extended Rest):** "Extended Rests are rests that are at least 4 continuous hours long. Extended rests completely remove Persistent Status Conditions, and restore a Trainer's Drained AP." (`core/07-combat.md`, lines 2009-2011) — drained AP is exclusively an Extended Rest benefit.
- **Implementation (before fix, commit `5198d2e`):** `meetsExtendedRest = timeResult.totalTime >= 240`, then `...(meetsExtendedRest ? { drainedAp: 0 } : {})` in DB update and `apRestored = meetsExtendedRest ? character.drainedAp : 0` in response. Conditionally restored AP for long visits.
- **Implementation (after fix, commit `8d07eee`):** All three removed — `meetsExtendedRest` variable gone, conditional `drainedAp: 0` spread gone from DB update, response hardcodes `apRestored: 0`.
- **Status:** CORRECT
- **Rationale:** The fix exactly matches ptu-rule-038's prescribed correction. The DB update no longer touches `drainedAp` at all, so a character's drained AP is preserved through Pokemon Center visits regardless of visit duration. The response field `apRestored: 0` maintains backwards compatibility for any consuming client code without implying AP was restored.

### 2. Pokemon Center Benefit List Completeness

- **Rule:** Pokemon Centers provide: (1) full HP, (2) all status conditions healed, (3) daily move frequency restored, (4) up to 3 injuries healed per day. (`core/07-combat.md`, lines 2015-2028)
- **Implementation:** The endpoint still correctly provides all four listed benefits:
  1. `currentHp: character.maxHp` — full HP (line 67)
  2. `statusConditions: JSON.stringify([])` — all statuses cleared (line 72)
  3. Daily moves — not applicable to human characters (Pokemon endpoint handles this separately and correctly with `move.usedToday = 0`)
  4. `injuries: newInjuries` with `calculatePokemonCenterInjuryHealing()` respecting 3/day cap (lines 48-51, 61)
- **Status:** CORRECT
- **Rationale:** Removing AP logic did not disrupt any of the four enumerated Pokemon Center benefits.

### 3. Extended Rest AP Restoration Remains Intact

- **Rule:** Extended Rests restore drained AP. (`core/07-combat.md`, lines 2009-2011)
- **Implementation:** `extended-rest.post.ts` line 84: `drainedAp: 0 // Restore all drained AP`. This is the correct and sole location for AP restoration.
- **Status:** CORRECT
- **Rationale:** The fix only removed AP logic from the Pokemon Center endpoint. The Extended Rest endpoint, which is the proper PTU-sanctioned path for AP restoration, was not touched and continues to work correctly.

### 4. JSDoc Accuracy

- **Implementation:** JSDoc now reads: "Note: Pokemon Centers do NOT restore drained AP — that is exclusively an Extended Rest benefit" (line 14).
- **Status:** CORRECT
- **Rationale:** Explicit documentation prevents future developers from re-introducing the same error.

## Summary

- Mechanics checked: 4
- Correct: 4
- Incorrect: 0
- Needs review: 0

## Verdict

**APPROVED** — Commit `8d07eee` correctly resolves ptu-rule-038. All AP restoration logic has been removed from the Pokemon Center endpoint. The four enumerated Pokemon Center benefits remain intact. The Extended Rest endpoint (the correct PTU-sanctioned AP restoration path) was not affected. No new issues found. No pre-existing issues observed in the touched code.
