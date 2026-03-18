The `useTrainerXp` composable in `app/composables/useTrainerXp.ts` wraps the [[trainer-xp-api-endpoint]] with reactive state.

It provides `isProcessing`, `error`, `lastResult`, and `pendingLevelUp`. The `pendingLevelUp` flag signals to the hosting page that a level-up occurred and the [[trainer-level-up-modal]] should open.

Used by the [[gm-character-detail-xp-section]] (TrainerXpPanel) and the QuestXpDialog for awarding trainer XP.
