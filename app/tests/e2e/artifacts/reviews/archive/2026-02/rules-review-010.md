---
review_id: rules-review-010
target: refactoring-008
ticket_id: refactoring-008
verdict: APPROVED
reviewer: game-logic-reviewer
date: 2026-02-16
commits_reviewed:
  - 63fe747
  - 3842bc7
  - b15f234
files_reviewed:
  - app/constants/statusConditions.ts
  - app/utils/captureRate.ts
  - app/composables/useCapture.ts
  - app/utils/restHealing.ts
  - app/tests/e2e/scenarios/capture/capture-mechanic-status-modifiers-001.spec.ts
  - app/server/api/encounters/[id]/breather.post.ts
trigger: refactoring-review
---

## Summary

Three commits reclassify Sleep from Persistent to Volatile, deduplicate condition lists across 4 files to a single canonical source, and add a regression test for Asleep capture rate. All changes verified correct against PTU 1.05.

## Mechanics Verified

### 1. Sleep Classification (Persistent vs Volatile)

- **Rule:** PTU 1.05 p.247 (core/07-combat.md lines 1577-1640). The Volatile Afflictions section enumerates Sleep at lines 1626-1640: "Sleep: Sleeping Trainers and Pokemon receive no bonuses from Evasion..." The Persistent Afflictions section (p.246 lines 1528-1536) enumerates exactly 5 conditions: Burned, Frozen, Paralyzed, Poisoned, Badly Poisoned. The mention of "Sleeping Pokemon" in the Persistent intro (line 1530) describes waking mechanics, not classification.
- **Implementation:** `statusConditions.ts:7-8` — `PERSISTENT_CONDITIONS = ['Burned', 'Frozen', 'Paralyzed', 'Poisoned', 'Badly Poisoned']` (no Asleep). `statusConditions.ts:11-12` — `VOLATILE_CONDITIONS` includes `'Asleep'` as first entry.
- **Status:** CORRECT
- **Lesson applied:** Lesson 1 — verified against enumerated lists, not narrative descriptions.

### 2. Capture Rate — Asleep Status Modifier

- **Rule:** PTU 1.05 p.213 (core/05-pokemon.md lines 1732-1733): "Persistent Conditions add +10 to the Pokemon's Capture Rate; Injuries and Volatile Conditions add +5."
- **Implementation:** `captureRate.ts:114-117` — Persistent conditions add +10, Volatile conditions add +5. Since Asleep is now in `VOLATILE_CONDITIONS`, it contributes +5 instead of the previous incorrect +10.
- **Status:** CORRECT
- **Cross-check:** Verified against all 3 PTU worked examples (p.213-214):
  - Pikachu L10, 70% HP, Confused: 100 - 20 - 15 + 0 + 5 = 70 (matches)
  - Caterpie L30, 40% HP, Shiny, 1 injury: 100 - 60 + 0 + 10 - 10 + 5 = 45 (matches)
  - Hydreigon L80, 1 HP, Burned+Poisoned+1 injury: 100 - 160 + 30 - 10 + 10 + 10 + 5 = -15 (matches)

### 3. Take a Breather — Sleep Cure

- **Rule:** PTU 1.05 p.245 (core/07-combat.md lines 1458-1461): "When a Trainer or Pokemon Takes a Breather, they set their Combat Stages back to their default level, lose all Temporary Hit Points, and are cured of all Volatile Status effects and the Slow and Stuck conditions."
- **Implementation:** `breather.post.ts:16-20` — `BREATHER_CURED_CONDITIONS = [...VOLATILE_CONDITIONS, 'Slowed', 'Stuck']`. Since `VOLATILE_CONDITIONS` now includes `'Asleep'`, Take a Breather correctly cures Sleep.
- **Status:** CORRECT

### 4. Rest Healing — Persistent Condition Clearing

- **Rule:** Extended rest cures Persistent afflictions. Volatile afflictions are already cleared at end of encounter (PTU p.247 line 1578) and by Poke Ball recall.
- **Implementation:** `restHealing.ts:120-123` — `getStatusesToClear()` filters against `PERSISTENT_CONDITIONS` (now imported from canonical source). Since Asleep is no longer in `PERSISTENT_CONDITIONS`, it won't be flagged for extended rest clearing. Correct — Sleep is Volatile, cleared by encounter end/recall, not by rest.
- **Status:** CORRECT

### 5. Persistent Conditions List Completeness

- **Rule:** PTU 1.05 p.246 enumerates: Burned, Frozen, Paralyzed, Poisoned (with Badly Poisoned variant at line 1566).
- **Implementation:** `['Burned', 'Frozen', 'Paralyzed', 'Poisoned', 'Badly Poisoned']`
- **Status:** CORRECT — All 5 present, no extras.

### 6. Test Assertion Math (New Assertion 5)

- **Test:** `capture-mechanic-status-modifiers-001.spec.ts` assertion 5: Oddish L10, 50% HP (20/40), Asleep. Expects `statusModifier = 5`, `captureRate = 95`.
- **Math:** base(100) + level(-20) + HP(0, 50%) + evolution(+10, 2 remaining) + Asleep(+5, volatile) = 95
- **Status:** CORRECT

### 7. Condition List Deduplication

- **Before:** 4 files defined their own persistent/volatile arrays — `statusConditions.ts`, `captureRate.ts`, `useCapture.ts`, `restHealing.ts`. The local copies in the latter 3 still classified Asleep as Persistent.
- **After:** All 3 consumer files now import from `constants/statusConditions.ts`. Verified by code-review-011 codebase grep: zero remaining local condition arrays.
- **Status:** CORRECT — Single source of truth achieved.

## Pre-Existing Issues (Out of Scope)

The canonical `VOLATILE_CONDITIONS` list still contains `'Encored'`, `'Taunted'`, `'Tormented'` — phantom conditions not present in PTU 1.05 (the actual moves Encore/Taunt/Torment inflict existing conditions like Confused/Suppressed/Enraged). This is tracked by **refactoring-009** and was not introduced by these commits.

## Summary

| Metric | Value |
|--------|-------|
| Mechanics checked | 7 |
| Correct | 7 |
| Incorrect | 0 |
| Needs review | 0 |
| New issues found | 0 |

## Verdict

**APPROVED** — All three commits correctly implement PTU 1.05 rules. Sleep is properly reclassified as Volatile per p.247 enumerated list. The three downstream mechanics affected (capture rate +5, breather cure, rest healing exclusion) are all correct. Test assertion math verified. No new PTU issues introduced.

## PTU References

- PTU 1.05 p.246 (core/07-combat.md lines 1528-1568): Persistent Afflictions enumerated list
- PTU 1.05 p.247 (core/07-combat.md lines 1577-1644): Volatile Afflictions enumerated list, Sleep entry
- PTU 1.05 p.245 (core/07-combat.md lines 1447-1464): Take a Breather — cures all Volatile + Slow/Stuck
- PTU 1.05 p.213-214 (core/05-pokemon.md lines 1718-1741): Capture Rate formula and worked examples
