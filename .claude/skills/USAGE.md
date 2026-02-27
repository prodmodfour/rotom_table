# PTU Skills Ecosystem — Usage Guide

How to use the master/slave orchestration system to validate the PTU Session Helper app.

## What Changed (v2 → v3)

| Behavior | v2 (Ephemeral Orchestrator) | v3 (Master/Slave) |
|----------|---------------------------|-------------------|
| Planning | One item per `/orchestrate` call | ALL items planned at once via `/create_slave_plan` |
| Execution | Orchestrator claims, executes, merges, dies | Slaves execute in parallel, collector merges |
| Parallelism | Manual — run `/orchestrate` N times | Automatic — master assigns N slaves with dependency DAG |
| Merging | Each orchestrator merges its own work | Collector merges all branches in planned order |
| State updates | Each orchestrator updates state files | Collector does one atomic state update |
| Conflict handling | Race conditions on merge | Pre-analyzed conflict zones with planned merge order |
| Context gathering | Each orchestrator gathers independently | Master gathers ALL context upfront, stores in plan |
| Launch | Manual per-terminal | Master launches tmux sessions directly |

## Three-Phase Architecture

```
Phase 1: PLAN                    Phase 2: EXECUTE              Phase 3: COLLECT
/create_slave_plan               /slave 1  /slave 2  /slave 3  /collect_slaves
      │                              │         │         │           │
 Master Planner                  Slave 1    Slave 2   Slave 3    Collector
 ├ read state                    ├ read plan ├ read... ├ read...  ├ read status
 ├ build work queue              ├ worktree  ├ ...     ├ ...      ├ merge branches
 ├ analyze parallelism           ├ launch    ├ ...     ├ ...      ├ update state
 ├ assign N slaves               ├ commit    ├ ...     ├ ...      ├ cleanup
 ├ gather template data          ├ status    ├ ...     ├ ...      └ die
 ├ write plan                    └ die       └ die     └ die
 ├ launch tmux sessions
 ├ verify startup
 └ die
```

Dev Ecosystem: Developer, Senior Reviewer, Game Logic Reviewer, Code Health Auditor
Matrix Ecosystem: PTU Rule Extractor, App Capability Mapper, Coverage Analyzer, Implementation Auditor
Cross-cutting: Retrospective Analyst, Master Planner, Decree Facilitator
UX Ecosystem: UX Session Planner, UX GM/Player/Narrator/Ticket Creator agents

**Playtesting uses UX exploration sessions.** The `/ux_session` command launches 5 browser agents that interact with the live app and report on the experience.

## Quick Start

### Step 1 — Create a Slave Plan

Open a Claude Code terminal and run:
```
/create_slave_plan
```

The master planner will:
1. Read all pipeline state (dev-state.md, test-state.md, tickets, matrix artifacts)
2. Build a queue of ALL actionable work items
3. Analyze which items can run in parallel
4. Assign items to N slaves with dependency tracking
5. Gather all template data for each slave
6. Write `.worktrees/slave-plan.json`
7. Show you a summary table and wait for confirmation

Say "go" and the master will launch tmux sessions, start Claude in each, send `/slave N`, and verify all slaves accepted the command.

### Step 2 — Wait for Completion

Each slave will:
1. Read its assignment from the plan
2. Create a git worktree on a dedicated branch
3. Launch the appropriate agent(s)
4. Commit results to its branch
5. Write a status file and die

Monitor progress via tmux (`tmux attach -t slaves`) or check status files in `.worktrees/slave-status/`.

### Step 3 — Collect Results

When all slaves are done, run:
```
/collect_slaves
```

The collector will:
1. Read all status files and the plan
2. Show you a merge plan with conflict assessment
3. Merge branches to master in the planned order (rebase + fast-forward)
4. Update state files in a single atomic commit
5. Clean up worktrees, branches, and status files
6. Suggest what to plan next

## Parallel Work Patterns

