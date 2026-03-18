# Trainer XP System

Trainer experience and leveling logic.

## Pure Logic

`utils/trainerExperience.ts`:

- `applyTrainerXp` — Bank calculation with multi-level jump support, `isNewSpecies` check. Capture-triggered XP uses [[trainer-owned-species-tracking]].
- `validateTrainerLevel` — Bounds check, returns error string or null.
- `TRAINER_XP_SUGGESTIONS` — Per decree-030, x5 cap.
- `SIGNIFICANCE_TO_TRAINER_XP` — Maps [[significance-and-budget|significance tiers]] to suggested XP amounts.
- `TRAINER_MIN_LEVEL` = 1, `TRAINER_MAX_LEVEL` = 50, `TRAINER_XP_PER_LEVEL` = 10.

## Composable

`composables/useTrainerXp.ts` — `awardXp`, `deductXp`, `clearPendingLevelUp`, processing/error state. Part of the [[composable-domain-grouping|Character/Trainer domain]].

## Components

- **TrainerXpPanel.vue** — Quick award buttons (+1/+2/+3/+5), deduct (-1), custom amount/reason input, progress bar, max level indicator. Emits `xp-changed` and `level-up`. Used in CharacterModal.vue view mode.
- **TrainerXpSection.vue** — Per-trainer XP input in post-encounter flow. Suggested XP from significance tier, apply-to-all button, quick-set values, level-up preview per trainer. Used in [[xp-distribution-flow]].
- **QuestXpDialog.vue** — Award quest/milestone XP to all characters in a scene. Amount input, reason field, per-character level-up preview, sequential API calls. Used in scene detail `gm/scenes/[id].vue`.

## API

POST `/api/characters/:id/xp` and GET `/api/characters/:id/xp-history`. See [[character-api-endpoints]].

## See also

- [[trainer-level-up-wizard]]
- [[character-api-endpoints]]
