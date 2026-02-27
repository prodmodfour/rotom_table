---
review_id: rules-review-068
trigger: orchestrator-routed
target_tickets: [ptu-rule-049]
reviewed_commits: [89bdc13, 3bb0d3b]
verdict: APPROVED_WITH_NOTES
reviewed_at: 2026-02-20T12:00:00Z
reviewer: game-logic-reviewer
---

## Scope

Review of ptu-rule-049 (Capture status condition definitions): two changes to status condition handling for capture rate calculation.

1. Poisoned and Badly Poisoned no longer stack for capture bonus (+10 total, not +20)
2. Bad Sleep added as a volatile condition

**Files reviewed:**
- `app/utils/captureRate.ts` (server-side capture rate calculation)
- `app/composables/useCapture.ts` (client-side capture rate calculation)
- `app/constants/statusConditions.ts` (condition definitions and categories)
- `app/types/combat.ts` (StatusCondition type union)

**PTU sources consulted:**
- `books/markdown/core/05-pokemon.md` pp.226-227 (Calculating Capture Rates)
- `books/markdown/core/07-combat.md` pp.246-248 (Status Afflictions)
- `books/markdown/errata-2.md` (Capture Mechanic Changes)

## Mechanics Verified

### 1. Poisoned/Badly Poisoned non-stacking (commit 89bdc13) -- PASS

**PTU Rule (p.246, Persistent Afflictions):** The Poisoned entry defines Badly Poisoned as a variant within the same entry: "When Badly Poisoned, the afflicted **instead** loses 5 Hit Points..." The word "instead" confirms Badly Poisoned is an upgrade of Poisoned, not a separate persistent condition. A target is either Poisoned or Badly Poisoned, never both.

**PTU Capture Rate (p.227):** "Persistent Conditions add +10 to the Pokemon's Capture Rate." The worked example on p.227 shows Burned (+10) and Poisoned (+10) as separate persistent conditions contributing separately, but Badly Poisoned is never shown as a separate entry.

**Implementation verification:**
- `captureRate.ts` (lines 114-126): Uses `hasPoisonBonus` flag. When iterating conditions, the first of Poisoned/Badly Poisoned encountered grants +10; subsequent poison variants are skipped. Other persistent conditions (Burned, Frozen, Paralyzed) each grant +10 independently via the `else` branch.
- `useCapture.ts` (lines 155-166): Identical logic in `calculateCaptureRateLocal`. Both implementations are symmetric and correct.

**Verdict: CORRECT.** The implementation faithfully represents that Poisoned and Badly Poisoned are variants of the same affliction per PTU p.246.

### 2. Bad Sleep as volatile condition (commit 3bb0d3b) -- PASS

**PTU Rule (p.247, Volatile Afflictions):** "Bad Sleep: Whenever the user makes a Save Check to save against Sleep, they lose two ticks of Hit Points. Bad Sleep may only afflict Sleeping targets; if the target is cured of Sleep, they are also cured of Bad Sleep."

Bad Sleep is explicitly listed under the "Volatile Afflictions" header on p.247, confirming it is a volatile condition.

**Implementation verification:**
- `types/combat.ts` (line 6): `'Bad Sleep'` is in the StatusCondition type union on the volatile line.
- `statusConditions.ts` (line 12): `'Bad Sleep'` is in `VOLATILE_CONDITIONS` array.
- `statusConditions.ts` (line 37): CSS class mapping `'Bad Sleep': 'condition--sleep'` is present.
- Capture rate impact: Being in `VOLATILE_CONDITIONS`, Bad Sleep correctly contributes +5 to capture rate per the capture formula logic in both `captureRate.ts` and `useCapture.ts`.

**PTU Capture Rate (p.227):** "Volatile Conditions add +5." Bad Sleep as a volatile condition correctly grants +5.

**Verdict: CORRECT.** Bad Sleep is properly classified as volatile and correctly participates in capture rate calculation.

### 3. Persistent conditions list completeness -- PASS

**PTU p.246 Persistent Afflictions:** Burned, Frozen, Paralyzed (called "Paralysis" in header), Poisoned (with Badly Poisoned variant).

**Code `PERSISTENT_CONDITIONS`:** `['Burned', 'Frozen', 'Paralyzed', 'Poisoned', 'Badly Poisoned']`

