The file `app/constants/statusConditions.ts` defines `STATUS_CONDITION_DEFS`, a `Record<StatusCondition, StatusConditionDef>` containing 19 status conditions. Each definition has a `category` (persistent, volatile, or other) and three boolean flags: `clearsOnFaint`, `clearsOnRecall`, `clearsOnEncounterEnd`.

**Persistent** (5): Burned, Frozen, Paralyzed, Poisoned, Badly Poisoned — all clear on faint, none clear on recall.

**Volatile** (8): Asleep, Bad Sleep, Confused, Flinched, Infatuated, Cursed, Disabled, Enraged, Suppressed. Asleep and Bad Sleep do not clear on recall or encounter end (decree-038).

**Other** (7): Fainted, Dead, Stuck, Slowed, Trapped, Tripped, Vulnerable. None clear on faint. Trapped prevents recall. Fainted and Dead never auto-clear.

The category field is for display grouping only — all game logic uses the per-condition boolean flags directly. Derived arrays (`PERSISTENT_CONDITIONS`, `VOLATILE_CONDITIONS`, etc.) are computed from the flags, not hardcoded.

Mechanic-specific arrays: `TICK_DAMAGE_CONDITIONS` (Burned, Poisoned, Badly Poisoned, Cursed) and `ZERO_EVASION_CONDITIONS` (Vulnerable, Frozen, Asleep).

`STATUS_CS_EFFECTS` defines combat stage penalties: Burned -2 Def, Paralyzed -4 Speed, Poisoned/Badly Poisoned -2 SpDef.

The [[encounter-status-conditions-modal]] renders these as checkboxes. The [[condition-source-clearing-rules]] extend the clearing logic with source-based overrides.
