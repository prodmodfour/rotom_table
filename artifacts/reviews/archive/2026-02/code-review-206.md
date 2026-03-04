---
review_id: code-review-206
review_type: code
reviewer: senior-reviewer
trigger: bug-fix
target_report: ptu-rule-091
domain: character-lifecycle
commits_reviewed:
  - a24aa84
  - bb0cfa3
  - 6cad337
  - 1313cb1
  - c2e589c
  - c76f2cb
files_reviewed:
  - app/constants/trainerClasses.ts
  - app/composables/useCharacterCreation.ts
  - app/components/create/ClassFeatureSection.vue
  - artifacts/tickets/open/ptu-rule/ptu-rule-091.md
  - artifacts/tickets/open/ptu-rule/ptu-rule-115.md (deleted)
  - artifacts/tickets/resolved/ptu-rule/ptu-rule-115.md
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
reviewed_at: 2026-02-28T00:30:00Z
follows_up: code-review-204
---

## Review Scope

Re-review of ptu-rule-091 fix cycle 3. This cycle re-applied ALL code changes that were reverted by the collect-slaves merge at `1ff8d81` (CRITICAL C1 from code-review-204), and additionally addressed M1 from code-review-204 (Researcher field naming: uses 'Artificer' instead of 'Crystal Artifice').

Six commits reviewed:
1. `a24aa84` — fix: remove HP from Stat Ace specializations (CRITICAL-001 from rules-review-176)
2. `bb0cfa3` — fix: replace Researcher specializations with correct Fields of Study (HIGH-001 from rules-review-176, M1 from code-review-204)
3. `6cad337` — fix: remove Martial Artist from branching classes per decree-026 (HIGH-002 from rules-review-176, C1 from code-review-200)
4. `1313cb1` — fix: disable branching class button at max class slots (H1 from code-review-200)
5. `c2e589c` — refactor: remove unused countClassInstances from useCharacterCreation (M2 from code-review-200)
6. `c76f2cb` — chore: update ptu-rule-091 resolution log, clean up ptu-rule-115

### Decree Check

- **decree-022** (branch-class-handling): Colon-space suffix format (`'Type Ace: Fire'`), prefix matching via `hasBaseClass()`, `string[]` data model preserved, UI provides specialization dropdown with already-taken filtering. Per decree-022, all storage, lookup, and UI requirements are met. Compliant.
- **decree-026** (martial-artist-not-branching): `isBranching: true` removed from Martial Artist entry (line 76). `BRANCHING_CLASS_SPECIALIZATIONS` no longer contains a `'Martial Artist'` key. Comment block updated to reference only 4 canonical branching classes with decree-026 citation. Decree-022 preamble was already updated in a prior commit (confirmed in decree file). Compliant.

## Verification: All Prior Review Issues Resolved

### code-review-204 Issues

| Issue | Status | Evidence |
|-------|--------|----------|
| C1 (CRITICAL): Merge reversion of all fix cycle 2 changes | RESOLVED | All 5 code changes re-applied as commits `a24aa84` through `c2e589c`. Verified by reading current HEAD state of all 3 source files. |
| M1 (MEDIUM): Researcher field 'Crystal Artifice' should be 'Artificer' | RESOLVED | `bb0cfa3` uses `'Artificer'` (matches field section header "Artificer Research Field" at PTU Core p.4261). |

### rules-review-176 Issues

| Issue | Status | Evidence |
|-------|--------|----------|
| CRITICAL-001: Stat Ace includes HP | RESOLVED | `a24aa84` removes `'HP'` from Stat Ace. Current list: `['Attack', 'Defense', 'Special Attack', 'Special Defense', 'Speed']`. Matches PTU Core p.2239: "choose Attack, Defense, Special Attack, Special Defense, or Speed." |
| HIGH-001: Researcher uses Education Skills instead of Fields of Study | RESOLVED | `bb0cfa3` replaces 5 Education Skills with 9 canonical Fields of Study: General Research, Apothecary, Artificer, Botany, Chemistry, Climatology, Occultism, Paleontology, Pokemon Caretaking. Verified against PTU field headers at pp.4169-4623. |
| HIGH-002: Martial Artist treated as branching class | RESOLVED | `6cad337` removes `isBranching: true` flag and deletes `BRANCHING_CLASS_SPECIALIZATIONS['Martial Artist']` entry. Per decree-026, Martial Artist is `[Class]` only (PTU Core p.161). |

### code-review-200 Issues

