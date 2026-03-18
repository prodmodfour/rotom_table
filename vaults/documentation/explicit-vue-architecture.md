# Explicit Vue Architecture

A destructive restructuring to rip Nuxt out of the client entirely — replacing it with a vanilla Vite + Vue application where every import is explicit, every route is code-defined, and every architectural decision is visible in the source — addressing the [[nuxt-framework-entanglement|entanglement of the application with Nuxt conventions]] that provide minimal value for a local-network SPA.

## The idea

Nuxt is a server-rendering framework. The app disables server rendering (`ssr: false`). Nuxt is a deployment-target framework. The app deploys to a single machine on a LAN. Nuxt is a content-framework. The app has 3 routes. What remains of Nuxt's value is a set of conventions — auto-imports, file-based routing, server directory structure — that hide the dependency graph and constrain the architecture.

Strip Nuxt entirely. Use Vite as the build tool. Use Vue Router for routing. Use explicit imports for everything. The server (if it stays in-process) uses Express, Fastify, or Hono. The client is a plain Vue SPA.

```
Before (Nuxt conventions):
app/
  pages/
    gm/
      index.vue             ← file-based routing
    group/
      index.vue
    player/
      index.vue
  composables/
    useEncounterActions.ts   ← auto-imported, dependencies invisible
  server/
    api/
      encounters/
        [id]/
          damage.post.ts     ← Nitro convention
  nuxt.config.ts             ← framework configuration

After (explicit Vite + Vue):
src/
  main.ts                    ← composition root, all wiring visible
  router.ts                  ← explicit route definitions
  views/
    GmView.vue
    GroupView.vue
    PlayerView.vue
  domain/
    combat/
      useCombatActions.ts    ← explicit imports, injected dependencies
      DamageCalculator.ts
    encounter/
      useEncounterState.ts
    movement/
      useGridMovement.ts
  infrastructure/
    api/
      GameApiClient.ts       ← typed HTTP client
    ws/
      GameWebSocket.ts       ← typed WebSocket client
    persistence/
      EncounterRepository.ts
server/                       ← standalone server (separate process or separate entry)
  index.ts                    ← explicit server bootstrap
  routes/
    encounterRoutes.ts        ← explicit route registration
  services/
    ...
```

```typescript
// main.ts — the composition root, everything wired explicitly
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter } from './router'
import { createGameApiClient } from './infrastructure/api/GameApiClient'
import { createGameWebSocket } from './infrastructure/ws/GameWebSocket'
import App from './App.vue'

const app = createApp(App)
const pinia = createPinia()
const router = createRouter()

const apiClient = createGameApiClient({ baseUrl: import.meta.env.VITE_API_URL })
const wsClient = createGameWebSocket({ url: import.meta.env.VITE_WS_URL })

app.use(pinia)
app.use(router)
app.provide('apiClient', apiClient)
app.provide('wsClient', wsClient)

app.mount('#app')

// router.ts — explicit routes, not file-based
import { createRouter as createVueRouter, createWebHistory } from 'vue-router'
import GmView from './views/GmView.vue'
import GroupView from './views/GroupView.vue'
import PlayerView from './views/PlayerView.vue'

export function createRouter() {
  return createVueRouter({
    history: createWebHistory(),
    routes: [
      { path: '/gm', component: GmView },
      { path: '/gm/encounters/:id', component: () => import('./views/GmEncounterView.vue') },
      { path: '/group', component: GroupView },
      { path: '/group/:encounterId', component: () => import('./views/GroupEncounterView.vue') },
      { path: '/player', component: PlayerView },
      { path: '/player/:encounterId', component: () => import('./views/PlayerEncounterView.vue') },
    ]
  })
}

// Composable — explicit imports, visible dependencies
import { ref, computed } from 'vue'
import { usePokemonStore } from '../stores/pokemonStore'  // EXPLICIT import
import { calculateDamage } from '../domain/combat/DamageCalculator'  // EXPLICIT import
import type { GameApiClient } from '../infrastructure/api/GameApiClient'  // EXPLICIT import

export function useCombatActions(apiClient: GameApiClient) {
  const pokemonStore = usePokemonStore()  // explicit, visible in import graph

  async function dealDamage(targetId: string, amount: number) {
    const preview = calculateDamage(/* ... */)
    await apiClient.dealDamage(targetId, amount)
  }

  return { dealDamage }
}

// server/index.ts — explicit server bootstrap (if separate process)
import Fastify from 'fastify'
import { registerEncounterRoutes } from './routes/encounterRoutes'
import { registerCharacterRoutes } from './routes/characterRoutes'
import { PrismaClient } from '@prisma/client'

const app = Fastify()
const prisma = new PrismaClient()

registerEncounterRoutes(app, prisma)
registerCharacterRoutes(app, prisma)

app.listen({ port: 3001 })
```

## Why this is destructive

