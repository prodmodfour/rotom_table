# Primitive Obsession

A [[bloater-smells|bloater]] [[code-smells|smell]]. Using primitive types (strings, numbers, booleans) instead of small objects for domain concepts like currency, ranges, or phone numbers. Also includes using constants for encoding information (e.g., `USER_ADMIN_ROLE = 1`) and string constants as field names.

Primitives scatter validation logic and reduce type safety. Small domain objects keep related behavior together and make the code more expressive.

## See also

- [[replace-data-value-with-object]] — the primary technique for curing primitive obsession
- [[replace-type-code-with-class]] — when the primitive is a type code
- [[replace-magic-number-with-symbolic-constant]] — when the primitive is a magic number
- [[player-action-request-optionals]] — bag of optional primitives where a structured union would be safer
