The import endpoint at `POST /api/player/import/:characterId` uses a Zod schema that whitelists exactly which fields a player can modify offline. For characters: `background`, `personality`, `goals`, `notes`. For Pokemon: `nickname`, `heldItem`, and `moves` (reorder only — only moves already present on the server are accepted).

Conflict detection compares each entity's `updatedAt` timestamp against the export's `exportedAt`. If the server record was modified after the export, any differing field is flagged as a conflict and the server value wins. Non-conflicting changes apply normally.

All updates execute in a single Prisma transaction. The response reports how many character fields and Pokemon were updated, plus a list of any conflicts with their resolution.

This field filtering is the only mechanism that limits what the [[player-view-character-export-import]] can write back. The [[server-has-no-auth-or-middleware|server has no auth]] — the safety boundary is in the schema validation, not in access control.

## See also

- [[player-view-is-consumption-only-outside-encounters]] — this endpoint is the only write path available outside encounters