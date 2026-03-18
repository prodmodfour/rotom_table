# Extract Method

A [[composing-methods-techniques|composing methods]] [[refactoring-techniques|technique]]. Move a code fragment into a separate new method with a name that explains its purpose, and replace the original fragment with a call to the method.

Use when you have a block of logic that can be isolated — especially when it could be reused or when the method it lives in has grown too long.

## See also

- [[long-method-smell]] — the primary smell this technique addresses
- [[extract-variable]] — for expressions that need naming but not a full method
- [[heavily-injured-penalty-extraction]] — extracting a flow duplicated across 12 routes
