The [[pokemon-creation-tab]] creates Pokemon with manually entered base stats (defaulting to 50 each), no nature selection, no ability assignment, and no moves. The GM enters species, nickname, level, gender, shiny status, types, and base stats directly.

This contrasts with the [[pokemon-generator-service]], which auto-generates everything from the [[species-data-model-fields]]: random nature from the [[nature-table-constant]], weighted stat distribution, learnset moves, random ability, and tutor points. The generator is used for wild encounters, scenes, and CSV imports — not the manual create page.

Manual creation calls `POST /api/pokemon` through the [[pokemon-library-store]].
