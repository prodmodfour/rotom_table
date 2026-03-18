The encounter tables store performs optimistic local updates when an entry's weight is changed via `updateEntry`. It immediately modifies the entry's weight in the local `tables` array before the API call completes.

This makes [[entry-row-supports-inline-weight-and-level-editing]] feel responsive — the chance percentage recalculates instantly without waiting for a server round-trip. Other mutations (add entry, remove entry, modify level range) reload the full table from the API instead of updating optimistically.

## See also

- [[encounter-table-store-centralizes-state-and-api-calls]]
- [[habitat-weight-determines-encounter-chance]]
