Distinct game mechanics are implemented as independent operations even when they interact. Recall clearing conditions, terrain reapplying conditions, and type immunity preventing conditions are three separate operations — not one combined "handle conditions on switch" routine.

Merging interacting mechanics into a single operation makes the system fragile. If PTR errata changes how recall interacts with a specific condition, a merged operation forces you to untangle it from terrain logic and immunity logic. Separate operations mean each change touches only the mechanic it affects.

Each operation maps to a specific rule in PTR. [[recall-clears-then-source-reapplies]] works because recall-clearing and source-reapplying are independent steps that compose naturally. [[condition-source-tracking]] tracks where a condition came from so that reapplication can work without knowing about the clearing step.

## See also

- [[clear-then-reapply-pattern]] — the pattern that depends on mechanics staying separate
- [[condition-source-tracking]] — enables reapplication by tracking origin independently
- [[recall-clears-then-source-reapplies]] — the primary example of two separate mechanics composing
