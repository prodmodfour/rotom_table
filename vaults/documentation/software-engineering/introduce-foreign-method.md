# Introduce Foreign Method

A [[moving-features-techniques|moving features]] [[refactoring-techniques|technique]]. When a utility class doesn't have a method you need and you can't modify the class, add the method to a client class and pass the utility object as an argument.

Use when only one or two extra methods are needed. For more, consider [[introduce-local-extension]] instead.

## See also

- [[incomplete-library-class-smell]] — the smell this technique addresses
