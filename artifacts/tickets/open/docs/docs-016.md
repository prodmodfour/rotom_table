---
id: docs-016
title: "Add cross-references to app/server/CLAUDE.md"
priority: P0
severity: LOW
status: open
domain: server
source: plan-descendant-claude-md-rollout
created_by: user
created_at: 2026-03-02
phase: 4
depends_on:
  - docs-002
  - docs-011
affected_files:
  - app/server/CLAUDE.md (modify)
---

# docs-016: Add cross-references to app/server/CLAUDE.md

## Summary

After descendant CLAUDE.md files are created for `app/server/services/` and `app/server/api/`, add cross-reference lines to `app/server/CLAUDE.md` so agents working in the server directory are pointed to the more detailed descendant files.

## Depends On

This ticket should only be executed AFTER these tickets are resolved:
- docs-002 (services CLAUDE.md)
- docs-011 (api CLAUDE.md)

## Current State

`app/server/CLAUDE.md` (21 lines) covers:
- Real-time Sync (WebSocket)
- Client → Server events
- Broadcast Events

No mention of services or API conventions.

## Required Change

Append the following section at the end of `app/server/CLAUDE.md`:

```markdown

## Descendant Context

- **Service architecture**: See `services/CLAUDE.md` for the 16-service inventory, Pokemon generation entry point rule, service patterns, and dependency map
- **API conventions**: See `api/CLAUDE.md` for endpoint naming conventions, response format, error handling, and service delegation rules
```

## What NOT to Change
- Existing WebSocket documentation (lines 1-21) stays as-is — it's the only place WebSocket events are documented and doesn't overlap with descendants

## Expected Result
~21 lines → ~26 lines. Adds 5 lines (1 header + 2 bullet points + spacing).

## Verification
- Cross-reference paths are correct relative to app/server/ directory
- Existing WebSocket content unchanged
- Referenced CLAUDE.md files exist (docs-002 and docs-011 must be completed first)
