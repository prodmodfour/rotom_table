---
last_analyzed: 2026-02-17T13:00:00
analyzed_by: retrospective-analyst
scope: combat domain (Tier 2 + Tier 1 full cycles) + capture domain (full cycle) + refactoring audit (22 tickets)
---

# Retrospective Summary

## Analysis Scope

- **Domains:** combat (complete), capture (complete)
- **Tiers analyzed:** Tier 2 (19 mechanic validations) + Tier 1 (7 session workflows) + capture (7 scenarios)
- **Artifacts analyzed:** 33 scenarios, 33 results, 7 reports (2 APP_BUG, 5 SCENARIO_BUG), 22 refactoring tickets, 26 code reviews, 21 rules reviews
- **Period:** 2026-02-15 through 2026-02-17
- **New scope since last analysis:** 11 code reviews (016-026), 8 rules reviews (014-021), 12 refactoring tickets (011-022), 45+ git commits
- **Conversations mined:** 20+ sessions (2026-02-15 through 2026-02-17)
- **Previous retrospective:** 2026-02-16T12:00:00

## Aggregate Metrics

| Metric | Value |
|--------|-------|
| Total lessons | 24 |
| Active | 18 |
| Resolved | 3 (SC L1-L3 promoted to permanent process steps) |
| Promote-candidate | 0 |
| New since last analysis | 6 |
| Updated since last analysis | 3 (Dev L2 recurring, SC L4 systemic, Orch L3 new evidence) |
| By category: missing-check | 4 |
| By category: data-lookup | 3 |
| By category: process-gap | 6 |
| By category: fix-pattern | 1 |
| By category: routing-error | 4 |
| By category: conversation-pattern | 0 |
| By frequency: systemic | 2 (non-deterministic APIs, PTU-without-verification) |
| By frequency: recurring | 8 |
| By frequency: observed | 10 |
| Skills with lessons | 7 (scenario-crafter, developer, playtester, scenario-verifier, game-logic-reviewer, orchestrator, senior-reviewer) |
| Skills with clean runs | 3 (gameplay-loop-synthesizer, result-verifier, feature-designer) |

## Error Distribution by Source

| Source | Testing Pipeline | Refactoring Audit | Total |
|--------|-----------------|-------------------|-------|
| Scenarios corrected | 7 | — | 7 |
| App bugs found (testing) | 2 | — | 2 |
| PTU-INCORRECT found (audit) | — | 6 | 6 |
| EXT-DUPLICATE found (audit) | — | 7 | 7 |
| Other code health issues | — | 9 | 9 |
| Code reviews with issues | 2 (CR-010, CR-023) | — | 2 |

## Cross-Cutting Patterns

### Pattern A-C: STAB, Learn Levels, Type Chart (resolved — from previous retro)
All three patterns from the original Tier 2 retrospective remain resolved. Lessons 1-3 were integrated as permanent process steps and successfully applied in all subsequent scenarios across both combat and capture domains.

### Pattern D: Assuming-without-verifying (SYSTEMIC — upgraded)
Previously identified as systemic across Scenario Crafter, Scenario Verifier, and Playtester. Now confirmed with additional evidence:
- Scenario Crafter L4: Upgraded from recurring to systemic after capture-variant-001 (correction-004) showed the same pattern
- Game Logic Reviewer L3: Accepted "acknowledged limitation" framing without checking rulebook — same root cause applied to the reviewer role
- Total instances: 6+ across 4 skills and 3 pipeline cycles

### Pattern E: Playtester silent adaptation (unchanged — recurring)
No new evidence in this cycle. The Playtester has not been invoked for new test runs since the last analysis.

### Pattern F: Duplicate code paths (unchanged — from previous retro)
The initial `move.post.ts` duplicate path issue was addressed. However, the broader pattern of code duplication spawning cascading tickets has become its own new pattern (see Pattern H below).

### Pattern H: Duplication chains spawn cascading tickets (NEW — RECURRING)
Duplicate code creates a chain of cascading fix tickets. The most striking example is the status condition constant:
1. **refactoring-006:** Deduplicated constants in `breather.post.ts`
2. **refactoring-008:** Deduplicated in `captureRate.ts` and `useCapture.ts` — but missed `restHealing.ts`
3. **code-review-010:** Caught the missed `restHealing.ts` instance
4. **refactoring-009:** Removed phantom conditions from 4 files — had to touch 4 instead of 2 because `combatant.service.ts` and `StatusConditionsModal.vue` still had local copies
5. **refactoring-022:** Filed to deduplicate the remaining 2 hardcoded arrays

