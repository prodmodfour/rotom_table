# Organizing Data Techniques

A category of [[refactoring-techniques]] for improving how data is stored, accessed, and represented. These techniques replace primitives with rich objects, control field access, and simplify type hierarchies.

- [[self-encapsulate-field]] — access own fields through getters/setters
- [[replace-data-value-with-object]] — turn a primitive into a domain object
- [[change-value-to-reference]] — consolidate duplicate value objects into a shared reference
- [[change-reference-to-value]] — replace a managed reference with an immutable value
- [[replace-array-with-object]] — replace a mixed-type array with a typed object
- [[duplicate-observed-data]] — separate domain data from GUI classes
- [[change-unidirectional-to-bidirectional-association]] — add a reverse link between classes
- [[change-bidirectional-to-unidirectional-association]] — remove an unnecessary reverse link
- [[replace-magic-number-with-symbolic-constant]] — name a magic number
- [[encapsulate-field]] — make a public field private with accessors
- [[encapsulate-collection]] — return read-only views and provide add/remove methods
- [[replace-type-code-with-class]] — replace a type code with a class
- [[replace-type-code-with-subclasses]] — replace a behavior-affecting type code with subclasses
- [[replace-type-code-with-state-strategy]] — use State/Strategy when subclassing isn't possible
- [[replace-subclass-with-fields]] — collapse subclasses that differ only in constants

## See also

- [[primitive-obsession-smell]] — several techniques here directly cure primitive obsession
