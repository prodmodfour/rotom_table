# Scaffold Prompt: Claude Forum + Documentation Vault + Easy Paste

Paste this prompt to Claude Code in a new project to scaffold the persistent-thread workflow, a documentation vault, and easy-paste prompts. Replace `{PROJECT_NAME}` and `{OWNER_NAME}` with your values before pasting.

---

## The Prompt

```
Set up a persistent-thread development workflow for this project. Create the following directory structure and files exactly as specified below.

Project name: {PROJECT_NAME}
My name: {OWNER_NAME}

---

### 1. `.claude/context_injections/workflow/git.md`

```markdown
# Git & Attribution Rules

- **Never push commits as Claude** - Do not use Claude or any AI identity as the commit author
- **Never include AI attribution** - Do not add "Co-Authored-By: Claude" or similar AI attribution lines
- **No AI-generated mentions** - Do not mention that code was AI-generated in commits, comments, or documentation
- Commits should appear as if written by the human developer

# Commit Guidelines

## CRITICAL: Small, Frequent Commits

**Commit early and often. Do NOT batch multiple changes into one commit.**

- After completing ANY single logical change, commit immediately
- One file changed? Commit it
- One function added? Commit it
- One bug fixed? Commit it
- Do NOT wait until "everything is done" to commit
- Do NOT combine unrelated changes in one commit

## Other Guidelines

- **Conventional commits** - Use prefixes: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`
- **Descriptive messages** - Include what changed and why
- **Only commit relevant files** - Don't include unrelated changes, test artifacts, or logs
- **Don't wait to be asked** - Proactively commit after completing meaningful work
```

---

### 2. `.claude/context_injections/vaults/zettelkasten.md`

```markdown
# Zettelkasten Rules

- **One idea per file.** If a section describes a distinct entity, area, mechanic, or concept, it gets its own file — no matter how small. Two sentences is a valid atomic note.
- **Index files link, they don't embed.** Overview/parent files should be lists of `[[wikilinks]]` with one-line descriptions. If you're writing more than one line about a linked entity in the parent file, that content belongs in the linked file instead.
- **No duplication across files.** If information exists in an atomic note, other files reference it via wikilink — they don't restate it. When updating a fact, there should be exactly one file to change.
- **Extract before it grows.** When adding content to an existing file, ask: "Is this a new entity?" If yes, create a new file immediately rather than adding a section that will need extraction later.

## Linking

- **Inline first.** When the body text references another concept, link it right there with a `[[wikilink]]`. The surrounding sentence should make clear *why* the connection exists.
- **`## See also` for real but awkward connections.** If a connection is genuine but doesn't fit naturally into the prose — use a small `## See also` section at the bottom. This is not a dumping ground; every entry must be a real relationship you could explain if asked.
- **Link on meaning, not proximity.** Worth linking: shared principles, tensions, constraints, dependencies, contradictions, data flows. Not worth linking: two notes that happen to mention the same topic.
- **Relationships are bidirectional.** When creating a new file, search the vault for notes whose concepts relate to the new one (by keyword, principle, or domain) and update them. New notes must not be orphans, and existing notes must not ignore relevant new arrivals.
```

---

### 3. `.claude/context_injections/vaults/documentation.md`

```markdown
- The Documentation vault is here: vaults/documentation
- This vault records design decisions, architecture, and implementation details for {PROJECT_NAME}.
- It contains design philosophy, architecture decisions, implementation details, and design patterns.
- It does not contain code.
- This vault follows Zettelkasten: .claude/context_injections/vaults/zettelkasten.md
```

---

### 4. `.claude/context_injections/vaults/digesting_documentation.md`

```markdown
# Digesting Notes into the Documentation Vault

- Target vault: `vaults/documentation/`
- You are receiving raw, unstructured notes from the user. Decompose them into atomic Zettelkasten files.
- **Every distinct explanation, implementation detail, behavior, pattern, or architectural fact becomes its own file.** No exceptions — even a single sentence is valid if it's one idea.
- **Never combine two concepts into one file.** If you're unsure whether something is one concept or two, it's two.
- **File names should be short, lowercase, hyphenated noun phrases** that name the concept (e.g., `session-state-machine.md`, `grid-coordinate-system.md`, `data-access-layer.md`).

## Linking

- **Inline first.** When the body text references another concept, use a `[[wikilink]]` right there. The surrounding sentence should make clear *why* the connection exists.
- **`## See also` for real but awkward connections.** If a connection is genuine but doesn't fit naturally into the prose, list it under `## See also`. This is not a dumping ground — every entry must be a relationship you could explain if asked.
- **Link on conceptual relationships, not just topical similarity.** Worth linking: components that call each other, data that flows between systems, patterns that constrain implementations, behaviors that depend on each other.
- **Before writing any new file, search the vault for related notes** by keyword, principle, or domain. Read the matches, then update them to link to the new note where appropriate. New notes must not be orphans, and existing notes must not ignore relevant new arrivals.

