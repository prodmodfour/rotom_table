---
skill: scenario-verifier
last_analyzed: 2026-02-16T00:30:00
analyzed_by: retrospective-analyst
total_lessons: 1
domains_covered:
  - combat
---

# Lessons: Scenario Verifier

## Summary
The Scenario Verifier correctly caught all 5 errors across 4 scenarios in Tier 2, earning a perfect record. However, in Tier 1, it verified all 57 assertions across 7 scenarios as PASS — and 4 of those scenarios subsequently failed when executed. The Verifier validated PTU math correctly but did not verify whether assertions matched the app's actual implementation behavior. The gap: verifying rules is not the same as verifying that the app enforces those rules.

---

## Lesson 1: Cross-reference assertions against app implementation, not just PTU rules

- **Category:** process-gap
- **Severity:** high
- **Domain:** combat
- **Frequency:** recurring
- **First observed:** 2026-02-15 (Tier 1)
- **Status:** active

### Pattern
The Scenario Verifier independently verified all 57 Tier 1 assertions and marked all 7 scenarios as PASS. Four scenarios subsequently failed when executed:
1. **wild-encounter-001** (assertion 2): Verifier confirmed HP = level + baseHp×3 + 10 = 35 — mathematically correct for base stats only. Did not check that `generateAndCreatePokemon` adds random stat points.
2. **template-setup-001** (assertion 3): Same root cause — verified base-stat HP formula without checking template-load implementation.
3. **status-chain-001** (assertion 4): Verifier confirmed Electric types are immune to Paralysis per PTU rules. Did not check that the status API is a GM tool without type enforcement (despite existing test in Tier 2 confirming this).
4. **faint-replacement-001** (assertion 8): Verifier confirmed PTU p248 requires status clearing on faint. The assertion was correct but the app had a bug (bug-001) — this is a legitimate APP_BUG catch, not a Verifier error.

Three of four failures trace to the Verifier validating PTU rules without checking whether the app's implementation matches. Only failure #4 (the genuine APP_BUG) was outside the Verifier's scope to catch.

### Evidence
- `artifacts/pipeline-state.md` Tier 1 Verification Results: "ALL PASS (7/7) — 57/57 assertions correct"
- `artifacts/reports/correction-001.md`: Status API type immunity — existing Tier 2 test contradicts the assertion
- `artifacts/reports/correction-002.md`: Wild-spawn stat randomization — implementation uses `distributeStatPoints()`
- `artifacts/reports/correction-003.md`: Template-load stat randomization — same root cause
- Conversation transcripts (session 1f6ad2fb): Verifier checked base stats, move learn levels, STAB, and damage math correctly but did not query API or read service code

### Recommendation
Add an implementation-check step to the Scenario Verifier process: for each assertion that depends on app behavior (stat values, rule enforcement, API responses), verify not just the PTU math but also whether the app's implementation matches the assumption. Specifically: (a) for assertions with exact expected values from API endpoints, check whether the endpoint produces deterministic or non-deterministic results; (b) for assertions about rule enforcement, check whether the API actually enforces the rule or delegates it to the GM; (c) cross-reference against existing tests in the same domain that may already document the app's behavior. The Verifier should catch the same class of errors it previously caught in Tier 2 (STAB, learn levels) AND this new class (implementation mismatches).
