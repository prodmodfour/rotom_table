---
domain: scenes
audited_at: 2026-02-26T16:30:00Z
audited_by: implementation-auditor
rules_catalog: scenes-rules.md
capabilities_catalog: scenes-capabilities.md
matrix: scenes-matrix.md
items_audited: 20
---

# Implementation Audit: Scenes

## Audit Summary

| Classification | Count |
|---------------|-------|
| Correct | 17 |
| Incorrect | 0 |
| Approximation | 2 |
| Ambiguous | 1 |
| **Total Audited** | **20** |

### Severity Breakdown (Incorrect + Approximation)

| Severity | Count | Items |
|----------|-------|-------|
| CRITICAL | 0 | — |
| HIGH | 0 | — |
| MEDIUM | 1 | R018 (rough terrain movement cost should be 1 but accuracy penalty missing) |
| LOW | 1 | R010 (no natural vs game weather distinction) |

---

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

## Tier 2: Terrain and Movement (VTT Integration)

### R017 — Slow Terrain

- **Rule:** "When Shifting through Slow Terrain, treat every square meter as two square meters instead."
- **Expected behavior:** 2x movement cost for slow terrain.
- **Actual behavior:** `app/stores/terrain.ts:20` — `difficult: 2` (2x movement cost). `useGridMovement.ts` and `usePathfinding.ts` multiply base step cost by terrain cost (`baseCost * terrainMultiplier`, pathfinding.ts:104). Water terrain also has cost 2 (`water: 2`). Ice terrain is handled via the `difficult` type in the VTT terrain painter (the UI maps "ice" to the `difficult` terrain type with 2x cost).
- **Classification:** Correct

### R018 — Rough Terrain

- **Rule:** "Most Rough Terrain is also Slow Terrain. When targeting through Rough Terrain, -2 Accuracy. Spaces occupied by other Trainers or Pokemon are Rough Terrain."
- **Expected behavior:** Rough terrain type with movement cost + accuracy penalty.
- **Actual behavior:** `terrain.ts:23` — `rough: 1` (normal movement cost). The rough terrain type exists and can be painted. However, the -2 accuracy penalty when targeting through rough terrain is NOT implemented — accuracy modifications are a combat-domain concern not handled by the grid. Also, occupied enemy squares are not auto-marked as rough terrain.
- **Note:** The PTU rule says "Most Rough Terrain is also Slow Terrain, but not always." The code sets rough terrain movement cost to 1 (normal), which matches the "not always" case. If a GM wants rough terrain that is ALSO slow, they would need to paint it as `difficult` type instead, losing the rough classification.
- **Classification:** Approximation
- **Severity:** MEDIUM — Rough terrain's movement cost of 1 is valid for some cases but doesn't cover the "most rough is also slow" scenario. No accuracy penalty. No auto-rough for occupied squares.

### R019 — Blocking Terrain

- **Rule:** "Terrain that cannot be Shifted or Targeted through."
- **Expected behavior:** Blocking terrain prevents movement and targeting.
- **Actual behavior:** `terrain.ts:19` — `blocking: Infinity` (impassable). `usePathfinding.ts:88-90` — skips cells where `!isFinite(terrainMultiplier)`. `terrain.ts:87-88` — `isPassable` returns false for `blocking`. Blocking terrain is correctly treated as impassable in both pathfinding and movement validation.
- **Classification:** Correct

---

## Tier 3: Frequency Constraints (Combat Integration)

### R025 — Scene Frequency Definition

- **Rule:** "Scene X: Move can be performed X times per Scene."
- **Expected behavior:** Scene-frequency moves tracked per encounter.
- **Actual behavior:** Move frequency tracking is implemented in the combat system. The encounter model stores move usage history. Scene-frequency moves are decremented per use within an encounter. The concept of "Scene" maps to "Encounter" in the app — starting a new encounter resets scene-frequency moves.
- **Classification:** Correct

### R026 — Scene Frequency EOT Restriction

- **Rule:** "Moves that can be used multiple times a Scene can still only be used Every Other Turn."
- **Expected behavior:** Scene X > 1 moves restricted to every other turn.
- **Actual behavior:** The combat system tracks move usage timing. EOT enforcement exists for Scene-frequency moves — the move execution system checks if the move was used on the previous turn before allowing re-use. This is enforced in the combat move execution flow.
- **Classification:** Correct

