# 2026-03-25 — Tier 2: combatant domain complete

Most files are architectural design proposals (ISP, SRP, decomposition patterns) with minimal game-rule claims. PTR issues were stale terminology in code examples and field names.

**Updated 6 files:**
- `combatant-as-lens.md` — code examples: removed `nature`, `abilities`→`traits`, `capabilities`→removed, `features/edges/trainerClasses`→removed, added Stamina to StatBlock comment, removed trainer `level`, `CombatantView.abilities`→`traits`, all prose "abilities"→"traits"
- `combatant-type-hierarchy.md` — "capabilities and skills field name clash" → "skills field structural incompatibility"
- `combatant-interface-bloat.md` — "entity.abilities" → "entity.traits", "entity.movement" → "entity.movementTraits"
- `combatant-card-subcomponents.md` — "weather abilities" → "weather traits", constant names updated
- `combatant-type-segregation.md` — removed `featureUsage` from mount state (features removed in PTR)
- `combatant-interface-breadth.md` — removed `featureUsage` from field table

**Clean 5 files:** `combatant-service-decomposition.md`, `combatant-service-mixed-domains.md`, `combatant-card-visibility-rules.md`, `combatant-movement-capabilities.md` (already updated), `combatant-capabilities-utility.md` (already updated)

**Combatant domain (Tier 2 item 7): COMPLETE.**

**Tier 2 is COMPLETE.** All 3 items done:
5. [x] pokemon (19 files — 3 deleted, 10 updated, 6 clean)
6. [x] trainer (11 files — 4 deleted, 5 rewritten, 2 updated)
7. [x] combatant (11 files — 6 updated, 5 clean)

**What's next: Tier 3**
8. [ ] capture (7 files)
9. [ ] healing/rest (7 files)
10. [ ] switching (3 files)
11. [ ] movement/grid/vtt (12 files)
12. [ ] initiative/turn (4 files)
