# Parameterize Method

A [[simplifying-method-calls-techniques|simplifying method calls]] [[refactoring-techniques|technique]]. When multiple methods perform similar actions differing only in internal values or operations, merge them into one method that takes a parameter for the varying element.

Reduces [[duplicate-code-smell|duplication]] while keeping behavior configurable.

## See also

- [[replace-parameter-with-explicit-methods]] — the inverse: split a parameterized method into distinct methods when the parameter creates unclear branching
