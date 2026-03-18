The file `app/constants/trainerBackgrounds.ts` defines `SAMPLE_BACKGROUNDS`, an array of 11 PTU sample backgrounds from PTU Core pp.14-15. Each background has a `TrainerBackground` shape: a name, description, one skill raised to Adept, one raised to Novice, and exactly three lowered to Pathetic.

The 11 backgrounds and their Adept skills are: Fitness Training (Athletics), Book Worm (General Ed), Hermit (Occult Ed), Old Timer (Focus), Quick and Small (Acrobatics), Rough (Combat), Silver Tongued (Guile), Street Rattata (Guile), Super Nerd (Technology Ed), Wild Child (Survival), At Least He's Pretty (Charm).

The `TrainerBackground` interface imports `PtuSkillName` from [[trainer-skill-categories-and-ranks|trainerSkills.ts]], constraining all skill references to the 17 valid PTU skill names.

The [[full-create-background-and-skills-section]] consumes this array to populate the background dropdown, and the [[background-selection-updates-skills]] behavior applies the selected background's rank assignments.