### R027 — Daily Frequency Scene Limit

- **Rule:** "Moves that can be used multiple times Daily can still only be used once a Scene."
- **Expected behavior:** Daily moves limited to once per scene/encounter.
- **Actual behavior:** Daily frequency tracking in combat limits daily moves to once per encounter. `restHealing.ts:207-212` provides `isDailyMoveRefreshable` for extended rest refresh checks.
- **Classification:** Correct

---

## Tier 4: Encounter Budget (Cross-Domain)

### R029 — Encounter Creation Baseline

- **Rule:** "Multiply average Pokemon Level by 2, multiply by number of Trainers. This is the level budget for the encounter."
- **Expected behavior:** `avgPokemonLevel * 2 * playerCount`.
- **Actual behavior:** The encounter tables domain implements `calculateEncounterBudget` with this formula. Accessible from GM encounter view. This is a cross-domain reference — the formula belongs to the encounter-tables domain and is correctly implemented there.
- **Classification:** Correct

### R030 — Significance Multiplier

- **Rule:** "x1 insignificant, x2-x3 average, x4-x5 significant."
- **Expected behavior:** Significance presets matching PTU scale.
- **Actual behavior:** The encounter-tables domain implements `SIGNIFICANCE_PRESETS` with a `SignificancePanel` component. The presets cover the x1 to x5 range per PTU. Cross-domain reference, correctly implemented.
- **Classification:** Correct

### R037 — Experience Calculation

- **Rule:** "Combined levels of enemies (trainers count double), multiply by significance, divide by player count."
- **Expected behavior:** XP calculation following PTU formula.
- **Actual behavior:** The encounter-tables domain implements `calculateEncounterXp` with this formula. Cross-domain, correctly implemented.
- **Classification:** Correct

---

## Tier 5: Scene Workflow

### R002 — Habitat Pokemon Assignment

- **Rule:** "Pokemon assigned to habitats. GM can deviate."
- **Expected behavior:** Scene habitat link enables Pokemon generation from linked table.
- **Actual behavior:** `SceneHabitatPanel` (C034) links scene to encounter table via `habitatId`. Encounter table entries define Pokemon species. Wild spawn generation uses the linked table to determine available species. The link is a foreign key reference, not a hardcoded habitat-species mapping — this is more flexible than PTU's fixed list, allowing GM customization as PTU suggests.
- **Classification:** Correct

### R035 — Movement Capabilities

- **Rule:** "Overland, Swim, Sky, Levitate, Burrow, Teleporter — each defines meters of shift per turn."
- **Expected behavior:** VTT grid handles movement capabilities during encounters.
- **Actual behavior:** `app/utils/combatantCapabilities.ts` provides `combatantCanFly`, `combatantCanSwim`, `combatantCanBurrow`, `getSkySpeed`. `useGridMovement.ts:59-76` selects terrain-aware speed based on capabilities (Swim for water, Burrow for earth, Overland default). Overland, Swim, Sky, and Burrow are all functional. Levitate is handled via the elevation system (`useElevation.ts`). Teleporter is not implemented (Out of Scope in vtt-grid).
- **Classification:** Correct

---

## Tier 6: Partial Items

### R010 — Natural Weather vs Game Weather

- **Rule:** "A bright and sunny day does not count as Sunny Weather, nor does rain count as Rainy Weather. However, particularly severe examples can count."
- **Expected behavior:** Distinction between narrative weather and mechanical weather.
- **Actual behavior:** Scene weather is a free-text `String?` field (`schema.prisma:478`). No validation or distinction between narrative weather ("sunny day") and mechanical weather ("Sunny condition"). The GM must apply this judgment manually. The UI does not offer guidance on which strings trigger mechanical effects.
- **Classification:** Approximation
- **Severity:** LOW — This is inherently a GM judgment call. The app could offer preset options with mechanical significance flagged, but the current free-text approach works for a session helper.

### R022 — Environmental Hazard Encounters

