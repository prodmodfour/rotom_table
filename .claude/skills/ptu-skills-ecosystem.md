# PTU Skills Ecosystem

Master reference for the 11-skill ecosystem that validates the PTU Session Helper through direct PTU rule-to-code coverage analysis. The ecosystem is organized into two logically separate halves — Dev and Matrix — coordinated by a master/slave orchestration system.

## Core Principle

The Feature Matrix drives the dev loop. Every PTU rule is extracted, every app capability is mapped, and the two are cross-referenced to find gaps and verify correctness. Development responds to matrix gaps and audit findings, not indirect scenario testing.

## Architecture

**Master/slave orchestration.** The orchestrator (survey → planner → launcher) analyzes all pending work, assigns it to N slaves for parallel execution, and the collector merges results. This replaces the old single-unit ephemeral orchestrator — one plan covers all work items instead of running `/orchestrate` N times.

**Four-phase workflow:**
1. **Survey** (`/survey`) — Reads state, builds full work queue, creates M2 tickets, writes `work-queue.json`
2. **Plan** (`/plan_slaves`) — Reads work queue, analyzes parallelism, assigns to N slaves, gathers templates, writes `slave-plan.json`
3. **Launch + Execute** (`/launch_slaves` then `/slave N`) — Launches tmux sessions; each slave creates a worktree, launches agents, commits to its branch, writes status, dies
4. **Collect** (`/collect_slaves`) — Collector merges all completed branches to master, updates state files, cleans up

**Git worktrees.** Each slave creates a dedicated worktree on a named branch (`slave/<N>-<type>-<target>-<timestamp>`). Agents work in isolation — no file conflicts. Results merge to master via rebase + fast-forward during collection.

**Template-based context injection.** Agent prompts use focused templates (~60-100 lines) from `.claude/skills/templates/` with `{{PLACEHOLDER}}` tokens replaced by dynamic data. Original skill files remain as reference documentation.

**Two ecosystems, one ticket boundary.** The Dev Ecosystem handles implementation, reviews, and code health. The Matrix Ecosystem handles rule extraction, capability mapping, coverage analysis, and implementation auditing. Only actionable work items cross the boundary as tickets.

**Playtesting is external.** Running Playwright tests against the app happens outside this ecosystem. The ecosystem produces coverage matrices and correctness audits.

## Architecture Diagram

```
    User runs /survey
    │
    Orchestrator Survey
    ├ reads dev-state.md + test-state.md + all artifacts
    ├ builds full work queue (D1-D9 + M1-M7)
    ├ creates M2 tickets inline
    ├ runs D3b design pre-flight
    ├ writes .worktrees/work-queue.json
    └ dies
    │
    User runs /plan_slaves
    │
    Orchestrator Planner
    ├ reads work-queue.json
    ├ analyzes parallelism + dependencies
    ├ assigns N slaves
    ├ gathers template data for each
    ├ writes .worktrees/slave-plan.json
    └ dies
    │
    User runs /launch_slaves
    │
    ┌───────────────┬───────────────┬───────────────┐
    │               │               │               │
    Slave 1         Slave 2         Slave 3         ...
    (Dev: bug-042)  (Dev: ptu-079)  (Review: 058)
    │               │               │
    ├ read plan     ├ read plan     ├ read plan
    ├ check deps    ├ check deps    ├ check deps
    ├ worktree      ├ worktree      ├ worktree
    ├ launch agent  ├ launch agent  ├ launch 2
    ├ write status  ├ write status  ├ write status
    └ die           └ die           └ die
    │
    User runs /collect_slaves
    │
    Collector
    ├ reads plan + all status files
    ├ proposes merge order to user
    ├ merges branches sequentially (rebase + ff)
    ├ updates state files (single commit)
    ├ cleans up worktrees + branches
    └ dies
```

### Coordination Layer

```
.worktrees/
├── work-queue.json          # Survey writes, planner reads
├── slave-plan.json          # Planner writes, slaves + collector read
├── slave-status/            # One JSON per slave
│   ├── slave-1.json
│   ├── slave-2.json
│   └── ...
├── agents/                  # Legacy — from old orchestrator (unused)
└── claims/                  # Legacy — from old orchestrator (unused)
```

### Two-Ecosystem Diagram

```
                  ORCHESTRATOR PIPELINE
              /survey → /plan_slaves → /launch_slaves
              read state → build queue → assign slaves
                  → write plan → launch tmux
                            │
         ┌─────────────────┼──────────────────────┐
         │                 │                       │
    DEV ECOSYSTEM     TICKET BOUNDARY      MATRIX ECOSYSTEM
         │                 │                       │
    Developer          ← bug tickets ←       Rule Extractor ──┐
    Senior Reviewer    ← feature tickets ←                    ├→ Coverage Analyzer
    Game Logic Rev     ← ptu-rule tickets ←  Capability Mapper┘        │
    Code Health Aud    ← ux tickets ←                         Implementation Auditor
    Retrospective*                                                     │
                                                              Browser Auditor
                                                                       │
                                                           Master reads matrix,
                                                           creates tickets (M2)
```

