# PTU Skills Ecosystem — Usage Guide

How to use the 10-skill two-ecosystem pipeline to validate the PTU Session Helper app.

## What Changed (v1 → v2)

| Behavior | v1 (Persistent) | v2 (Ephemeral) |
|----------|------------------|-----------------|
| Lifecycle | One long-lived orchestrator session | One session per work unit — claims, executes, dies |
| Parallelism | Single orchestrator, serialized decisions | N orchestrators in parallel (e.g., separate tmux panes) |
| Follow-ups | Auto-launched (reviewers after dev) | Suggested in death report — user launches manually |
| Context | Full skill files embedded (~200-300 lines each) | Focused templates (~60-100 lines) with dynamic injection |
| File conflicts | Possible (shared working directory) | Impossible (git worktrees isolate each agent) |
| Coordination | In-memory (single session state) | File-based (`.worktrees/agents/`, `.worktrees/claims/`) |
| Merge | Direct commits to master | Rebase + fast-forward from worktree branch |

## Two-Ecosystem Architecture

```
Orchestrator A          Orchestrator B           Orchestrator C
(Dev: ptu-rule-058)     (Reviewers: ptu-rule-057) (Matrix: healing)
      │                       │                        │
      ├─ claim lock           ├─ claim lock            ├─ claim lock
      ├─ git worktree         ├─ git worktree          ├─ git worktree
      ├─ launch Dev agent     ├─ launch 2 reviewers    ├─ launch Mapper
      ├─ merge to master      ├─ merge to master       ├─ merge to master
      └─ die                  └─ die                   └─ die
```

Dev Ecosystem: Developer, Senior Reviewer, Game Logic Reviewer, Code Health Auditor
Matrix Ecosystem: PTU Rule Extractor, App Capability Mapper, Coverage Analyzer, Implementation Auditor
Cross-cutting: Retrospective Analyst, Orchestrator

**Playtesting is external.** The ecosystem produces coverage matrices and correctness audits.

## Quick Start

### Step 1 — Launch an Orchestrator

Open a Claude Code terminal and run:
```
/orchestrate
```

It reads pipeline state, checks for active agents, and proposes the highest-priority unclaimed work.

### Step 2 — Confirm and Go

The orchestrator shows you:
- Currently active orchestrators (if any)
- Recently completed work
- Proposed next action

Say "go" to proceed. The orchestrator will:
1. Claim the work item (lock file)
2. Create a git worktree on a named branch
3. Prepare focused context from templates
4. Launch the appropriate agent(s)
5. Wait for completion
6. Merge results to master
7. Update state files
8. Clean up and die

### Step 3 — Launch More (Optional)

While one orchestrator runs, open another terminal and run `/orchestrate` again. It will see the first orchestrator's claim and propose different work. You can run as many in parallel as you want — claim locks prevent conflicts, git worktrees prevent file collisions.

### Step 4 — Follow the Death Report

When an orchestrator dies, it suggests what to launch next:
- Dev completed → "Launch review orchestrator for <ticket>"
- Reviews approved → "Next priority: <ticket>"
- Reviews CHANGES_REQUIRED → "Launch dev for re-work on <ticket>"

## Parallel Work Patterns

### Safe Parallelism

| Can run in parallel | Why |
|---|---|
| Dev tickets on different files/domains | Independent worktrees |
| Senior Reviewer + Game Logic Reviewer for same fix | Independent review concerns |
| Rule Extractor + Capability Mapper for same domain | Independent inputs |
| Matrix work across different domains | Independent domains |
| Dev ecosystem + Matrix ecosystem | Separate concerns |

| Must be sequential | Why |
|---|---|
| Coverage Analyzer needs rules + capabilities | Input dependency |
| Implementation Auditor needs matrix | Input dependency |
| Reviewers need the dev commit to exist | Review target dependency |

### Example: Full Domain Analysis

