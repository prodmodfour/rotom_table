---
id: decree-need-030
title: "Significance presets: are x6 (climactic) and x8 (legendary) tiers acceptable?"
priority: P3
severity: MEDIUM
category: decree-need
source: pokemon-lifecycle audit R058, encounter-tables audit R008, scenes audit R030 (plan-20260228-072000 slaves 3+4)
created_by: slave-collector (plan-20260228-093200)
created_at: 2026-02-28
---

## Summary

The significance preset system includes `climactic` (x6) and `legendary` (x8) tiers that exceed PTU's stated range of "x1 to about x5." Three independent auditors reached **conflicting conclusions** about whether this is correct.

## The Ambiguity

PTU Core p.460: "The Significance Multiplier should range from x1 to about x5."

The qualifier "about" gives slight flexibility, but x6 and x8 are clearly beyond the stated range. Are these acceptable as GM-facing tool extensions, or do they violate the rules?

## Conflicting Auditor Opinions

- **pokemon-lifecycle auditor:** Incorrect (HIGH) — exceeds PTU range
- **encounter-tables auditor:** Incorrect (HIGH) — x6 and x8 outside intended range
- **scenes auditor:** Correct — "a valid GM tool extension, not an incorrectness"

## Interpretations

**A) Cap at x5 (strict PTU reading):**
Remove or rename the climactic and legendary presets. The maximum significance multiplier should be x5. GMs who want higher values can manually enter them, but the presets should not suggest values outside RAW.

**B) Keep as labeled house-rule extensions:**
Rename them to clearly indicate they exceed RAW (e.g., "Climactic (x6, house rule)"). The presets are a convenience tool, and GMs understand they're going beyond the book.

**C) Keep as-is (tool extension):**
The app is a GM tool, not a rules enforcer. Providing presets above x5 gives GMs flexibility. The "about" qualifier in PTU acknowledges that x5 is not a hard cap.

## Affected Code

- `app/constants/significancePresets.ts` (or equivalent)
- Encounter table significance UI
- XP calculation using significance multiplier

## PTU Reference

- PTU Core p.460: significance multiplier range
