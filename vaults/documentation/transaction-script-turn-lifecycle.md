# Transaction Script Turn Lifecycle

The turn lifecycle is implemented as a classic [[long-method-smell|transaction script]]: a single 847-line procedural handler (`next-turn.post.ts`) that orchestrates 10+ game systems in sequence. Each system's logic is inlined as a code block within the handler — not encapsulated, not individually testable, not independently deployable.

## What's in the transaction script

The `next-turn.post.ts` handler executes these concerns in order:

1. Turn advancement and index management
2. Heavily injured penalty application
3. Tick damage (burn, poison, cursed)
4. Weather tick damage (sandstorm, hail)
5. Weather ability effects (Dry Skin, Ice Body, Rain Dish)
6. Weather status curing (Hydration, Leaf Guard)
7. Mount dismount on faint
8. Hold queue checking and resolution
9. Action forfeit consumption
10. League battle phase transitions
11. XP tracking and distribution
12. Move log entry creation
13. WebSocket broadcasting of final state

Each of these is a distinct game system with its own rules, edge cases, and PTR rulebook references. They are woven together in a single function, sharing mutable encounter state, with implicit ordering dependencies.

## Why this is a problem

- **[[shotgun-surgery-smell]]** — changing how weather tick damage works requires modifying a file that also handles burn damage, mount dismount, and XP tracking. The change surface is the entire 847-line function.
- **[[single-responsibility-principle]]** — the handler has 13 responsibilities. It knows about weather, status conditions, mounting, action economy, league battles, and XP simultaneously.
- **[[open-closed-principle]]** — adding a new turn-end effect (e.g., terrain damage, trap triggers) means inserting code into an already-fragile sequence. There is no extension point.
- **Testing requires the full encounter stack.** Testing weather tick damage in isolation is impossible — the test must set up an encounter, a combatant, weather state, and call the entire turn handler, then assert the specific side effect.
- **Ordering is implicit.** The sequence matters (faint must be checked after damage, dismount must happen after faint) but is enforced only by code position, not by declared dependencies.

## Similar patterns elsewhere

- `action.post.ts` — resolves combat actions with inline damage, status, and stage logic
- `damage.post.ts` — applies damage with inline heavily-injured, faint, and mount-dismount checks
- `next-round.post.ts` — round transitions with inline frequency resets and duration ticks

These are all transaction scripts that bundle multiple game system interactions into single procedural handlers.

## See also

- [[monolithic-mechanic-integration]] — the broader problem of mechanics woven into shared infrastructure
- [[hardcoded-game-rule-proliferation]] — game rules scattered as imperative code
- [[long-method-smell]] — the transaction script is a textbook long method
- [[divergent-change-smell]] — the file changes for many different reasons
- [[shotgun-surgery-smell]] — changing one game system requires editing this file among others
- [[saga-orchestrated-turn-lifecycle]] — the destructive proposal to eliminate transaction scripts
