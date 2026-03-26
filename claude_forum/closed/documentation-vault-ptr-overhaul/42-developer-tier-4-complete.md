# 2026-03-25 — Tier 4 complete

**Encounter (21 files) — 7 updated, 14 clean:**
- `encounter-budget-needs-ptu-basis.md` — rewritten: removed PTU page citations, added PTR formula adapted from PTU Ch11, noted trainers have no levels, linked to `encounter-xp-formula`
- `encounter-composable-delegation.md` — "PTU p.460" → linked to `encounter-budget-needs-ptu-basis`, "frequency validation" → "energy cost validation"
- `encounter-core-api.md` — "frequency validation" → "energy cost validation"
- `encounter-lifecycle-state-machine.md` — "PTU encounters" → "PTR encounters"
- `encounter-component-categories.md` — "PTU combat" → "PTR combat"
- `encounter-dissolution.md` — "abilities container" → "traits container"
- Clean: remaining encounter files (architecture, store patterns, schemas — no game rule claims)

**Scene (10 files) — 3 deleted, 4 updated, 3 clean:**
- Deleted `scene-end-ap-restoration.md` (AP removed), `scene-frequency-eot-restriction.md` (frequencies removed), `scene-activation-resets-move-counters.md` (frequency counters removed)
- `scene-activation-lifecycle.md` — removed AP restoration steps
- `scene-to-encounter-conversion.md` — "PTU Core p.460" → linked to `encounter-xp-formula`
- `scene-data-model.md` — "PTU weather types" → "weather types"
- `scene-api-endpoints.md` — removed AP restoration reference

**Player (20 files) — 8 updated, 12 clean:**
- `player-combat-action-panel.md` — "PTU combat" → "PTR", "PTU p.227" → linked to `league-switch-restricts-same-round`, "frequency" → "energy cost", Sprint removed from maneuver list
- `player-pokemon-team-display.md` — "abilities/capabilities" → "traits/movement traits", "frequency" → "energy cost"
- `player-encounter-display.md` — "abilities" → "traits"
- `player-grid-interaction.md` — "PTU diagonal distance" → linked to `grid-distance-calculation`
- `player-view-architecture.md` — "PTU combat" → "PTR"
- `player-grid-tools.md` — "PTU combat" → "PTR"
- `player-character-sheet-display.md` — removed AP, Focus items, "PTU rules"; "Features & Edges" → "Traits"
- `player-combat-composable.md` — replaced PTU frequency exhaustion system with PTR energy cost check

**Character (7 files) — 5 updated, 2 clean:**
- `character-creation-page.md` — rewritten: removed levels/edges/classes/features, updated to PTR (traits, 18 skills, stats start at 10)
- `character-creation-validation.md` — rewritten: removed PTU background/edge/feature/class validators
- `character-creation-composable.md` — rewritten: removed PTU fields (classes, features, edges, skill ranks), updated to PTR
- `character-sheet-modal.md` — rewritten: "Classes" → "Traits", removed AP/level-up wizard, "Abilities, Capabilities" → "Traits"
- `character-api-endpoints.md` — removed trainer XP section (no trainer XP in PTR)

**Group/view/websocket (~11 files) — 1 updated, rest clean:**
- `group-view-scene-interaction.md` — removed AP reference, "PTU weather" → "weather"
- Clean: view-capability-projection uses "capability" in UI context (not PTU game mechanic), websocket files are pure architecture

**Also deleted:** `sprint-action.md` (Sprint removed in PTR)

**Tier 4 is COMPLETE.**

**Remaining:** ~54 files across the vault still contain "PTU" references. Most are in Tier 5 (design principles, service/composable/store patterns) or are legitimate references to PTU as a historical basis (CSV import, encounter budget derivation). Tier 5 sweep will handle these.
