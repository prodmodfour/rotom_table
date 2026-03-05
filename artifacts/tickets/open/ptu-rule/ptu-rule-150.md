---
id: ptu-rule-150
title: "No set-HP/lose-HP flag; Pain Split/Endeavor triggers injury checks incorrectly"
priority: P2
severity: MEDIUM
status: open
domain: healing
source: healing-audit.md (session 121, R012/R035 approximation)
created_by: slave-collector (plan-matrix-1772722531)
created_at: 2026-03-05
---

## Summary

No "set HP" or "lose HP" flag exists to distinguish direct HP manipulation (Pain Split, Endeavor) from standard damage. These effects routed through the damage endpoint incorrectly trigger massive damage injury checks.

## Impact

Cross-domain with bug-058 (combat HP loss pathway). Pain Split and Endeavor can cause incorrect injuries.