### Safe Parallelism (same plan)

| Can run in parallel | Why |
|---|---|
| Dev tickets on different files/domains | Independent worktrees, no file overlap |
| Senior Reviewer + Game Logic Reviewer for same fix | Independent review concerns (dual mode) |
| Rule Extractor + Capability Mapper for same domain | Independent inputs/outputs |
| Matrix work across different domains | Independent domains |
| Dev ecosystem + Matrix ecosystem | Separate concerns |
| Code Health Auditor + dev work | Auditor reads only |

| Must be sequential (dependency) | Why |
|---|---|
| Coverage Analyzer needs rules + capabilities | Input dependency |
| Implementation Auditor needs matrix | Input dependency |
| Reviewers need the dev commit to exist | Review target dependency |
| Dev tickets on same domain | Merge conflict risk |

### Example: Full Domain Analysis

```
Plan 1: /create_slave_plan
  slave-1: Rule Extractor for healing
  slave-2: Capability Mapper for healing (parallel with slave-1)
  → launch, collect

Plan 2: /create_slave_plan
  slave-1: Coverage Analyzer for healing
  → launch, collect

Plan 3: /create_slave_plan
  slave-1: Implementation Auditor for healing
  → launch, collect (master creates tickets via M2)

Plan 4: /create_slave_plan
  slave-1: Developer for bug-042
  slave-2: Developer for ptu-rule-078 (parallel with slave-1)
  slave-3: Developer for ptu-rule-079 (parallel — different domain)
  → launch, collect
```

### Example: Bug Fix + Review Cycle

```
Plan 1: /create_slave_plan
  slave-1: Developer fixes ptu-rule-079
  slave-2: Developer fixes ptu-rule-080 (parallel, different domain)
  → launch, collect

Plan 2: /create_slave_plan
  slave-1: Reviewers for ptu-rule-079
  slave-2: Reviewers for ptu-rule-080 (parallel)
  → launch, collect

  Both approved? → Plan 3 with next tickets
  CHANGES_REQUIRED? → Plan 3 includes re-work as highest priority
```

### Example: Mixed Ecosystem Work

```
Plan 1: /create_slave_plan
  slave-1: Developer fixing bug-001 (dev ecosystem)
  slave-2: Rule Extractor for healing (matrix ecosystem)
  slave-3: Capability Mapper for healing (matrix, parallel with slave-2)
  → launch, collect → all three merge in one pass
```

## Coordination Mechanism

### Slave Plan (`.worktrees/slave-plan.json`)
- Master planner writes the plan with all slave assignments
- Each slave reads its assignment by `slave_id`
- Collector reads the plan for merge order and conflict zones
- Plan includes pre-gathered template data for each slave

### Slave Status (`.worktrees/slave-status/`)
- Each slave writes a JSON file with its status, commits, and artifacts
- Other slaves check dependency status files before starting
- Collector reads all status files to determine merge set

### Git Worktrees
- Branch naming: `slave/<N>-<type>-<target>-<timestamp>`
- Slaves commit to their branches — never to master
- Collector merges via rebase + fast-forward (linear history)
- Retry on race: up to 3x with backoff during collection
- `app/node_modules` symlinked for import resolution

### Tmux Sessions
- Master planner creates a `slaves` tmux session with one window per slave
- Launches Claude Code in each window and sends `/slave N` via `-H 0D` (raw carriage return)
- Verifies each slave accepted the command before reporting launch status

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

All artifacts live under `artifacts/`:

