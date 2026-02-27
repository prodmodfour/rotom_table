---
domain: encounter-tables
type: audit
total_audited: 14
correct: 12
incorrect: 1
approximation: 1
ambiguous: 0
audited_at: 2026-02-26T21:00:00Z
audited_by: implementation-auditor
---

# Audit: encounter-tables

# Implementation Audit: Encounter Tables

## Audit Summary

| Classification | Count |
|---------------|-------|
| Correct | 12 |
| Incorrect | 1 |
| Approximation | 1 |
| Ambiguous | 0 |
| **Total Audited** | **14** |

### Severity Breakdown (Incorrect + Approximation)

| Severity | Count | Items |
|----------|-------|-------|
| MEDIUM | 1 | encounter-tables-R008 (Incorrect) |
| LOW | 1 | encounter-tables-R012 (Approximation) |

### Changes Since Previous Audit (2026-02-19)

Several findings from the previous audit have been resolved by subsequent code changes:

1. **R007 (was Incorrect/HIGH):** Weight column changed from `Int` to `Float` in schema.prisma:340. Fractional weights now stored correctly. Previous truncation bug is fixed.
2. **R022/density (was Incorrect/MEDIUM):** Density/spawn-count coupling was removed in ptu-rule-058 (density/significance separation). Spawn count is now provided directly by the client, capped at `MAX_SPAWN_COUNT = 20` (`types/habitat.ts:27`). The old hard-cap-10 bug no longer exists.
3. **R009/density (was Approximation/MEDIUM):** The density multiplier is no longer conflated with significance. A full encounter budget system (`utils/encounterBudget.ts`) and significance presets (`SIGNIFICANCE_PRESETS`) now implement the PTU significance/difficulty concepts properly.
4. **R012 (was Approximation/MEDIUM):** Diversity-enforced weighted random selection was added to `encounter-generation.service.ts` (exponential decay + per-species cap). Severity reduced from MEDIUM to LOW.
5. **R025 (was Approximation/LOW):** Removed from audit queue -- the Coverage Analyzer classified R025 as Out of Scope (environmental modifiers belong to VTT/scene domain).
6. **OBS-001 (weight Int truncation):** Fixed -- ModificationEntry.weight is now `Float?` in schema.prisma:388.
7. **OBS-003 (no levelMin <= levelMax validation):** Still present but not re-audited as it is an input validation concern, not a PTU rule implementation issue.

---

## Action Items

| Rule ID | Name | Classification | Tier |
|---------|------|---------------|------|
| encounter-tables-R008 | Significance Multiplier | Incorrect | Tier 1: Core Formulas |
| encounter-tables-R012 | Species Diversity per Encounter | Approximation | Tier 4: Partial Items |

## Tier Files

- [Tier 1: Core Formulas](tier-1-core-formulas.md)
- [Tier 2: Core Data Model](tier-2-core-data-model.md)
- [Tier 3: Core Workflows](tier-3-core-workflows.md)
- [Tier 4: Partial Items](tier-4-partial-items.md)
- [Verified Correct Items](correct-items.md) (12 items)
