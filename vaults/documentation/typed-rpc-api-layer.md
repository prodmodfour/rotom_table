# Typed RPC API Layer

A destructive restructuring to replace the 158 file-based REST routes with a typed RPC layer providing end-to-end type safety from client to server — addressing both the [[routes-bypass-service-layer|service bypass problem]] and the absence of API contracts.

## The idea

The current API layer uses Nitro's file-based routing: 158 route handlers across 16 directories, each manually parsing request bodies, calling services (or [[routes-bypass-service-layer|Prisma directly]]), and returning untyped JSON. There is no shared contract between client and server — the client trusts the server returns the right shape, and the server trusts the client sends the right body.

```typescript
// Current: client guesses the response shape
const { data } = await useFetch(`/api/encounters/${id}/damage`, {
  method: 'POST',
  body: { targetId, amount, damageType }
})
// data is Ref<any> — no type safety

// Current: server manually parses
export default defineEventHandler(async (event) => {
  const body = await readBody(event)  // any
  const id = getRouterParam(event, 'id')  // string | undefined
  // manual validation, manual response shaping
})
```

Replace with a typed RPC layer where procedures are defined once and type-checked end-to-end:

```typescript
// Shared definition
const encounterRouter = router({
  dealDamage: procedure
    .input(z.object({
      encounterId: z.string().uuid(),
      targetId: z.string().uuid(),
      amount: z.number().positive(),
      damageType: z.enum(['physical', 'special', 'untyped'])
    }))
    .output(z.object({
      combatant: combatantSchema,
      wasKnockedOut: z.boolean(),
      heavilyInjured: z.boolean()
    }))
    .mutation(async ({ input }) => {
      return combatantService.dealDamage(input)
    })
})

// Client: fully typed
const result = await trpc.encounterRouter.dealDamage.mutate({
  encounterId: id,
  targetId: target.id,
  amount: 42,
  damageType: 'physical'
})
// result typed as { combatant: Combatant, wasKnockedOut: boolean, heavilyInjured: boolean }
```

## Why this is destructive

- **All 158 route files are deleted.** Every route is rewritten as a typed procedure.
- **Every `useFetch` and `$fetch` call in every component and composable is replaced** with typed RPC calls.
- **The Zod validation that exists in some routes becomes mandatory** for all procedures — input and output schemas are required.
- **File-based routing conventions are abandoned.** Routes are no longer discoverable by file path.
- **The WebSocket protocol could be unified** — tRPC supports subscriptions, potentially replacing the custom WebSocket handler.

## Principles improved

- [[dependency-inversion-principle]] — client and server depend on shared type contracts, not on trust
- [[interface-segregation-principle]] — each procedure is a focused, typed interface
- [[single-responsibility-principle]] — procedures handle one operation each; validation is declarative via Zod schemas
- Eliminates [[routes-bypass-service-layer|routes bypassing the service layer]] — the RPC layer structurally enforces that procedures call services
- Eliminates the untyped API boundary — type errors between client and server are caught at compile time

## Patterns and techniques

- [[facade-pattern]] — each router groups related procedures into a domain namespace
- [[adapter-pattern]] — the RPC layer adapts service functions to the network boundary
- [[service-layer-pattern]] — the three-tier separation is enforced structurally, not by convention
- Contract-first design — the shared Zod schema IS the contract; implementation must conform

## Trade-offs

- **Framework lock-in.** tRPC is a specific library with its own opinions. If tRPC is abandoned or stalls, migration is painful.
- **REST semantics lost.** The current file-based routes are RESTful and discoverable via URL. RPC obscures the API surface — external tools (Postman, curl) can't easily explore it.
- **Learning curve.** Every contributor must learn the RPC framework's conventions. File-based routing is immediately understandable.
- **WebSocket integration.** The current WebSocket handler is separate from the API routes. Integrating subscriptions into the RPC layer may not fit the broadcast-to-all pattern the app uses.
- **Nuxt integration.** tRPC-Nuxt integration exists but is community-maintained, not first-party. Framework version upgrades may cause compatibility issues.
- **Migration scope.** 158 routes + all client-side fetches is a massive migration. Incremental migration (some routes REST, some RPC) creates a split-brain API.

## Open questions

- tRPC vs. hand-rolled typed router? tRPC is mature but adds a dependency. A hand-rolled solution using Zod schemas + `$fetch` with generics could achieve 80% of the benefit.
- Should the RPC layer also handle WebSocket communication, or should WebSocket remain separate?
- How to handle file uploads (character CSV import) in an RPC framework designed for JSON?
- Is there a Nuxt-native approach (e.g., Nuxt Server Functions or typed server routes) that provides similar type safety without a third-party library?
- Would generating a typed API client from OpenAPI specs (derived from the existing routes) achieve the type safety goal without the destructive rewrite?

## See also

- [[routes-bypass-service-layer]] — the discipline problem this solves structurally
- [[service-layer-pattern]] — the three-tier architecture becomes enforced, not encouraged
- [[api-endpoint-layout]] — the current file-based layout being replaced
- [[service-delegation-rule]] — currently a convention, becomes a structural guarantee
- [[route-to-service-migration-strategy]] — the incremental alternative this leapfrogs
- [[kill-the-api-directory]] — compatible: controllers can implement RPC procedures, combining both proposals
