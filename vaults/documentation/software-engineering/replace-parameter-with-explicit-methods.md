# Replace Parameter with Explicit Methods

A [[simplifying-method-calls-techniques|simplifying method calls]] [[refactoring-techniques|technique]]. When a method is split into parts that run depending on the value of a parameter, extract each part into its own standalone method.

Named methods are clearer than a parameter that silently selects behavior.

## See also

- [[parameterize-method]] — the inverse: merge similar methods into one with a parameter
