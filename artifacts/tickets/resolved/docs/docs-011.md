---
id: docs-011
title: "Add CLAUDE.md for app/server/api/"
priority: P0
severity: MEDIUM
status: resolved
domain: server
source: plan-descendant-claude-md-rollout
created_by: user
created_at: 2026-03-02
phase: 3
affected_files:
  - app/server/api/CLAUDE.md (new)
---

# docs-011: Add CLAUDE.md for app/server/api/

## Summary

Create a descendant CLAUDE.md in `app/server/api/` to document the 15 domain directories, Nitro file-based routing conventions, response format, error handling pattern, and service delegation rule. Agents creating new endpoints need to follow consistent patterns — currently they have to reverse-engineer conventions from existing files.

## Target File

`app/server/api/CLAUDE.md` (~50 lines)

## Required Content

### Directory Layout (15 domains)
```
api/
  abilities/           # 1 endpoint  — batch ability lookup
  capture/             # 2 endpoints — rate calculation, attempt
  characters/          # 17 endpoints — CRUD + rest/healing/xp + equipment
  encounter-tables/    # 18 endpoints — tables + entries + modifications (deeply nested)
  encounter-templates/ # 7 endpoints  — CRUD + load from template
  encounters/          # ~50 endpoints — CRUD + 44 combat action endpoints
  game/                # 1 endpoint   — new-day reset
  group/               # 8 endpoints  — map, tab, wild-spawn
  library/             # empty (placeholder)
  moves/               # 1 endpoint   — batch move lookup
  player/              # 3 endpoints  — action-request, export, import
  pokemon/             # 18 endpoints — CRUD + evolution + rest/healing + bulk-action
  scenes/              # 17 endpoints — CRUD + characters/pokemon/groups/positions
  settings/            # 3 endpoints  — server-info, tunnel get/put
  species/             # 2 endpoints  — get by name, list all
```

### Naming Convention (Nitro file-based routing)
- **CRUD pattern**: `index.get.ts` (list), `index.post.ts` (create), `[id].get.ts` (read), `[id].put.ts` (update), `[id].delete.ts` (delete)
- **Action endpoints**: `<action-name>.post.ts` (e.g., `extended-rest.post.ts`, `evolve.post.ts`, `damage.post.ts`)
- **Dynamic params**: `[id]`, `[entryId]`, `[combatantId]`, `[charId]`, `[pokemonId]`, `[modId]`, `[name]`
- **Nested resources**: subdirectories (e.g., `encounters/[id]/combatants/[combatantId].delete.ts`)

### Response Format
All endpoints return: `{ success: boolean, data?: T, error?: string }`

### Error Handling Pattern
```typescript
throw createError({ statusCode: 400 | 404 | 500, statusMessage: 'descriptive message' })
```
Errors caught in try/catch. Known H3 errors (with `statusCode`) re-thrown; unknown errors wrapped in 500.

### Service Delegation Rule
API routes **MUST NOT** contain business logic. Pattern:
1. Parse request (`readBody`, `getQuery`, `getRouterParam`)
2. Validate required fields (manual check or Zod)
3. Call service function(s) from `server/services/`
4. Return `{ success: true, data: result }`

Simple CRUD endpoints may work directly with Prisma + serializer utilities from `server/utils/serializers.ts`.

### Service Mapping (which API dirs delegate to which services)
| API Directory | Primary Service |
|--------------|----------------|
| encounters/ | encounter.service, combatant.service, out-of-turn.service, intercept.service, switching.service, status-automation.service |
| pokemon/ | pokemon-generator.service, evolution.service, entity-update.service |
| characters/ | entity-update.service, rest-healing.service |
| capture/ | (inline — pure calculation, no service) |
| scenes/ | scene.service |
| encounter-tables/ | (direct Prisma — simple CRUD) |

## Verification

- File is 30-80 lines
- Directory listing matches actual api/ subdirectories
- Response format verified against 3+ existing endpoints
- Service delegation pattern verified against actual endpoint implementations

## Resolution Log

- Created `app/server/api/CLAUDE.md` (~56 lines) documenting 14 API domains with verified endpoint counts (151 total), naming conventions, response format, error handling, service delegation rule, and comprehensive service mapping table
- Endpoint counts verified by scanning actual .ts files per directory
- Service mappings verified by checking imports in representative endpoints
- Corrected ticket's `statusMessage` to `message` (matching actual codebase pattern)
- Omitted `library/` directory (listed in ticket but does not exist)
