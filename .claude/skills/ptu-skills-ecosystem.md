# PTU Skills Ecosystem

Master reference for the 10-skill ecosystem that validates the PTU Session Helper through direct PTU rule-to-code coverage analysis. The ecosystem is organized into two logically separate halves — Dev and Matrix — coordinated by a master/slave orchestration system.

## Core Principle

The Feature Matrix drives the dev loop. Every PTU rule is extracted, every app capability is mapped, and the two are cross-referenced to find gaps and verify correctness. Development responds to matrix gaps and audit findings, not indirect scenario testing.

## Architecture

**Master/slave orchestration.** The master planner analyzes all pending work, assigns it to N slaves for parallel execution, and the collector merges results. This replaces the old single-unit ephemeral orchestrator — one plan covers all work items instead of running `/orchestrate` N times.

**Three-phase workflow:**
1. **Plan** (`/create_slave_plan`) — Master reads state, builds full work queue, assigns to N slaves, writes plan + launch script
2. **Execute** (`/slave N`) — Each slave creates a worktree, launches agents, commits to its branch, writes status, dies
3. **Collect** (`/collect_slaves`) — Collector merges all completed branches to master, updates state files, cleans up

**Git worktrees.** Each slave creates a dedicated worktree on a named branch (`slave/<N>-<type>-<target>-<timestamp>`). Agents work in isolation — no file conflicts. Results merge to master via rebase + fast-forward during collection.

**Template-based context injection.** Agent prompts use focused templates (~60-100 lines) from `.claude/skills/templates/` with `{{PLACEHOLDER}}` tokens replaced by dynamic data. Original skill files remain as reference documentation.

**Two ecosystems, one ticket boundary.** The Dev Ecosystem handles implementation, reviews, and code health. The Matrix Ecosystem handles rule extraction, capability mapping, coverage analysis, and implementation auditing. Only actionable work items cross the boundary as tickets.

**Playtesting is external.** Running Playwright tests against the app happens outside this ecosystem. The ecosystem produces coverage matrices and correctness audits.

## Architecture Diagram

```
    User runs /create_slave_plan
    │
    Master Planner
    ├ reads dev-state.md + test-state.md + all artifacts
    ├ builds full work queue (D1-D9 + M1-M7)
    ├ analyzes parallelism + dependencies
    ├ assigns N slaves
    ├ gathers template data for each
    ├ writes .worktrees/slave-plan.json
    ├ writes scripts/launch-slaves.sh
    └ dies
    │
    User runs launch-slaves.sh (or /slave N manually)
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
├── slave-plan.json          # Master writes, slaves + collector read
├── slave-status/            # One JSON per slave
│   ├── slave-1.json
│   ├── slave-2.json
│   └── ...
├── agents/                  # Legacy — from old orchestrator (unused)
└── claims/                  # Legacy — from old orchestrator (unused)
```

### Two-Ecosystem Diagram

```
                      MASTER PLANNER
                 (plans all work at once)
                 read state → build queue
                 → assign slaves → write plan
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
                                                           Master reads matrix,
                                                           creates tickets (M2)
```

* Retrospective Analyst reads both ecosystems

### Internal Loops

**Matrix Ecosystem Internal:**
- AMBIGUOUS audit items → Game Logic Reviewer (ruling) → re-audit
- App code changed → re-map capabilities → re-analyze → re-audit

**Dev Ecosystem Internal:**
- CHANGES_REQUIRED review → Developer (address feedback)
- Refactoring tickets → Developer → Senior Reviewer

### Cross-Ecosystem Flow

```
Master Planner ── reads matrix + audit ──→ creates bug/feature/ptu-rule tickets
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
| 8 | Implementation Auditor | `implementation-auditor.md` | `templates/agent-implementation-auditor.md` | matrix + source + rulebook | `matrix/<domain>-audit.md` |

### Coordination

| # | Skill | Skill File | Invoked By | Output |
|---|-------|-----------|------------|--------|
| 9 | Master Planner | `master-planner.md` | user (`/create_slave_plan`) | `slave-plan.json`, `launch-slaves.sh`, tickets (M2) |
| — | Slave Executor | `slave-executor.md` | user (`/slave N`) | branch commits, status file |
| — | Slave Collector | `slave-collector.md` | user (`/collect_slaves`) | state files, `alive-agents.md`, cleanup |
| 10 | Retrospective Analyst | `retrospective-analyst.md` | after cycles complete | `lessons/*.md` |

## Skill Files

```
.claude/skills/
├── ptu-skills-ecosystem.md              ← you are here
├── specification.md                      (full contracts and formats)
├── USAGE.md                              (workflow guide)
├── master-planner.md                     (master planning + slave assignment)
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
│   └── agent-retrospective-analyst.md
├── ptu-rule-extractor.md                 (reference — not embedded in prompts)
├── app-capability-mapper.md
├── coverage-analyzer.md
├── implementation-auditor.md
├── ptu-session-helper-dev.md
├── ptu-session-helper-senior-reviewer.md
├── game-logic-reviewer.md
├── retrospective-analyst.md
├── code-health-auditor.md
├── skill_creation.md                     (skill authoring guide)
└── references/
    ├── ptu-chapter-index.md              (rulebook lookup)
    ├── skill-interfaces.md               (data contracts)
    ├── app-surface.md                    (routes, APIs, stores)
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
│   └── <domain>-audit.md          Implementation Auditor writes → Master reads
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
| Pipeline sequencing, what to work on next | Master Planner |
| Rule extraction completeness | PTU Rule Extractor |
| Capability mapping completeness | App Capability Mapper |
| Coverage classification accuracy | Coverage Analyzer |
| Implementation correctness verification | Implementation Auditor |
| Gap detection and ticket creation | Master Planner (from matrix data) |
| Pattern identification and lesson accuracy | Retrospective Analyst |
| Structural code health issues and refactoring priority | Code Health Auditor |

## Orchestration Patterns

### Full Loop (new domain)
1. `/create_slave_plan` → plan includes Rule Extractor + Capability Mapper (parallel) for domain X
2. `bash scripts/launch-slaves.sh` → slaves execute in parallel
3. `/collect_slaves` → merge both to master
4. `/create_slave_plan` → plan includes Coverage Analyzer for domain X
5. Execute + collect
6. `/create_slave_plan` → plan includes Implementation Auditor for domain X
7. Execute + collect → Master creates tickets (M2) in next plan
8. `/create_slave_plan` → plan includes Developer slaves for highest-priority tickets

### Bug Fix Cycle (cross-ecosystem)
1. `/create_slave_plan` → slave-1: Developer fixes ticket, slave-2: Developer fixes another ticket (parallel)
2. Execute + collect
3. `/create_slave_plan` → slave-1: Reviewers for ticket A, slave-2: Reviewers for ticket B (parallel)
4. Execute + collect
5. `/create_slave_plan` → next priority tickets (or CHANGES_REQUIRED re-work)

### Mixed Ecosystem Work
1. `/create_slave_plan` → slave-1: Dev fixing bug-001, slave-2: Rule Extractor for healing, slave-3: Capability Mapper for healing (all parallel)
2. Execute + collect → all three merge to master in one pass

### Stale Artifact Detection
Master planner checks timestamps on startup:
- App code changed after capability mapping → re-map, re-analyze, re-audit
- Developer commit after latest approved review → re-review needed

## Detailed Contracts

See `specification.md` for full skill contracts, artifact format schemas, and examples.
See `.claude/skills/references/skill-interfaces.md` for YAML frontmatter templates and field definitions.
