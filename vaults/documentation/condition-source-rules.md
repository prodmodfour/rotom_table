# Condition Source Rules

Source-dependent clearing rules for condition instances in `constants/conditionSourceRules.ts`, per decree-047.

**Map:** `SOURCE_CLEARING_RULES` — maps `ConditionSourceType` to clearing behavior overrides for Other-category conditions. Pure functions check source-based overrides for Other conditions and fall back to static per-condition flags for Persistent/Volatile conditions:

- `shouldClearOnFaint(condition)` — whether the condition clears when the combatant faints.
- `shouldClearOnRecall(condition)` — whether the condition clears when the combatant is recalled.
- `shouldClearOnEncounterEnd(condition)` — whether the condition clears at encounter end.

**Builder helpers:** `buildUnknownSourceInstance`, `buildManualSourceInstance` — construct condition instances with the correct source metadata.

**Display:** `formatConditionDisplay` — formats condition name with source labels for the GM view.

## See also

- [[turn-lifecycle]]
