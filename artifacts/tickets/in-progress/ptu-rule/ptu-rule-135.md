---
id: ptu-rule-135
title: "Wild captures should default to Loyalty 2 (Wary) per decree-049"
priority: P4
severity: LOW
status: in-progress
domain: capture
source: decree-049
created_by: decree-facilitator (plan-1772664485)
created_at: 2026-03-04
affected_files:
  - app/server/api/capture/attempt.post.ts
  - app/server/services/entity-builder.service.ts
  - app/server/api/pokemon/index.post.ts
  - app/server/utils/serializers.ts
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

## Resolution Log

- `81b9cef3` — `app/server/api/capture/attempt.post.ts`: Set `loyalty: 2` explicitly on capture success; updated Friend Ball effect to use base loyalty 2 instead of `?? 3`
- `280d5a65` — `app/server/api/pokemon/index.post.ts`: Origin-aware loyalty default (wild→2, others→3) for manual Pokemon creation
- `1cce5e80` — `app/server/services/entity-builder.service.ts`: Origin-aware loyalty fallback (wild/captured→2, others→3) when DB value is null
- `pokemon-generator.service.ts`: Already had correct `getStartingLoyalty()` function mapping captured/wild→2, others→3 (no changes needed)
- `csv-import.service.ts`: Routes through `createPokemonRecord` which already uses `getStartingLoyalty` (no changes needed)
- **Fix cycle (code-review-332):**
- `34253689` — `app/server/api/pokemon/index.post.ts`: Added 'captured' origin to loyalty default check (was missing, only checked 'wild')
- `1210a44b` — `app/server/utils/serializers.ts`: Changed `?? 3` fallbacks to origin-aware logic in both `serializeLinkedPokemon` and `serializePokemon` (wild/captured→2, others→3)
