# Replace Constructor with Factory Method

A [[simplifying-method-calls-techniques|simplifying method calls]] [[refactoring-techniques|technique]]. When a constructor does more than setting field values — such as choosing subclasses, caching, or complex initialization — replace it with a factory method.

Factory methods can have descriptive names, return different subtypes, and encapsulate creation logic.

## See also

- [[factory-method-pattern]] — the design pattern that formalizes this technique
