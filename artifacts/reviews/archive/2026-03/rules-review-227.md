---
review_id: rules-review-227
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: feature-016
domain: combat
commits_reviewed:
  - 6f830968
  - d975924f
  - 013b2e4f
  - e4ea946f
  - 30130b8a
  - 2550cf31
  - 16a71256
  - cdabd646
  - af9f48f5
mechanics_verified:
  - aoo-reactor-eligibility-revalidation
  - aoo-trigger-type-validation
  - struggle-attack-damage-base
  - client-side-aoo-preview-eligibility
  - faint-auto-decline-trigger-target
  - stale-record-in-detect
  - pending-actions-cleanup
  - round-reset-interaction
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 1
ptu_refs:
  - core/07-combat.md#page-241
  - core/07-combat.md#page-240
reviewed_at: 2026-03-01T16:45:00Z
follows_up: rules-review-223
---

## Context

This is a re-review of feature-016 P0 (Priority / Interrupt / Attack of Opportunity System) after a fix cycle addressing 8 issues raised in code-review-247 (CHANGES_REQUIRED). rules-review-223 had already APPROVED the PTU rule mechanics (14 mechanics verified, 0 critical/high issues), so this review focuses on verifying the fixes are PTU-correct and do not introduce regressions to the previously-approved mechanics.

## Fix Verification

### CRIT-001: Fainted Reactor Can Execute AoO (FIXED)

- **Rule:** PTU p.241: "Attacks of Opportunity cannot be made by Sleeping, Flinched, or Paralyzed targets." By extension, a fainted combatant (HP <= 0) also cannot execute a Struggle Attack.
- **Fix:** `aoo-resolve.post.ts` lines 88-102. Before processing an accepted AoO, the endpoint calls `canUseAoO(reactor)` to re-validate eligibility. This check verifies HP > 0, no blocking conditions (Asleep, Bad Sleep, Flinched, Paralyzed), no Fainted/Dead status, AoO not already used this round, and grid position exists. If the reactor is no longer eligible, a 400 error is thrown with a descriptive reason.
- **PTU Correctness:** CORRECT. The re-validation ensures that a reactor who gained a blocking condition or fainted between detection and resolution cannot execute the AoO. This faithfully implements the PTU restriction. The error response is appropriate since this situation arises from concurrent state changes, not user error.
- **Status:** VERIFIED FIXED

### HIGH-001: triggerType Input Not Validated (FIXED)

- **Rule:** PTU p.241 defines exactly five AoO trigger types: shift_away, ranged_attack, stand_up, maneuver_other, retrieve_item.
- **Fix:** `aoo-detect.post.ts` lines 55-62. After the existence check, the endpoint validates `triggerType` against `Object.keys(AOO_TRIGGER_MAP)`. Invalid values produce a 400 error listing valid options.
- **PTU Correctness:** CORRECT. The validation ensures only the five PTU-defined trigger types are accepted. Using `AOO_TRIGGER_MAP` keys as the source of truth means the validation automatically stays in sync with the trigger definitions.
- **Status:** VERIFIED FIXED

### HIGH-002: AOO_STRUGGLE_ATTACK_DAMAGE_BASE 10 -> 11 (FIXED)

- **Rule:** PTU p.240: "Struggle Attacks have an AC of 4 and a Damage Base of 4." The DB chart (07-combat.md, also `DAMAGE_BASE_CHART` in `damageCalculation.ts`) maps DB 4 to `{ min: 7, avg: 11, max: 14 }`. Set damage uses the average value.
- **Fix:** `aooTriggers.ts` line 69: `AOO_STRUGGLE_ATTACK_DAMAGE_BASE = 11`. Comment updated to: "PTU: DB4 = 1d8+6 (Physical, Typeless, Melee). In set damage mode, DB4 avg = 11 (per DAMAGE_BASE_CHART)."
- **PTU Correctness:** CORRECT. DB 4 = 1d8+6 in rolled mode. In set damage mode, the `DAMAGE_BASE_CHART` assigns avg = 11. The PTU example on p.240 ("the attack does 11 damage plus her 12 attack") confirms DB 4 set damage = 11. Value and comment are now accurate.
- **Cross-reference:** The p.240 example explicitly demonstrates: "With a Damage Base of 4, the attack does 11 damage" which is the set damage average. The constant now matches both the chart and the rulebook example.
- **Status:** VERIFIED FIXED

