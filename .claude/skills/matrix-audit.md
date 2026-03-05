---
name: matrix-audit
description: Human-triggered matrix audit orchestrator. Surveys matrix staleness, determines next pipeline stages per domain, builds a slave plan for parallel execution, and optionally creates M2 tickets from completed audits. Argument is optional domain filter (e.g., /matrix-audit combat).
user_invocable: true
---

# Matrix Audit Orchestrator

You orchestrate the matrix pipeline as a **standalone system**, separate from the dev orchestration pipeline. The human triggers you when they decide it's time to refresh coverage analysis.

**Design principle: maximize parallelism, minimize per-slave context.** Each slave gets ONE domain and ONE pipeline stage. This keeps context small and lets domains run in parallel.

## Arguments

- No argument: audit all stale domains
- Domain name(s): audit only specified domains (e.g., `combat`, `combat healing vtt-grid`)
- `--tickets`: after auditing, also run M2 ticket creation for completed domains
- `--full`: force full pipeline refresh (re-run all stages even if not stale)

## Pipeline Stages (Per Domain)

```
Stage 1: Rule Extractor    ─┐ (parallel — independent inputs)
Stage 2: Capability Mapper  ─┘
Stage 3: Coverage Analyzer     (needs stages 1+2)
Stage 4: Implementation Auditor (needs stage 3)
Stage 5: Browser Auditor        (needs stage 4, serial — port 3000)
Stage 6: M2 Ticket Creation     (needs stage 4, inline — no slave needed)
```

**Parallelism map:**
- Stages 1+2 run in parallel (per domain)
- Stages 1+2 across different domains run in parallel
- Stage 3 is serial per domain (needs both 1+2)
- Stage 4 is serial per domain (needs 3)
- Stage 5 is globally serial (single port 3000) — but can run in parallel with non-browser work
- Stage 6 is inline (orchestrator does it, no slave)

## Step 0: Read Current Matrix State

Read `artifacts/state/test-state.md` and `artifacts/matrix/_index.md`.

For each domain, determine its current pipeline position:

| State | Next Stage Needed |
|-------|------------------|
| No rules catalog | Stage 1 (Rule Extractor) |
| No capabilities catalog | Stage 2 (Capability Mapper) |
| Rules + capabilities exist, no matrix | Stage 3 (Coverage Analyzer) |
| Matrix exists, no audit | Stage 4 (Implementation Auditor) |
| Audit exists, no browser audit | Stage 5 (Browser Auditor) |
| Everything complete | Up to date (skip unless `--full`) |

**Staleness detection** — a stage is stale if:
- Capabilities: app code changed since `capabilities/_index.md` timestamp (check `git log`)
- Matrix: capabilities updated since `matrix.md` timestamp
- Audit: matrix updated since `audit/_index.md` timestamp

If `--full` flag: ignore staleness, re-run all stages from 1.

## Step 1: Determine Work Items

For each domain (filtered by argument or all):

1. Find the **next needed stage** from Step 0
2. If stages 1 and 2 are both needed, emit **two separate work items** (they parallelize)
3. If only stage 3+ is needed, emit one work item for the next stage only

**One stage per domain per run.** Don't chain the entire pipeline for a domain into one slave — that would blow context limits. Each survey→plan→collect cycle advances one stage. The human runs `/matrix_audit` again to advance to the next stage.

Exception: Stages 1+2 are always emitted together (as separate slaves) since they're independent and the human shouldn't have to run twice just to get past the entry point.

## Step 2: Build Slave Plan

Group work items into slaves following these rules:

### Parallelism Rules

| Pattern | Parallel? | Reason |
|---------|-----------|--------|
| Rule Extractor across domains | Yes | Read-only on different book chapters |
| Capability Mapper across domains | Yes | Read-only on different code directories |
| Rule Extractor + Capability Mapper (same domain) | Yes | Different inputs (books vs code) |
| Coverage Analyzer across domains | Yes | Different input/output files |
| Implementation Auditor across domains | Yes | Different source files per domain |
| Browser Auditor across domains | **No** | Single port 3000 |
| Browser Auditor + non-browser slaves | Yes | Browser is read-only on app |

### Slave Assignment

Each slave gets:
- `slave_id`: 1-based
- `task_type`: `matrix`
- `target`: `<domain>-<stage-name>` (e.g., `combat-rules`, `healing-capabilities`, `capture-coverage`, `vtt-grid-audit`, `scenes-browser-audit`)
- `agent_types`: single agent type from the template mapping
- `branch_name`: `matrix/<N>-<agent>-<domain>-<timestamp>`
- `worktree_path`: `.worktrees/matrix-<N>-<agent>-<domain>`
- `template_data`: resolved from the agent template

### Template Mapping

| Stage | Agent Type | Template |
|-------|-----------|----------|
| 1 | rule-extractor | `templates/agent-rule-extractor.md` |
| 2 | capability-mapper | `templates/agent-capability-mapper.md` |
| 3 | coverage-analyzer | `templates/agent-coverage-analyzer.md` |
| 4 | implementation-auditor | `templates/agent-implementation-auditor.md` |
| 5 | browser-auditor | `templates/agent-browser-auditor.md` |

### Template Data Resolution

For each slave, resolve template placeholders:

