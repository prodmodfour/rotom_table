Recalling a Pokemon clears its volatile conditions per PTR rules. If the Pokemon is sent back out into the same source (weather, terrain), the condition re-applies automatically.

This is the [[clear-then-reapply-pattern]] in action. The recall clearing rule and the source application rule are [[separate-mechanics-stay-separate|separate mechanics]] that execute independently:

1. **On recall**: the system processes condition clearing based on each condition's [[condition-independent-behavior-flags|behavior flags]]. Conditions with `clears-on-recall: true` are removed.
2. **On send-out**: the system checks active field sources (weather, terrain, entry hazards) and applies any conditions they impose, using [[condition-source-tracking]] to tag the new condition instance with its source.

Neither step knows about the other. The recall step doesn't check "will this condition be re-applied?" and the send-out step doesn't check "was this condition just cleared?" Each follows its own rules. The result is correct behavior without coupling.

This design also handles edge cases cleanly: if the weather changes while the Pokemon is in its ball, it won't re-apply the old weather condition on send-out — it applies whatever the *current* sources impose.

## See also
- [[clear-then-reapply-pattern]] — the general pattern this exemplifies
- [[condition-source-tracking]] — tags re-applied conditions with their source
- [[separate-mechanics-stay-separate]] — the design principle keeping these steps independent
- [[switching-system]] — recall and send-out are part of the switching flow
- [[deployment-state-model]] — recall moves Pokemon from active to reserve; send-out reverses it
