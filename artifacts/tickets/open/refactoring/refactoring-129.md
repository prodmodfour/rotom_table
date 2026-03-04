---
id: refactoring-129
title: "Design source-tracking for applied conditions to support source-dependent clearing"
priority: P3
severity: low
status: open
domain: combat
source: decree-047
created_by: decree-facilitator
created_at: 2026-03-04
affected_files:
  - app/constants/statusConditions.ts
  - app/server/services/condition.service.ts
---

## Summary

Per decree-047, whether Other category conditions clear on faint should depend on **what applied them** (move, ability, terrain, etc.), not on a static per-condition flag. This requires tracking the source of each applied condition instance at runtime.

## Required Implementation

Design and implement a source-tracking mechanism for applied conditions:

1. **Source metadata:** When a condition is applied to a Pokemon, record what applied it (move name, ability, terrain, item, etc.)
2. **Source-based clearing rules:** Define which sources produce faint-clearable conditions vs. persistent ones
3. **Integration with faint logic:** The faint-clearing code checks the source of each Other condition to decide whether to clear it

This is a design task — requires a design spec before implementation begins.

## Notes

- decree-038 established per-condition behavior flags; this extends the principle to per-instance behavior based on source.
- Low priority — the RAW default (clearsOnFaint: false) is a safe interim. Source-dependent clearing is a future enhancement.
