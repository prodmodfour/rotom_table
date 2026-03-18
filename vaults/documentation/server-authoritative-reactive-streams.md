# Server-Authoritative Reactive Streams

A destructive restructuring to eliminate client-side encounter state management entirely and replace it with server-authoritative reactive data streams — addressing [[client-server-state-mirroring|client-server state duplication]] and the [[encounter-store-god-object-risk|encounter store god object]].

## The idea

The client currently maintains a full copy of the encounter state. The encounter store (1,814 lines across 6 files) receives full state snapshots via WebSocket, manually copies every field, diffs combatants with `Object.assign`, and exposes ~50 actions. Composables like `useMoveCalculation.ts` (871 lines) duplicate server-side game logic for previews. The client is a co-equal state manager — it computes, caches, diffs, and manages the same data the server owns.

Delete the encounter store. Delete the state-managing composables. Make the server the single authoritative source of truth. Clients subscribe to reactive streams of projected data — fine-grained slices computed and filtered on the server.

```typescript
// Server: define projections — views of the encounter state tailored to consumers
const projections = {
  // GM sees everything
  'gm:combatants': (encounter) => encounter.combatants.map(c => ({
    id: c.id, name: c.name, hp: c.hp, maxHp: c.maxHp, tempHp: c.tempHp,
    statusConditions: c.statusConditions, position: c.position,
    entity: c.entity, // full entity data for GM
  })),

  // Player sees only their own Pokemon + limited info about others
  'player:own-pokemon': (encounter, playerId) =>
    encounter.combatants.filter(c => c.ownerId === playerId),

  'player:visible-enemies': (encounter, playerId) =>
    encounter.combatants
      .filter(c => c.side === 'enemies' && isVisibleTo(c, playerId))
      .map(c => ({ id: c.id, name: c.name, statusConditions: c.statusConditions })),
      // No HP, no entity details — information hiding enforced server-side

  // Group sees public combat state
  'group:combat-summary': (encounter) => ({
    round: encounter.currentRound,
    turn: encounter.currentTurn,
    activeCombatant: encounter.activeCombatant,
    weather: encounter.weather,
    combatants: encounter.combatants.map(c => ({
      id: c.id, name: c.name, side: c.side, position: c.position,
    })),
  }),
}

// Server: when state changes, push only the changed projections to subscribers
function onStateChange(encounter: Encounter, change: StateChange) {
  for (const [clientId, subscriptions] of clients) {
    for (const sub of subscriptions) {
      const newProjection = projections[sub.projection](encounter, sub.context)
      if (!deepEqual(newProjection, sub.lastSent)) {
        send(clientId, { stream: sub.projection, data: newProjection })
        sub.lastSent = newProjection
      }
    }
  }
}

// Client: components bind directly to stream data — no store
function useCombatantStream(combatantId: string) {
  const data = ref<CombatantProjection | null>(null)
  const ws = useWebSocket()
  ws.subscribe(`combatant:${combatantId}`, (update) => { data.value = update })
  return { data: readonly(data) }
}

// Client: Vue components are pure renderers
// <CombatantCard :combatant="stream.data" />
// No store access. No computed getters. No game logic. Just rendering.
```

The GM sends commands (HTTP or WebSocket). The server validates, applies, persists, and pushes relevant projections to each subscriber. The client renders. That's it.

## Why this is destructive

- **The encounter store (723 lines) is deleted.** All 5 delegation composables (~1,091 lines) are deleted. Total: ~1,814 lines of client-side state management removed.
- **`useMoveCalculation.ts` (871 lines) is deleted or radically simplified.** Damage previews become server-side queries: "show me the projected damage for this move against this target." The server computes it authoritatively.
- **`updateFromWebSocket` is deleted.** No manual field-copying. No surgical `Object.assign` on combatants. Streams replace snapshots.
- **All client-side game logic composables that duplicate server logic are deleted.** The client has zero game rules — it only renders server-provided data.
- **The WebSocket protocol changes.** From "broadcast full encounter state to all clients" to "push targeted projection diffs to specific subscribers." The WebSocket handler (`ws.ts`) is rewritten.
- **Every Vue component that reads from the encounter store is rewritten.** Instead of `encounterStore.combatants`, components bind to stream refs: `useCombatantStream(id)`.
- **Player view security is enforced server-side.** Currently, the Player view receives full state and filters client-side. After this change, the server never sends data the player shouldn't see.

