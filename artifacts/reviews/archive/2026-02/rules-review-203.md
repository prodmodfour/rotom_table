---
review_id: rules-review-203
review_type: rules
reviewer: game-logic-reviewer
trigger: design-implementation
target_report: feature-010
domain: combat
commits_reviewed:
  - cbef558
  - 74de564
  - 9d577b1
  - 100a8e2
  - 488f01b
  - 2eb516e
  - 2c0d13c
  - 4acc128
mechanics_verified:
  - burn-tick-damage
  - poison-tick-damage
  - badly-poisoned-escalation
  - cursed-tick-damage
  - tick-definition
  - standard-action-trigger
  - badly-poisoned-round-tracking
  - faint-on-tick-damage
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 2
ptu_refs:
  - core/07-combat.md#page-246-burn
  - core/07-combat.md#page-247-poison-badly-poisoned
  - core/07-combat.md#page-247-cursed
  - errata-2.md
decrees_checked:
  - decree-001
  - decree-004
  - decree-032
reviewed_at: 2026-02-28T22:30:00Z
follows_up: null
---

## Mechanics Verified

### 1. Tick Definition (PTU p.246)
- **Rule:** "A Tick of Hit Points is equal to 1/10th of a Pokemon or Trainer's Maximum Hit Points." (`core/07-combat.md#page-246`, line 831-832)
- **Implementation:** `calculateTickDamage(maxHp)` returns `Math.max(1, Math.floor(maxHp / 10))` in `status-automation.service.ts:56-58`.
- **Analysis:** Correct. `floor(maxHp / 10)` computes 1/10 rounded down. The `minimum 1` floor aligns with the general principle that game values should not be zero (see Medium-1 below for decree-001 analysis). Uses `entity.maxHp` (base max HP, not injury-reduced effective max HP), which matches design decision D5 and the PTU text "Maximum Hit Points."
- **Status:** CORRECT

### 2. Burn Tick Damage (PTU p.246)
- **Rule:** "If a Burned Target takes a Standard Action or is prevented from taking a Standard Action by an effect such as Sleep, Flinch, or Paralysis, they lose a Tick of Hit Points at the end of that turn." (`core/07-combat.md`, line 1539-1543)
- **Implementation:** In `getTickDamageEntries()` (line 98-105), Burn always fires regardless of `standardActionTaken` parameter. The function does not gate Burn on `standardActionTaken`. In `next-turn.post.ts` (line 151), tick processing is gated on `currentPhase !== 'trainer_declaration'` and `currentHp > 0`, but not on `standardActionTaken` for Burn specifically.
- **Analysis:** Correct per design decision D1. In combat, every turn involves either taking or being prevented from taking a Standard Action. The "takes or is prevented from" clause is exhaustive in combat context. Burn tick fires every turn, which is the correct behavior.
- **Status:** CORRECT

### 3. Poison Tick Damage (PTU p.247)
- **Rule:** "If a Poisoned Target takes a Standard Action or is prevented from taking a Standard Action by an effect such as Sleep, Flinch, or Paralysis, they lose a Tick of Hit Points at the end of that turn." (`core/07-combat.md`, line 1562-1565)
- **Implementation:** In `getTickDamageEntries()` (line 117-124), Poison fires unconditionally (same logic as Burn), but ONLY if Badly Poisoned is NOT present (the `else if` on line 117 ensures Badly Poisoned supersedes Poisoned).
- **Analysis:** Correct. Same trigger logic as Burn. The Badly Poisoned supersession is also correct (see E3 edge case below).
- **Status:** CORRECT

### 4. Badly Poisoned Escalation (PTU p.247)
- **Rule:** "When Badly Poisoned, the afflicted instead loses 5 Hit Points; this amount is doubled each consecutive round (10, 20, 40, etc)." (`core/07-combat.md`, line 1566-1568)
- **Implementation:** `calculateBadlyPoisonedDamage(round)` returns `5 * Math.pow(2, Math.max(0, round - 1))` (line 67-69). Escalation: round 1 = 5, round 2 = 10, round 3 = 20, round 4 = 40. This matches exactly.
- **Analysis:** The formula is correct. The PTU text says "5 Hit Points; this amount is doubled each consecutive round" which means: first occurrence = 5, then 10, 20, 40. The implementation uses `5 * 2^(round-1)` which produces exactly this sequence. The `Math.max(0, round - 1)` clamp prevents negative exponents for edge cases.
- **PTU Ambiguity - "each consecutive round":** The PTU text says "each consecutive round" which could mean (a) each of the afflicted's turns, or (b) each combat round (where multiple combatants act). The design spec (D3) interprets this as per-combatant-turn, which is the standard PTU community interpretation. The `badlyPoisonedRound` counter increments in `next-turn.post.ts:193` at the END of each of the afflicted combatant's turns, correctly tracking per-turn escalation.
- **Status:** CORRECT