```
Terminal 1: /orchestrate → Rule Extractor for healing
Terminal 2: /orchestrate → Capability Mapper for healing (parallel with T1)
  ... both complete ...
Terminal 3: /orchestrate → Coverage Analyzer for healing
  ... completes ...
Terminal 4: /orchestrate → Implementation Auditor for healing
  ... completes, creates tickets ...
Terminal 5: /orchestrate → Developer for bug-042
Terminal 6: /orchestrate → Developer for ptu-rule-078 (parallel with T5)
```

### Example: Bug Fix Cycle

```
Terminal 1: /orchestrate → Developer fixes ptu-rule-058
  ... completes, death report suggests reviewers ...
Terminal 2: /orchestrate → Reviewers for ptu-rule-058
  ... both approve ...
  Done. Death report suggests next priority ticket.
```

## Coordination Mechanism

### Lock Files (`.worktrees/claims/`)
- Each orchestrator touches a `.lock` file for its claimed work
- If the file already exists → work is taken, pick another target
- Lock is removed on completion or stale agent cleanup

### Agent Registry (`.worktrees/agents/`)
- Each orchestrator writes a JSON file with its ID, type, target, branch, PID
- Other orchestrators read this to see what's active
- Stale detection: PID check (`kill -0`) + 3-hour timeout

### Git Worktrees
- Branch naming: `agent/<type>-<target>-<timestamp>`
- Merge: rebase + fast-forward (linear history)
- Retry on race: up to 3x with backoff
- `app/node_modules` symlinked for import resolution

## Domains

| Domain | What it covers |
|--------|---------------|
| `combat` | Damage, initiative, turns, type effectiveness, STAB |
| `capture` | Pokeball mechanics, capture rate, status effects |
| `healing` | Pokemon Center, rest, injuries |
| `character-lifecycle` | Character creation, stats, leveling |
| `pokemon-lifecycle` | Pokemon creation, evolution, moves, abilities |
| `encounter-tables` | Wild encounters, table generation |
| `scenes` | Scene management, GM/group sync |
| `vtt-grid` | Virtual tabletop grid, movement, terrain |

## Artifact Locations

All artifacts live under `app/tests/e2e/artifacts/`:

```
artifacts/
├── tickets/               # Cross-ecosystem communication
│   ├── bug/               # Bug tickets (Orchestrator from audit → Dev)
│   ├── ptu-rule/          # PTU rule tickets (Orchestrator/GLR → Dev)
│   ├── feature/           # Feature gap tickets (Orchestrator from matrix → Dev)
│   └── ux/                # UX gap tickets (Orchestrator from matrix → Dev)
├── matrix/                # Feature Matrix workflow
│   ├── <domain>-rules.md          # PTU Rule Extractor output
│   ├── <domain>-capabilities.md   # App Capability Mapper output
│   ├── <domain>-matrix.md         # Coverage Analyzer output
│   └── <domain>-audit.md          # Implementation Auditor output
├── designs/               # Feature design specs
├── refactoring/           # Refactoring tickets + audit summary
├── reviews/               # Code + rules reviews
├── lessons/               # Retrospective lessons
├── alive-agents.md        # Completed orchestrator session log
├── dev-state.md           # Dev ecosystem state
└── test-state.md          # Matrix ecosystem state
```

## Tips

- **Run `/orchestrate` in a fresh terminal.** Each orchestrator is ephemeral — it does one thing and dies.
- **Parallel is the default.** Open multiple terminals for maximum throughput.
- **Follow death reports.** They tell you exactly what to launch next.
- **Don't worry about conflicts.** Claim locks prevent double-work, worktrees prevent file collisions, rebase+ff-merge keeps history linear.
- **Stale agents are auto-detected.** If an orchestrator crashes, the next one cleans up via PID check.
- **Templates keep agents focused.** ~60-100 lines of static rules + dynamic context instead of ~200-300 lines of full skill files.
