The Moves tab on the [[gm-pokemon-detail-page]] is intended to display the Pokemon's known moves. When a Pokemon has no moves, it shows the text "No moves recorded".

The component (`PokemonMovesTab.vue`) renders each move as a card with a violet left border. Each [[gm-moves-tab-move-card]] shows the move name, type badge, class, frequency, AC, damage formula, range, and effect text. Below the details, each card has [[gm-moves-tab-roll-buttons]] for attack, damage, and critical damage.

The tab currently shows "No moves recorded" for all Pokemon, including those that have moves in the database — see [[gm-moves-tab-renders-empty-despite-api-data]].

Moves can be learned via the [[pokemon-level-up-panel]] during level-up (which shows the [[move-learning-panel]]), through the [[evolution-confirm-modal]] during evolution, or by the [[pokemon-generator-service]] during auto-creation. A Pokemon can hold at most 6 moves — see [[move-maximum-six-slots]].
