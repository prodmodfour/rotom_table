The file `app/constants/trainerSkills.ts` defines all 17 PTU trainer skills organized by category:

- **Body** (6): Acrobatics, Athletics, Combat, Intimidate, Stealth, Survival
- **Mind** (7): General Ed, Medicine Ed, Occult Ed, Pokemon Ed, Technology Ed, Guile, Perception
- **Spirit** (4): Charm, Command, Focus, Intuition

All skills default to Untrained. Six rank tiers exist: Pathetic (1d6), Untrained (2d6), Novice (3d6), Adept (4d6), Expert (5d6), Master (6d6). Each rank above Novice has a level prerequisite — Adept requires level 2, Expert requires level 6, Master requires level 12 — matching the [[trainer-skill-rank-caps-by-level]].

The [[trainer-level-up-bonus-skill-edge-picker]] and [[full-create-edges-section]] both use these categories to group the skill picker by Body/Mind/Spirit. The [[trainer-background-catalog-constant]] imports `PtuSkillName` from this file to type-constrain background skill assignments.
