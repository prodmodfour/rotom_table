# Storeless Query Cache

A destructive restructuring to obliterate all Pinia stores and replace them with a thin, declarative query cache — eliminating client-side state management entirely by treating the server as the single source of truth and the client as a pure projection layer — radicalizing [[server-authoritative-reactive-streams]] beyond reactive streams to no client state at all.

## The idea

The app has 17 Pinia stores totalling ~4,400 lines. The encounter store alone is 723 lines with 23+ getters and 30+ actions. These stores exist because the client needs a local copy of server state to render reactively. But maintaining local copies creates dual sources of truth, sync bugs, stale data, and the 438-line `updateFromWebSocket` surgical merge that must enumerate every field.

[[server-authoritative-reactive-streams]] proposes replacing stores with reactive streams — the server pushes state, and the client holds reactive containers. But reactive containers ARE stores by another name. The client still holds state. The client still merges updates. The dual source of truth still exists.

What if the client holds no state at all?

Delete every Pinia store. Components declare what data they need via typed queries. A thin query cache layer manages freshness, deduplication, and reactivity. The server is the only source of truth. The client renders whatever the server last told it. Mutations go through commands that hit the server directly. The cache is invalidated by server-pushed events.

```typescript
// === QUERY DECLARATIONS ===
// Components declare data needs. No store. No action. No getter.

// In a Vue component:
const { data: encounter, isLoading } = useQuery({
  key: ['encounter', encounterId],
  fetch: () => $fetch(`/api/encounters/${encounterId}`),
  // Invalidated when the server pushes an encounter-changed event
  invalidateOn: ['encounter:updated', 'encounter:turn-advanced', 'encounter:damage-dealt'],
})

const { data: character } = useQuery({
  key: ['character', characterId],
  fetch: () => $fetch(`/api/characters/${characterId}`),
  invalidateOn: ['character:updated'],
})

// Derived data is computed from queries, not from store getters
const activeCombatants = computed(() =>
  encounter.value?.combatants.filter(c => c.hp > 0) ?? []
)

const currentTurnCombatant = computed(() =>
  encounter.value?.combatants[encounter.value.currentTurnIndex]
)

// === MUTATIONS ===
// No store action. No composable wrapper. Direct command dispatch.

const { mutate: dealDamage, isPending } = useMutation({
  command: (params: { targetId: string; amount: number }) =>
    $fetch(`/api/encounters/${encounterId}/damage`, {
      method: 'POST',
      body: params,
    }),
  // Optimistic update: modify the cache immediately, revert on error
  optimistic: (cache, params) => {
    cache.update(['encounter', encounterId], (enc) => {
      const target = enc.combatants.find(c => c.id === params.targetId)
      if (target) target.hp = Math.max(0, target.hp - params.amount)
      return enc
    })
  },
  // On success, the server event invalidates the cache anyway
  // On error, the optimistic update is reverted automatically
})

// === THE QUERY CACHE ===
// Thin layer. Not a store. Manages freshness and reactivity.

class QueryCache {
  private cache = new Map<string, { data: Ref<any>; stale: boolean; fetchFn: () => Promise<any> }>()
  private ws: WebSocket

  constructor(ws: WebSocket) {
    this.ws = ws
    // Server events invalidate cache entries
    ws.onmessage = (event) => {
      const { type } = JSON.parse(event.data)
      this.invalidateByEvent(type)
    }
  }

  useQuery<T>(options: QueryOptions<T>): { data: Ref<T | null>; isLoading: Ref<boolean> } {
    const key = JSON.stringify(options.key)

    if (!this.cache.has(key)) {
      const data = ref<T | null>(null) as Ref<T | null>
      const isLoading = ref(true)

      this.cache.set(key, {
        data,
        stale: true,
        fetchFn: options.fetch,
        invalidateOn: options.invalidateOn,
      })

      // Fetch immediately
      this.refetch(key)
    }

    const entry = this.cache.get(key)!
    if (entry.stale) this.refetch(key)

    return { data: entry.data, isLoading: ref(!entry.data.value) }
  }

  private async refetch(key: string) {
    const entry = this.cache.get(key)!
    entry.data.value = await entry.fetchFn()
    entry.stale = false
  }

  private invalidateByEvent(eventType: string) {
    for (const [key, entry] of this.cache) {
      if (entry.invalidateOn?.includes(eventType)) {
        entry.stale = true
        this.refetch(key)  // Background refetch
      }
    }
  }
}

// === WHAT'S DELETED ===

// Before (encounter store — 723 lines):
export const useEncounterStore = defineStore('encounter', {
  state: () => ({ encounter: null, /* ... 15 state fields */ }),
  getters: { /* 23 getters computing derived state */ },
  actions: {
    async loadEncounter(id) { /* $fetch + state assignment */ },
    async applyDamage(targetId, amount) { /* $fetch + state mutation */ },
    updateFromWebSocket(data) { /* 56 lines of field-by-field merge */ },
    // ... 28 more actions
  }
})

// After: nothing. The store file doesn't exist.
// Components use useQuery() and useMutation() directly.
// Derived state is computed() in components or extracted into tiny composables.
```

