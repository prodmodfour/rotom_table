---
id: feature-022
title: Pokemon Loyalty System
priority: P2
severity: MEDIUM
status: in-progress
domain: pokemon-lifecycle
source: matrix-gap (GAP-PLC-3)
matrix_source: pokemon-lifecycle R048, R049, R050
created_by: master-planner
created_at: 2026-02-28
---

# feature-022: Pokemon Loyalty System

## Summary

No loyalty tracking exists. PTU loyalty is a 7-rank system (0-6) that affects command checks, disobedience, and evolution for some species. 3 matrix rules classified as Missing.

## Gap Analysis

| Rule | Title | Status |
|------|-------|--------|
| R048 | Loyalty System — Ranks | PARTIAL — loyalty field added, display + edit working |
| R049 | Loyalty — Command Checks | Missing — no DC enforcement based on loyalty rank (future scope) |
| R050 | Loyalty — Starting Values | DONE — starting values set by origin in pokemon-generator |

## PTU Rules

- Chapter 10: Pokemon Loyalty
- 7 ranks (0 = hostile, 3 = neutral, 6 = devoted)
- Captured wild Pokemon start at rank 2
- Traded Pokemon start at rank 1
- Bred Pokemon start at rank 4
- Low loyalty requires Command checks (Charm/Intimidate vs DC)
- Some evolutions require minimum loyalty

## Implementation Scope

PARTIAL-scope — can be implemented as a simple integer field with minimal UI. Design spec optional.

## Affected Areas

- `app/prisma/schema.prisma` — Pokemon: loyalty field
- `app/types/character.ts` — Pokemon type: loyalty field (non-optional)
- `app/server/services/pokemon-generator.service.ts` — set starting loyalty by origin
- `app/server/api/pokemon/index.post.ts` — loyalty in manual creation
- `app/server/api/pokemon/[id].put.ts` — loyalty in update endpoint
- `app/server/utils/serializers.ts` — loyalty in API responses
- `app/server/services/entity-builder.service.ts` — loyalty in entity mapping
- `app/components/pokemon/PokemonStatsTab.vue` — loyalty display + edit UI

## Out of Scope (future tickets)

- Command check DC enforcement based on loyalty (R049)
- Loyalty-gated evolution checks
- Automatic loyalty changes from gameplay events
- Traded Pokemon loyalty (origin = 'traded' does not exist yet)
- Bred Pokemon loyalty (origin = 'bred' does not exist yet)

## Migration Required

After merging, run `npx prisma db push` to add the `loyalty` column to the Pokemon table. Existing Pokemon will get default value 3 (Neutral).

### Post-merge `as any` removal checklist

After running `npx prisma generate` (so the Prisma client includes the `loyalty` field), remove these 5 `as any` casts:

1. `app/server/utils/serializers.ts` line 51: `(p as any).loyalty` → `p.loyalty`
2. `app/server/utils/serializers.ts` line 242: `(pokemon as any).loyalty` → `pokemon.loyalty`
3. `app/server/services/entity-builder.service.ts` line 64: `(record as any).loyalty` → `record.loyalty`
4. `app/server/api/capture/attempt.post.ts` line 192: `(pokemon as any).loyalty` → `pokemon.loyalty`
5. `app/server/api/capture/attempt.post.ts` line 196: `{ loyalty: newLoyalty } as any` → `{ loyalty: newLoyalty }`

## Resolution Log

| Commit | Files | Description |
|--------|-------|-------------|
| ab3fca05 | schema.prisma, character.ts | Add loyalty field to Prisma schema and TypeScript type |
| e0d17fcc | pokemon-generator.service.ts, index.post.ts | Set starting loyalty values based on origin |
| 82d86103 | serializers.ts, [id].put.ts, entity-builder.service.ts | Expose loyalty in API responses and update endpoint |
| 84f34e44 | PokemonStatsTab.vue | Add loyalty display and edit UI with PhHandshake icon |
| 51c53132 | attempt.post.ts | Wire Friend Ball +1 loyalty to actual DB update |
