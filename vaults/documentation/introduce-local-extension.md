# Introduce Local Extension

A [[moving-features-techniques|moving features]] [[refactoring-techniques|technique]]. When a utility class lacks several methods you need, create a subclass or wrapper containing the additional methods.

More sustainable than [[introduce-foreign-method]] when multiple additions are required — it keeps all extensions in one place.

## See also

- [[incomplete-library-class-smell]] — the smell this technique addresses
