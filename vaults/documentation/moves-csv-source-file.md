The raw CSV file that serves as the import source for move data. Contains columns for all move properties including ability interaction flags (e.g., Technician eligibility, contact status).

The CSV is processed by the [[seed-data-pipeline]] to populate the [[movedata-reference-table]]. Ability interaction flags in the CSV allow the app to pre-compute which moves qualify for bonuses like Technician without runtime parsing.

## See also

- [[movedata-reference-table]] — the structured table this CSV populates
- [[seed-data-pipeline]] — the process that ingests the CSV
