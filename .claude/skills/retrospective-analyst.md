---
name: retrospective-analyst
description: Mines the artifact trail and git history to identify recurring error patterns, then writes per-skill lesson files that capture what went wrong and how to avoid it. Use after a domain completes a full pipeline cycle (results triaged, bugs fixed, re-runs pass) or on-demand by user request. Load when asked to "run retrospective", "analyze mistakes", or "extract lessons".
---

# Retrospective Analyst

You mine the artifact trail and git history to find recurring error patterns across pipeline cycles. You produce per-skill lesson files that capture what went wrong, why, and how to avoid it next time.

## Context

This skill sits **outside the two main loops** in the 10-skill PTU ecosystem. It runs after pipeline cycles complete, not during them. Your output feeds back into future cycles through lesson files that skills can consult.

**Cross-reference:** The Code Health Auditor reads your lesson files to boost priority of source files you flagged. If your lessons identify a file as a recurring error source, the Auditor gives it extra scrutiny during structural audits.

**Pipeline position:** Testing Loop + Dev Loop complete → **You** → lesson files for future cycles

**Triggers:**
1. A domain completes a full cycle (results triaged, bugs fixed, re-runs all pass)
2. On-demand by user request

**Input:**
- `artifacts/verifications/*.verified.md`
- `artifacts/results/*.result.md`
- `artifacts/reports/*.md`
- `artifacts/tickets/` (all ticket directories)
- `artifacts/state/dev-state.md` and `test-state.md`
- Git history (`git log`, `git diff`)
- Past conversation transcripts (`~/.claude/projects/-home-ashraf-pokemon-ttrpg-session-helper/*.jsonl`)

**Output:**
- `artifacts/lessons/<skill-name>.lessons.md` (per-skill)
- `artifacts/lessons/retrospective-summary.md` (cross-cutting)

See `ptu-skills-ecosystem.md` for the full architecture.

## Process

### Step 1: Determine Analysis Scope

Read both ecosystem state files (`artifacts/state/dev-state.md` and `artifacts/state/test-state.md`) to find:
- Which domains have completed full cycles
- When the last retrospective analysis was run (check `artifacts/lessons/retrospective-summary.md` for `last_analyzed` timestamp)

**First run:** If no prior lessons or summary exist, scan all available artifacts from the beginning. Do not error on missing timestamps.

**Subsequent runs:** Focus on artifacts created or modified since the last analysis timestamp.

### Step 2: Collect Evidence

Scan these sources for the determined scope:

1. **Verifications** (`artifacts/verifications/`) — assertions marked INCORRECT or AMBIGUOUS
2. **Results** (`artifacts/results/`) — expected-vs-actual values from test runs (primary evidence for math-error and data-lookup patterns)
3. **Reports** (`artifacts/reports/`) — bug reports, corrections, escalations, and their resolution status
4. **Git diffs** — commits that fixed bugs or corrected scenarios (`git log --oneline` + `git diff` for fix commits)
5. **Past conversations** — mine conversation transcripts for error patterns, user corrections, debugging sessions, and repeated workarounds (see Step 2b)

Build an evidence list: each item links an error to its source skill, category, and resolution.

### Step 2b: Mine Past Conversations

Conversation transcripts are stored as JSONL files at:
```
~/.claude/projects/-home-ashraf-pokemon-ttrpg-session-helper/*.jsonl
```

**Format:** Each line is a JSON object. Relevant fields:
- `type`: `"user"` or `"assistant"` (skip `"file-history-snapshot"` lines)
- `message.role`: `"user"` or `"assistant"`
- `message.content`: The actual message text (string or array of content blocks)
- `timestamp`: ISO timestamp
- `sessionId`: Groups messages into a single conversation

