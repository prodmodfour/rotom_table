# Remove Assignments to Parameters

A [[composing-methods-techniques|composing methods]] [[refactoring-techniques|technique]]. When a method reassigns a parameter's value, use a local variable instead.

Mutating parameters obscures the original input and can introduce side effects in languages that pass references. A local variable makes the modification explicit and safe.
