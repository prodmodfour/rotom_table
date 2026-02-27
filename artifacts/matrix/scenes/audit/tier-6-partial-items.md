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