Similarly, the type chart:
1. **design-testability-001:** Created `damageCalculation.ts` with copied type chart from `useCombat.ts`
2. **refactoring-019:** Fixed multiplicative type effectiveness in BOTH files independently (same bug in both)
3. **refactoring-020:** Filed to consolidate the duplicate type chart into `typeChart.ts`

**Root cause:** Code is copied rather than extracted to a shared location. Each copy diverges independently. Fixing one requires finding and fixing all copies. Each cycle discovers more copies.

### Pattern I: Incomplete grep during deduplication (NEW — RECURRING)
The Developer consistently misses one or more locations when deduplicating or cleaning up code:
- **code-review-010:** 3 of 4 condition arrays fixed, `restHealing.ts` missed
- **code-review-023:** Phantom conditions cleaned from runtime code, capture loop doc missed

Both were caught by the Senior Reviewer. The review gate is working, but the Developer's process should prevent this class of error earlier.

### Pattern J: Pre-existing PTU errors in codebase (NEW — SYSTEMIC)
The refactoring audit of the combat domain discovered 6 PTU-INCORRECT tickets in pre-existing code:
- **refactoring-008:** Sleep classified as Persistent (should be Volatile)
- **refactoring-009:** Phantom conditions Encored/Taunted/Tormented (don't exist in PTU)
- **refactoring-012:** Evasion +6 cap missing at 3 sites
- **refactoring-017:** Critical hit flat modifier not doubled
- **refactoring-018:** Per-target accuracy rolls instead of per-move
- **refactoring-019:** Multiplicative type effectiveness instead of flat lookup

None were introduced by the pipeline — all were latent in the original code. This suggests the original implementation was written without rigorous PTU verification. The code health audit + rules review pipeline is the first systematic check these formulas have received.

### Pattern K: Review system catching real bugs (POSITIVE — CONTINUED)
The Senior Reviewer continues to provide high-value catches:
- **code-review-010:** Caught missed `restHealing.ts` (CRITICAL)
- **code-review-020:** Caught ±3 net-clamp edge case (MEDIUM)
- **code-review-023:** Caught stale capture loop doc + filed refactoring-022 (HIGH)
- **Overall:** 5 of 26 reviews identified actionable issues. 2 required CHANGES_REQUIRED verdicts.

The Game Logic Reviewer performance improved after L1-L3 were recorded:
- **rules-review-014 through -021:** All APPROVED with thorough PTU verification (6-11 mechanics per review)
- **rules-review-020 (type chart):** Verified all 18 attacking types, all NET_EFFECTIVENESS tiers, dual-type interactions — comprehensive

### Pattern L: "Acknowledged limitation" as bug suppression (NEW — OBSERVED)
When the Senior Reviewer framed a PTU incorrectness as an "acknowledged limitation" (code-review-017), the Game Logic Reviewer accepted the framing without checking the rulebook (rules-review-015). The user had to intervene. This is a cross-skill interaction pattern: one skill's informal judgment on PTU mechanics influenced another skill's formal ruling. Addressed in SR L2 and GLR L3.

## Refactoring Audit Results

The code health audit scanned 69 files in the combat domain and filed 22 refactoring tickets:

| Category | Filed | Resolved | Open |
|----------|-------|----------|------|
| EXT-GOD | 1 | 1 | 0 |
| EXT-DUPLICATE | 7 | 6 | 1 |
| EXT-LAYER | 2 | 2 | 0 |
| PTU-INCORRECT | 6 | 5 | 1 |
| LLM-SIZE/MAGIC/INCONSISTENT | 4 | 4 | 0 |
| TEST-STALE | 2 | 1 | 1 |
| TYPE-ERROR | 1 | 1 | 0 |
| RACE-CONDITION | 1 | 1 | 0 |
| DEAD-CODE | 1 | 0 | 1 |
| **Total** | **22** | **18** | **4** |

Open tickets: refactoring-012 (evasion cap, P2), refactoring-013 (stale test, P2), refactoring-014 (type errors, P1 — resolved per git but pipeline state shows open), refactoring-021 (dead code, P2).

## Skill Performance Summary

| Skill | Previous Lessons | New Lessons | Updated | Total | Trend |
|-------|-----------------|-------------|---------|-------|-------|
| Scenario Crafter | 5 | 1 (L6) | 1 (L4 systemic) | 6 | L1-L3 proven effective, new pattern (preserve test purpose) |
| Developer | 2 | 2 (L3, L4) | 1 (L2 recurring) | 4 | Expanded: PTU verification + incomplete grep patterns |
| Playtester | 3 | 1 (L4) | 0 | 4 | New: role boundary lesson from conversation mining |
| Scenario Verifier | 1 | 0 | 0 | 1 | Unchanged — not invoked for new verifications |
| Game Logic Reviewer | 3 | 0 | 0 | 3 | Performance improved post-lessons; L1-L3 were self-filed |
| Orchestrator | 3 | 1 (L4) | 1 (L3 new evidence) | 4 | Temporal-language pattern persists despite corrections |
| Senior Reviewer | 1 | 1 (L2) | 0 | 2 | Strong catch rate; new lesson on PTU framing |

## Lesson Effectiveness

| Lesson | Applied This Cycle? | Effective? |
|--------|-------------------|-----------|
| SC-L1 (STAB) | Yes — capture domain | Yes — 0 errors |
| SC-L2 (Learn levels) | Yes — capture domain | Yes — 0 errors |
| SC-L3 (Type chart) | Yes — capture domain | Yes — 0 errors |
| SC-L4 (Non-deterministic APIs) | Yes — capture domain | Yes — all capture scenarios deterministic |
| SC-L5 (Enforcement boundary) | Yes — capture domain | Yes — all assertions annotated |
| Dev-L2 (All code paths) | Yes — refactoring cycle | Partially — caught by reviews, not by developer |
| GLR-L1 (Enumerated lists) | Yes — rules-review-014+ | Yes — thorough verification in all 8 reviews |
| GLR-L3 (Don't dismiss mechanics) | Yes — rules-review-015+ | Yes — no more "rules don't specify" language |
| Orch-L3 (No temporal ordering) | Tested — session 29aac2ff | No — pattern recurred despite prior lesson |

## Top 5 Recommendations

1. **Add comprehensive-grep requirement to Developer process** (addresses Pattern I). Before declaring a dedup/cleanup refactoring complete, the Developer must provide a grep output showing all occurrences of the target pattern across the entire codebase (including docs, tests, and artifacts), with each occurrence marked as addressed. This would have prevented both code-review-010 and code-review-023 CHANGES_REQUIRED verdicts.

2. **Expand code health audit to new domains immediately** (addresses Pattern J). The combat domain audit revealed 6 PTU-INCORRECT bugs in pre-existing code. Other domains (healing, character-lifecycle, pokemon-lifecycle, scenes, VTT) have never been audited. The same class of latent PTU errors likely exists there. Prioritize domains with the most PTU formula logic.

3. **Formalize "extract, don't copy" as an architectural principle** (addresses Pattern H). When new code needs access to existing logic, it must import from the canonical source — never copy-paste. If the canonical source doesn't exist yet (e.g., type chart was inline in a composable), extract it first, then import from the new location. This prevents the cascading duplication tickets that dominated the refactoring audit.

4. **Orchestrator L3 needs escalation** (Pattern L3 persists). The temporal-language ordering pattern has now been corrected 3 times across 3 separate sessions without being resolved. Consider adding a pre-dispatch checklist that forces the Orchestrator to justify ordering by extensibility impact, with the instruction "never use time-based justifications" as a mandatory process constraint rather than an optional lesson.

5. **Cross-skill PTU boundary enforcement** (addresses Pattern L). The Senior Reviewer should never make informal rulings on PTU mechanics (even framed as "limitations" or "tradeoffs"). Any behavioral note about PTU mechanics should be explicitly flagged for the Game Logic Reviewer with a specific question. Add this as a mandatory routing rule, not just a lesson.

## Positive Observations

- **Lesson system effectiveness proven across 2 domains:** SC L1-L5 were applied in the capture domain with zero errors. The feedback loop from retrospective → lessons → future cycles is functioning.
- **Game Logic Reviewer self-improvement:** Filed its own L1-L3 without needing retrospective intervention. Performance in rules-review-014 through -021 is markedly better than earlier reviews.
- **Review gate continues to catch bugs:** 5 of 26 reviews found actionable issues. The Senior Reviewer's catch rate is consistently high, especially for missed duplicates and edge cases.
- **Refactoring audit ROI:** 22 tickets from one domain scan. 6 were PTU-INCORRECT — real game logic bugs that would have affected gameplay. The audit process justified its cost.
- **Full green maintained:** 134/134 combat tests + 39/39 capture tests = 173/173 passing after all fixes. Zero regressions from the refactoring cycle.
- **Refactoring velocity:** 18 of 22 tickets resolved in one session cycle with zero regressions.
