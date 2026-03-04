---
ticket_id: ptu-rule-119
title: "Trainer Naturewalk not supported (Survivalist class feature)"
severity: LOW
priority: P4
domain: combat+vtt-grid
source: rules-review-186 (noted limitation)
created_by: slave-collector (plan-20260227-162300)
created_at: 2026-02-27
status: in-progress
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

## Resolution Log

Fix cycle addressing code-review-215 CHANGES_REQUIRED (5 issues):

- `c9d442c` fix: use parentheses-aware split for capabilities input parser (HIGH-01)
  - `app/pages/gm/characters/[id].vue` — onCapabilitiesChange uses `/,(?![^(]*\))/` regex
- `e507367` fix: add border-color to --capability tag in character sheet (MED-03)
  - `app/pages/gm/characters/[id].vue` — `border-color: rgba($color-success, 0.3)`
- `a922d48` fix: show error feedback when addEdge blocks Skill Edge string (MED-01)
  - `app/components/create/EdgeSelectionSection.vue` — addEdgeFn prop, error display, input preservation
  - `app/pages/gm/create.vue` — pass addEdgeFn prop instead of emit
- `8899e68` test: add trainer Naturewalk and addEdge guard unit tests (HIGH-02)
  - `app/tests/unit/utils/combatantCapabilities.test.ts` — trainer capabilities, findNaturewalkImmuneStatuses
  - `app/tests/unit/composables/useCharacterCreation.test.ts` — addEdge guard (decree-027)
- `1ccbc71` docs: add capabilities field to app-surface.md (MED-02)
  - `.claude/skills/references/app-surface.md` — HumanCharacter.capabilities documentation
