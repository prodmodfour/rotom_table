---
name: orchestrator-survey
description: Phase 1 of orchestration. Syncs remote, reads full pipeline state, builds a work queue of ALL actionable dev items (D1-D9), runs D3b design pre-flight, writes work-queue.json, and presents a summary. Does NOT assign slaves or launch anything. Matrix work (M1-M7) is a separate system triggered by the human.
---

# Orchestrator Survey

You are the orchestrator survey. You analyze the full pipeline state and produce a comprehensive work queue of dev items. You do NOT assign slaves, write slave plans, or launch anything — that happens in `/plan_slaves`.

**Lifecycle:** Sync remote → Read state → Build work queue → Write work-queue.json → Present summary → Die

**References:** Read `.claude/skills/references/orchestration-tables.md` for D1-D9 categories and the domain list.

**Matrix work (M1-M7) is a separate system.** The human decides when to run matrix audits. This survey does NOT scan matrix staleness, create M2 tickets, or promote M3/M4 maintenance work.

## Step 0: Sync with Remote

Pull latest changes from origin before reading any state:

```bash
git pull origin master --ff-only
```

If this fails (diverged history), warn the user and abort — do not force-pull or rebase without confirmation.

## Step 0b: Refresh Pipeline State

Before reading any state, reconcile the artifact ecosystem so the survey works from ground truth — not stale caches. This step fixes the drift that accumulates between collections.

**This step is mechanical housekeeping. Skip analysis — just reconcile and move on.**

### 0b-1. Reconcile Ticket Locations

Cross-reference ticket files against review verdicts to find misplaced tickets:

1. **Scan `artifacts/reviews/active/`** and **`artifacts/reviews/archive/`** (all subdirectories) — build a map of `{target_ticket → latest_verdict}` (use `ticket_id` or `target_report` frontmatter). For tickets with multiple reviews, the highest-numbered review_id wins.

2. **For each ticket in `artifacts/tickets/open/`** (all category subdirectories):
   - If the ticket has an `APPROVED` or `PASS` latest verdict (and no subsequent `CHANGES_REQUIRED`) → move to `artifacts/tickets/resolved/<category>/`
   - If the ticket has a `CHANGES_REQUIRED` review → move to `artifacts/tickets/in-progress/<category>/`

3. **For each ticket in `artifacts/tickets/in-progress/`**:
   - If the ticket has an `APPROVED` or `PASS` latest verdict → move to `artifacts/tickets/resolved/<category>/`

4. **Check for decree-need tickets resolved by decrees:**
   - Read `decrees/` directory for decree files with `resolves:` or `decree_need:` frontmatter
   - If a decree-need ticket in `open/decree/` is resolved by an active decree → move to `resolved/decree/`

```bash
mkdir -p artifacts/tickets/resolved/{bug,ptu-rule,feature,ux,decree,refactoring,docs}
# Then mv commands for each misplaced ticket
```

### 0b-2. Archive Completed Reviews

Move reviews from `active/` to `archive/` when their work is done:

1. **APPROVED/PASS reviews** whose target ticket is now in `resolved/` → move to `archive/YYYY-MM/` (based on `reviewed_at` date)
2. **Any verdict** whose target ticket is in `resolved/` → move to `archive/YYYY-MM/`

**Never archive** reviews whose target is still in `open/` or `in-progress/`.

```bash
mkdir -p artifacts/reviews/archive/YYYY-MM
# Then mv commands for each stale review
```

### 0b-3. Regenerate Artifact Indexes

```bash
node scripts/regenerate-artifact-indexes.mjs
```

This rebuilds all `_index.md` files from the (now-reconciled) filesystem.

### 0b-4. Reconcile dev-state.md

Read `artifacts/state/dev-state.md` and fix it to match filesystem reality:

1. **Remove rows for resolved tickets** — any ticket ID that now lives in `tickets/resolved/` should be removed from the Open Tickets tables
2. **Fix status mismatches** — if a ticket is in `in-progress/` but dev-state says "open" (or vice versa), fix the status column
3. **Update Code Health counts** — recount open tickets by priority from the filesystem, update the table
4. **Update `last_updated` and `updated_by`** frontmatter

Do NOT rewrite the Active Developer Work or session history sections — those are historical records. Only fix the ticket tables and counts.

### 0b-5. Commit Refreshed State

If any files changed (tickets moved, reviews archived, indexes regenerated, dev-state fixed):

```bash
git add artifacts/ decrees/_index.md
git commit -m "chore: refresh pipeline state before survey"
```

If nothing changed, skip the commit.

**Report a one-line summary** of what was cleaned up:
```
Refreshed state: moved N tickets to resolved, archived M reviews, fixed K dev-state rows.
```

