# Dealing with Generalization Techniques

A category of [[refactoring-techniques]] for managing inheritance hierarchies and abstractions. These techniques move behavior up and down class trees, extract or collapse hierarchies, and choose between inheritance and delegation.

- [[pull-up-field]] — move a shared field to the parent class
- [[pull-up-method]] — move a shared method to the parent class
- [[pull-up-constructor-body]] — share constructor logic in the parent class
- [[push-down-field]] — move a field used by few subclasses into those subclasses
- [[push-down-method]] — move a method used by few subclasses into those subclasses
- [[extract-subclass]] — create a subclass for conditionally-used features
- [[extract-superclass]] — create a parent class for shared functionality
- [[extract-interface]] — define a contract from a shared subset of methods
- [[collapse-hierarchy]] — merge a subclass that adds nothing into its parent
- [[form-template-method]] — define an algorithm skeleton in the parent, let subclasses fill in steps
- [[replace-inheritance-with-delegation]] — use composition when inheritance is too broad
- [[replace-delegation-with-inheritance]] — use inheritance when delegation becomes excessive

## See also

- [[refused-bequest-smell]] — Push Down Method/Field and Replace Inheritance with Delegation address this smell
- [[duplicate-code-smell]] — Pull Up Method/Field eliminate duplication across subclasses
- [[parallel-inheritance-hierarchies-smell]] — these techniques help collapse parallel hierarchies
