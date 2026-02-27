---
cap_id: vtt-grid-C004
name: vtt-grid-C004
type: —
domain: vtt-grid
---

### vtt-grid-C004
- **name:** Measurement Store
- **type:** store-action
- **location:** `app/stores/measurement.ts`
- **game_concept:** PTU range measurement tools
- **description:** Measurement mode (distance/burst/cone/line/close-blast), measurement origin, radius/range parameters. Client-only store for visual range overlays.
- **inputs:** Mode selection, origin cell, range value
- **outputs:** Measurement configuration for rendering
- **accessible_from:** gm
