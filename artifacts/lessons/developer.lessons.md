---
skill: developer
last_analyzed: 2026-02-17T13:00:00
analyzed_by: retrospective-analyst
total_lessons: 4
domains_covered:
  - combat
---

# Lessons: Developer

## Summary
Four lessons spanning the testing pipeline and refactoring audit cycles. L1 addresses incomplete state-transition side effects (faint handler). L2 addresses duplicate code paths — upgraded to recurring after two review cycles caught missed occurrences. L3 and L4 are new patterns from the refactoring audit: pre-existing PTU formula errors in the codebase, and incomplete grepping during deduplication work.

---

## Lesson 1: Implement all PTU rule consequences for state transitions

- **Category:** missing-check
- **Severity:** high
- **Domain:** combat
- **Frequency:** observed
- **First observed:** 2026-02-15 (Tier 1)
- **Status:** active

### Pattern
When a Pokemon's HP reached 0, the faint handler in `applyDamageToEntity()` only appended "Fainted" to the existing `statusConditions` array without clearing pre-existing persistent and volatile statuses. PTU p248 explicitly states that fainting clears all Persistent and Volatile status conditions. The fix was a one-line change: replace `push('Fainted')` with assignment of `['Fainted']`.

### Evidence
- `artifacts/reports/bug-001.md`: Caterpie fainted with `["Burned", "Fainted"]` instead of `["Fainted"]`
- `git diff 72df77b`: `entity.statusConditions = ['Fainted']` replaced `entity.statusConditions.push('Fainted')`
- `git diff 84b9f6c`: Removed redundant `!includes('Fainted')` guard — assignment is idempotent
- PTU p248: "automatically cured of all Persistent and Volatile Status Conditions" on faint

### Recommendation
When implementing a state transition (faint, evolution, capture, etc.), check the PTU rulebook for all side effects of that transition. Fainting clears statuses. Capture changes ownership. Evolution may change type, stats, and abilities. Each side effect must be explicitly implemented, not just the primary effect. Create a checklist of PTU-mandated side effects before coding.

---

## Lesson 2: Identify and update all code paths that perform the same operation

- **Category:** fix-pattern
- **Severity:** high
- **Domain:** combat
- **Frequency:** recurring
- **First observed:** 2026-02-15 (Tier 1)
- **Status:** active

### Pattern
When fixing a bug or deduplicating code, the worker repeatedly misses one or more locations that perform the same operation. This pattern has now occurred in three separate cycles:

1. **bug-001 fix:** After fixing the faint handler in `combatant.service.ts`, the Senior Reviewer discovered that `move.post.ts` performed raw inline HP subtraction, bypassing the fixed damage pipeline entirely.
2. **refactoring-008 (code-review-010):** Sleep was reclassified from Persistent to Volatile in 3 of 4 duplicate condition arrays. The 4th (`restHealing.ts`) was missed — caught by Senior Reviewer.
3. **refactoring-009 (code-review-023):** Phantom conditions (Encored/Taunted/Tormented) were removed from all runtime code, but the capture loop reference doc (`capture.md`) still listed them — caught by Senior Reviewer.

### Evidence
- `git diff b9dfed7`: `move.post.ts` duplicate path fixed after review escalation
- `artifacts/reviews/code-review-010.md`: CRITICAL #1 — `restHealing.ts` still classifies Asleep as Persistent
- `git diff 3842bc7`: restHealing.ts fixed in follow-up commit
- `artifacts/reviews/code-review-023.md`: HIGH #1 — capture loop doc still lists phantom conditions
- `git diff 6a3e239`: capture loop doc cleaned in follow-up commit

### Recommendation
When fixing a bug in a service function or deduplicating constants, search the codebase comprehensively for ALL locations performing the same operation:
1. Grep for the operation's key terms (e.g., `currentHp`, `PERSISTENT`, `Taunted`)
2. Include non-code files: documentation, test artifacts, reference docs
3. Create a checklist of all found locations and mark each as addressed
4. The fix is not complete until ALL locations — code AND documentation — are unified

---

## Lesson 3: Verify PTU formulas against the rulebook, not against existing code or comments

