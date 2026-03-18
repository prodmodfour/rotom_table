# Size Category Footprint Map

PTU size category to grid footprint mapping in `utils/sizeCategory.ts`.

**Type:** `SizeCategory` — union of recognized PTU size categories.

**Exports:** `SIZE_FOOTPRINT_MAP` (size name to NxN dimension), `sizeToFootprint` (lookup with default), `getFootprintCells` (all cells occupied by a token at a given origin), `isFootprintInBounds` (boundary check for placement).

Used by `useGridMovement` for [[multi-cell-token-footprint|multi-cell]] occupation and bounds checks.

## See also

- [[grid-distance-calculation]]
