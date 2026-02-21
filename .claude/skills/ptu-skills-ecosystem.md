# PTU Skills Ecosystem

Master reference for the 10-skill ecosystem that validates the PTU Session Helper through direct PTU rule-to-code coverage analysis. The ecosystem is organized into two logically separate halves — Dev and Matrix — coordinated by ephemeral orchestrators.

## Core Principle

The Feature Matrix drives the dev loop. Every PTU rule is extracted, every app capability is mapped, and the two are cross-referenced to find gaps and verify correctness. Development responds to matrix gaps and audit findings, not indirect scenario testing.

## Architecture

**Ephemeral orchestrators.** Each orchestrator handles exactly one unit of work (1 Dev ticket or 2 reviewers), then dies. Multiple orchestrators run in parallel via separate terminals. They coordinate through filesystem primitives (lock files, agent JSON, git worktrees).

**Git worktrees.** Each orchestrator creates a dedicated worktree on a named branch (`agent/<type>-<target>-<timestamp>`). Agents work in isolation — no file conflicts. Results merge to master via rebase + fast-forward.

**Template-based context injection.** Agent prompts use focused templates (~60-100 lines) from `.claude/skills/templates/` with `{{PLACEHOLDER}}` tokens replaced by dynamic data. Original skill files remain as reference documentation.

**Two ecosystems, one ticket boundary.** The Dev Ecosystem handles implementation, reviews, and code health. The Matrix Ecosystem handles rule extraction, capability mapping, coverage analysis, and implementation auditing. Only actionable work items cross the boundary as tickets.

**Playtesting is external.** Running Playwright tests against the app happens outside this ecosystem. The ecosystem produces coverage matrices and correctness audits.

## Architecture Diagram

```
    User launches N orchestrators (separate terminals / tmux panes)
    │
    ┌───────────────┬───────────────┬───────────────┐
    │               │               │               │
    Orch A          Orch B          Orch C          ...
    (Dev: bug-042)  (Review: 057)   (Matrix: heal)
    │               │               │
    ├ claim lock    ├ claim lock    ├ claim lock
    ├ worktree      ├ worktree      ├ worktree
    ├ inject ctx    ├ inject ctx    ├ inject ctx
    ├ launch agent  ├ launch 2      ├ launch agent
    ├ merge master  ├ merge master  ├ merge master
    └ die           └ die           └ die
```

### Coordination Layer

```
.worktrees/
├── agents/              # JSON per active orchestrator (PID, branch, status)
│   └── orch-<ts>.json
└── claims/              # Lock file per claimed work item
    └── <target>.lock
```

- **Claiming:** `touch .worktrees/claims/<target>.lock` (atomic on POSIX)
- **Stale detection:** PID check (`kill -0`) + 3-hour timeout
- **Cleanup:** Remove lock + agent JSON + worktree on completion or staleness

### Two-Ecosystem Diagram

```
                         ORCHESTRATORS
                    (ephemeral, N in parallel)
                    read state → claim → worktree
                    → inject context → launch agent
                    → merge → cleanup → die
                               │
            ┌──────────────────┼──────────────────────┐
            │                  │                       │
       DEV ECOSYSTEM     TICKET BOUNDARY      MATRIX ECOSYSTEM
            │                  │                       │
       Developer          ← bug tickets ←       Rule Extractor ──┐
       Senior Reviewer    ← feature tickets ←                    ├→ Coverage Analyzer
       Game Logic Rev     ← ptu-rule tickets ←  Capability Mapper┘        │
       Code Health Aud    ← ux tickets ←                         Implementation Auditor
       Retrospective*                                                     │
                                                              Orchestrator reads matrix,
                                                              creates tickets
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
Orchestrator ──── reads matrix + audit ────→ creates bug/feature/ptu-rule tickets
                                                      ↓
                                                Dev Developer
                                                      ↓
                                                Senior Reviewer ∥ Game Logic Reviewer
                                                      ↓
                                                Orchestrator updates state
```

## Skills Summary

