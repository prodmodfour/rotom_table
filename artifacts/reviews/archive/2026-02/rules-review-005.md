---
review_id: rules-review-005
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: refactoring-006
domain: combat
commits_reviewed:
  - 767e6f3
  - a95b67e
mechanics_verified:
  - take-a-breather
  - volatile-conditions-classification
  - persistent-conditions-classification
  - breather-cured-conditions
  - combat-stage-reset
  - temporary-hp-removal
  - capture-rate-status-classification
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 2
ptu_refs:
  - core/07-combat.md#Take a Breather (p.245)
  - core/07-combat.md#Volatile Afflictions (p.247)
  - core/07-combat.md#Persistent Afflictions (p.246)
  - core/07-combat.md#Other Afflictions (p.248)
  - core/10-indices-and-reference.md#Taunt
  - core/10-indices-and-reference.md#Torment
  - core/10-indices-and-reference.md#Encore
  - core/05-pokemon.md#Calculating Capture Rates (p.213)
reviewed_at: 2026-02-16T22:00:00
---

## Review Scope

Reviewed commits 767e6f3 (refactor: deduplicate constants and fix volatile conditions in breather) and a95b67e (test: add Slowed+Stuck breather test and fix stale comment) for PTU 1.05 rules correctness. Focus areas: Take a Breather mechanic, volatile/persistent condition classifications, and downstream impact on capture rate calculations.

## Mechanics Verified

### Take a Breather — Conditions Cured

- **Rule:** "When a Trainer or Pokémon Takes a Breather, they set their Combat Stages back to their default level, lose all Temporary Hit Points, and are cured of all Volatile Status effects and the Slow and Stuck conditions." (`core/07-combat.md` p.245, lines 1458-1461)
- **Implementation:** `BREATHER_CURED_CONDITIONS = [...VOLATILE_CONDITIONS, 'Slowed', 'Stuck']` — iterates entity's `statusConditions`, removes any matching `BREATHER_CURED_CONDITIONS`, keeps the rest.
- **Status:** CORRECT
- **Notes:** Clean separation between the two rule sources (volatile list from p.247, Slowed+Stuck named explicitly on p.245). The previous implementation only cleared 5 conditions (Confused, Cursed, Enraged, Suppressed, Flinched) — now correctly clears all 10 volatile + 2 other = 12 total.

### Take a Breather — Combat Stage Reset

- **Rule:** "set their Combat Stages back to their default level" (`core/07-combat.md` p.245, line 1459)
- **Implementation:** `entity.stageModifiers = createDefaultStageModifiers()` — replaces all stages with zeroed object. Imported from `combatant.service.ts` (was previously a local `DEFAULT_STAGES` constant).
- **Status:** CORRECT

### Take a Breather — Temporary HP Removal

- **Rule:** "lose all Temporary Hit Points" (`core/07-combat.md` p.245, lines 1459-1460)
- **Implementation:** `entity.temporaryHp = 0` when `entity.temporaryHp > 0`. Tracks amount removed in `result.tempHpRemoved`.
- **Status:** CORRECT

### Take a Breather — Tripped and Vulnerable

- **Rule:** "They then become Tripped and are Vulnerable until the end of their next turn." (`core/07-combat.md` p.245, lines 1456-1457)
- **Implementation:** Pushes `'Tripped'` and `'Vulnerable'` to `combatant.tempConditions` (temporary, cleared on next turn). Avoids duplicates.
- **Status:** CORRECT

### Take a Breather — Full Action

- **Rule:** "Taking a Breather is a Full Action" (`core/07-combat.md` p.245, lines 1452-1453)
- **Implementation:** Sets `combatant.turnState.standardActionUsed = true` and `combatant.turnState.hasActed = true`.
- **Status:** CORRECT

### Volatile Conditions Classification — Enraged and Suppressed

- **Rule:** p.247 lists under "Volatile Afflictions": Rage/Enraged (line 1606: "While enraged, the target must use a Damaging Physical or Special Move or Struggle Attack") and Suppressed (line 1641: "While Suppressed, Pokémon and Trainers cannot benefit from PP Ups").
- **Implementation:** Commit 767e6f3 adds `'Enraged'` and `'Suppressed'` to `VOLATILE_CONDITIONS` in `constants/statusConditions.ts`, and moves `'Suppressed'` out of `OTHER_CONDITIONS`.
- **Status:** CORRECT — Both are explicitly listed under the "Volatile Afflictions" section header on p.247.

### Breather Test Coverage (a95b67e)

- **Rule:** Slowed and Stuck are "Other Afflictions" (p.248) that are explicitly cured by breather (p.245).
- **Implementation:** New test applies Slowed + Stuck, calls breather, asserts both appear in `conditionsCured` and neither remains in `statusConditions` post-breather. Comment correctly distinguishes these as "Other Afflictions, not Volatile."
- **Status:** CORRECT

