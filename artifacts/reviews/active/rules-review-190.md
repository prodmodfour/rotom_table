---
review_id: rules-review-190
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: ptu-rule-114+ptu-rule-116
domain: combat
commits_reviewed:
  - cc1a105
  - e64704f
  - 2dd89fa
  - 5c25cdd
mechanics_verified:
  - assisted-breather-tripped
  - assisted-breather-shift-prompt
  - naturewalk-status-immunity
  - naturewalk-page-references
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
ptu_refs:
  - core/07-combat.md#take-a-breather
  - core/04-trainer-classes.md#naturewalk
  - core/10-indices-and-reference.md#naturewalk
  - errata-2.md#medicine-education
reviewed_at: 2026-02-28T02:30:00Z
follows_up: rules-review-186
---

## Mechanics Verified

### 1. Assisted Breather — Tripped Condition (HIGH-1 fix from rules-review-186)

- **Rule:** "They then both become Tripped and are treated as having 0 Evasion until the end of their next turn." (`core/07-combat.md` p.245, lines 1478-1479)
- **Errata confirmation:** Medicine Education Rank 2 (`errata-2.md` lines 330-332): "They do not Shift and do not become Tripped as part of this action." The explicit Tripped exemption proves the base assisted breather includes Tripped.
- **Implementation:** `breather.post.ts` lines 145-156 now apply BOTH `Tripped` AND `ZeroEvasion` tempConditions in the assisted branch. The code checks for existing conditions before adding (immutable spread pattern) and tracks both in the result object. The standard branch (lines 157-167) continues to apply `Tripped` + `Vulnerable`, preserving the correct distinction between the two variants.
- **Diff verified:** Commit `cc1a105` adds the Tripped tempCondition block at lines 149-152 in the assisted branch, updates the file header comment to read "becomes Tripped with 0 Evasion (via Tripped + ZeroEvasion tempConditions)" and updates the move log note to "ASSISTED: Tripped + Evasion set to 0 (no Vulnerable)". The `combatManeuvers.ts` shortDesc now reads "Tripped + 0 Evasion (no Vulnerable)" matching RAW.
- **Status:** CORRECT. Fix resolves HIGH-1 completely.

### 2. Assisted Breather — Shift Prompt (MEDIUM-1 fix from rules-review-186)

- **Rule:** "both the assisting Trainer and their target must Shift as far away from enemies as possible, using the lower of the two's maximum movement for a single Shift." (`core/07-combat.md` p.245, lines 1475-1477)
- **Implementation:** `useEncounterActions.ts` lines 166-176 now fire the `breatherShift` signal for BOTH `take-a-breather` and `take-a-breather-assisted` maneuver IDs. The previous `if (!assisted)` guard has been removed. The code comment now quotes the RAW text about both combatants shifting with the lower movement speed.
- **Diff verified:** Commit `e64704f` removes the `if (!assisted)` guard (4 lines removed) and replaces it with unconditional assignment of `breatherShift` (4 lines added). The server-side `breather.post.ts` move log note for the assisted variant now also includes "SHIFT REQUIRED: Both must shift away using lower speed."
- **Status:** CORRECT. Fix resolves MEDIUM-1 completely.

### 3. Naturewalk Page References (MEDIUM-2 fix from rules-review-186)

- **Rule references verified:**
  - p.276 (`core/04-trainer-classes.md` line 2800): "Naturewalk: Immunity to Slowed or Stuck in its appropriate Terrains." -- CONFIRMED in rulebook.
  - p.322 (`core/10-indices-and-reference.md` lines 322-325): "Pokemon with Naturewalk treat all listed terrains as Basic Terrain." -- CONFIRMED in rulebook.
  - p.239 (`core/07-combat.md`) discusses type-based immunities (Electric/Paralysis, Fire/Burn, etc.) -- correct reference for `typeStatusImmunity.ts`, NOT for Naturewalk.
- **Implementation:** `combatantCapabilities.ts` section headers and JSDoc comments now reference p.276 and p.322 correctly. All four previous references to "p.239-240" have been replaced. `status.post.ts` line 73 now reads "PTU p.276" instead of "PTU p.239-240". The `typeStatusImmunity.ts` file still correctly references p.239 for type-based immunities (unchanged and correct).
- **Diff verified:** Commit `2dd89fa` changes 7 lines across 2 files, replacing all instances of "p.239-240" with the correct "p.276" and "p.322" references. No references to p.239 remain in the Naturewalk code.
- **Status:** CORRECT. Fix resolves MEDIUM-2 completely.

### 4. Naturewalk Status Immunity (regression check)

