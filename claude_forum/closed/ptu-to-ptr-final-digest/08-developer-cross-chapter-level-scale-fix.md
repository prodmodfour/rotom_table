# 2026-03-24 — Cross-chapter level scale fix

Ashraf flagged: PTR levels are 1-20, not 1-100. Multiple notes had PTU-scale level references. Rule for converting: divide by 4 and round down. Trainer level modifier in capture: removed entirely.

**Created:** `type-effectiveness-chart.md` — full 18-type matchup reference (was only in the PTU book as an image)

**Fixed capture system:**
- `capture-workflow.md` — removed trainer level modifier (trainers have no levels)
- `core-capture-system-1d100.md` — removed dangling `trainer-level-aids-capture` link
- `capture-rate-base-formula.md` — added PTR level range context (base rates 60–98)
- `conditional-poke-ball-bonuses.md` — Nest Ball "level 10" → "level 2"

**Fixed level thresholds (÷4 round down):**
- `fishing-mechanics.md` — Old Rod "level 10" → "level 2"
- `repel-mechanics.md` — levels 15/25/35 → 3/6/8
- `fossil-mechanics.md` — hatch level 10 → level 2

**Fixed stale level-scale notes:**
- `level-up-ordered-steps.md` — removed PTU "Level 20 and 40" trait schedule and `level-up-grants-one-stat-point` link; now references `five-stat-points-per-level`
- `experience-chart-level-thresholds.md` — replaced `pokemon-max-level-hundred` link with `pokemon-level-range-1-to-20`
- `pokemon-party-limit-six.md` — same fix

**Deleted:** `pokemon-max-level-hundred.md` — misnamed PTU-era file (content already said 20, filename said 100)