If nothing needed fixing: `Pipeline state is fresh — no cleanup needed.`

## Step 1: Read Coordination State

### 1a. Check for Existing Plan

Check if `.worktrees/slave-plan.json` exists:
- If it exists, read it and warn the user: "An existing slave plan exists from <created_at>. Options: (1) overwrite with new plan, (2) abort."
- If `.worktrees/slave-plan.partial.json` exists, warn: "A partial plan exists from a previous run with failures."

### 1b. Check Active Slaves

Scan `.worktrees/slave-status/` for status JSON files. For each:
1. Read `status` field
2. If `"running"` — check if process is still alive (if `pid` present, `kill -0 <pid>`)
3. Report active, completed, and failed slaves

### 1c. Read Pipeline State

Read both ecosystem state files:
```
artifacts/state/dev-state.md
artifacts/state/test-state.md
```

If either doesn't exist, the ecosystem is uninitialized.

### 1d. Read Artifact Indexes (Preferred) or Scan Directories (Fallback)

**Preferred path — read `_index.md` files:**

If index files exist, read them for a fast summary instead of scanning hundreds of individual files:

1. `artifacts/_index.md` — global open work counts, active reviews, open tickets by priority
2. `artifacts/tickets/_index.md` — open/in-progress tickets with ID, category, priority, domain
3. `artifacts/reviews/_index.md` — active reviews (CHANGES_REQUIRED/FAIL), recent approvals
4. `artifacts/designs/_index.md` — design status, tier completion
5. `decrees/_index.md` — active decrees by domain

Record raw data from these indexes. Do NOT analyze or filter yet — analysis happens in Step 2.

**Only scan individual files when** you need the full file content (e.g., reading a ticket body for template data) or when an `_index.md` file is missing/stale.

**Fallback path — scan directories directly:**

If `_index.md` files don't exist, fall back to scanning directories:
- `artifacts/tickets/open/` — scan all subdirectories (`bug/`, `ptu-rule/`, `feature/`, `ux/`, `decree/`)
- `artifacts/tickets/in-progress/` — scan all subdirectories
- `artifacts/refactoring/`
- `artifacts/reviews/active/`
- `artifacts/designs/`
- `artifacts/lessons/`
- `decrees/`

### 1e. Scan Decree-Need Tickets and Active Decrees

Read `decrees/_index.md` for active decrees. Read `artifacts/tickets/_index.md` for open decree-need tickets (check "Open Decree-Needs" section).

If indexes are missing, fall back to scanning `artifacts/tickets/open/decree/` for open decree-needs and `decrees/` for `status: active`.

Index decrees by domain for later template data gathering.

Report open decree-need tickets: "N decree-need tickets await human ruling. Run `/address_design_decrees` to unblock."

**Never assign decree-need tickets to slaves.** They require human decision-making.

## Step 2: Build Full Work Queue

**CRITICAL: Your work queue MUST include EVERY actionable dev item — every open ticket, every in-progress ticket with CHANGES_REQUIRED reviews, and every pending review. Missing items = broken plan = wasted parallelism. Scan ALL sources from Step 1, not just the first few.**

### 2a. Categorize All Work Items

Walk through the raw data from Step 1 and tag each item with its category using the D1-D9 table from `references/orchestration-tables.md`. Only dev categories (D1-D9) — matrix work (M1-M7) is excluded.

### 2b. Sort by Priority

**P-level (P0-P4) is the primary sort key.** Category (D1-D9) only determines agent type, NOT ordering.

**Developer assignment order:**
1. **Escalated CHANGES_REQUIRED** — only if review found CRITICAL severity correctness bugs
2. **Highest P-level actionable ticket** — P0 > P1 > P2 > P3 > P4, regardless of category
3. **Within same P-level**, prefer: fix cycles (D2) > open tickets > designs > refactoring
4. **Within same P-level and category**, prefer: extensibility impact > scope size

**Reviewer assignment (always parallel with dev work):**
- Committed fixes without reviews → reviewer slaves every plan
- Re-reviews after CHANGES_REQUIRED fixes → reviewer slaves every plan
- Reviews NEVER block or delay developer assignments

### 2c. D3b: Design Pre-Flight Validation (Inline)

When a design has `status: complete`, run a pre-flight check **inline during Step 2** (not as a slave). This takes ~2 minutes and prevents mid-implementation blockers.

**1. Dependency Map** — Which other domains/models does this design touch?
- Read the design spec's `affected_files`, `new_files`, Data Model Changes, and API Changes sections
- Cross-reference against `references/app-surface.md` to identify domain overlaps
- If the design touches files owned by 2+ domains, flag as "cross-domain" in the plan summary
- If the design adds/changes Prisma models, note "schema migration required"

