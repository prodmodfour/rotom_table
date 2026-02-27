---
domain: healing
type: audit
total_audited: 31
correct: 26
incorrect: 1
approximation: 3
ambiguous: 1
audited_at: 2026-02-26T20:00:00Z
audited_by: implementation-auditor
---

# Audit: healing

# Implementation Audit: Healing

## Audit Summary

| Classification | Count |
|---------------|-------|
| Correct | 26 |
| Incorrect | 1 |
| Approximation | 3 |
| Ambiguous | 1 |
| **Total Audited** | **31** |

### Severity Breakdown (Incorrect + Approximation)

| Severity | Count | Items |
|----------|-------|-------|
| MEDIUM | 3 | healing-R007 (Incorrect), healing-R034 (Approximation), healing-R042 (Approximation) |
| LOW | 1 | healing-R012 (Approximation) |

---

## Action Items

| Rule ID | Name | Classification | Tier |
|---------|------|---------------|------|
| healing-R007 | Natural Healing Rate (Rest HP Recovery) | Incorrect | Tier 1: Core Formulas |
| healing-R034 | Extended Rest -- Daily Move Recovery | Approximation | Tier 2: Core Workflows |
| healing-R012 | Massive Damage Exclusion for Set/Lose HP (Standard Path) | Approximation | Tier 4: Partial Items -- Present Portion |
| healing-R042 | AP -- Scene Refresh and Drain/Bind (Utilities) | Approximation | Tier 4: Partial Items -- Present Portion |
| healing-R006 | Fainted Condition at "0 or lower" | Ambiguous | Tier 4: Partial Items -- Present Portion |
| healing-R007 | Math.max(1, ...) Minimum Heal | — | Tier 4: Partial Items -- Present Portion |
| healing-R034 | Extended Rest Daily Move Refresh Not Wired | — | Tier 4: Partial Items -- Present Portion |
| healing-R042 | Scene-End AP Restoration Not Automated | — | Tier 4: Partial Items -- Present Portion |
| healing-R006 | Fainted "=== 0" vs "<= 0" | — | Tier 4: Partial Items -- Present Portion |

## Tier Files

- [Tier 1: Core Formulas](tier-1-core-formulas.md)
- [Tier 2: Core Workflows](tier-2-core-workflows.md)
- [Tier 3: Core Constraints](tier-3-core-constraints.md)
- [Tier 4: Partial Items -- Present Portion](tier-4-partial-items-present-portion.md)
- [Verified Correct Items](correct-items.md) (27 items)
