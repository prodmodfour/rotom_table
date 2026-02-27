---
domain: combat
type: audit
total_audited: 53
correct: 44
incorrect: 2
approximation: 6
ambiguous: 1
audited_at: 2026-02-26T18:00:00Z
audited_by: implementation-auditor
---

# Audit: combat

# Implementation Audit: Combat

## Audit Summary

| Classification | Count | CRITICAL | HIGH | MEDIUM | LOW |
|---------------|-------|----------|------|--------|-----|
| Correct | 44 | - | - | - | - |
| Incorrect | 2 | 0 | 1 | 1 | 0 |
| Approximation | 6 | 0 | 1 | 3 | 2 |
| Ambiguous | 1 | - | - | - | - |
| **Total** | **53** | **0** | **2** | **4** | **2** |

---

## Action Items

| Rule ID | Name | Classification | Tier |
|---------|------|---------------|------|
| combat-R044 | Standard-to-Shift/Swift Conversion | Approximation | Tier 5: Partial Items (Present Portion) |
| combat-R089 | Frozen Status (Tracking + Partial Mechanics) | Approximation | Tier 5: Partial Items (Present Portion) |
| combat-R093 | Sleep Status (Tracking + Partial Mechanics) | Approximation | Tier 5: Partial Items (Present Portion) |
| combat-R108 | Vulnerable Status (Tracking + Evasion) | Incorrect | Tier 5: Partial Items (Present Portion) |
| combat-R039 | Initiative Tie Breaking | Approximation | Tier 5: Partial Items (Present Portion) |
| combat-R016 | Accuracy Modifiers vs Dice Results | Approximation | Tier 5: Partial Items (Present Portion) |
| combat-R025 | Minimum Damage Floor | Ambiguous | Tier 5: Partial Items (Present Portion) |

## Tier Files

- [Tier 1: Core Formulas](tier-1-core-formulas.md)
- [Tier 2: Core Workflows](tier-2-core-workflows.md)
- [Tier 3: Constraints](tier-3-constraints.md)
- [Tier 4: Implemented-Unreachable](tier-4-implemented-unreachable.md)
- [Tier 5: Partial Items (Present Portion)](tier-5-partial-items-present-portion.md)
- [Verified Correct Items](correct-items.md) (72 items)
