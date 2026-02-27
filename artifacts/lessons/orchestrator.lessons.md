---
skill: orchestrator
last_analyzed: 2026-02-17T13:00:00
analyzed_by: retrospective-analyst
total_lessons: 4
domains_covered:
  - combat
  - capture
---

# Lessons: Orchestrator

## Summary
Four lessons from conversation transcript mining. L1-L2 involve the orchestration layer losing track of pipeline state (stale dispatches, duplicate dispatches). L3 addresses a persistent pattern of temporal-language thinking when ordering work — now upgraded with fresh evidence from the refactoring queue session. L4 is new: routing learnings to the wrong persistence system.

---

## Lesson 1: Verify pipeline state freshness before dispatching work

- **Category:** routing-error
- **Severity:** high
- **Domain:** combat, capture
- **Frequency:** recurring
- **First observed:** 2026-02-16
- **Status:** active

### Pattern
The Orchestrator lost track of completed work and current pipeline position on multiple occasions:

1. **Skipped pipeline steps:** When routing capture-variant-001 work, the Orchestrator jumped ahead to the Playtester without running the Result Verifier first. User corrected: "isn't the result verifier next?" The Orchestrator then over-corrected, not realizing the step had already been completed.

2. **Stale ticket dispatch:** When presenting refactoring tickets for execution, the Orchestrator did not verify whether significant code changes had landed since the tickets were filed. User caught it: "this may all be outdated, as we've done a lot of work after the tickets were opened." A re-audit was required.

3. **Priority inversion:** The Orchestrator deprioritized design-testability-001 P1/P2 in favor of expanding to new domains, despite the design being filed as open work. User corrected: "skipping things is lazy. We should proactively solve problems so that we build on an extensible foundation."

### Evidence
- Conversation session `21c097cb`: User corrected pipeline step skip — "isn't the result verifier next?"
- Conversation session `ef6afcda`: User corrected stale tickets — "this may all be outdated"
- Conversation session `fe157473`: User corrected priority — "why not this design-testability-001 P1/P2?"
- `pipeline-state.md`: Shows completed steps that the Orchestrator missed

### Recommendation
Before dispatching any work to a terminal skill:
1. Re-read `pipeline-state.md` to verify current domain status and last-completed step
2. For correction/fix dispatches, check whether the target scenario/file has been modified since the report was filed (`git log --oneline <file>`)
3. For refactoring tickets, verify the target file's current state still matches the ticket's description
4. When a design spec has open priority tiers (P1/P2), complete those before expanding to new domains

---

## Lesson 2: Track in-progress fixes to prevent duplicate dispatches

- **Category:** routing-error
- **Severity:** medium
- **Domain:** combat
- **Frequency:** observed
- **First observed:** 2026-02-16
- **Status:** active

### Pattern
The same fix (baseSpAttack -> baseSpAtk field name correction in capture-variant-001 spec) was dispatched to two separate sessions within 5 minutes. The second session discovered the fix was already applied. The capture-variant-001 scenario touched 11 sessions total over ~3 hours, partly because the Orchestrator did not track which fixes were already in-flight or completed.

### Evidence
- Conversation sessions `ba0b4d02` (05:39Z) and `1a5a2e2c` (05:44Z): Same fix dispatched to both
- Total capture-variant-001 sessions: 11, spanning correction-004 → user rejection → correction-005 → field fixes → re-verification → re-test
- `artifacts/reports/correction-004.md` → `correction-005.md`: Supersession cycle added to session count