## Principles improved

- [[single-responsibility-principle]] — the server's job is state management; the client's job is rendering. Currently both manage state.
- [[interface-segregation-principle]] — each client view subscribes to exactly the data it needs, not the full encounter surface. The GM stream is different from the Player stream is different from the Group stream.
- [[dependency-inversion-principle]] — components depend on stream abstractions (`useCombatantStream`), not on the encounter store's concrete surface.
- Eliminates [[encounter-store-god-object-risk]] — the god object is deleted. There is no client-side encounter state to manage.
- Eliminates [[client-server-state-mirroring]] — the client doesn't mirror; it subscribes.
- Eliminates [[duplicate-code-smell]] — server-side game logic is the only copy. No more client-side duplication.

## Patterns and techniques

- [[observer-pattern]] — clients subscribe to server-published streams (the existing [[websocket-sync-as-observer-pattern]] but with fine-grained streams instead of full-state broadcasts)
- [[proxy-pattern]] — client-side stream refs act as proxies for server-held state
- [[facade-pattern]] — server projections are facades over the complex encounter state, tailored to each consumer
- Reactive Streams / Server-Sent Events — the transport pattern for continuous data push
- CQRS — commands go to the server (writes); projections come from the server (reads)

## Trade-offs

- **Latency for every interaction.** Currently, the client can optimistically update state before the server confirms (e.g., drag a token, see it move immediately). With server-authoritative streams, every visual update depends on a server round-trip. Optimistic updates can be layered back in but add complexity.
- **Server memory and CPU.** The server must maintain projection state for every connected client and diff projections on every state change. With 3–4 connected clients, this is trivial. But the server becomes stateful — it must hold the encounter in memory and track per-client subscriptions.
- **Preview calculations require server round-trips.** Damage previews, capture probability displays, and "what happens if I do X?" queries currently compute locally. With server authority, these become server requests, adding latency to hover states and tooltips.
- **Offline/disconnect handling.** If the WebSocket disconnects, the client has no state to display. Currently, the client's store retains the last known state. Server-authoritative streams require explicit reconnection and state replay.
- **Client-side computed derivations.** Some client state is purely derived (e.g., "is this combatant mine?", "is it my turn?"). Moving all derivation to the server may be overkill — some local computation is genuinely simpler.
- **Testing difficulty.** Client components become untestable without a running server (or a mock stream). Currently, you can test components by injecting store state.

## Open questions

- Should previews (damage, capture probability, move range) be server-computed or should a lightweight preview engine exist on the client?
- How granular should streams be? Per-combatant? Per-field? Per-domain (combat, grid, weather)?
- Does this require the server to hold encounter state in memory (see [[in-memory-encounter-state]]) or can it recompute projections from the database on each change?
- How does optimistic UI work? Does the client maintain a thin local prediction layer that gets reconciled with server updates?
- How does this interact with [[event-sourced-encounter-state]]? Events are a natural fit for stream updates — each event maps to a projection diff.
- Is WebSocket the right transport, or should this use Server-Sent Events for the read path and HTTP POST for the write path?

## See also

- [[client-server-state-mirroring]] — the problem this addresses
- [[encounter-store-god-object-risk]] — eliminated by deleting the store
- [[websocket-sync-as-observer-pattern]] — evolved from full-state push to projection streams
- [[event-sourced-encounter-state]] — compatible: events feed projection updates
- [[in-memory-encounter-state]] — compatible: in-memory state enables efficient projection computation
- [[encounter-store-surface-reduction]] — the incremental approach that this supersedes
- [[storeless-query-cache]] — the radical extension: eliminate client state entirely, not just encounter stores
