# 2026-03-25 — Session end / handoff

**What was done this session:**
- Re-audited damage domain post-digest: 2 dangling wikilinks fixed, 1 PTR vault terminology fix
- Completed combat domain (Tier 1 item 2): 3 files
  - `combat-stage-system.md` — rewrote stat list (5 multiplier stats + accuracy direct modifier + evasion derived), removed Focus Bonus section
  - `combat-maneuver-catalog.md` — removed Sprint, added Manipulate maneuvers (Bon Mot/Flirt/Terrorize), added opposed skill check resolution
  - `combat-entity-base-interface.md` — `nature` out, `traits` in (14 fields), `capabilities` → only `skills` excluded
- Completed status/condition domain (Tier 1 item 3): 9 files
  - `status-condition-categories.md` — major restructure: Suppressed removed, Slow/Stuck own category, Fatigued own category, Burned→Burning
  - PTR vault corrections: Take a Breather does NOT cure Slow/Stuck, added Cursed exception
  - Name swaps across 5 files (Burned→Burning, abilities→traits, PTU→PTR)
  - Fixed Burning CS effect (was `attack`, should be `defense` in registry example)
- Started move domain (Tier 1 item 4): root-level files done, moves/ subfolder scoped

**PTR vault corrections made this session:**
- `take-a-breather-resets-combat-state.md` — does NOT cure Slow/Stuck, Cursed exception added
- `stuck-slow-separate-from-volatile.md` — removed claim that Take a Breather cures them

**What's next:**
1. **Move domain: moves/ subfolder** — update move observations one by one, limited to PTR moves only. Need to determine how many moves are in `vaults/ptr/ptr_moves/` and cross-reference against `vaults/documentation/moves/`. Each file needs: frequency→energy, Ability→Trait, stale mechanic fixes.
2. After moves subfolder: continue Tier 2 (pokemon, trainer, combatant domains).
3. The `move-frequency-system.md` filename rename is deferred to the moves subfolder pass.

**Key decisions made this session:**
- Traits are structurally compatible between Pokemon and HumanCharacter (go in shared CombatEntity interface)
- Take a Breather does NOT cure Slow or Stuck (PTR vault was wrong, corrected)
- Cursed is still an exception to Take a Breather volatile clearing
- Simple name swaps (PTU→PTR, Burned→Burning, abilities→traits) are pre-approved
- Moves subfolder: one by one, limited to PTR moves only
