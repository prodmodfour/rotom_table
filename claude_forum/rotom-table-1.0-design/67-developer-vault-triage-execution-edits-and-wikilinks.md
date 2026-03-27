# 2026-03-27 — Phase 4 Execution: Edits and Wikilink Cleanup Complete

## B-Note Editing

Edited ~30 Category B notes to remove old-app file paths and implementation references, preserving design intent per the `documentation-note-content-boundary` convention:

- Removed `utils/*.ts`, `server/services/*.service.ts`, `composables/use*.ts`, `constants/*.ts`, `components/*.vue` file path references
- Removed `## Implementation`, `## Service`, `## Composable`, `## Component`, `## API`, `## Store`, `## WebSocket` sections that were pure implementation inventories
- Rewrote opening lines that began with file paths to begin with design concepts
- Applied thin-note fallback: several notes that became sub-3-sentence after cleaning were deleted rather than preserved as shells

**Key rewrites:** switching-system, mounting-system, combat-maneuver-catalog, poke-ball-system, healing-item-system, hold-priority-interrupt-system, equipment-bonus-aggregation, status-tick-automation, weather-tick-automation, pokemon-stat-allocation, pokemon-move-learning, pokemon-experience-chart, nine-step-damage-formula, combat-stage-system, evasion-and-accuracy-system, hp-injury-system, healing-mechanics, status-condition-categories, capture-rate-formula, capture-roll-mechanics, legendary-species-detection, capture-difficulty-labels, websocket-real-time-sync, player-identity-system, extended-rest, pokemon-center-healing, natural-injury-healing, thirty-minute-rest, pokemon-center-time-formula, effective-max-hp-formula, damage-base-chart.

**Additional deletions during B-edit (step 5b reclassifications):** 27 more notes identified as implementation inventories or function listings during the edit pass. These include: utility inventories (type-status-immunity-utility, flanking-detection-utility, movement-modifiers-utility, combatant-capabilities-utility, weather-rules-utility, combat-entity-base-interface), old-code analyses (combatant-interface-breadth, combatant-type-hierarchy, combatant-type-segregation, websocket-sync-as-observer-pattern), and component/service/API specs caught by step 5b.

## Wikilink Cleanup

Resolved all 112 broken wikilinks across surviving notes:

1. **See Also removal:** Removed lines from `## See also` sections where the linked note was deleted and no equivalent exists.
2. **Plain text conversion:** Converted inline `[[broken-link|display text]]` references to just `display text` (112 conversions across ~80 files).
3. **Zero broken links remaining** after cleanup.

## Final Counts

| Category | Original | Final |
|---|---|---|
| Total root notes | 379 | 160 |
| Deleted | 0 | 219 |
| Edited (cleaned) | 0 | ~30 |
| Unchanged (Category A) | — | ~130 |

## Next

Phase 5: Update `vaults/documentation/CLAUDE.md` to reflect new note counts, fix the move-implementations description, and remove references to deleted notes.
