---
decree_id: decree-010
status: active
domain: vtt
topic: rough-slow-terrain-overlap
title: "Use multi-tag terrain system allowing cells to be both Rough and Slow"
ruled_at: 2026-02-26T18:09:00Z
supersedes: null
superseded_by: null
source_ticket: decree-need-010
implementation_tickets: [refactoring-001]
tags: [vtt, terrain, rough, slow, multi-tag]
---

# decree-010: Use multi-tag terrain system allowing cells to be both Rough and Slow

## The Ambiguity

Should terrain support being both Rough AND Slow simultaneously? PTU says "Most Rough Terrain is also Slow Terrain, but not always."

Source: decree-need-010.

## Options Considered

### Option A: Composite "rough-slow" type
Single new type. Minimal change.

### Option B: Multi-tag system
Each cell can have multiple terrain flags. More flexible.

### Option C: Keep simplified model (current)
Mutually exclusive types. Accept as limitation.

## Ruling

**The true master decrees: use a multi-tag terrain system where cells can have multiple terrain flags simultaneously.**

PTU explicitly defines Rough and Slow as overlapping but distinct modifiers. A cell should be able to have both the accuracy penalty (Rough) and the double movement cost (Slow). A multi-tag system also supports future terrain combinations and is more faithful to the PTU terrain model.

## Precedent

Terrain is represented as a set of flags per cell, not a single enum. Multiple terrain modifiers can coexist. This affects the terrain painter UI, pathfinding cost calculation, and accuracy penalty checks.

## Implementation Impact

- Tickets created: refactoring-001 (multi-tag terrain system)
- Files affected: `app/stores/terrain.ts`, `app/composables/useGridMovement.ts`, terrain painter components
- Skills affected: all VTT reviewers, terrain system developers
