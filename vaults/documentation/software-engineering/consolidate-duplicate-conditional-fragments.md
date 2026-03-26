# Consolidate Duplicate Conditional Fragments

A [[simplifying-conditionals-techniques|simplifying conditionals]] [[refactoring-techniques|technique]]. When the same code appears in every branch of a conditional, move it outside the conditional structure.

If code runs regardless of which branch is taken, it doesn't belong inside the branches.

## See also

- [[duplicate-code-smell]] — this technique eliminates a specific form of duplication