## Content

- **Do not restate content from other files.** Link to them instead.
- **Do not editorialize or expand** on what the user wrote. Capture their intent faithfully. Rephrase only for clarity, never for substance.
- After digesting, list every file you created/modified so the user can review.
```

---

### 5. `.claude/context_injections/vaults/maturation.md`

```markdown
### Maturation
- Involves:
	- Asking questions
	- Finding contradictions
	- Sharpening definitions
	- Discovering implicit connections
	- Atomising multi-concept notes
	- Finding gaps — something that is needed but doesn't exist yet
	- Finding undefined references — concepts referenced but never defined
	- Building on interesting areas
	- Tying up loose ends — ideas started but not fully explored
	- Expanding on loose ends — something that could be expanded upon but isn't
	- Thinking of new ideas
	- Reconsidering decisions
	- Construction
	- Destruction
	- Internal alignment
	- Logic extraction — Why is it like this?
	- Attacking logic
	- Updating descendant CLAUDE.mds to improve routing logic for searching
- A vault is mature when its ideas have become precise, consistent, and fully explored.
```

---

### 6. `.claude/context_injections/vaults/maturation_tickets.md`

```markdown
- A maturation ticket is something that needs the decision of a human.
- When something that needs maturing is found in a vault (see .claude/context_injections/vaults/maturation.md), a maturation ticket is made.
    - For documentation vault maturation tickets: .claude/tickets/maturation_tickets/documentation/open

# Ticket Template

` ` `markdown
# Basic Info
    - Topic:
    - Vault:
    - Priority:

# Explanation
    - Point 1
    - Point 2
    - Point 3
    - ... (No limit)

# Relevant Notes

## Note Title
    - Note Body Text


# Possible Decisions
## Safe Decision

## Moderate Decision

## Radical Decision


# Final Decision
` ` `

- Priority is based on how blocking the undecided question is to project progress.
- All relevant notes are reproduced in Relevant Notes, not just one.
- Final Decision is filled by the human.

# Digesting closed tickets
    - Closed maturation tickets (found in .claude/tickets/maturation_tickets/documentation/closed) are to be digested into the documentation vault.
    - Once digested, they are deleted. (See .claude/context_injections/vaults/digesting_documentation.md)
```

---

### 7. `.claude/context_injections/workflow/making_and_expanding_context_injections_or_claude_md.md`

```markdown
# Writing Context Injections & CLAUDE.md Rules

- Keep instructions **short and non-obvious**. Don't document what Claude can infer from existing files, templates, or conventions already in the repo.
- A good rule states a constraint or correction that would otherwise be missed. A bad rule restates what the templates/code already show.
- Prefer 3-5 bullet points over long procedural workflows. If a workflow needs more, link to a separate file.
- Never duplicate information already in CLAUDE.md or templates — reference it instead.
- Context injections are loaded on-demand via `# Rules` references in CLAUDE.md. Only create one when a task category needs guardrails that aren't covered elsewhere.
```

---

### 8. `claude_forum/CLAUDE.md`

```markdown
# Claude Forum

Persistent threads for large multi-session projects. Context gets cleared between sessions — these threads are the surviving record.

## What you can't know without exploring here

- What progress has been made on active projects across prior sessions
- What decisions and rules were established mid-project
- What findings were discovered and whether they were approved or rejected
- What's next in a multi-step workflow

## Development Workflow

Every task follows a 5-phase flow. No phase is skipped unless {OWNER_NAME} explicitly routes you past it.

**Between tasks, {OWNER_NAME} decides what's next.** When CURRENT-TASK.md reads "No active task", the developer can be asked for a briefing (what's next per the plan, what's changed, open questions) but must NOT set the next task autonomously. {OWNER_NAME} reviews the briefing and decides.

` ` `
Phase 0 — TASK BRIEFING (on request, between tasks)
  Read: plan, recent thread history, open findings
  Post: what's next per plan, what's changed, tensions or open questions
  DO NOT set CURRENT-TASK.md — {OWNER_NAME} decides the next task

Phase 1 — CONTEXT GATHER
  Read: documentation vault (design), existing code
  Post: what exists, what's missing, what applies

Phase 2 — PLAN (loop until approved)
  Developer posts concrete implementation plan
  Adversarial reviewer reviews plan against vault knowledge
  Developer adjusts plan per findings
  Repeat until plan is approved

Phase 3 — PRE-IMPLEMENTATION DOCUMENTATION
  Write documentation vault notes for any conventions or utility rules
  that should exist before code is written

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
` ` `

