# Consolidate Conditional Expression

A [[simplifying-conditionals-techniques|simplifying conditionals]] [[refactoring-techniques|technique]]. When multiple separate conditionals lead to the same result or action, merge them into a single conditional expression.

Consolidation makes it clear that several checks serve the same purpose, and the combined expression can then be [[extract-method|extracted into a named method]].
