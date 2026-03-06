---
id: ptu-rule-150
title: "No set-HP/lose-HP flag; Pain Split/Endeavor triggers injury checks incorrectly"
priority: P2
severity: MEDIUM
status: in-progress
domain: healing
source: healing-audit.md (session 121, R012/R035 approximation)
created_by: slave-collector (plan-matrix-1772722531)
created_at: 2026-03-05
---

## Summary

No "set HP" or "lose HP" flag exists to distinguish direct HP manipulation (Pain Split, Endeavor) from standard damage. These effects routed through the damage endpoint incorrectly trigger massive damage injury checks.

## Impact

Cross-domain with bug-058 (combat HP loss pathway). Pain Split and Endeavor can cause incorrect injuries.

## Resolution Log

### Implementation (2026-03-06)

Resolved jointly with bug-058. The `calculateDamage` function now accepts a `lossType` parameter with three options: `'damage'` (default), `'hpLoss'` (Belly Drum, Life Orb), and `'setHp'` (Pain Split, Endeavor). Both `hpLoss` and `setHp` skip massive damage injury checks per PTU p.236 and p.250. HP marker injuries still apply to all types. The GM UI includes a dropdown selector for the loss type when applying HP reduction.

See bug-058 resolution log for full commit list.
