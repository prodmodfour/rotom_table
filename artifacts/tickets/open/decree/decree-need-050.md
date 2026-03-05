---
id: decree-need-050
title: "Should app auto-parse [+Stat] feature tags and apply stat bonuses?"
priority: P3
severity: MEDIUM
status: open
domain: character-lifecycle
source: character-lifecycle-audit.md (session 121, R033 ambiguous)
created_by: slave-collector (plan-matrix-1772722531)
created_at: 2026-03-05
---

## Summary

Some PTU features include [+Stat] tags (e.g., "[+Attack]") that grant stat bonuses. Should the app automatically parse these tags and apply the stat bonuses to the character sheet, or should this remain a manual GM/player responsibility?

## Options

1. **Auto-parse**: App reads feature text, detects [+Stat] patterns, applies bonuses automatically
2. **Manual only**: Features are stored as strings; stat bonuses are applied manually by GM/player
3. **Hybrid**: App flags detected [+Stat] tags but requires confirmation before applying

## Impact

Affects character stat calculation accuracy and GM workflow.
