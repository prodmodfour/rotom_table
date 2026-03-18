# Framework-Coupled Game Server

The game server — the stateful system that manages encounters, processes combat actions, enforces game rules, and broadcasts state to connected clients — is structurally inseparable from the Nuxt application framework. It exists as Nuxt API routes, Nuxt server middleware, and Nuxt server utils rather than as an independent process or module.

## Symptoms

- **158 API routes inside Nuxt's file-based routing.** Every game action is a Nuxt route handler at `app/server/api/`. These handlers have access to Nuxt's runtime context (`useRuntimeConfig`, `defineEventHandler`) and cannot run outside Nuxt.
- **WebSocket handler embedded in Nuxt.** The real-time sync system (`app/server/utils/websocket.ts`) uses Nuxt's WebSocket integration. The WebSocket protocol, connection lifecycle, and event dispatch are all Nuxt-coupled.
- **Services depend on Nuxt-accessible Prisma.** The 23 services import Prisma from `app/server/utils/prisma.ts`, which is a Nuxt auto-imported server utility. Services cannot be instantiated outside a Nuxt server context.
- **No standalone game server process.** You cannot run the game server without also running the Nuxt frontend build pipeline, SSR renderer, and dev server. The game server boots as a side effect of starting Nuxt.
- **Cannot test game server in isolation.** Integration tests of game actions require a running Nuxt instance, not just a game server.

## Structural cause

Nuxt is a full-stack framework designed for content-driven websites with server-side rendering. rotom_table is a real-time multiplayer game application. The framework provides file-based routing, SSR, auto-imports, and deployment targets — none of which are core to a game server. The game server was built *inside* Nuxt because Nuxt was already there, not because Nuxt provides the right abstractions for a stateful game server.

This violates [[single-responsibility-principle]] — Nuxt is responsible for both frontend delivery and game server behavior. It violates [[dependency-inversion-principle]] — the game server (high-level domain) depends on Nuxt (low-level framework) rather than the other way around.

## See also

- [[game-logic-boundary-absence]] — related: game rules have no isolation boundary
- [[persistence-hot-path-overhead]] — the database-on-every-action pattern is easier to fix with a standalone server
- [[service-layer-pattern]] — the services that would move to the extracted server
- [[headless-game-server]] — a destructive proposal to address this
- [[explicit-vue-architecture]] — a destructive proposal to strip Nuxt from the client, removing framework coupling on both sides
- [[nuxt-framework-entanglement]] — the broader client+server entanglement with Nuxt conventions
