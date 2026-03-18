# Headless Game Server

A destructive restructuring to rip the game server out of Nuxt entirely and run it as a standalone, framework-agnostic process — addressing the [[framework-coupled-game-server|structural coupling between the game server and the Nuxt application framework]].

## The idea

The app runs a real-time multiplayer game server inside a content-oriented web framework. Nuxt provides SSR, file-based routing, auto-imports, and deployment targets — none of which a game server needs. The game server needs WebSocket connections, stateful session management, low-latency command processing, and persistent storage. These are fundamentally different concerns running in the same process, sharing the same boot sequence, the same error handling, and the same deployment.

Extract the game server into its own standalone process. It speaks WebSocket and HTTP. It owns all game state, all rules enforcement, all persistence. It has no knowledge of Vue, Nuxt, or the frontend.

```
Before:
┌─────────────────────────────────────────┐
│ Nuxt Dev Server                         │
│  ├── SSR / Frontend Build Pipeline      │
│  ├── File-Based API Routes (158)        │
│  ├── Server Services (23)               │
│  ├── Prisma / SQLite                    │
│  ├── WebSocket Handler                  │
│  └── Server Utils (10)                  │
└─────────────────────────────────────────┘

After:
┌──────────────────────┐    ┌─────────────────────────────┐
│ Nuxt Frontend        │    │ Game Server (standalone)     │
│  ├── SSR / Build     │    │  ├── Command Router          │
│  ├── Components      │◄──►│  ├── Game Services (23)      │
│  ├── Stores          │ WS │  ├── Session Manager          │
│  ├── Composables     │ +  │  ├── Persistence (Prisma)    │
│  └── Static Assets   │HTTP│  ├── WebSocket Server         │
└──────────────────────┘    │  └── Event Broadcaster        │
                            └─────────────────────────────┘
```

The game server is a plain Node.js/Bun process. It can be started, stopped, and tested independently. It exposes a typed API contract (HTTP for queries, WebSocket for commands and state push). The Nuxt frontend connects to it as a client.

```typescript
// Game server entry point — no Nuxt, no Vue, no framework
import { createGameServer } from './server'
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()
const server = createGameServer({
  persistence: db,
  port: 3001,
  wsPath: '/ws',
})

server.registerDomain('encounters', encounterHandlers)
server.registerDomain('characters', characterHandlers)
server.registerDomain('pokemon', pokemonHandlers)
server.registerDomain('combat', combatHandlers)

server.start()

// Domain handler — pure request/response, no Nuxt event handler
const encounterHandlers = {
  'GET /encounters': async (ctx) => {
    return ctx.db.encounter.findMany()
  },
  'POST /encounters/:id/damage': async (ctx) => {
    const result = await damageService.apply(ctx.params.id, ctx.body)
    ctx.broadcast(result.events)
    return result.state
  },
}

// Frontend connects as a client
// nuxt.config.ts
export default defineNuxtConfig({
  runtimeConfig: {
    public: {
      gameServerUrl: 'http://localhost:3001',
      gameServerWs: 'ws://localhost:3001/ws',
    }
  }
})
```

## Why this is destructive

- **All 158 API route files in `app/server/api/` are deleted.** Their logic moves to domain handlers in the game server process. The Nuxt file-based routing convention is abandoned for server routes.
- **All 23 services move out of `app/server/services/`.** They become game server modules with no Nuxt dependency.
- **All 10 server utils move out of `app/server/utils/`.** `prisma.ts`, `websocket.ts`, `serializers.ts`, etc. become game server internals.
- **The Prisma schema and migrations move out of `app/prisma/`.** The database belongs to the game server, not to the Nuxt app.
- **The project becomes a monorepo.** At minimum: `packages/game-server/` and `apps/frontend/`. Build tooling, TypeScript configs, and dependency management all change.
- **The Nuxt app becomes a pure SPA.** With no server routes, Nuxt's server-side rendering of API data becomes irrelevant. The frontend is a static Vue application that connects to the game server.
- **Every `useFetch('/api/...')` call in the frontend is rewritten.** All 158+ API calls must point to the external game server URL instead of Nuxt's internal API routes.
- **The WebSocket handler is rewritten.** From Nuxt's integrated WebSocket support to a standalone WebSocket server (e.g., `ws` library, uWebSockets, or Bun's native WebSocket).
- **Dev workflow changes.** Instead of `npm run dev` starting everything, developers run two processes: the game server and the frontend. Hot-reload, debugging, and logging are split across two terminals.

