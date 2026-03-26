# 2026-03-25 — Pokemon domain: deletions and rewrites complete

**Deleted 3 obsolete files:**
- `pokemon-nature-system.md` — natures removed in PTR (`natures-removed.md`)
- `pokemon-ability-assignment.md` — abilities replaced by traits, no level milestones
- `pokemon-tutor-points.md` — tutor points don't exist in PTR (zero references in PTR vault)

**Rewrites:**
- `pokemon-experience-chart.md` — levels 1-100 → 1-20, "+1 stat point" → "+5 stat points" per `five-stat-points-per-level`, removed learnset/ability milestones/tutor points from `checkLevelUp`, linked to `ptr-xp-table`, `level-up-ordered-steps`, `evolution-check-on-level-up`
- `pokemon-move-learning.md` — "species learnset" → "unlock conditions", "6 slots" → "no limit", linked to `moves-are-universally-available`, `no-moves-known-limit`, `unlock-conditions`
- `pokemon-stat-allocation.md` — removed `pendingAbilityMilestone`/`pendingNewMoves`, updated budget description to 5 × level, linked to `five-stat-points-per-level`, `base-stat-relations-removed`
- `pokemon-api-endpoints.md` — removed ability assignment endpoint, removed tutor points from see-also, removed 6-move-max from learn-move, updated evolution endpoints (abilities→traits, capabilities removed, stat rebuild, trigger conditions)

**Pokemon domain (Tier 2 item 5): COMPLETE.** All 19 files audited:
- 6 clean (origin-enum, center-time-formula, nickname-resolution, sprite-resolution-chain, sheet-dice-rolls, bulk-operations)
- 3 deleted (nature-system, ability-assignment, tutor-points)
- 10 updated (hp-formula, loyalty, center-healing, api-endpoints, evolution-system, generator-entry-point, stat-allocation, experience-chart, move-learning, sheet-page)

**What's next:**
1. **Tier 2: trainer domain** (11 files) — stat budget, skills, classes, capabilities, derived stats
2. **Tier 2: combatant domain** (11 files) — type hierarchy, interface, cards, service decomposition
3. Then Tiers 3–5 per the domain audit order
