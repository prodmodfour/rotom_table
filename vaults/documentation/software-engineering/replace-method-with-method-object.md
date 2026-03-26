# Replace Method with Method Object

A [[composing-methods-techniques|composing methods]] [[refactoring-techniques|technique]]. When a long method has local variables so intertwined that [[extract-method]] can't be applied, convert the entire method into a separate class. Local variables become fields, and the method body becomes the class's main method.

Once the logic lives in its own class, [[extract-method]] can be applied freely since the fields are shared across all methods in the class.

## See also

- [[long-method-smell]] — this technique is a last resort for methods too tangled for simpler extraction
