# API CLAUDE.md

Context for working within the Nitro REST API layer (`app/server/api/`). 151 endpoint files across 14 domain directories.

## Directory Layout

```
api/
  abilities/           # 1 endpoint  — batch ability lookup
  capture/             # 2 endpoints — rate calculation, attempt
  characters/          # 17 endpoints — CRUD + rest/healing/xp + equipment
  encounter-tables/    # 18 endpoints — tables + entries + modifications (deeply nested)
  encounter-templates/ # 7 endpoints  — CRUD + load from template
  encounters/          # 51 endpoints — CRUD + combat actions (damage, status, turns, etc.)
  game/                # 1 endpoint   — new-day reset
  group/               # 8 endpoints  — map, tab sync, wild-spawn
  moves/               # 1 endpoint   — batch move lookup
  player/              # 3 endpoints  — action-request, export, import
  pokemon/             # 21 endpoints — CRUD + evolution + rest/healing + bulk-action
  scenes/              # 16 endpoints — CRUD + characters/pokemon/groups/positions
  settings/            # 3 endpoints  — server-info, tunnel get/put
  species/             # 2 endpoints  — get by name, list all
```

## Naming Convention (Nitro File-Based Routing)

- **CRUD pattern**: `index.get.ts` (list), `index.post.ts` (create), `[id].get.ts` (read), `[id].put.ts` (update), `[id].delete.ts` (delete)
- **Action endpoints**: `<action-name>.post.ts` (e.g., `extended-rest.post.ts`, `evolve.post.ts`, `damage.post.ts`)
- **Dynamic params**: `[id]`, `[entryId]`, `[combatantId]`, `[charId]`, `[pokemonId]`, `[modId]`, `[name]`
- **Nested resources**: subdirectories (e.g., `encounters/[id]/combatants/[combatantId].delete.ts`)

## Response Format

All endpoints return:
```typescript
{ success: boolean, data?: T, error?: string }
```

## Error Handling Pattern

```typescript
throw createError({ statusCode: 400 | 404 | 500, message: 'descriptive message' })
```

Errors caught in try/catch. Known H3 errors (with `statusCode`) are re-thrown; unknown errors wrapped in 500.

## Service Delegation Rule

API routes **MUST NOT** contain business logic. Pattern:
1. Parse request (`readBody`, `getQuery`, `getRouterParam`)
2. Validate required fields (manual check or Zod)
3. Call service function(s) from `server/services/`
4. Return `{ success: true, data: result }`

Simple CRUD endpoints may work directly with Prisma + serializer utilities from `server/utils/serializers.ts`.

## Service Mapping

| API Directory | Primary Service(s) |
|--------------|-------------------|
| encounters/ | encounter.service, combatant.service, out-of-turn.service, intercept.service, switching.service, status-automation.service |
| pokemon/ | pokemon-generator.service, evolution.service, entity-update.service |
| characters/ | entity-update.service, rest-healing.service, csv-import.service |
| capture/ | Utility functions in `utils/captureRate` (no dedicated service) |
| scenes/ | scene.service |
| encounter-tables/ | Direct Prisma (simple CRUD) + encounter-generation.service (generate endpoint) |
| encounter-templates/ | pokemon-generator.service, combatant.service (load endpoint) |
| group/ | Direct Prisma + WebSocket broadcast |
| settings/ | Direct Prisma |
| abilities/, moves/, species/ | Direct Prisma (reference data lookup) |
| game/ | rest-healing.service |
| player/ | Direct Prisma + csv-import.service |
