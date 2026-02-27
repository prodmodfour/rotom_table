---
ticket_id: decree-need-016
ticket_type: decree-need
priority: P2
status: addressed
decree_id: decree-016
domain: rest
topic: extended-rest-bound-ap
affected_files:
  - app/server/api/characters/[id]/extended-rest.post.ts
created_at: 2026-02-26T12:00:00
---

## Ambiguity

Should an extended rest clear Bound AP, or only Drained AP?

## PTU Rule Reference

- **p.252**: "Extended rests completely remove Persistent Status Conditions, and restore a Trainer's Drained AP."
- AP rules: "Bound AP remains off-limits until the binding effect ends."

The rule explicitly says extended rest restores "Drained AP." No mention of Bound AP. Bound AP is tied to specific feature/ability effects, not rest.

## Current Behavior

`extended-rest.post.ts` lines 87-89: Clears BOTH drained AND bound AP, then sets current AP to full max.

## Options

### Option A: Clear both (current)
Assumes binding effects always end during extended rest. Simpler for the GM.

### Option B: Only clear Drained AP (strict reading)
Bound AP persists until the binding feature is explicitly unbound. GM must manually manage bound AP.

### Option C: Clear Drained, make Bound AP clearing a GM choice
Show bound AP status and let GM decide whether to clear it.

## Blocking

Affects extended rest healing. Current behavior is functional but may be too generous.