* Retrospective Analyst reads both ecosystems

### Internal Loops

**Matrix Ecosystem Internal:**
- AMBIGUOUS audit items → Game Logic Reviewer (ruling) → re-audit
- App code changed → re-map capabilities → re-analyze → re-audit → re-browser-audit
- ABSENT browser audit items → investigate (data seeding? conditional render?) → re-browser-audit

**Dev Ecosystem Internal:**
- CHANGES_REQUIRED review → Developer (address feedback)
- Refactoring tickets → Developer → Senior Reviewer

### Cross-Ecosystem Flow

```
Orchestrator Survey ── reads matrix + audit ──→ creates bug/feature/ptu-rule tickets
                                                   ↓
                                             Dev Developer (slave)
                                                   ↓
                                             Senior Reviewer ∥ Game Logic Reviewer (slave)
                                                   ↓
                                             Collector merges + updates state
```

## Skills Summary

Skills are loaded by slaves via templates. Original skill files serve as reference documentation.

### Dev Ecosystem

| # | Skill | Skill File | Template | Input | Output |
|---|-------|-----------|----------|-------|--------|
| 1 | Developer | `ptu-session-helper-dev.md` | `templates/agent-dev.md` | tickets, designs, reviews | code commits |
| 2 | Senior Reviewer | `ptu-session-helper-senior-reviewer.md` | `templates/agent-senior-reviewer.md` | code diffs + tickets | `reviews/code-review-*.md` |
| 3 | Game Logic Reviewer | `game-logic-reviewer.md` | `templates/agent-game-logic-reviewer.md` | code/audit ambiguities | `reviews/rules-review-*.md` |
| 4 | Code Health Auditor | `code-health-auditor.md` | `templates/agent-code-health-auditor.md` | source code under `app/` | `refactoring/*.md` |

### Matrix Ecosystem

| # | Skill | Skill File | Template | Input | Output |
|---|-------|-----------|----------|-------|--------|
| 5 | PTU Rule Extractor | `ptu-rule-extractor.md` | `templates/agent-rule-extractor.md` | PTU chapters + errata | `matrix/<domain>-rules.md` |
| 6 | App Capability Mapper | `app-capability-mapper.md` | `templates/agent-capability-mapper.md` | app source code | `matrix/<domain>-capabilities.md` |
| 7 | Coverage Analyzer | `coverage-analyzer.md` | `templates/agent-coverage-analyzer.md` | rules + capabilities | `matrix/<domain>-matrix.md` |
| 8 | Implementation Auditor | `implementation-auditor.md` | `templates/agent-implementation-auditor.md` | matrix + source + rulebook | `matrix/<domain>/audit/` |
| 9 | Browser Auditor | `browser-auditor.md` | `templates/agent-browser-auditor.md` | capabilities + matrix + audit | `matrix/<domain>/browser-audit/` |

### Coordination

| # | Skill | Skill File | Invoked By | Output |
|---|-------|-----------|------------|--------|
| 9a | Orchestrator Survey | `orchestrator-survey.md` | user (`/survey`) | `work-queue.json`, tickets (M2) |
| 9b | Orchestrator Planner | `orchestrator-planner.md` | user (`/plan_slaves`) | `slave-plan.json` |
| 9c | Orchestrator Launcher | `orchestrator-launcher.md` | user (`/launch_slaves`) | tmux sessions |
| — | Slave Executor | `slave-executor.md` | user (`/slave N`) | branch commits, status file |
| — | Slave Collector | `slave-collector.md` | user (`/collect_slaves`) | state files, `alive-agents.md`, cleanup |
| 10 | Retrospective Analyst | `retrospective-analyst.md` | after cycles complete | `lessons/*.md` |

**Note:** The Matrix Ecosystem pipeline has 5 stages: Rule Extraction → Capability Mapping → Coverage Analysis → Implementation Audit → Browser Audit.

## Skill Files

```
.claude/skills/
├── ptu-skills-ecosystem.md              ← you are here
├── specification.md                      (full contracts and formats)
├── USAGE.md                              (workflow guide)
├── orchestrator-survey.md                (phase 1: state reading + work queue)
├── orchestrator-planner.md               (phase 2: parallelism + slave assignment)
├── orchestrator-launcher.md              (phase 3: tmux launch)
├── slave-executor.md                     (per-slave execution lifecycle)
├── slave-collector.md                    (merge + state update + cleanup)
├── templates/                            (agent context injection templates)
│   ├── agent-dev.md
│   ├── agent-senior-reviewer.md
│   ├── agent-game-logic-reviewer.md
│   ├── agent-code-health-auditor.md
│   ├── agent-rule-extractor.md
│   ├── agent-capability-mapper.md
│   ├── agent-coverage-analyzer.md
│   ├── agent-implementation-auditor.md
│   ├── agent-browser-auditor.md
│   └── agent-retrospective-analyst.md
├── ptu-rule-extractor.md                 (reference — not embedded in prompts)
├── app-capability-mapper.md
├── coverage-analyzer.md
├── implementation-auditor.md
├── browser-auditor.md
├── ptu-session-helper-dev.md
├── ptu-session-helper-senior-reviewer.md
├── game-logic-reviewer.md
├── retrospective-analyst.md
├── code-health-auditor.md
├── skill_creation.md                     (skill authoring guide)
└── references/
    ├── orchestration-tables.md           (shared tables for survey/planner/launcher)
    ├── ptu-chapter-index.md              (rulebook lookup)
    ├── skill-interfaces.md               (data contracts)
    ├── app-surface.md                    (routes, APIs, stores)
    ├── browser-audit-routes.md           (route mapping for browser auditor)
    └── playwright-patterns.md            (e2e patterns — for external testing)
```

