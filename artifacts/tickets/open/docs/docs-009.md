---
id: docs-009
title: "Add CLAUDE.md for artifacts/"
priority: P0
severity: MEDIUM
status: open
domain: workflow
source: plan-descendant-claude-md-rollout
created_by: user
created_at: 2026-03-02
phase: 3
affected_files:
  - artifacts/CLAUDE.md (new)
---

# docs-009: Add CLAUDE.md for artifacts/

## Summary

Create a descendant CLAUDE.md in `artifacts/` to document the artifact ecosystem structure, ticket lifecycle, and index regeneration. Skill agents (Master Planner, Slave Collector, reviewers) interact heavily with this directory and need to understand the physical file-move lifecycle, category subdirectories, and `_index.md` regeneration.

## Target File

`artifacts/CLAUDE.md` (~45 lines)

## Required Content

### Directory Structure
```
artifacts/
  _index.md           # Root ecosystem index (open work summary, artifact counts)
  designs/            # 26 feature design specs (design-NAME-NNN/ dirs)
  matrix/             # 9 domain coverage matrices (rules/, capabilities/, audit/)
  reviews/            # 250+ code & rules reviews
  tickets/            # 262 tickets across lifecycle states
  refactoring/        # 86+ refactoring entries
  lessons/            # Per-skill retrospective files (9 files)
  state/              # dev-state.md, test-state.md, alive-agents.md
```

### _index.md Files
- Every directory and subdirectory has a machine-generated `_index.md` (67 total)
- YAML frontmatter: `generated_at` timestamp, summary counts
- **Regeneration command**: `node scripts/regenerate-artifact-indexes.mjs` (run from project root)
- Must be regenerated after any ticket/review/design file creation, move, or deletion

### Ticket Lifecycle
Tickets physically move between status directories:
```
tickets/open/ → tickets/in-progress/ → tickets/resolved/
                                     → tickets/retest/ (if retesting needed)
```
Category subdirectories within each status dir: `bug/`, `decree/`, `docs/`, `feature/`, `ptu-rule/`, `refactoring/`, `ux/`

Ticket format: YAML frontmatter (id, title, priority, severity, status, domain, source, created_by, created_at, affected_files) + markdown body (Summary, Problem/Required Implementation, Notes, Resolution Log).

### Review Archive Pattern
```
reviews/active/       # Working reviews (code-review-NNN.md, rules-review-NNN.md)
reviews/archive/YYYY-MM/  # Approved reviews moved to monthly archive folders
```
Two types: `code-review-NNN` (senior-reviewer), `rules-review-NNN` (game-logic-reviewer).

### Design Organization
Each design is a directory: `designs/design-NAME-NNN/` containing:
- `_index.md` — Frontmatter with design_id, status, scope, affected_files. Body has summary, tier table, dependencies.
- `shared-specs.md` — Constants/interfaces shared across tiers
- `spec-p0.md`, `spec-p1.md`, `spec-p2.md` — Per-tier implementation specs
- `testing-strategy.md` — Testing plan
- `implementation-log.md` (optional) — Commit history

### State Files
- `state/dev-state.md` — Comprehensive dev ecosystem state (all ticket statuses, current work)
- `state/test-state.md` — Test ecosystem state
- `state/alive-agents.md` — Currently running agent processes

## Verification

- File is 30-80 lines
- Directory structure matches actual artifact tree
- Ticket lifecycle matches actual status directories
- Index regeneration command works from project root
