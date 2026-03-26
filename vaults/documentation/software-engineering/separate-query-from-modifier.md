# Separate Query from Modifier

A [[simplifying-method-calls-techniques|simplifying method calls]] [[refactoring-techniques|technique]]. When a method both returns a value and changes object state, split it into two methods — one that queries and one that modifies.

Queries should be safe to call without side effects. Modifiers should not surprise callers by also returning data that changes behavior.
