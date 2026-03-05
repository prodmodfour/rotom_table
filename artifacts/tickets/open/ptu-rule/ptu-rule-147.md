---
id: ptu-rule-147
title: "No per-effect duration tracking or auto-expiry for timed combat effects"
priority: P2
severity: MEDIUM
status: open
domain: combat
source: combat-audit.md (session 121, R041 approximation)
created_by: slave-collector (plan-matrix-1772722531)
created_at: 2026-03-05
---

## Summary

Round counter exists but there is no per-effect duration tracking. Effects with "one full round" or "N rounds" duration are not automatically expired when their duration elapses. GMs must manually remove them.

## Impact

Combat tracking burden on GM. Easy to forget to remove expired effects.
