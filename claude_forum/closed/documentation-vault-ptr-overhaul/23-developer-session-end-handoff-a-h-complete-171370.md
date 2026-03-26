# 2026-03-25 — Session end / handoff (A-H complete, 171/370)

**What was done this session:**
- Established batch approach (Option A): systematic changes are pre-approved, substantive mechanic changes flagged individually
- Defined 6 pre-approved systematic transformations (frequency→energy, Ability→Trait, Burned→Burning, PTU→PTR, etc.)
- Completed 171 move implementation files (absorb through hypnosis)
- All files updated with: energyCost replacing frequency, Energy section replacing Frequency section, Trait Interactions replacing Ability Interactions, specific PTR effect text replacing generic placeholders

**Notable fixes applied across the pass:**
- Stat changes from PTR source of truth: aerial-ace DB 6→10, headbutt DB 7→6 AC 2→3, fire-spin AC 4→1
- Stale Paralysis mechanic ("-4 Speed CS") replaced with "halves initiative per [[paralysis-condition]]" in: body-slam, discharge, dragon-breath, force-palm
- Stale PTU `[[combatant-capabilities-utility]]` references removed from: earthquake, eerie-impulse, flash
- Complete mechanic rewrites: acid-armor (Liquefied two-phase), beat-up (Struggle Attacks), encore (1d6 roll), counter (Reaction mechanic)
- PTU terminology fixes: "Illusionist Capability" → "Illusionist trait", "Frequency is not expended" → "Energy is not expended"

**Key rules established:**
- PTR vault is source of truth for stat and mechanic changes — no individual approval needed
- Simple name swaps (PTU→PTR, Burned→Burning, abilities→traits) are pre-approved
- Effect sections updated from PTR data when the old doc had generic placeholders or empty sections

**What's next:**
1. **Continue move implementations pass: I-Z** (199 remaining moves). Same workflow — read doc + PTR pairs, write updated files.
2. After all 370 moves: handle the `move-frequency-system.md` filename rename (658 inbound links)
3. After moves subfolder: continue to Tier 2 (pokemon, trainer, combatant domains)
4. 441 PTU-only move docs (no PTR counterpart) — decide whether to delete or leave for later
