---
review_id: rules-review-023
target: refactoring-022
trigger: batch-review
verdict: APPROVED
reviewer: game-logic-reviewer
date: 2026-02-18
commits_reviewed:
  - 258a12a
files_reviewed:
  - app/server/services/combatant.service.ts
  - app/components/encounter/StatusConditionsModal.vue
  - app/constants/statusConditions.ts (canonical source, read-only verification)
mechanics_verified: 1
issues_found: 0
ptu_references:
  - "PTU 1.05 p.246-247: Persistent and Volatile Afflictions"
---

## PTU Rules Verification Report

### Scope

- [x] Reviewed commit 258a12a (refactoring-022: replace hardcoded status arrays with canonical import)
- [x] Cross-referenced code-review-026 (APPROVED by senior-reviewer)
- [x] Verified canonical source `ALL_STATUS_CONDITIONS` against PTU 1.05

### Mechanics Verified

#### Status Condition Taxonomy (identity verification)

- **Rule:** PTU 1.05 p.246-247 enumerates Persistent Afflictions (Burned, Frozen, Paralyzed, Poisoned, Badly Poisoned) and Volatile Afflictions (Bad Sleep/Good Sleep, Confused, Cursed, Disabled, Enraged, Flinched, Infatuated, Suppressed, Tripped, Vulnerable). Additional tracked conditions: Stuck, Slowed, Trapped, Fainted.
- **Implementation:** `ALL_STATUS_CONDITIONS` spreads `PERSISTENT_CONDITIONS` (5) + `VOLATILE_CONDITIONS` (8) + `OTHER_CONDITIONS` (6) = 19 total. Both removed arrays contained the identical 19 elements.
- **Status:** CORRECT — the deduplication is a pure identity replacement. The canonical source was validated in rules-review-005 (initial), rules-review-010 (Sleep reclassification per refactoring-008), and rules-review-021 (phantom conditions removed per refactoring-009).

**Removed arrays (both identical):**
```
'Burned', 'Frozen', 'Paralyzed', 'Poisoned', 'Badly Poisoned',
'Asleep', 'Confused', 'Flinched', 'Infatuated', 'Cursed',
'Disabled', 'Enraged', 'Suppressed',
'Stuck', 'Slowed', 'Trapped', 'Fainted',
'Tripped', 'Vulnerable'
```

**Canonical source (19 elements):** Confirmed identical via read of `constants/statusConditions.ts:7-23`.

### Summary

- Mechanics checked: 1 (status condition array identity)
- Correct: 1
- Incorrect: 0
- Needs review: 0
- Pre-existing issues found: 0

### Verdict

APPROVED — Pure deduplication. The removed arrays are byte-identical to the canonical source. No PTU logic changed. Zero remaining hardcoded status condition arrays in the codebase (confirmed by code-review-026 grep).