```
artifacts/
├── tickets/               # Cross-ecosystem communication
│   ├── bug/               # Bug tickets (Master from audit → Dev)
│   ├── ptu-rule/          # PTU rule tickets (Master/GLR → Dev)
│   ├── feature/           # Feature gap tickets (Master from matrix → Dev)
│   └── ux/                # UX gap tickets (Master from matrix → Dev)
├── matrix/                # Feature Matrix workflow
│   ├── <domain>-rules.md          # PTU Rule Extractor output
│   ├── <domain>-capabilities.md   # App Capability Mapper output
│   ├── <domain>-matrix.md         # Coverage Analyzer output
│   └── <domain>-audit.md          # Implementation Auditor output
├── designs/               # Feature design specs
├── refactoring/           # Refactoring tickets + audit summary
├── reviews/               # Code + rules reviews
├── lessons/               # Retrospective lessons
├── alive-agents.md        # Completed slave session log
├── dev-state.md           # Dev ecosystem state
└── test-state.md          # Matrix ecosystem state
```

## Design Decrees

When skills encounter ambiguous design decisions, they create `decree-need` tickets. These require human ruling.

### Workflow

```
Skill discovers ambiguity → creates decree-need ticket
  ↓
/address_design_decrees
  ↓
Decree Facilitator presents options → human decides
  ↓
Ruling recorded as decree-NNN → implementation tickets created
  ↓
All skills cite and enforce the decree going forward
```

### Commands

- **`/address_design_decrees`** — Scan open decree-need tickets and facilitate human rulings
- Decrees live in `decrees/` (project root)
- Decree-need tickets live in `artifacts/tickets/open/decree/`

### Key Rules

- Decrees override all skill-level rulings (including Game Logic Reviewer)
- Decree violations are CRITICAL severity in reviews
- Master Planner never assigns decree-needs to slaves (they require human)
- Master Planner reports open decree-needs in its plan summary

## UX Exploration Sessions

Simulated play sessions where 5 AI personas interact with the live app through real browsers.

### Workflow

```
1. Start the app: cd app && npm run dev
2. /ux_session ux-session-001
3. UX Session Planner builds 7-slave plan
4. Say "go" → launches tmux sessions
5. GM (Kaelen) sets up encounter
6. 4 players join after 60s delay
7. All 5 write individual reports
8. Narrator synthesizes combined report
9. Ticket Creator files bug/ux/feature/decree-need tickets
10. /collect_slaves to review results
```

### Party (fixed)

| Name | Role | Device | Viewport |
|------|------|--------|----------|
| Kaelen | GM | Laptop | 1280x800 |
| Mira | Player | Phone | 390x844 |
| Dex | Player | Laptop | 1440x900 |
| Spark | Player | Phone | 360x780 |
| Riven | Player | Laptop | 1920x1080 |

### Session Roadmap (blocking milestones)

1. After Player View → ux-session-001 (basic combat + player flow)
2. After Scene polish → ux-session-002 (exploration + scenes)
3. After VTT player integration → ux-session-003 (tactical combat)
4. After Capture polish → ux-session-004 (capture flow)
5. Before release → ux-session-005 (comprehensive)

**During UX sessions:** No dev or matrix slaves. Live server dedicated to the session.

### Files

- Party profiles: `ux-sessions/party.md`
- Scenarios: `ux-sessions/scenarios/ux-session-NNN.md`
- Reports: `ux-sessions/reports/ux-session-NNN/`

## Tips

- **Four commands.** `/create_slave_plan` (dev/matrix) → `/collect_slaves` (merge). `/ux_session` (UX testing) → `/collect_slaves` (review). `/address_design_decrees` (human rulings).
- **One plan at a time.** Don't create a new plan while slaves are running. Collect first.
- **Single-slave plans are fine.** If there's only one work item, the plan will have one slave — equivalent to the old `/orchestrate`.
- **Check slave status.** Look at `.worktrees/slave-status/` to see which slaves are done.
- **Failed slaves are preserved.** The collector skips failed slaves and preserves their worktrees for debugging.
- **Templates keep agents focused.** ~60-100 lines of static rules + dynamic context instead of ~200-300 lines of full skill files.
- **Follow the collector's suggestions.** It tells you what to plan next based on updated state.
- **Address decrees promptly.** Open decree-needs block work that depends on the ruling.
