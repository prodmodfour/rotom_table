# Trainer Sprites

Trainer avatar sprite system using Pokemon Black 2 / White 2 trainer sprites from the [[showdown-sprite-name-mappings|Showdown CDN]].

## Constants

`constants/trainerSprites.ts` — 180 curated B2W2 sprites organized into 9 categories.

## Composable

`composables/useTrainerSprite.ts` — Avatar URL resolution from sprite key to Showdown CDN URL. Part of the [[composable-domain-grouping|Trainer Display domain]].

## Component

`components/character/TrainerSpritePicker.vue` — Modal grid picker with category filter tabs and search.

## See also

- [[showdown-sprite-name-mappings]]
- [[character-creation-page]]
- [[character-card]]
