## Tier 1: Core Data Model

### R009 — Weather Keyword Definition

- **Rule:** "Moves with the Weather keyword affect an area, changing the rules of battle. There can only be one Weather Effect at a time; new Weather Effects replace old ones. Weather Conditions last 5 rounds."
- **Expected behavior:** Weather field on scene model, editable via UI.
- **Actual behavior:** `app/prisma/schema.prisma:478` — Scene model has `weather String?` field. `ScenePropertiesPanel` (C033) allows editing weather. WebSocket broadcasts include weather in `scene_update` events. Weather is stored as a free-text string (e.g., "sunny", "rain", "sandstorm").
- **Classification:** Correct

### R039 — Weather Exclusivity

- **Rule:** "There can only be one Weather Effect in place at a time."
- **Expected behavior:** Only one weather condition can be active.
- **Actual behavior:** `weather` is a single `String?` field on the Scene model (`schema.prisma:478`). Only one value can be stored at a time by data model design. Setting a new weather replaces the old one.
- **Classification:** Correct

### R016 — Basic Terrain Types

- **Rule:** "Regular Terrain: easy to walk on. Earth Terrain: requires Burrow. Underwater: requires Swim."
- **Expected behavior:** Terrain types matching PTU definitions.
- **Actual behavior:** `app/stores/terrain.ts:17-26` defines `TERRAIN_COSTS` with types: `normal` (cost 1), `difficult` (cost 2), `blocking` (Infinity), `water` (cost 2, requires swim), `earth` (Infinity, requires burrow), `rough` (cost 1), `hazard` (cost 1), `elevated` (cost 1). PTU terrain types (Regular, Slow, Rough, Blocking, Earth, Underwater) are all represented: Regular=normal, Slow=difficult, Rough=rough, Blocking=blocking, Earth=earth, Underwater=water. Additional app-specific types (hazard, elevated) extend the PTU set.
- **Classification:** Correct

### R001 — Habitat Type Enumeration

- **Rule:** PTU lists habitats: Arctic, Beach, Cave, Desert, Forest, Freshwater, Grasslands, Marsh, Mountain, Ocean, Taiga, Tundra, Urban.
- **Expected behavior:** Scene links to a habitat for wild spawn context.
- **Actual behavior:** `app/prisma/schema.prisma:483` — Scene has `habitatId String?` field. `SceneHabitatPanel` (C034) links scenes to encounter tables. Encounter tables represent habitats (created by GM with habitat names). The app does not hardcode the habitat list — it uses encounter tables as habitat proxies, which is flexible enough to represent all PTU habitats.
- **Classification:** Correct

---
