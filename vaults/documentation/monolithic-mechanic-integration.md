# Monolithic Mechanic Integration

Every game mechanic — combat, capture, switching, mounting, evolution, weather, equipment, healing — is woven directly into the app's core data model, API routes, services, stores, and components. No mechanic can be added, removed, or disabled without modifying the shared infrastructure they all depend on.

## Symptoms

- **Adding a mechanic means touching 6+ layers.** Implementing Pokemon switching required changes to: types, Prisma schema fields, 3 API routes, 2 services, constants, components, the encounter store, composables, and WebSocket events. Each mechanic is structurally identical to every other mechanic in its coupling pattern.
- **No mechanic isolation.** The Encounter model carries fields for every mechanic: `weather` for weather, `wildSpawnState` for wild spawns, `livingWeapon` fields for living weapons, `mountedPairs` for mounting, `significance` for significance tracking. Disabling a mechanic means dead fields, dead routes, and dead UI — but you can't remove them without risking breakage.
- **Cross-mechanic coupling in services.** `combatant.service.ts` (797 lines) handles combat, equipment, abilities, status, stages, HP, and heavily-injured checks. `out-of-turn.service.ts` (752 lines) mixes priority interrupts with intercepts. These services don't own one mechanic — they own fragments of many.
- **Constants files as implicit registries.** `statusConditions.ts`, `combatManeuvers.ts`, `pokeBalls.ts`, `equipment.ts`, `healingItems.ts`, `livingWeapon.ts` — each is a hardcoded registry for one mechanic. Adding a new mechanic means creating a new constants file and manually wiring it into every consumer.
- **WebSocket event explosion.** The 53-member discriminated union for WebSocket events grows by 2–5 events per new mechanic. Each event requires handler code on both server and client.

## Structural cause

The app was built feature-by-feature, with each mechanic grafted onto existing structures. There is no plugin system, no mechanic registration interface, no way to define a mechanic's data model, API, UI, and rules as a cohesive unit. The [[horizontal-layer-coupling]] compounds this — a mechanic's code is scattered across layers rather than collected in a module.

This violates [[open-closed-principle]] — adding a new mechanic requires modifying existing code everywhere instead of extending a system. It violates [[single-responsibility-principle]] — services and stores own fragments of multiple mechanics rather than complete ownership of one.

## See also

- [[horizontal-layer-coupling]] — mechanics are split across horizontal layers
- [[hardcoded-game-rule-proliferation]] — rule logic is scattered, not modular
- [[encounter-store-god-object-risk]] — the store absorbs surface from every mechanic
- [[service-pattern-classification]] — services mix mechanic concerns
- [[plugin-mechanic-architecture]] — a destructive proposal to address this
- [[saga-orchestrated-turn-lifecycle]] — a destructive proposal to decouple mechanic execution via saga-sequenced lifecycle steps
- [[transaction-script-turn-lifecycle]] — the transaction script pattern that weaves mechanics together in procedural handlers
