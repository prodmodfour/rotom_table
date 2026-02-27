---
domain: vtt-grid
type: audit
total_audited: 24
correct: 19
incorrect: 0
approximation: 0
ambiguous: 0
audited_at: 2026-02-26T17:00:00Z
audited_by: implementation-auditor
---

# Audit: vtt-grid

# Implementation Audit: VTT Grid

## Audit Summary

| Classification | Count |
|---------------|-------|
| Correct | 20 |
| Incorrect | 1 |
| Approximation | 2 |
| Ambiguous | 1 |
| **Total Audited** | **24** |

### Severity Breakdown (Incorrect + Approximation)

| Severity | Count | Items |
|----------|-------|-------|
| CRITICAL | 0 | — |
| HIGH | 0 | — |
| MEDIUM | 2 | R015 (rough terrain cost 1 correct but no accuracy penalty), R026 (Speed CS movement partially implemented) |
| LOW | 1 | R022 (Stuck status tracked but movement check uses applyMovementModifiers — need to verify grid integration) |

---

## Action Items

| Rule ID | Name | Classification | Tier |
|---------|------|---------------|------|
| vtt-grid-R030 | Disengage Maneuver | Incorrect | Tier 3: Movement System |
| vtt-grid-R015 | Rough Terrain | Approximation | Tier 6: Partial Items |
| vtt-grid-R025 | Tripped Condition (Stand Up Cost) | Approximation | Tier 6: Partial Items |
| vtt-grid-R038 | Levitate Maximum Height | Approximation | Tier 6: Partial Items |
| vtt-grid-R030 | Disengage Maneuver Definition | — | Tier 7: Implemented-Unreachable |

## Tier Files

- [Tier 1: Core Grid Foundation](tier-1-core-grid-foundation.md)
- [Tier 2: Terrain System](tier-2-terrain-system.md)
- [Tier 3: Movement System](tier-3-movement-system.md)
- [Tier 4: Measurement and Range](tier-4-measurement-and-range.md)
- [Tier 5: Rendering (Grid Rendering)](tier-5-rendering-grid-rendering.md)
- [Tier 6: Partial Items](tier-6-partial-items.md)
- [Tier 7: Implemented-Unreachable](tier-7-implemented-unreachable.md)
- [Verified Correct Items](correct-items.md) (19 items)
