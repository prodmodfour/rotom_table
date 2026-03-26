# 2026-03-25 — Move domain cross-check complete

Verified move implementation docs against PTR move sources. Broad sweeps + targeted sampling:

**Systematic transformations verified clean:**
- 0 remaining "Ability Interactions" headers (all → "Trait Interactions")
- 0 remaining "-4 Speed CS" Paralysis references (all → "halves initiative per [[paralysis-condition]]")
- 0 remaining "Burned" condition names (all → "Burning")
- 0 remaining `move-frequency-system` links (all → `move-energy-system`)
- 0 remaining `combatant-capabilities-utility` references

**Sampled moves verified against PTR source (stats, energy, effects):** thunder-wave, ice-beam, swords-dance, flamethrower, close-combat, toxic, body-slam, will-o-wisp, stealth-rock, leech-life, dragon-dance, roar. All match.

**Remaining "frequency" / "Scene" / "Daily" occurrences (7 files):** All are legitimate PTR mechanics — Imprison's "rest of the Scene" duration, Assurance's "once per Scene" conditional, Belch's "during this Scene" requirement, etc. These are scene-scoped durations, not PTU frequency categories.

**Gap: doc files don't link to PTR move sources.** Currently link only to documentation vault notes. New rule covers this going forward.
