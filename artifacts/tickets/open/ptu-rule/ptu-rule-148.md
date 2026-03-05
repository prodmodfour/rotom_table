---
id: ptu-rule-148
title: "Released Pokemon initiative insertion lacks immediate action trigger"
priority: P3
severity: MEDIUM
status: open
domain: combat
source: combat-audit.md (session 121, R053 approximation)
created_by: slave-collector (plan-matrix-1772722531)
created_at: 2026-03-05
---

## Summary

When a Pokemon is released mid-round after initiative has passed its position, PTU allows it to take an immediate action. The app inserts into initiative correctly but does not auto-trigger the immediate action opportunity.

## Impact

Newly released Pokemon may miss their turn if initiative has already passed.
