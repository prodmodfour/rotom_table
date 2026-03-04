---
review_id: code-review-204
review_type: code
reviewer: senior-reviewer
trigger: bug-fix
target_report: ptu-rule-091
domain: character-lifecycle
commits_reviewed:
  - bcfb466
  - 60a1520
  - 93eb8d3
  - 558601f
  - 82dbd2e
  - ed275e5
  - 1ff8d81
files_reviewed:
  - app/constants/trainerClasses.ts
  - app/composables/useCharacterCreation.ts
  - app/components/create/ClassFeatureSection.vue
verdict: CHANGES_REQUIRED
issues_found:
  critical: 1
  high: 0
  medium: 1
reviewed_at: 2026-02-27T22:30:00Z
follows_up: code-review-200
---

## Review Scope

Re-review of ptu-rule-091 fix cycle 2. The developer created 6 commits (`bcfb466` through `ed275e5`) to address ALL issues from code-review-200 (C1 Martial Artist, H1 max slots, M1 Researcher comment, M2 dead code) and rules-review-176 (CRITICAL-001 Stat Ace HP, HIGH-001 Researcher Fields, HIGH-002 Martial Artist). I reviewed the individual fix commits, the code at the post-fix state (`82dbd2e`), AND the current HEAD state (`41c541c`) after the collect-slaves merge (`1ff8d81`).

### Decree Check

- **decree-022** (branch-class-handling): At commit `82dbd2e`, the implementation continues to follow decree-022's approach -- colon-space suffix format, prefix matching via `hasBaseClass()`, `string[]` model preserved. Compliant.
- **decree-026** (martial-artist-not-branching): At commit `93eb8d3`, the developer correctly removed `isBranching: true` from Martial Artist and removed its entry from `BRANCHING_CLASS_SPECIALIZATIONS`. The comment block was updated to note only 4 canonical branching classes. Compliant at time of commit. **However, this fix was reverted by the collect-slaves merge -- see CRITICAL below.**

## Issues

### CRITICAL

#### C1: Collect-slaves merge reverted ALL fix cycle 2 code changes

**Commit:** `1ff8d81` (orchestrator: collect-slaves for plan-20260227-210000)

The collect-slaves merge at `1ff8d81` completely reverted every code change from the 5 fix cycle 2 commits. The current HEAD state of all three files matches the pre-fix-cycle-2 state:

1. **`app/constants/trainerClasses.ts`** (HEAD): Stat Ace still includes `'HP'`. Researcher still uses Education Skills (`['General Ed', 'Medicine Ed', 'Occult Ed', 'Pokemon Ed', 'Technology Ed']`). Martial Artist still has `isBranching: true`. `BRANCHING_CLASS_SPECIALIZATIONS` still contains the fabricated `'Martial Artist'` entry with wrong specializations.
2. **`app/composables/useCharacterCreation.ts`** (HEAD): `countClassInstances` is back (exported dead code). `hasBaseClass` import is back.
3. **`app/components/create/ClassFeatureSection.vue`** (HEAD): `isClassDisabled` reverted to the old logic that does not account for max slots on branching classes.

Verified via `git diff 82dbd2e..1ff8d81 -- app/` which shows the merge undid every fix. The merge brought in changes from other slaves that touched overlapping files, and the conflict resolution restored the pre-fix versions.

**This means none of the issues from code-review-200 or rules-review-176 are actually resolved on master.**

Consequence: The ticket `ptu-rule-115` was marked resolved in `artifacts/tickets/resolved/ptu-rule/ptu-rule-115.md` but the open version was also re-created at `artifacts/tickets/open/ptu-rule/ptu-rule-115.md` by the merge. Both copies exist simultaneously.

**Required fix:** All 5 code changes from fix cycle 2 must be re-applied to master. The commits themselves were correct -- the issue is purely the merge regression.

### MEDIUM

#### M1: Researcher field name uses summary text instead of field header names

**File:** `app/constants/trainerClasses.ts` (at commit `60a1520`)
**Values:** `'General Research'` and `'Crystal Artifice'`

