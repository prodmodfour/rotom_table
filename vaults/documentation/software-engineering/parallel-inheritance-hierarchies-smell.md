# Parallel Inheritance Hierarchies

A [[change-preventer-smells|change preventer]] [[code-smells|smell]]. Whenever you create a subclass for one class, you find yourself needing to create a matching subclass for another class. The two hierarchies grow in lockstep.

This creates unnecessary duplication of structure and forces maintenance of synchronized inheritance trees. Typically fixed by merging or delegating so one hierarchy references the other instead of mirroring it.

## See also

- [[shotgun-surgery-smell]] — a special case where the "surgery" is always creating paired subclasses
