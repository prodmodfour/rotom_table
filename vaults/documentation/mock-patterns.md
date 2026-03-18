# Mock Patterns

Standard mocking approaches used across the [[test-directory-structure]]:

**Prisma client** (API/service tests):
```typescript
const mockPrisma = { model: { findMany: vi.fn() } }
vi.mock('~/server/utils/prisma', () => ({ prisma: mockPrisma }))
```

**$fetch** (store tests):
```typescript
vi.stubGlobal('$fetch', vi.fn())
```
Stub before importing the store under test.

**H3 utilities** (API tests):
```typescript
vi.stubGlobal('readBody', vi.fn())
vi.stubGlobal('createError', vi.fn((o) => ({...o})))
vi.stubGlobal('getRouterParam', vi.fn())
```

**Pinia stores** (component/composable tests):
```typescript
import { setActivePinia, createPinia } from 'pinia'
beforeEach(() => setActivePinia(createPinia()))
```

**Composables** — Call directly, test return values.

**Components** — Do NOT mount. Test extracted logic via factory helpers: `createMockPokemonEntity()`, `createMockCombatant()`.

## See also

- [[vitest-configuration]]
