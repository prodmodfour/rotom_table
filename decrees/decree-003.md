---
decree_id: decree-003
status: active
domain: vtt
topic: token-blocking-movement
title: "All tokens are passable; enemy-occupied squares are rough terrain"
ruled_at: 2026-02-26T18:02:00Z
supersedes: null
superseded_by: null
source_ticket: decree-need-003
implementation_tickets: [ptu-rule-097]
tags: [vtt, movement, pathfinding, rough-terrain, token-blocking]
---

# decree-003: All tokens are passable; enemy-occupied squares are rough terrain

## The Ambiguity

Should all tokens completely block movement, or should some be passable? PTU p.231 says "Squares occupied by enemies always count as Rough Terrain" — implying pass-through with a penalty, not blocking.

Source: decree-need-003.

## Options Considered

### Option A: All tokens block (current)
Simple, conservative. But contradicts PTU's rough terrain classification for enemy squares.

### Option B: Allies passable, enemies block
Common tabletop convention. Move through allies but not enemies.

### Option C: Pass-through, no stacking (D&D-style)
Move through any square but can't end turn on one. Enemy = rough terrain.

### Option D: All passable, enemy = rough terrain
Literal PTU reading. All tokens passable. Enemy squares apply rough terrain accuracy penalty.

## Ruling

**The true master decrees: all tokens are passable; enemy-occupied squares count as rough terrain per PTU p.231.**

Movement can pass through any occupied square (ally or enemy). Cannot end movement on an occupied square. Enemy-occupied squares apply the rough terrain accuracy penalty (-2) when targeting through them. This is the literal PTU reading and provides the most tactical flexibility.

## Precedent

Token-occupied squares never block movement. Enemy squares impose rough terrain accuracy penalties. Stacking (ending on an occupied square) is not allowed.

## Implementation Impact

- Tickets created: ptu-rule-097 (make tokens passable with rough terrain for enemies)
- Files affected: `app/composables/useGridMovement.ts`, `app/composables/usePathfinding.ts`
- Skills affected: all VTT reviewers, pathfinding developers
