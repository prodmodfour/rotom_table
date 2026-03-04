---
ticket_id: ptu-rule-114
priority: P4
severity: low
status: in-progress
domain: combat
source: rules-review-169 (ptu-rule-099+104 re-review, note on breather mechanics)
created_by: slave-collector (plan-20260227-083657)
created_at: 2026-02-27
---

# ptu-rule-114: Assisted breather variant not implemented

## Summary

PTU p.245 describes an assisted breather variant: when another character uses their Standard Action to assist a Take a Breather action, the assisted character is "treated as having 0 Evasion until the end of their next turn" instead of becoming Tripped and Vulnerable.

The current breather implementation only handles the standard (unassisted) variant, which applies Tripped + Vulnerable.

## PTU Rule Reference

PTU p.245: "If another character uses their Standard Action to help the character Taking a Breather, the character Taking a Breather is instead treated as having 0 Evasion until the end of their next turn, but does not become Tripped."

## Affected Files

- `app/server/api/encounters/[id]/breather.post.ts` — only implements unassisted breather
- `app/composables/useCombat.ts` — client-side breather trigger

## Suggested Fix

Add an `assisted: boolean` parameter to the breather endpoint. When true:
- Skip Tripped + Vulnerable application
- Instead set evasion to 0 until end of next turn (may require a temporary flag on combatant)
- Mark the assisting character's Standard Action as used

## Impact

Low — this is a rarely-used variant of an already-implemented mechanic. The standard breather works correctly.

## Resolution Log

**Commit:** b05eb21 (slave/5-dev-mechanics-p4-20260227-153711)

**Files changed:**
- `app/server/api/encounters/[id]/breather.post.ts` — accept `assisted` body param; apply `ZeroEvasion` synthetic tempCondition instead of Tripped+Vulnerable when assisted
- `app/utils/evasionCalculation.ts` — recognize `ZeroEvasion` tempCondition in zero-evasion check
- `app/server/api/encounters/[id]/calculate-damage.post.ts` — same ZeroEvasion recognition for server-side damage calc
- `app/stores/encounterCombat.ts` — pass `assisted` flag through store action
- `app/composables/useEncounterActions.ts` — handle `take-a-breather-assisted` maneuver ID, skip breather shift prompt for assisted variant
- `app/constants/combatManeuvers.ts` — add "Take a Breather (Assisted)" maneuver entry

**Approach:** The `ZeroEvasion` synthetic tempCondition is automatically cleared at end of next turn (same lifecycle as Tripped/Vulnerable tempConditions). The assistant's Standard Action consumption is left to the GM to manage manually (consistent with how other multi-character interactions work).

### Fix Cycle (rules-review-186 CHANGES_REQUIRED)

**Commit:** 8163830 (slave/3-dev-ptu-rule-114-fix-20260228-010000)
- `app/server/api/encounters/[id]/breather.post.ts` — add Tripped tempCondition to assisted branch alongside ZeroEvasion; update header comment and move log notes
- `app/constants/combatManeuvers.ts` — update assisted breather shortDesc to mention Tripped

**Commit:** aabee84 (slave/3-dev-ptu-rule-114-fix-20260228-010000)
- `app/composables/useEncounterActions.ts` — remove `if (!assisted)` guard so shift prompt fires for both variants
- `app/server/api/encounters/[id]/breather.post.ts` — update assisted breather notes to mention shift requirement
