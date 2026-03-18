# Service Delegation Rule

API routes must not contain business logic. The required pattern for every [[api-endpoint-layout|endpoint]]:

1. Parse request (`readBody`, `getQuery`, `getRouterParam`)
2. Validate required fields (manual check or Zod)
3. Call service function(s) from `server/services/`
4. Return `{ success: true, data: result }`

Simple CRUD endpoints may work directly with Prisma plus serializer utilities from `server/utils/serializers.ts`, but any logic beyond basic read/write must live in a service.

This is the server-side application of the [[service-layer-pattern]] and the [[single-responsibility-principle]]. The [[api-to-service-mapping]] documents which API directories delegate to which services.

## See also

- [[routes-bypass-service-layer]] — 137/158 routes violate this rule by importing Prisma directly
- [[next-turn-route-business-logic]] — the most extreme violation at 846 lines
- [[heavily-injured-penalty-duplication]] — business logic in routes instead of services
