---
rule_id: character-lifecycle-R068
name: Percentages Are Additive
category: constraint
scope: core
domain: character-lifecycle
---

## character-lifecycle-R068: Percentages Are Additive

- **Category:** constraint
- **Scope:** core
- **PTU Ref:** `core/06-playing-the-game.md#System Fundamentals`
- **Quote:** "Percentages are additive, not multiplicative. For example, this means if you gain a 20% boost somewhere and a 30% somewhere else, you gain a 50% boost in total rather than gaining a 20% boost and then 30% more off of that total."
- **Dependencies:** none
- **Errata:** false

---

## Cross-Domain References

### combat-ref-001: Trainer HP Thresholds and Unconsciousness
- **Source Domain:** combat
- **PTU Ref:** `core/02-character-creation.md#Step 6: Find Derived Stats`
- **Quote:** "If a Pokémon or Trainer ever reaches 0 Hit Points, they are unable to take any actions and are unconscious."
- **Note:** Full unconsciousness/injury rules are in the combat domain (chapter 07).

### combat-ref-002: Movement Speed in Combat
- **Source Domain:** combat / vtt-grid
- **PTU Ref:** `core/06-playing-the-game.md#Movement Capabilities`
- **Quote:** "Movement Capabilities don't generally need to be tested, although the Sprint Action may be taken as a Standard Action to increase Movement Speed by 50% for a turn."
- **Note:** Full movement/shift rules in combat domain.

### capture-ref-001: Capture Mechanic Changes (Errata)
- **Source Domain:** capture
- **PTU Ref:** `errata-2.md#Capture Mechanic Changes`
- **Quote:** "A Capture Roll is now a 1d20 roll where you aim to meet or exceed a target number. If you have gained the Amateur Trainer bonus at Level 5, add +1 to this roll..."
- **Note:** Capture bonus scaling from level milestones (R045-R050) connects to capture domain. Full capture rules extracted separately.

### pokemon-lifecycle-ref-001: Starter Pokemon
- **Source Domain:** pokemon-lifecycle
- **PTU Ref:** `core/02-character-creation.md#Step 8: Choose Pokémon`
- **Quote:** "it's recommended for level 1 Trainers to begin with a single level 5 or level 10 Pokémon, chosen from either the Starter Pokémon in the video games or any relatively common species of Pokémon with three evolutionary stages."
- **Note:** Pokemon stat creation is in the pokemon-lifecycle domain.

### healing-ref-001: AP Drain and Extended Rest
- **Source Domain:** healing
- **PTU Ref:** `core/06-playing-the-game.md#Action Points`
- **Quote:** "Drained AP becomes unavailable for use until after an Extended Rest is taken."
- **Note:** Full rest/healing rules in the healing domain.

---

## Notes

### Ambiguity: Bonus Skill Edge Restrictions at Milestone Levels
The milestone level bonuses (R044, R046, R048) grant a "Skill Edge for which you qualify" but specify it "may not be used to Rank Up a Skill to [the newly unlocked] Rank." This means at Level 2, you get a bonus Skill Edge that cannot raise a skill to Adept — it can only raise skills to Novice or below. The restriction prevents instant use of the milestone's own unlock. This is clear but may be confusing to implementors who read it as "gain a free Adept edge."

### Note: Stat Points and Base Relations
R038 explicitly states "Trainers don't follow Base Relations" for stat point allocation. This distinguishes Trainers from Pokemon, who do follow Base Relations. Trainers can freely allocate stat points to any stat without restriction.

### Note: Training Feature Duration Discrepancy
The Feature Tags page (page 58) says Training Features last "until the end of your next Extended Rest" when used as [Training] after "at least half an hour" of training. The Training Features section (page 60) says "at least an hour." This is a minor discrepancy in the training time requirement (30 min vs 1 hour). The Feature Tags page (page 58) says "half an hour" while the Training Features section (page 60) says "at least an hour."
