# Nuxt Framework Entanglement

The app uses Nuxt 3 with SSR disabled (SPA mode). Nuxt's value proposition — server-side rendering, hybrid rendering, automatic code splitting for routes — is not utilized. What remains is a set of conventions (auto-imports, file-based routing, server directory structure) that hide architectural decisions behind framework magic.

## What Nuxt provides that the app uses

- **File-based routing** — pages in `pages/` become routes automatically
- **Auto-imports** — composables, components, and utilities are globally available without import statements
- **Server directory convention** — `server/api/` files become API endpoints, `server/routes/` become WebSocket handlers
- **Nitro server** — wraps the game server in a deployment-oriented framework
- **Dev server** — hot module replacement, unified error overlay

## What Nuxt provides that the app does NOT use

- **Server-side rendering** — explicitly disabled (`ssr: false`)
- **Hybrid rendering** — not used (full SPA)
- **Route-level code splitting** — the app has 3 views (GM, Group, Player) with minimal splitting benefit
- **Edge deployment** — the app runs on a local network
- **SEO optimization** — not relevant for a tabletop tool

## The entanglement problems

### Auto-imports hide coupling

```typescript
// This composable appears to have no dependencies:
export function useEncounterActions() {
  const store = useEncounterStore()  // auto-imported — no import statement
  const grid = useGridMovement()     // auto-imported — no import statement
  // ...
}
```

Reading the file, there are no imports. The dependency graph is invisible. Moving this function to a different file, extracting it to a package, or testing it in isolation requires discovering its auto-imported dependencies by running the code and watching it fail.

### File-based routing constrains API organization

API routes must follow URL structure: `server/api/encounters/[id]/damage.post.ts`. This forces one-file-per-endpoint organization. A domain that has 15 related operations becomes 15 files in the same directory. There is no way to co-locate related handlers or share request validation without either duplicating it or creating shared utilities that the file-based convention doesn't account for.

### Nitro wraps simple handlers in framework ceremony

```typescript
// Every API handler is wrapped in defineEventHandler
export default defineEventHandler(async (event) => {
  const body = await readBody(event)      // Nitro-specific
  const id = getRouterParam(event, 'id')  // Nitro-specific
  // actual logic
})
```

This is a thin wrapper over Express/Fastify handlers. The wrapping adds no value but creates a dependency on Nitro's API surface (`readBody`, `getRouterParam`, `createError`, `setResponseStatus`).

## Relationship to [[framework-coupled-game-server]]

[[framework-coupled-game-server]] identifies the problem of the game *server* being coupled to Nuxt. This note identifies the broader entanglement: both the client and the server are coupled to Nuxt conventions that provide minimal value for this application's use case.

## See also

- [[framework-coupled-game-server]] — the server-specific coupling problem
- [[headless-game-server]] — addresses server-side entanglement
- [[composable-store-direct-coupling]] — exacerbated by auto-imports hiding the coupling
- [[singleton-state-coupling]] — auto-imports make singleton access invisible
- [[horizontal-layer-coupling]] — file-based routing enforces horizontal organization
- [[explicit-vue-architecture]] — the destructive proposal to strip Nuxt entirely
- [[dev-server-commands]] — the actual dev/seed/reset commands provided by the Nuxt dev server
