---
id: decree-need-048
title: Default loyalty for newly caught wild Pokemon (schema default 3 vs PTU RAW 2)
priority: P4
severity: LOW
status: addressed
decree_id: decree-049
domain: capture
source: rules-review-311 MED-001
created_by: game-logic-reviewer
created_at: 2026-03-04
affected_files:
  - app/prisma/schema.prisma
  - app/server/api/capture/attempt.post.ts
  - app/server/services/intercept.service.ts
  - app/server/utils/serializers.ts
  - app/server/api/pokemon/index.post.ts
  - app/server/services/entity-builder.service.ts
  - app/components/pokemon/PokemonStatsTab.vue
---

## Summary

The Prisma schema sets `loyalty Int @default(3)` (Neutral), and all 8 nullish coalescing fallbacks use `?? 3`. However, PTU RAW (core/05-pokemon.md:1470) states: "Most caught wild Pokemon will begin at this Loyalty Rank" referring to Loyalty 2 (Wary).

## Ambiguity

PTU RAW suggests Loyalty 2 as the starting default for most caught wild Pokemon. The schema uses 3 (Neutral). Both are defensible:

- **Loyalty 2 (RAW):** Matches the rulebook's description of typical wild captures. Adds a progression element where trainers must earn their Pokemon's trust.
- **Loyalty 3 (current):** Simplifies gameplay. PTU also notes that hatched, befriended, or non-hostile Pokemon may start at Loyalty 3. Using Neutral as the universal default avoids per-origin complexity.

## Decision Needed

Should the application default loyalty for newly caught wild Pokemon be:
- (A) **2 (Wary)** — matching PTU RAW for wild captures
- (B) **3 (Neutral)** — keeping the current schema default as a simplification
- (C) **Origin-dependent** — wild catches get 2, hatched/gifted get 3+

This affects the schema default, all 8 fallback sites, and the Friend Ball post-capture effect outcome.

## PTU References

- `core/05-pokemon.md:1468-1471` — "Loyalty 2 Pokemon like their trainer well enough... Most caught wild Pokemon will begin at this Loyalty Rank"
- `core/05-pokemon.md:1499-1504` — "It's also possible for a Pokemon to begin at Loyalty 3. For example, most Pokemon hatched from eggs..."
