# Measurement Calculates PTU AoE Shapes

The `measurement` Pinia store computes area-of-effect shapes for the [[battle-grid-measurement-toolbar]]: distance, burst (circle around origin), cone (expanding wedge), line (straight path), and close blast (square adjacent to user). Each shape follows PTU rules with the [[ptu-diagonal-distance-formula]] for cell distance.

`useRangeParser` extends this by parsing PTU range strings (e.g. "Burst 2", "Cone 3", "Line 6") into structured `ParsedRange` objects and computing which cells are affected. It also supports multi-cell token edge-to-edge distance for [[token-size-maps-to-grid-footprint]].

The AoE size and direction are adjustable from the measurement toolbar. In isometric mode, the measurement overlay renders as projected diamond shapes via `useIsometricOverlays`.

## See also

- [[encounter-keyboard-shortcuts-dialog]] — measurement tools are bound to M, B, C, L keys
