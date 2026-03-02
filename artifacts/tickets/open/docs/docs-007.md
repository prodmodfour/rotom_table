---
id: docs-007
title: "Add CLAUDE.md for app/tests/"
priority: P0
severity: HIGH
status: open
domain: testing
source: plan-descendant-claude-md-rollout
created_by: user
created_at: 2026-03-02
phase: 2
affected_files:
  - app/tests/CLAUDE.md (new)
---

# docs-007: Add CLAUDE.md for app/tests/

## Summary

Create a descendant CLAUDE.md in `app/tests/` to document test structure, runner commands, vitest configuration, and mock patterns. Agents writing tests need to know the correct mock patterns (Prisma mock, $fetch stub, H3 global stubs) and the vitest config (happy-dom, globals mode). This file also documents known coverage gaps so agents can prioritize.

## Target File

`app/tests/CLAUDE.md` (~50 lines)

## Required Content

### Test Structure
```
tests/
  unit/
    api/          # 10 files — API endpoint behavior
    components/   # 2 files — Component rendering/logic
    composables/  # 10 files — Composable functions
    services/     # 5 files — Server-side service layer
    stores/       # 7 files — Pinia store behavior
    utils/        # 13 files — Pure utility functions
  integration/    # 2 files — Cross-layer (encounter-tables, fog-of-war)
  e2e/            # Empty (.gitkeep) — UX exploration uses Playwright in ux-sessions/
```
**Total: 49 test files (47 unit + 2 integration)**

### Running Tests
```bash
cd app
npx vitest run                    # all tests
npx vitest run tests/unit/composables/useMoveCalculation.test.ts  # single file
npx vitest --coverage             # with v8 coverage report
npx vitest --watch                # watch mode
```

### Vitest Configuration (`app/vitest.config.ts`)
- **Environment**: `happy-dom` (DOM simulation)
- **Globals**: `true` — `describe`, `it`, `expect` available without import
- **Coverage provider**: `v8`, reports text + json + html
- **Coverage scope**: `composables/**`, `stores/**`, `server/api/**`
- **Path aliases**: `~` and `@` both resolve to `app/`
- **Plugin**: `@vitejs/plugin-vue` for Vue SFC support

### Mock Patterns

**Prisma client** (API + service tests):
```typescript
const mockPrisma = { encounter: { findMany: vi.fn(), findUnique: vi.fn() } }
vi.mock('~/server/utils/prisma', () => ({ prisma: mockPrisma }))
```

**$fetch** (store tests):
```typescript
const mockFetch = vi.fn()
vi.stubGlobal('$fetch', mockFetch)
```

**H3 utilities** (API tests):
```typescript
vi.stubGlobal('readBody', vi.fn())
vi.stubGlobal('createError', vi.fn((opts) => ({ ...opts })))
vi.stubGlobal('getRouterParam', vi.fn())
```

**Pinia stores** (component/composable tests):
```typescript
import { setActivePinia, createPinia } from 'pinia'
beforeEach(() => setActivePinia(createPinia()))
```

**Composable tests** — call directly, test return values:
```typescript
const { getSetDamage } = useDamageCalculation()
expect(getSetDamage(6)).toBe(15)
```

**Utility tests** — pure function tests, no mocking needed.

**Component tests** — do NOT mount components; test extracted logic using factory helpers (`createMockPokemonEntity`, `createMockCombatant`).

### Known Coverage Gaps
- **VTT composables**: 1 of 18 tested (only useGridMovement has tests)
- **Player composables**: 0 of 6 tested
- **Isometric composables**: 0 of 7 tested
- **Components**: 2 of 73+ tested (CombatantCard, PokemonCard)
- **Integration**: only 2 files total
- **WebSocket composables**: 0 of 4 tested
- **Best covered**: utils/ (13 files), composables/ (10 files), stores/ (7 files)

## Verification

- File is 30-80 lines
- Test count verified against actual directory listing
- Mock patterns verified against existing test files
- Vitest config details match app/vitest.config.ts