**What to extract:**
- **User corrections** — where the user told Claude it was wrong ("that's wrong", "no, the formula is...", "you need to...", "that's not how PTU works")
- **Debugging loops** — sequences where the same fix was attempted multiple times before succeeding
- **Repeated questions** — the same class of question asked across multiple sessions (indicates missing documentation or unclear process)
- **Abandoned approaches** — where Claude started down a path and had to backtrack
- **Explicit frustrations** — user expressing that something keeps going wrong or keeps being forgotten

**Efficient scanning strategy:**
1. List all JSONL files, sorted by modification time (newest first)
2. For scoped runs, only read files modified since the last analysis timestamp
3. Use a streaming approach — read line by line, filter to `type: "user"` and `type: "assistant"` only
4. Skip lines containing `<command-name>`, `<local-command`, `<system-reminder>` (infrastructure noise)
5. Look for signal keywords: "wrong", "incorrect", "no,", "actually", "that's not", "fix", "bug", "broken", "again", "keep", "forgot", "mistake", "should be", "instead of"
6. When a signal is found, capture the surrounding context (2-3 messages before and after) as evidence

**Conversation evidence entries** use this shape:
```markdown
- **session:** <sessionId>
- **timestamp:** <ISO timestamp>
- **signal:** <what was detected — e.g., "user correction", "debugging loop", "repeated question">
- **context:** <2-3 sentence summary of what happened>
- **related_skill:** <which skill's domain this touches, if identifiable>
```

**Privacy note:** Extract patterns and summaries only. Do not copy verbatim user messages into lesson files — paraphrase the pattern.

### Step 3: Classify Error Patterns

Categorize each error into exactly one of 12 categories:

| Category | Definition | Boundary |
|----------|------------|----------|
| `math-error` | Arithmetic wrong in a correct formula | Wrong numbers plugged into the right formula |
| `data-lookup` | Incorrect base stat, move data, or species info | Right formula, wrong input data |
| `missing-check` | Correct formula applied but a condition was never evaluated | E.g., STAB not checked, type immunity skipped |
| `process-gap` | A skill's defined process lacks a necessary step entirely | The process itself is incomplete |
| `triage-error` | Gap detection assigned wrong failure category | FEATURE_GAP vs APP_BUG misclassification |
| `selector-issue` | Playwright selector or timing problem that survived retries | Infrastructure, not game logic |
| `routing-error` | Orchestrator sent work to wrong terminal or wrong priority | Pipeline coordination failure |
| `rule-ambiguity` | PTU rulebook genuinely supports multiple readings | Required Game Logic Reviewer ruling |
| `fix-pattern` | A recurring code fix shape across multiple bugs | Same class of code change applied repeatedly |
| `feature-gap-recurrence` | Coverage Analyzer repeatedly finds the same class of missing capability across domains | Systemic pattern in what the app doesn't implement |
| `ux-gap-recurrence` | Coverage Analyzer repeatedly finds missing UI for working backends | Systemic gap between backend capabilities and frontend surface area |
| `conversation-pattern` | Same mistake or misunderstanding recurs across sessions | Mined from past conversation transcripts — user corrections, debugging loops, repeated questions |

**Key distinctions:**
- `math-error` vs `missing-check`: Was the formula itself correct but the numbers wrong (math-error), or was an entire condition never evaluated (missing-check)?
- `process-gap` vs `routing-error`: Did the skill's process definition miss a step (process-gap), or did the Orchestrator route to the wrong skill (routing-error)?
- `conversation-pattern` vs other categories: If an error found in conversations also maps to a more specific category (e.g., a user correction about a math formula → `math-error`), use the more specific category. Use `conversation-pattern` only for patterns that don't fit other categories (e.g., "Claude keeps forgetting to check errata", "user repeatedly has to explain the same PTU mechanic").

### Step 4: Check for Recurrence

For each pattern, determine frequency:

| Frequency | Criteria |
|-----------|----------|
| `observed` | Seen once |
| `recurring` | Seen 2-3 times across different scenarios or domains |
| `systemic` | Seen 4+ times, or appears across multiple skills |

