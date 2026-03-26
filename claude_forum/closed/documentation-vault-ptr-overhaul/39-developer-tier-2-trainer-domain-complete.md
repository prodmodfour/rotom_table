# 2026-03-25 — Tier 2: trainer domain complete

**Ashraf clarification:** Trainers have no XP system. Trainers are a functional shell — future PTR versions will flesh them out.

**Key PTR changes for trainers:**
- Trainers don't have levels (`only-pokemon-have-levels.md`)
- AP removed entirely (`ap-removed-in-ptr.md`)
- Features, Edges, Classes removed (`ptr-removes-features-edges-classes.md`)
- Trainers start with 10 in each stat (`starting-stat-allocation.md`)
- HP formula: `(HP stat × 3) + 10` — no level component (`trainer-hp-formula.md`)
- Skills: 18 flat list, numeric modifiers, no categories/ranks (`ptr-skill-list.md`)

**Deleted 4 files:**
- `trainer-action-points.md` — AP removed in PTR
- `trainer-class-catalog.md` — classes removed in PTR
- `trainer-level-up-wizard.md` — trainers don't level
- `trainer-xp-system.md` — no trainer XP system

**Rewritten 5 files:**
- `trainer-hp-formula.md` — `(level*2)+(HP*3)+10` → `(HP stat × 3) + 10`, linked to `only-pokemon-have-levels`
- `trainer-stat-budget.md` — removed level-based budget/caps/edge/feature functions. Now: start with 10 in each stat, 7 stats including Stamina, linked to `starting-stat-allocation`, `six-trainer-combat-stats`
- `trainer-skill-definitions.md` — removed PTU 17 skills/3 categories/6 ranks. Now: 18 flat skills, 1d20+Mod, linked to `ptr-skill-list`, `skill-check-1d20-plus-modifier`
- `trainer-capabilities-field.md` — "capabilities" → "traits", removed class/PTU references, linked to `trait-definition`, `naturewalk`
- `trainer-derived-stats.md` — "Overland, Swimming" → "movement traits", linked to `movement-trait-types`

**Updated 2 files:**
- `trainer-owned-species-tracking.md` — removed trainer XP award and PTU reference
- `pokemon-center-healing.md` — removed AP reference (AP doesn't exist in PTR)

**Clean 1 file:** `trainer-sprites.md`

**Dangling links remain** in ~15 files outside trainer domain (healing, rest, character creation, etc.) that reference deleted trainer files. These will be caught when those domains are audited.

**Trainer domain (Tier 2 item 6): COMPLETE.**

**What's next:**
1. **Tier 2: combatant domain** (11 files) — type hierarchy, interface, cards, service decomposition
2. Then Tiers 3–5 per the domain audit order
