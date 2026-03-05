---
id: ptu-rule-153
title: "Naturewalk not integrated into VTT pathfinding"
priority: P3
severity: MEDIUM
status: open
domain: scenes
source: scenes-audit.md (session 121, R020 approximation)
created_by: slave-collector (plan-matrix-1772722531)
created_at: 2026-03-05
---

## Summary

The `naturewalkBypassesTerrain()` utility exists and correctly identifies Naturewalk capabilities. It is integrated for status immunity checks (Slowed/Stuck on matching terrain). However, it is NOT integrated into VTT pathfinding — Pokemon with matching Naturewalk still pay full terrain movement cost.

## Impact

Pokemon with Grasswalk/Icewalk/etc. are penalized on matching terrain despite the ability to traverse it freely.
