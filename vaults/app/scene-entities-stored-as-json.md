# Scene Entities Stored as JSON

The scene's pokemon, characters, groups, terrains, and modifiers are stored as JSON-serialized strings in SQLite (which has no native JSON column type). Each API route parses these strings on read and serializes them on write.

This avoids relational complexity for scene-internal entities but means there is no foreign key integrity for scene members. A scene character references a `characterId` (linking to a real HumanCharacter row), but the scene-level data (position, groupId) lives only in the JSON blob.
