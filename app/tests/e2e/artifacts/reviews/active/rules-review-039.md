---
review_id: rules-review-039
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: ptu-rule-034, ptu-rule-035
domain: healing
commits_reviewed:
  - 658f0fa (fix: stop natural healing from resetting lastInjuryTime timer)
  - 5198d2e (fix: only restore drained AP at Pokemon Center if visit meets Extended Rest)
mechanics_verified:
  - natural-injury-healing-timer
  - natural-injury-healing-daily-cap
  - drain-ap-injury-healing-consistency
  - pokemon-center-ap-restoration
  - pokemon-center-time-calculation
verdict: CHANGES_REQUIRED
issues_found:
  critical: 0
  high: 1
  medium: 0
ptu_refs:
  - core/07-combat.md#lines-2004-2008 (natural injury healing)
  - core/07-combat.md#lines-2009-2014 (extended rest benefits)
  - core/07-combat.md#lines-2015-2028 (pokemon center healing)
reviewed_at: 2026-02-18T19:15:00
---

## Review Scope

Verifying Developer fixes for two PTU rule tickets filed during rules-review-037:

1. **ptu-rule-034** (commit `658f0fa`): Natural healing incorrectly reset `lastInjuryTime` after each heal, enforcing a 24h cooldown between heals instead of tracking 24h since last injury *gained*.
2. **ptu-rule-035** (commit `5198d2e`): Pokemon Center unconditionally restored drained AP. PTU says drained AP is an Extended Rest benefit, not a Pokemon Center benefit.

Files reviewed:
- `app/server/api/characters/[id]/heal-injury.post.ts` (ptu-rule-034)
- `app/server/api/pokemon/[id]/heal-injury.post.ts` (ptu-rule-034)
- `app/server/api/characters/[id]/pokemon-center.post.ts` (ptu-rule-035)

Cross-referenced:
- `app/utils/restHealing.ts` — `canHealInjuryNaturally()`, `calculatePokemonCenterTime()`
- `app/server/services/entity-update.service.ts:96` — injury gain timer source of truth

## Mechanics Verified

### 1. Natural Injury Healing Timer (ptu-rule-034)

- **Rule:** "If a Pokemon or Trainer has an Injury, they can naturally heal from a single Injury if they go 24 hours without gaining any new injuries." (`core/07-combat.md`, lines 2004-2005)
- **Implementation (before fix):** Both character and Pokemon endpoints set `lastInjuryTime: newInjuries > 0 ? new Date() : null` after natural healing, resetting the 24h timer each time an injury was healed. With 3 injuries, a character would need 72h (3 x 24h) to heal all three naturally.
- **Implementation (after fix):** Changed to `...(newInjuries === 0 ? { lastInjuryTime: null } : {})` — healing does not touch the timer. Timer only clears to null when all injuries reach 0.
- **Status:** CORRECT
- **Rationale:** The 24h condition tracks when injuries are **gained**, not healed. The timer is correctly set at the gain site (`entity-update.service.ts:96`, `lastInjuryTime: injuryGained ? new Date() : undefined`). The fix ensures healing (which is not gaining) does not reset this timer. Once 24h pass without new injuries, a character can heal multiple injuries in succession up to the 3/day cap.

### 2. Natural Injury Healing Daily Cap

- **Rule:** "This is subject to the limitations on healing Injuries each day." and "Pokemon Centers can remove a maximum of 3 Injuries per day; Injuries cured through natural healing, Bandages, or Features count toward this total." (`core/07-combat.md`, lines 2007-2008 and 2026-2028)
- **Implementation:** Both endpoints check `injuriesHealedToday >= 3` before allowing natural healing, and increment the counter after each heal. `shouldResetDailyCounters()` resets at day boundary.
- **Status:** CORRECT
- **Rationale:** The 3/day cap from all sources is correctly enforced. The fix does not alter this logic.

### 3. Drain AP Path Consistency

- **Rule:** "Trainers can also remove Injuries as an Extended Action by Draining 2 AP." (`core/07-combat.md`, lines 2006-2007)
- **Implementation:** The drain_ap path in `characters/[id]/heal-injury.post.ts` (lines 64-78) already uses `...(newInjuries === 0 ? { lastInjuryTime: null } : {})` (from prior commit `a84e7fd`). The natural healing path now matches this pattern.
- **Status:** CORRECT
- **Rationale:** Both healing paths now use the same timer-handling pattern: don't touch `lastInjuryTime` unless all injuries are healed, in which case clear to null. Consistent with the principle that healing is not gaining.

