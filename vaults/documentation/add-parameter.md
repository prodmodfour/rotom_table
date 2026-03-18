# Add Parameter

A [[simplifying-method-calls-techniques|simplifying method calls]] [[refactoring-techniques|technique]]. When a method doesn't have enough data to perform an action, add a new parameter to supply the missing information.

Use cautiously — adding parameters can lead to [[long-parameter-list-smell|long parameter lists]]. Consider whether the data could come from the method's own object or be computed internally instead.
