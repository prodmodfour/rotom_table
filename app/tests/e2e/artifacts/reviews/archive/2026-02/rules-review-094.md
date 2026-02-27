---
review_id: rules-review-094
target: ptu-rule-050
verdict: PASS
reviewer: game-logic-reviewer
date: 2026-02-20
commit: aa4d51a
---

## Review Summary

Verify PTU correctness of removing the dead `pokeBallType` parameter from capture endpoints (ptu-rule-050). The fix removed the field from `CaptureAttemptRequest` (server) and `attemptCapture` params (composable), and updated the `modifiers` comment to clarify it covers ball modifiers pre-calculated by the GM.

## PTU Rules Analysis

### Ball Modifier Rules (Core p.214, p.271-273, Errata p.431)

The PTU capture roll formula is:

> "Roll 1d100, and subtract the Trainer's Level, and any modifiers from equipment or Features." (p.214)

The ball chart (p.272-273) defines 25 ball types with modifiers applied to the capture roll:

| Ball | Base Modifier | Conditional |
|------|---------------|-------------|
| Basic Ball | +0 | -- |
| Great Ball | -10 | -- |
| Ultra Ball | -15 | -- |
| Master Ball | -100 | -- |
| Level Ball | +0 | -20 if target under half user's Pokemon level |
| Timer Ball | +5 | -5 per round (to -20) |
| Net Ball | +0 | -20 if Water or Bug type |
| Heavy Ball | +0 | -5 per Weight Class above 1 |
| Love Ball | +0 | -30 if same evo line + opposite gender |
| Quick Ball | -20 | +5/+10/+20 after rounds 1/2/3 |
| ... | ... | (13 more ball types) |

Key observation: The PTU ball modifier is applied to the **capture roll** (d100), not the capture rate. The formula structure is `modifiedRoll = d100 - trainerLevel - ballModifier - equipmentModifiers`.

### How the Code Handles This

The `attemptCapture()` utility (captureRate.ts:174) computes:

```
modifiedRoll = roll - trainerLevel - modifiers
```

The `modifiers` parameter is a single numeric value that encompasses ALL roll modifiers: ball type, equipment, features, and any other GM adjustments. The GM pre-calculates the total and passes it in.

This was previously confirmed correct in **rules-review-047 (ruling #4)**, which established:
- The sign convention is valid (positive `modifiers` = beneficial, chart's negative = beneficial, mathematically equivalent)
- The arithmetic produces correct results for all ball types

### Assessment of Removing `pokeBallType`

**1. Was `pokeBallType` ever consumed?**

No. The parameter was declared in the `CaptureAttemptRequest` interface and accepted in the composable's `attemptCapture` params, but:
- The server endpoint (`attempt.post.ts`) never read `body.pokeBallType`
- No lookup table or mapping logic existed anywhere in the codebase
- The value was passed through to the API body but silently discarded

**2. Was `pokeBallType` wired up in any UI?**

No. The `CaptureRateDisplay.vue` component emits an `attempt` event but has no ball type selector. No Vue component in the codebase passes `pokeBallType` to `attemptCapture()`.

**3. Does removing it lose information needed for future automation?**

No, for two reasons:

(a) The parameter was string-typed (`pokeBallType?: string`) with no enumeration, no validation, and no defined mapping. A future ball modifier automation feature would need to define the ball type enum, the lookup table with conditional logic (Timer Ball needs round count, Level Ball needs active Pokemon level, Heavy Ball needs target weight class, Love Ball needs gender + evo line comparison), and the resolution logic. None of this infrastructure existed. The string field was a placeholder, not a foundation.

(b) A future implementation can re-add a ball type parameter (or a separate ball selection UI) without any migration concern. The `modifiers` field remains the correct final input to the capture formula. A ball lookup service would compute the ball modifier and either add it to `modifiers` or pass it as a separate field that the server combines. Either approach is additive.

**4. Is the GM-manual-calculation approach PTU-valid?**

Yes. The PTU capture formula on p.214 says "subtract... any modifiers from equipment or Features." Ball modifiers are one category of such modifiers. The GM is the authority on which ball is being used and what conditional modifiers apply. Many ball types require contextual judgment:

- **Timer Ball:** Requires tracking the current encounter round number
- **Lure Ball:** Requires knowing whether the target was "baited into the encounter with food" -- a narrative decision
- **Dive Ball:** Requires knowing whether the target was "found underwater or underground" -- environmental context
- **Love Ball:** Requires checking same evolutionary line AND opposite gender of the active Pokemon
- **Heavy Ball:** Requires Weight Class derivation (not yet implemented in the app per rules-review-047 ruling #7)

For a GM session helper (not a fully automated VTT), having the GM calculate and enter the ball modifier is appropriate. The GM already knows which ball is being thrown and can apply the chart value directly. The `modifiers` field comment was updated to make this workflow explicit: `// Equipment/feature/ball modifiers (pre-calculated by GM)`.

**5. Does the fix introduce any PTU incorrectness?**

No. The capture rate calculation (`calculateCaptureRate`), the capture roll formula (`attemptCapture`), the accuracy check (AC 6), the natural 20 crit bonus, and the natural 100 auto-capture are all unchanged. The only change is removing a field that was never used.

## Minor Observation

The matrix documentation files (`capture-capabilities.md`, `capture-matrix.md`, `pokemon-lifecycle-capabilities.md`, `capture-audit.md`) still reference `pokeBallType` in their capability descriptions. These are analysis artifacts, not source code, so they do not need to be updated for correctness. However, the next time these matrix files are regenerated, the references will naturally disappear.

## Verdict

**PASS**

The fix correctly removes dead code without affecting any PTU game mechanic. The `pokeBallType` parameter was never consumed by any logic and its removal does not lose information needed for future ball modifier automation. The existing `modifiers` field correctly serves as the vehicle for ball modifiers (pre-calculated by the GM), and the updated comment accurately documents this usage. The approach is consistent with the ruling in rules-review-047 (capture-R027) which validated the sign convention and arithmetic of the `modifiers` parameter.
