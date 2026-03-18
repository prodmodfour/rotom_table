# Moving Features Techniques

A category of [[refactoring-techniques]] for redistributing functionality between classes. These techniques help place methods, fields, and responsibilities where they naturally belong.

- [[move-method]] — relocate a method to the class that uses it most
- [[move-field]] — transfer a field to the class where it belongs
- [[extract-class]] — split a class doing two jobs into two classes
- [[inline-class]] — merge a class that does too little into another
- [[hide-delegate]] — add a delegating method to conceal an intermediate object
- [[remove-middle-man]] — let clients call the real object directly
- [[introduce-foreign-method]] — add a needed method to a client when you can't modify the utility class
- [[introduce-local-extension]] — create a wrapper or subclass to extend a utility class

## See also

- [[feature-envy-smell]] — the primary smell that Move Method and Move Field address
- [[middle-man-smell]] — the smell that Remove Middle Man addresses
- [[lazy-class-smell]] — Inline Class eliminates lazy classes
