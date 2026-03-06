---
id: decree-need-052
title: "Should source-dependent clearing apply to recall (not just faint)?"
priority: P3
severity: MEDIUM
status: addressed
decree_id: decree-053
domain: combat
source: rules-review-314 MEDIUM-001
created_by: slave-collector (plan-1772755770)
created_at: 2026-03-06
affected_files:
  - app/constants/conditionSourceRules.ts
---

## Summary

The condition source-tracking implementation (refactoring-129, per decree-047) extends source-dependent clearing to recall and encounter-end, but decree-047 only establishes source-dependent clearing for **faint**. The recall extension creates a RAW divergence.

## Problem

PTU p.248 explicitly states:
- "Stuck: ... This condition may be removed by switching"
- "Slowed: ... This condition may be removed by switching"

However, `SOURCE_CLEARING_RULES` for 'terrain' sets `clearsOnRecall: false`, meaning terrain-sourced Stuck/Slowed will NOT clear on recall. This contradicts the explicit PTU RAW text.

## Design Rationale (from implementation)

If terrain caused the condition, recalling and re-sending would just re-apply it. So terrain-sourced conditions don't clear on recall.

## Decision Needed

Should source-dependent clearing apply to recall behavior, or only to faint clearing (as decree-047 specifies)?

Options:
1. **RAW-compliant:** Stuck/Slowed always clear on recall regardless of source. Source-dependent clearing only applies to faint (per decree-047 scope).
2. **Current implementation:** Terrain/weather-sourced Stuck/Slowed do NOT clear on recall. Practical reasoning: recalling into terrain would re-apply.
3. **Hybrid:** Clear on recall but re-apply automatically if the terrain is still present when the Pokemon is sent back out.

## Impact

Affects the `clearsOnRecall` field for 'terrain' and 'weather' source types in `conditionSourceRules.ts`.
