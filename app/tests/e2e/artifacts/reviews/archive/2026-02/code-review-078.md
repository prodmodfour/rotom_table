---
review_id: code-review-078
trigger: orchestrator-routed
target_tickets: [ptu-rule-049]
reviewed_commits: [89bdc13, 3bb0d3b]
verdict: APPROVED_WITH_ISSUES
reviewed_at: 2026-02-20T03:00:00Z
reviewer: senior-reviewer
---

## Scope

Review of ptu-rule-049 implementation: two commits fixing capture status condition definitions.

1. **Commit 89bdc13** -- Fix Poisoned/Badly Poisoned stacking in capture rate calculation. Files: `app/utils/captureRate.ts`, `app/composables/useCapture.ts`.
2. **Commit 3bb0d3b** -- Add Bad Sleep volatile condition to type system and constants. Files: `app/types/combat.ts`, `app/constants/statusConditions.ts`.

## Issues Found

### MEDIUM: Duplicated capture rate calculation logic between captureRate.ts and useCapture.ts

**Files:** `app/utils/captureRate.ts` (lines 108-137), `app/composables/useCapture.ts` (lines 150-176)

The `hasPoisonBonus` guard was correctly added to both files with identical logic, but this highlights a pre-existing structural problem: the entire capture rate algorithm is duplicated across two files. `captureRate.ts:calculateCaptureRate` is used server-side (by `server/api/capture/rate.post.ts`), while `useCapture.ts:calculateCaptureRateLocal` is used client-side. The two implementations are functionally equivalent but maintained independently.

This is a DRY violation and a future regression risk. Any change to capture rate logic (like this poison stacking fix) must be applied to both files in lockstep. If one is missed, the server and client calculations will silently diverge.

**Note:** There is already one minor divergence between the two paths. The evolution modifier logic differs slightly:

- `captureRate.ts` (line 98-99): `else if (evolutionsRemaining === 1) { evolutionModifier = 0 }` -- explicit branch for exactly 1.
- `useCapture.ts` (line 138-139): `else if (evolutionsRemaining === 0) { evolutionModifier = -10 }` -- implicit 0 for the middle case.

Both produce the same result for all valid inputs (0, 1, 2), but the structural divergence makes it harder to verify equivalence at a glance.

**Recommendation:** File a refactoring ticket to have `calculateCaptureRateLocal` in `useCapture.ts` delegate to `calculateCaptureRate` from `captureRate.ts` (which is in `utils/` and thus auto-importable by Nuxt on both client and server). The composable would still own the `CaptureRateData` return shape mapping, but the core arithmetic would live in one place.

### MEDIUM: Bad Sleep may stack with Asleep for double volatile capture bonus

**Files:** `app/utils/captureRate.ts` (line 126-128), `app/composables/useCapture.ts` (line 167-169)

PTU p.247 states: "Bad Sleep may only afflict Sleeping targets; if the target is cured of Sleep, they are also cured of Bad Sleep." This means Bad Sleep is always paired with Asleep. Under the current implementation, a Pokemon with both `['Asleep', 'Bad Sleep']` would receive +10 to capture rate (+5 for each volatile condition), whereas the intended behavior may be only +5 total for the "Sleep" affliction family, analogous to how Poisoned/Badly Poisoned was treated.

However, there is a counter-argument: unlike Poisoned/Badly Poisoned (which are explicitly described as variants/upgrades of the same affliction on PTU p.246), Bad Sleep is defined as a separate volatile affliction on p.247 with its own distinct mechanical effect (lose 2 ticks on Sleep save checks). The PTU capture rate chart on p.227 does not specifically address whether co-occurring volatile conditions from the same "family" should be collapsed.

**Verdict on this issue:** The current +5/+5 stacking behavior is defensible but debatable. The Poisoned/Badly Poisoned fix was clearly correct because PTU explicitly treats them as the same affliction. For Bad Sleep + Asleep, the rules are ambiguous. The GM can always choose not to apply both conditions simultaneously if they want a single +5. No code change required, but this should be noted in the ticket resolution for GM awareness.

