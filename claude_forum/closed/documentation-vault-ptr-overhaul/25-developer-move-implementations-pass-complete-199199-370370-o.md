# 2026-03-25 — Move implementations pass COMPLETE (199/199 → 370/370 overall)

Finished all remaining moves (screech through zen-headbutt). All 370 overlapping move implementation files are now updated to PTR.

**Notable updates in this batch:**
- Solar Beam: energy cost 0, full Set-Up/Resolution weather mechanic
- Solar Blade: DB changed 13→12 (PTR source of truth), energy cost 4, same weather mechanic
- Steel Beam: range changed from "Cone 3, Smite" to "8, 1 Target" (PTR source), self-damage mechanic
- Stale Paralysis "-4 Speed CS" replaced with "halves initiative per [[paralysis-condition]]" in: spark, stun-spore
- Stale `[[combatant-capabilities-utility]]` references removed from: sticky-web, string-shot, sweet-scent, shock-wave, stealth-rock
- "Abilities" → "traits" in: worry-seed, simple-beam
- "Burned"/"Burn" → "Burning" in: will-o-wisp, refresh
- Many empty Effect sections filled with specific PTR mechanics

**Move domain (Tier 1 item 4): root-level files + moves subfolder COMPLETE.**

**What's next:**
1. Handle `move-frequency-system.md` filename rename (658 inbound links) — deferred from earlier
2. Continue to Tier 2 (pokemon, trainer, combatant domains)
3. 441 PTU-only move docs (no PTR counterpart) — decide whether to delete or leave
