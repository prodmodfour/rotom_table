# Tell, Don't Ask

"Tell objects what to do; don't ask them for data and do it yourself."

Instead of pulling data out of an object, computing a result, and pushing it back, push the behavior to the object that owns the data. The object that holds the state should also hold the logic that operates on it.

Analogy: instead of asking a barista for the espresso machine, the milk, the cup, and the syrup so you can make your own latte, you tell the barista "one latte please" and let them handle the preparation.

In code: instead of `if (combatant.hp <= 0 && combatant.injuries >= combatant.maxInjuries) { markFainted(combatant) }`, the combatant should expose `combatant.checkFaintCondition()` — the data and the decision live together.

Tell Don't Ask is complementary to the [[law-of-demeter]]. Demeter says "don't reach into an object's structure." Tell Don't Ask says "don't pull data out to compute externally." Together they push both access and behavior toward the data owner, naturally narrowing interfaces and eliminating [[feature-envy-smell]].

Originated from the Pragmatic Programmers (Andy Hunt and Dave Thomas).

## See also

- [[law-of-demeter]] — complementary principle; Demeter restricts structural access, Tell Don't Ask restricts behavioral access
- [[feature-envy-smell]] — a method that asks another object for its data and computes on it is the defining smell of violating this principle
- [[data-class-smell]] — a class that only holds data and lets others compute on it is a Tell Don't Ask violation by design
- [[command-pattern]] — encapsulates a request as an object that knows how to execute itself
- [[strategy-pattern]] — delegates algorithmic decisions to the object that holds the algorithm, not the caller
- [[state-pattern]] — the object's state determines its own behavior without external inspection
- [[move-method]] — the primary refactoring technique for fixing Tell Don't Ask violations
- [[single-responsibility-principle]] — pushing behavior to the data owner often consolidates responsibilities in the right place
