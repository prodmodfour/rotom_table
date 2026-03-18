The `playedBy` field on HumanCharacter is an optional string storing the player's real name (e.g. "Alex", "Jordan"). It appears in the [[players-endpoint-filters-by-character-type-and-library|player picker API response]] and the [[gm-character-detail-identity-section|GM identity section]], but serves no functional role.

It does not establish ownership, restrict access, or drive any logic. Any client can select any character regardless of the `playedBy` value. The field exists as a label for the GM's reference — a reminder of which real person plays which character.

## See also

- [[player-has-no-account-system]] — the broader absence of user accounts that makes ownership meaningless
- [[prisma-schema-has-fourteen-models]] — the schema where this field is defined