# Self Encapsulate Field

An [[organizing-data-techniques|organizing data]] [[refactoring-techniques|technique]]. Create a getter and setter for a field, then use only those accessors within the class itself — not the field directly.

Enables subclasses to override how the field is accessed and makes it easier to add validation or lazy initialization later.

## See also

- [[encapsulate-field]] — the external version: hiding a public field behind accessors
