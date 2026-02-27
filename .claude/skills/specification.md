# PTU Skills Ecosystem — Specification

## 1. Purpose

The PTU Session Helper app must accurately replicate PTU 1.05 gameplay. Code correctness alone is insufficient — the app must be validated against the complete PTU ruleset through direct rule-to-code coverage analysis. This ecosystem exists to automate that validation.

**Core principle:** The Feature Matrix drives the dev loop. Every PTU rule is extracted, every app capability is mapped, and the two are cross-referenced to find gaps and verify correctness.

## 2. Architecture

### 2.1 Two Ecosystems, Master/Slave Orchestration

The ecosystem is split into two logically separate halves:

- **Dev Ecosystem:** Developer, Senior Reviewer, Game Logic Reviewer, Code Health Auditor
- **Matrix Ecosystem:** PTU Rule Extractor, App Capability Mapper, Coverage Analyzer, Implementation Auditor

The Retrospective Analyst serves both. The Master Planner reads both state files and plans all work at once. It also creates tickets from completed matrix analyses.

**Playtesting is external.** The ecosystem produces coverage matrices and correctness audits. Running Playwright tests against the app happens outside these two ecosystems.

### 2.2 Master/Slave Orchestration with Git Worktrees

The orchestration system has three phases:

1. **Master Planner** (`/create_slave_plan`) — analyzes ALL pending work, assigns to N slaves, writes plan file, launches slave tmux sessions directly, and verifies startup
2. **Slave Executors** (`/slave N`) — each slave creates a worktree, launches agents, commits to its branch, writes status, dies
3. **Slave Collector** (`/collect_slaves`) — merges all completed branches to master, updates state files, cleans up

**Why master/slave:**
- One plan covers all work items — no need to run `/orchestrate` N times
- Parallelization analysis happens once, centrally, with full visibility
- Each slave gets pre-gathered context — no duplicate state reading
- Merge order and conflict zones are planned in advance
- Git worktrees isolate file operations — no conflicts between parallel agents
- Crash recovery is simple — failed slaves are skipped during collection
- Linear git history maintained via rebase + fast-forward merge during collection

**Coordination:** File-based via `.worktrees/slave-plan.json` (plan) and `.worktrees/slave-status/` (per-slave status JSONs). No shared memory or persistent state beyond the filesystem.

**Agent context:** Templates in `.claude/skills/templates/` provide static rules distilled from source skill files. The master planner gathers all dynamic data (ticket content, relevant files, lessons, git log) during planning and stores it in the plan file. Slaves replace `{{PLACEHOLDER}}` tokens at launch time.

### 2.3 Artifact-Based Communication

All inter-skill communication happens through persistent files on disk. No skill assumes knowledge of another skill's context.

**Cross-ecosystem communication** uses tickets:
```
artifacts/tickets/
├── bug/               # Orchestrator writes (from audit) → Developer reads
├── ptu-rule/          # Orchestrator/Game Logic Reviewer writes → Developer reads
├── feature/           # Orchestrator writes (from matrix) → Developer reads
└── ux/                # Orchestrator writes (from matrix) → Developer reads
```

**Ecosystem-internal artifacts:**
```
artifacts/
├── matrix/             # Matrix: all 4 skills write sequentially
│   ├── <domain>-rules.md          # Rule Extractor writes → Coverage Analyzer reads
│   ├── <domain>-capabilities.md   # Capability Mapper writes → Coverage Analyzer reads
│   ├── <domain>-matrix.md         # Coverage Analyzer writes → Auditor reads, Orchestrator reads
│   └── <domain>-audit.md          # Implementation Auditor writes → Orchestrator reads
├── designs/            # Shared: Developer writes → shared read zone (atomized per-design dirs)
├── refactoring/        # Dev: Code Health Auditor writes → Developer reads
├── reviews/            # Dev: Reviewers write → Orchestrator/Developer read (active/ + archive/)
├── lessons/            # Shared: Retrospective Analyst writes → all read
├── tickets/            # Cross-ecosystem: open/ + in-progress/ + resolved/ status dirs
│   ├── open/           # New tickets by category (bug/, ptu-rule/, feature/, ux/, decree/)
│   ├── in-progress/    # Being worked on
│   └── resolved/       # Completed
└── state/              # Ecosystem state files
    ├── dev-state.md    # Orchestrator writes → Dev skills read
    ├── test-state.md   # Orchestrator writes → Matrix skills read
    └── alive-agents.md # Slave Collector writes → Master Planner reads
```

### 2.4 Ticket System

Tickets are the **sole cross-ecosystem communication mechanism**. Matrix artifacts stay in `artifacts/matrix/`. Only actionable work items cross the boundary, created by the Orchestrator from completed matrix analyses.

| Type | Prefix | Direction | Producer | Consumer |
|------|--------|-----------|----------|----------|
| bug | `bug-NNN` | Matrix → Dev | Orchestrator (from audit INCORRECT) | Developer |
| ptu-rule | `ptu-rule-NNN` | Either → Dev | Orchestrator (from audit APPROXIMATION) / Game Logic Reviewer | Developer |
| feature | `feature-NNN` | Matrix → Dev | Orchestrator (from matrix MISSING) | Developer |
| ux | `ux-NNN` | Matrix → Dev | Orchestrator (from matrix MISSING UI) | Developer |
| refactoring | `refactoring-NNN` | Dev internal | Code Health Auditor | Developer |

