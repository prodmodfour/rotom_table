# Composing Methods Techniques

A category of [[refactoring-techniques]] focused on streamlining methods. Much of [[refactoring]] is devoted to correctly composing methods, since excessively long methods are a root cause of many problems.

- [[extract-method]] — pull a code fragment into a new method
- [[inline-method]] — replace a method call with its body
- [[extract-variable]] — name a complex expression with a local variable
- [[inline-temp]] — replace a trivial temporary variable with its expression
- [[replace-temp-with-query]] — turn a temp into a reusable query method
- [[split-temporary-variable]] — give each assignment its own variable
- [[remove-assignments-to-parameters]] — use a local variable instead of mutating a parameter
- [[replace-method-with-method-object]] — convert a tangled method into its own class
- [[substitute-algorithm]] — replace a method's algorithm with a clearer one

## See also

- [[long-method-smell]] — the primary smell these techniques address
