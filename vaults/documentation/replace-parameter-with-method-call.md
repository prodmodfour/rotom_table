# Replace Parameter with Method Call

A [[simplifying-method-calls-techniques|simplifying method calls]] [[refactoring-techniques|technique]]. When a caller computes a value and passes it as a parameter, but the method could compute it internally, let the method call the query itself.

Eliminates a parameter and removes redundant computation from the caller.