## Why this is destructive

- **All 17 Pinia stores are deleted.** `encounter.ts` (723 lines), `encounterTables.ts` (515 lines), `groupViewTabs.ts` (481 lines), `terrain.ts` (392 lines), `measurement.ts` (381 lines), `encounterLibrary.ts` (368 lines), `library.ts` (323 lines), and 10 more — all gone. ~4,400 lines eliminated.
- **The Pinia dependency is removed from the project.** `@pinia/nuxt`, the Pinia devtools integration, the store registration system — all removed. The reactive state management framework is replaced by a thin cache layer (~200 lines).
- **`updateFromWebSocket` is deleted.** The 56-line surgical merge that copies fields one by one from WebSocket payloads to store state does not exist. WebSocket events invalidate cache entries. The cache refetches from the server. No merge logic. No field enumeration.
- **All composables that wrap store actions are deleted or simplified.** `useEncounterActions`, `useEncounterCombat`, and similar composables that exist only to bridge components and stores become thin `useMutation` calls.
- **Store getters become component-local `computed()`.** The 23 encounter store getters (`sortedCombatants`, `currentTurnCombatant`, `mountedPairs`, etc.) become `computed()` expressions in the components that need them, or small composables that derive from query data.
- **The "stateless stores" anti-pattern is eliminated.** `encounterCombat.ts` and `encounterXp.ts` are Pinia stores with no state — only actions that make API calls. With the query cache, these are just `useMutation` calls. No store needed.
- **The dual source of truth is eliminated.** The server's database is the only truth. The cache is a performance optimization with automatic invalidation, not a parallel state tree that must be kept in sync.

## Principles improved

- [[single-responsibility-principle]] — components are responsible for rendering. The query cache is responsible for freshness. The server is responsible for state. Stores were responsible for all three.
- [[dependency-inversion-principle]] — components depend on a `useQuery`/`useMutation` abstraction, not on specific stores. The data source and caching strategy are implementation details.
- [[interface-segregation-principle]] — components declare exactly the data they need via query keys. They don't receive the entire encounter store surface (23 getters, 30 actions) when they need one piece of data.
- [[open-closed-principle]] — adding a new data need means adding a `useQuery` call in a component. No store file is opened. No getter is added. No action is written.
- Eliminates [[encounter-store-god-object-risk]] — there is no encounter store. There is no god object. There is a cache entry keyed by `['encounter', id]`.
- Eliminates [[client-server-state-mirroring]] — the client does not mirror server state. It caches query results with automatic invalidation.
- Eliminates [[singleton-state-coupling]] — stores are global singletons. Query cache entries are scoped to query keys — naturally isolated, no singleton coupling.