Skills are loaded by the orchestrator via templates. Original skill files serve as reference documentation.

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
| 9 | Orchestrator | `orchestrator.md` | user (`/orchestrate`) | state files, tickets, worktree coordination |
| 10 | Retrospective Analyst | `retrospective-analyst.md` | after cycles complete | `lessons/*.md` |

## Skill Files

```
.claude/skills/
├── ptu-skills-ecosystem.md              ← you are here
├── specification.md                      (full contracts and formats)
├── USAGE.md                              (workflow guide)
├── orchestrator.md                       (ephemeral orchestrator lifecycle)
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
│   ├── bug/               Orchestrator writes (from audit) → Developer reads
│   ├── ptu-rule/          Orchestrator/Game Logic Reviewer writes → Developer reads
│   ├── feature/           Orchestrator writes (from matrix) → Developer reads
│   └── ux/                Orchestrator writes (from matrix) → Developer reads
├── matrix/                Feature Matrix workflow artifacts
│   ├── <domain>-rules.md          Rule Extractor writes → Coverage Analyzer reads
│   ├── <domain>-capabilities.md   Capability Mapper writes → Coverage Analyzer reads
│   ├── <domain>-matrix.md         Coverage Analyzer writes → Auditor reads, Orchestrator reads
│   └── <domain>-audit.md          Implementation Auditor writes → Orchestrator reads
├── designs/               Developer writes (when feature ticket needs design) → shared read zone
├── lessons/               Retrospective Analyst writes → all skills read
├── refactoring/           Code Health Auditor writes → Developer/Reviewer reads
├── reviews/               Senior Reviewer + Game Logic Reviewer write → Orchestrator/Developer reads
├── alive-agents.md        Completed orchestrator session log
├── dev-state.md           Orchestrator writes → Dev skills read
└── test-state.md          Orchestrator writes → Matrix skills read
```

## Authority Hierarchy

| Domain | Final Authority |
|--------|----------------|
| PTU game logic, formulas, rule interpretation | Game Logic Reviewer |
| Code quality, architecture, patterns | Senior Reviewer |
| Pipeline sequencing, what to analyze next | Orchestrator |
| Rule extraction completeness | PTU Rule Extractor |
| Capability mapping completeness | App Capability Mapper |
| Coverage classification accuracy | Coverage Analyzer |
| Implementation correctness verification | Implementation Auditor |
| Gap detection and ticket creation | Orchestrator (from matrix data) |
| Pattern identification and lesson accuracy | Retrospective Analyst |
| Structural code health issues and refactoring priority | Code Health Auditor |

## Orchestration Patterns

### Full Loop (new domain)
1. `/orchestrate` → "Rule Extractor for domain X" (Terminal 1)
2. `/orchestrate` → "Capability Mapper for domain X" (Terminal 2, parallel)
3. Both complete → `/orchestrate` → "Coverage Analyzer for domain X"
4. Complete → `/orchestrate` → "Implementation Auditor for domain X"
5. Complete → `/orchestrate` → "Creating tickets" → orchestrator creates bug/feature/ptu-rule tickets
6. `/orchestrate` → "Developer for bug-001" (highest priority ticket)

### Bug Fix Cycle (cross-ecosystem)
1. `/orchestrate` → Developer fixes ticket → commits on worktree branch → merges to master → dies
2. `/orchestrate` → Senior Reviewer + Game Logic Reviewer (both launched in parallel) → merge reviews → die
3. `/orchestrate` → next priority ticket (or CHANGES_REQUIRED re-work)

### Parallel Work
Multiple orchestrators running simultaneously:
- Orch A: Developer fixing bug-001
- Orch B: Rule Extractor for healing domain
- Orch C: Capability Mapper for healing domain (parallel with B)

### Stale Artifact Detection
Each orchestrator checks timestamps on startup:
- App code changed after capability mapping → re-map, re-analyze, re-audit
- Developer commit after latest approved review → re-review needed

## Detailed Contracts

See `specification.md` for full skill contracts, artifact format schemas, and examples.
See `.claude/skills/references/skill-interfaces.md` for YAML frontmatter templates and field definitions.