### Vault interaction per phase

| Vault | Phase 1 | Phase 2 | Phase 3 | Phase 4 | Phase 5 |
|---|---|---|---|---|---|
| **Documentation** | Read | Read | **Write** | Read | **Write** |

The documentation vault is written at two points: pre-implementation conventions (phase 3) and post-implementation design/routing (phase 5).

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

Some posts are **pinned** — they must always be read when entering a thread, regardless of how many posts the thread has. A post is pinned by adding `<!-- pinned -->` as its first line (before the `#` title). Pinned posts contain decisions, rules, or reference material that every future session needs. When entering a thread, read `00-header.md` and all pinned posts before anything else.

### Current task post

Each thread has a `CURRENT-TASK.md` file that tracks the active task. This is the first thing any agent reads after CLAUDE.md — it tells you what the task is, what phase you're in, and what to do next. The developer updates it at every phase transition.

Format:
` ` `markdown
# Current Task: {short description}

## Task
{what needs to be done}

## Phase
{current phase number and name}

## Status
{what's been completed, what's next}

## Key Posts
{post numbers for context gather, plan, reviews, etc.}
` ` `

When a task is complete, the developer clears CURRENT-TASK.md to just `# No active task`.

Posts record:
- Findings and proposed changes
- Approvals and rejections from {OWNER_NAME}
- Decisions and rules established during the project
- Progress checkpoints

**Post frequency: max.** Post as things happen — after each finding, decision, approval, or milestone. Don't batch up. Future sessions depend on these posts to reconstruct context.


## Start here

1. Read the thread's `CURRENT-TASK.md` — tells you the active task, current phase, and what to do next.
2. Read the thread's `CLAUDE.md` for thread-specific rules and routing.
3. Read posts referenced in CURRENT-TASK.md's "Key Posts" section.
4. Read further back only if the above isn't sufficient.
```

---

### 9. `vaults/documentation/CLAUDE.md`

```markdown
# Documentation Vault

Atomic notes describing how {PROJECT_NAME} is designed and built. Notes link to each other with `[[wikilinks]]`. Obsidian resolves links by filename regardless of folder.

## What you can't know without exploring here

- How requirements translate into code architecture
- Specific design decisions and trade-offs
- What the app's service layer, store layer, and API layer look like as designed

## Subfolders

- `software-engineering/` — general SE reference notes (design patterns, refactoring techniques, code smells, SOLID). Has its own CLAUDE.md.

## Routing

- Looking up a **SE concept** (pattern, smell, refactoring technique)? Check `software-engineering/`.
- Looking up **how a system is designed for the app**? Search this directory by domain prefix.

## Starting nodes

(Add high-connectivity notes here as the vault grows. These should branch into the major subsystems.)
```

---

### 10. `vaults/documentation/software-engineering/CLAUDE.md`

```markdown
# Software Engineering Reference

~General SE reference notes: design patterns, refactoring techniques, code smells, SOLID principles, architectural styles.

These notes contain **pure knowledge** — pattern definitions, principle explanations, smell descriptions, technique instructions. Application-specific links belong in design notes that reference the SE concepts, not the other way around.

## Routing

- Search by concept name (e.g., `strategy-pattern.md`, `single-responsibility-principle.md`, `primitive-obsession.md`).
```

---

### 11. `easy-paste/prime-developer.md`

```markdown
become an expert:
    1. Software engineering principles
    2. Design Patterns

by reading the documentation vault
```

---

### 12. `easy-paste/prime-reviewer.md`

```markdown
become an expert:
    1. Software Engineering Principles (e.g SOLID)
    2. Design Patterns
    3. Code Smells

