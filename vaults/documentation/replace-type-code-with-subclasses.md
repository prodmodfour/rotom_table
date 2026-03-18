# Replace Type Code with Subclasses

An [[organizing-data-techniques|organizing data]] [[refactoring-techniques|technique]]. When a type code directly affects program behavior through conditional logic, create subclasses for each type and move the type-specific behavior into them.

Replaces conditionals with polymorphism.

## See also

- [[switch-statements-smell]] — this technique eliminates type-based switch/if chains
- [[replace-conditional-with-polymorphism]] — the conditional-focused view of the same idea
- [[replace-type-code-with-state-strategy]] — alternative when subclassing the original class isn't possible
