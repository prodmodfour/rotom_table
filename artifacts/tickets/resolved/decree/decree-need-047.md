---
id: decree-need-047
title: "Dark Cave Blindness accuracy penalty: RAW flat values vs per-meter scaling"
priority: P2
severity: high
status: addressed
decree_id: decree-048
domain: encounter-tables
source: rules-review-302 HIGH-1
created_by: slave-collector (plan-20260304-172253)
created_at: 2026-03-04
affected_files:
  - app/constants/environmentPresets.ts
  - app/composables/useMoveCalculation.ts
---

## Summary

The Dark Cave environment preset applies a flat -2 accuracy penalty, but PTU RAW defines Blindness as -6 and Total Blindness as -10 (flat penalties, not per-meter). The current implementation uses a `accuracyPenaltyPerMeter` field set to -2, but never actually multiplies by distance — resulting in a flat -2 that is significantly less punishing than RAW.

## Questions Requiring Decree

1. Should the app use RAW flat -6 (Blindness) / -10 (Total Blindness) penalties for dark environments?
2. If a per-meter scaling system is desired (homebrew), how should distance be calculated and what should the per-meter value be?
3. Should Darkvision/Blindsense capabilities be tracked per-combatant to negate the penalty for specific Pokemon/Trainers?

## PTU References

- Blindness: -6 to Accuracy Rolls (`core/07-combat.md:1693-1701`)
- Total Blindness: -10 to Accuracy Rolls (`core/07-combat.md:1702-1717`)
- Darkvision negates Blindness penalty
- Blindsense negates Total Blindness penalty

## Context

The environment preset system is intentionally a GM reference tool, not an automated rules engine. The GM can adjust or dismiss effects. However, the built-in Dark Cave preset ships with a value that significantly under-penalizes darkness compared to RAW, which could mislead GMs who trust the preset values.

## Impact

GMs using the Dark Cave preset get -2 accuracy instead of the RAW -6 or -10. This significantly reduces the mechanical impact of darkness in encounters.
