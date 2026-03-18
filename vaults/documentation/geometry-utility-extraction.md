# Geometry Utility Extraction

A potential [[extract-method]] to consolidate duplicated grid geometry algorithms scattered across services and composables.

## The idea

Extract shared geometry functions into a dedicated utility module (e.g., `utils/gridGeometry.ts`):

- **Bresenham line tracing** — duplicated between `useMoveCalculation` (range/LoS filtering) and `useRangeParser` (line-of-sight check). Both implement the same algorithm with minor differences in what they check at each cell.
- **Diagonal movement cost** (decree-002 alternating 1m/2m) — duplicated verbatim between `resolveInterceptMelee` and `resolveInterceptRanged` in `intercept.service.ts`.
- **8-direction array** — defined identically three times in `usePathfinding.ts`.

## Principles improved

- Eliminates [[duplicate-code-smell]] instances
- [[single-responsibility-principle]] — geometry is a distinct concern from combat logic or range parsing

## Trade-offs

- The Bresenham variants differ slightly in their per-cell callback — extraction requires either a callback parameter or a generic traversal function. This is a small design decision.
- The diagonal cost is only 15 lines — extracting may feel like over-engineering for two call sites
- The 8-direction array is trivial (8 coordinate pairs) — a shared constant is the simplest fix

## Open questions

- Should this be a flat utility (`utils/gridGeometry.ts`) or a composable (`useGridGeometry`)? Since the functions are pure, a utility is more appropriate.
- Should it include the AoE shape calculations currently in `useRangeParser.ts` (`getBurstCells`, `getConeCells`, etc.), which are also pure geometry? This would create a more comprehensive geometry module but blur the line between grid math and combat rules.

## See also

- [[grid-isometric-interaction-duplication]] — another geometry-related duplication concern
- [[grid-distance-calculation]] — existing documentation of the distance system
