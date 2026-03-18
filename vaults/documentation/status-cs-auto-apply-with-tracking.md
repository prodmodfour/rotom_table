When a status condition has an associated combat stage change (e.g., Burn applies -2 Def CS), the app applies it automatically on infliction and reverses it on cure. This is [[automate-routine-bookkeeping]] — players and GMs shouldn't have to remember to manually adjust combat stages every time a condition is applied or removed.

The [[condition-source-tracking]] system tracks which CS changes came from which condition. This means curing Burn removes exactly the -2 Def penalty it applied, even if other effects (moves, abilities, items) also modified Defense. Without source tracking, curing Burn would either need to blindly add +2 Def (wrong if the penalty was already partially offset) or require manual GM intervention.

The tracking also handles Take a Breather correctly. When a Pokemon uses Take a Breather, all CS changes reset to 0 — including the Burn penalty. But Burn is still active, so the -2 Def reapplies. The system records this as a fresh application from the same source, maintaining accurate bookkeeping through the [[take-a-breather-mechanics|Take a Breather]] reset.

## See also
- [[condition-source-tracking]] — the system that enables precise CS reversal
- [[automate-routine-bookkeeping]] — the design principle this implements
- [[combat-stage-system]] — where CS changes are tracked and applied
- [[take-a-breather-mechanics]] — interaction with CS reset
