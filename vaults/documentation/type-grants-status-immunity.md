Certain types grant immunity to specific status conditions: Fire-type cannot be Burned, Electric-type cannot be Paralyzed, Poison-type cannot be Poisoned, Ice-type cannot be Frozen, and so on. These are hard rules in PTU — no amount of accuracy or effect stacking bypasses type immunity under normal circumstances.

The server enforces these immunities via [[server-enforcement-with-gm-override]]. When a condition infliction request arrives, the server checks the target's types against the [[type-status-immunity-utility]] lookup. If the type grants immunity, the infliction is rejected. The GM can override this for special scenarios — such as an ability that suppresses type-based immunities, or a custom move that explicitly bypasses them.

Type immunity checks happen *before* [[condition-source-tracking]] records anything. If the infliction is blocked by immunity, no condition instance is created and no source is tracked. This keeps the condition tracking system clean — it only contains conditions that actually took effect.

Dual-typed Pokemon need only one qualifying type to gain immunity. A Fire/Flying Pokemon is immune to Burn through its Fire type regardless of the Flying type.

## See also
- [[condition-source-tracking]] — immunity check happens before source tracking
- [[server-enforcement-with-gm-override]] — the enforcement pattern used
- [[type-status-immunity-utility]] — the lookup table of type-to-immunity mappings
- [[status-condition-categories]] — the conditions these immunities apply to
