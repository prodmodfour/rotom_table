---
id: ptu-rule-135
title: "Wild captures should default to Loyalty 2 (Wary) per decree-049"
priority: P4
severity: LOW
status: open
domain: capture
source: decree-049
created_by: decree-facilitator (plan-1772664485)
created_at: 2026-03-04
affected_files:
  - app/server/api/capture/attempt.post.ts
  - app/server/services/entity-builder.service.ts
  - app/server/api/pokemon/index.post.ts
---

## Summary

Per decree-049, wild-caught Pokemon should default to Loyalty 2 (Wary) instead of the current universal default of 3 (Neutral). Hatched, gifted, starter, and custom-origin Pokemon retain Loyalty 3.

## Required Implementation

1. In `attempt.post.ts` (capture success path): when creating a captured Pokemon, set `loyalty: 2` explicitly for wild captures instead of relying on the schema default of 3.
2. In `entity-builder.service.ts`: when building a new Pokemon entity, check the `origin` field and set loyalty accordingly:
   - `wild` → 2
   - `hatched`, `gifted`, `starter`, `custom` → 3
3. In `pokemon/index.post.ts` (manual Pokemon creation): if origin is `wild`, default loyalty to 2.
4. The Prisma schema `@default(3)` remains unchanged (safe fallback for edge cases).
5. Update the 8 `?? 3` fallback sites — these remain correct as `3` since they handle null/undefined cases where origin is unknown.

## Notes

- The `origin` enum values are: `wild`, `hatched`, `gifted`, `starter`, `custom`
- Friend Ball post-capture effect (Loyalty +1) still applies after the origin-based default, so wild captures with Friend Ball would end at Loyalty 3
- PTU RAW: "Most caught wild Pokemon will begin at [Loyalty 2]" (05-pokemon.md:1468-1470)