### 5. Badly Poisoned Round Tracking
- **Rule:** Badly Poisoned escalation resets when cured (`core/07-combat.md`, line 1566-1568 — "When Badly Poisoned" implies fresh tracking each time the condition is applied).
- **Implementation:**
  - **Initialize on add:** `status.post.ts:108-109` sets `combatant.badlyPoisonedRound = 1` when Badly Poisoned is added.
  - **Reset on remove:** `status.post.ts:111-112` sets `combatant.badlyPoisonedRound = 0` when Badly Poisoned is removed.
  - **Increment at turn end:** `next-turn.post.ts:191-194` increments `(badlyPoisonedRound || 1) + 1` after tick damage is applied.
  - **Combatant builder:** `combatant.service.ts:748` initializes to `0` for new combatants.
  - **Default in service:** `status-automation.service.ts:109` uses `combatant.badlyPoisonedRound || 1` which handles the edge case where the field might be 0 (treats it as round 1).
- **Analysis:** Correct. The lifecycle is: 0 (not poisoned) -> 1 (just applied) -> uses round 1 for first tick -> increments to 2 -> uses round 2 for second tick, etc. Reset to 0 on cure. The `|| 1` fallback in the service handles any legacy combatants that might not have the field initialized.
- **Status:** CORRECT

### 6. Badly Poisoned Supersedes Poisoned (E3)
- **Rule:** PTU p.247 says "When Badly Poisoned, the afflicted **instead** loses 5 Hit Points..." — the word "instead" means Badly Poisoned replaces the Poison tick, not stacks with it.
- **Implementation:** In `getTickDamageEntries()` (line 107-124), the code uses `hasBadlyPoisoned` to check first, and Poisoned is in an `else if` branch. If both conditions exist, only Badly Poisoned damage fires.
- **Analysis:** Correct. This matches the PTU "instead" wording. The implementation changed from the design spec (which originally had separate `if` blocks) to the current `if/else if` structure, which correctly prevents double-ticking.
- **Status:** CORRECT

### 7. Cursed Tick Damage (PTU p.247)
- **Rule:** "If a Cursed Target takes a Standard Action, they lose two ticks of Hit Points at the end of that turn." (`core/07-combat.md`, line 1599-1600)
- **Implementation:** In `getTickDamageEntries()` (line 127-133), Cursed only fires when `standardActionTaken === true`. Damage is `tick * 2` (two ticks).
- **Analysis:** Correct per decree-032 and PTU RAW. The Cursed text deliberately omits the "or is prevented from taking a Standard Action" clause that Burn and Poison include. Per decree-032, this textual difference is mechanical, not editorial. The implementation correctly gates Cursed on `standardActionTaken`.
- **Decree compliance:** Fully compliant with decree-032.
- **Status:** CORRECT

### 8. Standard Action Trigger Detection
- **Rule:** Burn/Poison fire on "takes or is prevented from taking a Standard Action." Cursed fires only on "takes a Standard Action."
- **Implementation:** In `next-turn.post.ts:152`, `standardActionTaken` is derived from `currentCombatant.turnState?.standardActionUsed ?? false`. This is passed to `getTickDamageEntries()`. The `turnState.standardActionUsed` field is set by the client/API when a combatant uses their Standard Action.
- **Analysis:** Correct. The `?? false` default means if `turnState` is missing or `standardActionUsed` is undefined, it defaults to `false` (Standard Action not taken). This is conservative for Cursed (no tick if unknown) and irrelevant for Burn/Poison (they always fire). If a combatant was prevented from acting (Frozen, Asleep, Paralyzed), `standardActionUsed` would be `false` — Burn/Poison still tick, Cursed does not.
- **Status:** CORRECT

