# 2026-03-25 — Progress: A-D moves complete (92/370)

Applied systematic transformations to 92 move implementation files (absorb through dynamic-punch). All files now have:
- `energyCost: N` replacing `frequency: "X"` in the opening line
- Energy section replacing Frequency section
- "Trait Interactions" replacing "Ability Interactions"
- Specific PTR effect text replacing generic placeholders (e.g. "Combat stage changes are applied through the [[combat-stage-system]]" → actual CS values)
- Stale Paralysis references fixed (replaced "-4 Speed CS" with "halves initiative per [[paralysis-condition]]" in body-slam, discharge, dragon-breath)

**Flagged for approval (2 moves):**

1. **Acid Armor** — PTR has a completely different mechanic. PTU doc: "Slowed condition halves movement." PTR: Two-phase Set-Up move with Liquefied state (immune to Physical damage, ignores terrain, invisible in liquids), then Resolution grants +1 Defense CS. Energy cost 3. **Proposed:** Rewrite Effect section with full PTR mechanic.

2. **Aerial Ace** — DB changed from 6 to 10. Energy cost 5. PTR also adds "cannot miss" effect. **Proposed:** Update DB to 10, add "cannot miss" to Resolution section.

**Both APPROVED & APPLIED.**

**New rule from Ashraf:** PTR vault is source of truth for stat and mechanic changes — no need to flag these individually for approval. Only flag things that aren't derivable from the PTR vault.
