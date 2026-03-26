# Replace Exception with Test

A [[simplifying-method-calls-techniques|simplifying method calls]] [[refactoring-techniques|technique]]. When an exception is thrown in a place where a simple conditional check would work, replace the try-catch with a test.

Exceptions should signal genuinely unexpected situations. Using them for predictable conditions is slower and harder to follow.

## See also

- [[replace-error-code-with-exception]] — the inverse: when a return code is too easy to ignore
