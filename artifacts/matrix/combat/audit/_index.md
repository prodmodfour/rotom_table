---
domain: combat
type: audit-index
audited_at: 2026-02-28T08:00:00Z
audited_by: implementation-auditor
matrix_version: 2026-02-28T03:00:00Z
total_audited: 52
correct: 40
incorrect: 3
approximation: 4
ambiguous: 0
---

# Combat Domain Audit Index

Re-audit against fresh coverage matrix (2026-02-28). Previous audit was stale due to extensive code changes including decree-005 auto-CS, decree-006 dynamic initiative, decree-012 type immunity enforcement, and breather refactoring.

## Audit Summary

| Classification | Count | CRITICAL | HIGH | MEDIUM | LOW |
|---------------|-------|----------|------|--------|-----|
| Correct | 40 | - | - | - | - |
| Incorrect | 3 | 0 | 1 | 1 | 1 |
| Approximation | 4 | 0 | 0 | 3 | 1 |
| Ambiguous | 0 | - | - | - | - |
| **Total** | **52** | **0** | **1** | **4** | **2** |

## Changes From Previous Audit

- **combat-R025** (Minimum Damage): was Ambiguous, now **Correct** per decree-001
- **combat-R108** (Vulnerable): was Incorrect, now **Correct** (ZeroEvasion path added in evasionCalculation.ts)
- **combat-R033** (Type Immunities): was not audited, now **Correct** per decree-012 (status.post.ts implements server-side enforcement with override flag)
- **combat-R088/R090/R091** (Burn/Paralysis/Poison CS): were Approximation, now **Correct** per decree-005 (auto-apply with source tracking implemented)
- **combat-R039** (Initiative): was Approximation, now **Correct** per decree-006 (dynamic reorder implemented in encounter.service.ts)
- **combat-R035/R037** (League two-phase): new HIGH Incorrect finding (declaration phase exists but resolution phase not fully connected per decree-021)
- **combat-R082** (Struggle Attack): new MEDIUM Incorrect finding (No Expert Combat upgrade implemented)
- **combat-R060** (Speed CS Movement): new MEDIUM Approximation (calculateEffectiveMovement exists but not integrated with VTT pathfinding)

## Action Items

| Rule ID | Name | Classification | Severity |
|---------|------|---------------|----------|
| combat-R035 | League Two-Phase Trainer System | Incorrect | HIGH |
| combat-R082 | Struggle Attack Expert Upgrade | Incorrect | MEDIUM |
| combat-R113 | Sprint Maneuver Action Type | Incorrect | LOW |
| combat-R060 | Speed CS Affect Movement | Approximation | MEDIUM |
| combat-R017 | Rolled Damage Mode | Approximation | MEDIUM |
| combat-R134 | Armor DR Helmet Conditional | Approximation | MEDIUM |
| combat-R024 | Increased Critical Hit Range | Approximation | LOW |

## Audit Files

- [Tier 1: Decree-Mandated](tier-1-decree-mandated.md) — 6 items (5 correct, 1 incorrect)
- [Tier 2: Core Mechanic Gaps](tier-2-core-mechanics.md) — 7 items (7 correct present portions)
- [Tier 3: Accuracy & Evasion Chain](tier-3-accuracy-evasion.md) — 4 items (4 correct)
- [Tier 4: Action Economy & Grid](tier-4-action-grid.md) — 3 items (3 correct)
- [Tier 5: Status Condition Tracking](tier-5-status-tracking.md) — 3 items (3 correct)
- [Tier 6: Equipment Chain](tier-6-equipment.md) — 2 items (1 correct, 1 approximation)
- [Additional Findings](additional-findings.md) — 6 items (1 incorrect, 4 approximation, 1 reclassified to correct)
- [Correct Items](correct-items.md) — All verified correct items

## Decree Compliance

| Decree | Status | Evidence |
|--------|--------|----------|
| decree-001 | **Compliant** | Dual min-1 floors at `damageCalculation.ts:283` and `:294` |
| decree-004 | **Compliant** | `hpDamage` (real HP lost) used in massive damage check at `combatant.service.ts:112` |
| decree-005 | **Compliant** | `applyStatusCsEffects`/`reverseStatusCsEffects`/`reapplyActiveStatusCsEffects` in combatant.service.ts:344-423 |
| decree-006 | **Compliant** | `reorderInitiativeAfterSpeedChange` called from stages.post.ts:50-76, status.post.ts:111-144, breather.post.ts:197-247 |
| decree-012 | **Compliant** | `findImmuneStatuses` check in status.post.ts:53-71 with `override: true` escape hatch |
| decree-021 | **Non-Compliant** | Declaration phase (`trainer_declaration`) exists in start.post.ts:88-114, but `trainer_resolution` phase never activated — declarations recorded but not resolved in high-to-low order |
