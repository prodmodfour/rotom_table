---
review_id: rules-review-303
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: ptu-rule-134
domain: combat
commits_reviewed:
  - 8bdb1834
  - 194e78ae
mechanics_verified:
  - faint-condition-clearing
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
ptu_refs:
  - core/07-combat.md#faint
reviewed_at: 2026-03-04T18:30:00Z
follows_up: null
---

## Mechanics Verified

### Faint Condition Clearing
- **Rule:** "When a Pokemon becomes Fainted, they are automatically cured of all Persistent and Volatile Status Conditions." (`core/07-combat.md`, line 1691-1692)
- **Decree:** decree-047 binding point 1: "Other conditions (Stuck, Slowed, Trapped, Tripped, Vulnerable) have `clearsOnFaint: false` as the static default. This matches PTU p.248's explicit mention of only Persistent and Volatile conditions."
- **Implementation:** All 5 Other category combat conditions (Stuck, Slowed, Trapped, Tripped, Vulnerable) now have `clearsOnFaint: false` in `STATUS_CONDITION_DEFS`. The `FAINT_CLEARED_CONDITIONS` array is derived via `.filter(d => d.clearsOnFaint)`, so these 5 conditions are automatically excluded from faint clearing. Each inline comment cites decree-047.
- **Status:** CORRECT

### clearsOnEncounterEnd Preservation
- **Rule:** Per decree-047 binding point 3 and the block comment in the code, `clearsOnEncounterEnd: true` is intentional for combat-context Other conditions.
- **Implementation:** Stuck, Slowed, Trapped, Tripped, and Vulnerable all retain `clearsOnEncounterEnd: true`. Fainted and Dead retain `clearsOnEncounterEnd: false`. Unchanged from pre-patch values.
- **Status:** CORRECT

### Fainted and Dead Conditions
- **Rule:** Fainted should not clear itself on faint. Dead is a terminal state that should not clear on faint.
- **Implementation:** Both `Fainted` and `Dead` retain `clearsOnFaint: false`, unchanged by this patch. These were already correct before.
- **Status:** CORRECT (not changed, confirmed still correct)

### Persistent and Volatile Conditions Still Clear on Faint
- **Rule:** PTU p.248 says Persistent and Volatile conditions clear on faint.
- **Implementation:** All 5 Persistent conditions (Burned, Frozen, Paralyzed, Poisoned, Badly Poisoned) and all 9 Volatile conditions (Asleep, Bad Sleep, Confused, Flinched, Infatuated, Cursed, Disabled, Enraged, Suppressed) retain `clearsOnFaint: true`. The patch only changed the 5 Other combat conditions.
- **Status:** CORRECT (not changed, confirmed still correct)

## Summary

The implementation correctly reverts the 5 Other category combat conditions (Stuck, Slowed, Trapped, Tripped, Vulnerable) from `clearsOnFaint: true` to `clearsOnFaint: false`, matching both RAW (PTU p.248 only mentions Persistent and Volatile) and decree-047's binding point 1. The `FAINT_CLEARED_CONDITIONS` derived array automatically excludes these conditions since it filters on the `clearsOnFaint` flag. The block comment and inline comments properly document decree-047 compliance and note that source-dependent clearing is deferred to refactoring-129.

No other condition definitions were modified. The `clearsOnEncounterEnd: true` values for the 5 combat conditions are preserved as intended.

## Rulings

No new ambiguities discovered. All mechanics align with decree-047 and PTU RAW. No decree-need tickets required.

## Verdict

**APPROVED** -- Zero issues found. The implementation is a clean, minimal correction that restores RAW-compliant behavior per decree-047. The FAINT_CLEARED_CONDITIONS array correctly derives from per-condition flags, so no manual array maintenance was needed.

## Required Changes

None.
