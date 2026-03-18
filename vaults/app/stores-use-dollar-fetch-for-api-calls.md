# Stores Use $fetch for API Calls

Every store that makes API calls uses Nuxt's `$fetch` utility rather than `useFetch` or `useAsyncData`. This applies to all API-calling stores: [[encounter-store-is-largest-hub-store|encounter]], [[encounter-table-store-centralizes-state-and-api-calls|encounterTables]], [[encounter-library-store-manages-client-state|encounterLibrary]], [[library-store-loads-humans-and-pokemon-in-parallel|library]], [[group-view-store-manages-wild-spawn-and-map|groupView]], [[group-view-tabs-store-is-present-on-every-gm-page|groupViewTabs]], and the three [[stateless-service-stores-wrap-api-calls|stateless service stores]].

`$fetch` is a direct HTTP call with no SSR deduplication, no automatic refetching on navigation, and no hydration payload. Since store actions are called imperatively (on page mount, on user interaction, on WebSocket events), the reactive data-fetching features of `useFetch` are unnecessary. The trade-off is that the app fetches data again on every full page reload rather than rehydrating from an SSR payload.

## See also

- [[server-runs-as-spa-with-api-backend]] — the app is an SPA, so SSR hydration matters less