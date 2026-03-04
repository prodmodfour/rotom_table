---
review_id: code-review-223
review_type: code
reviewer: senior-reviewer
trigger: bug-fix
target_report: ptu-rule-124
domain: encounter
commits_reviewed:
  - 41ace5d
  - bebf6b0
  - f0aaf45
files_reviewed:
  - app/utils/encounterBudget.ts
  - app/pages/gm/scenes/[id].vue
  - app/components/habitat/BudgetGuide.vue
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
reviewed_at: 2026-02-28T15:30:00Z
follows_up: null
---

## Review Scope

Reviewing ptu-rule-124: Replace bogus encounter budget formula citation. 3 code commits by slave-3 (plan-20260228-131955). The ticket was sourced from decree-031, which mandated removing the false "Core p.473" citation and replacing it with PTU-sourced encounter design guidance from Chapter 11.

**Decree compliance checked:**
- decree-031 (directly applicable): Mandates removing "Core p.473" citation, replacing with PTU-sourced guidance. Implementation complies -- all "Core p.473" references removed from code, reframed as "PTU Encounter Creation Guide, Chapter 11" / "(PTU guideline)". The formula itself is retained, which is consistent with decree-031's directive to "implement accordingly" after research confirmed the formula exists in Chapter 11.
- decree-030 (contextual): Significance preset cap at x5. Verified still intact in `SIGNIFICANCE_PRESETS` constant (line 83-105). No regression.

**Commits reviewed:**
1. `41ace5d` -- Rewrote file-level JSDoc in `encounterBudget.ts`: replaced "PTU 1.05 Encounter Budget Calculator" / "Core p.473" with "Encounter Budget & XP Calculator" / "PTU Encounter Creation Guide, Chapter 11". Updated all type-level comments and function-level JSDoc to use "guideline" framing. No formula changes.
2. `bebf6b0` -- Updated two comments in `scenes/[id].vue`: budget info computed and player filter comment now reference "PTU Encounter Creation Guide, Chapter 11" instead of "PTU p.473".
3. `f0aaf45` -- Added `(PTU guideline)` inline attribution to the BudgetGuide template formula display, with supporting SCSS for the `__source` span.

## Issues

No issues found.

## What Looks Good

1. **Citation accuracy.** All six instances of the false "Core p.473" citation in the `app/` directory have been replaced with accurate attribution. The developer correctly identified that the formula exists in PTU Chapter 11's Encounter Creation Guide and reframed the attribution accordingly. No remaining `p.473` references exist in the application source code (verified via grep -- remaining references are only in artifact/review/decree files that document the history).

2. **No behavioral changes.** The formula (`avgLevel * 2 * playerCount`) is completely unchanged. Only comments, JSDoc, and a single UI label were modified. This is a pure attribution fix with zero risk of functional regression. Per lesson L1, no behavioral change means no test coverage concern.

3. **Appropriate guideline framing.** The new comments correctly frame the budget formula as a "GM guideline, not a hard formula" (line 11-13 of encounterBudget.ts) and note that difficulty thresholds are "app-specific heuristics" (line 13). This is honest and accurate -- the app uses the PTU guideline as a starting point and layers its own difficulty assessment on top.

4. **UI attribution is unobtrusive.** The `(PTU guideline)` label in BudgetGuide.vue uses `font-size-xs`, muted color, and italic styling, which correctly signals supplementary information without drawing attention away from the formula itself.

5. **Commit granularity is appropriate.** Three commits for three distinct file groups (utility, page, component) -- each producing a working state. The doc-only commits (matrix artifacts, design specs) are correctly separated from code changes.

6. **Type comments updated consistently.** The `BudgetCalcResult` interface comments now say "guideline" and "PTU Encounter Creation Guide" throughout, matching the file header change. No stale "p.473" references remain in the type definitions.

## Verdict

**APPROVED**

Clean, focused citation fix that complies with decree-031. No behavioral changes, no regressions, no stale references remaining in application code. The attribution is now accurate and appropriately framed as a PTU guideline rather than a hard formula.
