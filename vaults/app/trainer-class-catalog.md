The file `app/constants/trainerClasses.ts` defines 38 trainer classes organized into six categories:

- **Introductory** (6): Ace Trainer, Capture Specialist, Commander, Coordinator, Hobbyist, Mentor
- **Battling Style** (7): Cheerleader, Duelist, Enduring Soul, Juggler, Rider, Taskmaster, Trickster
- **Specialist Team** (3): Stat Ace, Style Expert, Type Ace — all branching
- **Professional** (5): Chef, Chronicler, Fashionista, Researcher (branching), Survivalist
- **Fighter** (9): Athlete, Dancer, Hunter, Martial Artist, Musician, Provocateur, Rogue, Roughneck, Tumbler
- **Supernatural** (9): Aura Guardian, Channeler, Hex Maniac, Ninja, Oracle, Sage, Telekinetic, Telepath, Warper

Each class has a name, category, associated skills, and description. The maximum is 4 classes per character (`MAX_TRAINER_CLASSES = 4`).

Four classes are branching (can be taken multiple times with different specializations): Type Ace (18 Pokemon types), Stat Ace (5 combat stats), Style Expert (5 contest stats), and Researcher (9 Fields of Study). Branching class entries are stored as "ClassName: Specialization" (e.g., "Type Ace: Fire"). Helper functions `hasBaseClass()`, `getBaseClassName()`, and `getSpecialization()` parse these entries.

## See also

- [[trainer-level-up-class-step]]