### 9. Tick Damage Through calculateDamage() Pipeline
- **Rule:** Tick damage is HP loss. The code routes it through `calculateDamage()` which handles temp HP absorption, HP marker injuries, massive damage, and faint detection.
- **Implementation:** `next-turn.post.ts:159-167` calls `calculateDamage(entry.damage, currentHp, maxHp, tempHp, injuries)` then `applyDamageToEntity(combatant, damageResult)`.
- **Analysis:** Correct per design decision D4. Tick damage can cause injuries via HP marker crossings and massive damage (e.g., Badly Poisoned at high escalation could deal 50%+ maxHp). Temp HP absorption is handled per decree-004 (massive damage check uses real HP lost after temp HP absorption). Fainting is handled automatically.
- **Status:** CORRECT

### 10. Fainted Combatants Skip Tick Damage (D6)
- **Rule:** PTU p.248: "All Persistent Status conditions are cured if the target is Fainted." A fainted combatant has no Persistent conditions and thus no tick damage.
- **Implementation:** Two guards: (1) `status-automation.service.ts:93` returns empty if `entity.currentHp <= 0`, (2) `next-turn.post.ts:151` gates tick processing on `currentCombatant.entity.currentHp > 0`.
- **Analysis:** Correct. Double-guarded for safety. The service-level check is the authoritative one (pure function), the endpoint-level check is defense-in-depth.
- **Status:** CORRECT

### 11. Mid-Processing Faint (E2)
- **Rule:** If a combatant has multiple tick conditions (e.g., Burn + Cursed), the first tick might cause fainting. Subsequent ticks should not apply to a fainted combatant.
- **Implementation:** `next-turn.post.ts:157` checks `if (currentCombatant.entity.currentHp <= 0) break` inside the tick processing loop, before each entry.
- **Analysis:** Correct. The break exits the loop early if the combatant fainted from a previous tick entry in the same turn-end processing.
- **Status:** CORRECT

### 12. Declaration Phase Exclusion (League Battles)
- **Rule:** During League Battle `trainer_declaration` phase, trainers are only declaring — not executing. Tick damage should not fire.
- **Implementation:** `next-turn.post.ts:151` gates tick processing on `currentPhase !== 'trainer_declaration'`.
- **Analysis:** Correct. Declaration is not a real turn — tick damage fires during `trainer_resolution` and `pokemon` phases only.
- **Status:** CORRECT

### 13. WebSocket Broadcast
- **Rule:** (No PTU rule — architectural requirement.) Tick damage events must be broadcast to connected clients for real-time sync.
- **Implementation:** `ws.ts:349-354` adds a `status_tick` case that broadcasts to the encounter room. `next-turn.post.ts:371-385` broadcasts tick results after saving to the database.
- **Analysis:** Correct. The `status_tick` event type is registered in the WebSocket handler and the broadcast happens after the DB write, ensuring consistency.
- **Status:** CORRECT

### 14. Move Log Entries
- **Rule:** (No PTU rule — UX requirement.) Tick damage events should be recorded in the encounter's move log.
- **Implementation:** `next-turn.post.ts:341-363` creates move log entries with `moveName: '${condition} Tick'`, `damageClass: 'Status'`, and includes the damage formula in `notes`.
- **Analysis:** Correct. Each tick condition gets its own log entry. The actor and target are the same combatant (self-damage).
- **Status:** CORRECT

---

## Decree Compliance

### decree-001 (Minimum 1 Damage)
The `calculateTickDamage()` function applies `Math.max(1, ...)` ensuring tick damage is always at least 1. However, decree-001 specifically addresses the damage pipeline's post-defense and post-effectiveness floors for *attack damage*. Tick damage is HP loss, not an attack — it bypasses the attack damage pipeline entirely. The minimum 1 in `calculateTickDamage()` comes from the practical interpretation that a tick of a very small HP pool should not be 0 (a Pokemon with 5 maxHP would have floor(5/10) = 0 ticks, which would mean the condition does nothing). This is a reasonable implementation choice. See Medium-1 for the ambiguity note.

### decree-004 (Massive Damage + Temp HP)
Tick damage flows through `calculateDamage()`, which correctly implements decree-004: massive damage threshold uses real HP lost after temp HP absorption. A large Badly Poisoned tick could trigger massive damage, and the temp HP interaction is correctly handled.

### decree-032 (Cursed Standard Action Only)
Fully compliant. The `getTickDamageEntries()` function gates Cursed on `standardActionTaken === true`. The `next-turn.post.ts` passes `turnState.standardActionUsed` as the trigger. Comments in both files cite decree-032.

