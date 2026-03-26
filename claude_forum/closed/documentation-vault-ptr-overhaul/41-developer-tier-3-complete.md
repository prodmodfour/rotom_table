# 2026-03-25 — Tier 3 complete

**Capture (7 files) — 4 updated, 3 clean:**
- `capture-rate-formula.md` — "PTU capture rate" → "PTR", linked to `capture-rate-base-formula`
- `capture-roll-mechanics.md` — "PTU 1d100", removed `trainerLevel` from formula (trainers have no levels in PTR), linked to `capture-workflow`, `only-pokemon-have-levels`
- `capture-accuracy-gate.md` — "PTU p.214" → linked to `full-accuracy-for-pokeball-throws`
- `capture-api-endpoints.md` — removed "+1 trainer XP" (no trainer XP in PTR)
- Clean: `capture-difficulty-labels.md`, `capture-context-toggles.md`, `capture-rate-display-component.md`

**Healing/rest (8 files) — 2 deleted, 5 updated, 1 clean:**
- Deleted `ap-drain-injury-healing.md` and `ap-pool-scales-with-level.md` (AP removed in PTR)
- `healing-data-fields.md` — removed trainer AP fields (`drainedAp`, `boundAp`, `currentAp`), replaced move tracking with Energy fields per `energy-resource`/`stamina-stat`
- `rest-healing-system.md` — removed AP reference
- `extended-rest.md` — removed AP restoration, "Burned"→"Burning", removed daily-frequency move refresh (PTR uses Energy), added Energy restoration and Fatigue cure per `rest-cures-fatigue`
- `healing-tab-component.md` — removed AP display and AP drain action
- `healing-mechanics.md` — "PTU healing items"→"healing items"
- Clean: `healing-item-system.md`

**Switching (3 files) — 1 updated, 2 clean:**
- `switching-system.md` — "8m PTU diagonal" → "8m per [[poke-ball-recall-range]]"
- Clean: `switching-validation-pipeline.md`, `switching-validation-duplication.md`

**Movement/grid/vtt (14 files) — 3 updated, 11 clean/already done:**
- `movement-modifiers-utility.md` — removed Sprint (+50%), "Thermosensitive ability"→"trait", `sprint-action`→`energy-for-extra-movement`
- `grid-distance-calculation.md` — "PTU diagonal"→"Diagonal"
- `vtt-component-composable-map.md` — "PTU distance"→linked to `grid-distance-calculation`
- Previously updated: `movement-is-atomic-per-shift.md`, `elevation-system.md`, `pathfinding-algorithm.md`, `ptu-movement-rules-in-vtt.md`, `ghost-type-ignores-movement-restrictions.md`
- Clean: remaining vtt/grid/isometric files (pure rendering/spatial, no game rules)

**Initiative/turn (3 files) — 2 updated, 1 clean:**
- `initiative-and-turn-order.md` — removed Focus +5 (Focus items removed in PTR), updated see-also
- `turn-lifecycle.md` — `sprint-action`→`energy-for-extra-movement`
- Clean: `turn-advancement-service-extraction.md`

**Tier 3 is COMPLETE.**

**What's next: Tier 4**
13. [ ] encounter (~21 files)
14. [ ] scene (~10 files)
15. [ ] player (~20 files)
16. [ ] character (~7 files)
17. [ ] group/view/websocket (~11 files)
