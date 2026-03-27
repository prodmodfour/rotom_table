# Pokemon Origin Enum

`Pokemon.origin` is stored as a plain `String` in the Prisma schema, not a Prisma enum. Five values:

| Value | Meaning |
|---|---|
| `manual` | Created by hand in the GM sheet editor |
| `wild` | Generated from encounter table wild spawn |
| `template` | Loaded from an EncounterTemplate |
| `import` | Imported via CSV upload |
| `captured` | Captured during encounter (auto-linked to trainer) |

The pokemon generator entry point is the canonical way to create Pokemon records with an appropriate origin.
