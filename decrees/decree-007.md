---
decree_id: decree-007
status: active
domain: vtt
topic: cone-shape-width
title: "Cone shapes use fixed 3m-wide rows per PTU literal text"
ruled_at: 2026-02-26T18:06:00Z
supersedes: null
superseded_by: null
source_ticket: decree-need-007
implementation_tickets: [ptu-rule-100]
tags: [vtt, cone, attack-shapes, measurement]
---

# decree-007: Cone shapes use fixed 3m-wide rows per PTU literal text

## The Ambiguity

Should cone attack shapes expand with distance or use fixed 3m-wide rows as the literal PTU text states?

Source: decree-need-007.

## Options Considered

### Option A: Fixed 3-wide rows (literal PTU)
All rows beyond the first square are exactly 3 cells wide. Strict reading.

### Option B: Expanding width (current code)
Width grows with distance. More visually cone-like but diverges from text.

### Option C: "3m wide" is a Cone 2 example
Treat as describing Cone 2 only. Larger cones scale.

## Ruling

**The true master decrees: cone shapes use fixed 3m-wide rows per the literal PTU text.**

PTU p.343 explicitly says "3m wide rows." The Cone 2 diagram is consistent with this reading. Larger cones (Cone 4, Cone 6) produce narrow channels — this is the intended design.

## Precedent

Cone X shapes are: 1 cell at distance 1 (directly in front), then 3 cells wide for all subsequent rows up to X meters. No expansion.

## Implementation Impact

- Tickets created: ptu-rule-100 (fix cone shape to fixed 3-wide rows)
- Files affected: `app/composables/useRangeParser.ts`, `app/stores/measurement.ts`
- Skills affected: all VTT reviewers
