---
review_id: rules-review-047
target: ambiguous-items-all-domains
verdict: MIXED
reviewer: game-logic-reviewer
date: 2026-02-19
---

## Review Summary

Rulings on 9 ambiguous items from implementation audits across 6 domains (combat, capture, healing, character-lifecycle, scenes, vtt-grid).

## Rulings

### 1. combat-R011 -- Accuracy Threshold Formula: Subtract from Threshold vs Add to Roll

**Verdict:** DESIGN_CHOICE

**PTU Text:** "An Accuracy Roll is always simply 1d20, but is modified by the user's Accuracy and by certain Moves and other effects." (p.236) "An Accuracy Check is the number an Accuracy Roll needs to meet or exceed to hit. It's determined first taking the Move's base AC and adding the target's Evasion." (p.236) "Accuracy at -2 simply modifies all Accuracy Rolls by -2, for example." (p.234)

**Reasoning:** PTU describes two separate numbers: the Accuracy Roll (d20 + accuracy modifiers) and the Accuracy Check (AC + evasion). The rule says "Accuracy's Combat Stages apply directly" to the roll. The code implements an algebraically equivalent formulation: instead of adding accuracy CS to the d20 roll and comparing to (AC + evasion), it subtracts accuracy CS from the threshold. The formula `threshold = AC + evasion - accuracyCS` checked against a raw d20 roll produces identical hit/miss outcomes as `d20 + accuracyCS >= AC + evasion`. Both interpretations yield the same mathematical result for every possible combination of inputs. The PTU text technically says accuracy modifies the "roll," but the threshold approach is a standard optimization in digital implementations.

**Action:** No change needed. Document that the app uses the threshold-subtraction approach for implementation convenience. Both approaches are mathematically identical. The worked example on p.236 ("if using Earthquake, which has an Accuracy Check of 2, against an opponent with a Physical Evasion of +4, you would need to roll a 6 or higher") confirms the equivalence -- the "6" is already the combined threshold.

---

### 2. combat-R012 -- Evasion Type Selection: Damage-Class-Matching vs Defender's Choice

**Verdict:** INCORRECT

**PTU Text:** "Physical Evasion can only modify the accuracy rolls of Moves that target the Defense Stat; similarly, Special Evasion can modify the rolls of attacks that target the Special Defense Stat. Speed Evasion may be applied to any Move with an accuracy check, but you may only add one of your three evasions to any one check." (p.234)

**Reasoning:** PTU is explicit that the defender chooses which evasion to apply, with one constraint: Physical Evasion can only be used vs Physical moves, Special Evasion only vs Special moves, but Speed Evasion can be used against ANY move. The defender picks exactly one evasion per check. The current code auto-selects based on damage class (`Physical -> physicalEvasion`, `Special -> specialEvasion`), which always picks the type-matching evasion and never considers Speed Evasion as an alternative.

This matters mechanically: a fast Pokemon with low defenses (e.g., Speed 25 giving Speed Evasion +5, but Defense 5 giving Physical Evasion +1) would be significantly disadvantaged by the current auto-selection. The correct behavior is to use `max(matchingEvasion, speedEvasion)` since a rational defender would always pick their highest applicable evasion. In pen-and-paper play the defender picks, but in a digital tool the optimal choice should be auto-selected (the defender never benefits from choosing a lower evasion).

**Action:** File a bug ticket (MEDIUM severity). Change the evasion selection logic to: `applicableEvasion = Math.max(matchingClassEvasion, speedEvasion)`. For Physical moves: `max(physicalEvasion, speedEvasion)`. For Special moves: `max(specialEvasion, speedEvasion)`. For Status moves: `speedEvasion` (only Speed Evasion applies). This auto-selects the best available evasion, which is always the rational choice.

---

### 3. combat-R104 -- Massive Damage Check: Pre-Temp-HP vs Post-Temp-HP Damage

**Verdict:** CORRECT

**PTU Text:** "Temporary Hit Points also do not stack with 'Real' Hit Points for the purposes of determining percentages of Hit Points. If a Pokemon has exactly 1 real Hit Point and has 50 Temporary Hit Points, they would use the Moves and effects as if they have 1 Hit Point, not 51." (p.247) "Massive Damage is any single attack or damage source that does damage equal to 50% or more of their Max Hit Points." (p.250)

**Reasoning:** The temp HP rule is clear that temp HP does not count for "purposes of determining percentages of Hit Points." The massive damage rule triggers on "damage equal to 50% or more of their Max Hit Points." The question is whether "damage" means the total incoming damage or only the portion that actually reduces real HP.

