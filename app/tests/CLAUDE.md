# Tests CLAUDE.md

Context for working with the test infrastructure in `app/tests/`.

## Test Structure

49 test files total: 47 unit tests across 6 subdirectories + 2 integration tests. The `e2e/` directory exists but is empty (`.gitkeep` only).

```
tests/
├── unit/
│   ├── api/            # 10 files — server endpoint handlers
│   ├── components/     # 2 files — CombatantCard, PokemonCard
│   ├── composables/    # 10 files — useCombat, useDamageCalculation, useGridMovement, etc.
│   ├── services/       # 5 files — combatant, encounterGeneration, healing-item, restHealing, status-automation
│   ├── stores/         # 7 files — encounter, encounterLibrary, encounterTables, library, settings, terrain, terrain-migration
│   └── utils/          # 13 files — diceRoller, gridDistance, captureRate, typeChart, restHealing, etc.
├── integration/        # 2 files — encounter-tables, fog-of-war
└── e2e/                # empty (.gitkeep)
```

## Running Tests

```bash
cd app
npx vitest run                           # all tests once
npx vitest run tests/unit/utils          # single directory
npx vitest run tests/unit/utils/diceRoller.test.ts  # single file
npx vitest run --coverage                # with v8 coverage report
npx vitest                               # watch mode (re-runs on change)
```

## Vitest Config

Defined in `app/vitest.config.ts`:
- **Environment**: `happy-dom` (fast DOM simulation)
- **Globals**: `true` (no need to import `describe`/`it`/`expect` in test files)
- **Coverage**: v8 provider, reporters: text/json/html, scoped to `composables/`, `stores/`, `server/api/`
- **Aliases**: `~` and `@` both resolve to `app/`
- **Plugin**: `@vitejs/plugin-vue` for SFC support

## Mock Patterns

**Prisma client** — `vi.mock('~/server/utils/prisma', () => ({ prisma: mockPrisma }))` with per-model `vi.fn()` methods.

**`$fetch`** — `vi.stubGlobal('$fetch', mockFetch)` before importing the store under test.

**H3 utilities** — stub `readBody`, `getRouterParam`, `defineEventHandler` via `vi.stubGlobal()`. The `defineEventHandler` stub unwraps to the raw handler function for direct invocation.

**Pinia stores** — `setActivePinia(createPinia())` in `beforeEach` to isolate store state per test.

**Composables/utilities** — imported and called directly; pure functions need no mocking.

**Components** — tested via extracted logic functions, not `@vue/test-utils` mounting.

## Coverage Gaps

**Well covered**: utils (13 tests), composables (10), API handlers (10), stores (7), services (5).

**Major gaps**:
- **VTT**: 14 components + 6 composables + 6 stores = 26 source files, only ~4 related tests (gridMovement, terrain, terrain-migration, gridDistance)
- **Player**: 16 components + 1 page = 17 source files, 0 tests
- **Isometric**: 5 composables + 1 component + 1 store = 7 source files, 0 tests
- **Components overall**: 2 unit tests out of 146 total components
- **WebSocket**: 3 source files (composable, server route, server util), 0 tests
