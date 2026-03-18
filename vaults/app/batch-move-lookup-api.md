`POST /api/moves/batch` (`app/server/api/moves/batch.post.ts`) is the primary move lookup endpoint. It accepts a `{ names: string[] }` body, queries the [[movedata-reference-table]] with a Prisma `findMany` using `{ name: { in: names } }`, and returns the matching `MoveData` records.

It enforces a maximum of 50 names per request and validates that all entries are strings.

The [[move-learning-panel]] uses this endpoint to fetch full details for moves identified by the [[level-up-check-utility]] as newly available.
