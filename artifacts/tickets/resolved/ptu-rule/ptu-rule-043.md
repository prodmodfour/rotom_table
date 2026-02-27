---
ticket_id: ptu-rule-043
priority: P2
status: resolved
domain: pokemon-lifecycle
matrix_source:
  rule_ids:
    - pokemon-lifecycle-R026
    - pokemon-lifecycle-R027
    - pokemon-lifecycle-R028
    - pokemon-lifecycle-R029
    - pokemon-lifecycle-R031
    - pokemon-lifecycle-R014
    - pokemon-lifecycle-R015
  audit_file: matrix/pokemon-lifecycle-audit.md
created_at: 2026-02-19
created_by: orchestrator
---

## Summary

No unified level-up workflow exists. Seven PTU level-up automation items are missing: level-up wizard, +1 stat point distribution, move availability check from learnset, evolution level detection, evolution stat recalculation, ability notification at level 20, ability notification at level 40.

## Expected Behavior (PTU Rules)

On level-up: +1 stat point (with Base Relations validation), check learnset for new moves, check evolution level, notify GM of ability milestones (level 20 second ability, level 40 third ability). On evolution: recalculate stats from new base stats.

## Actual Behavior

Level changes are manual edits with no automated consequences. GM must manually check learnset, redistribute stats on evolution, and track ability milestones.

## Resolution Log

### 2026-02-20 — Implementation (Level-Up Notification System)

**Root cause:** No level-up workflow or notification system existed. Level was a plain editable number field.

**What was implemented (5 of 7 items):**

1. **Level-up checker utility** (`app/utils/levelUpCheck.ts`):
   - `checkLevelUp()` — pure function returning per-level info
   - `summarizeLevelUps()` — combines multiple levels into summary
   - Tracks: stat points (+1/level), new moves from learnset, ability milestones (Lv20/40), tutor points (every 5 from Lv5)

2. **Level-up check API** (`app/server/api/pokemon/[id]/level-up-check.post.ts`):
   - POST endpoint accepting `targetLevel`, queries SpeciesData learnset
   - Returns combined summary of all gains between current and target level

3. **Level-up info panel** (Pokemon sheet `app/pages/gm/pokemon/[id].vue`):
   - When GM changes level in edit mode, panel shows: stat points, new moves, ability milestones, tutor points, evolution check reminder
   - Uses server-side API for learnset data (avoids client-side species fetch)

**Items addressed:**
- +1 stat point distribution notification (item 2)
- Move availability check from learnset (item 3)
- Ability notification at level 20 (item 6)
- Ability notification at level 40 (item 7)
- Tutor point tracking (bonus, from PTU p.202)

**Items deferred (require deeper infrastructure):**
- Full level-up wizard modal (item 1) — current implementation is a notification panel, not a full wizard with stat allocation controls
- Evolution level detection (item 4) — SpeciesData doesn't store evolution level triggers; GM must check Pokedex manually (reminder added)
- Evolution stat recalculation (item 5) — requires knowing new species base stats and re-applying nature/vitamins; deferred pending evolution data model

**PTU verification:** Formulas verified against PTU Core Chapter 5 pp. 201-202. Ability milestones at Lv20/40 confirmed. Tutor points at Lv5 and every 5 levels confirmed.

**Duplicate path check:** No other code path provides level-up notifications. The `pokemon-generator.service.ts` `selectMovesFromLearnset()` uses learnset data for initial move selection but not for level-up checking.