by reading the documentation vault
```

---

### 13. `easy-paste/0-dev-briefing.md`

```markdown
You are the developer. Read the thread, plan, and recent history. Brief me on: what's next according to the plan, what's changed since it was written, any tensions or open questions that might affect priority. Do NOT set CURRENT-TASK.md — I'll decide the next task.
```

---

### 14. `easy-paste/1-dev-plan.md`

```markdown
You are the developer. Read CURRENT-TASK.md and the thread. Do phases 1 and 2 for the current task. Post your context gather and plan. Update CURRENT-TASK.md. Commit and push.
```

---

### 15. `easy-paste/2-review-plan.md`

```markdown
You are the adversarial reviewer. Read CURRENT-TASK.md and the developer's plan post. Review the plan. Post your review. Update CURRENT-TASK.md. Commit and push.
```

---

### 16. `easy-paste/2a-dev-plan-adjust.md`

```markdown
You are the developer. Read CURRENT-TASK.md and the plan review findings. Adjust your plan to address them. Post the adjusted plan. Set CURRENT-TASK.md phase to "Phase 2 — Plan (awaiting re-review)". Commit and push.
```

---

### 17. `easy-paste/3-dev-predocs.md`

```markdown
You are the developer. Read CURRENT-TASK.md and your approved plan. Do phase 3 — write pre-implementation documentation notes for any conventions or utility rules that should exist before coding. Post what you wrote. Update CURRENT-TASK.md. Commit and push.
```

---

### 18. `easy-paste/4-dev-code.md`

```markdown
You are the developer. Read CURRENT-TASK.md, your approved plan, and pre-docs. Implement. Post what you did. Update CURRENT-TASK.md. Commit and push.
```

---

### 19. `easy-paste/5-review-code.md`

```markdown
You are the adversarial reviewer. Read CURRENT-TASK.md and the developer's latest implementation post. Review the code. Post your review. Update CURRENT-TASK.md. Commit and push.
```

---

### 20. `easy-paste/6-dev-fix.md`

```markdown
You are the developer. Read CURRENT-TASK.md and the code review findings. Fix them. Post what you fixed. Set CURRENT-TASK.md phase to "Phase 4 — Code (awaiting re-review)". Commit and push.
```

---

### 21. `easy-paste/7-dev-vault-update.md`

```markdown
You are the developer. Read CURRENT-TASK.md. Do phase 5 — update the documentation vault with new design notes, routing improvements, corrections, and deletions. Post what you updated. Clear CURRENT-TASK.md to "# No active task". Commit and push.
```

---

### 22. `.claude/tickets/maturation_tickets/documentation/open/.gitkeep`

Empty file to preserve directory.

### 23. `.claude/tickets/maturation_tickets/documentation/closed/.gitkeep`

Empty file to preserve directory.

---

### 24. `CLAUDE.md` (project root)

```markdown
# {PROJECT_NAME}

# Critical Principles
    - If something is unclear, stop and figure it out. Then update the vault so we're better prepared next time.
    - When looking at or editing files, carefully read each and edit one by one.
    - This repository has terms with explanations in the vaults. Always look for definitions and explanations.
        - If there is no explanation, stop and ask for one. Looking is important even if you feel sure.

# Directory Guide

Every directory with a CLAUDE.md answers three questions: what can't I know without exploring here, what could I learn, and where do I start. Read a directory's CLAUDE.md before exploring its contents.

## `vaults/documentation/` — Design Documentation
- **Can't know without exploring:** How requirements translate into code architecture. Design decisions and trade-offs. Service/store/API layer design.
- **What you'd learn:** The bridge between what the project should do and how the software does it. Contains app-specific design notes and an SE reference subfolder.
- **Start here:** Read `vaults/documentation/CLAUDE.md` for routing. Key hubs will be listed there as the vault grows.

## `claude_forum/` — Persistent Project Threads
- **Can't know without exploring:** Progress, findings, decisions, and open questions for large multi-session projects. Context gets cleared between sessions — the forum is the persistent record. Contains the **5-phase development workflow** that all tasks follow.
- **What you'd learn:** What was done, what was found, what's next, and what rules/decisions were established mid-project. The workflow defines phases (Context Gather -> Plan -> Pre-docs -> Code -> Vault Update) with review loops.
- **Start here:** Read the thread's `CURRENT-TASK.md` for the active task and phase. Read the thread's `CLAUDE.md` for rules. Read `claude_forum/CLAUDE.md` for the workflow definition.
- **Post frequency: max.** Post findings, decisions, approvals, and progress as they happen. Don't batch up.

## `easy-paste/` — Quick-Paste Prompts
- Short prompts to paste into Claude Code for each workflow phase. Named by phase number.

# Rules References

## Vault context injections (loaded on demand)
- When considering how the system will be implemented: .claude/context_injections/vaults/documentation.md
- When editing vaults or Obsidian markdown files: .claude/context_injections/vaults/zettelkasten.md
- When digesting user notes into the documentation vault: .claude/context_injections/vaults/digesting_documentation.md
- When maturing a vault: .claude/context_injections/vaults/maturation.md

## Workflow
- When committing or working with git: .claude/context_injections/workflow/git.md
- When creating or editing CLAUDE.md files or context injections: .claude/context_injections/workflow/making_and_expanding_context_injections_or_claude_md.md
```

---

Now create all of these files. Use exactly the content specified. For the template variables `{PROJECT_NAME}` and `{OWNER_NAME}`, leave them as literal `{PROJECT_NAME}` and `{OWNER_NAME}` — I'll do a find-and-replace myself.

After creating the files, give me a summary of what was created.
```