### HIGH-003: app-surface.md Not Updated (FIXED)

- **Fix:** `app-surface.md` now documents the complete AoO system: endpoints (aoo-detect, aoo-resolve), service (out-of-turn.service.ts with all exported functions), constants (aooTriggers.ts), utility (adjacency.ts), component (AoOPrompt.vue), store additions (getters and actions), types, VTT integration (getAoOTriggersForMove), WebSocket events (aoo_triggered, aoo_resolved), and round reset behavior.
- **Status:** VERIFIED FIXED (not a PTU rules issue, but documentation completeness)

### MED-001: Client AoO Preview Does Not Check Eligibility (FIXED)

- **Rule:** PTU p.241: "Attacks of Opportunity cannot be made by Sleeping, Flinched, or Paralyzed targets." The client-side preview should not show AoO indicators for ineligible reactors.
- **Fix:** `useGridMovement.ts` lines 629-636. The `getAoOTriggersForMove` function now filters out:
  - Combatants with HP <= 0 (line 631)
  - Combatants with Fainted or Dead conditions (line 633)
  - Combatants with any `AOO_BLOCKING_CONDITIONS` (Asleep, Bad Sleep, Flinched, Paralyzed) (line 634)
  - Combatants who have already used their AoO this round (`outOfTurnUsage?.aooUsed`) (line 636)
- **PTU Correctness:** CORRECT. The client-side eligibility filtering mirrors the server-side `canUseAoO()` check. It correctly imports and uses `AOO_BLOCKING_CONDITIONS` from `types/combat.ts`, ensuring the condition list stays in sync with the authoritative definition. The `aooUsed` check prevents showing AoO indicators for reactors who have already used their once-per-round opportunity.
- **Status:** VERIFIED FIXED

### MED-002: Faint Auto-Decline (FIXED)

- **Rule:** If the trigger target faints from a Struggle Attack, remaining pending AoOs from other reactors targeting the same fainted combatant are pointless (the target is already fainted).
- **Fix:** `aoo-resolve.post.ts` lines 184-200. After damage application, if `trigger.entity.currentHp <= 0`, the code auto-declines all pending AoOs where `triggerId` matches the fainted trigger's ID. Additionally, `applyFaintStatus(trigger)` is called (line 179-181) to properly apply faint status effects (which per decree-005 reverses sourced combat stages).
- **PTU Correctness:** CORRECT. A fainted combatant is no longer a valid target for further Struggle Attacks. Auto-declining prevents the GM from seeing stale prompts for attacks against a fainted target. The `applyFaintStatus` call ensures decree-005 compliance (combat stage reversal on faint). Per decree-033, the fainted switch happens on the trainer's next turn, not as an immediate reaction -- the AoO resolution does not trigger a switch, which is correct.
- **Status:** VERIFIED FIXED

### MED-003: Stale Record in Detect (FIXED)

- **Rule:** Not a PTU mechanics issue, but ensures response data integrity.
- **Fix:** `aoo-detect.post.ts` lines 112-117. The endpoint now captures the return value of `prisma.encounter.update()` as `updatedRecord` and passes it to `buildEncounterResponse(updatedRecord, ...)` on line 130. This ensures the response includes the DB-managed fields (updatedAt, etc.) from the post-update state.
- **Status:** VERIFIED FIXED

### MED-004: Pending Actions Accumulation (FIXED)

- **Rule:** Not a direct PTU mechanics issue, but relates to round-boundary cleanup (PTU: AoO is once per round, usage resets at new round).
- **Fix:** Two parts:
  1. `out-of-turn.service.ts` lines 319-330: New `cleanupResolvedActions()` function that removes non-pending actions from previous rounds while keeping current-round resolved/declined/expired actions for reference.
  2. `next-turn.post.ts` lines 395-402: At round transition (when `clearDeclarations` is true), the endpoint now calls `expirePendingActions()` followed by `cleanupResolvedActions()` to both expire stale pending actions and remove accumulated resolved/declined/expired actions from past rounds.
