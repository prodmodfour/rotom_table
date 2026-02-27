---
ticket_id: ptu-rule-119
title: "Trainer Naturewalk not supported (Survivalist class feature)"
severity: LOW
priority: P4
domain: combat+vtt-grid
source: rules-review-186 (noted limitation)
created_by: slave-collector (plan-20260227-162300)
created_at: 2026-02-27
---

## Summary

The Naturewalk status immunity check in `combatantCapabilities.ts` (`findNaturewalkImmuneStatuses`) only checks Pokemon (`combatant.type === 'pokemon'`). Trainers can gain Naturewalk via the Survivalist class feature (PTU Core p.149, `core/04-trainer-classes.md` line 4690).

Currently, `HumanCharacter` does not store a `capabilities` field in the data model, so this would require a data model extension.

## Affected Files

- `app/utils/combatantCapabilities.ts` (line 300 — type guard)
- `app/prisma/schema.prisma` (HumanCharacter model — needs capabilities field)

## Suggested Fix

When trainer capabilities are added to the data model, extend `findNaturewalkImmuneStatuses()` to check trainers with Naturewalk. Until then, the GM can use the override flag to manually manage trainer Naturewalk immunity.

## Impact

Trainers with Survivalist's Naturewalk will not get automatic Slowed/Stuck immunity on matching terrain. GM must apply manually via override. Low impact — Survivalist is uncommon.
