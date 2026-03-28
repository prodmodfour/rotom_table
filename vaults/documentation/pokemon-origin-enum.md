# Pokemon Origin Enum

The Pokemon entity tracks its origin as one of five values:

| Value | Meaning |
|---|---|
| `manual` | Created by hand in the GM sheet editor |
| `wild` | Generated from encounter table wild spawn |
| `template` | Loaded from an EncounterTemplate |
| `import` | Imported via CSV upload |
| `captured` | Captured during encounter (auto-linked to trainer) |

Origin determines [[disposition-determines-starting-loyalty|starting loyalty]] and informs [[pokemon-loyalty]] defaults.
