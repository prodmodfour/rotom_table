# Replace Error Code with Exception

A [[simplifying-method-calls-techniques|simplifying method calls]] [[refactoring-techniques|technique]]. When a method returns a special value to indicate an error, throw an exception instead.

Exceptions separate the error-handling path from the normal path, making both easier to follow. Callers can't accidentally ignore an exception the way they can ignore a return code.

## See also

- [[replace-exception-with-test]] — the inverse: when an exception is overkill and a simple conditional check suffices
