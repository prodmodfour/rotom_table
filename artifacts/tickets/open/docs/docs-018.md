---
id: docs-018
title: "app-surface.md missing vision tracking endpoint, component, and utility"
priority: P4
severity: MEDIUM
status: open
domain: docs
source: code-review-331 (MED-2)
created_by: slave-collector (plan-1772668105)
created_at: 2026-03-05
affected_files:
  - .claude/skills/references/app-surface.md
---

## Summary

The `app-surface.md` reference document was not updated when feature-025 P0 added:
- `app/server/api/encounters/[id]/combatants/[combatantId]/vision.post.ts` (new endpoint)
- `app/components/encounter/VisionCapabilityToggle.vue` (new component)
- `app/utils/visionRules.ts` (new utility module)
- `toggleVisionCapability` store action in encounter store

## Suggested Fix

Add entries for the new endpoint, component, utility, and store action to app-surface.md.

## Impact

Low — stale reference doc may cause future developers to miss vision-related code.
