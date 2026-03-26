# Documentation Vault PTR Overhaul

The documentation vault was written to describe designs for a PTU app. PTU has become PTR. Every note needs a full redesign pass — re-examine against the PTR vault to see if the design still holds, update terminology, and fix mechanics that changed.

## Scope
- **94 files** explicitly reference "PTU" (131 occurrences)
- **~369 files** total in the root documentation vault (plus ~811 move docs, ~219 SE docs)
- Even files that don't say "PTU" may describe PTU mechanics without naming them
- The moves/ subfolder (~811 files) likely needs its own pass
- The SE subfolder (~219 files) is probably unaffected (generic patterns)

## Key PTR changes that affect documentation designs
(From `vaults/ptr/CLAUDE.md` and `rules/ptr-vs-ptu-differences.md`)
1. **Energy replaces Frequencies** — moves cost energy instead of having At-Will/EOT/Scene/Daily limits
2. **Traits replace Abilities/Features/Edges/Capabilities** — one unified system
3. **No per-species move lists** — any Pokemon can learn any move via unlock conditions
4. **Tutor Points reworked** — likely different from PTU's TP system
5. **Stat allocation changes** — need to verify against PTR rules
6. **Capture formula changes** — need to verify
7. **Damage formula changes** — need to verify

## Domain audit order
Grouped by dependency — foundational domains first, then domains that reference them.

### Tier 1: Core mechanics (other domains depend on these)
1. [x] **damage** (3 files + nine-step-damage-formula) — damage pipeline, formulas
2. [ ] **combat** (3 files + combat-stage-system, combat-maneuver-catalog) — stage system, maneuvers
3. [ ] **status/condition** (6+3 files) — condition categories, immunities
4. [ ] **move** (2 files + move-frequency-system) — frequency→energy is the biggest change

### Tier 2: Entity mechanics (depend on Tier 1)
5. [ ] **pokemon** (19 files) — stats, HP, evolution, species model, loyalty, XP
6. [ ] **trainer** (11 files) — stat budget, skills, classes, capabilities, derived stats
7. [ ] **combatant** (11 files) — type hierarchy, interface, cards, service decomposition

### Tier 3: Systems (depend on Tier 1+2)
8. [ ] **capture** (7 files) — rate formula, roll mechanics, accuracy gate, ball system
9. [ ] **healing/rest** (4+3 files) — HP injury, healing mechanics, rest, Take a Breather
10. [ ] **switching** (3 files) — switching system
11. [ ] **movement/grid/vtt** (3+4+5 files) — movement rules, grid distance, VTT rendering
12. [ ] **initiative/turn** (2+2 files) — turn order, turn lifecycle

### Tier 4: Views & architecture (depend on all above)
13. [ ] **encounter** (21 files) — lifecycle, state machine, schema, templates, composables
14. [ ] **scene** (10 files) — data model, conversion, activation, AP restoration
15. [ ] **player** (20 files) — view architecture, action panels, character sheet
16. [ ] **character** (7 files) — creation, validation, API
17. [ ] **group/view/websocket** (3+3+5 files) — group view, websocket events

### Tier 5: Cross-cutting & principles
18. [ ] **Design principles** (~20 files) — raw-fidelity, silence-means-no-effect, significance, etc.
19. [ ] **service/composable/store** (6+5+2 files) — service inventory, composable patterns
20. [ ] **Remaining uncategorized** — seed data, API endpoints, utilities, weather, terrain, etc.

### Separate pass
21. [ ] **moves/** subfolder (~811 files) — each move doc may reference frequencies, need energy conversion
22. [ ] **CLAUDE.md** — vault's own routing doc

---