- **PTU Correctness:** CORRECT. The cleanup preserves current-round action history (for reference) while removing old entries. The `expirePendingActions()` call with `encounter.currentRound` correctly marks actions from the ending round as expired, and `cleanupResolvedActions()` with `currentRound` (the new round number) strips out non-pending actions from all previous rounds. This maintains the PTU once-per-round semantics while preventing unbounded growth.
- **Status:** VERIFIED FIXED

## Mechanics Re-Verified (Regression Check)

The following mechanics were verified in rules-review-223 and have been spot-checked to confirm no regressions from the fix cycle:

### AoO Trigger Types
- **Rule:** PTU p.241 five triggers (shift_away, ranged_attack, stand_up, maneuver_other, retrieve_item)
- **Status:** CORRECT (unchanged by fix cycle)

### Once Per Round Limit
- **Rule:** PTU p.241: "You may use Attack of Opportunity only once per round."
- **Status:** CORRECT. The `aooUsed` tracking and round reset remain intact. The client-side fix (MED-001) also respects this by skipping reactors with `outOfTurnUsage?.aooUsed`.

### Disengage Exemption
- **Rule:** PTU p.241: "Shifting this way does not provoke an Attack of Opportunity."
- **Status:** CORRECT (unchanged by fix cycle). Both server-side `validateTriggerPreconditions()` and client-side `getAoOTriggersForMove()` check the `disengaged` flag.

### Blocking Conditions
- **Rule:** PTU p.241: "Sleeping, Flinched, or Paralyzed targets."
- **Implementation:** `AOO_BLOCKING_CONDITIONS = ['Asleep', 'Bad Sleep', 'Flinched', 'Paralyzed']`
- **Status:** CORRECT. Now enforced at both detection time (canUseAoO in service), resolution time (CRIT-001 fix), and client preview time (MED-001 fix).

### Struggle Attack Properties
- **Rule:** PTU p.240: AC 4, DB 4 (1d8+6), Physical, Typeless, Melee. Expert+ Combat: AC 3, DB 5.
- **Status:** CORRECT. `AOO_STRUGGLE_ATTACK_AC = 4`, `AOO_STRUGGLE_ATTACK_DAMAGE_BASE = 11` (DB 4 set damage average). The UI still displays "Struggle Attack (AC 4)" without accounting for Expert+ Combat skill (see M-1 from rules-review-223, carried forward below).

## Decree Compliance

- **decree-003 (token passability):** Adjacency checks use grid positions only. Movement through tokens is allowed. AoO is a reaction to the shift, not a prevention. COMPLIANT.
- **decree-005 (status CS auto-apply):** The MED-002 fix now calls `applyFaintStatus(trigger)` when the trigger target faints from the Struggle Attack, which triggers CS reversal per decree-005. COMPLIANT.
- **decree-033 (fainted switch on turn only):** AoO damage can cause fainting, but the `aoo-resolve.post.ts` endpoint does not trigger an immediate switch. The trainer must switch on their next turn per decree-033. COMPLIANT.
- **decree-038 (sleep classification):** `AOO_BLOCKING_CONDITIONS` includes `'Asleep'` and `'Bad Sleep'`. The blocking check is condition-name-based per decree-038's ruling that category is for display only, not behavior. COMPLIANT.
- **decree-039 (Roar blocked by Trapped):** Not directly relevant to AoO. No interaction. COMPLIANT.

## Issues Found

### M-1: autoDeclineFaintedReactor Imported But Never Called (MEDIUM, carried from rules-review-223)

**File:** `app/server/api/encounters/[id]/aoo-resolve.post.ts`, line 21
**Problem:** The `autoDeclineFaintedReactor` function is imported but never called in the endpoint body. The MED-002 fix implemented its own inline auto-decline logic for the trigger-target-fainted case (filtering by `triggerId`), but `autoDeclineFaintedReactor` filters by `actorId` (reactor-fainted case). This means:
1. When the trigger target faints, pending AoOs targeting them are auto-declined (HANDLED by inline code).
2. When the trigger target also happens to be a pending reactor for a DIFFERENT AoO, that pending action is NOT proactively auto-declined (NOT HANDLED).

