---
cap_id: character-lifecycle-C060
name: character-lifecycle-C060
type: —
domain: character-lifecycle
---

### character-lifecycle-C060
- **name:** TRAINER_CLASSES constant
- **type:** constant
- **location:** `app/constants/trainerClasses.ts`
- **game_concept:** PTU Trainer Class reference data (PTU Core Ch. 4, pp. 65-166)
- **description:** Array of 38 TrainerClassDef objects organized into 6 categories (Introductory: 6, Battling Style: 7, Specialist Team: 3, Professional: 5, Fighter: 9, Supernatural: 8). Each entry has name, category, associatedSkills[], description, optional isBranching flag. Exports TRAINER_CLASS_CATEGORIES[], MAX_TRAINER_CLASSES (4), getClassesByCategory() helper.
- **inputs:** N/A (static data)
- **outputs:** TrainerClassDef[], TrainerClassCategory[], MAX_TRAINER_CLASSES, getClassesByCategory()
- **accessible_from:** gm
