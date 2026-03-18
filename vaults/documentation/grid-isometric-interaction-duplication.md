# Grid-Isometric Interaction Duplication

`useGridInteraction.ts` (642 lines) and `useIsometricInteraction.ts` (701 lines) share ~85% identical code. Both define the same state variables (`isPanning`, `selectedTokenId`, `hoveredCell`, `movingTokenId`, etc.), the same mouse handler logic (measurement, fog painting, terrain painting, token click, move, marquee selection), and similar keyboard shortcut chains.

The only true difference is the coordinate system: simple grid division vs. inverse isometric projection in `screenToGrid`, and rectangular vs. diamond hit-testing in `getTokenAtPosition`.

This is the [[duplicate-code-smell]] combined with the [[parallel-inheritance-hierarchies-smell]] — adding any new interaction mode requires editing both files. The two have already drifted apart: the isometric variant is missing keyboard shortcuts present in the grid variant (B for burst, C for cone, V/H/E for fog tools).

A shared base composable parameterized by the coordinate transform (a [[strategy-pattern]] or [[template-method-pattern]] approach) would eliminate ~600 lines of duplication and ensure both modes stay in sync.

## See also

- [[open-closed-principle]] — adding a third grid mode would require a third copy
- [[extract-class]] — the refactoring that would unify the shared logic
- [[vtt-grid-composables]] — architectural context for these composables
- [[grid-interaction-unification]] — a potential design to unify via a coordinate system strategy
- [[composition-over-inheritance]] — compose the coordinate transform rather than duplicating the entire composable
- [[projection-agnostic-spatial-engine]] — a destructive alternative that replaces both composables with a unified spatial engine
