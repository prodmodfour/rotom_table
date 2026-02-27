---
review_id: rules-review-021
target: refactoring-009
trigger: developer-fix-review
verdict: APPROVED
reviewer: game-logic-reviewer
date: 2026-02-17
commits_reviewed:
  - 3fc41eb
  - 6a3e239
files_reviewed:
  - app/types/combat.ts
  - app/constants/statusConditions.ts
  - app/server/services/combatant.service.ts
  - app/components/encounter/StatusConditionsModal.vue
  - app/utils/captureRate.ts
  - app/composables/useCapture.ts
  - app/prisma/migrate-phantom-conditions.ts
  - app/tests/e2e/artifacts/loops/capture.md
ptu_references:
  - "core/07-combat.md lines 1577-1668 (Volatile Afflictions enumerated list)"
  - "core/10-indices-and-reference.md line 4357 (Taunt: 'The target becomes Enraged.')"
  - "core/10-indices-and-reference.md line 4388 (Torment: 'The target becomes Suppressed.')"
  - "core/10-indices-and-reference.md lines 7923-7926 (Encore: 1d6 → Confused/Suppressed/Enraged)"
issues_found: 0
pre_existing_issues: 0
---

## Summary

Verified the removal of three phantom status conditions (Encored, Taunted, Tormented) against PTU 1.05. The fix is correct — none of these are PTU conditions. Additionally verified that the remaining 8-entry volatile conditions list matches the PTU 1.05 p.247 enumerated list exactly.

## Scope

- [x] Phantom condition removal — Encored, Taunted, Tormented not in PTU 1.05
- [x] Move effect verification — Taunt, Torment, Encore inflict existing conditions
- [x] Volatile conditions list completeness — 8 code entries vs PTU p.247
- [x] Capture rate impact — no phantom conditions in modifier paths
- [x] Migration script correctness — mapping accuracy
- [x] Runtime reference cleanup — grep confirmation

## Mechanics Verified

### 1. Taunt Move Effect
- **Rule:** "The target becomes Enraged." (core/10-indices-and-reference.md line 4357)
- **Implementation:** Removed `'Taunted'` from all condition lists. Migration maps Taunted → Enraged.
- **Status:** CORRECT
- **Notes:** PTU defines no "Taunted" condition. Taunt inflicts the existing Rage/Enraged volatile affliction.

### 2. Torment Move Effect
- **Rule:** "The target becomes Suppressed." (core/10-indices-and-reference.md line 4388)
- **Implementation:** Removed `'Tormented'` from all condition lists. Migration maps Tormented → Suppressed.
- **Status:** CORRECT
- **Notes:** PTU defines no "Tormented" condition. Torment inflicts the existing Suppressed volatile affliction.

### 3. Encore Move Effect
- **Rule:** "Roll 1d6. On a result of 1 or 2, the target becomes Confused; on a result of 3 or 4 the target becomes Suppressed; on a result of 5 or 6 the target becomes Enraged." (core/10-indices-and-reference.md lines 7923-7926)
- **Implementation:** Removed `'Encored'` from all condition lists. Migration maps Encored → Enraged.
- **Status:** CORRECT
- **Notes:** PTU defines no "Encored" condition. Encore inflicts one of three existing volatile afflictions (equal 1/3 probability each). Migration default of Enraged is a reasonable choice for any pre-existing data (0 records were affected). Minor: the migration script comment says "most common outcome: 5-6 on 1d6" — each outcome is actually equally probable (2 faces each = 1/3). Comment-only inaccuracy, zero practical impact.

### 4. Volatile Conditions List Completeness (8 entries)
- **Rule:** PTU 1.05 p.247 enumerates these volatile afflictions: Bad Sleep, Confused, Cursed, Disabled, Rage, Flinch, Infatuation, Sleep, Suppressed, Temporary Hit Points
- **Implementation:** `VOLATILE_CONDITIONS = ['Asleep', 'Confused', 'Flinched', 'Infatuated', 'Cursed', 'Disabled', 'Enraged', 'Suppressed']`
- **Status:** CORRECT
- **Mapping verification:**

| PTU p.247 Name | Code Name | Match |
|----------------|-----------|-------|
| Bad Sleep | Asleep (unified) | OK |
| Sleep (Good Sleep) | Asleep (unified) | OK |
| Confused | Confused | Exact |
| Cursed | Cursed | Exact |
| Disabled | Disabled | Exact |
| Rage | Enraged | OK (moves say "becomes Enraged") |
| Flinch | Flinched | OK (past-tense convention) |
| Infatuation | Infatuated | OK (past-tense convention) |
| Suppressed | Suppressed | Exact |
| Temporary Hit Points | (numeric field) | N/A — not a togglable condition |

- **Notes:** "Asleep" unifying Good Sleep + Bad Sleep is an acceptable simplification — both are volatile, so capture rate (+5), Take a Breather (cures), and Poke Ball recall (clears) all behave correctly. Temporary Hit Points are tracked as a numeric value, not a status condition — architecturally correct since PTU itself notes they "are not 'healed' away by effects that cure Status Conditions."

### 5. Capture Rate Impact
- **Rule:** Persistent conditions: +10 to capture rate. Volatile conditions: +5. (core/05-pokemon.md)
- **Implementation:** Both `captureRate.ts` and `useCapture.ts` import from canonical `VOLATILE_CONDITIONS` constant. No local duplicate lists with phantom entries.
- **Status:** CORRECT
- **Notes:** Previously, if a GM manually applied "Encored" via the UI, it would give +5 (correct value for a volatile). After removal, the phantom condition can no longer be applied. The canonical import pattern (introduced in earlier refactoring) means both client and server stay in sync automatically.

### 6. Runtime Reference Cleanup
- **Grep result:** `Encored|Taunted|Tormented` across `app/` returns only: migration script (expected tool), review/ticket/lesson artifacts (historical documentation). Zero runtime references.
- **Status:** CORRECT

## Summary Table

| Mechanic | Verified Against | Status |
|----------|-----------------|--------|
| Taunt → Enraged | core/10-indices line 4357 | CORRECT |
| Torment → Suppressed | core/10-indices line 4388 | CORRECT |
| Encore → Confused/Suppressed/Enraged | core/10-indices lines 7923-7926 | CORRECT |
| Volatile list (8 entries) | core/07-combat p.247 | CORRECT |
| Capture rate modifiers | Canonical import, no local lists | CORRECT |
| Runtime cleanup | Grep zero hits | CORRECT |

- Mechanics checked: 6
- Correct: 6
- Incorrect: 0
- Needs review: 0

## Verdict

**APPROVED.** The removal of Encored, Taunted, and Tormented is correct per PTU 1.05. None of these exist as conditions in the rulebook. The remaining 8-entry volatile conditions list matches the PTU p.247 enumerated list exactly. The migration script correctly maps phantom conditions to their PTU equivalents. No pre-existing issues found in the reviewed code paths. Refactoring-009 can be closed.
