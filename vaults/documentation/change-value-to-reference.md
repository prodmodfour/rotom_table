# Change Value to Reference

An [[organizing-data-techniques|organizing data]] [[refactoring-techniques|technique]]. When multiple identical instances of an object exist and should be consolidated into one, convert them into a single reference object shared by all users.

Ensures consistency — changes to the shared object are immediately visible everywhere.

## See also

- [[change-reference-to-value]] — the inverse: when a shared reference should become an independent value
