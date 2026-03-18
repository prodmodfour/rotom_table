# Sample Backgrounds

Constants in `constants/trainerBackgrounds.ts` — 11 PTU sample backgrounds from Core p. 14.

## Structure

Each background defines: one `adeptSkill`, one `noviceSkill`, and three `patheticSkills`. These override the default all-Untrained skill set from [[trainer-skill-definitions|getDefaultSkills]].

## Backgrounds

Fitness Training, Book Worm, Hermit, Old Timer, Quick and Small, Rough, Silver Tongued, Street Rattata, Super Nerd, Wild Child, At Least He's Pretty.

## Usage

The [[character-creation-composable]] applies a selected background via `applyBackground()`, which sets the five specified skill ranks while leaving the remaining 12 skills at Untrained. `clearBackground()` reverts to defaults. `enableCustomBackground()` allows free-form skill editing without a preset.

## See also

- [[character-creation-composable]]
- [[trainer-skill-definitions]]
