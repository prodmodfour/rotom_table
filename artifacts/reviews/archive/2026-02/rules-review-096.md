# Rules Review 096 — refactoring-046: Duplicate Capabilities Display + AP Restore Loop

**Reviewer:** Game Logic Reviewer
**Ticket:** refactoring-046
**Commits:** `aa015c9` (CapabilitiesDisplay), `c45c246` (restoreSceneAp)
**Date:** 2026-02-20
**Verdict:** PASS

---

## 1. CapabilitiesDisplay.vue — Trainer Capabilities (commit `aa015c9`)

### Rulebook Reference
PTU Core Chapter 2 — Character Creation, pp. 15-17.

### Capabilities Displayed vs PTU Rules

| Capability | Displayed in Component | PTU Rule (p15-16) | Correct? |
|---|---|---|---|
| Power | `derivedStats.power` | Starts at 4. +1 if Athletics >= Novice. +1 if Combat >= Adept. | YES |
| High Jump | `derivedStats.highJump` + "m" | Starts at 0. +1 if Acrobatics >= Adept. +1 more if Acrobatics >= Master. | YES |
| Long Jump | `derivedStats.longJump` + "m" | Equal to floor(Acrobatics rank / 2). | YES |
| Overland | `derivedStats.overland` | 3 + floor((Athletics + Acrobatics) / 2). | YES |
| Swimming | `derivedStats.swimming` | "Swimming Speed for a Trainer is equal to half of their Overland Speed." | YES |
| Throwing Range | `derivedStats.throwingRange` + "m" | 4 + Athletics Rank. | YES |
| Weight Class | `derivedStats.weightClass` | 3 (55-110 lbs), 4 (111-220 lbs), 5 (>220 lbs). | YES |

### Completeness Check
The PTU trainer capabilities from p15-17 are:
- Power, High Jump, Long Jump, Overland, Swimming Speed, Throwing Range, Size (Medium), Weight Class.

The component displays 7 of these. **Size** (always "Medium" for trainers) is omitted, which is a reasonable UI choice since it never varies for human characters. This is not a rules violation.

### Label Accuracy Note
The PTU rulebook uses "Swim" for Pokemon capabilities (Chapter 6, p222: "Swim is a Movement Capability...") and "Swimming Speed" for trainers (Chapter 2, p16). The component label "Swimming" is an acceptable abbreviation of "Swimming Speed" and consistent with the `TrainerDerivedStats` interface field name `swimming`.

### Underlying Calculation Verification
Cross-checked `computeTrainerDerivedStats()` in `app/utils/trainerDerivedStats.ts` against PTU formulas. All 7 formulas match the rulebook exactly (skill rank numeric mapping: Pathetic=1, Untrained=2, Novice=3, Adept=4, Expert=5, Master=6).

### Verdict: PASS
The 7 displayed capabilities match PTU 1.05 trainer capabilities. No rules violation.

---

## 2. restoreSceneAp() — AP Restoration Logic (commit `c45c246`)

### Rulebook Reference
PTU Core Chapter 6 — Playing the Game, p221.

> "Action Points are completely regained at the end of each Scene. However, some effects may Bind or Drain Action Points. Bound Action Points remain off-limits until the effect that Bound them ends [...] Drained AP becomes unavailable for use until after an Extended Rest is taken."

PTU Core Chapter 3 — Skills, Edges, and Features, p48/p61:

> "[Stratagem] Features may only be Bound during combat and automatically Unbind when combat ends."

### Logic Verification

| Rule | Implementation | Correct? |
|---|---|---|
| AP completely regained at scene end | `currentAp = calculateSceneEndAp(level, drainedAp)` which computes `maxAp - drainedAp` | YES |
| Drained AP unavailable until Extended Rest | `drainedAp` is NOT reset to 0 — it is read from DB and subtracted from maxAp | YES |
| Bound AP released at scene end | `boundAp: 0` in the update data | YES |
| Max AP = 5 + floor(level / 5) | `calculateMaxAp(level)` returns `5 + Math.floor(level / 5)` | YES |

### Critical Check: drainedAp NOT Reset
The `restoreSceneAp()` function does NOT set `drainedAp: 0`. It reads `drainedAp` from the database and passes it to `calculateSceneEndAp()`, which subtracts it from max AP. This is correct: drained AP persists across scenes and is only restored by Extended Rest (PTU Core p221, p251).

### JSDoc Page Reference
The JSDoc references "PTU Core (p221)". The AP rules are indeed on page 221 of the rulebook, in Chapter 6 (Playing the Game), not Chapter 7 (Combat). The page number is correct; the CLAUDE.md reference to "core/07-combat.md" for AP rules is a chapter mismatch, but the JSDoc itself correctly cites the page number without specifying a chapter.

### Stratagem Auto-Unbind
The JSDoc states: "Bound AP is released at scene end (Stratagems auto-unbind)." This is slightly imprecise. Per PTU Core p48/p61, Stratagems "automatically unbind when **combat** ends", not when a **scene** ends. However, the actual code behavior (`boundAp: 0`) is correct and conservative — unbinding all bound AP at scene end is a superset of the combat-end rule and cannot produce an incorrect game state (a scene ending always implies any combat in that scene has also ended).

### Batched Transaction
The grouping by `(level, drainedAp)` and batched `updateMany` within a `$transaction` is a performance optimization only. It produces identical results to the previous individual-update approach. No rules impact.

### Verdict: PASS
The AP restoration logic correctly implements PTU 1.05 scene-end AP rules. Drained AP is preserved (not reset). Bound AP is released. Current AP is restored to `maxAp - drainedAp`.

---

## Summary

| Item | Verdict | Notes |
|---|---|---|
| CapabilitiesDisplay.vue — 7 trainer capabilities | PASS | All match PTU Core pp. 15-17 |
| restoreSceneAp() — AP restoration | PASS | Correctly implements PTU Core p221 |
| drainedAp handling | PASS | Not reset; persists until Extended Rest |
| boundAp handling | PASS | Reset to 0 at scene end |
| JSDoc accuracy | PASS | Page reference correct; Stratagem note slightly imprecise but conservative |

**Overall Verdict: PASS**
