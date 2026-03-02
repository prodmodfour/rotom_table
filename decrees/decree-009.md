---
decree_id: decree-009
status: active
domain: vtt
topic: diagonal-line-length
title: "Diagonal Line attacks are shortened per PTU alternating diagonal rule"
ruled_at: 2026-02-26T18:08:00Z
supersedes: null
superseded_by: null
source_ticket: decree-need-009
implementation_tickets: [ptu-rule-102]
tags: [vtt, line, attack-shapes, diagonal, measurement]
---

# decree-009: Diagonal Line attacks are shortened per PTU alternating diagonal rule

## The Ambiguity

Should diagonal Line attacks cover fewer cells to account for PTU's alternating diagonal cost rule?

Source: decree-need-009.

## Options Considered

### Option A: Shorten diagonal lines (PTU literal)
Line 4 diagonal = 3 cells. Faithful to "apply same rules as diagonal movement."

### Option B: Always X cells (current)
Simpler, more intuitive. Same cell count in all directions.

### Option C: Grid tracing interpretation
"Apply same rules" means trace direction, not shorten length.

## Ruling

**The true master decrees: diagonal Line attacks are shortened per PTU's alternating diagonal rule.**

PTU p.343 explicitly says "apply the same rules as for diagonal movement" for diagonal lines. Combined with decree-002 (PTU diagonal for all distances), this means Line X diagonal covers fewer cells because each meter of line costs alternating 1-2 movement. Line 4 diagonal = 3 cells (costs 1+2+1=4m).

## Precedent

Diagonal Line attacks cover fewer cells than cardinal lines of the same size. The alternating 1-2-1 rule applies to line length, not just range measurement. Consistent with decree-002.

## Implementation Impact

- Tickets created: ptu-rule-102 (shorten diagonal Line attacks)
- Files affected: `app/composables/useRangeParser.ts`, `app/stores/measurement.ts`
- Skills affected: all VTT reviewers
