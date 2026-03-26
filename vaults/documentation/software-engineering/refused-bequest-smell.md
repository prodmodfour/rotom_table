# Refused Bequest

An [[object-orientation-abuser-smells|object-orientation abuser]] [[code-smells|smell]]. A subclass inherits methods and properties from a parent class but doesn't use them — either leaving them unused or overriding them to throw exceptions.

This indicates the subclass doesn't truly belong in the inheritance hierarchy. The design violates the [[liskov-substitution-principle]] because the subclass cannot substitute for the parent without breaking expectations.

## See also

- [[replace-inheritance-with-delegation]] — use composition when the subclass doesn't fit the hierarchy
- [[push-down-method]] — move unused inherited methods to the subclasses that actually use them
- [[push-down-field]] — move unused inherited fields to the subclasses that actually use them