| Issue | Status | Evidence |
|-------|--------|----------|
| C1 (CRITICAL): Martial Artist not [Branch] per PTU | RESOLVED | decree-026 confirms Martial Artist is not branching. `6cad337` removes all branching handling. |
| H1 (HIGH): Branching picker at max slots allows selection but addClass silently fails | RESOLVED | `1313cb1` updates `isClassDisabled()` to check `atMaxSlots` for branching classes that are already selected. When at 4/4 slots, the branching class button is properly disabled. |
| M1 (MEDIUM): Researcher two-field simplification comment | RESOLVED | `bb0cfa3` adds a 3-line comment at lines 112-114 of `trainerClasses.ts`: "PTU grants 2 Fields of Study per Researcher instance (Core p. 4163), but the tool records 1 specialization per class entry -- the GM tracks the second field outside the tool." |
| M2 (MEDIUM): countClassInstances dead code | RESOLVED | `c2e589c` removes `countClassInstances()` function and the now-unused `hasBaseClass` import from `useCharacterCreation.ts`. No orphaned references remain (verified via codebase search). |

### Additional Cleanup

- **ptu-rule-115 duplicate ticket**: `c76f2cb` removes `artifacts/tickets/open/ptu-rule/ptu-rule-115.md`. Only the resolved copy at `artifacts/tickets/resolved/ptu-rule/ptu-rule-115.md` remains. This resolves item 3 from code-review-204.

## Issues

No issues found.

## What Looks Good

1. **Complete issue resolution.** All 9 issues across 3 prior reviews (code-review-200, code-review-204, rules-review-176) are fully addressed. The issue-to-commit mapping is accurate and each commit targets exactly one concern.

2. **Commit granularity is excellent.** 6 focused commits, each a single logical change: Stat Ace HP (1 file), Researcher fields (1 file), Martial Artist removal (1 file), max slots guard (1 file), dead code removal (1 file), docs cleanup (3 files). This is exactly the right granularity per project standards.

3. **Decree compliance is thorough.** Per decree-022: colon-space suffix format, prefix matching via `hasBaseClass()`, `string[]` model preserved, UI provides specialization dropdown. Per decree-026: Martial Artist fully removed from branching handling with no residual references.

4. **PTU data correctness verified against source material.** Stat Ace 5 stats match PTU Core p.2239. Researcher 9 Fields of Study match section headers at pp.4169-4623. The "Artificer" naming choice correctly follows the field section header ("Artificer Research Field", p.4261) rather than the inconsistent summary text ("Crystal Artifice", p.321). The "General Research" naming follows the same pattern ("General Research Field", p.4169) rather than the summary text ("General Knowledge", p.320). Style Expert 5 contest stats and Type Ace 18 types were already correct and remain unchanged.

5. **Immutability preserved throughout.** `addClass` uses spread (`[...form.trainerClasses, className]`), `removeClass` uses filter, stat updates use spread. No mutations.

6. **isClassDisabled logic is correct.** Branching classes are disabled when selected AND at max slots (`isFullySpecialized(cls.name) || atMaxSlots`). Non-branching classes allow toggle-off when selected. Unselected classes are disabled at max slots. This prevents the silent-failure UX bug.

7. **Clean dead code removal.** `countClassInstances` removed along with the `hasBaseClass` import from `useCharacterCreation.ts`. The `hasBaseClass` function itself is still correctly exported from `trainerClasses.ts` and consumed by `ClassFeatureSection.vue`.

8. **File sizes well within limits.** `trainerClasses.ts` (181 lines), `useCharacterCreation.ts` (474 lines), `ClassFeatureSection.vue` (543 lines) -- all under the 800-line maximum.

9. **Helper function design is robust.** `getBaseClassName()` only strips suffixes for known branching classes (line 153: `if (baseName in BRANCHING_CLASS_SPECIALIZATIONS)`), preventing false stripping if a non-branching class name happens to contain `: `. `getSpecialization()` follows the same safe pattern.

## Verdict

**APPROVED**

Fix cycle 3 successfully re-applies all code changes that were reverted by the collect-slaves merge, and additionally addresses the M1 naming issue from code-review-204. All 9 issues across code-review-200, code-review-204, and rules-review-176 are fully resolved. The implementation is correct per PTU RAW, compliant with both decree-022 and decree-026, follows project coding standards, and introduces no new issues.

## Required Changes

None. All prior issues resolved. Ticket ptu-rule-091 is ready to move to resolved status.