## Principles improved

- [[single-responsibility-principle]] — the game server's only job is game state and rules. The frontend's only job is rendering. They share nothing.
- [[dependency-inversion-principle]] — the game server depends on game domain abstractions, not on Nuxt's `defineEventHandler`, `getRouterParams`, `readBody`. The frontend depends on an API contract, not on colocated server code.
- [[open-closed-principle]] — the game server can be extended with new domains (e.g., a future "adventure mode" or "tournament mode") without touching the frontend build pipeline.
- Eliminates [[framework-coupled-game-server]] — the game server is framework-free.
- Reduces [[persistence-hot-path-overhead]] — the standalone server can hold encounter state in memory (see [[in-memory-encounter-state]]) without fighting Nuxt's request-per-action model.
- Enables [[game-engine-extraction]] — if the game engine is extracted as a package, the game server becomes the natural consumer, and the relationship is clean (game server imports engine, frontend imports neither).

## Patterns and techniques

- Hexagonal architecture — the game server is the domain core with ports (HTTP, WebSocket, database) and adapters (Prisma, ws library)
- [[facade-pattern]] — each domain handler is a facade over the game services
- [[mediator-pattern]] — the game server mediates between clients, services, and the persistence layer
- [[observer-pattern]] — the WebSocket broadcaster publishes state changes to subscribed clients
- Microkernel architecture — the server is a minimal kernel that loads domain handlers as plugins
- Client-server separation — the fundamental distributed systems pattern, made explicit

## Trade-offs

- **Monorepo complexity.** The project gains workspace management (npm workspaces, pnpm, turborepo), cross-package TypeScript references, and shared type packages. Solo developer friction increases.
- **Type contract maintenance.** The frontend and game server must agree on API types. Without colocated code, this requires a shared types package or generated API clients. Type drift becomes a real risk.
- **CORS and networking.** Cross-origin requests between frontend and game server require CORS configuration. In development, two ports must be coordinated. In production, a reverse proxy must route traffic.
- **Deployment doubles.** Instead of one Nuxt deployment, there are two processes to deploy, monitor, and keep alive. For a local-network tabletop app, this adds operational overhead.
- **Loss of Nuxt's server integration benefits.** Nuxt's `useFetch` with automatic SSR hydration, built-in API route typing, and zero-config WebSocket support are all lost.
- **Dev experience regression.** Nuxt's single-process dev server with unified hot-reload, error overlay, and devtools is replaced by two terminal windows and manual coordination.
- **Over-engineering risk for a single-user game.** This is a tabletop RPG tool used by one GM and a few players on a LAN. The operational overhead of a separate game server may not be justified by the architectural benefits.

## Open questions

- Should the game server use Express, Fastify, Hono, or be framework-free (raw `http.createServer`)?
- Does the frontend remain a Nuxt app (for its build tooling and component framework), or does it drop Nuxt entirely and become a plain Vite + Vue app?
- How are shared types managed? A shared `@rotom/types` package, or API schema generation (OpenAPI, tRPC)?
- How does this interact with [[typed-rpc-api-layer]]? If both are adopted, the game server exposes a typed RPC interface and the frontend has a generated client — eliminating the type contract problem.
- Should the game server be stateless (database on every request) or stateful (encounters loaded into memory)? See [[in-memory-encounter-state]].
- How does this interact with [[game-engine-extraction]]? If the engine is a package and the server is a process, the dependency chain is: frontend → game server → engine. Is the engine a dependency of the server, or embedded within it?
- Is WebSocket the right protocol for the standalone server, or should it use gRPC, Server-Sent Events, or a custom binary protocol for game state?

## See also

- [[framework-coupled-game-server]] — the problem this addresses
- [[game-engine-extraction]] — compatible: the engine becomes a library consumed by the standalone server
- [[typed-rpc-api-layer]] — compatible: the server's API becomes a typed RPC contract
- [[in-memory-encounter-state]] — compatible: a standalone server can manage its own memory lifecycle
- [[event-sourced-encounter-state]] — compatible: the server owns the event log
- [[server-authoritative-reactive-streams]] — compatible: the server owns the projection pipeline
- [[routes-bypass-service-layer]] — eliminated: there are no Nuxt routes to bypass
- [[service-layer-pattern]] — the services that move to the standalone server
- [[explicit-vue-architecture]] — compatible: removing Nuxt from the client naturally pairs with extracting the server
- [[nuxt-framework-entanglement]] — the broader entanglement problem that this and explicit-vue-architecture address together
