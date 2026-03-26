# Replace Subclass with Fields

An [[organizing-data-techniques|organizing data]] [[refactoring-techniques|technique]]. When subclasses differ only in methods that return constants, replace those methods with fields in the parent class and delete the subclasses.

Eliminates unnecessary hierarchy when the subclasses add no real behavioral variation.

## See also

- [[collapse-hierarchy]] — a related technique for merging subclasses that add nothing
