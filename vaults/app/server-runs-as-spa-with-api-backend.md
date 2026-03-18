The Nuxt config sets `ssr: false`, so the server does not render pages on the server side. It serves the SPA bundle as static files and handles API routes plus WebSocket connections. The client-side Vue app handles all rendering and routing.

The server's responsibilities are:

1. Serve the static SPA bundle
2. Handle REST API requests under `/api/`
3. Manage the [[websocket-handler-routes-messages-by-type]] at `/ws`
4. Host the SQLite database via [[prisma-uses-sqlite-with-json-columns-pattern]]

The `@pinia/nuxt` module is registered for client-side state management. Devtools are enabled in development.

## See also

- [[server-has-no-auth-or-middleware]]
- [[server-uses-nuxt-file-based-rest-routing]]


- [[all-stores-use-pinia-options-api]] — the Pinia stores that the `@pinia/nuxt` module enables
- [[stores-instantiate-lazily-per-page]] — how stores activate at runtime
- [[stores-use-dollar-fetch-for-api-calls]] —  is preferred over useFetch because the app runs as an SPA