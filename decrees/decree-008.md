---
decree_id: decree-008
status: active
domain: vtt
topic: water-terrain-cost
title: "Water terrain defaults to cost 1; GM can mark specific water as slow terrain"
ruled_at: 2026-02-26T18:07:00Z
supersedes: null
superseded_by: null
source_ticket: decree-need-008
implementation_tickets: [ptu-rule-101]
tags: [vtt, terrain, water, movement-cost, swim]
---

# decree-008: Water terrain defaults to cost 1; GM can mark specific water as slow terrain

## The Ambiguity

Should water terrain cost 2 movement per cell for swimmers, or 1? Current code double-dips: lower Swim speed AND double cost.

Source: decree-need-008.

## Options Considered

### Option A: Water cost = 1 (PTU literal)
Water is basic terrain. Swim speed at normal cost.

### Option B: Water cost = 2 (current)
Harsh double-penalty with lower Swim speed.

### Option C: GM-configurable
Default water to cost 1. Allow marking specific cells as rough currents (cost 2).

## Ruling

**The true master decrees: water terrain defaults to movement cost 1 (basic terrain); the GM can mark specific water cells as slow terrain via the terrain painter.**

PTU classifies water as basic terrain, not slow. The double-dip with lower Swim speed is unintended. Default water is calm and costs 1. For rough currents, rapids, or whirlpools, the GM uses the terrain painter to overlay slow terrain on water cells.

## Precedent

Water terrain is basic (cost 1) by default. Swimmers already pay via lower Swim speed. Slow/rough water is an explicit GM choice via terrain painter, not a blanket default.

## Implementation Impact

- Tickets created: ptu-rule-101 (change water terrain default cost to 1)
- Files affected: `app/stores/terrain.ts`, `app/composables/useGridMovement.ts`
- Skills affected: all VTT reviewers, terrain system developers