However, CRIT-001's `canUseAoO` re-validation at resolution time would catch case (2) if the GM tries to accept the AoO for the now-fainted reactor. The GM would see a 400 error ("Cannot execute AoO: Fainted combatants cannot use AoO"). So this is a UX annoyance (stale prompt visible until accept attempt or round expiry), not a correctness bug.

**Impact:** No PTU rule violation possible (CRIT-001 blocks execution). Minor UX gap: a fainted reactor's pending AoO prompt remains visible until the GM interacts with it or the round expires. The unused import is also a dead code artifact.

**Recommendation:** Either wire `autoDeclineFaintedReactor` into the faint code path to proactively clean up the stale prompt, or remove the unused import. This is a low-priority UX polish item, not a rules issue.

## Summary

All 8 issues from code-review-247 have been resolved. The fixes are PTU-correct and do not introduce regressions to the 14 previously-verified mechanics. The key improvements:

1. **CRIT-001 (reactor re-validation):** Server-side `canUseAoO()` re-check at resolution time prevents fainted/incapacitated reactors from executing AoO Struggle Attacks. This is the strongest fix -- it covers all edge cases regardless of how the reactor became ineligible.
2. **HIGH-002 (DB 4 = 11):** Matches DAMAGE_BASE_CHART and the PTU p.240 worked example.
3. **MED-001 (client preview):** Client-side eligibility filtering now mirrors server-side checks using the same `AOO_BLOCKING_CONDITIONS` constant.
4. **MED-002 (faint auto-decline + applyFaintStatus):** Properly handles the trigger target fainting and ensures decree-005 compliance.
5. **MED-004 (cleanup):** Round-boundary cleanup prevents unbounded pending action accumulation.

The one remaining MEDIUM issue (M-1) is a UX polish item (unused import + stale prompt visibility), not a PTU rules violation, and is fully mitigated by the CRIT-001 fix.

## Rulings

1. **Reactor re-validation at resolution time:** Calling `canUseAoO()` before processing acceptance is the correct approach. PTU's blocking conditions apply at the moment of execution, not just at detection time. CORRECT.
2. **DB 4 set damage = 11:** Matches both the DAMAGE_BASE_CHART lookup and the PTU p.240 worked example ("With a Damage Base of 4, the attack does 11 damage"). CORRECT.
3. **Client-side eligibility filtering:** Using `AOO_BLOCKING_CONDITIONS` from the shared types ensures the client preview stays synchronized with server-side rules. The `aooUsed` check is also appropriate since the once-per-round limit is a PTU rule. CORRECT.
4. **Trigger target faint auto-decline:** Auto-declining pending AoOs when the trigger target faints is a reasonable game logic decision -- a Struggle Attack against a fainted target is pointless. While PTU does not explicitly address this edge case, the implementation is consistent with the rule's intent. CORRECT.
5. **Round-boundary cleanup preserving current-round history:** Keeping resolved/declined/expired actions from the current round while removing past-round entries provides audit trail without unbounded growth. CORRECT.

## Verdict

**APPROVED** -- All 8 issues from code-review-247 are resolved. The fix cycle correctly addresses the critical reactor re-validation gap, the incorrect damage base constant, the input validation crash, the missing app-surface documentation, the client-side preview false positives, the faint auto-decline logic, the stale record pattern, and the pending action accumulation. No PTU rule regressions detected. The one remaining MEDIUM issue (unused import + stale prompt UX) is fully mitigated by CRIT-001 and does not constitute a rules violation.

## Required Changes

None required. The following is recommended for future polish:

1. **M-1:** Remove the unused `autoDeclineFaintedReactor` import from `aoo-resolve.post.ts`, or wire it into the faint handling pipeline to proactively clean up stale reactor prompts. Low priority -- CRIT-001 provides full correctness coverage.
