# Scene-to-Encounter Generates DB Pokemon

When the GM uses the [[scene-start-encounter-modal]] to create an encounter from a scene, the system converts the scene's transient wild pokemon references into full database-backed Pokemon records using the [[pokemon-generator-service]]. Characters in the scene become player combatants.

The API route `POST /api/encounters/from-scene` handles this conversion. Scene weather is explicitly not copied to encounter weather (see [[scene-weather-is-narrative]]).

## See also

- [[scene-pokemon-are-transient-references]] — why this conversion is needed
