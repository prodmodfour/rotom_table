# Duplicate Code

A [[dispensable-smells|dispensable]] [[code-smells|smell]]. Two or more code fragments that look almost identical. Changes to duplicated code must be replicated across every instance, increasing error risk and slowing development.

Merging duplicated code simplifies the structure and makes future changes require exactly one edit.

## See also

- [[extract-method]] — extract duplicated fragments into a shared method
- [[pull-up-method]] — when duplication appears across sibling subclasses
- [[rule-of-three]] — the heuristic for when duplicated code justifies extraction
- [[clean-code]] — the "no duplication" property