## What Looks Good

1. **Poison stacking fix is correct.** The `hasPoisonBonus` flag pattern is clean, easy to understand, and handles all orderings (Poisoned first, Badly Poisoned first, only one present, neither present). The PTU reference on p.246 clearly describes Badly Poisoned as a variant of Poisoned, making the +10 cap correct.

2. **Both calculation paths are in sync.** The `hasPoisonBonus` guard was applied identically in both `captureRate.ts` and `useCapture.ts`. The comment referencing PTU p.246 is consistent across both files.

3. **Bad Sleep placement is correct.** Bad Sleep is correctly categorized as a volatile condition per PTU p.247 (it appears under the "Volatile Afflictions" heading). It is not persistent.

4. **Downstream consumers are unaffected by adding Bad Sleep.** All consumers of `VOLATILE_CONDITIONS` use it via spread or iteration, so adding an element to the array requires no changes:
   - `encounters/[id]/end.post.ts` -- filters out volatiles at encounter end. Bad Sleep will be correctly cleared.
   - `encounters/[id]/breather.post.ts` -- cures volatiles (except Cursed). Bad Sleep will be correctly cured.
   - `combatant.service.ts:applyDamageToEntity` -- clears persistent + volatile on faint. Bad Sleep will be correctly cleared.
   - `GMActionModal.vue` -- renders volatile conditions list. Bad Sleep will appear in the UI.
   - `StatusConditionsModal.vue` -- uses `ALL_STATUS_CONDITIONS` (which spreads `VOLATILE_CONDITIONS`). Bad Sleep will appear.

5. **CSS class mapping is reasonable.** `'Bad Sleep': 'condition--sleep'` reuses the same visual treatment as `'Asleep'`, which makes sense since Bad Sleep is a modifier on Sleep, not a visually distinct condition.

6. **Type safety is maintained.** Adding `'Bad Sleep'` to the `StatusCondition` type union ensures TypeScript catches any hard-coded condition checks that might need updating.

7. **Immutability is preserved.** No mutations of status arrays -- the `hasPoisonBonus` flag is a local boolean, and the `for...of` loop reads but does not modify the `statusConditions` input array.

8. **Commit granularity is good.** Two separate commits for two distinct changes (poison stacking fix, Bad Sleep addition) with clear messages referencing PTU page numbers.

## New Tickets Filed

### refactoring-XXX: Deduplicate capture rate calculation between captureRate.ts and useCapture.ts

**Priority:** P2 (code health / extensibility)
**Domain:** capture
**Description:** `app/utils/captureRate.ts:calculateCaptureRate` and `app/composables/useCapture.ts:calculateCaptureRateLocal` contain identical capture rate arithmetic maintained independently. The `useCapture.ts` client-side function should delegate to `calculateCaptureRate` from `utils/captureRate.ts` for the core calculation, then map the result into the `CaptureRateData` return shape. This eliminates the need to apply capture rate changes in two places and removes the minor evolution modifier structural divergence (both produce correct results today, but differ in branching style).
**Files:**
- `app/utils/captureRate.ts` -- canonical implementation (keep as-is)
- `app/composables/useCapture.ts` -- refactor `calculateCaptureRateLocal` to call `calculateCaptureRate` and map result

## Verdict

**APPROVED_WITH_ISSUES**

Both changes are correct and align with PTU 1.05 rules. The poison stacking fix is unambiguously right. The Bad Sleep addition is properly categorized as volatile and correctly propagates to all downstream systems. One MEDIUM issue (duplicated capture rate logic) is a pre-existing structural concern that this ticket surfaced but did not introduce -- it should be tracked as a separate refactoring ticket. One MEDIUM observation (Bad Sleep + Asleep double counting) is noted but does not require a code change given the rules ambiguity.

No blockers. Ship it.
