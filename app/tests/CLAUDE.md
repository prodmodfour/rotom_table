# Tests CLAUDE.md

Context for working with the test infrastructure in `app/tests/`.

## Test Structure

53 test files total: 51 unit tests across 6 subdirectories + 2 integration tests. The `e2e/` directory exists but is empty (`.gitkeep` only).

```
tests/
├── unit/
│   ├── api/            # 10 files — server endpoint handlers
│   ├── components/     # 3 files — CombatantCaptureSection, CombatantCard, PokemonCard
│   ├── composables/    # 10 files — useCombat, useDamageCalculation, useGridMovement, etc.
│   ├── services/       # 7 files — combatant, encounterGeneration, healing-item, restHealing, status-automation, ball-condition, switching
│   ├── stores/         # 7 files — encounter, encounterLibrary, encounterTables, library, settings, terrain, terrain-migration
│   └── utils/          # 14 files — diceRoller, gridDistance, captureRate, typeChart, restHealing, abilityAssignment, etc.
├── integration/        # 2 files — encounter-tables, fog-of-war
└── e2e/                # empty (.gitkeep) — UX exploration uses Playwright in ux-sessions/
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

**Prisma client** (API/service tests): `const mockPrisma = { model: { findMany: vi.fn() } }; vi.mock('~/server/utils/prisma', () => ({ prisma: mockPrisma }))`

**$fetch** (store tests): `vi.stubGlobal('$fetch', vi.fn())` — stub before importing the store under test.

**H3 utilities** (API tests): `vi.stubGlobal('readBody', vi.fn()); vi.stubGlobal('createError', vi.fn((o) => ({...o}))); vi.stubGlobal('getRouterParam', vi.fn())`

**Pinia stores** (component/composable tests): `import { setActivePinia, createPinia } from 'pinia'; beforeEach(() => setActivePinia(createPinia()))`

**Composables** — call directly, test return values: `const { getSetDamage } = useDamageCalculation(); expect(getSetDamage(6)).toBe(15)`

**Components** — do NOT mount; test extracted logic via factory helpers: `createMockPokemonEntity()`, `createMockCombatant()`.

## Coverage Gaps

**Well covered**: utils (14 tests), composables (10), API handlers (10), stores (7), services (7).

**Major gaps**:
- **VTT**: 14 components + 6 composables + 6 stores = 26 source files, only ~4 related tests (gridMovement, terrain, terrain-migration, gridDistance)
- **Player**: 16 components + 1 page = 17 source files, 0 tests
- **Isometric**: 5 composables + 1 component + 1 store = 7 source files, 0 tests
- **Components overall**: 3 unit tests out of 153 total components
- **WebSocket**: 3 source files (composable, server route, server util), 0 tests
- **Integration**: only 2 files — cross-layer flows (e.g., encounter creation -> combat -> XP) untested
