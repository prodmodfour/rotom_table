A Pokemon's size category determines the total number of grid squares it occupies.

- Small / Medium = 1 square (1x1)
- Large = 4 squares (2x2)
- Huge = 9 squares (3x3)
- Gigantic = 16 squares (4x4)

[[custom-token-shapes]] can redistribute this area into non-square shapes while preserving the total square count. The size category sets the area budget, not a fixed shape.

The [[size-category-footprint-map]] maps each category to its default rectangular footprint, and [[multi-cell-token-footprint]] handles the rendering of tokens that span multiple cells.

## See also
- [[custom-token-shapes]]
- [[size-category-footprint-map]]
- [[multi-cell-token-footprint]]