**2. Open Questions** — Are there PTU rule ambiguities or UX decisions that need decrees?
- Read the design spec's "PTU Rule Questions" and "Questions for Senior Reviewer" sections
- Check `decrees/_index.md` for existing rulings that might apply
- If unresolved ambiguities remain, create `decree-need` tickets and leave status as `complete` (do NOT promote to `validated`)
- Report: "Design <id> blocked on N open questions — run `/address_design_decrees`"

**On pass:** Update the design's `_index.md` status from `complete` → `validated`. The design enters the D7 queue in this or the next plan cycle.

**On fail (open questions found):** Leave status as `complete`, create decree-need tickets, report the blockers. The design stays out of D7 until questions are resolved and the next plan re-runs D3b.

### 2d. Dependency Hints

For each work item, enrich with lightweight dependency data. These are hints for the planner — not a full DAG.

**1. `affected_files`** — Extract from the ticket's "Affected Files" or "Files" frontmatter/section. If the ticket has no such section, leave as an empty list. Do NOT scan the codebase to discover files — just use what the ticket already says.

**2. `subsumes`** — If completing item A would make item B unnecessary, add B's target ID to A's `subsumes` list. Common patterns:
- File extraction refactoring (e.g., "extract X from Y.ts") subsumes a file-size-limit ticket for Y.ts
- A feature ticket that replaces a component subsumes a bug ticket for that same component
- Only flag obvious cases visible from ticket descriptions. Do not speculate.

**3. `related_to`** — If two items are potential duplicates or touch the same affected file(s), link them bidirectionally. Common patterns:
- Ticket description explicitly mentions another ticket ID (e.g., "possible dup of ux-017")
- Two items share an `affected_files` entry (after resolving both)
- Same domain alone is NOT sufficient — there must be a concrete file or description signal.

All three fields are optional lists (default `[]`). Most items will only have `affected_files`.

### 2e. Emit Work Queue

Collect every actionable dev item into a flat list with: `{priority, category, target, agent_types, launch_mode, description, domain, affected_files, subsumes, related_to}`.

**Completeness check — verify you have not missed items:**
- Count open tickets from indexes. Count items in your queue tagged as open tickets. These MUST match.
- Count CHANGES_REQUIRED reviews from indexes. Count D2 items in your queue. These MUST match.
- Count pending reviews (D6). Count reviewer items in your queue. These MUST match.
- If any count is off, re-scan the source you missed.

**Dependency hint check:**
- Every item with `subsumes` targets must reference items that actually exist in the queue.
- Every `related_to` link should be bidirectional (if A relates to B, B relates to A).

## Step 3: Write work-queue.json

Write `.worktrees/work-queue.json` with this schema:

```json
{
  "survey_id": "survey-<unix-timestamp>",
  "created_at": "<ISO>",
  "created_from_commit": "<master HEAD SHA>",
  "items": [
    { "priority": "P0", "category": "D1", "target": "bug-001",
      "agent_types": ["developer"], "launch_mode": "single",
      "description": "...", "domain": "capture",
      "affected_files": ["app/server/api/capture/attempt.post.ts"],
      "subsumes": [], "related_to": [] }
  ],
  "summary": {
    "total_items": 5,
    "by_category": {"D1": 1, "D2": 2},
    "decree_needs_pending": 2,
    "d3b_validated": 1
  }
}
```

Ensure the `.worktrees/` directory exists before writing.

## Step 4: Present Summary

Show the work queue to the user:

```markdown
## Survey Complete: survey-<id>

### Work Queue (N items)

| # | Priority | Category | Target | Agent Type | Domain | Description |
|---|----------|----------|--------|------------|--------|-------------|
| 1 | P0 | D1 | bug-042 | developer | combat | Critical damage calc bug |
| 2 | P1 | D2 | ptu-rule-079 | developer | capture | Fix cycle (CHANGES_REQUIRED) |
| 3 | P1 | D6 | ptu-rule-058 | reviewers | capture | Needs code + rules review |

### Summary
- **Total items:** N
- **By category:** D1: 1, D2: 2, D6: 1
- **D3b designs validated:** 1
- **Decree-needs pending:** 2 (run `/address_design_decrees`)

### Next Step
Run `/plan_slaves` to assign work to parallel slaves.
```

**Then die.** This session produced `work-queue.json` for the planner to consume.

## What You Do NOT Do

- Assign work to slaves (planner does that)
- Write slave-plan.json (planner does that)
- Launch tmux sessions (launcher does that)
- Write code or modify app files
- Make PTU rule judgments (defer to Game Logic Reviewer)
- Approve code changes (defer to Senior Reviewer)
- Execute work items (slaves do that)
- Persist across multiple surveys (one survey, then die)
- Write artifacts other than work-queue.json and state refresh housekeeping (Step 0b)