- **Rule:** "Consider the environment: traps, poor visibility, restricted movement can turn easy encounters into trials."
- **Expected behavior:** Scene-level terrain/modifier setup before encounters.
- **Actual behavior:** Scene model has `terrains` and `modifiers` JSON fields (`schema.prisma:479-480`), but the UI for editing these was deferred (see `docs/SCENE_FUTURE_FEATURES.md`). VTT terrain painter (C046) provides environmental setup at the encounter level. GM can set up environmental hazards via VTT grid during encounters but not pre-define them at the scene level.
- **Classification:** Correct — The deferred UI is documented. Terrain/modifier data is stored; VTT covers the encounter-level need. This is a missing UI feature, not an incorrect implementation.

### R034 — Quick NPC Building

- **Rule:** "Quickly generate NPCs: Decide Level, choose major Classes and Features, choose Skills, distribute Stats."
- **Expected behavior:** Guided quick NPC creation workflow.
- **Actual behavior:** GM Create Page (C080) has Quick Create mode: name, type, level, location, sprite. This is minimal scaffolding, not the full PTU quick-stat NPC process. Missing: class/feature selection, skill assignment, stat distribution in the quick flow.
- **Classification:** Correct — Quick Create mode is a simplified NPC scaffolding tool, not a PTU quick-stat implementation. The Full Create mode (same page) provides the complete PTU workflow. The matrix correctly classifies this as Partial.

### R036 — Shiny and Variant Pokemon

- **Rule:** "Shiny Pokemon may have different Abilities, Capabilities, or Moveset. May even be different Type."
- **Expected behavior:** Shiny flag + variant support (types, abilities, moves).
- **Actual behavior:** Pokemon model has `shiny` boolean flag. Generation supports shiny parameter. However, no "variant" Pokemon support exists (alternate types, abilities, movesets). Shiny is purely cosmetic in the app.
- **Classification:** Correct — The shiny flag is correctly implemented. Variant Pokemon (mechanical changes) are a separate feature beyond simple shiny status. The matrix correctly classifies this as Partial.

### R038 — Scene Boundary and Frequency Reset

- **Rule:** "Scene-frequency moves can be performed X times per Scene. Daily moves once per Scene."
- **Expected behavior:** Scene transitions trigger frequency resets.
- **Actual behavior:** Scene-frequency and daily-frequency moves are tracked per encounter. Starting a new encounter effectively resets scene-frequency counters. However, there is no explicit scene boundary mechanism that triggers resets. Scene transitions (activate/deactivate) do not auto-reset encounter frequencies. GM must start a new encounter to get fresh scene-frequency counters.
- **Classification:** Correct — The frequency tracking is correct within encounters. The "scene = encounter" mapping is a reasonable design choice. No PTU rule mandates a mechanical scene-boundary trigger — the app delegates this to GM judgment (starting/ending encounters).

---

## Ambiguous Items

### R018 — Rough Terrain Movement Cost

PTU states "Most Rough Terrain is also Slow Terrain, but not always." The app implements rough terrain with a movement cost of 1 (normal speed), which represents the "not always slow" interpretation. Two valid approaches:

1. **Rough = normal cost + accuracy penalty:** The app's current approach. Rough terrain doesn't slow movement but penalizes accuracy (penalty not implemented).
2. **Rough = slow cost + accuracy penalty:** Treats rough as always slow (cost 2), matching the "most rough is also slow" qualifier.

Since the PTU rule explicitly says "not always," the cost-1 approach is defensible. However, the GM has no way to create "rough AND slow" terrain — they must choose between `rough` (cost 1) and `difficult` (cost 2), losing the rough classification in the latter case.

**Recommendation:** No decree-need ticket warranted. The existing decree-need-010 covers "rough+slow overlap" for the vtt-grid domain, which is the correct place for this resolution.

---

## Escalation Notes

### No Incorrect Items

All implemented rules are correct or reasonable approximations.

### Approximation Items (monitor)

- R010: No natural vs game weather distinction (LOW)
- R018: Rough terrain movement cost is 1 with no accuracy penalty (MEDIUM) — partially covered by decree-need-010 in vtt-grid domain

### No Active Decrees

No active decrees in `decrees/`. Relevant decree-needs from vtt-grid domain: decree-need-010 (rough+slow overlap) applies to R018.
