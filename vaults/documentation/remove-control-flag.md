# Remove Control Flag

A [[simplifying-conditionals-techniques|simplifying conditionals]] [[refactoring-techniques|technique]]. When a boolean variable acts as a control flag for multiple conditional expressions, replace it with `break`, `continue`, or `return` statements.

Control flags add an extra layer of indirection that makes the flow harder to follow. Direct flow-control statements are clearer.
