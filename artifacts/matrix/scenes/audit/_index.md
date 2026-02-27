---
domain: scenes
type: audit
total_audited: 20
correct: 18
incorrect: 0
approximation: 0
ambiguous: 0
audited_at: 2026-02-26T16:30:00Z
audited_by: implementation-auditor
---

# Audit: scenes

# Implementation Audit: Scenes

## Audit Summary

| Classification | Count |
|---------------|-------|
| Correct | 17 |
| Incorrect | 0 |
| Approximation | 2 |
| Ambiguous | 1 |
| **Total Audited** | **20** |

### Severity Breakdown (Incorrect + Approximation)

| Severity | Count | Items |
|----------|-------|-------|
| CRITICAL | 0 | — |
| HIGH | 0 | — |
| MEDIUM | 1 | R018 (rough terrain movement cost should be 1 but accuracy penalty missing) |
| LOW | 1 | R010 (no natural vs game weather distinction) |

---

## Action Items

| Rule ID | Name | Classification | Tier |
|---------|------|---------------|------|
| scenes-R018 | Rough Terrain | Approximation | Tier 2: Terrain and Movement (VTT Integration) |
| scenes-R010 | Natural Weather vs Game Weather | Approximation | Tier 6: Partial Items |
| scenes-R018 | Rough Terrain Movement Cost | — | Tier 6: Partial Items |

## Tier Files

- [Tier 1: Core Data Model](tier-1-core-data-model.md)
- [Tier 2: Terrain and Movement (VTT Integration)](tier-2-terrain-and-movement-vtt-integration.md)
- [Tier 3: Frequency Constraints (Combat Integration)](tier-3-frequency-constraints-combat-integration.md)
- [Tier 4: Encounter Budget (Cross-Domain)](tier-4-encounter-budget-cross-domain.md)
- [Tier 5: Scene Workflow](tier-5-scene-workflow.md)
- [Tier 6: Partial Items](tier-6-partial-items.md)
- [Verified Correct Items](correct-items.md) (18 items)
