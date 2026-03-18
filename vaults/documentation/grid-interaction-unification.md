# Grid Interaction Unification

A potential refactoring to address the [[grid-isometric-interaction-duplication|~85% code duplication between grid and isometric interaction composables]].

## The idea

Extract a shared base composable that handles all interaction logic (mouse handlers, keyboard shortcuts, state refs, mode dispatching) and parameterize it by the coordinate system. The only true differences are:

- `screenToGrid(x, y)` — simple division vs. inverse isometric projection
- `getTokenAtPosition(cell)` — rectangular vs. diamond hit-testing
- Token footprint geometry — square vs. isometric diamond

These would be injected as a [[strategy-pattern]] — a `CoordinateSystem` interface:

```
interface CoordinateSystem {
  screenToGrid(x: number, y: number): GridCell
  getTokenAtPosition(screenX: number, screenY: number, combatants: Combatant[]): string | null
  getTokenFootprint(position: GridCell, size: number): GridCell[]
}
```

The unified `useGridInteraction(coordinateSystem, options)` handles everything else.

## Principles improved

- [[duplicate-code-smell]] — ~600 lines of duplication eliminated
- [[open-closed-principle]] — a third grid mode (e.g., hex grid) would only need a new `CoordinateSystem` implementation, not a third composable copy
- [[parallel-inheritance-hierarchies-smell]] — the two composables no longer need to evolve in lockstep

## Patterns and techniques

- [[strategy-pattern]] — the coordinate system as an injectable strategy
- [[template-method-pattern]] — an alternative: base composable with overridable hooks for coordinate-specific behavior
- [[extract-class]] — the core refactoring

## Trade-offs

- The 85% overlap claim needs verification. Subtle differences beyond coordinate transforms may exist (e.g., isometric depth sorting affects selection order, elevation handling differs). If the overlap is actually 70%, the abstraction becomes leaky.
- The isometric variant currently lacks several keyboard shortcuts present in the grid variant (B for burst, C for cone, V/H/E for fog tools). Unification would force a decision: add the missing shortcuts to isometric, or make them grid-only via the strategy.
- A shared composable creates a coupling point — changes to the base affect both grid modes. Currently the duplication allows independent evolution, which is bad for consistency but good for experimentation.
- The two composables have different import counts and state shapes. Unification may require a broader options interface.

## Open questions

- Strategy (inject coordinate functions) vs. Template Method (base with overridable hooks)? Strategy is simpler and more testable; Template Method handles cases where the hook needs access to shared state.
- Should the unified composable handle both mouse and touch, or should touch remain a separate delegate as it is now?
- How to handle the keyboard shortcut gap? Feature flags in the strategy? A `supportedFeatures` property?
- Is this worth doing before adding a third grid mode (hex), or is it premature abstraction for two variants?

## See also

- [[vtt-grid-composables]] — architectural context for the VTT composables
- [[grid-isometric-interaction-duplication]] — the duplication this addresses
- [[geometry-utility-extraction]] — a lighter-weight extraction that could be a precursor
