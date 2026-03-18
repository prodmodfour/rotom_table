# Remove Setting Method

A [[simplifying-method-calls-techniques|simplifying method calls]] [[refactoring-techniques|technique]]. When a field's value should be set only at creation time and never changed afterward, delete its setter method.

This enforces immutability by making the design constraint visible in the API.
