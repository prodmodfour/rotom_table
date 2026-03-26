# 2026-03-25 — Re-examination of completed domains

**Damage domain (3 files):** The 9-step formula was fully rewritten step by step from `damage-formula-step-order.md` with Ashraf approving each step. Design claims verified. **No redo needed.**

**Combat domain (3 files):** Need to re-examine:
- `combat-stage-system.md` — Claims 5 stats use multiplier table + Accuracy CS as direct modifier + Evasion derived. Does PTR add Stamina to combat stages? Need to verify.
- `combat-maneuver-catalog.md` — Removed Sprint, added Manipulate maneuvers. But did we verify the full list of maneuvers against PTR? Or just patch the known changes?
- `combat-entity-base-interface.md` — Changed `nature` out, `traits` in, 14 shared fields. But the full field list was never verified against PTR's entity model. What about Stamina? Energy?

**Status/condition domain (9 files):** Need to re-examine:
- `status-condition-categories.md` — Restructured categories (Suppressed removed, Slow/Stuck own category, Fatigued own category). But was the full condition list verified against PTR? Are there PTR conditions we missed?
- Other files were mostly name swaps (Burned→Burning, abilities→traits, PTU→PTR). The Burning CS effect fix (attack→defense) was verified.

**Move domain (2 root + 370 files):** Root files were rewritten. The 370 move files had systematic transformations applied. Effect sections were updated from PTR data. But were secondary effects (e.g. status conditions applied, stat stage changes) verified against PTR for every move, or just the ones that were obviously different? **Cross-check in progress.**
