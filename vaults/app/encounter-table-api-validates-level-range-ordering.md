Every encounter table API endpoint that accepts level range inputs validates that `levelMin <= levelMax`. This applies to table creation, table updates, entry creation, entry updates, modification creation, modification updates, modification entry creation, and import.

For entry updates specifically, the validation handles partial updates — if only `levelMin` is provided, it's checked against the entry's existing `levelMax`, and vice versa. This prevents a partial update from creating an invalid range.

The [[encounter-table-entry-prevents-duplicate-species]] constraint is another server-side validation alongside this one.

## See also

- [[encounter-table-api-is-nested-rest-hierarchy]]