## Pre-Existing Issues (Not Introduced by This Refactoring)

### MEDIUM #1: Sleep/Asleep Classified as Persistent — Should Be Volatile

PTU p.247 explicitly lists Sleep under the "Volatile Afflictions" section (lines 1626-1640) with a full entry describing save checks, wake-on-damage, and interactions with other conditions. The Persistent section (p.246) mentions "Sleeping Pokémon will naturally awaken given time" (line 1530) as a note on the curing mechanism — it does not classify Sleep as Persistent. The actual enumerated Persistent conditions are: Burned, Frozen, Paralyzed, Poisoned, Badly Poisoned.

The code classifies `'Asleep'` as Persistent (`constants/statusConditions.ts:8`). This predates refactoring-006.

**Impact:**
1. **Breather:** Sleep/Asleep should be cured by Take a Breather (currently not, since it's in `PERSISTENT_CONDITIONS` instead of `VOLATILE_CONDITIONS`)
2. **Capture rate:** Sleep gives `+10` (Persistent modifier) instead of `+5` (Volatile modifier) — overcharges by 5 points per PTU p.213: "Persistent Conditions add +10 to the Pokémon's Capture Rate; Injuries and Volatile Conditions add +5."
3. **Recall:** Volatile conditions are cured by recalling into a Poke Ball (p.1578-1579); Persistent are not (p.1529). Sleep should be cured by recall.

**Ruling:** Sleep IS Volatile per PTU 1.05. Recommend a separate ticket to reclassify.

### MEDIUM #2: Encored, Taunted, Tormented Are Not PTU 1.05 Conditions

The `VOLATILE_CONDITIONS` array includes `'Encored'`, `'Taunted'`, and `'Tormented'`. These are not PTU 1.05 status conditions. In PTU, the moves that bear these names inflict existing conditions:

- **Taunt** → inflicts Enraged (`core/10-indices-and-reference.md` line 4357: "The target becomes Enraged.")
- **Torment** → inflicts Suppressed (`core/10-indices-and-reference.md` line 4388: "The target becomes Suppressed.")
- **Encore** → inflicts Confused, Suppressed, or Enraged (random roll, `core/10-indices-and-reference.md` lines 7923-7926)

These may be intentional app design choices (tracking the *source* move rather than the *resulting* condition). This predates refactoring-006 and does not affect the correctness of the breather fix — these three conditions are in `VOLATILE_CONDITIONS` either way, so breather would correctly cure them if applied.

**Impact:** Low — functionally harmless for breather. If a Pokemon is inflicted with "Taunted" via the app UI, breather correctly clears it. The only concern is if these conditions ever need to interact differently from their PTU equivalents. Recommend clarification ticket.

## Summary

- Mechanics checked: 7
- Correct: 7
- Incorrect: 0
- Needs review: 0
- Pre-existing issues flagged: 2 (MEDIUM)

## Rulings

- **Sleep is Volatile per PTU 1.05.** p.247 places Sleep under the "Volatile Afflictions" header with a full condition entry (lines 1626-1640). The mention of sleeping in the Persistent intro (p.246, line 1530) describes the waking mechanism, not the classification. All other conditions in the Volatile section are unambiguously volatile. Recommend reclassifying `'Asleep'` from `PERSISTENT_CONDITIONS` to `VOLATILE_CONDITIONS` in a separate ticket, with cascade fixes to capture rate and recall behavior.

- **Cursed has a conditional cure rule not enforced by the app.** p.245 lines 1462-1464: "To be cured of Cursed in this way, the source of the Curse must either be Knocked Out or no longer within 12 meters at the end of the Shift triggered by Take a Breather." The code unconditionally clears Cursed. This is a reasonable gameplay simplification (would require tracking curse source per combatant) and is pre-existing. Noted for completeness.

## Verdict

**APPROVED** — All 7 mechanics verified correct against PTU 1.05. The Volatile classification corrections (Enraged, Suppressed) match p.247. The expanded breather conditions (adding Slowed + Stuck) match p.245. Test coverage for the new Slowed+Stuck behavior is complete. Two pre-existing classification issues (Sleep, Encored/Taunted/Tormented) flagged for separate tickets — they do not affect the correctness of this refactoring.

## Required Changes

(none — APPROVED)

## Recommended Follow-Up Tickets

1. **Sleep reclassification** — Move `'Asleep'` from `PERSISTENT_CONDITIONS` to `VOLATILE_CONDITIONS`. Update `captureRate.ts` (and duplicate in `useCapture.ts`) to give Sleep `+5` instead of `+10`. Verify recall and end-of-encounter behavior. Severity: MEDIUM.
2. **Encored/Taunted/Tormented audit** — Decide whether these should remain as distinct conditions or be removed in favor of the PTU conditions they map to (Enraged, Suppressed, Confused). Check all code paths that apply or check these conditions. Severity: LOW.
