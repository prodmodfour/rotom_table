---
decree_id: decree-002
status: active
domain: vtt
topic: range-measurement-diagonal
title: "Use PTU alternating diagonal rule for ranged attack distance"
ruled_at: 2026-02-26T18:01:00Z
supersedes: null
superseded_by: null
source_ticket: decree-need-002
implementation_tickets: [ptu-rule-096]
tags: [vtt, range, diagonal, measurement, chebyshev]
---

# decree-002: Use PTU alternating diagonal rule for ranged attack distance

## The Ambiguity

Should ranged attack distance use PTU's alternating diagonal rule (1-2-1) like movement, or simple Chebyshev (max of dx, dy)? The current code uses Chebyshev for ranges but PTU diagonal for movement — two different metrics.

Source: decree-need-002.

## Options Considered

### Option A: Chebyshev for ranges (current)
Simpler, more generous. Every diagonal costs 1. Common in D&D-derived systems. But inconsistent with the movement metric.

### Option B: PTU diagonal for ranges too
Use the same alternating 1-2-1 rule for range measurement as movement. Stricter and consistent. PTU doesn't explicitly say NOT to use it for ranges.

### Option C: GM-configurable
AppSettings toggle for the GM to choose.

## Ruling

**The true master decrees: use PTU alternating diagonal rule for ranged attack distance, consistent with movement.**

Range and movement should use the same distance metric. The alternating 1-2-1 diagonal rule is the PTU standard for measuring distance on a grid. Applying it consistently to both movement and range avoids the asymmetry where attacks reach further diagonally than cardinally.

## Precedent

All grid distance measurements (movement, range, area effects) use PTU's alternating diagonal rule (1-2-1). No Chebyshev distance in the app.

## Implementation Impact

- Tickets created: ptu-rule-096 (switch range measurement to PTU diagonal)
- Files affected: `app/composables/useRangeParser.ts`, `app/utils/gridDistance.ts`
- Skills affected: all reviewers, VTT-related developers
