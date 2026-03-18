The file `app/constants/conditionSourceRules.ts` defines source-dependent clearing rules for condition instances (decree-047). When a condition is applied, its source type determines how it clears.

`SOURCE_CLEARING_RULES` maps 9 source types to clearing overrides:
- **move / ability / item** — clear on faint (standard behavior)
- **terrain / weather** — do not clear on faint, do clear on recall (decree-053)
- **environment / manual** — never auto-clear
- **system** — only overrides `clearsOnFaint` to false (lets per-condition static flags handle the rest, used for breather conditions)
- **unknown** — no overrides (falls back to static flags)

Three functions implement the 3-tier clearing logic: `shouldClearOnFaint()`, `shouldClearOnRecall()`, `shouldClearOnEncounterEnd()`. For persistent/volatile conditions, static flags from [[status-condition-definitions-constant]] always apply. For "other" conditions, source-based overrides are checked first, then static flags as fallback.

`buildUnknownSourceInstance()` and `buildManualSourceInstance()` are factory functions for creating `ConditionInstance` objects with the appropriate source type.

`formatConditionDisplay()` formats condition names with source labels for "Other" category conditions (e.g., "Slowed (from weather)").
