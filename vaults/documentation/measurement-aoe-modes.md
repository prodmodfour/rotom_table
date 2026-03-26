# Measurement AoE Modes

The [[pinia-store-classification|measurement store]] provides distance/burst/cone/line/close-blast modes for area-of-effect visualization.

Components wire move range types to the appropriate mode. The store itself has no auto-select — the caller (VTT interaction composable) sets the mode.

Fog brush uses brush-size (circle of cells) while measurement burst uses PTR distance. Despite similar UI, the radius calculations differ.

## See also

- [[ptu-movement-rules-in-vtt]]
- [[vtt-component-composable-map]]
- [[encounter-grid-state]] — measurement store is part of grid state
- [[fog-of-war-system]] — fog brush radius differs from measurement burst radius