The temp HP text states: "Temporary Hit Points are always lost first from damage or any other effects. Damage carries over directly to real Hit Points once the Temporary Hit Points are lost." (p.247). This explicitly establishes that temp HP absorbs damage before it reaches real HP. Combined with the rule that temp HP doesn't count for percentage calculations, the correct interpretation is that massive damage checks should use the damage that actually reached real HP (post-temp-HP absorption), not the total incoming damage.

Consider the intent: temp HP is a shield that protects the real HP pool. If a Pokemon has 100 maxHP, 50 tempHP, and takes 60 total damage, the tempHP absorbs 50 and only 10 reaches real HP. The massive damage check should evaluate whether those 10 HP of real damage constitute 50% of maxHP (it does not). The code correctly uses `hpDamage` (after temp HP absorption) for the massive damage check.

**Action:** No change needed. The code correctly uses post-temp-HP damage for massive damage evaluation.

---

### 4. capture-R027 -- Sign Convention for Poke Ball Modifiers

**Verdict:** CORRECT

**PTU Text:** "Roll 1d100, and subtract the Trainer's Level, and any modifiers from equipment or Features." (p.214) The ball chart lists: Basic Ball +0, Great Ball -10, Ultra Ball -15, Master Ball -100. The worked example states: "You're using a basic Poké Ball so you don't add or subtract anything." (p.255)

**Reasoning:** The PTU text says "subtract the Trainer's Level, and any modifiers from equipment." This should be parsed as two operations: (1) subtract the trainer's level, and (2) apply any modifiers from equipment. The ball chart modifier is applied directly to the roll. For Great Ball (-10), the modifier is -10, meaning the capture roll is reduced by 10: `modifiedRoll = d100 - trainerLevel + ballModifier = d100 - trainerLevel + (-10)`.

This makes the modified roll LOWER, which makes it easier to roll under the capture rate -- correctly reflecting that Great Balls are better than Basic Balls. The worked example confirms: "using a basic Poké Ball so you don't add or subtract anything" maps to a +0 modifier, and `d100 - trainerLevel + 0 = d100 - trainerLevel`.

The code uses `modifiedRoll = roll - trainerLevel - modifiers`, where `modifiers` is a positive number. For Great Ball, the caller would pass `modifiers = 10` (positive), yielding `roll - trainerLevel - 10`. This is mathematically equivalent to `roll - trainerLevel + (-10)`.

The sign convention difference is: the PTU chart uses **negative numbers for beneficial effects** (Great Ball = -10), while the code expects **positive numbers for beneficial effects** (caller passes 10). Both produce the same result: the roll is reduced by 10. The code's `modifiers` parameter effectively represents "how much to subtract from the roll" rather than "the modifier value from the chart." This is an undocumented sign inversion but the arithmetic is correct.

**Action:** No gameplay-affecting change needed. However, add a code comment documenting the sign convention: "Pass the Poke Ball modifier as a positive value to subtract from the roll. Great Ball chart value is -10, so pass 10 here." If the pokeBallType-to-modifier lookup is ever implemented, the lookup should negate the chart value: `modifiers = -ballChartModifier`.

---

### 5. healing-R007 -- Rest Healing 1/16th: Real maxHp or Injury-Reduced maxHp

**Verdict:** CORRECT

**PTU Text:** "For each Injury a Pokemon or Trainer has, their Maximum Hit Points are reduced by 1/10th." (p.250) "All Effects that normally go off the Pokemon's Max Hit Points still use the real maximum." (p.250) "Pokemon and Trainers that spend a continuous half hour resting heal 1/16th of their Maximum Hit Points." (p.252)

**Reasoning:** The injury section on p.250 contains two key statements:

1. "Maximum Hit Points are reduced by 1/10th" per injury -- this establishes an artificial reduced max.
2. "All Effects that normally go off the Pokemon's Max Hit Points still use the real maximum" -- this exempts effects that reference maxHP as an input to calculations.

The 1/16th rest healing formula references "Maximum Hit Points" as a calculation input -- it computes a healing amount BASED ON maxHP. This falls under the "Effects that go off the Pokemon's Max Hit Points" exemption. The real maximum should be used.

This interpretation is further supported by the distinction between the healing AMOUNT (1/16th of real max) and the healing CAP (injury-reduced max). The injury rule says characters "could only heal up to 35 Hit Points" -- this caps where HP can go, not how much healing each tick provides. The amount healed per rest period uses real max; the HP ceiling after healing uses injury-reduced max.

Using the injury-reduced max for the 1/16th formula would create a compounding effect where injuries reduce both the ceiling AND the rate of healing, which is overly punitive and not supported by the text.

The code correctly uses real maxHp for the 1/16th calculation at `restHealing.ts:50`. Note: the separate bug in healing-R003 (not capping healed HP at injury-reduced max) is a different issue and remains an Incorrect finding.