- **Rule Extractor**: `{{DOMAIN}}`, `{{TASK_DESCRIPTION}}`, `{{RELEVANT_LESSONS}}`, `{{RELEVANT_DECREES}}`
- **Capability Mapper**: `{{DOMAIN}}`, `{{TASK_DESCRIPTION}}`, `{{RELEVANT_LESSONS}}`
- **Coverage Analyzer**: `{{DOMAIN}}`, `{{TASK_DESCRIPTION}}`, `{{RELEVANT_LESSONS}}`, `{{RELEVANT_DECREES}}`
- **Implementation Auditor**: `{{DOMAIN}}`, `{{TASK_DESCRIPTION}}`, `{{RELEVANT_LESSONS}}`, `{{RELEVANT_DECREES}}`
- **Browser Auditor**: `{{DOMAIN}}`, `{{TASK_DESCRIPTION}}`, `{{CAPABILITY_INDEX}}`, `{{MATRIX_ACCESSIBLE_FROM}}`, `{{VIEW_MAP}}`, `{{RELEVANT_LESSONS}}`, `{{RELEVANT_DECREES}}`

`{{WORKTREE_PATH}}` and `{{BRANCH_NAME}}` are resolved at slave launch time (same as dev pipeline).

## Step 3: Write Plan and Present

Write `.worktrees/matrix-plan.json` (separate from `slave-plan.json` — the two systems run independently):

```json
{
  "plan_id": "matrix-<unix-timestamp>",
  "created_at": "<ISO>",
  "created_from_commit": "<master HEAD SHA>",
  "total_slaves": N,
  "slaves": [
    {
      "slave_id": 1,
      "task_type": "matrix",
      "target": "combat-rules",
      "description": "Extract PTU rules for combat domain",
      "agent_types": ["rule-extractor"],
      "launch_mode": "single",
      "depends_on": [],
      "branch_name": "matrix/1-rule-extractor-combat-<ts>",
      "worktree_path": ".worktrees/matrix-1-rule-extractor-combat",
      "template_data": { ... }
    }
  ],
  "merge_order": [1, 2, 3, 4, 5, 6],
  "pipeline_stage": "stages 1+2"
}
```

Present summary:

```markdown
## Matrix Audit Plan: matrix-<id>

### Pipeline Status
| Domain | Current State | Next Stage | Slave |
|--------|--------------|------------|-------|
| combat | capabilities stale | Stage 2: Capability Mapper | slave-1 |
| capture | matrix stale | Stage 3: Coverage Analyzer | slave-2 |
| healing | capabilities stale | Stage 2: Capability Mapper | slave-3 |

### Slaves (N total)
| # | Domain | Stage | Agent | Parallel Group |
|---|--------|-------|-------|----------------|
| 1 | combat | capabilities | capability-mapper | A |
| 2 | capture | coverage | coverage-analyzer | A |
| 3 | healing | capabilities | capability-mapper | A |

### Next Step
Run `/launch_slaves` to start. After collection, run `/matrix_audit` again to advance to the next pipeline stage.
```

## Step 4: M2 Ticket Creation (When `--tickets` Flag or All Stages Complete)

After collection of audit slaves (stage 4), convert findings into dev tickets. This runs inline — no slave needed.

For each domain with completed audit:

1. Read `matrix/<domain>/matrix.md` and `matrix/<domain>/audit/`
2. Create **bug tickets** for each `Incorrect` audit item
3. Create **feature tickets** for each `Missing` / `Subsystem-Missing` / `Partial` / `Implemented-Unreachable` matrix item
4. Create **ptu-rule tickets** for each `Approximation` audit item
5. Skip `Correct`, `Out of Scope`, `Ambiguous` items
6. All tickets include `matrix_source` frontmatter
7. Commit and push

These tickets then appear in the next dev `/survey` as normal D1-D9 items.

## Step 5: Update test-state.md

After collection, update `artifacts/state/test-state.md`:
- Update domain progress rows (which stages are now done/fresh/stale)
- Update coverage scores from new matrix.md files
- Update `last_updated` timestamp

Commit:
```bash
git add artifacts/state/test-state.md
git commit -m "matrix: update test-state after matrix-<plan_id>"
```

## Lifecycle

The matrix audit is designed for **iterative advancement**:

1. Human runs `/matrix_audit` → plan shows stages 1+2 needed for 5 domains
2. Human runs `/launch_slaves` → 10 slaves (2 per domain) run in parallel
3. Human runs `/collect_slaves` → merge all branches
4. Human runs `/matrix_audit` → plan shows stage 3 needed for 5 domains
5. Human runs `/launch_slaves` → 5 slaves run in parallel
6. Repeat until all domains reach desired stage

This keeps each slave's context small (one domain, one stage) and lets the human control pace.

## Context Budget Guidance

Each pipeline stage has different context demands:

| Stage | Context Load | Why |
|-------|-------------|-----|
| Rule Extractor | High | Reads entire book chapters |
| Capability Mapper | High | Deep-reads many source files |
| Coverage Analyzer | Medium | Cross-references two catalogs |
| Implementation Auditor | Very High | Reads code + books + matrix |
| Browser Auditor | Medium | Snapshot-based, less reading |

For domains with many rules (combat: 135, pokemon-lifecycle: 68, character-lifecycle: 68), consider splitting Implementation Auditor into sub-tasks if context limits are hit. The auditor's tiered output structure (tier-1 through tier-N files) naturally supports this — a slave could audit tiers 1-3 and a second slave audits tiers 4+.

## What You Do NOT Do

- Execute pipeline stages yourself (slaves do that)
- Modify app source code
- Make PTU rule judgments
- Run the browser auditor inline (it needs a slave for port isolation)
- Chain multiple stages for one domain into a single slave (context limits)
- Mix matrix work with dev work in the same plan file
