Every API endpoint returns responses in a `{ success: true, data: ... }` envelope on success. On failure, endpoints throw `createError({ statusCode, message })` which Nuxt's H3 layer converts to an error response.

This envelope is consistent across all resource types — characters, Pokemon, encounters, scenes, species, encounter tables, and encounter templates all follow this pattern. The client-side stores and composables expect this shape.

## See also

- [[server-uses-nuxt-file-based-rest-routing]]
