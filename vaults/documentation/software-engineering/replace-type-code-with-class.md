# Replace Type Code with Class

An [[organizing-data-techniques|organizing data]] [[refactoring-techniques|technique]]. When a class uses numeric or string type codes that don't affect behavior, replace them with a dedicated class whose instances represent each type.

Provides type safety and prevents invalid values.

## See also

- [[primitive-obsession-smell]] — type codes are a common form of primitive obsession
- [[replace-type-code-with-subclasses]] — when the type code affects behavior, subclasses are needed instead
