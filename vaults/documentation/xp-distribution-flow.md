# XP Distribution Flow

Post-combat XP calculation and distribution to Pokemon and trainers.

## API

- `POST /api/encounters/:id/xp-calculate` — preview XP breakdown + participating Pokemon (read-only).
- `POST .../xp-distribute` — apply XP to Pokemon: updates experience, level, tutorPoints.
- `POST .../trainer-xp-distribute` — batch-award trainer XP to multiple trainers. Sequential processing, encounter validation, auto-level at 10 XP, WebSocket broadcast on level change.

## Components

`XpDistributionModal.vue` — post-combat XP allocation per player/Pokemon, includes trainer XP section with result display and partial failure handling.

`TrainerXpSection.vue` — per-trainer XP input with significance-based suggestion, quick-set, level-up preview.

`LevelUpNotification.vue` — aggregated level-up details shown after XP distribution.

## Store

`encounterXp` (see [[pinia-store-classification]]).

## See also

- [[significance-and-budget]] — budget/XP formulas and significance presets
- [[faint-and-revival-effects]] — defeated enemies recorded for XP on faint
- [[trainer-xp-system]]
- [[pokemon-experience-chart]] — underlying XP thresholds and level-up detection
- [[pokemon-hp-formula]] — HP recalculated on level-up during distribution