## Artifact Flow

```
artifacts/
├── tickets/               Cross-ecosystem communication
│   ├── bug/               Master writes (from audit) → Developer reads
│   ├── ptu-rule/          Master/Game Logic Reviewer writes → Developer reads
│   ├── feature/           Master writes (from matrix) → Developer reads
│   └── ux/                Master writes (from matrix) → Developer reads
├── matrix/                Feature Matrix workflow artifacts
│   ├── <domain>-rules.md          Rule Extractor writes → Coverage Analyzer reads
│   ├── <domain>-capabilities.md   Capability Mapper writes → Coverage Analyzer reads
│   ├── <domain>-matrix.md         Coverage Analyzer writes → Auditor reads, Master reads
│   ├── <domain>-audit.md          Implementation Auditor writes → Master reads
│   └── <domain>/browser-audit/    Browser Auditor writes → Master reads
├── designs/               Developer writes (when feature ticket needs design) → shared read zone
├── lessons/               Retrospective Analyst writes → all skills read
├── refactoring/           Code Health Auditor writes → Developer/Reviewer reads
├── reviews/               Senior Reviewer + Game Logic Reviewer write → Collector/Developer reads
├── alive-agents.md        Completed slave session log (collector writes)
├── dev-state.md           Collector writes → Dev skills read
└── test-state.md          Collector writes → Matrix skills read
```

## Authority Hierarchy

| Domain | Final Authority |
|--------|----------------|
| PTU game logic, formulas, rule interpretation | Game Logic Reviewer |
| Code quality, architecture, patterns | Senior Reviewer |
| Pipeline sequencing, what to work on next | Orchestrator Survey + Planner |
| Rule extraction completeness | PTU Rule Extractor |
| Capability mapping completeness | App Capability Mapper |
| Coverage classification accuracy | Coverage Analyzer |
| Implementation correctness verification | Implementation Auditor |
| Browser-level capability verification | Browser Auditor |
| Gap detection and ticket creation | Orchestrator Survey (from matrix data) |
| Pattern identification and lesson accuracy | Retrospective Analyst |
| Structural code health issues and refactoring priority | Code Health Auditor |

## Orchestration Patterns

### Full Loop (new domain)
1. `/survey → /plan_slaves → /launch_slaves` → plan includes Rule Extractor + Capability Mapper (parallel) for domain X
2. `bash scripts/launch-slaves.sh` → slaves execute in parallel
3. `/collect_slaves` → merge both to master
4. `/survey → /plan_slaves → /launch_slaves` → plan includes Coverage Analyzer for domain X
5. Execute + collect
6. `/survey → /plan_slaves → /launch_slaves` → plan includes Implementation Auditor for domain X
7. Execute + collect
8. `/survey → /plan_slaves → /launch_slaves` → plan includes Browser Auditor for domain X
9. Execute + collect → Master creates tickets (M2) in next plan
10. `/survey → /plan_slaves → /launch_slaves` → plan includes Developer slaves for highest-priority tickets

### Bug Fix Cycle (cross-ecosystem)
1. `/survey → /plan_slaves → /launch_slaves` → slave-1: Developer fixes ticket, slave-2: Developer fixes another ticket (parallel)
2. Execute + collect
3. `/survey → /plan_slaves → /launch_slaves` → slave-1: Reviewers for ticket A, slave-2: Reviewers for ticket B (parallel)
4. Execute + collect
5. `/survey → /plan_slaves → /launch_slaves` → next priority tickets (or CHANGES_REQUIRED re-work)

### Mixed Ecosystem Work
1. `/survey → /plan_slaves → /launch_slaves` → slave-1: Dev fixing bug-001, slave-2: Rule Extractor for healing, slave-3: Capability Mapper for healing (all parallel)
2. Execute + collect → all three merge to master in one pass

### Stale Artifact Detection
Orchestrator survey checks timestamps on startup:
- App code changed after capability mapping → re-map, re-analyze, re-audit
- Developer commit after latest approved review → re-review needed

## Detailed Contracts

See `specification.md` for full skill contracts, artifact format schemas, and examples.
See `.claude/skills/references/skill-interfaces.md` for YAML frontmatter templates and field definitions.
