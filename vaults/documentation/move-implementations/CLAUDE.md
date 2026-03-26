# Move Implementation Specs

~371 notes specifying how each PTR game move should be implemented in the app. Each file documents how a move's data fields connect to the app's systems: damage pipeline, energy costs, accuracy, status effects, and trait interactions.

## What you can't know without exploring here

- How a specific move's PTR stat block translates to app data fields and UI behavior
- Implementation-specific decisions about move edge cases (variable damage bases, conditional effects)
- Moves that need special handling beyond what the stat block implies

## Current state (as of 2026-03-25)

**Updated to PTR.** All 370 move files have been updated:
- Energy costs replace PTU frequencies
- "Trait Interactions" replaces "Ability Interactions"
- Secondary effects verified against PTR move data
- PTU-only moves (441 files) deleted

## Routing

- Looking up a **move's game stats**? Check `../../ptr/ptr_moves/`.
- Looking up a **move's flavor text**? Check `../../ptr/move_descriptions/`.
- Looking up **how a move actually behaves in the app right now**? Check `../../app/moves-in-combat/`.
- Looking up **how a move should be implemented**? You're in the right place.