### 4. Pokemon Center AP Restoration (ptu-rule-035)

- **Rule (Pokemon Centers):** "In a mere hour, Pokemon Centers can heal Trainers and Pokemon back to full health, heal all Status Conditions, and restore the Frequency of Daily-Frequency Moves." (`core/07-combat.md`, lines 2016-2020) — drained AP is **not listed**.
- **Rule (Extended Rest):** "Extended Rests are rests that are at least 4 continuous hours long. Extended rests completely remove Persistent Status Conditions, and restore a Trainer's Drained AP." (`core/07-combat.md`, lines 2009-2011) — drained AP is an **Extended Rest** benefit only.
- **Implementation (before original ticket):** `drainedAp: 0` unconditionally — every Pokemon Center visit restored AP.
- **Implementation (after fix):** `const meetsExtendedRest = timeResult.totalTime >= 240` then `...(meetsExtendedRest ? { drainedAp: 0 } : {})` — AP restored when healing time reaches 4+ hours.
- **Status:** INCORRECT
- **Severity:** HIGH
- **Fix:** See ptu-rule-038. Pokemon Centers and Extended Rests are separate mechanics in PTU. A Pokemon Center visit is described as using "expensive and advanced machinery to heal Pokemon" — it is a medical procedure, not a rest. The PTU explicitly enumerates what Pokemon Centers provide (full HP, status cure, daily move restore, up to 3 injuries). Drained AP is not in that list. Extended Rest is described separately and has its own distinct benefit list. Time spent at a Pokemon Center does not count as resting. The conditional `totalTime >= 240` logic must be removed entirely — Pokemon Centers should **never** restore drained AP regardless of visit duration.

### 5. Pokemon Center Time Calculation

- **Rule:** "For each Injury on the Trainer or Pokemon, Healing takes an additional 30 minutes. If the Trainer or Pokemon has five or more Injuries, it takes one additional hour per Injury instead." (`core/07-combat.md`, lines 2021-2025)
- **Implementation:** `calculatePokemonCenterTime()` uses base 60min + 30min/injury (< 5) or 60min/injury (5+). Called with `character.injuries` (pre-healing count).
- **Status:** CORRECT
- **Rationale:** Using pre-healing injury count for time calculation is correct per PTU — time is based on injuries present, not injuries healed.

## Summary

- Mechanics checked: 5
- Correct: 4
- Incorrect: 1
- Needs review: 0

## Rulings

### Ruling 1: Pokemon Center visits never qualify as Extended Rests

**Question:** When a Pokemon Center visit exceeds 4 hours due to injury penalties, does this qualify as an Extended Rest (restoring drained AP)?

**Ruling:** **No.** PTU treats Pokemon Centers and Extended Rests as separate mechanics with separately enumerated benefits. A Pokemon Center visit is a medical procedure ("expensive and advanced machinery"), not a rest. The PTU explicitly lists what each mechanic provides:

- **Pokemon Center** (lines 2015-2028): full HP, all status conditions, daily move frequency, up to 3 injuries
- **Extended Rest** (lines 2009-2014): persistent status conditions removed, drained AP restored, daily moves regained

These are independent benefit lists. Duration overlap does not merge them. A trainer who spends 8 hours at a Pokemon Center and wants their AP restored must separately take an Extended Rest.

## Verdict

**CHANGES_REQUIRED** — ptu-rule-034 (commit `658f0fa`) is correct and approved. ptu-rule-035 (commit `5198d2e`) partially correct: the unconditional AP restore was rightly removed, but the conditional `totalTime >= 240` fallback still incorrectly restores AP during long visits. Pokemon Centers never restore drained AP. See ptu-rule-038 for the required fix.

## Required Changes

1. **Remove conditional AP restoration from Pokemon Center endpoint** — `pokemon-center.post.ts` must never set `drainedAp: 0`. Remove the `meetsExtendedRest` variable and the `...(meetsExtendedRest ? { drainedAp: 0 } : {})` spread entirely. Also remove the `apRestored` calculation and response field, or hardcode it to 0. (`core/07-combat.md`, lines 2015-2028 — AP not listed in Pokemon Center benefits.) Filed as **ptu-rule-038**.
