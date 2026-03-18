# Character Card

`components/character/HumanCard.vue` — compact card for browsing the [[library-store|character library]].

## Display

Shows character name, type badge (player / npc / trainer), level, HP bar, avatar (resolved via [[trainer-sprites|useTrainerSprite]] or letter-initial fallback), location, and linked Pokemon count.

## Interaction

Clicking the card opens the [[character-sheet-modal]] for full view/edit.

## See also

- [[library-store]]
- [[trainer-sprites]]
- [[character-sheet-modal]]
