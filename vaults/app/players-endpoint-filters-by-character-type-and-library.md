The `GET /api/characters/players` endpoint queries HumanCharacter records matching `characterType: 'player'` AND `isInLibrary: true`, ordered by name. This means archived characters (where `isInLibrary` is false) do not appear in the [[player-view-character-selection|player identity picker]].

The response includes each character's id, name, `playedBy`, level, HP, avatar URL, trainer classes, and a summary of their Pokemon team (species, nickname, level, types, HP, sprite). The Pokemon data allows the picker UI to show team previews alongside character names.

The `characterType` field on HumanCharacter is a string with values `'player'`, `'npc'`, or `'trainer'` (default `'npc'` in the schema). This is the only query that scopes results specifically to player characters.

## See also

- [[character-type-dropdown]] — the creation-time UI that sets this field
- [[played-by-field-is-informational-only]] — included in the response but has no functional role