Note: Sleep's definition entry appears in the Volatile section (p.247), though it is mentioned in the Persistent intro paragraph. A prior commit (63fe747) reclassified Sleep as Volatile, which is the correct interpretation -- the p.246 intro paragraph describes curing rules, while Sleep's actual behavior (cured by recall, cured at encounter end) matches volatile semantics.

**Verdict: CORRECT.** All persistent conditions are accounted for.

### 4. Volatile conditions list completeness -- PASS

**PTU p.247 Volatile Afflictions:** Bad Sleep, Confused, Cursed, Disabled, Rage, Flinch, Infatuation, Sleep, Suppressed, Temporary Hit Points.

**Code `VOLATILE_CONDITIONS`:** `['Asleep', 'Bad Sleep', 'Confused', 'Flinched', 'Infatuated', 'Cursed', 'Disabled', 'Enraged', 'Suppressed']`

Name mappings (rulebook -> code):
- Sleep -> Asleep (reasonable semantic mapping)
- Rage -> Enraged (reasonable semantic mapping)
- Flinch -> Flinched (reasonable semantic mapping)
- Infatuation -> Infatuated (reasonable semantic mapping)

Temporary Hit Points is correctly excluded -- PTU p.247 states "Temporary Hit Points are not 'healed' away by effects that cure Status Conditions," so it is not a true status condition.

**Verdict: CORRECT.** All 9 volatile conditions are present with reasonable name mappings.

### 5. Other conditions (non-status afflictions) -- PASS

**PTU p.248 Other Afflictions:** Fainted, Blindness, Total Blindness, Slowed, Stuck, Trapped, Tripped, Vulnerable.

**Code `OTHER_CONDITIONS`:** `['Fainted', 'Stuck', 'Slowed', 'Trapped', 'Tripped', 'Vulnerable']`

Missing from code: Blindness and Total Blindness. These are environmental/situational effects rarely tracked as discrete status conditions in digital implementations. Their absence does not impact capture rate mechanics (they are not mentioned in the capture formula).

**Verdict: ACCEPTABLE.** Blindness/Total Blindness omission is a reasonable scope decision with no impact on capture mechanics.

### 6. Capture rate modifier values -- PASS

**PTU p.227:** "Persistent Conditions add +10 to the Pokemon's Capture Rate; Injuries and Volatile Conditions add +5. Additionally, Stuck adds +10 to Capture Rate, and Slow adds +5."

**Code verification:**
- `captureRate.ts` line 124: persistent -> `statusModifier += 10` -- CORRECT
- `captureRate.ts` line 127: volatile -> `statusModifier += 5` -- CORRECT
- `captureRate.ts` line 132: Stuck -> `stuckModifier += 10` -- CORRECT
- `captureRate.ts` line 135: Slowed -> `slowModifier += 5` -- CORRECT
- `captureRate.ts` line 140: injuries -> `injuries * 5` -- CORRECT
- `useCapture.ts` lines 158-176: identical logic -- CORRECT

**Verdict: CORRECT.** All capture rate modifier values match PTU p.227.

## Issues Found

### NOTE-1: Sleep classification ambiguity (informational, no action needed)

PTU p.246 mentions Sleep in the Persistent Afflictions intro paragraph, but Sleep's definition entry is in the Volatile Afflictions section (p.247). The codebase classifies Sleep (as "Asleep") as volatile, which aligns with the definition location and with Sleep's mechanical behavior (cured by recall, cured at encounter end). This was already addressed in commit 63fe747. No change needed.

### NOTE-2: Blindness/Total Blindness not tracked as status conditions

PTU p.248 lists Blindness and Total Blindness under "Other Afflictions." These are not present in the code's `OTHER_CONDITIONS` array or `StatusCondition` type. This has zero impact on capture mechanics but may matter for future VTT features (e.g., accuracy penalty tracking). Recommend tracking in a future ticket if VTT accuracy penalty automation is planned.

## Verdict

**APPROVED_WITH_NOTES**

Both changes in ptu-rule-049 are correctly implemented:

1. The Poisoned/Badly Poisoned non-stacking fix is faithful to PTU p.246's treatment of Badly Poisoned as a variant of Poisoned. The `hasPoisonBonus` guard pattern is clean and symmetric across both `captureRate.ts` and `useCapture.ts`.

2. Bad Sleep is correctly classified as a volatile condition per PTU p.247, with proper type definitions, constant array inclusion, and CSS class mapping. It correctly contributes +5 to capture rate.

The two informational notes (Sleep classification ambiguity, Blindness omission) do not affect the correctness of the reviewed changes and require no action for this ticket.
