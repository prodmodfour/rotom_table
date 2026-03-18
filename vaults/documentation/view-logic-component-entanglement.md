# View Logic Component Entanglement

Vue components in the app conflate three concerns: domain logic (what the game rules say), interaction logic (what happens when the user clicks), and presentation (how it looks). A single component file often computes game-rule-derived values, orchestrates multi-step workflows, manages local UI state, and renders templates — making it impossible to reuse the logic without the template or test the logic without mounting the component.

## How it manifests

A typical encounter component:

1. **Imports composables** that provide game logic (damage calculation, stat derivation, turn checking)
2. **Computes derived values** from store state (is it this combatant's turn? what moves are available? what's the damage preview?)
3. **Handles user interactions** (click handlers that dispatch to composables or stores)
4. **Manages local UI state** (modals, selection, hover state, animation triggers)
5. **Renders all of the above** in a template

The game logic computation and the button styling live in the same file. Testing whether a move is available requires mounting the Vue component. Reusing the "available moves" computation in a different view requires extracting it to a composable — but the composable then needs the store context, which requires Pinia, which requires the Vue app.

## Relationship to other problems

- **[[view-component-duplication]]** — GM, Group, and Player views duplicate components because logic is entangled with presentation. If logic were headless, one logic layer could serve three presentations.
- **[[composable-architectural-overreach]]** — composables grew large because components delegate logic upward rather than separating it structurally.

## See also

- [[view-component-duplication]] — duplication caused by entangled logic
- [[composable-architectural-overreach]] — composables absorbing component logic
- [[single-responsibility-principle]] — components have too many responsibilities
- [[view-capability-projection]] — addresses view duplication but not logic entanglement
- [[headless-domain-components]] — the destructive proposal to separate domain logic from presentation
- [[separation-of-concerns]] — components mix domain logic, interaction logic, and presentation concerns
- [[tell-dont-ask]] — components pull data from stores and compute externally rather than delegating to domain logic