**Action:** No change needed for the 1/16th calculation itself. The code is correct in using real maxHp. The injury-reduced HP cap is a separate bug (healing-R003).

---

### 6. character-lifecycle-R042 -- AP Scene Refresh vs Drained AP Interaction

**Verdict:** CORRECT (Interpretation A is correct)

**PTU Text:** "Action Points are completely regained at the end of each Scene. However, some effects may Bind or Drain Action Points. Bound Action Points remain off-limits until the effect that Bound them ends, as specified by the Feature or effect. If no means of ending the effect is specified, then the effect may be ended and AP Unbound during your turn as a Free Action. Drained AP becomes unavailable for use until after an Extended Rest is taken." (p.216, Playing the Game chapter)

**Reasoning:** The PTU text uses "However" as a conjunction introducing exceptions to the "completely regained" rule. The structure is:

1. General rule: "AP are completely regained at the end of each Scene."
2. Exception: "However, some effects may Bind or Drain Action Points."
3. Bind specifics: "Bound AP remain off-limits until the effect ends" (can be ended as a Free Action).
4. Drain specifics: "Drained AP becomes unavailable for use until after an Extended Rest is taken."

The "However" clause explicitly carves out Bind and Drain as exceptions to the scene-end refresh. If Drain were overridden by scene-end refresh, the sentence "Drained AP becomes unavailable until Extended Rest" would be meaningless -- there would be no need for Extended Rest to restore them since every scene end would do it.

Therefore, at scene end: `availableAP = maxAP - drainedAP`. Drained AP persists through scene boundaries. The app correctly tracks `drainedAp` as persistent across scenes, restored only by Extended Rest.

Note: the audit separately identified that no scene-end AP refresh mechanism exists at all (character-lifecycle-R042 Incorrect finding). The ambiguous question about drain interaction is answered here, but the missing scene-end refresh for non-drained AP remains a valid gap.

**Action:** No change to the drain behavior. The `drainedAp` persistence across scenes is correct per PTU. The missing scene-end AP refresh (setting available AP to `maxAP - drainedAP`) is a separate implementation gap that should be addressed by the existing R042 ticket.

---

### 7. character-lifecycle-R020 -- Weight Field: kg vs Pounds for Weight Class

**Verdict:** DESIGN_CHOICE

**PTU Text:** "A Trainer between 55 and 110 pounds is Weight Class 3. Between 111 and 220 is WC 4. Higher than that is WC 5." (p.16, Character Creation chapter) "She is Medium Size and weighs 120 pounds and therefore is Weight Class 4." (p.16, example)

**Reasoning:** PTU uses pounds for weight class thresholds. The app stores weight in kilograms (per schema comment). Both approaches are valid for a digital tool:

- **Option A: Store kg, convert to lbs for weight class derivation.** This is the cleanest separation of concerns: the DB stores metric (which is the international standard and what most users outside the US expect), and a derivation function handles the conversion. The conversion is a one-line operation: `const lbs = kg * 2.205`.

- **Option B: Store lbs to match PTU directly.** This avoids any conversion but forces the app to use an imperial unit that may be unfamiliar to international users.

- **Option C: Store a separate weightClass field.** This decouples the derived value from the raw weight, allowing the GM to override if needed.

The PTU book consistently uses pounds. However, the app's schema comment explicitly says "in kg," indicating an intentional metric choice. Since no weight class derivation exists yet, the decision has no current impact.

**Action:** When implementing weight class derivation, use Option A: keep the kg storage and convert to pounds in the derivation function. Add `calculateWeightClass(weightKg)` that converts to lbs and applies the PTU thresholds: `<= 25 lbs = WC1, 26-55 = WC2, 56-110 = WC3, 111-220 = WC4, 221+ = WC5`. Document the conversion in a code comment referencing PTU p.16.

---

### 8. scenes-R018 -- Rough Terrain: Separate Type or Subset of Difficult

**Verdict:** INCORRECT (Rough terrain needs to be a separate terrain type)

**PTU Text:** "Slow Terrain: [...] When Shifting through Slow Terrain, Trainers and their Pokemon treat every square meter as two square meters instead." "Rough Terrain: Most Rough Terrain is also Slow Terrain, but not always. When targeting through Rough Terrain, you take a -2 penalty to Accuracy Rolls. Spaces occupied by other Trainers or Pokemon are considered Rough Terrain. Certain types of Rough Terrain may be ignored by certain Pokemon, based on their capabilities." (p.232, Combat chapter)

**Reasoning:** PTU explicitly distinguishes Rough Terrain from Slow Terrain with the key phrase "Most Rough Terrain is also Slow Terrain, **but not always.**" This means:

