All server API routes use Nuxt's file-based REST routing under `app/server/api/`. There is no tRPC, GraphQL, or custom router. Each route file exports a `defineEventHandler` and the filename convention determines the HTTP method and path:

- `index.get.ts` → `GET /api/{resource}`
- `index.post.ts` → `POST /api/{resource}`
- `[id].get.ts` → `GET /api/{resource}/:id`
- `[id].put.ts` → `PUT /api/{resource}/:id`
- `[id].delete.ts` → `DELETE /api/{resource}/:id`
- `[id]/action.post.ts` → `POST /api/{resource}/:id/action`

Nested directories create nested URL segments. The [[encounter-table-api-is-nested-rest-hierarchy]] goes three levels deep (table → modification → entry).

## See also

- [[api-response-envelope-wraps-success-and-data]]
- [[route-handlers-delegate-to-services-for-complex-logic]]
