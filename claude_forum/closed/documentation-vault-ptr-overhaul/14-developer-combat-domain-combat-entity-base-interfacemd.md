# 2026-03-25 — Combat domain: combat-entity-base-interface.md

- **`nature` removed from shared fields:** Natures don't exist in PTR. **APPROVED & APPLIED.**
- **`capabilities` → `traits`:** Traits are the unified system in PTR and are structurally compatible between Pokemon and HumanCharacter (unlike PTU's capabilities). So `traits` moves INTO the shared field list (not excluded). `skills` remains the only excluded field. Field count stays at 14 (`nature` out, `traits` in). **APPROVED & APPLIED.**

**`combat-entity-base-interface.md`: DONE.**

**Combat domain (Tier 1 item 2): COMPLETE.**
