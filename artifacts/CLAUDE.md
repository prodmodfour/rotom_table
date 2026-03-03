# Artifacts CLAUDE.md

Context for working within the `artifacts/` directory — the project's structured tracking ecosystem for designs, reviews, tickets, coverage matrices, and operational state.

## Directory Structure

```
artifacts/
  _index.md           # Root ecosystem index (open work summary, artifact counts)
  designs/            # 27 feature design specs (design-NAME-NNN/ dirs)
  matrix/             # 9 domain coverage matrices (rules/, capabilities/, audit/)
  reviews/            # Code and rules reviews
  tickets/            # Tickets across lifecycle states
  refactoring/        # 85+ refactoring entries with audit summary
  lessons/            # Per-skill retrospective files (9 files)
  state/              # dev-state.md, test-state.md, alive-agents.md
```

## Index Files

Every directory and subdirectory has a machine-generated `_index.md` with YAML frontmatter (`generated_at` timestamp, summary counts).

**Regeneration command** (run from project root after any file creation, move, or deletion):
```bash
node scripts/regenerate-artifact-indexes.mjs
```

## Ticket Lifecycle

Tickets physically move between status directories:
```
tickets/open/ → tickets/in-progress/ → tickets/resolved/
                                     → tickets/retest/ (if retesting needed)
```

Category subdirectories within each status dir: `bug/`, `decree/`, `docs/`, `feature/`, `ptu-rule/`, `refactoring/`, `ux/`.

Ticket format: YAML frontmatter (`id`, `title`, `priority`, `severity`, `status`, `domain`, `source`, `created_by`, `created_at`, `affected_files`) + markdown body (Summary, Problem/Required Implementation, Notes, Resolution Log).

## Review Archive Pattern

```
reviews/active/           # Working reviews (code-review-NNN.md, rules-review-NNN.md)
reviews/archive/YYYY-MM/  # Approved reviews moved to monthly archive folders
```

Two types: `code-review-NNN` (senior-reviewer), `rules-review-NNN` (game-logic-reviewer).

## Design Organization

Each design is a directory (`designs/design-NAME-NNN/`) containing:
- `_index.md` — Frontmatter with design_id, status, scope, affected_files. Body has summary, tier table, dependencies.
- `shared-specs.md` — Constants and interfaces shared across tiers
- `spec-p0.md`, `spec-p1.md`, `spec-p2.md` — Per-tier implementation specs
- `testing-strategy.md` — Testing plan
- `implementation-log.md` (optional) — Commit history tracking

## State Files

- `state/dev-state.md` — Comprehensive dev ecosystem state (all ticket statuses, current work)
- `state/test-state.md` — Test ecosystem state
- `state/alive-agents.md` — Currently running agent processes
