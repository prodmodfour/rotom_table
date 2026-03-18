The file `app/utils/trainerExperience.ts` defines XP suggestion tiers for the GM when awarding trainer XP:

- None (0 XP) — Weak/average wild Pokemon
- Low (1 XP) — Average trainer encounter
- Moderate (2 XP) — Challenging trainer battle
- Significant (3 XP) — Important battle or rival encounter
- Major (4 XP) — Significant non-milestone event
- Critical (5 XP) — Near-milestone battle or major story event

A separate `SIGNIFICANCE_TO_TRAINER_XP` mapping connects encounter significance tiers to suggested XP: insignificant = 0, everyday = 1, significant = 3.

These suggestions are capped at x5 and are used by the [[gm-character-detail-xp-section]] and encounter trainer XP section for quick-award buttons.

## See also

- [[trainer-xp-bank-system]]
