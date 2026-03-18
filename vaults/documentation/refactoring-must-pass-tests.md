# Refactoring Must Pass Tests

All existing tests must pass after [[refactoring]]. There are two cases when tests break after refactoring:

1. **You made an error during refactoring.** Fix the error.
2. **Your tests were too low-level** — for example, testing private methods of classes. In this case the tests are to blame. You can either refactor the tests themselves or write an entirely new set of higher-level tests. Writing BDD-style tests is a good way to avoid this situation.

## See also

- [[clean-code]] — passing all tests is a defining property of clean code
- [[test-coverage-gaps]] — areas where test coverage is weakest
