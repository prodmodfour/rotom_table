# Encapsulate Field

An [[organizing-data-techniques|organizing data]] [[refactoring-techniques|technique]]. Make a public field private and create getter/setter methods for it.

Direct public access to fields allows uncontrolled modification. Accessors provide a single point of control for validation, logging, or lazy initialization.

## See also

- [[self-encapsulate-field]] — the internal version: using accessors within the owning class itself
