---
id: docs-014
title: "Slim app/CLAUDE.md — replace domain detail with cross-references"
priority: P0
severity: MEDIUM
status: open
domain: workflow
source: plan-descendant-claude-md-rollout
created_by: user
created_at: 2026-03-02
phase: 4
depends_on:
  - docs-001
  - docs-004
  - docs-005
  - docs-013
affected_files:
  - app/CLAUDE.md (modify)
---

# docs-014: Slim app/CLAUDE.md — replace domain detail with cross-references

## Summary

After descendant CLAUDE.md files are created in Phase 1-3, the `app/CLAUDE.md` contains duplicated content in its Domain Systems section (lines 58-86). This detail now lives in the descendant files. Replace the verbose domain sections with a concise cross-reference block to eliminate duplication and reduce context overhead.

## Depends On

This ticket should only be executed AFTER these tickets are resolved:
- docs-001 (VTT CLAUDE.md)
- docs-004 (encounter CLAUDE.md)
- docs-005 (composables CLAUDE.md)
- docs-013 (scene CLAUDE.md)

## Current State (lines to modify)

Lines 58-86 of `app/CLAUDE.md` contain detailed sections:
- **Combat Automation** (lines 60-71): 12 bullet points of combat features
- **Scene System** (lines 73-74): Scene description
- **VTT Grid** (lines 76-77): Component/composable/store counts and feature list
- **Encounter Tables & Templates** (lines 79-80): Full description
- **Capture System** (lines 82-83): Capture rate formula description
- **Rest & Healing** (lines 85-86): Rest mechanics description

## Target State

Replace lines 58-86 with a concise cross-reference block:

```markdown
## Domain Systems

Detailed architecture in descendant CLAUDE.md files:
- **Combat & encounters**: See `components/encounter/CLAUDE.md` for turn lifecycle, damage flow, battle modes
- **VTT grid**: See `components/vtt/CLAUDE.md` for rendering pipeline, coordinate spaces, PTU movement rules
- **Scenes**: See `components/scene/CLAUDE.md` for scene-to-encounter conversion, deferred features
- **Stores**: See `stores/CLAUDE.md` for scope classification, undo/redo, WebSocket sync
- **Composables**: See `composables/CLAUDE.md` for domain grouping, dependency chains
- **Services**: See `server/services/CLAUDE.md` for service patterns, Pokemon generation entry point
- **Types**: See `types/CLAUDE.md` for combatant hierarchy, Prisma-derived vs hand-written
```

## What to Keep
- SOLID Principles section (lines 5-51) — project-wide architectural guidance, not domain-specific
- Triple-View System section (lines 53-56) — app-level concern, not covered by descendants
- Testing section (lines 88-91) — brief, already cross-references vitest.config.ts

## Expected Result
~91 lines → ~60 lines. Removes ~27 lines of domain detail, adds ~9 lines of cross-references.

## Verification
- No content lost — all removed content exists in descendant CLAUDE.md files
- Cross-reference paths are correct relative to app/ directory
- SOLID principles and triple-view sections preserved unchanged
