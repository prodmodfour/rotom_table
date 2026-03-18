The [[gm-pokemon-detail-page]] has a view/edit toggle. Clicking "Edit" adds `?edit=true` to the URL and replaces the Evolve/Edit buttons with "Cancel" and "Save Changes" buttons.

In edit mode, the identity fields (species, nickname, level, EXP, gender, shiny, location) become editable. The stat values and other tab contents also become editable.

When the level is increased in edit mode, a [[pokemon-level-up-panel]] appears showing stat allocation options, new moves available at the target level, and ability milestones.

Cancel returns to view mode and discards changes. Save Changes delegates to the library store's `updatePokemon()` action, which calls `PUT /api/pokemon/:id`.