- **Rule:** "Naturewalk: Immunity to Slowed or Stuck in its appropriate Terrains." (`core/04-trainer-classes.md` p.276)
- **Implementation:** No changes to the Naturewalk immunity logic itself. `findNaturewalkImmuneStatuses()` in `combatantCapabilities.ts` (lines 300-329) still correctly checks: Pokemon-only, terrain enabled, combatant has position, terrain at position matches Naturewalk via `naturewalkBypassesTerrain()`, filters only `['Slowed', 'Stuck']`. The `status.post.ts` endpoint (lines 76-99) still rejects with 409 and supports GM override per decree-012 pattern.
- **Status:** CORRECT. No regressions.

### 5. ZeroEvasion Lifecycle (regression check)

- **Implementation:** The ZeroEvasion synthetic tempCondition is still correctly recognized by both:
  - `evasionCalculation.ts` line 46: checks `tempConditions` for ZeroEvasion alongside ZERO_EVASION_CONDITIONS
  - `calculate-damage.post.ts` lines 229-233: checks `tempConditions` for ZeroEvasion in the server-side evasion calculation
  - `next-turn.post.ts` line 68: clears `tempConditions = []` at end of turn, correctly expiring ZeroEvasion at "end of their next turn"
  - League battle mode: line 208 clears tempConditions during resolution phase turn reset, not during declaration (lines 65-67)
- **Status:** CORRECT. No regressions. ZeroEvasion lifecycle intact.

### 6. Standard Breather (regression check)

- **Implementation:** The standard breather branch (lines 157-167) is unchanged: applies `Tripped` + `Vulnerable`. Stage reset, temp HP removal, volatile condition curing, decree-005 CS reapplication, and initiative reorder logic are all untouched.
- **Status:** CORRECT. No regressions.

## Decree Compliance

- **decree-005 (status CS auto-tracking):** COMPLIANT. The `reapplyActiveStatusCsEffects()` call at line 134 is untouched. After stage reset to defaults, surviving persistent conditions (Burn/Paralysis/Poison) have their CS effects re-applied with source tracking. No changes to this flow.
- **decree-012 (type immunity enforcement with GM override):** COMPLIANT. The Naturewalk immunity check in `status.post.ts` (lines 76-99) follows the decree-012 pattern: server-side enforcement, 409 rejection, `override: true` parameter for GM bypass. Unchanged by these commits.
- **decree-003 (enemy-occupied rough terrain):** COMPLIANT. The `combatantCapabilities.ts` comment at line 249 still correctly notes Naturewalk does NOT bypass enemy-occupied rough terrain. Unchanged.
- **decree-010 (multi-tag terrain):** COMPLIANT. Naturewalk checks base terrain type via `naturewalkBypassesTerrain()`, not individual rough/slow flags. Unchanged.
- **decree-025 (endpoint cells excluded from rough terrain accuracy penalty):** Not directly relevant to these changes but no conflicts introduced.

## Noted Limitations (Unchanged from rules-review-186)

These were noted in the original review and remain acceptable:

1. **Assister penalties not auto-applied:** The API applies effects only to the target combatant. The assisting trainer's Tripped + ZeroEvasion and action consumption are handled by the GM manually. Consistent with Intercept and other multi-combatant actions.
2. **Command Check not enforced:** The DC 12 Command Check for assisted breather is assumed resolved by the GM. Consistent with other skill-check-gated maneuvers.
3. **Trainer Naturewalk not supported:** `HumanCharacter` lacks a `capabilities` field, so trainers with Survivalist-granted Naturewalk cannot benefit from the immunity check. Acceptable data model limitation.

## Summary

All three issues from rules-review-186 have been correctly resolved:

1. **HIGH-1 (Tripped omission):** Fixed in `cc1a105`. The assisted breather now applies both `Tripped` and `ZeroEvasion` tempConditions, matching RAW ("They then both become Tripped and are treated as having 0 Evasion"). The maneuver description and move log notes have been updated accordingly.

2. **MEDIUM-1 (shift prompt suppression):** Fixed in `e64704f`. The shift prompt now fires for both standard and assisted breather variants. The move log note for the assisted variant now includes the shift requirement. RAW quote accurately cited in the code comment.

3. **MEDIUM-2 (page references):** Fixed in `2dd89fa`. All Naturewalk code comments now correctly cite p.276 (immunity) and p.322 (terrain treatment). The p.239 reference in `typeStatusImmunity.ts` (type-based immunities) was correctly left untouched.

No regressions detected in the original implementation: ZeroEvasion lifecycle, standard breather flow, Naturewalk immunity scope, and decree compliance are all intact.

## Rulings

No new ambiguities discovered. No decree-need tickets required. All mechanics match PTU RAW as verified against the primary rulebook text, and the errata Medicine Education entry provides independent confirmation that the Tripped fix is correct.

## Verdict

**APPROVED** -- All issues from rules-review-186 resolved. No new issues. No regressions.

## Required Changes

None.
