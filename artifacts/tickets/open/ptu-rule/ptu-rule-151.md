---
id: ptu-rule-151
title: "Heavily Injured standard action trigger not implemented"
priority: P1
severity: HIGH
status: open
domain: healing
source: healing-audit.md (session 121, R016 supplemental approximation)
created_by: slave-collector (plan-matrix-1772722531)
created_at: 2026-03-05
---

## Summary

The Heavily Injured status has a secondary trigger: "taking a Standard Action during combat" should prompt a save vs fainting. Currently only the "takes Damage" trigger is implemented.

## Impact

Heavily Injured Pokemon can freely take Standard Actions without risk of fainting, which is a significant rules gap in combat.