### Recommendation
Before dispatching a fix to a terminal skill:
1. Check git status and recent commits for whether the fix has already been applied
2. If a previous session was dispatched for the same fix, check its completion status before re-dispatching
3. For multi-step corrections (like capture-variant-001's 4-step fix chain), maintain a dispatch log in the pipeline state or orchestrator notes to track which steps are in-flight

---

## Lesson 3: Order work by code health and extensibility impact, not by effort or time

- **Category:** routing-error
- **Severity:** high
- **Domain:** all
- **Frequency:** recurring
- **First observed:** 2026-02-16
- **Status:** active

### Pattern
The Orchestrator repeatedly applied real-time/session thinking to ordering decisions. This has been corrected multiple times across separate sessions but continues to resurface:

1. **"Quick win" bias (session 1):** Ordered refactoring-013 (trivial, 1-line test fix) before refactoring-001 (P0, God store split) because it was fast — framing it as a "warmup." The correct order is by extensibility impact.

2. **Skipping debt for new domains (session 1):** Recommended starting the healing domain while 7 open refactoring tickets existed, including a P0. User corrected: "we do all tickets first."

3. **Time-based framing (session 1):** Used phrases like "quick warmup," "knock this out first," and "trivial fix."

4. **Recurrence (session 2):** With 7 open tickets, recommended refactoring-014 (type errors, small scope) before refactoring-010 (foundational data pipeline, medium scope) — explicitly citing "quickest P1 to close." User corrected: "tickets should be prioritised based on extensibility and code health, not this quick win nonsense."

5. **Recurrence (session 3, 29aac2ff, 2026-02-16):** When presenting refactoring queue, again proposed to skip tickets for new domains. User: "what are you doing? we do all tickets first." Then proposed refactoring-013 before refactoring-001 again. User corrected temporal language: "We aren't [in a real time setting]. Things should be done in the most logical order in terms of extensibility and code health."

### Evidence
- Conversation session `29aac2ff`: Third occurrence of temporal-language ordering. User corrected both the ordering and the framing.
- User instruction: "This project is being built constantly with no breaks. Things should be done in the most logical order in terms of extensibility and code health, not taking time taken into account"
- Previous sessions: two prior corrections on the same pattern

### Recommendation
When ordering work:
1. **Sort by extensibility and dependency impact**, not by effort or speed. A P0 God store split that unblocks all domains comes before a trivial test fix that unblocks nothing.
2. **Clear all open tickets before expanding to new domains.** Unresolved debt compounds — new domain work built on a weak foundation requires rework later.
3. **Never use time-based justifications** ("quick win," "warmup," "knock out first"). This project runs continuously — the only ordering criterion is code health impact.
4. **Consider dependency chains:** refactoring-012 (evasion cap correctness) must precede refactoring-011 (deduplicate builders) because consolidating incorrect code is worse than fixing then consolidating.

---

## Lesson 4: Route learnings to the correct persistence system

- **Category:** routing-error
- **Severity:** medium
- **Domain:** all
- **Frequency:** observed
- **First observed:** 2026-02-16 (session 29aac2ff)
- **Status:** active

### Pattern
When the user instructed the Orchestrator to "learn a lesson," the Orchestrator attempted to write to `MEMORY.md` (the auto-memory system for general project notes) instead of to the pipeline's per-skill lesson files (`artifacts/lessons/<skill-name>.lessons.md`). The user had to interrupt and redirect: "not a memory, we have a lessons system."

The two systems serve different purposes:
- **MEMORY.md:** General project knowledge, architecture decisions, user preferences — persists across all conversations
- **Lesson files:** Specific error patterns and process improvements for pipeline skills — consumed by the retrospective analysis and fed back into future pipeline cycles

### Evidence
- Conversation session `29aac2ff`: User said "learn a lesson." Orchestrator began writing to MEMORY.md. User interrupted: "not a memory, we have a lessons system."
- The Orchestrator then correctly wrote to the orchestrator.lessons.md file

### Recommendation
When the user says "learn a lesson" or "record this pattern" in the context of the pipeline:
1. Write to `artifacts/lessons/<skill-name>.lessons.md` for the affected skill
2. Follow the lesson file format from `skill-interfaces.md` Section 7
3. Only use MEMORY.md for general project knowledge that isn't specific to a pipeline skill's process
4. If unsure which system to use: if the learning is about "how a skill should behave," use lessons; if it's about "what the project structure is," use MEMORY.md
