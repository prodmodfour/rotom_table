# Introduce Null Object

A [[simplifying-conditionals-techniques|simplifying conditionals]] [[refactoring-techniques|technique]]. When methods return `null` and the codebase is littered with null checks, create a null object that provides default behavior instead.

Callers use the null object like any other instance, eliminating the need for special-case checks.
