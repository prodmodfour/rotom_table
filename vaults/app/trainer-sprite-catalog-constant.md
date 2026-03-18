The file `app/constants/trainerSprites.ts` defines `TRAINER_SPRITE_CATALOG`, an array of approximately 180 trainer sprite entries sourced from the Pokemon Showdown CDN. Each entry has a `key` (the Showdown filename without `.png`), a human-readable `label`, and a `category` string.

Nine categories are defined in `TRAINER_SPRITE_CATEGORIES`: Protagonists (24 entries, Red/Leaf through Florian/Juliana covering Gen 1-9), Gym Leaders (52, Kanto through Kalos), Elite Four & Champions (25), Villains & Admins (23), Team Grunts (14, male/female pairs for 7 evil teams), Generic Male (26), Generic Female (21), Specialists (17), Other (19).

This file contains no game rule data — it is a pure UI asset catalog. The sprite URL is constructed at runtime by appending `{key}.png` to the Showdown CDN base path.

The [[trainer-sprite-modal]] uses `TRAINER_SPRITE_CATEGORIES` for its filter buttons and `TRAINER_SPRITE_CATALOG` for the sprite grid. The [[trainer-sprite-chooser]] triggers that modal during character creation.
