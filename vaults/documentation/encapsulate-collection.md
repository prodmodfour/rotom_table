# Encapsulate Collection

An [[organizing-data-techniques|organizing data]] [[refactoring-techniques|technique]]. When a getter returns a collection directly, make it return a read-only view and provide dedicated add/remove methods instead.

Prevents external code from modifying the collection in uncontrolled ways, preserving invariants.
