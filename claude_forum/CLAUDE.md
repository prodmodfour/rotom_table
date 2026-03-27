# Claude Forum

Persistent threads for large multi-session projects. Context gets cleared between sessions — these threads are the surviving record.

## What you can't know without exploring here

- What progress has been made on active projects across prior sessions
- What decisions and rules were established mid-project (e.g. "verify before editing")
- What findings were discovered and whether they were approved or rejected
- What's next in a multi-step workflow

## Development Workflow

Every task follows a 5-phase flow. No phase is skipped unless Ashraf explicitly routes you past it.

**Between tasks, Ashraf decides what's next.** When CURRENT-TASK.md reads "No active task", the developer can be asked for a briefing (what's next per the plan, what's changed, open questions) but must NOT set the next task autonomously. Ashraf reviews the briefing and decides.

```
Phase 0 — TASK BRIEFING (on request, between tasks)
  Read: ring plan, recent thread history, open findings
  Post: what's next per plan, what's changed, tensions or open questions
  DO NOT set CURRENT-TASK.md — Ashraf decides the next task

Phase 1 — CONTEXT GATHER
  Read: PTR vault (rules), documentation vault (design), SE vault (principles), existing code
  Post: what exists, what's missing, what applies

Phase 2 — PLAN (loop until approved)
  Developer posts concrete implementation plan
  Adversarial reviewer reviews plan against vault knowledge
  Developer adjusts plan per findings
  Repeat until plan is approved

Phase 3 — PRE-IMPLEMENTATION DOCUMENTATION
  Write documentation vault notes for any conventions or utility rules
  that should exist before code is written (e.g. "always use applyStatus")

Phase 4 — CODE (loop until approved)
  Developer implements per approved plan
  Adversarial reviewer reviews code against plan + vaults
  Developer fixes per findings
  Repeat until code is approved

Phase 5 — VAULT UPDATE
  Developer updates documentation vault:
  - New design notes for what was built
  - Routing improvements (CLAUDE.md additions, wikilinks)
  - Corrections to notes the implementation proved wrong
  - Deletions of stale notes
```

### Vault interaction per phase

| Vault | Phase 1 | Phase 2 | Phase 3 | Phase 4 | Phase 5 |
|---|---|---|---|---|---|
| **PTR** | Read | Read | — | Read | — |
| **Documentation** | Read | Read | **Write** | Read | **Write** |
| **SE** | Read | Read | — | Read | — |

PTR and SE vaults are read-only during development. Documentation vault is written at two points: pre-implementation conventions (phase 3) and post-implementation design/routing (phase 5).

## Format

Each thread is a folder. Posts are individual markdown files within the folder, named `{nn}-{poster}-{slug}.md` where:
- `{nn}` is the post number within the thread (sequential, 01-based)
- `{poster}` is `developer` or `adversarial-reviewer`
- `{slug}` is a short kebab-case description

### Post type conventions

Post slugs indicate which phase they belong to:

- `{nn}-developer-briefing-{slug}.md` — phase 0 (task briefing)
- `{nn}-developer-context-{slug}.md` — phase 1 (context gather)
- `{nn}-developer-plan-{slug}.md` — phase 2 (implementation plan)
- `{nn}-adversarial-reviewer-plan-review-{slug}.md` — phase 2 (plan review)
- `{nn}-developer-plan-adjust-{slug}.md` — phase 2 (plan adjustment after review, loops back to plan review)
- `{nn}-developer-predocs-{slug}.md` — phase 3 (pre-implementation documentation)
- `{nn}-developer-{slug}.md` — phase 4 (implementation)
- `{nn}-adversarial-reviewer-{slug}.md` — phase 4 (code review)
- `{nn}-developer-vault-update-{slug}.md` — phase 5 (vault update)

The `00-header.md` file in each thread folder contains the thread's preamble — context, gap analysis, principles, scope, etc.

### Pinned posts

Some posts are **pinned** — they must always be read when entering a thread, regardless of how many posts the thread has. A post is pinned by adding `<!-- pinned -->` as its first line (before the `#` title). Pinned posts contain decisions, rules, or reference material that every future session needs — things like established workflow rules, consolidated plans, or summary snapshots that later posts build on top of. When entering a thread, read `00-header.md` and all pinned posts before anything else.

### Current task post

Each thread has a `CURRENT-TASK.md` file that tracks the active task. This is the first thing any agent reads after CLAUDE.md — it tells you what the task is, what phase you're in, and what to do next. The developer updates it at every phase transition.

Format:
```markdown
# Current Task: {short description}

## Task
{what needs to be done}

## Phase
{current phase number and name}

## Status
{what's been completed, what's next}

## Key Posts
{post numbers for context gather, plan, reviews, etc.}
```

When a task is complete, the developer clears CURRENT-TASK.md to just `# No active task`.

Posts record:
- Findings and proposed changes
- Approvals and rejections from Ashraf
- Decisions and rules established during the project
- Progress checkpoints

**Post frequency: max.** Post as things happen — after each finding, decision, approval, or milestone. Don't batch up. Future sessions depend on these posts to reconstruct context.


## Start here

1. Read the thread's `CURRENT-TASK.md` — tells you the active task, current phase, and what to do next.
2. Read the thread's `CLAUDE.md` for thread-specific rules and routing.
3. Read posts referenced in CURRENT-TASK.md's "Key Posts" section.
4. Read further back only if the above isn't sufficient.
