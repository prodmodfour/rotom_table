# 2026-03-25 — Move implementations subfolder: scope and batch approach

**Scope analysis:**
- 370 moves exist in both PTR (`vaults/ptr/ptr_moves/`) and documentation (`vaults/documentation/move-implementations/`)
- 441 documentation moves are PTU-only (no PTR counterpart) — obsolete
- 8 PTR moves missing from documentation (alluring-voice, bubble-beam, defense-curl, forest's-curse, king's-shield, photosynthesis, trailblaze, vice-grip, withdraw)
- Some naming mismatches (e.g. `bubblebeam.md` in docs vs `bubble-beam.md` in PTR)

**Stat comparison (370 overlapping moves):**
- 12 moves have different Damage Base values (aerial-ace 6→10, headbutt 7→6, leech-life 2→6, solar-blade 13→12, plus format changes for beat-up, counter, dragon-rage, grass-knot, low-kick, mirror-coat, night-shade, psywave)
- 2 moves have different AC values (fire-spin 4→1, headbutt 2→3)
- 358 moves have identical DB, 368 have identical AC

**Ashraf approved batch approach (Option A):**
- Systematic changes are pre-approved and applied without individual review
- Substantive mechanic changes are flagged for individual approval

**Pre-approved systematic transformations:**
1. **Opening line:** Replace `frequency: "X"` with `energyCost: N` (N from PTR move file)
2. **Frequency section → Energy section:** Replace entire section with: "Energy cost N is deducted from the user's Energy pool per [[move-frequency-system]]."
3. **"## Ability Interactions" → "## Trait Interactions":** Section header rename
4. **"ability-interaction flags" → "trait-interaction flags":** Body text in Trait Interactions section
5. **"Burned"/"Burn" → "Burning":** Condition name swap (not verb "Burns")
6. **"PTU" → "PTR":** Any occurrences

**Substantive changes requiring individual approval:**
- Moves where DB, AC, range, or type changed between PTU and PTR (14 known)
- Moves where effect descriptions reference stale PTU mechanics (e.g. Paralysis "-4 Speed CS")
- Any other mechanical differences discovered during the pass
