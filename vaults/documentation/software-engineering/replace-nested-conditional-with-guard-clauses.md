# Replace Nested Conditional with Guard Clauses

A [[simplifying-conditionals-techniques|simplifying conditionals]] [[refactoring-techniques|technique]]. When deeply nested conditionals obscure the normal execution path, isolate edge cases and special checks into guard clauses (early returns) at the top of the method.

Guard clauses flatten the nesting and make the happy path obvious.
