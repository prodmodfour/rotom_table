---
ticket_id: refactoring-008
priority: P1
categories:
  - LLM-MAGIC
  - PTU-INCORRECT
affected_files:
  - app/constants/statusConditions.ts
  - app/utils/captureRate.ts
  - app/composables/useCapture.ts
  - app/types/combat.ts
estimated_scope: small
status: resolved
created_at: 2026-02-16T22:00:00
origin: rules-review-005
---

## Summary

Sleep/Asleep is classified as a Persistent condition in the code, but PTU 1.05 p.247 explicitly lists it under "Volatile Afflictions" with a full condition entry (lines 1626-1640). This misclassification affects three game mechanics: Take a Breather won't cure Sleep, capture rate gives +10 instead of +5, and Poke Ball recall won't clear it.

## Findings

### Finding 1: PTU-INCORRECT — Sleep classified as Persistent instead of Volatile

- **Metric:** 1 condition in wrong category, affecting 3 game mechanics
- **Threshold:** Any misclassified condition that changes game outcomes
- **Impact:**
  1. **Breather:** `BREATHER_CURED_CONDITIONS` spreads `VOLATILE_CONDITIONS`. Since Asleep is in `PERSISTENT_CONDITIONS`, Take a Breather won't cure Sleep — but per p.245 it should cure "all Volatile Status effects."
  2. **Capture rate:** Persistent conditions give `+10` to capture rate, Volatile give `+5` (p.213). Asleep currently gives +10 instead of the correct +5, overcharging by 5 points.
  3. **Recall:** Volatile conditions are cured by Poke Ball recall (p.247 lines 1578-1579); Persistent are not (p.246 line 1529). Sleep should be cured by recall.
- **Evidence:**
  - `constants/statusConditions.ts:8` — `PERSISTENT_CONDITIONS` includes `'Asleep'`
  - `utils/captureRate.ts:16-17` — local `PERSISTENT_CONDITIONS` includes `'Asleep'` (duplicated list, gives +10)
  - `composables/useCapture.ts:146` — local `persistentConditions` includes `'Asleep'` (duplicated list, gives +10)

### Finding 2: LLM-MAGIC — Duplicated condition lists in capture files

- **Metric:** 2 additional files define their own persistent/volatile arrays
- **Threshold:** Same constant defined in 2+ files
- **Impact:** Already flagged by code-review-005 MEDIUM #1. The Sleep fix must be applied in all 3 locations or the lists will diverge. This finding compounds refactoring-006's original rationale.
- **Evidence:**
  - `utils/captureRate.ts:16-23` — local `PERSISTENT_CONDITIONS` and `VOLATILE_CONDITIONS`
  - `composables/useCapture.ts:146-147` — local `persistentConditions` and `volatileConditions`
  - Canonical source: `constants/statusConditions.ts:7-14`

## PTU Rulebook Evidence

**Volatile Afflictions section (p.247, `core/07-combat.md` lines 1577-1644):**
> Volatile Afflictions are cured completely at the end of the encounter, and from Pokémon by recalling them into their Poké Balls.

Sleep entry (lines 1626-1640):
> Sleep: Sleeping Trainers and Pokémon receive no bonuses from Evasion, and cannot take actions except for Free and Swift Actions that would cure Sleep (ex: activating the Shed Skin Ability). At the end of the sleeper's turns, they may make a DC 16 Save Check to wake up.

**Persistent Afflictions section (p.246, lines 1528-1536):**
> Persistent Afflictions are retained even if the Pokémon is recalled into its Poké Ball. Sleeping Pokémon will naturally awaken given time...

The mention of "Sleeping" in the Persistent intro describes the waking mechanism — it does not classify Sleep as Persistent. The explicitly enumerated Persistent conditions are: Burned, Frozen, Paralyzed, Poisoned, Badly Poisoned.

**Game Logic Reviewer ruling (rules-review-005):** "Sleep IS Volatile per PTU 1.05."

## Suggested Refactoring

1. Move `'Asleep'` from `PERSISTENT_CONDITIONS` to `VOLATILE_CONDITIONS` in `constants/statusConditions.ts`
2. Update `utils/captureRate.ts` local lists to match (or better: import from canonical source per code-review-005 MEDIUM #1)
3. Update `composables/useCapture.ts` local lists to match (or import)
4. Verify `types/combat.ts` `StatusCondition` union type doesn't need changes (Asleep is already in the union)
5. Add or update e2e test: breather should cure Asleep
6. Update capture rate test: Asleep should contribute +5, not +10

Estimated commits: 1-2

## Related Lessons

- rules-review-005: Sleep ruling with full PTU evidence chain
- code-review-005 MEDIUM #1: capture file duplication (same refactoring surface)

## Resolution Log
- Commits: `63fe747` — fix: reclassify Sleep as Volatile and deduplicate condition lists
- Files changed:
  - `app/constants/statusConditions.ts` — moved 'Asleep' from PERSISTENT_CONDITIONS to VOLATILE_CONDITIONS
  - `app/utils/captureRate.ts` — removed duplicated condition arrays, now imports from canonical source
  - `app/composables/useCapture.ts` — removed duplicated condition arrays, now imports from canonical source
- New files created: none
- Tests passing: 446/447 (1 pre-existing failure in settings.test.ts unrelated to this change)
- Verified: `types/combat.ts` StatusCondition union type needs no changes (Asleep already present, union is uncategorized)
- Impact: Sleep capture rate modifier corrected from +10 → +5; Take a Breather now cures Sleep; condition lists are single-source-of-truth
- Review follow-up (code-review-010):
  - `3842bc7` — fix: deduplicate persistent conditions list in restHealing.ts (replaced local PERSISTENT_STATUS_CONDITIONS with import from canonical source)
  - `b15f234` — test: add Asleep volatile (+5) assertion to capture status modifiers spec
  - Files changed: `app/utils/restHealing.ts`, `app/tests/e2e/scenarios/capture/capture-mechanic-status-modifiers-001.spec.ts`
