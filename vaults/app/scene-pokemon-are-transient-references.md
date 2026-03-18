# Scene Pokemon Are Transient References

Pokemon in a scene are lightweight JSON records stored inline — they carry only species, level, nickname, position, and groupId. They are not database-backed Pokemon records. This means scene pokemon have no moves, stats, abilities, or other detail until they are converted into full records.

When a scene character's pokemon are added, they reference an existing database Pokemon via ID. When wild pokemon are added manually (via the [[scene-add-panel]] or the [[scene-habitat-panel]]), they exist only as transient entries in the scene's JSON.

This transient state is resolved when an encounter is created from the scene — see [[scene-to-encounter-generates-db-pokemon]].
