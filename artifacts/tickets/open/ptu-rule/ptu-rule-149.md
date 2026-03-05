---
id: ptu-rule-149
title: "VTT allows free repositioning without enforcing move-once-per-shift rule"
priority: P2
severity: MEDIUM
status: open
domain: combat
source: combat-audit.md (session 121, R056 approximation)
created_by: slave-collector (plan-matrix-1772722531)
created_at: 2026-03-05
---

## Summary

The VTT allows tokens to be repositioned freely without enforcing the "move once per shift action" rule. Movement is not locked after a non-movement action has been taken, allowing multiple repositions in a single turn.

## Impact

Tokens can effectively move multiple times per turn, violating action economy rules.
