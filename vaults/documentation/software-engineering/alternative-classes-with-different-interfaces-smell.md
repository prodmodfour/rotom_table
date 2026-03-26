# Alternative Classes with Different Interfaces

An [[object-orientation-abuser-smells|object-orientation abuser]] [[code-smells|smell]]. Two classes that perform identical functions but expose different method names.

This fragmentation prevents treating the classes interchangeably and duplicates functionality under inconsistent naming. The fix is usually to rename methods to match, extract a shared interface, or merge the classes.

## See also

- [[extract-interface]] — the primary technique to align classes performing identical functions under different names
- [[rename-method]] — when only the naming differs
