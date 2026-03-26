# 2026-03-25 — Tier 5 complete (cross-cutting & remaining)

**Substantive fixes:**
- `equipment-bonus-aggregation.md` — removed Focus items (dropped in PTR), removed PTU page references, linked to PTR equipment system (`armor-and-shields`, `equipment-slots`)
- `take-a-breather-mechanics.md` — linked to PTR source `take-a-breather-resets-combat-state`, fixed Slow/Stuck (does NOT cure them), added Fatigue recovery, "nine PTU maneuvers" → "PTR special action"
- `sprint-action.md` — deleted (Sprint removed in PTR)
- `seed-data-pipeline.md` — "learnsets, capabilities" → "movement traits"

**Batch PTU→PTR swaps (41 files):**
Applied `sed` to utility files, design principles, service docs, composable docs. Covered: game-engine-extraction, game-logic-boundary-absence, transaction-script-turn-lifecycle, quick-stat-workflow, type-grants-status-immunity, type-status-immunity-utility, recall-clears-then-source-reapplies, sleep-volatile-but-persists, raw-darkness-penalties-with-presets, silence-means-no-effect, no-false-citations, per-conflict-decree-required, errata-corrections-not-replacements, presets-stay-within-raw, separate-mechanics-stay-separate, minimum-floors-prevent-absurd-results, percentages-are-additive, significance-cap-x5, significance-and-budget, cross-reference-before-concluding-omission, clear-then-reapply-pattern, server-enforcement-with-gm-override, sample-backgrounds, move-energy-system, weather-rules-utility, size-category-footprint-map, poke-ball-system, ball-modifier-formatting, fog-of-war-system, measurement-aoe-modes, healing-item-system, flanking-detection-utility, intercept-disengage-system, hold-priority-interrupt-system, utility-api-endpoints, largest-composables, pathfinding-algorithm, ptu-movement-rules-in-vtt, ghost-type-ignores-movement-restrictions, service-inventory.

**Corrected over-replacements:**
- `service-inventory.md` — csv-import description restored to "PTU character sheet CSVs" (actually imports PTU format)

**Design principle rewrite:**
- `raw-fidelity-as-default.md` — "built on PTU 1.05" → "built on PTR (which itself derives from PTU 1.05)"

**CLAUDE.md updates:**
- `vaults/documentation/CLAUDE.md` — move-implementations "~811, stale" → "~371, updated to PTR"
- `move-implementations/CLAUDE.md` — full rewrite: reflects completed PTR update

**Remaining PTU references (10 files) — all legitimate:**
- CSV import files (actually import PTU format sheets)
- Encounter budget (derives from PTU Ch11, adapted for PTR)
- Trainer skill definitions (mentions PTU as what was removed)
- Experience chart ("unchanged from PTU")
- Species data model (seeded from PTU pokedex)
- `ptu-has-no-formal-encounter-tables.md` (historical claim about PTU)
- `raw-fidelity-as-default.md` (PTU as historical basis)
- `move-implementations/CLAUDE.md` (PTU frequencies replaced, PTU-only moves deleted)

**ALL 5 TIERS COMPLETE.**
