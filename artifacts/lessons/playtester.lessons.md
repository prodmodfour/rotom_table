---
skill: playtester
last_analyzed: 2026-02-17T13:00:00
analyzed_by: retrospective-analyst
total_lessons: 4
domains_covered:
  - combat
---

# Lessons: Playtester

## Summary
Four lessons span three pipeline cycles. The original two (Tier 2) involve the Playtester silently adapting to API discrepancies instead of filing reports. L3 addresses a flawed investigation methodology: misattributing genuine failures to infrastructure interference. L4 is new from conversation mining: the Playtester attempted to modify application code instead of staying within its role boundary (test specs only).

---

## Lesson 1: File a report when scenario API payloads don't match the actual API

- **Category:** process-gap
- **Severity:** medium
- **Domain:** combat
- **Frequency:** observed
- **First observed:** 2026-02-15
- **Status:** active

### Pattern
The Playtester discovered that the Pokemon creation API requires `baseSpAtk`/`baseSpDef` field names, but scenario files used `baseSpAttack`/`baseSpDefense`. Rather than filing a SCENARIO_BUG correction, the Playtester silently adapted the field names in spec files and noted it only as a "Test Architecture Note" in pipeline-state.md.

### Evidence
- `artifacts/pipeline-state.md` line 170: "Field mapping fix: Pokemon creation API requires `baseSpAtk`/`baseSpDef`"
- No corresponding entry in `artifacts/reports/` — the discovery was never escalated
- Scenario files still contain the wrong field names

### Recommendation
When the Playtester discovers that a scenario's API payload field names don't match what the app accepts, file a SCENARIO_BUG correction report so the Scenario Crafter can update the scenario file. If the API naming itself is inconsistent, also file an APP_BUG report for the Developer. Never silently adapt.

---

## Lesson 2: File a report when scenario assertions can't be verified through the API

- **Category:** process-gap
- **Severity:** medium
- **Domain:** combat
- **Frequency:** observed
- **First observed:** 2026-02-15
- **Status:** active

### Pattern
Several scenarios include evasion-related assertions, but the combatant API response does not include a `specialEvasion` field — evasion is computed client-side. The Playtester replicated the evasion formula in test code, making the assertion self-referential rather than verifying actual app behavior.

### Evidence
- `artifacts/pipeline-state.md` line 171: "No `specialEvasion` on combatant: Evasion is computed client-side"
- No corresponding entry in `artifacts/reports/` — gap in testability was not reported
- Evasion assertions in combat-basic-physical-001, combat-basic-special-001, combat-combat-stages-001 are self-referential

### Recommendation
When a scenario assertion requires data not available in the API response, file an AMBIGUOUS report flagging the testability gap. State which assertion can't be verified end-to-end, what data is missing, and whether the assertion should be removed, converted to a UI check, or the API extended. Never replicate app logic in test code to fill the gap.

---

## Lesson 3: Investigate root cause before attributing failures to infrastructure

- **Category:** process-gap
- **Severity:** medium
- **Domain:** combat
- **Frequency:** observed
- **First observed:** 2026-02-15 (Tier 1)
- **Status:** active

### Pattern
During initial Tier 1 test execution, wild-encounter and template-setup specs failed. The Playtester initially attributed both failures to parallel test interference (multiple workers accessing shared state). It ran tests solo — they sometimes passed, sometimes failed due to random stat variation. The Playtester oscillated between "parallel interference" and "genuine failure" across three run attempts before finally investigating the actual assertion values and identifying non-deterministic stat distribution as the root cause. This wasted at least one full retry cycle.

### Evidence
- Conversation transcripts (session 74348000): Playtester ran tests parallel (fail), solo (pass once, fail once), parallel again (fail) — 3 cycles before root cause identified
- `artifacts/reports/correction-002.md`: Actual root cause was random stat points in `generateAndCreatePokemon`, not parallel interference
- `artifacts/results/combat-workflow-wild-encounter-001.result.md`: Notes confirm previous run failed at assertion 2 with non-deterministic HP

### Recommendation
When a test fails, before retrying with different infrastructure settings (solo vs parallel, increased timeouts), first examine the actual expected-vs-actual values in the failure output. Compare the actual values against the scenario's expected values to determine whether the discrepancy is deterministic (always wrong by the same amount = logic error) or variable (wrong by different amounts across runs = non-deterministic input). Only attribute to infrastructure after ruling out data-level causes.

---

## Lesson 4: Stay within role boundary — fix test specs, not application code

- **Category:** process-gap
- **Severity:** medium
- **Domain:** combat
- **Frequency:** observed
- **First observed:** 2026-02-16 (session ad966148)
- **Status:** active

### Pattern
The Playtester identified pre-existing test failures and proposed fixes that included modifying application code (not just test specs). The user corrected the role boundary: "you're the playtester. You're allowed to fix playwright tests, but not edit the actual code. For that, you write tickets." The Playtester adjusted and correctly fixed only test specs while filing a ticket for the application-level issue (serve endpoint race condition → refactoring-015).

### Evidence
- Conversation session `ad966148`: User corrected Playtester role boundary
- `artifacts/refactoring/refactoring-015.md`: Serve endpoint race condition ticketed by Playtester instead of directly fixed
- The Playtester correctly fixed the test-side race (verify from response instead of follow-up GET) while delegating the app-side fix (Prisma transaction) to the Developer

### Recommendation
The Playtester's scope is limited to:
1. **Write and run Playwright spec files** — translating scenarios into executable tests
2. **Fix test infrastructure issues** — selectors, timing, parallel safety in test code
3. **File tickets for application issues** — when a test failure traces to app code, file an APP_BUG report for the Developer

The Playtester must NOT:
- Modify application source code (`app/server/`, `app/composables/`, `app/utils/`, etc.)
- Modify Prisma schema or migrations
- Modify server endpoints or service files

When in doubt, file a ticket and let the Developer handle the fix.
