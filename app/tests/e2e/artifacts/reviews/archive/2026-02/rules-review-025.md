---
review_id: rules-review-025
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: refactoring-013
domain: combat
commits_reviewed:
  - 74916db
mechanics_verified:
  - damage-mode-default
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
ptu_refs:
  - core/07-combat.md#Damage-Roll
reviewed_at: 2026-02-18T04:00:00
---

## Review Scope

Reviewed commit `74916db` which fixes a stale unit test assertion in `settings.test.ts`. The test previously asserted `store.damageMode === 'set'` but `DEFAULT_SETTINGS.damageMode` is `'rolled'` (defined in `types/settings.ts:16`). The fix changes the assertion to reference `DEFAULT_SETTINGS.damageMode` directly.

## Mechanics Verified

### Damage Mode Default

- **Rule:** PTU 1.05 offers two damage calculation modes — rolled damage (dice) and set damage (average values). "Which Chart you use is up to your GM" (`core/07-combat.md`, Damage Roll section). Both are valid; the choice is a table preference, not a rule constraint.
- **Implementation:** `DEFAULT_SETTINGS.damageMode` is `'rolled'` (`types/settings.ts:16`). The store initializes by spreading `DEFAULT_SETTINGS` (`stores/settings.ts:11`). The test now asserts `store.damageMode === DEFAULT_SETTINGS.damageMode` instead of hardcoding `'set'`.
- **Status:** CORRECT
- **Notes:** The default value (`'rolled'`) is a valid PTU option. There is no PTU rule mandating one mode over the other as a default. The fix makes the test resilient to future default changes by referencing the canonical source of truth rather than a hardcoded value.

## Summary

- Mechanics checked: 1
- Correct: 1
- Incorrect: 0
- Needs review: 0

## Rulings

None required. Damage mode selection is explicitly a GM preference per PTU rules.

## Verdict

APPROVED — No PTU mechanics are affected. The fix corrects a stale test assertion to match the canonical default. Both `'set'` and `'rolled'` are valid PTU options; the choice of default is an app decision, not a rules question.

## Required Changes

(none)