The PTU source contains two different naming conventions for two fields:
- Summary text (p.320): "General Knowledge" and "Crystal Artifice"
- Field headers (pp.140-148): "General Research Field" and "Artificer Research Field"

The developer used "General Research" (which appears at the field header, line 4169) and "Crystal Artifice" (which appears in the summary text, line 321, not in the field header which says "Artificer"). This creates a minor naming inconsistency -- the implementation mixes naming sources. The PTU source material itself is inconsistent between its summary and its section headers.

**Required fix:** Pick one naming source consistently. The field section headers are the canonical source since they are the actual class feature definitions:
- "General Research" (correct -- matches "General Research Field" header)
- "Crystal Artifice" should be "Artificer" or "Crystal Artificer" (matches "Artificer Research Field" header and the feature name "Crystal Artificer")

The other 7 field names (Apothecary, Botany, Chemistry, Climatology, Occultism, Paleontology, Pokemon Caretaking) are consistent between summary and headers.

## What Looks Good

### Fix Cycle 2 Commits (at time of creation)

1. **Complete issue coverage.** All 7 review issues across both reviews were addressed with targeted commits. The issue-to-commit mapping in the ticket's fix cycle 2 resolution log is accurate and thorough.

2. **Commit granularity is excellent.** 6 focused commits, each addressing a single concern: Stat Ace HP removal (1 file), Researcher fields (1 file), Martial Artist removal (1 file), max slots guard (1 file), dead code removal (1 file), docs (2 files). This is exactly the right granularity per project standards.

3. **Immutability preserved.** All reactive state updates in `useCharacterCreation.ts` use spread/filter patterns. No mutations introduced.

4. **File sizes well within limits.** `trainerClasses.ts` (179 lines), `useCharacterCreation.ts` (471 lines), `ClassFeatureSection.vue` (538 lines) -- all under the 800-line maximum.

5. **isClassDisabled logic is correct.** At commit `558601f`, the fix properly checks `atMaxSlots` for branching classes that are already selected, preventing the silent-failure UX bug. Non-branching classes still toggle off normally.

6. **Dead code properly cleaned.** `countClassInstances` removed along with the now-unused `hasBaseClass` import. Clean removal, no orphaned references.

7. **Researcher simplification documented.** The added comment at commit `60a1520` clearly explains that PTU grants two fields per instance but the tool records one, and that the GM tracks the second field outside the tool. This satisfies M1 from code-review-200.

8. **decree-026 properly applied.** At commit `93eb8d3`, Martial Artist's `isBranching: true` was removed, the `BRANCHING_CLASS_SPECIALIZATIONS` entry was deleted, and the comment block was updated to reference only 4 branching classes with a note citing decree-026.

## Verdict

**CHANGES_REQUIRED**

The developer's fix cycle 2 work was correct and thorough -- all issues from code-review-200 and rules-review-176 were properly addressed in commits `bcfb466` through `82dbd2e`. However, the collect-slaves merge (`1ff8d81`) reverted every code change, so the fixes do not exist on HEAD. This is a CRITICAL regression caused by the merge process, not by the developer's work.

## Required Changes

1. **[C1 - CRITICAL] Re-apply all fix cycle 2 code changes to master.** The 5 code commits (`bcfb466`, `60a1520`, `93eb8d3`, `558601f`, `82dbd2e`) must be cherry-picked or re-applied to the current HEAD. The merge at `1ff8d81` reverted all of them. This is the only blocker -- the code itself was correct at time of commit.

2. **[M1 - MEDIUM] Fix Researcher field name: "Crystal Artifice" to "Artificer" or "Crystal Artificer".** The PTU field section header (p.4261 in the core markdown) says "Artificer Research Field" and the feature name is "Crystal Artificer". The summary text says "Crystal Artifice". Use the field header as the canonical source for consistency.

3. **Clean up duplicate ptu-rule-115 ticket.** Both `artifacts/tickets/open/ptu-rule/ptu-rule-115.md` and `artifacts/tickets/resolved/ptu-rule/ptu-rule-115.md` exist. After re-applying the fixes, remove the open copy.