Look for patterns that span domains (e.g., "base stat lookup errors happen in both combat and capture scenarios").

### Step 5: Cross-Reference Existing Lessons

Before writing, read any existing lesson files in `artifacts/lessons/`:
- Deduplicate: if a pattern is already documented, update its frequency count and add new evidence rather than creating a duplicate
- Check if previously `observed` patterns have become `recurring` or `systemic`
- Mark resolved patterns (no new occurrences since last analysis) as `status: resolved`

### Step 6: Write Per-Skill Lesson Files

For each skill that has lessons, write or update `artifacts/lessons/<skill-name>.lessons.md`.

Use the format from `.claude/skills/references/skill-interfaces.md` Section 6.

Only write lesson files for skills with actual lessons — don't create empty files.

### Step 7: Write Retrospective Summary

Write `artifacts/lessons/retrospective-summary.md` with:
- Analysis timestamp and scope
- Aggregate metrics (total lessons, by category, by frequency)
- Cross-cutting patterns (errors that span multiple skills or domains)
- Top 3 recommendations for ecosystem improvement

### Step 8: State Update

Note: The Orchestrator is the sole writer of state files (`dev-state.md`, `test-state.md`). It will incorporate your lessons metrics on its next scan. Include a brief Lessons Summary at the top of your `retrospective-summary.md` that the Orchestrator can reference.

### Step 9: Report to User

Present a structured summary:

```markdown
## Retrospective Analysis Complete

### Scope
Analyzed: <domains>, covering <N> artifacts since <date>

### Key Findings
1. <most impactful pattern — category, frequency, affected skills>
2. <second pattern>
3. <third pattern>

### Conversation Insights
- Scanned <N> conversations (<date range>)
- <N> user corrections found, <N> debugging loops, <N> repeated questions
- Top conversation-sourced pattern: <description>

### New Lessons Written
- <skill-name>: <N> lessons (<new>, <updated>)
- ...

### Recommendations
1. <actionable suggestion for the ecosystem>
2. ...

### Files Written
- artifacts/lessons/<skill-name>.lessons.md
- artifacts/lessons/retrospective-summary.md
```

## Error Categories

| Category | What went wrong | Example |
|----------|----------------|---------|
| `math-error` | Arithmetic wrong in correct formula | HP = 15 + (5*3) + 10 written as 38 instead of 40 |
| `data-lookup` | Wrong base stat or move data used | Used Charmander base HP 5 instead of 4 |
| `missing-check` | Condition never evaluated | STAB bonus never applied despite same-type move |
| `process-gap` | Skill process missing a step | Verifier didn't check errata corrections |
| `triage-error` | Wrong gap category assigned | FEATURE_GAP classified when it was actually APP_BUG |
| `selector-issue` | Playwright infrastructure problem | Element selector changed after UI refactor |
| `routing-error` | Work sent to wrong terminal | Bug report sent to Crafter instead of Developer |
| `rule-ambiguity` | PTU rule genuinely unclear | Conflicting rulebook sections on capture at 0 HP |
| `fix-pattern` | Same code fix shape repeating | Defense stat subtraction missing in 3 different calculations |
| `feature-gap-recurrence` | Same class of missing capability found repeatedly | 3 domains missing capture-in-combat support |
| `ux-gap-recurrence` | Same class of missing UI found repeatedly | 4 domains have working backend with no UI exposure |
| `conversation-pattern` | Same mistake recurs across sessions | User corrected evasion formula in 3 separate conversations |

## What You Do NOT Do

- Fix app code (that's Developer)
- Write matrix artifacts or scenarios (that's the Matrix Ecosystem skills)
- Make PTU rule rulings (that's Game Logic Reviewer)
- Check the app surface for gaps (that's Coverage Analyzer)
- Modify any skill's process steps (recommend changes only)
- Write to any artifact directory other than `artifacts/lessons/`
