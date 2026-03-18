The 23 service files in `app/server/services/` are stateless modules exporting pure or async functions. There are no classes, no singletons, and no dependency injection. Each function accepts data (usually Prisma records or parsed JSON) and returns results.

Services never hold state between requests — all persistent state lives in the database, and all transient state lives in the [[wild-spawn-and-map-use-server-in-memory-singletons]] or the [[websocket-peer-map-tracks-connected-clients]].

Most service functions return new objects rather than mutating inputs. Where mutation occurs (e.g., modifying freshly-parsed combatant arrays), comments explicitly note that mutation is acceptable because the data was just deserialized.

## See also

- [[route-handlers-delegate-to-services-for-complex-logic]]
- [[encounter-service-is-the-combat-engine-core]]
- [[entity-builder-maps-prisma-records-to-typed-entities]] — pure data mapping service
- [[scene-service-restores-ap-on-deactivation]] — scene lifecycle side effects
- [[rest-healing-service-refreshes-daily-moves]] — daily move refresh logic
- [[csv-import-service-parses-ptu-character-sheets]] — CSV import pipeline
- [[grid-placement-positions-tokens-avoiding-collisions]] — token auto-placement
- [[ball-condition-service-builds-capture-modifier-context]] — capture context builder


- [[stateless-service-stores-wrap-api-calls]] — client-side Pinia stores that follow a similar stateless pattern