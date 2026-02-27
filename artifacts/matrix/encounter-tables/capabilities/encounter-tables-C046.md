---
cap_id: encounter-tables-C046
name: encounter-tables-C046
type: —
domain: encounter-tables
---

### encounter-tables-C046
- **name:** SignificancePanel component
- **type:** component
- **location:** `app/components/encounter/SignificancePanel.vue`
- **game_concept:** Encounter significance/XP configuration
- **description:** Panel for setting encounter significance tier (preset selector + custom multiplier), difficulty adjustment slider, and XP breakdown display. Uses SIGNIFICANCE_PRESETS for preset options. Updates encounter significance via API.
- **inputs:** Encounter significance state
- **outputs:** Significance tier and multiplier changes
- **accessible_from:** gm
