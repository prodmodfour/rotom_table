# 2026-03-25 — Documentation vault PTR overhaul: FINAL SUMMARY

**Total scope:** ~369 root files + ~811 move files + ~219 SE files (SE untouched)

**Files deleted:** 18 total
- 3 pokemon (nature-system, ability-assignment, tutor-points)
- 4 trainer (action-points, class-catalog, level-up-wizard, xp-system)
- 2 AP files (ap-drain-injury-healing, ap-pool-scales-with-level)
- 3 scene (scene-end-ap-restoration, scene-frequency-eot-restriction, scene-activation-resets-move-counters)
- 1 sprint-action
- 441 PTU-only move docs
- 1 PTR vault correction (encore — referenced nonexistent Suppressed condition)
- 1 PTR vault correction (choice item — same issue)
- 2 PTR move descriptions (encore)

**Files updated:** ~100+ across all tiers

**PTR vault corrections made:**
- `pokemon-creation-ordered-steps.md` — stat points formula fixed (5 × level, no base bonus)
- `combat-stage-asymmetric-scaling.md` — multiplier table corrected (prior session)
- `take-a-breather-resets-combat-state.md` — does NOT cure Slow/Stuck (prior session)
- `stuck-slow-separate-from-volatile.md` — removed false TaB cure claim (prior session)
- `movement-capability-types.md` → renamed to `movement-trait-types.md`, all links updated
- `base-terrain-types.md` — "PTU", "Burrow-capable/Swim-capable" → trait names
- Multiple files: "movement capability" → "movement trait"
- `encore.md` — deleted (Suppressed condition doesn't exist)
- `held-items-catalog.md` — Choice Item removed
- `phantom-force.md` — "Dodge Ability" → "Dodge trait"
- `roar.md` — "movement capability" → "movement trait"

**Key rules established:**
- Cross-reference PTR for validity, not just terminology
- Documentation notes must link to PTR vault sources
- PTR vault is source of truth for stat and mechanic changes
- Simple name swaps (PTU→PTR, abilities→traits, Burned→Burning) are pre-approved
- "Suppressed" is not a status condition — it's a verb applied to traits
