# Encounter Template Combatants Stored as JSON Text

The `combatants` and `tags` fields on the [[encounter-template-prisma-model]] are TEXT columns that store JSON-serialized arrays (a SQLite limitation — no native JSON column type).

Every [[encounter-template-api-endpoints|API endpoint]] that reads templates parses these JSON strings into objects before returning them. Every endpoint that writes templates stringifies arrays back to JSON strings before saving. This parse/stringify happens inline in each endpoint handler rather than in a shared utility.
