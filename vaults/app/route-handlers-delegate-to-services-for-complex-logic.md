Route handlers follow a two-tier pattern. Simple CRUD endpoints call Prisma directly and use shared [[serializers-parse-json-columns-into-typed-objects]] to shape responses. Complex endpoints delegate to service functions for business logic.

A simple route like `GET /api/characters` calls `prisma.humanCharacter.findMany()` directly, then maps results through `serializeCharacterSummary()`.

A complex route like `POST /api/encounters/:id/damage` imports from five services — [[encounter-service-is-the-combat-engine-core]], combatant service, [[entity-update-service-syncs-combatants-back-to-db]], mounting service, and living weapon service — composing them to apply damage with all PTU side effects.

Route handlers are responsible for extracting params (`getRouterParam`), reading bodies (`readBody`), inline validation, and wrapping responses. They never contain reusable business logic.

## See also

- [[server-uses-nuxt-file-based-rest-routing]]
- [[services-are-stateless-function-modules]]
