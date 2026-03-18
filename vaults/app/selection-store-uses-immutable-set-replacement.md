The `selection` store tracks selected token IDs using a `Set<string>`. To trigger Vue reactivity (which does not deeply observe `Set` mutations), every operation creates a new `Set` instance rather than mutating the existing one.

For example, `addToSelection(id)` creates `new Set([...selectedIds, id])` rather than calling `selectedIds.add(id)`. This pattern ensures that Vue's reactivity proxy detects the reference change and updates computed properties like `selectedCount` and `hasSelection`.

The store also implements [[marquee-selection-overlay|marquee selection]] with bounding-box overlap detection for multi-cell tokens.

## See also

- [[all-stores-use-pinia-options-api]]