- **Category:** data-lookup
- **Severity:** high
- **Domain:** combat
- **Frequency:** recurring
- **First observed:** 2026-02-17 (refactoring audit)
- **Status:** active

### Pattern
The refactoring audit discovered multiple pre-existing PTU formula errors in the codebase. In each case, the original implementation was written based on assumptions or incomplete understanding of PTU rules, and the errors persisted because no verification against the rulebook was performed:

1. **Type effectiveness (refactoring-019):** Used multiplicative model (`1.5 × 1.5 = 2.25`) instead of PTU's flat lookup (`2.0` for doubly SE). Three incorrect outcomes: doubly SE (2.25 vs 2.0), SE+resist (0.75 vs 1.0), triply SE (3.375 vs 3.0).
2. **Multi-target accuracy (refactoring-018):** Rolled one d20 per target instead of one per move use. PTU 07-combat.md:735-738 says "make **an** Accuracy Roll" (singular). Inflated crit probability from 5% to 14.3% for 3 targets.
3. **Critical hit damage (refactoring-017):** `rollCritical` function didn't double the flat modifier. PTU 07-combat.md:800-804 specifies damage is doubled, which includes the flat modifier.

### Evidence
- `artifacts/refactoring/refactoring-019.md`: Multiplicative type effectiveness — 3 PTU-INCORRECT findings
- `artifacts/refactoring/refactoring-018.md`: Per-target accuracy rolls — PTU-INCORRECT
- `artifacts/refactoring/refactoring-017.md`: Critical hit flat modifier — PTU-INCORRECT
- `git diff 5565b6e`: Type effectiveness replaced with qualitative classification
- `git diff e12a083`: Single accuracy roll per move use
- `git diff db8b0b6`: Double flat modifier in rollCritical

### Recommendation
When implementing or modifying any PTU formula:
1. Find the specific rulebook page and line numbers for the mechanic
2. Verify EVERY term in the formula against the rulebook — do not assume based on code comments, variable names, or "how it usually works in Pokemon"
3. Check for gameplay examples in the rulebook that show worked calculations (e.g., Acid Cone 2 example at 07-combat.md:2206-2218)
4. After implementation, cross-reference the code's output against the rulebook's worked examples
5. Never trust existing code as a source of truth for PTU rules — the code may itself be wrong

---

## Lesson 4: Pre-existing code is not verified code — audit touched files for correctness

- **Category:** process-gap
- **Severity:** medium
- **Domain:** combat
- **Frequency:** recurring
- **First observed:** 2026-02-17 (refactoring audit)
- **Status:** active

### Pattern
The code health audit of the combat domain revealed 6 PTU-INCORRECT tickets in pre-existing code (refactoring-008, 009, 012, 017, 018, 019). None were introduced by the pipeline — they were all latent bugs in code that had been running unchecked since original implementation. The audit process of reading every file in the domain surface area was the first time these formulas were verified against the rulebook.

This means any code that hasn't been through a rules review should be assumed to potentially contain PTU errors.

### Evidence
- `artifacts/refactoring/refactoring-008.md`: Sleep classified as Persistent (pre-existing)
- `artifacts/refactoring/refactoring-009.md`: Phantom conditions Encored/Taunted/Tormented (pre-existing)
- `artifacts/refactoring/refactoring-012.md`: Evasion +6 cap missing (pre-existing)
- `artifacts/refactoring/refactoring-017.md`: Critical hit flat modifier not doubled (pre-existing)
- `artifacts/refactoring/refactoring-018.md`: Per-target accuracy rolls (pre-existing)
- `artifacts/refactoring/refactoring-019.md`: Multiplicative type effectiveness (pre-existing)

### Recommendation
When a refactoring touches a file containing PTU formulas or game logic:
1. Don't limit the review to "did the refactoring introduce regressions" — also verify that the existing logic is correct
2. Treat pre-existing code as unverified until it has passed a rules review
3. File PTU-INCORRECT tickets for any pre-existing errors found, even if they're outside the refactoring's scope
4. The code health audit + rules review pipeline is the primary mechanism for discovering latent bugs