## Patterns and techniques

- [[proxy-pattern]] — the query cache is a virtual proxy for server state, loading and refreshing transparently
- [[observer-pattern]] — server events trigger cache invalidation, which triggers refetch, which triggers reactive updates in components
- [[strategy-pattern]] — different invalidation strategies (event-based, time-based, manual) can be applied per query
- [[facade-pattern]] — `useQuery` and `useMutation` present a simple reactive interface over the cache, fetch, and invalidation machinery
- Stale-While-Revalidate — the cache serves stale data immediately while refetching in the background
- Query colocation — data requirements are declared at the component level, not in a separate store layer

## Trade-offs

- **Network dependency.** Every piece of data requires a server round-trip (or a cache hit). With stores, the client has a full local copy. Network latency becomes visible in the UI. Optimistic updates mitigate this but add complexity.
- **Loss of cross-component derived state.** Store getters like `sortedCombatants` are shared across all consumers. With a query cache, each component computes its own derived state — potentially duplicating the computation. Shared composables can mitigate this, but the pattern is less natural.
- **Optimistic update complexity.** Without stores, optimistic UI (showing a change before the server confirms) requires the cache to support speculative updates with automatic rollback. This is non-trivial to implement correctly, especially for complex state like encounter combatants.
- **Cache invalidation granularity.** "Invalidate the encounter cache" refetches the entire encounter, including all combatants, turn order, weather, etc. Fine-grained invalidation (only refetch the damaged combatant) requires either fine-grained query keys or server-sent diffs — both adding complexity.
- **Offline capability loss.** With no local state, the app cannot function offline. The current store model, while not designed for offline use, at least has local data that can render without the server. The query cache has nothing if the server is unreachable.
- **Debugging difficulty.** Pinia devtools provide a clear view of store state, mutations, and time-travel debugging. A query cache has no equivalent tooling. Vue devtools would show reactive refs but without the store's organizational structure.
- **Getter migration is diffuse.** 23 encounter store getters are centralized, documented, and testable. Scattering these as `computed()` across dozens of components makes them harder to find, test, and reuse.

## Open questions

- Should the query cache be a custom implementation or an existing library (TanStack Query for Vue, SWRV)? Custom is lighter but requires maintenance. A library adds a dependency but provides optimistic updates, cache invalidation, devtools, and pagination out of the box.
- How does the cache handle WebSocket reconnection? If the WebSocket drops and reconnects, are all cache entries invalidated (safe but expensive) or only entries for events that occurred during the gap (complex but efficient)?
- How does this interact with [[cqrs-mediator-architecture]]? If commands go through a mediator, `useMutation` dispatches commands to the mediator instead of calling `$fetch`. The patterns are complementary.
- How does this interact with [[universal-event-journal]]? If the server is event-sourced, query results are projections over the event stream. The cache caches projections, not raw state.
- What about purely client-side state (grid zoom level, selected tool, UI preferences)? These never touch the server. Should they use a minimal Pinia store, Vue refs, or the query cache with local-only entries?
- How do multi-component views (encounter page showing combatant cards + grid + combat log + turn tracker) avoid redundant fetches? Do they share a single query, or does the cache deduplicate concurrent requests for the same key?

## See also

- [[encounter-store-god-object-risk]] — eliminated: there is no encounter store
- [[client-server-state-mirroring]] — eliminated: the client does not mirror state
- [[singleton-state-coupling]] — eliminated: no singleton stores
- [[server-authoritative-reactive-streams]] — superseded: reactive streams still maintain client state; this proposal eliminates client state entirely
- [[command-bus-ui-architecture]] — compatible: commands can coexist with query-based reads
- [[cqrs-mediator-architecture]] — compatible: queries use the cache; commands go through the mediator
- [[universal-event-journal]] — compatible: the cache caches projections over the event stream