- Some terrain is Slow but not Rough (e.g., deep snow -- slows movement but doesn't obscure attacks).
- Some terrain is Rough but not Slow (the rule explicitly allows this).
- Most terrain is both Rough AND Slow (e.g., tall grass, shrubs).

The `-2 accuracy penalty` is the defining characteristic of Rough Terrain. The `2x movement cost` is the defining characteristic of Slow Terrain. These are two independent properties that often coincide but are not synonymous.

The app currently has only `difficult` (= Slow) with 2x movement cost but no accuracy penalty. Rough Terrain is missing entirely. The current `difficult` type should remain as Slow, and a new `rough` type should be added. Additionally, since PTU says "most Rough is also Slow," a cell should support being both rough AND slow/difficult simultaneously (either via a compound type or by allowing terrain stacking).

The worked example on p.254-255 demonstrates both effects together: "it's rough and slow terrain which means you'll have a harder time targeting and moving through it." The targeting penalty (-2 accuracy) and movement penalty (2x cost) are described as separate consequences.

**Action:** File a ticket (MEDIUM severity). Add `rough` as a terrain type or terrain modifier. Options:
1. Add a `rough` boolean overlay that can apply to any terrain cell independently of movement cost. This is the most flexible approach since rough and slow are independent properties.
2. Add `rough` as a new terrain type alongside `difficult`, with a combined `roughDifficult` for cells that are both.

The accuracy penalty (-2 when targeting through Rough cells) requires a combat-system integration that checks the line between attacker and target for Rough terrain cells.

---

### 9. vtt-grid-R029 -- Push Maneuver: Automated Grid Movement vs GM Manual

**Verdict:** DESIGN_CHOICE

**PTU Text:** "If you win, the target is Pushed back 1 Meter directly away from you. If you have Movement remaining this round, you may then Move into the newly occupied Space, and Push the target again. This continues until you choose to stop, or have no Movement remaining for the round. Push may only be used against a target whose weight is no heavier than your Heavy Lifting rating." (p.242)

**Reasoning:** The Push maneuver involves several contextual decisions that are difficult to fully automate:

1. **Direction:** "directly away from you" requires calculating the direction vector from pusher to target. For cardinal adjacency this is unambiguous, but for diagonal adjacency the "directly away" direction can be debatable (especially with multi-cell tokens or corner adjacency).

2. **Obstacle handling:** PTU does not specify what happens if the target is pushed into blocking terrain or another combatant. Common house rules include: push fails, push stops at obstacle, target takes damage from collision. This requires GM judgment.

3. **Chained pushes:** The pusher can follow up and push again if they have movement remaining. This creates a multi-step sequence (push, move, push, move) that requires GM decision at each step (stop or continue?).

4. **Weight class check:** Push requires the target to be within the pusher's Heavy Lifting rating, which is not currently tracked in the app.

For a GM-facing session helper tool (not a fully automated VTT like Roll20 or Foundry), leaving spatial consequences to manual GM token repositioning is a reasonable design choice. The combat system correctly resolves the opposed check; the GM then moves the tokens. This matches how pen-and-paper groups handle Push -- the GM describes the result and repositions miniatures.

Full automation is a feature enhancement, not a correctness issue. The core Push maneuver data (AC 4, Standard Action, Melee) and the opposed check mechanics are correctly implemented. Only the spatial consequence is manual.

**Action:** No correctness issue. This is a feature gap, not a bug. If automated push movement is desired in the future, file it as a P2 enhancement ticket. The current manual approach is acceptable for a GM tool. Document in the maneuver reference that the GM should manually reposition tokens after a successful Push.

---

## Summary Table

| # | Rule ID | Domain | Verdict | Action |
|---|---------|--------|---------|--------|
| 1 | combat-R011 | combat | DESIGN_CHOICE | Document threshold approach, no code change |
| 2 | combat-R012 | combat | INCORRECT | File bug: use `max(matchingEvasion, speedEvasion)` |
| 3 | combat-R104 | combat | CORRECT | No change needed |
| 4 | capture-R027 | capture | CORRECT | Add sign convention documentation comment |
| 5 | healing-R007 | healing | CORRECT | No change; real maxHp is correct for 1/16th calc |
| 6 | character-lifecycle-R042 | character-lifecycle | CORRECT | Drain persistence is correct; scene refresh is separate gap |
| 7 | character-lifecycle-R020 | character-lifecycle | DESIGN_CHOICE | Store kg, convert to lbs in derivation function |
| 8 | scenes-R018 | scenes | INCORRECT | File ticket: add `rough` terrain type with accuracy penalty |
| 9 | vtt-grid-R029 | vtt-grid | DESIGN_CHOICE | No correctness issue; feature enhancement for future |

**Final tally:** 3 CORRECT, 2 INCORRECT, 4 DESIGN_CHOICE
