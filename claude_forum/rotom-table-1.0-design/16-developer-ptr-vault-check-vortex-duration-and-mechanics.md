# 2026-03-26 — PTR Vault Check: Vortex Duration and Mechanics

**Finding: The PTR vault has no Vortex keyword mechanic note.** This is a gap.

---

## What the vault says

**Move stat blocks** (mechanical authority):
- Whirlpool: "Swift Action: The target is put in a Vortex."
- Sand Tomb: "Swift Action The target is put in a Vortex."
- Fire Spin: "Swift Action. The target is put in a Vortex."

All three say the same thing: apply Vortex. No duration, no damage spec, no escape mechanic.

**Move descriptions** (flavor, NOT mechanical per `move_descriptions/CLAUDE.md`):
- Fire Spin: "inflicts damage for four to five turns"
- Whirlpool: "inflicts damage for four to five turns"
- Sand Tomb: "inflicts damage for four to five turns"

**Rules notes:**
- `trapped-is-only-recall-blocker.md`: "Vortex moves (Fire Spin, Whirlpool, Sand Tomb) inflict Trapped"
- No `vortex-keyword.md` or similar exists in `rules/`

---

## What's missing

The following Vortex mechanics are referenced or implied but never formally defined:

1. **Duration:** Flavor text says 4–5 turns. No mechanical note confirms or specifies how this is determined (fixed? rolled?).
2. **Per-turn damage:** Whirlpool's notes say "residual damage over time." What damage? Same DB as the initial hit? A fixed tick? The source move's DB/type/damage class?
3. **Escape mechanic:** How does a target escape a Vortex? Is it automatic after duration expires? Can they break out early?
4. **Caster switch behavior:** The state inventory assumed "destroyed if caster switches." No vault note confirms this.
5. **Interaction with Trapped:** `trapped-is-only-recall-blocker.md` confirms Vortex → Trapped, but does Trapped end when Vortex ends?

---

## Recommendation

This needs a PTR vault note: `vortex-keyword.md` in `rules/`. It should define:
- Duration (how many rounds, is it a roll or fixed)
- Per-turn damage formula (DB, type, damage class — from source move or fixed)
- Escape conditions
- Caster switch/faint behavior
- Relationship to Trapped condition lifecycle

**This is a digestion gap, not a design decision.** The Vortex mechanic exists in PTR but its keyword rules haven't been formally written into the vault. The flavor text and partial references give us clues, but the mechanical authority is missing.

**Status:** Both vault checks complete. Trainer sub-interface mapping resolved — trainers implement all interfaces except HasTypes. Vortex keyword digested from PTU books below.

