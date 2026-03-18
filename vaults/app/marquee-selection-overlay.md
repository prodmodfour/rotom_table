# Marquee Selection Overlay

In [[flat-grid-uses-canvas-plus-dom-tokens]], the GM can rubber-band select multiple tokens by clicking and dragging on empty space. A translucent rectangle overlay appears during the drag, and all tokens whose footprints overlap the rectangle are added to the multi-selection.

The `selection` Pinia store tracks the marquee rectangle and computes overlap using bounding-box intersection. For multi-cell tokens ([[token-size-maps-to-grid-footprint]]), the overlap check uses the full NxN footprint. Shift-clicking adds to the existing selection; clicking empty space clears it.

The [[battle-grid-selection-counter]] in the header shows the count of selected tokens.


## See also

- [[selection-store-uses-immutable-set-replacement]] — how the selection store triggers Vue reactivity
- [[all-stores-use-pinia-options-api]]