### 2.5 State Files

Each orchestrator updates state files as part of its post-processing step (Step 8c). Updates are conflict-safe:
- Only modify rows for the specific ticket the orchestrator worked on
- Append to session summaries (never overwrite)
- If push fails, pull-rebase and resolve (other orchestrator's changes win for untouched rows)

State files:
- `dev-state.md` — tracks open tickets, active Developer work, review status, refactoring queue
- `test-state.md` — tracks domain matrix progress, coverage scores, active work, ambiguous items

Skills report completions via their artifacts; orchestrators read artifacts and update state.

### 2.6 Pipeline Flow

```
                    ┌──────────────────────┐
                    │   Master Planner     │ ← reads both state files
                    │  (plans all work,    │   + all ticket dirs + matrix/
                    │   creates tickets)   │
                    └──────────┬───────────┘
                               │
                        slave-plan.json
                               │
            ┌──────────────────┼──────────────────────┐
            │                  │                       │
       DEV ECOSYSTEM     TICKET BOUNDARY      MATRIX ECOSYSTEM
       (via slaves)            │               (via slaves)
            │                  │                       │
       Developer          ← bug tickets ←       Rule Extractor ──┐
       Senior Reviewer    ← feature tickets ←                    ├→ Coverage Analyzer
       Game Logic Rev     ← ptu-rule tickets ←  Capability Mapper┘        │
       Code Health Aud    ← ux tickets ←                         Implementation Auditor
                                                                          │
                    ┌──────────────────────┐              Master reads matrix,
                    │   Slave Collector    │              creates tickets (M2)
                    │  (merges branches,   │
                    │   updates state)     │
                    └──────────────────────┘
```

## 3. Skills

### 3.1 Master/Slave Orchestration System

The orchestration system is split into three phases, each with its own skill:

#### 3.1a Master Planner

| Field | Value |
|-------|-------|
| **File** | `.claude/skills/master-planner.md` |
| **Templates** | `.claude/skills/templates/agent-*.md` |
| **Trigger** | `/create_slave_plan` |
| **Input** | `dev-state.md`, `test-state.md`, all ticket/matrix dirs, `.worktrees/slave-status/` |
| **Output** | `.worktrees/slave-plan.json`, `scripts/launch-slaves.sh`, tickets (M2) |
| **Lifecycle** | Ephemeral — one plan per session, then dies |

**Lifecycle (8 steps):**
1. Read coordination state (existing plan, active slaves, pipeline state)
2. Build full work queue (ALL actionable items from D1-D9 + M1-M7)
3. Parallelization analysis (classify every pair of items)
4. Assign to N slaves (group items, build dependency DAG, compute merge order)
5. Gather template data (full context injection pass for each slave)
6. Write plan file (`.worktrees/slave-plan.json`)
7. Generate launch script (`scripts/launch-slaves.sh`)
8. Present plan (summary table, wait for user "go")

#### 3.1b Slave Executor

| Field | Value |
|-------|-------|
| **File** | `.claude/skills/slave-executor.md` |
| **Trigger** | `/slave N` |
| **Input** | `.worktrees/slave-plan.json`, `.worktrees/slave-status/` |
| **Output** | Branch commits, `.worktrees/slave-status/slave-<N>.json` |
| **Lifecycle** | Ephemeral — one assignment per session, then dies |

**Lifecycle (8 steps):**
1. Parse argument (extract slave number X)
2. Read plan (find slave_id == X)
3. Check dependencies (read status files for depends_on)
4. Write initial status (`initializing`)
5. Create git worktree on named branch
6. Prepare & launch agent(s) (replace placeholders, validate, launch via Task tool)
7. Post-process (collect commits, artifacts, verdict — NO merge, NO state update)
8. Report and die

#### 3.1c Slave Collector

| Field | Value |
|-------|-------|
| **File** | `.claude/skills/slave-collector.md` |
| **Trigger** | `/collect_slaves` |
| **Input** | `.worktrees/slave-plan.json`, `.worktrees/slave-status/`, all branch worktrees |
| **Output** | `dev-state.md`, `test-state.md`, `alive-agents.md`, cleanup |
| **Lifecycle** | Ephemeral — one collection per session, then dies |

**Lifecycle (8 steps):**
1. Read plan + all status files (build summary table)
2. Determine merge set (completed slaves only, respect merge_order)
3. Propose to user (show merge plan with conflict risk)
4. Merge branches sequentially (rebase + fast-forward, retry up to 3x)
5. Update state files (single atomic commit after all merges)
6. Write follow-up tickets (CHANGES_REQUIRED re-work, M2 conditions)
7. Cleanup (remove worktrees, branches, status files for merged slaves)
8. Final report (merged count, skipped count, suggested next plan)

**None of the three phases:**
- Write code
- Make PTU rule judgments
- Approve code or plans
- Auto-spawn other orchestration phases (suggest in reports only)

### 3.2 PTU Rule Extractor

| Field | Value |
|-------|-------|
| **File** | `.claude/skills/ptu-rule-extractor.md` |
| **Trigger** | Ask Claude to load the ptu-rule-extractor skill |
| **Input** | PTU rulebook chapters (`books/markdown/core/`), errata |
| **Output** | `artifacts/matrix/<domain>-rules.md` |
| **Terminal** | Spin up per domain, can close after rules extracted |

**Responsibilities:**
- Read PTU rulebook chapters relevant to a domain
- Extract every mechanic as a structured catalog entry
- Build dependency graph (foundation → derived → workflow)
- Handle cross-domain references
- Apply errata corrections

**Runs in parallel with:** App Capability Mapper (no dependency between them)

### 3.3 App Capability Mapper

| Field | Value |
|-------|-------|
| **File** | `.claude/skills/app-capability-mapper.md` |
| **Trigger** | Ask Claude to load the app-capability-mapper skill |
| **Input** | App source code, `references/app-surface.md`, Prisma schema |
| **Output** | `artifacts/matrix/<domain>-capabilities.md` |
| **Terminal** | Spin up per domain, can close after capabilities mapped |

**Responsibilities:**
- Deep-read source code for all files in a domain
- Catalog every capability with type, location, and game concept
- Map capability chains (UI → Store → Composable → API → Service → DB)
- Identify orphan capabilities (exist but unused)

**Runs in parallel with:** PTU Rule Extractor (no dependency between them)

### 3.4 Coverage Analyzer

| Field | Value |
|-------|-------|
| **File** | `.claude/skills/coverage-analyzer.md` |
| **Trigger** | Ask Claude to load the coverage-analyzer skill |
| **Input** | `matrix/<domain>-rules.md`, `matrix/<domain>-capabilities.md` |
| **Output** | `artifacts/matrix/<domain>-matrix.md` |
| **Terminal** | Spin up per domain, can close after matrix produced |

**Responsibilities:**
- Cross-reference every rule against capabilities
- Classify each rule: Implemented / Partial / Missing / Out of Scope
- Assign gap priorities (P0-P3) to Missing and Partial items
- Compute coverage score
- Produce Auditor Queue for Implementation Auditor

**Depends on:** Both Rule Extractor and Capability Mapper outputs

### 3.5 Implementation Auditor

| Field | Value |
|-------|-------|
| **File** | `.claude/skills/implementation-auditor.md` |
| **Trigger** | Ask Claude to load the implementation-auditor skill |
| **Input** | `matrix/<domain>-matrix.md`, source code, PTU rulebook sections |
| **Output** | `artifacts/matrix/<domain>-audit.md` |
| **Terminal** | Spin up per domain, can close after audit complete |

**Responsibilities:**
- Work through the Auditor Queue from the matrix
- Deep-read both source code AND PTU rulebook for each item
- Classify each: Correct / Incorrect / Approximation / Ambiguous
- Provide file:line evidence for every finding
- Escalate Ambiguous items for Game Logic Reviewer

**Depends on:** Coverage Analyzer output

### 3.6 Developer

| Field | Value |
|-------|-------|
| **File** | `.claude/skills/ptu-session-helper-dev.md` |
| **Trigger** | Load at session start |
| **Input** | Bug reports, feature/ux tickets, design specs, reviewer feedback |
| **Output** | Code changes, committed to git |
| **Terminal** | Persistent — primary implementation terminal |

**Ecosystem additions (to existing skill):**
- Read bug/feature/ux tickets from `artifacts/tickets/`
- After fixing, annotate the ticket with fix details (file changed, commit hash)
- Follow the Orchestrator's guidance on which ticket to fix next
- Write design specs when feature tickets need design before implementation

### 3.7 Senior Reviewer

| Field | Value |
|-------|-------|
| **File** | `.claude/skills/ptu-session-helper-senior-reviewer.md` |
| **Trigger** | Load at session start, after Dev produces changes |
| **Input** | Dev's code changes (git diff), bug reports being addressed |
| **Output** | `artifacts/reviews/code-review-<NNN>.md` |
| **Terminal** | Persistent — review terminal |

**Ecosystem additions (to existing skill):**
- Check fixes against the original ticket's description
- Code quality and architecture review remain primary responsibilities

### 3.8 Game Logic Reviewer

| Field | Value |
|-------|-------|
| **File** | `.claude/skills/game-logic-reviewer.md` |
| **Trigger** | Ask Claude to load the game-logic-reviewer skill |
| **Input** | Code changes, audit ambiguities, escalations from other skills |
| **Output** | `artifacts/reviews/rules-review-<NNN>.md` |
| **Terminal** | Spin up when needed for PTU rule questions |

**Responsibilities:**
- Verify code changes implement PTU 1.05 rules correctly
- Resolve `AMBIGUOUS` items from Implementation Auditor
- Review Dev output for game logic correctness (complements Senior Reviewer's code quality review)
- Provide definitive PTU rule interpretations when skills disagree

**Authority:** On PTU game logic, this skill's judgment overrides all others. On code quality and architecture, Senior Reviewer overrides.

### 3.9 Retrospective Analyst

| Field | Value |
|-------|-------|
| **File** | `.claude/skills/retrospective-analyst.md` |
| **Trigger** | After a domain completes a full cycle OR on-demand by user request |
| **Input** | All artifact directories, `dev-state.md`, `test-state.md`, git history |
| **Output** | `artifacts/lessons/<skill-name>.lessons.md`, `retrospective-summary.md` |
| **Terminal** | Spin up after cycles complete or on user request |

**Responsibilities:**
- Scan artifact trail and git history for error patterns across completed pipeline cycles
- Classify errors into categories with clear boundary definitions
- Track recurrence (observed → recurring → systemic)
- Deduplicate against existing lessons before writing
- Write per-skill lesson files with evidence and recommendations
- Write cross-cutting retrospective summary

**Does NOT:**
- Fix app code (that's Developer)
- Make PTU rule rulings (that's Game Logic Reviewer)
- Modify any skill's process steps (recommends changes only)
- Write to any artifact directory other than `artifacts/lessons/`

### 3.10 Code Health Auditor

| Field | Value |
|-------|-------|
| **File** | `.claude/skills/code-health-auditor.md` |
| **Trigger** | On-demand, after a domain completes a full pipeline cycle, or after Developer implements a FULL-scope design spec |
| **Input** | Source code files under `app/`, `app-surface.md`, lesson files, git log |
| **Output** | `artifacts/refactoring/refactoring-<NNN>.md`, `audit-summary.md` |
| **Terminal** | Spin up per audit |

**Responsibilities:**
- Scan production source code for structural issues that hinder LLM agent correctness
- Categorize findings into 12 categories (7 LLM-friendliness + 5 extensibility)
- Cross-reference Retrospective Analyst lessons to boost priority of flagged files
- Detect hot files via git change frequency
- Write prioritized refactoring tickets (max 10 per audit)
- Write audit summary with metrics and hotspots

**Authority boundary:** Decides *what* needs fixing and its priority. Senior Reviewer decides *how* the refactoring is implemented.

**Does NOT:**
- Modify source code (that's Developer)
- Review code changes (that's Senior Reviewer)
- Fix bugs or implement features (that's Developer)
- Make PTU rule judgments (that's Game Logic Reviewer)
- Scan test files or artifacts — only production code under `app/`
- Write to any artifact directory other than `artifacts/refactoring/`

## 4. Artifact Formats

All artifacts use markdown with YAML frontmatter. Full schemas in `.claude/skills/references/skill-interfaces.md`.

### 4.1 Rule Catalog

```markdown
---
domain: combat
extracted_at: 2026-02-19T10:00:00Z
extracted_by: ptu-rule-extractor
total_rules: 45
sources:
  - core/07-combat.md
  - core/08-pokemon-moves.md
errata_applied: true
---

# PTU Rules: Combat

## combat-R001: Base Damage Formula
- **Category:** formula
- **Scope:** core
- **PTU Ref:** `core/07-combat.md#Damage`
- **Quote:** "Damage = Attack Roll + Attack Stat - Defense Stat"
- **Dependencies:** none
- **Errata:** false
```

### 4.2 Capability Catalog

```markdown
---
domain: combat
mapped_at: 2026-02-19T10:00:00Z
mapped_by: app-capability-mapper
total_capabilities: 32
files_read: 18
---

# App Capabilities: Combat

## combat-C001: Apply Damage Endpoint
- **Type:** api-endpoint
- **Location:** `server/api/encounters/[id]/combatants/[combatantId]/damage.post.ts:default`
- **Game Concept:** damage application
- **Description:** Applies damage to a combatant, updating HP and checking injury thresholds
- **Inputs:** { amount: number, damageType: string }
- **Outputs:** { currentHp: number, injuries: number }
```

### 4.3 Feature Completeness Matrix

```markdown
---
domain: combat
analyzed_at: 2026-02-19T12:00:00Z
analyzed_by: coverage-analyzer
total_rules: 45
implemented: 32
partial: 5
missing: 6
out_of_scope: 2
coverage_score: 80.2
---

# Feature Completeness Matrix: Combat

## Coverage Score
**80.2%** — (32 + 0.5 * 5) / (45 - 2) * 100
```

### 4.4 Implementation Audit Report

```markdown
---
domain: combat
audited_at: 2026-02-19T14:00:00Z
audited_by: implementation-auditor
items_audited: 37
correct: 30
incorrect: 3
approximation: 2
ambiguous: 2
---

# Implementation Audit: Combat

## combat-R001: Base Damage Formula
- **Classification:** Correct
- **Code:** `server/services/combatant.service.ts:142-158` — `applyDamage()`
- **Rule:** "Damage = Attack Roll + Attack Stat - Defense Stat"
- **Verification:** Code computes `rollTotal + attackStat - defenseStat`, matches PTU formula
```

### 4.5 Bug Report (Legacy)

```markdown
---
bug_id: bug-001
severity: CRITICAL
category: APP_BUG
scenario_id: combat-basic-damage-001
affected_files:
  - app/composables/useCombat.ts
  - app/server/services/combatant.service.ts
---

## What Happened
Damage calculation does not subtract defense stat.

## Root Cause Analysis
In `useCombat.ts:calculateDamage()`, the defense parameter is accepted but never subtracted.

## PTU Rule Reference
core/07-combat.md: "Damage = Attack Roll + Attack Stat - Defense Stat"
```

### 4.6 State Files

The Orchestrator maintains two state files (sole writer):

**dev-state.md** — Dev Ecosystem state:
```markdown
---
last_updated: <ISO timestamp>
updated_by: orchestrator
---

# Dev Ecosystem State

## Open Tickets
### Bug Tickets (`tickets/open/bug/`)
### PTU Rule Tickets (`tickets/open/ptu-rule/`)
### Feature Tickets (`tickets/open/feature/`)
### UX Tickets (`tickets/open/ux/`)

## Active Developer Work
## Review Status
## Refactoring Tickets (`refactoring/`)
## Code Health
```

**test-state.md** — Matrix Ecosystem state:
```markdown
---
last_updated: <ISO timestamp>
updated_by: orchestrator
---

# Matrix Ecosystem State

## Domain Progress
| Domain | Rules | Capabilities | Matrix | Audit | Tickets | Coverage |
|--------|-------|-------------|--------|-------|---------|----------|
| combat | done | done | done | done | created | 80.2% |

## Active Work
## Pending Ticket Creation
## Ambiguous Items Pending Ruling
## Recommended Next Step
```

### 4.6b Pipeline State (Legacy)

The original `pipeline-state.md` has been archived as `pipeline-state.legacy.md`. It contains the full historical record from the combat and capture domain cycles. New state tracking uses the two state files above.

### 4.6c Slave Plan

**Written by:** Master Planner
**Read by:** Slave Executor, Slave Collector
**Location:** `.worktrees/slave-plan.json`

```json
{
  "plan_id": "plan-<unix-timestamp>",
  "created_at": "<ISO>",
  "created_from_commit": "<master HEAD SHA>",
  "total_slaves": 4,
  "slaves": [
    {
      "slave_id": 1,
      "task_type": "developer",
      "target": "ptu-rule-079",
      "description": "Fix capture rate modifier for ultra balls",
      "agent_types": ["developer"],
      "launch_mode": "single",
      "depends_on": [],
      "branch_name": "slave/1-dev-ptu-rule-079-1740200000",
      "worktree_path": ".worktrees/slave-1-dev-ptu-rule-079",
      "template_data": {
        "TASK_DESCRIPTION": "...",
        "TICKET_CONTENT": "...",
        "RELEVANT_FILES": "...",
        "PTU_RULES": "...",
        "GIT_LOG": "...",
        "RELEVANT_LESSONS": "...",
        "REVIEW_FEEDBACK": "...",
        "DESIGN_SPEC": "...",
        "PREVIOUS_REVIEW": "...",
        "WORKTREE_PATH": "{{RESOLVED_AT_SLAVE_TIME}}",
        "BRANCH_NAME": "{{RESOLVED_AT_SLAVE_TIME}}"
      },
      "output_expectations": {
        "artifact_type": "code",
        "artifact_paths": [],
        "modifies_domains": ["capture"]
      }
    }
  ],
  "merge_order": [1, 3, 2, 4],
  "conflict_zones": {
    "high_risk": [{"slaves": [1, 2], "files": ["app/utils/captureRate.ts"], "resolution": "merge 1 first, rebase 2"}],
    "no_conflict": [{"slaves": [1, 3], "reason": "different domains (capture vs healing)"}]
  }
}
```

### 4.6d Slave Status

**Written by:** Slave Executor
**Read by:** Slave Executor (dependency check), Slave Collector
**Location:** `.worktrees/slave-status/slave-<N>.json`

```json
{
  "slave_id": 1,
  "status": "completed",
  "started_at": "2026-02-21T10:00:00Z",
  "completed_at": "2026-02-21T10:15:00Z",
  "pid": 12345,
  "plan_id": "plan-1740200000",
  "task_type": "developer",
  "target": "ptu-rule-079",
  "description": "Fix capture rate modifier for ultra balls",
  "branch": "slave/1-dev-ptu-rule-079-1740200000",
  "worktree": ".worktrees/slave-1-dev-ptu-rule-079",
  "commits": ["abc1234 fix: correct ultra ball modifier", "def5678 test: add ultra ball capture test"],
  "artifacts_produced": ["app/utils/captureRate.ts"],
  "review_verdict": null,
  "error": null
}
```

Valid `status` values: `"initializing"`, `"running"`, `"completed"`, `"failed"`

### 4.7 Lesson File

```markdown
---
skill: <skill-name>
last_analyzed: <ISO timestamp>
analyzed_by: retrospective-analyst
total_lessons: <count>
domains_covered:
  - <domain>
  - ...
---

# Lessons: <Skill Display Name>

## Summary
<2-3 sentences summarizing the key patterns found for this skill>

---

## Lesson 1: <imperative title>

- **Category:** math-error | data-lookup | missing-check | process-gap | triage-error | selector-issue | routing-error | rule-ambiguity | fix-pattern
- **Severity:** high | medium | low
- **Domain:** combat | capture | healing | pokemon-lifecycle | character-lifecycle | encounter-tables | scenes | vtt-grid | cross-cutting
- **Frequency:** observed | recurring | systemic
- **First observed:** <date>
- **Status:** active | resolved | promote-candidate

### Pattern
<Concrete description of the error pattern with references to specific artifacts>

### Evidence
- `artifacts/verifications/<id>.verified.md`: <what was found>
- `git diff <hash>`: <what was changed to fix it>

### Recommendation
<Imperative instruction that could be added to the skill's process>

---

## Lesson 2: ...
```

### 4.8 Refactoring Ticket + Audit Summary

**Written by:** Code Health Auditor
**Read by:** Developer (implements refactoring), Senior Reviewer (reviews approach)
**Location:** `artifacts/refactoring/refactoring-<NNN>.md` and `artifacts/refactoring/audit-summary.md`

#### Refactoring Ticket

```markdown
---
ticket_id: refactoring-<NNN>
priority: P0 | P1 | P2
categories:
  - <category-id>
affected_files:
  - <app file path>
estimated_scope: small | medium | large
status: open | in-progress | resolved
created_at: <ISO timestamp>
---

## Summary
<1-2 sentences: what the problem is and why it matters for LLM agents>

## Findings

### Finding 1: <category-id>
- **Metric:** <measured value>
- **Threshold:** <threshold that was exceeded>
- **Impact:** <how this affects LLM agent code generation>
- **Evidence:** <file:line-range, function names>

## Suggested Refactoring
1. <step with exact file paths>
Estimated commits: <count>

## Resolution Log
<!-- Developer fills this in after refactoring -->
- Commits: ___
- Files changed: ___
```

#### Audit Summary

```markdown
---
last_audited: <ISO timestamp>
audited_by: code-health-auditor
scope: <"full codebase" | "domain: <name>" | "targeted: <paths>">
files_scanned: <count>
files_deep_read: <count>
total_tickets: <count>
---

## Metrics
| Metric | Value |
|--------|-------|

## Hotspots
| Rank | File | Lines | Categories | Priority |

## Tickets Written
## Overflow
## Comparison to Last Audit
```

### 4.9 Code Review

**Written by:** Senior Reviewer
**Location:** `artifacts/reviews/code-review-<NNN>.md`

```markdown
---
review_id: code-review-<NNN>
review_type: code
reviewer: senior-reviewer
trigger: bug-fix | design-implementation | refactoring
target_report: <bug-NNN | design-NNN | refactoring-NNN>
domain: <domain>
commits_reviewed:
  - <commit hash>
files_reviewed:
  - <app file path>
verdict: APPROVED | CHANGES_REQUIRED | BLOCKED
issues_found:
  critical: <count>
  high: <count>
  medium: <count>
reviewed_at: <ISO timestamp>
follows_up: <code-review-NNN>  # optional — for re-reviews
---

## Review Scope
## Issues
### CRITICAL / HIGH / MEDIUM
## What Looks Good
## Verdict
## Required Changes
```

### 4.10 Rules Review

**Written by:** Game Logic Reviewer
**Location:** `artifacts/reviews/rules-review-<NNN>.md`

```markdown
---
review_id: rules-review-<NNN>
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix | design-implementation | escalation-ruling | audit-ambiguity
target_report: <bug-NNN | design-NNN | escalation-NNN>
domain: <domain>
commits_reviewed:
  - <commit hash>
mechanics_verified:
  - <mechanic-name>
verdict: APPROVED | CHANGES_REQUIRED | BLOCKED
issues_found:
  critical: <count>
  high: <count>
  medium: <count>
ptu_refs:
  - <rulebook-file>#<section>
reviewed_at: <ISO timestamp>
follows_up: <rules-review-NNN>  # optional — for re-reviews
---

## Review Scope
## Mechanics Verified
### <Mechanic Name>
- **Rule:** "<quote>" (`<file>#<section>`)
- **Implementation:** <what the code does>
- **Status:** CORRECT | INCORRECT | NEEDS REVIEW

## Summary
## Rulings
## Verdict
## Required Changes
```

## 5. Authority Hierarchy

When skills disagree:

| Domain | Final authority |
|--------|----------------|
| PTU game logic, formulas, rule interpretation | Game Logic Reviewer |
| Code quality, architecture, patterns, performance | Senior Reviewer |
| Pipeline sequencing, what to analyze next | Orchestrator |
| Rule extraction completeness | PTU Rule Extractor |
| Capability mapping completeness | App Capability Mapper |
| Coverage classification accuracy | Coverage Analyzer |
| Implementation correctness verification | Implementation Auditor |
| Gap detection and ticket creation | Orchestrator (from matrix data) |
| Pattern identification and lesson accuracy | Retrospective Analyst |
| Structural code health issues and refactoring priority | Code Health Auditor |

No skill overrides another outside its authority domain.

**Design decrees override all skill-level rulings.** A decree represents an explicit human decision. If a decree contradicts a skill's judgment, the decree wins. Skills should cite decrees in their output and file `decree-need` tickets for new ambiguities.

## 6. Shared References

All skills that need PTU knowledge read from shared reference files rather than encoding rulebook content themselves.

| Reference | Path | Used by |
|-----------|------|---------|
| Chapter Index | `.claude/skills/references/ptu-chapter-index.md` | Rule Extractor, Implementation Auditor, Game Logic Reviewer |
| Skill Interfaces | `.claude/skills/references/skill-interfaces.md` | All skills (artifact format contracts) |
| App Surface | `.claude/skills/references/app-surface.md` | Capability Mapper, Dev, Code Health Auditor |
| Playwright Patterns | `.claude/skills/references/playwright-patterns.md` | External testing reference |
| Lesson Files | `artifacts/lessons/` | Retrospective Analyst (writes), all skills (read) |
| Refactoring Tickets | `artifacts/refactoring/` | Code Health Auditor (writes), Developer + Senior Reviewer (read) |
| Review Artifacts | `artifacts/reviews/` | Senior Reviewer + Game Logic Reviewer (write), Orchestrator + Developer (read) |
| Matrix Artifacts | `artifacts/matrix/` | All 4 matrix skills (write sequentially), Orchestrator (read for tickets) |
| Design Decrees | `decrees/` | Decree Facilitator (writes), all reviewer/auditor/dev skills (read) |
| Decree-Need Tickets | `artifacts/tickets/open/decree/` | Reviewers/Auditor/Collector (write), Decree Facilitator (read) |
| UX Session Scenarios | `ux-sessions/scenarios/` | UX Session Planner (read), UX agents (read) |
| UX Party Profiles | `ux-sessions/party.md` | UX Session Planner (read), UX agents (read) |
| UX Session Reports | `ux-sessions/reports/` | UX agents (write), Narrator (read/write), Ticket Creator (read) |

Reference files live in `.claude/skills/references/`.

## 7. Lifecycle Patterns

### 7.1 Full Loop (new domain)

Each round is: plan → execute → collect.

1. `/create_slave_plan` → plan includes Rule Extractor + Capability Mapper (parallel slaves) for domain X
2. `bash scripts/launch-slaves.sh` → slaves execute in parallel
3. `/collect_slaves` → merge both to master
4. `/create_slave_plan` → plan includes Coverage Analyzer for domain X
5. Execute + collect
6. `/create_slave_plan` → plan includes Implementation Auditor for domain X
7. Execute + collect → Master creates tickets (M2) in next plan
8. `/create_slave_plan` → plan includes Developer slaves for highest-priority tickets

### 7.2 Bug Fix Cycle (Cross-Ecosystem)

1. `/create_slave_plan` → slave-1: Developer fixes ticket A, slave-2: Developer fixes ticket B (parallel)
2. Execute + collect
3. `/create_slave_plan` → slave-1: Reviewers for ticket A, slave-2: Reviewers for ticket B (parallel)
4. Execute + collect
5. Both APPROVED → `/create_slave_plan` → next priority tickets
6. CHANGES_REQUIRED → included as highest priority in next plan

### 7.3 Stale Artifact Detection

The master planner checks timestamps during planning:
- App code changed after capability mapping → capabilities stale, re-map needed
- Re-mapped capabilities → matrix stale, re-analyze needed
- Re-analyzed matrix → audit stale, re-audit needed
- Developer commit after latest approved review for same target → review stale, re-review needed

### 7.4 Ticket Creation Process (Master Planner M2)

When a domain's matrix and audit are both complete:

1. Master planner reads `matrix/<domain>-matrix.md` and `matrix/<domain>-audit.md`
2. For each `Incorrect` audit item → creates bug ticket in `tickets/open/bug/`
3. For each `Missing` matrix item → creates feature ticket in `tickets/open/feature/`
4. For each `Approximation` audit item → creates ptu-rule ticket in `tickets/open/ptu-rule/`
5. Skips `Correct`, `Out of Scope`, and `Ambiguous` items
6. All tickets include `matrix_source` frontmatter linking back to rule_id/domain
7. Commits tickets to master immediately, then includes them in the slave plan

### 7.5 Ambiguous Item Resolution

When the Implementation Auditor flags ambiguous items:

1. Orchestrator detects ambiguous items in audit (M5 priority)
2. Routes to Game Logic Reviewer with audit file reference
3. Game Logic Reviewer reads the ambiguous items and PTU rulebook
4. Produces ruling in `reviews/rules-review-<NNN>.md`
5. Orchestrator may request re-audit of affected items with the ruling applied

### 7.6 Git Worktree Lifecycle

Each slave creates and manages one worktree. The collector merges and cleans up:

1. **Create (slave):** `git worktree add -b slave/<N>-<type>-<target>-<ts> .worktrees/slave-<N>-<type>-<target> master`
2. **Symlink (slave):** `ln -s $(pwd)/app/node_modules .worktrees/<name>/app/node_modules`
3. **Agent works (slave):** reads/writes files, commits on branch
4. **Status (slave):** writes status JSON to `.worktrees/slave-status/slave-<N>.json`
5. **Merge (collector):** rebase onto master, fast-forward merge (retry up to 3x per branch)
6. **Cleanup (collector):** `git worktree remove --force`, `git branch -d`, remove status file

Branch naming: `slave/<N>-<type>-<target>-<unix-timestamp>`
Examples: `slave/1-dev-ptu-rule-079-1740200000`, `slave/2-reviewers-ptu-rule-058-1740200100`

### 7.7 Coordination Protocol

**Slave plan:**
- Master planner writes `.worktrees/slave-plan.json` with all slave assignments
- Slaves read their assignment from the plan by `slave_id`
- Collector reads the plan for merge order and conflict zones

**Slave status:**
- Each slave writes JSON to `.worktrees/slave-status/slave-<N>.json` with status, PID, commits, artifacts
- Slaves check dependency status files before starting
- Collector reads all status files to determine merge set

**Dependency checking:**
- Slaves check `depends_on` by reading status files of dependency slaves
- If dependency is missing/running/failed, slave warns user and asks proceed/abort

**Stale slave detection:**
- PID check: `kill -0 <pid>` — if dead and status is "running", slave is stale
- Collector treats stale slaves as failed

## 8. Design Decrees

Design decrees are binding human rulings on ambiguous design decisions. They provide precedent that all skills must respect.

### 8.1 Why Decrees Exist

Skills discover ambiguity (multiple valid interpretations of PTU rules, conflicting architectural approaches, UX decisions without clear best practice). Without a mechanism for the human to rule on these, skills either guess (introducing inconsistency) or stall (wasting pipeline time). Decrees solve both.

### 8.2 Decree Lifecycle

1. **Discovery:** A skill encounters ambiguity during its work (review, audit, implementation)
2. **Ticket:** The skill creates a `decree-need` ticket in `tickets/open/decree/`
3. **Facilitation:** Human runs `/address_design_decrees` → Decree Facilitator presents options
4. **Ruling:** Human decides → Decree Facilitator records the ruling in `decrees/decree-NNN.md`
5. **Enforcement:** All skills check `decrees/` before acting and cite applicable decrees
6. **Implementation:** If the ruling requires code changes, implementation tickets are created

### 8.3 Decree Authority

- Decrees override all skill-level rulings, including Game Logic Reviewer interpretations
- If a decree contradicts PTU RAW, the decree still wins (it represents an intentional human choice)
- Decrees can be superseded by newer decrees (old decree gets `status: superseded`)
- Decree violations found by reviewers are CRITICAL severity

### 8.4 Skills Affected

| Skill | Decree Interaction |
|-------|-------------------|
| Senior Reviewer | Step 0b: Check decrees before reviewing. Cite in review. File decree-need for new ambiguities. |
| Game Logic Reviewer | Check decrees. Decrees override PTU RAW interpretations. File decree-need to recommend revisitation. |
| Implementation Auditor | Check decrees before classifying as Ambiguous. Decree match = Correct/Incorrect, not Ambiguous. |
| Developer | Read relevant decrees before implementing. Follow them exactly. |
| Master Planner | Scan decree-need tickets. Inject `{{RELEVANT_DECREES}}` into templates. Never assign decree-needs to slaves. |
| Slave Collector | Scan merged artifacts for ambiguity. Create decree-need tickets from AMBIGUOUS flags. |
| Decree Facilitator | Primary skill. Presents options, records rulings, creates implementation tickets. |

### 8.5 File Locations

| Type | Location |
|------|----------|
| Decrees | `decrees/decree-NNN.md` (project root) |
| Decree-need tickets | `artifacts/tickets/open/decree/decree-need-NNN.md` |
| Skill | `.claude/skills/decree-facilitator.md` |
| Command | `.claude/commands/address-design-decrees.md` |

## 9. UX Exploration Sessions

UX exploration sessions are simulated play sessions where 5 AI personas interact with the live app through real browsers, then report on the experience.

### 9.1 Why UX Sessions

Unit tests verify logic. The matrix verifies PTU rule coverage. Neither catches:
- Mobile layout breakdowns
- Multi-view sync problems (GM acts, player doesn't see update)
- Confusing flows for new users
- Missing UI for implemented backend features
- Performance issues under realistic multi-user load

UX sessions fill this gap with persona-based browser interaction.

### 9.2 The Party

Five fixed personas with diverse devices, viewports, PTU knowledge levels, and play styles. See `ux-sessions/party.md` for full profiles.

| Name | Role | Device | Viewport | Personality |
|------|------|--------|----------|-------------|
| Kaelen | GM | Laptop | 1280x800 | Methodical, rules-focused |
| Mira | Player | Phone | 390x844 | Enthusiastic, impatient |
| Dex | Player | Laptop | 1440x900 | Analytical, number-checker |
| Spark | Player | Phone | 360x780 | Casual, rule-ignorant |
| Riven | Player | Laptop | 1920x1080 | Strategic, edge-case tester |

### 9.3 Session Architecture

Each session uses 7 slaves:

```
Phase A: GM Setup (slave 1 — starts immediately)
  Kaelen → /gm → sets up scene/encounter

Phase B: Parallel Play (slaves 2-5 — start 60s after GM)
  All 4 players → /player → join, interact, report

Phase C: Post-Session (slaves 6-7 — after all browsers finish)
  Narrator reads all 5 reports → writes combined session-report.md
  Ticket Creator reads reports → creates bug/ux/feature/decree-need tickets
```

Coordination happens through the app (WebSocket sync), not between agents. No worktrees — UX slaves don't modify code.

### 9.4 Browser Automation

Agents use Playwright via Node.js scripts executed through Bash:
1. Agent writes a script using the `playwright` library
2. Executes via `node script.js`
3. Script launches browser with persona-specific viewport
4. Agent reads screenshots (multimodal) to understand screen state
5. Agent decides next action, writes another script
6. Repeat until session goals are met

### 9.5 Session Roadmap

UX sessions are blocking milestones — no dev work during a session:

1. After Player View complete → **ux-session-001** (basic combat + player flow)
2. After Scene System polish → **ux-session-002** (exploration + scenes)
3. After VTT Grid player integration → **ux-session-003** (tactical combat)
4. After Capture System polish → **ux-session-004** (capture flow)
5. Before release candidate → **ux-session-005** (comprehensive all-domains)

### 9.6 Output

- Individual reports per persona in `ux-sessions/reports/ux-session-NNN/`
- Combined session report by Narrator
- Tickets created by Ticket Creator in standard ticket directories
- Decree-need tickets for design questions surfaced during play

### 9.7 File Locations

| Type | Location |
|------|----------|
| Party profiles | `ux-sessions/party.md` |
| Scenarios | `ux-sessions/scenarios/ux-session-NNN.md` |
| Reports | `ux-sessions/reports/ux-session-NNN/` |
| UX Session Planner skill | `.claude/skills/ux-session-planner.md` |
| Command | `.claude/commands/ux-session.md` |
| GM template | `.claude/skills/templates/agent-ux-gm.md` |
| Player template | `.claude/skills/templates/agent-ux-player.md` |
| Narrator template | `.claude/skills/templates/agent-ux-narrator.md` |
| Ticket Creator template | `.claude/skills/templates/agent-ux-ticket-creator.md` |