- **`nuxt.config.ts` is deleted.** The entire Nuxt configuration — plugins, modules, runtime config, experimental flags, Nitro settings — is replaced by Vite's `vite.config.ts` and explicit application code.
- **All auto-imports are replaced by explicit imports.** Every composable, utility, and Vue API (`ref`, `computed`, `watch`) must be explicitly imported. The import section of every `.vue` file grows. The dependency graph becomes visible.
- **File-based routing is replaced by code-defined routes.** The `pages/` directory convention is abandoned. Routes are defined in `router.ts` as explicit objects. Lazy loading is achieved through `() => import(...)` instead of Nuxt's automatic code splitting.
- **The `server/` directory convention is abandoned.** `server/api/encounters/[id]/damage.post.ts` becomes an explicit route registered in a Fastify/Express handler. The server is a plain Node.js application.
- **All Nuxt-specific APIs are removed.** `useFetch`, `useAsyncData`, `defineEventHandler`, `readBody`, `getRouterParam`, `createError`, `defineNuxtConfig`, `definePageMeta`, `useRuntimeConfig` — all are replaced by standard Vue and HTTP library equivalents.
- **The dev workflow changes.** `nuxt dev` is replaced by `vite dev` for the frontend. If the server is a separate process, it runs independently (compatible with [[headless-game-server]]).
- **Every component, composable, and utility file is touched.** Auto-imported references must be replaced with explicit imports. This is a codebase-wide rewrite affecting hundreds of files.
- **Nuxt modules are replaced by explicit integrations.** Any Nuxt module (PrimeVue Nuxt module, Pinia Nuxt module) is replaced by direct library usage (`app.use(PrimeVue)`, `app.use(createPinia())`).

## Principles improved

- Explicit over implicit — the most fundamental principle at stake. Currently, a composable can call `useEncounterStore()` without importing it. After this change, every dependency is visible as an import statement. The entire dependency graph is traceable by reading import trees.
- [[dependency-inversion-principle]] — without auto-imports, dependencies must be explicitly resolved. This naturally pushes toward injection patterns because the alternative (importing concrete singletons) is visible and ugly.
- [[single-responsibility-principle]] — the application has one configuration file (`vite.config.ts` for build), one composition root (`main.ts` for wiring), one router (`router.ts` for navigation). Currently, `nuxt.config.ts` configures build + server + routing + modules + runtime config.
- Eliminates [[nuxt-framework-entanglement]] — Nuxt is gone. The app is a standard Vue application.
- Reduces [[horizontal-layer-coupling]] — without file-based routing constraining the directory structure, the codebase can be organized by domain (compatible with [[domain-module-architecture]]).
- Reduces [[singleton-state-coupling]] — explicit imports make singleton access visible, creating pressure to refactor toward injection.

## Patterns and techniques

- Composition Root — `main.ts` is the single place where the application is assembled
- [[facade-pattern]] — `GameApiClient` is a facade over raw HTTP calls, replacing Nuxt's `useFetch`
- [[adapter-pattern]] — explicit WebSocket and HTTP clients adapt raw browser APIs to domain-specific interfaces
- Explicit Dependency Resolution — every module declares exactly what it needs via import statements
- Convention over configuration → Configuration over convention — inverting Nuxt's philosophy

## Trade-offs

- **Massive migration scope.** Every `.vue` file, every composable, every utility must be updated with explicit imports. The migration touches hundreds of files. There is no incremental path — you cannot partially remove Nuxt.
- **Loss of Nuxt DX features.** Hot module replacement, error overlay, devtools integration, and build optimization are all provided by Nuxt. Vite provides most of these natively, but the experience may be slightly rougher.
- **Loss of Nuxt ecosystem.** Nuxt modules provide pre-configured integrations (PrimeVue, SEO, image optimization). Without Nuxt, these integrations must be configured manually. For a local tabletop app, most of these are irrelevant — but PrimeVue integration may be affected.
- **Import verbosity.** Every file must import `ref`, `computed`, `watch`, `onMounted`, etc. from Vue. Nuxt auto-imports these. The verbosity is the point (visibility), but it's a real cost in keystroke count.
- **Team onboarding.** New contributors (if any) must understand the explicit architecture. Nuxt's conventions provide a standard structure that's immediately recognizable to Nuxt developers. A custom Vite + Vue setup requires documentation.
- **Build configuration responsibility.** Nuxt handles Vite configuration, TypeScript setup, path aliases, and module resolution. Without Nuxt, these must be configured explicitly in `vite.config.ts` and `tsconfig.json`.
- **Server separation forced.** Without Nuxt's integrated server, the API server must either be a separate process (see [[headless-game-server]]) or use a Vite plugin for API proxying during development. This adds operational complexity.

## Open questions

- Should the server be a separate process (fully committing to [[headless-game-server]]) or bundled as a Vite plugin (simpler dev experience but less separation)?
- Should auto-imports be replaced by barrel exports from domain modules? E.g., `import { useEncounterStore, useEncounterActions } from '@/domain/encounter'` — explicit but not per-file.
- What replaces Nuxt's `useRuntimeConfig()`? Environment variables via `import.meta.env`? A dedicated config module?
- Does this affect PrimeVue usage? PrimeVue works with both Nuxt and plain Vue, but the setup path is different.
- Should this migration happen before or after [[headless-game-server]]? If the server is extracted first, the Nuxt removal is smaller (client-only). If Nuxt is removed first, the server must be simultaneously extracted.
- Is there a middle ground — keeping Nuxt but disabling auto-imports (`imports: { autoImport: false }`) and using explicit routing? This preserves Nuxt's build tooling while gaining import visibility.

## See also

- [[nuxt-framework-entanglement]] — the problem this addresses
- [[headless-game-server]] — compatible: removing Nuxt naturally separates the server
- [[framework-coupled-game-server]] — the server-side version of this problem
- [[domain-module-architecture]] — compatible: without file-based routing, domain modules can organize freely
- [[ioc-container-architecture]] — compatible: explicit imports create natural pressure toward IoC
- [[singleton-state-coupling]] — reduced: explicit imports make singleton access visible
- [[composable-store-direct-coupling]] — reduced: coupling is visible in the import graph
