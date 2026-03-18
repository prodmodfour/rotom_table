# Simplifying Conditionals Techniques

A category of [[refactoring-techniques]] for reducing complexity in branching logic. Conditionals tend to get more complicated over time, and these techniques make them easier to read and maintain.

- [[decompose-conditional]] — extract condition, then-branch, and else-branch into named methods
- [[consolidate-conditional-expression]] — merge conditions that produce the same result
- [[consolidate-duplicate-conditional-fragments]] — move identical code out of all branches
- [[remove-control-flag]] — replace flag variables with `break`, `continue`, or `return`
- [[replace-nested-conditional-with-guard-clauses]] — flatten nesting with early returns
- [[replace-conditional-with-polymorphism]] — let subclasses handle type-based behavior
- [[introduce-null-object]] — replace null checks with a default-behavior object
- [[introduce-assertion]] — make implicit assumptions explicit

## See also

- [[switch-statements-smell]] — Replace Conditional with Polymorphism directly addresses this smell