---

## Summary

The P0 implementation of feature-010 (Status Condition Automation Engine - Tick Damage) is a well-structured, PTU-accurate implementation. All four tick damage conditions (Burn, Poison, Badly Poisoned, Cursed) are correctly implemented with their respective trigger rules. The Badly Poisoned escalation formula, round tracking lifecycle, and Poisoned supersession are all correct. Decree-032 compliance for Cursed is properly enforced. The pure function architecture in `status-automation.service.ts` is clean and testable, with comprehensive unit tests covering all major cases and edge cases.

Two medium-severity observations are noted below, neither of which produces incorrect game values in practice.

---

## Rulings

### Medium-1: Minimum Tick Damage and decree-001 Applicability

**Observation:** `calculateTickDamage()` applies `Math.max(1, ...)` to ensure tick damage is never 0. Decree-001 establishes minimum 1 damage at both post-defense and final steps for *attack damage*. However, tick damage is HP loss, not attack damage — it does not go through the attack/defense pipeline. The question is: does the "minimum 1 damage" principle from decree-001 extend to tick damage, or is the minimum 1 tick an independent design choice?

**PTU Analysis:** The PTU text does not explicitly state a minimum tick value. A Pokemon with maxHP = 5 would have `floor(5/10) = 0` ticks, meaning Burn/Poison would do nothing. The current `Math.max(1, ...)` prevents this degenerate case. This is a reasonable interpretation but technically an assumption beyond RAW.

**Impact:** Extremely low. No real Pokemon at any reasonable level would have maxHP below 10 (minimum formula: `level + (baseHp * 3) + 10` = at minimum 1 + 1*3 + 10 = 14). This only affects contrived edge cases.

**Recommendation:** The current behavior is correct and sensible. No change needed. This does not warrant a decree-need ticket because the practical impact is zero.

### Medium-2: badlyPoisonedRound Not Reset on Faint via applyDamageToEntity

**Observation:** When a combatant faints from tick damage (or any damage), `applyDamageToEntity()` in `combatant.service.ts` clears all Persistent and Volatile status conditions (including Badly Poisoned). However, it does NOT reset `combatant.badlyPoisonedRound` back to 0. The `badlyPoisonedRound` field lives on the Combatant, not the entity, so `applyDamageToEntity()` (which receives the Combatant but only mutates `combatant.entity`) does not touch it.

**Practical Impact:** Low. If a combatant faints, Badly Poisoned is cleared from their status conditions. Even if `badlyPoisonedRound` remains at a stale value (e.g., 3), the tick damage processing in `getTickDamageEntries()` checks for the 'Badly Poisoned' status condition in the entity's `statusConditions` array — which was already cleared on faint. So no tick damage would fire. If the combatant is later revived and re-afflicted with Badly Poisoned, `status.post.ts:108-109` sets `badlyPoisonedRound = 1`, overwriting the stale value.

**However:** There is a narrow edge case: if a combatant is revived (Fainted removed, HP healed) but the healing code does NOT go through the status.post.ts endpoint (e.g., direct HP heal that removes Fainted), and then someone manually re-applies Badly Poisoned via status.post.ts — the lifecycle would still be correct because `status.post.ts:108-109` always sets `badlyPoisonedRound = 1` on add. So the stale value cannot leak.

**Recommendation:** For defensive correctness, `applyDamageToEntity()` should reset `combatant.badlyPoisonedRound = 0` when clearing conditions on faint. This is not a game-logic bug (values are never incorrect), but a data hygiene improvement that prevents future confusion.

---

## Verdict

**APPROVED**

The implementation correctly implements all PTU 1.05 tick damage mechanics for Burn, Poison, Badly Poisoned, and Cursed. All formulas are accurate, all trigger conditions match the rulebook text, decree-032 compliance is verified, and edge cases (faint mid-processing, Badly Poisoned superseding Poisoned, declaration phase exclusion) are properly handled. The two medium findings are data hygiene observations with no gameplay impact.

---

## Required Changes

None. Both medium observations are recommendations for future improvement, not blocking issues.

**Recommended improvements (non-blocking):**
1. Reset `combatant.badlyPoisonedRound = 0` inside `applyDamageToEntity()` when a combatant faints and conditions are cleared (data hygiene).
