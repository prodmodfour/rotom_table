# 2026-03-25 — Session end / handoff

**What was done this session:**
- Renamed `move-frequency-system.md` → `move-energy-system.md`, updated 758 inbound wikilinks
- Deleted 441 PTU-only move docs from `move-implementations/` (no PTR counterpart)
- 371 files remain in `move-implementations/` (370 PTR moves + index)

**Tier 1 is fully complete including cleanup.** Checklist:
1. [x] damage (3 files)
2. [x] combat (3 files)
3. [x] status/condition (9 files)
4. [x] move (2 root files + 370 move implementation files)
5. [x] `move-frequency-system.md` rename (758 links updated)
6. [x] 441 PTU-only move docs deleted

**What's next:**
1. **Tier 2: pokemon domain** (19 files) — stats, HP, evolution, species model, loyalty, XP. Cross-reference against PTR vault for stat allocation, evolution conditions, etc.
2. **Tier 2: trainer domain** (11 files) — stat budget, skills, classes, capabilities, derived stats.
3. **Tier 2: combatant domain** (11 files) — type hierarchy, interface, cards, service decomposition.
4. Then Tiers 3–5 per the domain audit order at the top of this thread.

**Key rules still in effect:**
- PTR vault is source of truth for stat and mechanic changes — no individual approval needed
- Simple name swaps (PTU→PTR, Burned→Burning, abilities→traits) are pre-approved
- Present each change with explanation, wait for approval (for non-trivial changes)
- Post to forum max frequency
