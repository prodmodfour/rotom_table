# isInLibrary Archive Flag

`Pokemon.isInLibrary` has counterintuitive semantics: `false` means archived (hidden from character sheets), **not** "not in library." The default is `true`.

This flag lives on the [[prisma-schema-overview|Pokemon model]] and controls visibility in the [[pinia-store-classification|library store]] filtering.
