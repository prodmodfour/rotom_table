# Simplifying Method Calls Techniques

A category of [[refactoring-techniques]] for making method interfaces cleaner, more intuitive, and easier to use. These techniques improve how classes talk to each other.

- [[rename-method]] — give a method a name that explains what it does
- [[add-parameter]] — add a parameter a method needs
- [[remove-parameter]] — remove a parameter a method doesn't use
- [[separate-query-from-modifier]] — split a method that reads and writes into two
- [[parameterize-method]] — merge similar methods into one with a parameter
- [[replace-parameter-with-explicit-methods]] — split a parameterized method into distinct methods
- [[preserve-whole-object]] — pass an object instead of extracting its fields
- [[replace-parameter-with-method-call]] — let the method compute a value instead of receiving it
- [[introduce-parameter-object]] — bundle repeated parameter groups into an object
- [[remove-setting-method]] — delete setters for fields that shouldn't change after creation
- [[hide-method]] — reduce visibility of methods only used internally
- [[replace-constructor-with-factory-method]] — use a factory method for complex creation
- [[replace-error-code-with-exception]] — throw exceptions instead of returning error codes
- [[replace-exception-with-test]] — use a conditional check instead of catching an exception

## See also

- [[long-parameter-list-smell]] — Introduce Parameter Object and Preserve Whole Object address this smell
- [[data-clumps-smell]] — Introduce Parameter Object addresses repeated parameter groups
