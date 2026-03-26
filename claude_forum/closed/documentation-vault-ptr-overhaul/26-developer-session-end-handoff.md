# 2026-03-25 — Session end / handoff

**What was done this session:**
- Completed all 370 move implementation files (Tier 1 item 4). Previous sessions did A-H (171); this session did I-Z (199).
- All files now have: `energyCost` replacing `frequency`, Energy section replacing Frequency section, "Trait Interactions" replacing "Ability Interactions", specific PTR effect text replacing generic placeholders.
- Stat changes applied from PTR source of truth: Leech Life DB 2→6, Solar Blade DB 13→12, Steel Beam range "Cone 3, Smite"→"8, 1 Target", Mirror Coat damageClass Status→Special.
- Stale Paralysis mechanic ("-4 Speed CS") replaced with "halves initiative per [[paralysis-condition]]" in: spark, stun-spore (plus body-slam, discharge, dragon-breath, force-palm from prior session).
- Stale `[[combatant-capabilities-utility]]` references removed from: sticky-web, string-shot, sweet-scent, shock-wave, stealth-rock, rock-blast, rock-tomb, rock-wrecker, minimize.
- "Abilities" → "traits" in: worry-seed, simple-beam, odor-sleuth. "Illusionist Capability" → "Illusionist trait" in odor-sleuth. "Dodge Ability" → "Dodge trait" in phantom-force.
- "Burned"/"Burn" → "Burning" condition name in: will-o-wisp, refresh, lava-plume, inferno, scald, and all other Burning-applying moves.
- Many empty or generic Effect sections filled with specific PTR mechanics from source of truth.

**Tier 1 is COMPLETE.** All 4 items done:
1. [x] damage (3 files)
2. [x] combat (3 files)
3. [x] status/condition (9 files)
4. [x] move (2 root files + 370 move implementation files)

**What's next:**
1. **`move-frequency-system.md` filename rename** — 658 inbound links point to this file. The content now describes PTR energy costs, not frequencies. Rename to something like `move-energy-system.md` and update all 658 links. This was deferred from the move domain pass.
2. **441 PTU-only move docs** — files in `move-implementations/` with no PTR counterpart. Decide: delete, mark obsolete, or leave.
3. **Tier 2: pokemon domain** (19 files) — stats, HP, evolution, species model, loyalty, XP. Cross-reference against PTR vault for stat allocation, evolution conditions, etc.
4. **Tier 2: trainer domain** (11 files) — stat budget, skills, classes, capabilities, derived stats.
5. **Tier 2: combatant domain** (11 files) — type hierarchy, interface, cards, service decomposition.

**Key rules still in effect:**
- PTR vault is source of truth for stat and mechanic changes — no individual approval needed
- Simple name swaps (PTU→PTR, Burned→Burning, abilities→traits) are pre-approved
- Present each change with explanation, wait for approval (for non-trivial changes)
- Post to forum max frequency
