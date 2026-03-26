# 2026-03-25 — Status/condition domain: step-by-step approval

**`status-condition-categories.md`:**
- PTU → PTR. **APPROVED & APPLIED.**
- Burned → Burning (Persistent list + see-also). **APPROVED & APPLIED.**
- Removed Suppressed from Volatile (frequency-based, removed in PTR). **APPROVED & APPLIED.**
- Restructured categories: moved Slowed out of Volatile, added Slow/Stuck as own category (per [[stuck-slow-separate-from-volatile]]), added Fatigued as own category (per [[fatigued-is-its-own-condition-category]]), removed Stuck from Other. Volatile now 7, Other now 5. **APPROVED & APPLIED.**
- **PTR vault correction:** Take a Breather does NOT cure Slow or Stuck (Ashraf confirmed). Fixed `take-a-breather-resets-combat-state.md` and `stuck-slow-separate-from-volatile.md`. Also added Cursed exception to Take a Breather note ("cures all Volatile status effects except Cursed"). **APPROVED & APPLIED.**

**`status-cs-auto-apply-with-tracking.md`:**
- "abilities" → "traits". **APPROVED & APPLIED.**
- "Burn" → "Burning" (all occurrences). **APPROVED & APPLIED.**

**`status-tick-automation.md`:**
- "Burned" → "Burning". **APPROVED & APPLIED.**

**Batch name swaps (pre-approved):**
- `status-capture-bonus-hierarchy.md` — "PTU" → "PTR". **APPLIED.**
- `status-condition-registry.md` — "Burned" → "Burning" (code example + trade-offs). **APPLIED.**
- `condition-source-tracking.md` — "Burn-sourced" → "Burning-sourced". **APPLIED.**

**`status-condition-registry.md` substantive fix:**
- Burning code example had `stat: 'attack'` — should be `stat: 'defense'` (Burning applies -2 Def CS, not Atk). **APPROVED & APPLIED.**

**Clean files (no changes needed):** `status-condition-ripple-effect.md`, `condition-source-rules.md`, `condition-independent-behavior-flags.md`.

**Status/condition domain (Tier 1 item 3): COMPLETE.**
